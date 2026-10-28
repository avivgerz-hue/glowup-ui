#!/usr/bin/env node
// One read-only orientation call. Does not run application code or read .env values.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { discover } from "./discover.mjs";
import { detectLook } from "./look.mjs";

export function inspect(root = ".") {
  root = fs.realpathSync(root);
  if (!fs.statSync(root).isDirectory()) throw new Error("Choose an application directory");
  const d = discover(root), look = detectLook(root);
  const command = (name) => `${d.packageManager || "npm"} run ${name}`;
  const checks = Object.fromEntries(["build", "test", "typecheck", "lint"].map((kind) => [kind, (d.scripts[kind] || []).map((s) => command(s.name))]));
  const resolve = (name) => [name, ...[".jsx", ".tsx", ".js", ".ts", ".vue", ".svelte"].map((ext) => name + ext)].find((p) => fs.existsSync(path.join(root, p)));
  const shells = [...d.componentUsage.filter((c) => /layout|shell|header|navbar/i.test(c.module)).map((c) => c.module), "src/App", "src/app/layout", "app/layout", "src/components/Layout"].map(resolve).filter(Boolean).slice(0, 4);
  return {
    root: d.root, product: d.name, mode: "REFINE (existing app); CREATE only for a new standalone product", framework: d.framework, packageManager: d.packageManager,
    identity: { scheme: look.scheme, accent: look.accent, brand: look.brand, fonts: d.fonts, shell: look.shell, designedSignals: look.designSignals },
    scale: d.scale, routes: d.routes, checks,
    readFirst: [...new Set([...(d.styling.tokenFiles || []).map((t) => t.file), ...shells, ...d.componentUsage.slice(0, 6).map((c) => resolve(c.module)).filter(Boolean)])],
    sharedComponents: d.componentUsage.slice(0, 8),
    next: ["Save a checkpoint before editing; baseline the app's own tests/build.", "Capture the requested routes at desktop/mobile; include real dynamic IDs and existing states.", "Run review.mjs on the capture manifest to prioritize observed issues; select at most three meaningful fixes.", "Make one representative route better before applying a shared change; compare the same captures after."],
    truncated: d.truncated, limitations: d.notes,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(inspect(process.argv[2] || "."), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 64; }
}
