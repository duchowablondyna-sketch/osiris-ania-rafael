import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import './style.css';

// Vite przepakowuje bibliotekę i gubi jej plik workera, więc podajemy adres wprost.
// ?url sprawia, że Vite skopiuje ten plik do gotowej strony i zwróci jego adres.
maplibregl.setWorkerUrl(workerUrl);

// Kontur Polski leży w public/data/ i jest serwowany razem ze stroną.
// Nie używamy zewnętrznych kafelków ani kluczy API.
const KONTUR_URL = `${import.meta.env.BASE_URL}data/polska-kontur.geojson`;

// Przybliżony prostokąt obejmujący Polskę i farmy na Bałtyku (do 55,56°N): [zachód, południe], [wschód, północ].
const GRANICE_POLSKI = [
  [14.0, 48.9],
  [24.2, 55.8],
];

const map = new maplibregl.Map({
  container: 'mapa',
  bounds: GRANICE_POLSKI,
  fitBoundsOptions: { padding: 24 },
  style: {
    version: 8,
    sources: {
      polska: { type: 'geojson', data: KONTUR_URL },
    },
    layers: [
      { id: 'tlo', type: 'background', paint: { 'background-color': '#eef2f5' } },
      { id: 'polska-wypelnienie', type: 'fill', source: 'polska', paint: { 'fill-color': '#ffffff' } },
      { id: 'polska-kontur', type: 'line', source: 'polska', paint: { 'line-color': '#1f3a5f', 'line-width': 1.5 } },
    ],
  },
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

// Morskie farmy wiatrowe na polskim Bałtyku (EMODnet, CC BY 4.0)
map.on('load', () => {
  map.addSource('farmy', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/farmy-baltyk.geojson` });
  map.addLayer({
    id: 'farmy',
    type: 'circle',
    source: 'farmy',
    paint: { 'circle-color': '#0f7b6c', 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
  });

  map.on('click', 'farmy', (e) => {
    const { nazwa, status, moc_mw } = e.features[0].properties;
    const el = document.createElement('div');
    const tytul = document.createElement('strong');
    tytul.textContent = nazwa;
    const linia = (tekst) => {
      const span = document.createElement('span');
      span.textContent = tekst;
      return span;
    };
    const moc = typeof moc_mw === 'number' ? `${moc_mw.toLocaleString('pl-PL')} MW` : 'brak danych';
    el.append(tytul, document.createElement('br'), linia(`status: ${status}`), document.createElement('br'), linia(`moc: ${moc}`));
    new maplibregl.Popup().setLngLat(e.features[0].geometry.coordinates).setDOMContent(el).addTo(map);
  });
});

// Produkcja z wiatru: plik wiatr.json powstaje przy budowaniu (scripts/pobierz-pse.mjs).
const formatCzasu = (iso) =>
  new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'short', timeStyle: 'short' });
const formatDoby = (rrrrMmDd) => rrrrMmDd.split('-').reverse().join('.');

fetch(`${import.meta.env.BASE_URL}data/wiatr.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .then((d) => {
    if (!d) return;
    if (d.czas_pobrania) document.getElementById('wiatr-pobrano').textContent = formatCzasu(d.czas_pobrania);
    if (typeof d.wartosc !== 'number') return;
    document.getElementById('wiatr-teraz').textContent = `${Math.round(d.wartosc).toLocaleString('pl-PL')} ${d.jednostka}`;
    document.getElementById('wiatr-stan').textContent = `stan na: ${formatDoby(d.doba)}, ${d.okres}`;
  })
  .catch(() => {
    /* zostaje „brak danych” */
  });
