#!/usr/bin/env node
// Prepare a plan by default; --run opts into real provider usage. Never overwrites a run.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { pairFromManifest, agentCommand, codexMetrics, blocker, eventBlocker, applicationHash } from './lib/pair.mjs';
import { parseTranscript } from './lib/metrics.mjs';
const {values:a}=parseArgs({options:{manifest:{type:'string'},kind:{type:'string'},agent:{type:'string'},model:{type:'string'},effort:{type:'string'},bin:{type:'string'},out:{type:'string'},run:{type:'boolean'},'timeout-ms':{type:'string',default:'600000'},'isolation-note':{type:'string'}}});
if(!a.manifest || !['create','refine'].includes(a.kind)) throw new Error('Use --manifest FILE --kind create|refine --agent claude|codex --model EXACT --effort LEVEL [--run --isolation-note TEXT]');
const timeout=Number(a['timeout-ms']);
if(!Number.isInteger(timeout)||timeout<1000||timeout>3600000) throw new Error('timeout-ms must be 1000..3600000');
if(a.run&&!a['isolation-note']?.trim()) throw new Error('Before --run, audit global/ancestor/plugin skills and tools for both conditions; record how in --isolation-note. Do not disable all skills/tools only for the control.');
const pair=pairFromManifest(a.manifest,a.kind);
const specs=pair.map(c=>agentCommand(a.agent,a.bin,a.model,a.effort,c.project,c.task,c.condition));
const out=a.out?path.resolve(a.out):fs.mkdtempSync(path.join(os.tmpdir(),'glowup-pair-'));
if(a.out) fs.mkdirSync(out,{recursive:false,mode:0o700});
const report={status:'prepared-not-run',agent:a.agent,model:a.model,effort:a.effort,timeoutMs:timeout,startingAppHash:pair[0].appHash,taskHash:pair[0].taskHash,isolationNote:a['isolation-note']??null,isolationVerified:false,order:pair.map(c=>c.condition),cases:pair.map(c=>({condition:c.condition,project:c.project,skillHash:c.skillHash,status:'not-run',screenshots:[],blindScores:null}))};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(out,'commands.json'),JSON.stringify(specs,null,2)+'\n',{mode:0o600});save();
async function run(spec,label) {
  const started=Date.now();
  const stdout=fs.createWriteStream(path.join(out,label+'.jsonl'),{mode:0o600});
  const stderr=fs.createWriteStream(path.join(out,label+'.stderr.txt'),{mode:0o600});
  return new Promise(resolve=>{
    const child=spawn(spec.bin,spec.args,{cwd:spec.cwd,env:process.env,detached:process.platform!=='win32',stdio:['pipe','pipe','pipe']});
    let tail='',error=null,timedOut=false,blocked=null,pending='',finishTimer,cleanupAfterCompletion=false;
    const stop=()=>{try{if(process.platform==='win32')child.kill('SIGKILL');else process.kill(-child.pid,'SIGKILL');}catch{}};
    const timer=setTimeout(()=>{timedOut=true;stop();},timeout);
    const inspect=data=>{tail=(tail+data.toString()).slice(-16000);blocked ||= blocker(tail);if(blocked)stop();};
    child.stdout.on('data',d=>{
      stdout.write(d);pending+=d.toString();
      const lines=pending.split('\n');pending=lines.pop();
      for(const line of lines){
        let event;try{event=JSON.parse(line);}catch{continue;}
        blocked ||= eventBlocker(event);
        if(blocked){stop();continue;}
        if(!finishTimer&&(event.type==='turn.completed'||(event.type==='result'&&event.subtype==='success'&&!event.is_error))){
          // Background preview servers can retain stdio after the model finishes.
          finishTimer=setTimeout(()=>{cleanupAfterCompletion=true;stop();},2000);
        }
      }
    });child.stderr.on('data',d=>{stderr.write(d);inspect(d);});
    child.stdin.on('error',()=>{});child.on('error',e=>{error=e.code;});
    child.on('close',async(code,signal)=>{
      clearTimeout(timer);clearTimeout(finishTimer);
      await Promise.all([new Promise(r=>stdout.end(r)),new Promise(r=>stderr.end(r))]);
      resolve({exitCode:code,signal,error,timedOut,blocked,cleanupAfterCompletion,wallSec:(Date.now()-started)/1000});
    });child.stdin.end(spec.stdin);
  });
}
if(a.run){
  const version=spawnSync(specs[0].bin,['--version'],{encoding:'utf8',timeout:10000});report.agentVersion=version.status===0?version.stdout.trim():null;
  report.status='running';save();
  for(let i=0;i<pair.length;i++){
    const c=pair[i], runResult=await run(specs[i],c.condition);
    const log=path.join(out,c.condition+'.jsonl');
    const canonical=c.condition==='with'?fs.readFileSync(path.join(c.project,'.agents/skills/glowup-ui/SKILL.md'),'utf8'):'';
    const metrics=a.agent==='claude'?parseTranscript(log,c.project):codexMetrics(fs.readFileSync(log,'utf8'),canonical);
    report.cases[i]={...report.cases[i],...runResult,metrics,status:runResult.blocked||(runResult.error?'blocked-cli':runResult.timedOut?'blocked-timeout':(runResult.exitCode===0||runResult.cleanupAfterCompletion)&&metrics.completed?'completed':'incomplete'),finalAppHash:applicationHash(c.project),build:null,functionality:null};
    save();
    if(report.cases[i].status!=='completed'){report.status='incomplete';break;}
  }
  if(report.cases.every(c=>c.status==='completed')) report.status='runs-completed-review-required';
  // Completion is not benchmark validity. Review isolation, activation, behavior, builds and images.
  save();process.exitCode=report.status==='runs-completed-review-required'?0:2;
}
console.log(out);console.log(report.status);
