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
