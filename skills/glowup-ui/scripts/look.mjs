#!/usr/bin/env node
// Fingerprint existing identity for inspection. Detection never grants permission to replace it.
// Heuristic and read-only: it counts Tailwind color classes, hex colors, font declarations, and layout markup.
//   node look.mjs [project-dir] [--json]     prints a summary and a ready `--current "..."` value for direction.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hexToOklch } from "./palette.mjs";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", ".svelte-kit", ".claude", ".agents", ".opencode", ".glowup-ui", ".glowup", "coverage", "tests", "test", "__tests__"]);
const SOURCE = /\.(css|scss|jsx?|tsx?|vue|svelte|astro|html)$/;
const HUE_WORDS = { red: [345, 30], orange: [30, 70], amber: [70, 100], yellow: [70, 110], green: [110, 170], emerald: [140, 170], teal: [170, 205], cyan: [195, 225], sky: [225, 245], blue: [245, 265], indigo: [265, 285], violet: [285, 305], purple: [290, 330], fuchsia: [315, 335], pink: [330, 360], rose: [350, 10] };
const NEUTRALS = new Set(["gray", "slate", "zinc", "neutral", "stone", "white", "black"]);
// Words direction.mjs understands, one per hue range.
const FAMILY = [["red", 345, 30], ["orange", 30, 70], ["amber", 70, 100], ["green", 100, 170], ["teal", 170, 205], ["blue", 205, 265], ["indigo", 265, 290], ["purple", 290, 330], ["pink", 330, 345]];

const inRange = (h, a, b) => (a <= b ? h >= a && h < b : h >= a || h < b);
const familyOfHue = (h) => (FAMILY.find(([, a, b]) => inRange(h, a, b)) || FAMILY[0])[0];
const familyOfWord = (w) => { const r = HUE_WORDS[w]; return familyOfHue(((r[0] + (r[1] < r[0] ? r[1] + 360 : r[1])) / 2) % 360); };

function listFiles(root, dir = root, out = []) {
  for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
    if (SKIP.has(e.name) || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(root, p, out);
    else if (e.isFile() && SOURCE.test(e.name) && fs.statSync(p).size < 400_000) out.push(p);
  }
  return out;
}

export function detectLook(root = ".") {
  const files = listFiles(path.resolve(root));
  const hues = new Map(), fonts = new Map(), hexCount = new Map();
  let themeTokens = 0, webFont = false;
  let dark = 0, light = 0, sidebar = 0, topbar = 0, tabs = 0, hasTheme = false;
  const bump = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n);
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const isCss = /\.s?css$/.test(f);
    for (const m of text.matchAll(/\b(?:bg|text|border|ring|from|to|via|fill|stroke|accent|outline|decoration)-([a-z]+)-(\d{2,3})\b/g)) {
      const [, color, shade] = m;
      if (color in HUE_WORDS) bump(hues, familyOfWord(color), Number(shade) >= 400 ? 2 : 1);
      if (NEUTRALS.has(color) && /\bbg-/.test(m[0]) && Number(shade) >= 800) dark++;
      if (NEUTRALS.has(color) && /\bbg-/.test(m[0]) && Number(shade) <= 100) light++;
    }
    if (/\bbg-(black|neutral-950)\b/.test(text)) dark++;
    if (/\bbg-white\b/.test(text)) light++;
    for (const m of text.matchAll(/(?:hsl\(\s*(\d+(?:\.\d+)?)(?:deg)?[\s,]+(\d+(?:\.\d+)?)%[\s,]+(\d+(?:\.\d+)?)%|oklch\(\s*(\d*\.?\d+%?)\s+(\d*\.?\d+)\s+(\d+(?:\.\d+)?))/gi)) {
      let h, c;
      if (m[1] !== undefined) { const sat = Number(m[2]) / 100, light = Number(m[3]) / 100; c = sat * Math.min(light, 1 - light) * 0.5; h = (Number(m[1]) + 25) % 360; }
      else { c = Number(m[5]); h = Number(m[6]); }
      if (c > 0.06) { bump(hues, familyOfHue(h), 1); bump(hexCount, `${m[0].replace(/\s+/g, " ")}`, 1); }
    }
    for (const m of text.matchAll(/#([0-9a-f]{6})\b/gi)) {
      try {
        const c = hexToOklch(`#${m[1]}`);
        if (c.c > 0.06) { bump(hues, familyOfHue(c.h), 1); bump(hexCount, `#${m[1].toLowerCase()}`, 1); }
        if (isCss && /(?:background(?:-color)?|--(?:bg|background|canvas|surface)[\w-]*)\s*:\s*$/.test(text.slice(Math.max(0, m.index - 40), m.index))) { if (c.l < 0.35) dark += 2; else if (c.l > 0.9) light += 2; }
      } catch { /* not a color */ }
    }
    if (/color-scheme\s*:\s*dark|prefers-color-scheme/.test(text) && /color-scheme\s*:\s*dark/.test(text)) dark += 3;
    if (/@theme|:root\s*\{[^}]*--/.test(text)) hasTheme = true;
    if (isCss) themeTokens += [...text.matchAll(/--(?:color|clr|c|brand|bg|text|surface|primary|accent|ink|line|border)[\w-]*\s*:/g)].length;
    if (/@fontsource|fonts\.googleapis\.com|@font-face|next\/font/.test(text)) webFont = true;
    for (const m of text.matchAll(/font-family\s*:\s*([^;}]+)/g)) bump(fonts, m[1].split(",")[0].replace(/["']/g, "").trim());
    for (const m of text.matchAll(/@fontsource(?:-variable)?\/([a-z0-9-]+)/g)) bump(fonts, m[1].replace(/-/g, " "));
    for (const m of text.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&:]+)/g)) bump(fonts, decodeURIComponent(m[1]).replace(/\+/g, " "));
    if (!isCss) {
      if (/<aside\b[^>]*>[\s\S]{0,700}<nav\b|\bsidebar\b|\bw-(?:56|60|64|72)\b[^"']*\b(?:fixed|sticky|h-screen|min-h-screen)|\bfixed\b[^"']*\binset-y-0\b/i.test(text)) sidebar++;
      if (/<header\b[^>]*>|<nav\b/i.test(text)) topbar++;
      if (/\bborder-b-2\b|role="tablist"/.test(text)) tabs++;
    }
  }
  const ranked = [...hues.entries()].sort((a, b) => b[1] - a[1]);
  const accent = ranked.length && ranked[0][1] >= 3 ? ranked[0][0] : null;
  const scheme = dark > light + 2 ? "dark" : "light";
  const shell = sidebar > 0 ? "sidebar" : topbar > 0 ? "top bar" : null;
  const font = [...fonts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n).filter((n) => !/^(system-ui|-apple-system|ui-sans-serif|sans-serif|inherit)$/i.test(n))[0] || null;
  const current = [scheme, accent, shell].filter(Boolean).join(", ");
  // A designed identity: custom tokens and/or loaded web fonts, plus a recurring custom brand color (a hex, not a Tailwind default).
  const hexRanked = [...hexCount.entries()].sort((a, b) => b[1] - a[1]);
  const brand = hexRanked.length && hexRanked[0][1] >= 2 ? hexRanked[0][0] : null;
  // Err on the side of REFINE: replacing a good identity does more harm than refining a mediocre one.
  // Only an app with no custom tokens, no web fonts, and no recurring custom color counts as default-looking.
  const designed = themeTokens >= 6 || webFont || Boolean(brand) || hasTheme && themeTokens >= 3;
  return { files: files.length, scheme, accent, shell, font, hasTheme, tabs: tabs > 0, current, brand, designed, designSignals: { themeTokens, webFont, brand }, accentCounts: Object.fromEntries(ranked.slice(0, 4)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const root = args.find((a) => !a.startsWith("--")) || ".";
  const look = detectLook(root);
  if (args.includes("--json")) console.log(JSON.stringify(look, null, 2));
  else {
    console.log(`Current look of ${path.resolve(root)} (${look.files} source files scanned)`);
    console.log(`  scheme: ${look.scheme}   accent: ${look.accent || "none found (neutral or default)"}   shell: ${look.shell || "unknown"}   font: ${look.font || "system default"}`);
    if (look.designed) console.log(`  Designed identity detected (${look.brand ? `brand ${look.brand}, ` : ""}${look.designSignals.themeTokens} theme tokens${look.designSignals.webFont ? ", web fonts" : ""}). Preserve brand and fonts; choose redesign or polish from the request, not identity detection.`);
    else console.log(`  No strong identity signals detected. Choose redesign or polish from the request; a new identity requires explicit intent.`);
  }
}
