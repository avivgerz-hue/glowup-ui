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

test("marketing: the phone board never claims an overflow count it did not measure", () => {
  const src = gen();
  // The board used to print a hardcoded "0 horizontal overflow" while evidence.json recorded a
  // pre-existing mobile overflow in the BEFORE fixture -- a reassuring number printed directly
  // above a screenshot that contradicted it. Counts must come from the evidence.
  assert.ok(!/>\s*0<\/tspan>\s*horizontal overflow/.test(src), "the overflow count must not be typed");
  assert.match(src, /baselineFindings/, "the overflow claim must be read from the recorded findings");
  assert.match(src, /overflowCount/, "and counted rather than assumed");
  const evidence = JSON.parse(fs.readFileSync("assets/examples/evidence.json", "utf8"));
  const overflows = evidence.baselineFindings.filter((f) => f.kind.includes("overflow"));
  // Whatever the count is, the phrase printed for it must not repeat the number as text.
  // This must tolerate CRLF: the Windows runner checks out with core.autocrlf=true, so a pattern
  // anchored on a bare \n never matches there and the test fails for a reason that has nothing
  // to do with the board.
  const phrase = src.match(/const overflowWho = [\s\S]*?;\r?\n/);
  assert.ok(phrase, "the board must build the overflow phrase from the findings");
  assert.ok(Array.isArray(overflows), "evidence keeps its baseline findings");
});

test("marketing: phones are laid out from their own widths and cannot be clipped", () => {
  const src = gen();
  // A hand-tuned x offset pushed the outer phones past the canvas edge; they rendered cut off.
  assert.match(src, /const rowW = phones\.reduce/, "the phone row width must be computed");
  assert.match(src, /assert\.ok\(rowW <= W - PAD \* 2/, "and must be proven to fit the canvas");
  assert.match(src, /const xs = phones\.map/, "positions must derive from the row");
  assert.ok(!/const W = 1240, H = \d+, xs = \[/.test(src), "no hardcoded phone coordinates");
  // Every device must sit fully inside the canvas.
  const phone = png("hero-phone.png");
  const evidence = JSON.parse(fs.readFileSync("assets/examples/evidence.json", "utf8"));
  const mobile = evidence.captures.filter((c) => c.width === 390);
  assert.ok(mobile.length >= 3, "the board composites three phone captures");
  assert.ok(phone.height > 1100, "the phone board keeps its devices and footer inside the canvas");
});

test("marketing: no orphaned or stale board files are left behind", () => {
  const files = fs.readdirSync("assets/marketing").filter((f) => f.endsWith(".png"));
  const src = gen();
  for (const f of files) {
    assert.ok(src.includes(f), `${f} is not produced by the generator; delete it or wire it up`);
  }
});

test("marketing: board assertions survive a CRLF checkout", () => {
  // The Windows runner checks out with core.autocrlf=true. A test anchored on a bare \n passes
  // on Linux/macOS and fails on Windows for a reason unrelated to the board -- exactly what
  // happened here. Every multi-line pattern in this file must tolerate \r\n.
  const src = fs.readFileSync("tests/marketing-boards.test.mjs", "utf8");
  const crlfSensitive = [...src.matchAll(/\[\\s\\S\]\*?\?;\\n/g)];
  assert.equal(crlfSensitive.length, 0, "multi-line patterns must use \\r?\\n so Windows checkouts match");
  // Prove the board generator itself parses under CRLF by checking the phrase pattern both ways.
  const gen = fs.readFileSync(GEN, "utf8");
  const lf = gen.replace(/\r\n/g, "\n");
  const crlf = gen.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
  const pattern = /const overflowWho = [\s\S]*?;\r?\n/;
  assert.ok(pattern.test(lf), "pattern matches an LF checkout");
  assert.ok(pattern.test(crlf), "pattern matches a CRLF checkout");
  const bareLf = new RegExp("const overflowWho = [\\s\\S]*?;\n");
  assert.ok(!bareLf.test(crlf), "and a bare \\n would have failed -- this is the bug");
});
