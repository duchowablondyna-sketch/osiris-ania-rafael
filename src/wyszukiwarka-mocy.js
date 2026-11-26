// E1 „Planuję inwestycję” (decyzje Ani 26.11.2026): pole „Ile MW potrzebujesz?” w zakładce „Gdzie” filtruje listę
// stacji planowanych PSE. Same funkcje, bez DOM – testy w Node: node --test scripts/testy-wyszukiwarka.mjs.
// Zasady: stacja pasuje, gdy PSE podaje przy NIEJ co najmniej X MW; każda stacja osobno – mocy nigdy nie dodajemy
// (PSE: wykorzystanie mocy w jednej stacji może zmniejszyć moc w sąsiednich). Kolejność jak u PSE: tabela 1, potem 2.
// Wpisu nie zgadujemy: niejasny zapis (np. „1.500”, „1,5 GW”) – komunikat zamiast wyniku.

// Spacje, także twarde i wąskie (np. „1 000” skopiowane ze strony).
const SPACJE = /[\s   ]+/g;

// Tekst z pola → { stan, mw }.
// stan: 'pusty' (bez filtra) | 'ok' (mw > 0) | 'zero' (0 albo mniej) | 'nie-liczba' | 'jednostka' (GW, kW…) |
// 'kropka' / 'przecinek' (kropka albo przecinek przed trzema cyframi, np. „1.500” – nie wiadomo, czy 1,5, czy 1500).
export function czytajMw(tekst) {
  let s = String(tekst ?? '').replace(SPACJE, ' ').trim();
  if (!s) return { stan: 'pusty', mw: null };
  // Jednostka na końcu: MW – zdejmujemy; inna (GW, kW, W) – komunikat, bez przeliczania.
  // Tylko po cyfrze (samo „w” albo „abcw” to nie jednostka, tylko „nie liczba”).
  const jednostka = /^(.*\d)\s*([gkm]?w)$/i.exec(s);
  if (jednostka) {
    if (jednostka[2].toLowerCase() !== 'mw') return { stan: 'jednostka', mw: null };
    s = jednostka[1].trim();
  }
  const minus = /^[-−–]/.test(s);
  if (minus) s = s.slice(1).trim();
  let mw;
  if (/^\d{1,3}( \d{3})+$/.test(s)) mw = Number(s.replaceAll(' ', '')); // „1 000”
  else if (/^\d+$/.test(s)) mw = Number(s);
  // „1.500”, „1.000.000” – kropka; „1,500” – przecinek (po angielsku to 1500, po polsku 1,5) – nie zgadujemy.
  else if (/^\d+([.,]\d{3})+$/.test(s)) return { stan: s.includes('.') ? 'kropka' : 'przecinek', mw: null };
  else if (/^\d+[.,]\d+$/.test(s)) mw = Number(s.replace(',', '.')); // „1,5”, „1.5”
  else return { stan: 'nie-liczba', mw: null };
  if (!Number.isFinite(mw)) return { stan: 'nie-liczba', mw: null };
  if (minus || mw <= 0) return { stan: 'zero', mw: null };
  return { stan: 'ok', mw };
}

// Stacje w kolejności PSE: tabela 1 wg L.p., potem tabela 2 wg L.p.
export const wKolejnosciPse = (odbiorcy) => [...odbiorcy].sort((a, b) => a.tabela - b.tabela || a.lp - b.lp);

// Stacje, przy których PSE podaje co najmniej mw MW – każda osobno (bez dodawania mocy), w kolejności PSE.
export function filtrujStacje(odbiorcy, mw) {
  return wKolejnosciPse(odbiorcy).filter((s) => typeof s.moc_mw === 'number' && s.moc_mw >= mw);
}

// Największa moc przy jednej stacji – z danych (do zdania „brak wyniku”; nie suma).
export function najwiekszaMoc(odbiorcy) {
  const moce = odbiorcy.map((s) => s.moc_mw).filter((x) => typeof x === 'number');
  return moce.length ? Math.max(...moce) : null;
}

// Wpis z projektu planu rozwoju sieci dla stacji (public/data/plan-rozwoju-pse.json) albo null.
export function terminPlanu(plan, kod) {
  return plan?.stacje?.find((s) => s.kod === kod) ?? null;
}
