#!/usr/bin/env node
// Prepare isolated fixtures by default. --run explicitly opts into actual model calls.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import { prepareActivation, assessActivation } from "./lib/activation.mjs";

const { values } = parseArgs({ options: {
  out: { type: "string" }, run: { type: "boolean", default: false },
  agents: { type: "string", default: "claude,codex" },
  "claude-bin": { type: "string", default: "claude" }, "codex-bin": { type: "string", default: "codex" },
  "timeout-ms": { type: "string", default: "60000" },
} });
const agents = values.agents.split(",");
if (!agents.length || agents.some((a) => !["claude", "codex"].includes(a))) throw new Error("--agents must select claude,codex");
const timeout = Number(values["timeout-ms"]);
if (!Number.isFinite(timeout) || timeout < 1000 || timeout > 300000) throw new Error("--timeout-ms must be 1000..300000");
const plan = prepareActivation({ out: values.out });
const report = { createdAt: new Date().toISOString(), root: plan.root, canonicalHash: plan.canonicalHash, status: values.run ? "running" : "prepared-not-run", cases: plan.cases.filter((c) => agents.includes(c.agent)).map((c) => ({ id: c.id, status: "not-run" })) };
const save = () => fs.writeFileSync(path.join(plan.root, "result.json"), JSON.stringify(report, null, 2) + "\n");
save();
// Store commands as structured arguments. Never interpolate a task into shell code.
function command(c) {
  return c.agent === "codex" ? { bin: values["codex-bin"], args: ["exec", "--ephemeral", "--sandbox", "read-only", "--skip-git-repo-check", "--cd", c.project, "--json", "--color", "never", "-"] }
    : { bin: values["claude-bin"], args: ["--print", "--no-session-persistence", "--output-format", "stream-json", "--verbose", "--max-budget-usd", "1", "--permission-mode", "default", "--allowedTools", "Read", "Skill", "Bash(cat *)", "--", c.prompt] };
}
const instructions = plan.cases.map((c) => ({ id: c.id, cwd: c.project, ...command(c), stdin: c.agent === "codex" ? c.prompt : null }));
fs.writeFileSync(path.join(plan.root, "commands.json"), JSON.stringify(instructions, null, 2) + "\n");
fs.writeFileSync(path.join(plan.root, "MANUAL.md"), `# Activation probe\n\nNo tests have passed merely because these fixtures exist. Start a fresh agent session in each project's directory and paste its sibling .prompt.txt. Do not paste plan.json, nonces, or the fixture body into the conversation. Explicit cases name the skill; automatic cases do not. Capture the whole transcript and final answer. Compare final body/reference tokens to plan.json only after the run. Both must appear to confirm the diagnostic was followed. The control case has no project skill; inspect for globally installed skill reads and reject contaminated comparisons. A missing token after a successful run is activation-not-confirmed, not proof of a particular root cause. Authentication, runtime, network, and permission failures are blocked tests. Never count the agent saying it knows the skill as full-body activation.\n\nCLI argument arrays are in commands.json. Do not enable Claude safe-mode for skill cases: it disables skills. Preserve your normal authentication and approvals. Model calls can incur provider usage. Production SKILL.md was not changed.\n`);

async function run(c) {
  const spec = command(c);
  return new Promise((resolve) => {
    const child = spawn(spec.bin, spec.args, { cwd: c.project, env: process.env, detached: process.platform !== "win32", stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", error, timedOut = false, stopping = false;
    const stop = () => {
      if (stopping) return; stopping = true;
      try { if (process.platform === "win32") child.kill("SIGKILL"); else process.kill(-child.pid, "SIGKILL"); } catch { /* already exited */ }
    };
    const timer = setTimeout(() => { timedOut = true; stop(); }, timeout);
    const outFile = fs.createWriteStream(path.join(plan.root, c.id + ".jsonl"), { mode: 0o600 });
    const errFile = fs.createWriteStream(path.join(plan.root, c.id + ".stderr.txt"), { mode: 0o600 });
    child.stdout.on("data", (data) => { const text = data.toString(); stdout += text; outFile.write(text); if (/HTTP CONNECT.*403|Proxy connection failed.*403/.test(stdout)) stop(); });
    child.stderr.on("data", (data) => { const text = data.toString(); stderr += text; errFile.write(text); if (/HTTP CONNECT.*403|Proxy connection failed.*403/.test(stderr)) stop(); });
    child.stdin.on("error", () => {});
    child.on("error", (e) => { error = e.code; });
    child.on("close", (code) => { clearTimeout(timer); outFile.end(); errFile.end(); resolve({ code, stdout, stderr, error, timedOut }); });
    child.stdin.end(c.agent === "codex" ? c.prompt : "");
  });
}

if (values.run) {
  const blockedAgents = new Map();
  for (let i = 0; i < report.cases.length; i++) {
    const c = plan.cases.find((c) => c.id === report.cases[i].id);
    if (blockedAgents.has(c.agent)) {
      report.cases[i] = { id: c.id, agent: c.agent, mode: c.mode, status: 'not-run', reason: `Earlier ${c.agent} probe ${blockedAgents.get(c.agent)}; restore access before retrying.` };
      save(); continue;
    }
    const result = assessActivation(c, await run(c));
    report.cases[i] = result; save();
    if (['blocked-auth', 'blocked-network', 'blocked-cli', 'blocked-runtime'].includes(result.status)) blockedAgents.set(c.agent, result.status);
    console.log(`${c.id}: ${result.status}`);
  }
  report.status = report.cases.every((c) => ["activation-confirmed", "control-passed"].includes(c.status)) ? "confirmed" : report.cases.some((c) => c.status.startsWith("blocked")) ? "blocked" : "not-confirmed";
  save(); process.exitCode = report.status === "confirmed" ? 0 : report.status === "blocked" ? 2 : 1;
}
console.log(`Fixtures and evidence: ${plan.root}\nStatus: ${report.status}. Preparation/discovery is not activation.`);
