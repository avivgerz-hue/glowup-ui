import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { installOne, install, targetDir, resolveTargets, hashDir, SKILL_SOURCE, AGENT_TARGETS } from "../lib/install.mjs";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "glowup-ui.mjs");

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-install-"));
  const home = path.join(root, "home");
  const project = path.join(root, "project");
  fs.mkdirSync(home);
  fs.mkdirSync(project);
  return { root, home, project };
}

test("target directories match the documented skill folders", () => {
  const home = "/h";
  const project = "/p";
  assert.equal(targetDir({ target: "claude", scope: "user", home }), path.join("/h", ".claude", "skills", "glowup-ui"));
  assert.equal(targetDir({ target: "claude", scope: "project", project }), path.join("/p", ".claude", "skills", "glowup-ui"));
  assert.equal(targetDir({ target: "agents", scope: "user", home }), path.join("/h", ".agents", "skills", "glowup-ui"));
  assert.equal(targetDir({ target: "agents", scope: "project", project }), path.join("/p", ".agents", "skills", "glowup-ui"));
  assert.equal(targetDir({ target: "codex-legacy", scope: "user", home, codexHome: "/c" }), path.join("/c", "skills", "glowup-ui"));
  assert.equal(targetDir({ target: "custom", dest: "/x/skills" }), path.join(path.resolve("/x/skills"), "glowup-ui"));
  assert.throws(() => targetDir({ target: "nope", scope: "user", home }));
  assert.throws(() => targetDir({ target: "agents", scope: "global", home }));
});

test("agent names resolve to the folders those agents read", () => {
  assert.deepEqual(resolveTargets("all"), ["agents", "claude"]);
  assert.deepEqual(resolveTargets("claude"), ["claude"]);
  for (const name of ["codex", "gemini", "copilot", "vscode", "opencode", "goose", "roo", "pi", "vibe", "mistral-vibe", "universal"]) {
    assert.deepEqual(resolveTargets(name), ["agents"], name);
  }
  assert.deepEqual(resolveTargets("claude, codex, gemini"), ["claude", "agents"], "deduplicated");
  assert.deepEqual(resolveTargets("Pi"), ["agents"], "case-insensitive");
  assert.throws(() => resolveTargets("cursor"), /--dest/);
  assert.throws(() => resolveTargets("not-an-agent"), /--dest/);
  for (const targets of Object.values(AGENT_TARGETS)) assert.ok(targets.length > 0);
});

test("fresh install copies the full skill", () => {
  const { home } = sandbox();
  const result = installOne({ target: "claude", scope: "user", home });
  assert.equal(result.action, "install");
  assert.equal(hashDir(result.dir), hashDir(SKILL_SOURCE));
  assert.ok(fs.existsSync(path.join(result.dir, "references", "design-quality.md")));
  assert.ok(fs.existsSync(path.join(result.dir, "agents", "openai.yaml")));
});

test("re-installing the same version is a no-op", () => {
  const { home } = sandbox();
  installOne({ target: "agents", scope: "user", home });
  const again = installOne({ target: "agents", scope: "user", home });
  assert.equal(again.action, "up-to-date");
});

test("an existing different skill is never overwritten without --force", () => {
  const { home } = sandbox();
  const dir = targetDir({ target: "claude", scope: "user", home });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), "user's own customized copy");
  const result = installOne({ target: "claude", scope: "user", home });
  assert.equal(result.action, "conflict");
  assert.equal(fs.readFileSync(path.join(dir, "SKILL.md"), "utf8"), "user's own customized copy");
});

test("--force backs up the existing copy outside the skills folder", () => {
  const { home } = sandbox();
  const dir = targetDir({ target: "claude", scope: "user", home });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SKILL.md"), "old");
  const result = installOne({ target: "claude", scope: "user", home, force: true });
  assert.equal(result.action, "replace");
  assert.equal(fs.readFileSync(path.join(result.backup, "SKILL.md"), "utf8"), "old");
  assert.ok(!result.backup.includes(`${path.sep}skills${path.sep}`), "backup must not live in a skills dir");
  assert.equal(hashDir(dir), hashDir(SKILL_SOURCE));
});

test("--dry-run writes nothing", () => {
  const { home, project } = sandbox();
  const results = install({ agent: "all", scope: "project", project, home, dryRun: true });
  assert.deepEqual(results.map((r) => r.action), ["install", "install"]);
  assert.deepEqual(fs.readdirSync(project), []);
  assert.deepEqual(fs.readdirSync(home), []);
});

test("--link creates a symlink and is idempotent", () => {
  const { home } = sandbox();
  const first = installOne({ target: "agents", scope: "user", home, link: true });
  assert.equal(first.action, "link");
  assert.ok(fs.lstatSync(first.dir).isSymbolicLink());
  assert.equal(installOne({ target: "agents", scope: "user", home, link: true }).action, "up-to-date");
});

test("--dest installs into any other agent's skills folder", () => {
  const { root, home } = sandbox();
  const dest = path.join(root, "some-agent", "skills");
  const [result] = install({ dest, home });
  assert.equal(result.action, "install");
  assert.equal(result.dir, path.join(dest, "glowup-ui"));
  assert.equal(hashDir(result.dir), hashDir(SKILL_SOURCE));
});

test("--codex-legacy swaps only the user-level .agents target for $CODEX_HOME/skills", () => {
  const { root, home } = sandbox();
  const codexHome = path.join(root, "codex-home");
  const results = install({ agent: "all", home, codexHome, codexLegacy: true, dryRun: true });
  assert.deepEqual(results.map((r) => r.target), ["codex-legacy", "claude"]);
  assert.equal(results[0].dir, path.join(codexHome, "skills", "glowup-ui"));
});

test("CLI: no --agent installs for all agents (project scope), then conflict exit code", () => {
  const { home, project } = sandbox();
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const ok = spawnSync(process.execPath, [CLI, "install", "--scope", "project", "--project", project], { env, encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(fs.existsSync(path.join(project, ".claude", "skills", "glowup-ui", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(project, ".agents", "skills", "glowup-ui", "SKILL.md")));
  assert.match(ok.stdout, /read by: Codex, Gemini CLI/);
  assert.match(ok.stdout, /Read .*SKILL\.md and follow it/);

  fs.appendFileSync(path.join(project, ".claude", "skills", "glowup-ui", "SKILL.md"), "\nlocal edit\n");
  const conflict = spawnSync(process.execPath, [CLI, "install", "--agent", "claude", "--scope", "project", "--project", project], { env, encoding: "utf8" });
  assert.equal(conflict.status, 1);
  assert.match(conflict.stdout, /SKIPPED/);
  assert.match(fs.readFileSync(path.join(project, ".claude", "skills", "glowup-ui", "SKILL.md"), "utf8"), /local edit/);
});

test("CLI: legacy --agent both still installs both folders", () => {
  const { home, project } = sandbox();
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const r = spawnSync(process.execPath, [CLI, "install", "--agent", "both", "--scope", "project", "--project", project], { env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(project, ".claude", "skills", "glowup-ui", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(project, ".agents", "skills", "glowup-ui", "SKILL.md")));
});

test("CLI: unknown agent is a usage error and writes nothing", () => {
  const { home } = sandbox();
  const r = spawnSync(process.execPath, [CLI, "install", "--agent", "not-an-agent"], { env: { ...process.env, HOME: home, USERPROFILE: home }, encoding: "utf8" });
  assert.equal(r.status, 64);
  assert.match(r.stderr, /Unknown agent/);
  assert.deepEqual(fs.readdirSync(home), []);
});

test("CLI: install --help prints usage; an unknown option is a usage error, not a crash", () => {
  const { home } = sandbox();
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const help = spawnSync(process.execPath, [CLI, "install", "--help"], { env, encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  const bad = spawnSync(process.execPath, [CLI, "install", "--not-an-option"], { env, encoding: "utf8" });
  assert.equal(bad.status, 64);
  assert.match(bad.stderr, /Unknown option '--not-an-option'/);
  assert.doesNotMatch(bad.stderr, /\n\s+at /, "no stack trace");
  assert.deepEqual(fs.readdirSync(home), []);
});

test("CLI: validate passes on the shipped skill", () => {
  const r = spawnSync(process.execPath, [CLI, "validate"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});

test('installer refuses overlapping source/destination, including symlinked parents', () => {
  const {root,home}=sandbox();const source=path.join(root,'skills','glowup-ui');fs.cpSync(SKILL_SOURCE,source,{recursive:true});const before=hashDir(source);
  for(const dest of [path.dirname(source),path.join(source,'nested')])assert.throws(()=>install({source,dest,home,force:true,link:true}),/overlap/);
  const alias=path.join(root,'alias');fs.symlinkSync(path.dirname(source),alias,process.platform==='win32'?'junction':'dir');
  assert.throws(()=>install({source,dest:alias,home,force:true,link:true}),/overlap/);
  assert.equal(hashDir(source),before);assert.ok(!fs.existsSync(path.join(home,'.glowup-ui')));
});

test('repeated forced replacement keeps distinct backups in the project', () => {
 const {home,project}=sandbox();const opts={agent:'codex',scope:'project',project,home};const [first]=install(opts);
 fs.appendFileSync(path.join(first.dir,'SKILL.md'),'\nfirst custom edit');const [a]=install({...opts,force:true});
 fs.appendFileSync(path.join(first.dir,'SKILL.md'),'\nsecond custom edit');const [b]=install({...opts,force:true});
 assert.notEqual(a.backup,b.backup);assert.ok(a.backup.startsWith(project+path.sep));assert.match(fs.readFileSync(path.join(a.backup,'SKILL.md'),'utf8'),/first custom edit/);assert.match(fs.readFileSync(path.join(b.backup,'SKILL.md'),'utf8'),/second custom edit/);
});

test('verified agent selections install and uninstall one shared payload per scope', async () => {
 const {uninstall}=await import('../lib/uninstall.mjs');
 for(const agent of ['claude','codex','opencode','gemini','copilot','vscode','goose','roo','pi','vibe'])for(const scope of ['project','user']){
  const {root,home,project}=sandbox();
  try{const options={agent,scope,home,project};const results=install(options);assert.equal(results.length,1,agent);assert.equal(hashDir(results[0].dir),hashDir(SKILL_SOURCE));
   const removed=uninstall(options);assert.equal(removed.length,1);assert.equal(hashDir(removed[0].backup),hashDir(SKILL_SOURCE));assert.ok(!fs.existsSync(results[0].dir));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
 assert.deepEqual(resolveTargets('codex,pi,vibe,opencode,copilot,gemini,goose,roo'),['agents']);
});

test('project installation refuses symlinked discovery directories outside the project',()=>{
 const {root,project,home}=sandbox();const outside=path.join(root,'outside');fs.mkdirSync(outside);
 fs.symlinkSync(outside,path.join(project,'.agents'),process.platform==='win32'?'junction':'dir');
 assert.throws(()=>install({agent:'codex',scope:'project',project,home}),/escapes/);assert.deepEqual(fs.readdirSync(outside),[]);
});


test('Claude custom config root agrees with doctor for installation and reversible removal', async () => {
  const { doctor } = await import('../lib/doctor.mjs');
  const { uninstall } = await import('../lib/uninstall.mjs');
  const { root, home, project } = sandbox();
  const claudeHome = path.join(root, 'custom-claude');
  try {
    const options = { agent: 'claude', scope: 'user', home, project, claudeHome };
    const [installed] = install(options);
    assert.equal(installed.dir, path.join(claudeHome, 'skills/glowup-ui'));
    assert.equal(doctor({ home, project, claudeHome }).status, 'payload-readable');
    assert.equal(install(options)[0].action, 'up-to-date');
    assert.equal(targetDir({ target: 'claude', scope: 'project', home, project, claudeHome }), path.join(project, '.claude/skills/glowup-ui'));
    const [removed] = uninstall(options);
    assert.equal(hashDir(removed.backup), hashDir(SKILL_SOURCE));
    assert.equal(doctor({ home, project, claudeHome }).status, 'not-installed');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Claude user target honors CLAUDE_CONFIG_DIR in a real CLI process', () => {
  const { root, home, project } = sandbox();
  const claudeHome = path.join(root, 'config-from-env');
  try {
    const result = spawnSync(process.execPath, [CLI, 'install', '--agent', 'claude', '--scope', 'user'], {
      cwd: project, env: { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_CONFIG_DIR: claudeHome }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(hashDir(path.join(claudeHome, 'skills/glowup-ui')), hashDir(SKILL_SOURCE));
    assert.equal(fs.existsSync(path.join(home, '.claude/skills/glowup-ui')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
