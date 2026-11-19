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

// Odstęp kadru od krawędzi. Z lewej: szerokość okienka (.wskaznik) plus margines,
// żeby żadna farma ani linia nie była pod okienkiem. Na wąskim ekranie, gdzie to się
// nie mieści, zostaje zwykły odstęp.
const MARGINES = 24;
function odstepKadru() {
  const okno = document.querySelector('.wskaznik');
  const szerokoscMapy = document.getElementById('mapa').clientWidth;
  const lewy = okno ? okno.offsetLeft + okno.offsetWidth + MARGINES : MARGINES;
  if (lewy + MARGINES + 200 > szerokoscMapy) return MARGINES;
  return { top: MARGINES, right: MARGINES, bottom: MARGINES, left: lewy };
}

const map = new maplibregl.Map({
  container: 'mapa',
  bounds: GRANICE_POLSKI,
  fitBoundsOptions: { padding: odstepKadru() },
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

map.on('load', () => {
  // Linie najwyższych napięć 220/400 kV (© OpenStreetMap contributors, ODbL), plik z scripts/pobierz-linie.mjs.
  // Dodane przed farmami, żeby punkty farm były na wierzchu.
  map.addSource('linie-nn', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/linie-nn.geojson` });
  map.addLayer({
    id: 'linie-nn',
    type: 'line',
    source: 'linie-nn',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#c2410c', 'line-width': ['match', ['get', 'napiecie'], 400, 2.5, 1.2] },
  });

  // Morskie farmy wiatrowe na polskim Bałtyku (EMODnet, CC BY 4.0)
  map.addSource('farmy', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/farmy-baltyk.geojson` });
  map.addLayer({
    id: 'farmy',
    type: 'circle',
    source: 'farmy',
    // Farmy z listy MKiŚ: pełna kropka. Prawdopodobne duplikaty i farmy spoza listy: pusta w środku.
    paint: {
      'circle-color': '#0f7b6c',
      'circle-radius': 6,
      'circle-opacity': ['case', ['==', ['get', 'weryfikacja'], 'na liście MKiŚ'], 1, 0],
      'circle-stroke-color': ['case', ['==', ['get', 'weryfikacja'], 'na liście MKiŚ'], '#ffffff', '#0f7b6c'],
      'circle-stroke-width': ['case', ['==', ['get', 'weryfikacja'], 'na liście MKiŚ'], 1.5, 2],
    },
  });

  map.on('click', 'farmy', (e) => {
    const { nazwa, status, moc_mw, weryfikacja, weryfikacja_opis } = e.features[0].properties;
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
    if (weryfikacja) el.append(document.createElement('br'), linia(`weryfikacja: ${weryfikacja_opis ?? weryfikacja}`));
    new maplibregl.Popup().setLngLat(e.features[0].geometry.coordinates).setDOMContent(el).addTo(map);
  });
});

// Produkcja z wiatru: plik wiatr.json powstaje przy budowaniu (scripts/pobierz-pse.mjs).
const formatCzasu = (iso) =>
  new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'short', timeStyle: 'short' });
const formatDoby = (rrrrMmDd) => rrrrMmDd.split('-').reverse().join('.');

// Mały wykres liniowy produkcji z wiatru z bieżącej doby (własne SVG, bez bibliotek).
// seria: [{ okres: 'HH:MM - HH:MM', mw }], kolejne kwadranse od 00:00.
const SVG_NS = 'http://www.w3.org/2000/svg';
function rysujWykres(kontener, seria) {
  const punkty = (seria ?? []).filter((p) => typeof p.mw === 'number' && typeof p.okres === 'string');
  if (punkty.length < 2) return;

  const W = 240, H = 72, GORA = 14, DOL = 58; // obszar linii: od GORA do DOL
  const maks = Math.max(...punkty.map((p) => p.mw));
  const min = Math.min(0, ...punkty.map((p) => p.mw));
  const x = (i) => (i / (punkty.length - 1)) * W;
  const y = (mw) => DOL - ((mw - min) / (maks - min || 1)) * (DOL - GORA);

  const el = (nazwa, atrybuty) => {
    const e = document.createElementNS(SVG_NS, nazwa);
    for (const [k, v] of Object.entries(atrybuty)) e.setAttribute(k, String(v));
    return e;
  };
  const podpis = (tekst, atrybuty) => {
    const t = el('text', { 'font-size': 10, fill: '#555', ...atrybuty });
    t.textContent = tekst;
    return t;
  };

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  const opis = el('title', {});
  opis.textContent = 'Produkcja z wiatru w bieżącej dobie, co 15 minut, w MW';
  svg.append(
    opis,
    el('line', { x1: 0, y1: DOL, x2: W, y2: DOL, stroke: '#d5dbe1', 'stroke-width': 1 }),
    el('polyline', {
      points: punkty.map((p, i) => `${x(i).toFixed(1)},${y(p.mw).toFixed(1)}`).join(' '),
      fill: 'none',
      stroke: '#1f3a5f',
      'stroke-width': 1.5,
      'stroke-linejoin': 'round',
    }),
    podpis(`maks. ${Math.round(maks).toLocaleString('pl-PL')} MW`, { x: 0, y: 10 }),
    podpis(punkty[0].okres.split(' - ')[0], { x: 0, y: H - 2 }),
    podpis(punkty.at(-1).okres.split(' - ')[1] ?? '', { x: W, y: H - 2, 'text-anchor': 'end' }),
  );
  kontener.append(svg);
}

fetch(`${import.meta.env.BASE_URL}data/wiatr.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .then((d) => {
    if (!d) return;
    if (d.czas_pobrania) document.getElementById('wiatr-pobrano').textContent = formatCzasu(d.czas_pobrania);
    const ogr = d.ograniczenie;
    if (ogr && typeof ogr.mwh === 'number' && ogr.doba) {
      document.getElementById('wiatr-ograniczenie').textContent =
        `Ostatnie polecenie PSE ograniczenia wiatru: ${formatDoby(ogr.doba)} – ok. ${ogr.mwh.toLocaleString('pl-PL')} MWh`;
    }
    if (typeof d.wartosc !== 'number') return;
    document.getElementById('wiatr-teraz').textContent = `${Math.round(d.wartosc).toLocaleString('pl-PL')} ${d.jednostka}`;
    document.getElementById('wiatr-stan').textContent = `stan na: ${formatDoby(d.doba)}, ${d.okres}`;
    rysujWykres(document.getElementById('wiatr-wykres'), d.seria);
  })
  .catch(() => {
    /* zostaje „brak danych” */
  })
  // Okienko mogło się poszerzyć (tekst, wykres) – dopasuj kadr jeszcze raz, bez animacji.
  .finally(() => map.fitBounds(GRANICE_POLSKI, { padding: odstepKadru(), animate: false }));
