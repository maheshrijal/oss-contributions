// Serves /check (a form) and /check/<username> (that user's merged PRs).
// Everything else is static files from dist/, which Cloudflare serves before this runs.
import { contributionsPage, checkPage } from "./render.js";

const CACHE_SECONDS = 3600;
// GitHub search stops at 1,000 results. Pages of 50, because pages of 100 for
// busy accounts often take longer than GitHub's 10-second timeout.
const PAGE_SIZE = 50;
const MAX_PAGES = 20;
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

async function github(token, variables, retry = true) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "user-agent": "oss.mrjl.dev", "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  // GitHub sometimes times out on search; one retry usually gets through.
  if (res.status >= 500 && retry) return github(token, variables, false);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data) throw new Error(`GitHub ${res.status}: ${JSON.stringify(body?.errors ?? body)}`);
  return body.data;
}

// Same search as scripts/fetch.mjs, plus is:merged. Returns null if there's no such user.
async function load(token, login) {
  const q = `author:${login} type:pr is:public is:merged -user:${login}`;
  let user, total;
  const prs = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await github(token, { login, q, after });
    if (!data.user) return null;
    user ??= data.user;
    total = data.search.issueCount;
    prs.push(...data.search.nodes.filter((pr) => pr.repository && !pr.repository.isPrivate));
    if (!data.search.pageInfo.hasNextPage) break;
    after = data.search.pageInfo.endCursor;
  }
  return {
    fetchedAt: new Date().toISOString(),
    profile: { login: user.login, name: user.name, bio: user.bio, avatar_url: user.avatarUrl, html_url: user.url },
    prs,
    capped: total > prs.length,
  };
}

const invalid = (name) => `“${name}” isn’t a valid GitHub username. Use letters, numbers and single hyphens.`;

const html = (body, status = 200, cache = "no-store") =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": cache, "x-robots-tag": "noindex" },
  });

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

    const match = path.match(/^\/check\/([^/]+)$/);
    if (!match) return new Response("Not found", { status: 404 });
    const login = decodeURIComponent(match[1]);
    if (!USERNAME.test(login)) return html(checkPage({ user: login, error: invalid(login) }), 400);

    // One cache entry per user, whatever the case or ?sort= in the URL.
    const key = new Request(`${url.origin}/check/${login.toLowerCase()}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return hit;

    let data;
    try {
      data = await load(env.GITHUB_TOKEN, login);
    } catch (err) {
      console.error(err);
      return html(checkPage({ user: login, error: "Couldn’t reach GitHub. Try again in a minute." }), 502);
    }
    if (!data) return html(checkPage({ user: login, error: `No GitHub user named “${login}”. Check the spelling; organizations aren’t supported.` }), 404);

    const page = contributionsPage(data, { chart: false }, { check: true, capped: data.capped });
    const res = html(page.html, 200, `public, max-age=${CACHE_SECONDS}`);
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  },
};
