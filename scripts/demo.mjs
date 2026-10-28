#!/usr/bin/env node
// Reproducible demo for Glowup UI.
//
//   node scripts/demo.mjs prepare [dir]   Copy the untouched "before" app into a fresh git repo
//                                         so you can run /glowup-ui (Claude Code) or $glowup-ui (Codex) on it.
//   node scripts/demo.mjs screenshots     Build demo/before and demo/after, serve them locally, and capture
//                                         the README gallery into docs/screenshots (needs Playwright).
//   node scripts/demo.mjs test            Run the demo's behavior tests against both versions.

import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = path.join(ROOT, "demo");
const SKILL_SCRIPTS = path.join(ROOT, "skills", "glowup-ui", "scripts");
const OUT = path.join(ROOT, "docs", "screenshots");
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

export const DEMO_ROUTES = ["/", "/projects", "/projects/p2", "/team", "/settings", "/login", "/projects?simulate=empty", "/projects?simulate=error"];
const VARIANTS = { before: 4173, after: 4174 };
const COPY_SKIP = new Set(["node_modules", "dist", ".glowup", ".git", ".claude", ".agents"]);

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed in ${cwd}`);
}

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (COPY_SKIP.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

function ensureInstalled(dir) {
  if (!fs.existsSync(path.join(dir, "node_modules"))) run(NPM, ["ci", "--no-audit", "--no-fund"], dir);
}

async function waitFor(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function prepare(target) {
  const dest = path.resolve(target || path.join(ROOT, ".demo-work", "plotline"));
  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    console.error(`${dest} already exists and is not empty. Choose another directory or remove it yourself.`);
    return 1;
  }
  copyTree(path.join(DEMO, "before"), dest);
  run("git", ["init", "-q"], dest);
  run("git", ["add", "-A"], dest);
  run("git", ["-c", "user.name=glowup-demo", "-c", "user.email=demo@localhost", "commit", "-q", "-m", "Plotline baseline (before Glowup UI)"], dest);
  console.log(`
Prepared a fresh copy of the demo app in:
  ${dest}

It is its own git repo with one baseline commit, so you can review the redesign with git diff.

Next:
  cd ${dest}
  npm install
  # install the skill for this project (or use your user-level install):
  node ${path.join(ROOT, "bin", "glowup-ui.mjs")} install --agent both --scope project
  # then start your agent here and run:
  #   Claude Code:  /glowup-ui
  #   Codex:        $glowup-ui
`);
  return 0;
}

async function screenshots() {
  const servers = [];
  try {
    for (const [variant, port] of Object.entries(VARIANTS)) {
      const dir = path.join(DEMO, variant);
      ensureInstalled(dir);
      run(NPM, ["run", "build", "--silent"], dir);
      const server = spawn(NPM, ["run", "preview", "--", "--port", String(port), "--strictPort"], { cwd: dir, stdio: "ignore", shell: process.platform === "win32" });
      servers.push(server);
      await waitFor(`http://localhost:${port}/`);
      run(process.execPath, [
        path.join(SKILL_SCRIPTS, "screenshot.mjs"),
        "--base-url", `http://localhost:${port}`,
        "--routes", DEMO_ROUTES.join(","),
        "--label", variant,
        "--out", OUT,
        "--wait", "400",
      ], ROOT);
    }
    run(process.execPath, [path.join(SKILL_SCRIPTS, "compare.mjs"), "--out", OUT], ROOT);
    console.log(`\nOpen ${path.join(OUT, "compare.html")} to review.`);
    return 0;
  } finally {
    for (const s of servers) s.kill();
  }
}

function test() {
  for (const variant of Object.keys(VARIANTS)) {
    const dir = path.join(DEMO, variant);
    ensureInstalled(dir);
    console.log(`\n== demo/${variant} ==`);
    run(NPM, ["test", "--silent"], dir);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, arg] = process.argv.slice(2);
  const commands = { prepare: () => prepare(arg), screenshots, test };
  if (!commands[command]) {
    console.log("Usage: node scripts/demo.mjs <prepare [dir] | screenshots | test>");
    process.exit(command ? 64 : 0);
  }
  Promise.resolve(commands[command]())
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
