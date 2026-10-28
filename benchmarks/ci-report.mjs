// Publish bounded fixture diagnostics as Actions annotations; never alter the test verdict.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const phases = ['review-browser', 'create-smoke', 'refine-journeys', 'quality-smoke'];
export function collectBrowserResults(base) {
  return phases.map(phase => {
    const file = path.join(base, phase, 'result.json');
    if (!fs.existsSync(file)) return { phase, status: 'not-run' };
    let result;
    try { result = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return { phase, status: 'invalid-result', error: 'Result JSON cannot be read' }; }
    const entry = { phase, status: result.pass === true ? 'passed' : 'failed' };
    if (result.error) entry.error = result.error;
    if (Array.isArray(result.assertions)) entry.completedAssertions = result.assertions.length;
    if (Array.isArray(result.kits)) entry.kits = result.kits;
    if (Array.isArray(result.flows)) entry.failedFlows = result.flows.filter(flow => !flow.pass);
    if (Array.isArray(result.apps)) entry.failedApps = result.apps.filter(app => !app.pass).map(app => ({
      id: app.id, beforeTests: app.beforeTests, afterTests: app.afterTests,
      beforeCaptures: app.beforeCaptures, afterCaptures: app.afterCaptures,
      preservationOK: app.preservation?.ok, regressions: app.review?.regressions,
      blockers: app.review?.blockers, coverage: app.review?.coverage,
    }));
    return entry;
  });
}

export function formatAnnotation(entry) {
  const escape = value => value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  const text = JSON.stringify(entry);
  const bounded = text.length > 59000 ? text.slice(0, 59000) + ' [truncated; full result in browser-contract-evidence artifact]' : text;
  const level = ['failed', 'invalid-result'].includes(entry.status) ? 'error' : 'notice';
  return `::${level} title=Browser contracts (${entry.phase})::${escape(bounded)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = path.join(path.dirname(fileURLToPath(import.meta.url)), 'results');
  for (const entry of collectBrowserResults(base)) console.log(formatAnnotation(entry));
}
