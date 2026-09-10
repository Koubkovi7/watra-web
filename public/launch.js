(() => {
  'use strict';
  const dialog=document.querySelector('#launch-dialog');
  if(!dialog) return;
  const form=dialog.querySelector('#launch-form');
  const button=form.querySelector('[type=submit]');
  const status=dialog.querySelector('#launch-status');
  const cs=document.documentElement.lang==='cs';
  const say=(a,b)=>cs?a:b;
  let opener=null,previousOverflow='',busy=false,complete=false;
  document.querySelectorAll('[data-launch-open]').forEach(link=>link.addEventListener('click',event=>{
    if(!dialog.showModal) return;
    event.preventDefault();
    if(dialog.open) return;
    opener=link;previousOverflow=document.documentElement.style.overflow;
    dialog.showModal();document.documentElement.style.overflow='hidden';
  }));
  dialog.querySelectorAll('[data-launch-close]').forEach(control=>control.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog) return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) dialog.close();
  });
  dialog.addEventListener('close',()=>{document.documentElement.style.overflow=previousOverflow;opener?.focus();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy||complete||form.dataset.ready!=='true'||!form.checkValidity()) return;
    const endpoint=form.getAttribute('action');
    if(!/^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(endpoint||'')||!form.querySelector('[name=contact_consent]').checked||form.querySelector('[name=_gotcha]').value) return;
    busy=true;button.disabled=true;status.textContent='';form.setAttribute('aria-busy','true');
    const original=button.textContent;
    button.textContent=say('Odesíláme…','Sending…');
    const data=new FormData(form);
    data.set('consent_at',new Date().toISOString());
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),20000);
    const finishLoading=window.WatraLoading?.start(form,{label:say('Odesíláme váš zájem…','Sending your interest…')})||(()=>{});
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{Accept:'application/json'},body:data,signal:controller.signal});
      if(!response.ok) throw Error('delivery');
      const result=await response.json();
      if(result?.ok!==true||result.errors) throw Error('delivery');
      complete=true;form.reset();
      dialog.querySelector('.launch-signup').hidden=true;
      dialog.querySelector('.launch-success').hidden=false;
      dialog.setAttribute('aria-labelledby','launch-success-title');
      dialog.setAttribute('aria-describedby','launch-success-description');
      document.dispatchEvent(new CustomEvent('watra:launch-interest'));
      if(dialog.open) dialog.querySelector('.launch-success button').focus();
    }catch{
      button.disabled=false;button.textContent=original;
      status.textContent=say('Odeslání se nepodařilo potvrdit. Údaje zůstaly vyplněné. Zkuste to za chvíli znovu nebo nám napište přímo. Pokud zpráva přesto dorazila, opakování může vytvořit druhý záznam.','We could not confirm delivery. Your entries have been kept. Please try again shortly or contact us directly. If the message arrived despite the connection error, retrying may create a duplicate.');
      if(dialog.open) status.focus();
    }finally{clearTimeout(timer);finishLoading();form.setAttribute('aria-busy','false');busy=false;}
  });
})();
