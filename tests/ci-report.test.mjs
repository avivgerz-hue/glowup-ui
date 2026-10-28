import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectBrowserResults, formatAnnotation } from '../benchmarks/ci-report.mjs';

test('CI diagnostics retain failed quality evidence and distinguish missing phases', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-ci-report-'));
  try {
    fs.mkdirSync(path.join(dir, 'quality-smoke'));
    fs.writeFileSync(path.join(dir, 'quality-smoke/result.json'), JSON.stringify({
      pass: false, rawTranscript: 'not part of the diagnostic contract', apps: [{
        id: 'E', pass: false, beforeTests: 0, afterTests: 12,
        preservation: { ok: true }, review: { regressions: [], blockers: [], coverage: [] },
      }],
    }));
    const entries = collectBrowserResults(dir);
    assert.equal(entries[0].status, 'not-run');
    assert.equal(entries[3].status, 'failed');
    assert.equal(entries[3].failedApps[0].beforeTests, 0);
    assert.deepEqual(entries[3].failedApps[0].regressions, []);
    assert.ok(!JSON.stringify(entries).includes('rawTranscript'));
    assert.match(formatAnnotation(entries[3]), /^::error /);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('annotation payload escapes workflow command control sequences', () => {
  const annotation = formatAnnotation({ phase: 'quality-smoke', status: 'failed', error: '%0A::notice injected\nsecond line' });
  assert.ok(annotation.includes('%250A'));
  assert.equal(annotation.split('\n').length, 1);
});
