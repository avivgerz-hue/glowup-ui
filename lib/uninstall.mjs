// Reversible removal: move only a named Glowup payload out of discovery paths.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { targetDir, resolveTargets, SKILL_SOURCE, ensureWithin } from './install.mjs';
import { parseSkillFile } from './frontmatter.mjs';

export function uninstall({agent='all',dest,scope='user',project=process.cwd(),home=os.homedir(),codexLegacy=false,dryRun=false,...rest}={}) {
  let targets=dest?['custom']:resolveTargets(agent);
  if(codexLegacy)targets=targets.map(t=>t==='agents'?'codex-legacy':t);
  // Plan all targets first; refuse ambiguous content before moving anything.
  const plans=targets.map(target=>{
    const dir=targetDir({target,dest,scope,project,home,...rest});
    if(scope==='project'&&target!=='custom')ensureWithin(project,path.dirname(dir));
    let stat;try{stat=fs.lstatSync(dir);}catch(e){if(e.code==='ENOENT')return {dir,action:'absent'};throw e;}
    if(!stat.isSymbolicLink()&&fs.realpathSync(dir)===fs.realpathSync(SKILL_SOURCE))throw new Error('Refusing to remove the canonical source');
    let name;try{name=parseSkillFile(fs.readFileSync(path.join(dir,'SKILL.md'),'utf8')).data.name;}catch{}
    if(name!=='glowup-ui')throw new Error(`Cannot identify Glowup payload at ${dir}; inspect it manually. Nothing moved.`);
    const backup=path.join(scope==='project'?path.resolve(project):home,'.glowup-ui','backups',`removed-${target}-${crypto.randomUUID()}`,'glowup-ui');
    ensureWithin(scope==='project'?project:home,backup);
    return {dir,backup,action:'remove'};
  });
  if(!dryRun)for(const p of plans)if(p.action==='remove'){fs.mkdirSync(path.dirname(p.backup),{recursive:true});fs.renameSync(p.dir,p.backup);}
  return plans.map(p=>({...p,dryRun}));
}
