// Pobiera z EMODnet (WFS, warstwa emodnet:windfarms) morskie farmy wiatrowe
// w prostokącie wokół polskiego Bałtyku, zostawia tylko polskie
// i zapisuje public/data/farmy-baltyk.geojson.
// Użycie: node scripts/pobierz-farmy.mjs
import { writeFile } from 'node:fs/promises';
import { dodajWeryfikacje } from './weryfikacja-farm.mjs';

const URL_WFS =
  'https://ows.emodnet-humanactivities.eu/wfs?service=WFS&version=1.0.0&request=GetFeature' +
  '&typeName=emodnet:windfarms&outputFormat=application/json&srsName=EPSG:4326&bbox=14.0,53.9,19.8,55.9';
const PLIK = 'public/data/farmy-baltyk.geojson';

const odp = await fetch(URL_WFS, { signal: AbortSignal.timeout(60_000) });
if (!odp.ok) throw new Error(`EMODnet: HTTP ${odp.status}`);
const dane = await odp.json();

const polskie = dane.features.filter((f) => f.properties?.country === 'Poland');
if (polskie.length === 0) throw new Error('Brak polskich farm w odpowiedzi');

const wynik = {
  type: 'FeatureCollection',
  features: polskie.map((f) => ({
    type: 'Feature',
    properties: dodajWeryfikacje({ nazwa: f.properties.name, status: f.properties.status, moc_mw: f.properties.power_mw }),
    geometry: f.geometry,
  })),
};

await writeFile(PLIK, JSON.stringify(wynik));
console.log(`Zapisano ${PLIK}: ${polskie.length} farm`);
