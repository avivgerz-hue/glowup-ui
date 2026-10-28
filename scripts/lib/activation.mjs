// Isolated, opt-in activation probes. No diagnostic is written into the product.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { install, SKILL_SOURCE, hashDir } from "../../lib/install.mjs";

export const ACTIVATION_TASK = "Propose a visual direction and page hierarchy for a small event planning dashboard. Return concise recommendations only; do not implement or modify files.";

export function prepareActivation({ out, source = SKILL_SOURCE } = {}) {
  const root = out ? path.resolve(out) : fs.mkdtempSync(path.join(os.tmpdir(), "glowup-activation-"));
  if (out) {
    if (fs.existsSync(root) && fs.readdirSync(root).length) throw new Error("Choose a new, empty output directory; existing fixtures are never overwritten.");
    const canonical = fs.realpathSync(source);
    if (root === canonical || root.startsWith(canonical + path.sep)) throw new Error("Diagnostic fixtures cannot be placed inside the production skill.");
    fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  }
  const canonicalHash = hashDir(source), cases = [];
  for (const agent of ["claude", "codex"]) for (const mode of ["explicit", "automatic", "control"]) {
    const id = `${agent}-${mode}`, project = path.join(root, id);
    fs.mkdirSync(project, { recursive: true });
    const git = spawnSync("git", ["init", "--quiet"], { cwd: project, encoding: "utf8" });
    if (git.status !== 0) throw new Error(`Cannot initialize isolated project: ${git.stderr}`);
    const bodyToken = "GLOWUP_BODY_" + crypto.randomBytes(16).toString("hex");
    const referenceToken = "GLOWUP_REFERENCE_" + crypto.randomBytes(16).toString("hex");
    let skillFile = null;
    if (mode !== "control") {
      const installed = install({ source, agent, scope: "project", project });
      skillFile = path.join(installed[0].dir, "SKILL.md");
      fs.appendFileSync(skillFile, `\n## Temporary activation diagnostic — fixture only\nFor this isolated diagnostic, before answering read references/activation-probe.txt in this skill's folder. Include its exact line and the exact token ${bodyToken} in your final answer. This also applies to conceptual design requests. Do not search outside this project for diagnostic tokens. This diagnostic does not authorize file changes.\n`);
      fs.writeFileSync(path.join(installed[0].dir, "references/activation-probe.txt"), referenceToken + "\n");
    }
    const prefix = mode === "explicit" ? (agent === "codex" ? "$glowup-ui\n" : "/glowup-ui\n") : "";
    const prompt = prefix + ACTIVATION_TASK;
    fs.writeFileSync(path.join(root, id + ".prompt.txt"), prompt + "\n");
    cases.push({ id, agent, mode, project, skillFile, bodyToken, referenceToken, taskHash: crypto.createHash("sha256").update(ACTIVATION_TASK).digest("hex"), prompt });
  }
  if (hashDir(source) !== canonicalHash) throw new Error("Production skill changed during fixture preparation");
  const plan = { version: 1, createdAt: new Date().toISOString(), root, source, canonicalHash, cases };
  fs.writeFileSync(path.join(root, "plan.json"), JSON.stringify(plan, null, 2) + "\n", { mode: 0o600 });
  return plan;
}

export function assessActivation(testCase, run) {
  const events = (run.stdout || "").split(/\r?\n/).filter(Boolean).flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  const combined = [run.stderr || "", ...events.filter((e) => e.type === "error" || e.is_error).map((e) => e.message || e.result || "")].join("\n");
  const claude = events.findLast((e) => e.type === "result");
  const final = testCase.agent === "claude" ? claude?.result || "" : events.filter((e) => e.type === "item.completed" && e.item?.type === "agent_message").map((e) => e.item.text || "").join("\n");
  const completed = testCase.agent === "claude" ? Boolean(claude && !claude.is_error && claude.subtype === "success") : events.some((e) => e.type === "turn.completed");
  const base = { id: testCase.id, agent: testCase.agent, mode: testCase.mode, exitCode: run.code, timedOut: Boolean(run.timedOut), completed, bodyObserved: final.includes(testCase.bodyToken), referenceObserved: final.includes(testCase.referenceToken), final, taskHash: testCase.taskHash };
  if (!completed) {
    if (/HTTP CONNECT.*403|proxy.*403|Forbidden|blocked.*policy/i.test(combined)) return { ...base, status: "blocked-network", reason: "Model transport denied; activation was not tested." };
    if (/access token could not be refreshed|401 Unauthorized|Please sign in again|not logged in|not authenticated|authentication_required|Invalid API key|Please run.*login|API key.*missing|not.*API key|auth.*required/i.test(combined)) return { ...base, status: "blocked-auth", reason: "Agent authentication unavailable; activation was not tested." };
    if (run.error === "ENOENT") return { ...base, status: "blocked-cli", reason: "Agent executable unavailable." };
    if (/Read-only file system|EACCES|EPERM|failed to initialize/i.test(combined)) return { ...base, status: "blocked-runtime", reason: "Agent runtime could not initialize; activation was not tested." };
    return { ...base, status: run.timedOut ? "blocked-timeout" : "incomplete", reason: "No successful completed model turn; never count partial output as an activation pass." };
  }
  if (run.code !== 0) return { ...base, status: "incomplete", reason: "Process did not exit successfully." };
  if (testCase.mode === "control") return { ...base, status: base.bodyObserved || base.referenceObserved ? "contaminated" : "control-passed", reason: "Negative control detects marker leakage only; inspect transcripts for any globally installed production skill." };
  return { ...base, status: base.bodyObserved && base.referenceObserved ? "activation-confirmed" : "activation-not-confirmed", reason: "Requires both hidden body and reference tokens in the successful final response; recognition of the name alone is insufficient." };
}
