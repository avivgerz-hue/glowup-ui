import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
