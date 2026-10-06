const text = (lang, cs, en) => lang === 'cs' ? cs : en;

export const heatShieldPhotos = {
  heatShields: {
    width: 1154, height: 1363,
    cs: 'Vizualizace · Saunová kamna WATRA s nerezovými ochrannými štíty',
    en: 'Visualization · WATRA sauna heater with stainless-steel heat shields'
  },
  heatShieldsExploded: {
    width: 1122, height: 1402,
    cs: 'Vizualizace · Zadní nerezový štít vysunutý pro ukázku jednotlivých dílů',
    en: 'Visualization · Rear stainless-steel shield raised to show the separate panels'
  }
};

export function heatShieldImage(name, lang, {sizes = '(max-width: 760px) calc(100vw - 40px), 50vw'} = {}) {
  const photo = heatShieldPhotos[name];
  return `<img src="/media/${name}-960.webp" srcset="/media/${name}-480.webp 480w, /media/${name}-960.webp 960w, /media/${name}-1600.webp 1600w" sizes="${sizes}" width="${photo.width}" height="${photo.height}" alt="${photo[lang]}" loading="lazy" decoding="async">`;
}

export function renderHeatShields(lang, isHybrid = false) {
  const contact = `/${lang}/${lang === 'cs' ? 'kontakt' : 'contact'}/?type=technical&model=${encodeURIComponent(isHybrid ? 'IRIKON +e' : 'IRIKON')}`;
  return `<section class="section wrap heat-shields" id="ochranne-stity" aria-labelledby="heat-shields-title">
    <figure class="heat-shields-figure"><a href="/media/heatShieldsExploded-1600.webp" data-gallery>${heatShieldImage('heatShieldsExploded', lang)}</a><figcaption>${text(lang, 'Vizualizace · Zadní díl je vysunutý pro názornost.', 'Visualization · The rear panel is raised to show it as a separate part.')}</figcaption></figure>
    <div class="heat-shields-copy"><p class="eyebrow">${text(lang, 'Příslušenství / Pro oba modely', 'Accessories / For both models')}</p>
      <h2 id="heat-shields-title">${text(lang, 'Nerezové štíty.<br><em>Po jednotlivých dílech.</em>', 'Stainless-steel shields.<br><em>Panel by panel.</em>')}</h2>
      <p>${text(lang, 'Nerezové ochranné štíty pro saunová kamna WATRA IRIKON a IRIKON +e budou k dispozici po jednotlivých dílech. Jejich počet zvolíte podle stěn, které potřebujete chránit.', 'Stainless-steel heat shields for WATRA IRIKON and IRIKON +e sauna heaters will be available as individual panels. Choose the number of panels to suit the walls you need to protect.')}</p>
      <a class="text-link" href="${contact}">${text(lang, 'Mám zájem o štíty', 'Ask about heat shields')}</a>
    </div>
  </section>`;
}
