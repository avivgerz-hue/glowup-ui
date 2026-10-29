import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspect } from '../skills/glowup-ui/scripts/inspect.mjs';
import { snapshot, check } from '../skills/glowup-ui/scripts/checkpoint.mjs';
import { discover } from '../skills/glowup-ui/scripts/discover.mjs';
import { detectLook } from '../skills/glowup-ui/scripts/look.mjs';

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-inspection-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [name, value] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), typeof value === 'string' ? value : JSON.stringify(value));
  }
  return root;
}

test('inspection follows requested scope rather than prescribing polish for every app', t => {
  const root = fixture(t, { 'package.json': {} });
  assert.match(inspect(root).mode, /request/i);
  const redesign = inspect(root, { scope: 'redesign' });
  assert.match(redesign.mode, /TRANSFORM/);
  assert.match(redesign.next.join(' '), /priorities/);
  assert.doesNotMatch(redesign.next.join(' '), /at most three meaningful fixes/);
  assert.match(inspect(root, { scope: 'refine' }).mode, /REFINE/);
  assert.throws(() => inspect(root, { scope: 'create' }), /scope/i);
});

test('discovery ignores installed agents and recoverable skill backups', t => {
  const root = fixture(t, {
    'package.json': { dependencies: { react: '19' } },
    'src/App.jsx': '<main>Application</main>',
    '.agents/skills/glowup-ui/fake.jsx': '<Route path="/skill-route" />',
    '.claude/skills/glowup-ui/fake.css': ':root { --brand: red; }',
    '.opencode/skills/glowup-ui/fake.jsx': '<Route path="/opencode-route" />',
    '.glowup-ui/backups/old/fake.jsx': '<Route path="/backup-route" />',
    '.glowup-ui/backups/old/fake.css': ':root { --brand: #123456; --surface: #123456; }',
  });
  const result = discover(root);
  assert.equal(result.fileCount, 2);
  assert.deepEqual(result.routes.map(r => r.path), ['/']);
  assert.deepEqual(result.styling.tokenFiles, []);
  assert.equal(detectLook(root).brand, null);
});

test('inspection resolves configured shared aliases and directory indexes to actual files', t => {
  const root = fixture(t, {
    'package.json': { dependencies: { react: '19' } },
    'tsconfig.json': { compilerOptions: { baseUrl: '.', paths: { '@/*': ['src/*'] } } },
    'src/App.jsx': 'import { Shell } from "@/components/Shell";',
    'src/components/Shell/index.tsx': 'export const Shell = () => null;',
  });
  assert.ok(inspect(root).readFirst.includes('src/components/Shell/index.tsx'));
});

test('look inspection skips external and broken source symlinks', t => {
  const outside = fixture(t, { 'private.css': ':root { --brand: #123456; --surface: #123456; }' });
  const root = fixture(t, { 'package.json': {}, 'src/App.jsx': '<main>Application</main>' });
  fs.symlinkSync(path.join(outside, 'private.css'), path.join(root, 'linked.css'));
  fs.symlinkSync(path.join(outside, 'missing.css'), path.join(root, 'broken.css'));
  assert.equal(detectLook(root).brand, null);
  assert.equal(detectLook(root).files, 1);
});

test('inspection CLI preserves explicit scope and rejects invalid scope without a stack trace', t => {
  const root = fixture(t, { 'package.json': {} });
  const cli = path.resolve('skills/glowup-ui/scripts/inspect.mjs');
  const good = spawnSync(process.execPath, [cli, root, '--scope', 'redesign'], { encoding: 'utf8' });
  assert.equal(good.status, 0, good.stderr);
  assert.match(JSON.parse(good.stdout).mode, /TRANSFORM/);
  const bad = spawnSync(process.execPath, [cli, root, '--scope', 'unknown'], { encoding: 'utf8' });
  assert.equal(bad.status, 64);
  assert.doesNotMatch(bad.stderr, /\n\s+at /);
});

test('inspection never recommends aliases outside the app or follows directory links outside it', t => {
  const outside = fixture(t, { 'Shell/index.tsx': 'export const Shell = () => null;' });
  const root = fixture(t, {
    'package.json': { dependencies: { react: '19' } },
    'jsconfig.json': { compilerOptions: { paths: { '@/*': [outside + '/*'] } } },
    'src/App.jsx': 'import { Shell } from "@/Shell"; import { Other } from "./linked/Shell";',
  });
  fs.symlinkSync(outside, path.join(root, 'src/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual(inspect(root).readFirst, ['src/App.jsx']);
});


test('preservation checkpoints ignore skill installation and backup files between checks', t => {
  const root = fixture(t, { 'package.json': {}, 'src/App.jsx': '<main>Keep content</main>' });
  const before = snapshot(root);
  for (const folder of ['.agents', '.claude', '.opencode', '.glowup-ui']) {
    const file = path.join(root, folder, 'backup', 'package.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{"name":"skill-not-app"}');
  }
  assert.deepEqual(Object.keys(snapshot(root).records), Object.keys(before.records));
  assert.equal(check(root, before).ok, true);
});
