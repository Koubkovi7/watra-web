import {mkdir,writeFile,readFile,cp,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {renderTeaser} from '../src/teaser.mjs';
import {routes} from '../src/pages.mjs';

export async function buildTeaser(config) {
  const output=path.resolve('dist');
  if(output!==path.join(process.cwd(),'dist')) throw Error('Invalid output');
  if(!/^https:\/\/[a-z0-9.-]+$/.test(config.origin)) throw Error('Invalid origin');
  if(config.teaserFormEnabled && (!config.turnstileSiteKey || !config.privacyApproved)) throw Error('Configure verified intake and privacy information before enabling the teaser form');
  await rm(output,{recursive:true,force:true});
  await mkdir(path.join(output,'brand'),{recursive:true});
  await cp('public/teaser',path.join(output,'teaser'),{recursive:true});
  for(const file of ['logo.png','icon-32.png','icon-48.png','icon-180.png']) await cp(path.join('public/brand',file),path.join(output,'brand',file));
  for(const lang of ['cs','en']) {
    for(const [view,route] of [['home',''],['privacy',lang==='cs'?'ochrana-udaju/':'privacy/'],['thanks',lang==='cs'?'dekujeme/':'thank-you/']]) {
      const dir=path.join(output,lang,route);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'index.html'),renderTeaser(lang,config,view));
    }
  }
  await writeFile(path.join(output,'index.html'),renderTeaser('en',config));
  await writeFile(path.join(output,'404.html'),renderTeaser('cs',config));
  const redirects=[];
  for(const lang of ['cs','en']) for(const [key,route] of Object.entries(routes).map(([key,value])=>[key,value[lang]])) {
    if(['home','privacy','thanks'].includes(key)) continue;
    redirects.push('/'+lang+'/'+route+' /'+lang+'/ 302');
    if(route.endsWith('/')) redirects.push('/'+lang+'/'+route.slice(0,-1)+' /'+lang+'/ 302');
  }
  redirects.push('/media/* /cs/ 302','/ukazka-animace/* /cs/ 302','/ukazka-animace /cs/ 302');
  await writeFile(path.join(output,'_redirects'),redirects.join('\n')+'\n');
  await writeFile(path.join(output,'_headers'),`/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
https://:project.pages.dev/*
  X-Robots-Tag: noindex
https://:version.:project.pages.dev/*
  X-Robots-Tag: noindex
/cs/*
  Cache-Control: no-cache
/en/*
  Cache-Control: no-cache
`);
  await writeFile(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/','/tv','/tv/'],exclude:[]}));
  await writeFile(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+config.origin+'/sitemap.xml\n');
  await writeFile(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+config.origin+'/cs/</loc></url><url><loc>'+config.origin+'/en/</loc></url></urlset>');
  const versions=new Map();
  for(const file of await readdir(path.join(output,'teaser'))) versions.set('/teaser/'+file,createHash('sha256').update(await readFile(path.join(output,'teaser',file))).digest('hex').slice(0,12));
  for(const file of await readdir(output,{recursive:true})) if(file.endsWith('.html')) {
    const location=path.join(output,file),html=await readFile(location,'utf8');
    await writeFile(location,html.replace(/\/teaser\/[a-z0-9.-]+\.(?:webp|css|js)/g,match=>versions.has(match)?match+'?v='+versions.get(match):match));
  }
  console.log('Built WATRA teaser: CS/EN, privacy, confirmation; full presentation preserved in source.');
}
