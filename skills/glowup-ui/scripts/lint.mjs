#!/usr/bin/env node
// Static accessibility and craft checks for JSX/TSX/Vue-like templates. Fast, read-only, no browser.
// Catches what real-browser audits kept finding in agent-built UIs:
//   label-in-name, icon-only controls with no name, img without alt, scroll regions without keyboard access,
//   click handlers on non-interactive elements, inputs without labels, removed focus outlines, skipped heading levels,
//   multiple h1, tiny touch targets, class names built by template strings (Tailwind cannot see them).
//   node lint.mjs [dir ...] [--json]      exit 1 when any error is found
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", ".claude", ".agents", ".glowup", "coverage", "tests", "test", "__tests__"]);
const CODE = /\.(jsx|tsx|vue|svelte|astro|html)$/;
const line = (text, i) => text.slice(0, i).split("\n").length;

/** Read one opening tag starting at `<`: name, attribute string, end index, self-closing. Handles {} and quotes. */
function readTag(text, i) {
  const m = /^<([A-Za-z][\w.:-]*)/.exec(text.slice(i, i + 80));
  if (!m) return null;
  let j = i + m[0].length, depth = 0, quote = null;
  for (; j < text.length; j++) {
    const ch = text[j];
    if (quote) { if (ch === quote && text[j - 1] !== "\\") quote = null; continue; }
    if (ch === '"' || ch === "'" || (ch === "`" && depth > 0)) { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0 && text[j - 1] !== "=") break;
  }
  const attrs = text.slice(i + m[0].length, j);
  return { name: m[1], attrs, end: j + 1, selfClosing: attrs.trimEnd().endsWith("/") };
}

const attr = (attrs, name) => { const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\})`).exec(attrs); return m ? m[1] ?? m[2] ?? m[3] : /(?:^|\s)name(?=\s|\/|$)/.test(attrs) && name === "name" ? "" : undefined; };
const has = (attrs, name) => new RegExp(`(?:^|\\s)${name}(?:\\s*=|\\s|/|$)`).test(attrs);
const visibleText = (inner) => inner.replace(/<[^>]*>/g, " ").replace(/\{[^}]*\}/g, " ").replace(/\s+/g, " ").trim();
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

export function lintSource(text, file = "file") {
  const out = [];
  const add = (severity, rule, i, message) => out.push({ severity, rule, file, line: line(text, i), message });
  const headings = [];
  for (let i = text.indexOf("<"); i !== -1; i = text.indexOf("<", i + 1)) {
    if (text[i + 1] === "/" || text[i + 1] === "!") continue;
    const tag = readTag(text, i);
    if (!tag) continue;
    const { name, attrs } = tag;
    const lower = name.toLowerCase();
    const cls = attr(attrs, "className") ?? attr(attrs, "class") ?? "";
    let inner = "";
    if (!tag.selfClosing) { const close = text.indexOf(`</${name}>`, tag.end); if (close !== -1 && close - tag.end < 1500) inner = text.slice(tag.end, close); }
    const label = attr(attrs, "aria-label"), labelledby = has(attrs, "aria-labelledby"), title = attr(attrs, "title");
    if (["button", "a"].includes(lower) || /^(Button|IconButton|Link|NavLink)$/.test(name)) {
      const text2 = visibleText(inner);
      if (label && text2 && !normalize(text2).split(" ").every((w) => !w) && !normalize(label).includes(normalize(text2)) && !normalize(text2).includes(normalize(label))) {
        add("error", "label-in-name", i, `aria-label "${label}" does not contain the visible text "${text2}". Drop the label or include the text.`);
      }
      const dynamicText = /\{[^}]*\}/.test(inner.replace(/<[^>]*>/g, " "));
      const iconOnly = !text2 && !dynamicText && /<(svg|Icon)\b/.test(inner) && !/sr-only|visually-hidden/.test(inner);
      if (iconOnly && !label && !labelledby && !title) add("error", "icon-only-name", i, "Icon-only control has no accessible name. Add aria-label.");
      if (/(?:^|[\s"'`:])(?:h|w|size)-(?:[3-8])\b/.test(cls) && !/min-[hw]-|\bp[xy]?-[2-9]|before:|after:/.test(cls) && iconOnly) add("warn", "small-target", i, "Icon button under 36px. Use at least 40px (44px on touch), or pad the hit area.");
    }
    if (lower === "img" && !has(attrs, "alt")) add("error", "img-alt", i, 'Image has no alt. Use a description, or alt="" if decorative.');
    if (/\boverflow-(?:x-|y-)?(?:auto|scroll)\b/.test(cls) && !has(attrs, "tabIndex") && !has(attrs, "tabindex") && /^(div|section|ul|ol|table|nav)$/.test(lower)) add("warn", "scroll-region", i, "Scrollable container needs tabIndex={0} and an aria-label (or role=region) so keyboard users can scroll it.");
    if (has(attrs, "onClick") && /^(div|span|li|p|tr|td|section|article|img)$/.test(lower) && !has(attrs, "role") && !has(attrs, "tabIndex")) add("error", "click-non-interactive", i, `onClick on <${lower}> without a role and tabIndex. Use <button>, or add role, tabIndex, and a key handler.`);
    if (/^(input|select|textarea)$/.test(lower) && !/type\s*=\s*["'](?:hidden|submit|button)["']/.test(attrs)) {
      const before = text.slice(0, i);
      const wrapped = before.lastIndexOf("<label") > before.lastIndexOf("</label>");
      const named = label || labelledby || has(attrs, "id") || has(attrs, "label") || wrapped;
      if (!named) add("warn", "input-label", i, "Form control without id/label link or aria-label. A placeholder is not a label.");
      else if (!label && !labelledby && !has(attrs, "label") && has(attrs, "placeholder") && !/htmlFor=|<label/.test(text)) add("warn", "input-label", i, "Form control relies on its placeholder as a label.");
    }
    if (/\b(?:focus:)?outline-none\b/.test(cls) && !/focus-visible:(?:ring|outline|border|shadow)|focus:(?:ring|border|shadow)/.test(cls)) add("error", "focus-outline", i, "Outline removed with no replacement focus style. Add focus-visible:ring or focus-visible:outline.");
    if (/^h[1-6]$/.test(lower)) headings.push({ level: Number(lower[1]), i });
    if (/`[^`]*\$\{[^}]*\}[^`]*`/.test(attrs) && /(?:bg|text|border|ring|fill|stroke|from|to|via|rounded|p|m|w|h|gap)-\$\{/.test(attrs)) add("error", "dynamic-class", i, "Tailwind classes built with a template string are not generated. Map each variant to a full class name.");
    if (/\b(?:bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/.test(cls)) add("warn", "raw-hex", i, "Raw hex color in a class. Use the theme's role tokens (bg-surface, text-ink, border-line, bg-primary).");
  }
  const h1 = headings.filter((h) => h.level === 1);
  if (h1.length > 1) add("warn", "multiple-h1", h1[1].i, "More than one h1 in this file. One h1 per page.");
  for (let k = 1; k < headings.length; k++) if (headings[k].level - headings[k - 1].level > 1) add("warn", "heading-order", headings[k].i, `Heading jumps from h${headings[k - 1].level} to h${headings[k].level}. Keep levels in order.`);
  return out;
}

export function lintDir(roots) {
  const results = [];
  const walk = (dir) => {
    for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
      if (e.name.startsWith(".") && e.name !== ".") continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p); } else if (CODE.test(e.name)) results.push(...lintSource(fs.readFileSync(p, "utf8"), path.relative(process.cwd(), p)));
    }
  };
  for (const r of roots) { const abs = path.resolve(r); if (fs.statSync(abs).isDirectory()) walk(abs); else results.push(...lintSource(fs.readFileSync(abs, "utf8"), path.relative(process.cwd(), abs))); }
  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const roots = args.filter((a) => !a.startsWith("--"));
  const found = lintDir(roots.length ? roots : ["src"].filter((d) => fs.existsSync(d)).concat(roots.length ? [] : fs.existsSync("src") ? [] : ["."]));
  if (args.includes("--json")) console.log(JSON.stringify(found, null, 2));
  else if (!found.length) console.log("✓ lint: no accessibility or craft problems found by the static checks (this does not replace a browser check)");
  else {
    for (const f of found.slice(0, 40)) console.log(`${f.severity === "error" ? "✗" : "!"} ${f.file}:${f.line} [${f.rule}] ${f.message}`);
    if (found.length > 40) console.log(`...and ${found.length - 40} more`);
    console.log(`${found.filter((f) => f.severity === "error").length} errors, ${found.filter((f) => f.severity === "warn").length} warnings`);
  }
  process.exit(found.some((f) => f.severity === "error") ? 1 : 0);
}
