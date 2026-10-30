import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {designBrief} from '../skills/glowup-ui/scripts/design-brief.mjs';
import {prepareDesignEvaluation} from '../benchmarks/prepare-design-evaluation.mjs';
import {pairFromManifest,agentCommand} from '../benchmarks/lib/pair.mjs';

test('major work gets distinct structural alternatives, not palette permutations; polish skips exploration',()=>{
 const finance=designBrief('daily money decisions',{profile:'finance',depth:'reframe'});
 const booking=designBrief('spa service reservations',{profile:'booking',depth:'recompose'});
 for(const b of [finance,booking]){
  assert.equal(b.options.length,3);
  assert.equal(new Set(b.options.map(o=>o.layout)).size,3);
  for(const o of b.options){assert.ok(o.phone&&o.type&&o.tradeoff);}
 }
 assert.notDeepEqual(finance.options,booking.options);
 assert.equal(designBrief('ledger',{mode:'refine'}).options.length,0);
 assert.equal(designBrief('ledger',{depth:'polish'}).options.length,0);
 assert.throws(()=>designBrief('ledger',{mode:'refine',depth:'reframe'}));
 assert.throws(()=>designBrief(''));assert.throws(()=>designBrief('x',{profile:'constructor'}));
 assert.ok(designBrief('unclassified interface').selection.includes('fallback'));
});

test('design CLI is read-only and rejects invalid depths',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-direction-cli-'));
 try{
  const cli=path.resolve('skills/glowup-ui/scripts/design-brief.mjs');
  const r=spawnSync(process.execPath,[cli,'--product','finance','--depth','reframe','--json'],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).depth,'reframe');assert.deepEqual(fs.readdirSync(root),[]);
  assert.equal(spawnSync(process.execPath,[cli,'--product','x','--depth','everything'],{cwd:root}).status,64);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('exact-commit finance/booking matrix preserves task/app equality and detects contamination/tampering',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-design-eval-')),out=path.join(root,'prepared');
 const commit=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
 try{
  assert.throws(()=>prepareDesignEvaluation({baseline:'main',candidate:commit,out}),/exact/);
  const m=prepareDesignEvaluation({baseline:commit,candidate:commit,out});
  assert.equal(m.cases.length,6);assert.equal(m.quality,'unverified');
  const file=path.join(out,'manifest.json');
  for(const kind of ['finance','booking']){
   const cells=m.cases.filter(c=>c.kind===kind);
   assert.equal(new Set(cells.map(c=>c.taskHash)).size,1);assert.equal(new Set(cells.map(c=>c.appHash)).size,1);
   assert.equal(fs.existsSync(path.join(cells[0].project,'.agents/skills/glowup-ui')),false);
   const pair=pairFromManifest(file,kind,{conditions:['baseline','candidate']});
   assert.equal(pair[0].appHash,pair[1].appHash);
   const specs=pair.map(c=>agentCommand('codex',null,'same-model','high',c.project,c.task,c.skillHash?'with':'without'));
   assert.equal(specs[0].stdin,specs[1].stdin);assert.deepEqual(specs[0].args.map((a,i)=>specs[0].args[i-1]==='--cd'?'PROJECT':a),specs[1].args.map((a,i)=>specs[1].args[i-1]==='--cd'?'PROJECT':a));
   for(const c of cells)assert.equal(spawnSync('git',['status','--porcelain'],{cwd:c.project,encoding:'utf8'}).stdout.trim(),'');
   assert.equal(cells[0].activation,'unverified');assert.deepEqual(cells[0].screenshots,[]);assert.equal(cells[0].blindScores,null);
  }
  const pair=pairFromManifest(file,'finance',{conditions:['baseline','candidate']});
  for(const c of pair)fs.writeFileSync(path.join(c.project,'changed.txt'),'same tampering');
  assert.throws(()=>pairFromManifest(file,'finance',{conditions:['baseline','candidate']}),/changed/);
  assert.throws(()=>prepareDesignEvaluation({baseline:commit,candidate:commit,out}));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
