import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code = await readFile('public/enquiry.js', 'utf8');

function client() {
  const requests = [], widgets = [];
  let next = 'ok', generated = 0;
  const context = {
    document:{createElement:()=>({}),head:{append(){throw Error('Unexpected script load');}}},
    crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++generated).padStart(12,'0')}`},
    setTimeout,clearTimeout,AbortController,WeakMap,JSON,
    turnstile:{
      render(host,options){widgets.push(options);return widgets.length-1;},
      reset(){},execute(id){widgets[id].callback('verified-token');}
    },
    fetch:async(url,options)=>{
      requests.push({url,data:new Map(options.body),credentials:options.credentials});
      if(next==='network')throw Error('network');
      return {ok:true,json:async()=>({ok:true,request_id:next==='wrong-id'?'wrong':options.body.get('_request_id')})};
    }
  };
  context.window=context;vm.runInNewContext(code,context);
  const form={dataset:{sitekey:'public-test-key'},getAttribute:()=>'/api/watra/enquiries',append(){}};
  return {form,requests,widgets,send:data=>context.WatraEnquiry.send(form,new Map(Object.entries(data))),outcome:value=>next=value};
}

test('protected intake verifies the visitor and requires the stored request acknowledgement',async()=>{
  const c=client();c.outcome('wrong-id');
  await assert.rejects(c.send({email:'private@example.test',phone:'+420721002840'}),/delivery/);
  assert.equal(c.widgets[0].action,'enquiry');
  assert.equal(c.widgets[0].size,'invisible');
  assert.equal(c.requests[0].url,'/api/watra/enquiries');
  assert.equal(c.requests[0].credentials,'same-origin');
  assert.equal(c.requests[0].data.get('cf-turnstile-response'),'verified-token');
});

test('retry after a lost response reuses the contact ID; edited contacts get a new ID',async()=>{
  const c=client(),fields={email:'private@example.test',phone:'+420721002840'};
  c.outcome('network');await assert.rejects(c.send(fields));
  c.outcome('ok');await c.send(fields);
  await c.send({...fields,phone:'+420721002841'});
  assert.equal(c.requests[0].data.get('_request_id'),c.requests[1].data.get('_request_id'));
  assert.notEqual(c.requests[1].data.get('_request_id'),c.requests[2].data.get('_request_id'));
});
