// Tryb spokojny mapy (decyzja Ani 23.11.2026): okienko PSE i Karta Polski startują zwinięte do jednej linijki,
// legenda – do listy warstw (kolor i nazwa; liczniki, opisy i skala po „więcej ▸”).
// Rozwinięcie pamiętamy tylko w tej karcie przeglądarki (sessionStorage): odświeżenie albo powrót ze strony tytułowej
// pokazuje to, co widz sam otworzył; nowa karta / nowa wizyta – znowu spokojny widok.
// Gdy przeglądarka nie pozwala zapisywać (tryb prywatny, blokada) – zawsze start zwinięty, bez błędu.
const PREFIKS = 'osiris.mapa.';

export function czytajRozwiniecie(klucz) {
  try {
    return window.sessionStorage.getItem(PREFIKS + klucz) === '1';
  } catch {
    return false;
  }
}

export function zapiszRozwiniecie(klucz, otwarte) {
  try {
    window.sessionStorage.setItem(PREFIKS + klucz, otwarte ? '1' : '0');
  } catch {
    // zapis zablokowany – następny start i tak będzie zwinięty
  }
}

// <details> bez atrybutu open w szablonie (start zwinięty); tu: otwarcie, jeśli widz rozwinął je wcześniej w tej karcie,
// i zapamiętywanie każdej zmiany (kliknięcie, Enter, spacja na nagłówku).
export function pamietajRozwiniecie(details, klucz) {
  if (!details) return;
  details.open = czytajRozwiniecie(klucz);
  details.addEventListener('toggle', () => zapiszRozwiniecie(klucz, details.open));
}
