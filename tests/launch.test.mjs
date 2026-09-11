import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {render} from '../src/pages.mjs';
const code=await readFile('public/launch.js','utf8');
const config=JSON.parse(await readFile('site.config.json','utf8'));
const element=(extra={})=>({handlers:{},hidden:false,disabled:false,textContent:'Send',value:'',checked:false,
  addEventListener(k,v){this.handlers[k]=v;},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},focus(){this.focused=true;},...extra});
function client({ready=true,consent=true,valid=true,endpoint='https://formspree.io/f/testform',response={ok:true,json:async()=>({ok:true})},pending}={}){
  const button=element(),status=element(),signup=element(),success=element({hidden:true}),successButton=element(),opener=element(),closer=element();
  const fields={consent:element({checked:consent}),honey:element(),email:element({value:'private@example.test'})};
  const form=element({dataset:{ready:String(ready)},action:endpoint,checkValidity:()=>valid,
    reset(){fields.email.value='';this.didReset=true;},
    querySelector:s=>s==='[type=submit]'?button:s==='[name=contact_consent]'?fields.consent:s==='[name=_gotcha]'?fields.honey:null});
  const nodes={'#launch-form':form,'#launch-status':status,'.launch-signup':signup,'.launch-success':success,'.launch-success button':successButton};
  const dialog=element({open:false,showModal(){this.open=true;},close(){this.open=false;this.handlers.close();},
    querySelector:s=>nodes[s],querySelectorAll:()=>[closer],getBoundingClientRect:()=>({left:100,right:600,top:50,bottom:700})});
  const events=[],requests=[];
  const document={documentElement:{lang:'cs',style:{overflow:'auto'}},querySelector:()=>dialog,querySelectorAll:()=>[opener],dispatchEvent:e=>events.push(e)};
  const context={document,Date,Error,AbortController,setTimeout,clearTimeout,
    FormData:class{constructor(){this.values={email:fields.email.value};}set(k,v){this.values[k]=v;}},
    CustomEvent:class{constructor(type){this.type=type;}},
    fetch:async(url,options)=>{requests.push({url,options});return pending?await pending:response;}};
  context.window=context;vm.runInNewContext(code,context);
  return {dialog,form,button,status,signup,success,opener,closer,fields,events,requests,document,
    submit:()=>form.handlers.submit({preventDefault(){}}),open:()=>opener.handlers.click({preventDefault(){}})};
}

test('localized homepage has a conditional sales date independent of certification and an honest fallback',()=>{
  for(const [lang,date] of [['cs','listopad 2026'],['en','November 2026']]){
    const html=render(lang,'home',{...config,certificationExpected:'2027-01',launchExpected:'2026-11',formspreeId:'',privacyApproved:false});
    assert.match(html,new RegExp('class="launch-date">'+date));
    assert.match(html,/id="launch-dialog"/);assert.match(html,/data-launch-open/);
    assert.match(html,/id="launch-form" data-ready="false"/);assert.match(html,/<fieldset disabled>/);
    assert.match(html,/mailto:richard@watra.cz/);assert.doesNotMatch(html,/action="https:\/\/formspree/);
    assert.doesNotMatch(html,/class="availability wrap"/);
    assert.match(html,/class="collection wrap range-collection"/);
  }
  const other=render('en','models',config);assert.doesNotMatch(other,/launch.js|id="launch-dialog"/);
});

test('ready capture requires a validated endpoint and includes explicit consent and purpose',()=>{
  const enabled={...config,privacyApproved:true,formspreeId:'testform'};
  const html=render('en','home',enabled);
  assert.match(html,/id="launch-form" data-ready="true" action="https:\/\/formspree.io\/f\/testform"/);
  assert.match(html,/name="contact_consent" type="checkbox" value="yes" required/);
  assert.match(html,/name="lead_type" value="launch_notification"/);
  assert.match(html,/name="consent_text"/);assert.match(html,/name="consent_version"/);
  assert.match(render('cs','home',{...enabled,formspreeId:'invalid/id'}),/data-ready="false"/);
});

test('popup opens only on request and restores focus and scrolling after closing',()=>{
  const c=client();assert.equal(c.dialog.open,false);
  c.open();assert.equal(c.dialog.open,true);assert.equal(c.document.documentElement.style.overflow,'hidden');
  c.closer.handlers.click();assert.equal(c.dialog.open,false);assert.equal(c.document.documentElement.style.overflow,'auto');assert.equal(c.opener.focused,true);
});

test('unavailable, invalid, unconsented and honeypot submissions never send',async()=>{
  for(const options of [{ready:false},{consent:false},{valid:false},{endpoint:'https://unexpected.test/f/testform'}]){
    const c=client(options);await c.submit();assert.equal(c.requests.length,0);
  }
  const c=client();c.fields.honey.value='bot';await c.submit();assert.equal(c.requests.length,0);
});

test('confirmed delivery clears email and sends a single event with no personal details',async()=>{
  const c=client();c.open();await c.submit();await c.submit();
  assert.equal(c.requests.length,1);assert.equal(c.form.didReset,true);assert.equal(c.success.hidden,false);assert.equal(c.signup.hidden,true);
  assert.equal(c.events.length,1);assert.deepEqual(Object.keys(c.events[0]),['type']);assert.equal(c.events[0].type,'watra:launch-interest');
  assert.match(c.requests[0].options.body.values.consent_at,/^\d{4}-\d{2}-\d{2}T/);assert.equal(c.form['aria-busy'],'false');
});

test('network, server and unacknowledged responses preserve entries and never report a lead',async()=>{
  for(const response of [{ok:false},{ok:true,json:async()=>({ok:false})},{ok:true,json:async()=>({})},{ok:true,json:async()=>({ok:true,errors:['bad']})},{ok:true,json:async()=>{throw Error('network');}}]){
    const c=client({response});await c.submit();
    assert.equal(c.fields.email.value,'private@example.test');assert.equal(c.events.length,0);assert.equal(c.success.hidden,true);assert.equal(c.button.disabled,false);
    assert.match(c.status.textContent,/nepodařilo potvrdit/);
  }
});

test('multiple clicks during one pending request cannot create duplicate submissions',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r);const c=client({pending});
  const first=c.submit();await c.submit();assert.equal(c.requests.length,1);
  resolve({ok:true,json:async()=>({ok:true})});await first;assert.equal(c.events.length,1);
});

test('popup rate limits keep the email and direct visitors to an alternative contact',async()=>{
  const c=client({response:{ok:false,status:429}});await c.submit();
  assert.match(c.status.textContent,/limitu příjmu/);assert.match(c.status.textContent,/přímý e-mail/);
  assert.equal(c.fields.email.value,'private@example.test');assert.equal(c.events.length,0);assert.equal(c.button.disabled,false);
});
