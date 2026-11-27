// F2.2 „Energa w Gdzie” (decyzje Ani 26–27.11.2026): grupy stacji 110 kV Energa-Operator w zakładce „Gdzie”,
// osobna sekcja pod PGE (wariant A). Dane: public/data/osd-energa.json – ręczny odczyt PDF Energi (ZRODLA.md).
// Zasady jak F2.1 (src/osd-pge.js):
// – moc wspólna dla CAŁEJ grupy: nie dzielimy jej na stacje i nie dodajemy grup;
// – w wierszu „2026: X MW · 2031: Y MW” (zawsze rok); rok 2035 (rok docelowy Energi) tylko w „?” przy grupie;
// – „N stacji (model sieci na 2026 r.)”; stacje zaznaczone przez Energę na czerwono – „*” i pełne zdanie przypisu pod listą;
// – zmiana grupy przy stacji w STAREJ grupie („od 2028 w grupie 12 (Oliwa)”); w nowej grupie jej nie pokazujemy;
// – nowe stacje osobną linijką, lata jak w PDF („Mielno (2028–2035)”); uwag „*Oddział X” nie pokazujemy;
// – filtr „Ile MW potrzebujesz?” według 2031; szukanie stacji – wspólne pole narzędzi „Gdzie” (src/gdzie-narzedzia.js).
// Teksty tylko ze słowników (src/teksty: osd.energa.*) i z danych.
import { t, tn, formatDoby, JEZYK } from './jezyk.js';
import { wKolejnosciGrup } from './wyszukiwarka-mocy.js';
import { element, mw, cytat as cytatOperatora, zastosujFiltrGrup } from './osd-wspolne.js';

const cytat = (tekstPl) => cytatOperatora(tekstPl, 'cytat.oryginal_energa');

// Lata nowej stacji jak w PDF: „(2028–2035)”, a gdy jeden rok – „(2035)”.
const lataNowej = (n) => (n.od_roku === n.do_roku ? `${n.od_roku}` : `${n.od_roku}–${n.do_roku}`);

// Do szukania: stacje z modelu na 2026 r. i nowe stacje z kolejnych lat (obie listy są w wierszu grupy).
const doSzukania = (grupy) => grupy.map((g) => ({ ...g, stacje: [...g.stacje, ...g.nowe_stacje] }));

// poZaladowaniu – narzędzia „Gdzie” odświeżają podsumowanie, gdy dane Energi już są.
export function dodajOsdEnerga({ okienka, linijkaZrodla, poZaladowaniu }) {
  const sekcja = document.getElementById('osd-energa');
  const lista = document.getElementById('osd-energa-lista');
  const status = document.getElementById('osd-energa-status');
  const brak = document.getElementById('osd-energa-brak');
  let dane = null;

  const nazwaGrupy = (nr) => dane.grupy.find((g) => g.nr === nr)?.nazwa ?? String(nr);
  const podpisCytatu = (strony) => element('p', 'okienko-pytajnik__podpis', t('osd.energa.cytat_podpis', strony));

  // „?” przy grupie: rok 2035 (rok docelowy) i uwagi do tej grupy.
  function trescGrupy(g) {
    const d = element('div', 'okienko-pytajnik');
    d.append(element('strong', '', t('osd.energa.grupa_tytul', g.nazwa)));
    const rok = dane.rok_docelowy;
    if (typeof g.mw_2035 === 'number') {
      d.append(element('p', '', t('osd.energa.rok_docelowy', rok, mw(g.mw_2035))));
    } else if (g.polaczenie_2035) {
      const p = element('p', '', t('osd.energa.rok_docelowy_brak', rok));
      p.append(' ', ...cytat(dane.cytaty.polaczenie_2035.tekst));
      d.append(p, podpisCytatu(dane.cytaty.polaczenie_2035.strony));
    }
    const p2035 = element('p', '', t('osd.energa.rok_docelowy_opis', ''));
    p2035.append(...cytat(dane.cytaty.rok_2035.tekst));
    d.append(p2035, podpisCytatu(dane.cytaty.rok_2035.strony));
    // Uwagi SOURCE do odczytu (np. gwiazdka bez objaśnienia) – nazwy stacji z danych, zdanie ze słownika.
    for (const u of g.uwagi ?? []) d.append(element('p', '', t(`osd.energa.uwaga.${u.kod}`, u.stacje)));
    d.append(linijkaZrodla(t('osd.energa.zrodlo_nazwa'), 'stan', formatDoby(dane.zrodlo.stan_na)));
    return d;
  }

  function stacja(s) {
    const n = element('span', 'osd-pge__stacja', s.czerwona ? `${s.nazwa}*` : s.nazwa);
    n.dataset.nazwa = s.nazwa;
    if (!s.przeniesienie) return [n];
    const { od_roku: od, do_grupy: doGrupy } = s.przeniesienie;
    return [n, ` – ${t('osd.energa.przeniesienie', od, doGrupy, nazwaGrupy(doGrupy))}`];
  }

  function wypelnij() {
    const rok = dane.rok_filtra;
    const [rokA] = dane.lata;
    // Opis grup słowami Energi + osobno objaśnienie SOURCE (F1).
    const opis = document.getElementById('osd-energa-opis');
    const p1 = element('p', 'osd-pge__cytat');
    p1.append(`${t('osd.energa.grupy_wstep')} `, ...cytat(dane.cytaty.grupy.tekst));
    opis.replaceChildren(
      p1,
      element('p', 'osd-pge__podpis', t('osd.energa.cytat_podpis', dane.cytaty.grupy.strony)),
      element('p', 'osd-pge__objasnienie', t('osd.objasnienie_grupy')),
      element('p', 'osd-pge__podpis', t('slownik.objasnienie')),
    );
    document.getElementById('osd-energa-stan').textContent = `${t('osd.stan', formatDoby(dane.zrodlo.stan_na))} · ${tn('liczba.grupa', dane.grupy.length)}`;

    lista.replaceChildren(
      ...wKolejnosciGrup(dane.grupy).map((g) => {
        const li = element('li', 'osd-pge__grupa');
        li.dataset.nr = g.nr;
        li.append(element('span', 'panel-moce__nazwa', t('osd.energa.wiersz_grupa', g.nazwa, tn('liczba.stacja', g.liczba_stacji))));
        const wiersz = element('span', 'osd-pge__mw liczby', `${t('osd.wiersz_mw', rokA, mw(g.mw[rokA]), rok, mw(g.mw[rok]))} `);
        const pyt = element('button', 'karta__moc-pytajnik', '?');
        pyt.type = 'button';
        pyt.setAttribute('aria-label', t('osd.energa.pytajnik_aria', g.nazwa));
        pyt.setAttribute('aria-haspopup', 'dialog');
        okienka.podlacz(pyt, () => trescGrupy(g));
        wiersz.append(pyt);
        li.append(wiersz);
        const szczegoly = element('details', 'osd-pge__stacje');
        szczegoly.append(element('summary', '', t('osd.pokaz_stacje')));
        const p = element('p', 'osd-pge__stacje-lista');
        g.stacje.forEach((s, i) => {
          if (i) p.append(', ');
          p.append(...stacja(s));
        });
        szczegoly.append(p);
        if (g.nowe_stacje.length) {
          const nowe = element('p', 'osd-pge__stacje-lista osd-energa__nowe', `${t('osd.energa.nowe_stacje')} `);
          g.nowe_stacje.forEach((s, i) => {
            if (i) nowe.append(', ');
            const n = element('span', 'osd-pge__stacja', s.nazwa);
            n.dataset.nazwa = s.nazwa;
            nowe.append(n, ` (${lataNowej(s)})`);
          });
          szczegoly.append(nowe);
        }
        li.append(szczegoly);
        return li;
      }),
    );
    const szac = document.getElementById('osd-energa-szacunek');
    szac.replaceChildren(t('osd.energa.szacunek', ''), ...cytat(dane.cytaty.szacunek.tekst));
    const inw = document.getElementById('osd-energa-inwestycje');
    inw.replaceChildren(t('osd.energa.inwestycje', dane.lata[0], rok), ...cytat(dane.cytaty.inwestycje.tekst));
    const cz = document.getElementById('osd-energa-czerwone');
    cz.replaceChildren(t('osd.energa.czerwone', ''), ...cytat(dane.cytaty.czerwone.tekst));
    document.getElementById('osd-energa-zrodlo').replaceChildren(
      linijkaZrodla(t('osd.energa.zrodlo_nazwa'), 'stan', formatDoby(dane.zrodlo.stan_na), dane.zrodlo.url_strony),
      element('p', 'osd-pge__podpis', t('osd.energa.przetworzone', formatDoby(dane.zrodlo.pobrano))),
    );
    if (JEZYK !== 'pl') sekcja.lang = 'en';
  }

  fetch(`${import.meta.env.BASE_URL}data/osd-energa.json`, { cache: 'no-store' })
    .then((o) => (o.ok ? o.json() : null))
    .then((d) => {
      if (!Array.isArray(d?.grupy) || !d.zrodlo || !d.cytaty) throw new Error('brak pliku');
      dane = d;
      wypelnij();
      sekcja.hidden = false;
      poZaladowaniu?.();
    })
    .catch(() => {
      document.getElementById('osd-energa-opis').replaceChildren(element('p', 'brak-danych', t('osd.energa.brak_danych')));
      sekcja.hidden = false;
      poZaladowaniu?.();
    });

  // Operator w narzędziach „Gdzie”: filtr MW (według 2031) i nazwy stacji (także nowe stacje) – lista i wynik.
  return {
    zastosuj(filtr) {
      if (!dane) return { gotowe: false };
      return zastosujFiltrGrup({
        dane,
        grupyDoSzukania: doSzukania(dane.grupy),
        lista,
        status,
        brak,
        filtr,
        klucze: { pasuje: 'osd.energa.pasuje', brak: 'osd.energa.brak' },
      });
    },
  };
}
