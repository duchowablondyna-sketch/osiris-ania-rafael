// Adres „/mapa” bez ukośnika: serwer może pokazać tu stronę tytułową (zamiast błędu) – przechodzimy od razu na mapę.
if (location.pathname === '/mapa') location.replace(`/mapa/${location.search}${location.hash}`);

import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { formatMocy } from './liczniki.js';
import { t, LOCALE, formatCzasu, formatKrotki, formatDoby } from './jezyk.js';
import { wiecejPonizej } from './wiecej-ponizej.js';
import './czcionki.css';
import './style.css';
import './tytulowa.css';

maplibregl.setWorkerUrl(workerUrl);

const BEZ_RUCHU = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── „OPIS ▾” w prawym górnym rogu: rozwija panel z pełnym opisem (aria-expanded) ──
const opisPrzycisk = document.getElementById('opis-przycisk');
const opisPanel = document.getElementById('opis-panel');
opisPrzycisk.addEventListener('click', () => {
  const otwarty = opisPrzycisk.getAttribute('aria-expanded') === 'true';
  opisPrzycisk.setAttribute('aria-expanded', String(!otwarty));
  opisPrzycisk.querySelector('span').textContent = otwarty ? '▾' : '▴';
  opisPanel.hidden = otwarty;
});

// ── Zegar „CZAS WARSZAWA” / „WARSAW TIME” (strefa Europe/Warsaw, niezależnie od strefy komputera) ──
const zegar = document.getElementById('zegar');
const formatZegara = new Intl.DateTimeFormat(LOCALE, {
  timeZone: 'Europe/Warsaw',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
const tyknij = () => (zegar.textContent = formatZegara.format(new Date()));
tyknij();
setInterval(tyknij, 1000);

// ── Liczby z danych (liczone przy budowaniu – scripts/podsumowanie.mjs); formaty dat i liczb wg języka strony ──
const moc = (mw) => formatMocy(mw, LOCALE);
const BRAK = t('wspolne.brak_danych');
function wpisz(id, tekst, brak = false) {
  const el = document.getElementById(id);
  el.textContent = tekst;
  el.classList.toggle('brak-danych', brak);
}
fetch('/data/podsumowanie.json', { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : Promise.reject(new Error('brak pliku'))))
  .then((d) => {
    if (d.wegiel) wpisz('liczba-wegiel', `${d.wegiel.liczba.toLocaleString(LOCALE)} · ${moc(d.wegiel.mocMw)}`);
    else wpisz('liczba-wegiel', BRAK, true);
    if (d.ladowe) wpisz('liczba-ladowe', `${d.ladowe.farmy.toLocaleString(LOCALE)} · ${moc(d.ladowe.mocMw)}`);
    else wpisz('liczba-ladowe', BRAK, true);
    if (d.morskie) wpisz('liczba-baltyk', d.morskie.projekty.toLocaleString(LOCALE));
    else wpisz('liczba-baltyk', BRAK, true);
    if (d.pse?.pobrano) wpisz('liczba-pse', t('tytulowa.pse_pobranie', formatKrotki(d.pse.pobrano)));
    else wpisz('liczba-pse', t('tytulowa.brak_danych_pse'), true);
    // Stopka „Źródła i licencje” – te same pola co na mapie.
    if (d.pse?.wiatrPobrano) document.getElementById('wiatr-pobrano').textContent = formatCzasu(d.pse.wiatrPobrano);
    if (d.pse?.rcePobrano) document.getElementById('rce-pobrano').textContent = formatCzasu(d.pse.rcePobrano);
    if (d.pse?.kartaPobrano) document.getElementById('karta-pobrano').textContent = formatCzasu(d.pse.kartaPobrano);
    if (d.pse?.dobaOdtworzenia) {
      document.getElementById('odtw-zrodlo-doba').textContent = formatDoby(d.pse.dobaOdtworzenia);
    }
  })
  .catch(() => {
    for (const id of ['liczba-wegiel', 'liczba-ladowe', 'liczba-baltyk']) wpisz(id, BRAK, true);
    wpisz('liczba-pse', t('tytulowa.brak_danych_pse'), true);
  });
// ── Przycisk „ŹRÓDŁA I LICENCJE”: przewija do stopki i ją rozwija ──
function otworzZrodla() {
  const zrodla = document.getElementById('zrodla');
  if (!zrodla) return;
  zrodla.open = true;
  zrodla.scrollIntoView({ behavior: BEZ_RUCHU ? 'auto' : 'smooth', block: 'start' });
}
document.getElementById('przycisk-zrodla').addEventListener('click', (e) => {
  e.preventDefault();
  history.replaceState(null, '', '#zrodla');
  otworzZrodla();
});
if (location.hash === '#zrodla') otworzZrodla();

// ── Globus: nocne zdjęcie NASA (Black Marble 2016), Polska jako złoty punkt, wolny obrót ──
// Tylko do oglądania (bez przeciągania i przybliżania – nie łapie przewijania strony).
// Kafelki z NASZEJ kopii (public/kafelki/black-marble-2016, przybliżenia 0–3, bajt w bajt z NASA GIBS – skrypt
// scripts/pobierz-kafelki-globusa.mjs, sumy SHA-256 obok kafelków, opis w ZRODLA.md). Serwer NASA zabrania
// zapamiętywania kafelków i odpowiada wolno, więc przy każdym powrocie kula była „urwana” (diagnoza 21.11.2026).
// Przeglądarka widza nie łączy się już tu z NASA. Mapa /mapa/ używa tej samej kopii jako spodu tła nocnego,
// a z NASA pobiera kafelki dopiero od przybliżenia 4.
const KAFELKI_GLOBUSA = `${location.origin}/kafelki/black-marble-2016/{z}/{y}/{x}.png`;
const MAKS_PRZYBLIZENIE_KOPII = 3; // większe przybliżenie = powiększony kafelek z poziomu 3 (bez sięgania do NASA)
const POLSKA = [19.4, 52.1];
const kontener = document.getElementById('globus');
// Promień kuli w pikselach przy przybliżeniu z to ok. 512 · 2^z / (2π): kula ma 80% połowy wysokości okna
// (poświata w tytulowa.css liczy na tę samą proporcję).
// MapLibre powiększa kulę o 1/cos(szerokości geograficznej środka widoku) – stąd mnożnik cos(…).
// Kula nisko jak horyzont: środek widoku 60° na południe od Polski – Polska (52°N) wypada przy górnej krawędzi kuli,
// nad rzędem liczb.
const SZEROKOSC_SRODKA = POLSKA[1] - 60;
const zoomKuli = () =>
  Math.log2((((kontener.clientHeight * 0.8) / 2) * Math.cos((SZEROKOSC_SRODKA * Math.PI) / 180)) / (512 / (2 * Math.PI)));

const globus = new maplibregl.Map({
  container: 'globus',
  interactive: false,
  attributionControl: false,
  center: [POLSKA[0], SZEROKOSC_SRODKA],
  zoom: zoomKuli(),
  style: {
    version: 8,
    projection: { type: 'globe' },
    sky: { 'atmosphere-blend': 1 },
    sources: {
      noc: {
        type: 'raster',
        tiles: [KAFELKI_GLOBUSA],
        tileSize: 256,
        maxzoom: MAKS_PRZYBLIZENIE_KOPII,
      },
      polska: { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: POLSKA }, properties: {} } },
    },
    // Bez warstwy tła: poza kulą płótno jest przezroczyste, więc widać turkusową poświatę z CSS (tytulowa.css).
    layers: [
      { id: 'noc', type: 'raster', source: 'noc', paint: { 'raster-saturation': -0.3 } },
      { id: 'polska-blask', type: 'circle', source: 'polska', paint: { 'circle-radius': 18, 'circle-color': '#F2C14E', 'circle-opacity': 0.35, 'circle-blur': 1 } },
      { id: 'polska', type: 'circle', source: 'polska', paint: { 'circle-radius': 6.5, 'circle-color': '#F2C14E', 'circle-stroke-color': '#05070D', 'circle-stroke-width': 1.5 } },
    ],
  },
});
// Podpis NASA – zwykły napis w dolnym pasie strony (.bohater__nasa), stale widoczny.
window.addEventListener('resize', () => globus.setZoom(zoomKuli()));

// Obrót: 1 obrót na minutę (wyraźnie widoczny). Zatrzymany, gdy karta jest ukryta albo globus poza ekranem; przy
// prefers-reduced-motion – brak obrotu, Polska na środku.
const STOPNIE_NA_MS = 360 / 60_000;
let widoczny = true;
let ostatniaKlatka = null;
let dlugosc = POLSKA[0];
function klatka(t) {
  if (ostatniaKlatka !== null && widoczny && !document.hidden) {
    dlugosc = ((dlugosc - (t - ostatniaKlatka) * STOPNIE_NA_MS + 540) % 360) - 180;
    globus.jumpTo({ center: [dlugosc, SZEROKOSC_SRODKA] });
  }
  ostatniaKlatka = t;
  requestAnimationFrame(klatka);
}
if (!BEZ_RUCHU) new IntersectionObserver(([wpis]) => (widoczny = wpis.isIntersecting)).observe(kontener);

// Przejęcie od plakatu (tytulowa.css, .globus-plakat): od pierwszej klatki strony widać nieruchomy obraz tej samej kuli.
// Gdy MapLibre zgłosi „load” (pierwsza pełna klatka: wszystkie kafelki widoku narysowane), prawdziwa kula pojawia się
// nad plakatem w 0,3 s – w tej samej pozycji, więc bez przeskoku – potem plakat znika i dopiero wtedy rusza obrót.
// Przy „ogranicz ruch” – bez przejścia i bez obrotu. Gdyby „load” nie przyszło, zostaje plakat (strona nie jest bez Ziemi).
const PRZEJECIE_MS = BEZ_RUCHU ? 0 : 300;
const plakat = document.querySelector('.globus-plakat');
globus.once('load', () => {
  kontener.classList.add('globus--gotowy');
  setTimeout(() => {
    plakat?.classList.add('globus-plakat--ukryty');
    if (!BEZ_RUCHU) requestAnimationFrame(klatka);
  }, PRZEJECIE_MS);
});

// Stopka „Źródła i licencje” – rozwinięta treść przewija się (max 40vh): zanikanie u dołu i „↓ więcej poniżej”
// (ten sam kod co na mapie: src/wiecej-ponizej.js).
const trescStopki = document.querySelector('.stopka__tresc');
if (trescStopki) wiecejPonizej(trescStopki);
