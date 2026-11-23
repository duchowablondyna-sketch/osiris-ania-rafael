// Testy miejsca okienka C (src/okienko-pozycja.js) – wbudowany w Node moduł node:test (bez pakietów).
// Uruchom: node --test scripts/testy-okienko.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wybierzPozycje } from '../src/okienko-pozycja.js';

const EKRAN = { left: 0, top: 0, right: 1440, bottom: 900 };
const OKNO = { w: 240, h: 200 };
// Panele jak na /mapa/ przy 1440×900: okienko PSE (lewa góra), Karta Polski (lewy dół), legenda (prawo).
const PSE = { left: 16, top: 16, right: 376, bottom: 236 };
const KARTA = { left: 16, top: 250, right: 436, bottom: 844 };
const LEGENDA = { left: 1130, top: 80, right: 1430, bottom: 852 };
const PANELE = [PSE, KARTA, LEGENDA];

const prost = (p, o = OKNO) => ({ left: p.left, top: p.top, right: p.left + o.w, bottom: p.top + o.h });
const nachodzi = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const naEkranie = (r) => r.left >= EKRAN.left && r.top >= EKRAN.top && r.right <= EKRAN.right && r.bottom <= EKRAN.bottom;
const zawiera = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

test('wolne miejsce: okienko w prawo w dół od kursora', () => {
  assert.deepEqual(wybierzPozycje({ x: 700, y: 400 }, OKNO, EKRAN, PANELE), { left: 714, top: 414 });
});

test('przy prawej krawędzi: okienko przechodzi na lewą stronę, w całości na ekranie', () => {
  const r = prost(wybierzPozycje({ x: 1430, y: 30 }, OKNO, EKRAN, []));
  assert.ok(naEkranie(r));
  assert.ok(r.right <= 1430, 'nie przykrywa kursora');
});

test('przy dolnej krawędzi: okienko nad kursorem', () => {
  const r = prost(wybierzPozycje({ x: 700, y: 890 }, OKNO, EKRAN, []));
  assert.ok(naEkranie(r));
  assert.ok(r.bottom <= 890);
});

test('kropka tuż obok Karty Polski: okienko nie wchodzi na panel, gdy jest miejsce obok', () => {
  for (const punkt of [{ x: 450, y: 600 }, { x: 440, y: 300 }, { x: 390, y: 120 }]) {
    const r = prost(wybierzPozycje(punkt, OKNO, EKRAN, PANELE));
    assert.ok(naEkranie(r));
    for (const p of PANELE) assert.ok(!nachodzi(r, p), `nachodzi na panel przy punkcie ${JSON.stringify(punkt)}`);
  }
});

test('kropka przy legendzie (prawa strona): okienko po lewej, nie na legendzie', () => {
  const r = prost(wybierzPozycje({ x: 1120, y: 500 }, OKNO, EKRAN, PANELE));
  assert.ok(!nachodzi(r, LEGENDA));
});

test('nie ma miejsca bez panelu: okienko i tak na ekranie i nie przykrywa punktu', () => {
  const caly = [{ left: 0, top: 0, right: 1440, bottom: 900 }];
  const r = prost(wybierzPozycje({ x: 200, y: 400 }, OKNO, EKRAN, caly));
  assert.ok(naEkranie(r));
  assert.ok(!zawiera(r, 200, 400));
});

test('okienko wyższe niż ekran: przyklejone do górnego marginesu', () => {
  const p = wybierzPozycje({ x: 700, y: 300 }, { w: 240, h: 2000 }, EKRAN, []);
  assert.equal(p.top, 8);
});
