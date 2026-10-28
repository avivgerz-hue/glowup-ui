#!/usr/bin/env node
// Package actual PNGs for independent review; no scores or quality claims generated.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {parseArgs} from 'node:util';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=s=>JSON.stringify([s.route,s.width,s.height]);
export function prepareBlind(leftFile,rightFile,out){
 const files=[leftFile,rightFile].map(f=>path.resolve(f));const results=files.map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
 if(results.some(r=>!r.pass||!r.seedHash||!r.browser||!r.screenshots?.length)) throw new Error('Need successful capture results with seedHash, browser and screenshots');
 if(results[0].seedHash!==results[1].seedHash||JSON.stringify(results[0].browser)!==JSON.stringify(results[1].browser))throw new Error('Capture state or browser conditions differ');
 const maps=results.map(r=>new Map(r.screenshots.map(s=>[key(s),s])));
 if(maps.some((m,i)=>m.size!==results[i].screenshots.length)||maps[0].size!==maps[1].size||[...maps[0].keys()].some(k=>!maps[1].has(k)))throw new Error('Routes or dimensions do not match uniquely');
 // Validate every image and PNG dimension before creating any output.
 const pages=[...maps[0].keys()].map(k=>maps.map((m,i)=>{
  const shot=m.get(k),root=fs.realpathSync(path.dirname(files[i])),image=fs.realpathSync(path.resolve(root,shot.file));
  if(!image.startsWith(root+path.sep))throw new Error('Image must be inside its evidence directory');
  const bytes=fs.readFileSync(image);
  if(bytes.length<24||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.readUInt32BE(16)!==shot.width||bytes.readUInt32BE(20)!==shot.height)throw new Error('PNG dimensions differ from capture metadata');
  return {shot,bytes};
 }));
 const output=path.resolve(out),privateKey=output+'.key.json';
 if(fs.existsSync(output)||fs.existsSync(privateKey))throw new Error('Choose a new review output directory');
 fs.mkdirSync(output,{recursive:true});const order=crypto.randomInt(2)?[1,0]:[0,1];const review=[];let html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Blind UI review</title><style>body{font:16px system-ui;margin:24px;background:#f4f4f4;color:#222}section{margin-bottom:48px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}img{max-width:100%;border:1px solid #aaa}h2{font-size:18px}</style><h1>Independent UI review</h1><p>Score the visible result, not the amount of change. Record ties and losses. Functionality needs separate checks. The same X/Y mapping applies to every route.</p>';
 for(let n=0;n<pages.length;n++){
  const first=pages[n][0].shot;const id=`view-${n+1}`;html+=`<section><h2>${escape(first.route)} · ${first.width} × ${first.height}</h2><div class="pair">`;
  for(let j=0;j<2;j++){const label=j?'Y':'X',name=`${id}-${label}.png`;fs.writeFileSync(path.join(output,name),pages[n][order[j]].bytes);html+=`<div><h3>${label}</h3><img src="${name}" alt="${label}: ${escape(first.route)}"></div>`;}
  html+='</div></section>';review.push({id,route:first.route,width:first.width,height:first.height,X:null,Y:null,rationale:null});
 }
 const rubric={reviewer:null,blinded:true,scale:'1 poor; 3 usable with visible weaknesses; 5 coherent and polished. Use ties. Explain scores with visible evidence.',criteria:['hierarchy','typography','composition','originality','productFit','consistency','responsiveUsability','visualPolish'],views:review,functionality:'separate test evidence required',accessibility:'screenshots alone cannot establish accessibility'};
 fs.writeFileSync(path.join(output,'index.html'),html);fs.writeFileSync(path.join(output,'scores.json'),JSON.stringify(rubric,null,2)+'\n');
 fs.writeFileSync(privateKey,JSON.stringify({X:files[order[0]],Y:files[order[1]],seedHash:results[0].seedHash},null,2)+'\n',{mode:0o600});
 return {output,privateKey,views:pages.length,status:'awaiting-independent-review'};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {values}=parseArgs({options:{left:{type:'string'},right:{type:'string'},out:{type:'string'}}});if(!values.left||!values.right||!values.out)throw new Error('Use --left result.json --right result.json --out NEW_DIRECTORY');console.log(JSON.stringify(prepareBlind(values.left,values.right,values.out),null,2));}
