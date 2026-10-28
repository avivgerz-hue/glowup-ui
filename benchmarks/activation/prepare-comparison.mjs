#!/usr/bin/env node
// Preparation only. No agents, package installs, screenshots or claims of results.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { install, hashDir, SKILL_SOURCE } from '../../lib/install.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const { values } = parseArgs({ options: { previous: { type: 'string' } } });
let previous;
if (values.previous) {
  const r = spawnSync('git', ['rev-parse', '--verify', '--end-of-options', values.previous + '^{commit}'], { cwd: repo, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('Invalid previous commit');
  previous = r.stdout.trim();
}
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-comparison-'));
const manifest = { status: 'prepared-not-run', sourceHash: hashDir(SKILL_SOURCE), cases: [] };
for (const kind of ['create', 'refine']) {
  const task = fs.readFileSync(path.join(here, `${kind}-task.txt`), 'utf8');
  const taskHash = crypto.createHash('sha256').update(task).digest('hex');
  for (const condition of ['without', 'with', ...(previous ? ['previous'] : [])]) {
    const project = path.join(root, `${kind}-${condition}`);
    fs.mkdirSync(project);
    if (kind === 'refine') fs.cpSync(path.resolve(here, '../fixtures/booking-before'), project, { recursive: true });
    const git = spawnSync('git', ['init', '--quiet'], { cwd: project });
    if (git.status !== 0) throw new Error('Could not initialize comparison project');
    if (condition === 'with') install({ agent: 'all', scope: 'project', project });
    if (condition === 'previous') {
      const listing = spawnSync('git', ['ls-tree', '-r', '--name-only', previous, '--', 'skills/glowup-ui'], { cwd: repo, encoding: 'utf8' });
      const files = listing.stdout.trim().split('\n').filter(Boolean);
      if (listing.status !== 0 || !files.includes('skills/glowup-ui/SKILL.md')) throw new Error('Previous commit has no skill');
      const source = path.join(root, 'previous-payload');
      for (const file of files) {
        const result = spawnSync('git', ['show', `${previous}:${file}`], { cwd: repo, maxBuffer: 8 * 1024 * 1024 });
        if (result.status !== 0) throw new Error('Could not extract previous payload');
        const dest = path.join(source, file.slice('skills/glowup-ui/'.length));
        fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, result.stdout);
      }
      install({ agent: 'all', scope: 'project', project, source });
    }
    fs.writeFileSync(path.join(root, `${kind}-${condition}.task.txt`), task);
    manifest.cases.push({ kind, condition, project, taskHash, skillHash: condition === 'without' ? null : hashDir(path.join(project, '.agents/skills/glowup-ui')), previousCommit: condition === 'previous' ? previous : null, status: 'not-run', activation: 'not-tested', screenshots: [], designScore: null });
  }
}
fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(root);
