// Render original SVG artwork into GitHub's social-preview and plugin icon formats.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadPlaywright, browserOptions } from '../skills/glowup-ui/scripts/screenshot.mjs';
import { createServer } from 'node:http';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pw = await loadPlaywright(); if (!pw) throw new Error('Install benchmark Playwright explicitly first');
const browser = await pw.chromium.launch(browserOptions());
const server = createServer((req, res) => {
  const name = new Map([['/social.svg', 'social-preview.svg'], ['/mark.svg', 'mark.svg']]).get(req.url);
  if (!name) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(fs.readFileSync(path.join(root, 'assets/brand', name)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const social = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
  await social.goto(base + '/social.svg');
  await social.screenshot({ path: path.join(root, 'assets/brand/social-preview.png'), omitBackground: false });
  const icon = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  const mark = fs.readFileSync(path.join(root, 'assets/brand/mark.svg'), 'utf8');
  await icon.setContent(`<style>body{margin:0;background:#f5f4e8;display:grid;place-content:center;width:512px;height:512px}svg{width:384px;height:384px}</style>${mark}`);
  await icon.screenshot({ path: path.join(root, '.claude-plugin/icon.png') });
  const small = await browser.newPage({ viewport: { width: 320, height: 160 }, deviceScaleFactor: 1 });
  await small.setContent(`<style>body{margin:0}img{display:block;width:320px;height:160px}</style><img src="${base}/social.svg">`);
  await small.locator('img').evaluate(img => img.decode());
  const thumb = path.join(os.tmpdir(), 'glowup-brand-small.png'); await small.screenshot({ path: thumb });
  console.log('Original artwork rendered; small preview: ' + thumb);
} finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
