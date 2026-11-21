// Adres „/mapa” bez ukośnika: serwer może pokazać tu stronę tytułową (zamiast błędu) – przechodzimy od razu na mapę.
if (location.pathname === '/mapa') location.replace(`/mapa/${location.search}${location.hash}`);

import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { formatMocy } from './liczniki.js';
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

// ── Zegar „CZAS WARSZAWA” (strefa Europe/Warsaw, niezależnie od strefy komputera) ──
const zegar = document.getElementById('zegar');
const formatZegara = new Intl.DateTimeFormat('pl-PL', {
  timeZone: 'Europe/Warsaw',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
const tyknij = () => (zegar.textContent = formatZegara.format(new Date()));
tyknij();
setInterval(tyknij, 1000);

// ── Liczby z danych (liczone przy budowaniu – scripts/podsumowanie.mjs) ──
const formatCzasu = (iso) =>
  new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'short', timeStyle: 'short' });
const formatKrotki = (iso) =>
  new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
function wpisz(id, tekst, brak = false) {
  const el = document.getElementById(id);
  el.textContent = tekst;
  el.classList.toggle('brak-danych', brak);
}
fetch('/data/podsumowanie.json', { cache: 'no-store' })
  .then((odp) => (odp.ok ? odp.json() : Promise.reject(new Error('brak pliku'))))
  .then((d) => {
    if (d.wegiel) wpisz('liczba-wegiel', `${d.wegiel.liczba} · ${formatMocy(d.wegiel.mocMw)}`);
    else wpisz('liczba-wegiel', 'brak danych', true);
    if (d.ladowe) wpisz('liczba-ladowe', `${d.ladowe.farmy} · ${formatMocy(d.ladowe.mocMw)}`);
    else wpisz('liczba-ladowe', 'brak danych', true);
    if (d.morskie) wpisz('liczba-baltyk', String(d.morskie.projekty));
    else wpisz('liczba-baltyk', 'brak danych', true);
    if (d.pse?.pobrano) wpisz('liczba-pse', `ostatnie pobranie: ${formatKrotki(d.pse.pobrano)}`);
    else wpisz('liczba-pse', 'brak danych PSE', true);
    // Stopka „Źródła i licencje” – te same pola co na mapie.
    if (d.pse?.wiatrPobrano) document.getElementById('wiatr-pobrano').textContent = formatCzasu(d.pse.wiatrPobrano);
    if (d.pse?.rcePobrano) document.getElementById('rce-pobrano').textContent = formatCzasu(d.pse.rcePobrano);
    if (d.pse?.kartaPobrano) document.getElementById('karta-pobrano').textContent = formatCzasu(d.pse.kartaPobrano);
    if (d.pse?.dobaOdtworzenia) {
      document.getElementById('odtw-zrodlo-doba').textContent = d.pse.dobaOdtworzenia.split('-').reverse().join('.');
    }
  })
  .catch(() => {
    for (const id of ['liczba-wegiel', 'liczba-ladowe', 'liczba-baltyk']) wpisz(id, 'brak danych', true);
    wpisz('liczba-pse', 'brak danych PSE', true);
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

// ── Globus: nocne zdjęcie NASA (ten sam adres co na mapie), Polska jako złoty punkt, wolny obrót ──
// Tylko do oglądania (bez przeciągania i przybliżania – nie łapie przewijania strony).
const GIBS_BLACK_MARBLE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png';
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
        tiles: [GIBS_BLACK_MARBLE],
        tileSize: 256,
        maxzoom: 8,
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
if (!BEZ_RUCHU) {
  globus.once('load', () => requestAnimationFrame(klatka));
  new IntersectionObserver(([wpis]) => (widoczny = wpis.isIntersecting)).observe(kontener);
}
