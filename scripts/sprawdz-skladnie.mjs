// Sprawdzian PR, poziom 1a: składnia wszystkich plików JS (node --check) w src/, scripts/, cloudflare/ (Worker zegara,
// od 25.11.2026) i vite.config.js.
// Łapie np. powtórzoną deklarację funkcji (25.11.2026: drugi `formatMW` w src/main.js zatrzymał cały skrypt mapy).
// Nie uruchamia kodu – błędy, które wychodzą dopiero w przeglądarce, łapie scripts/testy-przegladarka.mjs.
// Uruchamianie: node scripts/sprawdz-skladnie.mjs (albo całość: npm run sprawdz).
import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const KATALOG = resolve(import.meta.dirname, '..');

function plikiJs(katalog) {
  const wynik = [];
  for (const wpis of readdirSync(katalog, { withFileTypes: true })) {
    const sciezka = join(katalog, wpis.name);
    if (wpis.isDirectory()) {
      if (wpis.name !== 'node_modules') wynik.push(...plikiJs(sciezka));
    } else if (/\.(m?js)$/.test(wpis.name)) {
      wynik.push(sciezka);
    }
  }
  return wynik;
}

const pliki = [
  ...plikiJs(join(KATALOG, 'src')),
  ...plikiJs(join(KATALOG, 'scripts')),
  ...plikiJs(join(KATALOG, 'cloudflare')),
  join(KATALOG, 'vite.config.js'),
];
const bledy = [];
for (const plik of pliki) {
  // "type": "module" w package.json – pliki .js są sprawdzane jako moduły ES, tak jak w przeglądarce.
  const odp = spawnSync(process.execPath, ['--check', plik], { encoding: 'utf-8' });
  if (odp.status !== 0) bledy.push(`✗ ${relative(KATALOG, plik)}\n${odp.stderr.trim()}`);
}

if (bledy.length) {
  console.error(`Składnia: ${bledy.length} z ${pliki.length} plików JS z błędem:\n\n${bledy.join('\n\n')}`);
  process.exit(1);
}
console.log(`Składnia: ${pliki.length} plików JS bez błędu.`);
