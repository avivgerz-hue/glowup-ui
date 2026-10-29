#!/usr/bin/env node
// Exact Git snapshots and identical tasks. No model calls, installs or edits to user apps.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { install, hashDir } from '../lib/install.mjs';
import { applicationHash, sha } from './lib/pair.mjs';
const repository=fileURLToPath(new URL('../',import.meta.url));
const tasks={
 finance:`Substantially redesign this existing personal-finance app for clearer daily money decisions and a distinctive, coherent identity. Reconsider hierarchy, grouping, shared navigation, typography and responsive composition rather than only recoloring it. Cover overview, searchable/filterable activity, preferences and the transaction dialog. Preserve all existing content, integer-cent calculations, validation, stored preferences, data, controls and behavior; do not add integrations or fabricate numbers. Keep brand assets and existing framework. Implement the redesign, run original tests and browser checks where available, inspect matched desktop (1440x900) and phone (390x844) before/after views with identical data/state, and fix the largest remaining problems within two correction rounds. Report incomplete screens, unavailable evidence and regressions honestly. Do not commit or publish.`,
 booking:`Substantially redesign this existing spa booking application for a reassuring, service-specific reservation experience. Reconsider hierarchy, grouping, shared navigation, typography and responsive composition rather than only recoloring it. Cover home, services, service detail, booking/date/time selection and validation, contact, about and confirmation. Preserve all routes, content, prices, choices, handlers, validation, data and working reservation behavior. Keep brand assets and existing framework; do not fabricate reviews, imagery or integrations. Implement the redesign, run original tests and browser checks where available, inspect matched desktop (1440x900) and phone (390x844) before/after views with identical data/state, and fix the largest remaining problems within two correction rounds. Report incomplete screens, unavailable evidence and regressions honestly. Do not commit or publish.`
};
function git(repo,args){const r=spawnSync('git',args,{cwd:repo,maxBuffer:32*1024*1024});if(r.status!==0)throw new Error('Cannot read requested Git snapshot');return r.stdout;}
function revision(repo,commit){if(!/^[a-f0-9]{40}$/.test(commit||''))throw new Error('Use exact full 40-character Git commit hashes');git(repo,['cat-file','-e',commit+'^{commit}']);return commit;}
function extract(repo,commit,prefix,dest,{excludeReadme=false}={}){
 const entries=git(repo,['ls-tree','-r',commit,'--',prefix]).toString().trim().split('\n').filter(Boolean);
 if(!entries.length)throw new Error('Snapshot path absent');
 for(const line of entries){const [meta,file]=line.split('\t');const rel=file.slice(prefix.length+1);
  if(!/^100(644|755) blob /.test(meta)||!rel||rel.split('/').some(p=>['..','.git','.agents','.claude','node_modules'].includes(p)))throw new Error('Unsupported snapshot entry');
  if(excludeReadme&&/(^|\/)readme\.md$/i.test(rel))continue;
  const target=path.join(dest,...rel.split('/'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,git(repo,['show',commit+':'+file]));
 }
}
export function prepareDesignEvaluation({baseline,candidate,out,repo=repository}){
 revision(repo,baseline);revision(repo,candidate);
 if(!out)throw new Error('Choose a new output directory');
 fs.mkdirSync(out,{recursive:false,mode:0o700});
 const manifest={status:'prepared-not-run',baseline,candidate,fixtureCommit:baseline,cases:[],quality:'unverified',isolationVerified:false};
 const payloads={};
 for(const [condition,commit] of Object.entries({baseline,candidate})){
  const dest=path.join(out,'payload-'+condition);extract(repo,commit,'skills/glowup-ui',dest);payloads[condition]=dest;
 }
 for(const [kind,fixture] of Object.entries({finance:'demo/create-ledger',booking:'benchmarks/fixtures/booking-before'})){
  for(const condition of ['control','baseline','candidate']){
   const project=path.join(out,'work-'+randomUUID());fs.mkdirSync(project);
   extract(repo,baseline,fixture,project,{excludeReadme:true});
   if(spawnSync('git',['init','--quiet'],{cwd:project}).status!==0)throw new Error('Cannot initialize isolated workspace');
   // A fresh fixture must be clean: otherwise checkpoints freeze all its
   // initially-untracked UI files as user work and bias the skill arms.
   git(project,['add','--force','.']);
   git(project,['-c','user.name=Glowup evaluation fixture','-c','user.email=fixture@invalid','-c','commit.gpgsign=false','commit','--quiet','-m','Starting app fixture (local only)']);
   fs.appendFileSync(path.join(project,'.git/info/exclude'),'\n.agents/\n.claude/\n');
   if(condition!=='control')install({agent:'all',scope:'project',project,source:payloads[condition]});
   fs.writeFileSync(path.join(out,kind+'-'+condition+'.task.txt'),tasks[kind]);
   manifest.cases.push({kind,condition,project,taskHash:sha(tasks[kind]),appHash:applicationHash(project),skillHash:condition==='control'?null:hashDir(path.join(project,'.agents/skills/glowup-ui')),commit:condition==='control'?null:manifest[condition],status:'not-run',activation:'unverified',screenshots:[],blindScores:null});
  }
 }
 for(const source of Object.values(payloads))fs.rmSync(source,{recursive:true,force:true});
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const {values}=parseArgs({options:{baseline:{type:'string'},candidate:{type:'string'},out:{type:'string'}}});const m=prepareDesignEvaluation({...values,out:values.out?path.resolve(values.out):null});console.log(JSON.stringify({status:m.status,out:values.out,cases:m.cases.length}));}
 catch(e){console.error(e.message);process.exitCode=64;}
}
