(() => {
  'use strict';
  let scriptPromise;
  const states = new WeakMap();
  const load = () => {
    if (window.turnstile) return Promise.resolve();
    if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      const fail = () => {clearTimeout(timer);script.remove();scriptPromise = null;reject(Error('verification'));};
      const timer = setTimeout(fail, 12000);
      script.addEventListener('load', () => {clearTimeout(timer);resolve();}, {once:true});
      script.addEventListener('error', fail, {once:true});
      document.head.append(script);
    });
    return scriptPromise;
  };
  const token = async (form, state) => {
    if (!form.dataset.sitekey) throw Error('verification');
    await load();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('verification')), 20000);
      state.success = value => {clearTimeout(timer);resolve(value);};
      state.failure = () => {clearTimeout(timer);reject(Error('verification'));return true;};
      try {
        if (state.widget === undefined) {
          const host = document.createElement('div');form.append(host);
          state.widget = window.turnstile.render(host, {
            sitekey:form.dataset.sitekey,action:'enquiry',size:'invisible',execution:'execute',
            callback:value => state.success(value),'error-callback':() => state.failure(),
            'expired-callback':() => state.failure(),'timeout-callback':() => state.failure()
          });
        } else window.turnstile.reset(state.widget);
        window.turnstile.execute(state.widget);
      } catch {state.failure();}
    });
  };
  window.WatraEnquiry = {
    async send(form, data) {
      if (form.getAttribute('action') !== '/api/watra/enquiries') throw Error('endpoint');
      const state = states.get(form) || {};
      if (state.pending) throw Error('pending');
      states.set(form, state);state.pending = true;
      let timer;
      try {
        const signature = JSON.stringify([...data.entries()].filter(([key]) => !['cf-turnstile-response','_request_id','consent_at'].includes(key)));
        if (signature !== state.signature) {state.id = crypto.randomUUID();state.signature = signature;}
        data.set('_request_id', state.id);
        data.set('cf-turnstile-response', await token(form, state));
        const controller = new AbortController();
        timer = setTimeout(() => controller.abort(), 20000);
        const response = await fetch('/api/watra/enquiries', {method:'POST',body:data,headers:{Accept:'application/json'},credentials:'same-origin',signal:controller.signal});
        if (!response.ok) throw Error(response.status === 429 ? 'rate-limit' : response.status === 403 ? 'verification' : 'delivery');
        const result = await response.json();
        if (result?.ok !== true || result.errors || result.request_id !== state.id) throw Error('delivery');
        return result;
      } finally {clearTimeout(timer);state.pending = false;}
    }
  };
})();
