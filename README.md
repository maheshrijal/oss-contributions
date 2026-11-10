# oss-contributions

[oss.mrjl.dev/check](https://oss.mrjl.dev/check) lists a GitHub user's merged pull requests to open-source projects.

This repo builds two things:

- A static page for the user set in `config.json`. It shows merged PRs to public repos that user doesn't own, filtered and ordered by the rest of `config.json`.
- `/check`, a Cloudflare Worker that loads the same list for any GitHub user, live from GitHub.

## Run locally

You need Node 20 or later and the `gh` CLI, logged in.

```bash
npm run dev     # local server on http://localhost:3000, reloads on changes
npm run dev:all # same, but shows every merged PR (ignores excludePRs and minStars)
npm run fetch   # pull fresh data from GitHub into data/prs.json
npm run build   # write dist/index.html
npm run og      # re-render static/og.png, the link-preview image (needs Chrome)
```

`npm run dev` fetches data only on the first run. To refresh it, run `npm run fetch`. The page reloads by itself.

## config.json

| Key | What it does |
|---|---|
| `user` | GitHub username |
| `chart` | Shows the "merged per month" chart. On unless set to `false` |
| `sort` | Orders repos that aren't in `priority`: `stars` (default), `recent`, `prs`, `lines`, or `name` |
| `priority` | Repos to pin at the top, in this order, for example `["apache/druid", "kubernetes/website"]` |
| `exclude` | Repos to hide. `"org/*"` hides a whole org |
| `excludePRs` | Single PRs to hide, by URL |
| `minStars` | Hides repos with fewer stars than this |
| `site.url` | Public URL, used for the canonical link, social previews, `robots.txt`, and `sitemap.xml` |
| `site.noindex` | `true` adds a robots meta tag and a `robots.txt` that keep search engines out |
| `site.title`, `site.links` | Page title and header links |

Repos in `priority` come first. The rest follow `sort`, and ties go to the repo with more stars. This order is the page's default "Featured" view. Visitors can also sort by stars, most recent merge, or number of PRs from the menu above the list.

## Deploy

The site runs on Cloudflare as a Worker, configured in `wrangler.jsonc`. Cloudflare serves the main page and the other files in `dist/` as static files. The Worker code runs only for `/check`.

`.github/workflows/deploy.yml` fetches fresh data, builds, and deploys. It runs on every push to `main`, every 8 hours, and on manual runs. It needs two repo secrets:

- `CLOUDFLARE_API_TOKEN`: a token with Editor permission on the `oss-mrjl-dev` Worker only.
- `CLOUDFLARE_ACCOUNT_ID`

The workflow only uploads and releases new versions. The Editor token can't change the custom domain or other settings. If you change `routes`, `workers_dev`, or `preview_urls` in `wrangler.jsonc`, apply them once from your machine with `npx wrangler deploy`.

Cloudflare creates and owns the `oss.mrjl.dev` DNS record, as it does for other Worker custom domains. The record is not in the OpenTofu DNS repo.

## /check

`/check` is a form. It sends the visitor to `/check/<username>`, which lists that user's merged PRs. `src/worker.js` handles these routes, and `src/render.js` draws the pages. The main page uses the same `src/render.js`. The main page doesn't link to `/check`, and the `/check` pages tell search engines not to index them.

While a result loads, the page reads live progress from `/check/<username>/stream`. The stream sends one JSON line for each page of PRs. When the list is complete, the page opens the finished result from the cache. During long waits on desktop, the page offers a browser notification, which works only while the tab stays open. Without JavaScript, the page loads `?wait=1` instead, which returns the whole result in one response.

If the site runs out of GitHub's hourly limit, visitors see when to try again. The Worker writes the remaining limit to Workers Logs as `github_rate_limit_remaining`. Visitors don't see it.

Accounts with 10 or more repos get a shorter list. It has one closed row for each GitHub org or lone repo, with repo chips inside each org, and an **Expand all** button. On any `/check` page, a long PR list shows 10 PRs first, with a button to show more.

The Worker needs a `GITHUB_TOKEN` secret: a fine-grained GitHub token with read-only access to public repositories. Set it with `npx wrangler versions secret put GITHUB_TOKEN`.

Each user's page stays in the cache for an hour. Users with many PRs take a while to load the first time. GitHub search returns at most 1,000 results, so `/check` shows at most 1,000 PRs.

To try `/check` locally:

```bash
npm run build
GITHUB_TOKEN=$(gh auth token) CLOUDFLARE_INCLUDE_PROCESS_ENV=true npx wrangler dev
```
