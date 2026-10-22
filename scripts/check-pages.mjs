import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const root = resolve("dist");
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://local");
    if (!url.pathname.startsWith("/soj1/")) throw Error();
    const path = resolve(
      root,
      decodeURIComponent(url.pathname.slice(6)) || "index.html",
    );
    if (!path.startsWith(root + "/")) throw Error();
    const file = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
    });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.url() + " " + r.status());
  });
  await page.goto(`http://127.0.0.1:${port}/soj1/`);
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.title(), /MIPS LAB/);
  await page
    .locator("nav")
    .getByRole("link", { name: "Зертхана", exact: true })
    .click();
  await page
    .locator("#lab")
    .getByRole("button", { name: "Нәтижеге өту" })
    .click();
  assert.match(await page.locator(".console pre").innerText(), /Max: 12/);
  const d = page.waitForEvent("download");
  await page
    .locator("#lab")
    .getByRole("button", { name: "5 .asm архиві" })
    .click();
  assert.equal((await d).suggestedFilename(), "mips-lab-5-programs.zip");
  assert.deepEqual(errors, []);
  console.log(
    "PASS production /soj1/: assets, bundled fonts, hash navigation, execution and ZIP download; no browser/network errors.",
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
