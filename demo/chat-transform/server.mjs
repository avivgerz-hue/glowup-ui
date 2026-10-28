// Test adapter only. No real AI model or external service is called.
import http from 'node:http';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function createServer(){return http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'&&pathname==='/api/chat'){
  try{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536){res.writeHead(413).end();return;}}
   const {messages,model}=JSON.parse(raw);
   if(!Array.isArray(messages)||!messages.length||messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string')||!['demo-balanced','demo-fast'].includes(model)){res.writeHead(400).end();return;}
   const prompt=messages.at(-1).content;
   if(prompt==='/error'){res.writeHead(503).end('Demo provider unavailable');return;}
   res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store'});
   const answer=`Demo reply (${model}): You asked “${prompt.slice(0,200)}”. This is a deterministic test response, not live AI.`;
   for(const text of answer.match(/.{1,12}/gs)){if(res.destroyed)break;res.write(JSON.stringify({text})+'\n');await new Promise(r=>setTimeout(r,30));}res.end();
  }catch{if(!res.headersSent)res.writeHead(400);res.end();}return;
 }
 const files={'/':'index.html','/app.mjs':'app.mjs','/style.css':'style.css'};
 if(req.method!=='GET'||!Object.hasOwn(files,pathname)){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':pathname.endsWith('.mjs')?'text/javascript':pathname.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store'});res.end(fs.readFileSync(new URL(files[pathname],import.meta.url)));
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){const server=createServer();server.listen(Number(process.env.PORT||4179),'127.0.0.1',()=>console.log('Chat fixture ready'));}
