import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFlow, verifyFlow } from '../skills/glowup-ui/scripts/verify-flow.mjs';

test('behavior flows require bounded explicit outcomes, not just clicks or arbitrary code', () => {
  for (const flow of [{}, {steps:[]}, {steps:[{click:'#save'}]}, {steps:[{evaluate:'steal()'}]}, {steps:[{click:'#save',expectURL:'/'}]}, {steps:Array(101).fill({expectURL:'/'})}]) assert.throws(()=>validateFlow(flow));
  assert.throws(()=>validateFlow({steps:[{fill:{selector:'input',value:'x',extra:true}},{expectURL:'/'}]}));
  assert.doesNotThrow(()=>validateFlow({steps:[{fill:{selector:'input',value:''}},{click:'#save'},{expectText:{selector:'output',text:'11'}},{expectURL:'/'}]}));
});

test('behavior verifier validates timeout before interacting with the page', async () => {
  for (const timeout of [0,NaN,Infinity,60001]) await assert.rejects(verifyFlow({}, {steps:[{expectURL:'/'}]}, {timeout}));
});

test('failed interaction evidence does not serialize submitted values or raw Playwright errors', async () => {
  const listeners=new Map();
  const page={on:(k,v)=>listeners.set(k,v),off:k=>listeners.delete(k),locator:()=>({fill:async()=>{throw new Error('private-fill-value');}})};
  const r=await verifyFlow(page,{steps:[{fill:{selector:'input',value:'private-fill-value'}},{expectURL:'/'}]});
  assert.equal(r.status,'failed');assert.equal(r.assertions,0);assert.equal(listeners.size,0);
  assert.ok(!JSON.stringify(r).includes('private-fill-value'));assert.match(r.contractHash,/^[a-f0-9]{64}$/);
});
