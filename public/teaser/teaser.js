(() => {
  'use strict';
  const cs = document.documentElement.lang === 'cs', say = (a,b) => cs ? a : b;
  document.querySelectorAll('[data-language]').forEach(link => link.addEventListener('click', () => {
    document.cookie = 'watra_lang=' + link.dataset.language + '; Path=/; Max-Age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }));
  const form = document.querySelector('#teaser-form');
  if (!form) return;
  const button = form.querySelector('[type=submit]'), status = document.querySelector('#teaser-status');
  const domain = form.dataset.domain;
  if (domain && location.hostname !== domain && !location.hostname.endsWith('.' + domain)) {
    form.dataset.ready = 'false';form.querySelector('fieldset').disabled = true;
    status.textContent = say('Tento náhled kontakty neodesílá. Formulář najdete na watra.cz.', 'This preview does not submit contact details. Use the form on watra.cz.');
  }
  let scriptPromise, widgetId, tokenResolve, tokenReject, timeout, pending = false, complete = false, requestId, lastSignature;
  const token = async () => {
    if (!form.dataset.sitekey) throw Error('verification');
    if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
      if (window.turnstile) {resolve();return;}
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async = true;
      const loadTimer = setTimeout(() => {script.remove();scriptPromise = null;reject(Error('verification'));}, 12000);
      script.addEventListener('load', () => {clearTimeout(loadTimer);resolve();}, {once:true});script.addEventListener('error', () => {clearTimeout(loadTimer);scriptPromise = null;reject(Error('verification'));}, {once:true});
      document.head.append(script);
    });
    await scriptPromise;
    return new Promise((resolve, reject) => {
      tokenResolve = resolve;tokenReject = reject;
      timeout = setTimeout(() => reject(Error('verification')), 20000);
      const success = value => {clearTimeout(timeout);tokenResolve(value);};
      const error = () => {clearTimeout(timeout);tokenReject(Error('verification'));return true;};
      if (widgetId === undefined) {
        const host = document.createElement('div');form.append(host);
        widgetId = window.turnstile.render(host, {sitekey:form.dataset.sitekey,action:'enquiry',size:'invisible',execution:'execute',callback:success,'error-callback':error,'expired-callback':error,'timeout-callback':error});
      } else window.turnstile.reset(widgetId);
      window.turnstile.execute(widgetId);
    });
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || complete || form.dataset.ready !== 'true' || !form.checkValidity() || form.querySelector('[name=_gotcha]').value) return;
    pending = true;button.disabled = true;form.setAttribute('aria-busy','true');status.dataset.error = 'false';status.textContent = '';
    const original = button.textContent;button.textContent = say('Odesíláme…', 'Sending…');
    let controller, timer;
    try {
      const data = new FormData(form);
      const signature = JSON.stringify([...data.entries()].filter(([name]) => !['cf-turnstile-response','_request_id'].includes(name)));
      if (signature !== lastSignature) {requestId = crypto.randomUUID();lastSignature = signature;}
      data.set('_request_id', requestId);
      data.set('cf-turnstile-response', await token());
      controller = new AbortController();timer = setTimeout(() => controller.abort(), 20000);
      const response = await fetch('/api/watra/enquiries', {method:'POST',body:data,headers:{Accept:'application/json'},signal:controller.signal,credentials:'same-origin'});
      if (!response.ok) throw Error(response.status === 429 ? 'limit' : response.status === 400 ? 'fields' : response.status === 403 ? 'verification' : 'delivery');
      const result = await response.json();
      if (result?.ok !== true || result.request_id !== requestId) throw Error('delivery');
      complete = true;form.reset();button.textContent = say('Kontakt odeslán', 'Details submitted');
      status.textContent = say('Děkujeme. Váš kontakt jsme přijali a ozveme se vám s informacemi o projektu WATRA.', 'Thank you. We have received your details and will contact you with updates about the WATRA project.');
    } catch (error) {
      button.disabled = false;button.textContent = original;status.dataset.error = 'true';
      status.textContent = error.message === 'fields' ? say('Zkontrolujte prosím e-mail, telefonní číslo a souhlas s kontaktováním.', 'Please check your email, phone number and consent.') : error.message === 'verification' ? say('Ověření formuláře se nepodařilo. Zkuste odeslání znovu, nebo nám napište přímo e-mailem.', 'Form verification failed. Please try again or contact us directly by email.') : error.message === 'limit' ? say('Zkuste to prosím za chvíli znovu. Případně nám napište přímo e-mailem.', 'Please try again shortly or contact us directly by email.') : say('Odeslání se nepodařilo potvrdit. Údaje zůstaly vyplněné. Zkuste to znovu, nebo nám napište e-mailem.', 'We could not confirm delivery. Your entries have been kept. Please retry or contact us by email.');
    } finally {clearTimeout(timer);clearTimeout(timeout);pending = false;form.setAttribute('aria-busy','false');status.focus();}
  });
})();
