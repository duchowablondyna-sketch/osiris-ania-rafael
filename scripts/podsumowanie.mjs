// Liczby na stronę tytułową, liczone przy budowaniu z tych samych plików i tymi samymi funkcjami
// (src/liczniki.js), co legenda mapy. Wynik: public/data/podsumowanie.json (~1 kB) – strona tytułowa
// nie musi pobierać całych danych (ok. 300 kB). Brak któregoś pliku = null w wyniku („brak danych” na stronie).
import { readFile, writeFile } from 'node:fs/promises';
import { zbierzElektrownie, podsumujElektrownie, podsumujLadowe, podsumujMorskie } from '../src/liczniki.js';

const czytaj = async (plik) => {
  try {
    return JSON.parse(await readFile(plik, 'utf-8'));
  } catch {
    return null;
  }
};

const gem = await czytaj('public/data/zrodla-gem.geojson');
const morskie = await czytaj('public/data/farmy-baltyk.geojson');
const wiatr = await czytaj('public/data/wiatr.json');
const rce = await czytaj('public/data/rce.json');
const doba = await czytaj('public/data/doba.json');

const elektrownie = gem?.features ? zbierzElektrownie(gem) : null;
const wynik = {
  utworzono: new Date().toISOString(),
  wegiel: elektrownie ? podsumujElektrownie(elektrownie, 'wegiel') : null,
  ladowe: gem?.features ? podsumujLadowe(gem) : null,
  morskie: morskie?.features ? podsumujMorskie(morskie) : null,
  pse: {
    // Faktyczny czas ostatniego pobrania danych PSE (z pliku wiatru, a gdy go brak – z pliku ceny).
    pobrano: wiatr?.czas_pobrania ?? rce?.czas_pobrania ?? null,
    wiatrPobrano: wiatr?.czas_pobrania ?? null,
    rcePobrano: rce?.czas_pobrania ?? null,
    dobaOdtworzenia: doba?.doba ?? null,
  },
};
await writeFile('public/data/podsumowanie.json', JSON.stringify(wynik));
console.log(
  `Podsumowanie: węgiel ${wynik.wegiel?.liczba ?? '–'}, lądowe ${wynik.ladowe?.farmy ?? '–'}, Bałtyk ${wynik.morskie?.projekty ?? '–'}, PSE pobrano ${wynik.pse.pobrano ?? '–'}`,
);
