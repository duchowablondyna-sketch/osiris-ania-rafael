// Pobiera najnowszą produkcję z wiatru i ze słońca z API PSE (raport his-wlk-cal, pola wi i pv)
// i zapisuje public/data/wiatr.json. Uruchamiany automatycznie przed `npm run build`.
// Jeśli PSE nie odpowie, zapisuje brak danych, a budowanie idzie dalej.
import { writeFile } from 'node:fs/promises';

const PLIK = 'public/data/wiatr.json';
const API = 'https://api.raporty.pse.pl/api/his-wlk-cal';
const MAKS_STRON = 10;

// Doba sprzed 3 dni w czasie polskim, w formacie RRRR-MM-DD
const od = new Date(Date.now() - 3 * 86400_000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
const pierwszyUrl = `${API}?%24filter=business_date%20ge%20%27${od}%27`;

const czasPobrania = new Date().toISOString();
const zrodlo = 'PSE S.A., raporty.pse.pl (raport his-wlk-cal, pola wi i pv)';
// Słońce (pv) bierzemy z tego samego rekordu co wiatr – ten sam kwadrans. Nocą PSE publikuje 0 (nie puste pole).
const mw1 = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : null);

async function pobierzWszystko(start = pierwszyUrl) {
  const rekordy = [];
  let url = start;
  for (let i = 0; url && i < MAKS_STRON; i++) {
    const odp = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!odp.ok) throw new Error(`HTTP ${odp.status}`);
    const json = await odp.json();
    rekordy.push(...(json.value ?? []));
    url = json.nextLink ?? null;
  }
  return rekordy;
}

let wynik;
// Wszystkie rekordy wiatru z ostatnich dni (także puste) – potrzebne też do odtworzenia doby niżej.
let wszystkieWiatr = [];
try {
  wszystkieWiatr = await pobierzWszystko();
  const rekordy = wszystkieWiatr
    .filter((r) => typeof r.wi === 'number')
    .sort((a, b) => a.dtime_utc.localeCompare(b.dtime_utc));
  const ost = rekordy.at(-1);
  if (!ost) throw new Error('brak rekordów z polem wi');
  wynik = {
    wartosc: ost.wi,
    slonce: typeof ost.pv === 'number' ? ost.pv : null,
    jednostka: 'MW',
    czas_pomiaru: ost.dtime,
    czas_pomiaru_utc: ost.dtime_utc,
    okres: ost.period,
    doba: ost.business_date,
    czas_pobrania: czasPobrania,
    zrodlo,
    // Wszystkie kwadranse doby ostatniego pomiaru (od 00:00) – do wykresu w okienku.
    seria: rekordy
      .filter((r) => r.business_date === ost.business_date)
      .map((r) => ({ okres: r.period, mw: mw1(r.wi), pv: mw1(r.pv) })),
  };
  console.log(`PSE: wi = ${ost.wi}, pv = ${ost.pv} (doba ${ost.business_date}, ${ost.period}), wykres: ${wynik.seria.length} kwadransów`);
} catch (e) {
  wynik = { wartosc: null, czas_pobrania: czasPobrania, zrodlo, blad: String(e.message ?? e) };
  console.warn(`PSE: nie udało się pobrać danych (${wynik.blad}), zapisuję brak danych`);
}

// Ograniczenia wiatru: raport poze-redoze („Nierynkowe redysponowanie źródeł OZE”).
// Bierzemy najnowszą dobę, w której wi_red_balance lub wi_red_network ma wartość (puste pola to nie zero).
// Suma obu pól ze wszystkich kwadransów ÷ 4 = MWh, przy założeniu, że wartości są w MW (niepotwierdzone przez PSE).
const API_RED = 'https://api.raporty.pse.pl/api/poze-redoze';
const POLA_WIATR = ['wi_red_balance', 'wi_red_network'];
const odRed = new Date(Date.now() - 120 * 86400_000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

let ograniczenie;
try {
  const filtr = `business_date ge '${odRed}' and (wi_red_balance ne null or wi_red_network ne null)`;
  const najnowszyUrl = `${API_RED}?$filter=${encodeURIComponent(filtr)}&$orderby=${encodeURIComponent('business_date desc,dtime desc')}&$first=1`;
  const odp = await fetch(najnowszyUrl, { signal: AbortSignal.timeout(20_000) });
  if (!odp.ok) throw new Error(`HTTP ${odp.status}`);
  const doba = (await odp.json()).value?.[0]?.business_date;
  if (!doba) throw new Error('brak doby z ograniczeniem wiatru');

  const rekordy = await pobierzWszystko(`${API_RED}?$filter=${encodeURIComponent(`business_date eq '${doba}'`)}`);
  let suma = 0;
  let kwadranse = 0;
  for (const r of rekordy) {
    const wartosci = POLA_WIATR.map((p) => r[p]).filter((v) => typeof v === 'number');
    if (wartosci.length) kwadranse++;
    for (const v of wartosci) suma += v;
  }
  if (kwadranse === 0) throw new Error(`brak wartości w dobie ${doba}`);
  ograniczenie = {
    doba,
    mwh: Math.round(Math.abs(suma) / 4),
    kwadranse,
    publikacja: rekordy[0]?.publication_ts ?? null,
    zrodlo: 'PSE S.A., raporty.pse.pl (raport poze-redoze, pola wi_red_balance i wi_red_network)',
  };
  console.log(`PSE: ograniczenie wiatru ${ograniczenie.mwh} MWh (doba ${doba}, ${kwadranse} kwadransów, suma ${suma.toFixed(1)})`);
} catch (e) {
  ograniczenie = { mwh: null, blad: String(e.message ?? e) };
  console.warn(`PSE: nie udało się pobrać ograniczeń wiatru (${ograniczenie.blad}), zapisuję brak danych`);
}
wynik.ograniczenie = ograniczenie;

await writeFile(PLIK, JSON.stringify(wynik, null, 2));

// Cena prądu RCE: raport rce-pln („Rynkowa cena energii elektrycznej”), dziś i jutro (doby wg czasu polskiego).
// Jutro pojawia się zwykle ok. 13:30–14:15 dnia poprzedniego – jeśli go nie ma, zapisujemy tylko dziś.
// Bierzemy tyle kwadransów, ile przyjdzie (w dniu zmiany czasu jest ich inna liczba niż 96).
// koniec_utc pozwala przeglądarce wybrać bieżący kwadrans bez względu na strefę czasową komputera.
const PLIK_RCE = 'public/data/rce.json';
const API_RCE = 'https://api.raporty.pse.pl/api/rce-pln';
const dobaPL = (przesuniecieDni) =>
  new Date(Date.now() + przesuniecieDni * 86400_000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

const rce = { czas_pobrania: czasPobrania, zrodlo: 'PSE S.A., raporty.pse.pl (raport rce-pln, pole rce_pln)', jednostka: 'zł/MWh', doby: {} };
for (const doba of [dobaPL(0), dobaPL(1)]) {
  try {
    const rekordy = (await pobierzWszystko(`${API_RCE}?$filter=${encodeURIComponent(`business_date eq '${doba}'`)}`))
      .filter((r) => r.business_date === doba && typeof r.rce_pln === 'number' && r.dtime_utc)
      .sort((a, b) => a.dtime_utc.localeCompare(b.dtime_utc));
    if (rekordy.length === 0) throw new Error('brak rekordów');
    rce.doby[doba] = rekordy.map((r) => ({
      okres: r.period,
      koniec_utc: `${r.dtime_utc.slice(0, 19).replace(' ', 'T')}Z`,
      cena: r.rce_pln,
    }));
    console.log(`PSE: RCE doba ${doba}: ${rekordy.length} kwadransów (publikacja ${rekordy[0].publication_ts})`);
  } catch (e) {
    console.warn(`PSE: RCE doba ${doba}: brak danych (${e.message ?? e})`);
  }
}
await writeFile(PLIK_RCE, JSON.stringify(rce));

// Odtworzenie doby: wczorajsza pełna doba (wiatr i słońce his-wlk-cal + cena rce-pln, co 15 min).
// Wiatr za wczoraj bywa kompletny dopiero ok. 3:00 następnego dnia – jeśli wczoraj jest niepełne,
// bierzemy przedwczoraj (jeśli pełne). Doba jest pełna tylko wtedy, gdy wiatr, słońce i cena mają tę samą liczbę
// kwadransów (96, w dniu zmiany czasu 92 albo 100), każdy z liczbą, o tych samych czasach końca. Bez uzupełniania luk.
const PLIK_DOBA = 'public/data/doba.json';
const koniecUtc = (r) => (r.dtime_utc ? `${r.dtime_utc.slice(0, 19).replace(' ', 'T')}Z` : null);
const odtworzenie = {
  czas_pobrania: czasPobrania,
  zrodlo: 'PSE S.A., raporty.pse.pl (raporty his-wlk-cal, pola wi i pv, i rce-pln, pole rce_pln)',
  doba: null,
  kwadranse: [],
};
for (const doba of [dobaPL(-1), dobaPL(-2)]) {
  try {
    const wiatrDoby = wszystkieWiatr
      .filter((r) => r.business_date === doba)
      .sort((a, b) => a.dtime_utc.localeCompare(b.dtime_utc));
    const cenyDoby = (await pobierzWszystko(`${API_RCE}?$filter=${encodeURIComponent(`business_date eq '${doba}'`)}`))
      .filter((r) => r.business_date === doba)
      .sort((a, b) => a.dtime_utc.localeCompare(b.dtime_utc));
    const n = wiatrDoby.length;
    const pelna =
      [92, 96, 100].includes(n) &&
      cenyDoby.length === n &&
      wiatrDoby.every(
        (w, i) =>
          typeof w.wi === 'number' && typeof w.pv === 'number' && typeof cenyDoby[i].rce_pln === 'number' && koniecUtc(w) === koniecUtc(cenyDoby[i]),
      );
    if (!pelna) throw new Error(`niepełna (wiatr ${n}, cena ${cenyDoby.length} kwadransów)`);
    odtworzenie.doba = doba;
    odtworzenie.kwadranse = wiatrDoby.map((w, i) => ({
      okres: w.period,
      koniec_utc: koniecUtc(w),
      mw: mw1(w.wi),
      pv: mw1(w.pv),
      cena: cenyDoby[i].rce_pln,
    }));
    console.log(`PSE: odtworzenie doby ${doba}: ${n} kwadransów`);
    break;
  } catch (e) {
    console.warn(`PSE: odtworzenie doby ${doba}: ${e.message ?? e}`);
  }
}
await writeFile(PLIK_DOBA, JSON.stringify(odtworzenie));
