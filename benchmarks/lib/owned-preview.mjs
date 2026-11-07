// Reject stale/colliding previews and verify served bytes before collecting evidence.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import { createServer } from 'node:net';import {spawn} from 'node:child_process';
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
export async function requireFreePort(port){
 await new Promise((resolve,reject)=>{const probe=createServer();probe.once('error',()=>reject(new Error(`Preview port ${port} is already occupied or unavailable; choose a free port`)));probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
}
export async function ownedPreview({project,args,port,files,timeoutMs=10000}){
 await requireFreePort(port);
 const expected=files.map(({url,file})=>{
  if(!url.startsWith('/')||url.startsWith('//'))throw new Error('Preview source URLs must be local paths');
  const source=fs.realpathSync(path.resolve(project,file)),root=fs.realpathSync(project);
  if(!source.startsWith(root+path.sep))throw new Error('Preview source must stay inside the project');
  return {url,file,sha256:sha(fs.readFileSync(source))};
 });
 const child=spawn(process.execPath,args,{cwd:project,env:{...process.env,PORT:String(port)},stdio:'ignore'});
 let exited=false,failed=null;child.once('error',error=>{failed=error;});child.once('exit',()=>{exited=true;});
 const closed=new Promise(resolve=>child.once('close',resolve));
 const waitClosed=ms=>new Promise(resolve=>{
  const timer=setTimeout(()=>resolve(false),ms);
  closed.then(()=>{clearTimeout(timer);resolve(true);});
 });
 let stopping;
 const stop=()=>stopping??=(async()=>{
  if(exited||failed)return;
  child.kill('SIGTERM');
  if(await waitClosed(1500))return;
  // Signal only the process we spawned, never another listener on this port.
  if(!exited&&!failed)child.kill('SIGKILL');
  if(!await waitClosed(1500))throw new Error('Owned preview did not confirm exit after termination');
 })();
 const url=`http://127.0.0.1:${port}`,deadline=Date.now()+timeoutMs;
 try{
  while(Date.now()<deadline){
   if(exited||failed)throw new Error('Requested preview process exited before verification');
   try{
    for(const item of expected){const response=await fetch(url+item.url,{signal:AbortSignal.timeout(1000)});if(!response.ok||sha(Buffer.from(await response.arrayBuffer()))!==item.sha256)throw new Error('Preview served bytes do not match the requested project');}
    await new Promise(resolve=>setImmediate(resolve));
    if(exited||failed||child.exitCode!==null)throw new Error('Requested preview process exited during verification');
    return {url,stop,verifiedFiles:expected.map(item=>item.file)};
   }catch(error){
    if(/do not match|process exited/.test(error.message))throw error;
   }
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('Requested preview did not become ready within its budget');
 }catch(error){await stop();throw error;}
}
