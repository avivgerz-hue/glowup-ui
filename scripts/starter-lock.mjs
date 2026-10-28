#!/usr/bin/env node
// Audit the complete starter graph; --update explicitly refreshes its maintained template.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { DIRECTIONS } from '../skills/glowup-ui/scripts/directions.mjs';
import { designSystem } from '../skills/glowup-ui/scripts/direction.mjs';

const { values } = parseArgs({ options: { update: { type: 'boolean', default: false } } });
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templates = path.join(root, 'skills/glowup-ui/assets/starter/project');
const destination = path.join(templates, 'package-lock.json.tpl');
const manifest = JSON.parse(fs.readFileSync(path.join(templates, 'package.json.tpl')));
manifest.name = 'glowup-starter-lock';
const fonts = [...new Set(DIRECTIONS.flatMap(direction => designSystem(direction).packages))];
for (const name of fonts) manifest.dependencies[name] = '^5.0.0';
const lock = JSON.parse(fs.readFileSync(destination));
if (!values.update) {
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies, 'Regenerate the starter lock after changing dependencies/fonts');
  assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies, 'Regenerate the starter lock after changing test tools');
}
lock.name = lock.packages[''].name = manifest.name;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-lock-audit-'));
const npm = args => {
  const result = spawnSync('npm', args, { cwd: temp, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error || result.status !== 0) throw new Error(`npm ${args[0]} failed; the starter template was not replaced`);
};
try {
  fs.writeFileSync(path.join(temp, 'package.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(temp, 'package-lock.json'), JSON.stringify(lock, null, 2));
  if (values.update) npm(['update', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund']);
  npm(['audit', '--package-lock-only', '--audit-level=low']);
  const result = JSON.parse(fs.readFileSync(path.join(temp, 'package-lock.json')));
  for (const name of fonts) {
    const entry = result.packages['node_modules/' + name];
    assert.ok(entry?.integrity && !entry.dependencies, 'Font entries must be resolved and dependency-free');
  }
  if (values.update) {
    result.name = result.packages[''].name = '__NAME__';
    fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
