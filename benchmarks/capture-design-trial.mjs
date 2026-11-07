#!/usr/bin/env node
// One collector for every condition: actual state/viewport-matched renders, no quality scores.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { loadPlaywright, browserOptions } from '../skills/glowup-ui/scripts/screenshot.mjs';
import { measurePage } from '../skills/glowup-ui/scripts/measure.mjs';
import { initialState } from '../demo/create-ledger/model.mjs';
import { normalizeState, STORAGE_KEY } from '../demo/gather/before/public/domain.js';
const {values:a}=parseArgs({options:{kind:{type:'string'},project:{type:'string'},out:{type:'string'},port:{type:'string'}}});
if(!['finance','booking','gather'].includes(a.kind)||!a.project||!a.out||!/^\d+$/.test(a.port||''))throw new Error('Use --kind finance|booking|gather --project APP --out NEW_DIRECTORY --port PORT');
const port=Number(a.port);if(port<1024||port>65535)throw new Error('Choose an unprivileged port 1024..65535');
const project=path.resolve(a.project),out=path.resolve(a.out);
if(fs.existsSync(out))throw new Error('Capture output must be new; never overwrite trial evidence');
const pw=await loadPlaywright();if(!pw)throw new Error('Explicitly install the benchmark browser dependencies first');
fs.mkdirSync(out,{recursive:true,mode:0o700});
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const seed={clock:'2026-11-06T12:00:00Z',locale:'en-US',timezone:'UTC',colorScheme:'light',finance:initialState(),booking:{service:'deep-tissue',date:'2026-11-19',time:'9:00 AM',name:'Trial Guest',email:'trial@example.invalid'}};
if(a.kind==='gather')seed.gather={key:STORAGE_KEY,state:normalizeState({})};
const result={pass:false,kind:a.kind,seedHash:sha(JSON.stringify(seed)),browser:null,screenshots:[],checks:[],pageErrors:[],measurements:[],qualityScore:null,humanPreference:null};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
const args=a.kind==='finance'?['server.mjs']:a.kind==='gather'?['server.js']:['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'];
const server=spawn(process.execPath,args,{cwd:project,env:{...process.env,PORT:String(port)},stdio:'ignore'});
let browser;
try{
 const base=`http://127.0.0.1:${port}`;let ready=false;
 for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 if(!ready)throw new Error('App preview failed to start');
 browser=await pw.chromium.launch(browserOptions());
 result.browser={version:browser.version(),engine:'chromium',launch:'Playwright defaults with optional existing executable',chromiumSandbox:false,locale:seed.locale,timezone:seed.timezone};save();
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,locale:seed.locale,timezoneId:seed.timezone,colorScheme:'light',reducedMotion:'reduce'});
  await context.addInitScript(({clock,finance,gather})=>{
   const OriginalDate=Date;globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return new OriginalDate(clock).getTime();}};
   if(!sessionStorage.getItem('__glowupTrialSeeded')){localStorage.clear();localStorage.setItem('glowup-margin-v1',JSON.stringify(finance));if(gather)localStorage.setItem(gather.key,JSON.stringify(gather.state));sessionStorage.setItem('__glowupTrialSeeded','1');}
  },seed);
  const page=await context.newPage();page.on('pageerror',e=>result.pageErrors.push({device,message:e.message}));
  async function shot(route){
   await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,0));
   const file=`${route.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home'}-${device}.png`;
   await page.screenshot({path:path.join(out,file),animations:'disabled'});
   const metrics=await page.evaluate(measurePage);result.measurements.push({route,device,metrics});
   result.screenshots.push({route,...viewport,file,sha256:sha(fs.readFileSync(path.join(out,file)))});save();
  }
  if(a.kind==='finance'){
   for(const route of ['overview','activity','settings']){await page.goto(base+'/#'+route);await page.locator('#page-title').waitFor();await shot('#'+route);}
   await page.goto(base+'/#overview');await page.locator('#add').click();await page.locator('dialog[open]').waitFor();await page.locator('input[name=date]').fill('2026-10-25');await shot('#overview/dialog');await page.locator('#close').click();
   await page.goto(base+'/#activity');await page.locator('#search').fill('Sunday market');
   assert.equal(await page.locator('tbody tr').count(),1);assert.match(await page.locator('tbody').innerText(),/Sunday market/);
   await page.locator('#filter').selectOption('Software');assert.match(await page.locator('tbody').innerText(),/No transactions match/);
   await page.locator('#search').fill('');assert.equal(await page.locator('tbody tr').count(),1);
   await page.goto(base+'/#settings');await page.locator('input[name=name]').fill('Trial User');await page.locator('#settings button[type=submit], #settings button:not([type])').click();await page.reload();assert.equal(await page.locator('input[name=name]').inputValue(),'Trial User');
   result.checks.push({device,search:true,combinedFilter:true,preferencesPersist:true,dialogOpenClose:true});
  }else if(a.kind==='booking'){
   for(const route of ['/','/services','/services/deep-tissue','/about','/contact']){await page.goto(base+route);await page.locator('main h1').waitFor();await shot(route);}
   await page.goto(base+'/book');await page.locator('input[name=service]').first().waitFor();await shot('/book/service');
   await page.getByRole('button',{name:'Next',exact:true}).click();assert.match(await page.getByRole('alert').innerText(),/choose a service/);await shot('/book/validation');
   await page.locator('input[name=service][value=deep-tissue]').check();await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByLabel('Date',{exact:true}).fill(seed.booking.date);await shot('/book/time');
   await page.locator('input[name=time][value="9:00 AM"]').check();await page.getByRole('button',{name:'Next',exact:true}).click();await shot('/book/details');
   await page.getByRole('button',{name:'Confirm booking',exact:true}).click();assert.match(await page.getByRole('alert').innerText(),/enter your name/);
   await page.getByLabel('Name',{exact:true}).fill(seed.booking.name);await page.getByLabel('Email',{exact:true}).fill(seed.booking.email);await page.getByRole('button',{name:'Confirm booking',exact:true}).click();
   await page.getByRole('heading',{name:'Booking confirmed',exact:true}).waitFor();assert.match(await page.locator('main').innerText(),/Deep Tissue Massage/);await shot('/confirmation');
   result.checks.push({device,serviceValidation:true,detailsValidation:true,realReservationConfirmation:true});
  }else{
   for(const route of ['overview','events','guests','settings']){await page.goto(base+'/#'+route);await page.locator('main h1').waitFor();await shot('#'+route);}
   await page.goto(base+'/#overview');await page.locator('[data-event="harvest"]').first().click();await page.locator('#event-dialog[open]').waitFor();await shot('#overview/dialog');
   await page.locator('#rsvp-name').fill('Trial Guest');await page.locator('#rsvp-email').fill('bad');await page.locator('.rsvp-submit').click();assert.equal(await page.locator('.rsvp-success').count(),0);
   await page.locator('#rsvp-email').fill('trial@example.invalid');await page.locator('#rsvp-seats').selectOption('2');await page.locator('.rsvp-submit').click();await page.locator('.rsvp-success').waitFor();assert.match(await page.locator('.rsvp-success').innerText(),/2 places/);await page.locator('[data-close-dialog]').click();
   await page.goto(base+'/#guests');await page.locator('#guest-search').fill('trial@example.invalid');assert.match(await page.locator('#guest-results').innerText(),/Trial Guest/);await page.reload();await page.locator('#guest-search').fill('trial@example.invalid');assert.match(await page.locator('#guest-results').innerText(),/Trial Guest/);
   await page.goto(base+'/#events');await page.locator('#event-search').fill('unlikely phrase');assert.equal(await page.locator('[data-event]').count(),0);
   await page.goto(base+'/#settings');await page.locator('input[name=name]').fill('Trial User');await page.locator('input[name=theme][value=dark]').check();await page.locator('#settings-form button[type=submit]').click();await page.reload();assert.equal(await page.locator('input[name=name]').inputValue(),'Trial User');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   result.checks.push({device,rsvpValidation:true,rsvpPersistence:true,guestSearch:true,eventEmptyState:true,preferencesPersistence:true});
  }
  await context.close();
 }
 assert.equal(result.pageErrors.length,0,'App runtime errors occurred');result.pass=true;save();
 console.log(JSON.stringify({pass:true,kind:a.kind,captures:result.screenshots.length,out}));
}finally{save();await browser?.close();server.kill();}
