#!/usr/bin/env node
// WCAG 2.x contrast ratio between two hex colors.
// Usage: node contrast.mjs "#6b7280" "#ffffff"

import { fileURLToPath } from "node:url";

export function parseHex(input) {
  const hex = String(input).trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
    throw new Error(`Not a hex color: ${input} (use #rgb or #rrggbb)`);
  }
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function channel(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(rgb) {
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const la = luminance(parseHex(a));
  const lb = luminance(parseHex(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function grade(ratio) {
  return {
    ratio: Math.round(ratio * 100) / 100,
    aaText: ratio >= 4.5,
    aaLargeText: ratio >= 3,
    aaUi: ratio >= 3,
    aaaText: ratio >= 7,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [fg, bg] = process.argv.slice(2);
  if (!fg || !bg) {
    console.error('Usage: node contrast.mjs "<foreground hex>" "<background hex>"');
    process.exit(64);
  }
  try {
    const result = grade(contrastRatio(fg, bg));
    console.log(JSON.stringify({ foreground: fg, background: bg, ...result }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(64);
  }
}
