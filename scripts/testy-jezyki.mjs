// Pilnuje, żeby żaden tekst strony nie został bez tłumaczenia (wersja PL i EN – decyzja Ani 23.11.2026).
// Uruchom: node --test scripts/testy-jezyki.mjs
// Sprawdza: te same klucze w obu słownikach, każdy użyty klucz istnieje, w kodzie i szablonach nie ma polskich napisów
// poza słownikami, gotowa strona EN nie ma polskich słów. Test nie sprawdzi, czy tłumaczenie ma TEN SAM SENS –
// to sprawdza Ania (tabela PL | EN zastrzeżeń w e3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import pl from '../src/teksty/pl.js';
import en from '../src/teksty/en.js';
import { STRONY, wypelnij } from './jezyki.mjs';

const KATALOG = resolve(import.meta.dirname, '..');
const czytaj = (p) => readFileSync(resolve(KATALOG, p), 'utf-8');

// Pliki jeszcze NIE przetłumaczone – plan: e2 mapa, e3 metodologia i źródła. Po e3 lista ma być pusta.
// Nowy plik z tekstami, którego tu nie ma, test sprawdza od razu.
const PRZEJSCIOWE = {
  'mapa/index.html': 'e2',
  'src/main.js': 'e2',
  'src/moce.js': 'e2',
  'src/karta.js': 'e2',
  'src/karta-teksty.js': 'e2',
  'src/okienko.js': 'e2',
  'src/liczniki.js': 'e2 (odmiana liczebników na mapie)',
  'src/czesci/stopka.html': 'e3',
};

// Polskie litery i częste polskie słowa (bez polskich liter, np. „brak danych”).
const POLSKIE_LITERY = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const POLSKIE_SLOWA =
  /\b(brak|danych|dane|dla|oraz|się|nie|jest|lub|przez|tylko|teraz|ostatnie|pobranie|godzina|mapa|mapy|farmy|elektrownie|czas|cena|wiatr|stan|moc|wolna|wkrótce|źródło|pobrano)\b/i;
// Nazwy techniczne (adresy, identyfikatory, klasy: „/mapa/”, „wiatr-pobrano”, „brak-danych”) to nie tekst dla widza:
// jedno „słowo” z łącznikiem, ukośnikiem albo kropką i bez polskich liter.
const TECHNICZNE = /^\s*[\w/.#-]*[-/.][\w/.#-]*\s*$/;
const poPolsku = (s) => POLSKIE_LITERY.test(s) || (POLSKIE_SLOWA.test(s) && !TECHNICZNE.test(s));

const wszystkiePliki = (katalog, rozszerzenie) =>
  readdirSync(resolve(KATALOG, katalog), { recursive: true })
    .filter((p) => p.endsWith(rozszerzenie))
    .map((p) => `${katalog}/${p}`);

const PLIKI_JS = wszystkiePliki('src', '.js').filter((p) => !p.startsWith('src/teksty/'));
const SZABLONY = [...Object.values(STRONY).map((s) => s.plik), 'src/czesci/stopka.html'];

// Napisy w kodzie JS (bez komentarzy i bez komunikatów dla programisty – console.… i new Error(…) widz nie widzi).
function napisyJs(kod) {
  const bez = kod
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/([^:'"`])\/\/.*$/gm, '$1')
    .replace(/(console\.\w+|new Error)\(\s*(['"`])(?:\\.|(?!\2)[^\\])*?\2/g, '$1(');
  return [...bez.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*?)\1/g)].map((m) => m[2].replace(/\$\{[^}]*\}/g, ' '));
}

// Teksty widoczne dla człowieka w HTML: między znacznikami i w atrybutach czytanych na głos albo pokazywanych.
function tekstyHtml(html, { bezStopki = false } = {}) {
  let h = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  if (bezStopki) h = h.replace(/<footer class="stopka">[\s\S]*?<\/footer>/, '');
  const teksty = [...h.matchAll(/>([^<]+)</g)].map((m) => m[1].trim());
  const atrybuty = [...h.matchAll(/\s(?:aria-label|title|alt|placeholder|content)="([^"]*)"/g)].map((m) => m[1]);
  return [...teksty, ...atrybuty].filter((t) => t && !/^\{\{[^}]+\}\}$/.test(t));
}

// Szablon tak, jak widzi go wtyczka (ze wstawioną stopką – jak w vite.config.js).
const zeStopka = (html) => html.replace('<!-- STOPKA -->', czytaj('src/czesci/stopka.html'));

test('oba słowniki mają te same klucze, bez pustych wartości, ten sam rodzaj (napis / funkcja)', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(pl).sort());
  for (const k of Object.keys(pl)) {
    for (const [nazwa, s] of [['pl', pl], ['en', en]]) {
      const w = s[k];
      assert.ok(typeof w === 'function' || (typeof w === 'string' && w.trim() !== ''), `pusty tekst „${k}” (${nazwa})`);
    }
    assert.equal(typeof en[k], typeof pl[k], `„${k}”: w jednym słowniku napis, w drugim funkcja`);
    if (typeof pl[k] === 'function') assert.equal(en[k].length, pl[k].length, `„${k}”: inna liczba argumentów`);
  }
});

test('słownik EN nie ma polskich liter', () => {
  for (const [k, w] of Object.entries(en)) {
    const tekst = typeof w === 'function' ? w(...Array(w.length).fill('X')) : w;
    assert.ok(!POLSKIE_LITERY.test(tekst), `polska litera w EN „${k}”: ${tekst}`);
  }
});

test('każdy klucz użyty w szablonach i w JavaScripcie jest w obu słownikach', () => {
  for (const p of SZABLONY) {
    for (const [, k] of czytaj(p).matchAll(/\{\{([@\w.:-]+)\}\}/g)) {
      if (k.startsWith('@')) continue; // adresy – wylicza scripts/jezyki.mjs
      assert.equal(typeof pl[k], 'string', `${p}: brak napisu „${k}” w pl.js`);
      assert.equal(typeof en[k], 'string', `${p}: brak napisu „${k}” w en.js`);
    }
  }
  for (const p of PLIKI_JS) {
    for (const [, k] of czytaj(p).matchAll(/\bt\(\s*'([\w.-]+)'/g)) {
      assert.ok(k in pl && k in en, `${p}: brak „${k}” w słownikach`);
    }
  }
});

test('poza słownikami nie ma polskich napisów (z wyjątkiem plików przejściowych)', (t) => {
  const przejsciowe = Object.entries(PRZEJSCIOWE).map(([p, kiedy]) => `${p} (${kiedy})`);
  if (przejsciowe.length) t.diagnostic(`Jeszcze bez tłumaczenia: ${przejsciowe.join(', ')}`);
  for (const p of [...PLIKI_JS, ...SZABLONY]) {
    if (p in PRZEJSCIOWE || !existsSync(resolve(KATALOG, p))) continue;
    const kod = czytaj(p);
    const napisy = p.endsWith('.html') ? tekstyHtml(kod) : napisyJs(kod);
    const polskie = napisy.filter(poPolsku);
    assert.deepEqual(polskie, [], `${p}: polskie napisy poza słownikiem`);
  }
});

test('gotowe strony: każda wersja wypełniona, EN bez polskich słów', () => {
  for (const [strona, s] of Object.entries(STRONY)) {
    const szablon = zeStopka(czytaj(s.plik));
    for (const jezyk of s.en ? ['pl', 'en'] : ['pl']) {
      const html = wypelnij(szablon, jezyk, strona);
      assert.ok(!/\{\{/.test(html), `${strona} (${jezyk}): został znacznik {{…}}`);
      assert.match(html, new RegExp(`<html lang="${jezyk}"`));
      if (jezyk !== 'en') continue;
      const stopkaPrzejsciowa = 'src/czesci/stopka.html' in PRZEJSCIOWE;
      const polskie = tekstyHtml(html, { bezStopki: stopkaPrzejsciowa }).filter(poPolsku);
      assert.deepEqual(polskie, [], `${strona} (en): polskie teksty`);
    }
  }
});

test('po zbudowaniu (jeśli jest dist/): strony EN istnieją i mają lang="en"', (t) => {
  if (!existsSync(resolve(KATALOG, 'dist'))) return t.skip('brak dist/ – najpierw npm run build');
  for (const s of Object.values(STRONY)) {
    if (!s.en) continue;
    const plik = resolve(KATALOG, 'dist', `${s.en.slice(1)}index.html`);
    assert.ok(existsSync(plik), `brak ${relative(KATALOG, plik)}`);
    const html = readFileSync(plik, 'utf-8');
    assert.match(html, /<html lang="en"/);
    assert.ok(!/\{\{/.test(html), 'został znacznik {{…}}');
  }
});
