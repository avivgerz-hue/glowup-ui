// Validate a skill directory against the Agent Skills specification
// (https://agentskills.io/specification) plus a few portability checks
// for Claude Code and Codex.

import fs from "node:fs";
import path from "node:path";
import { parseSkillFile, parseYamlSubset, FrontmatterError } from "./frontmatter.mjs";

export const SPEC_FIELDS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateName(name, dirName) {
  const errors = [];
  if (typeof name !== "string" || name.length === 0) return ["name: required"];
  if (name.length > 64) errors.push(`name: must be at most 64 characters (got ${name.length})`);
  if (!NAME_RE.test(name)) {
    errors.push("name: only lowercase letters, numbers, and single hyphens; must not start or end with a hyphen");
  }
  if (dirName !== undefined && name !== dirName) {
    errors.push(`name: "${name}" must match the parent directory name "${dirName}"`);
  }
  return errors;
}

function localLinks(markdown) {
  const links = [];
  for (const m of markdown.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    links.push(target.split("#")[0]);
  }
  return links;
}

export function validateSkill(skillDir) {
  const errors = [];
  const warnings = [];
  const dir = path.resolve(skillDir);
  const skillFile = path.join(dir, "SKILL.md");

  if (!fs.existsSync(skillFile)) {
    return { ok: false, errors: [`SKILL.md not found in ${dir}`], warnings, data: null };
  }

  let data;
  let body;
  try {
    ({ data, body } = parseSkillFile(fs.readFileSync(skillFile, "utf8")));
  } catch (error) {
    if (error instanceof FrontmatterError) {
      return { ok: false, errors: [`frontmatter: ${error.message}`], warnings, data: null };
    }
    throw error;
  }

  errors.push(...validateName(data.name, path.basename(dir)));

  if (typeof data.description !== "string" || data.description.trim() === "") {
    errors.push("description: required and must be non-empty");
  } else if (data.description.length > 1024) {
    errors.push(`description: must be at most 1024 characters (got ${data.description.length})`);
  } else if (!/\buse (it )?when\b/i.test(data.description)) {
    warnings.push('description: should say when to use the skill (e.g. "Use when …")');
  }

  if (data.compatibility !== undefined) {
    if (typeof data.compatibility !== "string" || data.compatibility.length === 0 || data.compatibility.length > 500) {
      errors.push("compatibility: must be 1-500 characters when present");
    }
  }
  if (data.metadata !== undefined) {
    if (typeof data.metadata !== "object" || Array.isArray(data.metadata)) {
      errors.push("metadata: must be a map of string keys to string values");
    }
  }
  if (data["allowed-tools"] !== undefined && typeof data["allowed-tools"] !== "string") {
    errors.push("allowed-tools: must be a space-separated string");
  }
  for (const key of Object.keys(data)) {
    if (!SPEC_FIELDS.has(key)) {
      warnings.push(`frontmatter: "${key}" is not an Agent Skills spec field; some agents ignore it and claude.ai uploads reject it`);
    }
  }

  const lineCount = body.split("\n").length;
  if (lineCount > 500) errors.push(`body: SKILL.md should stay under 500 lines (got ${lineCount})`);
  const approxTokens = Math.ceil(body.length / 4);
  if (approxTokens > 5000) warnings.push(`body: ~${approxTokens} tokens; the spec recommends < 5000`);

  for (const link of localLinks(body)) {
    const target = path.resolve(dir, link);
    if (!target.startsWith(dir + path.sep)) {
      errors.push(`link: ${link} points outside the skill directory`);
    } else if (!fs.existsSync(target)) {
      errors.push(`link: ${link} does not exist`);
    }
  }

  const openaiYaml = path.join(dir, "agents", "openai.yaml");
  if (fs.existsSync(openaiYaml)) {
    try {
      const raw = fs.readFileSync(openaiYaml, "utf8");
      const meta = parseYamlSubset(raw);
      const short = meta.interface?.short_description;
      if (short !== undefined && (short.length < 25 || short.length > 64)) {
        warnings.push(`agents/openai.yaml: interface.short_description should be 25-64 characters (got ${short.length})`);
      }
      const prompt = meta.interface?.default_prompt;
      if (prompt !== undefined && !prompt.includes(`$${data.name}`)) {
        warnings.push(`agents/openai.yaml: interface.default_prompt should mention $${data.name}`);
      }
    } catch (error) {
      errors.push(`agents/openai.yaml: ${error.message}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings, data };
}
