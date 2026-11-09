// Regression tests for the five hardening fixes. Each test reproduces the exact failure
// observed before the fix, so a regression is caught rather than assumed absent.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { detectLook } from "../skills/glowup-ui/scripts/look.mjs";
import { snapshot, check } from "../skills/glowup-ui/scripts/checkpoint.mjs";
import { composition } from "../skills/glowup-ui/scripts/composition.mjs";
import { inspect } from "../skills/glowup-ui/scripts/inspect.mjs";

const SCRIPT = (name) => path.resolve("skills/glowup-ui/scripts", name);
const tmp = (t, prefix) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
};
const write = (root, name, text) => {
  fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
  fs.writeFileSync(path.join(root, name), text);
};

test("look: an unreadable directory degrades to a partial fingerprint instead of crashing", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-perm-"));
  const locked = path.join(root, "locked");
  // Hooks run LIFO, so restore permissions before the recursive cleanup runs.
  t.after(() => {
    try { fs.chmodSync(locked, 0o755); } catch { /* never created or already restored */ }
    fs.rmSync(root, { recursive: true, force: true });
  });
  write(root, "src/App.jsx", "export default () => <div className=\"bg-blue-600\" />;");
  fs.mkdirSync(locked);
  fs.writeFileSync(path.join(locked, "secret.jsx"), "export default 1;");
  fs.chmodSync(locked, 0o000);
  if (process.getuid?.() === 0) return; // root ignores directory permissions

  const look = detectLook(root); // previously threw EACCES and aborted orientation
  assert.equal(look.partial, true);
  assert.ok(look.unreadable.some((u) => u.code === "EACCES"));
  assert.equal(look.files, 1, "readable sources are still scanned");

  // The whole orientation path must survive too, because inspect/direction/checkpoint use it.
  const cli = spawnSync(process.execPath, [SCRIPT("look.mjs"), root], { encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /Partial fingerprint/);
});

test("checkpoint: a handler moved between existing files is reported, not silently passed", (t) => {
  const root = tmp(t, "glowup-move-");
  write(root, "src/Book.jsx", '<main><button type="button" onClick={next}>Next</button></main>');
  write(root, "src/Layout.jsx", "<div><nav /></div>");
  const before = snapshot(root);
  write(root, "src/Book.jsx", "<main></main>");
  write(root, "src/Layout.jsx", '<div><nav /><button type="button" onClick={next}>Next</button></div>');

  const result = check(root, before);
  const moved = result.relocated.find((r) => r.kind === "relocated-wiring");
  assert.ok(moved, "relocation must be surfaced");
  assert.equal(moved.moved, false, "moving between existing files needs review");
  assert.match(moved.from, /Book\.jsx/);
  assert.match(moved.to, /Layout\.jsx/);
});

test("checkpoint: extracting a control into a new component stays a pass and says so", (t) => {
  const root = tmp(t, "glowup-extract-");
  write(root, "src/App.jsx", '<main><button onClick={save}>Save changes</button></main>');
  const before = snapshot(root);
  write(root, "src/App.jsx", "<main><SaveButton /></main>");
  write(root, "src/SaveButton.jsx", '<button onClick={save}>Save changes</button>');

  const result = check(root, before);
  assert.equal(result.ok, true, "extraction loses nothing and must not fail the check");
  const moved = result.relocated.find((r) => r.kind === "relocated-wiring");
  assert.equal(moved.moved, true);
});

test("checkpoint: an untouched control on another page is not reported as relocated", (t) => {
  const root = tmp(t, "glowup-quiet-");
  write(root, "src/A.jsx", '<a href="/settings">Settings</a><button onClick={save}>Save</button>');
  write(root, "src/B.jsx", '<a href="/settings">Settings</a>');
  const before = snapshot(root);
  write(root, "src/A.jsx", '<a href="/settings" className="nav">Settings</a><button onClick={save}>Save</button>');
  assert.deepEqual(check(root, before).relocated, []);
});

test("composition: a surface word no longer sends a single real domain to the generic recipe", () => {
  // Previously all of these fell back to "general" because "dashboard" lives in productivity's
  // term list, so finance/store tied with productivity.
  assert.equal(composition("personal finance dashboard").profile, "finance");
  assert.equal(composition("store dashboard").profile, "commerce");
  assert.equal(composition("helpdesk dashboard").profile, "productivity");
  assert.equal(composition("booking app").profile, "booking");
  // A surface word alone is not enough to decide a product's composition.
  assert.equal(composition("app").profile, "general");
  assert.equal(composition("admin panel").profile, "general");
  // Two genuinely different domains stay ambiguous instead of guessing.
  assert.equal(composition("finance booking").profile, "general");
  assert.equal(composition("finance booking").matched.length, 2);
});

test("scaffold: --help prints usage and writes nothing; missing --product is refused", (t) => {
  const root = tmp(t, "glowup-scaffold-");
  const run = (args) => spawnSync(process.execPath, [SCRIPT("scaffold.mjs"), ...args], { cwd: root, encoding: "utf8" });

  const help = run(["--help"]);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Usage:/);
  assert.deepEqual(fs.readdirSync(root), [], "help must not write files");

  const short = run(["-h"]);
  assert.equal(short.status, 0);

  const missing = run([]);
  assert.equal(missing.status, 64, "a project scaffold without a product must be refused");
  assert.match(missing.stderr, /--product is required/);
  assert.deepEqual(fs.readdirSync(root), [], "a refused scaffold must not write files");

  const bad = run(["--nope"]);
  assert.equal(bad.status, 64);
  assert.match(bad.stderr, /Unknown option/);
});

test("inspect: a partial identity fingerprint is visible in the orientation output", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-inspect-"));
  const locked = path.join(root, "locked");
  t.after(() => {
    try { fs.chmodSync(locked, 0o755); } catch { /* never created */ }
    fs.rmSync(root, { recursive: true, force: true });
  });
  write(root, "src/App.jsx", "export default () => <div className=\"bg-blue-600\" />;");
  write(root, "package.json", JSON.stringify({ name: "x", scripts: { build: "vite build" } }));
  fs.mkdirSync(locked);
  fs.writeFileSync(path.join(locked, "a.jsx"), "export default 1;");
  fs.chmodSync(locked, 0o000);
  if (process.getuid?.() === 0) return; // root ignores directory permissions

  const out = inspect(root);
  assert.equal(out.identity.partial, true, "orientation must not present a degraded fingerprint as complete");
  assert.ok(out.limitations.some((l) => /partial/.test(l)), "the limitation must be readable, not only a flag");

  // A complete app must not claim to be partial.
  const clean = inspect(path.resolve("demo/before"));
  assert.notEqual(clean.identity.partial, true);
});

test("openai manifest brand color matches the published brand assets", () => {
  const yaml = fs.readFileSync("skills/glowup-ui/agents/openai.yaml", "utf8");
  const declared = /brand_color:\s*"?(#[0-9a-f]{6})"?/i.exec(yaml)[1].toLowerCase();
  const mark = fs.readFileSync("assets/brand/mark.svg", "utf8");
  assert.ok(mark.toLowerCase().includes(declared), `brand_color ${declared} must appear in the brand mark`);
});
