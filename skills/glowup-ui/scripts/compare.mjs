#!/usr/bin/env node
// Build a local side-by-side before/after page from screenshot manifests.
// Usage: node compare.mjs [--out .glowup/screenshots] [--before before] [--after after]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function readManifest(dir) {
  const file = path.join(dir, "manifest.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function pairShots(before, after) {
  const key = (s) => `${s.viewport}::${s.route}`;
  const map = new Map();
  for (const s of before?.shots || []) map.set(key(s), { route: s.route, viewport: s.viewport, before: s, after: null });
  for (const s of after?.shots || []) {
    const entry = map.get(key(s)) || { route: s.route, viewport: s.viewport, before: null, after: null };
    entry.after = s;
    map.set(key(s), entry);
  }
  return [...map.values()];
}

function cell(shot, labelDir) {
  if (!shot) return `<div class="missing">Not captured</div>`;
  const badges = [];
  if (shot.status !== "ok") badges.push(`<span class="badge warn">${escapeHtml(shot.status)}</span>`);
  if (shot.overflowX) badges.push(`<span class="badge warn">horizontal overflow</span>`);
  const img = shot.file
    ? `<a href="${escapeHtml(`${labelDir}/${shot.file}`)}"><img loading="lazy" src="${escapeHtml(`${labelDir}/${shot.file}`)}" alt="${escapeHtml(`${shot.route} (${shot.viewport})`)}"></a>`
    : `<div class="missing">${escapeHtml(shot.error || "No image")}</div>`;
  return `${badges.join(" ")}${img}`;
}

export function renderCompare(before, after, { beforeLabel = "before", afterLabel = "after" } = {}) {
  const pairs = pairShots(before, after);
  const rows = pairs.map((p) => `
    <section>
      <h2><code>${escapeHtml(p.route)}</code> <span class="vp">${escapeHtml(p.viewport)}</span></h2>
      <div class="pair ${p.viewport === "mobile" ? "narrow" : ""}">
        <figure><figcaption>Before</figcaption>${cell(p.before, beforeLabel)}</figure>
        <figure><figcaption>After</figcaption>${cell(p.after, afterLabel)}</figure>
      </div>
    </section>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glowup UI — before / after</title>
<style>
  :root { color-scheme: light dark; --bg: #f7f7f8; --fg: #18181b; --muted: #71717a; --card: #fff; --line: #e4e4e7; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f0f12; --fg: #f4f4f5; --muted: #a1a1aa; --card: #18181b; --line: #27272a; } }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; background: var(--bg); color: var(--fg); }
  header, main { max-width: 1400px; margin: 0 auto; padding: 24px 16px; }
  h1 { margin: 0 0 4px; font-size: 24px; letter-spacing: -0.02em; }
  header p { margin: 0; color: var(--muted); }
  section { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  h2 { font-size: 15px; margin: 0 0 12px; } .vp { color: var(--muted); font-weight: 400; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .pair.narrow { max-width: 860px; }
  @media (max-width: 700px) { .pair { grid-template-columns: 1fr; } }
  figure { margin: 0; min-width: 0; } figcaption { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: 6px; }
  img { width: 100%; height: auto; display: block; border: 1px solid var(--line); border-radius: 8px; }
  .missing { padding: 32px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 8px; }
  .badge { display: inline-block; font-size: 12px; padding: 2px 8px; border-radius: 999px; margin-bottom: 6px; }
  .warn { background: #fef3c7; color: #92400e; }
</style>
</head>
<body>
<header>
  <h1>Before / after</h1>
  <p>Before: ${escapeHtml(before?.capturedAt || "not captured")} · After: ${escapeHtml(after?.capturedAt || "not captured")} · ${pairs.length} comparisons</p>
</header>
<main>
${rows || "<p>No screenshots found.</p>"}
</main>
</body>
</html>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      out: { type: "string", default: ".glowup/screenshots" },
      before: { type: "string", default: "before" },
      after: { type: "string", default: "after" },
    },
  });
  const before = readManifest(path.join(values.out, values.before));
  const after = readManifest(path.join(values.out, values.after));
  if (!before && !after) {
    console.error(`No manifests found in ${values.out}/${values.before} or ${values.out}/${values.after}. Run screenshot.mjs first.`);
    process.exit(66);
  }
  const file = path.join(values.out, "compare.html");
  fs.writeFileSync(file, renderCompare(before, after, { beforeLabel: values.before, afterLabel: values.after }));
  console.log(`Wrote ${file}`);
}
