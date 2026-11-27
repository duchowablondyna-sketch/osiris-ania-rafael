// Narzędzia zakładki „Gdzie” (decyzje Ani 27.11.2026): w jednym miejscu – tam, gdzie pole „Ile MW potrzebujesz?”
// (kolejność E1/C1 bez zmian) – pole MW i pole „Szukaj stacji po nazwie”; pod nimi podsumowanie podzielone na
// operatorów (wariant 2: lista, operator pod operatorem), każda pozycja z wynikiem przewija do swojej sekcji.
// Sekcje PSE, PGE i Energi zostają na miejscu i w tym samym wyglądzie – filtrują swoje listy same (zastosuj(filtr)).
//
// Kolejny operator (np. Stoen) dołącza jednym wywołaniem: narzedzia.dodaj({ klucz, nazwa, cel, zastosuj }), gdzie
//   nazwa – klucz słownika z nazwą operatora (gdzie.operator.…),
//   cel – id elementu, do którego przewija „↓” (albo funkcja zwracająca id),
//   zastosuj(filtr) – filtruje listę operatora i zwraca { gotowe, rok, razem, pasujace, etykiety?, dokladne }
//   (dla grup – gotowe: zastosujFiltrGrup z src/osd-wspolne.js).
// Mocy nie dodajemy – ani między operatorami, ani między grupami (zdanie pod podsumowaniem).
import { t, tn } from './jezyk.js';
import { czytajMw, doPorownania, wierszOperatora } from './wyszukiwarka-mocy.js';

export function narzedziaGdzie({ formatMw }) {
  const el = (id) => document.getElementById(id);
  const blok = el('szukaj-mw');
  const poleMw = el('szukaj-mw-pole');
  const poleNazwa = el('gdzie-nazwa');
  const wyczysc = el('gdzie-nazwa-wyczysc');
  const wynik = el('gdzie-wynik');
  const naglowek = el('gdzie-naglowek');
  const lista = el('gdzie-podsumowanie');
  const operatorzy = [];

  function przewin(e, id) {
    e.preventDefault();
    const cel = el(id);
    if (!cel) return;
    const ruch = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    cel.scrollIntoView({ block: 'start', behavior: ruch });
  }

  // Jedna pozycja podsumowania: tekst ze słownika; z wynikiem – odnośnik do sekcji operatora ze złotą strzałką.
  function pozycja(op, w, filtr) {
    const li = document.createElement('li');
    li.dataset.operator = op.klucz;
    const nazwa = t(op.nazwa);
    const r = wierszOperatora(w, filtr);
    if (r.rodzaj === 'brak-danych' || r.rodzaj === 'brak') {
      li.textContent = t(r.rodzaj === 'brak' ? 'gdzie.brak' : 'gdzie.brak_danych', nazwa);
      return li;
    }
    const tekst =
      r.rodzaj === 'liczba'
        ? t('gdzie.liczba', nazwa, r.n, r.razem, t(`gdzie.jednostka.${op.jednostka}`))
        : t(`gdzie.lista.${op.jednostka}`, nazwa, r.n, r.etykiety.join(', '));
    const id = typeof op.cel === 'function' ? op.cel() : op.cel;
    const a = document.createElement('a');
    a.className = 'gdzie__do-sekcji';
    a.href = `#${id}`;
    a.append(`${tekst} `);
    const strzalka = document.createElement('span');
    strzalka.className = 'gdzie__strzalka';
    strzalka.setAttribute('aria-hidden', 'true');
    strzalka.textContent = '↓';
    const czytnik = document.createElement('span');
    czytnik.className = 'tylko-czytnik';
    czytnik.textContent = ` – ${t('gdzie.do_listy')}`;
    a.append(strzalka, czytnik);
    a.addEventListener('click', (e) => przewin(e, typeof op.cel === 'function' ? op.cel() : op.cel));
    li.append(a);
    // Ta sama nazwa stacji w kilku grupach – mogą to być różne miejsca (to samo zdanie co dotąd przy PGE).
    for (const d of r.dokladne ?? []) {
      const p = document.createElement('span');
      p.className = 'gdzie__dopisek';
      p.textContent = t('gdzie.dokladne', d.nazwa, tn('liczba.grupa_w', d.grup));
      li.append(p);
    }
    return li;
  }

  function odswiez() {
    const mw = czytajMw(poleMw.value);
    const nazwa = poleNazwa.value.trim();
    const filtr = { mw, nazwa };
    const wyniki = operatorzy.map((op) => ({ op, w: op.zastosuj(filtr) }));
    if (wyniki.some(({ w }) => w.gotowe)) blok.hidden = false;
    wyczysc.hidden = !nazwa;
    const dzialaMw = mw.stan === 'ok';
    const dzialaNazwa = Boolean(doPorownania(nazwa));
    wynik.hidden = !dzialaMw && !dzialaNazwa;
    if (wynik.hidden) {
      lista.replaceChildren();
      return;
    }
    // Rok filtra od każdego operatora (PSE podaje go w zdaniu jako tekst „2031”, OSD – jako liczbę) – porównujemy jako liczby.
    const lata = [...new Set(wyniki.filter(({ w }) => w.gotowe && w.rok).map(({ w }) => Number(w.rok)))];
    const rok = lata.length === 1 ? lata[0] : '–';
    naglowek.textContent = dzialaMw && dzialaNazwa
      ? t('gdzie.naglowek_oba', rok, formatMw(mw.mw), nazwa)
      : dzialaMw
        ? t('gdzie.naglowek_mw', rok, formatMw(mw.mw))
        : t('gdzie.naglowek_nazwa', nazwa);
    lista.replaceChildren(...wyniki.map(({ op, w }) => pozycja(op, w, { mw: dzialaMw, nazwa: dzialaNazwa })));
  }

  poleMw.addEventListener('input', odswiez);
  poleNazwa.addEventListener('input', odswiez);
  wyczysc.addEventListener('click', () => {
    poleNazwa.value = '';
    odswiez();
    poleNazwa.focus();
  });

  return {
    dodaj(op) {
      operatorzy.push(op);
    },
    odswiez,
  };
}
