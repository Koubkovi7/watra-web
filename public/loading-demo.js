(() => {
  const stage=document.querySelector('#demo-stage'),button=document.querySelector('#demo-start'),result=document.querySelector('#demo-result'),message=document.querySelector('#demo-message');
  let variant='gg';
  document.querySelectorAll('[data-variant]').forEach(option=>option.addEventListener('click',()=>{
    variant=option.dataset.variant;stage.innerHTML=window.WatraLoading.mark(variant);
    stage.setAttribute('aria-label',({wg:'Zlatý plamen nad pevným bílým W',gg:'Zlatý plamen nad pevným zlatým W',w:'Bílý plamen nad pevným bílým W'})[option.dataset.variant]);
    document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b===option)));
  }));
  button.addEventListener('click',()=>{
    button.disabled=true;message.textContent='';
    const stop=window.WatraLoading.start(result,{label:'Chvilku strpení…',variant});
    setTimeout(()=>{stop();message.textContent='Hotovo. Takto plamen doprovodí skutečné načítání.';button.disabled=false;},3000);
  });
})();
