#!/usr/bin/env node
// Live browser contract for rendered design checks, independent of any app/model.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPlaywright, browserOptions } from "../skills/glowup-ui/scripts/screenshot.mjs";
import { measurePage } from "../skills/glowup-ui/scripts/measure.mjs";
import { review } from "../skills/glowup-ui/scripts/review.mjs";
import { capture, parseViewports } from "../skills/glowup-ui/scripts/screenshot.mjs";
import { createServer } from "node:http";
import os from "node:os";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "results/review-browser");
fs.mkdirSync(out, { recursive: true });
const result = { createdAt: new Date().toISOString(), kind: "live Chromium measurement contracts, not aesthetic scores", pass: false, assertions: [] };
fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result));
let browser;
try {
  const pw = await loadPlaywright();
  if (!pw) throw new Error("Playwright is required for this opt-in browser check");
  browser = await pw.chromium.launch(browserOptions());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.setContent(`<style>body{background:white;color:black;font-family:Arial} p{color:#aaa} button,input{min-height:44px}</style><header>Workspace</header><main><header><h1>Projects</h1></header><label>Email<input value="PRIVATE-FORM-VALUE"></label><button>Save changes</button><p>Readable status text</p><div id="chart" style="overflow:auto;width:100px"><div style="width:300px">Chart</div></div></main>`);
  const before = await page.evaluate(measurePage);
  const expect = (name, condition) => { assert.ok(condition, name); result.assertions.push(name); };
  expect("Page header inside main is not mistaken for duplicate global chrome", before.globalHeaders === 1);
  expect("Simple low contrast is detected", before.contrast.failures.some((f) => f.ratio < 3));
  expect("Noninteractive scroll region is detected", before.scrollRegions.some((r) => !r.keyboard));
  expect("Labelled inputs are named without reading field values", before.unnamedControls === 0 && !JSON.stringify(before).includes("PRIVATE-FORM-VALUE"));
  const shot = (measurements) => ({ route: "/", viewport: "mobile", width: 390, height: 844, status: "ok", overflowX: false, measurements });
  await page.evaluate(() => { document.querySelector("p").style.color = "#333"; document.querySelector("#chart").tabIndex = 0; });
  const after = await page.evaluate(measurePage);
  const improved = review({ shots: [shot(after)] }, { shots: [shot(before)] });
  expect("Contrast and keyboard fixes register as improvements", improved.ok && improved.improvements.some((f) => f.kind === "text-contrast") && improved.improvements.some((f) => f.kind === "keyboard-scroll"));
  await page.evaluate(() => { document.querySelector("p").style.color = "oklch(0.7 0 0)"; });
  const modern = await page.evaluate(measurePage);
  expect("Modern CSS colors are checked through the browser color parser", modern.contrast.failures.some((f) => f.text === "Readable status text" && f.ratio < 3));
  await page.evaluate(() => { document.querySelector("p").style.color = "#333"; });
  await page.evaluate(() => { document.querySelector("button").remove(); const header = document.createElement("header"); header.textContent = "Duplicate navigation"; document.body.prepend(header); });
  const worse = review({ shots: [shot(await page.evaluate(measurePage))] }, { shots: [shot(after)] });
  expect("Deleted action is a rendered regression", worse.regressions.some((f) => f.kind === "lost-controls"));
  expect("Stacked global header is a rendered regression", worse.regressions.some((f) => f.kind === "duplicate-header"));
  await page.evaluate(() => { document.body.style.backgroundImage = "linear-gradient(white, gray)"; });
  const unknown = await page.evaluate(measurePage);
  expect("Unsupported backgrounds are reported as unverified", unknown.contrast.unverified > 0 && unknown.contrast.checked === 0);
  expect("Loss of contrast coverage requires review", review({ shots: [shot(unknown)] }, { shots: [shot(after)] }).regressions.some((f) => f.kind === "contrast-coverage"));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-polling-"));
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/tick" ? "application/json" : "text/html");
    res.end(req.url === "/tick" ? "{}" : '<main><script>setInterval(()=>fetch("/tick"),20);setTimeout(()=>{const h=document.createElement("h1");h.id="ready";h.textContent="Ready";document.querySelector("main").append(h)},100)</script></main>');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const m = await capture({ baseUrl: `http://127.0.0.1:${server.address().port}`, routes: ["/"], viewports: parseViewports("mobile=390x844"), label: "polling", outDir: dir, readySelector: "#ready", timeout: 1500, extraWait: 0 });
    expect("Capture waits for explicit readiness without requiring network idle", m.shots[0].status === "ok" && m.shots[0].measurements.headings[0].text === "Ready");
  } finally { await new Promise((resolve) => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); }
  result.pass = true;
} catch (error) { result.error = error.message; }
finally { await browser?.close(); fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n"); }
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
