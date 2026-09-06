import {mkdir,writeFile,readFile,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {render, routes} from '../src/pages.mjs';
const config=JSON.parse(await readFile('site.config.json','utf8'));
if(!/^https:\/\/[a-z0-9.-]+$/.test(config.origin)) throw Error('Use a valid HTTPS origin without a trailing slash');
if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(config.certificationExpected)) throw Error('Certification estimate must use YYYY-MM');
for(const [key,pattern] of [['formspreeId',/^[a-z0-9]+$/i],['gtmId',/^GTM-[A-Z0-9]+$/],['clarityId',/^[a-z0-9]+$/i]]) if(config[key]&&!pattern.test(config[key])) throw Error('Invalid '+key);
if(config.privacyApproved && (!config.operator || !config.address || !config.email || !config.retention)) throw Error('Complete operator, address, email and retention before enabling enquiries');
const output=path.resolve('dist');
if(output!==path.join(process.cwd(),'dist')) throw Error('Invalid output');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true}); await cp('public',output,{recursive:true});
await writeFile(path.join(output,'style.css'),(await readFile('public/style.css','utf8'))+'\n'+(await readFile('public/components.css','utf8')));
for(const lang of ['cs','en'])for(const key of Object.keys(routes)){
 const location=routes[key][lang]; const dir=path.join(output,lang,location); await mkdir(dir,{recursive:true}); await writeFile(path.join(dir,'index.html'),render(lang,key,config));
}
await writeFile(path.join(output,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>WATRA — Choose your language</title><link rel="icon" href="/brand/icon-32.png" type="image/png"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/brand.css"><main class="wrap section"><a class="brand brand-image" href="/cs/"><img src="/brand/logo.png" alt="WATRA" width="356" height="208"></a><h1>Vítejte.<br><em>Welcome.</em></h1><div class="actions"><a class="button" href="/cs/" data-language="cs">Česky →</a><a class="button outline" href="/en/" data-language="en">English →</a></div></main></html>');
await writeFile(path.join(output,'404.html'),render('cs','notfound',config));
await writeFile(path.join(output,'site-config.json'),JSON.stringify({email:config.email,phone:config.phone,whatsapp:config.whatsapp,formspreeId:config.formspreeId,gtmId:config.gtmId,clarityId:config.clarityId,analyticsHosts:config.analyticsHosts,formsEnabled:!!(config.formspreeId&&config.privacyApproved&&config.email)}));
await writeFile(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['cs','en'].flatMap(l=>Object.keys(routes).filter(k=>!['thanks','notfound'].includes(k)).map(k=>'<url><loc>'+config.origin+'/'+l+'/'+routes[k][l]+'</loc></url>')).join('')+'</urlset>');
await writeFile(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+config.origin+'/sitemap.xml\n');
await writeFile(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/','/tv','/tv/'],exclude:[]}));
console.log('Built '+Object.keys(routes).length*2+' localized pages to dist');
