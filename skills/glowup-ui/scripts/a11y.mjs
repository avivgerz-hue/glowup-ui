// Real accessibility rules, run inside the page. Same contract as measure.mjs: passed
// straight to page.evaluate, so it must be self-contained and must never read form values.
//
// Why this exists: everything else in the skill measures heuristics (does the button have an
// approximate name, is the contrast plausibly 4.5:1). Those heuristics cannot see ARIA misuse,
// duplicate ids, invalid roles, or a dialog that never traps focus. This implements the
// high-signal subset of the WCAG checks that a real audit reports most often, using only the
// DOM, with no dependency and no network access.
//
// It is not a replacement for a full engine or manual review, and it reports that limit.

export function auditAccessibility(options = {}) {
  const OPT = { maxViolations: 200, ...options };
  const findings = [];
  const push = (rule, impact, help, node, detail) => {
    if (findings.length >= OPT.maxViolations) return;
    findings.push({ rule, impact, help, node: String(node).slice(0, 120), detail: detail ? String(detail).slice(0, 200) : "" });
  };
  const text = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const visible = (el) => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) !== 0 && !el.closest("[hidden], [inert]");
  };
  const describe = (el) => {
    if (!el) return "unknown";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : "";
    const label = el.getAttribute("aria-label") || el.getAttribute("name") || text(el.textContent).slice(0, 40);
    return `${tag}${id}${cls}${label ? ` "${label}"` : ""}`;
  };
  const accessibleName = (el) => {
    const labelledby = el.getAttribute("aria-labelledby");
    if (labelledby) {
      const joined = labelledby.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ");
      if (text(joined)) return text(joined);
    }
    const label = el.getAttribute("aria-label");
    if (text(label)) return text(label);
    if (el.labels && el.labels.length) return text([...el.labels].map((l) => l.textContent).join(" "));
    if (el.tagName === "IMG") return text(el.getAttribute("alt"));
    if (el.tagName === "INPUT" && ["button", "submit", "reset"].includes(el.type)) return text(el.value) || el.getAttribute("title") || "";
    return text(el.textContent) || text(el.getAttribute("title"));
  };
  const all = [...document.querySelectorAll("*")].filter((el) => !el.closest("script, style, template"));
  const shown = all.filter(visible);

  // 1. Images need an alternative (decorative images use alt="").
  for (const img of all.filter((el) => el.matches("img"))) {
    if (img.getAttribute("alt") === null) push("image-alt", "critical", "Images need an alt attribute (alt=\"\" when decorative)", describe(img));
    if (!img.complete || img.naturalWidth === 0) push("image-broken", "serious", "Image failed to load", describe(img), img.currentSrc || img.src);
  }

  // 2. Interactive elements need a name.
  for (const el of shown) {
    if (!el.matches("button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=checkbox], [role=radio], [role=tab], [role=switch]")) continue;
    if (el.matches("input[type=checkbox], input[type=radio]") && !accessibleName(el)) push("form-field-name", "critical", "Form controls need a name", describe(el));
    else if (!accessibleName(el) && !el.matches("input[type=checkbox], input[type=radio]")) push("control-name", "critical", "Interactive controls need an accessible name", describe(el));
  }

  // 3. Form fields need a real label (a placeholder is not a label).
  for (const field of shown.filter((el) => el.matches("input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea"))) {
    const hasLabel = Boolean(field.labels?.length || text(field.getAttribute("aria-label")) || text(field.getAttribute("aria-labelledby")));
    if (!hasLabel) push("field-label", "critical", "Form fields need a visible or programmatic label, not only a placeholder", describe(field), field.getAttribute("placeholder") ? `only placeholder "${field.getAttribute("placeholder")}"` : "");
  }

  // 4. ARIA roles must exist, and required attributes must be present.
  const VALID_ROLES = new Set("alert alertdialog application article banner button cell checkbox columnheader combobox complementary contentinfo definition dialog directory document feed figure form grid gridcell group heading img link list listbox listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio meter navigation none note option paragraph presentation progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status switch tab table tablist tabpanel term textbox timer toolbar tooltip tree treegrid treeitem".split(" "));
  for (const el of all) {
    const roles = (el.getAttribute("role") || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    for (const role of roles) if (!VALID_ROLES.has(role)) push("aria-role-invalid", "serious", `"${role}" is not a valid ARIA role`, describe(el));
  }
  for (const el of all.filter((e) => ["checkbox", "switch", "radio"].includes(e.getAttribute("role")))) {
    if (!el.hasAttribute("aria-checked")) push("aria-required-attr", "serious", `role="${el.getAttribute("role")}" requires aria-checked`, describe(el));
  }
  for (const el of all.filter((e) => ["combobox", "listbox"].includes(e.getAttribute("role")))) {
    if (!el.hasAttribute("aria-expanded") && el.getAttribute("role") === "combobox") push("aria-required-attr", "serious", 'role="combobox" requires aria-expanded', describe(el));
  }

  // 5. aria-hidden must not hide focusable content from assistive technology.
  for (const el of all.filter((e) => e.getAttribute("aria-hidden") === "true")) {
    const focusable = el.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable && visible(el)) push("aria-hidden-focus", "serious", "aria-hidden=\"true\" contains focusable content, which keyboard users can still reach", describe(el), describe(focusable));
  }

  // 6. Duplicate ids break label/aria references.
  const ids = new Map();
  for (const el of all) if (el.id) ids.set(el.id, (ids.get(el.id) || 0) + 1);
  for (const [id, n] of ids) if (n > 1) push("duplicate-id", "serious", `id "${id}" is used ${n} times; labels and aria-* references resolve to the first one`, `#${id}`);

  // 7. Headings must not skip levels.
  const headings = shown.filter((el) => /^H[1-6]$/.test(el.tagName)).map((el) => ({ level: Number(el.tagName[1]), el }));
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) push("heading-skip", "moderate", `Heading level jumps ${headings[i - 1].level} -> ${headings[i].level}`, describe(headings[i].el));
  }
  if (!headings.length) push("page-has-heading", "moderate", "Page has no headings", "document");
  if (headings.filter((h) => h.level === 1).length > 1) push("page-multiple-h1", "moderate", "More than one h1", `${headings.filter((h) => h.level === 1).length} h1 elements`);

  // 8. Landmarks.
  if (!document.querySelector('main, [role="main"]')) push("landmark-main", "moderate", "Page has no main landmark", "document");

  // 9. Scroll containers must be reachable by keyboard.
  for (const el of shown) {
    const s = getComputedStyle(el);
    if (!/auto|scroll/.test(s.overflowX + s.overflowY)) continue;
    if (el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2) continue;
    const focusable = el.tabIndex >= 0 || el.querySelector('a[href], button, input, select, textarea, [tabindex="0"]');
    if (!focusable) push("scrollable-region-focusable", "serious", "A scrollable region has no keyboard access", describe(el));
  }

  // 10. Buttons with a type, so a form cannot submit by accident.
  for (const btn of shown.filter((el) => el.tagName === "BUTTON")) {
    if (!btn.hasAttribute("type") && btn.form) push("button-type", "minor", "A <button> inside a form should declare type=\"button\" unless it submits", describe(btn));
  }

  // 11. Removed focus indication on interactive elements.
  for (const el of shown.filter((e) => e.matches("a[href], button, input, select, textarea, [tabindex]"))) {
    const s = getComputedStyle(el);
    if (s.outlineStyle === "none" && s.boxShadow === "none" && s.borderColor === s.backgroundColor) {
      // Only report when nothing else could show focus; static inspection cannot see :focus styles.
      push("focus-visible-uncertain", "minor", "No static focus indicator found; confirm a :focus-visible style exists", describe(el));
    }
  }

  // 12. Target size (WCAG 2.5.8 AA = 24px; the skill's design bar is 44px for touch).
  const small = shown.filter((el) => el.matches("button, a[href], [role=button], input[type=checkbox], input[type=radio]")).map((el) => {
    const r = el.getBoundingClientRect();
    return { el, w: Math.round(r.width), h: Math.round(r.height) };
  }).filter(({ el, w, h }) => !(el.tagName === "A" && getComputedStyle(el).display === "inline") && (w < 24 || h < 24));
  for (const { el, w, h } of small) push("target-size-min", "moderate", "Target is smaller than the 24px WCAG 2.5.8 minimum", describe(el), `${w}x${h}px`);

  // 13. Document language and title.
  if (!document.documentElement.lang) push("html-lang", "serious", "<html> has no lang attribute", "html");
  if (!text(document.title)) push("document-title", "serious", "Document has no title", "head");

  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const f of findings) byImpact[f.impact] = (byImpact[f.impact] || 0) + 1;
  return {
    version: 1,
    engine: "glowup-dom-rules",
    checked: shown.length,
    truncated: findings.length >= OPT.maxViolations,
    total: findings.length,
    byImpact,
    rules: [...new Set(findings.map((f) => f.rule))],
    findings,
    limitations: "DOM-only rules: no contrast-over-image, no screen reader, no keyboard trap, no live-region or focus-movement proof. Static focus detection cannot see :focus-visible rules and reports focus-visible-uncertain for review, not as a defect.",
  };
}
