import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {render,routes} from '../src/pages.mjs';
import {chooseLanguage,onRequest} from '../functions/index.js';
import {onRequest as television} from '../functions/tv.js';
const config=JSON.parse(await readFile('site.config.json','utf8'));
const request=(headers={},country)=>Object.assign(new Request('https://watra.cz/',{headers}),country?{cf:{country}}:{});
test('language uses explicit choice before country, then weighted browser fallback',()=>{
  assert.equal(chooseLanguage(request({cookie:'watra_lang=en'},'CZ')),'en');
  assert.equal(chooseLanguage(request({cookie:'other=1; watra_lang=cs; foo=x'},'US')),'cs');
  assert.equal(chooseLanguage(request({},'CZ')),'cs');
  assert.equal(chooseLanguage(request({},'DE')),'en');
  assert.equal(chooseLanguage(request({'accept-language':'cs-CZ,cs;q=0.9,en;q=0.8'})),'cs');
  assert.equal(chooseLanguage(request({'accept-language':'cs;q=0.2,en;q=0.9'})),'en');
  assert.equal(chooseLanguage(request({'accept-language':'cs;q=0,en;q=1'})),'en');
  assert.equal(chooseLanguage(request()),'en');
});
test('root redirect is private and preserves only campaign parameters',()=>{
  const r=onRequest({request:new Request('https://watra-web.pages.dev/?utm_source=tv&email=secret%40example.com&redirect=https://evil.test')});
  assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://watra-web.pages.dev/en/?utm_source=tv');
  assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('x-robots-tag'),'noindex');
});
test('TV address is always Czech and identifies the campaign',()=>{
  const r=television({request:request({cookie:'watra_lang=en'},'DE')});
  assert.equal(r.headers.get('location'),'https://watra.cz/cs/?utm_source=tv&utm_medium=broadcast&utm_campaign=reportaz');
});
test('only root and TV invoke functions; localized pages are static',async()=>{
  const r=JSON.parse(await readFile('dist/_routes.json','utf8'));
  assert.deepEqual(r.include,['/','/tv','/tv/']);
});
test('every localized page has valid links, one H1, structured data, and correct alternates',async()=>{
  const unique=new Set();
  for(const lang of ['cs','en']) for(const [key,route] of Object.entries(routes)){
    const html=await readFile(path.join('dist',lang,route[lang],'index.html'),'utf8');
    assert.equal((html.match(/<h1[ >]/g)||[]).length,1,lang+key);
    assert.match(html,new RegExp('<html lang="'+lang+'"'));
    const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!unique.has(title));unique.add(title);
    for(const [other,r] of Object.entries(route)) assert.ok(html.includes('hreflang="'+other+'" href="'+config.origin+'/'+other+'/'+r+'"'));
    for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
      const schema=JSON.parse(m[1]);assert.ok(schema.length);assert.ok(!m[1].includes('"offers"'));assert.ok(!m[1].includes('"aggregateRating"'));
    }
    for(const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)){
      const pathname=new URL(m[1],'https://watra.cz').pathname;
      const file=path.join('dist',decodeURIComponent(pathname));
      assert.ok(await stat(file).catch(()=>false),'Missing '+pathname+' in '+lang+'/'+key);
    }
    assert.ok(!/\b(?:22\s?kW|30\s?min)\b/.test(html),'Unverified numerical claim');
  }
});
test('blank integrations never publish a working form or fake contacts',()=>{
  const html=render('cs','contact',{...config,email:'',phone:'',whatsapp:'',formspreeId:'',privacyApproved:false});
  assert.match(html,/data-ready="false"/);assert.match(html,/type="submit" disabled/);
  assert.ok(!html.includes('action="https://formspree.io'));
  assert.ok(!html.includes('mailto:'));assert.ok(!html.includes('wa.me/'));
});
test('configured form includes the actual endpoint and safely escapes operator data',()=>{
  const html=render('en','contact',{...config,email:'hello@example.test',privacyApproved:true,formspreeId:'abcdefgh'});
  assert.match(html,/action="https:\/\/formspree.io\/f\/abcdefgh" method="post"/);
  assert.match(html,/data-ready="true"/);assert.ok(!html.includes('type="submit" disabled'));
  assert.match(html,/data-clarity-mask="true"/);
  const privacy=render('en','privacy',{...config,operator:'<script>bad</script>'});assert.match(privacy,/&lt;script&gt;bad/);
});
test('preview hosts cannot be indexed and security headers exist',async()=>{
  const headers=await readFile('dist/_headers','utf8');
  assert.match(headers,/https:\/\/:project.pages.dev\/\*\s+X-Robots-Tag: noindex/);
  assert.match(headers,/https:\/\/:version.:project.pages.dev\/\*\s+X-Robots-Tag: noindex/);
  assert.match(headers,/frame-ancestors 'none'/);
  const sitemap=await readFile('dist/sitemap.xml','utf8');
  assert.equal((sitemap.match(/<url>/g)||[]).length,28);
  assert.ok(!sitemap.includes('dekujeme'));assert.ok(!sitemap.includes('404'));
});
