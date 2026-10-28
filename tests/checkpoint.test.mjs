import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { snapshot, check } from "../skills/glowup-ui/scripts/checkpoint.mjs";
import { browserOptions } from "../skills/glowup-ui/scripts/screenshot.mjs";

const SCRIPT = path.resolve("skills/glowup-ui/scripts/checkpoint.mjs");
const DIRECTION = path.resolve("skills/glowup-ui/scripts/direction.mjs");
function app(t, entries = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-preserve-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, text) => { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), text); };
  for (const [name, text] of Object.entries({
    "src/App.jsx": '<main><h1>Your projects</h1><button onClick={save}>Save changes</button><Chart /><img src="/brand.svg" alt="Brand" /></main>',
    "src/theme.css": ':root { --color-brand: #125e49; --font-body: "Georgia"; } body { font-family: var(--font-body); }',
    "public/brand.svg": '<svg><path fill="#125e49" d="M0 0" /></svg>',
    "package.json": '{"scripts":{"test":"node --test"}}',
    "tests/behavior.test.js": '// Original behavior checks',
    ...entries,
  })) write(name, text);
  return { root, write };
}

test("checkpoint: surgical layout improvements preserve the actual app without Git", (t) => {
  const { root, write } = app(t), before = snapshot(root);
  write("src/App.jsx", '<main className="responsive"><h1>Your projects</h1><button className="focus-visible:ring-2" onClick={save}>Save changes</button><Chart /><img src="/brand.svg" alt="Brand" /></main>');
  assert.equal(check(root, before).ok, true);
});

test("checkpoint: removal of a single chart, lost control, and deleted copy require review", (t) => {
  const { root, write } = app(t), before = snapshot(root);
  write("src/App.jsx", '<main><h1>New dashboard</h1><img src="/brand.svg" alt="Brand" /></main>');
  const result = check(root, before);
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((f) => f.kind === "wiring" && f.detail.includes("onClick")));
  assert.ok(result.failures.some((f) => f.kind === "copy" && f.detail === "Your projects"));
  assert.ok(result.warnings.some((f) => f.kind === "visual-loss" && f.detail === "charts" && f.before === 1));
});

test("checkpoint: one page cannot mask a control removed from another", (t) => {
  const button = '<button onClick={save}>Save changes</button>';
  const { root, write } = app(t, { "src/Other.jsx": button }), before = snapshot(root);
  write("src/Other.jsx", '<div />');
  assert.ok(check(root, before).failures.some((f) => f.kind === "wiring" && f.before === 2 && f.after === 1));
});

test("checkpoint: catches one of two identical handlers removed on the same page", (t) => {
  const button = '<button onClick={save}>Save changes</button>';
  const { root, write } = app(t, { "src/App.jsx": button + button }), before = snapshot(root);
  write("src/App.jsx", button);
  assert.ok(check(root, before).failures.some((f) => f.kind === "wiring" && f.before === 2 && f.after === 1));
});

test("checkpoint: Vue event and model bindings cannot disappear during a visual edit", (t) => {
  const source = '<template><label for="email">Email<input id="email" v-model="email" @change="save" /></label><button @click="save">Save</button></template>';
  const { root, write } = app(t, { "src/Form.vue": source }), before = snapshot(root);
  write("src/Form.vue", source.replace('v-model="email"', '').replace('@click="save"', ''));
  const missing = check(root, before).failures.filter((f) => f.kind === "wiring").map((f) => f.detail);
  assert.ok(missing.includes('v-model="email"'));
  assert.ok(missing.includes('@click="save"'));
});

test("checkpoint: Svelte event and two-way binding losses require review", (t) => {
  const source = '<form on:submit|preventDefault={save}><input bind:value={email} /></form>';
  const { root, write } = app(t, { "src/Form.svelte": source }), before = snapshot(root);
  write("src/Form.svelte", '<form><input /></form>');
  const missing = check(root, before).failures.filter((f) => f.kind === "wiring").map((f) => f.detail);
  assert.ok(missing.includes('on:submit|preventDefault={save}'));
  assert.ok(missing.includes('bind:value={email}'));
});

test("checkpoint: freezes an inline logo even when it lives in a general icon module", (t) => {
  const original = 'export function LogoMark() { return <svg><path fill="#125e49" /></svg>; }';
  const { root, write } = app(t, { "src/Icon.jsx": original }), before = snapshot(root);
  write("src/Icon.jsx", original.replace("#125e49", "#245bba"));
  assert.ok(check(root, before).failures.some((f) => f.kind === "identity"));
});

for (const name of ["public/brand.svg", "package.json", "tests/behavior.test.js", "src/theme.css"]) {
  test(`checkpoint: catches a regression in ${name}`, (t) => {
    const { root, write } = app(t), before = snapshot(root);
    write(name, name.endsWith("css") ? ':root { --color-brand: #245bba; --font-body: "Inter"; }' : "replaced");
    assert.equal(check(root, before).ok, false);
  });
}

test("checkpoint: catches changed data and hooks even when their imports stay intact", (t) => {
  const { root, write } = app(t, { "src/data.js": 'export const price = 10;', "src/useCart.ts": 'export function useCart() { return { total: 10 }; }' });
  const before = snapshot(root);
  write("src/data.js", 'export const price = 100;');
  write("src/useCart.ts", 'export function useCart() { return { total: 100 }; }');
  const failures = check(root, before).failures.filter((f) => f.kind === "protected-file");
  assert.equal(failures.length, 2);
});

test("checkpoint: preserves a one-word product name", (t) => {
  const { root, write } = app(t, { "src/Brand.jsx": '<b>Plotline</b>' }), before = snapshot(root);
  write("src/Brand.jsx", '<b>Generic</b>');
  assert.ok(check(root, before).failures.some((f) => f.kind === "copy" && f.detail === "Plotline"));
});

test("checkpoint: invented marketing claims require review", (t) => {
  const { root, write } = app(t), before = snapshot(root);
  const original = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  write("src/App.jsx", original.replace("</main>", "<p>Trusted by 10000 teams</p></main>"));
  assert.ok(check(root, before).warnings.some((f) => f.kind === "new-copy" && f.detail.includes("10000")));
});

test("checkpoint: stacking another header requires browser review", (t) => {
  const { root, write } = app(t, { "src/Layout.jsx": '<header><nav /></header>' }), before = snapshot(root);
  write("src/Layout.jsx", '<header><nav /></header><header><nav /></header>');
  assert.ok(check(root, before).warnings.some((f) => f.kind === "added-chrome"));
});

test("checkpoint: initially dirty UI files stay frozen while our edits to clean UI remain reviewable", (t) => {
  const { root, write } = app(t);
  for (const args of [["init", "-q"], ["add", "."], ["-c", "user.name=test", "-c", "user.email=test@local", "commit", "-qm", "baseline"]]) {
    assert.equal(spawnSync("git", args, { cwd: root }).status, 0);
  }
  write("src/User.jsx", "// user work");
  const before = snapshot(root);
  write("src/App.jsx", fs.readFileSync(path.join(root, "src/App.jsx"), "utf8").replace("<main>", '<main className="grid">'));
  assert.equal(check(root, before).ok, true);
  write("src/User.jsx", "// overwritten");
  assert.ok(check(root, before).failures.some((f) => f.kind === "protected-file" && f.file === "src/User.jsx"));
});

test("checkpoint: a broken Git index cannot silently disable user-change protection", (t) => {
  const { root } = app(t);
  assert.equal(spawnSync("git", ["init", "-q"], { cwd: root }).status, 0);
  fs.writeFileSync(path.join(root, ".git/index"), "broken");
  assert.throws(() => snapshot(root), /Cannot inspect existing Git changes safely/);
});

test("checkpoint CLI: a non-Git app still works when Git is not installed", (t) => {
  const { root } = app(t);
  const env = { ...process.env, PATH: "", Path: "" };
  delete env.GIT_DIR; delete env.GIT_WORK_TREE;
  const r = spawnSync(process.execPath, [SCRIPT, "save", root], { env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(root, ".glowup/checkpoint.json")));
});

test("checkpoint: moving a control to a new component does not lose its wiring", (t) => {
  const { root, write } = app(t), before = snapshot(root);
  write("src/Save.jsx", '<button onClick={save}>Save changes</button>');
  write("src/App.jsx", fs.readFileSync(path.join(root, "src/App.jsx"), "utf8").replace('<button onClick={save}>Save changes</button>', "<Save />"));
  assert.equal(check(root, before).ok, true);
});

test("checkpoint CLI: refuses to overwrite evidence and returns nonzero on regressions", (t) => {
  const { root, write } = app(t);
  const run = (command) => spawnSync(process.execPath, [SCRIPT, command, root], { encoding: "utf8" });
  assert.equal(run("save").status, 0);
  assert.equal(run("save").status, 64);
  assert.equal(run("check").status, 0);
  write("public/brand.svg", "recolored logo");
  assert.equal(run("check").status, 1);
});

test("checkpoint: does not serialize environment values or follow external symlinks", (t) => {
  const { root, write } = app(t, { ".env.local": "TOKEN=secret-test-value" });
  fs.symlinkSync("/outside/not-readable", path.join(root, "external"));
  const before = snapshot(root);
  assert.ok(!JSON.stringify(before).includes("secret-test-value"));
  write(".env.local", "TOKEN=replaced");
  assert.equal(check(root, before).ok, false);
});

test("direction CLI: a plain existing app defaults to no-write REFINE without --current", (t) => {
  const { root } = app(t);
  const result = spawnSync(process.execPath, [DIRECTION, "--product", "helpdesk", "--out", "src/theme.css", "--install", "--format", "json"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).writes, []);
  assert.deepEqual(JSON.parse(result.stdout).packages, []);
  assert.equal(JSON.parse(result.stdout).mode, "refine");
  assert.match(fs.readFileSync(path.join(root, "src/theme.css"), "utf8"), /#125e49/);
});

test("browser executable override is explicit and does not disable sandboxing", () => {
  assert.deepEqual(browserOptions({}), {});
  assert.deepEqual(browserOptions({ GLOWUP_BROWSER_EXECUTABLE: "/usr/bin/chromium" }), { executablePath: "/usr/bin/chromium" });
});

test("direction CLI: explicit replacement still cannot overwrite an existing CSS entry", (t) => {
  const { root } = app(t);
  const original = fs.readFileSync(path.join(root, "src/theme.css"), "utf8");
  const result = spawnSync(process.execPath, [DIRECTION, "--product", "helpdesk", "--mode", "replace", "--out", "src/theme.css"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 64);
  assert.match(result.stderr, /Refusing to overwrite/);
  assert.equal(fs.readFileSync(path.join(root, "src/theme.css"), "utf8"), original);
});
