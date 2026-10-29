#!/usr/bin/env node
// Optional behavior assertions. Run the SAME pre-edit expectations before/after.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { loadPlaywright, browserOptions, isLocalUrl } from './screenshot.mjs';

export function validateFlow(flow) {
  const text = x => typeof x === 'string' && x.length > 0 && x.length <= 10000;
  if (!flow || !Array.isArray(flow.steps) || !flow.steps.length || flow.steps.length > 100) throw new Error('Provide 1–100 steps');
  for (const step of flow.steps) {
    if (!step || typeof step !== 'object' || Array.isArray(step) || Object.keys(step).length !== 1) throw new Error('Each step needs exactly one action');
    const [action] = Object.keys(step), value = step[action];
    if (['click','expectURL'].includes(action) && text(value)) continue;
    if (['fill','expectText'].includes(action) && value && typeof value === 'object' && Object.keys(value).sort().join(',') === (action === 'fill' ? 'selector,value' : 'selector,text') && text(value.selector) && typeof value[action === 'fill' ? 'value' : 'text'] === 'string' && value[action === 'fill' ? 'value' : 'text'].length <= 10000) continue;
    throw new Error('Supported actions: click, fill {selector,value}, expectText {selector,text}, expectURL');
  }
  const last = Object.keys(flow.steps.at(-1))[0];
  if (!last.startsWith('expect')) throw new Error('End the flow with an explicit outcome assertion');
  return flow;
}

export async function verifyFlow(page, flow, { timeout = 3000, startURL } = {}) {
  validateFlow(flow);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60000) throw new Error('Timeout must be 1–60000 milliseconds');
  const result = { version: 1, status: 'passed', contractHash: createHash('sha256').update(JSON.stringify(flow)).digest('hex'), steps: [], assertions: 0, runtimeErrors: 0, consoleErrors: 0,
    limitation: 'Only the stated outcomes during this flow are checked. Not proof of complete preservation, activation or design quality.' };
  const onError = () => result.runtimeErrors++;
  const onConsole = message => { if (message.type() === 'error') result.consoleErrors++; };
  page.on('pageerror', onError); page.on('console', onConsole);
  try {
    if (startURL) {
      const response = await page.goto(startURL, { waitUntil: 'domcontentloaded', timeout });
      if (response && response.status() >= 400) throw new Error('Navigation failed');
    }
    for (const [index, step] of flow.steps.entries()) {
      const action = Object.keys(step)[0], value = step[action];
      try {
        if (action === 'click') await page.locator(value).click({ timeout });
        else if (action === 'fill') await page.locator(value.selector).fill(value.value, { timeout });
        else {
          const deadline = Date.now() + timeout;
          let matched = false;
          do {
            if (action === 'expectURL') {
              const u = new URL(page.url()); matched = u.pathname + u.search + u.hash === value;
            } else {
              const locator = page.locator(value.selector);
              matched = await locator.count() === 1 && await locator.isVisible() && (await locator.innerText({timeout:Math.max(1, deadline-Date.now())})).trim() === step.expectText.text;
            }
            if (matched) break;
            await delay(Math.min(30, Math.max(0, deadline - Date.now())));
          } while (Date.now() < deadline);
          if (!matched) throw new Error('Outcome did not match');
          result.assertions++;
        }
        result.steps.push({ index, action, status: 'passed' });
      } catch {
        // Playwright errors can echo fill values/DOM content; keep evidence private by default.
        result.steps.push({ index, action, status: 'failed', error: 'Action or expected outcome failed; inspect this step locally.' });
        result.status = 'failed'; break;
      }
    }
  } catch { result.status = 'failed'; result.navigation = 'failed'; }
  finally { page.off('pageerror', onError); page.off('console', onConsole); }
  if (result.runtimeErrors || result.consoleErrors) result.status = 'failed';
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let browser;
  try {
    const { values } = parseArgs({ options: { flow: {type:'string'}, 'base-url':{type:'string'}, path:{type:'string',default:'/'}, out:{type:'string'}, timeout:{type:'string',default:'3000'}, viewport:{type:'string',default:'390x844'} } });
    if (!values.flow || !values['base-url']) throw new Error('Usage: verify-flow.mjs --flow local.json --base-url http://localhost:4173 [--path /settings] [--out evidence.json]');
    const base = new URL(values['base-url']), url = new URL(values.path, base);
    if (!['http:','https:'].includes(base.protocol) || !isLocalUrl(base.href) || url.origin !== base.origin) throw new Error('Use a local HTTP(S) app and a same-origin path');
    const dims = /^(\d{2,5})x(\d{2,5})$/.exec(values.viewport);
    if (!dims) throw new Error('Viewport must be WIDTHxHEIGHT');
    if (values.out && fs.existsSync(values.out)) throw new Error('Evidence output already exists; choose a new file before running the flow');
    let data;
    try { data = JSON.parse(fs.readFileSync(values.flow,'utf8')); }
    catch { throw new Error('Cannot read valid flow JSON; inspect the local contract file'); }
    const flow = validateFlow(data);
    const pw = await loadPlaywright();
    if (!pw) throw new Error('Playwright unavailable; no dependency was installed. Use an available browser tool or report behavior unverified.');
    browser = await pw.chromium.launch(browserOptions());
    const page = await browser.newPage({ viewport:{width:Number(dims[1]),height:Number(dims[2])} });
    const result = await verifyFlow(page,flow,{timeout:Number(values.timeout),startURL:url.href});
    if (values.out) fs.writeFileSync(values.out,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
    console.log(JSON.stringify(result,null,2)); process.exitCode = result.status === 'passed' ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 64; }
  finally { await browser?.close(); }
}
