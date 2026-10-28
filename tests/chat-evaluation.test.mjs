import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const script='benchmarks/activation/prepare-chat-trials.mjs';
function prepare(args=[]){const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
test('three chat CREATE/TRANSFORM pairs have identical tasks and app sources and no false results',()=>{
 const root=prepare();try{const m=JSON.parse(fs.readFileSync(root+'/manifest.json'));assert.equal(m.status,'blocked-missing-references');assert.equal(m.cases.length,12);
 for(const task of ['create','transform'])for(let trial=1;trial<=3;trial++){
  const [a,b]=m.cases.filter(c=>c.task===task&&c.trial===trial);assert.equal(a.condition,'A');assert.equal(b.condition,'B');assert.equal(a.startingAppHash,b.startingAppHash);assert.equal(a.taskHash,b.taskHash);assert.equal(a.skillHash,null);assert.equal(b.skillHash,m.sourceHash);
  assert.ok(!fs.existsSync(a.project+'/.agents/skills/glowup-ui'));assert.ok(fs.existsSync(b.project+'/.agents/skills/glowup-ui/SKILL.md'));assert.equal(a.status,'not-run');assert.equal(b.blindScores,null);
 }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('supplied references are identical in both conditions and recorded by content hash',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-synthetic-ref-'));let root;
 try{const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');fs.writeFileSync(dir+'/synthetic.png',image);
 root=prepare(['--trials','1','--references',dir]);const m=JSON.parse(fs.readFileSync(root+'/manifest.json'));assert.equal(m.status,'prepared-not-run');assert.equal(m.referenceImages.length,1);for(const c of m.cases)assert.deepEqual(fs.readFileSync(c.project+'/reference-images/synthetic.png'),image);
 }finally{if(root)fs.rmSync(root,{recursive:true,force:true});fs.rmSync(dir,{recursive:true,force:true});}
});
test('invalid trial counts and empty reference directories fail instead of pretending ready',()=>{
 assert.notEqual(spawnSync(process.execPath,[script,'--trials','0']).status,0);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-empty-ref-'));try{assert.notEqual(spawnSync(process.execPath,[script,'--references',dir]).status,0);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
