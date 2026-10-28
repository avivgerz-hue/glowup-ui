import { test } from "node:test";
import assert from "node:assert/strict";
import { review } from "../skills/glowup-ui/scripts/review.mjs";
import { inspect } from "../skills/glowup-ui/scripts/inspect.mjs";

const capture = (extra = {}) => ({ route: "/", viewport: "mobile", width: 390, height: 844, status: "ok", overflowX: false, runtimeErrors: [], measurements: {
  version: 1, headings: [{ level: 1, text: "Projects", size: 32 }], globalHeaders: 1,
  controls: [{ tag: "button", name: "Save changes", type: "submit", field: "" }], links: [{ name: "Projects", path: "/projects" }],
  targets: [], tinyText: [], longLines: [], scrollRegions: [], unnamedControls: 0, images: [], fonts: ["Georgia"], webFonts: [],
}, ...extra });
const manifest = (...shots) => ({ shots });

test("review: catches missing routes, changed viewport sizes, and incomplete historical captures", () => {
  const a = capture(), b = capture({ route: "/settings" });
  assert.equal(review(manifest(a), manifest(a, b)).coverage.length, 1);
  assert.equal(review(manifest(capture({ width: 375 })), manifest(a)).coverage.length, 2);
  assert.equal(review(manifest(capture({ measurements: undefined }))).ok, false);
  assert.throws(() => review(manifest()), /no captures/);
  assert.throws(() => review(manifest(a, a)), /duplicate/);
  const limited = capture(); limited.measurements.truncated = true;
  assert.equal(review(manifest(limited), manifest(a)).ok, false);
});

test("review: flags lost controls/links, font changes, new overflow, and duplicated chrome", () => {
  const before = capture(), after = capture();
  after.measurements.controls = [];
  after.measurements.links = [];
  after.measurements.fonts = ["Inter"];
  after.measurements.globalHeaders = 2;
  after.overflowX = true;
  const r = review(manifest(after), manifest(before));
  assert.equal(r.ok, false);
  for (const kind of ["lost-controls", "lost-links", "fonts", "duplicate-header", "page-overflow"]) assert.ok(r.regressions.some((f) => f.kind === kind), kind);
});

test("review: an existing issue stays visible and fixing it records a concrete improvement", () => {
  const before = capture(), after = capture();
  before.measurements.scrollRegions = [{ name: "Chart", keyboard: false }];
  before.measurements.targets = [{ name: "Save changes", width: 40, height: 40 }];
  after.measurements.scrollRegions = [{ name: "Chart", keyboard: true }];
  const unchanged = review(manifest(before), manifest(before));
  assert.equal(unchanged.ok, true);
  assert.ok(unchanged.priorities.some((p) => p.kind === "keyboard-scroll"));
  const improved = review(manifest(after), manifest(before));
  assert.equal(improved.ok, true);
  assert.deepEqual(improved.improvements.map((i) => i.kind).sort(), ["keyboard-scroll", "touch-targets"]);
});

test("review: failed baseline, failed after, and newly unnamed controls cannot pass silently", () => {
  const good = capture(), bad = capture({ status: "error" });
  assert.equal(review(manifest(good), manifest(bad)).ok, false);
  assert.equal(review(manifest(bad), manifest(good)).ok, false);
  const unnamed = capture(); unnamed.measurements.unnamedControls = 1;
  assert.equal(review(manifest(unnamed), manifest(good)).ok, false);
});

test("review: low contrast is surfaced and losing contrast coverage cannot hide it", () => {
  const before = capture(), after = capture();
  before.measurements.contrast = { checked: 10, unverified: 0, failures: [{ ratio: 2, required: 4.5 }] };
  after.measurements.contrast = { checked: 0, unverified: 10, failures: [] };
  const r = review(manifest(after), manifest(before));
  assert.equal(r.ok, false);
  assert.ok(r.regressions.some((f) => f.kind === "contrast-coverage"));
});

test("inspect: existing designed apps get a compact preservation plan with real commands and files", () => {
  const r = inspect("demo/after");
  assert.match(r.mode, /REFINE/);
  assert.ok(r.readFirst.includes("src/index.css"));
  assert.deepEqual(r.checks.build, ["npm run build"]);
  assert.deepEqual(r.checks.test, ["npm run test"]);
  assert.ok(r.routes.some((r) => r.dynamic));
  assert.ok(!JSON.stringify(r).includes("Redesign every page"));
  assert.equal(r.truncated, false);
});
