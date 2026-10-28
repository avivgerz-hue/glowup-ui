import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

test('fresh-history benchmark prepares identical tools and stops before agent evaluation', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-fresh-benchmark-'));
  const outputs = [];
  try {
    for (const condition of ['baseline', 'current']) {
      const label = 'fresh-' + condition + '-' + randomUUID();
      const output = path.resolve('benchmarks/results/A', label);
      outputs.push(output);
      const result = spawnSync(process.execPath,
        ['benchmarks/run.mjs', '--scenario', 'A', '--condition', condition, '--label', label, '--dry-run'],
        { env: { ...process.env, BENCH_WORK: work }, encoding: 'utf8', timeout: 20000 });
      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(JSON.parse(fs.readFileSync(path.join(output, 'meta.json'))).dryRun, true);
      assert.ok(!fs.existsSync(path.join(output, 'eval.json')), 'preparation must not claim evaluation');
      assert.ok(!fs.existsSync(path.join(output, 'run.jsonl')), 'no agent was invoked');
      const project = path.join(work, 'A-' + label);
      for (const file of ['screenshot.mjs', 'compare.mjs', 'discover.mjs', 'measure.mjs']) {
        assert.deepEqual(fs.readFileSync(path.join(project, 'tools', file)),
          fs.readFileSync(path.join('skills/glowup-ui/scripts', file)));
      }
      assert.equal(fs.existsSync(path.join(project, '.claude/skills/glowup-ui/SKILL.md')), condition === 'current');
    }
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
    for (const output of outputs) fs.rmSync(output, { recursive: true, force: true });
  }
});
