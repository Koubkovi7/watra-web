const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const formDomainAttribute=c=>c.formDomain?` data-domain="${esc(c.formDomain)}"`:'';
export const formDomainNotice=(l,c,page)=>c.formDomain?`<div class="form-notice" data-form-domain-note hidden>${l==='cs'?'Toto je náhled webu. Pro odeslání zájmu přejděte na':'This is a preview. To send your interest, continue to'} <a href="${esc(c.origin)}/${l}/${page==='contact'?(l==='cs'?'kontakt/':'contact/'):''}">${esc(c.formDomain)}</a>.</div>`:'';
