import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
import {pairFromManifest,agentCommand,codexMetrics,blocker} from '../benchmarks/lib/pair.mjs';
test('matched runner rejects changed tasks, apps and treatment payloads',()=>{
 const p=spawnSync(process.execPath,['benchmarks/activation/prepare-comparison.mjs'],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);const root=p.stdout.trim();
 try{const file=root+'/manifest.json';const pair=pairFromManifest(file,'refine');assert.equal(pair[0].appHash,pair[1].appHash);
 fs.writeFileSync(pair[1].project+'/unmatched.txt','extra');assert.throws(()=>pairFromManifest(file,'refine'),/differ/);fs.unlinkSync(pair[1].project+'/unmatched.txt');
 const task=root+'/refine-with.task.txt',original=fs.readFileSync(task);fs.appendFileSync(task,'Extra task');assert.throws(()=>pairFromManifest(file,'refine'),/Task changed/);fs.writeFileSync(task,original);
 fs.appendFileSync(pair[1].project+'/.agents/skills/glowup-ui/SKILL.md','changed');assert.throws(()=>pairFromManifest(file,'refine'),/payload/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('pair commands pin same model and effort and differ only by skill invocation',()=>{
 for(const agent of ['claude','codex']){const a=agentCommand(agent,null,'pinned-model','high','/tmp/app','Build a thing','without');const b=agentCommand(agent,null,'pinned-model','high','/tmp/app','Build a thing','with');assert.equal(a.bin,b.bin);assert.ok(b.args.includes('pinned-model'));assert.ok(!b.args.some(x=>/dangerously|skip-permissions/.test(x)));if(agent==='codex'){assert.deepEqual(a.args,b.args);assert.equal(b.stdin,'$glowup-ui\n'+a.stdin);}else assert.equal(b.args.at(-1),'/glowup-ui\n'+a.args.at(-1));}
});
test('Codex full-body evidence rejects requested reads, partial bodies and failed commands',()=>{
 const canonical='---\nname: glowup-ui\n---\nEntire body';const event=(output,exit=0)=>JSON.stringify({type:'item.completed',item:{id:'c1',type:'command_execution',command:'cat .agents/skills/glowup-ui/SKILL.md',exit_code:exit,aggregated_output:output}});
 const finish=JSON.stringify({type:'turn.completed',usage:{input_tokens:10,output_tokens:5}});
 for(const log of [event('name: glowup-ui'),event(canonical,1),JSON.stringify({type:'item.started',item:{type:'command_execution',command:'cat .agents/skills/glowup-ui/SKILL.md'}})]) assert.equal(codexMetrics(log+'\n'+finish,canonical).skill.invoked,false);
 const m=codexMetrics(event(canonical)+'\n'+finish,canonical);assert.equal(m.completed,true);assert.equal(m.skill.invoked,true);assert.equal(m.toolCalls,1);assert.equal(m.tokens.input_tokens,10);assert.equal(codexMetrics('',canonical).tokens,null);
});
test('transport and authentication blocks are distinguished',()=>{assert.equal(blocker('HTTP CONNECT 403'),'blocked-network');assert.equal(blocker('Your access token could not be refreshed'),'blocked-auth');assert.equal(blocker('completed'),null);});

test('native error classifier ignores login phrases in app content and successful answers',async()=>{
 const {eventBlocker}=await import('../benchmarks/lib/pair.mjs');
 for(const event of [{type:'item.completed',item:{type:'command_execution',aggregated_output:'Not logged in; HTTP CONNECT 403'}},{type:'result',subtype:'success',is_error:false,result:'Display Not logged in on this page'}])assert.equal(eventBlocker(event),null);
 assert.equal(eventBlocker({type:'turn.failed',error:{message:'401 Unauthorized'}}),'blocked-auth');
 assert.equal(eventBlocker({type:'error',message:'HTTP CONNECT 403'}),'blocked-network');
});

test('runner protocol fixture: split completion events clean up background processes without claiming activation',{skip:process.platform==='win32'},()=>{
 const prep=spawnSync(process.execPath,['benchmarks/activation/prepare-comparison.mjs'],{encoding:'utf8'});assert.equal(prep.status,0,prep.stderr);const root=prep.stdout.trim();
 try{
 const bin=root+'/protocol-fixture.mjs';
 fs.writeFileSync(bin,`#!${process.execPath}\nif(process.argv.includes('--version')){console.log('synthetic protocol fixture, not a model');process.exit(0);}\nconsole.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'The app displays Not logged in'}}));\nconst done=JSON.stringify({type:'turn.completed'});process.stdout.write(done.slice(0,10));setTimeout(()=>process.stdout.write(done.slice(10)+'\\n'),10);setInterval(()=>{},1000);\n`,{mode:0o755});
 const r=spawnSync(process.execPath,['benchmarks/run-pair.mjs','--manifest',root+'/manifest.json','--kind','create','--agent','codex','--model','protocol-test-only','--effort','high','--bin',bin,'--out',root+'/protocol-result','--run','--isolation-note','Synthetic process-lifecycle test only; no model calls','--timeout-ms','10000'],{encoding:'utf8',timeout:20000});
 assert.equal(r.status,0,r.stderr+r.stdout);const report=JSON.parse(fs.readFileSync(root+'/protocol-result/result.json'));
 assert.equal(report.status,'runs-completed-review-required');assert.equal(report.isolationVerified,false);
 for(const c of report.cases){assert.equal(c.cleanupAfterCompletion,true);assert.equal(c.timedOut,false);assert.equal(c.metrics.skill.invoked,false);assert.equal(c.metrics.tokens,null);assert.equal(c.blindScores,null);}
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('runner protocol fixture stops a pair on provider failure and leaves treatment not-run',{skip:process.platform==='win32'},()=>{
 const prep=spawnSync(process.execPath,['benchmarks/activation/prepare-comparison.mjs'],{encoding:'utf8'});assert.equal(prep.status,0,prep.stderr);const root=prep.stdout.trim();
 try{
 const bin=root+'/error-fixture.mjs';fs.writeFileSync(bin,`#!${process.execPath}\nif(process.argv.includes('--version')){console.log('synthetic error fixture');process.exit(0);}\nconsole.log(JSON.stringify({type:'turn.failed',error:{message:'401 Unauthorized'}}));process.exitCode=1;\n`,{mode:0o755});
 const r=spawnSync(process.execPath,['benchmarks/run-pair.mjs','--manifest',root+'/manifest.json','--kind','create','--agent','codex','--model','protocol-test-only','--effort','high','--bin',bin,'--out',root+'/error-result','--run','--isolation-note','Synthetic error handling only'],{encoding:'utf8',timeout:10000});
 assert.equal(r.status,2,r.stderr);const report=JSON.parse(fs.readFileSync(root+'/error-result/result.json'));assert.equal(report.cases[0].status,'blocked-auth');assert.equal(report.cases[1].status,'not-run');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
