import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {handleRequest} from '../services/forms/worker.mjs';
import {teaserConsent,teaserConsentVersion,renderTeaser} from '../src/teaser.mjs';

const schema=await readFile('services/forms/migrations/0001_enquiries.sql','utf8');
const config=JSON.parse(await readFile('site.config.json','utf8'));
function database(){
  const sql=new DatabaseSync(':memory:');sql.exec(schema);
  return {sql,prepare(query){return {bind(...args){return {
    async first(){return sql.prepare(query).get(...args) || null;},
    async all(){return {results:sql.prepare(query).all(...args)};},
    async run(){return {success:true,meta:sql.prepare(query).run(...args)};}
  };},async first(){return sql.prepare(query).get() || null;},async all(){return {results:sql.prepare(query).all()};}};}};
}
function context(overrides={}){
  const DB=database(),env={DB,PUBLIC_ENABLED:'true',TURNSTILE_SECRET:'private-test-value',CRM_SYNC_SECRET:'a'.repeat(64),RATE_SALT:'b'.repeat(64),ALLOWED_ORIGINS:'https://watra.cz',...overrides};
  const verified={success:true,hostname:'watra.cz',action:'enquiry'};
  let calls=0;
  const dependencies={fetch:async()=>{calls++;return Response.json(verified);}};
  const record=()=>({email:'visitor@example.test',phone:'+420 721 123 456',lead_type:'project_update',language:'cs',source_page:'/cs/',contact_consent:'yes',consent_version:teaserConsentVersion,consent_text:teaserConsent.cs,'cf-turnstile-response':'one-use-test-token',_request_id:crypto.randomUUID()});
  const request=(data,extra={})=>new Request('https://watra.cz/api/watra/enquiries',{method:'POST',headers:{Origin:'https://watra.cz',Accept:'application/json','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10',...extra},body:JSON.stringify(data)});
  return {env,DB,verified,dependencies,record,request,calls:()=>calls,send:data=>handleRequest(request(data),env,dependencies)};
}

test('teaser contact is acknowledged only after durable storage with consent receipt',async()=>{
  const c=context(),data=c.record(),response=await c.send(data);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,request_id:data._request_id});
  const saved=c.DB.sql.prepare('SELECT * FROM enquiries').get(),payload=JSON.parse(saved.payload);
  assert.equal(payload.phone,data.phone);assert.equal(payload.email,data.email);assert.equal(payload.consent_text,teaserConsent.cs);
  assert.equal(payload.consent_at,saved.received_at);assert.equal(saved.notification_state,'pending');
  assert.ok(!saved.payload.includes('192.0.2.10'));assert.ok(!saved.payload.includes('private-test-value'));assert.ok(!saved.payload.includes('one-use-test-token'));
});

test('both language forms carry required phone and the exact versioned consent',async()=>{
  for(const lang of ['cs','en']){
    const c=context(),data={...c.record(),language:lang,source_page:'/'+lang+'/',consent_text:teaserConsent[lang]};
    const html=renderTeaser(lang,{...config,teaserFormEnabled:true,turnstileSiteKey:'public-sitekey'});
    assert.match(html,/<input[^>]*name="phone"[^>]*required/);
    assert.ok(html.includes(teaserConsent[lang]));assert.ok(html.includes(teaserConsentVersion));
    assert.equal((await c.send(data)).status,200);
  }
});

test('invalid or unconsented submissions cannot write or acknowledge a contact',async()=>{
  for(const change of [{phone:''},{phone:'    '},{phone:'hello there'},{email:'bad-email'},{contact_consent:''},{consent_text:'something else'},{consent_version:'old'},{_gotcha:'spam'},{source_page:'https://elsewhere.test'},{language:'de'}]){
    const c=context(),r=await c.send({...c.record(),...change});
    assert.equal(r.status,400,JSON.stringify(change));assert.equal(c.DB.sql.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n,0);assert.equal(c.calls(),0);
  }
});

test('retry after a lost response is idempotent and does not reuse a Turnstile token',async()=>{
  const c=context(),data=c.record();assert.equal((await c.send(data)).status,200);
  const retry=await c.send(data);assert.equal(retry.status,200);assert.equal((await retry.json()).duplicate,true);
  assert.equal(c.calls(),1);assert.equal(c.DB.sql.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n,1);
  assert.equal((await c.send({...data,email:'other@example.test'})).status,409);
  assert.equal(JSON.parse(c.DB.sql.prepare('SELECT payload FROM enquiries').get().payload).email,data.email);
});

test('server verifies Turnstile outcome, hostname and action before storing',async()=>{
  for(const change of [{success:false},{hostname:'other.test'},{action:'login'}]){
    const c=context();Object.assign(c.verified,change);
    assert.equal((await c.send(c.record())).status,403);assert.equal(c.DB.sql.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n,0);
  }
});

test('disabled intake, cross-origin traffic and wrong methods cannot submit',async()=>{
  const c=context();assert.equal((await handleRequest(c.request(c.record()),{...c.env,PUBLIC_ENABLED:'false'},c.dependencies)).status,503);
  assert.equal((await handleRequest(c.request(c.record(),{Origin:'https://other.test'}),c.env,c.dependencies)).status,403);
  assert.equal((await handleRequest(new Request('https://watra.cz/api/watra/enquiries'),c.env)).status,405);
  assert.equal(c.DB.sql.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n,0);
});

test('storage failure never returns a successful response',async()=>{
  const c=context(),db=c.env.DB;c.env.DB={prepare(query){if(query.startsWith('INSERT INTO enquiries'))throw Error('storage failure');return db.prepare(query);}};
  const original=console.error;console.error=()=>{};
  try {const r=await c.send(c.record());assert.equal(r.status,503);assert.equal((await r.json()).ok,false);}finally{console.error=original;}
  assert.equal(c.DB.sql.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n,0);
});

test('verified submissions exceeding the short rate limit are not stored',async()=>{
  const c=context({MAX_PER_TEN_MINUTES:'2'});
  assert.equal((await c.send(c.record())).status,200);assert.equal((await c.send(c.record())).status,200);
  assert.equal((await c.send(c.record())).status,429);assert.equal(c.DB.sql.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n,2);
});

test('private CRM endpoints require a secret and acknowledge delivery independently',async()=>{
  const c=context(),data=c.record();await c.send(data);
  const url='https://watra.cz/api/watra/crm/';
  assert.equal((await handleRequest(new Request(url+'pending'),c.env)).status,401);
  const headers={Authorization:'Bearer '+c.env.CRM_SYNC_SECRET};
  const pending=await (await handleRequest(new Request(url+'pending',{headers}),c.env)).json();
  assert.equal(pending.enquiries.length,1);assert.equal(pending.enquiries[0].request_id,data._request_id);
  const ack=new Request(url+'ack',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({request_id:data._request_id,notification_state:'sent'})});
  assert.equal((await handleRequest(ack,c.env)).status,200);
  assert.equal((await (await handleRequest(new Request(url+'pending',{headers}),c.env)).json()).enquiries.length,0);
});

test('oversized and unsupported request bodies are rejected before verification',async()=>{
  const c=context();assert.equal((await c.send({...c.record(),message:'x'.repeat(17000)})).status,413);
  const request=new Request('https://watra.cz/api/watra/enquiries',{method:'POST',headers:{Origin:'https://watra.cz','Content-Type':'text/plain'},body:'test'});
  assert.equal((await handleRequest(request,c.env,c.dependencies)).status,415);assert.equal(c.calls(),0);
});
