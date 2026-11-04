# AGENTS.md

A one-page static site that lists Mahesh's merged pull requests to open-source projects. Treat it as a resume: every item on the page should make the profile stronger.

## Layout

- `config.json`: everything the owner tunes (sort, priority, exclusions, links).
- `scripts/fetch.mjs`: pulls PRs from GitHub with the `gh` CLI into `data/prs.json`.
- `scripts/build.mjs`: reads config and data, writes `dist/index.html` (HTML, CSS and JS in one file).
- `src/render.js`: draws the page; shared by the build and the Worker.
- `src/worker.js`: serves `/check` and `/check/<username>` (any user's merged PRs, live from GitHub). Not linked from the main page.
- `scripts/og.mjs`: renders the link-preview image `static/og.png` with local Chrome. Run by hand and commit the PNG.
- `scripts/dev.mjs`: local server on port 3000 that rebuilds and reloads on changes.
- `wrangler.jsonc`: Cloudflare config; serves `dist/` at https://oss.mrjl.dev.
- `.github/workflows/deploy.yml`: fetches, builds and deploys on push to `main` and every 8 hours.

`data/` and `dist/` are generated and git-ignored.

## Commands

```bash
npm run dev     # serve http://localhost:3000 with auto-reload
npm run fetch   # refresh data/prs.json from GitHub
npm run build   # write dist/index.html
npm run og      # re-render static/og.png (after changing name, title or top of priority)
```

## What the page shows

- Only **merged** PRs. No open, draft or closed PRs.
- Only **public** repos the owner **does not own**. Personal repos stay off the page.
- No work repos (`kutumbtech/*` is in `exclude`).

## Keep low-value items out

The page is curated. Fewer, stronger PRs beat a bigger count. When new PRs show up after a fetch, check each one and add its URL to `excludePRs` if it is:

- a typo, grammar or wording fix
- a broken-link or URL fix
- a README tweak with no technical content
- adding the owner's name to a list, pledge or manifesto (e.g. `awesome-uses`, `opentofu/manifesto`)
- in a repo outside the owner's field (DevOps, infrastructure, cloud-native) that is also small

Keep:

- code changes: bug fixes, features, tests, flaky-test fixes, refactors
- small docs fixes **in the owner's field** that correct a real technical mistake (a broken example, a wrong path, bad YAML), e.g. Kubernetes, Docker, Prometheus or Helm docs

If unsure, ask the owner rather than guessing. Don't remove entries from `excludePRs` without asking.

Ordering: strong code work goes in `priority` at the top; small docs fixes go below it. New repos that deserve a top spot should be suggested to the owner, not added to `priority` silently.

## Code rules

- No dependencies. Plain Node (20+) and the `gh` CLI only.
- Keep the output a single static HTML file. No frameworks, no client-side data fetching.
- Design: minimal, sharp, light and dark themes (follows the system setting; the header toggle overrides it and is saved in `localStorage`), system font. Keep the look consistent with what's there.
- After changing `build.mjs` or `src/render.js`, run `npm run build` and look at the page at desktop and phone widths.
- Don't commit, push or change GitHub settings unless asked.
