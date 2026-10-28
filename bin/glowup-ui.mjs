#!/usr/bin/env node
// glowup-ui CLI: install the skill for any Agent Skills-compatible coding agent, or validate a skill folder.

import path from "node:path";
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
  glowup-ui doctor [--project <dir>] [--json]

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
    console.log(`
Next: start a new agent session in your project, then ask for a redesign:
  Claude Code, VS Code (Copilot):  /glowup-ui
  Codex:                           $glowup-ui
  Any other agent:                 "Redesign this app's UI with the glowup-ui skill"

Agent without Agent Skills support? Point it at the file directly:
  "Read ${skillFile} and follow it to redesign this app's UI."`);
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
      const { values } = parseArgs({ args: rest, options: { project: { type: "string", default: process.cwd() }, json: { type: "boolean", default: false } } });
      const r = doctor({ project: values.project });
      console.log(values.json ? JSON.stringify(r, null, 2) : `Canonical: ${r.canonical.dir}\nPayload status: ${r.status}\n${r.installed.filter((c) => c.status !== "absent").map((c) => `${c.agent} ${c.scope}: ${c.dir} — ${c.status}, matches canonical: ${c.matchesCanonical}`).join("\n")}\n${r.conflicts.length ? `Conflicting copies: ${r.conflicts.join(", ")}\n` : ""}${r.activation}\n${r.limits}`);
      code = r.status === "payload-readable" ? 0 : 1;
    } catch (error) { console.error(error.message); code = 64; }
    break;
  }
  case undefined: case "help": case "--help": case "-h": console.log(HELP); code = 0; break;
  default: console.error(`Unknown command: ${command}\n\n${HELP}`); code = 64;
}
process.exit(code);
