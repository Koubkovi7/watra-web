import {moodImage} from './mood.mjs';
const t=(l,cs,en)=>l==='cs'?cs:en;
const product=l=>`/${l}/${l==='cs'?'modely':'models'}/irikon-e/`;
const contact=l=>`/${l}/${l==='cs'?'kontakt':'contact'}/?model=IRIKON%20%2Be&type=technical`;
const icons={
  time:'<circle cx="24" cy="26" r="15"/><path d="M24 17v10l7 4M19 5h10M24 5v6M35 13l4-4"/>',
  temperature:'<path d="M19 29V11a5 5 0 0 1 10 0v18a10 10 0 1 1-10 0Z"/><path d="M24 15v20M29 14h6M29 21h4"/><circle cx="24" cy="36" r="2"/>',
  electric:'<path d="m27 5-16 23h12l-2 15 16-24H25l2-14Z"/>',
  air:'<path d="M7 17h24a5 5 0 1 0-5-5M7 25h32a4 4 0 1 1-4 4M7 33h13a5 5 0 1 1-5 5"/>'
};
const icon=name=>`<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

export function renderHybrid(l,faq,launchDate){
  const cases=[
    {id:'rychlost',icon:'time',title:t(l,'Když chcete do sauny dřív','When you want to sauna sooner'),
      body:t(l,'Při nahřívání zapojíte dřevo i elektřinu současně. Hybridní saunová kamna tak dosáhnou požadované teploty rychleji.', 'Use wood and electricity together during warm-up. Your hybrid sauna heater brings the sauna up to temperature sooner.'),
      extra:`<p class="hy-quick-times"><span>${t(l,'Dřevo','Wood')} <strong>≈90 min</strong></span><span>${t(l,'Elektřina','Electricity')} <strong>≈60 min</strong></span><span>${t(l,'Společně','Combined')} <strong>≈35 min*</strong></span></p>`},
    {id:'posledni-kolo',icon:'temperature',title:t(l,'Poslední kolo bez dalšího polena','One last round, without another log'),
      body:t(l,'Dřevo dohořívá? Zapnete regulaci elektrické části. Dotop se spustí, jen pokud ho vyžaduje teplota v sauně — když teplo ze dřeva stačí, tělesa zůstanou vypnutá.', 'Is the fire burning down? Switch on the electric controller. It adds heat only when the sauna temperature calls for it. If the wood fire provides enough heat, the elements stay off.')},
    {id:'bez-prikladani',icon:'electric',title:t(l,'Po práci bez zatápění','After work, without lighting a fire'),
      body:t(l,'Elektrický ohřev sauny funguje samostatně, bez dřeva a přikládání. S kompatibilní regulací a splněním bezpečnostních podmínek lze saunu nahřát i na dálku.', 'Electric sauna heating works independently, without logs or tending a fire. Remote warm-up is possible with a compatible controller and the required safety measures.')},
    {id:'po-vetrani',icon:'air',title:t(l,'Teplo i po delší pauze','Warmth after a longer break'),
      body:t(l,'Po větrání nebo pauze mezi koly může teplota klesnout. Elektrický dotop podle potřeby doplní teplo, zatímco ve spalovací části může dál hořet dřevo.', 'Ventilation or a break between rounds can lower the temperature. Electric top-up adds heat as needed while wood can keep burning independently in the firebox.')}
  ];
  return `<div class="hybrid-page">
    <section class="hy-hero wrap">
      <div class="hy-hero-copy">
        <p class="eyebrow"><span class="hy-name">IRIKON <span class="hy-plus">+e</span></span> / ${t(l,'Proč hybrid','Why hybrid')}</p>
        <h1>${t(l,'Atmosféra kamen na dřevo.<br><em>Pohodlí elektrického ohřevu.</em>','The atmosphere of a wood fire.<br><em>The convenience of electric heat.</em>')}</h1>
        <p class="hy-lead">${t(l,'Hybridní saunová kamna IRIKON +e spojují vytápění dřevem a elektrický ohřev. Oba zdroje fungují samostatně i společně.', 'IRIKON +e hybrid sauna heaters combine wood-fired and electric heating. The two heat sources work independently or together.')}</p>
        <a class="text-link" href="#situace">${t(l,'Kdy se hybrid hodí','When hybrid makes a difference')}</a>
      </div>
      <figure class="hy-hero-photo">${moodImage('mood5',l,{eager:true,sizes:'(max-width: 900px) calc(100vw - 40px), 52vw'})}<figcaption>${t(l,'Vizualizace sauny · WATRA IRIKON +e','Sauna visualization · WATRA IRIKON +e')}</figcaption></figure>
    </section>
    <section class="hy-usecases wrap" id="situace" aria-labelledby="hy-cases-title">
      <div class="hy-section-heading"><p class="eyebrow">${t(l,'V každodenním provozu','Everyday use')}</p><h2 id="hy-cases-title">${t(l,'Nezávislost <em>ve způsobu vytápění.</em>','The freedom <em>to choose your heat.</em>')}</h2><p class="hy-section-intro">${t(l,'Už si nemusíte vybírat mezi saunou na dřevo a elektřinou. Hybridní kamna WATRA zvládnou obojí — samostatně i společně.', 'You no longer have to choose between a wood-fired and an electric sauna. WATRA hybrid heaters offer both — independently or together.')}</p></div>
      <div class="hy-case-grid">${cases.map(c=>`<article class="hy-case" id="${c.id}"><div class="hy-case-icon">${icon(c.icon)}</div><div class="hy-case-copy"><h3>${c.title}</h3><p>${c.body}</p>${c.extra||''}</div></article>`).join('')}</div>
      <p class="hy-footnote">${t(l,'* Všechny časy jsou orientační: sauna 10 m³, venku 0–5 °C, cílová teplota 80–90 °C. Výsledek ovlivňuje výchozí teplota, izolace, větrání i kvalita dřeva.', '* All times are approximate: 10 m³ sauna, outdoors 0–5 °C, target temperature 80–90 °C. Starting temperature, insulation, ventilation and wood quality affect the result.')}</p>
    </section>
    ${faq}
    <section class="hy-closing wrap">
      <div><h2>${t(l,'Dřevo i elektřina. <em>V jedněch kamnech.</em>','Wood and electricity. <em>In one heater.</em>')}</h2>
        <p>${t(l,'Certifikace probíhá. Zahájení prodeje plánujeme na '+launchDate+' po jejím dokončení.', 'Certification is in progress. Sales are planned for '+launchDate+', subject to its completion.')}</p></div>
      <div class="actions"><a class="button" href="${product(l)}">${t(l,'Prohlédnout IRIKON +e','Explore IRIKON +e')}</a><a class="text-link" href="${contact(l)}">${t(l,'Probrat moji saunu','Discuss my sauna')}</a></div>
    </section>
  </div>`;
}
