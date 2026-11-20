import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import './style.css';

// Vite przepakowuje bibliotekę i gubi jej plik workera, więc podajemy adres wprost.
// ?url sprawia, że Vite skopiuje ten plik do gotowej strony i zwróci jego adres.
maplibregl.setWorkerUrl(workerUrl);

// Kontur Polski leży w public/data/ i jest serwowany razem ze stroną.
const KONTUR_URL = `${import.meta.env.BASE_URL}data/polska-kontur.geojson`;

// Tło satelitarne: NASA GIBS, warstwa Blue Marble (August 2004), WMTS REST w EPSG:3857, bez klucza API.
// Kafelki pobiera przeglądarka widza z serwera NASA (patrz BEZPIECZENSTWO.md). Poziomy 0–8.
const GIBS_BLUE_MARBLE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg';
// Tło nocne: NASA GIBS, warstwa Black Marble (Suomi NPP / VIIRS), zdjęcie z 2016 r. wpisane na stałe
// (żeby obraz nie zmienił się bez naszej wiedzy). PNG, poziomy 0–8, bez klucza API.
const GIBS_BLACK_MARBLE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png';

// Kolory zgodne z zasadami wyglądu w CLAUDE.md (kontrast sprawdzony wg WCAG).
const KOLORY = {
  kosmos: '#05070D',
  linie: '#F2C14E', // złoto: linie najwyższych napięć
  wiatr: '#5CC8FF', // jasnoniebieski: farmy i wykres wiatru
  kontur: '#E8EEF7',
  tekst: '#E8EEF7',
  tekstPomocniczy: '#A9B7CC',
  os: '#2A3550',
  teraz: '#FF8A5B',
};

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
  const lewyOdstep = lewy + MARGINES + 200 > szerokoscMapy ? MARGINES : lewy;
  return { top: MARGINES, right: MARGINES, bottom: MARGINES, left: lewyOdstep };
}

// Kadr Polski: Polska w środku wolnej części ekranu (obok okienka), dokładnie „dopasuj do Polski”
// (kulę pokazuje już lot na starcie). Odstęp zostaje zapamiętany w mapie, więc środek widoku to środek wolnej części ekranu.
const ODDALENIE = 0;
const SRODEK_POLSKI = new maplibregl.LngLatBounds(GRANICE_POLSKI).getCenter();
function kameraPolski() {
  const padding = odstepKadru();
  // Odstęp zapamiętany z poprzedniego wywołania doliczyłby się drugi raz – najpierw go zerujemy.
  map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
  // cameraForBounds daje przybliżenie dopasowane do wolnej części ekranu. Jego środek jest już przesunięty
  // o odstęp, więc bierzemy środek prostokąta Polski – a odstęp ustawia go w środku wolnej części ekranu.
  const kamera = map.cameraForBounds(GRANICE_POLSKI, { padding });
  if (!kamera) return null;
  return { center: SRODEK_POLSKI, zoom: kamera.zoom - ODDALENIE, padding };
}
function ustawKadr() {
  const k = kameraPolski();
  if (k) map.jumpTo(k);
}

// Widok startowy lotu: cała kula Ziemi z Europą (Polska w środku), kula mieści się w wolnej części ekranu.
// Promień kuli w pikselach przy przybliżeniu z to ok. 512 · 2^z / (2π).
function kameraKuli() {
  const padding = odstepKadru();
  const wysokosc = document.getElementById('mapa').clientHeight - padding.top - padding.bottom;
  const zoom = Math.log2(((wysokosc * 0.9) / 2) / (512 / (2 * Math.PI)));
  return { center: SRODEK_POLSKI, zoom, padding };
}

// Lot wprowadzający: raz przy otwarciu, ok. 1 s po starcie i dopiero, gdy okienko ma dane (znamy jego szerokość).
// Dotknięcie mapy przed lotem albo w trakcie – lot się nie zaczyna albo przerywa (MapLibre sam przerywa
// flyTo przy przeciąganiu, przewijaniu i przybliżaniu). Przy prefers-reduced-motion – od razu kadr Polski.
const BEZ_RUCHU = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let uzytkownikRuszylMape = false;
for (const zdarzenie of ['mousedown', 'touchstart', 'wheel', 'keydown']) {
  document.getElementById('mapa').addEventListener(zdarzenie, () => (uzytkownikRuszylMape = true), { once: true, passive: true });
}
function lotDoPolski() {
  if (uzytkownikRuszylMape) return;
  const k = kameraPolski();
  if (k) map.flyTo({ ...k, duration: 3500, essential: false });
}

const map = new maplibregl.Map({
  container: 'mapa',
  bounds: GRANICE_POLSKI,
  fitBoundsOptions: { padding: odstepKadru() },
  style: {
    version: 8,
    // Globus od pierwszej klatki; przy dużym przybliżeniu (11–12) MapLibre sam przechodzi w płaską mapę.
    projection: { type: 'globe' },
    // Poświata atmosfery wokół kuli (1 = najsilniejsza).
    sky: { 'atmosphere-blend': 1 },
    sources: {
      'tlo-dzien': { type: 'raster', tiles: [GIBS_BLUE_MARBLE], tileSize: 256, maxzoom: 8 },
      'tlo-noc': { type: 'raster', tiles: [GIBS_BLACK_MARBLE], tileSize: 256, maxzoom: 8 },
      polska: { type: 'geojson', data: KONTUR_URL },
    },
    // Domyślnie tryb Noc; przełącznik Dzień/Noc tylko pokazuje jedną warstwę tła i chowa drugą (bez animacji).
    layers: [
      { id: 'tlo', type: 'background', paint: { 'background-color': KOLORY.kosmos } },
      { id: 'tlo-dzien', type: 'raster', source: 'tlo-dzien', layout: { visibility: 'none' } },
      { id: 'tlo-noc', type: 'raster', source: 'tlo-noc', layout: { visibility: 'visible' } },
      { id: 'polska-kontur', type: 'line', source: 'polska', paint: { 'line-color': KOLORY.kontur, 'line-opacity': 0.6, 'line-width': 1.2 } },
    ],
  },
});

if (BEZ_RUCHU) ustawKadr();
else map.jumpTo(kameraKuli());

// Lot rusza dopiero, gdy kafelki tła dla widoku kuli są wczytane (pierwsze „idle” mapy),
// ale najpóźniej po 5 s od otwarcia – żeby przy wolnym internecie nie czekać w nieskończoność.
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
const tloGotowe = Promise.race([new Promise((r) => map.once('idle', r)), czekaj(5000)]);
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

// Przełącznik Dzień/Noc: zwykłe przyciski (Tab, Enter, Spacja), stan w aria-pressed. Wybór nie jest zapamiętywany.
function ustawTryb(tryb) {
  map.setLayoutProperty('tlo-noc', 'visibility', tryb === 'noc' ? 'visible' : 'none');
  map.setLayoutProperty('tlo-dzien', 'visibility', tryb === 'dzien' ? 'visible' : 'none');
  for (const przycisk of document.querySelectorAll('.przelacznik button')) {
    przycisk.setAttribute('aria-pressed', String(przycisk.dataset.tryb === tryb));
  }
}

map.on('load', () => {
  for (const przycisk of document.querySelectorAll('.przelacznik button')) {
    przycisk.addEventListener('click', () => ustawTryb(przycisk.dataset.tryb));
  }

  // Linie najwyższych napięć 220/400 kV (© OpenStreetMap contributors, ODbL), plik z scripts/pobierz-linie.mjs.
  // Dodane przed farmami, żeby punkty farm były na wierzchu.
  map.addSource('linie-nn', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/linie-nn.geojson` });
  // Ciemna obwódka pod złotymi liniami (o 2 px szersza): światła miast na nocnym tle są bursztynowe,
  // prawie w kolorze złota – ciemna krawędź oddziela linię od świateł. Działa w obu trybach.
  map.addLayer({
    id: 'linie-nn-obwodka',
    type: 'line',
    source: 'linie-nn',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': KOLORY.kosmos, 'line-width': ['match', ['get', 'napiecie'], 400, 4.5, 3.2] },
  });
  map.addLayer({
    id: 'linie-nn',
    type: 'line',
    source: 'linie-nn',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': KOLORY.linie, 'line-width': ['match', ['get', 'napiecie'], 400, 2.5, 1.2] },
  });

  // Morskie farmy wiatrowe na polskim Bałtyku (EMODnet, CC BY 4.0)
  // Dwie warstwy: pełne kropki (farmy z listy MKiŚ) pod spodem, puste (prawdopodobne duplikaty i farmy
  // spoza listy) na wierzchu z grubszą obwódką – żeby duplikat był widoczny obok swojej pary.
  const NA_LISCIE = ['==', ['get', 'weryfikacja'], 'na liście MKiŚ'];
  // Promień zależny od przybliżenia: małe z daleka, ok. 6 px przy kadrze Polski (przybliżenie ok. 5), większe bliżej.
  const PROMIEN_FARMY = ['interpolate', ['linear'], ['zoom'], 2, 2, 5, 6, 9, 12];
  map.addSource('farmy', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/farmy-baltyk.geojson` });
  map.addLayer({
    id: 'farmy-pelne',
    type: 'circle',
    source: 'farmy',
    filter: NA_LISCIE,
    paint: {
      'circle-color': KOLORY.wiatr,
      'circle-radius': PROMIEN_FARMY,
      'circle-stroke-color': KOLORY.kosmos,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 5, 1.5, 9, 2.5],
    },
  });
  map.addLayer({
    id: 'farmy-puste',
    type: 'circle',
    source: 'farmy',
    filter: ['!', NA_LISCIE],
    paint: {
      'circle-opacity': 0,
      'circle-radius': PROMIEN_FARMY,
      'circle-stroke-color': KOLORY.wiatr,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 2, 1, 5, 2.5, 9, 4],
    },
  });

  map.on('click', ['farmy-pelne', 'farmy-puste'], (e) => {
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

// Pomocnicze do wykresów SVG (bez bibliotek): elementy przez createElementNS, tekst przez textContent.
const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (nazwa, atrybuty) => {
  const e = document.createElementNS(SVG_NS, nazwa);
  for (const [k, v] of Object.entries(atrybuty)) e.setAttribute(k, String(v));
  return e;
};
const podpis = (tekst, atrybuty) => {
  const t = el('text', { 'font-size': 10, fill: KOLORY.tekstPomocniczy, ...atrybuty });
  t.textContent = tekst;
  return t;
};

// Mały wykres liniowy produkcji z wiatru z bieżącej doby.
// seria: [{ okres: 'HH:MM - HH:MM', mw }], kolejne kwadranse od 00:00.
function rysujWykres(kontener, seria) {
  const punkty = (seria ?? []).filter((p) => typeof p.mw === 'number' && typeof p.okres === 'string');
  if (punkty.length < 2) return;

  const W = 240, H = 72, GORA = 14, DOL = 58; // obszar linii: od GORA do DOL
  const maks = Math.max(...punkty.map((p) => p.mw));
  const min = Math.min(0, ...punkty.map((p) => p.mw));
  const x = (i) => (i / (punkty.length - 1)) * W;
  const y = (mw) => DOL - ((mw - min) / (maks - min || 1)) * (DOL - GORA);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  const opis = el('title', {});
  opis.textContent = 'Produkcja z wiatru w bieżącej dobie, co 15 minut, w MW';
  svg.append(
    opis,
    el('line', { x1: 0, y1: DOL, x2: W, y2: DOL, stroke: KOLORY.os, 'stroke-width': 1 }),
    el('polyline', {
      points: punkty.map((p, i) => `${x(i).toFixed(1)},${y(p.mw).toFixed(1)}`).join(' '),
      fill: 'none',
      stroke: KOLORY.wiatr,
      'stroke-width': 1.5,
      'stroke-linejoin': 'round',
    }),
    podpis(`maks. ${Math.round(maks).toLocaleString('pl-PL')} MW`, { x: 0, y: 10 }),
    podpis(punkty[0].okres.split(' - ')[0], { x: 0, y: H - 2 }),
    podpis(punkty.at(-1).okres.split(' - ')[1] ?? '', { x: W, y: H - 2, 'text-anchor': 'end' }),
  );
  kontener.append(svg);
}

// Cena prądu RCE: plik rce.json powstaje przy budowaniu (scripts/pobierz-pse.mjs), zawiera doby wg czasu polskiego.
// Bieżącą dobę i kwadrans wybieramy wg czasu Europe/Warsaw (koniec_utc to chwila absolutna, więc strefa
// komputera nie ma znaczenia). Nigdy nie pokazujemy ceny z innej doby jako aktualnej.
const MS_KWADRANS = 15 * 60_000;
const formatCeny = (c) => c.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dzisPL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

function rysujWykresCeny(kontener, seria, teraz) {
  const W = 240, H = 84, GORA = 26, DOL = 70; // obszar linii: od GORA do DOL
  const ceny = seria.map((p) => p.cena);
  const maks = Math.max(...ceny);
  const min = Math.min(...ceny);
  const y = (c) => DOL - ((c - min) / (maks - min || 1)) * (DOL - GORA);
  // Oś X to czas: od początku pierwszego do końca ostatniego kwadransu doby (działa też przy zmianie czasu).
  const start = Date.parse(seria[0].koniec_utc) - MS_KWADRANS;
  const koniec = Date.parse(seria.at(-1).koniec_utc);
  const x = (t) => ((t - start) / (koniec - start)) * W;

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  const opis = el('title', {});
  opis.textContent = 'Cena prądu RCE w bieżącej dobie, co 15 minut, w zł/MWh';
  svg.append(opis, el('line', { x1: 0, y1: DOL, x2: W, y2: DOL, stroke: KOLORY.os, 'stroke-width': 1 }));
  if (min < 0) {
    svg.append(el('line', { x1: 0, y1: y(0), x2: W, y2: y(0), stroke: KOLORY.tekstPomocniczy, 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
  }
  svg.append(
    el('polyline', {
      points: seria.map((p) => `${x(Date.parse(p.koniec_utc) - MS_KWADRANS / 2).toFixed(1)},${y(p.cena).toFixed(1)}`).join(' '),
      fill: 'none',
      stroke: KOLORY.tekst,
      'stroke-width': 1.5,
      'stroke-linejoin': 'round',
    }),
    el('line', { x1: x(teraz), y1: GORA - 4, x2: x(teraz), y2: DOL, stroke: KOLORY.teraz, 'stroke-width': 1.5 }),
    podpis(`maks. ${formatCeny(maks)} zł/MWh`, { x: 0, y: 10 }),
    podpis(`min. ${formatCeny(min)} zł/MWh`, { x: 0, y: 21 }),
    podpis('teraz', { x: W, y: 21, 'text-anchor': 'end', fill: KOLORY.teraz }),
    podpis(seria[0].okres.split(' - ')[0], { x: 0, y: H - 2 }),
    podpis(seria.at(-1).okres.split(' - ')[1] ?? '', { x: W, y: H - 2, 'text-anchor': 'end' }),
  );
  kontener.replaceChildren(svg);
}

function pokazCene(rce) {
  const tekst = document.getElementById('rce-teraz');
  const wykres = document.getElementById('rce-wykres');
  const seria = (rce?.doby?.[dzisPL()] ?? []).filter((p) => typeof p.cena === 'number' && p.koniec_utc);
  const teraz = Date.now();
  const biezacy = seria.find((p) => {
    const k = Date.parse(p.koniec_utc);
    return teraz >= k - MS_KWADRANS && teraz < k;
  });
  if (!biezacy) {
    tekst.textContent = 'Cena prądu (RCE): brak danych na dziś';
    wykres.replaceChildren();
    return;
  }
  tekst.textContent = `Cena prądu (RCE) teraz: ${formatCeny(biezacy.cena)} zł/MWh, ${biezacy.okres}`;
  if (seria.length >= 2) rysujWykresCeny(wykres, seria, teraz);
}

const cenaGotowa = fetch(`${import.meta.env.BASE_URL}data/rce.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .then((rce) => {
    if (rce?.czas_pobrania) document.getElementById('rce-pobrano').textContent = formatCzasu(rce.czas_pobrania);
    pokazCene(rce);
    setInterval(() => pokazCene(rce), 60_000); // co minutę: nowy kwadrans, a po północy – nowa doba
  })
  .catch(() => {
    /* zostaje „brak danych na dziś” */
  });

const wiatrGotowy = fetch(`${import.meta.env.BASE_URL}data/wiatr.json`, { cache: 'no-store' })
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
  });

// Okienko mogło się poszerzyć (teksty, wykresy) – po wczytaniu obu plików dopasuj kadr jeszcze raz, bez animacji.
const daneGotowe = Promise.allSettled([wiatrGotowy, cenaGotowa]);
if (BEZ_RUCHU) {
  daneGotowe.then(() => {
    if (!uzytkownikRuszylMape) ustawKadr(); // okienko mogło urosnąć – poprawiamy kadr Polski
  });
} else {
  // Lot: co najmniej 1 s po otwarciu, gdy okienko ma dane (znamy jego szerokość) i gdy tło jest wczytane (max 5 s).
  Promise.all([daneGotowe, czekaj(1000), tloGotowe]).then(lotDoPolski);
}
