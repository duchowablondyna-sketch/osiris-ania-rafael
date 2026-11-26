// F2.1 „PGE na liście w Gdzie” (decyzje Ani 26.11.2026): grupy stacji 110 kV PGE Dystrybucja w zakładce „Gdzie”
// (public/data/osd-pge.json – ręczny odczyt PDF PGE, ZRODLA.md). Mapa grup – na razie bez (sama lista; kółka albo obrysy osobnym krokiem po pomiarze OSM).
// Zasady:
// – moc jest wspólna dla CAŁEJ grupy: nie dzielimy jej na stacje i nie dodajemy grup (jak „nie sumujemy” przy PSE);
// – przy MW zawsze rok: „2026: X MW · 2031: Y MW”; nad listą „stan na …”;
// – filtr pola „Ile MW potrzebujesz?” (wspólnego z PSE) działa według roku 2031 (jak PSE w E1);
// – szukanie stacji po nazwie – osobne pole; ta sama nazwa w kilku grupach → wszystkie te grupy;
// – cytaty PGE dosłownie (po angielsku tłumaczenie + oryginał), osobno „objaśnienie SOURCE” (zasada F1).
// Teksty tylko ze słowników (src/teksty: osd.*) i z danych.
import { t, tn, liczba, cytatOsd, formatDoby, JEZYK } from './jezyk.js';
import { filtrujGrupy, najwiekszaMocGrupy, szukajStacji, wKolejnosciGrup } from './wyszukiwarka-mocy.js';

const mw = (x) => `${liczba(x)} MW`;

function element(tag, klasa, tekst) {
  const e = document.createElement(tag);
  if (klasa) e.className = klasa;
  if (tekst !== undefined) e.textContent = tekst;
  return e;
}

// Cytat PGE: po polsku sam tekst w cudzysłowie; po angielsku tłumaczenie, a pod nim mniejszym drukiem oryginał.
function cytat(tekstPl) {
  const c = cytatOsd(tekstPl);
  const s = element('span', '', t('osd.cytat', c.tekst));
  if (c.oryginal) {
    const o = element('span', 'cytat-oryginal', t('cytat.oryginal_pge', c.oryginal));
    o.lang = 'pl';
    return [s, o];
  }
  if (c.bezTlumaczenia) return [s, element('span', 'cytat-oryginal', t('cytat.bez_tlumaczenia'))];
  return [s];
}

// Wygląd: wariant A (decyzja Ani 26.11.2026) – osobna sekcja na końcu zakładki „Gdzie”, pod wszystkim o PSE.
export function dodajOsdPge({ okienka, linijkaZrodla }) {
  const sekcja = document.getElementById('osd-pge');
  const lista = document.getElementById('osd-pge-lista');
  const status = document.getElementById('osd-pge-status');
  const brak = document.getElementById('osd-pge-brak');
  const pole = document.getElementById('osd-pge-szukaj');
  const wyczysc = document.getElementById('osd-pge-szukaj-wyczysc');
  const statusSzukaj = document.getElementById('osd-pge-szukaj-status');
  let dane = null;
  let filtrMw = { stan: 'pusty', mw: null };

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

  // Oba filtry naraz: MW (rok 2031, wspólne pole z PSE) i nazwa stacji (osobne pole PGE).
  function zastosuj() {
    if (!dane) return;
    const rok = dane.rok_filtra;
    const pasujaceMw = filtrMw.stan === 'ok' ? new Set(filtrujGrupy(dane.grupy, filtrMw.mw, rok).map((g) => g.nr)) : null;
    const szukane = szukajStacji(dane.grupy, pole.value);
    const pasujaceNazwa = szukane.pusty ? null : new Map(szukane.wyniki.map((w) => [w.grupa.nr, new Set(w.stacje)]));
    for (const li of lista.children) {
      const nr = Number(li.dataset.nr);
      li.hidden = (pasujaceMw && !pasujaceMw.has(nr)) || (pasujaceNazwa && !pasujaceNazwa.has(nr));
      const trafione = pasujaceNazwa?.get(nr);
      for (const s of li.querySelectorAll('.osd-pge__stacja')) s.classList.toggle('osd-pge__stacja--trafiona', Boolean(trafione?.has(s.dataset.nazwa)));
      // Przy szukaniu po nazwie – lista stacji w pasujących grupach od razu rozwinięta (widać, która stacja pasuje).
      if (pasujaceNazwa) li.querySelector('details').open = Boolean(trafione);
    }
    status.textContent = pasujaceMw ? t('osd.pasuje', pasujaceMw.size, dane.grupy.length, rok) : '';
    const bezWyniku = Boolean(pasujaceMw) && pasujaceMw.size === 0;
    brak.hidden = !bezWyniku;
    if (bezWyniku) brak.textContent = t('osd.brak', formatDoby(dane.zrodlo.stan_na), mw(filtrMw.mw), rok, mw(najwiekszaMocGrupy(dane.grupy, rok)));
    wyczysc.hidden = szukane.pusty;
    if (szukane.pusty) statusSzukaj.textContent = '';
    else if (!szukane.wyniki.length) statusSzukaj.textContent = t('osd.szukaj_brak', pole.value.trim());
    else {
      const stacji = szukane.wyniki.reduce((a, w) => a + w.stacje.length, 0);
      statusSzukaj.textContent = [
        t('osd.szukaj_wynik', tn('liczba.stacja', stacji), tn('liczba.grupa_w', szukane.wyniki.length)),
        ...szukane.dokladne.map((d) => t('osd.szukaj_dokladne', d.nazwa, tn('liczba.grupa_w', d.grup))),
      ].join(' ');
    }
  }

  pole.addEventListener('input', zastosuj);
  wyczysc.addEventListener('click', () => {
    pole.value = '';
    zastosuj();
    pole.focus();
  });

  fetch(`${import.meta.env.BASE_URL}data/osd-pge.json`, { cache: 'no-store' })
    .then((o) => (o.ok ? o.json() : null))
    .then((d) => {
      if (!Array.isArray(d?.grupy) || !d.zrodlo || !d.cytaty) throw new Error('brak pliku');
      dane = d;
      wypelnij();
      sekcja.hidden = false;
      zastosuj();
    })
    .catch(() => {
      document.getElementById('osd-pge-opis').replaceChildren(element('p', 'brak-danych', t('osd.brak_danych')));
      sekcja.hidden = false;
    });

  // Wywoływane przez filtr E1 (src/moce.js) przy każdej zmianie pola „Ile MW potrzebujesz?”.
  return {
    filtruj(stan, wartosc) {
      filtrMw = { stan, mw: wartosc };
      zastosuj();
    },
  };
}
