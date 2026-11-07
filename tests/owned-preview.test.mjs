import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createServer} from 'node:http';import {spawnSync} from 'node:child_process';
import {ownedPreview} from '../benchmarks/lib/owned-preview.mjs';
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
async function freePort(){const server=createServer();const port=await listen(server);await new Promise(resolve=>server.close(resolve));return port;}
function fixture(t,response='requested'){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-owned-preview-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.writeFileSync(path.join(dir,'index.html'),'requested');fs.writeFileSync(path.join(dir,'server.mjs'),`import {createServer} from 'node:http';createServer((req,res)=>res.end(${JSON.stringify(response)})).listen(Number(process.env.PORT),'127.0.0.1');`);return dir;
}
test('occupied port cannot turn another checkout into a successful capture',async t=>{
 const server=createServer((req,res)=>res.end('other checkout'));const port=await listen(server);t.after(()=>new Promise(resolve=>server.close(resolve)));
 const project=fixture(t);await assert.rejects(ownedPreview({project,args:['server.mjs'],port,files:[{url:'/',file:'index.html'}]}),/already occupied/);
 assert.equal(await (await fetch(`http://127.0.0.1:${port}`)).text(),'other checkout','must not stop the unrelated listener');
});
test('requested preview verifies its exact served source and stops its own process',async t=>{
 const project=fixture(t),port=await freePort();const preview=await ownedPreview({project,args:['server.mjs'],port,files:[{url:'/',file:'index.html'}]});
 assert.deepEqual(preview.verifiedFiles,['index.html']);assert.equal(await (await fetch(preview.url)).text(),'requested');await preview.stop();
 await assert.rejects(fetch(preview.url));
});
test('wrong served bytes and exited preview process fail instead of producing evidence',async t=>{
 const project=fixture(t,'wrong');await assert.rejects(ownedPreview({project,args:['server.mjs'],port:await freePort(),files:[{url:'/',file:'index.html'}]}),/do not match/);
 await assert.rejects(ownedPreview({project,args:['-e','process.exit(1)'],port:await freePort(),files:[{url:'/',file:'index.html'}]}),/process exited/);
});
test('explicit output refuses replacement before reading apps or launching browsers',t=>{
 const dir=fixture(t);fs.writeFileSync(path.join(dir,'keep'),'original');
 for(const script of ['benchmarks/gather-showcase.mjs','benchmarks/studies.mjs']){
  const result=spawnSync(process.execPath,[script,'--out',dir],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/new.*directory/i);assert.equal(fs.readFileSync(path.join(dir,'keep'),'utf8'),'original');
 }
});
