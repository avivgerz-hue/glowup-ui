import test from 'node:test';
import assert from 'node:assert/strict';
import {events,filterEvents,attendance,validateRsvp,normalizeState,loadState,saveState,STORAGE_KEY} from '../public/domain.js';
const event=events[0];
const valid={name:'Taylor Park',email:'taylor@example.com',seats:2};
test('search matches venue and category, trims query, and combines status',()=>{
  assert.equal(filterEvents(events,'  glasshouse  ','upcoming').length,1);
  assert.equal(filterEvents(events,'workshop','past')[0].id,'design');
  assert.equal(filterEvents(events,'unlikely phrase').length,0);
  assert.equal(filterEvents(events,'','draft').length,1);
});
test('RSVP normalizes values, tracks seats, rejects duplicates',()=>{
  const result=validateRsvp(event,{...valid,name:' Taylor Park ',email:' TAYLOR@example.com ',seats:'2'});
  assert.equal(result.valid,true);assert.equal(result.value.email,'taylor@example.com');
  assert.equal(attendance(event,[result.value]),38);
  assert.equal(validateRsvp(event,valid,[result.value]).errors.email,'This email is already on the guest list.');
});
test('RSVP enforces capacity including current reservations',()=>{
  const small={...event,capacity:39};
  assert.equal(validateRsvp(small,{...valid,seats:3}).valid,true);
  assert.ok(validateRsvp(small,{...valid,seats:4}).errors.seats);
  assert.ok(validateRsvp(small,{...valid,email:'new@example.com'},[{...valid,eventId:event.id}]).errors.seats);
  assert.ok(validateRsvp(events[2],valid).errors.seats);
});
test('RSVP rejects invalid names, email, seat count and closed events',()=>{
  for(const seats of [0,5,1.5,NaN])assert.ok(validateRsvp(event,{...valid,seats}).errors.seats);
  assert.ok(validateRsvp(event,{...valid,name:'A',email:'not-an-email'}).errors.name);
  assert.ok(validateRsvp(event,{...valid,email:'bad@'}).errors.email);
  assert.ok(validateRsvp(events[3],valid).errors.form);
  assert.ok(validateRsvp(events[4],valid).errors.form);
});
test('state normalization discards malformed, duplicate and over-capacity responses',()=>{
  const response={...valid,eventId:event.id};
  const result=normalizeState({preferences:{theme:'broken',emailUpdates:'yes',name:'  Alex  '},responses:[null,response,response,{...response,eventId:'missing'},{...response,email:'b@example.com',seats:100}]});
  assert.equal(result.preferences.theme,'light');assert.equal(result.preferences.emailUpdates,true);
  assert.equal(result.preferences.name,'Alex');assert.equal(result.responses.length,1);
});
test('storage round trip preserves preferences and valid reservations; corrupt storage recovers',()=>{
  const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  const state=normalizeState({preferences:{theme:'dark',eventReminders:false},responses:[{...valid,eventId:event.id}]});
  saveState(storage,state);assert.deepEqual(loadState(storage),state);
  memory.set(STORAGE_KEY,'{broken');assert.equal(loadState(storage).responses.length,0);
  assert.equal(loadState({getItem(){throw Error('blocked');}}).preferences.theme,'light');
});
