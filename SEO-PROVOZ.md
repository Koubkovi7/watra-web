# SEO a kanonická doména

Produkční doména je `https://watra.cz`. Lokalizované stránky jsou statické a používají vlastní canonical i vzájemné odkazy hreflang. Adresy `/cs/` a `/en/` se nepřesměrovávají podle polohy ani cookies. Volba jazyka se týká jen vstupní adresy `/` a zůstává dočasným přesměrováním 302. Obě verze jsou dostupné přes běžné odkazy a sitemapu.

`node scripts/build.mjs` aktualizuje `/robots.txt` a `/sitemap.xml` z existujících cest. Sitemap obsahuje 28 indexovatelných stránek v obou jazycích. Děkovací, chybové a náhledové stránky zůstávají mimo ni. Náhledy `*.pages.dev` nadále používají `X-Robots-Tag: noindex`.

## Strukturovaná data před zahájením prodeje

Search Console dne 26. 9. 2026 nahlásila u obou českých produktů chybu „Je třeba zadat buď offers, review, nebo aggregateRating“. Původní značení `Product` neobsahovalo žádnou z těchto povinných vlastností pro produktové úryvky Googlu. Stejná šablona se používala i v angličtině.

Web nyní sbírá nezávazný zájem a certifikace probíhá. Modelové stránky proto používají `WebPage` s lokalizovaným názvem, popisem, adresou, jazykem, předmětem stránky a ateliérovou fotografií. Značení `Organization` a `BreadcrumbList` zůstává zachováno, stejně jako canonical, hreflang, indexovatelnost a sitemap. Nepublikujeme smyšlené recenze ani aktivní nabídku prodeje. Stránky v této fázi neusilují o rozšířené produktové výsledky; běžné výsledky vyhledávání nejsou podmíněné značením `Product`.

Při skutečném spuštění prodeje doplnit `Product` s odpovídajícím `Offer`: cena a měna musí souhlasit s viditelným obsahem dané stránky, dostupnost se skutečným stavem objednávání. Recenze a hodnocení přidávat pouze skutečné a viditelné návštěvníkům. Upravit také testy pro novou fázi prodeje. Před nasazením ověřit v Google Rich Results Test a následně v Search Console.

Dokumentace: https://developers.google.com/search/docs/appearance/structured-data/product-snippet

## Přesměrování v Cloudflare

Dne 25. 9. 2026 bylo v zóně watra.cz nasazeno pravidlo **WATRA canonical HTTPS without www**. Jde o Single Redirect na úrovni Cloudflare, nikoli Pages Function; obsah stránek nadále obsluhuje statické CDN.

- ID pravidla: `f29f1962fcca44a58f728f403551096b`
- Podmínka: `(http.host in {"watra.cz" "www.watra.cz"} and (http.host eq "www.watra.cz" or not ssl))`
- Cíl: `concat("https://watra.cz", http.request.uri.path)`
- Stav: 301; zachování query string zapnuto.
- Platí pro HTTP a www varianty těchto dvou hostitelů. Nezasahuje do pages.dev ani jiných subdomén.

Příklad: `http://www.watra.cz/cs/modely/irikon/?utm_source=test` přesměruje přímo na `https://watra.cz/cs/modely/irikon/?utm_source=test`. Pravidlo neodstraňovat při budoucích změnách hostingu bez náhrady. Standardní `_redirects` soubor Pages nepodporuje přesměrování zdrojové domény a neplatí pro Pages Functions.

## Kontrola po nasazení

Ověřit českou homepage, oba české produkty, jejich anglické protějšky, robots.txt a sitemap.xml. U každé veřejné stránky zkontrolovat 200, vlastní canonical, správný jazyk, jedinečný title, viditelný H1 a nepřítomnost nechtěného noindex. Přesměrování kontrolovat i s cestou produktu a parametry. Stav indexace a Googlem zvolená canonical se ověřují v Google Search Console; samotná HTTP dostupnost indexaci nedokazuje.

Dne 25. 9. 2026 byla doménová služba `sc-domain:watra.cz` ověřena novým TXT záznamem ze Search Console. Ověřovací TXT nemažte; ostatní původní DNS záznamy byly zachovány. Sitemap pro odeslání: `https://watra.cz/sitemap.xml`. Prioritní kontroly URL: `/cs/`, `/cs/modely/irikon/` a `/cs/modely/irikon-e/`.
