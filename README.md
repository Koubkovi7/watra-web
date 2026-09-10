# WATRA

Statická dvoujazyčná prezentace WATRA IRIKON a IRIKON +e pro Cloudflare Pages.

## Místní spuštění

Node.js 22 nebo novější. Sestavení nemá závislosti třetích stran.

1. npm run build
2. npm run dev
3. npm test

Náhled: http://localhost:3010/cs/. Místní server na / používá češtinu; Cloudflare přesměrování podle země testují jednotkové testy a poté živé nasazení.

- src/pages.mjs: HTML a obsah obou jazyků.
- public/style.css, public/components.css: vzhled a responzivní pravidla.
- public/app.js: navigace, galerie, formulář, souhlasy a připravené integrace.
- src/launch.mjs, public/launch.css a public/launch.js: informace o zahájení prodeje a e-mailové okno na CS/EN homepage, otevírané pouze kliknutím.
- site.config.json: veřejné kontakty a ID. Tajné klíče sem nepatří.
- functions/index.js, functions/tv.js: přesměrování vstupních adres.
- public/_headers: bezpečnostní hlavičky a noindex pro pages.dev.
- asset-manifest.json: vazba použitých pracovních fotografií na originály.
- SLUZBY-A-SPUSTENI.md: účty, nastavení měření a kroky k ostrému spuštění.

Cloudflare: větev redesign, příkaz node scripts/build.mjs, výstup dist. GitHub hlavní větev a DNS domény mají samostatný postup přechodu.

Všechny běžné podstránky jsou statické. Soubor _routes.json omezuje spuštění Functions na / a /tv; výpadek formulářové služby nebrání čtení webu. Formspree je externí úložiště poptávek, web nemá vlastní databázi.

Fotografie jsou pracovní náhledy. Pro jejich nové zpracování slouží scripts/prepare-assets.cjs, který vyžaduje místně dostupný Sharp a původní soubory mimo repozitář. Běžné nasazení tento krok nepotřebuje.

Testy ověřují lokalizované cesty a odkazy, metadata, přesměrování, ochranu náhledů, podmíněné měření, odvolání souhlasu a chybové i úspěšné odeslání formuláře pomocí simulované služby. Neodesílají skutečné poptávky.

## Zahájení prodeje a upozornění e-mailem

Plán prodeje má samostatné nastavení launchExpected (YYYY-MM), oddělené od certificationExpected. Obě hodnoty jsou nyní listopad 2026. Homepage výslovně podmiňuje zahájení prodeje úspěšnou certifikací a uvádí možnost změny termínu.

Okno se nikdy neotevírá automaticky. Bez JavaScriptu odkazy vedou na kontaktní stránku. Aktivace příjmu vyžaduje platné formspreeId, email a dokončené informace o zpracování údajů (privacyApproved). Do té doby jsou pole vypnutá a okno nabízí přímý e-mail.

Formspree dostane lead_type=launch_notification, jazyk, zdrojovou stránku a čas, verzi a text výslovného souhlasu. Úspěch se zobrazí až po potvrzeném přijetí službou; při chybě zůstanou údaje vyplněné. E-mail ani obsah polí nejdou do analytiky. Událost generate_lead respektuje existující analytické/reklamní souhlasy. Clarity se na stránkách s tímto formulářem nespouští.

Před aktivací dokončit informace o příjemcích, době uchování, odvolání souhlasu a právech zájemců. Ověřit reálný test ve Formspree i cílové schránce. Automatické potvrzovací e-maily / double opt-in vyžadují samostatné nastavení ve službě; web je neslibuje.

## Logo a plamen při načítání

Dodané PNG jsou v public/brand: logo, symbol-wg (zlatý plamen, bílé W), symbol-gg (zlatá), symbol-w (bílá). Originály byly zkopírovány beze změny. Favicony 32/48 px a ikona 180 px vycházejí ze zlatého symbolu.

Ukázka /ukazka-animace/ je mimo sitemap a má noindex. Umožňuje přepnout barvu a vyzkoušet třísekundové čekání bez síťového odeslání.

Vybraná výchozí varianta načítacího symbolu je celá zlatá (symbol-gg): zlatý plamen i W. Platí pro galerii, odesílání poptávky i ukázku.

Animaci zajišťuje public/brand.css, indikátor public/loading.js. CSS odděluje plamen a W přímo z původního průhledného PNG; W zůstává pevné. Při prefers-reduced-motion je symbol statický.

WatraLoading.start(container, {label, overlay, variant}) vrací funkci pro ukončení čekání. Indikátor se objeví až po 180 ms a zmizí okamžitě po dokončení. Více souběžných operací v jednom kontejneru sdílí indikátor. WatraLoading.image obsluhuje načítání galerie včetně chyby a změny fotografie před dokončením předchozího načítání. Odesílání poptávky používá stejný indikátor; integrační účty zůstávají nenastavené.


## Zapojený příjem formulářů

Formspree: projekt WATRA, veřejné ID mppzbljw, cílový e-mail richard@watra.cz. Stejný formulář přijímá kontaktní poptávky a launch_notification z homepage. Formspree omezuje příjem na watra.cz a subdomény; app.js podle data-domain na jiných hostitelích vypne odesílání a ukáže odkaz na produkci. Lokální testy neobcházejí toto omezení.

src/privacy.mjs obsahuje CS/EN informace o skutečném zpracování; retention a retentionEn v site.config.json obsahují odsouhlasených nejvýše 12 měsíců od poslední komunikace. Tato informace sama nemaže externí e-maily ani exporty. Provozní kroky a limity jsou v SLUZBY-A-SPUSTENI.md.
