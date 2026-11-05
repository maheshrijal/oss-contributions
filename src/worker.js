// Serves /check (a form), /check/<username> (that user's merged PRs) and
// /check/<username>/stream (live progress for a page waiting on those PRs).
// Everything else is static files from dist/, which Cloudflare serves before this runs.
import { contributionsPage, checkPage } from "./render.js";

const CACHE_SECONDS = 3600;
// GitHub search stops at 1,000 results. Pages of 50, because pages of 100 for
// busy accounts often take longer than GitHub's 10-second timeout.
const PAGE_SIZE = 50;
const MAX_PAGES = 20;
const SEARCH_LIMIT = 1000;
// GitHub's username rules: letters, digits and single hyphens, up to 39 characters.
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const query = `
query($login: String!, $q: String!, $after: String) {
  user(login: $login) { login name bio avatarUrl url }
  search(query: $q, type: ISSUE, first: ${PAGE_SIZE}, after: $after) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        title url number state createdAt mergedAt additions deletions
        repository {
          nameWithOwner url description stargazerCount isPrivate
          owner { login avatarUrl }
          primaryLanguage { name color }
        }
      }
    }
  }
}`;

class RateLimited extends Error {
  constructor(resetAt) {
    super("GitHub rate limit reached");
    this.resetAt = resetAt;
  }
}

// When the limit lifts: retry-after for short bursts, otherwise the hourly reset.
function resetTime(res) {
  const wait = Number(res.headers.get("retry-after"));
  if (wait) return Date.now() + wait * 1000;
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  return reset ? reset * 1000 : Date.now() + 60_000;
}

async function github(token, variables, retry = true) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "user-agent": "oss.mrjl.dev", "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  // GitHub sometimes times out on search; one retry usually gets through.
  if (res.status >= 500 && retry) return github(token, variables, false);
  const body = await res.json().catch(() => null);
  const limited =
    res.status === 429 ||
    (res.status === 403 && (res.headers.has("retry-after") || res.headers.get("x-ratelimit-remaining") === "0")) ||
    body?.errors?.some((e) => e.type === "RATE_LIMITED");
  if (limited) throw new RateLimited(resetTime(res));
  if (!res.ok || !body?.data) throw new Error(`GitHub ${res.status}: ${JSON.stringify(body?.errors ?? body)}`);
  return { data: body.data, remaining: res.headers.get("x-ratelimit-remaining") };
}

const mostStarred = (prs) =>
  prs.reduce((best, pr) => (!best || pr.repository.stargazerCount > best.repository.stargazerCount ? pr : best), null)
    ?.repository.nameWithOwner;

// Same search as scripts/fetch.mjs, plus is:merged. Returns null if there's no such user.
// onPage, if given, hears about each page as it arrives.
async function load(token, login, onPage) {
  const q = `author:${login} type:pr is:public is:merged -user:${login}`;
  let user, total, remaining;
  const prs = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await github(token, { login, q, after });
    const { data } = res;
    remaining = res.remaining;
    if (!data.user) return null;
    user ??= data.user;
    total = data.search.issueCount;
    const nodes = data.search.nodes.filter((pr) => pr.repository && !pr.repository.isPrivate);
    prs.push(...nodes);
    await onPage?.({
      name: user.name ?? user.login,
      avatar: user.avatarUrl,
      found: prs.length,
      total: Math.max(prs.length, Math.min(total, SEARCH_LIMIT)),
      repo: mostStarred(nodes),
    });
    if (!data.search.pageInfo.hasNextPage) break;
    after = data.search.pageInfo.endCursor;
  }
  // For Workers Logs only; visitors never see this.
  console.log({ github_rate_limit_remaining: Number(remaining) });
  return {
    fetchedAt: new Date().toISOString(),
    profile: { login: user.login, name: user.name, bio: user.bio, avatar_url: user.avatarUrl, html_url: user.url },
    prs,
    capped: total > prs.length,
  };
}

const invalid = (name) => `“${name}” isn’t a valid GitHub username. Use letters, numbers and single hyphens.`;
const notFound = (name) => `No GitHub user named “${name}”. Check the spelling; organizations aren’t supported.`;
const UNREACHABLE = "Couldn’t reach GitHub. Try again in a minute.";

const html = (body, status = 200, cache = "no-store") =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": cache, "x-robots-tag": "noindex" },
  });

const resultPage = (data) =>
  html(contributionsPage(data, { chart: false }, { check: true, capped: data.capped }).html, 200, `public, max-age=${CACHE_SECONDS}`);

// One JSON object per line: progress for each page of PRs, then done or error.
// The finished page goes in the cache, and the browser opens it from there.
function progressStream(env, ctx, login, key) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const send = (event) => writer.write(encoder.encode(JSON.stringify(event) + "\n"));

  ctx.waitUntil(
    (async () => {
      try {
        if (!(await caches.default.match(key))) {
          // A failed send means the visitor left, which ends the search too.
          const data = await load(env.GITHUB_TOKEN, login, (page) => send({ type: "progress", ...page }));
          if (!data) return await send({ type: "error", missing: true, message: notFound(login) });
          // If this fails, the page's ?wait=1 fallback fetches the result again.
          await caches.default.put(key, resultPage(data)).catch(console.error);
        }
        await send({ type: "done" });
      } catch (err) {
        const event = err instanceof RateLimited ? { type: "error", resetAt: err.resetAt } : { type: "error", message: UNREACHABLE };
        const delivered = await send(event).then(() => true, () => false);
        if (delivered) console.error(err);
      } finally {
        await writer.close().catch(() => {});
      }
    })(),
  );

  return new Response(readable, {
    headers: { "content-type": "application/x-ndjson", "cache-control": "no-store, no-transform", "x-robots-tag": "noindex" },
  });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");

    if (path === "/check") {
      const user = url.searchParams.get("user")?.trim().replace(/^@/, "");
      if (!user) return html(checkPage());
      if (!USERNAME.test(user)) return html(checkPage({ user, error: invalid(user) }), 400);
      return Response.redirect(`${url.origin}/check/${user}`, 303);
    }

    const match = path.match(/^\/check\/([^/]+)(\/stream)?$/);
    if (!match) return new Response("Not found", { status: 404 });
    const login = decodeURIComponent(match[1]);
    if (!USERNAME.test(login)) return html(checkPage({ user: login, error: invalid(login) }), 400);

    // One cache entry per user, whatever the case or ?sort= in the URL.
    const key = new Request(`${url.origin}/check/${login.toLowerCase()}`);
    if (match[2]) return progressStream(env, ctx, login, key);

    const hit = await caches.default.match(key);
    if (hit) return hit;

    // Show live progress right away. ?wait=1 waits for the whole result instead, for
    // browsers without JavaScript or the rare finished page that didn't reach the cache.
    if (!url.searchParams.has("wait")) return html(checkPage({ user: login, loading: true }));

    let data;
    try {
      data = await load(env.GITHUB_TOKEN, login);
    } catch (err) {
      console.error(err);
      if (err instanceof RateLimited) {
        const minutes = Math.max(1, Math.ceil((err.resetAt - Date.now()) / 60_000));
        const when = `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
        return html(checkPage({ user: login, error: `This site has reached GitHub’s hourly limit. Try again ${when}.` }), 429);
      }
      return html(checkPage({ user: login, error: UNREACHABLE }), 502);
    }
    if (!data) return html(checkPage({ user: login, error: notFound(login) }), 404);

    const res = resultPage(data);
    ctx.waitUntil(caches.default.put(key, res.clone()));
    return res;
  },
};
