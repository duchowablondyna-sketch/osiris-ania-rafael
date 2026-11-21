// Robot OSIRIS – wolne moce PSE: jedna ścieżka dla robota (GitHub Actions, macOS) i dla pracy lokalnej.
// 1. Pobiera stronę PSE, znajduje link do PDF i pobiera plik (tylko https://www.pse.pl) – albo bierze plik lokalny (--plik).
// 2. Liczy SHA-256 i porównuje z public/data/moce-pse.json. Ten sam skrót = koniec („bez-zmian”).
// 3. Odczyt PDF (PDFKit przez osascript – tylko macOS), wyciąg (parsuj.mjs), sprawdzian prawdy (sprawdz.mjs).
// 4. Sprawdzian OK = nowy public/data/moce-pse.json; NIE OK = plik na stronie zostaje bez zmian.
// Wynik dla kolejnego kroku: <wyjscie>/wynik.json i <wyjscie>/opis.md. Surowy PDF zostaje w katalogu tymczasowym (nie w repo).
//
// Użycie: node scripts/pse-moce/robot.mjs [--plik <pdf>] [--wymus] [--symuluj-problem] [--symulacja <tryb>] [--wyjscie <katalog>]
//   --wymus            traktuj plik jako nowy, nawet gdy skrót się zgadza (test PR)
//   --symuluj-problem  zepsuj wyciąg przed sprawdzianem (test issue); nic nie zapisuje w public/data
//   --symulacja <tryb> nazwa trybu testowego (wymus-pr, wymus-problem) – raport dostaje na górze nagłówek SYMULACJA
//
// Stany w wynik.json: bez-zmian (ten sam SHA-256) · nowe-dane (inny wyciąg) · nowy-plik (inny SHA-256, ten sam wyciąg)
// · problem (sprawdzian nie przeszedł).
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parsuj } from './parsuj.mjs';
import { sprawdz, opis } from './sprawdz.mjs';
import { zbuduj } from './zbuduj.mjs';

export const STRONA_PSE = 'https://www.pse.pl/obszary-dzialalnosci/krajowy-system-elektroenergetyczny/informacja-o-dostepnosci-mocy-przylaczeniowej';
const NAZWA_PLIKU_PDF = 'informacja_o_dostepnosci_mocy_przylaczeniowej_do_sieci_przesylowej.pdf';
const PLIK_DANYCH = 'public/data/moce-pse.json';
const PLIK_LOKALIZACJI = 'scripts/pse-moce/lokalizacje.json';
const LIMIT_BAJTOW = 20 * 1024 * 1024;
const NAGLOWKI = { 'User-Agent': 'osiris-robot/0.1 (raz w tygodniu)' };

const args = process.argv.slice(2);
const opcja = (nazwa) => {
  const i = args.indexOf(nazwa);
  return i >= 0 ? args[i + 1] : undefined;
};
const flaga = (nazwa) => args.includes(nazwa);

// Adres musi być https i na www.pse.pl – inaczej przerywamy (także po przekierowaniu).
export function sprawdzAdres(adres) {
  const u = new URL(adres);
  if (u.protocol !== 'https:' || u.hostname !== 'www.pse.pl') throw new Error(`Adres spoza https://www.pse.pl: ${u.origin}`);
  return u;
}

// Link do PDF ze strony PSE – po nazwie pliku, bo identyfikator w adresie może się zmienić.
export function znajdzLink(html, baza = STRONA_PSE) {
  const linki = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replaceAll('&amp;', '&'));
  const pasujace = [...new Set(linki.filter((l) => l.includes(NAZWA_PLIKU_PDF)))];
  if (pasujace.length !== 1) throw new Error(`Na stronie PSE ${pasujace.length ? 'jest kilka linków' : 'nie ma linku'} do pliku ${NAZWA_PLIKU_PDF}.`);
  return sprawdzAdres(new URL(pasujace[0], baza).href).href;
}

async function pobierzPdf() {
  const strona = await fetch(STRONA_PSE, { headers: NAGLOWKI, redirect: 'follow' });
  if (!strona.ok) throw new Error(`Strona PSE: HTTP ${strona.status}`);
  sprawdzAdres(strona.url);
  const url = znajdzLink(await strona.text(), strona.url);
  const odp = await fetch(url, { headers: NAGLOWKI, redirect: 'follow' });
  if (!odp.ok) throw new Error(`PDF PSE: HTTP ${odp.status}`);
  sprawdzAdres(odp.url);
  const dlugosc = Number(odp.headers.get('content-length') ?? 0);
  if (dlugosc > LIMIT_BAJTOW) throw new Error(`PDF za duży: ${dlugosc} B`);
  const dane = Buffer.from(await odp.arrayBuffer());
  if (dane.length > LIMIT_BAJTOW) throw new Error(`PDF za duży: ${dane.length} B`);
  return { dane, url, lastModified: odp.headers.get('last-modified') };
}

const czytajJson = async (plik) => {
  try {
    return JSON.parse(await readFile(plik, 'utf-8'));
  } catch {
    return null;
  }
};
// Czy PSE zmieniło dane, czy tylko plik? Ten sam SHA-256 = bez-zmian; inny SHA-256, ale identyczny wyciąg = nowy-plik
// (np. PSE zapisało PDF jeszcze raz); inny wyciąg = nowe-dane. W trybie wymus zawsze nowe-dane (test ścieżki PR).
export function rodzajZmiany({ wyciag, poprzedni, sha256, wymus = false }) {
  if (wymus || !poprzedni?.wyciag) return 'nowe-dane';
  if (poprzedni.zrodlo?.sha256 === sha256) return 'bez-zmian';
  return JSON.stringify(wyciag) === JSON.stringify(poprzedni.wyciag) ? 'nowy-plik' : 'nowe-dane';
}

// Nagłówek raportu w trybach testowych – żeby nikt nie wziął symulacji za prawdziwe dane albo prawdziwy problem.
export function naglowekSymulacji(tryb, daneBezZmian) {
  if (tryb === 'wymus-pr')
    return daneBezZmian
      ? '> **SYMULACJA – tryb wymus-pr, dane bez zmian, NIE SCALAĆ.**\n> Ten PR sprawdza tylko, czy Robot OSIRIS umie otworzyć PR i poprosić o przegląd. Zamknij go bez scalania.'
      : '> **SYMULACJA – tryb wymus-pr, NIE SCALAĆ.**\n> Uwaga: wyciąg różni się od danych na stronie – PSE mogło opublikować nowy dokument. Zamknij ten PR i uruchom robota w trybie `normalny`.';
  if (tryb === 'wymus-problem')
    return '> **SYMULACJA – tryb wymus-problem: błąd jest celowo podrzucony, prawdziwego problemu z danymi nie ma.**\n> To issue sprawdza tylko, czy Robot OSIRIS umie zgłosić problem. Zamknij je.';
  return '';
}

// Ostrzeżenie „Plik się zmienił…” w symulacji, gdy plik jest w rzeczywistości ten sam – z dopiskiem (SYMULACJA).
export function oznaczSymulacje(ostrzezenia, tenSamPlik) {
  return ostrzezenia.map((o) =>
    tenSamPlik && o.startsWith('Plik się zmienił') ? `${o} (SYMULACJA – w rzeczywistości to ten sam plik, SHA-256 bez zmian)` : o,
  );
}

const dzisPL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

async function main() {
  const wyjscie = opcja('--wyjscie') ?? (await mkdtemp(join(tmpdir(), 'osiris-robot-')));
  await mkdir(wyjscie, { recursive: true });
  const robocze = await mkdtemp(join(tmpdir(), 'osiris-pse-'));
  const zapisz = async (wynik, tekst = '') => {
    await writeFile(join(wyjscie, 'wynik.json'), `${JSON.stringify(wynik, null, 2)}\n`);
    await writeFile(join(wyjscie, 'opis.md'), `${tekst}\n`);
    console.log(`Wynik: ${wynik.stan}${wynik.stan_na ? `, stan na ${wynik.stan_na}` : ''} → ${wyjscie}`);
  };

  const poprzedni = await czytajJson(PLIK_DANYCH);
  let pdf;
  if (opcja('--plik')) {
    pdf = { dane: await readFile(opcja('--plik')), url: opcja('--url') ?? null, lastModified: opcja('--last-modified') ?? null };
  } else {
    pdf = await pobierzPdf();
  }
  if (pdf.dane.subarray(0, 5).toString('latin1') !== '%PDF-') throw new Error('Pobrany plik nie jest PDF-em.');
  const sha256 = createHash('sha256').update(pdf.dane).digest('hex');
  const zrodlo = {
    nazwa: 'PSE S.A., „Informacja o dostępności mocy przyłączeniowej do sieci przesyłowej”',
    url_strony: STRONA_PSE,
    url_pdf: pdf.url,
    pobrano: dzisPL(),
    sha256,
    last_modified: pdf.lastModified,
  };

  if (!flaga('--wymus') && poprzedni?.zrodlo?.sha256 === sha256) {
    await zapisz({ stan: 'bez-zmian', stan_na: poprzedni.stan_na, sha256 });
    return;
  }
  if (process.platform !== 'darwin') throw new Error('Odczyt PDF wymaga macOS (PDFKit) – uruchom na runnerze macos-15.');

  const plikPdf = join(robocze, 'pse.pdf');
  const plikSlow = join(robocze, 'slowa.json');
  await writeFile(plikPdf, pdf.dane);
  await promisify(execFile)('osascript', ['-l', 'JavaScript', 'scripts/pse-moce/slowa-pdf.js', plikPdf, plikSlow], { timeout: 120_000 });
  const wyciag = parsuj(JSON.parse(await readFile(plikSlow, 'utf-8')));
  if (flaga('--symuluj-problem')) {
    // Test ścieżki „problem”: usuwamy jedną stację – suma grupy przestaje się zgadzać.
    const i = wyciag.zrodla.findIndex((r) => r.poziom === 'stacja' && r.wartosci.some((v) => v > 0));
    if (i >= 0) wyciag.zrodla.splice(i, 1);
    wyciag.nierozpoznane.push('TEST: celowo usunięty wiersz (tryb wymus-problem).');
  }
  const wynik = sprawdz(wyciag, poprzedni?.wyciag ?? null, dzisPL());
  const symulacja = opcja('--symulacja') ?? '';
  const tenSamPlik = poprzedni?.zrodlo?.sha256 === sha256;
  if (symulacja) wynik.ostrzezenia = oznaczSymulacje(wynik.ostrzezenia, tenSamPlik);
  const daneBezZmian = JSON.stringify(wyciag) === JSON.stringify(poprzedni?.wyciag);
  const naglowek = symulacja ? `${naglowekSymulacji(symulacja, daneBezZmian)}\n\n` : '';
  if (!wynik.ok || flaga('--symuluj-problem')) {
    const tekst = naglowek + opis(wynik, wyciag, poprzedni?.wyciag ?? null, zrodlo);
    await zapisz({ stan: 'problem', stan_na: wyciag.stan_na, sha256, symulacja, bledy: wynik.bledy, ostrzezenia: wynik.ostrzezenia }, tekst);
    return;
  }
  const stan = rodzajZmiany({ wyciag, poprzedni, sha256, wymus: flaga('--wymus') });
  const lokalizacje = JSON.parse(await readFile(PLIK_LOKALIZACJI, 'utf-8'));
  const dane = zbuduj(wyciag, zrodlo, lokalizacje, dzisPL());
  let tekst;
  if (stan === 'nowy-plik') {
    // Nowy plik, te same dane: zapisujemy tylko nową informację o pliku (SHA-256, Last-Modified, data pobrania),
    // żeby w kolejnych tygodniach robot rozpoznawał ten plik jako znany i potwierdzał aktualność danych.
    tekst =
      `Robot OSIRIS: na pse.pl jest **nowy plik** dokumentu o dostępności mocy przyłączeniowej (inny SHA-256), ale **dane są te same** – stan na ${wyciag.stan_na.split('-').reverse().join('.')}.\n\n` +
      'Sprawdzian prawdy przeszedł, wyciąg (wszystkie tabele) jest identyczny jak na stronie. W tym PR zmienia się tylko informacja o pliku: SHA-256, Last-Modified i data pobrania. ' +
      'Bez tego PR robot co tydzień brałby ten plik za nowy i nie potwierdzałby aktualności danych („sprawdzono przez Robota OSIRIS”).\n\n' +
      `### Plik\n- poprzednio: \`${poprzedni.zrodlo.sha256}\` (pobrano ${poprzedni.zrodlo.pobrano})\n- teraz: \`${sha256}\` (pobrano ${zrodlo.pobrano})\n- link: ${zrodlo.url_pdf}` +
      (zrodlo.last_modified ? `\n- Last-Modified (serwer PSE): ${zrodlo.last_modified}` : '') +
      (wynik.ostrzezenia.length ? `\n\n### Ostrzeżenia\n${wynik.ostrzezenia.map((o) => `- ${o}`).join('\n')}` : '');
  } else {
    const brakMiejsca = dane.odbiorcy.filter((s) => s.lokalizacja.rodzaj === 'brak' && !lokalizacje.stacje[s.kod]).map((s) => s.kod);
    const dopisek = brakMiejsca.length ? `\n\n### Do uzupełnienia\n- nowe stacje bez wybranego miejsca na mapie (pokazane tylko na liście): ${brakMiejsca.join(', ')}` : '';
    tekst = naglowek + opis(wynik, wyciag, poprzedni?.wyciag ?? null, zrodlo) + dopisek;
  }
  await writeFile(PLIK_DANYCH, `${JSON.stringify(dane, null, 2)}\n`);
  await zapisz({ stan, stan_na: wyciag.stan_na, sha256, symulacja, ostrzezenia: wynik.ostrzezenia }, tekst);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`Robot OSIRIS: ${e.message}`);
    process.exit(1);
  });
}
