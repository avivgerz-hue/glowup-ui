const root=document.querySelector('#app');
let state;try{state=JSON.parse(localStorage.getItem('chat-benchmark'));}catch{}state||={chats:[],active:null,settings:{model:'demo-balanced',theme:'light'}};
let controller=null,error='',busy=false;
const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
const save=()=>localStorage.setItem('chat-benchmark',JSON.stringify(state));
const active=()=>state.chats.find(c=>c.id===state.active);
const button=(text,action)=>{const b=el('button',text,{type:'button'});b.onclick=action;return b;};
function createChat(){state.chats.unshift({id:crypto.randomUUID(),title:'New conversation',messages:[]});state.active=state.chats[0].id;save();location.hash='chat';render();}
const icons={chat:'M4 5h16v11H9l-5 4V5Z',history:'M4 7v5h5 M4 12a8 8 0 1 0 2-6 M12 7v5l3 2',settings:'M5 7h14 M5 17h14 M9 4v6 M15 14v6',plus:'M12 5v14 M5 12h14',arrow:'M5 12h14 M13 6l6 6-6 6',spark:'m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z',search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0'};
function icon(name){const n=el('span',undefined,{class:'icon','aria-hidden':'true'});n.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[name]||icons.chat}"/></svg>`;return n;}
function pageHeader(main,eyebrow,title,description){const header=el('header',undefined,{class:'page-header'});header.append(el('span',eyebrow,{class:'eyebrow'}),el('h1',title));if(description)header.append(el('p',description,{class:'page-description'}));main.append(header);return header;}
function render(){
 document.documentElement.dataset.theme=state.settings.theme;root.replaceChildren();
 const page=location.hash.slice(1)||'chat';const shell=el('div',undefined,{class:'app-shell'}),sidebar=el('aside',undefined,{class:'sidebar'});
 const brand=el('div',undefined,{class:'brand'});brand.append(icon('spark'),el('span','Chat'),el('span','WORKSPACE',{class:'brand-caption'}));sidebar.append(brand);
 const newChat=button('New chat',()=>{if(!busy)createChat();});newChat.prepend(icon('plus'));newChat.className='new-chat';newChat.disabled=busy;sidebar.append(newChat);
 const nav=el('nav',undefined,{'aria-label':'Main navigation'});
 for(const[name,hash]of [['Chat','chat'],['History','history'],['Settings','settings']]){const a=el('a',undefined,{href:'#'+hash});a.append(icon(hash),el('span',name));if(page===hash)a.setAttribute('aria-current','page');nav.append(a);}sidebar.append(nav);
 const recent=el('section',undefined,{class:'recent','aria-label':'Recent conversations'});recent.append(el('span','RECENT CONVERSATIONS',{class:'eyebrow'}));
 if(!state.chats.length)recent.append(el('p','Your conversations will appear here.',{class:'sidebar-hint'}));
 for(const chat of state.chats.slice(0,5)){const link=el('a',undefined,{href:'#chat','aria-label':`Open ${chat.title}`});link.append(icon('chat'),el('span',chat.title));link.onclick=()=>{state.active=chat.id;save();if(page==='chat')render();};if(state.active===chat.id)link.className='recent-current';recent.append(link);}sidebar.append(recent);
 const privacy=el('div',undefined,{class:'sidebar-footer'});privacy.append(el('span','LOCAL WORKSPACE',{class:'eyebrow'}),el('p','Your history stays on this device.'),el('small','Deterministic test provider'));sidebar.append(privacy);shell.append(sidebar);
 const workspace=el('div',undefined,{class:'workspace'}),topbar=el('div',undefined,{class:'workspace-bar'});topbar.append(el('span','Workspace'),el('span','/',{class:'breadcrumb-separator'}),el('strong',page==='history'?'History':page==='settings'?'Settings':'Conversation'),el('span','ON THIS DEVICE',{class:'device-label'}));workspace.append(topbar);
 const main=el('main',undefined,{class:`page page-${page==='history'||page==='settings'?page:'chat'}`});workspace.append(main);shell.append(workspace);root.append(shell);
 if(page==='settings'){
  pageHeader(main,'MAKE IT YOURS','Settings','A workspace that feels right for you.');
  const panel=el('section',undefined,{class:'settings-panel','aria-label':'Workspace preferences'});
  for(const[key,label,options]of [['model','Model',['demo-balanced','demo-fast']],['theme','Theme',['light','dark']]]){
   const row=el('div',undefined,{class:'setting-row'}),text=el('div',undefined,{class:'setting-description'});text.append(el('h2',key==='model'?'Response model':'Appearance'),el('p',key==='model'?'Choose the local test model for your conversations.':'Choose a light or dark workspace.'));
   const wrapper=el('label',label),select=el('select',undefined,{name:key,'aria-label':label});for(const value of options){const o=el('option',value,{value});o.selected=state.settings[key]===value;select.append(o);}select.onchange=()=>{state.settings[key]=select.value;save();document.documentElement.dataset.theme=state.settings.theme;};wrapper.append(select);row.append(text,wrapper);panel.append(row);
  }
  const note=el('div',undefined,{class:'provider-note'});note.append(icon('spark'),el('p','Local deterministic test provider. No real AI service is connected.'));main.append(panel,note);return;
 }
 if(page==='history'){
  pageHeader(main,'PICK UP WHERE YOU LEFT OFF','Conversation history','Good ideas deserve a place to come back to.');
  const toolbar=el('div',undefined,{class:'history-toolbar'}),searchWrap=el('div',undefined,{class:'search-field'}),search=el('input',undefined,{type:'search','aria-label':'Search conversations',placeholder:'Search conversations'}),list=el('ul',undefined,{class:'history'}),count=el('span','',{class:'result-count'});searchWrap.append(icon('search'),search);toolbar.append(searchWrap,count);
  const draw=()=>{list.replaceChildren();const chats=state.chats.filter(c=>c.title.toLowerCase().includes(search.value.toLowerCase()));count.textContent=`${chats.length} conversation${chats.length===1?'':'s'}`;if(!chats.length){const empty=el('li','No conversations found.',{class:'history-empty'});empty.prepend(icon('history'));list.append(empty);}
   for(const chat of chats){const row=el('li',undefined,{class:'history-entry'}),heading=el('div',undefined,{class:'history-title'}),open=button(chat.title,()=>{state.active=chat.id;save();location.hash='chat';});open.className='conversation-link';heading.append(icon('chat'),open,el('span',`${chat.messages.length} messages`,{class:'message-count'}));
    const preview=el('p',chat.messages.at(-1)?.content||'New conversation',{class:'conversation-preview'}),editor=el('div',undefined,{class:'history-editor'}),label=el('label','Rename conversation'),name=el('input',undefined,{type:'text','aria-label':`Rename ${chat.title}`});name.value=chat.title;label.append(name);
    const saveName=button('Save name',()=>{chat.title=name.value.trim()||chat.title;save();draw();}),remove=button('Delete conversation',()=>{if(busy&&state.active===chat.id)return;state.chats=state.chats.filter(c=>c.id!==chat.id);if(state.active===chat.id)state.active=null;save();draw();});saveName.className='secondary-button';remove.className='danger-button';editor.append(label,saveName,remove);row.append(heading,preview,editor);list.append(row);}
  };search.oninput=draw;main.append(toolbar,list);draw();return;
 }
 const chat=active();pageHeader(main,chat?.messages.length?'YOUR CONVERSATION':'A LITTLE SPACE TO THINK',chat?.title||'New conversation',!chat?.messages.length?'Start a conversation. Your history stays on this device.':null);
 const messages=el('section',undefined,{class:'messages','aria-label':'Messages',tabindex:'0'});
 if(!chat?.messages.length){const welcome=el('div',undefined,{class:'welcome-mark','aria-hidden':'true'});welcome.append(icon('spark'));messages.append(welcome);}
 for(const m of chat?.messages||[]){const a=el('article',undefined,{class:`message message-${m.role}`}),author=el('strong',m.role==='user'?'You':'Assistant',{class:'message-author'});author.prepend(icon(m.role==='user'?'chat':'spark'));a.append(author,el('p',m.content||'Thinking…'));messages.append(a);}main.append(messages);
 const composer=el('div',undefined,{class:'composer-region'}),status=el('p',busy?'Generating response…':'Ready',{role:'status',class:'response-status'});composer.append(status);
 if(error)composer.append(el('p',error,{role:'alert',class:'error'}));
 const form=el('form',undefined,{class:'composer'}),label=el('label','Message'),input=el('textarea',undefined,{name:'message',required:'',placeholder:'What’s on your mind?'}),send=el('button','Send',{type:'submit',class:'send-button'}),stop=button('Stop response',()=>controller?.abort());send.append(icon('arrow'));stop.className='stop-button';label.append(input);input.disabled=busy;send.disabled=busy;stop.hidden=!busy;form.append(label,send,stop);
 form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(value&&!busy)sendMessage(value);};input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}};
 composer.append(form,el('small','Enter sends. Shift+Enter adds a line. Test failure: send /error.',{class:'composer-hint'}));main.append(composer);
}
async function sendMessage(text){
 if(!active()){state.chats.unshift({id:crypto.randomUUID(),title:'New conversation',messages:[]});state.active=state.chats[0].id;}
 const chat=active();if(!chat.messages.length)chat.title=text.slice(0,48);chat.messages.push({role:'user',content:text});const outgoing=chat.messages.map(m=>({...m})),reply={role:'assistant',content:''};chat.messages.push(reply);busy=true;error='';controller=new AbortController();save();render();
 try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:outgoing,model:state.settings.model}),signal:controller.signal});if(!response.ok)throw new Error('Response failed. Your message is saved; you can send it again.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let pending='';while(true){const{value,done}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});const lines=pending.split('\n');pending=lines.pop();for(const line of lines)if(line)reply.content+=JSON.parse(line).text;if(active()===chat&&(!location.hash||location.hash==='#chat')){const text=document.querySelector('.messages article:last-child p');if(text)text.textContent=reply.content;}}
 }catch(e){if(e.name==='AbortError')reply.content+=' [Stopped]';else{error=e.message;chat.messages.splice(chat.messages.indexOf(reply),1);}}
 finally{busy=false;controller=null;save();render();document.querySelector('textarea')?.focus();}
}
addEventListener('hashchange',render);render();
