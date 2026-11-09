# oss-contributions

A one-page site that lists my pull requests to open-source projects.

It only shows merged PRs to public repos I don't own. Everything else is set in `config.json`.

## Run locally

Needs Node 20+ and the `gh` CLI (logged in).

```bash
npm run dev     # local server on http://localhost:3000, reloads on changes
npm run dev:all # same, but shows every merged PR (ignores excludePRs and minStars)
npm run fetch   # pull fresh data from GitHub into data/prs.json
npm run build   # write dist/index.html
npm run og      # re-render static/og.png, the link-preview image (needs Chrome)
```

## config.json

| Key | What it does |
|---|---|
| `user` | GitHub username |
| `chart` | Show the "merged per month" chart. On unless set to `false` |
| `sort` | How to order repos not in `priority`: `stars` (default), `recent`, `prs`, `lines`, `name` |
| `priority` | Repos to pin at the top, in this order, e.g. `["apache/druid", "kubernetes/website"]` |
| `exclude` | Repos to hide. `"org/*"` hides a whole org |
| `excludePRs` | Single PRs to hide, by URL |
| `minStars` | Hide repos with fewer stars than this |
| `site.url` | Public URL. Used for the canonical link, social previews, `robots.txt` and `sitemap.xml` |
| `site.noindex` | `true` keeps search engines out (robots meta tag + `robots.txt`). Set to `false` when the site goes public |
| `site.title`, `site.links` | Page title and header links |

Repos in `priority` come first. The rest follow `sort`; ties go to the repo with more stars.

This order is the page's default "Featured" view. Visitors can also sort the list by stars, most recent merge, or number of PRs with the buttons above it.

`npm run dev` fetches data on first run only. Run `npm run fetch` to refresh it; the page reloads on its own.

## Deploy

Hosted on Cloudflare at https://oss.mrjl.dev as a Worker (`wrangler.jsonc`). The main page and other files in `dist/` are served as static files; the Worker code only runs for `/check`.

`.github/workflows/deploy.yml` fetches fresh data, builds and deploys on push to `main`, every 8 hours, and on manual runs. It needs two repo secrets:

- `CLOUDFLARE_API_TOKEN`: scoped to the `oss-mrjl-dev` Worker only, with Workers → Editor.
- `CLOUDFLARE_ACCOUNT_ID`

The workflow only uploads and releases new content. It doesn't touch the custom domain or other settings, which the Editor token can't change. If you change `routes`, `workers_dev` or `preview_urls` in `wrangler.jsonc`, apply them once from your machine with `npx wrangler deploy`.

## /check

`/check` is a form that shows the merged PRs of any GitHub user, at `/check/<username>`. It is handled by the Worker in `src/worker.js` and drawn by `src/render.js`, the same code that draws the main page. Nothing links to it and it isn't indexed.

While a result loads, the page shows live progress from `/check/<username>/stream`, one JSON line per page of PRs, then opens the finished page from the cache. On desktop it offers a browser notification during long waits; the tab must stay open. Without JavaScript, the page falls back to `?wait=1`, which returns the whole result at once.

If GitHub's hourly limit runs out, visitors see when to try again. The remaining count only goes to Workers Logs, as `github_rate_limit_remaining`.

Accounts with 10 or more repos get a shorter list: one closed row per GitHub org or lone repo, with repo chips inside each org, and an Expand all button. Long PR lists on any `/check` page start at 10, with a button to show more.

- It needs a `GITHUB_TOKEN` Worker secret: a fine-grained GitHub token with read-only access to public repositories. Set it with `npx wrangler versions secret put GITHUB_TOKEN`.
- Each user's page is cached for an hour. Users with many PRs take a while the first time; GitHub search caps results at 1,000.
- To try it locally:

  ```bash
  npm run build
  GITHUB_TOKEN=$(gh auth token) CLOUDFLARE_INCLUDE_PROCESS_ENV=true npx wrangler dev
  ```

Cloudflare creates and owns the `oss.mrjl.dev` DNS record, like other Worker custom domains, so it is not in the OpenTofu DNS repo.
