// Pobiera najnowszą produkcję z wiatru z API PSE (raport his-wlk-cal, pole wi)
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
const zrodlo = 'PSE S.A., raporty.pse.pl (raport his-wlk-cal, pole wi)';

async function pobierzWszystko() {
  const rekordy = [];
  let url = pierwszyUrl;
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
try {
  const rekordy = (await pobierzWszystko())
    .filter((r) => typeof r.wi === 'number')
    .sort((a, b) => a.dtime_utc.localeCompare(b.dtime_utc));
  const ost = rekordy.at(-1);
  if (!ost) throw new Error('brak rekordów z polem wi');
  wynik = {
    wartosc: ost.wi,
    jednostka: 'MW',
    czas_pomiaru: ost.dtime,
    czas_pomiaru_utc: ost.dtime_utc,
    okres: ost.period,
    doba: ost.business_date,
    czas_pobrania: czasPobrania,
    zrodlo,
  };
  console.log(`PSE: wi = ${ost.wi} (doba ${ost.business_date}, ${ost.period})`);
} catch (e) {
  wynik = { wartosc: null, czas_pobrania: czasPobrania, zrodlo, blad: String(e.message ?? e) };
  console.warn(`PSE: nie udało się pobrać danych (${wynik.blad}), zapisuję brak danych`);
}

await writeFile(PLIK, JSON.stringify(wynik, null, 2));
