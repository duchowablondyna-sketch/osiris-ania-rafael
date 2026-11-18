// Wycina kontur Polski z pliku Natural Earth (Admin 0 – Countries, GeoJSON).
// Użycie: node scripts/wytnij-polske.mjs <plik-wejściowy.geojson> <plik-wyjściowy.geojson>
// Nie wymaga żadnych pakietów, tylko Node.

import { readFile, writeFile } from 'node:fs/promises';

const [wejscie, wyjscie] = process.argv.slice(2);

if (!wejscie || !wyjscie) {
  console.error('Użycie: node scripts/wytnij-polske.mjs <wejście.geojson> <wyjście.geojson>');
  process.exit(1);
}

const swiat = JSON.parse(await readFile(wejscie, 'utf8'));
const polska = swiat.features.filter((f) => f.properties?.ADM0_A3 === 'POL');

if (polska.length !== 1) {
  console.error(`Oczekiwano 1 obiektu dla Polski, znaleziono: ${polska.length}`);
  process.exit(1);
}

const wynik = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { nazwa: 'Polska', zrodlo: 'Natural Earth (domena publiczna)' },
      geometry: polska[0].geometry,
    },
  ],
};

await writeFile(wyjscie, JSON.stringify(wynik));
console.log(`Zapisano ${wyjscie} (typ geometrii: ${polska[0].geometry.type})`);
