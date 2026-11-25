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

test('zgłoś na sucho (testy) nie pisze do podsumowania przebiegu, nawet gdy GITHUB_STEP_SUMMARY jest ustawione', () => {
  const plikPodsumowania = join(mkdtempSync(join(tmpdir(), 'osiris-podsum-')), 'summary.md');
  zapiszPlik(plikPodsumowania, '');
  const poprzednie = process.env.GITHUB_STEP_SUMMARY;
  process.env.GITHUB_STEP_SUMMARY = plikPodsumowania; // tak jak w GitHub Actions podczas kroku z testami
  try {
    for (const [tryb, stan] of [['normalny', 'nowe-dane'], ['wymus-pr', 'nowe-dane'], ['normalny', 'bez-zmian']]) {
      const { repo, wynikDir } = repoTestowe('{"a":1}\n', '{"a":1}\n', stan);
      zglos({ wynikDir, repo, tryb, naSucho: true, log: () => {} });
    }
  } finally {
    if (poprzednie === undefined) delete process.env.GITHUB_STEP_SUMMARY;
    else process.env.GITHUB_STEP_SUMMARY = poprzednie;
  }
  assert.equal(readFileSync(plikPodsumowania, 'utf-8'), '');
});

// ── Issue robota zawsze do Ani: przypisanie (assignee) + wzmianka w treści, niezależnie od „Watch” ──
test('issue: przypisanie do duchowablondyna-sketch i wzmianka @duchowablondyna-sketch na górze treści', () => {
  const { repo, wynikDir } = repoTestowe('{"a":1}\n', '{"a":1}\n', 'problem');
  const w = zglos({ wynikDir, repo, tryb: 'normalny', naSucho: true, log: () => {}, osoba: 'duchowablondyna-sketch' });
  assert.equal(w.akcja, 'issue');
  const i = w.polecenie.indexOf('--assignee');
  assert.ok(i > 0 && w.polecenie[i + 1] === 'duchowablondyna-sketch', JSON.stringify(w.polecenie));
  assert.match(readFileSync(w.trescPlik, 'utf-8'), /^@duchowablondyna-sketch – Robot OSIRIS zgłasza problem/);
  assert.match(readFileSync(w.trescPlik, 'utf-8'), /opis$/); // reszta raportu bez zmian
});
test('issue: gdy GitHub po cichu pominie przypisanie – robot dopisuje je jeszcze raz (gh issue edit --add-assignee)', () => {
  for (const [przypisaniWidok, oczekiwanaPoprawka] of [['', true], ['duchowablondyna-sketch', false]]) {
    const { repo, wynikDir } = repoTestowe('{"a":1}\n', '{"a":1}\n', 'problem');
    const wywolania = [];
    const uruchom = (cmd, args) => {
      wywolania.push([cmd, ...args].join(' '));
      if (args[0] === 'pr' || (args[0] === 'issue' && args[1] === 'list')) return ''; // nic otwartego
      if (args[1] === 'create') return 'https://github.com/x/y/issues/99\n';
      if (args[1] === 'view') return `${przypisaniWidok}\n`;
      return '';
    };
    zglos({ wynikDir, repo, tryb: 'normalny', log: () => {}, uruchom, osoba: 'duchowablondyna-sketch' });
    assert.ok(wywolania.some((c) => c.startsWith('gh issue create') && c.includes('--assignee duchowablondyna-sketch')));
    assert.equal(wywolania.some((c) => c.includes('--add-assignee duchowablondyna-sketch')), oczekiwanaPoprawka, wywolania.join('\n'));
  }
});

// ── Etap C1 (25.11.2026): zdania zakładki „Gdzie” składane z danych – liczby, napięcia i daty zgadzają się z plikami ──
// Liczone tu niezależnie od src/wykaz-rozdzielni.js: wprost z list 2 i 3 wykazu (kody i nazwy rozdzielni).
import { podzialStacji } from '../../src/wykaz-rozdzielni.js';
import { tekstPodsumowania, tekstUwagi, dopisekListy, tekstWniosku, tekstMocySkrot } from '../../src/moce-teksty.js';
import { ustawJezyk } from '../../src/jezyk.js';
const MOCE = JSON.parse(readFileSync(new URL('../../public/data/moce-pse.json', import.meta.url), 'utf-8'));
function niezaleznie() {
  const kv = new Map(); // kod → napięcia z list 2 i 3
  for (const l of WYKAZ.listy.slice(1)) for (const r of l.rozdzielnie) for (const k of r.kody) {
    kv.set(k, [...(kv.get(k) ?? []), Number(r.rozdzielnia.match(/(\d+) kV/)[1])]);
  }
  const pelne = MOCE.odbiorcy.filter((s) => kv.get(s.kod)?.some((x) => x === 220 || x === 400));
  const tylko110 = MOCE.odbiorcy.filter((s) => kv.has(s.kod) && !pelne.includes(s));
  const napiecia = [...new Set(pelne.flatMap((s) => kv.get(s.kod).filter((x) => x !== 110)))].sort((a, b) => a - b);
  return { kv, razem: MOCE.odbiorcy.length, pelne: pelne.length, tylko110: tylko110.length, bez: MOCE.odbiorcy.length - pelne.length - tylko110.length, napiecia };
}

test('Gdzie: podział stacji z danych = liczenie niezależne (grupy się nie nakładają)', () => {
  const n = niezaleznie();
  const p = podzialStacji(MOCE.odbiorcy, stacjeBezRozpatrzenia(WYKAZ));
  assert.deepEqual(
    { razem: p.razem, pelne: p.pelne, tylko110: p.tylko110, bez: p.bezZastrzezen, napiecia: p.napieciaPelnych },
    { razem: n.razem, pelne: n.pelne, tylko110: n.tylko110, bez: n.bez, napiecia: n.napiecia },
  );
  assert.equal(p.pelne + p.tylko110 + p.bezZastrzezen, p.razem);
});

test('Gdzie: podsumowanie PL i EN – liczby, napięcia z wykazu i obie daty z danych', () => {
  const n = niezaleznie();
  const oczekiwane = {
    pl: { napiecia: `${new Intl.ListFormat('pl-PL', { type: 'disjunction' }).format(n.napiecia.map(String))} kV`, wykaz: WYKAZ.stan_na.split('-').reverse().join('.'), moce: MOCE.stan_na.split('-').reverse().join('.') },
    en: {
      napiecia: `${new Intl.ListFormat('en-GB', { type: 'disjunction' }).format(n.napiecia.map(String))} kV`,
      wykaz: new Date(`${WYKAZ.stan_na}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }),
      moce: new Date(`${MOCE.stan_na}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }),
    },
  };
  for (const jez of ['pl', 'en']) {
    ustawJezyk(jez);
    const tekst = tekstPodsumowania(MOCE, WYKAZ, stacjeBezRozpatrzenia(WYKAZ));
    const o = oczekiwane[jez];
    assert.ok(tekst.startsWith(`${n.razem} `), `${jez}: ${tekst}`);
    for (const fragment of [` ${n.pelne} `, ` ${n.tylko110} `, o.napiecia, o.wykaz, o.moce]) assert.ok(tekst.includes(fragment), `${jez}: brak „${fragment}” w: ${tekst}`);
    // Przy danych z 25.11.2026 wśród 11 stacji są rozdzielnie 220 i 400 kV – nie „400 kV” na sztywno.
    assert.deepEqual(n.napiecia, [220, 400]);
    assert.ok(!/obecnie|currently/.test(tekst), `${jez}: „obecnie” zamiast daty: ${tekst}`);
  }
  ustawJezyk('pl');
});

test('Gdzie: uwaga w okienku i dopisek na liście – napięcia tej stacji z wykazu, data wykazu', () => {
  const n = niezaleznie();
  const b = stacjeBezRozpatrzenia(WYKAZ);
  for (const jez of ['pl', 'en']) {
    ustawJezyk(jez);
    for (const s of MOCE.odbiorcy.filter((x) => b.has(x.kod))) {
      const wpis = b.get(s.kod);
      const kv = n.kv.get(s.kod).filter((x) => x !== 110);
      const uwaga = tekstUwagi(wpis, WYKAZ.stan_na), dopisek = dopisekListy(wpis);
      assert.ok(/2026/.test(uwaga), `${jez} ${s.kod}: brak daty wykazu: ${uwaga}`);
      if (kv.length) {
        for (const x of kv) assert.ok(uwaga.includes(String(x)) && dopisek.includes(String(x)), `${jez} ${s.kod}: brak ${x} kV`);
        assert.ok(!dopisek.includes('110'), `${jez} ${s.kod}: ${dopisek}`);
      } else {
        assert.ok(dopisek.includes('110 kV') && uwaga.includes('110 kV'), `${jez} ${s.kod}: ${uwaga}`);
      }
      assert.ok(!/obecnie|currently/.test(uwaga), `${jez} ${s.kod}: ${uwaga}`);
    }
  }
  ustawJezyk('pl');
});

test('Gdzie: zdanie-wniosek PL i EN – 16 + 9 = 25 z wykazu, daty, „0 MW” i rok z danych (zdania PSE w wyciągu)', () => {
  const n = niezaleznie();
  const zZastrzezeniami = n.pelne + n.tylko110;
  // Grupy z wykazu (liczone niezależnie) dają razem wszystkie stacje z mocą dla odbiorców.
  assert.equal(zZastrzezeniami + n.bez, n.razem);
  assert.deepEqual([zZastrzezeniami, n.bez, n.razem], [16, 9, 25]); // stan danych 25.11.2026 (wykaz 04.02.2026, moce 31.10.2026)
  const rok = MOCE.wyciag.zdania_obecne.join(' ').match(/podano dla roku (\d{4})/)[1];
  assert.ok(MOCE.wyciag.zdania_obecne.some((z) => z.includes('zerowe wartości')), 'brak zdania PSE o zerowej mocy istniejących stacji');
  const en = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  const pl = (d) => d.split('-').reverse().join('.');
  const fragmenty = {
    pl: [`tylko ${n.razem} stacji planowanych`, `Przy ${zZastrzezeniami} z nich wykaz PSE z ${pl(WYKAZ.stan_na)}`, `przy ${n.bez} takich zastrzeżeń nie podaje`, `stan na ${pl(MOCE.stan_na)}`, ' 0 MW', `na ${rok} r., nie gwarancja`],
    en: [`only the ${n.razem} planned substations`, `For ${zZastrzezeniami} of them, the PSE list of ${en(WYKAZ.stan_na)}`, `for ${n.bez}, it lists no such restriction`, `as of ${en(MOCE.stan_na)}`, ' 0 MW', `for ${rok},`],
  };
  for (const jez of ['pl', 'en']) {
    ustawJezyk(jez);
    const tekst = tekstWniosku(MOCE, WYKAZ, stacjeBezRozpatrzenia(WYKAZ));
    for (const f of fragmenty[jez]) assert.ok(tekst.includes(f), `${jez}: brak „${f}” w: ${tekst}`);
    // Bez podwójnego przeczenia („nie ma … nie były”) i bez „lista” po polsku.
    assert.ok(!/nie ma w wykazie|are not on the PSE list/.test(tekst), tekst);
    assert.ok(jez === 'en' || !/list[aey]/.test(tekst), tekst);
    // „r.” po roku tylko po polsku.
    assert.ok(jez === 'pl' || !tekst.includes(`${rok} r.`), tekst);
  }
  // Bez zdań PSE w danych – zdania nie ma (nie zgadujemy).
  assert.equal(tekstWniosku({ ...MOCE, wyciag: { zdania_obecne: [] } }, WYKAZ, stacjeBezRozpatrzenia(WYKAZ)), null);
  ustawJezyk('pl');
});

test('C2: linijka Karty „wolna moc PSE: 25 stacji planowanych (na 2031)” i kafelek – liczba i rok z danych; bez roku – brak linijki', () => {
  const razem = MOCE.odbiorcy.length;
  const rok = MOCE.wyciag.zdania_obecne.join(' ').match(/podano dla roku (\d{4})/)[1];
  assert.deepEqual([razem, rok], [25, '2031']); // stan danych 25.11.2026 (moce 31.10.2026)
  const oczekiwane = {
    pl: { skrot: `wolna moc PSE: ${razem} stacji planowanych (na\u00a0${rok})`, liczba: `${razem} stacji planowanych`, opis: `wolna moc PSE (na ${rok})` },
    en: { skrot: `PSE available capacity: ${razem} planned substations (for\u00a0${rok})`, liczba: `${razem} planned substations`, opis: `PSE available capacity (for ${rok})` },
  };
  for (const jez of ['pl', 'en']) {
    ustawJezyk(jez);
    const s = tekstMocySkrot(MOCE);
    assert.deepEqual(s, { skrot: oczekiwane[jez].skrot, kafelLiczba: oczekiwane[jez].liczba, kafelOpis: oczekiwane[jez].opis }, jez);
    // Inna liczba stacji i inny rok w danych → inne liczby w kawałku (nic na sztywno).
    const inne = { ...MOCE, odbiorcy: MOCE.odbiorcy.slice(0, 3), wyciag: { zdania_obecne: MOCE.wyciag.zdania_obecne.map((z) => z.replace(`roku ${rok}`, 'roku 2033')) } };
    const si = tekstMocySkrot(inne);
    assert.ok(/: 3 /.test(si.skrot) && si.skrot.endsWith('2033)'), `${jez}: ${si.skrot}`);
    // Bez roku w zdaniach PSE – kawałka nie ma (src/moce.js ustawia hidden), nie „moc dziś”.
    assert.equal(tekstMocySkrot({ ...MOCE, wyciag: { zdania_obecne: [] } }), null);
    assert.equal(tekstMocySkrot({ ...MOCE, wyciag: undefined }), null);
    assert.ok(!/dziś|teraz|today|now\b/i.test(s.skrot), s.skrot);
  }
  ustawJezyk('pl');
});
