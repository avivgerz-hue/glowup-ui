export const STORAGE_KEY = 'gather.workspace.v1';
export const events = [
  {id:'harvest',title:'The autumn table',category:'Community',status:'upcoming',date:'2026-11-14',time:'18:30',end:'21:30',venue:'The Glasshouse',location:'48 Garden Street, Brooklyn',capacity:48,attending:36,color:'peach',icon:'table',description:'Good food, familiar faces, and a few new friends. Join us for a seasonal, family-style supper made by our neighborhood chefs.',host:'Sofia Chen',note:'A seasonal three-course dinner. Vegetarian options available.'},
  {id:'studio',title:'Make a little space',category:'Workshop',status:'upcoming',date:'2026-11-18',time:'10:00',end:'12:00',venue:'Studio Twenty',location:'20 Franklin Avenue, Brooklyn',capacity:24,attending:18,color:'lavender',icon:'vase',description:'A slow morning of clay, coffee, and creative exploration. Make a small ceramic object with artist Maya Ellis. All levels welcome.',host:'Maya Ellis',note:'All materials and coffee included. Wear something you can get a little messy.'},
  {id:'founders',title:'Ideas after hours',category:'Networking',status:'upcoming',date:'2026-11-21',time:'18:00',end:'20:30',venue:'Common Ground',location:'112 Wythe Avenue, Brooklyn',capacity:60,attending:60,color:'green',icon:'spark',description:'An easygoing evening for people building things. Trade stories, meet collaborators, and leave with a little fresh perspective.',host:'Alex Morgan',note:'Light bites and non-alcoholic drinks provided.'},
  {id:'winter',title:'A very merry gathering',category:'Celebration',status:'draft',date:'2026-12-05',time:'19:00',end:'23:00',venue:'The Glasshouse',location:'48 Garden Street, Brooklyn',capacity:80,attending:0,color:'rose',icon:'star',description:'Our end-of-year celebration is coming together. A little music, a little sparkle, and a toast to everything we made possible.',host:'Alex Morgan',note:'Details are still being finalized. This event is not accepting RSVPs yet.'},
  {id:'walk',title:'Sunday, outside',category:'Community',status:'past',date:'2026-11-01',time:'09:00',end:'11:00',venue:'Prospect Park',location:'Grand Army Plaza entrance, Brooklyn',capacity:30,attending:26,color:'yellow',icon:'sun',description:'A gentle neighborhood walk, a warm drink, and time to reconnect under the changing leaves.',host:'Sofia Chen',note:'This event has ended. Thanks for joining us!'},
  {id:'design',title:'Small ideas, big things',category:'Workshop',status:'past',date:'2026-10-24',time:'14:00',end:'16:00',venue:'Studio Twenty',location:'20 Franklin Avenue, Brooklyn',capacity:24,attending:22,color:'blue',icon:'spark',description:'A collaborative design session exploring the everyday ideas that make our neighborhood a little better.',host:'Maya Ellis',note:'This event has ended.'}
];
export const guests = [
  {id:1,name:'Jamie Rivera',email:'jamie.rivera@example.com',event:'harvest',status:'Confirmed',initials:'JR',color:'lavender'},
  {id:2,name:'Priya Shah',email:'priya.shah@example.com',event:'harvest',status:'Confirmed',initials:'PS',color:'peach'},
  {id:3,name:'Oliver James',email:'oliver.j@example.com',event:'studio',status:'Confirmed',initials:'OJ',color:'green'},
  {id:4,name:'Emma Wilson',email:'emma.w@example.com',event:'harvest',status:'Invited',initials:'EW',color:'rose'},
  {id:5,name:'Noah Kim',email:'noah.kim@example.com',event:'founders',status:'Confirmed',initials:'NK',color:'blue'},
  {id:6,name:'Isabella Rossi',email:'isabella.r@example.com',event:'studio',status:'Invited',initials:'IR',color:'yellow'},
  {id:7,name:'Theo Brooks',email:'theo.b@example.com',event:'founders',status:'Confirmed',initials:'TB',color:'peach'},
  {id:8,name:'Amara Okafor',email:'amara.o@example.com',event:'harvest',status:'Declined',initials:'AO',color:'green'}
];
export const defaultPreferences = {theme:'light',emailUpdates:true,eventReminders:true,workspace:'Gather community',name:'Alex Morgan'};
export function filterEvents(items, query='', status='all') {
  const q=query.trim().toLowerCase();
  return items.filter(e => (status==='all'||e.status===status) && `${e.title} ${e.category} ${e.venue}`.toLowerCase().includes(q));
}
export function attendance(event, responses=[]) {
  return event.attending + responses.filter(r=>r.eventId===event.id).reduce((sum,r)=>sum+r.seats,0);
}
export function validateRsvp(event, input, responses=[]) {
  const errors={};
  const name=String(input.name||'').trim();
  const email=String(input.email||'').trim().toLowerCase();
  const seats=Number(input.seats);
  if(name.length<2 || name.length>80) errors.name='Enter a name between 2 and 80 characters.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email='Enter a valid email address.';
  if(!Number.isInteger(seats)||seats<1||seats>4) errors.seats='Choose between 1 and 4 seats.';
  else if(attendance(event,responses)+seats>event.capacity) errors.seats='There aren’t enough places left for this reservation.';
  if(event.status!=='upcoming') errors.form='This event is not accepting RSVPs.';
  if(responses.some(r=>r.eventId===event.id&&r.email.toLowerCase()===email)) errors.email='This email is already on the guest list.';
  return {valid:Object.keys(errors).length===0,errors,value:{name,email,seats,eventId:event.id}};
}
export function normalizeState(raw) {
  const source=raw&&typeof raw==='object'?raw:{};
  const p=source.preferences&&typeof source.preferences==='object'?source.preferences:{};
  const preferences={
    theme:['light','dark','system'].includes(p.theme)?p.theme:'light',
    emailUpdates:typeof p.emailUpdates==='boolean'?p.emailUpdates:true,
    eventReminders:typeof p.eventReminders==='boolean'?p.eventReminders:true,
    workspace:typeof p.workspace==='string'&&p.workspace.trim()?p.workspace.trim().slice(0,60):defaultPreferences.workspace,
    name:typeof p.name==='string'&&p.name.trim()?p.name.trim().slice(0,80):defaultPreferences.name
  };
  const responses=[];
  for(const entry of Array.isArray(source.responses)?source.responses:[]) {
    if(!entry||typeof entry!=='object')continue;
    const event=events.find(e=>e.id===entry.eventId);
    if(!event)continue;
    const result=validateRsvp(event,entry,responses);
    if(result.valid)responses.push(result.value);
  }
  return {preferences,responses};
}
export function loadState(storage) {
  try{return normalizeState(JSON.parse(storage.getItem(STORAGE_KEY)));}catch{return normalizeState(null);}
}
export function saveState(storage,state) {storage.setItem(STORAGE_KEY,JSON.stringify(normalizeState(state)));}
