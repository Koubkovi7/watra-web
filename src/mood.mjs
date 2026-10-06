const text = (lang, cs, en) => lang === 'cs' ? cs : en;

export const moodPhotos = {
  mood1: { width: 1586, height: 992, cs: 'Vizualizace sauny s kamny WATRA IRIKON a výhledem na jezero', en: 'Sauna visualization with a WATRA IRIKON heater and a lake view' },
  mood2: { width: 1122, height: 1402, cs: 'Vizualizace světlé dřevěné sauny s kamny WATRA IRIKON', en: 'Visualization of a light timber sauna with a WATRA IRIKON heater' },
  mood3: { width: 1122, height: 1402, cs: 'Vizualizace kamen WATRA IRIKON v tmavé sauně s výhledem do lesa', en: 'Visualization of a WATRA IRIKON heater in a dark sauna overlooking the forest' },
  mood4: { width: 1122, height: 1402, cs: 'Vizualizace saunování s kamny WATRA IRIKON ve světlém dřevěném interiéru', en: 'Visualization of a sauna session with a WATRA IRIKON heater in a light timber interior' },
  mood5: { width: 1536, height: 1024, model: 'IRIKON +e', cs: 'Vizualizace hybridních kamen WATRA IRIKON +e se žhnoucími elektrickými tělesy a dohořívajícím dřevem', en: 'Visualization of a WATRA IRIKON +e hybrid heater with glowing electric elements and the wood fire burning down' },
  mood6: { width: 1536, height: 1024, cs: 'Vizualizace saunových kamen WATRA IRIKON s dohořívajícím dřevem v tmavé sauně', en: 'Visualization of a WATRA IRIKON wood-fired sauna heater with glowing embers in a dark sauna' }
};

export function moodImage(name, lang, { eager = false, sizes = '(max-width: 760px) calc(100vw - 40px), 55vw' } = {}) {
  const photo = moodPhotos[name];
  return `<img src="/media/${name}-960.webp" srcset="/media/${name}-480.webp 480w, /media/${name}-960.webp 960w, /media/${name}-1600.webp ${photo.width}w" sizes="${sizes}" width="${photo.width}" height="${photo.height}" alt="${photo[lang]}" loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''} decoding="async">`;
}

export function moodFigure(name, lang, options = {}) {
  return `<figure class="mood-figure"><div class="mood-frame">${moodImage(name, lang, options)}</div><figcaption>${text(lang, 'Vizualizace sauny', 'Sauna visualization')} · WATRA ${moodPhotos[name].model || 'IRIKON'}</figcaption></figure>`;
}

export function moodHome(lang) {
  return `<section class="mood-home section wrap" aria-labelledby="mood-home-title">
    ${moodFigure('mood1', lang)}
    <div class="mood-home-copy"><p class="eyebrow">${text(lang, 'IRIKON / Připraveno na rozšíření', 'IRIKON / Ready for an upgrade')}</p>
    <h2 id="mood-home-title">${text(lang, 'Kamna na dřevo.<br><em>S možností rozšíření.</em>', 'A wood-fired heater.<br><em>With room to upgrade.</em>')}</h2>
    <p>${text(lang, 'IRIKON vytápí saunu dřevem. Díky přípravě na elektrické rozšíření jej můžete později doplnit na hybridní IRIKON +e.', 'IRIKON heats your sauna with wood. Its built-in provision for electric heating lets you upgrade to the hybrid IRIKON +e later.')}</p>
    <a class="text-link" href="/${lang}/${lang === 'cs' ? 'modely' : 'models'}/irikon/">${text(lang, 'Prohlédnout IRIKON', 'Explore IRIKON')}</a></div>
  </section>`;
}

export function productGallery(lang, studioImage, isHybrid = false) {
  const studio = {
    portraitStove: text(lang, 'Ateliér · WATRA IRIKON s kamennou náplní', 'Studio · WATRA IRIKON with sauna stones'),
    front: text(lang, 'Ateliér · IRIKON zepředu', 'Studio · IRIKON front view'),
    side: text(lang, 'Ateliér · IRIKON z boku', 'Studio · IRIKON side view'),
    rear: text(lang, 'Ateliér · IRIKON zezadu', 'Studio · IRIKON rear view')
  };
  const moods = isHybrid ? ['mood5', 'mood3', 'mood4', 'mood1', 'mood2'] : ['mood3', 'mood4', 'mood1', 'mood2', 'mood6'];
  const names = ['portraitStove', ...moods, 'front', 'side', 'rear'];
  const thumbnails = names.map((name, i) => {
    const caption = moodPhotos[name]?.[lang] || studio[name];
    const photo = moodPhotos[name] ? moodImage(name, lang, { sizes: '90px' }) : studioImage(name, caption).replace('sizes="(max-width: 700px) 100vw, 55vw"', 'sizes="90px"');
    return `<button type="button" data-photo="${name}" data-caption="${caption}" aria-label="${caption}" aria-pressed="${i === 0}">${photo}</button>`;
  }).join('');
  return `<div class="product-gallery gallery-with-mood"><a href="/media/portraitStove-1600.webp" class="gallery-main" data-gallery>${studioImage('portraitStove', studio.portraitStove, '', true)}</a><p class="gallery-caption" data-gallery-caption aria-live="polite">${studio.portraitStove}</p><div class="thumbnails" role="group" aria-label="${text(lang, 'Ateliérové fotografie a vizualizace sauny', 'Studio photographs and sauna visualizations')}">${thumbnails}</div></div>`;
}
