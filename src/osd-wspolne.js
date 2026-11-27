// Wspólne drobiazgi sekcji operatorów dystrybucyjnych w zakładce „Gdzie” (F2.1 PGE – src/osd-pge.js,
// F2.2 Energa – src/osd-energa.js). Bez kopiowania kodu między operatorami.
import { t, liczba, cytatOsd, formatDoby } from './jezyk.js';
import { filtrujGrupy, najwiekszaMocGrupy, szukajStacji, wKolejnosciGrup } from './wyszukiwarka-mocy.js';

export const mw = (x) => `${liczba(x)} MW`;

export function element(tag, klasa, tekst) {
  const e = document.createElement(tag);
  if (klasa) e.className = klasa;
  if (tekst !== undefined) e.textContent = tekst;
  return e;
}

// Cytat operatora: po polsku sam tekst w cudzysłowie; po angielsku tłumaczenie, a pod nim mniejszym drukiem oryginał.
// kluczOryginalu – podpis oryginału w słowniku („cytat.oryginal_pge”, „cytat.oryginal_energa”).
export function cytat(tekstPl, kluczOryginalu) {
  const c = cytatOsd(tekstPl);
  const s = element('span', '', t('osd.cytat', c.tekst));
  if (c.oryginal) {
    const o = element('span', 'cytat-oryginal', t(kluczOryginalu, c.oryginal));
    o.lang = 'pl';
    return [s, o];
  }
  if (c.bezTlumaczenia) return [s, element('span', 'cytat-oryginal', t('cytat.bez_tlumaczenia'))];
  return [s];
}

// Filtr listy grup operatora (PGE, Energa – i każdy następny, np. Stoen) z narzędzi „Gdzie” (src/gdzie-narzedzia.js).
// filtr: { mw: { stan, mw } – pole „Ile MW potrzebujesz?”, nazwa – tekst pola „Szukaj stacji po nazwie” }.
// MW według roku filtra (2031): grupa pasuje przy ≥ X MW – bez sumowania; nazwa: fragment nazwy stacji (grupy z tą
// stacją, ta sama nazwa w kilku grupach → wszystkie). Ukrywa wiersze listy, podświetla trafione stacje, pisze licznik
// sekcji i zdanie „brak wyniku” (tylko MW – jak dotąd). Zwraca wynik do podsumowania na operatorów.
// grupyDoSzukania – grupy z listą stacji do szukania (Energa: stacje z modelu na 2026 r. i nowe stacje).
// klucze – teksty sekcji: { pasuje, brak } (np. 'osd.pasuje', 'osd.brak').
export function zastosujFiltrGrup({ dane, grupyDoSzukania = dane.grupy, lista, status, brak, filtr, klucze }) {
  const rok = dane.rok_filtra;
  const mwDziala = filtr.mw.stan === 'ok';
  const poMw = mwDziala ? new Set(filtrujGrupy(dane.grupy, filtr.mw.mw, rok).map((g) => g.nr)) : null;
  const szukane = szukajStacji(grupyDoSzukania.filter((g) => !poMw || poMw.has(g.nr)), filtr.nazwa);
  const poNazwie = szukane.pusty ? null : new Map(szukane.wyniki.map((w) => [w.grupa.nr, new Set(w.stacje)]));
  for (const li of lista.children) {
    const nr = Number(li.dataset.nr);
    li.hidden = (poMw && !poMw.has(nr)) || (poNazwie && !poNazwie.has(nr));
    const trafione = poNazwie?.get(nr);
    for (const s of li.querySelectorAll('.osd-pge__stacja')) s.classList.toggle('osd-pge__stacja--trafiona', Boolean(trafione?.has(s.dataset.nazwa)));
    // Przy szukaniu po nazwie – lista stacji w pasujących grupach od razu rozwinięta (widać, która stacja pasuje).
    if (poNazwie) li.querySelector('details').open = Boolean(trafione);
  }
  status.textContent = poMw ? t(klucze.pasuje, poMw.size, dane.grupy.length, rok) : '';
  const bezWyniku = Boolean(poMw) && poMw.size === 0;
  brak.hidden = !bezWyniku;
  if (bezWyniku) brak.textContent = t(klucze.brak, formatDoby(dane.zrodlo.stan_na), mw(filtr.mw.mw), rok, mw(najwiekszaMocGrupy(dane.grupy, rok)));
  const pasujace = wKolejnosciGrup(dane.grupy).filter((g) => (!poMw || poMw.has(g.nr)) && (!poNazwie || poNazwie.has(g.nr)));
  return { gotowe: true, rok, razem: dane.grupy.length, pasujace: pasujace.map((g) => g.nazwa), dokladne: szukane.dokladne };
}
