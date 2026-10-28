// Browser-side evidence, not a design score or complete accessibility audit.
// Passed directly to page.evaluate; keep it self-contained and never read form values.
export function measurePage() {
  const styles = new WeakMap();
  const styleOf = (el) => { if (!styles.has(el)) styles.set(el, window.getComputedStyle(el)); return styles.get(el); };
  const text = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 160);
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = styleOf(el);
    return r.width > 1 && r.height > 1 && s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0" && !el.closest('[hidden], [inert], [aria-hidden="true"]');
  };
  const name = (el) => text(el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ") || [...(el.labels || [])].map((l) => l.textContent).join(" ") || el.textContent || el.getAttribute("alt") || el.getAttribute("title"));
  const nodes = document.body.querySelectorAll("*");
  const elements = [...nodes].slice(0, 10000).filter(visible);
  const headings = elements.filter((el) => /^H[1-6]$/.test(el.tagName)).map((el) => ({ level: Number(el.tagName[1]), text: text(el.textContent), size: parseFloat(styleOf(el).fontSize) }));
  const controls = elements.filter((el) => el.matches('button, input:not([type="hidden"]), select, textarea, [role="button"]'));
  const links = elements.filter((el) => el.matches("a[href]"));
  const targets = [...controls, ...links].map((el) => {
    const r = el.getBoundingClientRect();
    const inlineLink = el.tagName === "A" && styleOf(el).display === "inline";
    return { name: name(el), tag: el.tagName.toLowerCase(), width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10, inlineLink };
  });
  const prose = elements.filter((el) => el.matches("p, li, td, label") && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const tinyText = prose.filter((el) => parseFloat(styleOf(el).fontSize) < 12).map((el) => text(el.textContent));
  const longLines = prose.filter((el) => el.matches("p") && el.textContent.length > 120 && el.getBoundingClientRect().width / parseFloat(styleOf(el).fontSize) > 45).map((el) => text(el.textContent));
  const scrollRegions = elements.filter((el) => el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(styleOf(el).overflowX)).map((el) => ({ name: name(el), keyboard: el.tabIndex >= 0 || Boolean(el.querySelector('a[href],button,input,select,textarea,[tabindex="0"]')) }));
  const banners = elements.filter((el) => el.matches('[role="banner"], header') && !el.closest("main, article, aside, section, nav, [role='main']"));
  const colors = new Map(), canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgb = (value) => {
    if (colors.has(value)) return colors.get(value);
    let color = null;
    if (/^rgba?\(/.test(value)) {
      const values = value.match(/[\d.]+/g)?.map(Number);
      if (values?.length >= 3) color = [...values.slice(0, 3), values[3] ?? 1];
    } else if (ctx) {
      // Resolve modern computed colors (e.g. Tailwind v4 OKLCH) through Chromium's
      // own color parser. Two sentinels distinguish rejection from a valid black.
      ctx.fillStyle = "#010203"; ctx.fillStyle = value; const a = ctx.fillStyle;
      ctx.fillStyle = "#040506"; ctx.fillStyle = value;
      if (a === ctx.fillStyle) { ctx.clearRect(0, 0, 1, 1); ctx.fillRect(0, 0, 1, 1); const p = ctx.getImageData(0, 0, 1, 1).data; color = [p[0], p[1], p[2], p[3] / 255]; }
    }
    colors.set(value, color); return color;
  };
  const blend = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
  const luminance = (color) => color.slice(0, 3).map((v) => { const n = v / 255; return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
  const contrastFailures = [];
  let contrastChecked = 0, contrastUnverified = 0;
  for (const el of elements.filter((el) => el.namespaceURI === "http://www.w3.org/1999/xhtml" && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !el.closest(':disabled,[aria-disabled="true"]'))) {
    const style = styleOf(el), fg = rgb(style.color), layers = [];
    let unknown = !fg, covered = false;
    for (let node = el; node; node = node.parentElement) {
      const s = styleOf(node), bg = rgb(s.backgroundColor);
      if (Number(s.opacity) !== 1 || s.mixBlendMode !== "normal" || s.backgroundClip === "text") { unknown = true; break; }
      if (!covered) {
        if (s.backgroundImage !== "none" || !bg) { unknown = true; break; }
        layers.push(bg); covered = bg[3] === 1;
      }
    }
    if (unknown) { contrastUnverified++; continue; }
    let bg = [255, 255, 255];
    for (const layer of layers.reverse()) bg = blend(layer, bg);
    const a = luminance(blend(fg, bg)), b = luminance(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(style.fontSize), large = size >= 24 || size >= 18.66 && Number(style.fontWeight) >= 700;
    const required = large ? 3 : 4.5;
    contrastChecked++;
    if (ratio + 0.001 < required) contrastFailures.push({ text: text(el.textContent), ratio: Math.round(ratio * 100) / 100, required });
  }
  return {
    version: 1, nodes: nodes.length, truncated: nodes.length > 10000,
    headings,
    globalHeaders: banners.length,
    mainLandmarks: elements.filter((el) => el.matches('main,[role="main"]')).length,
    controls: controls.map((el) => ({ tag: el.tagName.toLowerCase(), type: el.getAttribute("type") || "", name: name(el), field: el.getAttribute("name") || el.id || "" })),
    links: links.map((el) => { const u = new URL(el.href, location.href); return { name: name(el), path: u.origin === location.origin ? u.pathname : u.origin + u.pathname }; }),
    targets: targets.filter((el) => !el.inlineLink && (el.width < 44 || el.height < 44)),
    tinyText, longLines, scrollRegions,
    unnamedControls: controls.filter((el) => !name(el)).length,
    images: elements.filter((el) => el.matches("img")).map((el) => ({ alt: el.getAttribute("alt"), broken: !el.complete || el.naturalWidth === 0 })),
    fonts: [...new Set(elements.filter((el) => el.textContent?.trim()).map((el) => styleOf(el).fontFamily.split(",")[0].trim()))].sort(),
    webFonts: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family).sort(),
    contrast: { checked: contrastChecked, unverified: contrastUnverified, failures: contrastFailures },
    limitations: "Computed layout, approximate names, and simple solid-background text contrast only. Images, gradients, blends, SVG text, and opacity require separate review. No focus-trap, screen-reader, business-logic, or aesthetic-quality proof.",
  };
}
