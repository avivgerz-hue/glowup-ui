import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {prepareBlind} from '../benchmarks/blind-review.mjs';
test('blind package refuses mismatched evidence and keeps source mapping outside reviewer directory',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-blind-test-'));
 try{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const result={pass:true,seedHash:'fixture',browser:{name:'test'},screenshots:[{file:'shot.png',route:'/example',width:1,height:1}]};
 for(const label of ['a','b']){fs.mkdirSync(root+'/'+label);fs.writeFileSync(root+'/'+label+'/shot.png',png);fs.writeFileSync(root+'/'+label+'/result.json',JSON.stringify(result));}
 const a=root+'/a/result.json',b=root+'/b/result.json',out=root+'/review';
 fs.writeFileSync(b,JSON.stringify({...result,seedHash:'different'}));assert.throws(()=>prepareBlind(a,b,out),/conditions/);assert.equal(fs.existsSync(out),false);
 fs.writeFileSync(b,JSON.stringify(result));const r=prepareBlind(a,b,out);assert.equal(r.views,1);assert.ok(fs.existsSync(out+'.key.json'));assert.ok(!fs.readFileSync(out+'/index.html','utf8').includes('/a/'));assert.equal(JSON.parse(fs.readFileSync(out+'/scores.json')).views[0].X,null);
 assert.throws(()=>prepareBlind(a,b,out),/new review/);
 fs.writeFileSync(b,JSON.stringify({...result,screenshots:[{...result.screenshots[0],width:2}]}));assert.throws(()=>prepareBlind(a,b,root+'/other'),/dimensions/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
