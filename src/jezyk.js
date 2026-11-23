// Język strony i teksty dla JavaScriptu (wersja PL i EN – decyzja Ani 23.11.2026).
// Język bierze się z <html lang>, który przy budowaniu ustawia scripts/jezyki.mjs (/ i /mapa/ – pl, /en/… – en).
// Bez DOM (w Node, np. w testach) – polski; testy mogą przełączyć język: ustawJezyk('en').
import pl from './teksty/pl.js';
import en from './teksty/en.js';
import cytaty from './teksty/cytaty-pse.js';

const SLOWNIKI = { pl, en };
const LOKALE = { pl: 'pl-PL', en: 'en-GB' };

export let JEZYK = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'pl';
// Formaty liczb i dat: PL – 8,3 GW, 23.11.2026; EN – 8.3 GW, 23 Nov 2026.
export let LOCALE = LOKALE[JEZYK];
let SLOWNIK = SLOWNIKI[JEZYK];

// Tylko dla testów w Node (w przeglądarce język ustala <html lang>).
export function ustawJezyk(jezyk) {
  JEZYK = jezyk;
  LOCALE = LOKALE[jezyk];
  SLOWNIK = SLOWNIKI[jezyk];
}

const STREFA = 'Europe/Warsaw';

// Tekst ze słownika; gdy wartość jest funkcją – z argumentami (liczby, daty).
export function t(klucz, ...argumenty) {
  const wartosc = SLOWNIK[klucz];
  if (wartosc === undefined) {
    console.error(`Brak tekstu „${klucz}” (${JEZYK})`);
    return klucz;
  }
  return typeof wartosc === 'function' ? wartosc(...argumenty) : wartosc;
}

// Liczba z rzeczownikiem w dobrej formie: PL – 1 elektrownia, 2 elektrownie, 5 elektrowni; EN – 1 power plant, 2 power plants.
// W słowniku: { one, few, many } (PL) albo { one, other } (EN); wybiera Intl.PluralRules.
export function tn(klucz, n) {
  const formy = SLOWNIK[klucz];
  if (!formy || typeof formy !== 'object') {
    console.error(`Brak odmiany „${klucz}” (${JEZYK})`);
    return String(n);
  }
  const rodzaj = new Intl.PluralRules(LOCALE).select(n);
  return `${liczba(n)} ${formy[rodzaj] ?? formy.other ?? formy.many}`;
}

// Liczba wg języka: liczba(1234.5, 1) → „1 234,5” / „1,234.5”. Bez miejsc – bez zmiany zaokrąglenia.
export function liczba(x, miejsca) {
  const opcje = miejsca === undefined ? {} : { minimumFractionDigits: miejsca, maximumFractionDigits: miejsca };
  return x.toLocaleString(LOCALE, opcje);
}

// Polski tekst z danych (np. powód plakietki, opis weryfikacji farmy) → tekst w języku strony.
// Szuka w słowniku PL klucza z danym przedrostkiem, którego wartość to dokładnie ten tekst; po polsku – bez zmian.
// Brak tłumaczenia: tekst w oryginale z dopiskiem „(in Polish)” – bez zgadywania.
export function zDanych(tekstPl, przedrostek) {
  if (JEZYK === 'pl') return tekstPl;
  const klucz = Object.keys(pl).find((k) => k.startsWith(przedrostek) && pl[k] === tekstPl);
  return klucz ? t(klucz) : `${tekstPl} ${t('wspolne.po_polsku')}`;
}

// Cytat z dokumentu PSE w języku strony (decyzja Ani 23.11.2026: nasze tłumaczenie, pod nim mniejszym drukiem oryginał).
// Zwraca { tekst, oryginal, bezTlumaczenia }: po polsku – sam tekst; po angielsku – tłumaczenie i oryginał (gdy się różnią);
// bez tłumaczenia – oryginał i bezTlumaczenia: true (strona dopisze „PSE wording, not yet translated”).
export function cytatPse(tekstPl) {
  if (JEZYK === 'pl') return { tekst: tekstPl, oryginal: null, bezTlumaczenia: false };
  const tlumaczenie = cytaty[tekstPl];
  if (!tlumaczenie) return { tekst: tekstPl, oryginal: null, bezTlumaczenia: true };
  return { tekst: tlumaczenie, oryginal: tlumaczenie === tekstPl ? null : tekstPl, bezTlumaczenia: false };
}

// Polski tekst ze słownika – do porównań z polskimi wartościami w danych (np. filtr „na liście MKiŚ”).
export const tekstPl = (klucz) => pl[klucz];

// Data i godzina wg czasu polskiego: „23.11.2026, 08:54” / „23 Nov 2026, 08:54”.
export function formatCzasu(iso) {
  const opcje =
    JEZYK === 'en'
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { dateStyle: 'short', timeStyle: 'short' };
  return new Date(iso).toLocaleString(LOCALE, { timeZone: STREFA, ...opcje });
}

// Krótko, bez roku: „23.11, 08:54” / „23 Nov, 08:54”.
export function formatKrotki(iso) {
  const opcje =
    JEZYK === 'en'
      ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };
  return new Date(iso).toLocaleString(LOCALE, { timeZone: STREFA, ...opcje });
}

// Sama doba z zapisu RRRR-MM-DD: „20.11.2026” / „20 Nov 2026” (bez przesunięć strefy – liczone w południe UTC).
// Brak daty – „–”.
export function formatDoby(rrrrMmDd) {
  if (!rrrrMmDd) return '–';
  if (JEZYK !== 'en') return rrrrMmDd.split('-').reverse().join('.');
  return new Date(`${rrrrMmDd}T12:00:00Z`).toLocaleDateString(LOCALE, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}

// Dzień i miesiąc bez roku z RRRR-MM-DD: „20.11” / „20 Nov”.
export function formatDnia(rrrrMmDd) {
  const [, m, d] = rrrrMmDd.split('-');
  if (JEZYK !== 'en') return `${d}.${m}`;
  return new Date(`${rrrrMmDd}T12:00:00Z`).toLocaleDateString(LOCALE, { timeZone: 'UTC', day: 'numeric', month: 'short' });
}

// Miesiąc i rok z RRRR-MM: „lipiec 2026” / „July 2026” (wersja danych u dostawcy, np. GEM).
export function formatMiesiaca(rrrrMm) {
  const s = new Date(`${rrrrMm}-15T12:00:00Z`).toLocaleDateString(LOCALE, { timeZone: 'UTC', month: 'long', year: 'numeric' });
  return JEZYK === 'pl' ? s.replace(/^./, (z) => z.toLowerCase()) : s;
}
