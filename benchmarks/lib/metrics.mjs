// Turn a `claude -p --output-format stream-json` transcript into comparable run metrics.
// Only values the transcript actually exposes are reported; nothing is estimated.

import fs from "node:fs";
import path from "node:path";

const BUILD_OR_TEST = /\b(npm (run )?(build|test)|vitest|vite build)\b/;
const FAILURE = /(\d+ failed|Tests\s+\d+ failed|error during build|Build failed|ERR!|FAIL\b|error TS\d+|Could not resolve|SyntaxError|Transform failed)/i;

function textOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => (typeof c === "string" ? c : c.text || "")).join("\n");
  return "";
}

export function parseTranscript(jsonlPath, workspace) {
  const lines = fs.readFileSync(jsonlPath, "utf8").split("\n").filter(Boolean);
  const tools = {};
  const bashByUseId = new Map();
  let calls = 0, result = null, firstEditCall = null, pngReads = 0, captures = 0, skillInvoked = false;
  let buildTestRuns = 0, buildTestFailures = 0;
  const skillReads = [];
  const pending = new Map();
  let invocationRequested = false;
  const evidence = [];
  let canonical = "";
  for (const scope of [".claude", ".agents"]) {
    try { canonical = fs.readFileSync(path.join(workspace, scope, "skills/glowup-ui/SKILL.md"), "utf8").trim(); break; } catch {}
  }
  const normalize = (value) => value.replace(/^\s*\d+→/gm, "").replace(/\r\n/g, "\n").trim();

  for (const line of lines) {
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.type === "assistant") {
      for (const c of m.message?.content || []) {
        if (c.type !== "tool_use") continue;
        calls++;
        tools[c.name] = (tools[c.name] || 0) + 1;
        const input = c.input || {};
        if (["Edit", "Write"].includes(c.name) && firstEditCall === null) firstEditCall = calls;
        pending.set(c.id, { name: c.name, input });
        if (c.name === "Skill" && /glowup/i.test(JSON.stringify(input))) invocationRequested = true;
        if (c.name === "Read") {
          const p = input.file_path || "";
          if (/\.png$/i.test(p)) pngReads++;
          if (p.includes("skills/glowup-ui/")) { skillReads.push(p.split("skills/glowup-ui/")[1]); }
        }
        if (c.name === "Bash") {
          const cmd = input.command || "";
          bashByUseId.set(c.id, cmd);
          if (/screenshot\.mjs/.test(cmd) && /--label/.test(cmd)) captures++;
          if (BUILD_OR_TEST.test(cmd)) buildTestRuns++;
          // A script request is activity, not proof that the skill body was loaded.
          // Agents often read skill references with cat/sed instead of the Read tool; count those too.
          if (/\b(cat|head|sed|less|more|bat)\b/.test(cmd)) for (const r of cmd.matchAll(/references\/([\w-]+\.md)/g)) { skillReads.push(`references/${r[1]}`); }
        }
      }
    } else if (m.type === "user") {
      const content = m.message?.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (c.type === "tool_result" && bashByUseId.has(c.tool_use_id)) {
            const cmd = bashByUseId.get(c.tool_use_id);
            if (BUILD_OR_TEST.test(cmd) && (c.is_error || FAILURE.test(textOf(c.content)))) buildTestFailures++;
          }
          if (c.type === "tool_result" && !c.is_error && canonical) {
            const request = pending.get(c.tool_use_id);
            const relevant = request && ((request.name === "Skill" && /glowup/i.test(JSON.stringify(request.input))) ||
              (request.name === "Read" && /skills\/glowup-ui\/SKILL\.md$/.test(request.input.file_path || "")) ||
              (request.name === "Bash" && /skills\/glowup-ui\/SKILL\.md/.test(request.input.command || "")));
            if (relevant && normalize(textOf(c.content)).includes(normalize(canonical))) {
              skillInvoked = true;
              evidence.push({ toolUseId: c.tool_use_id, method: request.name, kind: "full-body-delivered" });
            }
          }
        }
      }
    } else if (m.type === "result" && !result) {
      result = m;
    }
  }

  const u = result?.usage || {};
  let referenceChars = 0;
  const uniqueReads = [...new Set(skillReads)];
  for (const rel of uniqueReads) {
    try { referenceChars += fs.statSync(path.join(workspace, ".claude", "skills", "glowup-ui", rel)).size; } catch { /* file may be gone */ }
  }
  return {
    completed: Boolean(result) && result.subtype === "success" && !result.is_error,
    subtype: result?.subtype ?? "no-result",
    isError: result?.is_error ?? null,
    durationSec: result ? Math.round(result.duration_ms / 1000) : null,
    turns: result?.num_turns ?? null,
    costUsd: result?.total_cost_usd ?? null,
    tokens: {
      input: u.input_tokens ?? null,
      cacheCreate: u.cache_creation_input_tokens ?? null,
      cacheRead: u.cache_read_input_tokens ?? null,
      output: u.output_tokens ?? null,
    },
    toolCalls: calls,
    toolsByName: tools,
    firstEditAtCall: firstEditCall,
    screenshotCaptures: captures,
    screenshotsViewed: pngReads,
    buildTestRuns,
    buildTestFailures,
    skill: {
      invoked: skillInvoked,
      invocationRequested,
      activationEvidence: evidence,
      interpretation: "Conservative transcript evidence of full-body delivery; not proof of design influence. False means unconfirmed, not necessarily inactive.",
      referenceFilesRead: [],
      referenceFilesRequested: uniqueReads,
      referenceCharsRead: null,
      referenceCharsRequested: referenceChars,
      injectedSkillChars: null,
    },
    finalMessage: result?.result ?? null,
  };
}
