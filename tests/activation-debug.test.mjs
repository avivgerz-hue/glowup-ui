import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareActivation, assessActivation } from '../scripts/lib/activation.mjs';
import { doctor } from '../lib/doctor.mjs';
import { install, hashDir, SKILL_SOURCE } from '../lib/install.mjs';
import { parseTranscript } from '../benchmarks/lib/metrics.mjs';

function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-debug-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const probe = { id: 'test', agent: 'claude', mode: 'explicit', bodyToken: 'BODY_secret', referenceToken: 'REF_secret' };
const result = (text, extra = {}) => JSON.stringify({ type: 'result', subtype: 'success', result: text, ...extra });
test('activation requires successful final response with both hidden tokens', () => {
  assert.equal(assessActivation(probe, { code: 0, stdout: result('BODY_secret REF_secret') }).status, 'activation-confirmed');
  assert.equal(assessActivation(probe, { code: 0, stdout: result('I know glowup-ui BODY_secret') }).status, 'activation-not-confirmed');
  assert.equal(assessActivation(probe, { code: 1, stdout: result('BODY_secret REF_secret') }).status, 'incomplete');
  assert.notEqual(assessActivation(probe, { code: 0, stdout: result('BODY_secret REF_secret', { is_error: true }) }).status, 'activation-confirmed');
});
test('auth, proxy and runtime errors cannot count as activation failures or passes', () => {
  for (const [stderr, status] of [['Not logged in', 'blocked-auth'], ['Your access token could not be refreshed', 'blocked-auth'], ['HTTP CONNECT 403', 'blocked-network'], ['Read-only file system', 'blocked-runtime']]) {
    assert.equal(assessActivation(probe, { code: 1, stderr }).status, status);
  }
});
test('Codex needs a completed turn, not a partial marker message', () => {
  const stdout = JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'BODY_secret REF_secret' } });
  assert.equal(assessActivation({ ...probe, agent: 'codex' }, { code: 0, stdout }).status, 'incomplete');
  assert.equal(assessActivation({ ...probe, agent: 'codex' }, { code: 0, stdout: stdout + '\n' + JSON.stringify({ type: 'turn.completed' }) }).status, 'activation-confirmed');
});
test('preparation isolates diagnostics and keeps task and production payload unchanged', (t) => {
  const out = path.join(scratch(t), 'matrix'), before = hashDir(SKILL_SOURCE);
  const plan = prepareActivation({ out });
  assert.equal(plan.cases.length, 6);
  assert.equal(new Set(plan.cases.map(c => c.taskHash)).size, 1);
  for (const c of plan.cases) {
    assert.ok(!c.prompt.includes(c.bodyToken));
    assert.ok(!c.prompt.includes(c.referenceToken));
    if (c.skillFile) {
      const skill = fs.readFileSync(c.skillFile, 'utf8');
      assert.ok(skill.includes(c.bodyToken));
      assert.ok(!skill.split('---')[1].includes(c.bodyToken));
    } else assert.ok(!fs.existsSync(path.join(c.project, '.agents/skills/glowup-ui')));
  }
  assert.equal(hashDir(SKILL_SOURCE), before);
  assert.throws(() => prepareActivation({ out }), /empty output/);
});
test('doctor distinguishes absent, matching and stale copies without claiming activation', (t) => {
  const root = scratch(t), project = path.join(root, 'project'), home = path.join(root, 'home');
  fs.mkdirSync(project); fs.mkdirSync(home);
  const options = { project, home, codexHome: path.join(home, '.codex'), claudeHome: path.join(home, '.claude') };
  assert.equal(doctor(options).status, 'not-installed');
  install({ agent: 'all', scope: 'project', project, home });
  assert.equal(doctor(options).status, 'payload-readable');
  fs.appendFileSync(path.join(project, '.agents/skills/glowup-ui/SKILL.md'), '\nStale copy\n');
  assert.equal(doctor(options).status, 'review');
  assert.match(doctor(options).activation, /NOT TESTED/);
});
function metrics(t, messages, withSource = true) {
  const root = scratch(t);
  if (withSource) install({ agent: 'claude', scope: 'project', project: root });
  const file = path.join(root, 'run.jsonl');
  fs.writeFileSync(file, messages.map(JSON.stringify).join('\n'));
  return parseTranscript(file, root).skill;
}
const request = { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'read1', name: 'Read', input: { file_path: '/project/.claude/skills/glowup-ui/SKILL.md' } }] } };
const response = (content, is_error = false) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'read1', content, is_error }] } });
test('long task mentioning Glowup is never invocation evidence', (t) => {
  assert.equal(metrics(t, [{ type: 'user', message: { content: 'glowup-ui ' + 'task '.repeat(1000) } }]).invoked, false);
});
test('read request, failed read and partial body are insufficient evidence', (t) => {
  const body = fs.readFileSync(path.join(SKILL_SOURCE, 'SKILL.md'), 'utf8');
  for (const messages of [[request], [request, response(body, true)], [request, response(body.slice(0, 100))]]) assert.equal(metrics(t, messages).invoked, false);
});
test('successful complete body delivery supplies conservative evidence', (t) => {
  const body = fs.readFileSync(path.join(SKILL_SOURCE, 'SKILL.md'), 'utf8');
  const m = metrics(t, [request, response(body)]);
  assert.equal(m.invoked, true);
  assert.equal(m.activationEvidence[0].kind, 'full-body-delivered');
  assert.equal(metrics(t, [request, response(body)], false).invoked, false);
});
test('denied Skill invocation counts as requested only', (t) => {
  const m = metrics(t, [{ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Skill', id: 's1', input: { skill: 'glowup-ui' } }] } }, { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's1', is_error: true, content: 'denied' }] } }]);
  assert.equal(m.invocationRequested, true); assert.equal(m.invoked, false);
});
test('comparison preparation creates identical tasks and existing apps without running agents', async (t) => {
  const { spawnSync } = await import('node:child_process');
  const run = spawnSync(process.execPath, ['benchmarks/activation/prepare-comparison.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const root = run.stdout.trim();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  assert.equal(manifest.status, 'prepared-not-run');
  for (const kind of ['create', 'refine']) {
    const cases = manifest.cases.filter(c => c.kind === kind);
    assert.equal(cases.length, 2);
    assert.equal(cases[0].taskHash, cases[1].taskHash);
    assert.equal(fs.readFileSync(path.join(root, `${kind}-without.task.txt`), 'utf8'), fs.readFileSync(path.join(root, `${kind}-with.task.txt`), 'utf8'));
    assert.ok(!fs.existsSync(path.join(root, `${kind}-without/.claude/skills/glowup-ui`)));
    assert.ok(fs.existsSync(path.join(root, `${kind}-with/.claude/skills/glowup-ui/SKILL.md`)));
    assert.ok(cases.every(c => c.status === 'not-run' && c.designScore === null && !c.screenshots.length));
  }
  assert.equal(hashDir(path.join(root, 'refine-with/src')), hashDir(path.join(root, 'refine-without/src')));
  assert.equal(hashDir(path.join(root, 'refine-with/src')), hashDir('benchmarks/fixtures/booking-before/src'));
});
