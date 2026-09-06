# WATRA

Statická dvoujazyčná prezentace WATRA IRIKON a IRIKON e pro Cloudflare Pages.

## Místní spuštění

Node.js 22 nebo novější. Sestavení nemá závislosti třetích stran.

1. npm run build
2. npm run dev
3. npm test

Náhled: http://localhost:3010/cs/. Místní server na / používá češtinu; Cloudflare přesměrování podle země testují jednotkové testy a poté živé nasazení.

- src/pages.mjs: HTML a obsah obou jazyků.
- public/style.css, public/components.css: vzhled a responzivní pravidla.
- public/app.js: navigace, galerie, formulář, souhlasy a připravené integrace.
- site.config.json: veřejné kontakty a ID. Tajné klíče sem nepatří.
- functions/index.js, functions/tv.js: přesměrování vstupních adres.
- public/_headers: bezpečnostní hlavičky a noindex pro pages.dev.
- asset-manifest.json: vazba použitých pracovních fotografií na originály.
- SLUZBY-A-SPUSTENI.md: účty, nastavení měření a kroky k ostrému spuštění.

Cloudflare: větev redesign, příkaz node scripts/build.mjs, výstup dist. GitHub hlavní větev a DNS domény mají samostatný postup přechodu.

Všechny běžné podstránky jsou statické. Soubor _routes.json omezuje spuštění Functions na / a /tv; výpadek formulářové služby nebrání čtení webu. Formspree je externí úložiště poptávek, web nemá vlastní databázi.

Fotografie jsou pracovní náhledy. Pro jejich nové zpracování slouží scripts/prepare-assets.cjs, který vyžaduje místně dostupný Sharp a původní soubory mimo repozitář. Běžné nasazení tento krok nepotřebuje.

Testy ověřují lokalizované cesty a odkazy, metadata, přesměrování, ochranu náhledů, podmíněné měření, odvolání souhlasu a chybové i úspěšné odeslání formuláře pomocí simulované služby. Neodesílají skutečné poptávky.
