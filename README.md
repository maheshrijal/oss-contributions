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
```

## config.json

| Key | What it does |
|---|---|
| `user` | GitHub username |
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

Hosted on Cloudflare at https://oss.mrjl.dev as a static-assets Worker (`wrangler.jsonc`).

`.github/workflows/deploy.yml` fetches fresh data, builds and deploys on push to `main`, every 8 hours, and on manual runs. It needs two repo secrets:

- `CLOUDFLARE_API_TOKEN`: scoped to the `oss-mrjl-dev` Worker only, with Workers → Editor.
- `CLOUDFLARE_ACCOUNT_ID`

The workflow only uploads and releases new content. It doesn't touch the custom domain or other settings, which the Editor token can't change. If you change `routes`, `workers_dev` or `preview_urls` in `wrangler.jsonc`, apply them once from your machine with `npx wrangler deploy`.

Cloudflare creates and owns the `oss.mrjl.dev` DNS record, like other Worker custom domains, so it is not in the OpenTofu DNS repo.
