#!/usr/bin/env node
// Aggregate results/<scenario>/<label>/{metrics,eval}.json into a markdown table with relative differences.
//   node report.mjs [--labels baseline,current] [--scenarios A,B,C,D] [--json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };

export function load(scenario, label) {
  const dir = path.join(HERE, "results", scenario, label);
  const m = read(path.join(dir, "metrics.json")), e = read(path.join(dir, "eval.json"));
  if (!m || !e) return null;
  const t = m.tokens || {};
  const flows = [...(e.flow?.desktop || []), ...(e.flow?.mobile || [])];
  const p = e.probe || {};
  return {
    label, scenario, completed: !!m.completed,
    seconds: m.durationSec, turns: m.turns, toolCalls: m.toolCalls, costUsd: m.costUsd,
    outputTokens: t.output, contextTokens: (t.input || 0) + (t.cacheCreate || 0) + (t.cacheRead || 0),
    filesChanged: Array.isArray(e.changedFiles) ? e.changedFiles.length : e.changedFiles, depsAdded: e.deps?.added?.length ?? 0,
    buildOk: e.build?.pass, testsOk: e.tests?.pass, testsPassed: e.tests?.passed, testsFailed: e.tests?.failed,
    agentBuildTestFailures: m.buildTestFailures, screenshotCaptures: m.screenshotCaptures, screenshotsViewed: m.screenshotsViewed,
    flowPass: flows.length ? `${flows.filter((f) => f.pass).length}/${flows.length}` : null,
    transformation: e.transformation?.meanChangedFraction ?? null,
    overflowPages: (p.mobileOverflowPages || 0) + (p.desktopOverflowPages || 0), axeSerious: (p.axeSerious || 0) + (p.axeCritical || 0), contrastFailures: p.contrastFailures,
    smallTargets: p.smallTargetsMobile, fontFamilies: p.fontFamilies, webFonts: (p.webFontsLoaded || []).length, distinctSizes: p.avgDistinctFontSizes,
    skillInvoked: m.skill?.invoked, refsRead: m.skill?.referenceFilesRead?.length,
  };
}

const pct = (a, b) => (a == null || b == null || !b ? "" : `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%`);
export function table(scenarios, labels) {
  const rows = [];
  const target = labels[labels.length - 1];
  const comparisons = labels.slice(0, -1);
  for (const s of scenarios) {
    const cells = Object.fromEntries(labels.map((l) => [l, load(s, l)]));
    rows.push(`\n### Scenario ${s}\n`);
    rows.push(`| metric | ${labels.join(" | ")} | ${comparisons.map(l => `${target} vs ${l}`).join(" | ")} |`, `|---|${[...labels, ...comparisons].map(() => "---").join("|")}|`);
    const metrics = [
      ["completed", "completed"], ["wall time (s)", "seconds"], ["turns", "turns"], ["tool calls", "toolCalls"], ["cost (USD)", "costUsd"], ["output tokens", "outputTokens"], ["context tokens (in+cache)", "contextTokens"],
      ["files changed", "filesChanged"], ["deps added", "depsAdded"], ["agent build/test failures", "agentBuildTestFailures"], ["screenshot captures", "screenshotCaptures"], ["screenshots viewed", "screenshotsViewed"],
      ["build ok", "buildOk"], ["tests passed/failed", null], ["scripted flow", "flowPass"], ["transformation (px changed)", "transformation"],
      ["overflow pages", "overflowPages"], ["axe serious+critical", "axeSerious"], ["contrast failures", "contrastFailures"], ["small mobile targets", "smallTargets"], ["font families / web fonts", null], ["avg distinct font sizes", "distinctSizes"], ["skill invoked / refs read", null],
    ];
    for (const [name, key] of metrics) {
      const val = (c) => {
        if (!c) return "n/a";
        if (name === "tests passed/failed") return `${c.testsPassed ?? "?"}/${c.testsFailed ?? "?"}`;
        if (name === "font families / web fonts") return `${c.fontFamilies}/${c.webFonts}`;
        if (name === "skill invoked / refs read") return `${c.skillInvoked ? "yes" : "no"}/${c.refsRead ?? 0}`;
        const v = c[key]; return typeof v === "number" ? (Number.isInteger(v) ? v : +v.toFixed(3)) : v ?? "";
      };
      const num = (l) => (key && typeof cells[l]?.[key] === "number" ? cells[l][key] : null);
      rows.push(`| ${name} | ${labels.map((l) => val(cells[l])).join(" | ")} | ${comparisons.map(l => pct(num(target), num(l))).join(" | ")} |`);
    }
  }
  return rows.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { labels: { type: "string", default: "baseline,current" }, scenarios: { type: "string", default: "A,B,C,D" }, json: { type: "boolean", default: false } } });
  const labels = values.labels.split(","), scenarios = values.scenarios.split(",");
  if (values.json) console.log(JSON.stringify(scenarios.flatMap((s) => labels.map((l) => load(s, l)).filter(Boolean)), null, 2));
  else console.log(table(scenarios, labels));
}
