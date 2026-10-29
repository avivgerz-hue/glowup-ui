#!/usr/bin/env node
// glowup-ui CLI: install the skill for any Agent Skills-compatible coding agent, or validate a skill folder.

import path from "node:path";
import fs from "node:fs";
import { parseArgs } from "node:util";
import { install, SKILL_SOURCE, TARGETS, AGENT_TARGETS } from "../lib/install.mjs";
import { validateSkill } from "../lib/validate.mjs";
import { doctor } from "../lib/doctor.mjs";
import { uninstall } from "../lib/uninstall.mjs";

const HELP = `glowup-ui — install or validate the Glowup UI agent skill

Usage:
  glowup-ui install [--agent <name>[,<name>...]] [--scope user|project] [--project <dir>]
                    [--dest <skills-dir>] [--dry-run] [--force] [--link] [--codex-legacy]
  glowup-ui validate [skill-dir]
  glowup-ui uninstall [--agent <name>] [--scope user|project] [--project <dir>] [--dry-run]
  glowup-ui where
  glowup-ui doctor [--project <dir>] [--json] [--help]

Agents (default: all):
  all        default shared + Claude paths; not a guarantee for every agent
  universal  .agents/skills  read by Codex, Gemini CLI, GitHub Copilot, OpenCode, Goose, Roo Code, Pi, Vibe
  claude     .claude/skills  read by Claude Code
  Agent names map to the folder they read: ${Object.keys(AGENT_TARGETS).filter((k) => !["all", "both", "universal", "agents"].includes(k)).join(", ")}

Scopes:
  user       ~/.agents/skills, ~/.claude/skills       (all your projects; default)
  project    <project>/.agents/skills, .claude/skills (commit it to share with your team)

Options:
  --dest <dir>     Install into any other agent's skills folder (creates <dir>/glowup-ui)
  --dry-run        Show what would happen without writing anything
  --force          Replace an existing different copy (moved to .glowup-ui/backups in the selected project or home)
  --link           Symlink to this checkout instead of copying (for contributors)
  --codex-legacy   Use $CODEX_HOME/skills (~/.codex/skills) instead of ~/.agents/skills

where prints the bundled source path, not an installed location.
Use doctor --project <app-dir> to inspect installed copies; it does not test activation.
`;

const INSTALL_OPTIONS = {
  agent: { type: "string", default: "all" },
  scope: { type: "string", default: "user" },
  project: { type: "string", default: process.cwd() },
  dest: { type: "string" },
  "dry-run": { type: "boolean", default: false },
  force: { type: "boolean", default: false },
  link: { type: "boolean", default: false },
  "codex-legacy": { type: "boolean", default: false },
  help: { type: "boolean", short: "h", default: false },
};

function runInstall(argv) {
  let values;
  try {
    ({ values } = parseArgs({ args: argv, options: INSTALL_OPTIONS }));
  } catch (error) {
    console.error(`${error.message}\n`);
    console.error(HELP);
    return 64;
  }
  if (values.help) {
    console.log(HELP);
    return 0;
  }
  return installWith(values);
}

function installWith(values) {
  let results;
  try {
    results = install({
      agent: values.agent,
      dest: values.dest,
      scope: values.scope,
      project: path.resolve(values.project),
      dryRun: values["dry-run"],
      force: values.force,
      link: values.link,
      codexLegacy: values["codex-legacy"],
    });
  } catch (error) {
    console.error(`${error.message}\n`);
    console.error(HELP);
    return 64;
  }

  let conflict = false;
  for (const r of results) {
    const tag = { install: "installed", link: "linked", replace: "replaced", "up-to-date": "unchanged", conflict: "SKIPPED" }[r.action];
    const shown = values["dry-run"] && !["up-to-date", "conflict"].includes(r.action) ? "dry-run" : tag;
    const readers = TARGETS[r.target]?.readBy.join(", ") ?? (r.target === "codex-legacy" ? "Codex" : "the agent that reads this folder");
    console.log(`[${shown}] ${r.message}\n           read by: ${readers}`);
    if (r.action === "conflict") conflict = true;
  }

  if (!values["dry-run"] && !conflict) {
    const skillFile = path.join(results[0].dir, "SKILL.md");
    const hints = [];
    const requested = values.agent.split(",").map(a => a.trim().toLowerCase());
    const shared = results.some(r => r.target === "agents");
    const broad = requested.some(a => ["all", "both", "universal", "agents"].includes(a));
    if (results.some(r => r.target === "claude")) hints.push("  Claude Code: /glowup-ui");
    if ((shared && (broad || requested.includes("codex"))) || results.some(r => r.target === "codex-legacy")) hints.push("  Codex: $glowup-ui");
    if (shared && (broad || requested.includes("opencode"))) hints.push('  OpenCode: ask its native skill tool to load glowup-ui.');
    console.log(`
Next: start a new agent session in the same project. For the host you installed for:
${hints.length ? hints.join("\n") : "  Explicitly request glowup-ui using that host's documented skill-loading mechanism."}
Installation is not activation proof. Verify successful full SKILL.md and relevant reference delivery in the host's tool transcript.

Agent without Agent Skills support? Point it at the file directly:
  "Read ${skillFile} and follow it to redesign this app's UI."
That is a manual file-reading fallback, not native skill activation.`);
  }
  return conflict ? 1 : 0;
}

function runValidate(argv) {
  const dir = argv[0] ? path.resolve(argv[0]) : SKILL_SOURCE;
  const result = validateSkill(dir);
  for (const w of result.warnings) console.log(`warning: ${w}`);
  for (const e of result.errors) console.error(`error: ${e}`);
  console.log(result.ok ? `✓ ${dir} is a valid skill` : `✗ ${dir} has ${result.errors.length} error(s)`);
  return result.ok ? 0 : 1;
}

function formatDoctor(r) {
  const present = r.installed.filter(c => c.status !== "absent");
  const lines = [`Canonical: ${r.canonical.dir}`, `Payload status: ${r.status}`];
  for (const c of present) {
    lines.push(`${c.agent} ${c.scope}: ${c.dir} — ${c.status}, matches canonical: ${c.matchesCanonical}`);
    if (c.detail) lines.push(`  ${c.detail}`);
    for (const error of c.errors || []) lines.push(`  error: ${error}`);
    for (const file of c.missingFiles || []) lines.push(`  missing payload file: ${file}`);
    for (const warning of c.warnings || []) lines.push(`  warning: ${warning}`);
  }
  if (r.conflicts.length) lines.push(`Conflicting copies: ${r.conflicts.join(", ")}`);
  for (const agent of new Set(present.map(c => c.agent))) {
    if (present.filter(c => c.agent === agent).length > 1) lines.push(`Multiple candidate locations for ${agent}; confirm host discovery and the selected version before removing any copy.`);
  }
  if (r.status === "not-installed") lines.push("No installation found in the inspected locations. Choose your agent and project scope with install --help, or check your host's custom skill roots.");
  if (r.status === "review") lines.push("Review local customizations and intended release first. Use the original installer's removal/reinstall procedure; do not force replacement or delete copies blindly.");
  lines.push(r.activation, r.limits);
  return lines.join("\n");
}

const [command, ...rest] = process.argv.slice(2);
let code;
switch (command) {
  case "uninstall": {
    try {
      const { force, link, ...options } = INSTALL_OPTIONS;
      const { values } = parseArgs({ args: rest, options });
      if (values.help) { console.log(HELP); code = 0; break; }
      const results = uninstall({ agent: values.agent, dest: values.dest, scope: values.scope, project: path.resolve(values.project), dryRun: values['dry-run'], codexLegacy: values['codex-legacy'] });
      for (const r of results) console.log(r.action === 'absent' ? `[absent] ${r.dir}` : `[${r.dryRun ? 'dry-run' : 'removed'}] ${r.dir} → backup ${r.backup}`);
      code = 0;
    } catch (error) { console.error(error.message); code = 1; }
    break;
  }
  case "install": code = runInstall(rest); break;
  case "validate": code = runValidate(rest); break;
  case "where": console.log(SKILL_SOURCE); code = 0; break;
  case "doctor": {
    try {
      const { values } = parseArgs({ args: rest, options: { project: { type: "string", default: process.cwd() }, json: { type: "boolean", default: false }, help: { type: "boolean", short: "h", default: false } } });
      if (values.help) { console.log(HELP); code = 0; break; }
      const project = path.resolve(values.project);
      let stat;
      try { stat = fs.statSync(project); }
      catch (error) {
        if (error.code === "ENOENT") throw new Error(`Project directory does not exist: ${project}. Choose the existing application root with --project.`);
        throw error;
      }
      if (!stat.isDirectory()) throw new Error(`Project path is not a directory: ${project}. Choose the application root with --project.`);
      const r = doctor({ project });
      console.log(values.json ? JSON.stringify(r, null, 2) : formatDoctor(r));
      code = r.status === "payload-readable" ? 0 : 1;
    } catch (error) { console.error(error.message); code = 64; }
    break;
  }
  case undefined: case "help": case "--help": case "-h": console.log(HELP); code = 0; break;
  default: console.error(`Unknown command: ${command}\n\n${HELP}`); code = 64;
}
process.exit(code);
