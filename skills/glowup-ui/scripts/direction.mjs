#!/usr/bin/env node
// Pick a visual direction for a product and emit a ready-to-paste design system.
//
//   node direction.mjs --product "personal finance dashboard for freelancers" --surface app
//   node direction.mjs --product "..." --surface commerce --out src/theme.css
//   node direction.mjs --product "..." --direction luxe --brand "#7a1f3d" --keep-fonts
//
// Why a script: asked to invent a look, a model drifts to the category default (Inter, slate,
// indigo, a sidebar and four KPI cards). Scoring a curated set of directions against the product,
// breaking ties with a hash of the product text, gives a committed, distinct, internally consistent
// starting point in one call. The agent may override it with --direction.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import { DIRECTIONS, SURFACES, GENERIC_KEYWORDS } from "./directions.mjs";
import { buildPalette, hexToOklch } from "./palette.mjs";
import { detectLook } from "./look.mjs";
import { composition, formatComposition } from "./composition.mjs";

export function hashString(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const words = (text) => new Set(String(text).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
// The look agents default to for any app. Only chosen when asked for by id, never dealt automatically.
const NEVER_AUTO = new Set(["saas-mist"]);
// When an app has no domain signal at all, deal from directions that are calm and work for any tool.
const NEUTRAL_POOLS = {
  app: ["control-room", "clinical-calm", "civic-clear", "ledger", "soft-pastel", "instrument"],
  service: ["clinical-calm", "civic-clear", "luxe", "field-notes", "soft-pastel"],
  commerce: ["storefront", "paper-goods", "field-notes", "luxe"],
  marketing: ["soft-pastel", "field-notes", "poster", "civic-clear", "night-signal"],
  editorial: ["ledger", "field-notes", "paper-goods", "luxe"],
};

const HUES = { red: [345, 30], orange: [30, 70], amber: [70, 100], yellow: [70, 110], green: [110, 170], teal: [170, 205], cyan: [195, 225], blue: [225, 265], indigo: [265, 290], iris: [265, 290], purple: [290, 330], violet: [290, 330], pink: [330, 360] };
const inRange = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);
const hueOf = (hex) => { try { return hexToOklch(hex).h || 0; } catch { return 0; } };

/**
 * Directions to leave behind when redesigning: --current "light, blue, sidebar" drops directions with the same scheme and
 * accent hue family as the existing look (a redesign should not land on a recolored version of what it replaces).
 */
export function leaveBehind(current = "") {
  const w = words(current);
  const scheme = w.has("dark") ? "dark" : w.has("light") || w.has("white") ? "light" : null;
  const hues = Object.entries(HUES).filter(([name]) => w.has(name)).map(([, range]) => range);
  return (d) => hues.length > 0 && (!scheme || d.palette.scheme === scheme) && hues.some((r) => inRange(hueOf(d.palette.primary), r));
}

// invoice ~ invoicing, booking ~ bookings, recipe ~ recipes: words that share their first 6 letters (or one is a prefix of the other, 5+ letters).
const sameStem = (a, b) => (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a))) || (a.length >= 6 && b.length >= 6 && a.slice(0, 6) === b.slice(0, 6));

/** Score every direction against the product text and surface, best first. */
export function rankDirections(product, surface, { exclude = () => false } = {}) {
  const w = words(product);
  const ranked = DIRECTIONS.map((d) => {
    const matched = d.keywords.filter((k) => w.has(k) || [...w].some((x) => sameStem(k, x)));
    const hits = matched.length;
    const evidence = matched.reduce((n, k) => n + (GENERIC_KEYWORDS.has(k) ? 1 : 3), 0);
    const surfaceFit = d.surfaces.includes(surface) ? 1 : -100;
    // Specific domain words weigh most; the generic productivity look must earn its place.
    const score = evidence + surfaceFit;
    return { direction: d, hits, score };
  }).filter((r) => r.score > -50 && !exclude(r.direction));
  const seed = hashString(`${surface}:${product}`);
  // Deterministic jitter: near-equal candidates are ordered by the product hash, so different
  // products land on different directions while the same product always gets the same one.
  return ranked
    .map((r, i) => ({ ...r, tie: hashString(`${r.direction.id}:${seed}`) % 1000 / 1000 }))
    .sort((a, b) => b.score - a.score || b.tie - a.tie);
}

export function pickDirection(product, surface, forcedId, { current = "", avoid = [] } = {}) {
  const left = leaveBehind(current);
  const ranked = rankDirections(product, surface, { exclude: (d) => !forcedId && (left(d) || avoid.includes(d.id)) });
  if (forcedId) {
    const found = DIRECTIONS.find((d) => d.id === forcedId);
    if (!found) throw new Error(`Unknown direction "${forcedId}". Known: ${DIRECTIONS.map((d) => d.id).join(", ")}`);
    return { chosen: found, runnersUp: ranked.filter((r) => r.direction.id !== forcedId).slice(0, 2).map((r) => r.direction), forced: true, evidence: null };
  }
  const auto = ranked.filter((r) => !NEVER_AUTO.has(r.direction.id));
  const top = auto[0].score;
  // Candidates within 1 point of the best are all reasonable; the hash picks among them.
  let pool = auto.filter((r) => r.score >= top - 1).slice(0, 3);
  // No domain evidence (best score is only the surface fit): deal from the surface's neutral pool.
  if (top <= 1 && NEUTRAL_POOLS[surface]) {
    const neutral = auto.filter((r) => NEUTRAL_POOLS[surface].includes(r.direction.id));
    if (neutral.length) pool = neutral;
  }
  const pick = pool[hashString(`${surface}:${product}`) % pool.length];
  const chosen = pick.direction;
  return { chosen, runnersUp: ranked.filter((r) => r.direction.id !== chosen.id).slice(0, 2).map((r) => r.direction), forced: false, evidence: pick.hits ? Math.max(0, pick.score - 1) : 0 };
}

const FALLBACK = { sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', serif: 'ui-serif, Georgia, "Times New Roman", serif', mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' };
const stack = (f) => `"${f.family}", ${FALLBACK[f.kind]}`;

export function designSystem(direction, { brand, keepFonts = false } = {}) {
  const p = direction.palette;
  const palette = buildPalette({ primary: brand || p.primary, accent: p.accent, neutralTint: p.tint, neutralHue: p.neutralHue, scheme: p.scheme });
  const r = palette.roles;
  const fonts = direction.fonts;
  const packages = keepFonts ? [] : [...new Set(Object.values(fonts).map((f) => f.pkg))];
  const acc = palette.scales.accent;
  const roles = {
    canvas: r.canvas, surface: r.surface, raised: r.raised, sunken: r.sunken, line: r.border, "line-strong": r["border-strong"],
    ink: r.text, muted: r.muted,
    primary: r.primary, "primary-hover": r["primary-hover"], "primary-soft": r["primary-soft"], "primary-ink": r["primary-ink"], "on-primary": r["on-primary"],
    "primary-text": r["primary-text"] || r.primary,
    accent: acc[p.scheme === "dark" ? 400 : 600], "accent-soft": acc[p.scheme === "dark" ? 900 : 100], "accent-ink": acc[p.scheme === "dark" ? 200 : 800],
    ok: r.success, "ok-soft": r["success-soft"], "ok-ink": r["success-ink"],
    warn: r.warning, "warn-soft": r["warning-soft"], "warn-ink": r["warning-ink"],
    bad: r.danger, "bad-soft": r["danger-soft"], "bad-ink": r["danger-ink"],
    info: r.info, "info-soft": r["info-soft"], "info-ink": r["info-ink"],
    focus: r.focus,
  };
  return { palette, roles, packages, fonts, keepFonts };
}

function shadows(direction, roles) {
  const dark = direction.palette.scheme === "dark";
  const ink = dark ? "0 0 0" : "20 18 14";
  switch (direction.surface) {
    case "hardshadow": return { card: `4px 4px 0 0 ${roles.ink}`, pop: `6px 6px 0 0 ${roles.ink}` };
    case "ruled": case "hairline": return { card: "none", pop: `0 8px 24px -8px rgb(${ink} / 0.18)` };
    case "tonal": return { card: "none", pop: `0 12px 32px -10px rgb(${ink} / ${dark ? 0.6 : 0.2})` };
    case "paper": return { card: `0 1px 0 rgb(${ink} / 0.06), 0 6px 14px -8px rgb(${ink} / 0.14)`, pop: `0 14px 30px -12px rgb(${ink} / 0.25)` };
    case "tinted": case "soft": return { card: `0 1px 2px rgb(${ink} / 0.05), 0 8px 24px -12px rgb(${ink} / 0.12)`, pop: `0 16px 40px -14px rgb(${ink} / 0.22)` };
    default: return { card: `0 1px 2px rgb(${ink} / 0.06)`, pop: `0 10px 30px -10px rgb(${ink} / 0.2)` };
  }
}

/** Tailwind v4 theme file: font imports, @theme tokens, and base styles. */
export function themeCss(direction, system, { plain = false } = {}) {
  const { roles, fonts, packages } = system;
  const sh = shadows(direction, roles);
  const tabular = direction.numerals === "mono" ? "var(--font-mono)" : "var(--font-sans)";
  const lines = [];
  if (!plain) lines.push('@import "tailwindcss";');
  for (const pkg of packages) lines.push(`@import "${pkg}";`);
  lines.push("", `/* Direction: ${direction.name} (${direction.id}). ${direction.summary} */`, plain ? ":root {" : "@theme {");
  // keepFonts: the project already has its own typefaces, so the theme must not name fonts that are not installed.
  if (!system.keepFonts) {
    lines.push(`  --font-sans: ${stack(fonts.body)};`, `  --font-display: ${stack(fonts.display)};`);
    lines.push(`  --font-mono: ${stack(fonts.mono || { kind: "mono", family: "ui-monospace" })};`);
  }
  const hard = direction.surface === "hardshadow";
  for (const [name, hex] of Object.entries(roles)) lines.push(`  --color-${name}: ${hard && (name === "line" || name === "line-strong") ? roles.ink : hex};`);
  if (hard) lines.push("  --card-border: 2px;");
  lines.push(`  --radius-control: ${direction.shape.control};`, `  --radius-card: ${direction.shape.card};`, `  --radius-sheet: ${direction.shape.sheet};`, `  --radius-pill: ${direction.shape.pill};`);
  lines.push(`  --shadow-card: ${sh.card};`, `  --shadow-pop: ${sh.pop};`, "}", "");
  lines.push("@layer base {", "  html { color-scheme: " + direction.palette.scheme + "; }");
  lines.push(`  body { background: var(--color-canvas); color: var(--color-ink); ${system.keepFonts ? "" : "font-family: var(--font-sans); "}font-size: 16px; line-height: 1.55; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }`);
  lines.push(`  h1, h2, h3, h4 { ${system.keepFonts ? "" : "font-family: var(--font-display); "}font-weight: ${direction.heading.weight}; letter-spacing: ${direction.heading.tracking}; line-height: 1.12; text-wrap: balance; }`);
  lines.push(`  .num, table, [data-numeric] { font-variant-numeric: tabular-nums;${system.keepFonts ? "" : ` font-family: ${tabular};`} }`);
  lines.push("  :focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }");
  lines.push("  ::selection { background: var(--color-primary-soft); color: var(--color-primary-ink); }");
  lines.push("  @media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }", "}", "");
  return lines.join("\n");
}

function brief(direction, runnersUp, system, forced, surface, product, extra = {}) {
  const f = direction.fonts;
  const failing = system.palette.checks.filter((c) => !c.pass).length;
  const out = [];
  out.push(`DIRECTION: ${direction.name} (${direction.id})${forced ? " [chosen by you]" : ""}`);
  out.push(`For: ${product} · surface: ${surface} = ${SURFACES[surface]}`);
  if (extra.leaving) out.push(`Leaving behind: ${extra.leaving} (the new look must not be a recolor of it)`);
  if (!forced && extra.evidence === 0) out.push("Match: weak. No domain words in the product text matched an allowed direction, so this one came from a neutral pool. If you know the product's personality (playful, formal, premium, technical), pick with --direction <id> from --list.");
  else if (!forced && extra.evidence >= 3) out.push("Match: strong.");
  out.push(direction.summary, "");
  out.push(`Fonts: display ${f.display.family}; body ${f.body.family}${f.mono ? `; mono ${f.mono.family}` : ""}.`);
  out.push(system.packages.length ? `Install once (or pass --install): npm i ${system.packages.join(" ")}` : "Fonts: keep the project's existing fonts.");
  out.push(`Palette (${direction.palette.scheme}): canvas ${system.roles.canvas}, ink ${system.roles.ink}, primary ${system.roles.primary} (text on it: ${system.roles["on-primary"]}), accent ${system.roles.accent}. Contrast checks failing: ${failing}.`);
  out.push(`Shape: controls ${direction.shape.control}, cards ${direction.shape.card}, sheets ${direction.shape.sheet}. Surfaces: ${direction.surface}. Density: ${direction.density}. Headings weight ${direction.heading.weight}, tracking ${direction.heading.tracking}. Numerals: ${direction.numerals}.`);
  out.push(`Shell: ${direction.shells[surface] || Object.values(direction.shells)[0]}`);
  out.push("Optional signature treatment (reuse where it supports the content): " + direction.motif.join("; ") + ".");
  out.push("Signature moves:"); for (const m of direction.moves) out.push(`  - ${m}`);
  out.push("Avoid: " + direction.avoid.join("; ") + ".", "");
  out.push(`Runners-up if this feels wrong for the product: ${runnersUp.map((d) => `${d.id} (${d.name})`).join(", ")}. Re-run with --direction <id>.`);
  out.push("", formatComposition(composition(product)));
  return out.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values: v } = parseArgs({ options: {
    product: { type: "string" }, surface: { type: "string", default: "app" }, direction: { type: "string" },
    brand: { type: "string" }, current: { type: "string" }, avoid: { type: "string" }, "keep-fonts": { type: "boolean", default: false }, out: { type: "string" },
    install: { type: "boolean", default: false }, mode: { type: "string" },
    format: { type: "string", default: "brief" }, plain: { type: "boolean", default: false }, list: { type: "boolean", default: false },
  } });
  if (v.list) { for (const d of DIRECTIONS) console.log(`${d.id.padEnd(14)} ${d.name.padEnd(24)} ${d.surfaces.join("/")}  ${d.summary}`); process.exit(0); }
  if (!v.product) { console.error('Usage: node direction.mjs --product "what it is and who it is for" --surface app|marketing|commerce|editorial|service [--mode create|refine|replace] [--out NEW-FILE.css] [--install] [--direction id] [--current "light, blue"] [--avoid id,id] [--brand "#hex"] [--keep-fonts] [--list]'); process.exit(64); }
  if (!SURFACES[v.surface]) { console.error(`Unknown surface "${v.surface}". Use: ${Object.keys(SURFACES).join(", ")}`); process.exit(64); }
  try {
    if (v.mode && !["create", "refine", "replace"].includes(v.mode)) throw new Error("--mode must be create, refine, or replace");
    const detected = detectLook(process.cwd());
    const existing = detected.files > 0;
    const look = v.current === "auto" || existing ? detected : null;
    // Existing applications default to preservation even when detection finds no brand.
    // A style fingerprint cannot grant permission to replace someone's application.
    const mode = v.mode || (existing ? "refine" : "create");
    if (mode === "refine") {
      const result = { mode, look, packages: [], writes: [], instruction: "Keep the existing palette, fonts, logo, shell, and dependencies. Fix evidenced usability, hierarchy, responsive, and accessibility weaknesses with local edits. No generated theme or font installation." };
      if (v.format === "json") console.log(JSON.stringify(result, null, 2));
      else console.log(`REFINE MODE: preserve the existing application.\n${result.instruction}\n${v.out ? `Left ${v.out} untouched; no suggestion file generated.` : ""}`);
      process.exit(0);
    }
    if (mode === "create" && existing) throw new Error("Application source already exists. Use REFINE, or --mode replace only for an explicitly requested new visual direction.");
    const leaving = look ? look.current : v.current;
    const brand = v.brand;
    const keepFonts = v["keep-fonts"];
    const { chosen, runnersUp, forced, evidence } = pickDirection(v.product, v.surface, v.direction, { current: leaving, avoid: (v.avoid || "").split(",").filter(Boolean) });
    const system = designSystem(chosen, { brand, keepFonts });
    const css = themeCss(chosen, system, { plain: v.plain });
    const outPath = v.out;
    if (v.out && fs.existsSync(v.out)) throw new Error(`Refusing to overwrite ${v.out}.`);
    if (outPath) { fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true }); fs.writeFileSync(outPath, css); }
    if (v.install && system.packages.length) {
      const r = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...system.packages], { stdio: ["ignore", "ignore", "inherit"] });
      if (r.status !== 0) throw new Error(`Font install failed. Run: npm i ${system.packages.join(" ")}`);
    }
    if (v.format === "css") console.log(css);
    else if (v.format === "json") console.log(JSON.stringify({ composition: composition(v.product), direction: chosen.id, roles: system.roles, packages: system.packages, runnersUp: runnersUp.map((d) => d.id) }, null, 2));
    else console.log(brief(chosen, runnersUp, system, forced, v.surface, v.product, { leaving, evidence }) + (outPath ? `\n\nWrote new design tokens to ${outPath}. Merge into an existing app without replacing its CSS entry.` : ""));
  } catch (error) {
    console.error(error.message);
    process.exit(64);
  }
}
