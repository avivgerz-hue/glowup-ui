#!/usr/bin/env node
// Agent-built sequential demonstration, not equal-budget causal evidence.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {parseArgs} from 'node:util';
const root=fileURLToPath(new URL('../',import.meta.url));
const {values}=parseArgs({options:{write:{type:'boolean'},check:{type:'boolean'},out:{type:'string'}}});
if(values.write&&(values.check||values.out))throw new Error('Choose --write OR --check/--out');
const out=values.write?path.join(root,'assets/examples/gather'):values.out?path.resolve(values.out):fs.mkdtempSync(path.join(os.tmpdir(),'glowup-gather-'));
fs.mkdirSync(out,{recursive:true});
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-gather-captures-'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function sources(dir){const rows=[];function walk(rel){for(const e of fs.readdirSync(path.join(dir,rel),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const sub=path.join(rel,e.name);if(e.isDirectory())walk(sub);else rows.push([sub.replaceAll(path.sep,'/'),sha(fs.readFileSync(path.join(dir,sub)))]);}}for(const item of ['public','test'])walk(item);return sha(JSON.stringify(rows));}
const result={schema:1,kind:'agent-built baseline followed by manual full-instruction Glowup TRANSFORM; additional editing pass, not a controlled skill advantage',skillVersion:'0.2.0-dev.1',skillCommit:'1aaacc6a4a6bcd85fb861c78462715f17990a25e',sources:{},captures:[],checks:[],pass:false};
const run=(args,cwd)=>{const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8',env:{...process.env,CI:'1'},timeout:120000});assert.equal(r.status,0,(r.stdout||'')+(r.stderr||''));return r.stdout;};
const baseline=path.join(root,'demo/gather/before'),treatment=path.join(root,'demo/gather/after');
for(const file of ['public/domain.js','test/domain.test.js'])assert.equal(sha(fs.readFileSync(path.join(baseline,file))),sha(fs.readFileSync(path.join(treatment,file))),'Domain logic and original tests must match');
let seedHash,browser;
for(const [label,dir,port] of [['before',baseline,4451],['after',treatment,4452]]){
 const tests=run(['--test','test/domain.test.js'],dir);assert.match(tests,/(?:#|ℹ) pass 6/);run(['build.js'],dir);
 const captured=path.join(scratch,label);run([path.join(root,'benchmarks/capture-design-trial.mjs'),'--kind','gather','--project',dir,'--out',captured,'--port',String(port)],root);
 const r=JSON.parse(fs.readFileSync(path.join(captured,'result.json'),'utf8'));assert.equal(r.pass,true);assert.equal(r.screenshots.length,10);
 if(seedHash){assert.equal(r.seedHash,seedHash);assert.deepEqual(r.browser,browser);}else{seedHash=r.seedHash;browser=r.browser;}
 result.sources[label]={path:`demo/gather/${label}`,hash:sources(dir),domainTests:6,build:true};
 result.checks.push({label,checks:r.checks,pageErrors:r.pageErrors});
 fs.mkdirSync(path.join(out,label),{recursive:true});
 for(const s of r.screenshots){
  // Keep heavy blurred-modal renders in private evidence; publish the four full screens.
  if(values.write&&s.route.endsWith('/dialog'))continue;
  fs.copyFileSync(path.join(captured,s.file),path.join(out,label,s.file));result.captures.push({...s,label,file:`${label}/${s.file}`});
 }
}
result.seedHash=seedHash;result.browser=browser;result.pass=true;result.dialogOutcomesTested=true;
const gallery=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Gather transformation demonstration</title><style>body{font:16px/1.5 system-ui;margin:0;padding:24px;background:#f5f6f1;color:#23382e;max-width:1500px;margin:auto}h1{letter-spacing:-.04em;font-size:2rem}p{max-width:80ch}label{display:inline-block;margin:12px 24px 20px 0}select{font:inherit;padding:10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}img{max-width:100%;height:auto;border:1px solid #cbd2c6}figure{margin:0}figcaption{font-weight:650;margin-bottom:12px}a{color:inherit}@media(max-width:600px){body{padding:16px}.pair{grid-template-columns:1fr}}</style><main><h1>Gather, before and after</h1><p>A functional app built without a design skill, then transformed by another fresh-context agent reading Glowup UI 0.2.0-dev.1. Same fictional content, original artwork, domain tests and interactions. The after version receives an additional editing pass: this is a workflow demonstration, not a controlled design advantage or native activation test.</p><label>Screen <select id="screen"><option value="overview">Overview</option><option value="events">Events</option><option value="guests">Guests</option><option value="settings">Settings</option></select></label><label>Device <select id="device"><option value="desktop">Desktop · 1440 × 900</option><option value="mobile">Phone · 390 × 844</option></select></label><div class="pair"><figure><figcaption>Before · agent without skill</figcaption><a id="before-link"><img id="before" alt="Gather before transformation"></a></figure><figure><figcaption>After · Glowup applied to a copy</figcaption><a id="after-link"><img id="after" alt="Gather after transformation"></a></figure></div><p>Open either image for full size. Tests and build passed for both versions; the shared browser journey exercises RSVP validation/persistence, filtering, settings and navigation. Independent human preference and equal-budget causal advantage remain unverified.</p></main><script>const screen=document.querySelector('#screen'),device=document.querySelector('#device');function render(){for(const label of ['before','after']){const file=label+'/'+screen.value+'-'+device.value+'.png';document.getElementById(label).src=file;document.getElementById(label+'-link').href=file;document.getElementById(label).alt='Gather '+label+' '+screen.selectedOptions[0].text+' '+device.selectedOptions[0].text;}}screen.onchange=device.onchange=render;render();</script></html>`;
fs.writeFileSync(path.join(out,'index.html'),gallery);result.gallerySha256=sha(gallery);
if(values.write||values.out)fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(result,null,2)+'\n');
if(values.check){const old=JSON.parse(fs.readFileSync(path.join(root,'assets/examples/gather/evidence.json'),'utf8'));assert.deepEqual(old.sources,result.sources);for(const capture of old.captures)assert.equal(sha(fs.readFileSync(path.join(root,'assets/examples/gather',capture.file))),capture.sha256);}
console.log(JSON.stringify({pass:true,captures:result.captures.length,checks:result.checks.length,kind:result.kind,out}));
