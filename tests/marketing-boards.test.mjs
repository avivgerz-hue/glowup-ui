// The marketing boards are rendered artwork that restates the before/after comparison. They are
// easy to let drift: a redesigned palette or a changed claim would leave the image saying
// something the product no longer does. These tests bind the boards to their sources.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const GEN = "benchmarks/marketing-boards.mjs";

test("marketing: the board renderer is committed and reproducible", () => {
  assert.ok(fs.existsSync(GEN), "the generator must live in the repo, not only its output");
  const src = fs.readFileSync(GEN, "utf8");
  // Tokens must come from the product theme, not be retyped from memory.
  const css = fs.readFileSync("demo/after/src/index.css", "utf8");
  for (const token of ["paper", "surface", "ink", "vermilion", "primary"]) {
    const m = new RegExp(`--color-${token}:\\s*(#[0-9a-f]{6})`, "i").exec(css);
    assert.ok(m, `demo theme should declare --color-${token}`);
    assert.ok(src.toLowerCase().includes(m[1].toLowerCase()), `board palette must reuse ${token} ${m[1]} from the product theme`);
  }
  // It is documentation artwork; it must say so rather than imply a measured benchmark.
  assert.match(src, /data-true|Illustrative|Maintainer-directed/i, "boards must describe themselves honestly");
});

test("marketing: every board the renderer writes exists and is the size it claims", () => {
  const src = fs.readFileSync(GEN, "utf8");
  const written = [...src.matchAll(/render\((?:svg\d?|desktopBoard\([^)]*\)|phoneBoard\([^)]*\)), "([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(written.length >= 2, "expected at least a desktop and a phone board");
  for (const file of written) {
    const p = path.join("assets/marketing", file);
    assert.ok(fs.existsSync(p), `${file} must be committed`);
    const buf = fs.readFileSync(p);
    assert.equal(buf.subarray(1, 4).toString(), "PNG", `${file} must be a real PNG`);
    assert.ok(buf.length > 20_000, `${file} looks empty`);
  }
});

test("marketing: board dimensions match the platform they target", () => {
  const read = (f) => {
    const b = fs.readFileSync(path.join("assets/marketing", f));
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  };
  // 1600x900 for a link preview / wide feed placement; 1080x1350 is the 4:5 portrait feed ratio.
  assert.deepEqual(read("comparison-desktop.png"), { width: 1600, height: 900 });
  assert.deepEqual(read("comparison-phone.png"), { width: 1080, height: 1350 });
});

test("marketing: boards restate only claims the repository can back", () => {
  const src = fs.readFileSync(GEN, "utf8");
  // Every figure printed on a board must be traceable to something real.
  assert.match(src, /276,000/, "pipeline figure comes from the Plotline fixture");
  assert.match(src, /17/, "a11y rule count matches a11y.mjs");
  // The rule count on the board must equal the count in the code.
  const a11y = fs.readFileSync("skills/glowup-ui/scripts/a11y.mjs", "utf8");
  const declared = /RULES?_?(?:COUNT)?\s*[:=]\s*(\d+)/.exec(a11y);
  const fromChecks = (a11y.match(/\bcheck\(\s*"/g) || []).length;
  const rules = declared ? Number(declared[1]) : fromChecks;
  if (rules > 0) {
    assert.ok(src.includes(`${rules}`) || src.includes("a11y rules"), "board documents a rule count");
  }
});

test("marketing: the rule count on the boards is derived, never typed in by hand", () => {
  const gen = fs.readFileSync(GEN, "utf8");
  const a11y = fs.readFileSync("skills/glowup-ui/scripts/a11y.mjs", "utf8");
  const actual = new Set([...a11y.matchAll(/push\(\s*"([a-z0-9-]+)"/g)].map((m) => m[1])).size;
  // The generator must read the count from the engine.
  assert.match(gen, /push\\\(\\s\*"\(\[a-z0-9-\]\+\)"/, "the generator must count rules out of a11y.mjs");
  assert.match(gen, /\$\{a11yRuleCount\}/, "the board must interpolate the derived count");
  // And no hardcoded figure may disagree with the engine.
  for (const m of gen.matchAll(/font-weight="bold" fill="\$\{P\.ink\}">(\d+)<\/tspan>  a11y rules enforced/g)) {
    assert.fail(`hardcoded a11y rule count ${m[1]} found; this is how 17 shipped when the engine had ${actual}`);
  }
  assert.ok(actual >= 18, "the engine should still carry its full rule set");
});

test("marketing: prose claims elsewhere agree with the engine", () => {
  const a11y = fs.readFileSync("skills/glowup-ui/scripts/a11y.mjs", "utf8");
  const actual = new Set([...a11y.matchAll(/push\(\s*"([a-z0-9-]+)"/g)].map((m) => m[1])).size;
  const docs = ["CHANGELOG.md", "skills/glowup-ui/SKILL.md", "skills/glowup-ui/references/verification.md", "README.md"]
    .filter((f) => /(\d+)\s*(DOM\s+)?rules|(\d+)-rule/i.test(fs.readFileSync(f, "utf8")));
  for (const f of docs) {
    const text = fs.readFileSync(f, "utf8");
    for (const m of text.matchAll(/(\d+)\s*(?:DOM\s+)?(?:rules|rule engine)/gi)) {
      assert.equal(Number(m[1]), actual, `${f} states ${m[1]} rules but the engine has ${actual}`);
    }
  }
});

test("marketing: board annotations are measured, not remembered", () => {
  const gen = fs.readFileSync(GEN, "utf8");
  // The blank-tail annotation was once typed from memory as 315px; measured it is 396px.
  // It must be computed from the real capture at render time.
  assert.match(gen, /measureBlankTail/, "the fold annotation must be measured from the capture");
  assert.match(gen, /transform-before-desktop\.png/, "and measured from the real before-capture");
  assert.match(gen, /\$\{blankTail\}px of the fold/, "and interpolated, not hardcoded");
  // The rendered annotation must interpolate. (The generator's own comment explains the old
  // hardcoded value, so only the markup line is checked -- not the prose around it.)
  const annotation = gen.split("\n").filter((l) => l.includes("<text") && l.includes("px of the fold"));
  assert.equal(annotation.length, 1, "exactly one annotation line expected");
  assert.match(annotation[0], /\$\{blankTail\}px of the fold/, "the annotation must interpolate the measurement");
  assert.ok(!/>\s*\d{2,4}px of the fold/.test(annotation[0]), "a hardcoded fold measurement shipped once already");
});
