import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { terminalProgress } from '../lib/terminal.mjs';

function stream(isTTY = true) { return { isTTY, text: '', write(s) { this.text += s; } }; }
test('terminal frames advance on actual stages and always clear without timers', () => {
  const stderr = stream(), stdout = stream();
  const p = terminalProgress({stream: stderr, output: stdout, env: {TERM:'xterm'}});
  p.update('checking'); p.update('installing'); p.update('verifying'); p.finish();
  assert.match(stderr.text, /\[=   \].*checking/);
  assert.match(stderr.text, /\[==  \].*installing/);
  assert.match(stderr.text, /\[ ===\].*verifying/);
  assert.ok(stderr.text.endsWith('\r\x1b[2K'));
  const length = stderr.text.length; p.finish(); assert.equal(stderr.text.length,length);
  assert.equal(stdout.text,'');
});
test('automation, non-terminals, NO_COLOR and explicit opt-out receive no escape sequences', () => {
  for (const options of [{env:{CI:'true'}},{env:{NO_COLOR:''}},{env:{TERM:'dumb'}},{disabled:true},{output:stream(false)},{stream:stream(false)}]) {
    const stderr=options.stream || stream();
    const p=terminalProgress({stream:stderr,output:stream(),env:{},...options});
    p.update('installing');p.finish();assert.equal(stderr.text,'');
  }
});
test('one-command project installation reports exact version, verifies bytes and uninstalls', t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-terminal-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const cli=path.resolve('bin/glowup-ui.mjs');
  const args=[cli,'install','--agent','codex','--scope','project','--project',dir,'--no-animation'];
  const result=spawnSync(process.execPath,args,{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout+result.stderr,/\x1b/);
  const version=JSON.parse(fs.readFileSync('package.json')).version;
  assert.ok(result.stdout.includes(`Glowup UI ${version}`));
  const conflict=path.join(dir,'.agents/skills/glowup-ui/SKILL.md');fs.appendFileSync(conflict,'\ncustom');
  const again=spawnSync(process.execPath,args,{encoding:'utf8'});
  assert.equal(again.status,1);assert.match(again.stdout,/SKIPPED/);assert.match(fs.readFileSync(conflict,'utf8'),/custom/);
  const removed=spawnSync(process.execPath,[cli,'uninstall','--agent','codex','--scope','project','--project',dir],{encoding:'utf8'});
  assert.equal(removed.status,0,removed.stderr);assert.equal(fs.existsSync(conflict),false);
});
