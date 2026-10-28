#!/usr/bin/env node
// Three existing app workflows; one is already designed. Controlled maintainer edits,
// not autonomous model runs or evidence of three independent designed-app successes.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sh, startPreview } from "./lib/proc.mjs";
import { SCENARIOS } from "./scenarios.mjs";
import { snapshot, check } from "../skills/glowup-ui/scripts/checkpoint.mjs";
import { capture, parseViewports, DEFAULT_VIEWPORTS } from "../skills/glowup-ui/scripts/screenshot.mjs";
import { improve } from "./lib/refine-edits.mjs";
import { review } from "../skills/glowup-ui/scripts/review.mjs";
import { parseArgs } from "node:util";
import { passedVitestTests } from "./lib/vitest-summary.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-quality-smoke-"));
const { values } = parseArgs({ options: { apps: { type: "string", default: "E,C,D" }, out: { type: "string" } } });
const out = values.out ? path.resolve(values.out) : path.join(here, "results/quality-smoke");
fs.mkdirSync(out, { recursive: true });
const ids = values.apps.split(",");
if (!ids.length || ids.some((id) => !["E", "C", "D"].includes(id)) || new Set(ids).size !== ids.length) throw new Error("--apps must select distinct E,C,D scenarios");
const result = { kind: "controlled REFINE exercises on existing fixtures; E is designed, C/D are plain", selected: ids, createdAt: new Date().toISOString(), node: process.version, apps: [], pass: false };
fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result));
const viewports = parseViewports(DEFAULT_VIEWPORTS);


try {
  for (const id of ids) {
    const scenario = SCENARIOS[id], cwd = path.join(root, id), target = path.join(out, id);
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(path.join(here, "fixtures", scenario.fixture), cwd, { recursive: true });
    const run = (args) => { const r = sh("npm", args, { cwd }); if (r.status !== 0) throw new Error(`${id}: npm ${args.join(" ")} failed:\n${r.out}`); return r; };
    run(["ci", "--no-audit", "--no-fund"]);
    const baseline = snapshot(cwd), phases = {};
    for (const label of ["before", "after"]) {
      if (label === "after") improve(cwd, id);
      const tests = run(["test"]); run(["run", "build"]);
      fs.writeFileSync(path.join(target, `${label}-tests.txt`), tests.out.trimEnd() + "\n");
      const server = await startPreview(cwd, 4497);
      try { phases[label] = await capture({ baseUrl: server.url, routes: scenario.routes, viewports, label, outDir: target }); }
      finally { server.stop(); }
      phases[label].testsPassed = passedVitestTests(tests.out);
    }
    const preservation = check(cwd, baseline), comparison = review(phases.after, phases.before);
    fs.writeFileSync(path.join(target, "review.json"), JSON.stringify(comparison, null, 2) + "\n");
    const expectedTests = { C: 14, D: 11, E: 12 }[id];
    const entry = { id, name: scenario.title, fixture: scenario.fixture, beforeTests: phases.before.testsPassed, afterTests: phases.after.testsPassed, beforeCaptures: phases.before.shots.length, afterCaptures: phases.after.shots.length, preservation, review: { ok: comparison.ok, regressions: comparison.regressions, coverage: comparison.coverage, improvements: comparison.improvements, blockers: comparison.blockers }, pass: preservation.ok && comparison.ok && phases.before.testsPassed === expectedTests && phases.after.testsPassed === expectedTests };
    result.apps.push(entry);
    fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n");
  }
  result.pass = result.apps.length === ids.length && result.apps.every((a) => a.pass);
  result.limitations = "Only Plotline starts with a designed identity. Helpdesk and spa are plain fixtures. These are controlled surgical edits, not autonomous same-model runs, blind human judgments, or cost/speed comparisons. Existing review findings remain visible.";
} catch (error) { result.error = error.message; }
finally { fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n"); fs.rmSync(root, { recursive: true, force: true }); }
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
