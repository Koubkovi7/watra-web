(() => {
  'use strict';
  const active = new WeakMap();
  const photos = new WeakMap();
  const mark = (variant='wg') => '<span class="watra-mark watra-mark--'+(['wg','gg','w'].includes(variant)?variant:'wg')+'" aria-hidden="true"><span class="watra-mark__base"></span><span class="watra-mark__heat"><span class="watra-mark__flame"></span></span></span>';
  function start(container,{label='Načítáme…',delay=180,overlay=false,variant='wg'}={}) {
    if(!container) return () => {};
    let job=active.get(container);
    if(!job) {
      const indicator=document.createElement('div');
      indicator.className='watra-loading'+(overlay?' watra-loading--overlay':'');
      indicator.setAttribute('role','status');
      indicator.innerHTML=mark(variant);
      const text=document.createElement('span');text.className='watra-loading__label';text.textContent=label;indicator.append(text);
      job={count:0,indicator,previous:container.getAttribute('aria-busy')};
      container.setAttribute('aria-busy','true');
      job.timer=setTimeout(()=>container.append(indicator),Math.max(0,delay));
      active.set(container,job);
    }
    job.count++;
    let ended=false;
    return () => {
      if(ended) return;ended=true;
      if(--job.count) return;
      clearTimeout(job.timer);job.indicator.remove();
      if(job.previous===null)container.removeAttribute('aria-busy');else container.setAttribute('aria-busy',job.previous);
      active.delete(container);
    };
  }
  function image(photo,src,{srcset='',container=photo.parentElement,label='Načítáme fotografii…'}={}) {
    photos.get(photo)?.();
    const stop=start(container,{label,overlay:true});
    const complete=()=>{photo.removeEventListener('load',complete);photo.removeEventListener('error',complete);stop();photos.delete(photo);};
    photos.set(photo,complete);
    photo.addEventListener('load',complete);photo.addEventListener('error',complete);
    photo.srcset=srcset;photo.src=src;
    if(photo.complete)complete();
  }
  window.WatraLoading={mark,start,image};
})();
