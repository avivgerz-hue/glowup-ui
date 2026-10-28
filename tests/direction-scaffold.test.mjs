import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DIRECTIONS, SURFACES } from "../skills/glowup-ui/scripts/directions.mjs";
import { pickDirection, rankDirections, designSystem, themeCss } from "../skills/glowup-ui/scripts/direction.mjs";
import { scaffold } from "../skills/glowup-ui/scripts/scaffold.mjs";
import { spawnSync } from "node:child_process";

test("directions: every direction is complete and its palette passes contrast in both schemes", () => {
  assert.ok(DIRECTIONS.length >= 12);
  for (const d of DIRECTIONS) {
    for (const key of ["id", "name", "summary", "surfaces", "keywords", "fonts", "palette", "shape", "surface", "shells", "motif", "moves", "avoid"]) assert.ok(d[key], `${d.id} has ${key}`);
    assert.ok(d.surfaces.every((s) => s in SURFACES), `${d.id} surfaces are known`);
    const system = designSystem(d);
    assert.equal(system.palette.checks.filter((c) => !c.pass).length, 0, `${d.id} palette contrast`);
  }
});

test("direction: is deterministic, product-sensitive, and avoids the overused default for specific products", () => {
  const a = pickDirection("online stationery shop selling notebooks and pens", "commerce").chosen.id;
  assert.equal(a, pickDirection("online stationery shop selling notebooks and pens", "commerce").chosen.id);
  const picks = new Set(["personal finance dashboard", "kids coding game site", "luxury watch boutique", "law firm website", "incident response tool for SREs"].map((p, i) => pickDirection(p, ["app", "marketing", "commerce", "service", "app"][i]).chosen.id));
  assert.ok(picks.size >= 4, `distinct directions across products: ${[...picks]}`);
  assert.ok(rankDirections("anything", "app").length > 3);
  assert.throws(() => pickDirection("x", "app", "nope"), /Unknown direction/);
});

test("direction: theme css defines the role tokens the starter kit uses, and a brand overrides the primary", () => {
  const d = DIRECTIONS.find((x) => x.id === "neo-brutal");
  const css = themeCss(d, designSystem(d, { brand: "#3355ff" }));
  for (const token of ["--color-canvas", "--color-primary", "--color-on-primary", "--color-bad-ink", "--radius-control", "--shadow-card", "--font-display", "--card-border: 2px"]) assert.ok(css.includes(token), token);
  assert.ok(css.startsWith('@import "tailwindcss";') || css.includes('@import "tailwindcss";'));
  assert.equal(designSystem(d, { keepFonts: true }).packages.length, 0);
});

test("scaffold: creates a project, never overwrites without --force, and --only ui copies just the kit", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-scaffold-"));
  const r = scaffold({ name: 'Field "Note"', dir, kit: "full" });
  assert.ok(fs.existsSync(path.join(dir, "src/ui/Button.jsx")) && fs.existsSync(path.join(dir, "src/shells/SidebarShell.jsx")));
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).name, "field-note");
  assert.ok(fs.existsSync(path.join(dir, ".gitignore")));
  assert.ok(!fs.readFileSync(path.join(dir, "index.html"), "utf8").includes("__NAME__"));
  fs.writeFileSync(path.join(dir, "src/ui/Button.jsx"), "mine");
  const again = scaffold({ name: "x", dir });
  assert.equal(fs.readFileSync(path.join(dir, "src/ui/Button.jsx"), "utf8"), "mine");
  assert.ok(again.skipped.length > 0 && again.created.length === 0);
  const other = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-scaffold-"));
  scaffold({ only: "ui", dir: other });
  assert.ok(fs.existsSync(path.join(other, "ui/Card.jsx")) && !fs.existsSync(path.join(other, "package.json")));
  assert.ok(r.created.length > 20);
});

test("scaffold CLI: CREATE writes a real theme and declares every font in one manifest", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-create-cli-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const r = spawnSync(process.execPath, [path.resolve("skills/glowup-ui/scripts/scaffold.mjs"), "--dir", dir, "--name", "Fieldnote", "--product", "stationery shop", "--surface", "commerce"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const css = fs.readFileSync(path.join(dir, "src/index.css"), "utf8");
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  assert.match(css, /--color-primary:/);
  assert.match(css, /--font-display:/);
  assert.match(r.stdout, /DIRECTION:/);
  for (const [, font] of css.matchAll(/@import "(@fontsource[^\"]+)"/g)) assert.ok(pkg.dependencies[font], font);
});

test("scaffold: minimal kit resolves imports, full kit is opt-in, and incremental modules keep user files", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-minimal-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const r = scaffold({ dir, product: "helpdesk" });
  assert.ok(!fs.existsSync(path.join(dir, "src/ui/Layouts.jsx")));
  assert.ok(!fs.existsSync(path.join(dir, "src/ui/Illustrations.jsx")));
  const ui = path.join(dir, "src/ui");
  const assertImports = () => {
    for (const file of fs.readdirSync(ui)) for (const [, dep] of fs.readFileSync(path.join(ui, file), "utf8").matchAll(/from "\.\/([^\"]+)"/g)) assert.ok(fs.existsSync(path.join(ui, dep)), `${file}: ${dep}`);
  };
  assertImports();
  const original = fs.readFileSync(path.join(ui, "index.js"), "utf8");
  scaffold({ only: "ui", dir: path.join(dir, "src"), components: "Dialog,Table" });
  assertImports();
  assert.equal(fs.readFileSync(path.join(ui, "index.js"), "utf8"), original);
  assert.ok(fs.existsSync(path.join(ui, "Dialog.jsx")));
  assert.ok(r.created.length < 25);
});

test("scaffold: refuses symlink writes even with --force", (t) => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-scaffold-links-"));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const outside = path.join(parent, "outside"), target = path.join(parent, "app");
  fs.mkdirSync(outside); fs.mkdirSync(path.join(target, "src"), { recursive: true });
  fs.writeFileSync(path.join(outside, "Button.jsx"), "original external file");
  fs.symlinkSync(outside, path.join(target, "src/ui"), process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => scaffold({ dir: target, force: true }), /symlink/);
  assert.equal(fs.readFileSync(path.join(outside, "Button.jsx"), "utf8"), "original external file");
});

test("starter kit: every export in the barrel resolves to a file, and no class names are built dynamically", () => {
  const starter = path.resolve("skills/glowup-ui/assets/starter");
  const ui = path.join(starter, "ui");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  assert.ok(walk(starter).every((f) => f.endsWith(".tpl")), "every starter file is a .tpl, so test runners and compilers in a host project ignore it");
  const barrel = fs.readFileSync(path.join(ui, "index.js.tpl"), "utf8");
  for (const [, file] of barrel.matchAll(/from "\.\/([^"]+)"/g)) assert.ok(fs.existsSync(path.join(ui, `${file}.tpl`)), file);
  for (const f of fs.readdirSync(ui)) {
    const text = fs.readFileSync(path.join(ui, f), "utf8");
    assert.ok(!/className=\{?[`"][^`"]*\$\{/.test(text) && !/cn\(`[^`]*\$\{/.test(text), `${f}: Tailwind cannot see classes assembled with template strings`);
  }
});
