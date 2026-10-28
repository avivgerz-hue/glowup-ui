#!/usr/bin/env node
// Prepare only. No model calls and no claims of activation or design results.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {parseArgs} from 'node:util';import {spawnSync} from 'node:child_process';
import {install,hashDir,SKILL_SOURCE} from '../../lib/install.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),fixture=path.resolve(here,'../fixtures/chat-before');
const {values}=parseArgs({options:{references:{type:'string'},trials:{type:'string',default:'3'}}});
const count=Number(values.trials);if(!Number.isInteger(count)||count<1||count>10)throw new Error('--trials must be 1..10');
const refs=values.references?path.resolve(values.references):null;
const images=refs?fs.readdirSync(refs,{withFileTypes:true}).filter(x=>x.isFile()&&/\.(png|jpg|jpeg|webp)$/i.test(x.name)).map(x=>x.name).sort():[];
if(refs&&!images.length)throw new Error('Reference directory contains no images');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'glowup-chat-trials-'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const common='Create a cohesive, polished AI chat frontend, using the supplied Grok Bot iOS screenshots in reference-images as visual references. Inspect those images before deciding the design. Adapt their hierarchy, navigation, typography, spacing, conversation presentation, composer and settings to this web app; do not invent unseen reference details or claim iOS-native parity. Cover conversation history, search, rename/delete, new chat, navigation, model/theme settings, streaming, stop, empty/error states and keyboard use. Preserve message/provider contracts and local persistence. Keep all content usable on phone and desktop. Preserve the functional selector contract: labels Message, Model, Theme and Search conversations; actions Send, Stop response, New chat, Save name and Delete conversation; navigation Chat, History and Settings; empty heading New conversation; Ready status when idle. Use localStorage key chat-benchmark with schema {active:string|null,chats:[{id,title,messages:[{role,content}]}],settings:{model,theme}}. These constrain functionality, not visual styling. No paid service or additional dependencies. The local provider is a deterministic test adapter, not live AI. Run npm test and npm run build; exercise the primary journeys and inspect actual screenshots. Do not alter tests or server.mjs. Do not commit or publish.';
const manifest={status:images.length?'prepared-not-run':'blocked-missing-references',sourceHash:hashDir(SKILL_SOURCE),fixtureHash:hashDir(fixture),agent:null,model:null,effort:null,budget:null,referenceImages:images.map(name=>({name,sha256:sha(fs.readFileSync(path.join(refs,name)))})),cases:[]};
for(const task of ['create','transform'])for(let trial=1;trial<=count;trial++)for(const condition of ['A','B']){
 const id=`${task}-${trial}-${condition}`,project=path.join(root,id);fs.mkdirSync(project);
 if(task==='transform')fs.cpSync(fixture,project,{recursive:true});
 else for(const file of ['server.mjs','server.test.mjs','package.json'])fs.copyFileSync(path.join(fixture,file),path.join(project,file));
 const startHash=hashDir(project);
 if(images.length){fs.mkdirSync(path.join(project,'reference-images'));for(const file of images)fs.copyFileSync(path.join(refs,file),path.join(project,'reference-images',file));}
 const git=spawnSync('git',['init','--quiet'],{cwd:project});if(git.status!==0)throw new Error('Git initialization failed');
 if(condition==='B')install({agent:'all',scope:'project',project});
 const prompt=(task==='create'?'Implement index.html, app.mjs and style.css from scratch against the existing provider server. ':'Substantially redesign the existing chat app across all its views, preserving functionality. ')+common;
 fs.writeFileSync(path.join(root,id+'.task.txt'),prompt+'\n');
 manifest.cases.push({id,task,trial,condition,project,taskHash:sha(prompt),startingAppHash:startHash,skillHash:condition==='B'?manifest.sourceHash:null,status:'not-run',activation:'unconfirmed',runtimeSec:null,tokens:null,toolCalls:null,screenshots:[],blindScores:null});
}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(root);
