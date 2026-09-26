# Mood fotografie na webu

Aktuální umístění 26. 9. 2026, shodně pro CS a EN:

- mood1: homepage pod modely, úvod stránky pro výrobce saun, galerie obou modelů.
- mood2: galerie obou modelů.
- mood3: kontakt a galerie obou modelů; tmavý interiér s výhledem do lesa.
- mood4: galerie obou modelů; saunování ve světlém dřevěném interiéru.
- mood5: úvod stránky Proč hybrid / Why hybrid a galerie IRIKON +e. Zobrazuje hybrid s elektrickými tělesy a nesmí být v galerii základního IRIKONu.
- mood6: galerie základního IRIKONu, kde nahrazuje mood5. Zobrazuje kamna na dřevo bez elektrických topných těles.
- Portrét a skutečná výroba zůstávají u příběhu a zakladatele. Technické fotografie zůstávají beze změn.

Každá produktová galerie obsahuje čtyři ateliérové snímky a pět vizualizací. Začíná ateliérovým pohledem na výrobek, u hybridu je první následující vizualizací mood5. Náhledy jsou v jedné vodorovně posuvné řadě, dostupné i klávesnicí. Kliknutí na hlavní snímek otevře zvětšení. Při změně výběru se aktualizuje popis i alternativní text.

## Podklady

- [mood1.png na Google Drive](https://drive.google.com/file/d/11QxqxJ-M2EhHfeIFtYV38UoU49h_gHD2/view): dostupný obraz z prohlížeče Drive uložen jako `../watra-assets/mood/mood1-drive.webp`, 1586 × 992 px. Toto je webový obraz z Drive, nikoli původní PNG; původní PNG se nepodařilo stáhnout. Není znovu generovaný ani retušovaný.
- [mood2.png na Google Drive](https://drive.google.com/file/d/1SiwIoarlmCfffY7vqPhdtT9vI5SpXci9/view): místní soubor `../watra-assets/mood/mood2.png`, 1122 × 1402 px, 2 000 951 bajtů.
- mood3.png: původní PNG, 1122 × 1402 px, 3 415 373 bajtů.
- mood4.png: původní PNG, 1122 × 1402 px, 2 415 453 bajtů.
- mood5.png: původní PNG, 1536 × 1024 px, 1 985 456 bajtů.
- mood6.png: původní PNG, 1536 × 1024 px, 1 813 283 bajtů; převzatý 26. 9. 2026 ze stejné synchronizované složky FOTO. Webové velikosti jsou připravené přímo z originálu, bez generativních úprav.

Nové soubory mood3–mood5 byly převzaty 25. 9. 2026 přímo ze synchronizované složky [FOTO na Google Drive](https://drive.google.com/drive/folders/18ddVMtnqpgRgEr5lQFKswL-TEdXo10vZ) do `../watra-assets/mood/`. Nebyly generativně upravovány, retušovány, ořezávány ani zvětšovány. Webové soubory vznikly jedním převodem z těchto originálních PNG.

Web používá WebP varianty v `public/media`. Velikosti jsou 480, 960 a nanejvýš 1600 px, bez zvětšování menšího zdroje. Označení souboru `-1600` je horní limit; šířky v HTML srcset odpovídají skutečnému rozlišení. Zaoblení a měkký okraj jsou pouze CSS, celý obraz zůstává zachován.

Obrazy jsou označené jako vizualizace sauny, nikoli jako zákaznické realizace nebo instalační návod.

## Další fotografie

Nový schválený zdroj nejprve uložit samostatně do `watra-assets/mood`, přidat do `scripts/prepare-assets.cjs` a jeho rozměry/popisy do `src/mood.mjs`. Příkaz `node scripts/prepare-assets.cjs mood1 mood2` připraví jen vybrané fotografie; knihovna sharp musí být dostupná přes SHARP_PATH nebo instalaci. Při změně obrazového souboru použít nový název, aby návštěvníci nedostávali starou verzi z cache.
