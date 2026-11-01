import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {renderTeaser} from '../src/teaser.mjs';
const config=JSON.parse(await readFile('site.config.json','utf8'));

test('teaser pages conceal product information and retain contact, consent and language choices',()=>{
  for(const lang of ['cs','en']){
    const html=renderTeaser(lang,{...config,teaserFormEnabled:true,turnstileSiteKey:'public-key'});
    assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/name="email"[^>]*required/);assert.match(html,/name="phone"[^>]*required/);assert.match(html,/name="contact_consent"[^>]*required/);
    assert.ok(html.includes('hreflang="'+(lang==='cs'?'en':'cs')+'"'));
    assert.doesNotMatch(html,/IRIKON|\bkW\b|Formspree|formspree\.io|listopad|November|certifikace|certification/i);
    assert.doesNotMatch(html,/\/media\/|googletagmanager|clarity|crisp\.chat/);
  }
});

test('teaser build publishes only the approved assets and temporary redirects',async()=>{
  if((process.env.WATRA_SITE_MODE||config.siteMode)!=='teaser') return;
  const files=await readdir('dist',{recursive:true});
  assert.ok(!files.some(file=>/^(media|ukazka-animace)[\\/]/.test(file)));
  assert.ok(!files.some(file=>/irikon|modely[\\/]/.test(file)));
  const redirects=await readFile('dist/_redirects','utf8');
  assert.match(redirects,/\/cs\/modely\/irikon\/ \/cs\/ 302/);
  assert.match(redirects,/\/media\/\* \/cs\/ 302/);
  const sitemap=await readFile('dist/sitemap.xml','utf8');assert.doesNotMatch(sitemap,/irikon|modely|models/);
  await access('scripts/build-full.mjs');await access('src/pages.mjs');await access('public/media/portraitStove-1600.webp');
});
