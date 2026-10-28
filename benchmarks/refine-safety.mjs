#!/usr/bin/env node
// Controlled mutations on a designed app, not agent runs or visual-quality scores.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { snapshot, check } from "../skills/glowup-ui/scripts/checkpoint.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-refine-safety-"));
const started = performance.now();
const cases = [];
const out = path.join(here, "results/refine-safety");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "result.json"), JSON.stringify({ status: "running", pass: false }) + "\n");
try {
  fs.cpSync(path.join(here, "fixtures/plotline-designed"), root, { recursive: true });
  const baseline = snapshot(root);
  const run = (name, file, change, expectClean) => {
    const target = path.join(root, file), original = fs.readFileSync(target, "utf8");
    const edited = change(original);
    if (edited === original) throw new Error(`Mutation did not execute: ${name}`);
    fs.writeFileSync(target, edited);
    try {
      const report = check(root, baseline);
      cases.push({ name, expected: expectClean ? "pass" : "review", actual: report.ok ? "pass" : "review", pass: report.ok === expectClean, failures: report.failures.length, warnings: report.warnings.length });
    } finally { fs.writeFileSync(target, original); }
  };
  run("Bounded touch-target improvement", "src/components/Layout.jsx", (s) => s.replace("min-h-10 items-center gap-1.5", "min-h-11 min-w-11 justify-center items-center gap-1.5"), true);
  run("Replaced brand palette", "src/index.css", (s) => s.replace("--color-vermilion: #d6451f", "--color-vermilion: #245bba"), false);
  run("Replaced display font", "src/index.css", (s) => s.replace('"Fraunces Variable"', '"Inter"'), false);
  run("Removed brand mark", "src/components/Layout.jsx", (s) => s.replace('<LogoMark size={28} />', ''), false);
  run("Stacked a second global header", "src/components/Layout.jsx", (s) => s.replace('<Outlet />', '<header /><Outlet />'), false);
  run("Recolored inline logo in a shared icon module", "src/components/Icon.jsx", (s) => s.replace('fill="#d6451f"', 'fill="#245bba"'), false);
  run("Lost form submit handler", "src/pages/Settings.jsx", (s) => s.replace('onSubmit={submit}', ''), false);
  run("Modified original test", "tests/behavior.test.jsx", (s) => s + '\n// changed test\n', false);
  run("Changed dependencies", "package.json", (s) => s.replace('"react":', '"unrequested-library":'), false);
  run("Lost one avatar", "src/components/ProjectTable.jsx", (s) => s.replace('<Avatar initials={owner?.initials ?? "??"} size={24} />', ''), false);
  run("Changed application data", "src/data.js", (s) => s + '\n// changed data\n', false);
  const result = { kind: "controlled-mutation benchmark; no agent run", fixture: "plotline-designed (derived from demo/after)", node: process.version, createdAt: new Date().toISOString(), milliseconds: Math.round(performance.now() - started), passed: cases.filter((c) => c.pass).length, total: cases.length, cases, limitations: "One app, controlled source mutations. Does not establish visual improvement, runtime preservation, model cost/speed, or three-app REFINE quality." };
  fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.passed === result.total ? 0 : 1;
} finally { fs.rmSync(root, { recursive: true, force: true }); }
