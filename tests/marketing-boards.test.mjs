// The marketing boards are composited from the real Chromium captures in assets/examples/.
// They are easy to let drift: a redesigned palette, a changed rule count, or a swapped capture
// would leave the README showing something the product no longer does. These tests bind every
// board to its sources.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const GEN = "benchmarks/marketing-boards.mjs";
const gen = () => fs.readFileSync(GEN, "utf8");
const png = (f) => {
  const b = fs.readFileSync(path.join("assets/marketing", f));
  assert.equal(b.subarray(1, 4).toString(), "PNG", `${f} must be a real PNG`);
  return { buf: b, width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};
const ruleCount = () => {
  const src = fs.readFileSync("skills/glowup-ui/scripts/a11y.mjs", "utf8");
  return new Set([...src.matchAll(/push\(\s*"([a-z0-9-]+)"/g)].map((m) => m[1])).size;
};

test("marketing: boards are composited from the real captures, not redrawn", () => {
  const src = gen();
  // Each board must consume a real capture from assets/examples/.
  for (const capture of [
    "transform-before-desktop.png", "transform-after-desktop.png",
    "transform-before-mobile.png", "transform-after-mobile.png", "create-mobile.png",
  ]) {
    assert.ok(src.includes(capture), `the generator must composite ${capture}`);
  }
  assert.match(src, /assets\/examples/, "captures live in assets/examples");
  // It must not silently fall back to drawing a fake app if a capture is missing.
  assert.ok(!/catch\s*\{\s*\/\*\s*nothing/.test(src));
});

test("marketing: every board exists and is the size the design targets", () => {
  assert.deepEqual(
    { w: png("hero-desktop.png").width, h: png("hero-desktop.png").height },
    { w: 1828, h: 1060 },
    "desktop hero is sized to its two panels and can never overlap them",
  );
  const phone = png("hero-phone.png");
  assert.equal(phone.width, 1240);
  assert.ok(phone.height > 1100 && phone.height < 1400, "phone hero stays a usable feed ratio");
  assert.ok(phone.buf.length > 50_000, "phone hero should not be near-empty");
});

test("marketing: panels cannot overlap because the canvas is derived from them", () => {
  const src = gen();
  // The desktop canvas width must be computed from the two panel widths plus the gap, not typed.
  assert.match(src, /const W = M \* 2 \+ before\.w \+ GAP \+ after\.w/, "canvas width derives from the panels");
  assert.match(src, /rightX = M \+ before\.w \+ GAP/, "the second panel is placed from the first one's width");
  // A hardcoded canvas width next to hardcoded panel widths is how an overlap ships.
  assert.ok(!/const W = 1[0-9]{3}, H = 10[0-9]{2};/.test(src), "no fixed canvas width for the desktop board");
});

test("marketing: every figure on a board is read from its source", () => {
  const src = gen();
  // Rule count from the engine.
  assert.match(src, /a11yRuleCount/, "the rule count must be derived");
  assert.match(src, /\$\{a11yRuleCount\}/, "and interpolated into the board");
  // Behaviour-test count from the fixture.
  assert.match(src, /behaviourTestCount/, "the test count must be derived");
  assert.match(src, /demo\/before\/tests\/behavior\.test\.jsx/, "from the fixture that runs them");
  // Capture metadata from evidence.json.
  assert.match(src, /evidence\.json/, "capture provenance must come from the recorded evidence");
  assert.match(src, /captureLine/, "and be printed on the board");
});

test("marketing: the derived figures agree with reality right now", () => {
  const src = gen();
  const engine = ruleCount();
  const fixture = (fs.readFileSync("demo/before/tests/behavior.test.jsx", "utf8").match(/^\s*(?:test|it)\(/gm) || []).length;
  assert.ok(engine >= 18, "engine still carries its full rule set");
  assert.equal(fixture, 12, "the Plotline fixture still declares 12 behaviour tests");
  // The README repeats that number in prose; keep it honest.
  const readme = fs.readFileSync("README.md", "utf8");
  assert.ok(readme.includes(`${fixture} behavior tests`), `README should state ${fixture} behavior tests`);
  // No prose anywhere may disagree with the engine's rule count.
  for (const f of ["CHANGELOG.md", "README.md", "skills/glowup-ui/references/verification.md"]) {
    const text = fs.readFileSync(f, "utf8");
    for (const m of text.matchAll(/(\d+)\s*(?:DOM\s+)?(?:rules|rule engine)/gi)) {
      assert.equal(Number(m[1]), engine, `${f} states ${m[1]} rules but the engine has ${engine}`);
    }
  }
});

test("marketing: the README shows the boards and keeps provenance", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  assert.match(readme, /assets\/marketing\/hero-desktop\.png/, "README shows the desktop board");
  assert.match(readme, /assets\/marketing\/hero-phone\.png/, "README shows the phone board");
  // The section must keep saying these are renders of a fixture, not a measured benchmark.
  assert.match(readme, /not controlled agent benchmarks|Maintainer examples/i, "the examples section must keep its scope label");
  for (const m of readme.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)) {
    assert.ok(fs.existsSync(m[1]), `README image missing: ${m[1]}`);
  }
});

test("marketing: no orphaned or stale board files are left behind", () => {
  const files = fs.readdirSync("assets/marketing").filter((f) => f.endsWith(".png"));
  const src = gen();
  for (const f of files) {
    assert.ok(src.includes(f), `${f} is not produced by the generator; delete it or wire it up`);
  }
});
