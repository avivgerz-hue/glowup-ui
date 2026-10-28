#!/usr/bin/env node
// Reusable functional contract. Default execution tests only the unmodified fixture.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {parseArgs} from 'node:util';
import {seedChat, CHAT_SEED_HASH} from './lib/chat-state.mjs';
import {createServer} from './fixtures/chat-before/server.mjs';
import {loadPlaywright,browserOptions} from '../skills/glowup-ui/scripts/screenshot.mjs';
const {values}=parseArgs({options:{url:{type:'string'},out:{type:'string'}}});
const out=values.out?path.resolve(values.out):fs.mkdtempSync(path.join(os.tmpdir(),'glowup-chat-check-'));fs.mkdirSync(out,{recursive:true});
const result={kind:values.url?'functional contract on supplied app':'baseline fixture only; not an agent trial',checks:[],screenshots:[],pass:false};
let server,browser;
const check=(name)=>result.checks.push({name,status:'passed'});
try{
 let base=values.url;if(!base){server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
 const pw=await loadPlaywright();browser=await pw.chromium.launch(browserOptions());const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce'});page.setDefaultTimeout(10000);
 await page.goto(base);await page.getByRole('heading',{name:'New conversation',exact:true}).waitFor();check('empty conversation');
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('First');await page.getByRole('textbox',{name:'Message',exact:true}).press('Shift+Enter');await page.getByRole('textbox',{name:'Message',exact:true}).press('s');assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).inputValue(),'First\ns');await page.getByRole('textbox',{name:'Message',exact:true}).fill('');check('Shift+Enter preserves multiline draft');
 await page.getByRole('button',{name:'Send',exact:true}).click();assert.equal(await page.locator('article').count(),0);check('empty submission rejected');
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Plan a weekend in Prague');await page.getByRole('textbox',{name:'Message',exact:true}).press('Enter');
 await page.getByRole('status').filter({hasText:'Ready'}).waitFor();await page.getByText(/Demo reply/).waitFor();assert.equal(await page.locator('article').count(),2);check('Enter submits and streamed reply completes');
 await page.getByRole('link',{name:'History',exact:true}).click();await page.getByRole('searchbox').fill('no-such-title');await page.getByText('No conversations found.').waitFor();await page.getByRole('searchbox').fill('');
 await page.getByRole('textbox',{name:'Rename Plan a weekend in Prague',exact:true}).fill('Prague trip');await page.getByRole('button',{name:'Save name',exact:true}).click();await page.getByRole('button',{name:'Prague trip',exact:true}).waitFor();check('history search and rename');
 await page.reload();await page.getByRole('button',{name:'Prague trip',exact:true}).click();await page.getByText(/Demo reply/).waitFor();check('history and messages persist after reload');
 await page.getByRole('link',{name:'Settings',exact:true}).click();await page.getByLabel('Model',{exact:true}).selectOption('demo-fast');await page.getByLabel('Theme',{exact:true}).selectOption('dark');await page.reload();assert.equal(await page.getByLabel('Model',{exact:true}).inputValue(),'demo-fast');assert.equal(await page.getByLabel('Theme',{exact:true}).inputValue(),'dark');check('settings persist');
 await page.getByRole('link',{name:'Chat',exact:true}).click();await page.getByRole('textbox',{name:'Message',exact:true}).fill('Cancel this response');await page.getByRole('button',{name:'Send',exact:true}).click();await page.getByRole('button',{name:'Stop response',exact:true}).click();await page.getByRole('status').filter({hasText:'Ready'}).waitFor();await page.getByText(/\[Stopped\]/).waitFor();check('stop cancels stream');
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('/error');await page.getByRole('button',{name:'Send',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('button',{name:'Send',exact:true}).isEnabled(),true);check('error retains message and re-enables composer');
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Recover');await page.getByRole('button',{name:'Send',exact:true}).click();await page.getByRole('status').filter({hasText:'Ready'}).waitFor();assert.equal(await page.getByRole('alert').count(),0);check('send succeeds after failure');
 await seedChat(page);
 result.seedHash=CHAT_SEED_HASH;
 result.browser={name:'chromium',version:browser.version(),deviceScaleFactor:1,reducedMotion:'reduce',fullPage:false};
 result.captureState='reference-thread; fixed prompt/reply; light theme; balanced model';
 for(const [device,width,height]of [['phone',390,844],['desktop',1440,900]]){
  await page.setViewportSize({width,height});
  for(const route of ['chat','history','settings']){
   await page.goto(base+'/#'+route);await page.locator('h1').waitFor();
   if(route==='chat') await page.getByText('Demo reply: Explore the old town, take a riverside walk, and visit a museum. This is fixed benchmark content, not live AI.',{exact:true}).waitFor();
   if(route==='settings') assert.equal(await page.getByLabel('Theme',{exact:true}).inputValue(),'light');
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${device} ${route} overflows`);
   const file=`${device}-${route}.png`;await page.screenshot({path:path.join(out,file),fullPage:false,animations:'disabled'});result.screenshots.push({file,route,width,height,seedHash:CHAT_SEED_HASH});
  }
 }check('three views fit phone and desktop');
 await page.goto(base+'/#history');await page.getByRole('button',{name:'Delete conversation',exact:true}).click();await page.getByText('No conversations found.').waitFor();await page.reload();await page.getByText('No conversations found.').waitFor();check('delete persists');
 result.pass=true;
}catch(error){result.error=error.stack;process.exitCode=1;}
finally{await browser?.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(out);}
