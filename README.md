# WATRA

Statická dvoujazyčná prezentace WATRA IRIKON a IRIKON +e pro Cloudflare Pages.

## Místní spuštění

Node.js 22 nebo novější. Sestavení nemá závislosti třetích stran.

1. npm run build
2. npm run dev
3. npm test

Náhled: http://localhost:3010/cs/. Místní server na / používá češtinu; Cloudflare přesměrování podle země testují jednotkové testy a poté živé nasazení.

- src/pages.mjs: HTML a obsah obou jazyků.
- src/seo.mjs: samostatné titulky a popisy homepage a produktů v češtině a angličtině. Viditelný H1 homepage je oddělený od velkého grafického sloganu.
- src/hybrid.mjs, public/hybrid.css: stránka Proč hybrid / Why hybrid s mood fotografií, krátkými příklady použití a společným FAQ; CSS se načítá jen na této stránce.
- src/project.mjs, public/project.css: osobní příběh WATRA v CS/EN, stavba rodinné sauny, prototyp, rodinné testování v sezóně 2025/26 a vzpomínka na Jiřího Novotného. Předběžná zkouška je odlišená od probíhající certifikace; termín prodeje přebírá konfiguraci. Fotografie sauna-frame/front/timber pocházejí z IMG_0087/0088/0092, jejich JPEG originály zůstávají mimo repozitář a web načítá WebP ve třech velikostech.
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


## Dočasná teaser stránka

Režim určuje siteMode v site.config.json. `teaser` publikuje pouze schválenou úvodní stránku v CS/EN, informace o soukromí a potvrzení kontaktu. Původní prezentace včetně zdrojů, stylů a fotografií zůstává v repozitáři; v tomto režimu se produktové podstránky ani fotografie nekopírují do nasazení. Staré známé adresy mají dočasné přesměrování 302.

Návrat k plné prezentaci: `npm run mode:full`, potom `npm run build`, kontrola a zveřejnění konfigurace ve větvi redesign. Teaser: `npm run mode:teaser`. Jednorázové místní ověření bez změny konfigurace umožňuje proměnná WATRA_SITE_MODE=full nebo teaser. `npm test` ověřuje obě sestavení a na konci ponechá sestavení podle zvoleného režimu.

Příjem teaseru zajišťuje Worker services/forms, soukromá databáze Cloudflare D1 v EU a neviditelný Turnstile. Úspěch se vrací až po uložení. Opakovaný požadavek se stejným UUID a obsahem nevytváří další kontakt. Pole e-mail, telefon a souhlas se ověřují také na serveru. Tajné klíče patří výhradně do Cloudflare Secrets; veřejná konfigurace obsahuje pouze sitekey. Google CRM zatím není připojené. Kontakty jsou dostupné správci v D1 a nová upozornění směřují na ověřenou adresu richard@watra.cz.

Worker se spravuje odděleně od statického webu. Nové nasazení statických stránek samo nezveřejní změny Workeru. Změny backendu vyžadují kontrolu, testy a samostatné nasazení přes jeho wrangler.jsonc. Databázové migrace jsou v services/forms/migrations. Soukromé koncové body /api/watra/crm/* vyžadují CRM_SYNC_SECRET a nesmějí být propojené z veřejné stránky.

### E-mailová upozornění

Modul services/forms/notifications.mjs odesílá oznámení výhradně na richard@watra.cz. Zpráva obsahuje kontakt, jazyk, datum přijetí a souhlas; Reply-To patří zájemci. Odesílání běží až po úspěšném uložení a nezdržuje potvrzení formuláře. Atomický časový zámek brání souběžnému odeslání stejného kontaktu. Při chybě se kontakt zachová a čeká na opakování; po pěti neúspěšných pokusech nebo nepotvrzeném přijetí službou přejde do stavu uncertain pro ruční kontrolu. Přijetí odesílací službou není zárukou doručení do inboxu. Po přerušení mezi přijetím e-mailu a zapsáním výsledku nelze zcela vyloučit duplicitní upozornění; ID kontaktu v předmětu a těle umožňuje jeho rozpoznání.

Cílová adresa richard@watra.cz je v Cloudflare ověřená. Binding NOTIFY_EMAIL má destination_address omezenou výhradně na tuto adresu; odesílání na ověřené cíle je dostupné na bezplatném tarifu. Automatiku zapíná EMAIL_NOTIFICATIONS_ENABLED=true. Časovač */5 * * * * zpracuje až deset čekajících upozornění každých pět minut. Uložení nového kontaktu spustí odeslání ihned na pozadí. Migrace 0002_notifications.sql přidává stav doručování a časové zámky; musí se aplikovat před nasazením aktivní automatiky. Funkce nevyžaduje Google autorizaci ani změnu MX záznamů schránky Google Workspace.

Soukromý POST /api/watra/crm/test-email vyžaduje CRM_SYNC_SECRET a JSON {"confirm":"send-to-richard@watra.cz"}. Odešle výhradně označený test bez zákaznických údajů na pevnou adresu richard@watra.cz. Neumožňuje volbu příjemce. Soukromý /crm/health ukazuje zapnutí, počet přijatých kontaktů a stavy upozornění; veřejný health osobní údaje nevrací.

Poštovní DNS ověřené 2. 11. 2026: SPF obsahuje Google Workspace i include:_spf.mx.cloudflare.net, cf2024-1._domainkey obsahuje 2048bitový veřejný klíč poskytnutý Cloudflare a _dmarc má úvodní zásadu v=DMARC1; p=none;. MX směřuje na smtp.google.com. Záznamy byly ověřené přes veřejné DNS Googlu. Správné ověření odesílatele zvyšuje důvěryhodnost zpráv, ale samo nezaručuje zařazení do Doručené pošty.

Živý test z 2. 11. 2026 v 21:08 SEČ byl doručen za tři sekundy do Doručené pošty. SPF prošlo. Google v okamžiku přijetí ještě uváděl no key for signature pro cf2024-1 na watra.cz a DMARC FAIL, ačkoli veřejné DNS Googlu už vracelo nově doplněný DKIM i DMARC; pravděpodobnou příčinou je dříve uložená negativní odpověď v mezipaměti příjmu. Tato kontrola sama tedy nepotvrzuje dokončení propagace podpisu u přijímajícího serveru.
