import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passedVitestTests } from '../benchmarks/lib/vitest-summary.mjs';

test('Vitest summary preserves exact fixture counts in plain and CI-colored output', () => {
  for (const n of [12, 14, 11]) {
    assert.equal(passedVitestTests(`Test Files  3 passed (3)\n      Tests  ${n} passed (${n})\n`), n);
    const colored = `\x1b[2m      Tests \x1b[22m \x1b[1m\x1b[32m${n} passed\x1b[39m\x1b[22m\x1b[90m (${n})\x1b[39m\n`;
    assert.equal(passedVitestTests(colored), n);
  }
});

test('missing, malformed and ambiguous summaries cannot supply functional evidence', () => {
  for (const output of ['', 'No test files found', 'Test Files 3 passed (3)', 'Tests unknown', 'Tests 11 passed\nTests 11 passed']) {
    assert.throws(() => passedVitestTests(output), /summary|summaries/);
  }
});

test('failed or skipped tests cannot masquerade as passing tests', () => {
  assert.throws(() => passedVitestTests('\x1b[31mTests 1 failed | 10 passed (11)\x1b[0m'), /failed tests/);
  assert.equal(passedVitestTests('Tests 10 passed | 1 skipped (11)'), 10);
  assert.equal(passedVitestTests('Tests 11 skipped (11)'), 0);
  // The quality gate still requires 12, 14 and 11 actual passes respectively.
});
