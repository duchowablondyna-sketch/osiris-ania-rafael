// Karta Polski: pobiera z API PSE miks paliw (his-gen-pal-sire) i wiatr/PV/saldo (his-wlk-cal)
// za wczoraj i dziś (doby wg czasu polskiego), robi sprawdzian i zapisuje public/data/karta.json.
// Uruchamiany automatycznie przed `npm run build`. Budowanie idzie dalej także przy błędzie.
//
// Gdy sprawdzian nie przejdzie albo PSE nie odpowie: bierzemy poprzedni karta.json z opublikowanej strony
// (tylko z energysourcemap.com, bez przekierowań) i dopisujemy plakietkę z powodem.
// Gdy i to się nie uda: zapisujemy brak danych.
import { readFile, writeFile } from 'node:fs/promises';
import { zbudujKarte, wygladaJakKarta, BladSprawdzianu, WERSJA } from './licz.mjs';

const PLIK = 'public/data/karta.json';
const MOC = 'scripts/karta/moc-zainstalowana-pse-2025.json';
const POPRZEDNI = 'https://energysourcemap.com/data/karta.json';
const API = 'https://api.raporty.pse.pl/api';
const MAKS_STRON = 10;
const czasPobrania = new Date().toISOString();

const dobaPL = (przesuniecieDni) =>
  new Date(Date.now() + przesuniecieDni * 86400_000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

async function pobierzJson(url) {
  const odp = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!odp.ok) throw new Error(`HTTP ${odp.status} (${new URL(url).pathname})`);
  return odp.json();
}

// Wszystkie rekordy raportu dla podanych dób (z kolejnymi stronami wyników, jeśli są).
async function pobierzRaport(raport, doby, naStrone) {
  const rekordy = [];
  for (const doba of doby) {
    let url = `${API}/${raport}?$filter=${encodeURIComponent(`business_date eq '${doba}'`)}&$first=${naStrone}`;
    for (let i = 0; url && i < MAKS_STRON; i++) {
      const json = await pobierzJson(url);
      rekordy.push(...(json.value ?? []).filter((r) => r.business_date === doba));
      url = json.nextLink ?? null;
    }
  }
  return rekordy;
}

async function poprzedniaKarta() {
  // redirect: 'error' – nie idziemy za przekierowaniem na inny adres.
  const odp = await fetch(POPRZEDNI, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
  if (!odp.ok) throw new Error(`HTTP ${odp.status}`);
  // Cloudflare Pages na brakujący plik odpowiada stroną HTML (kod 200), a nie błędem 404.
  if (!(odp.headers.get('content-type') ?? '').includes('json')) throw new Error('na stronie nie ma jeszcze pliku karta.json');
  const karta = await odp.json();
  if (!wygladaJakKarta(karta)) throw new Error('plik ze strony nie ma oczekiwanego układu');
  return karta;
}

let wynik;
try {
  const doby = [dobaPL(-1), dobaPL(0)];
  const miks = await pobierzRaport('his-gen-pal-sire', doby, 2000);
  const wlk = await pobierzRaport('his-wlk-cal', doby, 200);
  wynik = zbudujKarte(miks, wlk, czasPobrania);
  console.log(
    `Karta: ${wynik.kwadrans.doba} ${wynik.kwadrans.okres} (PSE opublikowało ${wynik.kwadrans.publikacja}) · ` +
      `węgiel ${(wynik.wegiel_udzial * 100).toFixed(1)}% · OZE ${(wynik.oze_udzial * 100).toFixed(1)}% · ` +
      `CO2 ok. ${wynik.co2.g_kwh_ok} g/kWh (${wynik.co2.g_kwh}) · saldo ${wynik.wymiana.saldo_mw} MW (${wynik.wymiana.kierunek}) · ` +
      `sprawdzian OK: ${wynik.sprawdzian.porownane_kwadranse} kwadransów, maks. różnica ${wynik.sprawdzian.maks_roznica_mw} MW`,
  );
} catch (e) {
  const powod = e instanceof BladSprawdzianu ? 'nowe dane nie przeszły sprawdzianu' : 'nie udało się pobrać nowych danych PSE';
  const szczegoly = String(e.message ?? e);
  console.warn('');
  console.warn('!!! KARTA POLSKI: ' + powod.toUpperCase());
  console.warn('!!! ' + szczegoly);
  try {
    wynik = await poprzedniaKarta();
    wynik.plakietka = powod;
    wynik.plakietka_szczegoly = szczegoly;
    wynik.proba_pobrania = czasPobrania;
    console.warn(`!!! Zostają poprzednie dane ze strony (stan na ${wynik.kwadrans.koniec}, pobrane ${wynik.czas_pobrania}).`);
  } catch (e2) {
    wynik = { wersja: WERSJA, czas_pobrania: czasPobrania, plakietka: powod, plakietka_szczegoly: szczegoly, blad: 'brak danych' };
    console.warn(`!!! Poprzednich danych też nie ma (${e2.message ?? e2}) – zapisuję brak danych.`);
  }
  console.warn('');
}

// Moc zainstalowana (PSE, Raport 2025 KSE, Tabela 1.1) – plik w repo, dopisywany zawsze z bieżącej wersji
// (także do poprzednich danych ze strony). Bez pliku panel pokaże „brak danych o mocy zainstalowanej”.
if (wynik.kwadrans) {
  try {
    wynik.moc_zainstalowana = JSON.parse(await readFile(MOC, 'utf-8'));
  } catch (e) {
    delete wynik.moc_zainstalowana;
    console.warn(`!!! Karta: brak pliku mocy zainstalowanej (${e.message ?? e}).`);
  }
}

await writeFile(PLIK, JSON.stringify(wynik, null, 2));

// Etap C3 (D5, decyzja Ani 25.11.2026): okienko PSE (wiatr.json, raport his-wlk-cal) i Karta (his-gen-pal-sire) mają
// osobne „stan na”. Gdy ich kwadranse się różnią – tylko ostrzeżenie w logu budowania, strona bez zmian.
try {
  const wiatr = JSON.parse(await readFile('public/data/wiatr.json', 'utf-8'));
  const kw = (doba, okres) => (doba && okres ? `${doba} ${okres}` : null);
  const okienko = kw(wiatr.doba, wiatr.okres);
  const karta = kw(wynik.kwadrans?.doba, wynik.kwadrans?.okres);
  if (okienko && karta && okienko !== karta) {
    console.warn(`!!! Kwadrans okienka PSE (${okienko}) różni się od kwadransu Karty (${karta}) – każde ma swoje „stan na”.`);
  } else if (okienko && karta) {
    console.log(`Okienko PSE i Karta: ten sam kwadrans (${karta}).`);
  }
} catch (e) {
  console.warn(`!!! Nie udało się porównać kwadransu okienka PSE i Karty (${e.message ?? e}).`);
}
