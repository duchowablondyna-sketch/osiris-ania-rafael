// Robot OSIRIS – krok „Zgłoś”: PR (nowe dane / nowy plik) albo issue (problem). NIGDY nie scala.
// Uruchamiany w GitHub Actions (zadanie „Zgłoś”) w sklonowanym repo; lokalnie i w testach – z --na-sucho.
//
// Użycie: node scripts/pse-moce/zglos.mjs --wynik <katalog z wynik.json, opis.md, moce-pse.json> --repo <katalog repo>
//         --tryb <normalny|wymus-pr|wymus-problem> [--na-sucho]
//   --na-sucho  robi gałąź i commit lokalnie, ale nie wysyła (bez git push i bez gh) – do testów.
// Zasady:
//   – „nic do zapisania” (plik danych identyczny jak na main) w trybie normalnym: zielony koniec z raportem, bez PR;
//   – tryb wymus-pr: zawsze PR do obejrzenia – dokładamy plik-znacznik testu (SYMULACJA, NIE SCALAĆ);
//   – tytuły: „[Robot OSIRIS] …”, w trybach testowych „[Robot OSIRIS][TEST] …”.
import { execFileSync } from 'node:child_process';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PLIK_DANYCH = 'public/data/moce-pse.json';
export const ZNACZNIK_TESTU = 'robot-osiris-test/ZNACZNIK-TESTU.md';

const dataPL = (iso) => iso.split('-').reverse().join('.');
const dzisISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });

// Tytuł i rodzaj zgłoszenia – bez efektów ubocznych (testy).
export function tytul({ stan, stan_na, tryb }) {
  const prefiks = tryb.startsWith('wymus') ? '[Robot OSIRIS][TEST] ' : '[Robot OSIRIS] ';
  if (stan === 'problem') return `${prefiks}Problem z danymi PSE – ${dataPL(dzisISO())}`;
  if (stan === 'nowy-plik') return `${prefiks}Nowy plik PSE, te same dane – stan na ${dataPL(stan_na)}`;
  return `${prefiks}Nowe dane PSE – stan na ${dataPL(stan_na)}`;
}

// podsumowanie: ścieżka podsumowania przebiegu (GITHUB_STEP_SUMMARY) – podaje ją tylko prawdziwe uruchomienie z robota.
// Tryb na sucho i testy nigdy nie piszą do podsumowania (poprawka 21.11.2026: linijki z testów trafiały do raportu).
export function zglos({ wynikDir, repo, tryb, naSucho = false, log = console.log, uruchom, podsumowanie = null }) {
  const run = uruchom ?? ((cmd, args, opcje = {}) => execFileSync(cmd, args, { cwd: repo, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], ...opcje }));
  const wynik = JSON.parse(readFileSync(join(wynikDir, 'wynik.json'), 'utf-8'));
  const opisPlik = join(wynikDir, 'opis.md');
  const t = tytul({ ...wynik, tryb });
  const raport = (tekst) => {
    log(tekst);
    if (podsumowanie && !naSucho) appendFileSync(podsumowanie, `${tekst}\n`);
  };
  const repoGh = process.env.GITHUB_REPOSITORY;

  if (wynik.stan === 'bez-zmian') {
    raport('Robot OSIRIS: bez zmian – nic nie wysyłam.');
    return { akcja: 'nic' };
  }
  // Bez spamu: PR albo issue dla tego samego pliku (SHA-256 w opisie) już otwarty – nic nie wysyłamy.
  if (!naSucho) {
    const otwarte = ['pr', 'issue'].some(
      (rodzaj) => run('gh', [rodzaj, 'list', '-R', repoGh, '--state', 'open', '--search', `${wynik.sha256} in:body`, '--json', 'number', '--jq', '.[].number']).trim() !== '',
    );
    if (otwarte) {
      raport(`Dla pliku ${wynik.sha256} jest już otwarty PR albo issue – nic nie wysyłam.`);
      return { akcja: 'juz-zgloszone' };
    }
  }
  if (wynik.stan === 'problem') {
    if (!naSucho) run('gh', ['issue', 'create', '-R', repoGh, '--title', t, '--body-file', opisPlik]);
    raport(`Robot OSIRIS: otwarte issue „${t}”.`);
    return { akcja: 'issue', tytul: t };
  }

  // Nowe dane albo nowy plik: gałąź z plikiem danych (i w trybie wymus-pr – ze znacznikiem testu).
  const symulacja = tryb === 'wymus-pr';
  const galaz = symulacja
    ? `robot-osiris/test-${process.env.GITHUB_RUN_ID ?? Date.now()}`
    : `robot-osiris/pse-${wynik.stan_na}-${wynik.sha256.slice(0, 8)}`;
  if (!naSucho && run('git', ['ls-remote', '--heads', 'origin', galaz]).trim() !== '') {
    raport(`Gałąź ${galaz} już istnieje na GitHubie – nic nie wysyłam.`);
    return { akcja: 'juz-zgloszone' };
  }
  run('git', ['switch', '-q', '-c', galaz]);
  copyFileSync(join(wynikDir, 'moce-pse.json'), join(repo, PLIK_DANYCH));
  run('git', ['add', PLIK_DANYCH]);
  if (symulacja) {
    mkdirSync(join(repo, 'robot-osiris-test'), { recursive: true });
    writeFileSync(
      join(repo, ZNACZNIK_TESTU),
      `# SYMULACJA – tryb wymus-pr, NIE SCALAĆ\n\nTen plik dodał Robot OSIRIS tylko po to, żeby testowy PR zawsze miał co pokazać.\n` +
        `Przebieg: ${process.env.GITHUB_RUN_ID ?? 'lokalny'} · data: ${dzisISO()} · SHA-256 pliku PSE: ${wynik.sha256}\n` +
        'Zamknij PR bez scalania – ten plik nie powinien trafić na main.\n',
    );
    run('git', ['add', ZNACZNIK_TESTU]);
  }
  // „Nic do zapisania”: dane identyczne jak na main (np. ten sam plik i ta sama data pobrania) – zielony koniec, bez PR.
  const zmiany = run('git', ['diff', '--cached', '--name-only']).trim();
  if (!zmiany) {
    raport('Robot OSIRIS: nic do zapisania – plik danych jest identyczny jak na main. Nie otwieram PR (to nie jest błąd).');
    return { akcja: 'nic-do-zapisania' };
  }
  run('git', ['-c', 'user.name=Robot OSIRIS', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', '-q', '-m', t, '-m', `Źródło: PSE S.A., dokument o dostępności mocy przyłączeniowej, SHA-256 ${wynik.sha256}. Wyciąg i sprawdzian: scripts/pse-moce/.`]);
  if (!naSucho) {
    run('git', ['push', '-q', 'origin', galaz]);
    run('gh', ['pr', 'create', '-R', repoGh, '--base', 'main', '--head', galaz, '--title', t, '--body-file', opisPlik]);
    try {
      run('gh', ['pr', 'edit', '-R', repoGh, galaz, '--add-reviewer', process.env.RECENZENT ?? '']);
    } catch {
      raport(`Nie udało się dodać prośby o przegląd dla ${process.env.RECENZENT}.`);
    }
  }
  raport(`Robot OSIRIS: ${naSucho ? '(na sucho) ' : ''}PR „${t}” z gałęzi ${galaz} – zmienione pliki: ${zmiany.split('\n').join(', ')}.`);
  return { akcja: 'pr', tytul: t, galaz, pliki: zmiany.split('\n') };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opcja = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  if (!opcja('--wynik') || !opcja('--repo') || !opcja('--tryb')) {
    console.error('Użycie: node scripts/pse-moce/zglos.mjs --wynik <katalog> --repo <katalog> --tryb <tryb> [--na-sucho]');
    process.exit(2);
  }
  if (!existsSync(join(opcja('--wynik'), 'wynik.json'))) {
    console.error('Brak wynik.json w katalogu --wynik.');
    process.exit(2);
  }
  const naSucho = args.includes('--na-sucho');
  zglos({ wynikDir: opcja('--wynik'), repo: opcja('--repo'), tryb: opcja('--tryb'), naSucho, podsumowanie: naSucho ? null : process.env.GITHUB_STEP_SUMMARY || null });
}
