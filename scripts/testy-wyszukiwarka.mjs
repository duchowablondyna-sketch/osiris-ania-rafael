// E1 „Planuję inwestycję” (decyzje Ani 26.11.2026): testy pola „Ile MW potrzebujesz?” i danych z projektu planu
// rozwoju sieci PSE. Uruchom: node --test scripts/testy-wyszukiwarka.mjs (także w npm run sprawdz).
// Dane prawdziwe: public/data/moce-pse.json, rozdzielnie-pse.json, plan-rozwoju-pse.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pl from '../src/teksty/pl.js';
import en from '../src/teksty/en.js';
import { czytajMw, filtrujStacje, najwiekszaMoc, terminPlanu, wKolejnosciPse } from '../src/wyszukiwarka-mocy.js';

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

// Nowe teksty E1 (klucze szukaj.*, plan.* i nowe slownik.*).
const NOWE = (s) => Object.keys(s).filter((k) => /^(szukaj|plan)\.|^slownik\.(zakonczenie|ure)/.test(k));
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
