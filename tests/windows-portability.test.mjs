// Bugs found by running the suite on a real Windows machine. Each one made the repository look
// broken when the fault was in the tooling. They are cheap to test and expensive to rediscover.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sh } from "../benchmarks/lib/proc.mjs";

test("proc: an executable path containing a space still runs", () => {
  // On Windows, spawn with shell:true concatenates argv unquoted, so
  // "C:\Program Files\nodejs\node.exe" arrives as "C:\Program". This reproduces that shape on
  // any platform by copying the running Node into a directory with a space in its name.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-space-"));
  try {
    const spaced = path.join(dir, "Program Files", "node-here");
    fs.mkdirSync(path.dirname(spaced), { recursive: true });
    fs.copyFileSync(process.execPath, spaced);
    fs.chmodSync(spaced, 0o755);
    const r = sh(spaced, ["--version"]);
    assert.equal(r.status, 0, `spaced executable failed: ${r.error ?? r.out}`);
    assert.match(r.out.trim(), /^v\d+\./, "should print a node version");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("proc: plain commands are not routed through a shell needlessly", () => {
  const src = fs.readFileSync("benchmarks/lib/proc.mjs", "utf8");
  // A shell is only needed for .cmd/.bat/npx/npm style shims on Windows.
  assert.match(src, /shellNeeded/, "proc must decide when a shell is actually required");
  assert.match(src, /quoteIfNeeded/, "and quote arguments when it is");
});

test("showcase: a failed run never overwrites the committed evidence", () => {
  const src = fs.readFileSync("benchmarks/showcase.mjs", "utf8");
  // The catch block used to write evidence.json into assets/examples, replacing good hashes
  // with `pass: false` and failing the gallery tests for reasons unrelated to the fault.
  const catchBlock = src.slice(src.indexOf("} catch (error) {"));
  assert.ok(!/catch \(error\) \{[\s\S]*?writeFileSync\(path\.join\(out, 'evidence\.json'\)/.test(catchBlock),
    "the failure path must not write the committed evidence file");
  assert.match(catchBlock, /results\/showcase/, "failures belong in the results directory");
  assert.match(catchBlock, /committed evidence is unchanged/, "and the user must be told so");
});

test("tests: symlink-dependent cases skip where the OS refuses symlinks", () => {
  for (const file of ["tests/checkpoint.test.mjs", "tests/inspection-reliability.test.mjs"]) {
    const src = fs.readFileSync(file, "utf8");
    assert.match(src, /canSymlink/, `${file} must probe symlink support`);
    assert.match(src, /t\.skip\(/, `${file} must skip rather than fail when unsupported`);
  }
});
