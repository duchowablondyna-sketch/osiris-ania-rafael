// Testy napisów panelu Karty Polski (src/karta-teksty.js) – wbudowany w Node moduł node:test (bez pakietów).
// Uruchom: node --test scripts/karta/testy-panel.mjs
// Dane: karta zbudowana z prawdziwej próbki PSE (doba 2026-11-20, kwadrans 12:15–12:30 – najnowszy pełny w próbce).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zbudujKarte } from './licz.mjs';
import { tekstyKarty, tekstCeny, PROG_STARYCH_H } from '../../src/karta-teksty.js';

const PROBKA = JSON.parse(readFileSync(new URL('./testy/pse-2026-11-20-1200.json', import.meta.url), 'utf-8'));
const karta = () => zbudujKarte(structuredClone(PROBKA['his-gen-pal-sire']), structuredClone(PROBKA['his-wlk-cal']), '2026-11-20T12:30:00.000Z');
const GODZ = 3_600_000;
// „Teraz” w testach: tego samego dnia, godzinę po końcu kwadransu z próbki.
const terazPo = (k, godziny) => Date.parse(k.kwadrans.koniec_utc) + godziny * GODZ;

// Ta sama doba co próbka: kwadrans 13:00–13:15 czasu polskiego = 12:15Z koniec.
const RCE = {
  doby: {
    '2026-11-20': [
      { okres: '13:00 - 13:15', koniec_utc: '2026-11-20T12:15:00Z', cena: 612.4 },
      { okres: '13:15 - 13:30', koniec_utc: '2026-11-20T12:30:00Z', cena: -5 },
    ],
  },
};

test('próbka: kwadrans, z którego panel bierze liczby', () => {
  const k = karta();
  assert.equal(k.kwadrans.okres, '12:15 - 12:30');
  assert.equal(k.plakietka, null);
});

test('liczba-bohater = węgiel razem, pełny procent; zdanie i podpis', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.equal(t.ok, true);
  assert.equal(t.bohater.grupa, 'wegiel');
  assert.equal(t.bohater.procent, `${Math.round(k.wegiel_udzial * 100)}%`);
  assert.equal(t.bohater.zdanie, 'prądu w Polsce pochodzi z węgla');
  // Próbka: doba 20.11 uzupełniona przez PSE w nocy – publikacja 21.11, 02:52 (ZRODLA.md), więc z datą.
  assert.equal(t.podpis, 'z produkcji w Polsce · stan na 12:30 · PSE opublikowało 21.11, 02:52');
  assert.equal(t.plakietka, null);
});

test('liczba-bohater = OZE, gdy OZE więcej niż węgla; przy remisie węgiel', () => {
  const k = karta();
  k.oze_udzial = 0.5234;
  k.wegiel_udzial = 0.31;
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.equal(t.bohater.grupa, 'oze');
  assert.equal(t.bohater.procent, '52%');
  assert.equal(t.bohater.zdanie, 'prądu w Polsce pochodzi z OZE (źródeł odnawialnych)');
  assert.match(t.skrot, /^52% z OZE · stan na 12:30$/);
  k.oze_udzial = k.wegiel_udzial;
  assert.equal(tekstyKarty(k, RCE, terazPo(k, 1)).bohater.grupa, 'wegiel');
});

test('pasek: 4 grupy w kolejności, 1 miejsce po przecinku, liczby = karta.json', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.deepEqual(t.pasek.map((p) => p.grupa), ['kamienny', 'brunatny', 'gaz_i_inne', 'oze']);
  for (const p of t.pasek) {
    assert.equal(p.udzial, k.grupy[p.grupa].udzial);
    assert.equal(p.tekst, `${(k.grupy[p.grupa].udzial * 100).toFixed(1).replace('.', ',')}%`);
  }
  // Suma udziałów ≈ 1 (zaokrąglenia w karta.json do 4 miejsc).
  assert.ok(Math.abs(t.pasek.reduce((s, p) => s + p.udzial, 0) - 1) < 0.001);
});

test('ślad CO2: „ok. … g/kWh” z dziesiątek; dokładnie tylko w Metodologii', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.equal(t.co2.wartosc, `ok. ${k.co2.g_kwh_ok} g/kWh`);
  assert.equal(t.co2.opis, 'szacunek OSIRIS');
  assert.equal(t.metodologia.co2, `${k.co2.g_kwh.toFixed(1).replace('.', ',')} g/kWh`);
});

test('wymiana: znak z opisu PSE (+ kupuje, − sprzedaje), zaokrąglenie do dziesiątek, „planowo”', () => {
  const k = karta();
  k.wymiana.saldo_mw = -585.6;
  assert.deepEqual(tekstyKarty(k, RCE, terazPo(k, 1)).wymiana, { wartosc: 'sprzedaje ok. 590 MW', opis: 'planowo' });
  k.wymiana.saldo_mw = 1225.1;
  assert.deepEqual(tekstyKarty(k, RCE, terazPo(k, 1)).wymiana, { wartosc: 'kupuje ok. 1230 MW', opis: 'planowo' });
  k.wymiana.saldo_mw = 3.9;
  assert.equal(tekstyKarty(k, RCE, terazPo(k, 1)).wymiana.wartosc, 'ok. 0 MW');
});

test('cena RCE: bieżący kwadrans z własną godziną; poza dobą – brak danych, nigdy zero', () => {
  const t = Date.parse('2026-11-20T12:05:00Z'); // 13:05 czasu polskiego
  assert.deepEqual(tekstCeny(RCE, t), { ok: true, wartosc: '612,40 zł/MWh', opis: '13:00–13:15' });
  assert.equal(tekstCeny(RCE, Date.parse('2026-11-20T12:20:00Z')).wartosc, '-5,00 zł/MWh');
  assert.equal(tekstCeny(RCE, Date.parse('2026-11-21T12:05:00Z')).wartosc, 'brak danych na dziś');
  assert.equal(tekstCeny(null, t).wartosc, 'brak danych PSE');
});

test(`plakietka: dane starsze niż ${PROG_STARYCH_H} h – tak; młodsze – nie`, () => {
  const k = karta();
  assert.equal(tekstyKarty(k, RCE, terazPo(k, PROG_STARYCH_H - 0.1)).plakietka, null);
  assert.equal(
    tekstyKarty(k, RCE, terazPo(k, PROG_STARYCH_H + 0.1)).plakietka,
    'Dane sprzed ponad 6 godzin. Pokazujemy stan na 20.11, 12:30.',
  );
});

test('plakietka z budowania (sprawdzian / PSE nie odpowiedziało) ma pierwszeństwo', () => {
  const k = karta();
  k.plakietka = 'nowe dane nie przeszły sprawdzianu';
  assert.equal(
    tekstyKarty(k, RCE, terazPo(k, 1)).plakietka,
    'Dane nie są najnowsze: nowe dane nie przeszły sprawdzianu. Pokazujemy stan na 20.11, 12:30.',
  );
  k.plakietka = 'nie udało się pobrać nowych danych PSE';
  assert.match(tekstyKarty(k, RCE, terazPo(k, 10)).plakietka, /^Dane nie są najnowsze: nie udało się pobrać nowych danych PSE\./);
});

test('stan z innego dnia ma datę', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 12)); // 20.11 12:30 + 12 h = 21.11 00:30 czasu polskiego
  assert.match(t.podpis, /stan na 20\.11, 12:30/);
});

test('brak danych: plik się nie wczytał, „blad” w karta.json albo zły układ – bez liczb, cena działa dalej', () => {
  const t = Date.parse('2026-11-20T12:05:00Z');
  const brak = tekstyKarty(null, RCE, t);
  assert.equal(brak.ok, false);
  assert.equal(brak.plakietka, 'Brak danych PSE o miksie.');
  assert.equal(brak.cena.wartosc, '612,40 zł/MWh');
  assert.equal(brak.bohater, undefined);
  const blad = tekstyKarty({ wersja: 1, czas_pobrania: '2026-11-20T12:30:00Z', plakietka: 'nie udało się pobrać nowych danych PSE', blad: 'brak danych' }, null, t);
  assert.equal(blad.plakietka, 'Brak danych o miksie: nie udało się pobrać nowych danych PSE.');
  assert.equal(blad.cena.wartosc, 'brak danych PSE');
  assert.equal(tekstyKarty({ wersja: 2 }, RCE, t).ok, false);
});
