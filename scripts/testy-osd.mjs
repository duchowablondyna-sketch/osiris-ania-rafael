// F2.1 „PGE na liście w Gdzie” (decyzje Ani 26.11.2026): sprawdzian danych PGE (public/data/osd-pge.json) i funkcji
// grup (src/wyszukiwarka-mocy.js). Uruchom: node --test scripts/testy-osd.mjs (także w npm run sprawdz).
// Liczby kontrolne z odczytu PDF PGE (stan na 30.09.2026, sha256 a15157fb…): 47 grup, 504 wpisy stacji, 40 z gwiazdką.
// Przy nowym wydaniu PGE: najpierw przeczytać PDF, potem zmienić liczby kontrolne – nigdy odwrotnie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pl from '../src/teksty/pl.js';
import en from '../src/teksty/en.js';
import cytatyOsd from '../src/teksty/cytaty-osd.js';
import { filtrujGrupy, najwiekszaMocGrupy, szukajStacji, doPorownania, wKolejnosciGrup } from '../src/wyszukiwarka-mocy.js';

const KATALOG = resolve(import.meta.dirname, '..');
const dane = JSON.parse(readFileSync(resolve(KATALOG, 'public/data/osd-pge.json'), 'utf-8'));
const G = dane.grupy;
const nr = (lista) => lista.map((g) => g.nr);

test('źródło: adresy https PGE, sha256, stan na, strony tabeli, podstawa prawna', () => {
  const z = dane.zrodlo;
  assert.match(z.url_strony, /^https:\/\/pgedystrybucja\.pl\//);
  assert.match(z.url_pdf, /^https:\/\/pgedystrybucja\.pl\/.+\.pdf/);
  assert.match(z.sha256, /^[0-9a-f]{64}$/);
  assert.equal(z.sha256, 'a15157fb7af2b5ed4c6dd8eb32add151def524d4b7cc2624ecf88eba4d144e73');
  assert.match(z.stan_na, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(z.pobrano, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(z.strony, [9, 10, 11, 12]);
  assert.match(z.podstawa_prawna, /8l pkt 2.*2026 poz\. 516/);
});

test('grupy: 47, numery 1–47 bez przerw, nazwy bez powtórzeń, strona 9–12, poziom weryfikacji 1 albo 3', () => {
  assert.equal(G.length, 47);
  assert.equal(dane.liczba_grup.tabele, G.length);
  assert.equal(dane.liczba_grup.tekst_dokumentu, 46);
  assert.deepEqual(nr(G), Array.from({ length: 47 }, (_, i) => i + 1));
  assert.equal(new Set(G.map((g) => g.nazwa)).size, G.length);
  for (const g of G) {
    assert.ok(g.nazwa && typeof g.nazwa === 'string', `gr ${g.nr}: nazwa`);
    assert.ok([9, 10, 11, 12].includes(g.strona), `gr ${g.nr}: strona ${g.strona}`);
    assert.ok([1, 3].includes(g.poziom_weryfikacji), `gr ${g.nr}: poziom ${g.poziom_weryfikacji}`);
  }
  // Poziom 3 tylko dla grup, które Ania przeczytała w PDF 26.11.2026 (reszta – 1).
  assert.deepEqual(nr(G.filter((g) => g.poziom_weryfikacji === 3)), [7, 8, 35, 39, 44]);
  assert.match(G.find((g) => g.nr === 5).uwagi.join(' '), /kończy się przecinkiem/);
});

test('stacje: co najmniej 1 w grupie, liczba = długość listy, 504 wpisy, 40 z gwiazdką, bez pustych nazw i gwiazdek w nazwie', () => {
  let razem = 0;
  let abonenckie = 0;
  for (const g of G) {
    assert.ok(g.stacje.length >= 1, `gr ${g.nr}: brak stacji`);
    assert.equal(g.liczba_stacji, g.stacje.length, `gr ${g.nr}: liczba stacji`);
    for (const s of g.stacje) {
      assert.ok(s.nazwa.trim() === s.nazwa && s.nazwa.length > 1, `gr ${g.nr}: nazwa „${s.nazwa}”`);
      assert.ok(!/[*,]/.test(s.nazwa), `gr ${g.nr}: znak w nazwie „${s.nazwa}”`);
      assert.equal(typeof s.abonencka, 'boolean');
      if (s.abonencka) abonenckie++;
    }
    razem += g.stacje.length;
  }
  assert.equal(razem, 504);
  assert.equal(abonenckie, 40);
});

test('MW: każdy rok 2026–2031, liczby całkowite ≥ 0, wielokrotności 5, najwyżej 1000; rok filtra 2031', () => {
  assert.deepEqual(dane.lata, [2026, 2027, 2028, 2029, 2030, 2031]);
  assert.equal(dane.rok_filtra, 2031);
  for (const g of G) {
    assert.deepEqual(Object.keys(g.mw).map(Number), dane.lata, `gr ${g.nr}: lata`);
    for (const [rok, v] of Object.entries(g.mw)) {
      assert.ok(Number.isInteger(v) && v >= 0 && v <= 1000 && v % 5 === 0, `gr ${g.nr}, ${rok}: ${v}`);
    }
  }
  // Liczby kontrolne z PDF (Tabela „0.2”): 17 grup z 0 MW w 2026, 12 w 2031.
  assert.equal(G.filter((g) => g.mw[2026] === 0).length, 17);
  assert.equal(G.filter((g) => g.mw[2031] === 0).length, 12);
});

test('cytaty PGE: dokładny tekst ze stroną, każdy ma nasze tłumaczenie (cytaty-osd.js)', () => {
  for (const [k, c] of Object.entries(dane.cytaty)) {
    assert.ok(c.tekst && c.strony, k);
    assert.ok(typeof cytatyOsd[c.tekst] === 'string' && cytatyOsd[c.tekst].trim(), `brak tłumaczenia cytatu PGE „${c.tekst}”`);
  }
  assert.match(dane.cytaty.grupy.tekst, /znacząco oddziaływają na siebie/);
});

test('filtr MW: grupa pasuje przy ≥ X MW w 2031, bez sumowania grup, kolejność PGE', () => {
  assert.deepEqual(nr(filtrujGrupy(G, 150, 2031)), [31, 33, 35]);
  assert.deepEqual(nr(filtrujGrupy(G, 235, 2031)), [35]);
  assert.deepEqual(nr(filtrujGrupy(G, 236, 2031)), []);
  // 235 MW to największa moc JEDNEJ grupy – suma wszystkich grup byłaby wielokrotnie większa, a i tak nic nie pasuje.
  assert.equal(najwiekszaMocGrupy(G, 2031), 235);
  assert.equal(najwiekszaMocGrupy(G, 2026), 75);
  assert.equal(filtrujGrupy(G, 5, 2031).length, 47 - 12);
  assert.deepEqual(nr(wKolejnosciGrup([...G].reverse())), nr(G));
});

test('szukanie stacji: bez wielkości liter i polskich znaków; ta sama nazwa w kilku grupach → wszystkie', () => {
  assert.equal(doPorownania('  BEŁCHATÓW '), 'belchatow');
  const b = szukajStacji(G, 'belchatow');
  assert.deepEqual(b.wyniki.map((w) => w.grupa.nr), [18, 19]);
  assert.deepEqual(b.dokladne, [{ nazwa: 'Bełchatów', grup: 2 }]);
  const j = szukajStacji(G, 'Józefów');
  assert.deepEqual(j.wyniki.map((w) => w.grupa.nr), [22, 44]);
  assert.deepEqual(j.dokladne, [{ nazwa: 'Józefów', grup: 2 }]);
  assert.deepEqual(szukajStacji(G, 'radom').wyniki.map((w) => w.grupa.nr), [19, 27]);
  assert.equal(szukajStacji(G, '   ').pusty, true);
  assert.deepEqual(szukajStacji(G, 'xyzxyz').wyniki, []);
});

test('teksty F2.1: każdy klucz osd.* w PL i EN, ten sam rodzaj; rok zamiast „teraz”, bez „ekspertyzy”', () => {
  const klucze = Object.keys(pl).filter((k) => k.startsWith('osd.'));
  assert.ok(klucze.length >= 25);
  for (const k of klucze) {
    assert.ok(k in en, `brak ${k} w EN`);
    assert.equal(typeof en[k], typeof pl[k], `inny rodzaj ${k}`);
  }
  const wszystko = (s) => klucze.map((k) => (typeof s[k] === 'function' ? s[k]('A', 'B', 'C', 'D') : s[k])).join(' ');
  assert.ok(!/\bteraz\b|ekspertyz/i.test(wszystko(pl)), 'PL: „teraz” albo „ekspertyza”');
  assert.ok(!/\bnow\b|impact study/i.test(wszystko(en)), 'EN: „now” albo „impact study”');
  // Twarda spacja przed „MW” i „r.” w zdaniach z rokiem (decyzja Ani 26.11.2026).
  assert.match(pl['osd.brak']('d', '300 MW', 2031, '235 MW'), /w 2031 r\./);
  assert.match(pl['osd.pasuje'](1, 47, 2031), /na 2031 r\./);
  assert.match(pl['moce.osd_wstep'], /^Odbiorcy przyłączają się do sieci PSE albo do sieci operatorów dystrybucyjnych \(OSD\)\./);
});

// ── F2.2 „Energa w Gdzie” (decyzje Ani 26–27.11.2026): sprawdzian danych Energi (public/data/osd-energa.json) ──
// Liczby kontrolne z odczytu PDF Energi (stan na 31.08.2026, sha256 43abdeed…): 48 grup (numery 1–51 bez 24, 43, 49),
// 401 wpisów stacji w modelu na 2026 r., 85 zaznaczonych na czerwono, 40 nowych stacji, 4 stacje zmieniające grupę.
// Przy nowym wydaniu Energi: najpierw przeczytać PDF, potem zmienić liczby kontrolne – nigdy odwrotnie.
const energa = JSON.parse(readFileSync(resolve(KATALOG, 'public/data/osd-energa.json'), 'utf-8'));
const E = energa.grupy;
const NUMERY_ENERGI = Array.from({ length: 51 }, (_, i) => i + 1).filter((n) => ![24, 43, 49].includes(n));
const zSzukaniem = (grupy) => grupy.map((g) => ({ ...g, stacje: [...g.stacje, ...g.nowe_stacje] })); // jak src/osd-energa.js

test('Energa – źródło: adresy https, sha256, stan na 31.08.2026, strony', () => {
  const z = energa.zrodlo;
  assert.match(z.url_strony, /^https:\/\/energa-operator\.pl\//);
  assert.match(z.url_pdf, /^https:\/\/cdn-netpr\.pl\/.+\.pdf$/);
  assert.equal(z.sha256, '43abdeed101270cb7c66bb919f17fe7e6ab8a22632e3186fd611bd24cf903324');
  assert.equal(z.stan_na, '2026-08-31');
  assert.match(z.pobrano, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(z.strony, [3, 4, 5, 6, 7, 15, 16]);
  assert.match(z.podstawa_prawna, /2026 poz\. 516/);
});

test('Energa – grupy: 48, numery 1–51 bez 24, 43, 49, nazwy bez powtórzeń, poziom 3 tylko grupy sprawdzone przez Anię', () => {
  assert.equal(E.length, 48);
  assert.equal(energa.liczba_grup.tabele, 48);
  assert.equal(energa.liczba_grup.tekst_dokumentu, 48);
  assert.deepEqual(nr(E), NUMERY_ENERGI);
  assert.equal(new Set(E.map((g) => g.nazwa)).size, E.length);
  for (const g of E) {
    assert.ok([5, 6, 7].includes(g.strona_sklad) && g.strona_mw === 16, `gr ${g.nr}: strony`);
    assert.ok([1, 3].includes(g.poziom_weryfikacji), `gr ${g.nr}: poziom`);
  }
  // Ania: 26.11.2026 – 7, 12, 31, 41, 44; 27.11.2026 – 11, 36, 37 (s. 5, 7, 16). Grupa 21 – poziom 1.
  assert.deepEqual(nr(E.filter((g) => g.poziom_weryfikacji === 3)), [7, 11, 12, 31, 36, 37, 41, 44]);
});

test('Energa – stacje: liczba = długość listy, 401 wpisów, 85 czerwonych, bez gwiazdek i przecinków w nazwach', () => {
  let razem = 0;
  let czerwone = 0;
  for (const g of E) {
    assert.ok(g.stacje.length >= 2, `gr ${g.nr}: „od dwóch” stacji (s. 4)`);
    assert.equal(g.liczba_stacji, g.stacje.length, `gr ${g.nr}: liczba stacji`);
    for (const s of [...g.stacje, ...g.nowe_stacje]) {
      assert.ok(s.nazwa.trim() === s.nazwa && s.nazwa.length > 1, `gr ${g.nr}: nazwa „${s.nazwa}”`);
      assert.ok(!/[*,]/.test(s.nazwa), `gr ${g.nr}: znak w nazwie „${s.nazwa}”`);
    }
    for (const s of g.stacje) {
      assert.equal(typeof s.czerwona, 'boolean');
      if (s.czerwona) czerwone++;
    }
    razem += g.stacje.length;
  }
  assert.equal(razem, 401);
  assert.equal(czerwone, 85);
});

test('Energa – zmiany w kolejnych latach: 4 przeniesienia (gr 11 → 12 od 2028, gr 21 → 25 od 2027), 40 nowych stacji, gr 37 → 36 w 2035', () => {
  const przen = E.flatMap((g) => g.stacje.filter((s) => s.przeniesienie).map((s) => [g.nr, s.nazwa, s.przeniesienie.od_roku, s.przeniesienie.do_grupy]));
  assert.deepEqual(przen, [
    [11, 'Kokoszki', 2028, 12],
    [11, 'Lotnisko', 2028, 12],
    [11, 'Sopot Kamienny Potok', 2028, 12],
    [21, 'Ostróda', 2027, 25],
  ]);
  for (const [, , , doGrupy] of przen) assert.ok(NUMERY_ENERGI.includes(doGrupy));
  const nowe = E.flatMap((g) => g.nowe_stacje);
  assert.equal(nowe.length, 40);
  for (const n of nowe) assert.ok(n.od_roku >= 2027 && n.od_roku <= n.do_roku && n.do_roku === 2035, `nowa stacja ${n.nazwa}`);
  assert.deepEqual(E.find((g) => g.nr === 1).nowe_stacje, [{ nazwa: 'Mielno', od_roku: 2028, do_roku: 2035 }]);
  assert.deepEqual(nr(E.filter((g) => g.polaczenie_2035)), [37]);
  assert.equal(E.find((g) => g.nr === 37).polaczenie_2035.z_grupa, 36);
  // Uwagi SOURCE: gwiazdka bez objaśnienia (gr 23), brak przecinka (gr 36) – nazwy stacji z listy tej grupy.
  assert.deepEqual(E.filter((g) => g.uwagi).map((g) => [g.nr, g.uwagi.map((u) => u.kod)]), [[23, ['gwiazdka_bez_objasnienia']], [36, ['kutno_bez_przecinka']]]);
  for (const g of E) for (const u of g.uwagi ?? []) for (const n of u.stacje) assert.ok(g.stacje.some((s) => s.nazwa === n), `gr ${g.nr}: ${n}`);
  for (const g of E) for (const u of g.uwagi ?? []) assert.equal(typeof pl[`osd.energa.uwaga.${u.kod}`], 'function', u.kod);
});

test('Energa – MW: lata 2026–2031 w wierszu, 2035 osobno (null tylko gr 37), wielokrotności 5 (dokładność 5 MW, s. 15)', () => {
  assert.deepEqual(energa.lata, [2026, 2027, 2028, 2029, 2030, 2031]);
  assert.equal(energa.rok_filtra, 2031);
  assert.equal(energa.rok_docelowy, 2035);
  for (const g of E) {
    assert.deepEqual(Object.keys(g.mw).map(Number), energa.lata, `gr ${g.nr}: lata`);
    for (const v of [...Object.values(g.mw), g.mw_2035].filter((x) => x !== null)) {
      assert.ok(Number.isInteger(v) && v >= 0 && v <= 1000 && v % 5 === 0, `gr ${g.nr}: ${v}`);
    }
  }
  assert.deepEqual(nr(E.filter((g) => g.mw_2035 === null)), [37]);
  // Liczby kontrolne z Tabeli 2.3 (s. 16): 0 MW w 2026 – 11 grup, w 2031 – 3; gr 1 Dunowo: 40 / 230 / 250.
  assert.equal(E.filter((g) => g.mw[2026] === 0).length, 11);
  assert.equal(E.filter((g) => g.mw[2031] === 0).length, 3);
  const g1 = E.find((g) => g.nr === 1);
  assert.deepEqual([g1.mw[2026], g1.mw[2031], g1.mw_2035], [40, 230, 250]);
});

test('Energa – cytaty dokładne ze stroną, każdy ma nasze tłumaczenie (cytaty-osd.js)', () => {
  for (const [k, c] of Object.entries(energa.cytaty)) {
    assert.ok(c.tekst && c.strony, k);
    assert.ok(typeof cytatyOsd[c.tekst] === 'string' && cytatyOsd[c.tekst].trim(), `brak tłumaczenia cytatu Energi „${c.tekst}”`);
  }
  assert.match(energa.cytaty.czerwone.tekst, /^kolorem czerwonym zaznaczono .+ \(w zakresie rozdzielni 110 kV\)$/);
});

test('Energa – filtr MW według 2031 bez sumowania; szukanie w polu PGE także po nowych stacjach', () => {
  assert.deepEqual(nr(filtrujGrupy(E, 200, 2031)), [1, 3, 6, 8, 10, 40]);
  assert.deepEqual(nr(filtrujGrupy(E, 230, 2031)), [1, 10]);
  assert.deepEqual(nr(filtrujGrupy(E, 231, 2031)), []);
  assert.equal(najwiekszaMocGrupy(E, 2031), 230);
  assert.equal(filtrujGrupy(E, 5, 2031).length, 45);
  const o = szukajStacji(zSzukaniem(E), 'ostrow');
  assert.deepEqual(o.wyniki.map((w) => w.grupa.nr), [6, 13, 50]);
  assert.deepEqual(o.dokladne, [{ nazwa: 'Ostrów', grup: 2 }]);
  assert.deepEqual(szukajStacji(zSzukaniem(E), 'mielno').wyniki.map((w) => w.grupa.nr), [1]);
  assert.deepEqual(szukajStacji(zSzukaniem(E), 'kutno').wyniki.map((w) => w.grupa.nr), [36, 37]);
});

test('teksty F2.2: każdy klucz osd.energa.* w PL i EN; „Mielno (2028–2035)” bez „od”; przypis o czerwonych pełnym zdaniem', () => {
  const klucze = Object.keys(pl).filter((k) => k.startsWith('osd.energa.'));
  assert.ok(klucze.length >= 23);
  for (const k of klucze) assert.equal(typeof en[k], typeof pl[k], k);
  assert.equal(pl['osd.energa.przeniesienie'](2028, 12, 'Oliwa'), 'od 2028 w grupie 12 (Oliwa)');
  assert.equal(pl['osd.energa.nowe_stacje'], 'nowe stacje w kolejnych latach:');
  assert.match(pl['osd.energa.wiersz_grupa']('Dunowo', '16 stacji'), /^Grupa Dunowo · 16 stacji \(model sieci na 2026 r\.\)$/);
  assert.match(pl['moce.osd_wstep'], /dane PGE i Energi/);
  assert.match(pl['osd.szukaj_etykieta'], /PGE i Energi/);
  assert.match(pl['stopka.osd_energa'], /SOURCE nie jest powiązany z Energa-Operator S\.A\./);
  assert.equal(pl['osd.energa.tytul'], 'Wolna moc dla odbiorców · Energa-Operator 110\u00a0kV');
  assert.equal(pl['osd.szukaj_brak_obu']('xyz'), 'Brak stacji PGE i Energi o nazwie zawierającej „xyz”.');
  assert.ok(!('osd.energa.szukaj_brak' in pl), 'osobne „brak” Energi – zastąpione wspólnym zdaniem');
});
