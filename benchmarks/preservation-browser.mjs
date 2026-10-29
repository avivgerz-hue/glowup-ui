// Synthetic regression fixtures, not agent trials or design-quality evidence.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const repoRoot=fileURLToPath(new URL('../',import.meta.url));
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadPlaywright, browserOptions } from '../skills/glowup-ui/scripts/screenshot.mjs';
import { measurePage } from '../skills/glowup-ui/scripts/measure.mjs';
import { review } from '../skills/glowup-ui/scripts/review.mjs';
import { snapshot, check } from '../skills/glowup-ui/scripts/checkpoint.mjs';
const pw = await loadPlaywright();
if (!pw) throw new Error('Browser tests require an explicitly installed Playwright/browser');
const browser = await pw.chromium.launch(browserOptions());
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-behavior-'));
try {
 const page = await browser.newPage({viewport:{width:390,height:844}});
 const html = '<style>body{margin:0;background:white;color:black;font:16px Arial}button{font:16px Arial;width:110px;height:48px;background:white;color:black}nav{position:fixed;bottom:0;width:100%;height:64px;z-index:1}#cover{position:fixed;bottom:0;width:100%;height:80px;background:white;z-index:2;display:none}</style><main><h1>Account</h1></main><nav aria-label="Primary"><button id="home">Home</button><button>Activity</button></nav><div id="cover"></div>';
 await page.setContent(html);
 const shot = async()=>({route:'/',viewport:'mobile',width:390,height:844,status:'ok',runtimeErrors:[],overflowX:false,measurements:await page.evaluate(measurePage)});
 const before=await shot();
 await page.locator('#cover').evaluate(el=>el.style.display='block');
 const after=await shot();
 assert.ok(after.measurements.occlusion?.blocked.length > 0, 'covered bottom navigation must be detected');
 assert.equal(review({shots:[after]},{shots:[before]}).ok,false);
 assert.equal(review({shots:[before]}).ok,true);
 await page.setViewportSize({width:1440,height:900});
 assert.ok((await page.evaluate(measurePage)).occlusion.blocked.length>0,'desktop obstruction is also detected');
 // A click on an associated label is valid, as are children inside a control.
 await page.setContent('<main><h1>Settings</h1><label for="check" style="position:absolute;width:70px;height:50px;background:white;z-index:2">Enable</label><input id="check" type="checkbox" style="width:50px;height:50px"><button style="width:100px;height:48px"><span>Save</span></button></main>');
 assert.deepEqual((await page.evaluate(measurePage)).occlusion.blocked,[]);
 await page.setContent(html+'<dialog><h2>Confirm</h2><button>Close</button></dialog>');
 await page.locator('dialog').evaluate(el=>el.showModal());
 assert.deepEqual((await page.evaluate(measurePage)).occlusion.blocked,[], 'intentional native-modal background blocking must not fail');
 const { verifyFlow } = await import('../skills/glowup-ui/scripts/verify-flow.mjs');
 const source = '<main><h1>Balance</h1><output id="balance">10</output><button onclick="save()">Save</button></main><script>function save(){document.querySelector("#balance").textContent=10+1}</script>';
 fs.writeFileSync(path.join(root,'index.html'),source);const baseline=snapshot(root);
 const changed=source.replace('10+1','10+2');fs.writeFileSync(path.join(root,'index.html'),changed);
 assert.equal(check(root,baseline).ok,true,'static checkpoint alone misses the changed handler outcome');
 const flow={steps:[{click:'button'},{expectText:{selector:'#balance',text:'11'}}]};
 await page.setContent(source);assert.equal((await verifyFlow(page,flow,{timeout:150})).status,'passed');
 await page.setContent(changed);assert.equal((await verifyFlow(page,flow,{timeout:150})).status,'failed');
 await page.setContent(source.replace('<button onclick="save()">Save</button>',''));assert.equal((await verifyFlow(page,flow,{timeout:150})).status,'failed');
 // Legitimate extraction changes structure, not the handler outcome.
 const extracted='<main><h1>Balance</h1><output id="balance">10</output><div id="actions"></div></main><script>function save(){document.querySelector("#balance").textContent=10+1}function SaveButton(){return \'<button onclick="save()">Save</button>\'}document.querySelector("#actions").innerHTML=SaveButton()</script>';
 fs.writeFileSync(path.join(root,'index.html'),extracted);assert.equal(check(root,baseline).ok,true);
 await page.setContent(extracted);assert.equal((await verifyFlow(page,flow,{timeout:150})).status,'passed');
 // Exercise the shipped CLI against a real local server, including runtime logs.
 const server=createServer((req,res)=>{
   res.setHeader("Content-Type","text/html");
   if(req.url==='/nav') return res.end('<button onclick="history.pushState({},\'\',\'/activity\')">Activity</button>');
   if(req.url==='/broken-nav') return res.end('<button>Activity</button>');
   if(req.url==='/runtime') return res.end(source.replace('10+1}', '10+1;throw new Error("PRIVATE-RUNTIME")}'));
   if(req.url==='/console') return res.end(source.replace('10+1}', '10+1;console.error("PRIVATE-LOG-CONTENT")}'));
   res.end(source);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
   const cli=async (flow,route)=>{
     const file=path.join(root,'flow.json');fs.writeFileSync(file,JSON.stringify(flow));
     const child=spawn(process.execPath,[path.join(repoRoot,'skills/glowup-ui/scripts/verify-flow.mjs'), '--flow',file,'--base-url',`http://127.0.0.1:${server.address().port}`,'--path',route,'--timeout','500'],{cwd:path.join(repoRoot,'benchmarks'),env:process.env});
     let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
     const code=await new Promise(resolve=>child.on('close',resolve));
     assert.ok(stdout,stderr);return {code,result:JSON.parse(stdout)};
   };
   const nav=await cli({steps:[{click:'button'},{expectURL:'/activity'}]},'/nav');assert.equal(nav.code,0);assert.equal(nav.result.assertions,1);
   const brokenNav=await cli({steps:[{click:'button'},{expectURL:'/activity'}]},'/broken-nav');assert.equal(brokenNav.code,1);
   const runtimeFailure=await cli(flow,'/runtime');assert.equal(runtimeFailure.code,1);assert.equal(runtimeFailure.result.runtimeErrors,1);
   const consoleFailure=await cli(flow,'/console');assert.equal(consoleFailure.code,1);assert.equal(consoleFailure.result.consoleErrors,1);assert.ok(!JSON.stringify(consoleFailure.result).includes('PRIVATE-LOG-CONTENT'));
 } finally { await new Promise(resolve=>server.close(resolve)); }
 console.log('Preservation browser regressions passed: occlusion, label/modal exceptions, handler outcome, missing control, extraction.');
} finally { await browser.close(); fs.rmSync(root,{recursive:true,force:true}); }
