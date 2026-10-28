const root=document.querySelector('#app');
let state;try{state=JSON.parse(localStorage.getItem('chat-benchmark'));}catch{}state||={chats:[],active:null,settings:{model:'demo-balanced',theme:'light'}};
let controller=null,error='',busy=false;
const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
const save=()=>localStorage.setItem('chat-benchmark',JSON.stringify(state));
const active=()=>state.chats.find(c=>c.id===state.active);
const button=(text,action)=>{const b=el('button',text,{type:'button'});b.onclick=action;return b;};
function createChat(){state.chats.unshift({id:crypto.randomUUID(),title:'New conversation',messages:[]});state.active=state.chats[0].id;save();location.hash='chat';render();}
function render(){
 document.documentElement.dataset.theme=state.settings.theme;root.replaceChildren();const nav=el('nav',undefined,{'aria-label':'Main navigation'});
 for(const[name,hash]of [['Chat','chat'],['History','history'],['Settings','settings']]){const a=el('a',name,{href:'#'+hash});if(location.hash==='#'+hash)a.setAttribute('aria-current','page');nav.append(a);}
 nav.append(button('New chat',()=>{if(!busy)createChat();}));root.append(nav);const main=el('main');root.append(main);
 const page=location.hash.slice(1)||'chat';
 if(page==='settings'){
  main.append(el('h1','Settings'));
  for(const[key,label,options]of [['model','Model',['demo-balanced','demo-fast']],['theme','Theme',['light','dark']]]){
   const wrapper=el('label',label),select=el('select',undefined,{name:key,'aria-label':label});for(const value of options){const o=el('option',value,{value});o.selected=state.settings[key]===value;select.append(o);}select.onchange=()=>{state.settings[key]=select.value;save();document.documentElement.dataset.theme=state.settings.theme;};wrapper.append(select);main.append(wrapper);
  }main.append(el('p','Local deterministic test provider. No real AI service is connected.'));return;
 }
 if(page==='history'){
  main.append(el('h1','Conversation history'));const search=el('input',undefined,{type:'search','aria-label':'Search conversations'}),list=el('ul',undefined,{class:'history'});
  const draw=()=>{list.replaceChildren();const chats=state.chats.filter(c=>c.title.toLowerCase().includes(search.value.toLowerCase()));if(!chats.length)list.append(el('li','No conversations found.'));
   for(const chat of chats){const row=el('li'),label=el('label','Rename conversation'),name=el('input',undefined,{type:'text','aria-label':`Rename ${chat.title}`});name.value=chat.title;label.append(name);
    row.append(button(chat.title,()=>{state.active=chat.id;save();location.hash='chat';}),label,button('Save name',()=>{chat.title=name.value.trim()||chat.title;save();draw();}),button('Delete conversation',()=>{if(busy&&state.active===chat.id)return;state.chats=state.chats.filter(c=>c.id!==chat.id);if(state.active===chat.id)state.active=null;save();draw();}));list.append(row);}
  };search.oninput=draw;main.append(search,list);draw();return;
 }
 const chat=active();main.append(el('h1',chat?.title||'New conversation'));const messages=el('section',undefined,{class:'messages','aria-label':'Messages'});
 if(!chat?.messages.length)messages.append(el('p','Start a conversation. Your history stays on this device.'));
 for(const m of chat?.messages||[]){const a=el('article');a.append(el('strong',m.role==='user'?'You':'Assistant'),el('p',m.content||'Thinking…'));messages.append(a);}main.append(messages,el('p',busy?'Generating response…':'Ready',{role:'status'}));
 if(error)main.append(el('p',error,{role:'alert',class:'error'}));
 const form=el('form'),label=el('label','Message'),input=el('textarea',undefined,{name:'message',required:''}),send=el('button','Send',{type:'submit'}),stop=button('Stop response',()=>controller?.abort());label.append(input);input.disabled=busy;send.disabled=busy;stop.hidden=!busy;form.append(label,send,stop);
 form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(value&&!busy)sendMessage(value);};input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}};
 main.append(form,el('small','Enter sends. Shift+Enter adds a line. Test failure: send /error.'));
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
