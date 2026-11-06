import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { selectStudy } from '../skills/glowup-ui/scripts/studies.mjs';
import { designBrief } from '../skills/glowup-ui/scripts/design-brief.mjs';

test('problem retrieval is bounded, optional, not product-keyword styling and not loaded for polish', () => {
  assert.equal(designBrief('event management').study,null);
  const a=designBrief('event management',{problem:'hierarchy'});
  const b=designBrief('personal finance',{problem:'hierarchy'});
  assert.equal(a.study.id,b.study.id);
  assert.notEqual(a.study.id,designBrief('event management',{problem:'selection'}).study.id);
  assert.equal(designBrief('event management',{problem:'hierarchy',mode:'refine'}).study,null);
  assert.equal(designBrief('event management',{problem:'selection',depth:'polish'}).study,null);
  for(const problem of ['constructor','__proto__','../../private','unknown'])assert.throws(()=>selectStudy(problem),/Observed problem/);
});
test('retrieved studies and all local reference assets ship inside the canonical payload', () => {
  const root=path.resolve('skills/glowup-ui');
  for(const problem of ['hierarchy','selection']){
    const study=selectStudy(problem);
    assert.match(study.provenance,/not an agent benchmark/);
    const file=path.join(root,study.reference),text=fs.readFileSync(file,'utf8');
    for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
      const dest=path.resolve(path.dirname(file),match[1]);
      assert.ok(dest.startsWith(root+path.sep));assert.ok(fs.existsSync(dest),match[1]);
    }
    const html=fs.readFileSync(path.join(root,study.source),'utf8');
    assert.doesNotMatch(html,/(?:src|href)=["']https?:/);
  }
});

test('study images retain matching content, dimensions and source hashes without private metadata', () => {
 const root=path.resolve('skills/glowup-ui/assets/studies');
 const evidence=JSON.parse(fs.readFileSync(path.join(root,'evidence.json'),'utf8'));
 const sha=data=>createHash('sha256').update(data).digest('hex');
 assert.equal(evidence.pass,true);assert.equal(evidence.captures.length,8);
 for(const source of evidence.sources)assert.equal(sha(fs.readFileSync(path.join(root,source.file))),source.sha256);
 for(const shot of evidence.captures){
  const data=fs.readFileSync(path.join(root,shot.file));
  assert.equal(sha(data),shot.sha256);assert.equal(data.subarray(1,4).toString(),'PNG');
  assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],shot.device==='mobile'?[390,844]:[1440,900]);
  const pair=evidence.captures.find(s=>s.study===shot.study&&s.device===shot.device&&s.version!==shot.version);
  assert.equal(pair.contentSha256,shot.contentSha256);
  for(let offset=8;offset<data.length;){
   const length=data.readUInt32BE(offset),kind=data.toString('ascii',offset+4,offset+8);
   assert.ok(offset+length+12<=data.length);
   assert.ok(!['tEXt','iTXt','zTXt','eXIf'].includes(kind));offset+=length+12;
  }
 }
});
