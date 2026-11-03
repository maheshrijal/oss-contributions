// Local dev server: builds the site, serves dist/, and reloads the browser
// when config.json, data/ or scripts/build.mjs change.
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, watch } from "node:fs";

const port = Number(process.env.PORT ?? 3000);
const clients = new Set();

if (!existsSync("data/prs.json")) execFileSync("node", ["scripts/fetch.mjs"], { stdio: "inherit" });

const build = () => {
  try {
    execFileSync("node", ["scripts/build.mjs"], { stdio: "inherit" });
    for (const res of clients) res.write("data: reload\n\n");
  } catch {
    console.error("Build failed; waiting for the next change.");
  }
};
build();

let timer;
const onChange = () => {
  clearTimeout(timer);
  timer = setTimeout(build, 100);
};
for (const path of ["config.json", "data", "scripts/build.mjs"]) watch(path, onChange);

const reloadScript = `<script>new EventSource("/__reload").onmessage = () => location.reload();</script>`;

createServer((req, res) => {
  if (req.url === "/__reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  if (req.url !== "/" && req.url !== "/index.html") {
    res.writeHead(404).end();
    return;
  }
  const html = readFileSync("dist/index.html", "utf8").replace("</body>", `${reloadScript}</body>`);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(html);
}).listen(port, () => console.log(`Dev server: http://localhost:${port}`));
