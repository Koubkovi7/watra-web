(() => {
  'use strict';
  const button = document.querySelector('[data-chat-open]');
  if (!button) return;
  const cs = document.documentElement.lang === 'cs';
  const label = cs ? 'Napište nám' : 'Chat with us';
  let loaded = false;
  button.addEventListener('click', () => {
    if (loaded) { window.$crisp.push(['do', 'chat:show']); window.$crisp.push(['do', 'chat:open']); return; }
    loaded = true;
    button.disabled = true;
    button.textContent = cs ? 'Otevíráme chat…' : 'Opening chat…';
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = button.dataset.chatOpen;
    window.CRISP_RUNTIME_CONFIG = {locale: cs ? 'cs' : 'en'};
    const restore = () => { button.hidden = false; button.disabled = false; button.textContent = label; };
    window.$crisp.push(['on', 'chat:opened', () => { button.hidden = true; }]);
    window.$crisp.push(['on', 'chat:closed', () => { window.$crisp.push(['do', 'chat:hide']); restore(); }]);
    window.$crisp.push(['do', 'chat:open']);
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    script.onerror = () => { loaded = false; script.remove(); restore(); button.textContent = cs ? 'Chat není dostupný. Zkusit znovu' : 'Chat unavailable. Try again'; };
    document.head.append(script);
  });
})();
