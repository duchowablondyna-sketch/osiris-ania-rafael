// Testy odczytu i sprawdzianu prawdy – wbudowany w Node moduł node:test (bez pakietów).
// Uruchom: node --test scripts/pse-moce/testy.mjs
// Opcjonalnie z prawdziwym PDF (tylko macOS): PSE_PDF=~/Projekty/_dane/pse/....pdf node --test scripts/pse-moce/testy.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parsuj } from './parsuj.mjs';
import { sprawdz, opis } from './sprawdz.mjs';
import { zbuduj } from './zbuduj.mjs';
import { znajdzLink, sprawdzAdres } from './robot.mjs';

const WZORZEC = JSON.parse(readFileSync(new URL('./testy/wyciag-2026-10-31.json', import.meta.url), 'utf-8'));
const DZIS = '2026-11-21';
const kopia = () => structuredClone(WZORZEC);
const stacja = (w, nazwa) => w.zrodla.find((r) => r.poziom === 'stacja' && r.nazwa === nazwa);
const maBlad = (wynik, fragment) => assert.ok(wynik.bledy.some((b) => b.includes(fragment)), `brak błędu z „${fragment}”: ${JSON.stringify(wynik.bledy)}`);

test('wzorzec (stan na 31.10.2026) przechodzi sprawdzian', () => {
  const w = sprawdz(kopia(), null, DZIS);
  assert.deepEqual(w.bledy, []);
  assert.equal(w.ok, true);
});

test('wzorzec: liczby zgodne z dokumentem (odczytane z obrazów stron)', () => {
  const w = kopia();
  assert.equal(w.stan_na, '2026-10-31');
  assert.equal(w.zrodla.filter((r) => r.poziom === 'stacja').length, 127);
  assert.equal(w.zrodla.filter((r) => r.poziom === 'stacja' && r.w_przyszlosci).length, 11);
  assert.deepEqual(w.zrodla[0].wartosci, [300, 500, 0, 0]);
  assert.deepEqual(stacja(w, 'Mościska').wartosci, [50, 50, 0, 0]);
  assert.deepEqual(stacja(w, 'Mory').wartosci, [0, 0, 0, 0]);
  assert.deepEqual(stacja(w, 'Jarosław').wartosci, [0, 150, 0, 0]);
  assert.deepEqual(w.odbiorcy.map((t) => t.length), [14, 11]);
  const moc = Object.fromEntries(w.odbiorcy.flat().map((r) => [r.kod, r.moc]));
  assert.deepEqual(moc, {
    NOR: 100, WIG: 100, WYP: 200, MKA: 1000, REM: 500, SWR: 500, EPK: 1000, LWN: 500, WRS: 500, KUZ: 500, ZER: 500, GNA: 500, DSC: 500, DZO: 1000,
    CPK: 250, DMO: 500, WTN: 500, MAK: 200, ZGN: 100, POM: 100, PBO: 200, PSC: 500, SBO: 500, EJ1: 250, MAO: 500,
  });
});

test('data: starsza niż 3 miesiące → błąd', () => {
  const w = kopia();
  w.stan_na = '2026-06-30';
  maBlad(sprawdz(w, null, DZIS), 'starsza niż 3 miesiące');
});
test('data: z przyszłości → błąd', () => {
  const w = kopia();
  w.stan_na = '2026-12-31';
  maBlad(sprawdz(w, null, DZIS), 'późniejsza niż dziś');
});
test('data: wcześniejsza niż na stronie → błąd', () => {
  const w = kopia();
  w.stan_na = '2026-09-30';
  const poprzedni = kopia();
  maBlad(sprawdz(w, poprzedni, DZIS), 'wcześniejsza niż w danych na stronie');
});
test('data: ta sama co na stronie → ostrzeżenie, ale OK', () => {
  const wynik = sprawdz(kopia(), kopia(), DZIS);
  assert.equal(wynik.ok, true);
  assert.ok(wynik.ostrzezenia.some((o) => o.includes('ta sama')));
});
test('data: brak → błąd', () => {
  const w = kopia();
  w.stan_na = null;
  maBlad(sprawdz(w, null, DZIS), 'Brak daty');
});
test('data: nie ostatni dzień miesiąca → ostrzeżenie', () => {
  const w = kopia();
  w.stan_na = '2026-11-15';
  const wynik = sprawdz(w, null, DZIS);
  assert.equal(wynik.ok, true);
  assert.ok(wynik.ostrzezenia.some((o) => o.includes('ostatnim dniem miesiąca')));
});

test('układ: zmieniony opis kolumny → błąd', () => {
  const w = kopia();
  w.legenda_zrodel[2] = '[3] Rok 2027 - Moc dostępna z uwzględnieniem WP do sieci 110 kV [MW] – krok 2';
  maBlad(sprawdz(w, null, DZIS), 'Opis kolumn');
});
test('układ: brak zdania PSE o stacjach istniejących → błąd', () => {
  const w = kopia();
  w.zdania_obecne = w.zdania_obecne.filter((z) => !z.startsWith('Dla stacji istniejących'));
  maBlad(sprawdz(w, null, DZIS), 'zmienić znaczenie danych');
});
test('układ: brak tytułu rozdziału 5 → błąd', () => {
  const w = kopia();
  w.tytuly_obecne = w.tytuly_obecne.slice(0, 1);
  maBlad(sprawdz(w, null, DZIS), 'Brak tytułu rozdziału');
});
test('układ: nierozpoznany wiersz w odczycie → błąd', () => {
  const w = kopia();
  w.nierozpoznane.push('Tabela źródeł: nierozpoznana wartość „5O”.');
  maBlad(sprawdz(w, null, DZIS), 'Odczyt PDF');
});
test('układ: 9 obszarów → błąd', () => {
  const w = kopia();
  const i = w.zrodla.findIndex((r) => r.poziom === 'obszar' && r.nazwa === 'Obszar MAŁOPOLSKA');
  w.zrodla = w.zrodla.slice(0, i); // bez ostatniego obszaru i jego grup
  maBlad(sprawdz(w, null, DZIS), 'obszarów zamiast 10');
});

test('sumy: usunięta stacja Mościska (50 MW) → suma grupy się nie zgadza', () => {
  const w = kopia();
  w.zrodla = w.zrodla.filter((r) => !(r.poziom === 'stacja' && r.nazwa === 'Mościska'));
  maBlad(sprawdz(w, null, DZIS), 'Grupa AGLOMERACJA WARSZAWSKA');
});
test('sumy: grupa bez stacji (usunięta jedyna stacja Ostrów) → błąd', () => {
  const w = kopia();
  w.zrodla = w.zrodla.filter((r) => !(r.poziom === 'stacja' && r.nazwa === 'Ostrów'));
  maBlad(sprawdz(w, null, DZIS), 'brak stacji pod tym wierszem');
});
test('sumy: zmieniona wartość POLSKA → błąd', () => {
  const w = kopia();
  w.zrodla[0].wartosci = [300, 500, 0, 50];
  maBlad(sprawdz(w, null, DZIS), 'POLSKA');
});
test('sumy: wartość nieliczbowa → błąd', () => {
  const w = kopia();
  stacja(w, 'Narew').wartosci = [0, null, 0, 0];
  maBlad(sprawdz(w, null, DZIS), 'Narew');
});

test('odbiorcy: brak wiersza (numeracja z luką) → błąd', () => {
  const w = kopia();
  w.odbiorcy[0].splice(3, 1);
  maBlad(sprawdz(w, null, DZIS), 'numer 5 zamiast 4');
});
test('odbiorcy: zdublowany kod → błąd', () => {
  const w = kopia();
  w.odbiorcy[1][0].kod = 'NOR';
  maBlad(sprawdz(w, null, DZIS), 'dwa razy');
});
test('odbiorcy: moc 0 albo podejrzanie duża → błąd', () => {
  const w = kopia();
  w.odbiorcy[0][0].moc = 0;
  w.odbiorcy[0][1].moc = 99999;
  const wynik = sprawdz(w, null, DZIS);
  maBlad(wynik, 'nie jest dodatnią');
  maBlad(wynik, 'podejrzanie dużo');
});
test('odbiorcy: jedna tabela zamiast dwóch → błąd', () => {
  const w = kopia();
  w.odbiorcy = [w.odbiorcy[0]];
  maBlad(sprawdz(w, null, DZIS), 'zamiast 2');
});
test('odczyt prawie pusty (spadek liczby stacji) → błąd', () => {
  const w = kopia();
  const wynik = sprawdz({ ...w, zrodla: w.zrodla.slice(0, 40) }, kopia(), DZIS);
  assert.equal(wynik.ok, false);
});

test('zmiany: moc odbiorcy 100 → 300 MW i nowa stacja są w opisie PR', () => {
  const w = kopia();
  w.stan_na = '2026-11-30';
  w.odbiorcy[0][0].moc = 300;
  w.odbiorcy[1].push({ lp: 12, kod: 'XYZ', opis: 'stacja w rejonie Testowa', moc: 400 });
  const wynik = sprawdz(w, kopia(), '2026-12-03');
  assert.equal(wynik.ok, true);
  assert.ok(wynik.zmiany.odbiorcy.includes('NOR (Norki): 100 → 300 MW (+200 MW)'));
  assert.ok(wynik.zmiany.odbiorcy.some((z) => z.startsWith('nowa stacja XYZ')));
  const tekst = opis(wynik, w, kopia(), null);
  assert.match(tekst, /stan na 30\.11\.2026/);
  assert.match(tekst, /\+200 MW/);
  // Nowa stacja bez wybranego miejsca – na liście, nie na mapie.
  const lok = { stan_osm: 'x', promien_km: 20, stacje: {} };
  const d = zbuduj(w, {}, lok, '2026-12-03');
  assert.equal(d.odbiorcy.find((s) => s.kod === 'XYZ').lokalizacja.rodzaj, 'brak');
});
test('zmiany: krok 2 dla źródeł 0 → 100 MW jest w opisie', () => {
  const w = kopia();
  w.stan_na = '2026-11-30';
  for (const r of w.zrodla) if (['POLSKA', 'Obszar CENTRUM', 'Grupa OSTRÓW', 'Ostrów'].includes(r.nazwa)) r.wartosci[2] = 100;
  const wynik = sprawdz(w, kopia(), '2026-12-03');
  assert.equal(wynik.ok, true);
  assert.ok(wynik.zmiany.zrodla.includes('Ostrów: 2026, krok 2 0 → 100 MW'));
});

test('robot: link do PDF tylko z www.pse.pl', () => {
  const html = '<a href="/documents/20182/51490/informacja_o_dostepnosci_mocy_przylaczeniowej_do_sieci_przesylowej.pdf/abc?safeargs=1">x</a>';
  assert.match(znajdzLink(html), /^https:\/\/www\.pse\.pl\/documents\//);
  assert.throws(() => znajdzLink('<a href="/inny.pdf">'), /nie ma linku/);
  assert.throws(() => znajdzLink('<a href="https://zly.example/informacja_o_dostepnosci_mocy_przylaczeniowej_do_sieci_przesylowej.pdf">'), /spoza/);
  assert.throws(() => sprawdzAdres('http://www.pse.pl/x.pdf'), /spoza/);
});

test('prawdziwy PDF (jeśli podany w PSE_PDF, tylko macOS): odczyt = wzorzec', { skip: !process.env.PSE_PDF || process.platform !== 'darwin' }, () => {
  const katalog = mkdtempSync(join(tmpdir(), 'osiris-test-'));
  const slowa = join(katalog, 'slowa.json');
  execFileSync('osascript', ['-l', 'JavaScript', new URL('./slowa-pdf.js', import.meta.url).pathname, process.env.PSE_PDF, slowa]);
  assert.deepEqual(parsuj(JSON.parse(readFileSync(slowa, 'utf-8'))), WZORZEC);
});

// ── Wykaz rozdzielni PSE (XLSX) ──
import { rozpakuj, komorki, parsujWykaz, sprawdzWykaz, stacjeBezRozpatrzenia } from './rozdzielnie.mjs';
const WYKAZ = JSON.parse(readFileSync(new URL('../../public/data/rozdzielnie-pse.json', import.meta.url), 'utf-8'));
const wykazDoSprawdzenia = () => ({ ...structuredClone(WYKAZ), nierozpoznane: [] });

test('wykaz: 3 listy (37 + 6 + 24), stan na 04.02.2026, przechodzi sprawdzian', () => {
  assert.equal(WYKAZ.stan_na, '2026-02-04');
  assert.deepEqual(WYKAZ.listy.map((l) => l.rozdzielnie.length), [37, 6, 24]);
  assert.deepEqual(sprawdzWykaz(wykazDoSprawdzenia()), []);
});
test('wykaz: 16 z 25 stacji z mocą dla odbiorców na listach 2 i 3, „BEB (EJ1)” = EJ1', () => {
  const b = stacjeBezRozpatrzenia(WYKAZ);
  const odbiorcy = WZORZEC.odbiorcy.flat().map((r) => r.kod);
  const wstrzymane = odbiorcy.filter((k) => b.has(k)).sort();
  assert.deepEqual(wstrzymane, ['DMO', 'DZO', 'EJ1', 'EPK', 'GNA', 'KUZ', 'LWN', 'MAO', 'MKA', 'PBO', 'PSC', 'REM', 'SBO', 'SWR', 'WRS', 'ZER']);
  assert.deepEqual(b.get('EPK').rozdzielnie, ['Rozdzielnia 110 kV', 'Rozdzielnia 400 kV']);
});
test('wykaz: zepsuty (2 listy, inny nagłówek, brak daty) → błędy', () => {
  const w = wykazDoSprawdzenia();
  w.listy.pop();
  w.listy[0].naglowek = ['ZKO PSE', 'Symbol', 'Nazwa', 'Rozdzielnia', 'Wolne MW'];
  w.stan_na = null;
  const bledy = sprawdzWykaz(w);
  assert.ok(bledy.some((b) => b.includes('zamiast 3')));
  assert.ok(bledy.some((b) => b.includes('inny nagłówek')));
  assert.ok(bledy.some((b) => b.includes('Brak daty')));
});
test('wykaz: prawdziwy XLSX (jeśli podany w PSE_XLSX) = wyciąg w repo, bez komentarzy z arkusza', { skip: !process.env.PSE_XLSX }, () => {
  const w = parsujWykaz(komorki(rozpakuj(readFileSync(process.env.PSE_XLSX))));
  assert.deepEqual(w.nierozpoznane, []);
  assert.deepEqual(w.listy, WYKAZ.listy);
  assert.ok(!JSON.stringify(w).includes('Porozumienia'));
});

// ── Pusty sześciokąt tylko przy rozdzielni 220 albo 400 kV w wykazie (decyzja Ani 21.11.2026) ──
import { czyPusty } from '../../src/wykaz-rozdzielni.js';
test('pusty sześciokąt: tylko stacje z rozdzielnią 220/400 kV w wykazie (11), „tylko 110 kV” (5) – pełny', () => {
  const b = stacjeBezRozpatrzenia(WYKAZ);
  const odbiorcy = WZORZEC.odbiorcy.flat().map((r) => r.kod);
  const puste = odbiorcy.filter((k) => b.get(k)?.pusty).sort();
  const tylko110 = odbiorcy.filter((k) => b.has(k) && !b.get(k).pusty).sort();
  assert.deepEqual(puste, ['DZO', 'EPK', 'GNA', 'KUZ', 'LWN', 'MAO', 'REM', 'SBO', 'SWR', 'WRS', 'ZER']);
  assert.deepEqual(tylko110, ['DMO', 'EJ1', 'MKA', 'PBO', 'PSC']);
  // Każdy pusty ma w wykazie 220 albo 400 kV; żaden „tylko 110 kV” – nie ma.
  for (const k of puste) assert.ok(b.get(k).rozdzielnie.some((r) => / (220|400) kV$/.test(r)), k);
  for (const k of tylko110) assert.deepEqual(b.get(k).rozdzielnie, ['Rozdzielnia 110 kV'], k);
});
test('pusty sześciokąt: reguła na przykładach (110 → nie, 220 → tak, 400 → tak, brak wpisu → nie)', () => {
  assert.equal(czyPusty({ rozdzielnie: ['Rozdzielnia 110 kV'] }), false);
  assert.equal(czyPusty({ rozdzielnie: ['Rozdzielnia 110 kV', 'Rozdzielnia 220 kV'] }), true);
  assert.equal(czyPusty({ rozdzielnie: ['Rozdzielnia 400 kV'] }), true);
  assert.equal(czyPusty(undefined), false);
});

// ── Robot: „nowy plik, te same dane”, symulacja, krok „Zgłoś” (poprawka po teście wymus-pr 21.11.2026) ──
import { rodzajZmiany, naglowekSymulacji, oznaczSymulacje } from './robot.mjs';
import { zglos, tytul, ZNACZNIK_TESTU } from './zglos.mjs';
import { writeFileSync as zapiszPlik, mkdirSync as utworzKatalog } from 'node:fs';

test('rodzaj zmiany: ten sam SHA → bez-zmian; inny SHA i ten sam wyciąg → nowy-plik; inny wyciąg → nowe-dane', () => {
  const poprzedni = { zrodlo: { sha256: 'aaa' }, wyciag: kopia() };
  assert.equal(rodzajZmiany({ wyciag: kopia(), poprzedni, sha256: 'aaa' }), 'bez-zmian');
  assert.equal(rodzajZmiany({ wyciag: kopia(), poprzedni, sha256: 'bbb' }), 'nowy-plik');
  const inny = kopia();
  inny.odbiorcy[0][0].moc = 300;
  assert.equal(rodzajZmiany({ wyciag: inny, poprzedni, sha256: 'bbb' }), 'nowe-dane');
  assert.equal(rodzajZmiany({ wyciag: kopia(), poprzedni, sha256: 'aaa', wymus: true }), 'nowe-dane');
  assert.equal(rodzajZmiany({ wyciag: kopia(), poprzedni: null, sha256: 'aaa' }), 'nowe-dane');
});

test('symulacja: nagłówek NIE SCALAĆ i dopisek (SYMULACJA) przy ostrzeżeniu „Plik się zmienił…”', () => {
  assert.match(naglowekSymulacji('wymus-pr', true), /SYMULACJA – tryb wymus-pr, dane bez zmian, NIE SCALAĆ/);
  assert.match(naglowekSymulacji('wymus-problem', true), /SYMULACJA – tryb wymus-problem/);
  const ostrz = sprawdz(kopia(), kopia(), DZIS).ostrzezenia;
  const oznaczone = oznaczSymulacje(ostrz, true);
  assert.ok(oznaczone.some((o) => o.startsWith('Plik się zmienił') && o.includes('(SYMULACJA')));
  assert.deepEqual(oznaczSymulacje(ostrz, false), ostrz); // prawdziwy nowy plik – bez dopisku
  assert.equal(tytul({ stan: 'nowe-dane', stan_na: '2026-10-31', tryb: 'wymus-pr' }), '[Robot OSIRIS][TEST] Nowe dane PSE – stan na 31.10.2026');
  assert.equal(tytul({ stan: 'nowy-plik', stan_na: '2026-10-31', tryb: 'normalny' }), '[Robot OSIRIS] Nowy plik PSE, te same dane – stan na 31.10.2026');
});

// Prawdziwe repozytorium git w katalogu tymczasowym; zglos() na sucho (bez push i bez gh).
function repoTestowe(daneNaMain, daneRobota, stan) {
  const repo = mkdtempSync(join(tmpdir(), 'osiris-repo-'));
  const git = (...a) => execFileSync('git', a, { cwd: repo, stdio: 'pipe', encoding: 'utf-8' });
  git('init', '-q', '-b', 'main');
  utworzKatalog(join(repo, 'public/data'), { recursive: true });
  zapiszPlik(join(repo, 'public/data/moce-pse.json'), daneNaMain);
  git('add', '.');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-q', '-m', 'start');
  const wynikDir = mkdtempSync(join(tmpdir(), 'osiris-wynik-'));
  zapiszPlik(join(wynikDir, 'wynik.json'), JSON.stringify({ stan, stan_na: '2026-10-31', sha256: 'e3612af437f862d0' }));
  zapiszPlik(join(wynikDir, 'opis.md'), 'opis');
  zapiszPlik(join(wynikDir, 'moce-pse.json'), daneRobota);
  return { repo, wynikDir, git };
}

test('zgłoś: „nic do zapisania” w trybie normalnym – zielony koniec, bez PR i bez błędu (przypadek z przebiegu #2)', () => {
  const { repo, wynikDir, git } = repoTestowe('{"a":1}\n', '{"a":1}\n', 'nowe-dane');
  const w = zglos({ wynikDir, repo, tryb: 'normalny', naSucho: true, log: () => {} });
  assert.equal(w.akcja, 'nic-do-zapisania');
  assert.equal(git('log', '--oneline').trim().split('\n').length, 1); // żadnego nowego commita
});
test('zgłoś: wymus-pr przy identycznych danych – zawsze PR do obejrzenia (plik-znacznik testu, tytuł [TEST])', () => {
  const { repo, wynikDir, git } = repoTestowe('{"a":1}\n', '{"a":1}\n', 'nowe-dane');
  const w = zglos({ wynikDir, repo, tryb: 'wymus-pr', naSucho: true, log: () => {} });
  assert.equal(w.akcja, 'pr');
  assert.deepEqual(w.pliki, [ZNACZNIK_TESTU]);
  assert.match(git('log', '-1', '--format=%s'), /^\[Robot OSIRIS\]\[TEST\] Nowe dane PSE – stan na 31\.10\.2026/);
  assert.match(git('show', `HEAD:${ZNACZNIK_TESTU}`), /SYMULACJA – tryb wymus-pr, NIE SCALAĆ/);
});
test('zgłoś: nowy plik PSE (inny SHA w pliku danych) – PR tylko z plikiem danych', () => {
  const { repo, wynikDir, git } = repoTestowe('{"sha":"aaa"}\n', '{"sha":"bbb"}\n', 'nowy-plik');
  const w = zglos({ wynikDir, repo, tryb: 'normalny', naSucho: true, log: () => {} });
  assert.equal(w.akcja, 'pr');
  assert.deepEqual(w.pliki, ['public/data/moce-pse.json']);
  assert.match(git('log', '-1', '--format=%s'), /^\[Robot OSIRIS\] Nowy plik PSE, te same dane/);
});
test('zgłoś: bez-zmian – nic nie robi', () => {
  const { repo, wynikDir } = repoTestowe('{"a":1}\n', '{"a":1}\n', 'bez-zmian');
  assert.equal(zglos({ wynikDir, repo, tryb: 'normalny', naSucho: true, log: () => {} }).akcja, 'nic');
});
