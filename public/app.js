(() => {
  'use strict';
  const lang = document.documentElement.lang === 'cs' ? 'cs' : 'en';
  const say = (cs, en) => lang === 'cs' ? cs : en;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const cookie = (key, value, age) => { document.cookie = key + '=' + encodeURIComponent(value) + '; Path=/; Max-Age=' + age + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); };
  const menu = $('#mobile-menu'), toggle = $('.menu-toggle');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); menu.hidden = !open;
    toggle.setAttribute('aria-label', open ? say('Zavřít menu','Close menu') : say('Otevřít menu','Open menu'));
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && menu && !menu.hidden) {menu.hidden = true; toggle.setAttribute('aria-expanded','false'); toggle.focus();}
  });
  const incoming = new URLSearchParams(location.search);
  const campaignKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid'];
  const safeValue = value => /^[a-zA-Z0-9_.~ +-]{1,200}$/.test(value || '') ? value : '';
  const campaign = {};
  for(const k of campaignKeys) {const v = safeValue(incoming.get(k)); if(v) campaign[k] = v;}
  $$('[data-language]').forEach(a => {
    const u = new URL(a.href);
    for(const [k,v] of Object.entries(campaign)) u.searchParams.set(k,v);
    for(const k of ['type','model']) if(incoming.has(k)) u.searchParams.set(k,incoming.get(k).slice(0,40));
    a.href = u.href;
    a.addEventListener('click', () => cookie('watra_lang',a.dataset.language,31536000));
  });
  const box = $('#lightbox');
  $$('[data-photo]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.photo;
    if(!['portraitStove','front','side','rear'].includes(name)) return;
    const main = $('.gallery-main'), photo = $('img',main);
    photo.src = '/media/' + name + '-960.webp';
    photo.srcset = '/media/' + name + '-480.webp 480w, /media/' + name + '-960.webp 960w, /media/' + name + '-1600.webp 1600w';
    photo.alt = $('img',button).alt; main.href = '/media/' + name + '-1600.webp';
    $$('[data-photo]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
  }));
  $$('[data-gallery]').forEach(a => a.addEventListener('click', e => {
    if(!box?.showModal) return; e.preventDefault();
    $('img',box).src = a.href; $('img',box).alt = $('img',a).alt;
    $('p',box).textContent = $('img',a).alt; box.showModal();
  }));
  $('.lightbox-close')?.addEventListener('click',() => box.close());
  box?.addEventListener('click',e => {if(e.target === box) box.close();});

  let config = {}, consent = {analytics:false,marketing:false}, gtmLoaded = false, clarityLoaded = false;
  let configLoaded = false, consentKnown = false, pageTracked = false;
  try {
    const stored = JSON.parse(localStorage.getItem('watra_consent'));
    if(stored?.version === 1 && Date.now() - stored.at < 180*86400000) {
      consent = {analytics:stored.analytics === true, marketing:stored.marketing === true}; consentKnown = true;
    }
  } catch {}
  const onProduction = () => Array.isArray(config.analyticsHosts) && config.analyticsHosts.includes(location.hostname);
  const configured = () => onProduction() && (/^GTM-[A-Z0-9]+$/.test(config.gtmId || '') || /^[a-z0-9]+$/i.test(config.clarityId || ''));
  const analyticsConsent = () => consent.analytics && onProduction();
  const marketingConsent = () => consent.marketing && onProduction();
  window.dataLayer = window.dataLayer || [];
  const gtag = function(){window.dataLayer.push(arguments);};
  gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  const cleanLocation = () => {
    const u = new URL(location.origin + location.pathname);
    if(consent.analytics) for(const [k,v] of Object.entries(campaign)) if(k.startsWith('utm_')) u.searchParams.set(k,v);
    if(consent.marketing) for(const k of ['gclid','gbraid','wbraid']) if(campaign[k]) u.searchParams.set(k,campaign[k]);
    return u.href;
  };
  const event = (name, properties={}) => {
    if(!gtmLoaded || !(analyticsConsent() || (name === 'generate_lead' && marketingConsent()))) return;
    window.dataLayer.push({event:name,page_path:location.pathname,page_location:cleanLocation(),language:lang,...properties});
  };
  const loadScript = src => {const s=document.createElement('script');s.async=true;s.src=src;document.head.append(s);};
  const applyConsent = () => {
    if(!configLoaded || !configured()) return;
    gtag('consent','update',{
      analytics_storage:consent.analytics?'granted':'denied',ad_storage:consent.marketing?'granted':'denied',
      ad_user_data:consent.marketing?'granted':'denied',ad_personalization:consent.marketing?'granted':'denied'
    });
    gtag('set',{page_location:cleanLocation(),page_referrer:document.referrer ? new URL(document.referrer).origin : ''});
    window.dataLayer.push({event:'watra_consent_update',analytics_allowed:consent.analytics,marketing_allowed:consent.marketing});
    if((consent.analytics || consent.marketing) && /^GTM-[A-Z0-9]+$/.test(config.gtmId || '') && !gtmLoaded) {
      window.dataLayer.push({event:'gtm.js','gtm.start':Date.now()}); gtmLoaded=true;
      loadScript('https://www.googletagmanager.com/gtm.js?id='+config.gtmId);
    }
    if(gtmLoaded && consent.analytics && !pageTracked) {
      event('watra_page_view',{page_type:document.body.dataset.page}); pageTracked=true;
      if(['irikon','electric'].includes(document.body.dataset.page)) event('view_item',{item_id:document.body.dataset.page==='electric'?'irikon-e':'irikon'});
    }
    // Session recording stays off on pages containing a form or any URL parameters.
    if(consent.analytics && /^[a-z0-9]+$/i.test(config.clarityId || '') && !clarityLoaded && !$('#interest-form') && !location.search) {
      window.clarity = window.clarity || function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};
      window.clarity('consentv2',{analytics_Storage:'granted',ad_Storage:'denied'});
      loadScript('https://www.clarity.ms/tag/'+config.clarityId); clarityLoaded=true;
    }
    if(consent.analytics) {
      try {if(Object.keys(campaign).length) sessionStorage.setItem('watra_campaign',JSON.stringify(Object.fromEntries(Object.entries(campaign).filter(([k])=>k.startsWith('utm_') || consent.marketing))));} catch {}
    }
  };
  const dialog = $('#cookie-dialog');
  const showCookies = () => {
    $('input[name=analytics]',dialog).checked=consent.analytics;
    $('input[name=marketing]',dialog).checked=consent.marketing;
    if(!dialog.open) dialog.showModal();
  };
  $$('[data-cookie-settings]').forEach(b=>b.addEventListener('click',showCookies));
  $$('[data-consent]').forEach(b=>b.addEventListener('click',() => {
    const next={analytics:b.dataset.consent==='all'||(b.dataset.consent==='save'&&$('input[name=analytics]',dialog).checked),
      marketing:b.dataset.consent==='all'||(b.dataset.consent==='save'&&$('input[name=marketing]',dialog).checked)};
    const revoked=(consent.analytics&&!next.analytics)||(consent.marketing&&!next.marketing);
    consent=next;consentKnown=true;
    try {localStorage.setItem('watra_consent',JSON.stringify({...next,version:1,at:Date.now()}));} catch {}
    dialog.close();
    if(revoked) {
      try {sessionStorage.removeItem('watra_campaign');} catch {}
      for(const part of document.cookie.split(';')) {
        const key=part.trim().split('=')[0];
        if(/^(_ga|_gid|_gat|_gcl|_clck|_clsk)/.test(key)) {
          cookie(key,'',0);
          for(const domain of [location.hostname,'.'+location.hostname,'.watra.cz']) document.cookie=key+'=; Path=/; Max-Age=0; Domain='+domain+'; SameSite=Lax';
        }
      }
      // A reload removes all previously loaded optional code before further navigation.
      location.reload(); return;
    }
    applyConsent();
  }));
  fetch('/site-config.json',{credentials:'same-origin'}).then(r=>r.ok?r.json():Promise.reject()).then(c => {
    config=c;configLoaded=true;
    if(configured()&&!consentKnown) showCookies();
    applyConsent();
  }).catch(()=>{});
  $$('[data-event]').forEach(a=>a.addEventListener('click',()=>event(a.dataset.event)));
  $$('a[href*="/kontakt/"],a[href*="/contact/"]').forEach(a=>a.addEventListener('click',()=>event('cta_click',{destination:'contact'})));
  const form=$('#interest-form');
  if(!form) return;
  const type=$('[name=lead_type]',form), model=$('[name=model]',form), company=$('.company-fields',form);
  const selectedType=incoming.get('type'), selectedModel=incoming.get('model');
  if(['customer','manufacturer','business','technical'].includes(selectedType)) type.value=selectedType;
  if(['IRIKON','IRIKON e','undecided'].includes(selectedModel)) model.value=selectedModel;
  const updateCompany=()=>{company.hidden=!['manufacturer','business'].includes(type.value);$$('input',company).forEach(i=>i.disabled=company.hidden);};
  updateCompany();type.addEventListener('change',updateCompany);
  let started=false, busy=false, complete=false;
  form.addEventListener('input',()=>{if(!started){started=true;event('form_start');}},{once:true});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(busy||complete||form.dataset.ready!=='true'||!form.checkValidity()) return;
    const endpoint=form.getAttribute('action');
    if(!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) return;
    if($('[name=_gotcha]',form).value) return;
    busy=true;
    const button=$('[type=submit]',form), status=$('#form-status'), original=button.innerHTML;
    button.disabled=true;button.textContent=say('Odesíláme…','Sending…');status.textContent='';
    const data=new FormData(form);
    if(consent.analytics) {
      try {const saved=JSON.parse(sessionStorage.getItem('watra_campaign')||'{}');for(const k of campaignKeys) if((k.startsWith('utm_')||consent.marketing)&&safeValue(saved[k])) data.set(k,saved[k]);} catch {}
    }
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try {
      const r=await fetch(endpoint,{method:'POST',body:data,headers:{Accept:'application/json'},signal:controller.signal});
      if(!r.ok) throw Error('response');
      const result=await r.json();if(result.errors || result.ok===false) throw Error('response');
      complete=true;event('generate_lead',{lead_type:type.value,item_id:model.value==='IRIKON e'?'irikon-e':model.value==='IRIKON'?'irikon':'undecided'});
      button.textContent=say('Odesláno','Sent');
      status.textContent=say('Děkujeme. Váš nezávazný zájem jsme přijali. Ozveme se na uvedený e-mail.','Thank you. We received your non-binding enquiry and will respond to the email address you provided.');
      form.reset();status.focus();
    } catch {
      button.disabled=false;button.innerHTML=original;
      status.textContent=say('Odeslání se nepodařilo potvrdit. Vyplněné údaje zůstaly zachované. Zkuste to za chvíli znovu nebo využijte uvedený e-mail. Pokud byl požadavek doručen navzdory chybě spojení, opakování může vytvořit druhou poptávku.','We could not confirm delivery. Your entries have been kept. Please try again shortly or use the email listed on this page. If delivery succeeded despite a connection error, retrying may create a second enquiry.');
      status.focus();
    } finally {clearTimeout(timer);busy=false;}
  });
})();
