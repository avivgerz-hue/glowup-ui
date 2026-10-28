import { stripVTControlCharacters } from 'node:util';

// Vitest colors its summary on GitHub Actions even when stdout is piped.
// Missing evidence must fail explicitly, never silently become zero passes.
export function passedVitestTests(output) {
  const summaries = [...stripVTControlCharacters(output).matchAll(/^\s*Tests\s+([^\r\n]+)$/gm)];
  if (summaries.length !== 1) throw new Error('Expected one Vitest test summary; functional-test evidence is missing or ambiguous');
  const counts = new Map([...summaries[0][1].matchAll(/(\d+)\s+(passed|failed|skipped|todo)/g)].map(m => [m[2], Number(m[1])]));
  if (!counts.size) throw new Error('Unrecognized Vitest test summary; functional-test evidence cannot be verified');
  if (counts.get('failed')) throw new Error(`Vitest reported ${counts.get('failed')} failed tests`);
  return counts.get('passed') ?? 0;
}
