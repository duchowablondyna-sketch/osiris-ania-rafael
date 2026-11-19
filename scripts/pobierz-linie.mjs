// Pobiera z OpenStreetMap (Overpass API) linie najwyższych napięć 220 kV i 400 kV
// w granicach Polski i zapisuje public/data/linie-nn.geojson.
// Plik wynikowy jest na licencji ODbL (© OpenStreetMap contributors).
// Użycie: node scripts/pobierz-linie.mjs
import { writeFile } from 'node:fs/promises';

const URL_OVERPASS = 'https://overpass-api.de/api/interpreter';
const ZAPYTANIE =
  '[out:json][timeout:180];' +
  'area["ISO3166-1"="PL"]["admin_level"="2"]->.pl;' +
  'way["power"="line"]["voltage"~"(^|;)(220000|400000)(;|$)"](area.pl);' +
  'out tags geom;';
const PLIK = 'public/data/linie-nn.geojson';

const odp = await fetch(URL_OVERPASS, {
  method: 'POST',
  headers: { 'User-Agent': 'osiris-map-build/0.1' },
  body: new URLSearchParams({ data: ZAPYTANIE }),
  signal: AbortSignal.timeout(240_000),
});
if (!odp.ok) throw new Error(`Overpass: HTTP ${odp.status}`);
const dane = await odp.json();

const odcinki = dane.elements.filter((e) => e.type === 'way' && e.geometry?.length > 1);
if (odcinki.length === 0) throw new Error('Brak linii w odpowiedzi');

const wynik = {
  type: 'FeatureCollection',
  features: odcinki.map((w) => ({
    type: 'Feature',
    properties: {
      // Odcinek z kilkoma napięciami (wspólne słupy) liczymy jako 400 kV, jeśli ma 400 kV.
      napiecie: w.tags.voltage.split(';').includes('400000') ? 400 : 220,
      nazwa: w.tags.name ?? null,
    },
    geometry: { type: 'LineString', coordinates: w.geometry.map((p) => [p.lon, p.lat]) },
  })),
};

await writeFile(PLIK, JSON.stringify(wynik));
const ile400 = wynik.features.filter((f) => f.properties.napiecie === 400).length;
console.log(`Zapisano ${PLIK}: ${odcinki.length} odcinków (400 kV: ${ile400}, 220 kV: ${odcinki.length - ile400})`);
console.log(`Stan danych OSM: ${dane.osm3s?.timestamp_osm_base}`);
