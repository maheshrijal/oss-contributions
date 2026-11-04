// Reads config.json + data/prs.json and writes dist/ (index.html, og.png, robots.txt, sitemap.xml).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { contributionsPage } from "../src/render.js";

const config = JSON.parse(readFileSync("config.json", "utf8"));
const data = JSON.parse(readFileSync("data/prs.json", "utf8"));

const siteUrl = config.site?.url?.replace(/\/?$/, "/");
const noindex = config.site?.noindex === true;
// Link-preview card from scripts/og.mjs; falls back to the avatar.
const ogImage = siteUrl && existsSync("static/og.png") ? `${siteUrl}og.png` : null;

// ALL=1 shows every merged PR: ignores minStars and excludePRs (repo excludes still apply).
const { html, repos, prs, contentUpdated } = contributionsPage(data, config, {
  ogImage,
  showAll: process.env.ALL === "1",
});

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
if (ogImage) copyFileSync("static/og.png", "dist/og.png");
if (siteUrl) {
  writeFileSync(
    "dist/robots.txt",
    noindex ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
  );
  writeFileSync(
    "dist/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc><lastmod>${contentUpdated.slice(0, 10)}</lastmod></url>\n</urlset>\n`,
  );
}
console.log(`Built dist/index.html — ${repos.length} projects, ${prs.length} PRs`);
