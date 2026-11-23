// Testy napisów panelu Karty Polski (src/karta-teksty.js) – wbudowany w Node moduł node:test (bez pakietów).
// Uruchom: node --test scripts/karta/testy-panel.mjs
// Dane: karta zbudowana z prawdziwej próbki PSE (doba 2026-11-20, kwadrans 12:15–12:30 – najnowszy pełny w próbce).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zbudujKarte } from './licz.mjs';
import { tekstyKarty, tekstCeny, PROG_STARYCH_H, PODZIAL_OZE, PASKI_MOCY } from '../../src/karta-teksty.js';

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
  assert.equal(t.podpis, `z produkcji w Polsce · ${o.stan}`);
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

test('paski mocy: napisy na stronie bez słów sugerujących marnowanie', () => {
  const html = readFileSync(new URL('../../mapa/index.html', import.meta.url), 'utf-8');
  const sekcja = html.slice(html.indexOf('id="karta-moce"'), html.indexOf('</details>', html.indexOf('id="karta-moce"')));
  assert.ok(sekcja.includes('Moc zainstalowana to nie moc dostępna'));
  assert.ok(sekcja.includes('a nie awaria'));
  assert.doesNotMatch(sekcja.toLowerCase(), /marnow|traci|stoi bezczynn|niewykorzyst|zmarnowan/);
  // Wyjaśnienie „?” – jedno źródło tekstu dla listy i okienka C (src/karta.js czyta je po id).
  assert.equal(html.split('id="karta-moce-niepewnosc"').length - 1, 1);
});
