// Renders the link-preview image (static/og.png, 1200×630) with local Chrome.
// Run it by hand after changing the name, title or top of `priority`, then commit the PNG.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const config = JSON.parse(readFileSync("config.json", "utf8"));
const { profile } = JSON.parse(readFileSync("data/prs.json", "utf8"));
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const name = profile.name ?? profile.login;
const host = new URL(config.site?.url ?? profile.html_url).host;

// No counts on the card: social sites cache the image, so numbers would go stale.
const repos = (config.priority ?? []).slice(0, 6).map((full) => {
  const [owner, repo] = full.split("/");
  return `<li><img src="https://github.com/${esc(owner)}.png?size=96" alt=""><span><span class="muted">${esc(owner)} / </span>${esc(repo)}</span></li>`;
});

const html = `<!doctype html>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body {
  display: flex; flex-direction: column; padding: 72px 80px 64px;
  background: #f9f9f7; color: #0b0b0b;
  font: 24px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.who { display: flex; align-items: center; gap: 18px; }
.who img { width: 64px; height: 64px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(11,11,11,.08); }
.who b { display: block; font-size: 26px; font-weight: 600; letter-spacing: -0.01em; }
.who span { color: #6f6e69; font-size: 22px; }
h1 { margin: 56px 0 0; font-size: 84px; line-height: 1; font-weight: 650; letter-spacing: -0.045em; }
ul { list-style: none; margin: auto 0 0; padding: 32px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 18px 48px; border-top: 1px solid rgba(11,11,11,.1); }
li { display: flex; align-items: center; gap: 14px; font-size: 24px; font-weight: 500; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; }
li img { width: 36px; height: 36px; border-radius: 8px; box-shadow: 0 0 0 1px rgba(11,11,11,.08); background: #fff; flex: none; }
li > span { overflow: hidden; text-overflow: ellipsis; }
.muted { color: #6f6e69; font-weight: 400; }
</style>
<div class="who">
  <img src="${esc(profile.avatar_url)}&s=128" alt="">
  <div><b>${esc(name)}</b><span>${esc(host)}</span></div>
</div>
<h1>Open-source contributions</h1>
<ul>${repos.join("")}</ul>
`;

const dir = mkdtempSync(join(tmpdir(), "og-"));
const page = join(dir, "og.html");
writeFileSync(page, html);
mkdirSync("static", { recursive: true });
execFileSync(chrome, [
  "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--window-size=1200,630", "--virtual-time-budget=5000",
  `--screenshot=${resolve("static/og.png")}`, `file://${page}`,
], { stdio: "ignore" });
rmSync(dir, { recursive: true });
console.log("Wrote static/og.png");
