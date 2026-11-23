// Pilnuje, żeby żaden tekst strony nie został bez tłumaczenia (wersja PL i EN – decyzja Ani 23.11.2026).
// Uruchom: node --test scripts/testy-jezyki.mjs
// Sprawdza: te same klucze w obu słownikach, każdy użyty klucz istnieje, w kodzie i szablonach nie ma polskich napisów
// poza słownikami, gotowe strony EN nie mają polskich słów, a teksty z danych (kategorie GEM, statusy i weryfikacja farm,
// cytaty PSE, powody plakietki) mają tłumaczenie. Test nie sprawdzi, czy tłumaczenie ma TEN SAM SENS – to sprawdza Ania.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import pl from '../src/teksty/pl.js';
import en from '../src/teksty/en.js';
import cytaty from '../src/teksty/cytaty-pse.js';
import { STRONY, wypelnij } from './jezyki.mjs';

const KATALOG = resolve(import.meta.dirname, '..');
const czytaj = (p) => readFileSync(resolve(KATALOG, p), 'utf-8');
const json = (p) => JSON.parse(czytaj(p));

// Pliki jeszcze NIE przetłumaczone – plan: e3 źródła i licencje. Po e3 lista ma być pusta.
// Nowy plik z tekstami, którego tu nie ma, test sprawdza od razu.
const PRZEJSCIOWE = {
  'src/czesci/stopka.html': 'e3',
};

// Polskie nazwy własne, które zostają w tekście angielskim (bez tłumaczenia – nazwa ministerstwa, projektu).
const NAZWY_WLASNE = ['MKiŚ', 'MFW Bałtyk I'];
const bezNazwWlasnych = (s) => NAZWY_WLASNE.reduce((w, n) => w.replaceAll(n, ''), s);

// Polskie litery i częste polskie słowa (bez polskich liter, np. „brak danych”).
const POLSKIE_LITERY = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const POLSKIE_SLOWA =
  /\b(brak|danych|dane|dla|oraz|się|nie|jest|lub|przez|tylko|teraz|ostatnie|pobranie|godzina|mapa|mapy|farmy|elektrownie|czas|cena|wiatr|stan|moc|wolna|wkrótce|źródło|pobrano|kwadrans|stacja|rozdzielnia|planowana|budowie)\b/i;
// Nazwy techniczne (adresy, identyfikatory, klasy: „/mapa/”, „wiatr-pobrano”, „brak-danych”) to nie tekst dla widza:
// jedno „słowo” z łącznikiem, ukośnikiem albo kropką i bez polskich liter.
// Także jedno małe słowo bez polskich liter (nazwy w kodzie: id „mapa”, warstwa „elektrownie”, pole „moc”) –
// taki tekst dla widza złapie sprawdzian gotowej strony EN i przegląd w przeglądarce.
// Także lista klas CSS („okienko-mocy__ostrzezenie brak-danych”).
const TECHNICZNE = /^\s*(?:[\w/.#-]*[-/.][\w/.#-]*|[a-z_]+|(?:[a-z0-9]+(?:[-_]+[a-z0-9]+)+\s*)+)\s*$/;
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
// Elementy z lang="pl" (np. „Polski” w przełączniku) są celowo po polsku.
function tekstyHtml(html, { bezStopki = false } = {}) {
  let h = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  if (bezStopki) h = h.replace(/<footer class="stopka">[\s\S]*?<\/footer>/, '');
  h = h.replace(/<a [^>]*lang="pl"[^>]*>[^<]*<\/a>/g, '');
  const teksty = [...h.matchAll(/>([^<]+)</g)].map((m) => m[1].trim());
  const atrybuty = [...h.matchAll(/\s(?:aria-label|title|alt|placeholder|content)="([^"]*)"/g)].map((m) => m[1]);
  // Same znaczniki {{…}} to nie tekst – teksty za nimi sprawdzają testy słowników.
  return [...teksty, ...atrybuty].map((t) => t.replace(/\{\{[^}]+\}\}/g, '').trim()).filter(Boolean);
}

// Szablon tak, jak widzi go wtyczka (ze wstawioną stopką – jak w vite.config.js).
const zeStopka = (html) => html.replace('<!-- STOPKA -->', czytaj('src/czesci/stopka.html'));

// Wartość słownika jako tekst (funkcja – z przykładowymi argumentami; odmiana – wszystkie formy).
const jakoTekst = (w) =>
  typeof w === 'function' ? w(...Array(w.length).fill('X')) : typeof w === 'object' ? Object.values(w).join(' ') : w;

test('oba słowniki mają te same klucze, bez pustych wartości, ten sam rodzaj (napis / funkcja / odmiana)', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(pl).sort());
  for (const k of Object.keys(pl)) {
    assert.equal(typeof en[k], typeof pl[k], `„${k}”: w słownikach różne rodzaje wartości`);
    if (typeof pl[k] === 'function') assert.equal(en[k].length, pl[k].length, `„${k}”: inna liczba argumentów`);
    else if (typeof pl[k] === 'object') {
      // Odmiana: PL – one, few, many; EN – one, other (Intl.PluralRules).
      assert.deepEqual(Object.keys(pl[k]).sort(), ['few', 'many', 'one'], `„${k}” (pl): formy one, few, many`);
      assert.deepEqual(Object.keys(en[k]).sort(), ['one', 'other'], `„${k}” (en): formy one, other`);
    }
    for (const [nazwa, s] of [['pl', pl], ['en', en]]) {
      assert.ok(jakoTekst(s[k]).trim() !== '', `pusty tekst „${k}” (${nazwa})`);
    }
  }
});

test('słownik EN nie ma polskich liter (poza nazwami własnymi z listy)', () => {
  for (const [k, w] of Object.entries(en)) {
    if (k === 'cytat.oryginal') continue; // z definicji pokazuje polski oryginał
    const tekst = bezNazwWlasnych(jakoTekst(w));
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
    for (const [, k] of czytaj(p).matchAll(/\btn?\(\s*'([\w.-]+)'/g)) {
      assert.ok(k in pl && k in en, `${p}: brak „${k}” w słownikach`);
    }
  }
  // Klucze składane w kodzie (np. t(`zrodlo.${rodzaj}`), t(`moce.lok_krotko.${rodzaj}`)).
  for (const k of ['zrodlo.pobrano', 'zrodlo.dane', 'zrodlo.stan', 'moce.lok_krotko.okolica', 'moce.lok_krotko.stacja-osm', 'moce.lok_krotko.brak']) {
    assert.ok(k in pl && k in en, `brak „${k}”`);
  }
  for (const r of ['wegiel', 'gaz', 'woda', 'pompowa']) assert.ok(`elektrownia.${r}` in en, `brak „elektrownia.${r}”`);
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
      const polskie = tekstyHtml(html, { bezStopki: stopkaPrzejsciowa }).map(bezNazwWlasnych).filter(poPolsku);
      assert.deepEqual(polskie, [], `${strona} (en): polskie teksty`);
    }
  }
});

// ── Teksty z danych: każda wartość, którą strona pokazuje, ma tłumaczenie ──

test('dane GEM: paliwa i technologie wodne pokazywane w okienkach mają tłumaczenie', () => {
  const geo = json('public/data/zrodla-gem.geojson');
  for (const { properties: p } of geo.features) {
    if (p.status !== 'operating') continue;
    if (p.typ === 'coal' || p.typ === 'oil/gas') {
      for (const paliwo of String(p.paliwo ?? '').split(', ').filter(Boolean)) {
        assert.ok(`gem.paliwo.${paliwo}` in en, `brak tłumaczenia paliwa GEM „${paliwo}” (${p.nazwa})`);
      }
    }
    if (p.typ === 'hydropower' && p.technologia) {
      assert.ok(`gem.technologia.${p.technologia}` in en, `brak tłumaczenia technologii GEM „${p.technologia}” (${p.nazwa})`);
    }
    if (p.typ === 'wind' && p.technologia === 'Onshore') {
      assert.ok(`farmy.lad.${p.status}` in en, `brak tłumaczenia statusu „${p.status}”`);
    }
  }
});

test('farmy morskie: statusy i weryfikacja mają tłumaczenie', () => {
  const geo = json('public/data/farmy-baltyk.geojson');
  const duplikat = pl['farmy.weryfikacja.duplikat'];
  const znane = Object.keys(pl).filter((k) => k.startsWith('farmy.weryfikacja.')).map((k) => pl[k]);
  for (const { properties: p } of geo.features) {
    assert.ok(`farmy.morskie.${p.status}` in en, `brak tłumaczenia statusu EMODnet „${p.status}” (${p.nazwa})`);
    for (const tekst of [p.weryfikacja, p.weryfikacja_opis].filter(Boolean)) {
      assert.ok(tekst.startsWith(duplikat) || znane.includes(tekst), `brak tłumaczenia weryfikacji „${tekst}” (${p.nazwa})`);
    }
  }
});

test('cytaty PSE (opisy stacji, tytuły list wykazu) mają nasze tłumaczenie', () => {
  const moce = json('public/data/moce-pse.json');
  const wykaz = json('public/data/rozdzielnie-pse.json');
  const cytatyDanych = [...moce.odbiorcy.map((s) => s.opis_pse), ...wykaz.listy.map((l) => l.tytul)];
  for (const c of cytatyDanych) assert.ok(typeof cytaty[c] === 'string' && cytaty[c].trim(), `brak tłumaczenia cytatu PSE „${c}”`);
  // Tłumaczenie zostawia polskie litery tylko w nazwach miejsc – nie może być kopią polskiego zdania.
  for (const [pl_, en_] of Object.entries(cytaty)) {
    assert.ok(!/\b(stacja|rejonie|Lista|rozdzielni)\b/.test(en_), `„${pl_}”: tłumaczenie wygląda na nieprzetłumaczone`);
  }
});

test('powody plakietki Karty to dokładnie te teksty, które zapisuje scripts/karta/pobierz.mjs', () => {
  const skrypt = czytaj('scripts/karta/pobierz.mjs');
  for (const k of Object.keys(pl).filter((k) => k.startsWith('karta.powod.'))) {
    assert.ok(skrypt.includes(`'${pl[k]}'`), `„${pl[k]}” (${k}) – nie ma takiego tekstu w pobierz.mjs`);
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
