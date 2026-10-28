import {test} from 'node:test';import assert from 'node:assert/strict';import {createServer} from './server.mjs';
test('test adapter streams, validates requests, and returns recoverable failure',async()=>{
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{const send=body=>fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const response=await send({messages:[{role:'user',content:'Hello'}],model:'demo-balanced'});assert.equal(response.status,200);const answer=(await response.text()).trim().split('\n').map(s=>JSON.parse(s).text).join('');assert.match(answer,/Hello/);assert.match(answer,/not live AI/);
 assert.equal((await send({messages:[],model:'demo-fast'})).status,400);assert.equal((await send({messages:[{role:'user',content:'/error'}],model:'demo-fast'})).status,503);assert.equal((await fetch(base+'/missing')).status,404);assert.equal((await fetch(base+'/')).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
