#!/usr/bin/env node
// Run one benchmark cell: a clean workspace, one coding-agent run, then evaluation.
//   node benchmarks/run.mjs --scenario C --condition current [--label current-r1] [--port 4311] [--eval-only]
// Workspaces live in $BENCH_WORK (default: <tmp>/glowup-bench). Results go to benchmarks/results/<scenario>/<label>/.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { SCENARIOS, CONDITIONS, MODEL, EFFORT, BUDGET_USD, TIMEOUT_MS, ALLOWED_TOOLS, buildPrompt } from "./scenarios.mjs";
import { parseTranscript } from "./lib/metrics.mjs";
import { evaluate, ensureBefore } from "./lib/evaluate.mjs";
import { sh } from "./lib/proc.mjs";
import { snapshot } from "../skills/glowup-ui/scripts/checkpoint.mjs";
import { hashDir } from "../lib/install.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const RESULTS = path.join(HERE, "results");

const { values: a } = parseArgs({ options: {
  scenario: { type: "string" }, condition: { type: "string" }, label: { type: "string" },
  port: { type: "string", default: "4311" }, "eval-only": { type: "boolean", default: false }, "dry-run": { type: "boolean", default: false },
} });
const scenario = SCENARIOS[a.scenario];
const condition = CONDITIONS[a.condition];
if (!scenario || !condition) { console.error("Usage: run.mjs --scenario A|B|C|D|E --condition baseline|current [--label x] [--port N] [--eval-only]"); process.exit(64); }
const label = a.label || a.condition;
const port = Number(a.port);
const workRoot = process.env.BENCH_WORK || path.join(os.tmpdir(), "glowup-bench");
const ws = path.join(workRoot, `${scenario.id}-${label}`);
const outDir = path.join(RESULTS, scenario.id, label);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(workRoot, { recursive: true });

function installSkill() {
  if (!condition.skill) return null;
  const dest = path.join(ws, ".claude", "skills", "glowup-ui");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(path.join(REPO, "skills", "glowup-ui"), dest, { recursive: true });
  return hashDir(dest).slice(0, 12);
}

function prepareWorkspace() {
  fs.rmSync(ws, { recursive: true, force: true });
  fs.mkdirSync(ws, { recursive: true });
  if (scenario.kind === "transform") {
    fs.cpSync(path.join(HERE, "fixtures", scenario.fixture), ws, { recursive: true });
    sh("npm", ["ci", "--no-audit", "--no-fund"], { cwd: ws, timeout: 600000 });
    fs.copyFileSync(path.join(ws, "package.json"), path.join(ws, ".bench-baseline-package.json"));
  }
  fs.mkdirSync(path.join(ws, "tools"), { recursive: true });
  // Every condition receives identical capture tooling from this checkout.
  for (const f of ["screenshot.mjs", "compare.mjs", "discover.mjs", "measure.mjs"])
    fs.copyFileSync(path.join(REPO, "skills", "glowup-ui", "scripts", f), path.join(ws, "tools", f));
  const skillHash = installSkill();
  fs.writeFileSync(path.join(ws, ".gitignore"), "node_modules\ndist\n.glowup\n.bench-baseline-package.json\n");
  sh("git", ["init", "-q"], { cwd: ws });
  sh("git", ["add", "-A"], { cwd: ws });
  sh("git", ["-c", "user.name=bench", "-c", "user.email=bench@localhost", "commit", "-q", "-m", "baseline"], { cwd: ws });
  fs.mkdirSync(path.join(ws, ".glowup"), { recursive: true });
  fs.writeFileSync(path.join(ws, ".glowup/checkpoint.json"), JSON.stringify(snapshot(ws)));
  return skillHash;
}

function runAgent(prompt) {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(path.join(outDir, "run.jsonl"));
    const err = fs.createWriteStream(path.join(outDir, "run.err"));
    const args = ["-p", prompt, "--model", MODEL, "--effort", EFFORT, "--max-budget-usd", String(BUDGET_USD),
      "--permission-mode", "default", "--allowedTools", ...ALLOWED_TOOLS, "--output-format", "stream-json", "--verbose"];
    const child = spawn("claude", args, { cwd: ws, timeout: TIMEOUT_MS, killSignal: "SIGKILL", detached: true });
    child.stdout.pipe(out);
    child.stderr.pipe(err);
    const started = Date.now();
    // `claude -p` keeps running while the agent's background servers live. The first result event
    // is the end of the agent's work, so finish shortly after it and clean up leftovers.
    let finishing = false;
    child.stdout.on("data", (chunk) => {
      if (finishing || !chunk.includes('"type":"result"')) return;
      finishing = true;
      setTimeout(() => { try { process.kill(-child.pid, "SIGTERM"); } catch { /* already exited */ } }, 4000);
    });
    child.on("close", (code, signal) => {
      sh("pkill", ["-f", `vite preview --port ${port}`]);
      resolve({ exitCode: code, signal, wallSec: Math.round((Date.now() - started) / 1000) });
    });
  });
}

const meta = { scenario: scenario.id, label, condition: a.condition, model: MODEL, effort: EFFORT, budgetUsd: BUDGET_USD, port, startedAt: new Date().toISOString() };
if (!a["eval-only"]) {
  meta.skillHash = prepareWorkspace();
  if (scenario.kind === "transform") await ensureBefore(scenario, RESULTS, port + 500, workRoot);
  const prompt = buildPrompt(scenario, a.condition, port);
  fs.writeFileSync(path.join(outDir, "prompt.txt"), prompt);
  if (a["dry-run"]) {
    console.log(`[${scenario.id}/${label}] dry run: workspace prepared at ${ws}, agent skipped`);
    meta.dryRun = true;
  } else {
    console.log(`[${scenario.id}/${label}] running agent in ${ws}`);
    Object.assign(meta, await runAgent(prompt));
  }
  console.log(`[${scenario.id}/${label}] agent finished: exit=${meta.exitCode} signal=${meta.signal} wall=${meta.wallSec}s`);
} else {
  Object.assign(meta, JSON.parse(fs.readFileSync(path.join(outDir, "meta.json"), "utf8")));
}
fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2));

if (a["dry-run"]) process.exit(0); // A prepared workspace is not an evaluated agent run.

const metrics = fs.existsSync(path.join(outDir, "run.jsonl")) ? parseTranscript(path.join(outDir, "run.jsonl"), ws) : null;
fs.writeFileSync(path.join(outDir, "metrics.json"), JSON.stringify(metrics, null, 2));
if (scenario.kind === "transform") await ensureBefore(scenario, RESULTS, port + 500, workRoot);
const ev = await evaluate({ workspace: ws, scenario, outDir, port: port + 1000, resultsDir: RESULTS });
fs.writeFileSync(path.join(outDir, "eval.json"), JSON.stringify(ev, null, 2));
fs.writeFileSync(path.join(outDir, "final-message.md"), metrics?.finalMessage || "(no final message)");
console.log(`[${scenario.id}/${label}] evaluated: build=${ev.build?.pass} tests=${JSON.stringify(ev.tests?.passed)}/${ev.tests?.failed}f flow=${ev.flow ? `${ev.flow.passed}/${ev.flow.total}` : "n/a"} cost=$${metrics?.costUsd} time=${metrics?.durationSec}s`);
