// Konfigurátor sauny (Honza Šorm, 11/2026): stránka /cs/konfigurator-sauny/ a /en/sauna-configurator/ + upoutávky na úvodu a u modelů.
// Obsah stránky je v configurator-cs.html / configurator-en.html, logika v public/konfigurator.js (3D: public/three-r128-min.js).
import {readFileSync} from 'node:fs';
import {formReady} from './form-intake.mjs';
import {formDomainAttribute,formDomainNotice} from './form-domain.mjs';
const html={cs:readFileSync(new URL('./configurator-cs.html',import.meta.url),'utf8'),en:readFileSync(new URL('./configurator-en.html',import.meta.url),'utf8')};
const t=(l,a,b)=>l==='cs'?a:b;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const configuratorRoute={cs:'konfigurator-sauny/',en:'sauna-configurator/'};
// „Poslat návrh“ v konfigurátoru jde stejným příjmem jako kontaktní formulář (Worker /api/watra/enquiries, Turnstile);
// na náhledech mimo formDomain ho app.js vypne a ukáže upozornění, bez hotové konfigurace zůstane jen odkaz na kontakt.
const FORM='<form id="wk-send-form" class="wk-sform" data-ready="false" novalidate>';
export const configuratorPage=(l,c={})=>{
 const ready=formReady(c);
 if(!html[l].includes(FORM)) throw Error('Configurator send form placeholder missing');
 return html[l].replace(FORM,'<form id="wk-send-form" class="wk-sform" data-clarity-mask="true" '+(ready?'action="/api/watra/enquiries" method="post" data-sitekey="'+esc(c.turnstileSiteKey)+'" ':'')+'data-ready="'+ready+'"'+formDomainAttribute(c)+' novalidate>')
  .replace('<!--wk-domain-note-->',formDomainNotice(l,c,'contact'));
};
const href=(l,hash='')=>'/'+l+'/'+configuratorRoute[l]+hash;
function teaser(l,model,hash='',sit='#v=sit'){
 return '<section class="section wrap border-top wk-teaser"><div class="wk-teaser-grid">'+
 '<a class="wk-teaser-img" href="'+href(l,hash)+'" aria-label="'+t(l,'Otevřít konfigurátor sauny','Open the sauna configurator')+'">'+
 '<img src="/media/konfigurator-800.webp" srcset="/media/konfigurator-480.webp 480w, /media/konfigurator-800.webp 800w, /media/konfigurator-1200.webp 1200w" sizes="(max-width: 900px) calc(100vw - 40px), 660px" width="1200" height="900" alt="'+t(l,'Sauna s kamny WATRA v konfigurátoru i se zónou bezpečných odstupů','A sauna with a WATRA heater in the configurator, including the safe clearance zone')+'" loading="lazy" decoding="async">'+
 '<span class="wk-teaser-tag">'+t(l,'3D · půdorys · kontrola','3D · floor plan · check')+'</span></a>'+
 '<div><p class="eyebrow">'+t(l,'Konfigurátor sauny','Sauna configurator')+'<span class="wk-new">'+t(l,'nové','new')+'</span></p><h2>'+t(l,'Vejdou se<br><em>k vám?</em>','Will it<br><em>fit?</em>')+'</h2>'+
 '<p>'+t(l,'Zadejte rozměry své sauny a postavte do ní '+model+'. Hned uvidíte:','Enter the size of your sauna and place '+model+' in it. You will see right away:')+'</p>'+
 '<ul class="wk-teaser-list">'+t(l,'<li>bezpečnou zónu kolem kamen a místo na přikládání,</li><li>objem sauny i s přirážkou za sklo,</li><li>kolik lidí se vejde na lavice,</li><li>saunu ve 3D: projdete se po ní a sednete si na horní lavici.</li>','<li>the safe zone around the heater and the space to load wood,</li><li>the sauna volume including the allowance for glass,</li><li>how many people fit on the benches,</li><li>the sauna in 3D: walk around it and sit on the upper bench.</li>')+'</ul>'+
 '<div class="actions"><a class="button" href="'+href(l,hash)+'">'+t(l,'Postavit saunu','Build your sauna')+'</a><a class="button outline" href="'+href(l,sit)+'">'+t(l,'Rovnou si sednout','Sit down right away')+'</a></div></div></div></section>';
}
const chip=l=>'<a class="wk-hero-chip" href="'+href(l)+'"><span class="wk-new">'+t(l,'nové','new')+'</span><span>'+t(l,'Vejdou se k vám kamna? <strong>Postavte si saunu ve 3D →</strong>','Will the heater fit? <strong>Build your sauna in 3D →</strong>')+'</span></a>';
// upoutávka: úvod (odkaz v hero + sekce nad náladovou fotkou), přehled modelů (na konci), stránky modelů (před otázkami)
export function withConfigurator(l,key,body){
 const faq='<section class="section wrap faq-section">';
 if(key==='home') return body.replace(/(<p class="hero-note">[\s\S]*?<\/p>)/,m=>m+chip(l)).replace('<section class="mood-home',teaser(l,t(l,'kamna IRIKON','an IRIKON heater'))+'<section class="mood-home');
 if(key==='models') return body+teaser(l,t(l,'kamna IRIKON','an IRIKON heater'));
 if(key==='irikon') return body.replace(faq,teaser(l,'IRIKON','#m=wood','#m=wood&v=sit')+faq);
 if(key==='electric') return body.replace(faq,teaser(l,'IRIKON +e')+faq);
 return body;
}
export const configuratorCss=key=>key==='configurator'?'<link rel="stylesheet" href="/konfigurator.css">':['home','models','irikon','electric'].includes(key)?'<link rel="stylesheet" href="/konfigurator-teaser.css">':'';
export const configuratorJs=key=>key==='configurator'?'<script defer src="/three-r128-min.js"></script><script defer src="/konfigurator.js"></script>':'';
export const configuratorSchema=(l,origin,pageUrl)=>({'@context':'https://schema.org','@type':'WebApplication',name:t(l,'Konfigurátor sauny WATRA','WATRA sauna configurator'),url:origin+pageUrl,applicationCategory:'DesignApplication',operatingSystem:'Web',inLanguage:l,isAccessibleForFree:true,creator:{'@type':'Person',name:'Honza Šorm',url:'https://www.honzasorm.cz/'}});
