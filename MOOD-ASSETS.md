# Mood fotografie na webu

Schválené umístění 24. 9. 2026, shodně pro CS a EN:

- mood1: homepage pod modely, úvod stránky pro výrobce saun, galerie IRIKON.
- mood2: kontakt místo portrétu a galerie IRIKON.
- Portrét a skutečná výroba zůstávají u příběhu a zakladatele. Technické fotografie zůstávají beze změn.

## Podklady

- [mood1.png na Google Drive](https://drive.google.com/file/d/11QxqxJ-M2EhHfeIFtYV38UoU49h_gHD2/view): dostupný obraz z prohlížeče Drive uložen jako `../watra-assets/mood/mood1-drive.webp`, 1586 × 992 px. Toto je webový obraz z Drive, nikoli původní PNG; původní PNG se nepodařilo stáhnout. Není znovu generovaný ani retušovaný.
- [mood2.png na Google Drive](https://drive.google.com/file/d/1SiwIoarlmCfffY7vqPhdtT9vI5SpXci9/view): místní soubor `../watra-assets/mood/mood2.png`, 1122 × 1402 px, 2 000 951 bajtů.

Web používá WebP varianty v `public/media`. Velikosti jsou 480, 960 a nanejvýš 1600 px, bez zvětšování menšího zdroje. Označení souboru `-1600` je horní limit; šířky v HTML srcset odpovídají skutečnému rozlišení. Zaoblení a měkký okraj jsou pouze CSS, celý obraz zůstává zachován.

Obrazy jsou označené jako vizualizace sauny, nikoli jako zákaznické realizace nebo instalační návod.

## Další fotografie

Nový schválený zdroj nejprve uložit samostatně do `watra-assets/mood`, přidat do `scripts/prepare-assets.cjs` a jeho rozměry/popisy do `src/mood.mjs`. Příkaz `node scripts/prepare-assets.cjs mood1 mood2` připraví jen vybrané fotografie; knihovna sharp musí být dostupná přes SHARP_PATH nebo instalaci. Při změně obrazového souboru použít nový název, aby návštěvníci nedostávali starou verzi z cache.
