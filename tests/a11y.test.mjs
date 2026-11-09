// Tests for the opt-in DOM accessibility rules (a11y.mjs).
//
// a11y.mjs is written to be passed to page.evaluate, so it must be self-contained and must
// only touch a small, standard slice of the DOM. That contract is what lets this test run a
// tiny hand-built document instead of pulling a browser or a DOM library into CI.
import { test } from "node:test";
import assert from "node:assert/strict";
import { auditAccessibility } from "../skills/glowup-ui/scripts/a11y.mjs";

// Minimal element: only what the rules read, and only when a check reaches for it.
class El {
  constructor(spec = {}) {
    this.tagName = (spec.tag || "div").toUpperCase();
    this.id = spec.id || "";
    this.className = spec.class || "";
    this.attrs = spec.attrs || {};
    this.children = [];
    this.textContent = spec.text || "";
    this.parent = null;
    this.form = spec.form || null;
    this.tabIndex = spec.tabIndex ?? -1;
    this.type = spec.type || "";
    this.style = spec.style || {};
    this.rect = spec.rect || { width: 100, height: 40 };
    if ("lang" in this.attrs) this.lang = this.attrs.lang;
    for (const child of this.children) child.parent = this;
  }
  get labels() {
    const byFor = this.id ? El.document.querySelectorAll("label").filter((l) => l.attrs.for === this.id) : [];
    const wrapped = this.parent && this.parent.tagName === "LABEL" ? [this.parent] : [];
    return [...byFor, ...wrapped];
  }
  getElementsByTagName(tag) { return El.document.querySelectorAll(tag); }
  matches(selector) { return El.matches(this, selector); }
  querySelector(selector) {
    for (const el of this.walk()) if (el !== this && El.matches(el, selector)) return el;
    return null;
  }
  querySelectorAll(selector) {
    const out = [];
    for (const el of this.walk()) if (el !== this && El.matches(el, selector)) out.push(el);
    return out;
  }
  *walk() { yield this; for (const child of this.children) yield* child.walk(); }
  // The rules scope some checks with closest("main, ...") to decide whether an element is
  // page chrome; the fake tree only needs ancestry, not the full selector grammar.
  closest(selector) {
    const parts = String(selector).split(",").map((x) => x.trim()).filter(Boolean);
    for (let node = this.parent; node; node = node.parent) {
      for (const part of parts) {
        const m = /^([a-z][a-z0-9]*)$/.exec(part);
        if (m && node.tagName.toLowerCase() === m[1]) return node;
        const a = /^\[([a-z-]+)="([^"]*)"\]$/.exec(part);
        if (a && node.getAttribute(a[1]) === a[2]) return node;
      }
    }
    return null;
  }
  getBoundingClientRect() { return { ...this.rect, top: 0, left: 0, right: this.rect.width, bottom: this.rect.height }; }
  getAttribute(name) { return name in this.attrs ? String(this.attrs[name]) : null; }
  hasAttribute(name) { return name in this.attrs; }
  matches(selector) { return El.matches(this, selector); }
  // jsdom/browser images report load state; a fake tree has no loader, so say "loaded" and
  // let the image-alt rule be the one under test.
  get complete() { return true; }
  get naturalWidth() { return 100; }
}

// Selector support is deliberately small but real: a tag/attribute base plus any number of
// chained :not([attr]) and :not([attr="v"]) clauses. That is the whole grammar the rules use.
El.matches = (el, selector) => {
  const tagOf = el.tagName.toLowerCase();
  const attrOf = (name) => el.getAttribute(name);
  for (const part of String(selector).split(",").map((s) => s.trim()).filter(Boolean)) {
    let rest = part;
    let tag = null;
    const named = /^([a-z][a-z0-9]*)/.exec(rest);
    if (named) { tag = named[1]; rest = rest.slice(named[1].length); }
    if (rest === "*") return true;
    const tests = [];
    let ok = true;
    while (rest.length) {
      let m;
      if ((m = /^\[([a-z-]+)(?:="([^"]*)"|='([^']*)'|=([^\]]+))?\]/.exec(rest))) {
        const [, name, dq, sq, bare] = m;
        const value = dq ?? sq ?? bare;
        tests.push(value === undefined ? () => attrOf(name) !== null : () => attrOf(name) === value);
        rest = rest.slice(m[0].length);
      } else if ((m = /^:not\(\[([a-z-]+)(?:="([^"]*)"|='([^']*)'|=([^\]]+))?\]\)/.exec(rest))) {
        const [, name, dq, sq, bare] = m;
        const value = dq ?? sq ?? bare;
        tests.push(value === undefined ? () => attrOf(name) === null : () => attrOf(name) !== value);
        rest = rest.slice(m[0].length);
      } else { ok = false; break; }
    }
    if (!ok) continue;
    if (tag && tagOf !== tag) continue;
    if (tests.every((t) => t())) return true;
  }
  return false;
};

El.document = {
  all: [],
  querySelectorAll(selector) {
    // "*" is how the rules enumerate every element; other values are simple tag names.
    if (String(selector).trim() === "*") return this.all;
    if (String(selector).trim() === "style") return this.styles;
    return this.all.filter((el) => El.matches(el, selector));
  },
  querySelector(selector) {
    for (const el of this.all) if (El.matches(el, selector)) return el;
    return null;
  },
  documentElement: { lang: "en" },
  title: "Test page",
  styleSheets: [],
  styles: [],
};

function audit(specs) {
  El.document.all = [];
  const root = new El({ tag: "body" });
  // Build one real tree and index every node, so children/parent links match a browser.
  const build = (spec) => {
    const el = new El({ ...spec, children: [] });
    El.document.all.push(el);
    for (const childSpec of spec.children || []) { const child = build(childSpec); child.parent = el; el.children.push(child); }
    return el;
  };
  for (const spec of specs) { const el = build(spec); el.parent = root; root.children.push(el); }
  El.document.all.push(root);
  El.document.documentElement = new El({ tag: "html", attrs: { lang: "en" } });

  const saved = { doc: globalThis.document, win: globalThis.window, gcs: globalThis.getComputedStyle };
  globalThis.document = El.document;
  globalThis.window = { document: El.document, innerWidth: 1440, innerHeight: 900 };
  globalThis.getComputedStyle = (el) => ({
    display: "block", visibility: "visible", opacity: "1", overflowX: "visible", overflowY: "visible",
    outlineStyle: "solid", boxShadow: "none", borderColor: "rgb(1,1,1)", backgroundColor: "rgb(2,2,2)",
    ...(el.style || {}),
  });
  try {
    return auditAccessibility({});
  } finally {
    globalThis.document = saved.doc;
    globalThis.window = saved.win;
    globalThis.getComputedStyle = saved.gcs;
  }
}

const rulesOf = (specs) => audit(specs).rules;

test("a11y: catches the accessibility defects a redesign must not introduce", () => {
  assert.ok(rulesOf([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "img", attrs: { src: "a.png" } }] }]).includes("image-alt"));
  assert.ok(rulesOf([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "button", children: [{ tag: "svg" }] }] }]).includes("control-name"));
  assert.ok(rulesOf([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "input", attrs: { placeholder: "Email" } }] }]).includes("field-label"));
  assert.ok(rulesOf([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "div", attrs: { role: "buton" }, text: "go" }] }]).includes("aria-role-invalid"));
  assert.ok(rulesOf([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "div", attrs: { role: "checkbox" }, text: "Pick" }] }]).includes("aria-required-attr"));
  assert.ok(rulesOf([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "div", attrs: { "aria-hidden": "true" }, children: [{ tag: "button", text: "Go" }] }] }]).includes("aria-hidden-focus"));
  assert.ok(rulesOf([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "h4", text: "y" }] }]).includes("heading-skip"));
  assert.ok(rulesOf([{ tag: "div", children: [{ tag: "h1", text: "x" }] }]).includes("landmark-main"));
});

test("a11y: does not invent findings for correct, accessible markup", () => {
  // A real accessible page declares focus styling; without this the page-level focus rule
  // would (correctly) fire and this test would be measuring the fixture, not the rules.
  El.document.styleSheets = [{ cssRules: [{ selectorText: "button:focus-visible" }] }];
  let clean;
  try {
    clean = rulesOf([
    { tag: "main", children: [
      { tag: "h1", text: "Projects" },
      { tag: "img", attrs: { src: "a.png", alt: "Chart" } },
      { tag: "label", attrs: { for: "q" }, text: "Search", children: [{ tag: "input", id: "q", attrs: { id: "q" } }] },
      { tag: "button", attrs: { type: "button", "aria-label": "Close" }, children: [{ tag: "svg" }] },
      { tag: "h2", text: "List" },
    ] },
    ]);
  } finally { El.document.styleSheets = []; }
  assert.deepEqual(clean, []);
});

test("a11y: a page with no focus styling is reported once, not once per control", () => {
  const out = audit([{ tag: "main", children: [
    { tag: "h1", text: "x" },
    { tag: "button", attrs: { type: "button", "aria-label": "A" }, text: "A" },
    { tag: "button", attrs: { type: "button", "aria-label": "B" }, text: "B" },
    { tag: "a", attrs: { href: "/x" }, text: "x" },
  ] }]);
  const focus = out.findings.filter((f) => f.rule === "focus-style-missing");
  assert.equal(focus.length, 1, "one page-level finding, not one per element");
  assert.equal(focus[0].impact, "serious");

  // With a declared :focus rule, the finding disappears.
  El.document.styleSheets = [{ cssRules: [{ selectorText: "button:focus-visible" }] }];
  try {
    const withRule = audit([{ tag: "main", children: [{ tag: "h1", text: "x" }, { tag: "button", attrs: { type: "button", "aria-label": "A" }, text: "A" }] }]);
    assert.equal(withRule.findings.filter((f) => f.rule === "focus-style-missing").length, 0);
  } finally { El.document.styleSheets = []; }
});

test("a11y: reports its own limits and never claims to be a full audit", () => {
  const out = audit([{ tag: "main", children: [{ tag: "h1", text: "Projects" }] }]);
  assert.equal(out.version, 1);
  assert.match(out.limitations, /not.*screen reader|no screen reader/i);
  assert.equal(out.engine, "glowup-dom-rules");
  assert.ok("byImpact" in out && "rules" in out && "findings" in out);
});
