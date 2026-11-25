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

// Pliki jeszcze NIE przetłumaczone. Po e3 (stopka) lista jest pusta – każdy plik z tekstami jest sprawdzany.
const PRZEJSCIOWE = {};

// Polskie nazwy własne, które zostają w tekście angielskim (bez tłumaczenia): nazwa ministerstwa, projektu
// i tytuły dokumentów PSE w stopce (w cudzysłowie, a obok nasze tłumaczenie w nawiasie).
const NAZWY_WLASNE = [
  'MKiŚ',
  'Kołodziejczyk',
  'MFW Bałtyk I',
  'Nierynkowe redysponowanie źródeł OZE',
  'Rynkowa cena energii elektrycznej',
  'Informacja o dostępności mocy przyłączeniowej do sieci przesyłowej',
  'Wykaz rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów',
];
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
// Adresy (http/https) to nie tekst dla widza – mogą zawierać polskie słowa (np. adres komunikatu URE).
const ADRES = /^https?:\/\/\S+$/;
const poPolsku = (s) => !ADRES.test(s) && (POLSKIE_LITERY.test(s) || (POLSKIE_SLOWA.test(s) && !TECHNICZNE.test(s)));

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

// ── Stopka „Źródła i licencje”: licencje, podpisy i linki w obu wersjach te same ──

test('stopka: te same linki, miejsca na daty i podpisy licencji w PL i EN; podpis NASA w oryginale', () => {
  const klucze = Object.keys(pl).filter((k) => k.startsWith('stopka.'));
  const linki = (s) => [...s.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const daty = (s) => [...s.matchAll(/<span id="([^"]+)"/g)].map((m) => m[1]);
  // Jedyna zamierzona różnica w linkach: streszczenie CC BY 4.0 po polsku / po angielsku (decyzja Ani 23.11.2026).
  const bezJezykaCC = (h) => h.replace(/\/deed\.(pl|en)$/, '/deed');
  for (const k of klucze) {
    assert.deepEqual(linki(en[k]).map(bezJezykaCC), linki(pl[k]).map(bezJezykaCC), `${k}: inne linki w EN`);
    assert.deepEqual(daty(en[k]), daty(pl[k]), `${k}: inne miejsca na daty w EN`);
    for (const h of linki(pl[k])) if (h.includes('creativecommons.org')) assert.ok(h.endsWith('/deed.pl'), `${k}: PL – deed.pl`);
    for (const h of linki(en[k])) if (h.includes('creativecommons.org')) assert.ok(h.endsWith('/deed.en'), `${k}: EN – deed.en`);
    // Do wczytania danych: „wczytywanie…” / „loading…”, nie „brak danych” (zasada z PR #29).
    for (const [s, napis] of [[pl[k], 'wczytywanie…'], [en[k], 'loading…']]) {
      for (const m of s.matchAll(/<span id="[^"]+">([^<]*)<\/span>/g)) assert.equal(m[1], napis, `${k}: miejsce na datę`);
    }
  }
  // Nazwy licencji i wymagane podpisy – dokładnie w oryginale, w obu językach.
  const calosc = (s) => klucze.map((k) => s[k]).join(' ');
  const OSM = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>';
  for (const [nazwa, s] of [['pl', pl], ['en', en]]) {
    for (const wymagane of [OSM, '>ODbL</a>', '>CC BY 4.0</a>', 'SIL Open Font License 1.1', 'Natural Earth', 'Global Integrated Power Tracker', 'September 2026 release']) {
      assert.ok(calosc(s).includes(wymagane), `stopka (${nazwa}): brak „${wymagane}”`);
    }
  }
  const szablon = czytaj('src/czesci/stopka.html').replace(/\s+/g, ' ');
  assert.ok(
    szablon.includes(
      "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS).",
    ),
    'podpis NASA zmieniony',
  );
});

test('obrazek do udostępniania: osobny plik dla każdego języka i plik istnieje w public/', () => {
  assert.notEqual(pl['meta.og_obraz'], en['meta.og_obraz']);
  for (const s of [pl, en]) {
    const plik = s['meta.og_obraz'].replace('https://osiris-ania-rafael.pages.dev/', 'public/');
    assert.ok(existsSync(resolve(KATALOG, plik)), `brak ${plik}`);
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

// Etap C1 (25.11.2026): nowe i zmienione teksty zakładki „Gdzie” – każdy w PL i EN, ten sam rodzaj, bez „obecnie”
// (data wykazu z danych). Kolejne klucze C1 (wybrane warianty) – dopisywać do tej listy.
const KLUCZE_C1 = ['leg.moce_pusty', 'leg.moce_110', 'moce.zrodla_dotyczy', 'moce.uwaga_pusty', 'moce.uwaga_110', 'moce.wstrzymane_pusty', 'moce.podsumowanie', 'moce.wniosek_b', 'moce.szacunek_analogia', 'slownik.kv_termin', 'slownik.kv', 'slownik.rozdzielnia_termin', 'slownik.rozdzielnia', 'slownik.rozdzielnia_w_zdaniu', 'slownik.aria', 'slownik.objasnienie'];
test('Etap C1: nowe klucze zakładki „Gdzie” mają PL i EN, bez „obecnie” / „currently”', () => {
  const tekst = (v) => (typeof v === 'function' ? v('4.02.2026', '220 lub 400 kV', 2, 5, '04.02.2026', '31.10.2026') : String(v));
  for (const k of KLUCZE_C1) {
    assert.ok(k in pl && k in en, `brak ${k} w PL albo EN`);
    assert.equal(typeof pl[k], typeof en[k], k);
    assert.ok(tekst(pl[k]).trim() && tekst(en[k]).trim(), `pusty tekst: ${k}`);
    assert.ok(!/obecnie/.test(tekst(pl[k])) && !/currently/.test(tekst(en[k])), `„obecnie”/„currently” w ${k}`);
  }
});

// Etap C2 (25.11.2026): nowe klucze pierwszego ekranu, Karty i objaśnień – każdy w PL i EN, ten sam rodzaj.
const KLUCZE_C2 = [
  'karta.skrot_produkcja', 'karta.skrot_oze', 'karta.skrot_wegiel', 'karta.skrot_rce', 'karta.skrot_moce', 'karta.skrot_stan',
  'karta.kafel_udzial', 'karta.kafel_rce', 'karta.kafel_moce', 'karta.kafel_aria',
  'karta.wniosek_krotki', 'karta.wn_produkcja', 'karta.wn_udzialy', 'karta.wn_kupuje', 'karta.wn_sprzedaje', 'karta.wn_co2',
  'karta.zapotrzebowanie', 'karta.wiatr_slonce_z', 'karta.cena_kwh',
  'slownik.mw', 'slownik.mwh', 'slownik.saldo', 'slownik.oze', 'slownik.kobize', 'slownik.ipcc', 'slownik.rce', 'slownik.rce_zrodlo', 'slownik.rce_osiris',
];
test('Etap C2: nowe klucze mają PL i EN, ten sam rodzaj; RCE bez „netto” i „prosument”', () => {
  for (const k of KLUCZE_C2) {
    assert.ok(k in pl && k in en, `brak ${k}`);
    assert.equal(typeof pl[k], typeof en[k], k);
  }
  for (const k of ['slownik.rce', 'slownik.rce_osiris']) assert.ok(!/netto|prosument|net of|prosumer/i.test(pl[k] + en[k]), k);
});
