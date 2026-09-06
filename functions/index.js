export function chooseLanguage(request) {
  const saved=(request.headers.get('cookie')||'').match(/(?:^|;\s*)watra_lang=(cs|en)(?:;|$)/);
  if(saved) return saved[1];
  if(request.cf?.country) return request.cf.country==='CZ'?'cs':'en';
  const languages=(request.headers.get('accept-language')||'').split(',').map((part,index)=>{
    const [name,quality]=part.trim().split(';q=');
    return {name:name.toLowerCase().split('-')[0],q:quality===undefined?1:Number(quality),index};
  }).filter(item=>item.q>0).sort((a,b)=>b.q-a.q||a.index-b.index);
  return languages[0]?.name==='cs'?'cs':'en';
}
export function redirectTo(request, pathname, extra={}) {
  const from=new URL(request.url), target=new URL(pathname,from);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid']) {
    const value=from.searchParams.get(key);
    if(value && /^[a-zA-Z0-9_.~ +-]{1,200}$/.test(value)) target.searchParams.set(key,value);
  }
  for(const [k,v] of Object.entries(extra)) target.searchParams.set(k,v);
  const headers={Location:target.href,'Cache-Control':'private, no-store','Vary':'Cookie, Accept-Language','Referrer-Policy':'strict-origin-when-cross-origin'};
  if(from.hostname.endsWith('.pages.dev')) headers['X-Robots-Tag']='noindex';
  return new Response(null,{status:302,headers});
}
export function onRequest({request}) {
  return redirectTo(request,'/'+chooseLanguage(request)+'/');
}
