#!/usr/bin/env node
// Render original instructional studies. Never labels these as agent outcomes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadPlaywright, browserOptions } from '../skills/glowup-ui/scripts/screenshot.mjs';
const root=fileURLToPath(new URL('../skills/glowup-ui/assets/studies/',import.meta.url));
const {values}=parseArgs({options:{write:{type:'boolean'},out:{type:'string'}}});
if(values.write&&values.out)throw new Error('Choose --write for canonical assets OR --out for private captures');
const out=values.write?root:values.out?path.resolve(values.out):fs.mkdtempSync(path.join(os.tmpdir(),'glowup-studies-'));
fs.mkdirSync(out,{recursive:true});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files=['study.css','task-workspace.html','selection-summary.html'];
const sources=files.map(file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))}));
const pw=await loadPlaywright();if(!pw)throw new Error('Use the existing benchmark Playwright installation; no browser is installed automatically.');
const server=createServer((req,res)=>{
  const file=new URL(req.url,'http://localhost').pathname.slice(1);
  if(!files.includes(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,file)));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
const evidence={schema:1,kind:'original hand-authored instructional compositions, not agent comparisons',sources,captures:[],checks:[],pass:false};
try{
 browser=await pw.chromium.launch(browserOptions());
 for(const [study,file] of [['task','task-workspace.html'],['selection','selection-summary.html']]){
  for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
   let textHash;
   for(const version of ['before','after']){
    const page=await browser.newPage({viewport,reducedMotion:'reduce'});
    await page.goto(`http://127.0.0.1:${server.address().port}/${file}?version=${version}`);
    await page.evaluate(()=>document.fonts.ready);
    const state=await page.evaluate(()=>({text:document.body.innerText.replace(/\s+/g,' ').trim().toLowerCase(),overflow:document.documentElement.scrollWidth>innerWidth,headings:document.querySelectorAll('h1').length}));
    assert.equal(state.overflow,false,`${study}/${device}/${version}: document overflow`);
    assert.equal(state.headings,1);
    const current=sha(state.text);if(textHash)assert.equal(current,textHash,'Both compositions must retain the same content');else textHash=current;
    const name=`${study}-${version}-${device}.png`;
    await page.screenshot({path:path.join(out,name),animations:'disabled'});
    evidence.captures.push({file:name,study,version,device,...viewport,sha256:sha(fs.readFileSync(path.join(out,name))),contentSha256:current});
    await page.close();
   }
   evidence.checks.push({study,device,sameContent:true,documentOverflow:false});
  }
 }
 evidence.pass=true;
 if(values.write||values.out)fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
 else{
  const committed=JSON.parse(fs.readFileSync(path.join(root,'evidence.json'),'utf8'));
  assert.deepEqual(committed.sources,sources,'Study sources changed; inspect and regenerate deliberately with --write');
  for(const capture of committed.captures)assert.equal(sha(fs.readFileSync(path.join(root,capture.file))),capture.sha256,'Committed capture bytes changed');
 }
 console.log(JSON.stringify({pass:true,kind:evidence.kind,captures:evidence.captures.length,out}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
