// Install the canonical skill folder where coding agents look for Agent Skills.
// Never overwrites silently: an existing, different copy is left alone unless
// --force is given, and then it is moved to a backup outside any skills folder
// (so agents don't load two copies).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const SKILL_NAME = "glowup-ui";
export const SKILL_SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "skills", SKILL_NAME);
const SKIP = new Set([".DS_Store", "Thumbs.db", "node_modules", ".glowup"]);

/**
 * Skill folders and the agents that read them, per each agent's own docs (see docs/compatibility.md).
 * Default locations cover the verified shared-path clients plus Claude Code:
 * - agents: the cross-agent convention from the Agent Skills client guide (.agents/skills).
 * - claude: Claude Code reads only .claude/skills.
 */
export const TARGETS = {
  agents: {
    dir: ".agents/skills",
    readBy: ["Codex", "Gemini CLI", "GitHub Copilot", "OpenCode", "Goose", "Roo Code", "Pi", "Mistral Vibe"],
  },
  claude: {
    dir: ".claude/skills",
    readBy: ["Claude Code"],
  },
};

// Agent names users may type, mapped to the target folders that agent reads.
export const AGENT_TARGETS = {
  all: ["agents", "claude"],
  both: ["agents", "claude"],
  universal: ["agents"],
  agents: ["agents"],
  claude: ["claude"],
  "claude-code": ["claude"],
  codex: ["agents"],
  gemini: ["agents"],
  "gemini-cli": ["agents"],
  copilot: ["agents"],
  "github-copilot": ["agents"],
  vscode: ["agents"],
  opencode: ["agents"],
  goose: ["agents"],
  roo: ["agents"],
  "roo-code": ["agents"],
  pi: ["agents"],
  vibe: ["agents"],
  "mistral-vibe": ["agents"],
};

/** Turn "claude,codex" (or "all") into the unique list of target names to install. */
export function resolveTargets(agentSpec) {
  const targets = [];
  for (const raw of String(agentSpec).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    const mapped = AGENT_TARGETS[raw];
    if (!mapped) {
      throw new Error(`Unknown agent "${raw}". Known: ${Object.keys(AGENT_TARGETS).join(", ")}. For any other agent, use --dest <its skills folder>.`);
    }
    for (const t of mapped) if (!targets.includes(t)) targets.push(t);
  }
  if (targets.length === 0) throw new Error("No agent given");
  return targets;
}

/**
 * Absolute folder the skill is installed into.
 * target: "agents" | "claude" | "codex-legacy" | "custom" (with dest).
 * Codex still reads the older $CODEX_HOME/skills (~/.codex/skills); that is "codex-legacy".
 */
export function targetDir({ target, scope = "user", home = os.homedir(), project = process.cwd(), codexHome, dest }) {
  if (!["user", "project"].includes(scope)) throw new Error(`Unknown scope: ${scope}`);
  if (target === "custom") {
    if (!dest) throw new Error("--dest is required for a custom target");
    return path.join(path.resolve(dest), SKILL_NAME);
  }
  if (!["user", "project"].includes(scope)) throw new Error(`Unknown scope: ${scope}`);
  if (target === "codex-legacy") {
    if (scope === "project") throw new Error("--codex-legacy only applies to --scope user");
    return path.join(codexHome || process.env.CODEX_HOME || path.join(home, ".codex"), "skills", SKILL_NAME);
  }
  const spec = TARGETS[target];
  if (!spec) throw new Error(`Unknown target: ${target}`);
  return path.join(scope === "user" ? home : project, ...spec.dir.split("/"), SKILL_NAME);
}

export function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

export function hashDir(dir) {
  const hash = crypto.createHash("sha256");
  for (const rel of listFiles(dir)) {
    hash.update(rel + "\0");
    hash.update(fs.readFileSync(path.join(dir, rel)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function copyDir(src, dest) {
  for (const rel of listFiles(src)) {
    const from = path.join(src, rel);
    const to = path.join(dest, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    fs.chmodSync(to, fs.statSync(from).mode);
  }
}

function timestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function sameRealPath(a, b) {
  try {
    return fs.realpathSync(a) === fs.realpathSync(b);
  } catch {
    return false;
  }
}

function lstatOrNull(p) {
  try {
    return fs.lstatSync(p);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// Resolve existing ancestors too, so a symlinked parent cannot hide overlap.
function physicalPath(p) {
  const absolute = path.resolve(p);
  if (fs.existsSync(absolute)) return fs.realpathSync(absolute);
  const parent = path.dirname(absolute);
  return parent === absolute ? absolute : path.join(physicalPath(parent), path.basename(absolute));
}

function contains(parent, child) {
  const rel = path.relative(parent, child);
  return !rel || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}

export function ensureWithin(root, target) {
  if (!contains(physicalPath(root), physicalPath(target))) throw new Error('Destination escapes its selected root through a symbolic link');
}

/**
 * Plan and (unless dryRun) perform one install.
 * Returns { target, scope, dir, action, backup?, message }.
 * action: "install" | "up-to-date" | "conflict" | "replace" | "link"
 */
export function installOne(opts) {
  const { target, scope = "user", source = SKILL_SOURCE, dryRun = false, force = false, link = false, home = os.homedir() } = opts;
  const dir = targetDir({ ...opts, home });
  const result = { target, scope, dir };
  const stat = lstatOrNull(dir);
  if (scope === 'project' && target !== 'custom') ensureWithin(opts.project || process.cwd(), path.dirname(dir));

  if (!fs.existsSync(path.join(source, "SKILL.md"))) {
    throw new Error(`Skill source not found: ${source}`);
  }

  const sourcePath = physicalPath(source);
  // A normal link to the source is safe and idempotent: never move its target.
  const existingSourceLink = stat?.isSymbolicLink() && sameRealPath(dir, source);
  if (!existingSourceLink) {
    const destinationPath = physicalPath(dir);
    if (contains(sourcePath, destinationPath) || contains(destinationPath, sourcePath)) {
      throw new Error('Installation source and destination must not overlap');
    }
  }

  if (stat) {
    const sameLink = stat.isSymbolicLink() && sameRealPath(dir, source);
    const sameContent = !link && !stat.isSymbolicLink() && stat.isDirectory() && hashDir(dir) === hashDir(source);
    if (sameLink || sameContent) {
      return { ...result, action: "up-to-date", message: `${dir} is already up to date` };
    }
    if (!force) {
      return {
        ...result,
        action: "conflict",
        message: `${dir} already exists and differs from this version. Nothing was changed. Re-run with --force to replace it (the existing copy is moved to a backup first).`,
      };
    }
    const backupRoot = scope === 'project' ? path.resolve(opts.project || process.cwd()) : home;
    const backup = path.join(backupRoot, ".glowup-ui", "backups", `${target}-${scope}-${timestamp()}-${crypto.randomUUID()}`, SKILL_NAME);
    ensureWithin(backupRoot, backup);
    result.backup = backup;
    result.action = "replace";
    if (!dryRun) {
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.renameSync(dir, backup);
    }
  } else {
    result.action = link ? "link" : "install";
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    // Windows: a junction works without admin rights or Developer Mode.
    if (link) fs.symlinkSync(path.resolve(source), dir, process.platform === "win32" ? "junction" : "dir");
    else copyDir(source, dir);
  }
  const verb = dryRun ? "Would" : "Did";
  const what = link ? `link ${dir} -> ${source}` : `copy skill to ${dir}`;
  result.message = `${verb} ${what}${result.backup ? ` (existing copy ${dryRun ? "would be " : ""}moved to ${result.backup})` : ""}`;
  return result;
}

/**
 * Install for an agent spec ("all", "claude", "codex,gemini", ...) or a custom --dest folder.
 * codexLegacy swaps the user-level .agents/skills target for $CODEX_HOME/skills.
 */
export function install({ agent = "all", dest, scope = "user", codexLegacy = false, ...rest }) {
  if (dest) return [installOne({ target: "custom", dest, scope, ...rest })];
  let targets = resolveTargets(agent);
  if (codexLegacy) targets = targets.map((t) => (t === "agents" ? "codex-legacy" : t));
  return targets.map((target) => installOne({ target, scope, ...rest }));
}
