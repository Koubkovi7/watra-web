const pick=(l,cs,en)=>l==='cs'?cs:en;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const launchDate=c=>c.launchExpected||'2026-11';
export const launchMonth=(l,c,year=true)=>new Intl.DateTimeFormat(l==='cs'?'cs-CZ':'en-GB',{month:'long',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(new Date(launchDate(c)+'-01T00:00:00Z'));
const contact=l=>l==='cs'?'/cs/kontakt/':'/en/contact/';
const privacy=l=>l==='cs'?'/cs/ochrana-udaju/':'/en/privacy/';
export const launchReady=c=>!!(c.privacyApproved&&c.email&&/^[a-z0-9]+$/i.test(c.formspreeId||''));
export const launchCTA=(l,cls='button')=>`<a class="${cls}" href="${contact(l)}?type=launch" data-launch-open aria-haspopup="dialog" aria-controls="launch-dialog">${pick(l,'Chci vědět o spuštění','Notify me when sales begin')}</a>`;
export const launchTopbar=(l,c)=>`<div class="launch-topline"><span><span class="dot" aria-hidden="true"></span>${pick(l,'Certifikace probíhá','Certification in progress')}</span><span>${pick(l,'Oficiální prodej plánujeme na','Official sales are planned for')} <strong>${launchMonth(l,c)}</strong></span></div>`;
export const launchHero=(l,c)=>`<div class="launch-hero-note"><p>${pick(l,'Certifikace probíhá. Prodej plánujeme na','Certification is in progress. Sales are planned for')}</p><p class="launch-date">${launchMonth(l,c)}.</p><p class="small">${pick(l,'Zahájení prodeje závisí na úspěšném dokončení certifikace. Termín se může změnit.','Sales will begin after successful certification. The planned date may change.')}</p></div>`;
export const launchSection=(l,c)=>`<section class="launch-section"><div class="wrap"><div class="launch-calendar"><p class="eyebrow">${pick(l,'Plánované zahájení prodeje','Planned sales launch')}</p><span class="launch-month">${launchMonth(l,c,false)}</span><span class="launch-year">${launchDate(c).slice(0,4)}</span></div><div><h2>${pick(l,'O začátku vám<br><em>dáme vědět.</em>','We’ll let you know<br><em>when it begins.</em>')}</h2><p>${pick(l,`Certifikace probíhá. Oficiální prodej plánujeme zahájit po jejím úspěšném dokončení. Očekávaný termín je ${launchMonth(l,c)} a může se změnit.`,`Certification is in progress. Official sales will begin after successful certification. Our expected launch is ${launchMonth(l,c)}, and this date may change.`)}</p><div class="actions">${launchCTA(l)}</div><p class="small">${pick(l,'Zadání e-mailu není objednávka ani rezervace.','Submitting your email is not an order or a reservation.')}</p></div></div></section>`;

export function launchDialog(l,c){
  const ready=launchReady(c);
  const consent=pick(l,'Souhlasím se zasláním zprávy o zahájení prodeje a s kontaktováním ohledně mého zájmu o kamna WATRA.','I agree to receive a sales launch notification and to be contacted about my interest in WATRA sauna heaters.');
  const mail=c.email?`<a data-event="email_click" href="mailto:${escape(c.email)}?subject=${encodeURIComponent(pick(l,'Zájem o zahájení prodeje WATRA','WATRA sales launch interest'))}">${escape(c.email)}</a>`:'';
  return `<dialog id="launch-dialog" aria-labelledby="launch-title" aria-describedby="launch-description" data-clarity-mask="true">
    <div class="launch-popup">
      <button class="launch-close" type="button" data-launch-close aria-label="${pick(l,'Zavřít okno','Close dialog')}" autofocus>×</button>
      <div class="launch-visual"><img src="/media/modelHybridGlow-960.webp" alt="${pick(l,'IRIKON +e — vizualizace ohně a elektrického žáru','IRIKON +e — visualization of fire and electric glow')}" width="1600" height="1067" loading="lazy" decoding="async"><span>IRIKON <em>+e</em></span></div>
      <div class="launch-content">
        <div class="launch-signup">
          <p class="eyebrow">${pick(l,'WATRA / Buďte u začátku','WATRA / Be there from the start')}</p>
          <h2 id="launch-title">${pick(l,'Vaše sauna.<br><em>Už brzy.</em>','Your sauna.<br><em>Coming soon.</em>')}</h2>
          <p id="launch-description">${pick(l,'Nechte nám e-mail. Ozveme se vám při zahájení prodeje a případně spolu probereme váš zájem o kamna WATRA.','Leave your email. We’ll let you know when sales begin and can discuss your interest in WATRA sauna heaters.')}</p>
          <p class="launch-sale-date">${pick(l,'Plánovaný prodej:','Planned sales launch:')} ${launchMonth(l,c)}</p>
          <p class="launch-cert-note">${pick(l,'Certifikace právě probíhá. Prodej zahájíme po jejím úspěšném dokončení. Termín se může změnit.','Certification is in progress. Sales will begin after successful certification. The planned date may change.')}</p>
          ${!ready?`<div class="launch-unavailable" role="note">${pick(l,'Automatické přihlášení připravujeme. Zájem nám zatím můžete napsat přímo:','Email signup is coming soon. For now, tell us about your interest directly:')} ${mail||`<a href="${contact(l)}">${pick(l,'Kontakt','Contact')}</a>`}</div>`:''}
          <form id="launch-form" data-ready="${ready}" ${ready?`action="https://formspree.io/f/${escape(c.formspreeId)}" method="post"`:''}>
            <fieldset ${!ready?'disabled':''}>
              <label for="launch-email">${pick(l,'Váš e-mail','Your email')}</label>
              <input id="launch-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="${pick(l,'vas@email.cz','you@example.com')}" required>
              <label class="launch-consent"><input name="contact_consent" type="checkbox" value="yes" required><span>${consent}</span></label>
              <input type="hidden" name="lead_type" value="launch_notification">
              <input type="hidden" name="language" value="${l}">
              <input type="hidden" name="source_page" value="/${l}/">
              <input type="hidden" name="consent_version" value="launch-2026-09-10">
              <input type="hidden" name="consent_text" value="${escape(consent)}">
              <div class="honey" aria-hidden="true"><label>Leave empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
              <button type="submit" class="button" ${!ready?'disabled':''}>${pick(l,'Dejte mi vědět','Keep me informed')}</button>
            </fieldset>
            <p class="launch-privacy">${pick(l,'Bez platby a závazku. Souhlas můžete kdykoli odvolat.','No payment or commitment. You can withdraw your consent at any time.')}<br><a href="${privacy(l)}">${pick(l,'Jak použijeme váš e-mail','How we use your email')}</a></p>
            <p id="launch-status" role="status" aria-live="polite" tabindex="-1"></p>
          </form>
          <button class="launch-later" type="button" data-launch-close>${pick(l,'Zatím si chci prohlédnout kamna','I’d like to explore the heaters first')}</button>
        </div>
        <div class="launch-success" hidden><p class="eyebrow">${pick(l,'Děkujeme za váš zájem','Thank you for your interest')}</p><h2 id="launch-success-title">${pick(l,'Ozveme se vám.<br><em>Až přijde čas.</em>','We’ll be in touch.<br><em>When it’s time.</em>')}</h2><p id="launch-success-description">${pick(l,'Váš zájem jsme přijali. O zahájení prodeje vám dáme vědět na uvedený e-mail.','We’ve received your interest. We’ll notify you at the email you provided when sales begin.')}</p><button class="button" type="button" data-launch-close>${pick(l,'Pokračovat na web','Continue browsing')}</button></div>
      </div>
    </div>
  </dialog>`;
}
