// Przy budowaniu strony: data, kiedy Robot OSIRIS ostatnio potwierdził, że na pse.pl nie ma nowszej wersji dokumentu.
// Źródło: publiczne API GitHuba, bez tokena (repo jest publiczne) – ostatni udany przebieg robota z zadaniem
// „Potwierdź aktualność danych”. Gdy API nie odpowie albo robot jeszcze nie działał: data przyjęcia danych z moce-pse.json.
// Wynik: public/data/moce-pse-sprawdzono.json (plik generowany, nie trzymamy w repo). Błąd nigdy nie przerywa budowania.
import { readFile, writeFile } from 'node:fs/promises';

const REPO = 'duchowablondyna-sketch/osiris-ania-rafael';
const WORKFLOW = 'robot-osiris-pse.yml';
const ZADANIE = 'Potwierdź aktualność danych';
const API = 'https://api.github.com';
const NAGLOWKI = { Accept: 'application/vnd.github+json', 'User-Agent': 'osiris-map-build/0.1', 'X-GitHub-Api-Version': '2022-11-28' };

async function zApi(sciezka) {
  const odp = await fetch(`${API}${sciezka}`, { headers: NAGLOWKI, signal: AbortSignal.timeout(10_000) });
  if (!odp.ok) throw new Error(`GitHub API: HTTP ${odp.status} (${sciezka})`);
  return odp.json();
}

async function ostatniePotwierdzenie() {
  const { workflow_runs: przebiegi = [] } = await zApi(`/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?branch=main&status=success&per_page=10`);
  for (const p of przebiegi) {
    const { jobs = [] } = await zApi(`/repos/${REPO}/actions/runs/${p.id}/jobs`);
    const z = jobs.find((j) => j.name === ZADANIE && j.conclusion === 'success' && j.completed_at);
    if (z) return z.completed_at;
  }
  return null;
}

const dane = JSON.parse(await readFile('public/data/moce-pse.json', 'utf-8'));
let wynik;
try {
  const kiedy = await ostatniePotwierdzenie();
  wynik = kiedy
    ? { zrodlo: 'robot', data: new Date(kiedy).toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }) }
    : { zrodlo: 'przyjeto', data: dane.przyjeto, powod: 'robot jeszcze nie potwierdził aktualności' };
} catch (e) {
  wynik = { zrodlo: 'przyjeto', data: dane.przyjeto, powod: e.message };
}
await writeFile('public/data/moce-pse-sprawdzono.json', JSON.stringify(wynik));
console.log(`Wolne moce PSE – sprawdzono: ${wynik.data} (${wynik.zrodlo}${wynik.powod ? `: ${wynik.powod}` : ''})`);
