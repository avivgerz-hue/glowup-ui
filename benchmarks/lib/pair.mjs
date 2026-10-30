// Pair preparation verification and native CLI event metrics. No model simulation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { hashDir } from '../../lib/install.mjs';
export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
export function pairFromManifest(file, kind, {conditions=['without','with']}={}) {
  if(conditions.length!==2||new Set(conditions).size!==2||conditions.some(c=>!['without','with','control','baseline','candidate'].includes(c))) throw new Error('Select two distinct supported conditions');
  const root = path.dirname(path.resolve(file));
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cases = conditions.map(condition => manifest.cases.find(c => c.kind === kind && c.condition === condition));
  if (cases.some(c => !c)) throw new Error('Need one cell for each selected condition in the comparison manifest');
  const pair = cases.map(c => {
    const task = fs.readFileSync(path.join(root, `${kind}-${c.condition}.task.txt`), 'utf8');
    if (sha(task) !== c.taskHash) throw new Error('Task changed after preparation');
    const installed = path.join(c.project, '.agents/skills/glowup-ui');
    const treatment=['with','baseline','candidate'].includes(c.condition);
    if(treatment&&!c.skillHash) throw new Error('Treatment payload hash required');
    if (treatment ? hashDir(installed) !== c.skillHash : (fs.existsSync(installed)||fs.existsSync(path.join(c.project,'.claude/skills/glowup-ui')))) throw new Error('Skill payload changed or baseline contaminated');
    if (treatment && hashDir(path.join(c.project,'.claude/skills/glowup-ui')) !== c.skillHash) throw new Error('Claude and Codex payloads differ');
    const appHash=applicationHash(c.project);
    if(c.appHash&&c.appHash!==appHash) throw new Error('Starting application changed after preparation');
    return {...c, task, appHash};
  });
  if (pair[0].task !== pair[1].task || pair[0].appHash !== pair[1].appHash) throw new Error('Starting applications or task specifications differ');
  return pair;
}
export function applicationHash(dir) {
  const entries=[];
  function walk(root, rel='') {
    for (const e of fs.readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      if (!rel && ['.git','.agents','.claude','node_modules'].includes(e.name)) continue;
      const sub=path.join(rel,e.name), full=path.join(root,e.name);
      if (e.isSymbolicLink()) throw new Error('Symlinks need manual comparison');
      if(e.isDirectory()) walk(full,sub); else entries.push([sub.split(path.sep).join('/'),sha(fs.readFileSync(full))]);
    }
  }
  walk(dir);return sha(JSON.stringify(entries));
}
export function agentCommand(agent, bin, model, effort, project, task, condition) {
  if(!['claude','codex'].includes(agent)) throw new Error('agent must be claude or codex');
  if(!model || !effort) throw new Error('Pin model and effort explicitly');
  const prompt=(condition==='with'?(agent==='claude'?'/glowup-ui\n':'$glowup-ui\n'):'')+task;
  const args=agent==='codex'
    ? ['exec','--ephemeral','--sandbox','workspace-write','--cd',project,'--model',model,'-c',`model_reasoning_effort=${JSON.stringify(effort)}`,'--json','--color','never','-']
    : ['--print','--no-session-persistence','--model',model,'--effort',effort,'--permission-mode','default','--output-format','stream-json','--verbose','--',prompt];
  return {bin:bin||agent,args,stdin:agent==='codex'?prompt:'',cwd:project};
}
export function codexMetrics(text, canonical='') {
  const events=text.split(/\r?\n/).flatMap(l=>{try{return [JSON.parse(l)];}catch{return [];}});
  const completed=events.some(e=>e.type==='turn.completed')&&!events.some(e=>e.type==='turn.failed');
  const items=events.filter(e=>e.type==='item.completed').map(e=>e.item);
  const calls=items.filter(i=>['command_execution','mcp_tool_call','web_search','file_change'].includes(i?.type));
  const evidence=items.filter(i=>i?.type==='command_execution'&&i.exit_code===0&&/skills[\\/]glowup-ui[\\/]SKILL\.md/.test(i.command||'')&&canonical&&String(i.aggregated_output||'').includes(canonical));
  const usage=events.filter(e=>e.type==='turn.completed').at(-1)?.usage;
  return {completed,toolCalls:calls.length,tokens:usage??null,iterations:null,skill:{invoked:evidence.length>0,activationEvidence:evidence.map(i=>({id:i.id,kind:'full-body-delivered'})),interpretation:'Conservative full-body delivery only; workflow influence needs review. Missing evidence is unconfirmed.'}};
}
export function blocker(text) {
  if(/HTTP CONNECT.*403|proxy.*403|blocked.*policy/i.test(text)) return 'blocked-network';
  if(/access token could not be refreshed|Please sign in again|not logged in|Invalid API key|Please run.*login|authentication_required|401 Unauthorized/i.test(text)) return 'blocked-auth';
  return null;
}

// Application text and tool output can discuss login failures. Only native
// error events establish a provider failure; never scan every stdout message.
export function eventBlocker(event) {
  if (event?.type === 'error' || event?.type === 'turn.failed' ||
      (event?.type === 'result' && event.is_error)) return blocker(JSON.stringify(event));
  return null;
}
