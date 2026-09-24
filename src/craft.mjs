export function craftSection(lang) {
  const cs = lang === 'cs';
  const photos = [
    { name: 'handle', caption: cs ? 'Dřevěná rukojeť' : 'Wooden handle', alt: cs ? 'Detail dřevěné rukojeti dvířek kamen IRIKON' : 'Close-up of the wooden door handle on the IRIKON heater' },
    { name: 'logoDetail', caption: cs ? 'Podpis WATRA v oceli' : 'The WATRA signature in steel', alt: cs ? 'Detail označení WATRA v ocelových dvířkách kamen' : 'Close-up of the WATRA mark in the steel heater door' }
  ];
  return `<section class="craft wrap" id="detaily" aria-labelledby="craft-title">
    <div class="craft-heading">
      <div><p class="eyebrow">${cs ? 'Zblízka' : 'A closer look'}</p><h2 id="craft-title">${cs ? 'Charakter je<br><em>v detailech.</em>' : 'Character lives<br><em>in the details.</em>'}</h2></div>
      <p class="craft-intro">${cs ? 'Dotek dřeva. Struktura oceli.<br>Podpis WATRA.' : 'The touch of wood. The texture of steel.<br>The WATRA signature.'}</p>
    </div>
    <div class="craft-gallery">${photos.map(photo => `<figure class="craft-detail craft-detail-${photo.name}">
      <div class="craft-image"><img src="/media/${photo.name}-960.webp" srcset="/media/${photo.name}-480.webp 480w, /media/${photo.name}-960.webp 960w, /media/${photo.name}-1600.webp 1600w" sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 900px) calc((100vw - 68px) / 2), (max-width: 1392px) calc((100vw - 136px) / 2), 628px" width="1067" height="1600" alt="${photo.alt}" loading="lazy" decoding="async"></div>
      <figcaption>${photo.caption}</figcaption>
    </figure>`).join('')}</div>
  </section>`;
}
