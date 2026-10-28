#!/usr/bin/env node
// Check that real agent CLIs discover the skill. Installs into a throwaway project and
// home directory (nothing on your machine is touched), then asks each agent CLI found on
// PATH (or in --bin-dir) to list its skill metadata. Activation is not tested.
//
//   node scripts/check-agents.mjs [--bin-dir node_modules/.bin]
//
// Agents checked: codex, gemini, copilot, opencode. Claude uses the separate activation probe. Missing CLIs are reported as skipped.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { install } from "../lib/install.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { values } = parseArgs({ options: { "bin-dir": { type: "string" } } });

function findBin(name) {
  const dirs = [values["bin-dir"], ...(process.env.PATH || "").split(path.delimiter)].filter(Boolean);
  const exts = process.platform === "win32" ? [".cmd", ".exe", ""] : [""];
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.resolve(dir, name + ext);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function run(bin, args, { cwd, home, timeout = 120_000 }) {
  const env = { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex"), XDG_CONFIG_HOME: path.join(home, ".config"), XDG_DATA_HOME: path.join(home, ".local", "share") };
  const r = spawnSync(bin, args, { cwd, env, encoding: "utf8", timeout, shell: process.platform === "win32" });
  return r.status === 0 && !r.error ? `${r.stdout || ""}\n${r.stderr || ""}` : "";
}

// Each check lists skills from one scope and reports whether glowup-ui appeared.
const CHECKS = {
  codex: (bin, ctx) => / glowup-ui enabled=true/.test(run(process.execPath, [path.join(ROOT, "scripts", "codex-skills-list.mjs"), bin, ctx.cwd], ctx)),
  gemini: (bin, ctx) => /^glowup-ui \[Enabled\]/m.test(run(bin, ["skills", "list"], ctx)),
  copilot: (bin, ctx) => /^\s+glowup-ui - /m.test(run(bin, ["skill", "list"], ctx)),
  opencode: (bin, ctx) => /"name": "glowup-ui"/.test(run(bin, ["debug", "skill"], ctx)),
};
const NOTES = {};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-agents-"));
const project = path.join(tmp, "project");
const emptyDir = path.join(tmp, "elsewhere");
const projectHome = path.join(tmp, "home-project");
const userHome = path.join(tmp, "home-user");
for (const d of [project, emptyDir, projectHome, path.join(userHome, ".codex"), path.join(projectHome, ".codex"), path.join(projectHome, ".gemini")]) fs.mkdirSync(d, { recursive: true });
spawnSync("git", ["init", "-q"], { cwd: project });

// Project scope: skill in <project>/.agents/skills and .claude/skills, empty home.
install({ agent: "all", scope: "project", project, home: projectHome });
// Gemini CLI ignores workspace skills in folders the user hasn't trusted.
fs.writeFileSync(path.join(projectHome, ".gemini", "trustedFolders.json"), JSON.stringify({ [project]: "TRUST_FOLDER" }));
// User scope: skill in ~/.agents/skills and ~/.claude/skills, run from an unrelated folder.
install({ agent: "all", scope: "user", home: userHome });

let failed = 0;
console.log(`Throwaway workspace: ${tmp}\nDiscovery metadata only; activation NOT TESTED.\nClaude: skipped (use scripts/test-activation.mjs; a yes/no name question is insufficient).`);
for (const [agent, check] of Object.entries(CHECKS)) {
  const bin = findBin(agent);
  if (!bin) {
    console.log(`- ${agent.padEnd(9)} skipped (CLI not found)`);
    continue;
  }
  const projectOk = check(bin, { cwd: project, home: projectHome });
  const userOk = agent === "claude" ? null : check(bin, { cwd: emptyDir, home: userHome });
  const show = (ok) => (ok === null ? "not checked" : ok ? "found" : "NOT FOUND");
  if (!projectOk || userOk === false) failed++;
  console.log(`${projectOk && userOk !== false ? "✓" : "✗"} ${agent.padEnd(9)} project: ${show(projectOk)}, user: ${show(userOk)}${NOTES[agent] ? `  (${NOTES[agent]})` : ""}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
