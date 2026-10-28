#!/usr/bin/env node
// Generate a contrast-checked color system from one or two seed colors.
// Builds even OKLCH scales (50–950) for neutral, primary, accent, and status colors,
// maps them to semantic roles, and checks WCAG contrast for the pairs those roles imply.
//
//   node palette.mjs --primary "#17543f" [--accent "#c2410c"] [--neutral-tint 0.015]
//                    [--scheme light|dark] [--format css|tailwind|json]

import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { contrastRatio, parseHex } from "./contrast.mjs";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Target OKLCH lightness per step, and how much of the seed's chroma each step keeps.
const LIGHTNESS = { 50: 0.975, 100: 0.948, 200: 0.9, 300: 0.83, 400: 0.735, 500: 0.64, 600: 0.555, 700: 0.475, 800: 0.395, 900: 0.32, 950: 0.24 };
const CHROMA_SHAPE = { 50: 0.12, 100: 0.24, 200: 0.42, 300: 0.62, 400: 0.85, 500: 1, 600: 1, 700: 0.94, 800: 0.84, 900: 0.7, 950: 0.58 };
// Status hues in OKLCH degrees, with chroma kept moderate so they sit together.
const STATUS = { success: [152, 0.14], warning: [70, 0.15], danger: [27, 0.18], info: [245, 0.13] };

// --- color conversions (sRGB <-> OKLab <-> OKLCH) ---

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToOklch(hex) {
  const [r, g, b] = parseHex(hex).map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c: C, h: C < 1e-4 ? 0 : H };
}

function oklchToLinearRgb({ l, c, h }) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH → hex, reducing chroma until the color fits in sRGB. */
export function oklchToHex(color) {
  let { l, c, h } = color;
  let rgb = oklchToLinearRgb({ l, c, h });
  for (let i = 0; i < 40 && !inGamut(rgb); i++) {
    c *= 0.94;
    rgb = oklchToLinearRgb({ l, c, h });
  }
  return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, toGamma(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, "0")).join("");
}

// --- scales and roles ---

/** A 50–950 scale on the seed's hue. The step closest to the seed's lightness is the seed itself. */
export function buildScale(seedHex) {
  const seed = hexToOklch(seedHex);
  const nearest = STEPS.reduce((best, step) => (Math.abs(LIGHTNESS[step] - seed.l) < Math.abs(LIGHTNESS[best] - seed.l) ? step : best), STEPS[0]);
  const scale = {};
  for (const step of STEPS) {
    scale[step] = step === nearest ? seedHex.toLowerCase() : oklchToHex({ l: LIGHTNESS[step], c: seed.c * CHROMA_SHAPE[step], h: seed.h });
  }
  return { scale, seedStep: nearest };
}

export function buildNeutral(hue, tint = 0.012) {
  const scale = {};
  for (const step of STEPS) {
    const fade = step <= 100 || step >= 900 ? 0.6 : 1;
    scale[step] = oklchToHex({ l: LIGHTNESS[step], c: tint * fade, h: hue });
  }
  return scale;
}

function buildStatus(hue, chroma) {
  const scale = {};
  for (const step of STEPS) scale[step] = oklchToHex({ l: LIGHTNESS[step], c: chroma * CHROMA_SHAPE[step], h: hue });
  return scale;
}

/** First step, walking from `from` toward darker (or lighter) steps, whose contrast against `against` reaches `min`. */
function firstPassing(scale, against, min, from = 500, direction = "darker") {
  const steps = direction === "darker" ? STEPS.filter((s) => s >= from) : STEPS.filter((s) => s <= from).reverse();
  for (const step of steps) {
    if (contrastRatio(scale[step], against) >= min) return step;
  }
  return direction === "darker" ? 950 : 50;
}

/** Keep the brand seed as the action color when some text color can sit on it; darken only as a last resort. */
function pickAction(scale, seedStep, darkText) {
  const seed = scale[seedStep];
  if (contrastRatio(seed, "#ffffff") >= 4.5) return { step: seedStep, on: "#ffffff" };
  if (contrastRatio(seed, darkText) >= 4.5) return { step: seedStep, on: darkText };
  return { step: firstPassing(scale, "#ffffff", 4.5, seedStep), on: "#ffffff" };
}

export function buildPalette({ primary, accent, neutralTint = 0.012, neutralHue, scheme = "light" }) {
  const { scale: primaryScale, seedStep } = buildScale(primary);
  const hue = neutralHue ?? hexToOklch(primary).h;
  const scales = { neutral: buildNeutral(hue, neutralTint), primary: primaryScale };
  if (accent) scales.accent = buildScale(accent).scale;
  for (const [name, [h, c]] of Object.entries(STATUS)) scales[name] = buildStatus(h, c);

  const n = scales.neutral;
  const p = scales.primary;
  let roles;
  if (scheme === "dark") {
    const canvas = n[950];
    const actionStep = STEPS.find((s) => s >= 300 && contrastRatio(p[s], canvas) >= 4.5 && s <= 500) ?? 300;
    roles = {
      canvas, surface: n[900], raised: n[800], sunken: "#000000", border: n[800], "border-strong": n[firstPassing(n, n[900], 3, 700, "lighter")],
      text: n[50], muted: n[firstPassing(n, n[800], 4.5, 500, "lighter")],
      primary: p[actionStep], "primary-hover": p[Math.max(200, actionStep - 100)], "primary-soft": p[900], "primary-ink": p[200],
      "on-primary": contrastRatio(p[actionStep], n[950]) >= 4.5 ? n[950] : "#ffffff",
      focus: p[400],
    };
    for (const s of Object.keys(STATUS)) Object.assign(roles, { [`${s}-soft`]: scales[s][900], [`${s}`]: scales[s][400], [`${s}-ink`]: scales[s][200] });
  } else {
    const action = pickAction(p, seedStep, n[950]);
    // Hover moves away from the text color: darker under white text, lighter under dark text.
    const idx = STEPS.indexOf(action.step);
    const hoverStep = action.on === "#ffffff" ? STEPS[Math.min(STEPS.length - 1, idx + 1)] : STEPS[Math.max(0, idx - 1)];
    roles = {
      canvas: n[50], surface: "#ffffff", raised: "#ffffff", sunken: n[100], border: n[200],
      // Input and control outlines must reach 3:1 (WCAG 1.4.11); "border" is for decorative dividers.
      "border-strong": n[firstPassing(n, "#ffffff", 3, 400)],
      text: n[950], muted: n[firstPassing(n, n[100], 4.5, 600)],
      primary: p[action.step], "primary-hover": p[hoverStep], "primary-soft": p[100], "primary-ink": p[firstPassing(p, p[100], 4.5, 700)],
      "on-primary": action.on,
      // A link/text use of the primary needs 4.5:1 on white, which a light brand seed may not reach.
      "primary-text": p[firstPassing(p, "#ffffff", 4.5, Math.max(500, action.step))],
      focus: p[firstPassing(p, "#ffffff", 3, 500)],
    };
    for (const s of Object.keys(STATUS)) {
      const solid = firstPassing(scales[s], "#ffffff", 4.5, 600);
      Object.assign(roles, { [`${s}-soft`]: scales[s][100], [`${s}`]: scales[s][solid], [`${s}-ink`]: scales[s][800] });
    }
  }
  return { scheme, scales, roles, checks: contrastChecks(roles) };
}

/** WCAG checks for the pairs the roles are meant to be used in. */
export function contrastChecks(r) {
  const pairs = [
    ["text", "canvas", 4.5], ["text", "surface", 4.5], ["muted", "canvas", 4.5], ["muted", "surface", 4.5], ["muted", "sunken", 4.5],
    ["on-primary", "primary", 4.5], ["on-primary", "primary-hover", 4.5], [r["primary-text"] ? "primary-text" : "primary", "surface", 4.5], ["primary-ink", "primary-soft", 4.5],
    ["border-strong", "surface", 3], ["focus", "surface", 3],
  ];
  for (const s of Object.keys(STATUS)) pairs.push([`${s}-ink`, `${s}-soft`, 4.5], [`${s}`, "surface", 3]);
  return pairs.map(([fg, bg, min]) => {
    const ratio = Math.round(contrastRatio(r[fg], r[bg]) * 100) / 100;
    return { fg, bg, ratio, min, pass: ratio >= min };
  });
}

export function format(palette, kind = "css") {
  if (kind === "json") return JSON.stringify(palette, null, 2);
  const lines = [];
  for (const [name, scale] of Object.entries(palette.scales)) {
    for (const step of STEPS) lines.push(`  --color-${name}-${step}: ${scale[step]};`);
  }
  lines.push("");
  for (const [role, hex] of Object.entries(palette.roles)) lines.push(`  --color-${role}: ${hex};`);
  const body = lines.join("\n");
  const header = `/* Generated by glowup-ui palette.mjs (${palette.scheme}). Contrast: ${palette.checks.filter((c) => c.pass).length}/${palette.checks.length} pairs pass. */`;
  return kind === "tailwind" ? `${header}\n@theme {\n${body}\n}\n` : `${header}\n:root {\n${body}\n}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      primary: { type: "string" },
      accent: { type: "string" },
      "neutral-tint": { type: "string", default: "0.012" },
      scheme: { type: "string", default: "light" },
      format: { type: "string", default: "css" },
    },
  });
  if (!values.primary) {
    console.error('Usage: node palette.mjs --primary "#hex" [--accent "#hex"] [--neutral-tint 0.012] [--scheme light|dark] [--format css|tailwind|json]');
    process.exit(64);
  }
  try {
    const palette = buildPalette({ primary: values.primary, accent: values.accent, neutralTint: Number(values["neutral-tint"]), scheme: values.scheme });
    console.log(format(palette, values.format));
    if (values.format !== "json") {
      console.error("Contrast checks:");
      for (const c of palette.checks) console.error(`  ${c.pass ? "✓" : "✗"} ${c.fg} on ${c.bg}: ${c.ratio} (needs ${c.min})`);
    }
    process.exit(palette.checks.every((c) => c.pass) ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(64);
  }
}
