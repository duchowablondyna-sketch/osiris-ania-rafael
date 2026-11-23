// Język strony i teksty dla JavaScriptu (wersja PL i EN – decyzja Ani 23.11.2026).
// Język bierze się z <html lang>, który przy budowaniu ustawia scripts/jezyki.mjs (/ i /mapa/ – pl, /en/… – en).
// Bez DOM (w Node, np. w testach) – zawsze polski.
import pl from './teksty/pl.js';
import en from './teksty/en.js';

export const JEZYK = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'pl';
const SLOWNIK = JEZYK === 'en' ? en : pl;

// Formaty liczb i dat: PL – 8,3 GW, 23.11.2026; EN – 8.3 GW, 23 Nov 2026.
export const LOCALE = { pl: 'pl-PL', en: 'en-GB' }[JEZYK];
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
export function formatDoby(rrrrMmDd) {
  if (JEZYK !== 'en') return rrrrMmDd.split('-').reverse().join('.');
  return new Date(`${rrrrMmDd}T12:00:00Z`).toLocaleDateString(LOCALE, { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}
