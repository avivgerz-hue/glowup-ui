#!/usr/bin/env node
// Reproducible, bounded REFINE exercise on one real demo app. No model/cost claims.
// Run with Node 22; npm ci uses the fixture's unchanged lockfile.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { snapshot, check } from "../skills/glowup-ui/scripts/checkpoint.mjs";
import { capture, parseViewports, DEFAULT_VIEWPORTS, loadPlaywright, browserOptions } from "../skills/glowup-ui/scripts/screenshot.mjs";
import { SCENARIOS } from "./scenarios.mjs";
import { sh, startPreview } from "./lib/proc.mjs";
import { probe, summarizeProbe } from "./lib/probe.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-refine-smoke-"));
const out = path.join(here, "results/refine-smoke");
fs.mkdirSync(out, { recursive: true });
const result = { kind: "bounded manual REFINE exercise; not an autonomous agent benchmark", node: process.version, createdAt: new Date().toISOString(), fixture: "plotline-designed", phases: {} };
// An interrupted run must not leave an older passing result looking current.
fs.writeFileSync(path.join(out, "result.json"), JSON.stringify({ ...result, status: "running", pass: false }, null, 2) + "\n");
const run = (args) => {
  const r = sh("npm", args, { cwd: root });
  if (r.status !== 0) throw new Error(`npm ${args.join(" ")} failed:\n${r.out}`);
  return r;
};
async function measure(label) {
  run(["run", "build"]);
  const tests = run(["test"]);
  fs.writeFileSync(path.join(out, `${label}-tests.txt`), tests.out.trimEnd() + "\n");
  const server = await startPreview(root, 4493);
  try {
    const screens = await capture({ baseUrl: server.url, routes: SCENARIOS.E.routes, viewports: parseViewports(DEFAULT_VIEWPORTS), label, outDir: out });
    const rows = await probe({ baseUrl: server.url, routes: SCENARIOS.E.routes });
    fs.writeFileSync(path.join(out, `${label}-probe.json`), JSON.stringify(rows, null, 2) + "\n");
    const pw = await loadPlaywright(), browser = await pw.chromium.launch(browserOptions());
    const targets = [];
    try {
      for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(server.url);
        const logout = page.getByRole("link", { name: "Log out" });
        const box = await logout.boundingBox();
        const headers = await page.locator("body header").count();
        const chart = page.locator(".overflow-x-auto");
        const chartKeyboardFocusable = await chart.evaluate((el) => el.tabIndex === 0);
        let chartKeyboardScroll = null;
        if (width === 390 && chartKeyboardFocusable) {
          await chart.focus();
          await page.keyboard.press("ArrowRight");
          await page.waitForTimeout(250);
          chartKeyboardScroll = await chart.evaluate((el) => el.scrollLeft > 0);
        }
        await logout.focus();
        await page.keyboard.press("Enter");
        await page.waitForURL("**/login");
        await page.getByLabel("Email").fill("ana@plotline.test");
        await page.getByLabel("Password").fill("secret");
        await page.getByRole("button", { name: "Log in" }).click();
        await page.waitForURL(server.url + "/");
        targets.push({ width, logout: { width: box.width, height: box.height }, headers, chartKeyboardFocusable, chartKeyboardScroll, keyboardLogoutAndLogin: true });
        await page.close();
      }
    } finally { await browser.close(); }
    return { testsPassed: Number(tests.out.match(/Tests\s+(\d+) passed/)?.[1] || 0), build: true, captures: screens.shots.length, captureFailures: screens.shots.filter((s) => s.status !== "ok").length, probe: summarizeProbe(rows), targets };
  } finally { server.stop(); }
}

try {
  fs.cpSync(path.join(here, "fixtures/plotline-designed"), root, { recursive: true });
  run(["ci", "--no-audit", "--no-fund"]);
  const baseline = snapshot(root);
  result.phases.before = await measure("before");
  // One evidenced weakness: the logout control is 40px high and narrower on phones.
  // Keep its content, handler, target, icon, palette, typography, and surrounding shell.
  const file = path.join(root, "src/components/Layout.jsx");
  const original = fs.readFileSync(file, "utf8");
  const improved = original.replace("min-h-10 items-center gap-1.5", "min-h-11 min-w-11 justify-center items-center gap-1.5");
  if (original === improved) throw new Error("Expected logout control was not found");
  fs.writeFileSync(file, improved);
  const dashboard = path.join(root, "src/pages/Dashboard.jsx");
  const dashboardBefore = fs.readFileSync(dashboard, "utf8");
  const dashboardAfter = dashboardBefore.replace('<div className="overflow-x-auto">', '<div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby="line-title">');
  if (dashboardBefore === dashboardAfter) throw new Error("Expected chart scroll container was not found");
  fs.writeFileSync(dashboard, dashboardAfter);
  result.preservation = check(root, baseline);
  result.phases.after = await measure("after");
  const { before, after } = result.phases;
  result.pass = result.preservation.ok && before.testsPassed === 12 && after.testsPassed === 12 && before.captures === 16 && after.captures === 16 && !after.captureFailures && !after.probe.pagesFailedToLoad && after.probe.pagesWithConsoleErrors <= before.probe.pagesWithConsoleErrors && after.targets.every((t) => t.logout.height >= 44 && t.logout.width >= 44 && t.headers === 1 && t.keyboardLogoutAndLogin && t.chartKeyboardFocusable && (t.width !== 390 || t.chartKeyboardScroll)) && after.probe.axeSerious < before.probe.axeSerious && after.probe.axeCritical <= before.probe.axeCritical && after.probe.mobileOverflowPages <= before.probe.mobileOverflowPages && after.probe.desktopOverflowPages <= before.probe.desktopOverflowPages;
  result.limitations = "One designed app and two bounded improvements, performed by the maintainer agent. This is not three independent apps, a blind quality review, or a same-model cost comparison.";
} catch (error) { result.pass = false; result.error = error.message; }
finally {
  fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n");
  fs.rmSync(root, { recursive: true, force: true });
}
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
