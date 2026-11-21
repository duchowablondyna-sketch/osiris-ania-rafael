// Wyciąg z „Wykazu rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów” (PSE, XLSX).
// Bez pakietów: XLSX to archiwum ZIP z plikami XML – czytamy je wbudowanym zlib. Komentarzy z arkusza nie przenosimy
// (to notatki wewnętrzne z danymi autora). Surowy XLSX zostaje poza repo; do repo trafia public/data/rozdzielnie-pse.json.
// Użycie: node scripts/pse-moce/rozdzielnie.mjs --plik <xlsx> --url <adres> [--last-modified "<nagłówek>"] [--wyjscie <json>]
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

export const STRONA_PSE = 'https://www.pse.pl/dane-systemowe/praca-kse/informacje-ogolne/wykaz-obiektow-planowanych-do-przylaczenia';

// Minimalny czytnik ZIP: katalog centralny → nazwy i położenia plików; metoda 0 (bez kompresji) albo 8 (deflate).
export function rozpakuj(bufor) {
  let eocd = -1;
  for (let i = bufor.length - 22; i >= Math.max(0, bufor.length - 65_557); i--) {
    if (bufor.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('To nie jest plik XLSX (brak katalogu ZIP).');
  const liczba = bufor.readUInt16LE(eocd + 10);
  let p = bufor.readUInt32LE(eocd + 16);
  const pliki = new Map();
  for (let n = 0; n < liczba; n++) {
    if (bufor.readUInt32LE(p) !== 0x02014b50) throw new Error('Uszkodzony katalog ZIP.');
    const metoda = bufor.readUInt16LE(p + 10);
    const rozmiar = bufor.readUInt32LE(p + 20);
    const dlNazwy = bufor.readUInt16LE(p + 28), dlExtra = bufor.readUInt16LE(p + 30), dlKom = bufor.readUInt16LE(p + 32);
    const lokalny = bufor.readUInt32LE(p + 42);
    const nazwa = bufor.subarray(p + 46, p + 46 + dlNazwy).toString('utf-8');
    const start = lokalny + 30 + bufor.readUInt16LE(lokalny + 26) + bufor.readUInt16LE(lokalny + 28);
    const dane = bufor.subarray(start, start + rozmiar);
    pliki.set(nazwa, () => (metoda === 0 ? dane : metoda === 8 ? inflateRawSync(dane) : null));
    p += 46 + dlNazwy + dlExtra + dlKom;
  }
  return (nazwa) => pliki.get(nazwa)?.()?.toString('utf-8') ?? null;
}

const odXml = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// Arkusz → komórki { 'A6': 'Katowice', ... } (tylko pierwszy arkusz – w pliku jest jeden).
export function komorki(plik) {
  const wspolne = [...(plik('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    odXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
  );
  const arkusz = plik('xl/worksheets/sheet1.xml');
  if (!arkusz) throw new Error('Brak arkusza xl/worksheets/sheet1.xml.');
  const wynik = {};
  for (const m of arkusz.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, adres, atrybuty, srodek = ''] = m;
    const typ = atrybuty.match(/t="([^"]+)"/)?.[1];
    const v = srodek.match(/<v>([\s\S]*?)<\/v>/)?.[1];
    let wartosc = typ === 's' ? wspolne[Number(v)] : typ === 'inlineStr' ? odXml([...srodek.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')) : v != null ? odXml(v) : '';
    if (wartosc !== undefined && wartosc !== '') wynik[adres] = wartosc.trim();
  }
  return wynik;
}

// Komórki → trzy listy. Lista zaczyna się od tytułu w kolumnie A, potem zdanie „Wnioski …”, nagłówek „ZKO PSE” i wiersze.
export function parsujWykaz(k) {
  const nierozpoznane = [];
  const wiersze = Math.max(...Object.keys(k).map((a) => Number(a.match(/\d+/)[0])));
  const data = Object.values(k).map((v) => v.match(/^Stan na dzień (\d{1,2})\.(\d{2})\.(\d{4}) r\.$/)).find(Boolean);
  if (!data) nierozpoznane.push('Brak daty „Stan na dzień …” w arkuszu.');
  const listy = [];
  let biezaca = null;
  const uwagiKoncowe = [];
  for (let r = 1; r <= wiersze; r++) {
    const [a, b, c, d, e] = ['A', 'B', 'C', 'D', 'E'].map((kol) => k[`${kol}${r}`]);
    if (a === 'ZKO PSE') {
      if (!biezaca) nierozpoznane.push(`Wiersz ${r}: nagłówek tabeli bez tytułu listy.`);
      else biezaca.naglowek = [a, b, c, d, e];
      continue;
    }
    if (a && !b && !c && !d && !e) {
      if (/^Lista /.test(a)) {
        biezaca = { tytul: a.replace(/\s+/g, ' ').trim(), uwaga: null, naglowek: null, rozdzielnie: [] };
        listy.push(biezaca);
      } else if (biezaca && !biezaca.uwaga && /^Wnioski /.test(a)) biezaca.uwaga = a;
      else if (/^(Dodatkowo|- )/.test(a)) uwagiKoncowe.push(a);
      continue;
    }
    if (biezaca?.naglowek && a && b && d && e !== undefined) {
      const miejsca = Number(e);
      if (!Number.isInteger(miejsca)) nierozpoznane.push(`Wiersz ${r}: liczba miejsc „${e}” nie jest liczbą.`);
      // Symbol z dopiskiem w nawiasie („BEB (EJ1)”): oba kody – PSE używa obu oznaczeń tej samej stacji.
      const kody = [...b.matchAll(/[A-Z0-9]{2,4}/g)].map((m) => m[0]);
      biezaca.rozdzielnie.push({ wiersz: r, zko: a, symbol: b, kody, opis: c ?? null, rozdzielnia: d, miejsca });
    }
  }
  return {
    stan_na: data ? `${data[3]}-${data[2]}-${data[1].padStart(2, '0')}` : null,
    listy: listy.map(({ tytul, uwaga, naglowek, rozdzielnie }) => ({ tytul, uwaga, naglowek, rozdzielnie })),
    uwagi_koncowe: uwagiKoncowe,
    nierozpoznane,
  };
}

// Sprawdzian: data, 3 listy z nagłówkami, każda z wierszami, liczby miejsc całkowite.
export function sprawdzWykaz(w) {
  const bledy = [...w.nierozpoznane];
  if (!w.stan_na) bledy.push('Brak daty wykazu.');
  if (w.listy.length !== 3) bledy.push(`W wykazie ${w.listy.length} list zamiast 3 – układ się zmienił.`);
  w.listy.forEach((l, i) => {
    if (!l.naglowek || l.naglowek[0] !== 'ZKO PSE' || !/^Liczba dostępnych miejsc/.test(l.naglowek[4] ?? '')) bledy.push(`Lista ${i + 1}: inny nagłówek tabeli niż znany.`);
    if (!l.uwaga) bledy.push(`Lista ${i + 1}: brak zdania „Wnioski …”.`);
    if (!l.rozdzielnie.length) bledy.push(`Lista ${i + 1}: brak wierszy.`);
  });
  return bledy;
}

// Kody stacji z list 2 i 3 i reguła pustego sześciokąta – wspólne z mapą (src/wykaz-rozdzielni.js).
export { stacjeBezRozpatrzenia, czyPusty } from '../../src/wykaz-rozdzielni.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opcja = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  if (!opcja('--plik') || !opcja('--url')) {
    console.error('Użycie: node scripts/pse-moce/rozdzielnie.mjs --plik <xlsx> --url <adres> [--last-modified "<nagłówek>"] [--wyjscie <json>]');
    process.exit(2);
  }
  const bufor = await readFile(opcja('--plik'));
  const wykaz = parsujWykaz(komorki(rozpakuj(bufor)));
  const bledy = sprawdzWykaz(wykaz);
  if (bledy.length) {
    console.error(`Sprawdzian wykazu NIE przeszedł:\n- ${bledy.join('\n- ')}`);
    process.exit(1);
  }
  const wynik = {
    opis: 'Wykaz rozdzielni PSE bez możliwości przyłączenia nowych obiektów – wyciąg OSIRIS (bez komentarzy z arkusza).',
    zrodlo: {
      nazwa: 'PSE S.A., „Wykaz rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów”',
      url_strony: STRONA_PSE,
      url_pliku: opcja('--url'),
      pobrano: new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }),
      sha256: createHash('sha256').update(bufor).digest('hex'),
      last_modified: opcja('--last-modified') ?? null,
    },
    stan_na: wykaz.stan_na,
    listy: wykaz.listy,
    uwagi_koncowe: wykaz.uwagi_koncowe,
  };
  const wyjscie = opcja('--wyjscie') ?? 'public/data/rozdzielnie-pse.json';
  await writeFile(wyjscie, `${JSON.stringify(wynik, null, 2)}\n`);
  console.log(`Wykaz rozdzielni: stan na ${wynik.stan_na}, listy: ${wynik.listy.map((l) => l.rozdzielnie.length).join('+')} rozdzielni → ${wyjscie}`);
}
