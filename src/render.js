// Page rendering shared by scripts/build.mjs (your page) and src/worker.js (/check).
// Plain JS with no Node imports, so it runs in both places.

// ---------- helpers ----------

export const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const compact = (n) =>
  n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(n);

// These dates have fixed formats, so server-side formatting and date sorting
// avoid Intl and localeCompare, which load locale data.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// GitHub's timestamps are all the same UTC format, so plain comparison sorts them.
const newestFirst = (a, b) => (a < b ? 1 : a > b ? -1 : 0);
const monthYear = (date) => {
  const d = new Date(date);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const icons = {
  merged: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"/></svg>`,
  star: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>`,
  sun: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z"/></svg>`,
  moon: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"/></svg>`,
  github: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>`,
  arrow: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.53 11.78a.75.75 0 0 1-1.06-1.06l6.22-6.22H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V5.31l-6.22 6.22Z"/></svg>`,
};
const sprite = `<svg width="0" height="0" style="position:absolute">${Object.entries(icons)
  .map(([k, v]) => v.replace(/^<svg viewBox="0 0 16 16" aria-hidden="true">/, `<symbol id="i-${k}" viewBox="0 0 16 16">`).replace(/<\/svg>$/, "</symbol>"))
  .join("")}</svg>`;
const icon = (k) => `<svg aria-hidden="true"><use href="#i-${k}"/></svg>`;

// ---------- activity chart (merged PRs per month) ----------

function activityChart(prs, fetchedAt) {
  if (!prs.length) return "";
  const first = new Date(prs.reduce((m, p) => (p.mergedAt < m ? p.mergedAt : m), prs[0].mergedAt));
  const now = new Date(fetchedAt);
  const months = [];
  for (
    let y = first.getUTCFullYear(), m = first.getUTCMonth();
    y < now.getUTCFullYear() || (y === now.getUTCFullYear() && m <= now.getUTCMonth());
    m === 11 ? (y++, (m = 0)) : m++
  ) {
    months.push({ y, m, n: 0 });
  }
  // Show at least a year so a short history still reads as a timeline.
  while (months.length < 12) {
    const { y, m } = months[0];
    months.unshift({ y: m === 0 ? y - 1 : y, m: m === 0 ? 11 : m - 1, n: 0 });
  }
  const idx = new Map(months.map((d, i) => [`${d.y}-${d.m}`, i]));
  for (const p of prs) {
    const d = new Date(p.mergedAt);
    months[idx.get(`${d.getUTCFullYear()}-${d.getUTCMonth()}`)].n++;
  }

  const max = Math.max(...months.map((d) => d.n));
  const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 5);
  const top = Math.ceil(max / step) * step;

  let ticks = "";
  for (let v = 0; v <= top; v += step) {
    ticks += `<span class="${v === 0 ? "tick base" : "tick"}" style="--y:${v / top}"><i>${v}</i></span>`;
  }
  const bars = months
    .map((d) => {
      const text = `${monthYear(Date.UTC(d.y, d.m, 1))}: ${d.n} merged`;
      const bar = d.n ? `<span class="bar" style="--h:${d.n / top}"></span>` : "";
      return `<li data-tip="${text}">${bar}<span class="sr">${text}</span></li>`;
    })
    .join("");
  // Label each January with its year, plus the first month when it isn't close to a January.
  const labels = months
    .map((d, i) => {
      if (d.m === 0) return `<span style="--c:${i + 1}">${d.y}</span>`;
      if (i === 0 && d.m < 10) return `<span style="--c:1">${monthYear(Date.UTC(d.y, d.m, 1))}</span>`;
      return "";
    })
    .join("");

  return `
      <figure class="chart">
        <div class="plot">
          ${ticks}
          <ol class="bars" style="--cols:${months.length}">${bars}</ol>
        </div>
        <div class="x" style="--cols:${months.length}" aria-hidden="true">${labels}</div>
        <div class="tooltip" aria-hidden="true"></div>
      </figure>`;
}

// ---------- rows ----------

const prRow = (pr, hidden = false) => `
          <li class="pr"${hidden ? " hidden" : ""}>
            <span class="state" title="Merged">${icon("merged")}<span class="sr">Merged</span></span>
            <a class="pr-title" href="${esc(pr.url)}" target="_blank" rel="noopener">${esc(pr.title)}</a>
            <span class="pr-meta">
              <span>#${pr.number}</span>
              <span>${monthYear(pr.mergedAt)}</span>
              <span class="diff"><span class="add">+${compact(pr.additions)}</span> <span class="del">−${compact(pr.deletions)}</span></span>
            </span>
          </li>`;

// On /check, long lists show the newest PRs and reveal the rest in steps.
const PR_LIMIT = 10;
const plural = (n, word) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

const prList = (prs, foldLong) => {
  // Hiding a single PR behind a click saves nothing.
  const shown = foldLong && prs.length > PR_LIMIT + 1 ? PR_LIMIT : prs.length;
  const rows = prs.map((pr, n) => prRow(pr, n >= shown)).join("");
  const left = prs.length - shown;
  return `<ul class="prs">${rows}
          </ul>${left ? `
          <div class="pr-more" data-limit="${PR_LIMIT}">
            <button class="show-more" type="button">Show ${Math.min(left, PR_LIMIT)} more</button>
            <button class="show-less" type="button" hidden>Collapse</button>
            <span class="pr-count" aria-live="polite">${shown} of ${prs.length.toLocaleString("en-US")}</span>
          </div>` : ""}`;
};

const repoLinkLine = (r) => `<div class="fold-top">${r.description ? `<p class="desc">${esc(r.description)}</p>` : ""}<a class="repo-link" href="${esc(r.url)}" target="_blank" rel="noopener">View repo${icon("arrow")}</a></div>`;

// opts.foldLong: fold long PR lists. opts.closed: show a one-line row that opens to the PRs.
const repoRow = (r, i, { foldLong = false, closed = false } = {}) => {
  const [owner, name] = r.nameWithOwner.split("/");
  const lang = r.primaryLanguage
    ? `<span class="lang"><i style="background:${esc(r.primaryLanguage.color ?? "#888")}"></i>${esc(r.primaryLanguage.name)}</span>`
    : "";
  const stars = `<span class="stars">${icon("star")}<span class="sr">Stars: </span>${compact(r.stargazerCount)}</span>`;
  const desc = r.description ? `<p class="desc">${esc(r.description)}</p>` : "";
  const body = closed
    ? `<details class="repo-body">
          <summary class="repo-head">
            <span class="fold-name" translate="no"><span class="muted">${esc(owner)} / </span>${esc(name)}</span>
            <span class="repo-meta"><span>${plural(r.prs.length, "PR")}</span>${lang}${stars}</span>
          </summary>
          ${repoLinkLine(r)}
          ${prList(r.prs, foldLong)}
        </details>`
    : `<div class="repo-body">
          <div class="repo-head">
            <a class="repo-name" href="${esc(r.url)}" target="_blank" rel="noopener" translate="no"><span class="muted">${esc(owner)} / </span>${esc(name)}</a>
            <span class="repo-meta">${lang}${stars}</span>
          </div>
          ${desc}
          ${prList(r.prs, foldLong)}
        </div>`;
  return `
      <li class="repo${closed ? " fold" : ""}" data-featured="${i}" data-stars="${r.stargazerCount}" data-recent="${r.prs[0].mergedAt}" data-prs="${r.prs.length}">
        <span class="rank" aria-hidden="true">${i + 1}</span>
        <img class="owner" src="${esc(r.owner.avatarUrl)}&s=72" alt="" width="36" height="36" loading="lazy">
        ${body}
      </li>`;
};

// ---------- organization groups (/check, big accounts) ----------

// From this many repos on, a /check page becomes an index: every row starts closed.
const INDEX_MIN_REPOS = 10;

// Show this many repo chips before folding the rest behind a "more" chip.
const CHIP_LIMIT = 6;

const prCount = (x) => x.prCount ?? x.prs.length;
const mostPrsFirst = (a, b) => prCount(b) - prCount(a) || b.stargazerCount - a.stargazerCount;

// GitHub organizations with two or more repos become one group; everything else, including
// repos under a person's account, stays as its own row.
function groupByOrg(repos) {
  const orgs = new Map();
  for (const repo of repos) {
    const org = repo.owner.__typename === "Organization" ? repo.owner.login : repo.nameWithOwner;
    if (!orgs.has(org)) orgs.set(org, []);
    orgs.get(org).push(repo);
  }
  return [...orgs.values()]
    .map((list) =>
      list.length === 1
        ? list[0]
        : {
            name: list[0].owner.login,
            avatarUrl: list[0].owner.avatarUrl,
            repos: [...list].sort(mostPrsFirst),
            prCount: list.reduce((n, r) => n + r.prs.length, 0),
            stargazerCount: list.reduce((n, r) => n + r.stargazerCount, 0),
            recent: list.reduce((m, r) => (r.prs[0].mergedAt > m ? r.prs[0].mergedAt : m), ""),
          },
    )
    .sort(mostPrsFirst);
}

// One repo's PRs show at a time; the chips choose which. Without JavaScript the first still shows.
const orgRow = (g, i) => {
  const shown = g.repos.length > CHIP_LIMIT + 1 ? CHIP_LIMIT : g.repos.length;
  const panelId = (n) => `org-${i}-repo-${n}`;
  const chips = g.repos.map((r, n) => {
    const name = r.nameWithOwner.split("/")[1];
    return `<button class="chip" type="button" aria-pressed="${n === 0}" aria-controls="${panelId(n)}" aria-label="${esc(name)}, ${plural(r.prs.length, "PR")}"${n < shown ? "" : " hidden"}><span translate="no">${esc(name)}</span>${r.prs.length.toLocaleString("en-US")}</button>`;
  });
  const panels = g.repos.map((r, n) => `
          <div class="chip-panel" id="${panelId(n)}" data-name="${esc(r.nameWithOwner.split("/")[1])}"${n === 0 ? "" : " hidden"}>
            ${repoLinkLine(r)}
            ${prList(r.prs, true)}
          </div>`);
  return `
      <li class="repo fold org" data-featured="${i}" data-stars="${g.stargazerCount}" data-recent="${g.recent}" data-prs="${g.prCount}">
        <span class="rank" aria-hidden="true">${i + 1}</span>
        <img class="owner" src="${esc(g.avatarUrl)}&s=72" alt="" width="36" height="36" loading="lazy">
        <details class="repo-body">
          <summary class="repo-head">
            <span class="fold-name" translate="no">${esc(g.name)}</span>
            <span class="repo-meta"><span>${plural(g.prCount, "PR")} in ${g.repos.length} repos</span><span class="stars">${icon("star")}<span class="sr">Stars: </span>${compact(g.stargazerCount)}</span></span>
          </summary>
          <div class="chips" role="group" aria-label="Repos in ${esc(g.name)}">${chips.join("")}${shown < g.repos.length ? `<button class="chip chip-more" type="button">${g.repos.length - shown} more</button>` : ""}</div>${panels.join("")}
        </details>
      </li>`;
};

// ---------- styles + scripts ----------

// Dark theme colours, used by both the system-setting rule and the toggle.
const DARK = {
  "color-scheme": "dark",
  "--show-sun": "block",
  "--show-moon": "none",
  "--page": "#0b0b0a",
  "--surface": "#131312",
  "--ink": "#f0efec",
  "--ink-2": "#c3c2b7",
  "--ink-3": "#898781",
  "--line": "rgba(255, 255, 255, 0.08)",
  "--line-strong": "#383835",
  "--grid": "#2c2c2a",
  "--hover": "rgba(255, 255, 255, 0.03)",
  "--series": "#3987e5",
  "--merged": "#0ca30c",
  "--add": "#3fb950",
  "--del": "#f07171",
};
const darkVars = (selector, close) =>
  `${selector} {\n${Object.entries(DARK).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}${close ? `\n${close}` : ""}`;

const CSS = `:root {
  color-scheme: light;
  --show-sun: none;
  --show-moon: block;
  --page: #f9f9f7;
  --surface: #ffffff;
  --ink: #0b0b0b;
  --ink-2: #52514e;
  --ink-3: #6f6e69;
  --line: rgba(11, 11, 11, 0.08);
  --line-strong: #c3c2b7;
  --grid: #e1e0d9;
  --hover: rgba(11, 11, 11, 0.03);
  --series: #2a78d6;
  --merged: #0ca30c;
  --add: #006300;
  --del: #b42d2d;
}
${darkVars("@media (prefers-color-scheme: dark) {\n  :root:not([data-theme=\"light\"])", "}")}
${darkVars(":root[data-theme=\"dark\"]", "")}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
a, button { touch-action: manipulation; }
a:focus-visible, button:focus-visible { outline: 2px solid var(--series); outline-offset: 2px; border-radius: 4px; }
.muted { color: var(--ink-3); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
svg { fill: currentColor; }

.skip { position: absolute; left: 16px; top: -48px; padding: 8px 12px; border-radius: 8px; background: var(--ink); color: var(--page); font-size: 14px; }
.skip:focus { top: 16px; }

.wrap { max-width: 880px; margin: 0 auto; padding: 56px 24px 80px; }

.top { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto auto; align-items: center; column-gap: 14px; }
.top img { border-radius: 50%; box-shadow: 0 0 0 1px var(--line); }
.top h1 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
.top p { margin: 0; color: var(--ink-3); font-size: 14px; }
nav { display: flex; gap: 18px; font-size: 14px; color: var(--ink-2); }
nav a { display: inline-flex; align-items: center; gap: 2px; padding: 4px 0; transition: color .15s; }
nav a:hover { color: var(--ink); }
nav svg { width: 14px; height: 14px; opacity: .6; }
.theme {
  display: grid; place-items: center; width: 36px; height: 36px; padding: 0;
  border: 0; border-radius: 8px; background: none; color: var(--ink-3); cursor: pointer; transition: color .15s, background-color .15s;
}
.theme:hover { color: var(--ink); background: var(--hover); }
.theme svg { width: 16px; height: 16px; }
.theme .sun { display: var(--show-sun); }
.theme .moon { display: var(--show-moon); }

.hero { margin: 72px 0 0; font-variant-numeric: normal; }
.hero .num { margin: 0; font-size: clamp(64px, 12vw, 104px); line-height: .9; font-weight: 650; letter-spacing: -0.045em; }
.hero .lede { margin: 14px 0 0; font-size: clamp(22px, 3.4vw, 30px); font-weight: 500; letter-spacing: -0.025em; line-height: 1.25; color: var(--ink-2); max-width: 24ch; text-wrap: balance; }
.hero .lede b { color: var(--ink); font-weight: 600; }

section { margin-top: 64px; }
h2 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.section-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px 16px; margin-bottom: 18px; }

.chart { position: relative; margin: 18px 0 0; }
.plot { position: relative; height: 160px; margin-left: 28px; }
.tick { position: absolute; left: 0; right: 0; bottom: calc(var(--y) * 100%); border-top: 1px solid var(--grid); }
.tick.base { border-top-color: var(--line-strong); }
.tick i { position: absolute; right: calc(100% + 8px); top: -8px; font-style: normal; font-size: 11px; line-height: 16px; color: var(--ink-3); }
.bars { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(var(--cols), 1fr); list-style: none; margin: 0; padding: 0; }
.bars li { position: relative; display: flex; align-items: flex-end; justify-content: center; }
.bar { width: min(24px, 70%); height: calc(var(--h) * 100%); border-radius: 4px 4px 0 0; background: var(--series); transition: opacity .15s; }
.bars:hover .bar { opacity: .45; }
.bars li:hover .bar { opacity: 1; }
.x { display: grid; grid-template-columns: repeat(var(--cols), 1fr); margin: 8px 0 0 28px; font-size: 11px; color: var(--ink-3); }
.x span { grid-column: var(--c); grid-row: 1; justify-self: center; white-space: nowrap; }
.x span:first-child { justify-self: start; }
.tooltip {
  position: absolute; left: 0; top: 0; pointer-events: none; opacity: 0; transform: translate(-50%, calc(-100% - 8px));
  padding: 5px 9px; border-radius: 6px; background: var(--ink); color: var(--page); font-size: 12px; font-weight: 500; white-space: nowrap; transition: opacity .12s;
}
.tooltip.show { opacity: 1; }

.sorter { display: flex; align-items: center; gap: 10px; }
.sort-label { font-size: 13px; color: var(--ink-3); }
.sort { display: inline-flex; padding: 3px; gap: 2px; border-radius: 9px; background: var(--hover); box-shadow: inset 0 0 0 1px var(--line); }
.sort button {
  font: inherit; font-size: 13px; color: var(--ink-3); background: none; border: 0; cursor: pointer; white-space: nowrap;
  padding: 5px 12px; border-radius: 6px; transition: color .15s, background-color .15s;
}
.sort button:hover { color: var(--ink); }
.sort button[aria-pressed="true"] { background: var(--surface); color: var(--ink); font-weight: 500; box-shadow: 0 0 0 1px var(--line), 0 1px 2px rgba(0,0,0,.06); }

.repos { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.repo { display: grid; grid-template-columns: 24px 36px minmax(0, 1fr); gap: 0 16px; padding: 22px 0; border-bottom: 1px solid var(--line); }
.rank { color: var(--ink-3); font-size: 13px; padding-top: 9px; }
.owner { border-radius: 8px; box-shadow: 0 0 0 1px var(--line); background: var(--surface); }
.repo-body { min-width: 0; }
.repo-head { display: flex; align-items: baseline; justify-content: space-between; gap: 4px 12px; flex-wrap: wrap; }
.repo-name { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; overflow-wrap: anywhere; }
.repo-name:hover { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--line-strong); }
.repo-meta { display: inline-flex; gap: 14px; font-size: 13px; color: var(--ink-3); }
.lang, .stars { display: inline-flex; align-items: center; gap: 6px; }
.lang i { width: 8px; height: 8px; border-radius: 50%; }
.stars svg { width: 13px; height: 13px; }
.desc { margin: 2px 0 0; font-size: 14px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.prs { list-style: none; margin: 12px 0 0; padding: 0; }
.pr { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: baseline; gap: 10px; padding: 7px 10px; margin: 0 -10px; border-radius: 8px; transition: background-color .15s; }
.pr:hover { background: var(--hover); }
.state { display: inline-flex; align-self: center; color: var(--merged); }
.state svg { width: 16px; height: 16px; }
.pr-title { font-size: 14px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color .15s; }
.pr:hover .pr-title { color: var(--ink); }
.pr-meta { display: inline-flex; gap: 14px; font-size: 12.5px; color: var(--ink-3); white-space: nowrap; }
.diff { min-width: 9ch; text-align: right; }
.add { color: var(--add); } .del { color: var(--del); }

footer {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px;
  margin-top: 40px; font-size: 13px; color: var(--ink-3);
}
footer p { margin: 0; }
footer time { color: var(--ink-2); }
.source { display: inline-flex; align-items: center; gap: 6px; transition: color .15s; }
.source:hover { color: var(--ink); }
.source svg { width: 14px; height: 14px; }

@media (max-width: 640px) {
  .wrap { padding-top: 28px; }
  .top { grid-template-columns: 44px minmax(0, 1fr) auto; row-gap: 10px; }
  nav { grid-column: 2 / -1; grid-row: 2; gap: 20px; }
  .theme { grid-column: 3; grid-row: 1; margin-right: -8px; }
  .hero { margin-top: 48px; }
  .plot { height: 140px; }
  .sorter { width: 100%; }
  .sort { flex: 1; display: grid; grid-template-columns: repeat(var(--n, 4), 1fr); }
  .sort button { padding: 6px 4px; }
  .repo { grid-template-columns: 36px minmax(0, 1fr); }
  .rank { display: none; }
  .pr { grid-template-columns: 16px minmax(0, 1fr); }
  .pr-title { white-space: normal; }
  .pr-meta { grid-column: 2; }
  .diff { min-width: 0; }
}
@media (prefers-reduced-motion: reduce) {
  *, .tooltip { transition: none !important; }
}
%%EXTRA_CSS%%`;

const PAGE_SCRIPT = `// Sort, kept in the URL (?sort=stars) so a sorted view can be shared.
const list = document.querySelector(".repos");
const sortButtons = [...document.querySelectorAll(".sort button")];
const by = {
  featured: (a, b) => a.dataset.featured - b.dataset.featured,
  stars: (a, b) => b.dataset.stars - a.dataset.stars,
  recent: (a, b) => b.dataset.recent.localeCompare(a.dataset.recent),
  prs: (a, b) => b.dataset.prs - a.dataset.prs || by.stars(a, b),
};
function sortBy(key) {
  sortButtons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.sort === key));
  [...list.children].sort(by[key]).forEach((row, i) => {
    row.querySelector(".rank").textContent = i + 1;
    list.append(row);
  });
}
sortButtons.forEach((btn) => btn.addEventListener("click", () => {
  const key = btn.dataset.sort;
  sortBy(key);
  const url = new URL(location.href);
  if (key === sortButtons[0].dataset.sort) url.searchParams.delete("sort"); else url.searchParams.set("sort", key);
  history.replaceState(null, "", url);
}));
const initial = new URLSearchParams(location.search).get("sort");
if (by[initial]) sortBy(initial);

// Chart tooltip
const chart = document.querySelector(".chart");
if (chart) {
  const tip = chart.querySelector(".tooltip");
  const bars = chart.querySelector(".bars");
  const show = (li) => {
    const box = chart.getBoundingClientRect();
    const r = li.getBoundingClientRect();
    const bar = li.querySelector(".bar");
    const top = bar ? bar.getBoundingClientRect().top : r.bottom;
    tip.textContent = li.dataset.tip;
    // Keep the tooltip inside the chart near either edge.
    const half = tip.offsetWidth / 2;
    const x = r.left - box.left + r.width / 2;
    tip.style.left = Math.min(Math.max(x, half), box.width - half) + "px";
    tip.style.top = top - box.top + "px";
    tip.classList.add("show");
  };
  bars.querySelectorAll("li").forEach((li) => {
    li.addEventListener("pointerenter", () => show(li));
    li.addEventListener("pointerdown", () => show(li));
  });
  bars.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") tip.classList.remove("show"); });
  document.addEventListener("pointerdown", (e) => { if (!bars.contains(e.target)) tip.classList.remove("show"); });
}

// Last update, shown in the visitor's own time zone.
const time = document.querySelector("footer time");
if (time) {
const opts = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
const updated = new Date(time.dateTime);
time.textContent = new Intl.DateTimeFormat(undefined, opts).format(updated);
// Hovering shows the time zone.
time.title = new Intl.DateTimeFormat(undefined, { ...opts, timeZoneName: "long" }).format(updated);
}

`;

const THEME_SCRIPT = `// Theme toggle; keeps the browser bar colour in step.
const root = document.documentElement;
const syncThemeColor = () => {
  const bg = getComputedStyle(document.body).backgroundColor;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
};
if (root.dataset.theme) syncThemeColor();
document.querySelector(".theme").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  syncThemeColor();
});
`;

const FORM_CSS = `
/* An index page: one-line rows that open in place. */
.repos > .fold { grid-template-columns: 36px minmax(0, 1fr); padding: 16px 0; }
.repos > .fold > .rank { display: none; }
/* An open row becomes a panel, so it's clear where it ends and the next one starts. */
.repos > .fold:has(> details[open]) { margin: 8px -16px; padding: 16px; border-bottom-color: transparent; border-radius: 12px; background: var(--surface); box-shadow: 0 0 0 1px var(--line); }
.repos > .fold:has(+ .fold > details[open]) { border-bottom-color: transparent; }
.fold > details > summary { cursor: pointer; list-style: none; }
.fold > details > summary::-webkit-details-marker { display: none; }
.fold summary:focus-visible { outline: 2px solid var(--series); outline-offset: 2px; border-radius: 4px; }
.fold > details > summary { display: grid; grid-template-columns: minmax(0, 1fr) auto 12px; align-items: center; gap: 2px 16px; min-height: 36px; }
/* The chevron stays in one column, so rows line up however long the name is. */
.fold > details > summary::after { content: ""; grid-column: 3; grid-row: 1; justify-self: center; width: 7px; height: 7px; border-right: 1.5px solid var(--ink-2); border-bottom: 1.5px solid var(--ink-2); transform: translateY(-2.5px) rotate(45deg); transition: transform .15s ease-out; }
.fold > details[open] > summary::after { transform: translateY(2.5px) rotate(-135deg); }
.fold .repo-meta, .fold .repo-meta .stars { color: var(--ink-2); }
.fold-name { min-width: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; overflow-wrap: anywhere; }
@media (hover: hover) { .fold > details > summary:hover::after { border-color: var(--ink); } }
/* Open content uses the full row, including the space under the logo. */
.fold > details > .fold-top, .fold > details > .prs { margin-left: -52px; }
.fold > details > .pr-more { margin-left: -24px; }
.fold-top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-top: 14px; }
/* Full text in the darker ink: it is the one line that says what the repo is. */
.fold-top .desc { flex: 1; min-width: 0; margin: 0; font-size: 14px; line-height: 1.45; color: var(--ink-2); white-space: normal; overflow: visible; text-overflow: clip; }
.fold-top .repo-link { margin-left: auto; }
.repo-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; color: var(--ink); white-space: nowrap; text-decoration: underline; text-decoration-color: var(--line-strong); text-underline-offset: 3px; transition: text-decoration-color .15s; }
.repo-link:hover { text-decoration-color: var(--ink); }
.repo-link svg { width: 12px; height: 12px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 0 -52px; }
.chip, .pr-more button { padding: 5px 10px; border: 0; border-radius: 7px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--line-strong); color: var(--ink); cursor: pointer; font: inherit; font-size: 13px; font-weight: 500; transition: background-color .15s, box-shadow .15s, color .15s; }
.chip { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-2); font-weight: 400; font-variant-numeric: tabular-nums; }
.chip[hidden] { display: none; }
.chip span { color: var(--ink); font-weight: 500; }
.chip[aria-pressed="true"] { background: var(--ink); color: var(--page); box-shadow: inset 0 0 0 1px var(--ink); }
.chip[aria-pressed="true"] span { color: inherit; }
.chip:focus-visible { outline: 2px solid var(--series); outline-offset: 1px; }
.chip-more { color: var(--ink); font-weight: 500; }
@media (hover: hover) { .chip:not([aria-pressed="true"]):hover, .pr-more button:hover { box-shadow: inset 0 0 0 1px var(--ink-3); } }
.sorter { width: auto; gap: 0; }
.sort-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.sort-menu { position: relative; }
.sort-pick, .fold-all { padding: 4px 0; border: 0; background: none; cursor: pointer; font: inherit; font-size: 13px; white-space: nowrap; }
.sort-pick:focus-visible, .fold-all:focus-visible, .sort button:focus-visible { outline: 2px solid var(--series); outline-offset: 2px; border-radius: 3px; }
.sort-pick { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); font-weight: 500; }
.sort-pick::after { content: ""; width: 6px; height: 6px; border-right: 1.5px solid var(--ink-2); border-bottom: 1.5px solid var(--ink-2); transform: translateY(-2px) rotate(45deg); transition: transform .15s ease-out; }
.sort-pick[aria-expanded="true"]::after { transform: translateY(2px) rotate(-135deg); }
.index-head { justify-content: flex-start; align-items: baseline; gap: 2px 0; }
.index-head h2 { font-size: 14px; font-weight: 400; letter-spacing: 0; color: var(--ink-2); }
.index-head h2 b { color: var(--ink); font-weight: 500; }
.index-head h2::after { content: ","; }
.sort-by { margin: 0 6px 0 4px; font-size: 14px; color: var(--ink-2); }
.index-head .sort-pick { font-size: 14px; }
.index-head .sort-pick span { text-decoration: underline; text-decoration-color: var(--line-strong); text-underline-offset: 3px; }
.index-head .sort { left: 0; right: auto; }
.index-head .fold-all { margin-left: auto; }
.fold-all { color: var(--ink-2); transition: color .15s; }
.fold-all:hover { color: var(--ink); }
.sort { position: absolute; top: calc(100% + 6px); right: 0; z-index: 10; display: block; min-width: 148px; padding: 4px; border-radius: 9px; background: var(--surface); box-shadow: 0 0 0 1px var(--line), 0 8px 24px rgba(0,0,0,.14); }
.sort[hidden] { display: none; }
.sort button { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 6px 8px; border-radius: 5px; color: var(--ink); }
.sort button:hover { background: var(--hover); }
.sort button[aria-pressed="true"] { background: none; box-shadow: none; }
.sort button[aria-pressed="true"]:hover { background: var(--hover); }
.sort button[aria-pressed="true"]::after { content: ""; width: 4px; height: 9px; margin-right: 3px; border-right: 1.5px solid var(--ink); border-bottom: 1.5px solid var(--ink); transform: translateY(-1px) rotate(45deg); }
.chip-panel { margin-left: -52px; }
.pr[hidden] { display: none; }
.pr-more { display: flex; align-items: center; gap: 8px; margin: 10px 0 0 28px; font-size: 13px; }
.pr-more button:focus-visible { outline: 2px solid var(--series); outline-offset: 2px; border-radius: 3px; }
.pr-count { margin-left: auto; color: var(--ink-2); font-variant-numeric: tabular-nums; }
@media (max-width: 640px) {
  .sort button { padding: 10px 8px; }
  .sort-pick, .fold-all { padding: 10px 0; margin: -6px 0; }
  .index-head h2 { width: 100%; }
  .sort-by { margin-left: 0; }
  .fold > details > summary { grid-template-columns: minmax(0, 1fr) 12px; }
  .fold > details > summary::after { grid-column: 2; grid-row: 1 / span 2; }
  .fold .repo-meta { grid-column: 1; grid-row: 2; }
}

.checkbar { display: flex; align-items: center; justify-content: space-between; gap: 12px 24px; flex-wrap: wrap; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid var(--line); font-size: 14px; }
.checkbar > a { color: var(--ink-2); transition: color .15s; }
.checkbar > a:hover { color: var(--ink); }
.checkbar form { display: flex; gap: 8px; flex: 0 1 320px; }
.checkbar input {
  min-width: 0; width: 100%; font: inherit; color: var(--ink); background: var(--surface);
  padding: 6px 10px; border: 0; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--line-strong);
}
.checkbar input:focus-visible { outline: 2px solid var(--series); outline-offset: 1px; }
.go {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font: inherit; font-weight: 500; color: var(--page); background: var(--ink); cursor: pointer;
  padding: 6px 12px; border: 0; border-radius: 8px; white-space: nowrap; transition: opacity .15s;
}
.go:hover { opacity: .85; }
.go:disabled { cursor: progress; opacity: .85; }
.spin { display: none; width: 13px; height: 13px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; }
form[aria-busy="true"] .spin { display: block; }
@keyframes spin { to { transform: rotate(360deg); } }

.home { display: flex; align-items: center; justify-content: space-between; }
.home a { font-weight: 600; letter-spacing: -0.01em; }
.finder { margin-top: 112px; }
.finder h1 { margin: 0; font-size: clamp(22px, 3.4vw, 30px); font-weight: 500; letter-spacing: -0.025em; line-height: 1.25; color: var(--ink-2); text-wrap: balance; }
.finder form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px 20px; margin-top: 28px; }
.field {
  display: flex; align-items: baseline; min-width: 0; padding-bottom: 10px;
  border-bottom: 2px solid var(--line-strong); transition: border-color .15s;
  font-size: clamp(30px, 5.6vw, 52px); font-weight: 650; letter-spacing: -0.045em; line-height: 1.15;
}
.field:focus-within { border-color: var(--ink); }
.field span { color: var(--ink-3); white-space: nowrap; cursor: text; }
.field input {
  flex: 1; min-width: 0; padding: 0; border: 0; background: none; color: var(--ink);
  font: inherit; letter-spacing: inherit; caret-color: var(--merged);
}
.field input:focus { outline: none; }
.field input::placeholder { color: var(--line-strong); }
.finder .go { font-size: 16px; padding: 12px 20px; border-radius: 10px; }
.finder .go .spin { width: 15px; height: 15px; }
.error, .hint { margin: 16px 0 0; font-size: 14px; }
.hint { color: var(--ink-3); }
.error { color: var(--del); }

/* While a result loads, the line under the username is the progress bar. */
.field { position: relative; }
.meter { position: absolute; left: 0; right: 0; bottom: -2px; height: 2px; overflow: hidden; }
.meter .fill { display: block; width: 0; height: 100%; background: var(--merged); transition: width .6s cubic-bezier(.2, .7, .2, 1); }
.finder[data-state="searching"] .meter .fill { width: 22%; transition: none; animation: scan 1.2s ease-in-out infinite alternate; }
.finder[data-state="failed"] .meter .fill { background: var(--del); }
.finder[data-state="missing"] .meter { display: none; }
@keyframes scan { to { transform: translateX(354.5%); } }
.finder[data-state]:not([data-state="failed"], [data-state="missing"]) .go { display: none; }
.finder[data-state]:not([data-state="failed"], [data-state="missing"]) form { grid-template-columns: minmax(0, 1fr); }
/* Shrink long names so the whole username stays visible. */
.finder[data-state]:not([data-state="missing"]) .field { font-size: min(clamp(30px, 5.6vw, 52px), calc(min(100vw - 48px, 832px) * 1.9 / var(--chars, 1))); }
.finder[data-state]:not([data-state="missing"]) :is(.hint, .examples) { display: none; }
.finder:is([data-state="failed"], [data-state="missing"]) .progress { display: none; }
.finder:is([data-state="done"], [data-state="opening"]) .notify { display: none; }
.finder h1.who { display: flex; align-items: center; gap: 12px; animation: appear .25s ease-out; }
.finder h1 img { flex: none; width: 32px; height: 32px; border-radius: 50%; box-shadow: 0 0 0 1px var(--line); }
@keyframes appear { from { opacity: 0; } }
.progress-line { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 4px 20px; margin-top: 14px; font-size: 15px; }
.count { margin: 0; font-variant-numeric: tabular-nums; }
.notify {
  padding: 0; border: 0; background: none; cursor: pointer; font: inherit; font-size: 14px; color: var(--ink-2); white-space: nowrap;
  text-decoration: underline; text-decoration-color: var(--line-strong); text-underline-offset: 3px; transition: color .15s;
}
.notify:hover { color: var(--ink); }
.notify[aria-disabled="true"] { color: var(--ink-3); cursor: default; text-decoration: none; }
.current-repo { min-height: 1.5em; margin: 4px 0 0; font-size: 14px; color: var(--ink-3); }
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
}
.examples { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 20px; margin: 48px 0 0; padding: 0; list-style: none; font-size: 14px; color: var(--ink-3); }
.examples li { display: flex; align-items: center; }
.examples a { display: inline-flex; align-items: center; gap: 8px; color: var(--ink-2); transition: color .15s; }
.examples a:hover { color: var(--ink); }
.examples img { border-radius: 50%; box-shadow: 0 0 0 1px var(--line); }
.note { margin: 16px 0 0; color: var(--ink-3); font-size: 14px; }
.empty { margin: 0; padding: 22px 0; border-top: 1px solid var(--line); color: var(--ink-3); }
@media (max-width: 640px) {
  .checkbar form { flex-basis: 100%; }
  .finder { margin-top: 64px; }
  .finder form { grid-template-columns: 1fr; }
  .finder .go { width: 100%; }
  .finder[data-state]:not([data-state="failed"], [data-state="missing"]) h1 { display: flex; align-items: flex-end; min-height: 2.5em; }
}
@media (prefers-reduced-motion: reduce) {
  .spin { animation: none; border-right-color: currentColor; opacity: .5; }
  .fold > details > summary::after, .sort-pick::after { transition: none; }
  .meter .fill { transition: none; }
  .finder[data-state="searching"] .meter .fill { width: 100%; opacity: .4; animation: none; }
  .finder h1.who { animation: none; }
}
`;

// Shows a spinner until the next page starts to load.
const CHECK_SCRIPT = `// /check: busy state after submitting.
const busy = (form, user) => {
  const button = form.querySelector(".go");
  const input = form.querySelector("input");
  form.setAttribute("aria-busy", "true");
  button.disabled = true;
  button.querySelector(".label").textContent = "Checking…";
  input.readOnly = true;
  if (user) input.value = user;
};
// Repo chips: show one repo's PRs at a time.
document.querySelector(".repos")?.addEventListener("click", (e) => {
  const control = e.target.closest(".pr-more button");
  if (control) {
    const box = control.parentElement;
    const rows = [...box.previousElementSibling.children];
    const limit = Number(box.dataset.limit);
    const showMore = box.querySelector(".show-more");
    const showLess = box.querySelector(".show-less");
    const collapsing = control === showLess;
    const before = rows.filter((r) => !r.hidden).length;
    const count = collapsing ? limit : Math.min(rows.length, before + limit);
    rows.forEach((row, i) => { row.hidden = i >= count; });
    const left = rows.length - count;
    showMore.textContent = "Show " + Math.min(left, limit) + " more";
    showMore.hidden = !left;
    showLess.hidden = collapsing;
    box.querySelector(".pr-count").textContent = count + " of " + rows.length.toLocaleString("en-US");
    if (collapsing) {
      box.scrollIntoView({ block: "nearest" });
      showMore.focus();
    } else {
      rows[before].querySelector("a").focus();
    }
    return;
  }
  const more = e.target.closest(".chip-more");
  if (more) {
    const revealed = [...more.parentElement.querySelectorAll(".chip[hidden]")];
    revealed.forEach((chip) => { chip.hidden = false; });
    more.remove();
    revealed[0]?.focus();
    return;
  }
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const org = chip.closest(".org");
  org.querySelectorAll(".chip:not(.chip-more)").forEach((c) => c.setAttribute("aria-pressed", c === chip));
  org.querySelectorAll(".chip-panel").forEach((p) => { p.hidden = p.id !== chip.getAttribute("aria-controls"); });
});
// Sort menu: choosing an option, clicking away, Escape or tabbing out closes it.
const sortPick = document.querySelector(".sort-pick");
if (sortPick) {
  const options = document.querySelector(".sort");
  const menu = sortPick.parentElement;
  const show = (open) => { options.hidden = !open; sortPick.setAttribute("aria-expanded", open); };
  const showChoice = () => {
    const choice = options.querySelector('[aria-pressed="true"]');
    if (choice) sortPick.firstElementChild.textContent = choice.textContent;
  };
  showChoice();
  sortPick.addEventListener("click", () => show(options.hidden));
  options.addEventListener("click", (e) => {
    if (!e.target.closest("button")) return;
    showChoice();
    show(false);
    sortPick.focus();
  });
  addEventListener("click", (e) => { if (!menu.contains(e.target)) show(false); });
  menu.addEventListener("focusout", (e) => { if (e.relatedTarget && !menu.contains(e.relatedTarget)) show(false); });
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || options.hidden) return;
    show(false);
    sortPick.focus();
  });
}
// Expand all / Collapse all. The label follows the rows, however they were opened.
const foldAll = document.querySelector(".fold-all");
if (foldAll) {
  const closedRow = () => document.querySelector(".repos > .fold > details:not([open])");
  const label = () => { foldAll.textContent = closedRow() ? "Expand all" : "Collapse all"; };
  foldAll.addEventListener("click", () => {
    const open = Boolean(closedRow());
    document.querySelectorAll(".repos > .fold > details").forEach((row) => { row.open = open; });
    label();
  });
  document.querySelector(".repos").addEventListener("toggle", label, true);
}
// ?wait=1 is only how the page got here; keep it out of the address bar.
if (new URLSearchParams(location.search).has("wait")) {
  const clean = new URL(location);
  clean.searchParams.delete("wait");
  history.replaceState(null, "", clean);
}
document.querySelectorAll("form.lookup").forEach((form) =>
  form.addEventListener("submit", () => busy(form)),
);
document.querySelectorAll("a[data-user]").forEach((a) =>
  a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    busy(document.querySelector("form.lookup"), a.dataset.user);
  }),
);
// Coming back with the Back button restores the page as it was; reset it.
addEventListener("pageshow", (e) => { if (e.persisted) location.reload(); });
// Focus the field on desktop only, so phones don't open the keyboard unasked.
const field = document.querySelector(".finder input");
if (field && !field.readOnly && matchMedia("(pointer: fine)").matches) {
  field.focus();
  if (field.value) field.select();
}
`;

// Runs on the page shown while a result loads: follows the Worker's progress, then opens the result.
const LOADING_SCRIPT = `// /check/<user>: live progress.
const finder = document.querySelector(".finder");
const input = finder.querySelector("input");
const heading = finder.querySelector("h1");
const meter = finder.querySelector(".meter");
const fill = meter.firstElementChild;
const count = finder.querySelector(".count");
const repoLine = finder.querySelector(".current-repo");
const notifyButton = finder.querySelector(".notify");
const live = finder.querySelector("[role=status]");
const errorLine = finder.querySelector(".error");
const go = finder.querySelector(".go");
const goLabel = go.querySelector(".label");
go.disabled = true;
const user = input.value;
const originalHeading = heading.textContent;
const pointerFine = matchMedia("(pointer: fine)").matches;
const stillMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const number = (n) => n.toLocaleString("en-US");
const prsWord = (n) => "merged pull request" + (n === 1 ? "" : "s");
let shown = 0, target = 0, totalPrs = 0, frame = 0, avatarUrl = "";

// This page's state lives in data-state on .finder, and only enter() changes it.
// A move the table doesn't list is ignored, so a late event can't undo a finished check.
const NEXT = {
  searching: ["counting", "done", "failed", "missing", "left"],
  counting: ["counting", "done", "failed", "missing", "left"],
  done: ["opening"], // waits here if a notification was sent, until they come back
  opening: [],
  failed: [],
  missing: [],
  left: [],
};
let phase = finder.dataset.state;
const enter = (next) => {
  if (!NEXT[phase].includes(next)) return false;
  phase = finder.dataset.state = next;
  const editable = next === "failed" || next === "missing";
  input.readOnly = !editable;
  // A disabled default button also stops Enter from restarting the check.
  go.disabled = !editable;
  return true;
};

const NOTIFY_TEXT = { offered: "Notify me when done", armed: "You’ll get a notification", blocked: "Notifications are blocked in this browser" };
let notify = "off";
const setNotify = (next) => {
  notify = notifyButton.dataset.state = next;
  notifyButton.hidden = false;
  notifyButton.textContent = NOTIFY_TEXT[next];
  notifyButton.setAttribute("aria-disabled", next !== "offered");
};

const drawCount = (n) => { count.textContent = "Found " + number(n) + " of " + number(totalPrs) + " " + prsWord(totalPrs); };

// The number eases between real values, and never ahead of what has been found.
const showCount = (to) => {
  cancelAnimationFrame(frame);
  if (stillMotion) { shown = to; drawCount(to); return; }
  const from = shown;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 500);
    shown = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    drawCount(shown);
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
};

const onProgress = (e) => {
  const first = phase === "searching";
  if (!enter("counting")) return;
  if (first) {
    avatarUrl = e.avatar + "&s=64";
    const img = new Image(32, 32);
    img.src = avatarUrl;
    img.alt = "";
    const name = document.createElement("span");
    name.textContent = e.name;
    heading.replaceChildren(img, name);
    heading.classList.add("who");
    live.textContent = "Checking " + number(e.total) + " " + prsWord(e.total) + " by " + e.name + ".";
  }
  meter.setAttribute("aria-valuemax", e.total);
  meter.setAttribute("aria-valuenow", e.found);
  fill.style.width = (e.total ? (e.found / e.total) * 100 : 100) + "%";
  totalPrs = e.total;
  target = e.found;
  showCount(e.found);
  repoLine.textContent = e.repo ?? "";
  document.title = number(e.found) + "/" + number(e.total) + " " + user;
};

// Only when they're away: otherwise the page itself is the news.
const away = () => document.hidden || !document.hasFocus();
const tell = (title, body) => {
  if (notify !== "armed" || !away()) return false;
  try {
    const note = new Notification(title, { body, icon: avatarUrl || undefined, tag: location.pathname });
    note.onclick = () => { focus(); note.close(); };
    return true;
  } catch {
    return false;
  }
};

const onDone = () => {
  const cached = phase === "searching";
  if (!enter("done")) return;
  cancelAnimationFrame(frame);
  const summary = cached ? "Results ready" : target ? "Found " + number(target) + " " + prsWord(target) : "No merged pull requests found";
  count.textContent = summary;
  live.textContent = summary + ". Opening the results.";
  fill.style.width = "100%";
  repoLine.textContent = "";
  document.title = "Done: " + user;
  const open = () => { if (enter("opening")) location.replace(location.pathname + "?wait=1"); };
  const hold = stillMotion ? 0 : 250;
  // A notification's click needs this page still open, so wait until they come back.
  if (tell(user + " is ready", summary + ".")) {
    const back = () => { if (!away()) setTimeout(open, hold); };
    addEventListener("visibilitychange", back);
    addEventListener("focus", back);
  } else {
    setTimeout(open, hold);
  }
};

const onError = (e) => {
  if (!enter(e.missing ? "missing" : "failed")) return;
  cancelAnimationFrame(frame);
  const when = e.resetAt && new Date(e.resetAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const message = when ? "This site has reached GitHub’s hourly limit. Try again after " + when + "." : e.message;
  errorLine.textContent = message;
  errorLine.hidden = false;
  document.title = "Check open-source contributions";
  if (e.missing) {
    heading.textContent = originalHeading;
    heading.classList.remove("who");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "error");
  } else {
    goLabel.textContent = "Try again";
    meter.hidden = !target;
    input.addEventListener("input", () => {
      goLabel.textContent = "Check";
      meter.hidden = true;
    }, { once: true });
  }
  tell("Couldn’t finish checking " + user, message);
  if (!pointerFine) return;
  if (e.missing) { input.focus(); input.select(); }
  else go.focus();
};

const handle = (event) => {
  if (event.type === "progress") onProgress(event);
  else if (event.type === "done") onDone();
  else if (event.type === "error") onError(event);
};

// Offer this only on long waits, and only where notifications work without an installed app.
setTimeout(() => {
  if (!NEXT[phase].includes("done") || !pointerFine || !("Notification" in window) || Notification.permission === "denied") return;
  setNotify("offered");
}, 6000);
notifyButton.addEventListener("click", async () => {
  if (notify !== "offered") return;
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission === "default") return;
  setNotify(permission === "granted" ? "armed" : "blocked");
  live.textContent = NOTIFY_TEXT[notify] + ".";
});

addEventListener("pagehide", () => enter("left"));
(async () => {
  try {
    const res = await fetch(finder.dataset.stream);
    if (!res.ok || !res.body) throw new Error(res.status);
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split(String.fromCharCode(10));
      buffer = lines.pop();
      lines.forEach((line) => handle(JSON.parse(line)));
    }
  } catch {}
  onError({ message: "Lost the connection before the check finished." });
})();
`;


const THEME_BUTTON = `<button class="theme" type="button" aria-label="Switch between light and dark theme" title="Switch theme">
      <svg class="sun" aria-hidden="true"><use href="#i-sun"/></svg>
      <svg class="moon" aria-hidden="true"><use href="#i-moon"/></svg>
    </button>`;

// Fallback for the footer time; the page swaps in the visitor's time zone.
const utcStamp = (iso) => {
  const d = new Date(iso);
  const two = (n) => String(n).padStart(2, "0");
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${two(d.getUTCHours())}:${two(d.getUTCMinutes())} UTC`;
};

const layout = ({ head, body, script = "", form = false }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${head}
<meta name="theme-color" content="#f9f9f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0a" media="(prefers-color-scheme: dark)">
<script>try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch {}</script>
<style>
${CSS.replace("%%EXTRA_CSS%%", form ? FORM_CSS : "")}</style>
</head>
<body>
${sprite}
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
${body}
</div>
<script>
${script}${THEME_SCRIPT}</script>
</body>
</html>
`;

// ---------- filter + rank ----------

// Merged PRs to repos that pass config's filters, grouped by repo and ranked.
export function rank(allPrs, config = {}, { showAll = false } = {}) {
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
    r.prs.sort((a, b) => newestFirst(a.mergedAt, b.mergedAt));
  }

  const lines = (r) => r.prs.reduce((s, p) => s + p.additions + p.deletions, 0);
  const sorters = {
    stars: (a, b) => b.stargazerCount - a.stargazerCount,
    recent: (a, b) => newestFirst(a.prs[0].mergedAt, b.prs[0].mergedAt),
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
  return { prs, repos };
}

// ---------- contributions page ----------

// data: { fetchedAt, profile, prs } as written by scripts/fetch.mjs.
// opts.ogImage: link-preview image URL. opts.check: render as a /check result
// (no canonical URL, noindex, a bar to check another user, no "Featured" sort).
export function contributionsPage(data, config = {}, opts = {}) {
  const { fetchedAt, profile } = data;
  const { prs, repos } = rank(data.prs, config, opts);
  const { ogImage = null, check = false, capped = false } = opts;
  const isIndex = check && repos.length >= INDEX_MIN_REPOS;
  const items = isIndex ? groupByOrg(repos) : repos;

  const totalStars = repos.reduce((s, r) => s + r.stargazerCount, 0);
  // The page content only changes when a newly shown PR is merged, so search
  // engines get that date rather than the build time.
  const contentUpdated = prs.reduce((m, p) => (p.mergedAt > m ? p.mergedAt : m), "") || fetchedAt;

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
    dateModified: contentUpdated,
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

  // "Featured" means the owner's priority order, so only show it when there is one.
  const sorts = isIndex
    ? [["prs", "Most PRs"], ["stars", "Stars"], ["recent", "Recent"]]
    : [
        ...((config.priority ?? []).length ? [["featured", "Featured"]] : []),
        ["stars", "Stars"], ["recent", "Recent"], ["prs", "Most PRs"],
      ];

  const sortOptions = `<div class="sort" role="group" aria-labelledby="sort-label" style="--n:${sorts.length}"${check ? ` id="sort-options" hidden` : ""}>
            ${sorts.map(([key, label], i) => `<button type="button" data-sort="${key}" aria-pressed="${i === 0}">${label}</button>`).join("\n            ")}
          </div>`;
  const sortMenu = `<div class="sort-menu">
            <button class="sort-pick" type="button" aria-expanded="false" aria-controls="sort-options" aria-labelledby="sort-label sort-value"><span id="sort-value">${sorts[0][1]}</span></button>
            ${sortOptions}
          </div>`;

  const head = `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(name)}">
${noindex ? `<meta name="robots" content="noindex, nofollow">\n` : ""}
${siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}">\n` : ""}<link rel="icon" href="${esc(profile.avatar_url)}">
<link rel="apple-touch-icon" href="${esc(profile.avatar_url)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${siteUrl ? `<meta property="og:url" content="${esc(siteUrl)}">\n` : ""}<meta property="og:image" content="${esc(ogImage ?? profile.avatar_url)}">
${ogImage ? `<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">\n` : ""}<meta property="profile:username" content="${esc(profile.login)}">
<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage ?? profile.avatar_url)}">
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>${check ? `
<noscript><style>html .pr[hidden] { display: grid; } html .chip-panel[hidden] { display: block; } html .chip-panel::before { content: attr(data-name); display: block; margin-top: 16px; font-size: 14px; font-weight: 600; } html .chips, html .pr-more, html .sort-by, html .sort-menu, html .fold-all { display: none; } html .index-head h2::after { content: none; }</style></noscript>` : ""}`;

  const bar = check
    ? `  <div class="checkbar">
    <a href="/check">Check contributions</a>
    ${barForm(profile.login)}
  </div>
`
    : "";

  const body = `${bar}  <header class="top">
    <img src="${esc(profile.avatar_url)}&s=88" alt="" width="44" height="44" fetchpriority="high">
    <div class="who">
      <h1>${esc(name)}</h1>
      ${profile.bio ? `<p>${esc(profile.bio)}</p>` : ""}
    </div>
    <nav aria-label="Profiles">${links}</nav>
    ${THEME_BUTTON}
  </header>

  <main id="main">
    <section class="hero">
      <p class="num">${prs.length}</p>
      <p class="lede">merged pull requests to <b>${repos.length} open-source projects</b> with ${compact(totalStars)} stars between them.</p>
      ${capped ? `<p class="note">GitHub search returns at most 1,000 pull requests, so older ones may be missing.</p>` : ""}
    </section>

${config.chart === false ? "" : `    <section aria-labelledby="activity">
      <h2 id="activity">Merged per month</h2>
      ${activityChart(prs, fetchedAt)}
    </section>
`}
    <section aria-labelledby="projects">
      ${isIndex ? `<div class="section-head index-head">
        <h2 id="projects"><b>${plural(repos.length, "repo")}</b> across <b>${plural(new Set(repos.map((r) => r.owner.login)).size, "org")}</b></h2>
        <span class="sort-by" id="sort-label">sorted by</span>
        ${sortMenu}
        <button class="fold-all" type="button">Expand all</button>
      </div>` : `<div class="section-head">
        <h2 id="projects">Projects</h2>
        <div class="sorter">
          <span class="sort-label" id="sort-label">Sort by</span>
          ${check ? sortMenu : sortOptions}
        </div>
      </div>`}
      ${repos.length ? `<ol class="repos">${items.map((x, i) => (x.repos ? orgRow(x, i) : repoRow(x, i, { foldLong: check, closed: isIndex }))).join("")}
      </ol>` : `<p class="empty">No merged pull requests to public repos ${esc(name)} doesn't own.</p>`}
    </section>
  </main>

  <footer>
    <p>Updated <time datetime="${fetchedAt}">${utcStamp(fetchedAt)}</time></p>
    <a class="source" href="${esc(profile.html_url)}" target="_blank" rel="noopener">${icon("github")}Data from GitHub</a>
  </footer>`;

  return { html: layout({ head, body, script: PAGE_SCRIPT + (check ? CHECK_SCRIPT : ""), form: check }), prs, repos, contentUpdated };
}

// ---------- /check ----------

const goButton = `<button class="go" type="submit"><span class="spin" aria-hidden="true"></span><span class="label">Check</span></button>`;
const inputAttrs = `name="user" required maxlength="39" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" translate="no"`;

// The small form at the top of a result page.
const barForm = (value) => `<form class="lookup" action="/check" method="get" role="search">
      <label class="sr" for="user">GitHub username</label>
      <input id="user" ${inputAttrs} value="${esc(value)}" placeholder="GitHub username…">
      ${goButton}
    </form>`;

// Accounts with a moderate number of PRs, so they load quickly.
const EXAMPLES = ["rauchg", "kelseyhightower", "tj"];

// The form page; also used for "not found" and other errors.
// opts.loading: the same page while that user's PRs are fetched, with live progress.
export function checkPage({ user = "", error = "", loading = false } = {}) {
  const path = `/check/${encodeURIComponent(user)}`;
  const head = `<title>${loading ? `Checking ${esc(user)}` : "Check open-source contributions"}</title>
<meta name="description" content="See the merged pull requests any GitHub user has made to open-source projects they don't own.">
<meta name="robots" content="noindex">
${loading ? `<noscript><meta http-equiv="refresh" content="0; url=${esc(path)}?wait=1"></noscript>\n` : ""}<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icons.merged.replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" fill="#0ca30c" `))}">`;
  const body = `  <header class="home">
    <a href="/check">Check contributions</a>
    ${THEME_BUTTON}
  </header>

  <main id="main" class="finder"${loading ? ` data-state="searching" data-stream="${esc(path)}/stream"` : ""}>
    <h1>See anyone’s open-source contributions</h1>
    <form class="lookup" action="/check" method="get" role="search">
      <label class="field"${loading ? ` style="--chars:${11 + user.length}"` : ""}>
        <span>github.com/</span>
        <input ${inputAttrs} value="${esc(user)}" placeholder="username…" aria-label="GitHub username"${error ? ` aria-invalid="true" aria-describedby="error"` : ""}${loading ? " readonly" : ""}>
        ${loading ? `<span class="meter" role="progressbar" aria-label="Pull requests found"><span class="fill"></span></span>` : ""}
      </label>
      ${goButton}
    </form>
    ${error || loading ? `<p class="error" id="error" role="alert"${error ? "" : " hidden"}>${esc(error)}</p>` : ""}
    ${loading ? `<div class="progress">
      <div class="progress-line">
        <p class="count" aria-hidden="true">Searching GitHub…</p>
        <button class="notify" type="button" hidden>Notify me when done</button>
      </div>
      <p class="current-repo" aria-hidden="true" translate="no"></p>
      <p class="sr" role="status" aria-live="polite">Searching GitHub for ${esc(user)}’s merged pull requests.</p>
    </div>` : ""}
    <p class="hint">Merged pull requests to public repos they don’t own, live from GitHub.</p>
    <ul class="examples" aria-label="Examples">
      <li>Try</li>
      ${EXAMPLES.map((u) => `<li><a href="/check/${u}" data-user="${u}" translate="no"><img src="https://github.com/${u}.png?size=40" alt="" width="20" height="20" loading="lazy">${u}</a></li>`).join("\n      ")}
    </ul>
  </main>

  <footer>
    <p></p>
    <a class="source" href="https://github.com" target="_blank" rel="noopener">${icon("github")}Data from GitHub</a>
  </footer>`;
  return layout({ head, body, script: CHECK_SCRIPT + (loading ? LOADING_SCRIPT : ""), form: true });
}
