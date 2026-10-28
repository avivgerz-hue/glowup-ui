// Browser probe: for each route and viewport, record overflow, console errors, accessibility
// violations (axe-core), small touch targets, and typography facts. Read-only.

import fs from "node:fs";
import { createRequire } from "node:module";
import { loadPlaywright, browserOptions } from "../../skills/glowup-ui/scripts/screenshot.mjs";

export const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function axeSource() {
  const req = createRequire(import.meta.url);
  return fs.readFileSync(req.resolve("axe-core/axe.min.js"), "utf8");
}

const collect = () => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const families = {}, sizes = new Set(), colors = new Set();
  let textEls = 0;
  for (const el of document.body.querySelectorAll("*")) {
    if (!visible(el)) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    textEls++;
    const s = getComputedStyle(el);
    const fam = s.fontFamily.split(",")[0].trim().replace(/["']/g, "");
    families[fam] = (families[fam] || 0) + 1;
    sizes.add(s.fontSize);
    colors.add(s.color);
  }
  let small = 0;
  for (const el of document.querySelectorAll("button, [role=button], input:not([type=hidden]), select, textarea, a[href]")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === "A" && getComputedStyle(el).display === "inline";
    if (!inline && (r.width < 24 || r.height < 24)) small++;
  }
  const loaded = [...(document.fonts || [])].filter((f) => f.status === "loaded").map((f) => f.family.replace(/["']/g, ""));
  return {
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    h1: document.querySelectorAll("h1").length,
    textLength: document.body.innerText.length,
    fontFamilies: families,
    distinctFontSizes: sizes.size,
    distinctTextColors: colors.size,
    smallTargets: small,
    webFontsLoaded: [...new Set(loaded)],
  };
};

export async function probe({ baseUrl, routes, viewports = VIEWPORTS }) {
  const pw = await loadPlaywright();
  if (!pw) throw new Error("Playwright is not installed");
  const axe = axeSource();
  const browser = await pw.chromium.launch(browserOptions());
  const rows = [];
  try {
    for (const vp of viewports) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce", isMobile: vp.width < 600, hasTouch: vp.width < 600 });
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
      for (const route of routes) {
        errors.length = 0;
        const row = { route, viewport: vp.name, ok: true };
        try {
          await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
          await page.waitForTimeout(250);
          Object.assign(row, await page.evaluate(collect));
          await page.addScriptTag({ content: axe });
          row.axe = await page.evaluate(async () => {
            const r = await window.axe.run(document, { resultTypes: ["violations"] });
            return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
          });
          row.consoleErrors = [...errors];
        } catch (error) {
          row.ok = false;
          row.error = String(error.message).split("\n")[0];
        }
        rows.push(row);
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  return rows;
}

export function summarizeProbe(rows) {
  const ok = rows.filter((r) => r.ok);
  const impact = (r, level) => (r.axe || []).filter((v) => v.impact === level).reduce((n, v) => n + v.nodes, 0);
  const families = {};
  for (const r of ok) for (const [f, n] of Object.entries(r.fontFamilies || {})) families[f] = (families[f] || 0) + n;
  const web = new Set(ok.flatMap((r) => r.webFontsLoaded || []));
  const contrast = ok.reduce((n, r) => n + (r.axe || []).filter((v) => v.id === "color-contrast").reduce((a, v) => a + v.nodes, 0), 0);
  return {
    pages: rows.length,
    pagesFailedToLoad: rows.length - ok.length,
    mobileOverflowPages: ok.filter((r) => r.viewport === "mobile" && r.overflowX).length,
    desktopOverflowPages: ok.filter((r) => r.viewport === "desktop" && r.overflowX).length,
    pagesWithConsoleErrors: ok.filter((r) => r.consoleErrors?.length).length,
    pagesWithoutH1: ok.filter((r) => r.h1 === 0).length,
    axeCritical: ok.reduce((n, r) => n + impact(r, "critical"), 0),
    axeSerious: ok.reduce((n, r) => n + impact(r, "serious"), 0),
    contrastFailures: contrast,
    smallTargetsMobile: ok.filter((r) => r.viewport === "mobile").reduce((n, r) => n + (r.smallTargets || 0), 0),
    fontFamilies: Object.keys(families).length,
    topFonts: Object.entries(families).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f]) => f),
    webFontsLoaded: [...web],
    avgDistinctFontSizes: ok.length ? Math.round((ok.reduce((n, r) => n + (r.distinctFontSizes || 0), 0) / ok.length) * 10) / 10 : 0,
  };
}
