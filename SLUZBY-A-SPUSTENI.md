# WATRA — služby a údaje k doplnění

Aktualizace 10. 9. 2026: Formspree účet richard@watra.cz je ověřený. Projekt WATRA obsahuje formulář „WATRA - nezávazný zájem a zahájení prodeje“, veřejné ID mppzbljw, s doručováním na richard@watra.cz a ukládáním do soukromého přehledu. CS/EN kontaktní formulář a okno na homepage používají toto ID. Informace o zpracování zahrnují dobu potřebnou k vyřízení zájmu, nejvýše 12 měsíců od poslední komunikace, kterou provozovatel potvrdil. GTM a Crisp mají vlastní ID; nastavení jejich účtů se ověřuje samostatně.

Provozovatel: Ing. Richard Koubek, IČO 21069611, Kokonínská 971, 468 02 Rychnov u Jablonce nad Nisou. Údaje ověřeny v [ARES](https://ares.gov.cz/ekonomicke-subjekty/res/21069611) dne 10. 9. 2026.

Web běží v češtině a angličtině na watra.cz. Níže je přehled služeb a provozních kroků; u již propojených služeb není potřeba zakládat další účet.

## Přehled služeb

| Služba | K čemu bude | Co potom dodat |
|---|---|---|
| **Formspree** | Přijetí nezávazného zájmu a upozornění do e-mailu; poptávky i v přehledu služby | Veřejné ID formuláře z adresy https://formspree.io/f/… a potvrzený cílový e-mail |
| **Google Tag Manager** | Jedno místo pro správu Google Analytics a reklamního měření | ID webového kontejneru GTM-… |
| **Google Analytics 4** | Návštěvnost, zdroje příchodů, cesta k poptávce a konverze | ID webového streamu G-…; nastaví se uvnitř Tag Manageru |
| **Google Ads** | Příprava kampaní a vyhodnocování skutečných poptávek | Účet a propojení s GA4; při přímém měření také ID konverze AW-… a její štítek |
| **Microsoft Clarity** | Heatmapy a záznamy průchodu webem návštěvníků, kteří souhlasili | Veřejné ID projektu |
| **Google Search Console** | Kontrola indexace, hledaných výrazů a sitemap | Ověření vlastnictví domény pomocí DNS záznamu |
| **WhatsApp Business** | Přímý kontakt s Richardem z webu | Veřejné číslo v mezinárodním formátu, například s předvolbou 420 |
| **UptimeRobot nebo obdobný monitor** | Upozornění na nedostupnost hlavní stránky a kontaktní stránky | Příjemce upozornění; žádné ID není potřeba vkládat do webu |

**GitHub a Cloudflare už jsou propojené.** Další hosting není potřeba. Hotjar nezakládat současně s Clarity — nejprve používat jeden nástroj pro záznam návštěv.

**Google Sheets jsou volitelné.** Pro první spuštění stačí Formspree a e-mail. Pokud bude potřeba tabulka, přidat soukromé propojení Formspree → Sheets přes podporovanou integraci nebo Make/Zapier. Tabulka nesmí být veřejná a její přístupové klíče nesmějí být v kódu webu. Formspree i případný automatizační plán vybrat podle aktuálních limitů a očekávaného počtu poptávek.

Hesla, přístupové tokeny ani tajné klíče neposílat do chatu. Pro veřejná ID a kontakty je připravený soubor site.config.json.

## Co ještě dodat od WATRA

- E-mail je doplněný. Telefon a WhatsApp jsou volitelné a zatím chybějí.
- Identifikace provozovatele, sídlo, IČO a e-mail pro ochranu údajů jsou doplněné.
- Informace o formulářích jsou doplněné v CS/EN. Při změně služeb, účelu nebo doby uchování upravit stránku ochrany osobních údajů.
- Potvrzení cílového měsíce a roku certifikace. V náhledu je **listopad 2026**, jako odhad, nikoli příslib dodání. Mění se na jednom místě v nastavení.
- Ověřené technické listy, konfigurace dodávky a instalační požadavky, které smějí být zveřejněny. Číselné parametry nebyly odhadovány z fotografií.
- Datum reportáže a očekávanou adresu uvedenou v televizi. Připravena je krátká adresa /tv, která vede na český úvod a označí zdroj návštěvy.
- Retušované fotografie. Výběr zdrojových souborů je v asset-manifest.json; pracovní soubory se mohou nahradit při zachování současných rolí a ořezů.

## Jak zapojíme měření

1. V GTM vytvořit proměnné datové vrstvy page_location, page_path, language, page_type, item_id, lead_type, analytics_allowed a marketing_allowed.
2. Nastavit souhlasy pomocí oficiálních GTM API setDefaultConsentState a updateConsentState v šabloně souhlasu. Výchozí stav všech čtyř souhlasů je zamítnuto. Propojit s uloženou volbou watra_consent a událostí watra_consent_update.
3. GA4 spouštět pouze s analytickým souhlasem, reklamu pouze s reklamním souhlasem. Samotné načtení kontejneru nesmí spustit všechny jeho značky.
4. Pro GA4 vypnout automatické sbírání formulářů a automatické page_view, pokud se použije připravená událost watra_page_view. Nastavit page_location z očištěné datové vrstvy; nepoužívat automaticky celou adresu URL ani obsah polí.
5. Při odeslání jsou připravené události form_start a generate_lead. **generate_lead vzniká až po potvrzené odpovědi Formspree**, jednou. Připravené jsou i view_item, cta_click, email_click, phone_click, whatsapp_click.
6. V GA4 označit generate_lead jako klíčovou událost a propojit s Ads. Pro jednu poptávku zvolit jednu primární konverzní cestu; neduplikovat ji současně importem GA4 a přímou značkou Ads.
7. Clarity připojit pouze jednou, přímo přes připravené ID. Neduplikovat značku v GTM. Vyžadovat souhlas a zapnout přísné maskování v projektu. Kontaktní formulář a stránky s parametry v URL se nyní nenahrávají; postup k formuláři vyhodnotíme přes události GA4. Sdílení Clarity dat pro reklamu Microsoft je vypnuté.
8. Před aktivací ověřit odmítnutí, přijetí jednotlivých kategorií a odvolání souhlasu v reálném prohlížeči a Tag Assistantu. Příprava v kódu nenahrazuje nastavení a ověření konkrétního kontejneru.

Před souhlasem se nenahrává GTM ani Clarity. Na náhledových adresách pages.dev je měření vypnuté bez ohledu na souhlas. Při odvolání se stránka obnoví, aby v ní nezůstaly spuštěné nástroje. Změna souhlasu je dostupná v patičce.

## Správa příjmu poptávek

1. Formspree je založené a e-mail ověřený. Form Enabled, Submission Archive a Formshield jsou zapnuté. CAPTCHA je v novém formuláři standardně vypnutá. Web používá navíc honeypot. Žádný placený tarif nebyl aktivován.
2. Informace o provozovateli, účelech, příjemcích, odvolání souhlasu a právech jsou na /cs/ochrana-udaju/ a /en/privacy/.
3. Nastavené formspreeId=mppzbljw a privacyApproved=true. Sestavení kontroluje provozovatele, adresu, e-mail a dobu uchování v obou jazycích.
4. Odeslat jeden domluvený test, ověřit jeho přijetí ve Formspree i e-mailu a při použití tabulky také v Google Sheets.
5. Teprve po ověření zapnout konverzní měření. Zkontrolovat chybovou odpověď služby a zachování rozepsané zprávy.

Nový formulář na homepage používá stejný účet Formspree a označení lead_type=launch_notification. Žádá výslovný souhlas se zprávou o zahájení prodeje a s kontaktováním k zájmu o kamna; souhlas není předem zaškrtnutý. Neslouží k automatickému přihlášení k dalším kampaním. E-mailové potvrzení adresy (double opt-in) lze nastavit ve službě, ale do jeho ověření ho návštěvníkovi neslibujeme. Stránky s novým formulářem jsou stejně jako kontaktní stránka vyloučené ze záznamů Clarity; konverzi lze vyhodnotit přes generate_lead bez obsahu formuláře.

## Nasazení na watra.cz a den reportáže

- Připravovaný web: [český náhled](https://watra-web.pages.dev/cs/) a [anglický náhled](https://watra-web.pages.dev/en/). GitHub větev pro Cloudflare je redesign.
- Cloudflare sestavuje příkazem node scripts/build.mjs a zveřejňuje pouze složku dist. Nepoužívá vlastní databázi; hlavní obsah obsluhuje jako statické soubory.
- Doménu watra.cz a variantu www je před ostrým spuštěním potřeba připojit v Custom domains a upravit DNS podle Cloudflare. Přesměrování www sjednotit na https://watra.cz. Změnu DNS provést po kontrole funkčního formuláře a finálních textů.
- Ověřit HTTPS, přesměrování, geolokaci /, ruční přepnutí jazyka a adresu /tv. Přímé odkazy /cs/ a /en/ zůstávají ve zvoleném jazyce.
- Náhledové adresy mají hlavičku X-Robots-Tag: noindex; vlastní doména se indexovat může. Do Search Console vložit https://watra.cz/sitemap.xml.
- Před televizí zkontrolovat dostupnost z externího monitoru, formulář a limity služeb; připravit WhatsApp, e-mail a průběžné třídění poptávek.
- Rozlišovat 1 000 nových návštěv za minutu a 1 000 současně aktivních lidí. Lokální test slouží k odhalení chyb aplikace, negarantuje dostupnost internetu, Cloudflare nebo externího formuláře. Zátěžovou zkoušku hotového řešení naplánovat před reportáží; nikdy nezahltit poptávkovou službu testovacími odesláními.
- Uchovat poslední ověřené nasazení pro rychlý návrat v Cloudflare. V den reportáže omezit změny na nezbytné opravy.

## SEO a odpovědi AI

Každá podstránka má vlastní URL, titulek, popis, canonical a jazykové alternativy. Obsah, otázky a odpovědi jsou dostupné v HTML bez potřeby JavaScriptu. Produkty mají pravdivá strukturovaná data bez vymyšlených cen, recenzí a dostupnosti. Důležité jsou původní fotografie, srozumitelné vysvětlení hybridního provozu a pravidelná aktualizace certifikace a dokumentace. Speciální soubor nebo značka nezaručí zařazení do odpovědí AI.

## Dokumentace použitých rozhraní

- [Cloudflare: vlastní hlavičky a ochrana náhledů před indexací](https://developers.cloudflare.com/pages/configuration/headers/)
- [Google: implementace souhlasu](https://developers.google.com/tag-platform/security/guides/consent)
- [Microsoft: Clarity Consent V2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)
- [Google: AI funkce a web](https://developers.google.com/search/docs/appearance/ai-features)
- [Formspree: dokumentace](https://help.formspree.io/)


## Limity, doména a uchování kontaktů

- Projekt Formspree omezuje příjem na watra.cz a jeho subdomény. Náhledové domény pages.dev a localhost mají ovládání formulářů vypnuté a odkaz na ostrý web, aby poptávky nekončily ve spamu. Omezení v projektu a formDomain v site.config.json udržovat shodné.
- Bezplatný účet: 50 odeslání měsíčně společně pro účet; archiv ve Formspree je omezený na 30 dní. Kontakty proto uchovávat také v doručených e-mailech nebo v soukromém exportu.
- Formspree dokumentuje systémový limit 20 odeslání za minutu na formulář i u placených plánů. Před reportáží řešit měsíční kapacitu i krátkodobou špičku. Vyšší tarif sám tento minutový limit neodstraňuje. Při HTTP 429 návštěvník dostane vysvětlení a přímý e-mail; rozepsané údaje zůstanou zachované.
- Lhůta 12 měsíců není automatické mazání v e-mailové schránce. Provozovatel musí průběžně mazat uzavřené zájmy po splnění účelu, nejpozději po této lhůtě od poslední komunikace, a vyřizovat odvolání souhlasu ve všech kopiích a exportech. Archiv Formspree může být kratší.
- U upozornění ukládáme znění, verzi a čas souhlasu. Při pozdějším rozesílání kontaktovat pouze platné souhlasy, respektovat odhlášení a nepřidávat příjemce automaticky do jiných kampaní.
- Odkazy: [Formspree limity](https://help.formspree.io/articles/form-and-project-settings/system-limits), [omezení domény](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain), [ceník](https://formspree.io/plans), [předávání údajů](https://formspree.io/security/), [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj).
