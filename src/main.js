import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { formatMocy, zbierzElektrownie, podsumujLadowe, podsumujElektrownie, podsumujMorskie } from './liczniki.js';
import { t, tn, liczba, zDanych, tekstPl, LOCALE, formatCzasu, formatDoby, formatMiesiaca } from './jezyk.js';
import { dodajWarstweMocy } from './moce.js';
import { utworzOkienka } from './okienko.js';
import { uruchomKarte, podlaczOkienkoPolski } from './karta.js';
import { wiecejPonizej, wysokoscPrzycisku } from './wiecej-ponizej.js';
import { pamietajRozwiniecie, czytajRozwiniecie, zapiszRozwiniecie, TELEFON } from './zwijanie.js';
import { poZmroku } from './slonce.js';
import './czcionki.css';
import './style.css';

// Vite przepakowuje bibliotekę i gubi jej plik workera, więc podajemy adres wprost.
// ?url sprawia, że Vite skopiuje ten plik do gotowej strony i zwróci jego adres.
maplibregl.setWorkerUrl(workerUrl);

// Tryb spokojny (decyzja Ani 23.11.2026): okienko PSE i Karta Polski startują zwinięte; rozwinięcie pamiętane tylko
// w tej karcie przeglądarki (src/zwijanie.js). Legenda – „więcej ▸” niżej (pilnujLegendy).
pamietajRozwiniecie(document.getElementById('okienko-pse'), 'okienko-pse');
pamietajRozwiniecie(document.getElementById('karta'), 'karta');

// Telefon (decyzje Ani 23.11.2026): okienko PSE, Karta i legenda to przyciski przy lewej krawędzi; na starcie wszystko
// zwinięte (także legenda, która na komputerze stoi otwarta); rozwinięte – panel od dołu (src/style.css), tylko jeden
// naraz; Esc zwija otwarty panel.
const OKNA_TELEFONU = ['okienko-pse', 'karta'].map((id) => document.getElementById(id)).concat(document.querySelector('.legenda'));
if (TELEFON.matches) {
  const legenda = document.querySelector('.legenda');
  if (legenda) legenda.open = false;
}
for (const okno of OKNA_TELEFONU) {
  okno?.addEventListener('toggle', () => {
    if (!TELEFON.matches || !okno.open) return;
    for (const inne of OKNA_TELEFONU) if (inne && inne !== okno && inne.open) inne.open = false;
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !TELEFON.matches) return;
  for (const okno of OKNA_TELEFONU) if (okno?.open) okno.open = false;
});

// Kontur Polski leży w public/data/ i jest serwowany razem ze stroną.
const KONTUR_URL = `${import.meta.env.BASE_URL}data/polska-kontur.geojson`;

// Tło satelitarne: NASA GIBS, warstwa Blue Marble (August 2004), WMTS REST w EPSG:3857, bez klucza API.
// Kafelki pobiera przeglądarka widza z serwera NASA (patrz BEZPIECZENSTWO.md). Poziomy 0–8.
const GIBS_BLUE_MARBLE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg';
// Tło nocne: NASA GIBS, warstwa Black Marble (Suomi NPP / VIIRS), zdjęcie z 2016 r. wpisane na stałe
// (żeby obraz nie zmienił się bez naszej wiedzy). PNG, poziomy 0–8, bez klucza API.
// Na /mapa/ z NASA pobieramy ją dopiero od przybliżenia 4 (warstwa „tlo-noc”, minzoom 4) – na wierzch, żeby przy
// zbliżaniu do Polski obraz się wyostrzał.
const GIBS_BLACK_MARBLE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png';
// Spód tła nocnego: NASZA kopia tej samej warstwy (public/kafelki/black-marble-2016, poziomy 0–3, bajt w bajt
// z NASA GIBS – ta sama co globus na stronie tytułowej, opis w ZRODLA.md). Zawsze pod spodem w trybie Noc:
// pierwszy widok kuli idzie tylko z niej, a przy większym przybliżeniu MapLibre powiększa kafelki z poziomu 3,
// więc pod kafelkami NASA zawsze jest ziemia (nigdy czarne dziury). NASA wysyła no-store – nasza kopia jest
// zapamiętywana przez przeglądarkę (public/_headers).
const KAFELKI_NOC_U_NAS = `${location.origin}/kafelki/black-marble-2016/{z}/{y}/{x}.png`;

// Tło satelitarne przetworzone, żeby dane mocniej się wyróżniały – opis w ZRODLA.md. Zmienia tylko obraz NASA,
// nie kolory danych. Noc: odbarwienie i światła przygaszone o 30% (jasność najwyżej 0,7 – wariant A, decyzja Ani
// 23.11.2026: pełne światła konkurowały ze znaczkami; 20.11.2026 przyciemnianie było wyłączone, bo środki miast
// zbliżały się jasnością do znaczków – przy 0,7 znaczki zostają wyraźnie jaśniejsze). Dzień: przyciemnione i odbarwione.
const TLO_PRZETWORZENIE = {
  noc: { 'raster-saturation': -0.3, 'raster-brightness-max': 0.7, 'raster-contrast': 0 },
  dzien: { 'raster-saturation': -0.5, 'raster-brightness-max': 0.7, 'raster-contrast': -0.1 },
};

// Jednolita ostatnia linijka okienek: „ŹRÓDŁO {nazwa} · {pobrano|dane|stan}: {data}”.
// pobrano – kiedy my ściągnęliśmy dane; dane – wersja zbioru u dostawcy; stan – kiedy dane sprawdzono lub opublikowano.
function linijkaZrodla(nazwa, rodzajDaty, data, url = null) {
  const p = document.createElement('p');
  p.className = 'zrodlo';
  const etykieta = document.createElement('span');
  etykieta.className = 'zrodlo__etykieta';
  etykieta.textContent = t('wspolne.zrodlo');
  // Spacja po etykiecie – żeby czytnik ekranu nie czytał „ŹródłoGEM” jako jednego słowa.
  // rodzajDaty: 'pobrano' | 'dane' | 'stan' – napis wg języka strony (słownik: zrodlo.…; PL „stan: 31.10.2026”, EN „as of 31 Oct 2026”).
  // url (opcjonalnie): nazwa źródła jako link (nowa karta) – np. komunikat URE w okienku farmy.
  let zrodlo = document.createTextNode(nazwa);
  if (url) {
    zrodlo = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener', textContent: nazwa });
  }
  p.append(etykieta, ' ', zrodlo, document.createTextNode(` · ${t(`zrodlo.${rodzajDaty}`, data)}`));
  return p;
}

// Data w stopce „Źródła i licencje”: do wczytania „wczytywanie…” (w szablonie), potem data albo – przy prawdziwym
// braku – „brak danych” (zasada z PR #29).
function dataStopki(id, tekst) {
  const el = document.getElementById(id);
  if (el) el.textContent = tekst || t('wspolne.brak_danych');
}

// Licznik pod nazwą warstwy (w legendzie i w zakładce „Skąd” Karty Polski); brak = true pokazuje napis ostrzegawczy.
function ustawLicznik(warstwa, tekst, brak = false) {
  for (const el of document.querySelectorAll(`.legenda__licznik[data-licznik="${warstwa}"]`)) {
    el.textContent = tekst;
    el.classList.toggle('brak-danych', brak);
  }
}


// Kolory zgodne z zasadami wyglądu w CLAUDE.md (kontrast sprawdzony wg WCAG).
const KOLORY = {
  kosmos: '#05070D',
  linie: '#F2C14E', // złoto: linie najwyższych napięć
  wiatr: '#5CC8FF', // jasnoniebieski: farmy i wykres wiatru
  slonce: '#FEF08A', // jasna cytryna: słońce w okienku PSE (kontrast 16,1:1 do tła okienka; inny niż złoto linii)
  wiatrLad: '#4ADE80', // zielony: lądowe farmy wiatrowe (GEM)
  kontur: '#E8EEF7',
  tekst: '#E8EEF7',
  tekstPomocniczy: '#A9B7CC',
  os: '#2A3550',
  teraz: '#FF8A5B',
};

// Statusy farm morskich z EMODnet – tłumaczenie tylko wyświetlanego tekstu (dane źródłowe bez zmian),
// spójne z farmami lądowymi (słownik: farmy.morskie.…). W danych z 10.07.2026 występują tylko Planned i Construction;
// nieznana wartość pokaże się w oryginale.
const statusMorskiej = (status) => (tekstPl(`farmy.morskie.${status}`) ? t(`farmy.morskie.${status}`) : status);

// Uzupełnienia farm morskich z nowszych źródeł – dane EMODnet zostają bez zmian (opis w ZRODLA.md, wpis EMODnet).
// Źródła: nazwa, link, data stanu (RRRR-MM-DD) albo miesiąc (RRRR-MM). Wykaz MKiŚ – w każdym okienku farmy (weryfikacja).
const ZRODLA_FARM = {
  mkis: { nazwa: 'farmy.zrodlo_mkis', url: 'https://www.gov.pl/web/morska-energetyka-wiatrowa/obecnie-realizowane-projekty-w-polsce', miesiac: '2024-01' },
  ure: {
    nazwa: 'URE',
    url: 'https://www.ure.gov.pl/pl/urzad/informacje-ogolne/aktualnosci/13009,Offshore-Pierwsza-aukcja-dla-morskich-farm-wiatrowych-rozstrzygnieta.html',
    stan: '2025-12-18',
  },
  northland: {
    nazwa: 'Northland Power',
    url: 'https://northlandpower.com/northland-power-reports-third-quarter-2026-results-value-accretive-growth-updates-and-reaffirms-2026-guidance/',
    stan: '2026-11-12',
  },
  balticpower: {
    nazwa: 'balticpower.pl',
    url: 'https://balticpower.pl/news/baltic-power-project-completes-installation-of-all-76-turbines-the-first-polish-offshore-wind-farm-in-poland-enters-the-final-stage-before-commercial-operations/',
    stan: '2026-10-07',
  },
};
// Nazwa źródła: klucz słownika (MKiŚ) albo nazwa własna bez tłumaczenia (URE, Northland Power, balticpower.pl).
const nazwaZrodla = (n) => (n.startsWith('farmy.') ? t(n) : n);
const linijkaZrodlaFarmy = (z) =>
  linijkaZrodla(nazwaZrodla(ZRODLA_FARM[z].nazwa), 'stan', z === 'mkis' ? formatMiesiaca(ZRODLA_FARM[z].miesiac) : formatDoby(ZRODLA_FARM[z].stan), ZRODLA_FARM[z].url);

// Pierwsza aukcja offshore URE (AMFW/1/2025, 17.12.2025): Baltic East 900 MW, Baltica 9 975 MW, MFW Bałtyk I 1560 MW.
const AUKCJA_URE = '2025-12-17';
const mocMW = (mw) => `${liczba(mw)} MW`; // moc farmy bez zaokrąglania (np. 1045,5 MW)
const aukcja = () => t('farmy.aukcja_ure', formatDoby(AUKCJA_URE));
const aukcjaBaltyk1 = () => t('farmy.aukcja_ure_baltyk1', formatDoby(AUKCJA_URE), mocMW(1560));
// rozruch – status „w rozruchu – część turbin produkuje” zamiast „w budowie” z EMODnet (nie „działa”: bez koncesji
// i eksploatacji komercyjnej); moc – własna linijka mocy; dopiski – linijki pod weryfikacją; zrodla – linijki źródeł.
const UZUPELNIENIA_FARM = {
  'Baltic Power': { rozruch: true, dopiski: [() => t('farmy.korekta.baltic_power')], zrodla: ['northland', 'balticpower'] },
  'Baltic East': { moc: (p) => t('farmy.moc_baltic_east', mocMW(p.moc_mw), mocMW(900)), dopiski: [aukcja], zrodla: ['ure'] },
  'Baltica 9': { dopiski: [aukcja], zrodla: ['ure'] },
  'Baltyk I Phase 1': { dopiski: [aukcjaBaltyk1], zrodla: ['ure'] },
  'Baltyk I Phase 2': { dopiski: [aukcjaBaltyk1], zrodla: ['ure'] },
};
const FARMY_W_ROZRUCHU = Object.keys(UZUPELNIENIA_FARM).filter((n) => UZUPELNIENIA_FARM[n].rozruch);

// Weryfikacja farmy morskiej z danych (po polsku: „na liście MKiŚ”, „prawdopodobny duplikat: X”…) → tekst w języku strony.
// Wartości w pliku danych zostają bez zmian (są też kluczami); puste kółka mają osobne, dokładniejsze napisy (farmy.pokaz.…).
function weryfikacjaFarmy(tekst) {
  const duplikat = tekstPl('farmy.weryfikacja.duplikat');
  if (tekst.startsWith(duplikat)) return t('farmy.pokaz.duplikat') + tekst.slice(duplikat.length);
  if (tekst === tekstPl('farmy.weryfikacja.brak_na_liscie')) return t('farmy.pokaz.brak');
  return zDanych(tekst, 'farmy.weryfikacja.');
}

// Przybliżony prostokąt obejmujący Polskę i farmy na Bałtyku (do 55,56°N): [zachód, południe], [wschód, północ].
const GRANICE_POLSKI = [
  [14.0, 48.9],
  [24.2, 55.8],
];

// Odstęp kadru od krawędzi. Z lewej: szerokość okienka (.wskaznik) plus margines,
// żeby żadna farma ani linia nie była pod okienkiem. Na wąskim ekranie, gdzie to się
// nie mieści, zostaje zwykły odstęp.
const MARGINES = 24;
// Okienko PSE liczymy zawsze w rozwiniętej szerokości – zwinięta linijka jest węższa, a kadr Polski ma być ten sam
// co przed trybem spokojnym (mapa bez zmian, decyzja Ani 23.11.2026). Na chwilę pomiaru rozwijamy je i od razu zwijamy –
// w tym samym kroku, bez rysowania, więc widz nic nie widzi.
function krawedzRozwinietego(okno, prawaKrawedz) {
  if (!okno || okno.open) return prawaKrawedz(okno);
  okno.open = true;
  const krawedz = prawaKrawedz(okno);
  okno.open = false;
  return krawedz;
}

// Z prawej: legenda (.legenda) – kadr Polski nie wchodzi pod nią.
// Z lewej: szersze z dwóch – okienko PSE (góra) albo Karta Polski (dół); zwinięcie Karty nie rusza mapy.
function odstepKadru() {
  // Telefon: Polska na środku między przyciskami okien (lewa góra) a „← OSIRIS” (dół), bez przesunięcia w prawo.
  if (TELEFON.matches) {
    const mapa = document.getElementById('mapa');
    // Etap C2: kafelki 2×2 pod przyciskami okien – Polska pod nimi (gdy widoczne).
    const kafelki = document.getElementById('kafelki-polski');
    const przyciski = [...OKNA_TELEFONU, kafelki?.offsetParent ? kafelki : null].filter(Boolean).map((e) => e.getBoundingClientRect().bottom);
    const gora = Math.max(...przyciski) - mapa.getBoundingClientRect().top + 16;
    const powrot = document.querySelector('.powrot');
    const dol = powrot ? mapa.getBoundingClientRect().bottom - powrot.getBoundingClientRect().top + 12 : MARGINES;
    return { top: Math.round(gora), right: 12, bottom: Math.round(dol), left: 12 };
  }
  const okno = document.querySelector('.wskaznik');
  const karta = document.querySelector('.karta');
  const legenda = document.querySelector('.legenda');
  const szerokoscMapy = document.getElementById('mapa').clientWidth;
  const prawaKrawedz = (e) => (e ? e.offsetLeft + e.offsetWidth : 0);
  const lewy = Math.max(krawedzRozwinietego(okno, prawaKrawedz), prawaKrawedz(karta)) + MARGINES;
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
// Środek Polski lekko na prawo od środka okna – o tę część szerokości mapy, tak samo w PL i EN (decyzja Ani 23.11.2026;
// wcześniej środek wolnej części ekranu: 6–8% w PL, 8–12% w EN). Wielkość Polski – jak dotąd (przybliżenie z odstępów
// od okienek, odstepKadru). Sprawdzone 1920×1080, 1440×900, 1280×720: okna i legenda nie zasłaniają konturu Polski.
const PRZESUNIECIE_KADRU = 0.05;
const SRODEK_POLSKI = new maplibregl.LngLatBounds(GRANICE_POLSKI).getCenter();
function kameraPolski() {
  const padding = odstepKadru();
  // Odstęp zapamiętany z poprzedniego wywołania doliczyłby się drugi raz – najpierw go zerujemy.
  map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
  // cameraForBounds daje przybliżenie dopasowane do wolnej części ekranu. Jego środek jest już przesunięty
  // o odstęp, więc bierzemy środek prostokąta Polski – a odstęp ustawia go w środku wolnej części ekranu.
  // Kula (globe): przy dużym odstępie tylko od góry (kafelki na telefonie, Etap C2) MapLibre zaniża przybliżenie
  // (25.11.2026: 2,15 zamiast ok. 4,6 – widać całą kulę). Przybliżenie liczymy z tym samym wolnym miejscem rozłożonym
  // po równo na górę i dół; środek Polski i tak ustawia prawdziwy odstęp (padding niżej). Komputer: odstępy góra = dół.
  const polowa = (padding.top + padding.bottom) / 2;
  const kamera = map.cameraForBounds(GRANICE_POLSKI, { padding: TELEFON.matches ? { ...padding, top: polowa, bottom: polowa } : padding });
  if (!kamera) return null;
  // Odstęp tylko z lewej, równy 2 × przesunięcie: środek wolnej części = środek okna + przesunięcie.
  const szerokosc = document.getElementById('mapa').clientWidth;
  if (TELEFON.matches) return { center: SRODEK_POLSKI, zoom: kamera.zoom - ODDALENIE, padding }; // telefon – na środku
  const przesuniecie = { top: padding.top, bottom: padding.bottom, left: Math.round(2 * PRZESUNIECIE_KADRU * szerokosc), right: 0 };
  return { center: SRODEK_POLSKI, zoom: kamera.zoom - ODDALENIE, padding: przesuniecie };
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
// Przełączenie Dzień/Noc nie uruchamia lotu (decyzja Ani 21.11.2026) – mapa zostaje w miejscu.
let lotRuszyl = BEZ_RUCHU; // przy „ogranicz ruch” kadr Polski jest od razu, bez lotu
function lotDoPolski() {
  lotRuszyl = true;
  if (uzytkownikRuszylMape) return;
  const k = kameraPolski();
  if (k) map.flyTo({ ...k, duration: 3500, essential: false });
}

const map = new maplibregl.Map({
  container: 'mapa',
  // Własny przycisk atrybucji (niżej): rozwinięty od razu, żeby „© OpenStreetMap contributors” był stale widoczny
  // także przy zwiniętej stopce „Źródła i licencje” (wymóg licencji ODbL dla linii z OSM).
  attributionControl: false,
  // Podpisy przycisków MapLibre w języku strony (czytnik ekranu, podpowiedzi).
  locale: {
    'NavigationControl.ZoomIn': t('mapa.przybliz'),
    'NavigationControl.ZoomOut': t('mapa.oddal'),
    'AttributionControl.ToggleAttribution': t('mapa.atrybucja'),
  },
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
      'tlo-noc': { type: 'raster', tiles: [GIBS_BLACK_MARBLE], tileSize: 256, minzoom: 4, maxzoom: 8 },
      'tlo-noc-baza': { type: 'raster', tiles: [KAFELKI_NOC_U_NAS], tileSize: 256, maxzoom: 3 },
      polska: { type: 'geojson', data: KONTUR_URL },
    },
    // Domyślnie tryb Noc; przełącznik Dzień/Noc pokazuje jedną warstwę tła i – gdy ma już kafelki – chowa drugą (bez animacji).
    // Noc to dwie warstwy: na spodzie nasza kopia (tlo-noc-baza), na wierzchu NASA od przybliżenia 4 (tlo-noc).
    layers: [
      { id: 'tlo', type: 'background', paint: { 'background-color': KOLORY.kosmos } },
      { id: 'tlo-noc-baza', type: 'raster', source: 'tlo-noc-baza', layout: { visibility: 'visible' }, paint: TLO_PRZETWORZENIE.noc },
      { id: 'tlo-dzien', type: 'raster', source: 'tlo-dzien', layout: { visibility: 'none' }, paint: TLO_PRZETWORZENIE.dzien },
      { id: 'tlo-noc', type: 'raster', source: 'tlo-noc', minzoom: 4, layout: { visibility: 'visible' }, paint: TLO_PRZETWORZENIE.noc },
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
// Bez czarnych dziur: nowe tło włączamy od razu, a stare chowamy dopiero, gdy nowe ma wszystkie kafelki widoku
// (do tej chwili spod nowego, niewczytanego tła widać stare). Kafelek z błędem też kończy czekanie (MapLibre liczy
// go jako wczytany). Szybkie kolejne kliknięcia: każde ma swój numer, starsze czekanie nic już nie zmienia.
// Stan przycisku (aria-pressed) i kolory elektrowni zmieniają się w tej samej chwili co tło (decyzja Ani 21.11.2026).
let numerZmianyTla = 0;
function ustawTryb(tryb) {
  const nowe = tryb === 'noc' ? 'tlo-noc' : 'tlo-dzien'; // ta sama nazwa warstwy i źródła
  const stare = tryb === 'noc' ? 'tlo-dzien' : 'tlo-noc';
  // Nocą czekamy na naszą warstwę spodnią (to ona jest ziemią); kafelki NASA dochodzą na wierzch później.
  const czekamyNa = tryb === 'noc' ? 'tlo-noc-baza' : 'tlo-dzien';
  const numer = ++numerZmianyTla;
  map.setLayoutProperty(nowe, 'visibility', 'visible');
  if (tryb === 'noc') map.setLayoutProperty('tlo-noc-baza', 'visibility', 'visible');

  const zmienNaraz = () => {
    trybMapy = tryb;
    map.setLayoutProperty(stare, 'visibility', 'none');
    if (tryb === 'dzien') map.setLayoutProperty('tlo-noc-baza', 'visibility', 'none');
    for (const przycisk of document.querySelectorAll('.przelacznik button')) {
      przycisk.setAttribute('aria-pressed', String(przycisk.dataset.tryb === tryb));
    }
    odswiezKoloryElektrowni();
  };

  // Najpierw jedna klatka – dopiero wtedy MapLibre wie, których kafelków nowego tła potrzebuje.
  const sprawdz = () => {
    if (numer !== numerZmianyTla) {
      map.off('sourcedata', sprawdz);
      return;
    }
    if (!map.isSourceLoaded(czekamyNa)) return;
    map.off('sourcedata', sprawdz);
    zmienNaraz();
  };
  map.once('render', () => {
    map.on('sourcedata', sprawdz);
    sprawdz();
  });
}

// Elektrownie (GEM, tylko działające): kolory zależne od trybu. W trybie Dzień jaśniejsze odcienie tej samej barwy,
// bo na jasnym lądzie Blue Marble ciemniejsze mają kontrast poniżej 3:1. Woda w obu trybach ta sama.
// Węgiel: czerwony (decyzja Ani po porównaniu z ciemnym pomarańczem).
// brunatny: tylko pasek miksu w Karcie Polski (na mapie GEM nie rozróżniamy węgla kamiennego i brunatnego) –
// pomarańczowo-brązowy, żeby odróżniał się od czerwieni węgla kamiennego obok.
const KOLORY_ELEKTROWNI = {
  noc: { wegiel: '#EF4444', brunatny: '#C2410C', gaz: '#8B5CF6', woda: '#3B82F6' },
  dzien: { wegiel: '#F87171', brunatny: '#EA580C', gaz: '#A78BFA', woda: '#3B82F6' },
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
  styl.setProperty('--kolor-brunatny', k.brunatny);
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


// Rodzaj elektrowni, paliwa i technologie wodne GEM – napisy w słowniku (elektrownia.…, gem.paliwo.…,
// gem.technologia.…); dane GEM zostają bez zmian. Nieznana kategoria pokaże się w oryginale.
const kategoriaGem = (klucz, wartosc) => (tekstPl(`${klucz}${wartosc}`) ? t(`${klucz}${wartosc}`) : wartosc);
// Daty danych poszczególnych trackerów GEM wg arkusza About (kolumna „Latest release”), RRRR-MM.
// (węgiel: Global Coal Plant Tracker; gaz i olej: Global Oil and Gas Plant Tracker; woda: Global Hydropower Tracker)
const DANE_ELEKTROWNI = {
  wegiel: '2026-07',
  gaz: '2026-08',
  woda: '2026-03',
  pompowa: '2026-03',
};
const DANE_WIATR_GEM = '2026-02'; // Global Wind Power Tracker (lądowe farmy wiatrowe)
const STAN_OSM = '2026-11-19'; // linie 220/400 kV z OpenStreetMap
const DANE_EMODNET = '2026-07-10'; // farmy morskie
// Możliwe duplikaty innego wpisu EMODnet (puste kółka): widoczne dopiero od przybliżenia 9 (wariant C, decyzja Ani
// 25.11.2026). Wtedy pusty „Orlen Neptun VIII” (2,5 km od Baltic Power) stoi już obok pełnej kropki (ok. 28 px), a nie na
// niej – przy 8 jeszcze częściowo na nią zachodzi. Farmy spoza wykazu MKiŚ są widoczne zawsze – to osobne wpisy.
const PROG_DUPLIKATOW = 9;
// Licznik farm morskich (legenda i zakładka „Skąd”): farmy bez możliwych duplikatów · w rozruchu / w budowie (gdy są) /
// planowane. Liczba duplikatów – osobno w opisie legendy („3 możliwe duplikaty – widoczne po przybliżeniu”).
function licznikMorskich(m) {
  const czesci = [
    m.wRozruchu && t('licznik.w_rozruchu', m.wRozruchu),
    m.wBudowie && t('licznik.w_budowie', m.wBudowie),
    tn('liczba.planowana', m.planowane - m.duplikatyPlanowane),
  ].filter(Boolean);
  return t('licznik.morskie', tn('liczba.farma', m.rekordy - m.duplikaty), czesci.join(', '));
}
// Rodzaje elektrowni widoczne na mapie (pola w legendzie).
const widoczneElektrownie = new Set(['wegiel', 'gaz', 'woda', 'pompowa']);
function filtrElektrowni() {
  return ['in', ['get', 'rodzaj'], ['literal', [...widoczneElektrownie]]];
}

map.on('load', () => {
  // Okienka wzoru C (src/okienko.js): pierwszeństwo ma obiekt narysowany najwyżej – stacje z wolną mocą (src/moce.js)
  // wygrywają z elektrowniami i farmami w tym samym miejscu, a kropki – z liniami.
  const okienka = utworzOkienka(map);
  podlaczOkienkoPolski(okienka); // duża liczba w Karcie Polski → okienko Polski

  for (const przycisk of document.querySelectorAll('.przelacznik button')) {
    przycisk.addEventListener('click', () => {
      ustawTryb(przycisk.dataset.tryb);
    });
  }

  // Linie najwyższych napięć 220/400 kV (© OpenStreetMap contributors, ODbL), plik z scripts/pobierz-linie.mjs.
  // Dodane przed farmami, żeby punkty farm były na wierzchu.
  map.addSource('linie-nn', {
    type: 'geojson',
    data: `${import.meta.env.BASE_URL}data/linie-nn.geojson`,
    // Numery odcinków nadaje MapLibre (plik ich nie ma) – potrzebne do podświetlenia odcinka pod kursorem.
    generateId: true,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  });
  // Odcinek pod kursorem: grubszy o 2 px, w tym samym złotym kolorze (znak, że linię można kliknąć).
  const PODSWIETLENIE_LINII = ['case', ['boolean', ['feature-state', 'podswietlona'], false], 2, 0];
  // Ciemna obwódka pod złotymi liniami (o 2 px szersza): światła miast na nocnym tle są bursztynowe,
  // prawie w kolorze złota – ciemna krawędź oddziela linię od świateł. Działa w obu trybach.
  map.addLayer({
    id: 'linie-nn-obwodka',
    type: 'line',
    source: 'linie-nn',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': KOLORY.kosmos, 'line-width': ['+', ['match', ['get', 'napiecie'], 400, 4.5, 3.2], PODSWIETLENIE_LINII] },
  });
  map.addLayer({
    id: 'linie-nn',
    type: 'line',
    source: 'linie-nn',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': KOLORY.linie, 'line-width': ['+', ['match', ['get', 'napiecie'], 400, 2.5, 1.2], PODSWIETLENIE_LINII] },
  });
  // Niewidoczny, szeroki pas wzdłuż linii – tylko po to, żeby cienką linię dało się wygodnie kliknąć.
  map.addLayer({
    id: 'linie-nn-klik',
    type: 'line',
    source: 'linie-nn',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': KOLORY.kosmos, 'line-width': 12, 'line-opacity': 0.01 },
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
      if (!geo?.features) throw new Error('brak pliku');
      const elektrownie = zbierzElektrownie(geo);
      map.getSource('elektrownie').setData(elektrownie);
      // Liczniki – wspólne funkcje z src/liczniki.js (te same co liczby na stronie tytułowej).
      for (const rodzaj of ['wegiel', 'gaz', 'woda', 'pompowa']) {
        const { liczba: ile, mocMw } = podsumujElektrownie(elektrownie, rodzaj);
        ustawLicznik(rodzaj, `${tn('liczba.elektrownia', ile)} · ${formatMocy(mocMw, LOCALE)}`);
      }
      const lad = podsumujLadowe(geo);
      ustawLicznik('ladowe', t('licznik.ladowe', tn('liczba.farma_dziala', lad.farmy), formatMocy(lad.mocMw, LOCALE), lad.wBudowie));
    })
    .catch(() => {
      for (const w of ['ladowe', 'wegiel', 'gaz', 'woda', 'pompowa']) ustawLicznik(w, t('wspolne.brak_danych'), true);
    });
  // Liczniki linii i farm morskich – z tych samych plików, które wczytuje mapa.
  fetch(`${import.meta.env.BASE_URL}data/linie-nn.geojson`)
    .then((odp) => (odp.ok ? odp.json() : null))
    .then((geo) => {
      if (!geo?.features) throw new Error('brak pliku');
      ustawLicznik('linie', t('licznik.linie', tn('liczba.odcinek', geo.features.length), formatDoby(STAN_OSM)));
    })
    .catch(() => ustawLicznik('linie', t('wspolne.brak_danych'), true));
  fetch(`${import.meta.env.BASE_URL}data/farmy-baltyk.geojson`)
    .then((odp) => (odp.ok ? odp.json() : null))
    .then((geo) => {
      if (!geo?.features) throw new Error('brak pliku');
      const m = podsumujMorskie(geo, FARMY_W_ROZRUCHU);
      ustawLicznik('morskie', licznikMorskich(m));
      const duplikaty = document.getElementById('morskie-duplikaty');
      if (duplikaty) duplikaty.textContent = m.duplikaty ? t('leg.morskie_duplikaty', tn('liczba.duplikat', m.duplikaty)) : '';
    })
    .catch(() => ustawLicznik('morskie', t('wspolne.brak_danych'), true));

  okienka.dodaj({ id: 'elektrownie', warstwy: ['elektrownie'], tresc: (obiekty) => {
    const p = obiekty[0].properties;
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
    linia(t(`elektrownia.${p.rodzaj}`));
    if (p.rodzaj === 'pompowa') linia(t('elektrownia.pompowa_opis'));
    const paliwa = (p.paliwa ?? '').split(';').filter(Boolean).map((x) => kategoriaGem('gem.paliwo.', x));
    if (p.rodzaj === 'wegiel' && paliwa.length) linia(t('elektrownia.rodzaj_wegla', paliwa.join(', ')));
    if (p.rodzaj === 'gaz' && paliwa.length) linia(t('elektrownia.paliwo', paliwa.join(', ')));
    if (p.rodzaj === 'woda' || p.rodzaj === 'pompowa') {
      const typy = (p.technologie ?? '').split(';').filter(Boolean).map((x) => kategoriaGem('gem.technologia.', x));
      if (typy.length) linia(t('elektrownia.typ', typy.join(', ')));
    }
    // Odmiana: 1 blok; 2–4, 22–24… bloki (ale 12–14 bloków); pozostałe bloków (EN: 1 unit, 2 units) – tn().
    linia(t('elektrownia.moc', liczba(p.moc), tn('liczba.blok', p.bloki)));
    linia(t('elektrownia.moc_zainstalowana'));
    linia(t(p.dokladnosc === 'exact' ? 'lokalizacja.dokladna' : 'lokalizacja.przyblizona'));
    el.append(linijkaZrodla('GEM', 'dane', formatMiesiaca(DANE_ELEKTROWNI[p.rodzaj])));
    return { el, lngLat: obiekty[0].geometry.coordinates };
  } });

  // Legenda: pola włączające i wyłączające warstwy (zwykłe pola wyboru – Tab, Spacja).
  const WARSTWY_LEGENDY = {
    linie: ['linie-nn-obwodka', 'linie-nn', 'linie-nn-klik'],
    morskie: ['farmy-pelne', 'farmy-puste', 'farmy-duplikaty'],
    ladowe: ['farmy-lad-dziala', 'farmy-lad-budowa', 'farmy-lad-budowa-srodek'],
    moce: ['moce-kola', 'moce-kola-obwodka', 'moce-podpis', 'moce'],
  };
  // Pola warstw: w legendzie i w zakładce „Skąd” Karty Polski. To samo data-warstwa = jeden stan
  // (zaznaczenie w jednym miejscu zaznacza w drugim). Bez lotu – tak jak w legendzie.
  for (const pole of document.querySelectorAll('input[type="checkbox"][data-warstwa]')) {
    pole.addEventListener('change', () => {
      const w = pole.dataset.warstwa;
      for (const blizniak of document.querySelectorAll(`input[type="checkbox"][data-warstwa="${w}"]`)) blizniak.checked = pole.checked;
      if (WARSTWY_LEGENDY[w]) {
        // getLayer: podpis „lokalizacja przybliżona” dochodzi później (czeka na czcionkę) – i sam przejmuje widoczność.
        for (const id of WARSTWY_LEGENDY[w]) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', pole.checked ? 'visible' : 'none');
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
    if (/^\d+[a-z]?$/i.test(faza)) return t('farmy.faza', faza);
    return `${faza.replace(/[()]/g, '').trim()}: `;
  };
  const statusLadowej = (status) => (tekstPl(`farmy.lad.${status}`) ? t(`farmy.lad.${status}`) : status);
  okienka.dodaj({ id: 'farmy-lad', warstwy: ['farmy-lad-dziala', 'farmy-lad-budowa'], tresc: (obiekty) => {
    const lokalizacja = obiekty[0].properties.gem_location_id;
    const fazy = obiekty.filter((f) => f.properties.gem_location_id === lokalizacja);
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
      const moc = typeof f.moc_mw === 'number' ? `${liczba(f.moc_mw)} MW` : t('farmy.moc_brak');
      const rok = f.rok_uruchomienia ? t('farmy.uruchomienie', f.rok_uruchomienia) : '';
      linia(`${opisFazy(f.faza)}${moc}, ${statusLadowej(f.status)}${rok}`);
    }
    linia(t(p.dokladnosc_lokalizacji === 'exact' ? 'lokalizacja.dokladna' : 'lokalizacja.przyblizona'));
    el.append(linijkaZrodla('GEM', 'dane', formatMiesiaca(DANE_WIATR_GEM))); // dane wiatrowe: Global Wind Power Tracker
    return { el, lngLat: obiekty[0].geometry.coordinates };
  } });

  // Morskie farmy wiatrowe na polskim Bałtyku (EMODnet, CC BY 4.0)
  // Pełne kropki (farmy z wykazu MKiŚ) pod spodem, puste na wierzchu z grubszą obwódką: farmy spoza wykazu
  // i – osobna warstwa – możliwe duplikaty innego wpisu EMODnet (od przybliżenia PROG_DUPLIKATOW).
  const NA_LISCIE = ['==', ['get', 'weryfikacja'], tekstPl('farmy.weryfikacja.na_liscie')];
  const PREFIKS_DUPLIKATU = tekstPl('farmy.weryfikacja.duplikat');
  const DUPLIKAT = ['==', ['slice', ['get', 'weryfikacja'], 0, PREFIKS_DUPLIKATU.length], PREFIKS_DUPLIKATU];
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
  const PUSTE_KOLKO = {
    'circle-opacity': 0,
    'circle-radius': PROMIEN_FARMY,
    'circle-stroke-color': KOLORY.wiatr,
    'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 2, 1, 5, 2.5, 9, 4],
  };
  map.addLayer({ id: 'farmy-puste', type: 'circle', source: 'farmy', filter: ['all', ['!', NA_LISCIE], ['!', DUPLIKAT]], paint: PUSTE_KOLKO });
  map.addLayer({ id: 'farmy-duplikaty', type: 'circle', source: 'farmy', minzoom: PROG_DUPLIKATOW, filter: DUPLIKAT, paint: PUSTE_KOLKO });

  okienka.dodaj({ id: 'farmy-morskie', warstwy: ['farmy-pelne', 'farmy-puste', 'farmy-duplikaty'], tresc: (obiekty) => {
    const p = obiekty[0].properties;
    const { nazwa, status, moc_mw, weryfikacja, weryfikacja_opis } = p;
    const u = UZUPELNIENIA_FARM[nazwa] ?? {};
    const el = document.createElement('div');
    const tytul = document.createElement('strong');
    tytul.textContent = nazwa;
    const linia = (tekst) => {
      const span = document.createElement('span');
      span.textContent = tekst;
      return span;
    };
    const moc = typeof moc_mw === 'number' ? `${liczba(moc_mw)} MW` : t('wspolne.brak_danych');
    const statusTekst = u.rozruch ? t('farmy.rozruch') : statusMorskiej(status);
    el.append(tytul, document.createElement('br'), linia(t('farmy.status', statusTekst)), document.createElement('br'), linia(u.moc ? u.moc(p) : t('farmy.moc', moc)));
    if (weryfikacja) el.append(document.createElement('br'), linia(t('farmy.weryfikacja', weryfikacjaFarmy(weryfikacja_opis ?? weryfikacja))));
    for (const dopisek of u.dopiski ?? []) el.append(document.createElement('br'), linia(dopisek()));
    el.append(linijkaZrodla('EMODnet', 'dane', formatDoby(DANE_EMODNET)));
    for (const z of ['mkis', ...(u.zrodla ?? [])]) el.append(linijkaZrodlaFarmy(z));
    return { el, lngLat: obiekty[0].geometry.coordinates };
  } });

  // Okienko linii 220/400 kV: nazwa z OSM, napięcie, źródło. Linie są cienkie – klikamy w szerszy, niewidoczny pas
  // (warstwa „linie-nn-klik”). Gdy w tym samym miejscu jest farma albo elektrownia, wygrywa jej okienko
  // (leży wyżej na mapie). Tylko po kliknięciu – linie są wszędzie, okienko migałoby przy każdym ruchu myszy.
  const KROPKI_I_ZNACZKI = ['elektrownie', 'farmy-lad-dziala', 'farmy-lad-budowa', 'farmy-pelne', 'farmy-puste', 'farmy-duplikaty', 'moce'];
  // Żeby było wiadomo, że linię można kliknąć: odcinek pod kursorem się podświetla, a po ok. 0,4 s bez ruchu
  // pojawia się podpowiedź (decyzja Ani 23.11.2026); w legendzie – dopisek o kliknięciu.
  okienka.dodaj({
    id: 'linie',
    warstwy: ['linie-nn-klik'],
    najechanie: false,
    podpowiedz: t('linie.podpowiedz'),
    podswietl: (id, wlacz) => map.setFeatureState({ source: 'linie-nn', id }, { podswietlona: wlacz }),
    tresc: (obiekty, e) => {
      const p = obiekty[0].properties;
      const el = document.createElement('div');
      const tytul = document.createElement('strong');
      tytul.textContent = p.nazwa && p.nazwa !== 'null' ? p.nazwa : t('linie.bez_nazwy');
      const napiecie = document.createElement('span');
      napiecie.textContent = t('linie.napiecie', p.napiecie);
      el.append(tytul, document.createElement('br'), napiecie, linijkaZrodla('OpenStreetMap', 'stan', formatDoby(STAN_OSM)));
      return { el, lngLat: e.lngLat };
    },
  });

  // Wolna moc dla odbiorców (PSE): na samym wierzchu, bo to najważniejsza warstwa dla pytania „gdzie się podłączyć” (src/moce.js).
  dodajWarstweMocy(map, { linijkaZrodla, ustawLicznik, okienka });

  // Kursor „rączka” nad wszystkim, co da się kliknąć.
  for (const id of ['linie-nn-klik', ...KROPKI_I_ZNACZKI]) {
    map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));
  }
});

// Produkcja z wiatru: plik wiatr.json powstaje przy budowaniu (scripts/pobierz-pse.mjs).
// Formaty dat (formatCzasu, formatDoby) – wg języka strony, z src/jezyk.js.

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

// Linie wykresu produkcji: pole w danych (mw – wiatr, pv – słońce), kolor i podpis przy końcu linii.
// Obie linie ciągłe – kreskowanie rezerwujemy dla danych wstępnych (decyzja Ani 25.11.2026).
const LINIA_WIATR = { pole: 'mw', kolor: KOLORY.wiatr, podpis: 'wykres.linia_wiatr' };
const LINIA_SLONCE = { pole: 'pv', kolor: KOLORY.slonce, podpis: 'wykres.linia_slonce' };
const LINIE_PRODUKCJI = [LINIA_WIATR, LINIA_SLONCE];

// Mały wykres liniowy produkcji (wiatr i słońce) z bieżącej doby – wspólna skala MW.
// seria: [{ okres: 'HH:MM - HH:MM', mw, pv }], kolejne kwadranse od 00:00.
// znacznik (opcjonalnie): numer kwadransu, na którym stoi kreska (odtwarzanie doby), etykieta: podpis kreski.
function rysujWykres(
  kontener,
  seria,
  { linie = LINIE_PRODUKCJI, opisKlucz = 'wykres.wiatr_slonce_opis', znacznik = null, etykieta = '', opisDoby = t('wykres.biezaca_doba') } = {},
) {
  const punkty = (seria ?? []).filter((p) => typeof p.okres === 'string');
  const zDanymi = linie.filter((l) => punkty.filter((p) => typeof p[l.pole] === 'number').length >= 2);
  if (punkty.length < 2 || zDanymi.length === 0) {
    kontener.replaceChildren();
    return;
  }

  // Z prawej miejsce na podpisy linii („wiatr”, „słońce”) – szerokość całego wykresu bez zmian (240 px).
  // Dwie linie: osobne maksima w pierwszym wierszu, godzina odtwarzania w drugim (nie nachodzą na siebie).
  const dwa = zDanymi.length > 1;
  const W = 240, H = dwa ? 82 : 72, GORA = dwa ? 24 : 14, DOL = H - 14, PODPISY = 40; // linie: od GORA do DOL, od 0 do W - PODPISY
  const SZER = W - PODPISY;
  const wartosci = zDanymi.flatMap((l) => punkty.map((p) => p[l.pole]).filter((v) => typeof v === 'number'));
  const maks = Math.max(...wartosci);
  const min = Math.min(0, ...wartosci);
  const x = (i) => (i / (punkty.length - 1)) * SZER;
  const y = (mw) => DOL - ((mw - min) / (maks - min || 1)) * (DOL - GORA);

  // overflow: visible – przy dwóch pięciocyfrowych maksimach podpis może być o kilka pikseli szerszy niż 240 px.
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', overflow: 'visible' });
  const opis = el('title', {});
  opis.textContent = t(opisKlucz, opisDoby);
  svg.append(opis, el('line', { x1: 0, y1: DOL, x2: SZER, y2: DOL, stroke: KOLORY.os, 'stroke-width': 1 }));

  // Podpisy przy końcu linii – rozsunięte, gdy końce wypadają blisko siebie (np. w nocy oba przy dole).
  const konce = [];
  for (const l of zDanymi) {
    const pkt = punkty.map((p, i) => [i, p[l.pole]]).filter(([, v]) => typeof v === 'number');
    svg.append(
      el('polyline', {
        points: pkt.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '),
        fill: 'none',
        stroke: l.kolor,
        'stroke-width': 1.5,
        'stroke-linejoin': 'round',
      }),
    );
    const [iK, vK] = pkt.at(-1);
    konce.push({ l, x: x(iK), y: y(vK) + 3 });
  }
  konce.sort((a, b) => a.y - b.y);
  for (let k = 1; k < konce.length; k++) konce[k].y = Math.max(konce[k].y, konce[k - 1].y + 10);
  const nadmiar = Math.max(0, konce.at(-1).y - (DOL + 3));
  for (const k of konce) {
    k.y = Math.max(GORA, k.y - nadmiar);
    svg.append(podpis(t(k.l.podpis), { x: k.x + 4, y: k.y.toFixed(1), fill: k.l.kolor }));
  }

  svg.append(
    podpis(
      dwa
        ? t('wykres.maks_linie', zDanymi.map((l) => `${t(l.podpis)} ${liczba(Math.round(Math.max(...punkty.map((p) => p[l.pole]).filter((v) => typeof v === 'number'))))} MW`).join(' · '))
        : t('wykres.maks', `${liczba(Math.round(maks))} MW`),
      { x: 0, y: 10 },
    ),
    podpis(punkty[0].okres.split(' - ')[0], { x: 0, y: H - 2 }),
    podpis(punkty.at(-1).okres.split(' - ')[1] ?? '', { x: SZER, y: H - 2, 'text-anchor': 'end' }),
  );
  if (znacznik !== null) {
    svg.append(
      el('line', { x1: x(znacznik), y1: GORA - 4, x2: x(znacznik), y2: DOL, stroke: KOLORY.teraz, 'stroke-width': 1.5 }),
      podpis(etykieta, { x: W, y: dwa ? 21 : 10, 'text-anchor': 'end', fill: KOLORY.teraz }),
    );
  }
  kontener.replaceChildren(svg);
}

// Cena prądu RCE: plik rce.json powstaje przy budowaniu (scripts/pobierz-pse.mjs), zawiera doby wg czasu polskiego.
// Bieżącą dobę i kwadrans wybieramy wg czasu Europe/Warsaw (koniec_utc to chwila absolutna, więc strefa
// komputera nie ma znaczenia). Nigdy nie pokazujemy ceny z innej doby jako aktualnej.
const MS_KWADRANS = 15 * 60_000;
const formatCeny = (c) => liczba(c, 2);
const ZL_MWH = t('jednostka.zl_mwh');
const dzisPL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

function rysujWykresCeny(kontener, seria, teraz, { etykieta = t('wykres.teraz'), opisDoby = t('wykres.biezaca_doba') } = {}) {
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
  opis.textContent = t('wykres.cena_opis', opisDoby);
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
    podpis(t('wykres.maks', `${formatCeny(maks)} ${ZL_MWH}`), { x: 0, y: 10 }),
    podpis(t('wykres.min', `${formatCeny(min)} ${ZL_MWH}`), { x: 0, y: 21 }),
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
    tekst.textContent = t(rce ? 'mapa.cena_brak_dzis' : 'mapa.cena_brak_pse');
    tekst.classList.add('brak-danych');
    wykres.replaceChildren();
    return;
  }
  tekst.classList.remove('brak-danych');
  // Cena „teraz” (liczba) jest w Karcie Polski – tu tylko podpis wykresu, żeby nie pokazywać jej dwa razy
  // (decyzja Ani 21.11.2026). Odtwarzanie doby nadal wpisuje tu cenę odtwarzanego kwadransu.
  tekst.textContent = t('mapa.cena_biezaca');
  if (seria.length >= 2) rysujWykresCeny(wykres, seria, teraz);
}

let daneRce = null;
const cenaGotowa = fetch(`${import.meta.env.BASE_URL}data/rce.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .then((rce) => {
    daneRce = rce;
    dataStopki('rce-pobrano', rce?.czas_pobrania && formatCzasu(rce.czas_pobrania));
    pokazCene(rce);
    setInterval(() => pokazCene(rce), 60_000); // co minutę: nowy kwadrans, a po północy – nowa doba
  })
  .catch(() => {
    daneRce = null;
    pokazCene(null); // plik się nie wczytał – „brak danych PSE”
    dataStopki('rce-pobrano', null);
  });

// Karta Polski (panel w lewym dolnym rogu) – cena z tego samego rce.json, bez drugiego pobrania.
// Telefon: kafelki dostały liczby (mogły urosnąć) – kadr Polski jeszcze raz, jeśli widz nie ruszał mapy i lot już był (Etap C2).
uruchomKarte(cenaGotowa.then(() => daneRce)).then(() => {
  if (TELEFON.matches && !uzytkownikRuszylMape && lotRuszyl && map.loaded()) ustawKadr();
});

// Legenda „Co oznaczają znaczki”: nagłówek stoi, przewija się tylko treść (.legenda__tresc), pod nią
// „↓ więcej poniżej” (src/wiecej-ponizej.js). Wysokość treści = miejsce od góry legendy do odstępu od dołu
// (--legenda-od-dolu, miejsce na atrybucję MapLibre) minus nagłówek, odstępy legendy i przycisk.
function pilnujLegendy() {
  const legenda = document.querySelector('.legenda');
  const tresc = legenda?.querySelector('.legenda__tresc');
  if (!tresc) return;
  const main = legenda.parentElement;
  const naglowek = legenda.querySelector('summary');
  const dopasuj = () => {
    const styl = getComputedStyle(legenda);
    const odDolu = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--legenda-od-dolu')) || 0;
    const odstepy = parseFloat(styl.paddingTop) + parseFloat(styl.paddingBottom) + parseFloat(styl.borderTopWidth) + parseFloat(styl.borderBottomWidth);
    const marginesTresci = parseFloat(getComputedStyle(tresc).marginTop) || 0;
    // Telefon: panel od dołu ma najwyżej 70% wysokości ekranu (src/style.css) – treść przewija się w nim.
    const miejsce = TELEFON.matches
      ? Math.round(window.innerHeight * 0.7) - odstepy - naglowek.offsetHeight - marginesTresci - wysokoscPrzycisku()
      : main.clientHeight - legenda.offsetTop - odDolu - odstepy - naglowek.offsetHeight - marginesTresci - wysokoscPrzycisku();
    legenda.style.setProperty('--legenda-tresc-max', `${Math.max(60, miejsce)}px`);
  };
  const obserwator = new ResizeObserver(dopasuj);
  obserwator.observe(main);
  obserwator.observe(naglowek);
  dopasuj();
  wiecejPonizej(tresc);

  // Tryb spokojny (wariant 3B): krótko – kolor i nazwa warstwy; „więcej ▸” dokłada liczniki, opisy, uwagi i skalę.
  const przycisk = document.getElementById('legenda-wiecej');
  if (!przycisk) return;
  const ustaw = (pelna) => {
    legenda.classList.toggle('legenda--pelna', pelna);
    przycisk.setAttribute('aria-expanded', String(pelna));
    przycisk.textContent = t(pelna ? 'leg.mniej' : 'leg.wiecej');
  };
  ustaw(czytajRozwiniecie('legenda-wiecej'));
  przycisk.addEventListener('click', () => {
    const pelna = !legenda.classList.contains('legenda--pelna');
    ustaw(pelna);
    zapiszRozwiniecie('legenda-wiecej', pelna);
  });
}
pilnujLegendy();

// Stopka „Źródła i licencje” – rozwinięta treść przewija się (max 40vh): ten sam sygnał.
const trescStopki = document.querySelector('.stopka__tresc');
if (trescStopki) wiecejPonizej(trescStopki);

// Słońce w okienku: liczba z tego samego kwadransu co wiatr. 0 MW po zmroku – z krótkim dopiskiem (to pora dnia,
// a nie awaria). Noc liczona dla środka Polski (src/slonce.js); 0 MW w dzień – bez dopisku.
const formatMW = (mw) => `${liczba(Math.round(mw))} MW`;
function pokazSlonce(pv, koniecUtc) {
  const wartosc = document.getElementById('slonce-teraz');
  const jest = typeof pv === 'number';
  wartosc.classList.toggle('brak-danych', !jest);
  wartosc.textContent = jest ? formatMW(pv) : t('wspolne.brak_danych_pse');
  const noc = jest && Math.round(pv) === 0 && poZmroku(koniecUtc, { szer: SRODEK_POLSKI.lat, dl: SRODEK_POLSKI.lng });
  document.getElementById('slonce-noc').hidden = !noc;
}
// Koniec kwadransu PSE („RRRR-MM-DD HH:MM:SS”, UTC) → ms od 1970.
const msUtc = (tekst) => (tekst ? Date.parse(`${tekst.slice(0, 19).replace(' ', 'T')}Z`) : NaN);

// Widok „teraz” wiatru i słońca w okienku (wywoływany po wczytaniu i po zakończeniu odtwarzania doby).
let daneWiatr = null;
function pokazWiatr(d) {
  document.getElementById('wiatr-etykieta').textContent = t('mapa.wiatr_etykieta');
  document.getElementById('slonce-etykieta').textContent = t('mapa.slonce_etykieta');
  const ogr = d?.ograniczenie;
  const ograniczenie = document.getElementById('wiatr-ograniczenie');
  ograniczenie.hidden = false;
  if (ogr && typeof ogr.mwh === 'number' && ogr.doba) {
    ograniczenie.textContent = t('mapa.ograniczenie', formatDoby(ogr.doba), liczba(ogr.mwh));
  } else {
    ograniczenie.textContent = t('mapa.ograniczenie_brak');
  }
  const wartosc = document.getElementById('wiatr-teraz');
  const skrot = document.getElementById('pse-skrot');
  wartosc.classList.toggle('brak-danych', typeof d?.wartosc !== 'number');
  skrot.classList.toggle('brak-danych', typeof d?.wartosc !== 'number');
  if (typeof d?.wartosc !== 'number') {
    skrot.textContent = t('mapa.pse_skrot_brak');
    wartosc.textContent = t('wspolne.brak_danych_pse');
    document.getElementById('wiatr-stan').textContent = '';
    document.getElementById('wiatr-wykres').replaceChildren();
    pokazSlonce(null);
    return;
  }
  document.getElementById('wiatr-teraz').textContent = `${liczba(Math.round(d.wartosc))} ${d.jednostka}`;
  document.getElementById('wiatr-stan').textContent = t('mapa.wiatr_stan', formatDoby(d.doba), d.okres);
  pokazSlonce(d.slonce, msUtc(d.czas_pomiaru_utc));
  // Zwinięta linijka: wiatr i słońce z jednego kwadransu (data – gdy pomiar nie jest z dziś).
  const okres = String(d.okres ?? '').replace(' - ', '–');
  const kiedy = d.doba === dzisPL() ? okres : `${formatDoby(d.doba)}, ${okres}`;
  const pv = typeof d.slonce === 'number' ? formatMW(d.slonce) : t('mapa.slonce_brak');
  // Trzy części bez łamania w środku – „stan na DATA, GG:MM–GG:MM · PSE” przechodzi do drugiego wiersza tylko w całości.
  const czesc = (tekst) => Object.assign(document.createElement('span'), { className: 'bez-lamania', textContent: tekst });
  skrot.replaceChildren(
    czesc(t('mapa.pse_skrot_wiatr', `${liczba(Math.round(d.wartosc))} ${d.jednostka}`)),
    ' · ',
    czesc(t('mapa.pse_skrot_slonce', pv)),
    ' · ',
    czesc(t('mapa.pse_skrot_stan', kiedy)),
  );
  rysujWykres(document.getElementById('wiatr-wykres'), d.seria);
}

const wiatrGotowy = fetch(`${import.meta.env.BASE_URL}data/wiatr.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .then((d) => {
    if (!d) {
      pokazWiatr(null);
      dataStopki('wiatr-pobrano', null);
      return;
    }
    daneWiatr = d;
    dataStopki('wiatr-pobrano', d.czas_pobrania && formatCzasu(d.czas_pobrania));
    pokazWiatr(d);
  })
  .catch(() => {
    pokazWiatr(null); // plik się nie wczytał – „brak danych PSE”
    dataStopki('wiatr-pobrano', null);
  });

// Linijka „ŹRÓDŁO PSE · pobrano: …” na dole okienka – po wczytaniu (albo nie) obu plików PSE.
Promise.allSettled([wiatrGotowy, cenaGotowa]).then(() => {
  const tekst = document.getElementById('pse-zrodlo-tekst');
  const pobrano = daneWiatr?.czas_pobrania ?? daneRce?.czas_pobrania;
  const braki = [!daneWiatr && t('mapa.brak_wiatr'), !daneRce && t('mapa.brak_cena')].filter(Boolean);
  if (!pobrano) {
    tekst.textContent = t('wspolne.brak_danych_pse');
    tekst.classList.add('brak-danych');
    return;
  }
  tekst.textContent = t('mapa.pse_pobrano', formatCzasu(pobrano)) + (braki.length ? t('mapa.pse_braki', braki.join(', ')) : '');
  tekst.classList.toggle('brak-danych', braki.length > 0);
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
  const opisDoby = t('wykres.w_dobie', formatDoby(daneDoby.doba));
  document.getElementById('odtw-zegar').textContent = godzina;
  document.getElementById('wiatr-teraz').textContent = `${liczba(Math.round(p.mw))} MW`;
  pokazSlonce(p.pv, Date.parse(p.koniec_utc));
  document.getElementById('wiatr-stan').textContent = t('odtw.kwadrans', p.okres);
  rysujWykres(document.getElementById('wiatr-wykres'), k, { znacznik: i, etykieta: godzina, opisDoby });
  document.getElementById('rce-teraz').textContent = t('mapa.cena_kwadrans', formatCeny(p.cena), p.okres);
  rysujWykresCeny(document.getElementById('rce-wykres'), k, Date.parse(p.koniec_utc) - MS_KWADRANS / 2, { etykieta: godzina, opisDoby });
}

function klatka(teraz) {
  const uplyw = odtwarzanie.uplyw + (teraz - odtwarzanie.start);
  let i = Math.floor(uplyw / MS_NA_KWADRANS);
  if (BEZ_RUCHU) i -= i % 4; // raz na godzinę
  if (i >= daneDoby.kwadranse.length) {
    wrocDoTeraz(t('odtw.ogl_koniec'));
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
    document.getElementById('odtw-data').textContent = t('odtw.data', formatDoby(daneDoby.doba));
    document.getElementById('wiatr-etykieta').textContent = t('odtw.wiatr_etykieta');
    document.getElementById('slonce-etykieta').textContent = t('odtw.slonce_etykieta');
    document.getElementById('wiatr-ograniczenie').hidden = true;
    przyciskTeraz.hidden = false;
    przyciskStart.textContent = t('odtw.pauza');
    ogloszenie(t('odtw.ogl_start', formatDoby(daneDoby.doba)));
    odtwarzanie.raf = requestAnimationFrame(klatka);
  } else if (odtwarzanie.raf) {
    // Pauza
    cancelAnimationFrame(odtwarzanie.raf);
    odtwarzanie.uplyw += performance.now() - odtwarzanie.start;
    odtwarzanie.raf = 0;
    przyciskStart.textContent = t('odtw.wznow');
    ogloszenie(t('odtw.ogl_pauza', document.getElementById('odtw-zegar').textContent));
  } else {
    // Wznowienie
    odtwarzanie.start = performance.now();
    przyciskStart.textContent = t('odtw.pauza');
    ogloszenie(t('odtw.ogl_wznow'));
    odtwarzanie.raf = requestAnimationFrame(klatka);
  }
}

function wrocDoTeraz(komunikat = t('odtw.ogl_teraz')) {
  if (odtwarzanie?.raf) cancelAnimationFrame(odtwarzanie.raf);
  odtwarzanie = null;
  document.getElementById('odtw-naglowek').hidden = true;
  przyciskTeraz.hidden = true;
  przyciskStart.textContent = t('odtw.start');
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
// Zwinięcie okienka w trakcie odtwarzania doby kończy je i wraca do „teraz” (decyzja Ani 23.11.2026).
okienko.addEventListener('toggle', () => {
  if (!okienko.open && odtwarzanie) wrocDoTeraz();
});

const dobaGotowa = fetch(`${import.meta.env.BASE_URL}data/doba.json`, { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : null))
  .catch(() => null)
  .then((d) => {
    const pelna = d?.doba && Array.isArray(d.kwadranse) && d.kwadranse.length >= 2;
    if (!pelna) {
      document.getElementById('odtw-stan').textContent = t('odtw.brak');
      dataStopki('odtw-zrodlo-doba', null);
      return;
    }
    daneDoby = d;
    dataStopki('odtw-zrodlo-doba', formatDoby(d.doba));
    przyciskStart.hidden = false;
  });

// Rozwinięte okienko PSE na komputerze: kończy się 12 px nad zwiniętą linijką Karty Polski (Karta stoi u dołu,
// nad „← OSIRIS”); przy niskim oknie przewija się (src/style.css, --pse-max). Bez „↓ więcej poniżej” – wyjątek
// z CLAUDE.md. Klasa .wskaznik--przewijane (stały nagłówek z tłem) tylko wtedy, gdy treść naprawdę się nie mieści.
function pilnujWysokosciPSE() {
  const okno = document.querySelector('.wskaznik');
  const karta = document.getElementById('karta');
  if (!okno) return;
  const main = okno.parentElement;
  const dopasuj = () => {
    if (karta) {
      const linijkaKarty = karta.querySelector('.karta__naglowek').offsetHeight + (karta.offsetHeight - karta.clientHeight);
      const dolKarty = parseFloat(getComputedStyle(karta).bottom) || 0;
      const max = main.clientHeight - dolKarty - linijkaKarty - 12 - okno.offsetTop;
      okno.style.setProperty('--pse-max', `${Math.max(160, Math.round(max))}px`);
    }
    okno.classList.toggle('wskaznik--przewijane', okno.open && okno.scrollHeight > okno.clientHeight + 1);
  };
  const obserwator = new ResizeObserver(dopasuj);
  obserwator.observe(main);
  obserwator.observe(okno);
  for (const dziecko of okno.children) obserwator.observe(dziecko); // treść rośnie (dane, odtwarzanie doby)
  if (karta) obserwator.observe(karta.querySelector('.karta__naglowek'));
  okno.addEventListener('toggle', dopasuj);
  dopasuj();
}
pilnujWysokosciPSE();

// Obrót telefonu albo zmiana wielkości okna (wariant A, decyzja Ani 25.11.2026): Polska wraca na środek tak jak
// na starcie – tylko gdy widz jeszcze nie ruszał mapy i dopiero po locie wprowadzającym (lot sam liczy kadr).
// Bez animacji (jeden lot – zasada ruchu). Przejście na telefon (≤ 640 px) zwija okna – na telefonie start jest zwinięty.
let czekaNaKadr = 0;
function przeliczKadr() {
  if (uzytkownikRuszylMape || !lotRuszyl) return;
  if (map.isMoving()) {
    map.once('moveend', przeliczKadr);
    return;
  }
  ustawKadr();
}
window.addEventListener('resize', () => {
  clearTimeout(czekaNaKadr);
  czekaNaKadr = setTimeout(przeliczKadr, 200);
});
TELEFON.addEventListener('change', (e) => {
  if (e.matches) for (const okno of OKNA_TELEFONU) if (okno?.open) okno.open = false;
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
