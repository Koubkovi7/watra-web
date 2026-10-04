import {launchMonth} from './launch.mjs';
import {modeIcon} from './mode-icons.mjs';

const pick = (lang, cs, en) => lang === 'cs' ? cs : en;
const photo = (name, alt, {eager = false, sizes = '(max-width: 760px) calc(100vw - 40px), 50vw'} = {}) =>
  `<img src="/media/${name}-960.webp" srcset="/media/${name}-480.webp 480w, /media/${name}-960.webp 960w, /media/${name}-1600.webp 1600w" sizes="${sizes}" width="1600" height="1200" alt="${alt}" loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''} decoding="async">`;

export function renderProject(lang, config) {
  const t = (cs, en) => pick(lang, cs, en);
  const link = key => `/${lang}/${({hybrid: ['proc-hybrid', 'why-hybrid'], models: ['modely', 'models'], contact: ['kontakt', 'contact'], cert: ['certifikace', 'certification']})[key][lang === 'cs' ? 0 : 1]}/`;
  const moments = [
    ['hybrid', t('Když nechci dlouho čekat', 'When I want a faster start'), t('Zatopím dřevem a zapnu i elektrickou část. Saunu nahřívají oba zdroje, takže můžu přikládat pozvolněji. Po dosažení nastavené teploty regulace elektrická tělesa vypne; oheň může dál hořet.', 'I light a wood fire and switch on the electric heating. Both sources warm the sauna, so I can take a gentler approach to adding logs. At the set temperature, the controller switches off the elements while the fire can keep burning.')],
    ['wood', t('Přiložit před posledním kolem?', 'More wood before the last round?'), t('Nechám zapnutou elektrickou regulaci. Dokud teplo ze dřeva stačí, tělesa netopí. Pokud teplota klesne, například při dohořívání nebo větrání, elektřina podle potřeby přitopí.', 'I leave the electric controller on. While the wood fire provides enough heat, the elements stay off. If the temperature drops as the fire dies down or the sauna is aired, electricity tops up the heat as needed.')],
    ['electric', t('Když chceme ještě jedno kolo', 'When we want one more round'), t('Už nemusím znovu přikládat. Zapnu elektrickou regulaci a další nahřívání nechám na elektřině. Saunování tak nemusí skončit jen proto, že oheň dohasíná.', 'I do not need to add more logs. I switch on the electric controller and let electricity provide the extra heat. Our sauna session does not have to end just because the fire is dying down.')]
  ];
  return `<article class="project-story">
    <section class="project-hero wrap" aria-labelledby="project-title">
      <div class="project-hero-copy">
        <p class="eyebrow">${t('Příběh WATRA / od roku 2024', 'The WATRA story / since 2024')}</p>
        <h1 id="project-title">${t('Začalo to saunou.<br><em>A jednou otázkou.</em>', 'It started with a sauna.<br><em>And one question.</em>')}</h1>
        <p class="project-lead">${t('Saunová kamna na dřevo, nebo na elektřinu? Chtěl jsem atmosféru ohně i pohodlí elektrického vytápění. A nechtěl jsem se jednoho vzdát.', 'A wood-fired sauna heater, or an electric one? I wanted the atmosphere of a fire and the convenience of electric heating. And I did not want to give either up.')}</p>
        <p class="project-byline"><span>Richard Koubek</span>${t('Zakladatel WATRA', 'Founder of WATRA')}</p>
        <a class="text-link" href="#zacatek">${t('Jak vznikla hybridní saunová kamna', 'How the hybrid sauna heater began')}</a>
      </div>
      <figure class="project-hero-photo">${photo('sauna-frame', t('Dřevěná konstrukce rodinné sauny během stavby mezi stromy', 'Timber frame of our family sauna under construction among the trees'), {eager: true})}<figcaption>${t('Stavba naší rodinné sauny. Tady příběh začal.', 'Building our family sauna. This is where the story began.')}</figcaption></figure>
    </section>

    <ol class="project-milestones wrap" id="casova-osa" aria-label="${t('Milníky projektu', 'Project milestones')}">
      <li class="milestone-year"><time class="milestone-date" datetime="2024">2024</time><span class="milestone-point" aria-hidden="true"></span><p class="milestone-copy">${t('Nápad pro vlastní saunu', 'An idea for our own sauna')}</p></li>
      <li class="milestone-year"><time class="milestone-date" datetime="2025">2025</time><span class="milestone-point" aria-hidden="true"></span><p class="milestone-copy">${t('První prototyp', 'The first prototype')}</p></li>
      <li class="milestone-interval"><span class="milestone-date" aria-hidden="true"></span><span class="milestone-point" aria-hidden="true"></span><p class="milestone-copy">${t('Testování prototypu', 'Prototype testing')}</p></li>
      <li class="milestone-year"><time class="milestone-date" datetime="2026">2026</time><span class="milestone-point" aria-hidden="true"></span><p class="milestone-copy">${t('Cesta k uvedení na trh', 'Preparing for launch')}</p></li>
    </ol>

    <section class="project-chapter wrap" id="zacatek" aria-labelledby="project-beginning">
      <div class="project-chapter-heading"><p class="eyebrow">${t('01 / Vlastní sauna', '01 / Our own sauna')}</p><h2 id="project-beginning">${t('Dům byl hotový.<br><em>Na řadě byla sauna.</em>', 'The house was finished.<br><em>The sauna was next.</em>')}</h2></div>
      <div class="project-prose">
        <p>${t('Na začátku roku 2024 jsem dokončil stavbu našeho rodinného domu. S manželkou jsme vybrali místo pro saunu i otužování. Pak přišlo rozhodování, které jsem nečekal: čím budeme topit?', 'At the beginning of 2024, I finished building our family home. My wife and I chose a place for a sauna and somewhere to cool down. Then came a decision I had not expected: how would we heat it?')}</p>
        <p>${t('Procházel jsem saunové diskuze, ptal se přátel i prodejců. Miluji praskání ohně, přípravu dřeva a chvíli, kdy rodině řeknu: „Sauna už je vytopená, můžeme jít.“ Jindy ale ocením elektrické vytápění bez přikládání a možnost saunu připravit předem, s odpovídající regulací i na dálku.', 'I read sauna discussions and asked friends and suppliers. I love the crackle of a fire, preparing the wood and telling my family: “The sauna is ready. Let’s go.” At other times, I appreciate electric heating without tending a fire, and being able to warm the sauna ahead of time, including remotely with a suitable control system.')}</p>
        <p>${t('Nechtěl jsem si vybrat jednu cestu a později litovat, že jsem se vzdal té druhé.', 'I did not want to choose one way and later regret giving up the other.')}</p>
      </div>
      <div class="project-build-photos">
        <figure>${photo('sauna-front', t('Čelní pohled na rozestavěnou rodinnou saunu s odkrytou dřevěnou konstrukcí', 'Front view of the family sauna under construction, showing the exposed timber frame'))}<figcaption>${t('Vlastní stavba, od základů.', 'Our own build, from the ground up.')}</figcaption></figure>
        <figure>${photo('sauna-timber', t('Boční pohled na dřevěnou konstrukci sauny a střechu během stavby', 'Side view of the sauna timber frame and roof during construction'))}<figcaption>${t('Místo pro společný čas s rodinou.', 'A place for time together as a family.')}</figcaption></figure>
      </div>
    </section>

    <section class="project-development" aria-labelledby="project-prototype"><div class="wrap project-development-grid">
      <figure class="project-workshop"><img src="/media/workshop-960.webp" srcset="/media/workshop-480.webp 480w, /media/workshop-960.webp 960w, /media/workshop-1600.webp 1600w" sizes="(max-width: 760px) calc(100vw - 40px), 40vw" width="1067" height="1600" alt="${t('Richard s prototypem kamen WATRA v dílně', 'Richard with the WATRA heater prototype in the workshop')}" loading="lazy" decoding="async"><figcaption>${t('Richard / vývoj prototypu WATRA', 'Richard / developing the WATRA prototype')}</figcaption></figure>
      <div class="project-prose"><p class="eyebrow">${t('02 / Od otázky k prototypu', '02 / From a question to a prototype')}</p><h2 id="project-prototype">${t('Proč by jedna kamna<br><em>nemohla umět obojí?</em>', 'Why couldn’t one heater<br><em>do both?</em>')}</h2>
        <p>${t('V současnosti pracuji jako CAD konstruktér. U WATRA jsem začal jednoduchou otázkou: proč by jedna kamna nemohla umět obojí? Slyšel jsem i pochybnosti: že to nebude fungovat nebo že nepřítomnost takových kamen na trhu musí mít dobrý důvod. Chtěl jsem si ale odpověď ověřit vlastní prací.', 'I currently work as a CAD design engineer. WATRA began with a simple question: why couldn’t one heater do both? I heard doubts: that it would not work, or that there must be a good reason I could not find such a heater on the market. But I wanted to find the answer by building one.')}</p>
        <p>${t('Přibližně po roce vznikl první prototyp saunových kamen, která spojují spalování dřeva a elektrická topná tělesa v jednom zařízení. V sezóně 2025/26 jsme ho testovali s celou rodinou v naší sauně.', 'Around a year later, the first prototype combined a wood-burning chamber and electric heating elements in one sauna heater. Throughout the 2025/26 season, our whole family tested it in our sauna.')}</p>
        <p class="project-emphasis">${t('Dřevo a elektřina fungují nezávisle. Můžu použít jeden zdroj, nebo oba současně.', 'Wood and electricity work independently. I can use either source, or both together.')}</p>
      </div>
    </div></section>

    <section class="project-experience wrap" aria-labelledby="project-family"><div class="project-experience-heading"><p class="eyebrow">${t('03 / Z rodinného saunování', '03 / Lessons from our family sauna')}</p><h2 id="project-family">${t('Oheň zůstal.<br><em>Přibyla možnost volby.</em>', 'The fire stayed.<br><em>We gained a choice.</em>')}</h2><p>${t('Pořád nejraději zapaluji oheň. Elektřina mi ale pomáhá právě ve chvílích, kdy nechci celý průběh saunování řídit přikládáním.', 'I still prefer lighting a fire. But electricity helps at the moments when I do not want the whole sauna session to depend on adding logs.')}</p></div>
      <div class="project-moments">${moments.map(([icon,title,body]) => `<section><span class="mode-emblem">${modeIcon(icon)}</span><h3>${title}</h3><p>${body}</p></section>`).join('')}</div>
      <div class="project-experience-foot"><p>${t('Regulace řídí pouze elektrická topná tělesa. Hoření dřeva probíhá nezávisle.', 'The controller only regulates the electric heating elements. Wood combustion operates independently.')}</p><a class="text-link" href="${link('hybrid')}">${t('Více o hybridním vytápění', 'More about hybrid heating')}</a></div>
    </section>

    <section class="project-memory wrap" aria-labelledby="project-irikon"><div class="project-memory-inner">
      <p class="eyebrow">${t('Jméno, které má svůj příběh', 'A name with a story')}</p><h2 id="project-irikon">IRIKON</h2>
      <p class="project-memory-dedication">${t('Na památku Jiřího Novotného.', 'In memory of Jiří Novotný.')}</p>
      <p>${t('Můj tchán Jiří Novotný nás v roce 2026 nečekaně opustil. Byl pro mě velkým vzorem i mentorem. V jeho dílně jsem se učil svařování, zámečnické i další strojírenské práci. Mnohokrát mi pomohl a předal mi část zkušeností, které sbíral celý život.', 'My father-in-law, Jiří Novotný, passed away unexpectedly in 2026. He was a role model and mentor to me. In his workshop, I learned about welding, metalworking and engineering. He helped me many times and shared some of the experience he had gathered over a lifetime.')}</p>
      <p>${t('Irikon byl volací název jeho rogala. Dnes toto jméno nesou naše kamna — jako vzpomínku a poděkování.', 'Irikon was the call sign of his hang glider. Today our heaters carry that name, in remembrance and gratitude.')}</p>
      <p class="project-memory-signature">Richard</p>
    </div></section>

    <section class="project-next wrap" aria-labelledby="project-today"><div><p class="eyebrow">${t('Kde jsme dnes', 'Where we are today')}</p><h2 id="project-today">${t('Z naší sauny<br><em>třeba i do té vaší.</em>', 'From our sauna<br><em>to yours, perhaps.</em>')}</h2><p>${t('Konstrukce kamen je hotová. Prototyp absolvoval předběžnou zkoušku ve Strojírenském zkušebním ústavu v Brně, kde se ověřovaly jeho parametry. Finální certifikace stále probíhá.', 'The heater design is complete. The prototype underwent preliminary testing at the Engineering Test Institute in Brno to verify its parameters. Final certification is still in progress.')}</p><p>${t('Teď chci zjistit, jestli nejsem sám, kdo už se nechce rozhodovat mezi dřevem a elektřinou. Pokud to máte podobně, rád uslyším o vaší sauně.', 'Now I want to find out whether others also want to stop choosing between wood and electricity. If that sounds like you, I would love to hear about your sauna.')}</p></div>
      <aside class="project-release" aria-label="${t('Stav projektu a dostupnost', 'Project status and availability')}"><p class="eyebrow"><span class="dot" aria-hidden="true"></span> ${t('Certifikace probíhá', 'Certification in progress')}</p><p>${t('Oficiální prodej plánujeme na', 'Sales are planned for')}</p><p class="project-release-date">${launchMonth(lang,config)}</p><p class="small">${t('Zahájení prodeje závisí na úspěšném dokončení certifikace. Termín se může změnit.', 'Sales will begin after successful certification. The planned date may change.')}</p><a class="text-link" href="${link('cert')}">${t('Stav a dostupnost', 'Status and availability')}</a></aside>
      <div class="project-next-actions"><a class="button" href="${link('contact')}">${t('Proberme vaši saunu', 'Let’s discuss your sauna')}</a><a class="text-link" href="${link('models')}">${t('Prohlédnout modely IRIKON', 'Explore the IRIKON models')}</a><p class="small">${t('Nyní sbíráme nezávazné zájmy. Bez platby a bez závazku.', 'We are currently collecting expressions of interest. No payment or commitment.')}</p></div>
    </section>
  </article>`;
}
