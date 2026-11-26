// Testy napisów okienka „Wiatr, słońce i cena prądu” (src/pse-teksty.js, Etap C3) – wbudowany w Node moduł node:test.
// Uruchom: node --test scripts/testy-pse.mjs
// Próbka: prawdziwe ceny RCE z doby 25.11.2026 (scripts/testy-pse/rce-2026-11-25.json, kopia public/data/rce.json).
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wniosekCeny, tekstOgraniczenia, pelnaDoba, formatCeny } from '../src/pse-teksty.js';
import { ustawJezyk } from '../src/jezyk.js';
import pl from '../src/teksty/pl.js';
import en from '../src/teksty/en.js';

const RCE = JSON.parse(readFileSync(new URL('./testy-pse/rce-2026-11-25.json', import.meta.url), 'utf-8'));
const DOBA = '2026-11-25';
const TERAZ = Date.parse('2026-11-25T07:10:00Z'); // 08:10 czasu polskiego
const NBSP = '\u00a0';
const kopia = () => structuredClone(RCE);
afterEach(() => ustawJezyk('pl'));

// Doba z dowolnymi cenami: kwadranse od północy do północy czasu polskiego (start = północ w UTC, ile = liczba kwadransów).
function doba(startUtc, ceny) {
  const dwa = (n) => String(n).padStart(2, '0');
  return ceny.map((cena, i) => {
    const od = i * 15, doMin = od + 15;
    const g = (m) => `${dwa(Math.floor(m / 60))}:${dwa(m % 60)}`;
    return { okres: `${g(od)} - ${g(doMin)}`, koniec_utc: new Date(Date.parse(startUtc) + doMin * 60_000).toISOString().replace('.000', ''), cena };
  });
}
const zwykla = (ceny) => ({ doby: { [DOBA]: doba('2026-11-24T23:00:00Z', ceny) } });
const stale = (n, c) => Array.from({ length: n }, () => c);

test('próbka 25.11.2026: zdanie A + B dokładnie (PL), liczby z danych', () => {
  const w = wniosekCeny(kopia(), TERAZ);
  assert.equal(
    w.tekst,
    `Dziś najtańszy kwadrans: 00:00–00:15 (817,96${NBSP}zł/MWh), najdroższy: 15:45–16:00 (3005,10${NBSP}zł/MWh). ` +
      'Najdroższy kwadrans doby kosztuje 3,7 razy więcej niż najtańszy.',
  );
  assert.equal(w.razy, 3.7);
});

test('próbka 25.11.2026: zdanie po angielsku', () => {
  ustawJezyk('en');
  assert.equal(
    wniosekCeny(kopia(), TERAZ).tekst,
    `Today's cheapest quarter-hour: 00:00–00:15 (817.96${NBSP}PLN/MWh), most expensive: 15:45–16:00 (3,005.10${NBSP}PLN/MWh). ` +
      'The most expensive quarter-hour of the day costs 3.7 times as much as the cheapest.',
  );
});

test('liczby w zdaniu = podpisy „maks./min.” wykresu (ta sama funkcja zapisu)', () => {
  const ceny = RCE.doby[DOBA].map((p) => p.cena);
  const w = wniosekCeny(kopia(), TERAZ);
  assert.equal(w.min, formatCeny(Math.min(...ceny)));
  assert.equal(w.maks, formatCeny(Math.max(...ceny)));
  assert.ok(w.tekst.includes(`(${w.min}${NBSP}`) && w.tekst.includes(`(${w.maks}${NBSP}`));
});

test('najniższa cena 0 albo ujemna → bez części „razy”; ujemna z minusem', () => {
  const zero = stale(96, 500); zero[40] = 0;
  const w0 = wniosekCeny(zwykla(zero), TERAZ);
  assert.ok(!/razy/.test(w0.tekst));
  assert.match(w0.tekst, /najtańszy kwadrans: 10:00–10:15 \(0,00\u00a0zł\/MWh\)/);
  const ujemna = stale(96, 500); ujemna[52] = -120.5;
  const wu = wniosekCeny(zwykla(ujemna), TERAZ);
  assert.ok(!/razy/.test(wu.tekst));
  assert.match(wu.tekst, /13:00–13:15 \(-120,50\u00a0zł\/MWh\)/);
});

test('iloraz poniżej 1,1 → bez części „razy”; 1,1 → jest', () => {
  const blisko = stale(96, 1000); blisko[10] = 1040; // 1,04 → 1,0
  assert.ok(!/razy/.test(wniosekCeny(zwykla(blisko), TERAZ).tekst));
  const prog = stale(96, 1000); prog[10] = 1100; // 1,1
  assert.match(wniosekCeny(zwykla(prog), TERAZ).tekst, /kosztuje 1,1 razy więcej/);
});

test('remis: najwcześniejszy kwadrans + „i N inne” z odmianą (PL i EN)', () => {
  const dwa = stale(96, 500); dwa[4] = 100; dwa[50] = 100; dwa[70] = 900;
  assert.match(wniosekCeny(zwykla(dwa), TERAZ).tekst, /najtańszy kwadrans: 01:00–01:15 i 1 inny \(100,00/);
  const trzy = stale(96, 500); trzy[4] = 100; trzy[50] = 100; trzy[60] = 100; trzy[70] = 900;
  assert.match(wniosekCeny(zwykla(trzy), TERAZ).tekst, /01:00–01:15 i 2 inne \(/);
  const szesc = stale(96, 500); for (const i of [4, 8, 12, 16, 20, 24]) szesc[i] = 100; szesc[70] = 900;
  assert.match(wniosekCeny(zwykla(szesc), TERAZ).tekst, /01:00–01:15 i 5 innych \(/);
  ustawJezyk('en');
  assert.match(wniosekCeny(zwykla(dwa), TERAZ).tekst, /01:00–01:15 and 1 other \(/);
  assert.match(wniosekCeny(zwykla(trzy), TERAZ).tekst, /01:00–01:15 and 2 others \(/);
});

test('brakujący kwadrans albo cena bez liczby → brak zdania', () => {
  const r = kopia(); r.doby[DOBA].splice(30, 1);
  assert.equal(wniosekCeny(r, TERAZ), null);
  const r2 = kopia(); r2.doby[DOBA][30].cena = null;
  assert.equal(wniosekCeny(r2, TERAZ), null);
  const r3 = kopia(); r3.doby[DOBA].pop(); // bez 23:45–24:00
  assert.equal(wniosekCeny(r3, TERAZ), null);
});

test('zmiana czasu: doba 100 i 92 kwadransów → zdanie jest', () => {
  // Etykiety z pomocnika liczą minuty od północy, więc ostatni kwadrans dostaje etykietę PSE „23:45 - 24:00”.
  const jesien = { doby: { '2026-10-25': doba('2026-10-24T22:00:00Z', stale(100, 400).map((c, i) => c + i)) } };
  jesien.doby['2026-10-25'].at(-1).okres = '23:45 - 24:00';
  assert.equal(pelnaDoba(jesien.doby['2026-10-25'], '2026-10-25')?.length, 100);
  assert.ok(wniosekCeny(jesien, Date.parse('2026-10-25T10:00:00Z')));
  const wiosna = { doby: { '2026-03-29': doba('2026-03-28T23:00:00Z', stale(92, 400).map((c, i) => c + i)) } };
  wiosna.doby['2026-03-29'].at(-1).okres = '23:45 - 24:00';
  assert.ok(wniosekCeny(wiosna, Date.parse('2026-03-29T10:00:00Z')));
});

test('w pliku tylko inna doba (wczoraj albo jutro) → brak zdania; brak pliku → brak zdania', () => {
  const r = kopia();
  assert.equal(wniosekCeny(r, Date.parse('2026-11-26T07:10:00Z')), null);
  assert.equal(wniosekCeny(r, Date.parse('2026-11-24T07:10:00Z')), null);
  assert.equal(wniosekCeny(null, TERAZ), null);
});

test('ograniczenie: data, MWh i kwadranse z danych, twarde spacje, bez „polecenie”', () => {
  const ogr = { doba: '2026-11-21', mwh: 150, kwadranse: 2 };
  const w = tekstOgraniczenia(ogr);
  assert.equal(w.ok, true);
  assert.equal(w.tekst, `Ostatnie ograniczenie wiatru w raporcie PSE: doba 21.11.2026 – ok.${NBSP}150${NBSP}MWh (2${NBSP}kwadranse)`);
  assert.match(tekstOgraniczenia({ ...ogr, kwadranse: 1 }).tekst, /\(1\u00a0kwadrans\)$/);
  assert.match(tekstOgraniczenia({ ...ogr, kwadranse: 5, mwh: 1250 }).tekst, /ok\.\u00a01250\u00a0MWh \(5\u00a0kwadransów\)$/);
  ustawJezyk('en');
  assert.equal(tekstOgraniczenia(ogr).tekst, `Latest wind curtailment in the PSE report: 21 Nov 2026 – approx.${NBSP}150${NBSP}MWh (2${NBSP}quarter-hours)`);
  for (const s of [pl, en]) for (const k of ['mapa.ograniczenie_etykieta', 'mapa.ograniczenie_brak']) assert.ok(!/polecenie|order/i.test(s[k]), k);
});

test('ograniczenie: doba jutrzejsza – to samo neutralne zdanie (bez czasownika w czasie przeszłym)', () => {
  const w = tekstOgraniczenia({ doba: '2026-11-26', mwh: 75, kwadranse: 1 });
  assert.equal(w.tekst, `Ostatnie ograniczenie wiatru w raporcie PSE: doba 26.11.2026 – ok.${NBSP}75${NBSP}MWh (1${NBSP}kwadrans)`);
});

test('ograniczenie: brak liczby albo doby → „brak danych PSE” (ok: false – strona nie podpina objaśnień)', () => {
  for (const ogr of [null, { mwh: null, blad: 'HTTP 500' }, { doba: '2026-11-21' }, { mwh: 150 }]) {
    const w = tekstOgraniczenia(ogr);
    assert.equal(w.ok, false);
    assert.equal(w.tekst, pl['mapa.ograniczenie_brak']);
  }
  // Bez liczby kwadransów – zdanie bez nawiasu.
  assert.equal(tekstOgraniczenia({ doba: '2026-11-21', mwh: 150 }).tekst, `Ostatnie ograniczenie wiatru w raporcie PSE: doba 21.11.2026 – ok.${NBSP}150${NBSP}MWh`);
});

test('F1 okienka: obie części ograniczenia, MW i MWh – PL i EN; nazwy rubryk PSE w części PSE; MWh jako wniosek OSIRIS', () => {
  for (const s of [pl, en]) {
    for (const k of ['slownik.ograniczenie_termin', 'slownik.ograniczenie_pse', 'slownik.ograniczenie_zrodlo', 'slownik.ograniczenie_osiris', 'slownik.mw_mwh_termin', 'slownik.mw_mwh']) {
      assert.equal(typeof s[k], 'string', k);
    }
  }
  assert.ok(pl['slownik.ograniczenie_pse'].includes('„Nierynkowe redysponowanie źródeł OZE”'));
  assert.ok(pl['slownik.ograniczenie_pse'].includes('„Bilansowanie KSE”') && pl['slownik.ograniczenie_pse'].includes('„Zarządzanie ograniczeniami systemowymi”'));
  assert.ok(en['slownik.ograniczenie_pse'].includes('“Non-market redispatch of RES resources”'));
  assert.ok(en['slownik.ograniczenie_pse'].includes('“Balancing of Polish Power System”') && en['slownik.ograniczenie_pse'].includes('“System constraints management”'));
  // Część PSE bez interpretacji przyczyny; przeliczenie na MWh – tylko w części OSIRIS.
  assert.ok(!/MWh|sieć nie może|nie może przyjąć/.test(pl['slownik.ograniczenie_pse']));
  assert.match(pl['slownik.ograniczenie_osiris'], /MWh to przeliczenie SOURCE/);
  assert.match(en['slownik.ograniczenie_osiris'], /SOURCE converted it to MWh/);
  assert.match(pl['slownik.mw_mwh'], /1 MW przez godzinę = 1 MWh/);
  // Słowo z F1 stoi w linijce, przy której jest podpinane.
  assert.ok(pl['mapa.ograniczenie']('21.11.2026', '150', null).includes(pl['slownik.ograniczenie_termin']));
  assert.ok(en['mapa.ograniczenie']('21 Nov 2026', '150', null).includes(en['slownik.ograniczenie_termin']));
});
