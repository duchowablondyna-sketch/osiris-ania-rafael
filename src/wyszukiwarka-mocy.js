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

// ── F2.1 „PGE na liście w Gdzie” (decyzje Ani 26.11.2026): grupy stacji 110 kV PGE Dystrybucja (public/data/osd-pge.json).
// Moc jest wspólna dla CAŁEJ grupy – grupa pasuje, gdy PGE podaje przy niej co najmniej X MW w roku filtra (2031, jak PSE
// w E1); grup nie dodajemy i mocy nie dzielimy na stacje. Kolejność – jak w tabeli PGE (numer grupy).
export const wKolejnosciGrup = (grupy) => [...grupy].sort((a, b) => a.nr - b.nr);

export function filtrujGrupy(grupy, mw, rok) {
  return wKolejnosciGrup(grupy).filter((g) => typeof g.mw?.[rok] === 'number' && g.mw[rok] >= mw);
}

// Największa moc w JEDNEJ grupie w danym roku (do zdania „brak wyniku”; nie suma).
export function najwiekszaMocGrupy(grupy, rok) {
  const moce = grupy.map((g) => g.mw?.[rok]).filter((x) => typeof x === 'number');
  return moce.length ? Math.max(...moce) : null;
}

// Nazwa do porównań: małe litery, bez polskich znaków i nadmiarowych spacji („Bełchatów” = „belchatow” = „BEŁCHATÓW ”).
export const doPorownania = (s) =>
  String(s ?? '')
    .toLocaleLowerCase('pl')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

// Szukanie stacji po nazwie (osobne pole): fragment nazwy, w każdej grupie osobno. Ta sama nazwa w kilku grupach
// (np. „Bełchatów” – gr. 18 i 19) → wszystkie te grupy. Zwraca [{ grupa, stacje: [nazwy pasujące] }] w kolejności PGE
// i `dokladne` – [{ nazwa, grup }]: stacje o nazwie DOKŁADNIE takiej jak wpis (bez wielkości liter i znaków), które są
// w więcej niż jednej grupie.
export function szukajStacji(grupy, tekst) {
  const q = doPorownania(tekst);
  if (!q) return { pusty: true, wyniki: [], dokladne: [] };
  const wyniki = wKolejnosciGrup(grupy)
    .map((g) => ({ grupa: g, stacje: g.stacje.filter((s) => doPorownania(s.nazwa).includes(q)).map((s) => s.nazwa) }))
    .filter((w) => w.stacje.length);
  const wGrupach = new Map();
  for (const w of wyniki) for (const n of w.stacje) if (doPorownania(n) === q) wGrupach.set(n, (wGrupach.get(n) ?? 0) + 1);
  const dokladne = [...wGrupach].filter(([, ile]) => ile > 1).map(([nazwa, grup]) => ({ nazwa, grup }));
  return { pusty: false, wyniki, dokladne };
}

// ── Narzędzia „Gdzie” (decyzje Ani 27.11.2026): jedno pole MW i jedno pole nazwy dla wszystkich operatorów,
// pod nimi podsumowanie – operator pod operatorem. Mocy nie dodajemy ani między operatorami, ani między grupami.

// Stacje PSE po nazwie: opis PSE (dosłownie) albo nazwa do szukania z uzupełnienia SOURCE
// (public/data/pse-szukanie.json – miejscowość w mianowniku, np. „w rejonie Kutna” → „Kutno”). Kolejność PSE.
export function szukajStacjiPse(odbiorcy, szukanie, tekst) {
  const q = doPorownania(tekst);
  if (!q) return { pusty: true, wyniki: [] };
  const teksty = (s) => [s.opis_pse, ...(szukanie?.stacje?.[s.kod]?.szukaj ?? [])];
  return { pusty: false, wyniki: wKolejnosciPse(odbiorcy).filter((s) => teksty(s).some((x) => doPorownania(x).includes(q))) };
}

// Jedna linijka podsumowania dla operatora.
// wynik: { gotowe, razem, pasujace: [pozycje], etykiety?: [teksty do wymienienia – domyślnie pasujace], dokladne: [{ nazwa, grup }] }
// filtr: { mw: true/false – czy pole MW działa, nazwa: true/false – czy wpisano nazwę }.
// rodzaj: 'brak-danych' | 'brak' | 'liczba' (tylko MW: „N z M”) | 'lista' (nazwa: wymienione pozycje).
export function wierszOperatora(wynik, filtr) {
  if (!wynik?.gotowe) return { rodzaj: 'brak-danych' };
  const n = wynik.pasujace.length;
  if (!n) return { rodzaj: 'brak' };
  if (filtr.nazwa) return { rodzaj: 'lista', n, etykiety: wynik.etykiety ?? wynik.pasujace, dokladne: wynik.dokladne ?? [] };
  return { rodzaj: 'liczba', n, razem: wynik.razem };
}
