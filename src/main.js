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
  wiatrLad: '#4ADE80', // zielony: lądowe farmy wiatrowe (GEM)
  kontur: '#E8EEF7',
  tekst: '#E8EEF7',
  tekstPomocniczy: '#A9B7CC',
  os: '#2A3550',
  teraz: '#FF8A5B',
};

// Statusy farm morskich z EMODnet – tłumaczenie tylko wyświetlanego tekstu (dane źródłowe bez zmian),
// spójne z farmami lądowymi. W danych z 10.07.2026 występują tylko Planned i Construction; nieznana wartość
// pokaże się w oryginale.
const STATUS_MORSKIE_PL = { Planned: 'planowana', Construction: 'w budowie', Production: 'działa' };

// Uzupełnienie statusu farm morskich z nowszego źródła (dane EMODnet zostają bez zmian; opis w ZRODLA.md).
const KOREKTY_STATUSU = {
  'Baltic Power':
    'stan wg balticpower.pl: w rozruchu – pierwsza energia do sieci 10.07.2026 (odbiór potwierdziły PSE), ' +
    'wszystkie 76 turbin zainstalowane (7.10.2026), każda po podłączeniu przechodzi 240-godzinną próbę; ' +
    'jeszcze bez koncesji na wytwarzanie, etap przed eksploatacją komercyjną (daty nie podano). ' +
    'W danych EMODnet (10.07.2026) i GEM (dane wiatrowe z lutego 2026): w budowie.',
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
// Z prawej: legenda (.legenda) – kadr Polski nie wchodzi pod nią.
function odstepKadru() {
  const okno = document.querySelector('.wskaznik');
  const legenda = document.querySelector('.legenda');
  const szerokoscMapy = document.getElementById('mapa').clientWidth;
  const lewy = okno ? okno.offsetLeft + okno.offsetWidth + MARGINES : MARGINES;
  const prawy = legenda ? szerokoscMapy - legenda.offsetLeft + MARGINES : MARGINES;
  if (lewy + prawy + 200 > szerokoscMapy) {
    // Za wąsko na oba odstępy: najpierw rezygnujemy z odstępu na legendę, potem na okienko.
    if (lewy + MARGINES + 200 <= szerokoscMapy) return { top: MARGINES, right: MARGINES, bottom: MARGINES, left: lewy };
    return { top: MARGINES, right: MARGINES, bottom: MARGINES, left: MARGINES };
  }
  return { top: MARGINES, right: prawy, bottom: MARGINES, left: lewy };
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
  // Własny przycisk atrybucji (niżej): rozwinięty od razu, żeby „© OpenStreetMap contributors” był stale widoczny
  // także przy zwiniętej stopce „Źródła i licencje” (wymóg licencji ODbL dla linii z OSM).
  attributionControl: false,
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

map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');

if (BEZ_RUCHU) ustawKadr();
else map.jumpTo(kameraKuli());

// Lot rusza dopiero, gdy kafelki tła dla widoku kuli są wczytane (pierwsze „idle” mapy),
// ale najpóźniej po 5 s od otwarcia – żeby przy wolnym internecie nie czekać w nieskończoność.
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
const tloGotowe = Promise.race([new Promise((r) => map.once('idle', r)), czekaj(5000)]);
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

// Przełącznik Dzień/Noc: zwykłe przyciski (Tab, Enter, Spacja), stan w aria-pressed. Wybór nie jest zapamiętywany.
function ustawTryb(tryb) {
  trybMapy = tryb;
  map.setLayoutProperty('tlo-noc', 'visibility', tryb === 'noc' ? 'visible' : 'none');
  map.setLayoutProperty('tlo-dzien', 'visibility', tryb === 'dzien' ? 'visible' : 'none');
  for (const przycisk of document.querySelectorAll('.przelacznik button')) {
    przycisk.setAttribute('aria-pressed', String(przycisk.dataset.tryb === tryb));
  }
  odswiezKoloryElektrowni();
}

// Elektrownie (GEM, tylko działające): kolory zależne od trybu. W trybie Dzień jaśniejsze odcienie tej samej barwy,
// bo na jasnym lądzie Blue Marble ciemniejsze mają kontrast poniżej 3:1. Woda w obu trybach ta sama.
// Węgiel: czerwony (decyzja Ani po porównaniu z ciemnym pomarańczem).
const KOLORY_ELEKTROWNI = {
  noc: { wegiel: '#EF4444', gaz: '#8B5CF6', woda: '#3B82F6' },
  dzien: { wegiel: '#F87171', gaz: '#A78BFA', woda: '#3B82F6' },
};
let trybMapy = 'noc';
function koloryElektrowni() {
  return KOLORY_ELEKTROWNI[trybMapy];
}
function odswiezKoloryElektrowni() {
  const k = koloryElektrowni();
  // Znaczki w legendzie korzystają z tych samych kolorów (zmienne CSS).
  const styl = document.documentElement.style;
  styl.setProperty('--kolor-wegiel', k.wegiel);
  styl.setProperty('--kolor-gaz', k.gaz);
  styl.setProperty('--kolor-woda', k.woda);
  if (map.getLayer('elektrownie')) {
    map.setPaintProperty('elektrownie', 'icon-color', ['match', ['get', 'rodzaj'], 'wegiel', k.wegiel, 'gaz', k.gaz, k.woda]);
  }
}
odswiezKoloryElektrowni();

// Znaczki elektrowni rysowane w kodzie (bez obrazków z zewnątrz) jako SDF – MapLibre nadaje im kolor (icon-color)
// i ciemną obwódkę (icon-halo) o stałej grubości niezależnie od rozmiaru znaczka.
// Wartość kanału alfa: 0,75 na krawędzi kształtu, spada o 1/8 na każdy piksel na zewnątrz (jak w czcionkach MapLibre).
const BOK_ZNACZKA = 32; // bok kwadratu (średnica kółka) w pikselach obrazka przy icon-size = 1
function znaczekSdf(ksztalt) {
  const ZAPAS = 8;
  const N = BOK_ZNACZKA + 2 * ZAPAS;
  const h = BOK_ZNACZKA / 2;
  const dane = new Uint8ClampedArray(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const px = x + 0.5 - N / 2;
      const py = y + 0.5 - N / 2;
      let d; // odległość od krawędzi kształtu: dodatnia na zewnątrz
      if (ksztalt === 'kolo') {
        d = Math.hypot(px, py) - h;
      } else {
        // romb = kwadrat obrócony o 45°, o przekątnej ok. 1,25 boku kwadratu
        const [u, v] = ksztalt === 'romb' ? [(px + py) / Math.SQRT2, (py - px) / Math.SQRT2] : [px, py];
        const pol = ksztalt === 'romb' ? (BOK_ZNACZKA * 1.25) / (2 * Math.SQRT2) : h;
        const dx = Math.abs(u) - pol;
        const dy = Math.abs(v) - pol;
        d = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
      }
      dane[(y * N + x) * 4 + 3] = 255 * (1 - (d / 8 + 0.25));
    }
  }
  return { width: N, height: N, data: dane };
}

// Bloki z wyciągu GEM zsumowane do jednej lokalizacji i rodzaju (jeden znaczek = jedna elektrownia).
// Tylko status „operating”. Szczytowo-pompowe: technologia GEM zawierająca „pumped storage”.
function zbierzElektrownie(geo) {
  const lokalizacje = new Map();
  for (const f of geo.features) {
    const p = f.properties;
    if (p.status !== 'operating') continue;
    let rodzaj;
    if (p.typ === 'coal') rodzaj = 'wegiel';
    else if (p.typ === 'oil/gas') rodzaj = 'gaz';
    else if (p.typ === 'hydropower') rodzaj = /pumped storage/i.test(p.technologia ?? '') ? 'pompowa' : 'woda';
    else continue;
    const klucz = `${p.gem_location_id}|${rodzaj}`;
    if (!lokalizacje.has(klucz)) {
      lokalizacje.set(klucz, {
        wspolrzedne: f.geometry.coordinates,
        nazwa: p.nazwa,
        rodzaj,
        moc: 0,
        bloki: 0,
        paliwa: new Set(),
        technologie: new Set(),
        dokladnosc: p.dokladnosc_lokalizacji,
      });
    }
    const e = lokalizacje.get(klucz);
    e.moc += p.moc_mw ?? 0;
    e.bloki += 1;
    if (p.paliwo) for (const paliwo of p.paliwo.split(', ')) e.paliwa.add(paliwo);
    if (p.technologia) e.technologie.add(p.technologia);
  }
  return {
    type: 'FeatureCollection',
    features: [...lokalizacje.values()].map((e) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: e.wspolrzedne },
      properties: {
        nazwa: e.nazwa,
        rodzaj: e.rodzaj,
        moc: Math.round(e.moc * 10) / 10,
        bloki: e.bloki,
        paliwa: [...e.paliwa].join(';'),
        technologie: [...e.technologie].join(';'),
        dokladnosc: e.dokladnosc,
      },
    })),
  };
}

const RODZAJ_ELEKTROWNI_PL = {
  wegiel: 'elektrownia węglowa',
  gaz: 'elektrownia gazowa lub olejowa',
  woda: 'elektrownia wodna',
  pompowa: 'elektrownia szczytowo-pompowa (magazyn energii)',
};
const PALIWO_PL = {
  'coal: bituminous': 'węgiel kamienny',
  'coal: lignite': 'węgiel brunatny',
  'coal: unknown': 'węgiel (rodzaj nieznany)',
  'fossil gas: natural gas': 'gaz ziemny',
  'industrial by-product: coke oven gas': 'gaz koksowniczy',
  'fossil liquids: heavy fuel oil': 'ciężki olej opałowy',
  'fossil liquids: fuel oil': 'olej opałowy',
};
const TECHNOLOGIA_WODNA_PL = {
  'run-of-river': 'przepływowa',
  'conventional storage': 'zbiornikowa',
  'pumped storage': 'szczytowo-pompowa',
};
// Daty danych poszczególnych trackerów GEM wg arkusza About (kolumna „Latest release”).
const ZRODLO_ELEKTROWNI = {
  wegiel: 'Global Coal Plant Tracker, lipiec 2026',
  gaz: 'Global Oil and Gas Plant Tracker, sierpień 2026',
  woda: 'Global Hydropower Tracker, marzec 2026',
  pompowa: 'Global Hydropower Tracker, marzec 2026',
};
// Rodzaje elektrowni widoczne na mapie (pola w legendzie).
const widoczneElektrownie = new Set(['wegiel', 'gaz', 'woda', 'pompowa']);
function filtrElektrowni() {
  return ['in', ['get', 'rodzaj'], ['literal', [...widoczneElektrownie]]];
}

map.on('load', () => {
  for (const przycisk of document.querySelectorAll('.przelacznik button')) {
    przycisk.addEventListener('click', () => ustawTryb(przycisk.dataset.tryb));
  }

  // Linie najwyższych napięć 220/400 kV (© OpenStreetMap contributors, ODbL), plik z scripts/pobierz-linie.mjs.
  // Dodane przed farmami, żeby punkty farm były na wierzchu.
  map.addSource('linie-nn', {
    type: 'geojson',
    data: `${import.meta.env.BASE_URL}data/linie-nn.geojson`,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  });
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

  // Elektrownie działające (GEM): nad liniami, pod farmami wiatrowymi (duże kwadraty nie zasłaniają kropek farm).
  // Kwadrat: spalające paliwo (węgiel, gaz/olej); kółko: wodna; romb: szczytowo-pompowa.
  // Pole znaczka ~ moc zainstalowana (wspólna skala): bok = 0,35 px · √MW do przybliżenia 6, czyli przy widoku całej Polski
  // (100 MW = 3,5 px, 1000 MW = 11,1 px, 5000 MW = 24,7 px – tak jak wzorce w legendzie); najmniej 3 px;
  // od przybliżenia 6 do 9 znaczki rosną dwukrotnie. Mniejsze rysowane na wierzchu większych.
  map.addImage('znaczek-kwadrat', znaczekSdf('kwadrat'), { sdf: true });
  map.addImage('znaczek-kolo', znaczekSdf('kolo'), { sdf: true });
  map.addImage('znaczek-romb', znaczekSdf('romb'), { sdf: true });
  const rozmiar = (pxNaPierwiastekMW) => ['max', 3 / BOK_ZNACZKA, ['*', ['sqrt', ['get', 'moc']], pxNaPierwiastekMW / BOK_ZNACZKA]];
  map.addSource('elektrownie', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'elektrownie',
    type: 'symbol',
    source: 'elektrownie',
    filter: filtrElektrowni(),
    layout: {
      'icon-image': ['match', ['get', 'rodzaj'], 'woda', 'znaczek-kolo', 'pompowa', 'znaczek-romb', 'znaczek-kwadrat'],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 6, rozmiar(0.35), 9, rozmiar(0.7)],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-sort-key': ['-', 0, ['get', 'moc']],
    },
    paint: { 'icon-halo-color': KOLORY.kosmos, 'icon-halo-width': 1 },
  });
  odswiezKoloryElektrowni();
  fetch(`${import.meta.env.BASE_URL}data/zrodla-gem.geojson`)
    .then((odp) => (odp.ok ? odp.json() : null))
    .then((geo) => {
      if (geo) map.getSource('elektrownie').setData(zbierzElektrownie(geo));
    })
    .catch(() => {
      /* bez elektrowni na mapie */
    });

  map.on('click', 'elektrownie', (e) => {
    const p = e.features[0].properties;
    const el = document.createElement('div');
    const tytul = document.createElement('strong');
    tytul.textContent = p.nazwa;
    el.append(tytul);
    const linia = (tekst) => {
      el.append(document.createElement('br'));
      const span = document.createElement('span');
      span.textContent = tekst;
      el.append(span);
    };
    linia(RODZAJ_ELEKTROWNI_PL[p.rodzaj]);
    if (p.rodzaj === 'pompowa') {
      linia('pompuje wodę w górę, gdy prądu jest dużo, i oddaje go, gdy brakuje – to magazyn, a nie źródło energii');
    }
    const paliwa = (p.paliwa ?? '').split(';').filter(Boolean).map((x) => PALIWO_PL[x] ?? x);
    if (p.rodzaj === 'wegiel' && paliwa.length) linia(`rodzaj: ${paliwa.join(', ')}`);
    if (p.rodzaj === 'gaz' && paliwa.length) linia(`paliwo: ${paliwa.join(', ')}`);
    if (p.rodzaj === 'woda' || p.rodzaj === 'pompowa') {
      const t = (p.technologie ?? '').split(';').filter(Boolean).map((x) => TECHNOLOGIA_WODNA_PL[x] ?? x);
      if (t.length) linia(`typ: ${t.join(', ')}`);
    }
    // Odmiana: 1 blok; 2–4, 22–24… bloki (ale 12–14 bloków); pozostałe bloków.
    const n = p.bloki;
    const bloki = n === 1 ? '1 blok' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? `${n} bloki` : `${n} bloków`;
    linia(`moc: ${p.moc.toLocaleString('pl-PL')} MW (${bloki} w danych)`);
    linia('moc zainstalowana – nie bieżąca produkcja');
    linia(p.dokladnosc === 'exact' ? 'lokalizacja: dokładna' : 'lokalizacja: przybliżona (np. najbliższa miejscowość)');
    linia(`źródło: Global Energy Monitor (${ZRODLO_ELEKTROWNI[p.rodzaj]}), CC BY 4.0`);
    new maplibregl.Popup().setLngLat(e.features[0].geometry.coordinates).setDOMContent(el).addTo(map);
  });

  // Legenda: pola włączające i wyłączające warstwy (zwykłe pola wyboru – Tab, Spacja).
  const WARSTWY_LEGENDY = {
    linie: ['linie-nn-obwodka', 'linie-nn'],
    morskie: ['farmy-pelne', 'farmy-puste'],
    ladowe: ['farmy-lad-dziala', 'farmy-lad-budowa', 'farmy-lad-budowa-srodek'],
  };
  for (const pole of document.querySelectorAll('.legenda input[type="checkbox"]')) {
    pole.addEventListener('change', () => {
      const w = pole.dataset.warstwa;
      if (WARSTWY_LEGENDY[w]) {
        for (const id of WARSTWY_LEGENDY[w]) map.setLayoutProperty(id, 'visibility', pole.checked ? 'visible' : 'none');
      } else {
        if (pole.checked) widoczneElektrownie.add(w);
        else widoczneElektrownie.delete(w);
        map.setFilter('elektrownie', filtrElektrowni());
      }
    });
  }

  // Lądowe farmy wiatrowe ≥10 MW: wyciąg z Global Energy Monitor, Global Integrated Power Tracker, September 2026
  // release (CC BY 4.0), plik z scripts/wyciag-gem.py. Tylko „działa” i „w budowie” – planowanych, wstrzymanych
  // i anulowanych nie pokazujemy. Farmy morskie zostają z EMODnet (bez dublowania).
  // Ciemna obwódka: zieleń ma tę samą jasność co złoto linii, obwódka i kształt (kropka, nie linia) je rozdzielają.
  const LAD = ['all', ['==', ['get', 'typ'], 'wind'], ['==', ['get', 'technologia'], 'Onshore']];
  const PROMIEN_LAD = ['interpolate', ['linear'], ['zoom'], 2, 1.5, 5, 3.5, 9, 8];
  map.addSource('zrodla-gem', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/zrodla-gem.geojson` });
  map.addLayer({
    id: 'farmy-lad-dziala',
    type: 'circle',
    source: 'zrodla-gem',
    filter: ['all', LAD, ['==', ['get', 'status'], 'operating']],
    paint: {
      'circle-color': KOLORY.wiatrLad,
      'circle-radius': PROMIEN_LAD,
      'circle-stroke-color': KOLORY.kosmos,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 5, 1, 9, 2],
    },
  });
  // W budowie: zielony pierścień z ciemnym środkiem i małą zieloną kropką – nie wygląda jak „działa”.
  const W_BUDOWIE = ['all', LAD, ['==', ['get', 'status'], 'construction']];
  map.addLayer({
    id: 'farmy-lad-budowa',
    type: 'circle',
    source: 'zrodla-gem',
    filter: W_BUDOWIE,
    paint: {
      'circle-color': KOLORY.kosmos,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 2.5, 5, 5, 9, 10],
      'circle-stroke-color': KOLORY.wiatrLad,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 2, 1, 5, 2, 9, 3],
    },
  });
  map.addLayer({
    id: 'farmy-lad-budowa-srodek',
    type: 'circle',
    source: 'zrodla-gem',
    filter: W_BUDOWIE,
    paint: { 'circle-color': KOLORY.wiatrLad, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 0.8, 5, 1.5, 9, 3] },
  });

  // Okienko lądowej farmy: wszystkie fazy w klikniętym miejscu (kilka faz może mieć te same współrzędne).
  // Faza z GEM: numer (np. „2”, „2a”) → „faza 2: ”; nazwa → sama nazwa bez nawiasów („(Łódź)” → „Łódź: ”);
  // brak fazy → nic.
  const opisFazy = (faza) => {
    if (!faza || faza === 'null') return '';
    if (/^\d+[a-z]?$/i.test(faza)) return `faza ${faza}: `;
    return `${faza.replace(/[()]/g, '').trim()}: `;
  };
  const STATUS_PL = { operating: 'działa', construction: 'w budowie – jeszcze nie produkuje albo produkuje częściowo' };
  map.on('click', ['farmy-lad-dziala', 'farmy-lad-budowa'], (e) => {
    const lokalizacja = e.features[0].properties.gem_location_id;
    const fazy = e.features.filter((f) => f.properties.gem_location_id === lokalizacja);
    const unikalne = [...new Map(fazy.map((f) => [f.properties.gem_unit_id, f.properties])).values()];
    const p = unikalne[0];
    const el = document.createElement('div');
    const tytul = document.createElement('strong');
    tytul.textContent = p.nazwa;
    el.append(tytul);
    const linia = (tekst) => {
      el.append(document.createElement('br'));
      const span = document.createElement('span');
      span.textContent = tekst;
      el.append(span);
    };
    for (const f of unikalne) {
      const moc = typeof f.moc_mw === 'number' ? `${f.moc_mw.toLocaleString('pl-PL')} MW` : 'moc: brak danych';
      const rok = f.rok_uruchomienia ? `, uruchomienie: ${f.rok_uruchomienia}` : '';
      linia(`${opisFazy(f.faza)}${moc}, ${STATUS_PL[f.status] ?? f.status}${rok}`);
    }
    linia(
      p.dokladnosc_lokalizacji === 'exact'
        ? 'lokalizacja: dokładna'
        : 'lokalizacja: przybliżona (np. najbliższa miejscowość)',
    );
    linia('źródło: Global Energy Monitor (dane wiatrowe: Global Wind Power Tracker, luty 2026), CC BY 4.0');
    new maplibregl.Popup().setLngLat(e.features[0].geometry.coordinates).setDOMContent(el).addTo(map);
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
    el.append(tytul, document.createElement('br'), linia(`status: ${STATUS_MORSKIE_PL[status] ?? status}`), document.createElement('br'), linia(`moc: ${moc}`));
    if (weryfikacja) el.append(document.createElement('br'), linia(`weryfikacja: ${weryfikacja_opis ?? weryfikacja}`));
    const korekta = KOREKTY_STATUSU[nazwa];
    if (korekta) el.append(document.createElement('br'), linia(korekta));
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
// znacznik (opcjonalnie): numer kwadransu, na którym stoi kreska (odtwarzanie doby), etykieta: podpis kreski.
function rysujWykres(kontener, seria, { znacznik = null, etykieta = '', opisDoby = 'w bieżącej dobie' } = {}) {
  const punkty = (seria ?? []).filter((p) => typeof p.mw === 'number' && typeof p.okres === 'string');
  if (punkty.length < 2) {
    kontener.replaceChildren();
    return;
  }

  const W = 240, H = 72, GORA = 14, DOL = 58; // obszar linii: od GORA do DOL
  const maks = Math.max(...punkty.map((p) => p.mw));
  const min = Math.min(0, ...punkty.map((p) => p.mw));
  const x = (i) => (i / (punkty.length - 1)) * W;
  const y = (mw) => DOL - ((mw - min) / (maks - min || 1)) * (DOL - GORA);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  const opis = el('title', {});
  opis.textContent = `Produkcja z wiatru ${opisDoby}, co 15 minut, w MW`;
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
  if (znacznik !== null) {
    svg.append(
      el('line', { x1: x(znacznik), y1: GORA - 4, x2: x(znacznik), y2: DOL, stroke: KOLORY.teraz, 'stroke-width': 1.5 }),
      podpis(etykieta, { x: W, y: 10, 'text-anchor': 'end', fill: KOLORY.teraz }),
    );
  }
  kontener.replaceChildren(svg);
}

// Cena prądu RCE: plik rce.json powstaje przy budowaniu (scripts/pobierz-pse.mjs), zawiera doby wg czasu polskiego.
// Bieżącą dobę i kwadrans wybieramy wg czasu Europe/Warsaw (koniec_utc to chwila absolutna, więc strefa
// komputera nie ma znaczenia). Nigdy nie pokazujemy ceny z innej doby jako aktualnej.
const MS_KWADRANS = 15 * 60_000;
const formatCeny = (c) => c.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dzisPL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

function rysujWykresCeny(kontener, seria, teraz, { etykieta = 'teraz', opisDoby = 'w bieżącej dobie' } = {}) {
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
  opis.textContent = `Cena prądu RCE ${opisDoby}, co 15 minut, w zł/MWh`;
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
    podpis(etykieta, { x: W, y: 21, 'text-anchor': 'end', fill: KOLORY.teraz }),
    podpis(seria[0].okres.split(' - ')[0], { x: 0, y: H - 2 }),
    podpis(seria.at(-1).okres.split(' - ')[1] ?? '', { x: W, y: H - 2, 'text-anchor': 'end' }),
  );
  kontener.replaceChildren(svg);
}

function pokazCene(rce) {
  if (odtwarzanie) return; // w trakcie odtwarzania doby okienko pokazuje odtwarzaną dobę – „teraz” wróci po nim
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

let daneRce = null;
const cenaGotowa = fetch(`${import.meta.env.BASE_URL}data/rce.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .then((rce) => {
    daneRce = rce;
    if (rce?.czas_pobrania) document.getElementById('rce-pobrano').textContent = formatCzasu(rce.czas_pobrania);
    pokazCene(rce);
    setInterval(() => pokazCene(rce), 60_000); // co minutę: nowy kwadrans, a po północy – nowa doba
  })
  .catch(() => {
    /* zostaje „brak danych na dziś” */
  });

// Widok „teraz” wiatru w okienku (wywoływany po wczytaniu i po zakończeniu odtwarzania doby).
let daneWiatr = null;
function pokazWiatr(d) {
  document.getElementById('wiatr-etykieta').textContent = 'Produkcja z wiatru (ostatni dostępny pomiar):';
  const ogr = d?.ograniczenie;
  const ograniczenie = document.getElementById('wiatr-ograniczenie');
  ograniczenie.hidden = false;
  if (ogr && typeof ogr.mwh === 'number' && ogr.doba) {
    ograniczenie.textContent = `Ostatnie polecenie PSE ograniczenia wiatru: ${formatDoby(ogr.doba)} – ok. ${ogr.mwh.toLocaleString('pl-PL')} MWh`;
  }
  if (typeof d?.wartosc !== 'number') {
    document.getElementById('wiatr-teraz').textContent = 'brak danych';
    document.getElementById('wiatr-stan').textContent = '';
    document.getElementById('wiatr-wykres').replaceChildren();
    return;
  }
  document.getElementById('wiatr-teraz').textContent = `${Math.round(d.wartosc).toLocaleString('pl-PL')} ${d.jednostka}`;
  document.getElementById('wiatr-stan').textContent = `stan na: ${formatDoby(d.doba)}, ${d.okres}`;
  rysujWykres(document.getElementById('wiatr-wykres'), d.seria);
}

const wiatrGotowy = fetch(`${import.meta.env.BASE_URL}data/wiatr.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .then((d) => {
    if (!d) return;
    daneWiatr = d;
    if (d.czas_pobrania) document.getElementById('wiatr-pobrano').textContent = formatCzasu(d.czas_pobrania);
    pokazWiatr(d);
  })
  .catch(() => {
    /* zostaje „brak danych” */
  });

// Odtwarzanie doby: plik doba.json powstaje przy budowaniu (wczoraj albo – gdy wczoraj niepełne – przedwczoraj).
// Tempo: 1 s = 1 godzina (250 ms na kwadrans). Startuje tylko po kliknięciu przycisku. Przy prefers-reduced-motion
// zegar, wartości i kreski zmieniają się raz na godzinę zamiast co kwadrans. Na czas odtwarzania okienko przestaje
// być „aria-live” (czytnik ogłaszałby 4 zmiany na sekundę) – ogłaszamy tylko start, pauzę i koniec.
const MS_NA_KWADRANS = 250;
let odtwarzanie = null; // { uplyw, start, raf, i } – null, gdy pokazujemy „teraz”
let daneDoby = null;

const okienko = document.querySelector('.wskaznik');
const przyciskStart = document.getElementById('odtw-start');
const przyciskTeraz = document.getElementById('odtw-teraz');
const ogloszenie = (tekst) => (document.getElementById('odtw-ogloszenie').textContent = tekst);

function pokazKwadrans(i) {
  const k = daneDoby.kwadranse;
  const p = k[i];
  const godzina = p.okres.split(' - ')[0];
  const opisDoby = `w dobie ${formatDoby(daneDoby.doba)}`;
  document.getElementById('odtw-zegar').textContent = godzina;
  document.getElementById('wiatr-teraz').textContent = `${Math.round(p.mw).toLocaleString('pl-PL')} MW`;
  document.getElementById('wiatr-stan').textContent = `kwadrans ${p.okres}`;
  rysujWykres(document.getElementById('wiatr-wykres'), k, { znacznik: i, etykieta: godzina, opisDoby });
  document.getElementById('rce-teraz').textContent = `Cena prądu (RCE): ${formatCeny(p.cena)} zł/MWh, ${p.okres}`;
  rysujWykresCeny(document.getElementById('rce-wykres'), k, Date.parse(p.koniec_utc) - MS_KWADRANS / 2, { etykieta: godzina, opisDoby });
}

function klatka(teraz) {
  const uplyw = odtwarzanie.uplyw + (teraz - odtwarzanie.start);
  let i = Math.floor(uplyw / MS_NA_KWADRANS);
  if (BEZ_RUCHU) i -= i % 4; // raz na godzinę
  if (i >= daneDoby.kwadranse.length) {
    wrocDoTeraz('Koniec odtworzenia doby. Pokazuję dane bieżące.');
    return;
  }
  if (i !== odtwarzanie.i) {
    odtwarzanie.i = i;
    pokazKwadrans(i);
  }
  odtwarzanie.raf = requestAnimationFrame(klatka);
}

function startLubPauza() {
  if (!odtwarzanie) {
    // Start od początku doby
    odtwarzanie = { uplyw: 0, start: performance.now(), raf: 0, i: -1 };
    okienko.setAttribute('aria-live', 'off');
    document.getElementById('odtw-naglowek').hidden = false;
    document.getElementById('odtw-data').textContent = `Odtworzenie doby: ${formatDoby(daneDoby.doba)}`;
    document.getElementById('wiatr-etykieta').textContent = 'Produkcja z wiatru:';
    document.getElementById('wiatr-ograniczenie').hidden = true;
    przyciskTeraz.hidden = false;
    przyciskStart.textContent = '❚❚ Pauza';
    ogloszenie(`Odtwarzanie doby ${formatDoby(daneDoby.doba)}, 1 sekunda to 1 godzina.`);
    odtwarzanie.raf = requestAnimationFrame(klatka);
  } else if (odtwarzanie.raf) {
    // Pauza
    cancelAnimationFrame(odtwarzanie.raf);
    odtwarzanie.uplyw += performance.now() - odtwarzanie.start;
    odtwarzanie.raf = 0;
    przyciskStart.textContent = '▶ Wznów';
    ogloszenie(`Pauza, godzina ${document.getElementById('odtw-zegar').textContent}.`);
  } else {
    // Wznowienie
    odtwarzanie.start = performance.now();
    przyciskStart.textContent = '❚❚ Pauza';
    ogloszenie('Wznowiono odtwarzanie.');
    odtwarzanie.raf = requestAnimationFrame(klatka);
  }
}

function wrocDoTeraz(komunikat = 'Pokazuję dane bieżące.') {
  if (odtwarzanie?.raf) cancelAnimationFrame(odtwarzanie.raf);
  odtwarzanie = null;
  document.getElementById('odtw-naglowek').hidden = true;
  przyciskTeraz.hidden = true;
  przyciskStart.textContent = '▶ Odtwórz dobę';
  // Fokus był na „Wróć do teraz”, który znika – przenosimy go na przycisk odtwarzania.
  if (document.activeElement === przyciskTeraz || document.activeElement === document.body) przyciskStart.focus();
  pokazWiatr(daneWiatr);
  pokazCene(daneRce);
  okienko.setAttribute('aria-live', 'polite');
  ogloszenie(komunikat);
}

przyciskStart.addEventListener('click', startLubPauza);
// Karta ukryta w trakcie odtwarzania – automatyczna pauza, żeby po powrocie nie było przeskoku w czasie.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && odtwarzanie?.raf) startLubPauza();
});
przyciskTeraz.addEventListener('click', () => wrocDoTeraz());

const dobaGotowa = fetch(`${import.meta.env.BASE_URL}data/doba.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .catch(() => null)
  .then((d) => {
    const pelna = d?.doba && Array.isArray(d.kwadranse) && d.kwadranse.length >= 2;
    if (!pelna) {
      document.getElementById('odtw-stan').textContent = 'Odtworzenie doby: brak pełnych danych';
      return;
    }
    daneDoby = d;
    document.getElementById('odtw-zrodlo-doba').textContent = formatDoby(d.doba);
    przyciskStart.hidden = false;
  });

// Okienko mogło się poszerzyć (teksty, wykresy) – po wczytaniu obu plików dopasuj kadr jeszcze raz, bez animacji.
const daneGotowe = Promise.allSettled([wiatrGotowy, cenaGotowa, dobaGotowa]);
if (BEZ_RUCHU) {
  daneGotowe.then(() => {
    if (!uzytkownikRuszylMape) ustawKadr(); // okienko mogło urosnąć – poprawiamy kadr Polski
  });
} else {
  // Lot: co najmniej 1 s po otwarciu, gdy okienko ma dane (znamy jego szerokość) i gdy tło jest wczytane (max 5 s).
  Promise.all([daneGotowe, czekaj(1000), tloGotowe]).then(lotDoPolski);
}
