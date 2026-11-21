// Dopisuje współrzędne z OpenStreetMap (Overpass API) do scripts/pse-moce/lokalizacje.json – uruchamiany ręcznie,
// gdy zmienia się wybór miejsc (nie przy budowaniu strony i nie przez robota).
// Pobiera tylko obiekty wskazane w pliku (po numerze OSM), więc wynik jest powtarzalny. Dane OSM: ODbL.
import { readFile, writeFile } from 'node:fs/promises';

const PLIK = 'scripts/pse-moce/lokalizacje.json';
const URL_OVERPASS = 'https://overpass-api.de/api/interpreter';

const lok = JSON.parse(await readFile(PLIK, 'utf-8'));
const id = { node: new Set(), way: new Set() };
for (const s of Object.values(lok.stacje)) {
  if (!s.osm) continue;
  const [typ, numer] = s.osm.split('/');
  if (!id[typ] || !/^\d+$/.test(numer)) throw new Error(`Zły numer OSM: ${s.osm}`);
  id[typ].add(numer);
}
const zapytanie =
  '[out:json][timeout:60];(' +
  (id.node.size ? `node(id:${[...id.node].join(',')});` : '') +
  (id.way.size ? `way(id:${[...id.way].join(',')});` : '') +
  ');out center tags;';
const odp = await fetch(URL_OVERPASS, {
  method: 'POST',
  headers: { 'User-Agent': 'osiris-map-build/0.1' },
  body: new URLSearchParams({ data: zapytanie }),
});
if (!odp.ok) throw new Error(`Overpass: HTTP ${odp.status}`);
const dane = await odp.json();
const obiekty = new Map(dane.elements.map((e) => [`${e.type}/${e.id}`, e]));

for (const [kod, s] of Object.entries(lok.stacje)) {
  if (!s.osm) continue;
  const e = obiekty.get(s.osm);
  if (!e) throw new Error(`${kod}: brak obiektu ${s.osm} w OSM`);
  const lat = e.lat ?? e.center?.lat;
  const lon = e.lon ?? e.center?.lon;
  // 5 miejsc po przecinku ≈ 1 m – więcej nie ma sensu przy lokalizacji „w rejonie”.
  s.lon = Math.round(lon * 1e5) / 1e5;
  s.lat = Math.round(lat * 1e5) / 1e5;
  s.nazwa_osm = e.tags?.name ?? null;
}
lok.stan_osm = dane.osm3s.timestamp_osm_base;
await writeFile(PLIK, `${JSON.stringify(lok, null, 2)}\n`);
console.log(`Lokalizacje: ${obiekty.size} obiektów OSM, stan ${lok.stan_osm}`);
for (const [kod, s] of Object.entries(lok.stacje)) console.log(`${kod}: ${s.rodzaj} ${s.osm ?? ''} ${s.nazwa_osm ?? ''} ${s.lat ?? ''} ${s.lon ?? ''}`);
