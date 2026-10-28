#!/usr/bin/env node
// Fresh, reproducible documentation captures. Controlled examples, not agent A/B scores.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadPlaywright, browserOptions } from '../skills/glowup-ui/scripts/screenshot.mjs';
import { snapshot, check } from '../skills/glowup-ui/scripts/checkpoint.mjs';
import { improve } from './lib/refine-edits.mjs';
import { sh, startPreview } from './lib/proc.mjs';
import { passedVitestTests } from './lib/vitest-summary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { install: { type: 'boolean' }, check: { type: 'boolean' }, out: { type: 'string' } } });
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-showcase-'));
const out = values.check ? path.join(scratch, 'captures') : path.resolve(values.out || path.join(root, 'assets/examples'));
fs.mkdirSync(out, { recursive: true });
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const fileHash = file => digest(fs.readFileSync(file));
const sourceHash = dir => {
  const walk = base => fs.readdirSync(base, { withFileTypes: true }).filter(entry => !['node_modules', 'dist', '.glowup'].includes(entry.name)).flatMap(entry => {
    const file = path.join(base, entry.name);
    return entry.isDirectory() ? walk(file) : /\.(m?js|jsx|css|html|json)$/.test(entry.name) ? [[path.relative(dir, file).replaceAll(path.sep, '/'), fileHash(file)]] : [];
  });
  return digest(JSON.stringify(walk(dir).sort((a, b) => a[0].localeCompare(b[0]))));
};
const result = { schema: 1, generatedAt: new Date().toISOString(), kind: 'maintainer-directed examples and controlled fixture edits; not native activation or a model A/B benchmark',
  browser: {}, captures: [], checks: [], tests: {}, sources: {}, baselineFindings: [], pass: false };
const run = (cmd, args, cwd) => {
  const value = sh(cmd, args, { cwd });
  if (value.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed: ${value.signal || value.error || value.out}`);
  return value.out;
};
const testBuild = (cwd, label) => {
  const tests = run('npm', ['test'], cwd);
  result.tests[label] = passedVitestTests(tests);
  run('npm', ['run', 'build'], cwd);
};
let browser, createServer;
const servers = [];
try {
  const before = path.join(root, 'demo/before'), after = path.join(root, 'demo/after');
  for (const cwd of [before, after]) {
    if (values.install) run('npm', ['ci', '--no-audit', '--no-fund'], cwd);
    else if (!fs.existsSync(path.join(cwd, 'node_modules'))) throw new Error('Demo dependencies missing. Use --install explicitly to run their locked npm ci.');
  }
  const originalData = await import(pathToFileURL(path.join(before, 'src/data.js')));
  const transformedData = await import(pathToFileURL(path.join(after, 'src/data.js')));
  const data = module => ({ projects: module.projects, members: module.members, activity: module.activity });
  assert.deepEqual(data(originalData), data(transformedData), 'TRANSFORM must show identical fictional data');
  result.dataHash = digest(JSON.stringify(data(originalData)));
  result.sources.transform = { before: 'demo/before', after: 'demo/after', provenance: 'Bundled maintainer fixtures, freshly rendered from this clean repository. No native-agent quality comparison is claimed.' };
  testBuild(before, 'transformBefore'); testBuild(after, 'transformAfter');
  assert.equal(result.tests.transformBefore, 12); assert.equal(result.tests.transformAfter, 12);
  const refined = path.join(scratch, 'refined');
  fs.cpSync(after, refined, { recursive: true, filter: source => !['node_modules', 'dist', '.glowup'].includes(path.basename(source)) });
  fs.symlinkSync(path.join(after, 'node_modules'), path.join(refined, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const baseline = snapshot(refined);
  improve(refined, 'E');
  const preservation = check(refined, baseline);
  assert.equal(preservation.ok, true, 'REFINE source-preservation gate');
  for (const file of ['src/index.css', 'src/data.js', 'src/components/Icon.jsx']) assert.equal(fileHash(path.join(after, file)), fileHash(path.join(refined, file)), 'REFINE must retain ' + file);
  testBuild(refined, 'refineAfter'); assert.equal(result.tests.refineAfter, 12);
  result.sources.refine = { before: 'demo/after', operation: 'benchmarks/lib/refine-edits.mjs: improve(E)', provenance: 'Scripted, identity-preserving changes: logout touch target and a named, keyboard-scrollable chart.', preservationPassed: true };
  const create = path.join(root, 'demo/create-ledger');
  run(process.execPath, ['--test', 'model.test.mjs'], create);
  result.tests.createModel = 3;
  result.sources.create = { directory: 'demo/create-ledger', provenance: 'Maintainer-directed Codex implementation in this PR after explicit CREATE/finance-reference reading; not independent native activation or an A/B trial.', designDecisions: ['Dominant balance and trend', 'Subordinate monthly context', 'Aligned integer-cent amounts', 'Shared navigation and phone-adapted composition'] };
  result.sourceHashes = { create: sourceHash(create), transformBefore: sourceHash(before), transformAfter: sourceHash(after), refineEdit: fileHash(path.join(root, 'benchmarks/lib/refine-edits.mjs')) };
  if (values.check) {
    const committed = JSON.parse(fs.readFileSync(path.join(root, 'assets/examples/evidence.json')));
    assert.deepEqual(result.sourceHashes, committed.sourceHashes, 'Demo source changed: regenerate and inspect the published screenshots');
    for (const shot of committed.captures) {
      const file = path.join(root, 'assets/examples', shot.file), bytes = fs.readFileSync(file);
      assert.equal(digest(bytes), shot.sha256, 'Capture hash: ' + shot.file);
      assert.equal(bytes.readUInt32BE(16), shot.width); assert.equal(bytes.readUInt32BE(20), shot.height);
    }
  }

  const pw = await loadPlaywright(); if (!pw) throw new Error('Install benchmark Playwright explicitly first');
  browser = await pw.chromium.launch(browserOptions());
  result.browser = { name: 'Chromium', version: browser.version(), deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce' };
  createServer = spawn(process.execPath, [path.join(create, 'server.mjs')], { cwd: create, env: { ...process.env, PORT: '4590' }, stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:4590')).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  const beforeServer = await startPreview(before, 4591); servers.push(beforeServer);
  const afterServer = await startPreview(after, 4592); servers.push(afterServer);
  const refinedServer = await startPreview(refined, 4593); servers.push(refinedServer);
  const contextOptions = { deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce' };
  const functional = await browser.newContext({ ...contextOptions, viewport: { width: 390, height: 844 } });
  try {
    const page = await functional.newPage(); await page.goto('http://127.0.0.1:4590/#activity');
    await page.getByRole('heading', { name: 'Your activity', exact: true }).waitFor();
    await page.getByLabel('Search transactions').fill('coffee');
    assert.equal(await page.locator('tbody tr').count(), 1); result.checks.push('CREATE search filters rows');
    await page.getByLabel('Category', { exact: true }).first().selectOption('Income');
    await page.getByText('No transactions match.', { exact: false }).waitFor(); result.checks.push('CREATE category/search empty state');
    await page.getByRole('button', { name: 'Add transaction' }).click();
    const dialog = page.getByRole('dialog'); await dialog.waitFor();
    await dialog.getByLabel('Description').fill('Gallery test'); await dialog.getByLabel('Amount').fill('12.34');
    await dialog.getByRole('button', { name: 'Save transaction' }).click(); await dialog.waitFor({ state: 'hidden' });
    await page.getByLabel('Search transactions').fill('Gallery test');
    assert.equal(await page.locator('tbody tr').count(), 1); result.checks.push('CREATE validated transaction persists');
    await page.reload(); await page.getByLabel('Search transactions').fill('Gallery test');
    assert.equal(await page.locator('tbody tr').count(), 1); result.checks.push('CREATE reload retains local state');
    await page.getByRole('link', { name: 'Settings', exact: false }).click();
    await page.getByLabel('Display name').fill('Demo reader'); await page.getByRole('button', { name: 'Save preferences' }).click();
    await page.getByText('Preferences saved.').waitFor(); result.checks.push('CREATE preferences save');
    for (const route of ['overview', 'activity', 'settings']) {
      await page.goto('http://127.0.0.1:4590/#' + route); await page.locator('h1').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route + ' phone overflow');
    }
    result.checks.push('CREATE all three phone routes fit');
  } finally { await functional.close(); }

  for (const [device, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    for (const [label, url, ready] of [
      ['create', 'http://127.0.0.1:4590/#overview', 'Overview'],
      ['transform-before', beforeServer.url, 'Dashboard'],
      ['transform-after', afterServer.url, 'Dashboard'],
      ['refine-after', refinedServer.url, 'Dashboard'],
    ]) {
      const context = await browser.newContext({ ...contextOptions, viewport: { width, height } });
      try {
        const page = await context.newPage(); await page.goto(url); await page.getByRole('heading', { name: ready, exact: true }).waitFor();
        await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        if (label === 'transform-before' && overflow) result.baselineFindings.push({ device, kind: 'pre-existing document overflow', preservedInBeforeScreenshot: true });
        else assert.equal(overflow, false, label + ' ' + device + ' overflow');
        if (label !== 'create') await page.getByText('Harbor rebrand', { exact: true }).first().waitFor();
        if (label === 'refine-after') {
          const logout = page.getByRole('link', { name: 'Log out' }); const box = await logout.boundingBox();
          assert.ok(box.height >= 44, 'REFINE logout target');
          const region = page.locator('[aria-labelledby="line-title"][tabindex="0"]'); assert.equal(await region.count(), 1);
          result.checks.push('REFINE ' + device + ': 44px logout and named keyboard chart');
        }
        const file = `${label}-${device}.png`; await page.screenshot({ path: path.join(out, file), fullPage: false, animations: 'disabled' });
        result.captures.push({ file, width, height, route: label === 'create' ? '/#overview' : '/', sha256: fileHash(path.join(out, file)) });
      } finally { await context.close(); }
    }
  }
  result.checks.push('TRANSFORM identical data and 12 original tests on each version');
  result.checks.push('REFINE keeps CSS, logo, data and original tests unchanged');
  result.pass = true;
  fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify(result, null, 2) + '\n');
  if (values.check) { const summary = path.join(root, 'benchmarks/results/showcase'); fs.mkdirSync(summary, { recursive: true }); fs.writeFileSync(path.join(summary, 'result.json'), JSON.stringify(result, null, 2) + '\n'); }
  if (values.check) console.log(JSON.stringify({ pass: true, checks: result.checks.length, captures: result.captures.length, tests: result.tests }));
  else console.log('Fresh showcase and evidence: ' + out);
} catch (error) {
  result.error = error.message; fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify(result, null, 2) + '\n');
  if (values.check) { const summary = path.join(root, 'benchmarks/results/showcase'); fs.mkdirSync(summary, { recursive: true }); fs.writeFileSync(path.join(summary, 'result.json'), JSON.stringify(result, null, 2) + '\n'); }
  console.error(error.message); process.exitCode = 1;
} finally {
  await browser?.close();
  for (const server of servers) server.stop();
  if (createServer) try { process.kill(-createServer.pid); } catch {}
  fs.rmSync(scratch, { recursive: true, force: true });
}
