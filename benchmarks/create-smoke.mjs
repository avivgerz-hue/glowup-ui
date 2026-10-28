#!/usr/bin/env node
// Real CREATE CLI, installation, tests, build and browser checks for both kit sizes.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sh, startPreview } from "./lib/proc.mjs";
import { capture, parseViewports, loadPlaywright, browserOptions } from "../skills/glowup-ui/scripts/screenshot.mjs";
import assert from "node:assert/strict";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-create-smoke-"));
const { values } = parseArgs({ options: { out: { type: "string" } } });
const out = values.out ? path.resolve(values.out) : path.join(here, "results/create-smoke");
fs.mkdirSync(out, { recursive: true });
const result = { kind: "CREATE integration check; not a generated-product design benchmark", createdAt: new Date().toISOString(), node: process.version, kits: [], pass: false };
fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result));
const tree = (dir) => fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.name !== "node_modules").flatMap((e) => e.isDirectory() ? tree(path.join(dir, e.name)) : [path.join(dir, e.name)]);
try {
  for (const kit of ["minimal", "full"]) {
    const cwd = path.join(root, kit);
    const run = (cmd, args, dir = cwd) => { const r = sh(cmd, args, { cwd: dir }); if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} [status=${r.status}, signal=${r.signal}, error=${r.error ?? "none"}]: ${r.out}`); return r; };
    const scaffold = run(process.execPath, [path.join(here, "../skills/glowup-ui/scripts/scaffold.mjs"), "--dir", cwd, "--name", "Fieldnote", "--product", "stationery shop", "--surface", "commerce", "--kit", kit, "--install"], root);
    const files = tree(cwd).filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`) && !f.endsWith("package-lock.json"));
    run("npm", ["test"]); run("npm", ["run", "build"]);
    const server = await startPreview(cwd, 4495);
    try {
      const m = await capture({ baseUrl: server.url, routes: ["/"], viewports: parseViewports("desktop=1440x900,mobile=390x844"), label: kit, outDir: out });
      const ready = m.shots.every((s) => s.status === "ok" && !s.overflowX && !s.runtimeErrors?.length && s.measurements.headings.filter((h) => h.level === 1 && h.text === "Fieldnote").length === 1 && s.measurements.webFonts.length > 0);
      result.kits.push({ kit, sourceFiles: files.length, sourceBytes: files.reduce((n, f) => n + fs.statSync(f).size, 0), tests: "passed", build: "passed", browserReady: ready, captures: m.shots.length });
      fs.writeFileSync(path.join(out, `${kit}-scaffold.txt`), scaffold.out);
      if (kit === "full") {
        // Exercise real kit code in a separate scratch route after measuring the scaffold.
        fs.writeFileSync(path.join(cwd, "src/routes.jsx"), `import {useState} from "react"; import {Button,Dialog} from "./ui/index.js"; export function AppRoutes(){ const [open,setOpen]=useState(false); const [closed,setClosed]=useState(0); return <main><h1>Fieldnote</h1><Button onClick={()=>setOpen(true)}>Open dialog</Button><Dialog open={open} onClose={()=>{setOpen(false);setClosed(n=>n+1)}} title="Invite teammate"><label>Name<input /></label><Button>Invite</Button></Dialog><p role="status">Closed:{closed}</p></main>; }`);
        run("npm", ["run", "build"]);
        const pw = await loadPlaywright(), browser = await pw.chromium.launch(browserOptions());
        try {
          const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
          await page.goto(server.url);
          const opener = page.getByRole("button", { name: "Open dialog", exact: true });
          const dialog = page.getByRole("dialog", { name: "Invite teammate", exact: true });
          await opener.focus(); await page.keyboard.press("Enter"); await dialog.waitFor();
          assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true, "Focus must enter and remain in the dialog");
          for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true, "Focus must enter and remain in the dialog"); }
          const box = await page.getByRole("button", { name: "Close", exact: true }).boundingBox();
          assert.ok(box.width >= 44 && box.height >= 44);
          await page.keyboard.press("Shift+Tab"); assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true, "Backward Tab must wrap inside dialog");
          await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
          await page.getByRole("status").filter({hasText:"Closed:1"}).waitFor();
          assert.equal(await opener.evaluate((el) => el === document.activeElement), true);
          await opener.click(); await dialog.waitFor();
          await page.getByRole("button", { name: "Close", exact: true }).click(); await dialog.waitFor({ state: "hidden" });
          await page.getByRole("status").filter({hasText:"Closed:2"}).waitFor();
          result.kits[result.kits.length - 1].dialog = { keyboardOpen: true, focusEnters: true, focusTrap: true, oneCallbackPerClose: true, escapeCloses: true, focusReturns: true, closeButton: true, closeTarget: { width: box.width, height: box.height } };
        } finally { await browser.close(); }
      }
    } finally { server.stop(); }
  }
  result.pass = result.kits.every((k) => k.browserReady) && result.kits[0].sourceBytes < result.kits[1].sourceBytes;
  result.limitations = "A scaffold is a foundation, not a finished product. This checks real fonts/theme and executable setup, not product-specific design quality or model speed/cost.";
} catch (error) { result.error = error.message; }
finally { fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n"); fs.rmSync(root, { recursive: true, force: true }); }
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
