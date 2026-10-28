#!/usr/bin/env node
// Scaffold a new React + Vite + Tailwind v4 + Vitest project with the starter UI kit (CREATE mode),
// or copy only the kit into an existing project (--only ui, for redesigns).
//   node scaffold.mjs --name "Fieldnote" [--dir .] [--force]
//   node scaffold.mjs --name "Fieldnote" --product "stationery shop" --surface commerce --install
//        one call: files + npm install + a chosen direction written to src/index.css + its fonts installed
//   node scaffold.mjs --only ui [--dir src]      -> <dir>/ui and <dir>/shells
// Existing files are never overwritten unless --force.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import { pickDirection, designSystem, themeCss } from "./direction.mjs";
import { SURFACES } from "./directions.mjs";

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "starter");

function safeDestination(dest, boundary) {
  for (let current = dest; ; current = path.dirname(current)) {
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Refusing to write through symlink: ${current}`);
    if (current === boundary) break;
    if (path.dirname(current) === current) throw new Error("Destination escaped scaffold root");
  }
}

function copyTree(from, to, { force, subst, created, skipped, boundary }) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    // Templates carry a .tpl suffix so test runners, linters, and compilers ignore them inside an installed skill.
    const stripped = entry.name.replace(/\.tpl$/, "");
    const outName = stripped === "gitignore" ? ".gitignore" : stripped;
    const dest = path.join(to, outName);
    safeDestination(dest, boundary);
    if (entry.isDirectory()) { copyTree(src, dest, { force, subst, created, skipped, boundary }); continue; }
    if (fs.existsSync(dest) && !force) { skipped.push(dest); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    let text = fs.readFileSync(src, "utf8");
    if (subst && /\.(json|html|jsx?|css)$/.test(outName)) for (const [k, v] of Object.entries(subst)) text = text.split(k).join(v);
    fs.writeFileSync(dest, text);
    created.push(dest);
  }
}

function copyKit(root, opts, modules) {
  if (!modules) {
    copyTree(path.join(STARTER, "ui"), path.join(root, "ui"), opts);
    copyTree(path.join(STARTER, "shells"), path.join(root, "shells"), opts);
    return;
  }
  const selected = new Set();
  const include = (name) => {
    if (selected.has(name)) return;
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw new Error(`Invalid component module: ${name}`);
    const file = path.join(STARTER, "ui", `${name}.${name === "cn" ? "js" : "jsx"}.tpl`);
    if (!fs.existsSync(file)) throw new Error(`Unknown component module: ${name}`);
    selected.add(name);
    const text = fs.readFileSync(file, "utf8");
    for (const [, dep] of text.matchAll(/from\s+["']\.\/([A-Za-z0-9]+)\.[jt]sx?["']/g)) include(dep);
  };
  for (const name of modules) include(name);
  for (const name of selected) {
    const ext = name === "cn" ? "js" : "jsx";
    const dest = path.join(root, "ui", `${name}.${ext}`);
    safeDestination(dest, opts.boundary);
    if (fs.existsSync(dest) && !opts.force) { opts.skipped.push(dest); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(STARTER, "ui", `${name}.${ext}.tpl`), dest);
    opts.created.push(dest);
  }
  // Match the canonical exports, but never advertise a module absent from this kit.
  const barrel = fs.readFileSync(path.join(STARTER, "ui/index.js.tpl"), "utf8").split("\n")
    .filter((line) => selected.has(line.match(/from "\.\/([^".]+)/)?.[1])).join("\n") + "\n";
  const index = path.join(root, "ui/index.js");
  safeDestination(index, opts.boundary);
  if (!fs.existsSync(index)) { fs.writeFileSync(index, barrel); opts.created.push(index); }
  // Existing barrels remain untouched; added modules can be imported directly.
}

export function scaffold({ name = "app", dir = ".", only = null, force = false, product, surface = "app", direction, brand, kit = "minimal", components } = {}) {
  if (only && only !== "ui") throw new Error("--only must be ui");
  if (!["minimal", "full"].includes(kit)) throw new Error("--kit must be minimal or full");
  if (!(surface in SURFACES)) throw new Error(`Unknown surface: ${surface}`);
  if (components !== undefined && !components.split(",").some((s) => s.trim())) throw new Error("--components requires at least one module");
  const selected = only === "ui" && !components ? null : components ? components.split(",").map((s) => s.trim()).filter(Boolean) : kit === "full" ? null : ["PageHeader", "Button", "Field", "Card"];
  if (!only && selected && !selected.includes("PageHeader")) selected.push("PageHeader");
  // Validate all choices before touching any destination files.
  if (selected) for (const name of selected) if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name) || !fs.existsSync(path.join(STARTER, "ui", `${name}.${name === "cn" ? "js" : "jsx"}.tpl`))) throw new Error(`Unknown component module: ${name}`);
  const chosen = only ? null : pickDirection(product || name, surface, direction).chosen;
  const root = path.resolve(dir);
  const created = [], skipped = [];
  if (!only && !force && fs.existsSync(path.join(root, "package.json"))) return { root, created, skipped: [path.join(root, "package.json")], design: null };
  let design = null;
  const opts = { force, created, skipped, boundary: root };
  if (only === "ui") {
    copyKit(root, opts, selected);
  } else {
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
    const subst = { "__NAME__": name.replace(/"/g, "'") };
    copyTree(path.join(STARTER, "project"), root, { ...opts, subst: { ...subst } });
    // package.json needs the slug as its package name
    const pkg = path.join(root, "package.json");
    if (created.includes(pkg)) { const j = JSON.parse(fs.readFileSync(pkg, "utf8")); j.name = slug; fs.writeFileSync(pkg, JSON.stringify(j, null, 2) + "\n"); }
    copyKit(path.join(root, "src"), opts, selected);
    // CREATE owns only files this invocation created. Do not route a new scaffold
    // through direction CLI's existing-app detection, or overwrite a user's CSS.
    const theme = path.join(root, "src", "index.css");
    if (created.includes(theme) && created.includes(pkg)) {
      const system = designSystem(chosen, { brand });
      fs.writeFileSync(theme, themeCss(chosen, system));
      const manifest = JSON.parse(fs.readFileSync(pkg, "utf8"));
      for (const font of system.packages) manifest.dependencies[font] = "^5.0.0";
      fs.writeFileSync(pkg, JSON.stringify(manifest, null, 2) + "\n");
      design = { id: chosen.id, name: chosen.name, packages: system.packages, summary: chosen.summary, shell: chosen.shells[surface], moves: chosen.moves };
    }
  }
  return { root, created, skipped, design };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: {
    name: { type: "string", default: "app" }, dir: { type: "string", default: "." }, only: { type: "string" }, force: { type: "boolean", default: false },
    product: { type: "string" }, surface: { type: "string", default: "app" }, direction: { type: "string" }, brand: { type: "string" }, install: { type: "boolean", default: false },
    kit: { type: "string", default: "minimal" }, components: { type: "string" },
  } });
  const r = scaffold(values);
  const rel = (p) => path.relative(process.cwd(), p) || p;
  console.log(`Scaffolded ${r.created.length} files in ${rel(r.root)}${r.skipped.length ? ` (${r.skipped.length} existing files kept)` : ""}`);
  if (r.design) console.log(`DIRECTION: ${r.design.name} (${r.design.id})\n${r.design.summary}\nShell: ${r.design.shell}\nSignature moves: ${r.design.moves.join("; ")}`);
  if (values.only !== "ui") {
    if (values.install && r.created.includes(path.join(r.root, "package.json"))) {
      const n = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: r.root, stdio: ["ignore", "ignore", "inherit"] });
      if (n.status !== 0) { console.error("npm install failed"); process.exit(1); }
    }
  }
}
