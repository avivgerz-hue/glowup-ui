import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {install,SKILL_SOURCE,hashDir} from '../lib/install.mjs';import {uninstall} from '../lib/uninstall.mjs';
test('uninstall moves modified copies outside discovery, supports dry run and preserves unrelated skills',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-remove-'));
 try{install({scope:'project',project:root});const dir=root+'/.agents/skills/glowup-ui';fs.writeFileSync(dir+'/user-notes.txt','keep me');fs.mkdirSync(root+'/.agents/skills/other');
 const before=hashDir(dir);assert.equal(uninstall({scope:'project',project:root,dryRun:true})[0].action,'remove');assert.ok(fs.existsSync(dir));
 const results=uninstall({scope:'project',project:root});assert.equal(results.length,2);assert.equal(hashDir(results[0].backup),before);assert.ok(!fs.existsSync(dir));assert.ok(fs.existsSync(root+'/.agents/skills/other'));assert.equal(uninstall({scope:'project',project:root})[0].action,'absent');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('uninstall refuses unknown payloads before moving either target',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-remove-'));
 try{install({scope:'project',project:root});fs.writeFileSync(root+'/.claude/skills/glowup-ui/SKILL.md','unrelated');assert.throws(()=>uninstall({scope:'project',project:root}),/Cannot identify/);assert.ok(fs.existsSync(root+'/.agents/skills/glowup-ui'));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('linked removal preserves canonical files and canonical removal is rejected',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-remove-'));const original=hashDir(SKILL_SOURCE);
 try{install({scope:'project',project:root,link:true});uninstall({scope:'project',project:root});assert.equal(hashDir(SKILL_SOURCE),original);assert.throws(()=>uninstall({dest:path.dirname(SKILL_SOURCE),home:root}),/canonical/);}finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('uninstall refuses project backup links outside the selected project',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-remove-'));
 try{const project=path.join(root,'project'),outside=path.join(root,'outside');fs.mkdirSync(project);fs.mkdirSync(outside);install({scope:'project',project});fs.symlinkSync(outside,path.join(project,'.glowup-ui'),process.platform==='win32'?'junction':'dir');
 assert.throws(()=>uninstall({scope:'project',project}),/escapes/);assert.ok(fs.existsSync(project+'/.agents/skills/glowup-ui'));assert.deepEqual(fs.readdirSync(outside),[]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
