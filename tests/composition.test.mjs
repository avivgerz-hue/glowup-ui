import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { hashDir } from '../lib/install.mjs';
import { composition, formatComposition } from '../skills/glowup-ui/scripts/composition.mjs';

test('domain recipes select different task compositions, not just different palettes', () => {
  const examples = {finance:'invoice ledger',commerce:'shop checkout',productivity:'helpdesk tickets',portfolio:'artist portfolio',booking:'spa appointments',chat:'chat conversation'};
  const layouts = new Set();
  for (const [profile, product] of Object.entries(examples)) {
    const plan = composition(product);
    assert.equal(plan.profile, profile);
    assert.ok(plan.acceptance.length >= 3);
    assert.ok(formatComposition(plan).length < 2100);
    layouts.add(plan.composition);
  }
  assert.equal(layouts.size, 6);
});
test('unknown and ambiguous domains fall back transparently; explicit choice wins', () => {
  assert.equal(composition('something new').profile, 'general');
  const ambiguous = composition('finance booking');
  assert.equal(ambiguous.profile, 'general'); assert.equal(ambiguous.matched.length, 2);
  assert.equal(composition('finance booking', {profile:'booking'}).selection, 'explicit');
  assert.throws(() => composition('foo', {profile:'constructor'}));
  assert.throws(() => composition('foo', {mode:'replace-everything'}));
});
test('polish and full redesign have distinct scope and both preserve the product', () => {
  assert.match(composition('spa', {mode:'polish'}).scope, /Keep identity and composition/);
  assert.match(composition('spa', {mode:'redesign'}).scope, /Preserve brand and all behavior/);
});
test('CLI produces machine-readable recipes and rejects invalid usage', () => {
  const script='skills/glowup-ui/scripts/composition.mjs';
  const r=spawnSync(process.execPath,[script,'--product','booking','--mode','redesign','--json'],{encoding:'utf8'});
  assert.equal(r.status,0); assert.equal(JSON.parse(r.stdout).profile,'booking');
  assert.equal(spawnSync(process.execPath,[script]).status,64);
});
test('previous-version comparisons keep tasks identical and record source identity', () => {
  const r=spawnSync(process.execPath,['benchmarks/activation/prepare-comparison.mjs','--previous','HEAD'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const root=r.stdout.trim();
  try {
    const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json'));
    assert.equal(manifest.cases.length,6);
    for(const kind of ['create','refine']) {
      const cases=manifest.cases.filter(c=>c.kind===kind);
      assert.equal(new Set(cases.map(c=>c.taskHash)).size,1);
      assert.ok(cases.find(c=>c.condition==='previous').previousCommit);
      assert.ok(cases.find(c=>c.condition==='previous').skillHash);
      const previous=cases.find(c=>c.condition==='previous');
      const expectedCommit=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
      assert.equal(previous.previousCommit,expectedCommit);
      const expectedBody=spawnSync('git',['show','HEAD:skills/glowup-ui/SKILL.md'],{encoding:'utf8'});
      assert.equal(expectedBody.status,0,expectedBody.stderr);
      assert.equal(fs.readFileSync(previous.project+'/.agents/skills/glowup-ui/SKILL.md','utf8'),expectedBody.stdout);
      assert.equal(previous.skillHash,hashDir(root+'/previous-payload'));
    }
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
