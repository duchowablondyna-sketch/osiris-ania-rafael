// Kopia kafelków globusa ze strony tytułowej: NASA GIBS, VIIRS_Black_Marble 2016, przybliżenia 0–3 (wszystkie kafelki).
// Uruchamiany RĘCZNIE, jednorazowo (nie przy budowaniu): node scripts/pobierz-kafelki-globusa.mjs
// Sprawdzenie zapisanych plików z sumami (bez sieci):  node scripts/pobierz-kafelki-globusa.mjs --sprawdz
//
// Po co: serwer NASA zabrania przeglądarce zapamiętywania kafelków (cache-control: no-store) i odpowiada ok. 0,2–0,8 s
// na kafelek, więc każdy powrót na stronę tytułową pobierał kulę od nowa (diagnoza 21.11.2026). Kopia leży
// w public/kafelki/ i jest serwowana razem ze stroną. Warunki NASA i podpis: ZRODLA.md, sekcja o Black Marble.
// Kafelki zapisujemy bajt w bajt, bez żadnej obróbki.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

const ADRES = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8';
const KATALOG = 'public/kafelki/black-marble-2016';
const SUMY = `${KATALOG}/sumy-sha256.txt`;
const MAKS_PRZYBLIZENIE = 3;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// Wszystkie kafelki z/y/x dla przybliżeń 0–3: 1 + 4 + 16 + 64 = 85.
const kafelki = [];
for (let z = 0; z <= MAKS_PRZYBLIZENIE; z++) {
  for (let y = 0; y < 2 ** z; y++) for (let x = 0; x < 2 ** z; x++) kafelki.push(`${z}/${y}/${x}`);
}

if (process.argv.includes('--sprawdz')) {
  const wpisy = (await readFile(SUMY, 'utf-8')).trim().split('\n').filter((w) => !w.startsWith('#'));
  let bledy = 0;
  for (const w of wpisy) {
    const [suma, plik] = w.split(/\s+/);
    const teraz = sha256(await readFile(`${KATALOG}/${plik}`));
    if (teraz !== suma) {
      bledy++;
      console.error(`ZŁA SUMA: ${plik}`);
    }
  }
  console.log(`Sprawdzono ${wpisy.length} kafelków: ${bledy ? `${bledy} niezgodnych` : 'wszystkie sumy zgodne'}.`);
  process.exit(bledy ? 1 : 0);
}

const wiersze = [];
let razem = 0;
for (const k of kafelki) {
  const odp = await fetch(`${ADRES}/${k}.png`, { signal: AbortSignal.timeout(30_000) });
  if (!odp.ok) throw new Error(`Kafelek ${k}: HTTP ${odp.status}`);
  if (!(odp.headers.get('content-type') ?? '').startsWith('image/png')) throw new Error(`Kafelek ${k}: nie PNG (${odp.headers.get('content-type')})`);
  const bajty = Buffer.from(await odp.arrayBuffer());
  if (!bajty.subarray(0, 8).equals(PNG)) throw new Error(`Kafelek ${k}: plik nie zaczyna się od nagłówka PNG`);
  const plik = `${KATALOG}/${k}.png`;
  await mkdir(dirname(plik), { recursive: true });
  await writeFile(plik, bajty);
  wiersze.push(`${sha256(bajty)}  ${k}.png`);
  razem += bajty.length;
}
const naglowek = [
  `# NASA GIBS VIIRS_Black_Marble, 2016-01-01, GoogleMapsCompatible_Level8, przybliżenia 0–${MAKS_PRZYBLIZENIE}`,
  `# Źródło: ${ADRES}/{z}/{y}/{x}.png`,
  `# Pobrano: ${new Date().toISOString()} · kafelków: ${kafelki.length} · razem: ${razem} B`,
];
await writeFile(SUMY, `${[...naglowek, ...wiersze].join('\n')}\n`);
console.log(`Zapisano ${kafelki.length} kafelków, razem ${(razem / 1024).toFixed(1)} kB (${razem} B), sumy: ${SUMY}`);
