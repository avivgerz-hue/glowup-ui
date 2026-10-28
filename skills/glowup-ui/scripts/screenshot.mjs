#!/usr/bin/env node
// Optional Playwright screenshot capture for before/after comparisons.
// Never installs anything. Screenshots stay on the local machine.
//
//   node screenshot.mjs --check
//   node screenshot.mjs --base-url http://localhost:5173 --routes /,/settings --label before

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { spawn } from "node:child_process";
import { escapeHtml } from "./compare.mjs";
import { discover } from "./discover.mjs";
import { measurePage } from "./measure.mjs";

export const DEFAULT_VIEWPORTS = "desktop=1440x900,mobile=390x844";
const INSTALL_HINT = "To opt in, install it in the project: npm i -D playwright && npx playwright install chromium";

export function parseViewports(spec) {
  return String(spec).split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
    const match = part.match(/^([a-z0-9_-]+)=(\d{2,5})x(\d{2,5})$/i);
    if (!match) throw new Error(`Bad viewport "${part}". Use name=WIDTHxHEIGHT, e.g. mobile=390x844`);
    return { name: match[1], width: Number(match[2]), height: Number(match[3]) };
  });
}

export function parseRoutes(list, file) {
  let routes = [];
  if (file) {
    routes = fs.readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  } else if (list) {
    routes = String(list).split(",").map((r) => r.trim()).filter(Boolean);
  }
  if (routes.length === 0) routes = ["/"];
  return [...new Set(routes.map((r) => (r.startsWith("/") ? r : `/${r}`)))];
}

export function routeSlug(route) {
  const [pathPart, query = ""] = route.split("#")[0].split("?");
  const slugify = (s) => s.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const base = slugify(pathPart) || "home";
  return query ? `${base}--${slugify(query)}` : base;
}

export function isLocalUrl(url) {
  const { hostname } = new URL(url);
  return ["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"].includes(hostname) || hostname.endsWith(".localhost");
}

// One image of every captured page (top of each page, cropped), so a reviewer can see
// the whole app at once before opening individual screenshots.
export function renderContactSheet({ label, shots, viewports }) {
  const sections = viewports.map((vp) => {
    const thumbWidth = vp.width >= 600 ? 420 : 190;
    const thumbHeight = Math.round((thumbWidth * vp.height) / vp.width);
    const cells = shots.filter((s) => s.viewport === vp.name).map((s) => {
      const flags = [s.status !== "ok" ? s.status : null, s.overflowX ? "horizontal overflow" : null].filter(Boolean);
      const media = s.file
        ? `<img src="${escapeHtml(s.file)}" alt="" style="width:${thumbWidth}px;height:${thumbHeight}px">`
        : `<div class="missing" style="width:${thumbWidth}px;height:${thumbHeight}px">${escapeHtml(s.error || "not captured")}</div>`;
      return `<figure>${media}<figcaption><code>${escapeHtml(s.route)}</code>${flags.map((f) => ` <b>${escapeHtml(f)}</b>`).join("")}</figcaption></figure>`;
    }).join("");
    return `<section><h2>${escapeHtml(vp.name)} · ${vp.width}×${vp.height}</h2><div class="grid">${cells}</div></section>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:24px;background:#18181b;color:#e4e4e7;font:14px system-ui,sans-serif}
h1{font-size:18px;margin:0 0 16px}h2{font-size:14px;color:#a1a1aa;margin:20px 0 10px;font-weight:600}
.grid{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0}
img,.missing{display:block;object-fit:cover;object-position:top;border-radius:6px;border:1px solid #3f3f46;background:#fff}
.missing{display:flex;align-items:center;justify-content:center;background:#27272a;color:#a1a1aa;padding:8px;box-sizing:border-box}
figcaption{margin-top:6px;font-size:12px;color:#d4d4d8;max-width:420px}b{color:#fbbf24;font-weight:600}
</style></head><body><h1>${escapeHtml(label)}: ${shots.length} screenshots</h1>${sections}</body></html>`;
}

export async function loadPlaywright(cwd = process.cwd()) {
  const bases = [path.join(cwd, "package.json"), fileURLToPath(import.meta.url)];
  for (const base of bases) {
    const req = createRequire(base);
    for (const name of ["playwright", "@playwright/test", "playwright-core"]) {
      try {
        const resolved = req.resolve(name);
        const mod = await import(pathToFileURL(resolved).href);
        const chromium = mod.chromium || mod.default?.chromium;
        if (chromium) return { chromium, source: resolved };
      } catch {
        // try the next candidate
      }
    }
  }
  return null;
}

export function browserOptions(env = process.env) {
  // Explicit opt-in for an existing browser; never downloads a browser or weakens its sandbox.
  return env.GLOWUP_BROWSER_EXECUTABLE ? { executablePath: env.GLOWUP_BROWSER_EXECUTABLE } : {};
}

async function check() {
  const pw = await loadPlaywright();
  if (!pw) {
    console.error(`Playwright is not installed. ${INSTALL_HINT}`);
    return 2;
  }
  try {
    const browser = await pw.chromium.launch(browserOptions());
    await browser.close();
  } catch (error) {
    console.error(`Playwright found (${pw.source}) but Chromium failed to launch:\n${String(error.message).split("\n")[0]}`);
    console.error("Try: npx playwright install chromium   (Linux may also need: npx playwright install-deps chromium)");
    return 3;
  }
  console.log(`Playwright ready (${pw.source}).`);
  return 0;
}

export async function capture(options) {
  const { baseUrl, routes, viewports, label, outDir, fullPage = true, extraWait = 300, timeout = 30_000, readySelector } = options;
  const safeName = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_.-]{0,63}$/i.test(value);
  if (!safeName(label) || viewports.some(v => !safeName(v.name))) throw new Error('Capture label and viewport names must be simple directory names (letters, digits, _, . or -)');
  const origin = new URL(baseUrl).origin;
  if (routes.some(route => new URL(route, baseUrl).origin !== origin)) throw new Error('Capture routes must stay on the base URL origin');
  const pw = await loadPlaywright();
  if (!pw) throw Object.assign(new Error(`Playwright is not installed. ${INSTALL_HINT}`), { exitCode: 2 });

  const labelDir = path.join(outDir, label);
  fs.mkdirSync(labelDir, { recursive: true });
  const browser = await pw.chromium.launch(browserOptions());
  const shots = [];
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        isMobile: viewport.width < 600,
        hasTouch: viewport.width < 600,
      });
      const page = await context.newPage();
      let runtimeErrors = [];
      page.on("pageerror", (error) => runtimeErrors.push(String(error.message).slice(0, 300)));
      for (const route of routes) {
        runtimeErrors = [];
        const target = new URL(route, baseUrl).href;
        const rel = path.join(viewport.name, `${routeSlug(route)}.png`);
        const shot = { route, viewport: viewport.name, width: viewport.width, height: viewport.height, file: null, status: "ok" };
        try {
          // Polling and analytics need not become idle for an app to be usable.
          const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout });
          shot.httpStatus = response ? response.status() : null;
          const finalUrl = new URL(page.url());
          shot.finalUrl = finalUrl.pathname + finalUrl.search;
          if (readySelector) await page.locator(readySelector).first().waitFor({ state: "visible", timeout });
          await page.waitForTimeout(extraWait);
          await page.evaluate((ms) => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, ms))]), Math.min(timeout, 5000));
          if (shot.httpStatus && shot.httpStatus >= 400) {
            shot.status = `http-${shot.httpStatus}`;
          } else if (finalUrl.pathname.replace(/\/$/, "") !== new URL(target).pathname.replace(/\/$/, "")) {
            shot.status = "redirected";
          }
          shot.overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
          shot.measurements = await page.evaluate(measurePage);
          shot.runtimeErrors = [...runtimeErrors];
          fs.mkdirSync(path.join(labelDir, viewport.name), { recursive: true });
          await page.screenshot({ path: path.join(labelDir, rel), fullPage, animations: "disabled" });
          shot.file = rel.split(path.sep).join("/");
        } catch (error) {
          shot.status = "error";
          shot.error = String(error.message).split("\n")[0];
        }
        shots.push(shot);
        const note = shot.status === "ok" ? "" : `  [${shot.status}${shot.error ? `: ${shot.error}` : ""}]`;
        const overflow = shot.overflowX ? "  [horizontal overflow]" : "";
        console.log(`${label} ${viewport.name.padEnd(8)} ${route}${note}${overflow}`);
      }
      await context.close();
    }
    if (shots.some((s) => s.file)) {
      const sheetHtml = path.join(labelDir, "contact-sheet.html");
      fs.writeFileSync(sheetHtml, renderContactSheet({ label, shots, viewports }));
      const sheetPage = await browser.newPage({ viewport: { width: 1800, height: 900 } });
      // Render only our generated captures in memory. Managed browsers may prohibit file://.
      const embedded = renderContactSheet({ label, shots, viewports }).replace(/src="([^"]+)"/g, (match, src) => {
        const shot = shots.find((s) => s.file === src);
        return shot ? `src="data:image/png;base64,${fs.readFileSync(path.join(labelDir, shot.file)).toString("base64")}"` : match;
      });
      await sheetPage.setContent(embedded, { waitUntil: "load" });
      await sheetPage.screenshot({ path: path.join(labelDir, "contact-sheet.png"), fullPage: true });
      await sheetPage.close();
      console.log(`${label} contact sheet: ${path.join(labelDir, "contact-sheet.png")}`);
    }
  } finally {
    await browser.close();
  }
  const manifest = { label, baseUrl, capturedAt: new Date().toISOString(), fullPage, viewports, routes, shots };
  fs.writeFileSync(path.join(labelDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

async function responds(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(2000) }); return r.status < 500; } catch { return false; }
}

/** Start `command` unless `url` already responds; resolves with a stop() that ends the whole process group. */
export async function serve(command, url, { waitMs = 60_000 } = {}) {
  if (await responds(url)) return () => {};
  const child = spawn(command, { shell: true, detached: true, stdio: "ignore" });
  const stop = () => { try { process.kill(-child.pid, "SIGTERM"); } catch { /* already gone */ } };
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (await responds(url)) return stop;
    await new Promise((r) => setTimeout(r, 500));
  }
  stop();
  throw new Error(`The server started by "${command}" did not answer at ${url} within ${waitMs / 1000}s. Run the build first, or check the port.`);
}

/** Static routes found in the project, plus "/" (dynamic routes need a real id, add those by hand). */
export function autoRoutes(cwd = process.cwd()) {
  const found = (discover(cwd).routes || []).filter((r) => !r.dynamic && !/[:\[*]/.test(r.path)).map((r) => r.path);
  return [...new Set(["/", ...found])];
}

async function main() {
  const { values } = parseArgs({
    options: {
      check: { type: "boolean", default: false },
      "base-url": { type: "string" },
      routes: { type: "string" },
      serve: { type: "string" },
      "routes-file": { type: "string" },
      "ready-selector": { type: "string" },
      label: { type: "string", default: "before" },
      out: { type: "string", default: ".glowup/screenshots" },
      viewports: { type: "string", default: DEFAULT_VIEWPORTS },
      "full-page": { type: "string", default: "true" },
      wait: { type: "string", default: "300" },
      timeout: { type: "string", default: "30000" },
      "allow-remote": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(`Usage:
  node screenshot.mjs --check
  node screenshot.mjs --base-url <url> [--routes /,/a,/b | auto | --routes-file f.txt] [--label before|after]
                      [--serve "npx vite preview --port 4173"]   start the server if the URL is not up, stop it afterwards
                      [--viewports ${DEFAULT_VIEWPORTS}] [--out .glowup/screenshots]
                      [--ready-selector "main"] [--full-page true|false] [--wait 300] [--timeout 30000] [--allow-remote]`);
    return 0;
  }
  if (values.check) return check();
  if (!values["base-url"]) {
    console.error("Missing --base-url (e.g. http://localhost:3000). Run with --help for usage.");
    return 64;
  }
  if (!/^[a-z0-9_-]+$/i.test(values.label)) {
    console.error("--label may contain only letters, numbers, - and _.");
    return 64;
  }
  if (!isLocalUrl(values["base-url"]) && !values["allow-remote"]) {
    console.error("Refusing to capture a non-local URL without --allow-remote. Screenshots are meant for your local dev server.");
    return 64;
  }
  let stop = () => {};
  try {
    if (values.serve) stop = await serve(values.serve, values["base-url"]);
    const manifest = await capture({
      baseUrl: values["base-url"],
      routes: values.routes === "auto" ? autoRoutes() : parseRoutes(values.routes, values["routes-file"]),
      viewports: parseViewports(values.viewports),
      label: values.label,
      outDir: values.out,
      fullPage: values["full-page"] !== "false",
      extraWait: Number(values.wait),
      timeout: Number(values.timeout),
      readySelector: values["ready-selector"],
    });
    const ok = manifest.shots.filter((s) => s.status === "ok").length;
    console.log(`\nSaved ${ok}/${manifest.shots.length} screenshots to ${path.join(values.out, values.label)} (manifest.json included).`);
    return ok === manifest.shots.length && manifest.shots.every((s) => !s.overflowX && !s.runtimeErrors?.length) ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    return error.exitCode || 1;
  } finally {
    stop();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code));
}
