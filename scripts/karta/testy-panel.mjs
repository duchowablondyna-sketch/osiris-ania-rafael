// Testy napisów panelu Karty Polski (src/karta-teksty.js) – wbudowany w Node moduł node:test (bez pakietów).
// Uruchom: node --test scripts/karta/testy-panel.mjs
// Dane: karta zbudowana z prawdziwej próbki PSE (doba 2026-11-20, kwadrans 12:15–12:30 – najnowszy pełny w próbce).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zbudujKarte } from './licz.mjs';
import { tekstyKarty, cenaMiksu, PROG_STARYCH_H, PODZIAL_OZE, PASKI_MOCY, procent0, wiatrISlonce, tekstZapotrzebowania } from '../../src/karta-teksty.js';
import { ustawJezyk } from '../../src/jezyk.js';
import { wypelnij } from '../jezyki.mjs';

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
  assert.equal(t.bohater.zdanie, 'prądu w Polsce pochodziło z węgla'); // czas przeszły (odbiór C2)
  // Próbka: doba 20.11 uzupełniona przez PSE w nocy – publikacja 21.11, 02:52 (ZRODLA.md), więc z datą.
  assert.equal(t.podpis, 'w kwadransie 12:15–12:30 · z produkcji w Polsce · stan na 12:30 · PSE opublikowało 21.11, 02:52');
  assert.equal(t.plakietka, null);
});

test('liczba-bohater = OZE, gdy OZE więcej niż węgla; przy remisie węgiel', () => {
  const k = karta();
  k.oze_udzial = 0.5234;
  k.wegiel_udzial = 0.31;
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.equal(t.bohater.grupa, 'oze');
  assert.equal(t.bohater.procent, '52%');
  assert.equal(t.bohater.zdanie, 'prądu w Polsce pochodziło z OZE (źródeł odnawialnych)');
  assert.match(t.skrot, /^52% z OZE · PSE, stan na 12:30$/);
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

// W ekwiwalencie CO2 (CO₂eq) – mediany IPCC są w ekwiwalencie (decyzja Ani 23.11.2026).
test('ślad CO2: „ok. … g CO₂eq/kWh” z dziesiątek; dokładnie tylko w Metodologii', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.equal(t.co2.wartosc, `ok. ${k.co2.g_kwh_ok} g CO₂eq/kWh`);
  assert.equal(t.co2.opis, 'szacunek OSIRIS');
  assert.equal(t.metodologia.co2, `${k.co2.g_kwh.toFixed(1).replace('.', ',')} g CO₂eq/kWh`);
});

// Wersja angielska (/en/map/): te same liczby, słowniczek z src/teksty/en.js, formaty en-GB.
test('wersja EN: liczba-bohater, ślad CO2, wymiana planowa i podpis – po angielsku, z tymi samymi liczbami', () => {
  ustawJezyk('en');
  try {
    const k = karta();
    const t = tekstyKarty(k, RCE, terazPo(k, 1));
    assert.equal(t.bohater.zdanie, "of Poland's electricity came from coal");
    assert.equal(t.co2.wartosc, `approx. ${k.co2.g_kwh_ok} g CO₂eq/kWh`);
    assert.equal(t.co2.opis, 'OSIRIS estimate');
    assert.equal(t.metodologia.co2, `${k.co2.g_kwh.toFixed(1)} g CO₂eq/kWh`);
    assert.match(t.wymiana.wartosc, /^(importing|exporting) approx\. \d+\.\d\u00a0GW$|^approx\. 0\u00a0GW$/);
    // Etap C2: „scheduled” stoi w nagłówku kafelka – pod liczbą już nie.
    assert.ok(/scheduled/.test(en['karta.wymiana']) && !/scheduled/.test(t.wymiana.opis), t.wymiana.opis);
    assert.match(t.podpis, /^in the quarter-hour 12:15–12:30 · of generation in Poland · as of 12:30 · published by PSE at 21 Nov, 02:52$/);
    assert.deepEqual(PODZIAL_OZE.map((r) => r.nazwa), ['onshore wind', 'offshore wind', 'solar', 'hydro', 'biomass and other renewables']);
    for (const p of t.pasek) assert.match(p.tekst, /^\d+\.\d%$/);
  } finally {
    ustawJezyk('pl');
  }
});

test('wymiana: znak z opisu PSE (+ kupuje, − sprzedaje), w GW z jednym miejscem po przecinku (jak produkcja)', () => {
  const k = karta();
  k.wymiana.saldo_mw = -585.6;
  assert.deepEqual(tekstyKarty(k, RCE, terazPo(k, 1)).wymiana, { wartosc: 'sprzedaje ok. 0,6\u00a0GW', opis: '' });
  k.wymiana.saldo_mw = 1557.9;
  assert.deepEqual(tekstyKarty(k, RCE, terazPo(k, 1)).wymiana, { wartosc: 'kupuje ok. 1,6\u00a0GW', opis: '' });
  // Poniżej 50 MW po zaokrągleniu wychodzi 0,0 GW – „ok. 0 GW”, „prawie bez wymiany”.
  for (const saldo of [3.9, -49.9]) {
    assert.deepEqual(tekstyKarty({ ...k, wymiana: { ...k.wymiana, saldo_mw: saldo } }, RCE, terazPo(k, 1)).wymiana, { wartosc: 'ok. 0\u00a0GW', opis: 'prawie bez wymiany' });
  }
  k.wymiana.saldo_mw = 50;
  assert.equal(tekstyKarty(k, RCE, terazPo(k, 1)).wymiana.wartosc, 'kupuje ok. 0,1\u00a0GW');
});

// D6: RCE z cenami dla kwadransu miksu (500 zł/MWh) i dla kwadransów „teraz” wg zegara (inne ceny) – Karta ma brać tylko tę pierwszą.
function rceZMiksem(k, cenaMiksuZl = 500) {
  const rce = structuredClone(RCE);
  const koniec = Date.parse(k.kwadrans.koniec_utc);
  const seria = rce.doby['2026-11-20'];
  seria.unshift({ okres: k.kwadrans.okres, koniec_utc: new Date(koniec).toISOString().replace('.000Z', 'Z'), cena: cenaMiksuZl });
  // Kolejne kwadranse po miksie – 1,5 h i 5 h później (zegar przeglądarki) – z ceną 1917,88 zł/MWh.
  for (let i = 1; i <= 24; i++) seria.push({ okres: `+${i}`, koniec_utc: new Date(koniec + i * 15 * 60_000).toISOString().replace('.000Z', 'Z'), cena: 1917.88 });
  return rce;
}

test('D6: cena RCE w Karcie – z kwadransu miksu, z jego godziną; brak miksu albo ceny → „–”, nigdy zero', () => {
  const k = karta();
  const okres = k.kwadrans.okres.replace(' - ', '–');
  assert.deepEqual(cenaMiksu(rceZMiksem(k), k, terazPo(k, 1.5)), { ok: true, wartosc: '500,00 zł/MWh', opis: okres, kwh: '= 0,50 zł/kWh', zl: '500,00' });
  assert.equal(cenaMiksu(rceZMiksem(k, -5), k, terazPo(k, 1.5)).wartosc, '-5,00 zł/MWh');
  const brak = { ok: false, wartosc: '–', opis: '', kwh: '', zl: null };
  assert.deepEqual(cenaMiksu(RCE, k, terazPo(k, 1.5)), brak); // próbka RCE nie ma kwadransu miksu
  assert.deepEqual(cenaMiksu(null, k, terazPo(k, 1.5)), brak);
  assert.deepEqual(cenaMiksu(rceZMiksem(k), null, terazPo(k, 1.5)), brak);
});

test('D6: wszystkie miejsca ceny w Karcie – ta sama wartość i ten sam kwadrans co miks, także gdy zegar jest godziny później', () => {
  const k = karta();
  const rce = rceZMiksem(k);
  for (const godziny of [0.25, 1.5, 5]) {
    const t = tekstyKarty(k, rce, terazPo(k, godziny));
    assert.equal(t.cena.zl, '500,00', `${godziny} h`);
    assert.equal(t.cena.wartosc, '500,00 zł/MWh');
    assert.equal(t.cena.kwh, '= 0,50 zł/kWh');
    assert.equal(t.skrotCzesci.rce, 'RCE 500,00 zł/MWh');
    assert.equal(t.kafle.rce, '500,00 zł/MWh');
    // Godzina przy cenie = kwadrans miksu, ten sam co w małej linijce pod liczbą-bohaterem.
    assert.equal(t.cena.opis, k.kwadrans.okres.replace(' - ', '–'));
    assert.ok(t.podpis.startsWith(`w kwadransie ${t.cena.opis} ·`), t.podpis);
    for (const tekst of [t.cena.wartosc, t.cena.kwh, t.skrotCzesci.rce, t.kafle.rce]) assert.ok(!/1917|1,92/.test(tekst), tekst);
  }
  // Następnego dnia przy cenie stoi także data kwadransu miksu (jak w małej linijce).
  const jutro = tekstyKarty(k, rce, terazPo(k, 12));
  assert.equal(jutro.cena.zl, '500,00');
  assert.match(jutro.cena.opis, /\(20\.11\)$/);
  // EN – ta sama zasada.
  ustawJezyk('en');
  try {
    const en1 = tekstyKarty(k, rce, terazPo(k, 1.5));
    assert.equal(en1.cena.wartosc, '500.00 PLN/MWh');
    assert.equal(en1.skrotCzesci.rce, 'RCE 500.00 PLN/MWh');
    assert.equal(en1.kafle.rce, '500.00 PLN/MWh');
  } finally {
    ustawJezyk('pl');
  }
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

test('brak danych: plik się nie wczytał, „blad” w karta.json albo zły układ – bez liczb, bez ceny (D6: „–”)', () => {
  const t = Date.parse('2026-11-20T12:05:00Z');
  const brak = tekstyKarty(null, RCE, t);
  assert.equal(brak.ok, false);
  assert.equal(brak.plakietka, 'Brak danych PSE o miksie.');
  assert.equal(brak.cena.wartosc, '–'); // D6: bez miksu nie ma kwadransu, więc i ceny
  assert.equal(brak.bohater, undefined);
  const blad = tekstyKarty({ wersja: 1, czas_pobrania: '2026-11-20T12:30:00Z', plakietka: 'nie udało się pobrać nowych danych PSE', blad: 'brak danych' }, null, t);
  assert.equal(blad.plakietka, 'Brak danych o miksie: nie udało się pobrać nowych danych PSE.');
  assert.equal(blad.cena.wartosc, '–');
  assert.equal(tekstyKarty({ wersja: 2 }, RCE, t).ok, false);
});

// ── Okienko Polski: liczby wyłącznie z tekstyKarty() – te same co panel ──

// Przypadek „wygrywa OZE”: ta sama próbka PSE, wiatr na lądzie większy o 20 000 MW w obu raportach
// (his-gen-pal-sire i his-wlk-cal), więc karta przechodzi też sprawdzian zgodności.
const DODATEK_WIATRU_MW = 20_000;
function kartaOze() {
  const miks = structuredClone(PROBKA['his-gen-pal-sire']);
  for (const r of miks) {
    if (r.alias_sire !== 'WI') continue;
    const mw = Number(String(r.value).replace(',', '.')) + DODATEK_WIATRU_MW;
    r.value = String(mw).replace('.', ',');
  }
  const wlk = structuredClone(PROBKA['his-wlk-cal']).map((w) => ({ ...w, wi: w.wi + DODATEK_WIATRU_MW }));
  return zbudujKarte(miks, wlk, '2026-11-20T12:30:00.000Z');
}

const naLiczbe = (tekst) => Number(tekst.replace('%', '').replace(',', '.'));

test('okienko, węgiel: pierścień = kamienny + brunatny z paska, razem = liczba-bohater, CO2 = panel', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  const o = t.okienko;
  assert.equal(o.naglowek, 'Polska · prąd z węgla');
  assert.equal(o.stan, 'stan na 12:30 · PSE opublikowało 21.11, 02:52');
  assert.equal(t.podpis, `w kwadransie 12:15–12:30 · z produkcji w Polsce · ${o.stan}`);
  // Procenty w pierścieniu = procenty paska (te same napisy).
  const zPaska = t.pasek.filter((p) => p.grupa === 'kamienny' || p.grupa === 'brunatny');
  assert.deepEqual(o.kawalki, zPaska);
  // „razem” z jednym miejscem po przecinku, liczone z całości; po zaokrągleniu = liczba-bohater.
  assert.match(o.razem, /^\d{1,3},\d%$/);
  assert.equal(o.razem, `${(k.wegiel_udzial * 100).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
  assert.equal(`${Math.round(naLiczbe(o.razem))}%`, t.bohater.procent);
  // CO2 = wartość z panelu; kropka na skali 0–1500.
  assert.equal(o.co2.wartosc, t.co2.wartosc);
  assert.equal(o.co2.tekst, `tu jesteśmy: ${t.co2.wartosc} – szacunek OSIRIS wg IPCC`);
  assert.equal(o.co2.polozenie, k.co2.g_kwh_ok / 1500);
  assert.equal(o.zdanie, 'z produkcji w Polsce · dane PSE co 15 min');
});

test('okienko, OZE: pięć kawałków OZE, razem = OZE z paska = liczba-bohater, CO2 = panel', () => {
  const k = kartaOze();
  assert.ok(k.oze_udzial > k.wegiel_udzial, 'w tym przypadku OZE musi wygrywać');
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  const o = t.okienko;
  assert.equal(t.bohater.grupa, 'oze');
  assert.equal(o.naglowek, 'Polska · prąd z OZE');
  assert.deepEqual(o.kawalki.map((x) => x.nazwa), ['wiatr na lądzie', 'wiatr na morzu', 'słońce', 'woda', 'biomasa i inne OZE']);
  // Kawałki składają się na całe OZE (bez zaokrągleń – dokładnie; po zaokrągleniu najwyżej o 0,1 punktu na kawałek).
  const suma = o.kawalki.reduce((s, x) => s + x.udzial, 0);
  assert.ok(Math.abs(suma - k.grupy.oze.udzial) < 0.0001, `suma kawałków ${suma} ≠ OZE ${k.grupy.oze.udzial}`);
  // Każdy kawałek = suma MW swoich paliw / produkcja.
  for (const [i, r] of PODZIAL_OZE.entries()) {
    const mw = k.paliwa.filter((p) => r.kody.includes(p.kod_pse)).reduce((s, p) => s + p.mw, 0);
    assert.equal(o.kawalki[i].udzial, mw / k.produkcja_mw);
  }
  // „razem” = procent OZE z paska panelu = liczba-bohater po zaokrągleniu.
  assert.equal(o.razem, t.pasek.find((p) => p.grupa === 'oze').tekst);
  assert.equal(`${Math.round(naLiczbe(o.razem))}%`, t.bohater.procent);
  assert.equal(o.co2.wartosc, t.co2.wartosc);
});

test('okienko, OZE: starszy karta.json bez listy paliw – jeden kawałek „OZE” z paska, bez zgadywania', () => {
  const k = kartaOze();
  delete k.paliwa;
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.deepEqual(t.okienko.kawalki, [t.pasek.find((p) => p.grupa === 'oze')].map((p) => ({ ...p, nazwa: 'OZE' })));
});

test('okienko: kropka CO2 nie wychodzi poza skalę', () => {
  const k = karta();
  k.co2.g_kwh_ok = 2000;
  assert.equal(tekstyKarty(k, RCE, terazPo(k, 1)).okienko.co2.polozenie, 1);
});

test('okienko: bez danych o miksie – nie ma okienka', () => {
  assert.equal(tekstyKarty(null, RCE, Date.parse('2026-11-20T12:05:00Z')).okienko, undefined);
});

// ── Paski „Ile pracuje z tego, co mamy” (produkcja teraz na tle mocy zainstalowanej, PSE Raport 2025 KSE, Tabela 1.1) ──
const MOC = JSON.parse(readFileSync(new URL('./moc-zainstalowana-pse-2025.json', import.meta.url), 'utf-8'));
const kartaZMoca = () => ({ ...karta(), moc_zainstalowana: structuredClone(MOC) });
const mwKodow = (k, kody) => k.paliwa.filter((p) => kody.includes(p.kod_pse)).reduce((s, p) => s + p.mw, 0);

test('plik mocy: wartości z Tabeli 1.1 składają się na sumy z tej samej tabeli', () => {
  const w = MOC.wiersze;
  assert.equal(MOC.stan_na, '2025-12-31');
  assert.equal(MOC.jednostka, 'MW');
  assert.equal(w.wegiel_kamienny + w.wegiel_brunatny + w.gazowe, w.zawodowe_cieplne); // 37 794
  assert.equal(w.zawodowe_wodne + w.zawodowe_cieplne, w.elektrownie_zawodowe); // 40 225
  assert.equal(w.elektrownie_zawodowe + w.wiatrowe_i_inne_odnawialne, w.ogolem); // 77 331
  assert.equal(w.jwcd + w.njwcd, w.ogolem);
  assert.equal(w.ogolem, 77331);
});

test('paski mocy: te same MW co pasek miksu i lista paliw z tego samego kwadransu', () => {
  const k = kartaZMoca();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  const m = t.moc;
  assert.equal(m.ok, true);
  assert.deepEqual(m.paski.map((p) => p.klucz), ['kamienny', 'brunatny', 'gaz', 'oze']);
  const pasek = Object.fromEntries(m.paski.map((p) => [p.klucz, p]));
  // Węgiel: dokładnie te same MW co grupy paska miksu.
  assert.equal(pasek.kamienny.produkcja_mw, k.grupy.kamienny.mw);
  assert.equal(pasek.brunatny.produkcja_mw, k.grupy.brunatny.mw);
  // Gaz: tylko gaz ziemny (GZ), część grupy „gaz i inne”.
  assert.equal(pasek.gaz.produkcja_mw, mwKodow(k, ['GZ']));
  assert.ok(pasek.gaz.produkcja_mw <= k.grupy.gaz_i_inne.mw);
  // OZE na pasku mocy = OZE z paska miksu bez wody (woda nie ma paska).
  assert.ok(Math.abs(pasek.oze.produkcja_mw - (k.grupy.oze.mw - mwKodow(k, ['WP', 'WZ']))) < 0.05);
  // Moc z pliku, wiersze zgodne z definicją pasków.
  for (const p of PASKI_MOCY) assert.equal(pasek[p.klucz].moc_mw, MOC.wiersze[p.wiersz]);
  // Tylko OZE jest niepewne (kreskowane, „?”).
  assert.deepEqual(m.paski.filter((p) => p.niepewny).map((p) => p.klucz), ['oze']);
  // Ten sam kwadrans co reszta panelu: „stan na” taki jak w podpisie paska miksu.
  assert.equal(m.podpis, 'produkcja: stan na 12:30 · moc w całej Polsce: PSE, stan 31.12.2025');
  assert.ok(t.podpis.includes('stan na 12:30'));
  assert.equal(m.zrodlo, 'PSE, Raport 2025 KSE, Tabela 1.1 · stan 31.12.2025');
});

test('paski mocy: podpis „X z Y GW”, szerokość = produkcja / moc', () => {
  const k = kartaZMoca();
  for (const p of k.paliwa) if (p.kod_pse === 'WK') p.mw = 6589.3;
  for (const p of k.paliwa) if (p.kod_pse === 'GZ') p.mw = 1937.3;
  const pasek = Object.fromEntries(tekstyKarty(k, RCE, terazPo(k, 1)).moc.paski.map((p) => [p.klucz, p]));
  assert.equal(pasek.kamienny.tekst, '6,6 z 23,1 GW');
  assert.equal(pasek.gaz.tekst, '1,9 z 6,3 GW');
  assert.equal(pasek.kamienny.udzial, 6589.3 / 23097);
  assert.equal(pasek.kamienny.ponad, false);
  assert.equal(pasek.kamienny.dopisek, null);
});

test('paski mocy: produkcja większa niż moc z raportu – pasek pełny, liczby nie przycięte, dopisek', () => {
  const k = kartaZMoca();
  k.moc_zainstalowana.wiersze.gazowe = 1000;
  for (const p of k.paliwa) if (p.kod_pse === 'GZ') p.mw = 1250;
  const gaz = tekstyKarty(k, RCE, terazPo(k, 1)).moc.paski.find((p) => p.klucz === 'gaz');
  assert.equal(gaz.udzial, 1);
  assert.equal(gaz.ponad, true);
  assert.equal(gaz.tekst, '1,3 z 1,0 GW');
  assert.equal(gaz.dopisek, 'więcej niż moc z raportu PSE (stan 31.12.2025) – od tego czasu mogły przybyć nowe elektrownie');
  assert.doesNotMatch(gaz.dopisek, /%/);
});

test('paski mocy: brak pliku mocy, zły plik albo brak danych o miksie – „brak danych”, bez pustych pasków', () => {
  const brak = { ok: false, tekst: 'brak danych o mocy zainstalowanej' };
  const k = karta(); // bez pola moc_zainstalowana (np. poprzednie dane sprzed tego PR)
  assert.deepEqual(tekstyKarty(k, RCE, terazPo(k, 1)).moc, brak);
  const zly = kartaZMoca();
  delete zly.moc_zainstalowana.wiersze.gazowe;
  assert.deepEqual(tekstyKarty(zly, RCE, terazPo(zly, 1)).moc, brak);
  const bezPaliw = kartaZMoca();
  delete bezPaliw.paliwa;
  assert.deepEqual(tekstyKarty(bezPaliw, RCE, terazPo(bezPaliw, 1)).moc, brak);
  assert.deepEqual(tekstyKarty(null, RCE, Date.parse('2026-11-20T12:05:00Z')).moc, brak);
});

test('paski mocy: napisy na stronie bez słów sugerujących marnowanie (PL i EN)', () => {
  // Teksty stoją w słownikach – sprawdzamy gotową stronę z szablonu (ta sama funkcja co przy budowaniu).
  const szablon = readFileSync(new URL('../../mapa/index.html', import.meta.url), 'utf-8');
  const sekcja = (jezyk) => {
    const html = wypelnij(szablon, jezyk, 'mapa');
    return html.slice(html.indexOf('id="karta-moce"'), html.indexOf('</details>', html.indexOf('id="karta-moce"')));
  };
  const pl = sekcja('pl');
  assert.ok(pl.includes('Moc zainstalowana to nie moc dostępna'));
  assert.ok(pl.includes('a nie awaria'));
  assert.doesNotMatch(pl.toLowerCase(), /marnow|traci|stoi bezczynn|niewykorzyst|zmarnowan/);
  const en = sekcja('en');
  assert.ok(en.includes('Installed capacity is not available capacity'));
  assert.ok(en.includes('not a breakdown'));
  // „waste” bez końcówki to paliwo (odpady) – zakazane są „wasted / wasting”.
  assert.doesNotMatch(en.toLowerCase(), /wasted|wasting|\bidle\b|unused|\blost\b|squander/);
  // Wyjaśnienie „?” – jedno źródło tekstu dla listy i okienka C (src/karta.js czyta je po id).
  assert.equal(szablon.split('id="karta-moce-niepewnosc"').length - 1, 1);
});

// ── Etap C2 (decyzje Ani 25.11.2026): pierwszy ekran P1, wnioski z danych, zapotrzebowanie, zł/kWh, nagłówki ──
import pl from '../../src/teksty/pl.js';
import en from '../../src/teksty/en.js';

test('C2: ten sam procent OZE w nagłówku, kafelku i obu wnioskach (jedna funkcja, podstawa – produkcja w Polsce)', () => {
  for (const jez of ['pl', 'en']) {
    ustawJezyk(jez);
    const k = karta();
    const t = tekstyKarty(k, RCE, terazPo(k, 1));
    const oze = procent0(k.oze_udzial);
    for (const tekst of [t.skrotCzesci.drugi, t.kafle.drugi, t.wnioski.pelny]) assert.ok(tekst.includes(oze), `${jez}: brak ${oze} w: ${tekst}`);
    assert.ok(!/\d+%/.test(t.wnioski.krotki), `K2 bez liczb: ${t.wnioski.krotki}`);
  }
  ustawJezyk('pl');
});

test('C2: ten sam procent węgla w kafelku (telefon), nagłówku Karty i zakładce „Ile i jak czysto” (liczba-bohater)', () => {
  for (const jez of ['pl', 'en']) {
    ustawJezyk(jez);
    // Węgiel jest bohaterem: kafelek 1, kawałek nagłówka i liczba w zakładce – ta sama liczba.
    const k = karta();
    assert.ok(k.wegiel_udzial >= k.oze_udzial, 'próbka: węgiel ma być bohaterem');
    const t = tekstyKarty(k, RCE, terazPo(k, 1));
    const wegiel = procent0(k.wegiel_udzial);
    assert.equal(t.bohater.grupa, 'wegiel');
    assert.equal(t.bohater.procent, wegiel); // zakładka: #karta-procent = bohater.procent
    assert.equal(t.kafle.bohater, t.skrotCzesci.bohater, `${jez}: kafelek ≠ nagłówek`);
    assert.ok(t.kafle.bohater.startsWith(`${wegiel} `), `${jez}: ${t.kafle.bohater}`);
    assert.ok(t.skrot.includes(wegiel), `${jez}: ${t.skrot}`);
    // OZE jest bohaterem: węgiel w drugim kawałku i drugim kafelku – nadal ten sam procent.
    const o = kartaOze();
    const to = tekstyKarty(o, RCE, terazPo(o, 1));
    const wegielO = procent0(o.wegiel_udzial);
    assert.equal(to.bohater.grupa, 'oze');
    assert.equal(to.kafle.drugi, to.skrotCzesci.drugi);
    assert.ok(to.kafle.drugi.includes(wegielO), `${jez}: brak ${wegielO} w: ${to.kafle.drugi}`);
  }
  ustawJezyk('pl');
});

test('C2: „w większości” / „mostly” tylko przy udziale ≥ 50% (49,9 / 50,0 / 50,1)', () => {
  for (const [u, oczekiwane] of [[0.499, false], [0.5, true], [0.501, true]]) {
    for (const [jez, slowo] of [['pl', 'w większości'], ['en', 'mostly']]) {
      ustawJezyk(jez);
      const k = karta();
      k.wegiel_udzial = u;
      k.oze_udzial = 0.3;
      const t = tekstyKarty(k, RCE, terazPo(k, 1));
      assert.equal(t.wnioski.pelny.includes(slowo), oczekiwane, `${jez} ${u}: ${t.wnioski.pelny}`);
    }
  }
  ustawJezyk('pl');
});

test('C2: wnioski w czasie przeszłym, z kwadransem z danych; przy starych danych (plakietka) – brak zdań', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  const okres = k.kwadrans.okres.replace(' - ', '–');
  assert.ok(t.wnioski.krotki.startsWith(`W kwadransie ${okres}`) && /pochodził[ao]/.test(t.wnioski.krotki), t.wnioski.krotki);
  assert.ok(/produkowała/.test(t.wnioski.pelny) && !/\bteraz\b/i.test(t.wnioski.pelny), t.wnioski.pelny);
  const stare = tekstyKarty(k, RCE, terazPo(k, PROG_STARYCH_H + 1));
  assert.ok(stare.plakietka);
  assert.equal(stare.wnioski.krotki, null);
  assert.equal(stare.wnioski.pelny, null);
});

test('C2: wymiana we wniosku i w linijce zapotrzebowania – tylko saldo PSE (swm_p + swm_np), nie różnica zapotrzebowanie − produkcja', () => {
  const k = karta();
  const t = tekstyKarty(k, RCE, terazPo(k, 1));
  // Ta sama liczba GW (jedno miejsce po przecinku) we wniosku, w kafelku wymiany i w linijce zapotrzebowania.
  const saldoGw = (Math.abs(k.wymiana.saldo_mw) / 1000).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  assert.ok(t.wnioski.pelny.includes(`ok. ${saldoGw} GW`), t.wnioski.pelny);
  assert.ok(t.wymiana.wartosc.endsWith(`ok. ${saldoGw}\u00a0GW`), t.wymiana.wartosc); // twarda spacja – jeden wiersz
  assert.ok(!/\bMW\b/.test(t.wymiana.wartosc) && !/granic\S* ok\. [\d ]+ MW/.test(t.wnioski.pelny), 'wymiana w MW');
  assert.ok(t.zapotrzebowanie.linijka.includes(t.wymiana.wartosc) && t.zapotrzebowanie.linijka.includes('(planowo)'), t.zapotrzebowanie.linijka);
  // W próbce saldo i różnica zapotrzebowanie − produkcja dają po zaokrągleniu tę samą liczbę GW – ustawiamy saldo inne
  // niż różnica (o 0,7 GW), żeby sprawdzić, że w linijce i we wniosku stoi saldo, a nie różnica.
  const roznica = k.bilans.zapotrzebowanie_mw - k.produkcja_mw;
  const naGw = (mw) => (mw / 1000).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const ks = { ...k, wymiana: { ...k.wymiana, saldo_mw: roznica - 700 } };
  const ts = tekstyKarty(ks, RCE, terazPo(ks, 1));
  assert.ok(ts.zapotrzebowanie.linijka.includes(`ok. ${naGw(Math.abs(roznica - 700))}\u00a0GW`), ts.zapotrzebowanie.linijka);
  assert.ok(!ts.zapotrzebowanie.linijka.includes(`ok. ${naGw(roznica)}\u00a0GW`) && !ts.wnioski.pelny.includes(`ok. ${naGw(roznica)} GW`), `różnica zamiast salda: ${ts.wnioski.pelny}`);
  // Mała wymiana (0,0 GW po zaokrągleniu) – bez tej części; znak → kupuje / sprzedaje.
  k.wymiana.saldo_mw = 30;
  assert.ok(!/granic/.test(tekstyKarty(k, RCE, terazPo(k, 1)).wnioski.pelny));
  k.wymiana.saldo_mw = -800;
  assert.ok(/sprzedawała za granicę ok\. 0,8 GW\./.test(tekstyKarty(k, RCE, terazPo(k, 1)).wnioski.pelny));
});

test('C2: wiatr i słońce – GW i procent od produkcji w Polsce; brak zapotrzebowania → brak linijki', () => {
  const k = karta();
  const ws = wiatrISlonce(k);
  const kody = new Map(k.paliwa.map((p) => [p.kod_pse, p.mw]));
  assert.equal(ws.mw, kody.get('WI') + kody.get('WM') + kody.get('ES'));
  const z = tekstZapotrzebowania(k);
  assert.ok(z.wiatrSlonce.includes(`(${procent0(ws.mw / k.produkcja_mw)})`) && z.wiatrSlonce.includes(`${(k.produkcja_mw / 1000).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} GW produkcji`), z.wiatrSlonce);
  delete k.bilans;
  assert.equal(tekstZapotrzebowania(k).linijka, null);
});

test('C2: RCE w zł/kWh = zł/MWh ÷ 1000 (dwa miejsca, ujemna cena zostaje ujemna)', () => {
  const k = karta();
  assert.equal(cenaMiksu(rceZMiksem(k, 612.4), k, terazPo(k, 1)).kwh, '= 0,61 zł/kWh');
  assert.equal(cenaMiksu(rceZMiksem(k, -5), k, terazPo(k, 1)).kwh, '= -0,01 zł/kWh');
});

test('C2: nagłówki – to samo znaczenie w PL i EN (planowa / scheduled, cykl życia / life-cycle)', () => {
  assert.ok(/planowa/.test(pl['karta.wymiana']) && /scheduled/.test(en['karta.wymiana']));
  for (const k of ['karta.slad_co2', 'okienko_polski.co2_tytul']) assert.ok(/cyklu życia/.test(pl[k]) && /Life-cycle/.test(en[k]), k);
});

test('C2: nagłówek Karty – jedna godzina; cena RCE z kwadransu miksu, a bez niej – bez ceny w nagłówku i kafelku', () => {
  const k = karta();
  const teraz = terazPo(k, 1);
  // Próbka RCE nie ma kwadransu miksu – w nagłówku bez ceny, w kafelkach „–” (D6: zakładka też, bez ceny „teraz”).
  const bez = tekstyKarty(k, RCE, teraz);
  assert.equal(bez.skrotCzesci.rce, null);
  assert.equal(bez.kafle.rce, null);
  assert.equal(bez.cena.wartosc, '–');
  // Z ceną dla kwadransu miksu (koniec 11:15 UTC = 12:15 czasu polskiego) – ta cena, nie bieżąca.
  const rce = structuredClone(RCE);
  rce.doby['2026-11-20'].unshift({ okres: '12:00 - 12:15', koniec_utc: k.kwadrans.koniec_utc.replace('.000Z', 'Z'), cena: 500 });
  const z = tekstyKarty(k, rce, teraz);
  assert.equal(z.skrotCzesci.rce, 'RCE 500,00 zł/MWh');
  assert.equal(z.kafle.rce, '500,00 zł/MWh');
  const linijka = Object.values(z.skrotCzesci).filter(Boolean).join(' · ');
  assert.equal((linijka.match(/\d{1,2}:\d{2}/g) ?? []).length, 1, linijka);
});

test('C2 (odbiór): zdanie-wniosek PL „w większości z węgla (X%), a Y% z OZE.”, EN bez zmian; nagłówek w czasie przeszłym; podpis od kwadransu', () => {
  const k = karta();
  const wegiel = procent0(k.wegiel_udzial), oze = procent0(k.oze_udzial);
  const okres = k.kwadrans.okres.replace(' - ', '–');
  ustawJezyk('pl');
  let t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.ok(t.wnioski.pelny.includes(` – w większości z węgla (${wegiel}), a ${oze} z OZE.`), t.wnioski.pelny);
  assert.equal(`${t.bohater.procent} ${t.bohater.zdanie}`, `${wegiel} prądu w Polsce pochodziło z węgla`);
  assert.ok(t.podpis.startsWith(`w kwadransie ${okres} · `), t.podpis);
  ustawJezyk('en');
  t = tekstyKarty(k, RCE, terazPo(k, 1));
  assert.ok(t.wnioski.pelny.includes(` – mostly from coal (${wegiel}), ${oze} from renewables.`), t.wnioski.pelny);
  assert.equal(`${t.bohater.procent} ${t.bohater.zdanie}`, `${wegiel} of Poland's electricity came from coal`);
  assert.ok(t.podpis.startsWith(`in the quarter-hour ${okres} · `), t.podpis);
  ustawJezyk('pl');
});

test('C2 (odbiór): linijka 1 nagłówka – „72% z węgla · OZE 13% · produkcja 20,8 GW” (kolejność w mapa/index.html, liczby z danych)', () => {
  const html = readFileSync(new URL('../../mapa/index.html', import.meta.url), 'utf-8');
  const linia = html.match(/<span class="karta__skrot-linia" data-zakladka="ile">([\s\S]*?)<\/span>\s*<span class="karta__skrot-linia" id="skrot-rce"/)[1];
  assert.deepEqual([...linia.matchAll(/id="(skrot-[a-z]+)"/g)].map((m) => m[1]), ['skrot-bohater', 'skrot-drugi', 'skrot-produkcja']);
  // Kolejne linijki: RCE (Ile), wolna moc (Gdzie), stan – każda osobno; „·” tylko między kawałkami pierwszej linijki.
  assert.match(html, /id="skrot-rce" data-zakladka="ile"[\s\S]*id="skrot-moce" data-zakladka="gdzie"[\s\S]*class="karta__skrot-linia karta__skrot-stan" id="skrot-stan"/);
  const k = karta();
  const oczekiwane = {
    pl: [`${procent0(k.wegiel_udzial)} z węgla`, `OZE ${procent0(k.oze_udzial)}`, `produkcja ${(k.produkcja_mw / 1000).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} GW`],
    en: [`${procent0(k.wegiel_udzial)} from coal`, `renewables ${procent0(k.oze_udzial)}`, `generation ${(k.produkcja_mw / 1000).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} GW`],
  };
  for (const jez of ['pl', 'en']) {
    ustawJezyk(jez);
    const c = tekstyKarty(k, RCE, terazPo(k, 1)).skrotCzesci;
    assert.deepEqual([c.bohater, c.drugi, c.produkcja], oczekiwane[jez], jez);
  }
  ustawJezyk('pl');
});

test('C2 (odbiór 2): wniosek PL w tym samym stylu przy ≥ 50% i < 50% („…, a X% z OZE.”); EN bez zmian', () => {
  const przypadki = [
    // [węgiel, OZE, gaz i inne] → oczekiwany fragment PL / EN
    [0.72, 0.13, 0.15, ' – w większości z węgla (72%), a 13% z OZE.', ' – mostly from coal (72%), 13% from renewables.'],
    [0.45, 0.38, 0.17, ' – najwięcej z węgla (45%), a 38% z OZE.', ' – 45% from coal, 38% from renewables.'],
    // Gaz i inne mają więcej niż węgiel – bez „najwięcej” (nieprawda), sama liczba w tym samym stylu.
    [0.4, 0.15, 0.45, ' – 40% z węgla, a 15% z OZE.', ' – 40% from coal, 15% from renewables.'],
  ];
  for (const [w, o, g, pl, en] of przypadki) {
    const k = karta();
    Object.assign(k, { wegiel_udzial: w, oze_udzial: o });
    k.grupy.gaz_i_inne.udzial = g;
    for (const [jez, f] of [['pl', pl], ['en', en]]) {
      ustawJezyk(jez);
      const t = tekstyKarty(k, RCE, terazPo(k, 1));
      assert.ok(t.wnioski.pelny.includes(f), `${jez} ${w}: ${t.wnioski.pelny}`);
    }
  }
  ustawJezyk('pl');
});

test('C2 (odbiór 2): kafelek wymiany – twarda spacja między liczbą a „GW” (PL i EN)', () => {
  for (const [jez, wzor] of [['pl', /^(kupuje|sprzedaje) ok\. \d+,\d GW$/], ['en', /^(importing|exporting) approx\. \d+\.\d GW$/]]) {
    ustawJezyk(jez);
    const k = karta();
    assert.match(tekstyKarty(k, RCE, terazPo(k, 1)).wymiana.wartosc, wzor);
  }
  ustawJezyk('pl');
});
