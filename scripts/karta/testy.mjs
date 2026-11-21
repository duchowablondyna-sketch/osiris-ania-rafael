// Testy Karty Polski – wbudowany w Node moduł node:test (bez pakietów).
// Uruchom: node --test scripts/karta/testy.mjs
// Próbka: prawdziwe odpowiedzi API PSE (doba 2026-11-20, kwadranse 12:00–12:15 i 12:15–12:30).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { liczba, grupujMiks, sprawdzian, wybierzKwadrans, policz, zbudujKarte, wygladaJakKarta, BladSprawdzianu, PALIWA } from './licz.mjs';

const PROBKA = JSON.parse(readFileSync(new URL('./testy/pse-2026-11-20-1200.json', import.meta.url), 'utf-8'));
const miks = () => structuredClone(PROBKA['his-gen-pal-sire']);
const wlk = () => structuredClone(PROBKA['his-wlk-cal']);
const CZAS = '2026-11-21T17:00:00.000Z';
const kwadrans1200 = (rekordy) => rekordy.filter((r) => r.period === '12:00 - 12:15');

test('próbka: 15 kodów w każdym z 2 kwadransów, 2 rekordy his-wlk-cal', () => {
  assert.equal(PROBKA['his-gen-pal-sire'].length, 30);
  assert.equal(PROBKA['his-wlk-cal'].length, 2);
  assert.equal(Object.keys(PALIWA).length, 15);
});

test('liczba: przecinek → kropka; liczby bez zmian; reszta to błąd danych', () => {
  assert.equal(liczba('7556,431'), 7556.431);
  assert.equal(liczba('0,000'), 0);
  assert.equal(liczba('-12,5'), -12.5);
  assert.equal(liczba('116'), 116);
  assert.equal(liczba(3174.204), 3174.204);
  for (const zle of ['1 234,5', '1.234,5', '', null, undefined, 'abc', '12,', NaN]) {
    assert.throws(() => liczba(zle), BladSprawdzianu, `powinno odrzucić ${JSON.stringify(zle)}`);
  }
});

test('sprawdzian na prawdziwych danych: WI+WM = wi i ES = pv (oba kwadranse)', () => {
  const s = sprawdzian(grupujMiks(miks()), wlk());
  assert.equal(s.ok, true, s.bledy.join('; '));
  assert.equal(s.porownane, 2);
  assert.ok(s.maks_roznica_mw < 0.01, `różnica ${s.maks_roznica_mw}`);
});

test('ręczne liczby z PSE (12:00–12:15): 2591,804 + 582,400 = 3174,204 = wi; ES 3853,504 = pv', () => {
  const k = grupujMiks(miks()).get('2026-11-20 11:15:00');
  assert.equal(k.kody.WI, 2591.804);
  assert.equal(k.kody.WM, 582.4);
  assert.equal(k.kody.ES, 3853.504);
  const w = wlk().find((r) => r.period === '12:00 - 12:15');
  assert.equal(w.wi, 3174.204);
  assert.equal(w.pv, 3853.504);
});

test('sprawdzian: wiatr różni się o 5 MW → nie przechodzi', () => {
  const w = wlk();
  w[0].wi += 5;
  const s = sprawdzian(grupujMiks(miks()), w);
  assert.equal(s.ok, false);
  assert.ok(s.bledy.some((b) => b.includes('wiatr')));
});

test('sprawdzian: PV różni się o 2 MW → nie przechodzi; o 0,5 MW → przechodzi', () => {
  const w = wlk();
  w[0].pv += 2;
  assert.equal(sprawdzian(grupujMiks(miks()), w).ok, false);
  const w2 = wlk();
  w2[0].pv += 0.5;
  assert.equal(sprawdzian(grupujMiks(miks()), w2).ok, true);
});

test('sprawdzian: kwadrans tylko w miksie (nowszy niż his-wlk-cal) nie jest błędem', () => {
  const w = wlk().filter((r) => r.period === '12:00 - 12:15');
  const s = sprawdzian(grupujMiks(miks()), w);
  assert.equal(s.ok, true);
  assert.equal(s.porownane, 1);
});

test('sprawdzian: brak wspólnych kwadransów → nie przechodzi', () => {
  assert.equal(sprawdzian(grupujMiks(miks()), []).ok, false);
});

test('nieznany kod PSE, zmieniony kod ENTSO-E albo podwójny kod → błąd danych', () => {
  const a = miks();
  a[0].alias_sire = 'XX';
  assert.throws(() => grupujMiks(a), /nieznany kod/);
  const b = miks();
  b.find((r) => r.alias_sire === 'WK').alias_entsoe = 'B02';
  assert.throws(() => grupujMiks(b), /ENTSO-E/);
  const c = miks();
  c.push(structuredClone(c[0]));
  assert.throws(() => grupujMiks(c), /podwójny/);
});

test('wybór kwadransu: najnowszy pełny; bez kodu WS w najnowszym → wcześniejszy', () => {
  assert.equal(wybierzKwadrans(grupujMiks(miks()), wlk()).wlk.period, '12:15 - 12:30');
  const m = miks().filter((r) => !(r.period === '12:15 - 12:30' && r.alias_sire === 'WS'));
  assert.equal(wybierzKwadrans(grupujMiks(m), wlk()).wlk.period, '12:00 - 12:15');
});

test('wybór kwadransu: brak salda w his-wlk-cal → wcześniejszy kwadrans', () => {
  const w = wlk();
  w.find((r) => r.period === '12:15 - 12:30').swm_np = null;
  assert.equal(wybierzKwadrans(grupujMiks(miks()), w).wlk.period, '12:00 - 12:15');
});

test('liczby karty (12:00–12:15) zgodne z obliczeniem ręcznym', () => {
  const m = grupujMiks(kwadrans1200(miks()));
  const k = policz(wybierzKwadrans(m, wlk()));
  // Produkcja = suma 14 kodów bez WS (WS = 0 w tym kwadransie): 22 755,8 MW
  assert.equal(k.produkcja_mw, 22755.8);
  // Węgiel: (7556,431 + 4615,763) / 22755,810 = 53,49%
  assert.equal(k.wegiel_udzial, 0.5349);
  // OZE: WI+WM+ES+WP+WZ+BM+BG = 7607,624 / 22755,810 = 33,43%
  assert.equal(k.oze_udzial, 0.3343);
  const suma = Object.values(k.grupy).reduce((s, g) => s + g.udzial, 0);
  assert.ok(Math.abs(suma - 1) < 0.001, `udziały grup sumują się do ${suma}`);
  // Σ(MW × g/kWh) / produkcja – przeliczone niezależnie w Pythonie: 554,1
  assert.equal(k.co2.g_kwh, 554.1);
  assert.equal(k.co2.g_kwh_ok, 550);
  assert.equal(k.kwadrans.koniec_utc, '2026-11-20T11:15:00Z');
  assert.equal(k.kwadrans.publikacja, '2026-11-21 02:52:10.519');
});

test('wymiana: swm_p + swm_np; + to zakup, − to sprzedaż (konwencja PSE)', () => {
  const m = grupujMiks(kwadrans1200(miks()));
  const k = policz(wybierzKwadrans(m, wlk()));
  assert.equal(k.wymiana.saldo_mw, 1225.1); // 1093,4 + 131,714
  assert.equal(k.wymiana.kierunek, 'kupuje');
  const w = wlk();
  for (const r of w) { r.swm_p = -660.3; r.swm_np = 175.299; }
  const k2 = policz(wybierzKwadrans(m, w));
  assert.equal(k2.wymiana.saldo_mw, -485);
  assert.equal(k2.wymiana.kierunek, 'sprzedaje');
});

test('bilans informacyjny: produkcja + saldo ≈ zapotrzebowanie PSE (różnica poniżej 1%)', () => {
  const k = policz(wybierzKwadrans(grupujMiks(kwadrans1200(miks())), wlk()));
  assert.ok(Math.abs(k.bilans.roznica_mw) < k.bilans.zapotrzebowanie_mw * 0.01, JSON.stringify(k.bilans));
});

test('zbudujKarte: całość przechodzi i ma układ, który rozpozna kolejne budowanie', () => {
  const karta = zbudujKarte(miks(), wlk(), CZAS);
  assert.equal(karta.plakietka, null);
  assert.equal(karta.sprawdzian.ok, true);
  assert.equal(wygladaJakKarta(karta), true);
  assert.equal(wygladaJakKarta(JSON.parse(JSON.stringify(karta))), true);
});

test('zbudujKarte: niezgodny wiatr → BladSprawdzianu (wtedy zostają poprzednie dane)', () => {
  const w = wlk();
  w[1].wi = 0;
  assert.throws(() => zbudujKarte(miks(), w, CZAS), BladSprawdzianu);
});

test('wygladaJakKarta: odrzuca brak danych, inną wersję i obcy plik', () => {
  assert.equal(wygladaJakKarta(null), false);
  assert.equal(wygladaJakKarta({ wersja: 1, blad: 'brak danych' }), false);
  const k = zbudujKarte(miks(), wlk(), CZAS);
  assert.equal(wygladaJakKarta({ ...k, wersja: 2 }), false);
  assert.equal(wygladaJakKarta({ value: [] }), false);
});
