import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lintSource } from "../skills/glowup-ui/scripts/lint.mjs";
import { detectLook } from "../skills/glowup-ui/scripts/look.mjs";
import { pickDirection } from "../skills/glowup-ui/scripts/direction.mjs";
import { spawnSync } from "node:child_process";

const rules = (src) => lintSource(src, "t.jsx").map((f) => f.rule);

test("lint: flags the defects real browser audits found in agent-built UIs", () => {
  assert.ok(rules('<a href="/" aria-label="Fieldnote home"><b>Fieldnote</b> Shop</a>').includes("label-in-name"));
  assert.ok(rules('<button onClick={go}><Icon name="x" /></button>').includes("icon-only-name"));
  assert.ok(rules('<img src="a.png" />').includes("img-alt"));
  assert.ok(rules("<div onClick={go}>x</div>").includes("click-non-interactive"));
  assert.ok(rules('<div className="overflow-x-auto"><table /></div>').includes("scroll-region"));
  assert.ok(rules('<input className="outline-none" id="a" />').includes("focus-outline"));
  assert.ok(rules("<span className={`text-${tone}`}>x</span>").includes("dynamic-class"));
  assert.ok(rules("<h1>a</h1><h3>b</h3>").includes("heading-order"));
  assert.ok(rules('<p className="bg-[#fff]">x</p>').includes("raw-hex"));
});

test("lint: does not flag correct markup", () => {
  const ok = `<nav><a href="/cart" aria-label="Cart, 2 items">Cart <span>2</span></a>
    <button aria-label="Close"><svg /></button><button><Icon name="x" /><span>{label}</span></button>
    <img src="a.png" alt="" /><button className="rounded outline-none focus-visible:ring-2">Go</button>
    <div role="region" aria-label="Table" tabIndex={0} className="overflow-x-auto"><table /></div>
    <label>Name <input /></label><input id="q" aria-label="Search" />
    <a href="/" aria-label="Save changes">Save</a></nav>`;
  assert.deepEqual(rules(ok), []);
});

test("look: fingerprints scheme, accent hue, and shell from source", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-look-"));
  fs.mkdirSync(path.join(dir, "src"));
  fs.writeFileSync(path.join(dir, "src/App.jsx"), `export default () => (<div className="bg-slate-50"><aside className="w-64 fixed inset-y-0"><nav><a className="bg-blue-600 text-white">x</a></nav></aside><button className="bg-blue-500 hover:bg-blue-700 text-blue-600">go</button></div>);`);
  const look = detectLook(dir);
  assert.equal(look.scheme, "light");
  assert.equal(look.accent, "blue");
  assert.equal(look.shell, "sidebar");
  assert.equal(look.current, "light, blue, sidebar");
});

test("direction: current look is left behind, saas-mist is never dealt, and 35 products spread over many directions", () => {
  const withCurrent = pickDirection("helpdesk support dashboard", "app", undefined, { current: "light, blue, top bar" }).chosen;
  assert.ok(!(withCurrent.palette.scheme === "light" && /^#(1d6fa5|0b6e99|1d4e89)/.test(withCurrent.palette.primary)), `${withCurrent.id} must not be a light blue direction`);
  const products = [["personal finance dashboard", "app"], ["devops monitoring dashboard", "app"], ["kids learning game", "marketing"], ["day spa booking site", "service"], ["luxury watch boutique", "commerce"], ["stationery shop", "commerce"], ["sneaker store", "commerce"], ["law firm website", "service"], ["dentist clinic appointments", "service"], ["indie game studio", "marketing"], ["music streaming app", "app"], ["city council services portal", "service"], ["hiking trail guide", "marketing"], ["warehouse inventory system", "app"], ["crm for sales teams", "app"], ["project management for teams", "app"], ["note taking app", "app"], ["fitness habit tracker", "app"], ["architecture portfolio", "editorial"], ["coffee roaster subscription", "commerce"], ["hr onboarding tool", "app"], ["crypto trading terminal", "app"], ["wedding invitation site", "marketing"], ["recipe blog", "editorial"], ["pet adoption platform", "service"], ["language learning app", "app"], ["real estate listings", "commerce"], ["bank savings app", "app"], ["airline check-in", "service"], ["freelancer invoicing tool", "app"], ["podcast landing page", "marketing"], ["hackathon site", "marketing"], ["nonprofit donation site", "marketing"], ["restaurant reservations", "service"], ["university course catalog", "editorial"]];
  const picks = products.map(([p, s]) => pickDirection(p, s).chosen.id);
  assert.ok(!picks.includes("saas-mist"));
  assert.ok(new Set(picks).size >= 11, `distinct directions: ${new Set(picks).size}`);
  const expect = { "day spa booking site": "luxe", "stationery shop": "paper-goods", "kids learning game": "pop-play", "devops monitoring dashboard": "instrument", "hiking trail guide": "field-notes", "warehouse inventory system": "control-room" };
  for (const [p, s] of products) if (expect[p]) assert.equal(pickDirection(p, s).chosen.id, expect[p], p);
});

test("look: separates a designed identity (refine) from a default-looking app (replace)", () => {
  const mk = (files) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-look-")); for (const [f, t] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), t); } return d; };
  const plain = mk({ "src/App.jsx": 'export default () => <button className="bg-blue-600 text-white">Go</button>;' });
  assert.equal(detectLook(plain).designed, false);
  const designed = mk({
    "src/index.css": '@import "@fontsource-variable/inter";\n@theme { --color-brand-50: #eef6ee; --color-brand-500: #2f6b3a; --color-ink: #1d2b20; --color-surface: #fff; --color-line: #dfe8dc; --color-canvas: #f6f8f4; }\n.btn { background: #2f6b3a; } a { color: #2f6b3a; }',
    "src/App.jsx": "export default () => <div />;",
  });
  const look = detectLook(designed);
  assert.equal(look.designed, true);
  assert.equal(look.brand, "#2f6b3a");
});

test("direction: refine mode keeps the brand and fonts and never overwrites an existing theme", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-refine-"));
  fs.mkdirSync(path.join(dir, "src"));
  const css = '@import "@fontsource-variable/inter";\n@theme { --color-brand-50: #eef6ee; --color-brand-500: #2f6b3a; --color-ink: #1d2b20; --color-surface: #fff; --color-line: #dfe8dc; --color-canvas: #f6f8f4; }\n.btn { background: #2f6b3a; } a { color: #2f6b3a; }';
  fs.writeFileSync(path.join(dir, "src/index.css"), css);
  fs.writeFileSync(path.join(dir, "src/App.jsx"), "export default () => <div />;");
  const script = path.resolve("skills/glowup-ui/scripts/direction.mjs");
  const r = spawnSync("node", [script, "--product", "project management app", "--surface", "app", "--current", "auto", "--out", "src/index.css"], { cwd: dir, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /REFINE MODE/);
  assert.equal(fs.readFileSync(path.join(dir, "src/index.css"), "utf8"), css, "existing theme untouched");
  assert.equal(fs.existsSync(path.join(dir, "src/index.suggested.css")), false, "refining must not introduce a second palette or typography system");
});
