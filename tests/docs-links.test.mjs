// Documentation rots silently. A deleted image or moved doc leaves a broken link that only a
// reader discovers, and this project shipped two such files in one merge. These tests walk every
// markdown file and check that what it points at actually exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage", "results"]);

const markdownFiles = (dir = ROOT) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...markdownFiles(path.join(dir, e.name)));
    } else if (e.name.endsWith(".md")) out.push(path.join(dir, e.name));
  }
  return out;
};

// Local targets only: skip absolute URLs, anchors, and mailto.
// Strip fenced code blocks first: a markdown snippet showing an example listing is not a link.
const stripFences = (text) => text.replace(/^```[\s\S]*?^```/gm, "");

const localTargets = (text) => {
  const body = stripFences(text);
  const targets = [];
  for (const m of body.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = m[1];
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    targets.push(target.split("#")[0]);
  }
  return [...new Set(targets)].filter(Boolean);
};

test("docs: every local link and image in every markdown file resolves", () => {
  const broken = [];
  for (const file of markdownFiles()) {
    const rel = path.relative(ROOT, file);
    for (const target of localTargets(fs.readFileSync(file, "utf8"))) {
      const resolved = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) broken.push(`${rel} → ${target}`);
    }
  }
  assert.deepEqual(broken, [], `broken local links:\n  ${broken.join("\n  ")}`);
});

test("docs: images referenced by name are not orphaned by later deletions", () => {
  // Every PNG under assets/marketing must be referenced by the README that documents it.
  const documented = fs.readFileSync("assets/marketing/README.md", "utf8");
  for (const f of fs.readdirSync("assets/marketing").filter((x) => x.endsWith(".png"))) {
    assert.ok(documented.includes(f), `assets/marketing/${f} is not listed in its own README`);
  }
  // And that README must not advertise files that are gone.
  for (const m of documented.matchAll(/`([a-z-]+\.png)`/g)) {
    assert.ok(fs.existsSync(path.join("assets/marketing", m[1])), `README advertises missing ${m[1]}`);
  }
});

test("docs: the README's example images exist", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const images = [...readme.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map((m) => m[1]);
  assert.ok(images.length >= 2, "README should show its example images");
  for (const img of images) assert.ok(fs.existsSync(img), `README image missing: ${img}`);
});
