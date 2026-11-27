// F2.1 „PGE na liście w Gdzie” (decyzje Ani 26.11.2026): grupy stacji 110 kV PGE Dystrybucja w zakładce „Gdzie”
// (public/data/osd-pge.json – ręczny odczyt PDF PGE, ZRODLA.md). Mapa grup – na razie bez (sama lista; kółka albo obrysy osobnym krokiem po pomiarze OSM).
// Zasady:
// – moc jest wspólna dla CAŁEJ grupy: nie dzielimy jej na stacje i nie dodajemy grup (jak „nie sumujemy” przy PSE);
// – przy MW zawsze rok: „2026: X MW · 2031: Y MW”; nad listą „stan na …”;
// – filtr pola „Ile MW potrzebujesz?” (wspólnego z PSE) działa według roku 2031 (jak PSE w E1);
// – szukanie stacji po nazwie – wspólne pole narzędzi „Gdzie” (src/gdzie-narzedzia.js, 27.11.2026); ta sama nazwa w kilku grupach → wszystkie te grupy;
// – cytaty PGE dosłownie (po angielsku tłumaczenie + oryginał), osobno „objaśnienie SOURCE” (zasada F1).
// Teksty tylko ze słowników (src/teksty: osd.*) i z danych.
import { t, tn, formatDoby, JEZYK } from './jezyk.js';
import { wKolejnosciGrup } from './wyszukiwarka-mocy.js';
import { element, mw, cytat as cytatOperatora, zastosujFiltrGrup } from './osd-wspolne.js';

// Cytat PGE: po polsku sam tekst w cudzysłowie; po angielsku tłumaczenie, a pod nim mniejszym drukiem oryginał.
const cytat = (tekstPl) => cytatOperatora(tekstPl, 'cytat.oryginal_pge');

// Wygląd: wariant A (decyzja Ani 26.11.2026) – osobna sekcja na końcu zakładki „Gdzie”, pod wszystkim o PSE.
// poZaladowaniu – narzędzia „Gdzie” odświeżają podsumowanie, gdy dane PGE już są.
export function dodajOsdPge({ okienka, linijkaZrodla, poZaladowaniu }) {
  const sekcja = document.getElementById('osd-pge');
  const lista = document.getElementById('osd-pge-lista');
  const status = document.getElementById('osd-pge-status');
  const brak = document.getElementById('osd-pge-brak');
  let dane = null;

  // Okienko „?” przy liczbie grup: 47 według tabel, 46 w tekście dokumentu (decyzja Ani 26.11.2026 – tylko tutaj).
  function trescLiczbyGrup() {
    const d = element('div', 'okienko-pytajnik');
    d.append(element('strong', '', t('osd.tytul')));
    d.append(
      element('p', '', t('osd.liczba_grup_wyjasnienie', dane.liczba_grup.tabele, dane.liczba_grup.tekst_dokumentu)),
      element('p', 'okienko-pytajnik__podpis', t('osd.cytat_podpis', `${dane.liczba_grup.strony_tekstu}, ${dane.liczba_grup.strony_tabel}`)),
    );
    d.append(linijkaZrodla(t('osd.zrodlo_nazwa'), 'stan', formatDoby(dane.zrodlo.stan_na)));
    return d;
  }

  function wypelnij() {
    const rok = dane.rok_filtra;
    const [rokA] = dane.lata;
    // Opis grup słowami PGE + osobno objaśnienie SOURCE (F1).
    const opis = document.getElementById('osd-pge-opis');
    const p1 = element('p', 'osd-pge__cytat');
    p1.append(`${t('osd.pge')} `, ...cytat(dane.cytaty.grupy.tekst));
    opis.replaceChildren(
      p1,
      element('p', 'osd-pge__podpis', t('osd.cytat_podpis', dane.cytaty.grupy.strony)),
      element('p', 'osd-pge__objasnienie', t('osd.objasnienie_grupy')),
      element('p', 'osd-pge__podpis', t('slownik.objasnienie')),
    );
    // „stan na 30.09.2026 · 47 grup ?”
    const stan = document.getElementById('osd-pge-stan');
    const razem = element('span', 'bez-lamania', `${tn('liczba.grupa', dane.grupy.length)} `);
    const pyt = element('button', 'karta__moc-pytajnik', '?');
    pyt.type = 'button';
    pyt.setAttribute('aria-label', t('osd.liczba_grup_aria'));
    pyt.setAttribute('aria-haspopup', 'dialog');
    okienka.podlacz(pyt, trescLiczbyGrup);
    razem.append(pyt);
    stan.replaceChildren(`${t('osd.stan', formatDoby(dane.zrodlo.stan_na))} · `, razem);

    lista.replaceChildren(
      ...wKolejnosciGrup(dane.grupy).map((g) => {
        const li = element('li', 'osd-pge__grupa');
        li.dataset.nr = g.nr;
        li.append(element('span', 'panel-moce__nazwa', t('osd.wiersz_grupa', g.nazwa, tn('liczba.stacja', g.liczba_stacji))));
        li.append(element('span', 'osd-pge__mw liczby', t('osd.wiersz_mw', rokA, mw(g.mw[rokA]), rok, mw(g.mw[rok]))));
        const szczegoly = element('details', 'osd-pge__stacje');
        szczegoly.append(element('summary', '', t('osd.pokaz_stacje')));
        const p = element('p', 'osd-pge__stacje-lista');
        g.stacje.forEach((s, i) => {
          if (i) p.append(', ');
          const n = element('span', 'osd-pge__stacja', s.abonencka ? `${s.nazwa}*` : s.nazwa);
          n.dataset.nazwa = s.nazwa;
          p.append(n);
        });
        szczegoly.append(p);
        li.append(szczegoly);
        return li;
      }),
    );
    const szac = document.getElementById('osd-pge-szacunek');
    szac.replaceChildren(t('osd.szacunek', ''), ...cytat(dane.cytaty.szacunek.tekst));
    const gw = document.getElementById('osd-pge-gwiazdka');
    gw.replaceChildren(t('osd.gwiazdka', ''), ...cytat(dane.cytaty.gwiazdka.tekst));
    document.getElementById('osd-pge-zrodlo').replaceChildren(
      linijkaZrodla(t('osd.zrodlo_nazwa'), 'stan', formatDoby(dane.zrodlo.stan_na), dane.zrodlo.url_strony),
      element('p', 'osd-pge__podpis', t('osd.przetworzone', formatDoby(dane.zrodlo.pobrano))),
    );
    if (JEZYK !== 'pl') sekcja.lang = 'en';
  }

  fetch(`${import.meta.env.BASE_URL}data/osd-pge.json`, { cache: 'no-store' })
    .then((o) => (o.ok ? o.json() : null))
    .then((d) => {
      if (!Array.isArray(d?.grupy) || !d.zrodlo || !d.cytaty) throw new Error('brak pliku');
      dane = d;
      wypelnij();
      sekcja.hidden = false;
      poZaladowaniu?.();
    })
    .catch(() => {
      document.getElementById('osd-pge-opis').replaceChildren(element('p', 'brak-danych', t('osd.brak_danych')));
      sekcja.hidden = false;
      poZaladowaniu?.();
    });

  // Operator w narzędziach „Gdzie”: filtr MW (według 2031) i nazwy stacji – lista sekcji i wynik do podsumowania.
  return {
    zastosuj(filtr) {
      if (!dane) return { gotowe: false };
      return zastosujFiltrGrup({ dane, lista, status, brak, filtr, klucze: { pasuje: 'osd.pasuje', brak: 'osd.brak' } });
    },
  };
}
