#!/usr/bin/env node
// Original, bounded product recipes. Read-only; no dependency or network access.
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

export const RECIPES = {
  chat: {
    terms: ['chat','chatbot','conversation','messaging','assistant'],
    goal: 'Read the conversation, compose without losing context, and find earlier work.',
    composition: 'Give the transcript the dominant region with a readable text measure. Keep history in one navigation region and composer in its own layout row. History is a searchable collection; settings is a grouped form, not another transcript.',
    type: 'Use a readable body family, comfortable message leading and restrained author labels. Differentiate senders with alignment or surface before reducing text contrast; metadata must stay readable in both themes.',
    responsive: 'Use a flexible transcript row (min-height: 0) with keyboard-reachable scrolling; composer occupies real space, not an overlay. Collapse secondary history on phone. Check short viewport, multiline draft and long history, including focus near the composer.',
    signature: 'Let message rhythm and one consistent active-state treatment establish identity; avoid decorating each message as a dashboard card.',
    acceptance: ['Last message and composer never cover each other', 'New, streaming, stopped and failed replies preserve draft and focus behavior', 'History and settings retain their controls in light and dark themes']
  },
  finance: {
    terms: ['finance','banking','invoice','ledger','accounting','budget','transaction'],
    goal: 'Understand position, compare changes, then inspect a transaction.',
    composition: 'Lead with balance plus period/comparison; follow with a trend and a full-width transaction table. Keep filters adjacent to the table; avoid equal-weight KPI cards.',
    type: 'Use the existing readable sans for controls, tabular numerals for values, right-aligned amounts and aligned decimal precision. Separate balance, section title and metadata into three visibly different roles.',
    responsive: 'Keep amount and transaction identity visible; contain remaining columns in a named keyboard-scrollable region. Do not discard financial fields.',
    signature: 'Use restrained ledger rules and a single emphasized comparison; reserve status color for meaning.',
    acceptance: ['Balance includes currency and period', 'Amounts align for comparison', 'Status is readable without color']
  },
  commerce: {
    terms: ['commerce','store','shop','product','checkout','cart','catalog'],
    goal: 'Compare products, choose a variant, and understand the total before purchase.',
    composition: 'Give product imagery a consistent aspect ratio and generous area; group name, price and choice. Detail uses media beside selection; cart exposes totals and checkout together.',
    type: 'Use expressive display type only for collection titles; keep price, variant and controls in a legible body family. Give price and availability different emphasis.',
    responsive: 'Stack media before selection; keep variant, total and purchase action reachable without overlapping content. Preserve cart state between routes.',
    signature: 'Repeat one image crop and caption treatment; let merchandise provide the color rather than competing decorative gradients.',
    acceptance: ['Prices and variants remain visible', 'Image proportions are consistent', 'Checkout total is clear before submit']
  },
  productivity: {
    terms: ['productivity','task','project','issue','helpdesk','ticket','workspace','dashboard'],
    goal: 'Locate work, understand its state, and perform the next action quickly.',
    composition: 'Use one navigation system, a compact page heading and a toolbar over the work list. Put detail in a clear secondary region; use a dashboard only when it answers a real overview question.',
    type: 'Prefer one legible sans; distinguish title, row identity and metadata by size/weight before color. Use compact row spacing with comfortable control hit areas.',
    responsive: 'Move secondary navigation into a labelled menu; keep search and the primary action visible. Let long names wrap rather than removing context.',
    signature: 'Use a consistent status rail or grouped list rhythm instead of a card around every field.',
    acceptance: ['Current location is visible', 'Search and primary action work on phone', 'Shared list and detail controls use the same treatment']
  },
  portfolio: {
    terms: ['portfolio','photography','artist','creative','studio','gallery'],
    goal: 'Understand the creator and inspect the work without decorative interference.',
    composition: 'Choose one deliberate editorial grid: a dominant project followed by contrasting smaller work. Use project detail for process and evidence; avoid identical tiles for every section.',
    type: 'Pair an expressive display face with a quiet readable body only if branding permits. Use fluid display sizes, tight heading leading and prose constrained to roughly 60 characters.',
    responsive: 'Keep reading and project order intentional when the grid stacks; constrain display type with clamp and wrap long titles.',
    signature: 'Use a distinctive caption alignment or typographic scale; preserve artwork proportions and never invent client claims.',
    acceptance: ['Work dominates decoration', 'Project hierarchy survives stacking', 'Long headings fit without clipping']
  },
  booking: {
    terms: ['booking','reservation','appointment','spa','hotel','clinic','schedule'],
    goal: 'Choose a service and time with confidence, then verify the reservation.',
    composition: 'Make selection the main column and keep a concise summary beside it. Group service, date and time in their real workflow order; confirmation repeats the actual chosen details.',
    type: 'Use a calm readable body with clearly stronger step headings. Keep date, time, duration and price legible; an optional display face belongs to service headings, not form labels.',
    responsive: 'Stack summary near submission, preserve selected values and show selected/unavailable time slots with text or icons as well as color.',
    signature: 'Use a restrained step rhythm and summary divider to reassure; do not add a second global header or decorative steps that change the flow.',
    acceptance: ['Selected slot is obvious', 'Summary matches actual values', 'Validation and confirmation remain usable by keyboard']
  },
  general: {
    terms: [], goal: 'Make the main user task immediately understandable.',
    composition: 'Choose a dominant content region, put its action nearby, and group supporting context beneath or beside it. Use one shared shell and vary composition by page purpose.',
    type: 'Start with the existing family; use three roles: page title, body/control and supporting metadata. Keep body near 16px, prose leading near 1.5 and text lines roughly 45–75 characters.',
    responsive: 'Stack by task priority; keep actions reachable, wrap text and contain wide data locally.',
    signature: 'Repeat one content-supported treatment across pages instead of adding unrelated decoration.',
    acceptance: ['Primary action is identifiable', 'Shared controls are consistent', 'Phone layout preserves content and actions']
  }
};

export function composition(product, { profile, mode = 'create' } = {}) {
  if (!['create','redesign','polish','refine'].includes(mode)) throw new Error('mode must be create, redesign, refine or polish');
  if (profile && !Object.hasOwn(RECIPES, profile)) throw new Error('Unknown profile');
  const words = String(product).toLowerCase().split(/[^a-z]+/);
  const candidates = Object.entries(RECIPES).filter(([id]) => id !== 'general').map(([id,r]) => ({ id, matches: r.terms.filter(term => words.includes(term) || words.includes(term+'s')) })).sort((a,b) => b.matches.length-a.matches.length);
  const winner = candidates[0];
  const ambiguous = winner.matches.length > 0 && candidates[1].matches.length === winner.matches.length;
  const id = profile || (winner.matches.length && !ambiguous ? winner.id : 'general');
  const { terms, ...recipe } = RECIPES[id];
  return { profile: id, selection: profile ? 'explicit' : id === 'general' ? 'fallback; specify --profile if useful' : 'keyword heuristic; verify product fit', matched: candidates.filter(c=>c.matches.length), mode,
    scope: ['polish','refine'].includes(mode) ? 'Keep identity and composition; repair observed local weaknesses.' : mode === 'redesign' ? 'Improve composition, hierarchy and shared components across affected pages. Preserve brand and all behavior; adapt existing tokens before adding new ones.' : 'Choose the composition and shared visual system before implementing pages.', ...recipe };
}
export function formatComposition(plan) {
  return [`COMPOSITION: ${plan.profile} (${plan.selection})`, `Task: ${plan.goal}`, `Scope: ${plan.scope}`, `Layout: ${plan.composition}`, `Type: ${plan.type}`, `Phone: ${plan.responsive}`, `Signature: ${plan.signature}`, `Verify: ${plan.acceptance.join('; ')}.`].join('\n');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({options:{product:{type:'string'},profile:{type:'string'},mode:{type:'string',default:'create'},json:{type:'boolean'}}});
    if (!values.product?.trim()) throw new Error('--product is required');
    const plan = composition(values.product, values);
    console.log(values.json ? JSON.stringify(plan,null,2) : formatComposition(plan));
  } catch (error) { console.error(error.message); process.exitCode=64; }
}
