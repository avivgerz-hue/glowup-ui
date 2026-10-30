#!/usr/bin/env node
// Original composition alternatives, not themes or a quality oracle. No writes/network.
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { composition } from './composition.mjs';

const alternatives = {
 finance: [
  ['position','Position and movement','Balance and its period change lead; trend occupies the wide region, with commitments beside it and activity below.','Large tabular amount, clear period labels, quiet row typography; use the existing brand accent for the selected comparison.','Phone: balance → change → commitments → activity; keep transfer/add reachable in the shared shell.','Best for checking financial position; weak if users mainly reconcile many entries.'],
  ['ledger','Activity-led ledger','A grouped transaction journal dominates; running balance and filters sit above it. Account context becomes a narrow supporting rail rather than equal summary cards.','Aligned amounts and strong date/group rhythm; existing type family gains a clear row/metadata distinction.','Phone: transaction identity and amount remain paired; filters expand in place, secondary account context follows the journal.','Best for frequent reconciliation; less glanceable for long-term planning.'],
  ['commitments','Commitments and runway','Upcoming obligations and budget allocation form the main reading path; current balance is context. Show what remains after commitments using existing, truthful data only.','Emphasize due dates and remaining amounts; status uses text as well as color, with no fabricated forecast.','Phone: next commitment → available balance → allocation → activity; preserve every destination and edit state.','Best for planning; reject if the app has no obligation/allocation data.']
 ],
 booking: [
  ['selection','Selection with reassurance','Service/date/time choices lead a clear sequence; an accurate reservation summary supports selection rather than competing with it.','Readable step headings, prominent available times, quieter policy copy; reuse brand type and service assets.','Phone: choices first, summary near confirmation; keep selected values visible when returning to earlier steps.','Best for repeat booking; weaker for users who need to understand unfamiliar services.'],
  ['service','Service-led guide','Lead with existing service detail and comparison: duration, purpose and price. Booking becomes the decisive secondary region after understanding the offer.','Use service names as expressive headings and actual imagery only when available; controls remain calm and legible.','Phone: service evidence → selection → dates → summary; no decorative hero hiding the booking action.','Best for first visits; avoid lengthy storytelling when users already know their service.'],
  ['availability','Availability-led schedule','Available days and slots dominate; selecting a slot reveals service constraints and the confirmation summary alongside the schedule.','Strong day/time hierarchy, restrained unavailable states and explicit selected labels; identity comes from the schedule rhythm.','Phone: day chooser → slots → selected details; offer readable lists instead of compressing a desktop calendar.','Best when timing drives the choice; reject if the real app cannot support this selection order.']
 ]
};

export function designBrief(product, { profile, mode = 'transform', depth = mode === 'refine' ? 'polish' : 'recompose' } = {}) {
 if (!String(product).trim()) throw new Error('Specify the actual product and user task');
 if (!['create','transform','refine'].includes(mode) || !['polish','recompose','reframe'].includes(depth)) throw new Error('Use create|transform|refine and polish|recompose|reframe');
 if (mode === 'refine' && depth !== 'polish') throw new Error('REFINE requires polish depth');
 const recipe=composition(product,{profile,mode:mode==='create'?'create':depth==='polish'?'refine':'redesign'});
 const options=mode==='refine'||(mode==='transform'&&depth==='polish')?[]:(alternatives[recipe.profile] || [
  ['task','Task-led composition',recipe.composition,recipe.type,recipe.responsive,'Prefer when the main action matters more than exploring a collection.'],
  ['collection','Collection-led composition',`Make the existing collection/work itself dominant; ${recipe.goal} Move overview context into a supporting region.`,recipe.type,'Phone: retain collection identity, scan order and reachable actions; relocate supporting context rather than deleting it.','Prefer when comparing/locating existing items is the real job; reject if no meaningful collection exists.'],
  ['sequence','Decision-led sequence',`Group the existing content by the decisions needed to ${recipe.goal.toLowerCase()} Give each decision its own region rather than repeating one card grid.`,recipe.type,'Phone: preserve decision order and current selections; keep summaries adjacent to the decision they explain.','Prefer when a genuine sequence exists; do not invent steps, routes or data to fit it.']
 ]).map(([id,name,layout,type,phone,tradeoff])=>({id,name,layout,type,phone,tradeoff}));
 return { product, profile:recipe.profile, selection:recipe.selection, mode, depth, options,
  constraints:'Preserve brand, routes, content, data, APIs, handlers, auth and working flows. Reframe changes presentation/IA, not product capabilities. User constraints win.',
  choose:options.length?'Compare two or three real options against actual content/constraints; choose one or adapt/reject all with a reason. Record the dominant region, shell, type roles and phone order. Do not build multiple prototypes or combine every option.':'Use the current identity/composition; skip alternative exploration and fix the requested local weakness.',
  coverage:'For major work, map each requested screen/state to its job, lead region, supporting context and shared primitives. Implement and inspect every requested state, including tabs/dialogs at one URL; preserve observed strengths with reasons.',
  acceptance:recipe.acceptance };
}
export function formatBrief(b) {
 return [`${b.mode.toUpperCase()} / ${b.depth}: ${b.product}`,`Profile: ${b.profile} (${b.selection})`,b.constraints,...b.options.map(o=>`${o.id} — ${o.name}\nLayout: ${o.layout}\nType: ${o.type}\n${o.phone}\nTradeoff: ${o.tradeoff}`),b.choose,b.coverage].join('\n');
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 try {const {values}=parseArgs({options:{product:{type:'string'},profile:{type:'string'},mode:{type:'string',default:'transform'},depth:{type:'string'},json:{type:'boolean'}}});const b=designBrief(values.product||'',values);console.log(values.json?JSON.stringify(b,null,2):formatBrief(b));}
 catch(e){console.error(e.message);process.exitCode=64;}
}
