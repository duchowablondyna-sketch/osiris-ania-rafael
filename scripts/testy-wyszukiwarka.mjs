// E1 „Planuję inwestycję” (decyzje Ani 26.11.2026): testy pola „Ile MW potrzebujesz?” i danych z projektu planu
// rozwoju sieci PSE. Uruchom: node --test scripts/testy-wyszukiwarka.mjs (także w npm run sprawdz).
// Dane prawdziwe: public/data/moce-pse.json, rozdzielnie-pse.json, plan-rozwoju-pse.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pl from '../src/teksty/pl.js';
import en from '../src/teksty/en.js';
import { czytajMw, filtrujStacje, najwiekszaMoc, terminPlanu, wKolejnosciPse, szukajStacjiPse, wierszOperatora, filtrujGrupy } from '../src/wyszukiwarka-mocy.js';

const KATALOG = resolve(import.meta.dirname, '..');
const json = (p) => JSON.parse(readFileSync(resolve(KATALOG, p), 'utf-8'));
const moce = json('public/data/moce-pse.json');
const wykaz = json('public/data/rozdzielnie-pse.json');
const plan = json('public/data/plan-rozwoju-pse.json');
const kody = (lista) => lista.map((s) => s.kod);
const MOCY_RAZEM = moce.odbiorcy.length;

// Tabela przypadków z inwentaryzacji (PLAN.md, pkt 5) + decyzje Ani 26.11.2026 (pkt 3: „1.500”, GW – komunikat).
const PRZYPADKI = [
  ['30', 'ok', 30, MOCY_RAZEM],
  ['500', 'ok', 500, 16],
  ['600', 'ok', 600, 3],
  ['1500', 'ok', 1500, 0],
  ['0', 'zero'],
  ['-5', 'zero'],
  ['', 'pusty'],
  ['   ', 'pusty'],
  ['abc', 'nie-liczba'],
  ['1 000', 'ok', 1000, 3],
  ['1 000', 'ok', 1000, 3],
  ['1,5', 'ok', 1.5, MOCY_RAZEM],
  ['1.5', 'ok', 1.5, MOCY_RAZEM],
  ['600 MW', 'ok', 600, 3],
  ['600mw', 'ok', 600, 3],
  [' 600 ', 'ok', 600, 3],
  ['99999999999', 'ok', 99999999999, 0],
  ['1.500', 'kropka'],
  ['1.000.000', 'kropka'],
  ['1,500', 'przecinek'],
  ['1,5 GW', 'jednostka'],
  ['2GW', 'jednostka'],
  ['500 kW', 'jednostka'],
  ['w', 'nie-liczba'],
  ['MW', 'nie-liczba'],
  ['6OO', 'nie-liczba'],
];

for (const [wpis, stan, mw, ile] of PRZYPADKI) {
  test(`wpis ${JSON.stringify(wpis)} → ${stan}${ile === undefined ? '' : `, ${ile} stacji`}`, () => {
    const w = czytajMw(wpis);
    assert.equal(w.stan, stan);
    if (stan === 'ok') {
      assert.equal(w.mw, mw);
      assert.equal(filtrujStacje(moce.odbiorcy, w.mw).length, ile);
    } else {
      assert.equal(w.mw, null);
    }
  });
}

test('600 MW → MKA, EPK, DZO w kolejności PSE', () => {
  assert.deepEqual(kody(filtrujStacje(moce.odbiorcy, 600)), ['MKA', 'EPK', 'DZO']);
});

test('nic nie sumujemy: REM + SWR (2 × 500 MW w rejonie Warszawy) nie są wynikiem dla 1000 ani 1500 MW', () => {
  for (const mw of [1000, 1500]) {
    const wynik = kody(filtrujStacje(moce.odbiorcy, mw));
    assert.ok(!wynik.includes('REM') && !wynik.includes('SWR'), `${mw} MW: ${wynik}`);
  }
  // Każda stacja w wyniku sama ma co najmniej tyle MW.
  for (const mw of [1, 150, 250, 500, 999, 1000]) {
    for (const s of filtrujStacje(moce.odbiorcy, mw)) assert.ok(s.moc_mw >= mw, `${s.kod}: ${s.moc_mw} < ${mw}`);
  }
});

test('kolejność PSE (tabela 1 wg L.p., potem tabela 2) przy każdym progu; stacje z wykazu zostają na miejscu', () => {
  const pse = kody(wKolejnosciPse(moce.odbiorcy));
  assert.deepEqual(pse, kody([...moce.odbiorcy.filter((s) => s.tabela === 1), ...moce.odbiorcy.filter((s) => s.tabela === 2)].sort((a, b) => a.tabela - b.tabela || a.lp - b.lp)));
  const zWykazu = new Set(wykaz.listy.slice(1).flatMap((l) => l.rozdzielnie.flatMap((r) => r.kody)));
  for (const mw of [1, 100, 250, 500, 1000]) {
    const wynik = kody(filtrujStacje(moce.odbiorcy, mw));
    assert.deepEqual(wynik, pse.filter((k) => wynik.includes(k)), `${mw} MW: kolejność`);
    const oczekiwaneZWykazu = moce.odbiorcy.filter((s) => s.moc_mw >= mw && zWykazu.has(s.kod)).map((s) => s.kod);
    for (const k of oczekiwaneZWykazu) assert.ok(wynik.includes(k), `${mw} MW: brak ${k} (stacja z wykazu)`);
  }
});

test('największa moc przy jednej stacji – z danych, nie suma', () => {
  assert.equal(najwiekszaMoc(moce.odbiorcy), Math.max(...moce.odbiorcy.map((s) => s.moc_mw)));
  assert.ok(najwiekszaMoc(moce.odbiorcy) < moce.odbiorcy.reduce((a, s) => a + s.moc_mw, 0));
});

test('plan: każda stacja z mocą dla odbiorców ma wpis (nowa stacja od Robota → czerwono, uzupełnić plan)', () => {
  const wPlanie = new Set(kody(plan.stacje));
  for (const s of moce.odbiorcy) assert.ok(wPlanie.has(s.kod), `brak w planie: ${s.kod}`);
  assert.equal(plan.stacje.length, new Set(kody(plan.stacje)).size, 'powtórzony kod w planie');
  for (const s of moce.odbiorcy) assert.equal(terminPlanu(plan, s.kod).kod, s.kod);
  assert.equal(terminPlanu(plan, 'XXX'), null);
});

test('plan: lata, przypisy, dopasowanie, weryfikacja', () => {
  const poz2025 = new Map();
  for (const l of wykaz.listy) for (const r of l.rozdzielnie) for (const k of r.kody) poz2025.set(k, r.opis);
  for (const s of plan.stacje) {
    assert.ok(Number.isInteger(s.rok_rozpoczecia) && Number.isInteger(s.rok_zakonczenia), s.kod);
    assert.ok(s.rok_rozpoczecia <= s.rok_zakonczenia, `${s.kod}: rozpoczęcie po zakończeniu`);
    assert.ok(['5.2', '5.3'].includes(s.tabela), `${s.kod}: tabela ${s.tabela}`);
    assert.ok(Number.isInteger(s.strona) && s.strona >= 56 && s.strona <= 76, `${s.kod}: strona ${s.strona}`);
    for (const nr of s.przypisy) {
      assert.ok(plan.przypisy_pse[nr], `${s.kod}: brak oryginału przypisu (${nr})`);
      for (const [nazwa, slownik] of [['PL', pl], ['EN', en]]) assert.ok(slownik[`plan.przypis.${nr}`], `${nazwa}: brak plan.przypis.${nr}`);
    }
    assert.ok(['wykaz+nazwa', 'nazwa', 'niepewne'].includes(s.dopasowanie), `${s.kod}: ${s.dopasowanie}`);
    if (s.dopasowanie === 'wykaz+nazwa') assert.equal(s.pozycja_prsp_2025_2034, poz2025.get(s.kod), `${s.kod}: pozycja z wykazu`);
    if (s.dopasowanie === 'niepewne') {
      for (const [nazwa, slownik] of [['PL', pl], ['EN', en]]) assert.ok(slownik[`plan.niepewne.${s.kod}`], `${nazwa}: brak plan.niepewne.${s.kod}`);
    }
    assert.ok([1, 3].includes(s.poziom_weryfikacji), `${s.kod}: poziom ${s.poziom_weryfikacji}`);
  }
  // Ania 26.11.2026: 10 stacji porównanych w PDF (poziom 3).
  assert.deepEqual(
    plan.stacje.filter((s) => s.poziom_weryfikacji === 3).map((s) => s.kod).sort(),
    ['DZO', 'EPK', 'LWN', 'MAO', 'MKA', 'PBO', 'REM', 'SWR', 'WRS', 'ZER'],
  );
  assert.equal(plan.zrodlo.sha256, '5273f6837f5051a2de077f8904cb497fb9dcbab3e9302d8a4f8d34211ca3cc19');
  assert.match(plan.zrodlo.status, /przed uzgodnieniem/);
});

// Nowe teksty E1 (klucze szukaj.*, plan.* i nowe slownik.*) i narzędzia „Gdzie” (gdzie.*, 27.11.2026).
const NOWE = (s) => Object.keys(s).filter((k) => /^(szukaj|plan|gdzie)\.|^slownik\.(zakonczenie|ure)/.test(k));
const tekst = (wartosc) => (typeof wartosc === 'function' ? wartosc(11, 22, 33, 44) : String(wartosc));

test('nowe teksty: bez ocen i rad, bez „uruchomienia” ani „stacja gotowa”', () => {
  const ZAKAZANE = /potencja|warto\b|polecam|najlepsz|opłaca|uruchomien|stacja gotowa|gotowa stacja|potential|worth|recommend|\bbest\b|commissioning|ready/i;
  for (const [nazwa, slownik] of [['PL', pl], ['EN', en]]) {
    for (const k of NOWE(slownik)) assert.ok(!ZAKAZANE.test(tekst(slownik[k])), `${nazwa} ${k}: ${tekst(slownik[k])}`);
  }
});

test('nowe teksty: twarda spacja między liczbą a MW, GW, kV i „r.”', () => {
  for (const [nazwa, slownik] of [['PL', pl], ['EN', en]]) {
    for (const k of NOWE(slownik)) {
      const s = tekst(slownik[k]);
      // Po liczbie (także z argumentu funkcji – tu 11, 22…) – twarda spacja.
      assert.ok(!/\d (MW|GW|kV|r\.)(?![\p{L}])/u.test(s), `${nazwa} ${k}: zwykła spacja przed jednostką: ${s}`);
    }
  }
});

test('nowe teksty: „zadanie budowy stacji” w linijce planu; „brak wyniku” z rokiem, datą i największą mocą', () => {
  // Zakres lat nie łamie się po myślniku (\u2060 – niewidoczny znak łączący).
  assert.ok(pl['plan.krotko'](2026, 2032).includes('2026–\u20602032') && en['plan.linia']('x', 2026, 2032).includes('2026–\u20602032'));
  assert.match(pl['plan.linia']('kwiecień 2026', 2026, 2032), /zadanie budowy stacji: 2026–\u20602032/);
  assert.match(en['plan.linia']('April 2026', 2026, 2032), /substation construction task: 2026–\u20602032/);
  assert.match(pl['plan.krotko'](2026, 2032), /zadanie budowy stacji: 2026–\u20602032/);
  assert.match(en['plan.krotko'](2026, 2032), /substation construction task: 2026–\u20602032/);
  // Wariant A (decyzja Ani 26.11.2026): skrót każdego przypisu PSE na wierzchu – w obu językach, z „(PSE)”.
  assert.equal(pl['plan.skrot.1'], '· realizacja zależy od odbiorców (PSE)');
  assert.equal(en['plan.skrot.1'], '· delivery depends on consumers (PSE)');
  for (const nr of new Set(plan.stacje.flatMap((s) => s.przypisy))) {
    for (const [nazwa, slownik] of [['PL', pl], ['EN', en]]) assert.match(slownik[`plan.skrot.${nr}`] ?? '', /^· .+ \(PSE\)$/, `${nazwa}: plan.skrot.${nr}`);
  }
  const brak = pl['szukaj.brak']('1 500 MW', '31.10.2026', '2031', '1 000 MW');
  for (const fragment of ['1 500 MW', '31.10.2026', '2031', 'Najwięcej przy jednej stacji: 1 000 MW', 'nie dodajemy']) assert.ok(brak.includes(fragment), fragment);
});

// ── Narzędzia „Gdzie” (decyzje Ani 27.11.2026): jedno pole nazwy dla PSE, PGE i Energi + podsumowanie na operatorów ──
const szukanie = json('public/data/pse-szukanie.json');
const pge = json('public/data/osd-pge.json');
const energa = json('public/data/osd-energa.json');

test('uzupełnienie SOURCE (pse-szukanie.json): każda stacja PSE ma wpis, opis PSE dosłownie, nazwy niepuste', () => {
  // Nowa stacja od Robota OSIRIS → czerwono: dopisać nazwę do szukania (i pokazać Ani do sprawdzenia).
  assert.deepEqual(Object.keys(szukanie.stacje).sort(), kody(moce.odbiorcy).sort());
  for (const s of moce.odbiorcy) {
    const w = szukanie.stacje[s.kod];
    assert.equal(w.opis_pse, s.opis_pse, `${s.kod}: opis PSE inny niż w moce-pse.json`);
    assert.ok(w.szukaj.length >= 1 && w.szukaj.every((n) => n.trim() === n && n.length > 2), s.kod);
  }
  assert.match(szukanie.opis, /Uzupełnienie SOURCE \(nie dane PSE\)/);
});

test('szukanie PSE po nazwie: mianownik z uzupełnienia SOURCE i fragment opisu PSE; bez wielkości liter i znaków', () => {
  const k = (tekst) => kody(szukajStacjiPse(moce.odbiorcy, szukanie, tekst).wyniki);
  assert.deepEqual(k('kutno'), ['WTN']);
  assert.deepEqual(k('KUTNA'), ['WTN']); // opis PSE „w rejonie Kutna”
  assert.deepEqual(k('warszawa'), ['WYP', 'REM', 'SWR']);
  assert.deepEqual(k('opole'), ['LWN', 'WRS']);
  assert.deepEqual(k('poznan'), ['ZER', 'PSC']);
  assert.deepEqual(k('gdansk'), ['DSC']); // rozwinięcie „Trójmiasto” (decyzja Ani 27.11.2026)
  assert.deepEqual(k('sopot'), ['DSC']);
  assert.deepEqual(k('lodz'), []);
  assert.deepEqual(k('plock'), []);
  assert.equal(szukajStacjiPse(moce.odbiorcy, szukanie, '  ').pusty, true);
  // Bez pliku uzupełnienia – tylko opis PSE (dopełniacz).
  assert.deepEqual(kody(szukajStacjiPse(moce.odbiorcy, null, 'kutno').wyniki), []);
});

test('linijka podsumowania: brak danych, brak, „N z M” (tylko MW), lista (nazwa)', () => {
  assert.deepEqual(wierszOperatora({ gotowe: false }, { mw: true, nazwa: false }), { rodzaj: 'brak-danych' });
  assert.deepEqual(wierszOperatora({ gotowe: true, razem: 47, pasujace: [] }, { mw: true, nazwa: false }), { rodzaj: 'brak' });
  assert.deepEqual(wierszOperatora({ gotowe: true, razem: 47, pasujace: ['A', 'B'] }, { mw: true, nazwa: false }), { rodzaj: 'liczba', n: 2, razem: 47 });
  assert.deepEqual(wierszOperatora({ gotowe: true, razem: 48, pasujace: ['Płock'], dokladne: [] }, { mw: true, nazwa: true }), {
    rodzaj: 'lista', n: 1, etykiety: ['Płock'], dokladne: [],
  });
  // PSE: pozycje to stacje (n = 3), a wymieniamy opisy (ten sam opis raz, z liczbą).
  assert.deepEqual(wierszOperatora({ gotowe: true, razem: 25, pasujace: ['WYP', 'REM', 'SWR'], etykiety: ['w rejonie Warszawy (Wypędy)', 'w rejonie Warszawy (2 stacje)'] }, { mw: false, nazwa: true }).etykiety, ['w rejonie Warszawy (Wypędy)', 'w rejonie Warszawy (2 stacje)']);
  assert.equal(pl['gdzie.liczba']('PSE', 3, 25, pl['gdzie.jednostka.stacja']), 'PSE – 3 z 25 stacji');
  assert.equal(pl['gdzie.lista.grupa']('Energa-Operator', 1, 'Płock'), 'Energa-Operator – grupa Płock');
  assert.equal(pl['gdzie.brak']('PGE Dystrybucja'), 'PGE Dystrybucja – brak');
  assert.equal(pl['gdzie.nie_sumujemy'], 'Moc nie jest sumowana między operatorami ani grupami.');
  assert.equal(en['gdzie.nie_sumujemy'], 'Capacity is not added up across operators or groups.');
});

test('podsumowanie MW (2031, każda stacja i grupa osobno): 50 / 150 / 300 MW u PSE, PGE i Energi', () => {
  const ile = (mw) => [filtrujStacje(moce.odbiorcy, mw).length, filtrujGrupy(pge.grupy, mw, 2031).length, filtrujGrupy(energa.grupy, mw, 2031).length];
  assert.deepEqual(ile(50), [25, 15, 34]);
  assert.deepEqual(ile(150), [21, 3, 12]);
  assert.deepEqual(ile(300), [16, 0, 0]);
});
