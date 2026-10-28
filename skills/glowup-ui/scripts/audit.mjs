#!/usr/bin/env node
// Behavior and copy audit for redesigns. Compares the working tree with a git base (default HEAD):
//   - wiring that must survive a redesign: event handlers, ids, label links, roles, aria-*,
//     link targets, route paths, navigation and dialog calls
//   - user-visible copy that disappeared, and new copy that appeared (possible invented text)
//   - changes under tests/
// Read-only. Run from the project root:  node audit.mjs [--base HEAD] [--json]

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const SRC_DIRS = ["src", "app", "pages", "components", "lib"];
const CODE = /\.(jsx?|tsx?|vue|svelte|astro)$/;
const norm = (t) => t.replace(/\s+/g, " ").trim();

const WIRING = [
  /\bon[A-Z][A-Za-z]+=\{[^}]*\}?/g,
  /\b(?:on[a-z]+|on:[\w-]+(?:\|[\w-]+)*)=\{[^}]*\}/g,
  /@[\w:-]+(?:\.[\w-]+)*=(?:"[^"]*"|'[^']*')/g,
  /\bv-(?:model|on:[\w-]+)(?::[\w-]+)?(?:\.[\w-]+)*=(?:"[^"]*"|'[^']*')/g,
  /\b(?:bind|use):[\w-]+(?:=\{[^}]*\})?/g,
  /:[\w-]+=(?:"[^"]*"|'[^']*')/g,
  /\b(?:id|htmlFor|for|role|name|type|action|method|data-testid)=(?:"[^"]+"|'[^']+')/g,
  /\baria-(?!hidden)[a-z-]+=(?:"[^"]*"|'[^']*'|\{[^}]*\})/g,
  /\b(?:to|href)=(?:"[^"]+"|'[^']+'|\{`[^`]+`\}|\{"[^"]+"\})/g,
  /\bpath(?:=|:\s*)["'`][^"'`]*["'`]/g,
  /\b(?:navigate|alert|confirm|prompt)\([^)]*\)/g,
  /\bnoValidate\b/g,
];

function git(args, cwd) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}

function listBase(cwd, base) {
  const out = git(["ls-tree", "-r", "--name-only", base], cwd);
  return (out || "").split("\n").filter((f) => CODE.test(f) && SRC_DIRS.some((d) => f === d || f.startsWith(`${d}/`)));
}

function listNow(cwd) {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (CODE.test(e.name)) out.push(path.relative(cwd, p).split(path.sep).join("/"));
    }
  };
  for (const d of SRC_DIRS) walk(path.join(cwd, d));
  return out;
}

export function wiringTokens(text) {
  return new Set(wiringOccurrences(text));
}

export function wiringOccurrences(text) {
  const found = [];
  for (const re of WIRING) for (const m of text.matchAll(re)) found.push(norm(m[0]).split(" className=")[0]);
  return found;
}

const ATTRS = /\b(?:title|placeholder|aria-label|alt|label|value)="([^"{}]{3,})"/g;
// Any other string prop that reads like a sentence (3+ words), e.g. description="Welcome back...".
const PROSE_PROP = /\b(?!(?:className|class|style|viewBox|points|transform|d|fill|stroke|href|to|id|htmlFor)=)[a-zA-Z-]+="([^"{}]*\s[^"{}]*\s[^"{}]*)"/g;
const LOOKS_LIKE_CODE = /^[),;:}\]]|[(\[{=]\s*$|=>|\bfunction\b|\breturn\b|:\s*\($|\/\/|;\s*(?:const|let|var|if)\b/;

export function copyStrings(text) {
  const found = new Set();
  const add = (s) => { const t = norm(s); if (t.length >= 3 && /[A-Za-z]{3}/.test(t) && !LOOKS_LIKE_CODE.test(t)) found.add(t); };
  for (const m of text.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) add(m[1]);
  for (const m of text.matchAll(/\{\s*["'`]([^"'`{}$]{3,})["'`]\s*\}/g)) add(m[1]);
  for (const m of text.matchAll(ATTRS)) add(m[1]);
  for (const m of text.matchAll(PROSE_PROP)) add(m[1]);
  return found;
}

// Visual richness that must not shrink in a redesign: illustrations, images, icons, avatars, charts, progress, badges.
const VISUALS = { brandmarks: /<(?:Logo\w*|Wordmark)\b/g, illustrations: /<svg\b|<Illustration\b|<ArtTile\b/g, images: /<img\b|<Image\b/g, icons: /<[A-Z][A-Za-z]*Icon\b|<Icon\b|lucide-react|react-icons/g, avatars: /<Avatar\w*\b/g, charts: /<(?:\w*Chart|Sparkline|Donut|BarList|canvas)\b|recharts/g, progress: /<Progress\w*\b|role="progressbar"|<progress\b/g, badges: /<Badge\b|<Chip\b|<Tag\b|rounded-full[^"']*\b(?:px|bg)-/g };
export function countVisuals(text) { const out = {}; for (const [k, re] of Object.entries(VISUALS)) out[k] = (text.match(re) || []).length; return out; }

function collect(files, read) {
  const wiring = new Set(), copy = new Set(), visuals = Object.fromEntries(Object.keys(VISUALS).map((k) => [k, 0]));
  for (const f of files) {
    const text = read(f);
    if (text == null) continue;
    for (const [k, n] of Object.entries(countVisuals(text))) visuals[k] += n;
    for (const t of wiringTokens(text)) wiring.add(t);
    for (const s of copyStrings(text)) copy.add(s);
  }
  return { wiring, copy, visuals };
}

export function audit(cwd = process.cwd(), base = "HEAD") {
  if (git(["rev-parse", "--verify", base], cwd) === null) throw new Error(`Not a git repository, or unknown base "${base}". Run this from the project root.`);
  const baseFiles = listBase(cwd, base);
  const nowFiles = listNow(cwd);
  const before = collect(baseFiles, (f) => git(["show", `${base}:${f}`], cwd));
  const after = collect(nowFiles, (f) => fs.readFileSync(path.join(cwd, f), "utf8"));
  const lostWiring = [...before.wiring].filter((t) => !after.wiring.has(t));
  const lostCopy = [...before.copy].filter((t) => !after.copy.has(t));
  const newCopy = [...after.copy].filter((t) => !before.copy.has(t) && !/^(Skip to|Open|Close|Toggle|Menu|Main|Primary|Navigation)\b/i.test(t));
  const shrunk = Object.entries(before.visuals).filter(([k, n]) => n >= 3 && after.visuals[k] < n * 0.65).map(([k, n]) => ({ kind: k, before: n, after: after.visuals[k] }));
  const testsChanged = (git(["status", "--porcelain", "--", "tests", "test", "__tests__"], cwd) || "").split("\n").filter(Boolean);
  return {
    base, filesCompared: { before: baseFiles.length, now: nowFiles.length },
    wiring: { before: before.wiring.size, preserved: before.wiring.size - lostWiring.length, lost: lostWiring },
    copy: { lost: lostCopy, added: newCopy },
    visuals: { before: before.visuals, after: after.visuals, shrunk },
    testsChanged,
  };
}

export function report(r) {
  const out = [`Behavior audit vs ${r.base} (${r.filesCompared.now} source files now, ${r.filesCompared.before} at base)`];
  const show = (list, n = 8) => list.slice(0, n).map((s) => `    - ${s.length > 110 ? s.slice(0, 107) + "..." : s}`).concat(list.length > n ? [`    ...and ${list.length - n} more`] : []);
  if (r.wiring.lost.length === 0) out.push(`✓ Wiring: all ${r.wiring.before} handlers, ids, roles, aria attributes, link targets, and routes are preserved`);
  else { out.push(`✗ Wiring: ${r.wiring.lost.length} of ${r.wiring.before} items from the original are missing. Restore them, or confirm each was intentionally replaced:`, ...show(r.wiring.lost)); }
  if (r.copy.lost.length === 0) out.push("✓ Copy: no original text was lost");
  else out.push(`! Copy: ${r.copy.lost.length} original strings no longer appear. Restore any that were not moved or restyled:`, ...show(r.copy.lost));
  if (r.copy.added.length === 0) out.push("✓ Copy: no new text was added");
  else out.push(`! Copy: ${r.copy.added.length} new strings. Keep labels for icons and screen readers; remove invented taglines, claims, or filler:`, ...show(r.copy.added));
  if (r.visuals.shrunk.length === 0) out.push("✓ Richness: no kind of visual element (illustrations, images, icons, avatars, charts, progress, badges) shrank noticeably");
  else out.push("! Richness: these visual elements shrank. Make sure the redesign is not a downgrade; restore what made the original better:", ...r.visuals.shrunk.map((v) => `    - ${v.kind}: ${v.before} -> ${v.after}`));
  out.push(r.testsChanged.length === 0 ? "✓ Tests: untouched" : `✗ Tests: changed (${r.testsChanged.length}). A redesign should not edit tests:\n${show(r.testsChanged).join("\n")}`);
  return out.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { base: { type: "string", default: "HEAD" }, json: { type: "boolean", default: false } } });
  try {
    const r = audit(process.cwd(), values.base);
    console.log(values.json ? JSON.stringify(r, null, 2) : report(r));
    process.exit(r.wiring.lost.length || r.testsChanged.length ? 1 : 0);
  } catch (error) {
    console.error(error.message);
    process.exit(64);
  }
}
