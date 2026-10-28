// Read-only payload inspection. Never claims that discovery means activation.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SKILL_SOURCE, hashDir, listFiles } from "./install.mjs";
import { validateSkill } from "./validate.mjs";
import { parseSkillFile, parseYamlSubset } from "./frontmatter.mjs";

export function inspectPayload(dir, source = SKILL_SOURCE) {
  const file = path.join(dir, "SKILL.md");
  const entry = fs.lstatSync(dir, { throwIfNoEntry: false });
  if (!entry) return { dir, status: "absent" };
  if (!fs.existsSync(file)) return { dir, status: "broken", detail: "No readable SKILL.md (or broken link)" };
  try {
    const validation = validateSkill(dir), { data, body } = parseSkillFile(fs.readFileSync(file, "utf8"));
    const interfaceFile = path.join(dir, "agents/openai.yaml");
    const meta = fs.existsSync(interfaceFile) ? parseYamlSubset(fs.readFileSync(interfaceFile, "utf8")) : {};
    const files = listFiles(dir), expected = listFiles(source);
    return { dir, realPath: fs.realpathSync(dir), status: validation.ok ? "readable" : "invalid", name: data.name, version: data.metadata?.version || null,
      description: data.description, bodyBytes: Buffer.byteLength(body), hash: hashDir(dir), matchesCanonical: hashDir(dir) === hashDir(source),
      missingFiles: expected.filter((f) => !files.includes(f)), references: files.filter((f) => f.startsWith("references/")),
      invocation: { claudeManualDisabled: String(data["user-invocable"]) === "false", claudeAutomaticDisabled: String(data["disable-model-invocation"]) === "true", codexAutomaticDisabled: String(meta.policy?.allow_implicit_invocation) === "false" },
      errors: validation.errors, warnings: validation.warnings };
  } catch (error) { return { dir, status: "unreadable", detail: error.message }; }
}

export function doctor({ project = process.cwd(), home = os.homedir(), source = SKILL_SOURCE, codexHome = process.env.CODEX_HOME || path.join(home, ".codex"), claudeHome = process.env.CLAUDE_CONFIG_DIR || path.join(home, ".claude") } = {}) {
  const candidates = [
    { agent: "claude", scope: "user", dir: path.join(claudeHome, "skills/glowup-ui") },
    { agent: "codex", scope: "user", dir: path.join(home, ".agents/skills/glowup-ui") },
    { agent: "codex", scope: "legacy-user", dir: path.join(codexHome, "skills/glowup-ui") },
  ];
  for (let dir = path.resolve(project); ; dir = path.dirname(dir)) {
    candidates.push({ agent: "claude", scope: "project-or-ancestor", dir: path.join(dir, ".claude/skills/glowup-ui") }, { agent: "codex", scope: "project-or-ancestor", dir: path.join(dir, ".agents/skills/glowup-ui") });
    if (path.dirname(dir) === dir) break;
  }
  const installed = candidates.map((c) => ({ ...c, ...inspectPayload(c.dir, source) }));
  const present = installed.filter((c) => c.status !== "absent");
  return { canonical: inspectPayload(source, source), project: path.resolve(project), installed,
    conflicts: ["claude", "codex"].filter((agent) => new Set(present.filter((c) => c.agent === agent).map((c) => c.hash || c.status)).size > 1),
    status: present.some((c) => c.status !== "readable" || !c.matchesCanonical) ? "review" : present.length ? "payload-readable" : "not-installed",
    activation: "NOT TESTED. File presence, matching hashes, and a discovery listing do not prove that an agent loaded or followed the body.",
    limits: "Inspects default/configured user paths and project ancestors. Agent configuration may change roots, disable a skill, or load a plugin cache. Confirm actual discovery/activation in that agent; this does not inspect credential values or plugin caches." };
}
