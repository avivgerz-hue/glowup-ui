#!/usr/bin/env node
// Local, dependency-free preservation checks. Never restores files or executes project code.
// node checkpoint.mjs save|check [project] [--file .glowup/checkpoint.json] [--json]
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { wiringOccurrences, copyStrings, countVisuals } from "./audit.mjs";
import { detectLook } from "./look.mjs";

const SKIP = new Set(["node_modules", ".git", ".glowup", ".next", ".nuxt", ".svelte-kit", ".claude", ".agents", "dist", "build", "coverage", ".cache", "vendor"]);
const SOURCE = /\.(?:[cm]?[jt]sx?|vue|svelte|astro|html|css|scss|sass|less)$/i;
const ASSET = /\.(?:svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf)$/i;
const TEST = /(?:^|\/)(?:tests?|__tests__|e2e|cypress|playwright)(?:\/|\.)|\.(?:test|spec)\.[^.]+$/i;
const CONFIG = /(?:^|\/)(?:package\.json|.*lock.*|[^/]*config\.[^/]+|tsconfig[^/]*\.json|\.env[^/]*|\.npmrc|\.yarnrc[^/]*|[^/]*routes?\.[^/]+)$/i;
const BRAND = /(?:^|\/)[^/]*(?:logo|wordmark|brandmark)[^/]*$/i;
const hash = (data) => createHash("sha256").update(data).digest("hex");
const normalize = (s) => s.replace(/\s+/g, " ").trim();
const chromeCount = (text) => (text.match(/<header\b|<(?:AppHeader|SiteHeader|GlobalHeader|TopBar|Navbar)\b/g) || []).length;

function files(root, dir = root, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    // Do not follow symlinks; record their target without reading external content.
    if (entry.isDirectory()) files(root, full, out);
    else out.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return out.sort();
}

function identity(text) {
  // Freeze existing palette and typography declarations, including repeated dark-mode tokens.
  const tokens = [...text.matchAll(/(?:--[\w-]*(?:color|brand|primary|accent|ink|canvas|surface|font)[\w-]*|font-family|color-scheme)\s*:\s*([^;{}]+)/gi)]
    .map((m) => normalize(m[0]));
  // Brand components can live alongside ordinary icons, rather than in Logo.jsx.
  // Conservative source slices: changes require review, including legitimate refactors.
  for (const m of text.matchAll(/(?:^|\n)(?:export\s+)?(?:default\s+)?(?:function|const|let)\s+\w*(?:Logo|Wordmark|Brandmark)\w*\b[\s\S]*?(?=\n(?:export\s+)?(?:default\s+)?(?:function|const|let)\s|$(?![\s\S]))/gi)) tokens.push(`brand-component:${hash(normalize(m[0]))}`);
  return tokens.sort();
}

function dirtyFiles(root) {
  const r = spawnSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: root, encoding: "utf8", timeout: 10_000, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    if (r.status === 128 && /not a git repository/i.test(r.stderr || "")) return [];
    if (r.error?.code === "ENOENT" && !process.env.GIT_DIR && !process.env.GIT_WORK_TREE) {
      let metadata = false;
      for (let dir = root; ; dir = path.dirname(dir)) {
        const gitPath = path.join(dir, ".git"), stat = fs.lstatSync(gitPath, { throwIfNoEntry: false });
        if (stat && (!stat.isDirectory() || ["HEAD", "config", "objects"].some((f) => fs.existsSync(path.join(gitPath, f))))) metadata = true;
        if (path.dirname(dir) === dir) break;
      }
      if (!metadata) return []; // Git is optional for a positively non-Git project.
    }
    throw new Error("Cannot inspect existing Git changes safely. Resolve Git access/status before saving or checking a checkpoint.");
  }
  const entries = r.stdout.split("\0");
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    out.push(entry.slice(3));
    if (/[RC]/.test(entry.slice(0, 2))) i++;
  }
  return out;
}

export function snapshot(root) {
  root = fs.realpathSync(root);
  const dirty = new Set(dirtyFiles(root));
  const records = {};
  for (const name of files(root)) {
    const full = path.join(root, name);
    const stat = fs.lstatSync(full);
    const nonVisualCode = /\.[cm]?[jt]s$/.test(name) && !/<[A-Za-z][\w.-]*(?:\s|>|\/)/.test(fs.lstatSync(full).isFile() ? fs.readFileSync(full, "utf8") : "");
    const fixed = TEST.test(name) || CONFIG.test(name) || ASSET.test(name) || BRAND.test(name) || nonVisualCode;
    const frozen = fixed || dirty.has(name);
    if (stat.isSymbolicLink()) {
      records[name] = { hash: hash(fs.readlinkSync(full)), frozen: true, symlink: true };
      continue;
    }
    if (!stat.isFile() || (!frozen && !SOURCE.test(name))) continue;
    const bytes = fs.readFileSync(full);
    const record = { hash: hash(bytes), frozen, fixed };
    // Do not store environment/config/asset contents in the checkpoint.
    if (SOURCE.test(name) && !frozen) {
      const text = bytes.toString("utf8");
      record.wiring = wiringOccurrences(text);
      record.copy = [...copyStrings(text)];
      record.visuals = countVisuals(text);
      record.identity = identity(text);
      record.chrome = chromeCount(text);
    }
    records[name] = record;
  }
  if (!Object.keys(records).length) throw new Error("No application files found; choose the application root.");
  return { version: 1, root, createdAt: new Date().toISOString(), look: detectLook(root), records };
}

export function compareCheckpoint(before, after) {
  if (before.version !== 1 || after.version !== 1 || before.root !== after.root) throw new Error("Checkpoint belongs to another project or unsupported version.");
  const failures = [], warnings = [];
  const changed = [];
  const count = (records, key) => {
    const counts = new Map();
    for (const record of Object.values(records)) for (const token of record[key] || []) counts.set(token, (counts.get(token) || 0) + 1);
    return counts;
  };
  // Count per-file occurrences so a control still present on another page cannot hide its removal.
  for (const key of ["wiring", "copy"]) {
    const prev = count(before.records, key), now = count(after.records, key);
    for (const [token, n] of prev) if ((now.get(token) || 0) < n) failures.push({ kind: key, detail: token, before: n, after: now.get(token) || 0 });
  }
  const originalCopy = count(before.records, "copy");
  for (const token of count(after.records, "copy").keys()) {
    if (!originalCopy.has(token)) warnings.push({ kind: "new-copy", detail: token });
  }
  for (const [name, prev] of Object.entries(before.records)) {
    const now = after.records[name];
    if (now?.hash === prev.hash) continue;
    changed.push(name);
    if (prev.frozen) failures.push({ kind: "protected-file", file: name, detail: now ? "changed" : "removed" });
    if (prev.identity?.length && JSON.stringify(prev.identity) !== JSON.stringify(now?.identity || [])) failures.push({ kind: "identity", file: name, detail: "Existing palette or typography declarations changed; review before accepting." });
    for (const [kind, n] of Object.entries(prev.visuals || {})) {
      if ((now?.visuals?.[kind] || 0) < n) warnings.push({ kind: "visual-loss", file: name, detail: kind, before: n, after: now?.visuals?.[kind] || 0 });
    }
  }
  for (const name of Object.keys(after.records)) if (!(name in before.records)) {
    changed.push(name);
    if (after.records[name].frozen) failures.push({ kind: "protected-file", file: name, detail: "added" });
  }
  if (before.look.shell && before.look.shell !== after.look.shell) warnings.push({ kind: "shell", detail: `${before.look.shell} -> ${after.look.shell || "unknown"}` });
  if (before.look.scheme !== after.look.scheme) warnings.push({ kind: "scheme", detail: `${before.look.scheme} -> ${after.look.scheme}` });
  const headers = (records) => Object.values(records).reduce((n, record) => n + (record.chrome || 0), 0);
  if (headers(after.records) > headers(before.records)) warnings.push({ kind: "added-chrome", detail: "Additional global header markup detected; verify that navigation, avatar, and notifications are not duplicated." });
  return { ok: !failures.length && !warnings.length, changed, failures, warnings, limitation: "Source heuristics, not a proof of behavior or visual quality. Review false positives; do not weaken checks to pass. Run original tests and compare every affected route in a browser." };
}

export function check(root, baseline) {
  const after = snapshot(root);
  // A file that was initially dirty remains protected even if an agent committed it.
  // Conversely, our own UI edits must not become protected merely because they are now dirty.
  for (const [name, record] of Object.entries(after.records)) {
    if (!baseline.records[name]?.frozen && record.frozen && !record.fixed && !record.symlink && SOURCE.test(name)) {
      const text = fs.readFileSync(path.join(root, name), "utf8");
      Object.assign(record, { frozen: false, wiring: wiringOccurrences(text), copy: [...copyStrings(text)], visuals: countVisuals(text), identity: identity(text), chrome: chromeCount(text) });
    }
    if (!(name in baseline.records) && !record.fixed && !record.symlink) record.frozen = false;
  }
  return compareCheckpoint(baseline, after);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: { file: { type: "string", default: ".glowup/checkpoint.json" }, json: { type: "boolean", default: false } } });
    const [command, project = "."] = positionals;
    const root = fs.realpathSync(project), file = path.resolve(root, values.file);
    if (command === "save") {
      const baseline = snapshot(root);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      // Never overwrite the evidence from before editing.
      fs.writeFileSync(file, JSON.stringify(baseline, null, 2) + "\n", { flag: "wx", mode: 0o600 });
      console.log(`Saved ${Object.keys(baseline.records).length} file fingerprints to ${file}. Keep this original checkpoint until review is complete.`);
    } else if (command === "check") {
      const result = check(root, JSON.parse(fs.readFileSync(file, "utf8")));
      console.log(values.json ? JSON.stringify(result, null, 2) : `${result.ok ? "PASS" : "REVIEW REQUIRED"}: ${result.changed.length} changed files, ${result.failures.length} preservation failures, ${result.warnings.length} visual warnings\n${[...result.failures, ...result.warnings].map((f) => `- ${f.kind}: ${f.file || ""} ${f.detail}`).join("\n")}\n${result.limitation}`);
      process.exitCode = result.ok ? 0 : 1;
    } else throw new Error("Usage: checkpoint.mjs save|check [project] [--file path] [--json]");
  } catch (error) { console.error(error.message); process.exitCode = 64; }
}
