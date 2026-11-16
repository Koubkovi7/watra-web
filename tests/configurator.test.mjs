import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {routes} from '../src/pages.mjs';
const page=(lang,key)=>readFile(path.join('dist',lang,routes[key][lang],'index.html'),'utf8');

test('sauna configurator page exists in both languages and loads its own assets only there',async()=>{
  for(const lang of ['cs','en']){
    const html=await page(lang,'configurator');
    assert.match(html,/<div id="wk-3d"><\/div>/);
    assert.match(html,/<script defer src="\/three-r128-min.js\?v=[0-9a-f]{12}"><\/script><script defer src="\/konfigurator\.js\?v=[0-9a-f]{12}"><\/script>/);
    assert.match(html,/<link rel="stylesheet" href="\/konfigurator\.css\?v=[0-9a-f]{12}">/);
    assert.match(html,/href="https:\/\/www\.honzasorm\.cz\/"/,'author credit');
    assert.match(html,/"@type":"WebApplication"/);
    assert.ok(html.includes('href="/'+lang+'/'+(lang==='cs'?'kontakt/':'contact/')+'?type=customer"'),'send link points to the contact form');
  }
  assert.doesNotMatch(await page('cs','contact'),/konfigurator\.js|three-r128/);
});
test('design is sent from the configurator through the site enquiry intake, with the drawing link',async()=>{
  for(const lang of ['cs','en']){
    const html=await page(lang,'configurator');
    assert.match(html,/<dialog class="wk-dlg" id="wk-send-dlg"/);
    assert.match(html,/<form id="wk-send-form" class="wk-sform" data-clarity-mask="true" action="\/api\/watra\/enquiries" method="post" data-sitekey="0x[^"]+" data-ready="true" data-domain="watra\.cz" novalidate>/);
    assert.match(html,/data-form-domain-note hidden/,'preview hosts show a notice instead of sending');
    assert.match(html,/<dialog class="wk-dlg wk-sheetdlg" id="wk-sheet-dlg"/);
    for(const n of ['name','email','phone','note','_gotcha']) assert.match(html,new RegExp('name="'+n+'"'));
  }
  const js=await readFile('public/konfigurator.js','utf8');
  assert.ok(js.includes("data.set('lead_type', 'customer')")&&js.includes("data.set('source_page', EN ? '/en/contact/' : '/cs/kontakt/')"),'worker accepts only contact source pages');
  assert.ok(js.includes("designUrl('vykres')"),'message links the drawing');
  assert.ok(js.includes("track('generate_lead'"),'successful send is a lead');
});
test('configurator is linked from the navigation and from home and model pages',async()=>{
  for(const lang of ['cs','en']){
    const target='href="/'+lang+'/'+routes.configurator[lang];
    for(const key of ['home','models','irikon','electric']){
      const html=await page(lang,key);
      assert.ok(html.includes('<a href="/'+lang+'/'+routes.configurator[lang]+'" >')||html.includes('<a href="/'+lang+'/'+routes.configurator[lang]+'" aria-current'),'nav link on '+lang+'/'+key);
      assert.match(html,/class="section wrap border-top wk-teaser"/,'teaser on '+lang+'/'+key);
      assert.match(html,/konfigurator-teaser\.css/);
      assert.ok(html.includes(target));
    }
    assert.match(await page(lang,'home'),/class="wk-hero-chip"/);
  }
});
test('configurator script respects analytics consent and the page language',async()=>{
  const js=await readFile('public/konfigurator.js','utf8');
  assert.match(js,/localStorage\.getItem\('watra_consent'\)/);
  assert.match(js,/document\.documentElement\.lang/);
  assert.ok(js.includes("tr('/cs/kontakt/', '/en/contact/')"));
  assert.match(js,/const HASH_ENUM = \{sw: WALLS4, dw: WALLS4, ww: WALLS4, win:/,'unknown values in a shared link fall back to defaults');
});
