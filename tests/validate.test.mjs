import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateSkill, validateName } from "../lib/validate.mjs";
import { parseSkillFile, parseYamlSubset, FrontmatterError } from "../lib/frontmatter.mjs";
import { SKILL_SOURCE } from "../lib/install.mjs";

function makeSkill(name, frontmatter, body = "# Title\n", files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-validate-"));
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), `---\n${frontmatter}\n---\n${body}`);
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

test("the shipped skill is valid with no warnings", () => {
  const result = validateSkill(SKILL_SOURCE);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.data.name, "glowup-ui");
  assert.ok(result.data.description.length <= 1024);
});

test("name rules follow the Agent Skills spec", () => {
  assert.deepEqual(validateName("pdf-processing", "pdf-processing"), []);
  assert.ok(validateName("PDF-Processing").length > 0, "uppercase");
  assert.ok(validateName("-pdf").length > 0, "leading hyphen");
  assert.ok(validateName("pdf-").length > 0, "trailing hyphen");
  assert.ok(validateName("pdf--processing").length > 0, "consecutive hyphens");
  assert.ok(validateName("a".repeat(65)).length > 0, "too long");
  assert.ok(validateName("pdf", "other").length > 0, "directory mismatch");
});

test("missing description and over-long fields are errors", () => {
  const noDesc = makeSkill("demo", "name: demo");
  assert.ok(validateSkill(noDesc).errors.some((e) => e.startsWith("description")));

  const longDesc = makeSkill("demo", `name: demo\ndescription: ${"x".repeat(1025)}`);
  assert.ok(validateSkill(longDesc).errors.some((e) => e.includes("1024")));

  const longCompat = makeSkill("demo", `name: demo\ndescription: Does a thing. Use when needed.\ncompatibility: ${"y".repeat(501)}`);
  assert.ok(validateSkill(longCompat).errors.some((e) => e.startsWith("compatibility")));
});

test("broken relative links in SKILL.md are errors", () => {
  const dir = makeSkill("demo", "name: demo\ndescription: Does a thing. Use when needed.", "See [ref](references/missing.md) and [ok](references/ok.md).\n", {
    "references/ok.md": "# ok\n",
  });
  const result = validateSkill(dir);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /missing\.md/);
});

test("non-spec frontmatter keys produce a portability warning", () => {
  const dir = makeSkill("demo", "name: demo\ndescription: Does a thing. Use when needed.\ndisable-model-invocation: true");
  const result = validateSkill(dir);
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((w) => w.includes("disable-model-invocation")));
});

test("openai.yaml short_description length is checked", () => {
  const dir = makeSkill("demo", "name: demo\ndescription: Does a thing. Use when needed.", "# x\n", {
    "agents/openai.yaml": 'interface:\n  short_description: "too short"\n',
  });
  assert.ok(validateSkill(dir).warnings.some((w) => w.includes("short_description")));
});

test("frontmatter parser handles quotes, nested maps, and folded blocks", () => {
  const { data, body } = parseSkillFile(`---\nname: "x"\ndescription: >\n  first line\n  second line\nmetadata:\n  version: "1.0"\n  author: someone\n---\n# Body\n`);
  assert.equal(data.name, "x");
  assert.equal(data.description, "first line second line");
  assert.deepEqual(data.metadata, { version: "1.0", author: "someone" });
  assert.equal(body, "# Body\n");
});

test("CRLF checkouts (Windows core.autocrlf) validate like LF ones", () => {
  // Copy the shipped skill with every text file converted to CRLF, as git does on Windows.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-crlf-"));
  const dir = path.join(root, "glowup-ui");
  fs.cpSync(SKILL_SOURCE, dir, { recursive: true });
  for (const rel of fs.readdirSync(dir, { recursive: true })) {
    const file = path.join(dir, rel);
    if (fs.statSync(file).isFile() && /\.(md|ya?ml|mjs)$/.test(file)) {
      fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/\r?\n/g, "\r\n"));
    }
  }
  const result = validateSkill(dir);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test("YAML parser accepts CRLF line endings and a BOM", () => {
  const data = parseYamlSubset('\uFEFFinterface:\r\n  display_name: "Glowup UI"\r\n  short_description: "Redesign an existing web app"\r\npolicy:\r\n  allow_implicit_invocation: true\r\n');
  assert.deepEqual(data, {
    interface: { display_name: "Glowup UI", short_description: "Redesign an existing web app" },
    policy: { allow_implicit_invocation: "true" },
  });
});

test("frontmatter must start on the first line", () => {
  assert.throws(() => parseSkillFile("\n---\nname: x\n---\n"), FrontmatterError);
  assert.throws(() => parseSkillFile("---\nname: x\n"), FrontmatterError);
});
