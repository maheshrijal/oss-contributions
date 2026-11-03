// Reads config.json + data/prs.json and writes dist/index.html.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const config = JSON.parse(readFileSync("config.json", "utf8"));
const { fetchedAt, profile, prs: allPrs } = JSON.parse(readFileSync("data/prs.json", "utf8"));

// ---------- filter + rank ----------

// ALL=1 shows every merged PR: ignores minStars and excludePRs (repo excludes still apply).
const showAll = process.env.ALL === "1";
const minStars = showAll ? 0 : (config.minStars ?? 0);
const priority = (config.priority ?? []).map((s) => s.toLowerCase());
const exclude = (config.exclude ?? []).map((s) => s.toLowerCase());
const excludePRs = new Set(showAll ? [] : (config.excludePRs ?? []).map((s) => s.toLowerCase()));

const isExcluded = (name) =>
  exclude.some((p) =>
    p.endsWith("/*") ? name.startsWith(p.slice(0, -1)) : name === p,
  );

const prs = allPrs.filter((pr) => {
  const name = pr.repository.nameWithOwner.toLowerCase();
  return (
    pr.state === "MERGED" &&
    pr.repository.stargazerCount >= minStars &&
    !isExcluded(name) &&
    !excludePRs.has(pr.url.toLowerCase())
  );
});

const repoMap = new Map();
for (const pr of prs) {
  const key = pr.repository.nameWithOwner;
  if (!repoMap.has(key)) repoMap.set(key, { ...pr.repository, prs: [] });
  repoMap.get(key).prs.push(pr);
}

const rankOf = (name) => {
  const i = priority.indexOf(name.toLowerCase());
  return i === -1 ? Infinity : i;
};
for (const r of repoMap.values()) {
  r.prs.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
}

const lines = (r) => r.prs.reduce((s, p) => s + p.additions + p.deletions, 0);
const sorters = {
  stars: (a, b) => b.stargazerCount - a.stargazerCount,
  recent: (a, b) => b.prs[0].mergedAt.localeCompare(a.prs[0].mergedAt),
  prs: (a, b) => b.prs.length - a.prs.length,
  lines: (a, b) => lines(b) - lines(a),
  name: (a, b) => a.nameWithOwner.localeCompare(b.nameWithOwner),
};
const sortBy = config.sort ?? "stars";
if (!sorters[sortBy]) {
  throw new Error(`config.sort must be one of: ${Object.keys(sorters).join(", ")}`);
}

// Priority list first (in order), then config.sort, then stars to break ties.
const repos = [...repoMap.values()].sort(
  (a, b) =>
    rankOf(a.nameWithOwner) - rankOf(b.nameWithOwner) ||
    sorters[sortBy](a, b) ||
    sorters.stars(a, b),
);

// ---------- numbers ----------

const totalStars = repos.reduce((s, r) => s + r.stargazerCount, 0);
const linesChanged = prs.reduce((s, p) => s + p.additions + p.deletions, 0);

// ---------- helpers ----------

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const compact = (n) =>
  n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (iso) => {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const icons = {
  merged: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"/></svg>`,
  star: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>`,
  sun: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z"/></svg>`,
  moon: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"/></svg>`,
  arrow: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.53 11.78a.75.75 0 0 1-1.06-1.06l6.22-6.22H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V5.31l-6.22 6.22Z"/></svg>`,
};
const sprite = `<svg width="0" height="0" style="position:absolute">${Object.entries(icons)
  .map(([k, v]) => v.replace(/^<svg viewBox="0 0 16 16" aria-hidden="true">/, `<symbol id="i-${k}" viewBox="0 0 16 16">`).replace(/<\/svg>$/, "</symbol>"))
  .join("")}</svg>`;
const icon = (k) => `<svg aria-hidden="true"><use href="#i-${k}"/></svg>`;

// ---------- page ----------

const prRow = (pr) => {
  return `
          <li class="pr">
            <span class="state" title="Merged">${icon("merged")}<span class="sr">Merged</span></span>
            <a class="pr-title" href="${esc(pr.url)}" target="_blank" rel="noopener">${esc(pr.title)}</a>
            <span class="pr-meta">
              <span class="mono">#${pr.number}</span>
              <span>${monthYear(pr.mergedAt)}</span>
              <span class="mono diff"><span class="add">+${compact(pr.additions)}</span> <span class="del">−${compact(pr.deletions)}</span></span>
            </span>
          </li>`;
};

const repoRow = (r, i) => {
  const [owner, name] = r.nameWithOwner.split("/");
  const lang = r.primaryLanguage
    ? `<span class="lang"><i style="background:${esc(r.primaryLanguage.color ?? "#888")}"></i>${esc(r.primaryLanguage.name)}</span>`
    : "";
  return `
      <li class="repo" data-featured="${i}" data-stars="${r.stargazerCount}" data-recent="${r.prs[0].mergedAt}" data-prs="${r.prs.length}">
        <span class="rank mono">${String(i + 1).padStart(2, "0")}</span>
        <img class="owner" src="${esc(r.owner.avatarUrl)}&s=80" alt="" width="36" height="36" loading="lazy">
        <div class="repo-body">
          <div class="repo-head">
            <a class="repo-name" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="muted">${esc(owner)} / </span>${esc(name)}</a>
            <span class="repo-meta">${lang}<span class="stars">${icon("star")}${compact(r.stargazerCount)}</span></span>
          </div>
          ${r.description ? `<p class="desc">${esc(r.description)}</p>` : ""}
          <ul class="prs">${r.prs.map(prRow).join("")}
          </ul>
        </div>
      </li>`;
};

const name = profile.name ?? profile.login;
const siteUrl = config.site?.url?.replace(/\/?$/, "/");
// While the site is private, tell search engines to stay away.
const noindex = config.site?.noindex === true;
const title = config.site?.title ?? `${name} — Open-source contributions`;

// Description: name the top repos, staying under ~160 characters.
let description = `${prs.length} merged pull requests by ${name} to open-source projects`;
const top = [];
for (const r of repos) {
  const next = [...top, r.nameWithOwner];
  if (`${description} including ${next.join(", ")} and more.`.length > 160) break;
  top.push(r.nameWithOwner);
}
description += top.length ? ` including ${top.join(", ")} and more.` : ".";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: title,
  description,
  ...(siteUrl && { url: siteUrl }),
  dateModified: fetchedAt,
  mainEntity: {
    "@type": "Person",
    name,
    image: profile.avatar_url,
    ...(profile.bio && { description: profile.bio }),
    sameAs: [...new Set([profile.html_url, ...Object.values(config.site?.links ?? {})])],
  },
};

const links = Object.entries(config.site?.links ?? { GitHub: profile.html_url })
  .map(([label, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}${icon("arrow")}</a>`)
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(name)}">
${noindex ? `<meta name="robots" content="noindex, nofollow">\n` : ""}
${siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}">\n` : ""}<link rel="icon" href="${esc(profile.avatar_url)}">
<link rel="apple-touch-icon" href="${esc(profile.avatar_url)}">
<meta name="theme-color" content="#f9f9f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0a" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${siteUrl ? `<meta property="og:url" content="${esc(siteUrl)}">\n` : ""}<meta property="og:image" content="${esc(profile.avatar_url)}">
<meta property="profile:username" content="${esc(profile.login)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(profile.avatar_url)}">
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
<script>try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch {}</script>
<style>
:root {
  color-scheme: light;
  --show-sun: none;
  --show-moon: block;
  --page: #f9f9f7;
  --surface: #ffffff;
  --ink: #0b0b0b;
  --ink-2: #52514e;
  --ink-3: #898781;
  --line: rgba(11, 11, 11, 0.08);
  --line-strong: #c3c2b7;
  --hover: rgba(11, 11, 11, 0.03);
  --merged: #0ca30c;
  --add: #006300;
  --del: #b42d2d;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --show-sun: block;
    --show-moon: none;
    --page: #0b0b0a;
    --surface: #131312;
    --ink: #f0efec;
    --ink-2: #c3c2b7;
    --ink-3: #898781;
    --line: rgba(255, 255, 255, 0.08);
    --line-strong: #383835;
    --hover: rgba(255, 255, 255, 0.03);
    --merged: #0ca30c;
    --add: #3fb950;
    --del: #f07171;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --show-sun: block;
  --show-moon: none;
  --page: #0b0b0a;
  --surface: #131312;
  --ink: #f0efec;
  --ink-2: #c3c2b7;
  --ink-3: #898781;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: #383835;
  --hover: rgba(255, 255, 255, 0.03);
  --merged: #0ca30c;
  --add: #3fb950;
  --del: #f07171;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
.mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.86em; }
.muted { color: var(--ink-3); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
svg { fill: currentColor; }

.wrap { max-width: 880px; margin: 0 auto; padding: 56px 24px 80px; }

header { display: flex; align-items: center; gap: 14px; }
header img { width: 44px; height: 44px; border-radius: 50%; box-shadow: 0 0 0 1px var(--line); }
header .who { flex: 1; min-width: 0; }
header h1 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
header p { margin: 0; color: var(--ink-3); font-size: 14px; }
nav { display: flex; gap: 18px; font-size: 14px; color: var(--ink-2); }
nav a { display: inline-flex; align-items: center; gap: 2px; transition: color .15s; }
nav a:hover { color: var(--ink); }
nav svg { width: 14px; height: 14px; opacity: .6; }
.theme {
  display: grid; place-items: center; width: 32px; height: 32px; margin-left: 4px; padding: 0;
  border: 0; border-radius: 8px; background: none; color: var(--ink-3); cursor: pointer; transition: color .15s, background .15s;
}
.theme:hover { color: var(--ink); background: var(--hover); }
.theme svg { width: 16px; height: 16px; }
.theme .sun { display: var(--show-sun); }
.theme .moon { display: var(--show-moon); }

.hero { margin: 72px 0 40px; }
.hero .num { font-size: clamp(64px, 12vw, 104px); line-height: .9; font-weight: 650; letter-spacing: -0.045em; }
.hero h2 { margin: 14px 0 0; font-size: clamp(22px, 3.4vw, 30px); font-weight: 500; letter-spacing: -0.025em; line-height: 1.25; color: var(--ink-2); max-width: 22ch; }
.hero h2 b { color: var(--ink); font-weight: 600; }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.stat { padding: 18px 0 18px 20px; border-left: 1px solid var(--line); }
.stat:first-child { border-left: 0; padding-left: 0; }
.stat .v { font-size: 26px; font-weight: 600; letter-spacing: -0.03em; }
.stat .k { font-size: 13px; color: var(--ink-3); }

section { margin-top: 64px; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.section-head h3 { margin: 0; font-size: 13px; font-weight: 500; color: var(--ink-3); letter-spacing: .06em; text-transform: uppercase; }


.sort { display: inline-flex; padding: 3px; gap: 2px; border-radius: 9px; background: var(--hover); box-shadow: inset 0 0 0 1px var(--line); }
.sort button {
  font: inherit; font-size: 13px; color: var(--ink-3); background: none; border: 0; cursor: pointer;
  padding: 4px 12px; border-radius: 6px; transition: color .15s, background .15s;
}
.sort button:hover { color: var(--ink); }
.sort button[aria-pressed="true"] { background: var(--surface); color: var(--ink); box-shadow: 0 0 0 1px var(--line), 0 1px 2px rgba(0,0,0,.06); }
.repos { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.repo { display: grid; grid-template-columns: 28px 36px 1fr; gap: 0 16px; padding: 22px 0; border-bottom: 1px solid var(--line); }
.rank { color: var(--ink-3); padding-top: 8px; font-variant-numeric: tabular-nums; }
.owner { border-radius: 8px; box-shadow: 0 0 0 1px var(--line); background: var(--surface); }
.repo-body { min-width: 0; }
.repo-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.repo-name { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
.repo-name:hover { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--line-strong); }
.repo-meta { display: inline-flex; gap: 14px; font-size: 13px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.lang, .stars { display: inline-flex; align-items: center; gap: 6px; }
.lang i { width: 8px; height: 8px; border-radius: 50%; }
.stars svg { width: 13px; height: 13px; }
.desc { margin: 2px 0 0; font-size: 14px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.prs { list-style: none; margin: 12px 0 0; padding: 0; }
.pr { display: grid; grid-template-columns: 16px 1fr auto; align-items: baseline; gap: 10px; padding: 7px 10px; margin: 0 -10px; border-radius: 8px; transition: background .15s; }
.pr:hover { background: var(--hover); }
.state { display: inline-flex; align-self: center; }
.state { color: var(--merged); }
.state svg { width: 16px; height: 16px; }
.pr-title { font-size: 14px; color: var(--ink-2); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color .15s; }
.pr:hover .pr-title { color: var(--ink); }
.pr-meta { display: inline-flex; gap: 14px; font-size: 12.5px; color: var(--ink-3); white-space: nowrap; font-variant-numeric: tabular-nums; }
.diff { min-width: 9ch; text-align: right; }
.add { color: var(--add); } .del { color: var(--del); }

footer { margin-top: 56px; font-size: 13px; color: var(--ink-3); }

@media (max-width: 640px) {
  .wrap { padding-top: 32px; }
  header nav { display: none; }
  .hero { margin-top: 48px; }
  .repo { grid-template-columns: 36px 1fr; }
  .rank { display: none; }
  .pr { grid-template-columns: 16px 1fr; }
  .pr-title { white-space: normal; }
  .pr-meta { grid-column: 2; }
  .diff { min-width: 0; }
}
</style>
</head>
<body>
${sprite}
<div class="wrap">
  <header>
    <img src="${esc(profile.avatar_url)}&s=96" alt="">
    <div class="who">
      <h1>${esc(name)}</h1>
      ${profile.bio ? `<p>${esc(profile.bio)}</p>` : ""}
    </div>
    <nav>${links}</nav>
    <button class="theme" type="button" aria-label="Toggle light and dark theme" title="Toggle theme">
      <svg class="sun" aria-hidden="true"><use href="#i-sun"/></svg>
      <svg class="moon" aria-hidden="true"><use href="#i-moon"/></svg>
    </button>
  </header>

  <div class="hero">
    <div class="num">${prs.length}</div>
    <h2>merged pull requests to <b>${repos.length} open-source projects</b> with ${compact(totalStars)} stars between them.</h2>
  </div>

  <div class="stats">
    <div class="stat"><div class="v">${prs.length}</div><div class="k">Merged</div></div>
    <div class="stat"><div class="v">${repos.length}</div><div class="k">Projects</div></div>
    <div class="stat"><div class="v">${compact(linesChanged)}</div><div class="k">Lines changed</div></div>
  </div>


  <section>
    <div class="section-head">
      <h3>Projects</h3>
      <div class="sort" role="group" aria-label="Sort projects">
        <button type="button" data-sort="featured" aria-pressed="true">Featured</button>
        <button type="button" data-sort="stars" aria-pressed="false">Stars</button>
        <button type="button" data-sort="recent" aria-pressed="false">Recent</button>
        <button type="button" data-sort="prs" aria-pressed="false">Most PRs</button>
      </div>
    </div>
    <ol class="repos">${repos.map(repoRow).join("")}
    </ol>
  </section>

  <footer>Updated <time datetime="${fetchedAt}">${new Date(fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time> · Data from GitHub</footer>
</div>
<script>
// Sort
const list = document.querySelector(".repos");
const sortButtons = document.querySelectorAll(".sort button");
const by = {
  featured: (a, b) => a.dataset.featured - b.dataset.featured,
  stars: (a, b) => b.dataset.stars - a.dataset.stars,
  recent: (a, b) => b.dataset.recent.localeCompare(a.dataset.recent),
  prs: (a, b) => b.dataset.prs - a.dataset.prs || by.stars(a, b),
};
sortButtons.forEach((btn) => btn.addEventListener("click", () => {
  sortButtons.forEach((b) => b.setAttribute("aria-pressed", b === btn));
  const rows = [...list.children].sort(by[btn.dataset.sort]);
  rows.forEach((row, i) => {
    row.querySelector(".rank").textContent = String(i + 1).padStart(2, "0");
    list.append(row);
  });
}));

// Theme
document.querySelector(".theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
});
</script>
</body>
</html>
`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
if (siteUrl) {
  writeFileSync(
    "dist/robots.txt",
    noindex ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
  );
  writeFileSync(
    "dist/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc><lastmod>${fetchedAt.slice(0, 10)}</lastmod></url>\n</urlset>\n`,
  );
}
console.log(`Built dist/index.html — ${repos.length} projects, ${prs.length} PRs`);
