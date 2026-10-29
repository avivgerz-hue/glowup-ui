#!/usr/bin/env node
// Summarize a web project's UI-relevant structure as JSON.
// Read-only: it never writes files, runs project code, or reads .env files.
// Usage: node discover.mjs [project-dir]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", ".nuxt", ".svelte-kit", ".astro", ".output",
  ".agents", ".claude", ".opencode", ".glowup-ui",
  "dist", "build", "out", "coverage", ".turbo", ".vercel", ".glowup", ".cache",
]);
const CODE_EXT = /\.(jsx?|tsx?|mjs|cjs|vue|svelte|astro|mdx?)$/;
const STYLE_EXT = /\.(css|scss|sass|less|pcss)$/;
const MAX_FILES = 20000;
const LOCAL_IMPORT = /^(\.|@\/|~\/|#\/|\$lib\/|src\/)/;
const ASSET_IMPORT = /\.(css|scss|sass|less|svg|png|jpe?g|gif|webp|avif|json|md)$/;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function readText(file, limit = 200_000) {
  try {
    const text = fs.readFileSync(file, "utf8");
    return text.length > limit ? text.slice(0, limit) : text;
  } catch {
    return "";
  }
}

function exists(root, ...parts) {
  return fs.existsSync(path.join(root, ...parts));
}

export function walk(root, dir = root, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (files.length >= MAX_FILES) break;
    if (entry.name.startsWith(".env")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(root, full, files);
    } else if (entry.isFile()) {
      files.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  return files;
}

function majorVersion(range) {
  const match = String(range || "").match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function detectPackageManager(root) {
  if (exists(root, "pnpm-lock.yaml")) return "pnpm";
  if (exists(root, "yarn.lock")) return "yarn";
  if (exists(root, "bun.lockb") || exists(root, "bun.lock")) return "bun";
  if (exists(root, "package-lock.json")) return "npm";
  return exists(root, "package.json") ? "npm" : null;
}

function detectFramework(root, deps, files) {
  const has = (name) => Boolean(deps[name]);
  const appDir = ["app", "src/app"].find((d) => files.some((f) => f.startsWith(`${d}/`) && /\/page\.(jsx?|tsx?|mdx)$/.test(`/${f}`)));
  const pagesDir = ["pages", "src/pages"].find((d) => files.some((f) => f.startsWith(`${d}/`) && CODE_EXT.test(f)));
  if (has("next")) {
    return { name: "next", version: deps.next, router: appDir ? (pagesDir ? "app+pages" : "app") : "pages", appDir: appDir || null, pagesDir: pagesDir || null };
  }
  if (has("nuxt")) return { name: "nuxt", version: deps.nuxt, router: "file" };
  if (has("@sveltejs/kit")) return { name: "sveltekit", version: deps["@sveltejs/kit"], router: "file" };
  if (has("astro")) return { name: "astro", version: deps.astro, router: "file" };
  if (has("@remix-run/react") || has("@react-router/dev")) {
    return { name: has("@react-router/dev") ? "react-router-framework" : "remix", version: deps["@react-router/dev"] || deps["@remix-run/react"], router: "file" };
  }
  const bundler = has("vite") ? "vite" : has("react-scripts") ? "cra" : has("webpack") ? "webpack" : null;
  if (has("react")) {
    const router = has("react-router-dom") || has("react-router") ? "react-router" : has("@tanstack/react-router") ? "tanstack-router" : has("wouter") ? "wouter" : "none";
    return { name: "react", version: deps.react, bundler, router };
  }
  if (has("vue")) return { name: "vue", version: deps.vue, bundler, router: has("vue-router") ? "vue-router" : "none" };
  if (has("svelte")) return { name: "svelte", version: deps.svelte, bundler, router: "none" };
  if (files.some((f) => f.endsWith(".html"))) return { name: "static-html", router: "file" };
  return { name: "unknown" };
}

function nextAppRoute(file, appDir) {
  const rel = file.slice(appDir.length + 1).replace(/(^|\/)page\.(jsx?|tsx?|mdx)$/, "");
  const segments = rel.split("/").filter(Boolean);
  if (segments.some((s) => s.startsWith("_") || s.startsWith("@"))) return null;
  const visible = segments.filter((s) => !/^\(.*\)$/.test(s));
  return "/" + visible.join("/");
}

function filePageRoute(file, baseDir, pattern) {
  let rel = file.slice(baseDir.length + 1).replace(pattern, "");
  rel = rel.replace(/(^|\/)index$/, "");
  const segments = rel.split("/").filter(Boolean).filter((s) => !/^\(.*\)$/.test(s));
  if (segments.some((s) => s.startsWith("_"))) return null;
  return "/" + segments.join("/");
}

function extractRouterPaths(root, files) {
  const routes = new Set();
  const candidates = files.filter((f) => /\.(jsx?|tsx?)$/.test(f) && !/\.(test|spec)\./.test(f));
  for (const file of candidates) {
    const text = readText(path.join(root, file));
    const routeLike = /react-router|@tanstack\/react-router|wouter|<Route\b|\belement\s*:|\bComponent\s*:|(^|\/)routes?\.[jt]sx?$/;
    if (!routeLike.test(text) && !routeLike.test(file)) continue;
    const patterns = [/\bpath\s*:\s*["'`]([^"'`]*)["'`]/g, /\bpath\s*=\s*\{?\s*["'`]([^"'`]*)["'`]/g];
    for (const re of patterns) {
      for (const match of text.matchAll(re)) {
        const value = match[1].trim();
        if (value === "*" || value === "") continue;
        routes.add(value.startsWith("/") ? value : `/${value}`);
      }
    }
  }
  return [...routes];
}

export function detectRoutes(root, framework, files) {
  let routes = [];
  if (framework.name === "next") {
    if (framework.appDir) {
      routes.push(...files.filter((f) => f.startsWith(`${framework.appDir}/`) && /(^|\/)page\.(jsx?|tsx?|mdx)$/.test(f)).map((f) => nextAppRoute(f, framework.appDir)));
    }
    if (framework.pagesDir) {
      const dir = framework.pagesDir;
      routes.push(...files
        .filter((f) => f.startsWith(`${dir}/`) && /\.(jsx?|tsx?|mdx)$/.test(f) && !f.startsWith(`${dir}/api/`))
        .map((f) => filePageRoute(f, dir, /\.(jsx?|tsx?|mdx)$/)));
    }
  } else if (framework.name === "sveltekit") {
    routes = files.filter((f) => /^src\/routes\/(.*\/)?\+page\.svelte$/.test(f)).map((f) => filePageRoute(f, "src/routes", /\/?\+page\.svelte$/));
  } else if (framework.name === "nuxt") {
    const dir = files.some((f) => f.startsWith("app/pages/")) ? "app/pages" : "pages";
    routes = files.filter((f) => f.startsWith(`${dir}/`) && f.endsWith(".vue")).map((f) => filePageRoute(f, dir, /\.vue$/));
  } else if (framework.name === "astro") {
    routes = files.filter((f) => /^src\/pages\/.*\.(astro|mdx?|html)$/.test(f)).map((f) => filePageRoute(f, "src/pages", /\.(astro|mdx?|html)$/));
  } else if (framework.name === "remix" || framework.name === "react-router-framework") {
    routes = files
      .filter((f) => /^app\/routes\/[^/]+\.(jsx?|tsx?)$/.test(f))
      .map((f) => {
        const name = f.replace(/^app\/routes\//, "").replace(/\.(jsx?|tsx?)$/, "");
        if (name.startsWith("_") && !name.includes(".")) return null;
        const segs = name.split(".").filter((s) => s !== "_index" && !s.startsWith("_")).map((s) => s.replace(/^\$(.+)/, ":$1"));
        return "/" + segs.join("/");
      });
  } else if (["react", "vue"].includes(framework.name)) {
    routes = extractRouterPaths(root, files);
    if (routes.length === 0) routes = ["/"];
  } else if (framework.name === "static-html") {
    routes = files.filter((f) => f.endsWith(".html")).map((f) => "/" + f.replace(/(^|\/)index\.html$/, ""));
  }
  const unique = [...new Set(routes.filter((r) => r !== null).map((r) => r.replace(/\/+$/, "") || "/"))].sort();
  return unique.map((route) => ({ path: route, dynamic: /\[|:|\$/.test(route), type: classifyRoute(route) }));
}

/** Guess a route's page type from its path, so large apps can design one composition per type. */
export function classifyRoute(route) {
  const p = route.toLowerCase();
  const last = p.split("/").filter(Boolean).pop() || "";
  if (/(^|\/)(login|log-in|signin|sign-in|signup|sign-up|register|auth|forgot|reset|verify|logout|invite|onboarding)(\/|$)/.test(p)) return "auth";
  if (/(^|\/)(404|500|not-found|error)(\/|$)/.test(p) || p === "*") return "error";
  if (/(^|\/)(settings|account|profile|preferences|billing|security|notifications|admin\/config)(\/|$)/.test(p)) return "settings";
  if (/(^|\/)(pricing|about|features|blog|contact|terms|privacy|legal|landing|changelog|careers)(\/|$)/.test(p)) return "marketing";
  if (p === "/" || /(^|\/)(dashboard|overview|home|analytics|reports?|insights)(\/|$)/.test(p)) return "dashboard";
  if (/^(\[.*\]|:.+|\$.+)$/.test(last)) return "detail";
  if (/(^|\/)(new|create|edit)(\/|$)/.test(p)) return "form";
  return "collection";
}

// Not visual: modules under these folders, or named like hooks, are skipped in the ranking.
const NON_VISUAL_SEGMENT = /^(hooks?|types?|stores?|state|utils?|lib|helpers?|api|server|trpc|services?|constants?|config|schemas?|models?|data|i18n|locales?|context|providers?|actions?)$/;

/** True when a module id looks like UI (a component or UI folder), not types, hooks, or data. */
export function isVisualModule(id) {
  const segments = id.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "";
  if (/^use[A-Z]/.test(last) || /\.(types?|d|schema|store|utils?)$/.test(last)) return false;
  if (/(Repository|Provider|Store|Service|Context|Client|Schema|Router|Handler|Helper|Utils?|Types?|Config)$/.test(last)) return false;
  if (segments.some((s) => NON_VISUAL_SEGMENT.test(s))) return false;
  return /^[A-Z]/.test(last) || segments.some((s) => /^(components?|ui|primitives|design-system|layouts?|shell)$/i.test(s));
}

/**
 * Rank UI modules by how many files import them: the highest-leverage components to restyle first.
 * Counts relative/aliased imports and imports from monorepo workspace packages (for example "@acme/ui/button").
 */
export function componentUsage(root, files, limit = 25, workspacePackages = []) {
  const counts = new Map();
  const isWorkspace = (spec) => workspacePackages.some((name) => spec === name || spec.startsWith(`${name}/`));
  const codeFiles = files.filter((f) => /\.(jsx?|tsx?|mjs|vue|svelte|astro)$/.test(f) && !/\.(test|spec|stories|e2e)\./.test(f) && !/(^|\/)(tests?|__tests__|__mocks__|e2e|playwright|cypress|fixtures|test-utils|mocks)\//.test(f));
  for (const file of codeFiles.slice(0, 8000)) {
    const text = readText(path.join(root, file));
    const seen = new Set();
    for (const m of text.matchAll(/(?:import|export)\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g)) {
      const spec = m[1];
      if (!(LOCAL_IMPORT.test(spec) || isWorkspace(spec)) || ASSET_IMPORT.test(spec)) continue;
      let id = spec.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(file), spec)) : spec;
      id = id.replace(/\.(jsx?|tsx?|mjs|vue|svelte)$/, "").replace(/\/index$/, "");
      if (seen.has(id) || !isVisualModule(id)) continue;
      seen.add(id);
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([module, importedBy]) => ({ module, importedBy }));
}

function detectStyling(root, deps, files) {
  const has = (name) => Boolean(deps[name]);
  const cssFiles = files.filter((f) => STYLE_EXT.test(f));
  const twConfig = files.find((f) => /^tailwind\.config\.(js|cjs|mjs|ts)$/.test(f)) || null;
  const v4Import = cssFiles.find((f) => /@import\s+["']tailwindcss["']/.test(readText(path.join(root, f), 20_000)));
  let tailwind = null;
  if (has("tailwindcss") || twConfig || v4Import) {
    const major = majorVersion(deps.tailwindcss) ?? (v4Import && !twConfig ? 4 : 3);
    tailwind = { version: deps.tailwindcss || null, major, config: twConfig, cssEntry: v4Import || null };
  }
  const libs = ["styled-components", "@emotion/react", "@mui/material", "@chakra-ui/react", "@mantine/core", "antd", "@radix-ui/react-slot", "@headlessui/react", "react-aria-components", "class-variance-authority", "clsx", "classnames", "tailwind-merge", "sass", "bootstrap", "@vanilla-extract/css"];
  const tokenFiles = [];
  for (const f of cssFiles) {
    const text = readText(path.join(root, f), 100_000);
    const vars = text.match(/--[a-zA-Z0-9-_]+\s*:/g) || [];
    if (vars.length > 0 || /@theme\b/.test(text)) {
      tokenFiles.push({ file: f, customProperties: vars.length, tailwindTheme: /@theme\b/.test(text) });
    }
  }
  return {
    tailwind,
    cssModules: cssFiles.filter((f) => /\.module\.(css|scss|sass|less)$/.test(f)).length,
    stylesheets: cssFiles.slice(0, 50),
    libraries: libs.filter(has),
    shadcn: exists(root, "components.json"),
    tokenFiles,
  };
}

function detectFonts(root, deps, files) {
  const fonts = new Set();
  for (const name of Object.keys(deps)) {
    if (name.startsWith("@fontsource")) fonts.add(name);
  }
  const html = files.filter((f) => f.endsWith(".html")).slice(0, 10);
  for (const f of html) {
    for (const m of readText(path.join(root, f)).matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/g)) {
      fonts.add(`google:${decodeURIComponent(m[1]).replace(/\+/g, " ")}`);
    }
  }
  const code = files.filter((f) => /\.(jsx?|tsx?)$/.test(f) && /(layout|_app|font)/i.test(f)).slice(0, 30);
  for (const f of code) {
    const text = readText(path.join(root, f));
    for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']next\/font\/google["']/g)) {
      m[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((n) => fonts.add(`next/font:${n}`));
    }
    if (/next\/font\/local/.test(text)) fonts.add("next/font:local");
  }
  return [...fonts];
}

export function discover(rootInput = ".") {
  const root = path.resolve(rootInput);
  const pkg = readJson(path.join(root, "package.json")) || {};
  const deps = { ...(pkg.peerDependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.dependencies || {}) };
  const files = walk(root);
  const framework = detectFramework(root, deps, files);
  const scripts = pkg.scripts || {};
  const pick = (...names) => names.filter((n) => scripts[n]).map((n) => ({ name: n, command: scripts[n] }));
  const componentDirs = [...new Set(files
    .map((f) => f.match(/^(.*?\/?(components|ui)\/)/)?.[1])
    .filter(Boolean)
    .map((d) => d.replace(/\/$/, "")))].slice(0, 20);
  const specialStates = files.filter((f) => /(^|\/)(loading|error|not-found|global-error|404|500|\+error)\.(jsx?|tsx?|svelte|vue|astro)$/.test(f));
  const routes = detectRoutes(root, framework, files);
  const pageTypes = {};
  for (const r of routes) (pageTypes[r.type] ||= []).push(r.path);
  const componentFiles = files.filter((f) => /(^|\/)(components|ui)\//.test(f) && /\.(jsx|tsx|vue|svelte|astro)$/.test(f) && !/\.(test|spec|stories)\./.test(f)).length;
  const large = routes.length >= 30 || componentFiles >= 100;

  return {
    root,
    name: pkg.name || path.basename(root),
    packageManager: detectPackageManager(root),
    framework,
    typescript: Boolean(deps.typescript) || files.some((f) => f === "tsconfig.json"),
    scale: {
      routes: routes.length,
      componentFiles,
      size: large ? "large" : routes.length >= 10 || componentFiles >= 30 ? "medium" : "small",
      advice: large ? "Work by route group; fix shared primitives first and inspect every affected route. Keep already-good pages unchanged." : "Fix evidenced weaknesses in the requested scope. Reuse shared components; inspect affected routes without rewriting every page.",
    },
    routes,
    pageTypes,
    componentUsage: componentUsage(root, files, 25, Object.entries(deps).filter(([, v]) => /^(workspace:|file:|link:|\*$)/.test(String(v))).map(([k]) => k)),
    styling: detectStyling(root, deps, files),
    fonts: detectFonts(root, deps, files),
    componentDirs,
    specialStateFiles: specialStates,
    scripts: {
      dev: pick("dev", "start", "serve"),
      build: pick("build"),
      preview: pick("preview"),
      lint: pick("lint", "lint:check"),
      typecheck: pick("typecheck", "type-check", "tsc", "check-types", "check"),
      test: pick("test", "test:unit", "test:ci"),
    },
    browserTooling: {
      playwrightDependency: Boolean(deps.playwright || deps["@playwright/test"]),
    },
    notes: [
      "Routes are detected statically; confirm them against the router code.",
      "Dynamic routes need a real ID from seed or mock data before they can be captured.",
    ],
    fileCount: files.length,
    truncated: files.length >= MAX_FILES,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2] || ".";
  if (!fs.existsSync(target)) {
    console.error(`Directory not found: ${target}`);
    process.exit(66);
  }
  console.log(JSON.stringify(discover(target), null, 2));
}
