#!/usr/bin/env node
// One read-only orientation call. Does not run application code or read .env values.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { discover } from "./discover.mjs";
import { detectLook } from "./look.mjs";

export function inspect(root = ".", { scope = "auto" } = {}) {
  if (!["auto", "redesign", "refine", "polish"].includes(scope)) throw new Error("Scope must be auto, redesign, refine or polish; inspect is for existing apps.");
  root = fs.realpathSync(root);
  if (!fs.statSync(root).isDirectory()) throw new Error("Choose an application directory");
  const d = discover(root), look = detectLook(root);
  const command = (name) => `${d.packageManager || "npm"} run ${name}`;
  const checks = Object.fromEntries(["build", "test", "typecheck", "lint"].map((kind) => [kind, (d.scripts[kind] || []).map((s) => command(s.name))]));
  // Only resolve aliases declared in local JSON configs. Never guess a custom
  // alias or suggest a file outside the inspected application.
  let options = {};
  for (const config of ["tsconfig.json", "jsconfig.json"]) {
    try {
      const file = fs.realpathSync(path.join(root, config));
      if (!file.startsWith(root + path.sep)) continue;
      options = JSON.parse(fs.readFileSync(file, "utf8")).compilerOptions || {};
      break;
    } catch {}
  }
  const resolve = (name) => {
    const bases = [name];
    for (const [alias, targets] of Object.entries(options.paths || {})) {
      if (!Array.isArray(targets)) continue;
      const parts = alias.split("*");
      if (parts.length > 2) continue;
      const match = parts.length === 1 ? name === alias : name.startsWith(parts[0]) && name.endsWith(parts[1]) && name.length >= parts[0].length + parts[1].length;
      if (!match) continue;
      const middle = parts.length === 1 ? "" : name.slice(parts[0].length, name.length - parts[1].length);
      for (const target of targets) if (typeof target === "string") bases.push(path.resolve(root, typeof options.baseUrl === "string" ? options.baseUrl : ".", target.replace("*", middle)));
    }
    for (const base of bases) for (const candidate of [base, ...[".jsx", ".tsx", ".js", ".ts", ".mjs", ".vue", ".svelte", ".astro"].flatMap(ext => [base + ext, path.join(base, "index" + ext)])]) {
      const full = path.resolve(root, candidate);
      if (!full.startsWith(root + path.sep)) continue;
      try {
        const physical = fs.realpathSync(full);
        if (physical.startsWith(root + path.sep) && fs.statSync(full).isFile()) return path.relative(root, full).split(path.sep).join("/");
      } catch {}
    }
  };
  const shells = [...d.componentUsage.filter((c) => /layout|shell|header|navbar/i.test(c.module)).map((c) => c.module), "src/App", "src/app/layout", "app/layout", "src/components/Layout"].map(resolve).filter(Boolean).slice(0, 4);
  return {
    root: d.root, product: d.name, mode: scope === "redesign" ? "TRANSFORM (full redesign; preserve product and behavior)" : ["refine", "polish"].includes(scope) ? "REFINE (preserve identity and composition)" : "Select TRANSFORM or REFINE from the user request; existing files do not determine redesign scope", framework: d.framework, packageManager: d.packageManager,
    identity: { scheme: look.scheme, accent: look.accent, brand: look.brand, fonts: d.fonts, shell: look.shell, designedSignals: look.designSignals },
    scale: d.scale, routes: d.routes, checks,
    readFirst: [...new Set([...(d.styling.tokenFiles || []).map((t) => t.file), ...shells, ...d.componentUsage.slice(0, 6).map((c) => resolve(c.module)).filter(Boolean)])],
    sharedComponents: d.componentUsage.slice(0, 8),
    next: ["Save a checkpoint before editing; baseline the app's own tests/build.", "Capture the requested routes at desktop/mobile; include real dynamic IDs and existing states.", "Use review.mjs findings and the request to choose up to three priorities, not a limit on edits. Full redesign may span composition and shared components; REFINE stays local.", "Make one representative route better before applying a shared change; compare the same captures after."],
    truncated: d.truncated, limitations: [...d.notes, "readFirst resolves local files and aliases from plain JSON tsconfig/jsconfig only; inherited/JSONC/bundler/workspace aliases need manual inspection."],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { values, positionals } = parseArgs({ allowPositionals: true, options: { scope: { type: "string", default: "auto" } } });
    console.log(JSON.stringify(inspect(positionals[0] || ".", { scope: values.scope }), null, 2));
  }
  catch (error) { console.error(error.message); process.exitCode = 64; }
}
