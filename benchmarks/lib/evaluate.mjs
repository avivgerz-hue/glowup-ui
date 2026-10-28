// Evaluate one finished run's workspace the same way for every condition:
// build, tests (authoritative fixture tests for redesigns), a preview server, screenshots,
// accessibility and layout probes, scripted user flows, and before/after pixel difference.

import fs from "node:fs";
import { check } from "../../skills/glowup-ui/scripts/checkpoint.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sh, startPreview } from "./proc.mjs";
import { probe, summarizeProbe } from "./probe.mjs";
import { runFlow, firstProductRoute } from "./flows.mjs";
import { pixelDiffs } from "./diff.mjs";
import { capture, parseViewports, DEFAULT_VIEWPORTS, routeSlug } from "../../skills/glowup-ui/scripts/screenshot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(HERE, "..", "fixtures");
const IGNORED = /^(node_modules|dist|\.glowup|\.claude|\.agents|tools|package-lock\.json)(\/|$)/;
const STANDARD_DEPS = /^(react|react-dom|react-router(-dom)?|vite|@vitejs\/plugin-react(-swc)?|tailwindcss|@tailwindcss\/vite|vitest|jsdom|happy-dom|@testing-library\/.*|typescript|@types\/.*|eslint.*|@eslint\/.*|globals|typescript-eslint|prettier|postcss|autoprefixer)$/;

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } }

function parseVitest(raw) {
  const out = raw.replace(/\u001b\[[0-9;]*m/g, "");
  const tests = out.match(/Tests\s+(?:(\d+) failed \|\s*)?(\d+) passed/);
  const failedOnly = out.match(/Tests\s+(\d+) failed/);
  if (tests) return { passed: Number(tests[2]), failed: Number(tests[1] || 0) };
  if (failedOnly) return { passed: 0, failed: Number(failedOnly[1]) };
  return { passed: 0, failed: 0, noTests: /no test files found|No test files/i.test(out) };
}

function gitChanged(workspace) {
  const r = sh("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: workspace });
  const files = r.out.split("\n").filter(Boolean).map((l) => l.slice(3).trim()).filter((f) => !IGNORED.test(f));
  return files;
}

export function dependencyReport(workspace, kind) {
  const now = readJson(path.join(workspace, "package.json")) || {};
  const names = (p) => Object.keys({ ...(p?.dependencies || {}), ...(p?.devDependencies || {}) });
  const current = names(now);
  if (kind === "transform") {
    const before = readJson(path.join(workspace, ".bench-baseline-package.json"));
    const prev = new Set(names(before));
    return { added: current.filter((d) => !prev.has(d)), total: current.length };
  }
  return { added: current.filter((d) => !STANDARD_DEPS.test(d)), total: current.length };
}

export async function ensureBefore(scenario, resultsDir, port, workRoot) {
  const dir = path.join(resultsDir, scenario.id, "before");
  if (fs.existsSync(path.join(dir, "manifest.json"))) return dir;
  const ws = path.join(workRoot, `before-${scenario.id}`);
  fs.rmSync(ws, { recursive: true, force: true });
  fs.cpSync(path.join(FIXTURES, scenario.fixture), ws, { recursive: true });
  sh("npm", ["ci", "--no-audit", "--no-fund"], { cwd: ws });
  sh("npm", ["run", "build"], { cwd: ws });
  const server = await startPreview(ws, port);
  try {
    await capture({ baseUrl: server.url, routes: scenario.routes, viewports: parseViewports(DEFAULT_VIEWPORTS), label: "before", outDir: path.join(resultsDir, scenario.id), fullPage: true, extraWait: 400 });
  } finally { server.stop(); }
  return dir;
}

export async function evaluate({ workspace, scenario, outDir, port, resultsDir }) {
  const ev = { scenario: scenario.id, kind: scenario.kind };
  const t0 = Date.now();

  if (scenario.kind === "transform") {
    const baseline = readJson(path.join(workspace, ".glowup/checkpoint.json"));
    ev.preservation = baseline ? check(workspace, baseline) : { unverified: "No starting-state checkpoint for this historical run" };
    const fixtureTests = path.join(FIXTURES, scenario.fixture, "tests");
    const agentTests = path.join(workspace, "tests");
    const same = (() => {
      try { return sh("diff", ["-rq", fixtureTests, agentTests]).status === 0; } catch { return false; }
    })();
    ev.testsModifiedByAgent = !same;
    fs.rmSync(agentTests, { recursive: true, force: true });
    fs.cpSync(fixtureTests, agentTests, { recursive: true });
  }

  if (!fs.existsSync(path.join(workspace, "node_modules"))) sh("npm", ["install", "--no-audit", "--no-fund"], { cwd: workspace, timeout: 600000 });
  const build = sh("npm", ["run", "build"], { cwd: workspace, timeout: 600000 });
  ev.build = { pass: build.status === 0, tail: build.status === 0 ? undefined : build.out.slice(-400) };
  const test = sh("npm", ["test"], { cwd: workspace, timeout: 300000 });
  ev.tests = { pass: test.status === 0, ...parseVitest(test.out), tail: test.status === 0 ? undefined : test.out.slice(-400) };

  ev.changedFiles = gitChanged(workspace);
  ev.deps = dependencyReport(workspace, scenario.kind);
  if (scenario.kind === "create") {
    const src = path.join(workspace, "src");
    const count = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : /\.(jsx?|tsx?|css)$/.test(e.name) ? 1 : 0), 0) : 0;
    ev.sourceFiles = count(src);
  }
  const dist = path.join(workspace, "dist");
  const size = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0) : 0;
  ev.distKB = Math.round(size(dist) / 1024);

  if (!ev.build.pass) { ev.skippedBrowserChecks = "build failed"; ev.evalSeconds = Math.round((Date.now() - t0) / 1000); return ev; }

  let server;
  try {
    server = await startPreview(workspace, port);
    const routes = [...scenario.routes];
    if (scenario.flow === "store") {
      const first = await firstProductRoute(server.url);
      if (first) routes.splice(2, 0, first);
    }
    ev.routes = routes;
    const shots = await capture({ baseUrl: server.url, routes, viewports: parseViewports(DEFAULT_VIEWPORTS), label: "after", outDir: path.join(outDir, "screens"), fullPage: true, extraWait: 500 });
    ev.screenshotsOk = shots.shots.filter((s) => s.status === "ok").length;
    ev.screenshotsTotal = shots.shots.length;
    const rows = await probe({ baseUrl: server.url, routes });
    ev.probe = summarizeProbe(rows);
    fs.writeFileSync(path.join(outDir, "probe-rows.json"), JSON.stringify(rows, null, 2));
    if (scenario.flow) ev.flow = await runFlow(scenario.flow, server.url);
    if (scenario.kind === "transform") {
      const beforeDir = path.join(resultsDir, scenario.id, "before");
      const pairs = [];
      for (const route of scenario.routes) for (const vp of ["desktop", "mobile"]) {
        const f = `${vp}/${routeSlug(route)}.png`;
        pairs.push({ key: `${vp} ${route}`, before: path.join(beforeDir, f), after: path.join(outDir, "screens", "after", f) });
      }
      const diffs = await pixelDiffs(pairs);
      ev.transformation = {
        meanChangedFraction: Math.round((diffs.reduce((n, d) => n + (d.changedFraction || 0), 0) / diffs.length) * 1000) / 1000,
        perPage: diffs,
      };
    }
  } catch (error) {
    ev.browserError = String(error.message).slice(0, 300);
  } finally {
    server?.stop();
  }
  ev.evalSeconds = Math.round((Date.now() - t0) / 1000);
  return ev;
}
