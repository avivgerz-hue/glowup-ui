import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install } from '../lib/install.mjs';

const CLI = fileURLToPath(new URL('../bin/glowup-ui.mjs', import.meta.url));
function sandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-first-use-'));
  const project = path.join(root, 'project'), home = path.join(root, 'home');
  fs.mkdirSync(project); fs.mkdirSync(home);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const run = (...args) => spawnSync(process.execPath, [CLI, ...args], {
    cwd: project, encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, '.codex'), CLAUDE_CONFIG_DIR: path.join(home, '.claude') },
  });
  return { root, project, home, run };
}

test('doctor help succeeds without inspecting a project or claiming activation', t => {
  const { run } = sandbox(t);
  const result = run('doctor', '--help', '--project', 'does-not-exist');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /doctor/);
});

test('doctor rejects a nonexistent project even with a healthy ancestor installation', t => {
  const { project, home, run } = sandbox(t);
  install({ agent: 'codex', scope: 'project', project, home });
  const result = run('doctor', '--project', path.join(project, 'typo'));
  assert.equal(result.status, 64, result.stdout);
  assert.match(result.stderr, /project directory.*does not exist/i);
  assert.doesNotMatch(result.stdout, /payload-readable/);
});

test('doctor text surfaces the missing reference and a safe recovery action', t => {
  const { project, home, run } = sandbox(t);
  const [installed] = install({ agent: 'codex', scope: 'project', project, home });
  fs.unlinkSync(path.join(installed.dir, 'references/design-quality.md'));
  const result = run('doctor');
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /references\/design-quality\.md/);
  assert.match(result.stdout, /review.*customizations/i);
  assert.match(result.stdout, /NOT TESTED/);
  const json = run('doctor', '--json');
  assert.equal(json.status, 1);
  const report = JSON.parse(json.stdout);
  assert.equal(report.status, 'review');
  assert.ok(report.installed.some(c => c.missingFiles?.includes('references/design-quality.md')));
  assert.match(report.activation, /NOT TESTED/);
});

test('doctor warns about identical candidate copies without asserting host precedence', t => {
  const { project, home, run } = sandbox(t);
  install({ agent: 'codex', scope: 'project', project, home });
  install({ agent: 'codex', scope: 'user', project, home });
  const result = run('doctor');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /multiple candidate locations.*codex/i);
  assert.match(result.stdout, /host.*discovery/i);
});

test('Codex-only installation gives relevant next steps without advertising a Claude installation', t => {
  const { run } = sandbox(t);
  const result = run('install', '--agent', 'codex', '--scope', 'project');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\$glowup-ui/);
  assert.doesNotMatch(result.stdout, /Claude Code.*\/glowup-ui/);
  assert.doesNotMatch(result.stdout, /OpenCode:/);
  assert.match(result.stdout, /installation.*not.*activation/i);
});


test('doctor rejects a file selected as the project root with an actionable error', t => {
  const { project, run } = sandbox(t);
  const file = path.join(project, 'README.txt');
  fs.writeFileSync(file, 'Not an application directory');
  const result = run('doctor', '--project', file);
  assert.equal(result.status, 64);
  assert.match(result.stderr, /not a directory.*Choose the application root/s);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
});
