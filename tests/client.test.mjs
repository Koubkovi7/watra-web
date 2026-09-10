import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile('public/app.js','utf8');
function element(extra={}) {
  return {hidden:true,value:'',checked:false,disabled:false,dataset:{},handlers:{},innerHTML:'Send',textContent:'',style:{},
    addEventListener(n,f){this.handlers[n]=f;},getAttribute(n){return this[n]??null;},setAttribute(n,v){this[n]=v;},
    focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;},...extra};
}
const tick=()=>new Promise(r=>setImmediate(r));
async function client({host='watra.cz',stored,ids={},formReady,reply={ok:true},httpOK=true,search='',modelValue='IRIKON +e',launchForm=false}={}) {
  const scripts=[],storage=new Map(stored?[['watra_consent',JSON.stringify({...stored,version:1,at:Date.now()})]]:[]);
  const analytics=element(),marketing=element(),dialog=element({querySelector:s=>s.includes('analytics')?analytics:marketing});
  const buttons=['reject','all','save'].map(consent=>element({dataset:{consent}})),settings=element();
  let sent=0,reloaded=0;
  const fields={lead_type:element({value:'manufacturer'}),model:element({value:modelValue}),_gotcha:element(),submit:element(),status:element(),company:element({querySelectorAll:()=>[]})};
  const form=formReady===undefined?null:element({
    dataset:{ready:String(formReady)},action:'https://formspree.io/f/abcdefgh',checkValidity:()=>true,reset(){this.didReset=true;},
    querySelector:s=>s.includes('lead_type')?fields.lead_type:s.includes('model')?fields.model:s.includes('company-fields')?fields.company:s.includes('_gotcha')?fields._gotcha:s.includes('submit')?fields.submit:null
  });
  const documentEvents={};
  const document={
    documentElement:{lang:'cs'},body:{dataset:{page:form?'contact':'home'}},cookie:'',referrer:'',
    head:{append:s=>scripts.push(s)},createElement:()=>({}),addEventListener(n,f){documentEvents[n]=f;},
    querySelector:s=>s==='#cookie-dialog'?dialog:s==='#interest-form'?form:s==='#form-status'?fields.status:s==='#launch-form'&&launchForm?element():null,
    querySelectorAll:s=>s==='[data-cookie-settings]'?[settings]:s==='[data-consent]'?buttons:[],
  };
  const context={document,URL,URLSearchParams,Date,JSON,Object,String,Number,RegExp,Promise,
    location:{hostname:host,origin:'https://'+host,pathname:'/cs/',protocol:'https:',search,reload:()=>reloaded++},
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},setTimeout,clearTimeout,AbortController,
    FormData:class{constructor(){this.values={};}set(k,v){this.values[k]=v;}},
    fetch:async url=>url==='/site-config.json'?{ok:true,json:async()=>({analyticsHosts:['watra.cz'],...ids})}:(sent++,{ok:httpOK,json:async()=>reply})
  };
  context.window=context;vm.runInNewContext(code,context);await tick();
  return {context,scripts,dialog,buttons,settings,analytics,marketing,form,fields,storage,documentEvents,sent:()=>sent,reloaded:()=>reloaded,
    submit:async()=>{await form.handlers.submit({preventDefault(){}});await tick();}};
}
test('unconfigured preview loads no optional scripts and no automatic banner',async()=>{
  const c=await client();assert.equal(c.scripts.length,0);assert.ok(!c.dialog.open);
});
test('tracking starts only after consent and is blocked on preview hosts',async()=>{
  const ids={gtmId:'GTM-ABC123',clarityId:'abcdef'};
  const c=await client({ids});assert.equal(c.scripts.length,0);assert.equal(c.dialog.open,true);
  c.buttons[0].handlers.click();assert.equal(c.scripts.length,0);
  c.buttons[1].handlers.click();assert.equal(c.scripts.length,2);
  assert.match(c.scripts[0].src,/googletagmanager/);assert.match(c.scripts[1].src,/clarity/);
  const p=await client({host:'watra-web.pages.dev',ids,stored:{analytics:true,marketing:true}});assert.equal(p.scripts.length,0);
});
test('revocation persists denied consent and reloads optional code out of the page',async()=>{
  const c=await client({ids:{gtmId:'GTM-ABC123'},stored:{analytics:true,marketing:true}});
  c.buttons[0].handlers.click();assert.equal(c.reloaded(),1);
  assert.equal(JSON.parse(c.storage.get('watra_consent')).analytics,false);
});
test('Clarity does not record the contact form',async()=>{
  const c=await client({ids:{clarityId:'abcdef'},stored:{analytics:true},formReady:true});assert.equal(c.scripts.length,0);
});

test('launch form excludes Clarity while lead analytics respects consent and omits personal data',async()=>{
  for(const allowed of [false,true]){
    const c=await client({launchForm:true,ids:{clarityId:'abcdef',gtmId:'GTM-ABC123'},stored:{analytics:allowed,marketing:false}});
    assert.equal(c.scripts.filter(s=>s.src.includes('clarity')).length,0);
    c.documentEvents['watra:launch-interest']();
    const leads=(c.context.dataLayer||[]).filter(v=>v.event==='generate_lead');
    assert.equal(leads.length,allowed?1:0);
    if(allowed){assert.equal(leads[0].lead_type,'launch_notification');assert.deepEqual(Object.keys(leads[0]).sort(),['event','language','lead_type','page_location','page_path'].sort());}
  }
});
test('disabled form cannot submit, including an attempted keyboard submission',async()=>{
  const c=await client({formReady:false});await c.submit();assert.equal(c.sent(),0);
});

test('current and legacy product links select the renamed hybrid model',async()=>{
  for(const search of ['?model=IRIKON%20%2Be','?model=IRIKON%20e','?model=IRIKON+e']) {
    const c=await client({formReady:false,search,modelValue:'undecided'});
    assert.equal(c.fields.model.value,'IRIKON +e',search);
  }
});
test('a confirmed success generates one lead without form contents; repeat submission is blocked',async()=>{
  const c=await client({formReady:true,ids:{gtmId:'GTM-ABC123'},stored:{analytics:true,marketing:true}});
  await c.submit();await c.submit();assert.equal(c.sent(),1);
  const leads=c.context.dataLayer.filter(v=>v.event==='generate_lead');assert.equal(leads.length,1);
  assert.equal(leads[0].item_id,'irikon-e');
  assert.deepEqual(Object.keys(leads[0]).sort(),['event','item_id','language','lead_type','page_location','page_path'].sort());
  assert.equal(c.form.didReset,true);assert.equal(c.fields.submit.disabled,true);
});
test('failed delivery keeps entries and never generates a lead',async()=>{
  const c=await client({formReady:true,httpOK:false,ids:{gtmId:'GTM-ABC123'},stored:{analytics:true}});
  await c.submit();assert.equal(c.sent(),1);assert.ok(!c.form.didReset);assert.equal(c.fields.submit.disabled,false);
  assert.equal(c.context.dataLayer.filter(v=>v.event==='generate_lead').length,0);
  assert.match(c.fields.status.textContent,/nepodařilo potvrdit/);
});
