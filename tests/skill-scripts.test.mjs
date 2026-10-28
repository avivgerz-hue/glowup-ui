import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { discover, classifyRoute, isVisualModule } from "../skills/glowup-ui/scripts/discover.mjs";
import { contrastRatio, grade, parseHex } from "../skills/glowup-ui/scripts/contrast.mjs";
import { parseViewports, parseRoutes, routeSlug, isLocalUrl, renderContactSheet } from "../skills/glowup-ui/scripts/screenshot.mjs";
import { renderCompare, pairShots, escapeHtml } from "../skills/glowup-ui/scripts/compare.mjs";
import { audit, wiringTokens, copyStrings } from "../skills/glowup-ui/scripts/audit.mjs";
import { spawnSync } from "node:child_process";

function project(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-discover-"));
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), typeof content === "string" ? content : JSON.stringify(content));
  }
  return root;
}

test("discover: Next.js App Router with route groups, dynamic segments, and Tailwind v4", () => {
  const root = project({
    "package.json": { dependencies: { next: "15.0.0", react: "19.0.0" }, devDependencies: { tailwindcss: "^4.1.0" }, scripts: { dev: "next dev", build: "next build", lint: "next lint" } },
    "pnpm-lock.yaml": "",
    "app/layout.tsx": 'import { Inter } from "next/font/google";',
    "app/page.tsx": "",
    "app/(marketing)/pricing/page.tsx": "",
    "app/projects/[id]/page.tsx": "",
    "app/_internal/page.tsx": "",
    "app/loading.tsx": "",
    "app/globals.css": '@import "tailwindcss";\n@theme { --color-primary: #000; }',
    "components/ui/button.tsx": "",
    ".env.local": "SECRET=shh",
  });
  const r = discover(root);
  assert.equal(r.framework.name, "next");
  assert.equal(r.framework.router, "app");
  assert.equal(r.packageManager, "pnpm");
  assert.deepEqual(r.routes.map((x) => x.path), ["/", "/pricing", "/projects/[id]"]);
  assert.equal(r.routes.find((x) => x.path === "/projects/[id]").dynamic, true);
  assert.equal(r.styling.tailwind.major, 4);
  assert.ok(r.styling.tokenFiles.some((t) => t.tailwindTheme));
  assert.ok(r.fonts.includes("next/font:Inter"));
  assert.ok(r.specialStateFiles.includes("app/loading.tsx"));
  assert.deepEqual(r.scripts.lint, [{ name: "lint", command: "next lint" }]);
  assert.ok(!JSON.stringify(r).includes("shh"), "never reads .env files");
});

test("discover: Next.js Pages Router skips _app and api", () => {
  const root = project({
    "package.json": { dependencies: { next: "14.0.0" } },
    "pages/_app.tsx": "",
    "pages/index.tsx": "",
    "pages/about.tsx": "",
    "pages/blog/[slug].tsx": "",
    "pages/api/hello.ts": "",
  });
  assert.deepEqual(discover(root).routes.map((x) => x.path), ["/", "/about", "/blog/[slug]"]);
});

test("discover: Vite + React Router extracts paths", () => {
  const root = project({
    "package.json": { dependencies: { react: "18.3.0", "react-router-dom": "^6.0.0" }, devDependencies: { vite: "^5.0.0", tailwindcss: "^3.4.0" } },
    "tailwind.config.js": "export default {}",
    "src/main.tsx": `import { createBrowserRouter } from "react-router-dom";\nconst r = createBrowserRouter([{ path: "/", children: [{ index: true }, { path: "settings" }, { path: "projects/:id" }, { path: "*" }] }]);`,
  });
  const r = discover(root);
  assert.equal(r.framework.name, "react");
  assert.equal(r.framework.bundler, "vite");
  assert.equal(r.styling.tailwind.major, 3);
  assert.deepEqual(r.routes.map((x) => x.path), ["/", "/projects/:id", "/settings"]);
});

test("discover: route objects in a file that doesn't import the router", () => {
  const root = project({
    "package.json": { dependencies: { react: "19.0.0", "react-router": "^7.0.0" } },
    "src/routes.jsx": `export const routes = [{ path: "/login", element: <Login /> }, { path: "/", element: <Layout />, children: [{ path: "team", element: <Team /> }] }];`,
  });
  assert.deepEqual(discover(root).routes.map((x) => x.path), ["/", "/login", "/team"]);
});

test("discover: SvelteKit file routes", () => {
  const root = project({
    "package.json": { devDependencies: { "@sveltejs/kit": "^2.0.0", svelte: "^5.0.0" } },
    "src/routes/+page.svelte": "",
    "src/routes/about/+page.svelte": "",
    "src/routes/(app)/dashboard/+page.svelte": "",
  });
  assert.deepEqual(discover(root).routes.map((x) => x.path), ["/", "/about", "/dashboard"]);
});

test("contrast: matches known WCAG ratios", () => {
  assert.equal(Math.round(contrastRatio("#000", "#fff") * 100) / 100, 21);
  assert.equal(contrastRatio("#777", "#777"), 1);
  assert.equal(grade(contrastRatio("#767676", "#ffffff")).aaText, true);
  assert.equal(grade(contrastRatio("#777777", "#ffffff")).aaText, false);
  assert.deepEqual(parseHex("#0af"), [0, 170, 255]);
  assert.throws(() => parseHex("blue"));
});

test("screenshot: argument helpers", () => {
  assert.deepEqual(parseViewports("desktop=1440x900,mobile=390x844"), [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]);
  assert.throws(() => parseViewports("desktop=wide"));
  assert.deepEqual(parseRoutes("/, settings ,/a/b"), ["/", "/settings", "/a/b"]);
  assert.deepEqual(parseRoutes(undefined), ["/"]);
  assert.equal(routeSlug("/"), "home");
  assert.equal(routeSlug("/projects/42"), "projects-42");
  assert.equal(routeSlug("/projects?simulate=empty"), "projects--simulate-empty");
  assert.notEqual(routeSlug("/projects?simulate=empty"), routeSlug("/projects"));
  assert.equal(isLocalUrl("http://localhost:5173"), true);
  assert.equal(isLocalUrl("http://127.0.0.1:3000/x"), true);
  assert.equal(isLocalUrl("https://example.com"), false);
});

test("compare: pairs shots and escapes content", () => {
  const before = { capturedAt: "t1", shots: [{ route: "/", viewport: "desktop", status: "ok", file: "desktop/home.png" }] };
  const after = { capturedAt: "t2", shots: [
    { route: "/", viewport: "desktop", status: "ok", file: "desktop/home.png", overflowX: true },
    { route: "/<x>", viewport: "mobile", status: "redirected", file: "mobile/x.png" },
  ] };
  assert.equal(pairShots(before, after).length, 2);
  const html = renderCompare(before, after);
  assert.match(html, /before\/desktop\/home\.png/);
  assert.match(html, /after\/desktop\/home\.png/);
  assert.match(html, /horizontal overflow/);
  assert.match(html, /redirected/);
  assert.match(html, /Not captured/);
  assert.ok(html.includes(escapeHtml("/<x>")) && !html.includes("<code>/<x></code>"));
});

test("screenshot: contact sheet lists every shot, flags problems, and escapes routes", () => {
  const viewports = parseViewports("desktop=1440x900,mobile=390x844");
  const shots = [
    { route: "/", viewport: "desktop", status: "ok", file: "desktop/home.png" },
    { route: "/<x>", viewport: "mobile", status: "redirected", file: "mobile/x.png", overflowX: true },
    { route: "/broken", viewport: "mobile", status: "error", error: "timeout", file: null },
  ];
  const html = renderContactSheet({ label: "after", shots, viewports });
  assert.match(html, /after: 3 screenshots/);
  assert.match(html, /src="desktop\/home\.png"/);
  assert.match(html, /redirected/);
  assert.match(html, /horizontal overflow/);
  assert.match(html, /timeout/);
  assert.ok(!html.includes("<code>/<x></code>"));
  assert.match(html, /width:420px;height:263px/, "desktop thumbnail keeps the viewport aspect ratio");
  assert.match(html, /width:190px;height:411px/, "mobile thumbnail keeps the viewport aspect ratio");
});

test("discover: classifies routes into page types", () => {
  const cases = {
    "/": "dashboard", "/dashboard": "dashboard", "/analytics/reports": "dashboard",
    "/login": "auth", "/auth/sign-in": "auth", "/onboarding": "auth",
    "/settings": "settings", "/settings/billing": "settings", "/account": "settings",
    "/pricing": "marketing", "/blog": "marketing",
    "/projects": "collection", "/team": "collection",
    "/projects/:id": "detail", "/blog/[slug]": "marketing", "/invoices/[id]": "detail", "/orders/$orderId": "detail",
    "/projects/new": "form", "/invoices/[id]/edit": "form",
    "/404": "error", "/not-found": "error",
  };
  for (const [route, type] of Object.entries(cases)) assert.equal(classifyRoute(route), type, route);
});

test("discover: ranks components by importers and reports scale", () => {
  const files = {
    "package.json": { dependencies: { react: "19.0.0", "react-router": "^7.0.0" } },
    "src/components/Button.tsx": "export default function Button() {}",
    "src/components/ui/card/index.tsx": "export const Card = () => null;",
    "src/routes.tsx": `export const routes = [{ path: "/", element: null }, { path: "settings", element: null }];`,
    "src/styles.css": "",
  };
  for (const page of ["Home", "Settings", "Team"]) {
    files[`src/pages/${page}.tsx`] = `import Button from "../components/Button";\nimport { Card } from "@/components/ui/card";\nimport "../styles.css";\nimport React from "react";`;
  }
  files["src/pages/Home.tsx"] += `\nimport Button2 from "../components/Button.tsx";`;
  files["src/components/Button.test.tsx"] = `import Button from "./Button";`;
  const r = discover(project(files));
  assert.deepEqual(r.componentUsage.slice(0, 2), [
    { module: "@/components/ui/card", importedBy: 3 },
    { module: "src/components/Button", importedBy: 3 },
  ]);
  assert.ok(!r.componentUsage.some((c) => /styles|react$/.test(c.module)), "no assets or packages");
  assert.equal(r.scale.size, "small");
  assert.deepEqual(r.pageTypes, { dashboard: ["/"], settings: ["/settings"] });
  assert.equal(r.routes.find((x) => x.path === "/settings").type, "settings");
});

test("discover: only visual modules count as components", () => {
  for (const id of ["src/components/Button", "@acme/ui/components/button", "~/shell/Shell", "src/ui/card", "src/pages/Dashboard", "app/layouts/main"]) {
    assert.ok(isVisualModule(id), id);
  }
  for (const id of ["src/hooks/useThing", "src/components/useModal", "modules/bookings/types", "src/store/cart", "src/lib/format", "@acme/features/users/UserRepository", "src/app/AuthProvider", "src/components/form.types", "@acme/trpc/react"]) {
    assert.ok(!isVisualModule(id), id);
  }
});

test("discover: monorepo workspace packages and e2e files", () => {
  const root = project({
    "package.json": { dependencies: { react: "19.0.0", "@acme/ui": "workspace:*", "@acme/lib": "workspace:*", lodash: "^4.0.0" } },
    "src/pages/A.tsx": `import { Button } from "@acme/ui/components/button";\nimport { fmt } from "@acme/lib/format";\nimport x from "lodash";`,
    "src/pages/B.tsx": `import { Button } from "@acme/ui/components/button";`,
    "playwright/lib/fixtures.ts": `import { Button } from "@acme/ui/components/button";`,
    "src/thing.e2e.ts": `import { Button } from "@acme/ui/components/button";`,
  });
  assert.deepEqual(discover(root).componentUsage, [{ module: "@acme/ui/components/button", importedBy: 2 }]);
});

test("audit: finds lost wiring, lost copy, and new copy against a git base", () => {
  const root = project({
    "package.json": { dependencies: { react: "19.0.0" } },
    "src/Page.jsx": `export default function Page() { return (<div><h1>Projects</h1><p>Welcome back, Ana.</p><button id="new" onClick={() => alert("Soon")}>New project</button><a href="/team" className="x">Team</a></div>); }`,
    "tests/a.test.jsx": "test",
  });
  const git = (...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: root });
  git("init", "-q"); git("add", "-A"); git("commit", "-qm", "base");
  // Redesign: keeps the handler and link, drops the id, rewrites one string, and invents a tagline.
  fs.writeFileSync(path.join(root, "src/Page.jsx"), `export default function Page() { return (<main><h1>Projects</h1><p>Every project is a line.</p><button onClick={() => alert("Soon")}>New project</button><a href="/team">Team</a></main>); }`);
  const r = audit(root, "HEAD");
  assert.ok(r.wiring.lost.includes('id="new"'), "id removal is reported");
  assert.ok(!r.wiring.lost.some((t) => t.includes("onClick")), "handler preserved");
  assert.ok(!r.wiring.lost.some((t) => t.includes("/team")), "link target preserved");
  assert.deepEqual(r.copy.lost, ["Welcome back, Ana."]);
  assert.deepEqual(r.copy.added, ["Every project is a line."]);
  assert.deepEqual(r.testsChanged, []);
  fs.writeFileSync(path.join(root, "tests/a.test.jsx"), "changed");
  assert.equal(audit(root, "HEAD").testsChanged.length, 1);
});

test("audit: extracts wiring and copy without picking up classes or code", () => {
  const code = `<label htmlFor="q">Search tickets</label><input id="q" aria-label="Search" className="rounded border px-2" /><Card description="Here is what is happening today" />{count > 0 ? "Items" : "None"}`;
  const wiring = wiringTokens(code);
  assert.ok(wiring.has('htmlFor="q"') && wiring.has('id="q"'));
  const copy = copyStrings(code);
  assert.ok(copy.has("Search tickets") && copy.has("Here is what is happening today"));
  assert.ok(![...copy].some((c) => c.includes("rounded")), "class names are not copy");
});

test("audit: flags a redesign that loses visual richness", () => {
  const root = project({
    "package.json": { dependencies: { react: "19.0.0" } },
    "src/Page.jsx": `export default function Page() { return (<main><Avatar name="A" /><Avatar name="B" /><Avatar name="C" /><Sparkline data={d} /><Sparkline data={d} /><Sparkline data={d} /><svg /><svg /><svg /></main>); }`,
  });
  const git = (...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: root });
  git("init", "-q"); git("add", "-A"); git("commit", "-qm", "base");
  fs.writeFileSync(path.join(root, "src/Page.jsx"), `export default function Page() { return (<main><Avatar name="A" /></main>); }`);
  const r = audit(root, "HEAD");
  assert.deepEqual(r.visuals.shrunk.map((v) => v.kind).sort(), ["avatars", "charts", "illustrations"]);
});

test('screenshot capture rejects path traversal and cross-origin routes before browser startup', async () => {
 const {capture}=await import('../skills/glowup-ui/scripts/screenshot.mjs');
 const options={baseUrl:'http://127.0.0.1:4173',routes:['/'],viewports:[{name:'mobile',width:390,height:844}],label:'before',outDir:'/tmp/not-created-by-invalid-capture'};
 for(const label of ['../escape','/absolute','..','a/b'])await assert.rejects(capture({...options,label}),/directory names/);
 await assert.rejects(capture({...options,viewports:[{name:'../escape'}]}),/directory names/);
 await assert.rejects(capture({...options,routes:['//example.com/private']}),/base URL origin/);
});
