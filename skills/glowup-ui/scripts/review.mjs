#!/usr/bin/env node
// Prioritize captured design evidence and compare the same routes/widths before/after.
// node review.mjs --current .glowup/screenshots/after/manifest.json [--before ...] [--json]
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const key = (s) => JSON.stringify([s.route, s.viewport, s.width, s.height]);
const count = (list) => {
  const out = new Map();
  for (const item of list || []) { const k = JSON.stringify(item); out.set(k, (out.get(k) || 0) + 1); }
  return out;
};

export function findings(shot) {
  const out = [], m = shot.measurements;
  const add = (severity, kind, detail, value = 1, examples = []) => out.push({ severity, kind, detail, value, examples });
  if (shot.status !== "ok") add("blocker", "capture", shot.error || shot.status);
  if (shot.overflowX) add("blocker", "page-overflow", "Content exceeds viewport width");
  if (shot.runtimeErrors?.length) add("blocker", "runtime-errors", shot.runtimeErrors.join("; "), shot.runtimeErrors.length);
  if (!m || m.version !== 1) { add("blocker", "missing-measurements", "Recapture with the current screenshot helper"); return out; }
  if (m.truncated) add("blocker", "measurement-limit", "Page exceeds the 10000-node measurement limit; complete manual review rather than claiming full coverage");
  if (m.occlusion?.blocked?.length) add("blocker", "obscured-controls", `${m.occlusion.blocked.length} enabled controls intercepted at every sampled viewport point; inspect overlays and navigation`, m.occlusion.blocked.length, m.occlusion.blocked.slice(0, 3).map(c => c.name || c.tag));
  if (m.occlusion?.truncated) add("review", "occlusion-limit", "Only the first 200 control/link candidates were hit-tested; remaining controls are unverified");
  const h1 = m.headings.filter((h) => h.level === 1);
  if (h1.length !== 1) add("review", "page-title", `Expected one visible page h1, found ${h1.length}`);
  if (m.globalHeaders > 1) add("review", "duplicate-header", `${m.globalHeaders} global header candidates; check for stacked chrome`, m.globalHeaders - 1);
  if (m.mainLandmarks !== undefined && m.mainLandmarks !== 1) add("review", "main-landmark", `Expected one main landmark, found ${m.mainLandmarks}`);
  if (m.unnamedControls) add("blocker", "unnamed-controls", `${m.unnamedControls} controls lack an approximate accessible name`, m.unnamedControls);
  const broken = m.images.filter((i) => i.broken).length;
  if (broken) add("blocker", "broken-images", `${broken} images failed to load`, broken);
  const scroll = m.scrollRegions.filter((r) => !r.keyboard).length;
  if (scroll) add("review", "keyboard-scroll", `${scroll} scroll regions lack keyboard access`, scroll);
  if (m.targets.length) add("review", "touch-targets", `${m.targets.length} non-inline controls/links smaller than 44px; review spacing and dense controls`, m.targets.length, m.targets.slice(0, 3).map((t) => `${t.name || t.tag}: ${t.width}×${t.height}px`));
  if (m.tinyText.length) add("review", "tiny-text", `${m.tinyText.length} text elements below 12px`, m.tinyText.length);
  if (m.longLines.length) add("review", "line-length", `${m.longLines.length} long paragraphs may be difficult to scan`, m.longLines.length);
  if (m.contrast?.failures.length) add("review", "text-contrast", `${m.contrast.failures.length} text elements fail simple computed contrast checks`, m.contrast.failures.length, m.contrast.failures.slice(0, 3).map((f) => `${f.text}: ${f.ratio}:1 (needs ${f.required}:1)`));
  return out;
}

export function review(current, before = null) {
  if (!Array.isArray(current?.shots) || !current.shots.length) throw new Error("Current manifest has no captures");
  if (before && (!Array.isArray(before.shots) || !before.shots.length)) throw new Error("Baseline manifest has no captures");
  const unique = (shots) => { const keys = shots.map(key); if (new Set(keys).size !== keys.length) throw new Error("Manifest contains duplicate route/viewport captures"); };
  unique(current.shots); if (before) unique(before.shots);
  const prev = new Map((before?.shots || []).map((s) => [key(s), s]));
  const regressions = [], improvements = [], coverage = [];
  const pages = current.shots.map((s) => ({ route: s.route, viewport: s.viewport, findings: findings(s) }));
  for (const shot of current.shots) {
    const id = key(shot), old = prev.get(id);
    if (before && !old) { coverage.push({ route: shot.route, viewport: shot.viewport, detail: "No matching before capture at this size" }); continue; }
    if (!old) continue;
    prev.delete(id);
    const add = (kind, detail) => regressions.push({ route: shot.route, viewport: shot.viewport, kind, detail });
    if (old.status !== "ok" || shot.status !== "ok") { coverage.push({ route: shot.route, viewport: shot.viewport, detail: "Before and after must both load successfully" }); continue; }
    if (old.measurements?.version !== 1 || shot.measurements?.version !== 1) { coverage.push({ route: shot.route, viewport: shot.viewport, detail: "Missing or incompatible before/after measurements" }); continue; }
    if (old.measurements.truncated || shot.measurements.truncated) { coverage.push({ route: shot.route, viewport: shot.viewport, detail: "DOM measurements were truncated; automatic comparison is incomplete" }); continue; }
    const a = new Map(findings(old).map((f) => [f.kind, f.value]));
    const b = new Map(findings(shot).map((f) => [f.kind, f.value]));
    for (const [kind, n] of b) if (n > (a.get(kind) || 0)) add(kind, `Findings increased: ${a.get(kind) || 0} -> ${n}`);
    for (const [kind, n] of a) if ((b.get(kind) || 0) < n) improvements.push({ route: shot.route, viewport: shot.viewport, kind, before: n, after: b.get(kind) || 0 });
    for (const field of ["controls", "links"]) {
      const now = count(shot.measurements[field]);
      for (const [item, n] of count(old.measurements[field])) if ((now.get(item) || 0) < n) add(`lost-${field}`, item);
    }
    if (JSON.stringify(old.measurements.fonts) !== JSON.stringify(shot.measurements.fonts)) add("fonts", "Rendered font families changed; verify identity and font loading");
    if (JSON.stringify(old.measurements.webFonts) !== JSON.stringify(shot.measurements.webFonts)) add("web-fonts", "Loaded web fonts changed");
    if (old.measurements.contrast?.checked > 0 && shot.measurements.contrast?.checked === 0) add("contrast-coverage", "Previously measurable text contrast is now entirely unverified; inspect backgrounds, gradients, and opacity");
  }
  for (const shot of prev.values()) coverage.push({ route: shot.route, viewport: shot.viewport, detail: "Missing after capture" });
  const blockers = pages.flatMap((p) => p.findings.filter((f) => f.severity === "blocker").map((f) => ({ route: p.route, viewport: p.viewport, ...f })));
  const groups = new Map();
  for (const page of pages) for (const finding of page.findings) {
    const id = `${finding.severity}:${finding.kind}`;
    if (!groups.has(id)) groups.set(id, { severity: finding.severity, kind: finding.kind, detail: finding.detail, instances: 0, captures: [], examples: [] });
    const group = groups.get(id); group.instances += finding.value;
    group.captures.push({ route: page.route, viewport: page.viewport });
    group.examples = [...new Set([...group.examples, ...finding.examples])].slice(0, 3);
  }
  const order = ["capture", "runtime-errors", "page-overflow", "obscured-controls", "unnamed-controls", "broken-images", "duplicate-header", "keyboard-scroll", "text-contrast", "main-landmark", "page-title", "touch-targets", "tiny-text", "line-length"];
  const ok = !coverage.length && !regressions.length && !blockers.length;
  return { ok, status: !ok ? "blocked" : groups.size ? "review" : "clear", compared: Boolean(before), pages, coverage, regressions, improvements, blockers,
    priorities: [...groups.values()].sort((a, b) => (a.severity === "blocker" ? 0 : 1) - (b.severity === "blocker" ? 0 : 1) || order.indexOf(a.kind) - order.indexOf(b.kind)).slice(0, 8),
    limitations: "A clean comparison is not proof of better design or preserved behavior. Approximate DOM names and counts need review; compare screenshots and run original tests and keyboard flows. Existing review findings may remain." };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { current: { type: "string" }, before: { type: "string" }, json: { type: "boolean", default: false } } });
    if (!values.current) throw new Error("Usage: review.mjs --current manifest.json [--before manifest.json] [--json]");
    const r = review(JSON.parse(fs.readFileSync(values.current, "utf8")), values.before ? JSON.parse(fs.readFileSync(values.before, "utf8")) : null);
    const status = r.status === "blocked" ? "REVIEW REQUIRED" : r.status === "review" ? "REVIEW FINDINGS REMAIN" : "MEASURED CHECKS CLEAR";
    console.log(values.json ? JSON.stringify(r, null, 2) : `${status}: ${r.pages.length} captures, ${r.regressions.length} regressions, ${r.coverage.length} coverage gaps, ${r.improvements.length} improvements\n${r.priorities.map((p) => `- ${p.kind}: ${p.captures.length} captures, ${p.instances} findings. ${p.examples.length ? p.examples.join("; ") : p.detail}`).join("\n")}\n${r.limitations}`);
    process.exitCode = r.ok ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 64; }
}
