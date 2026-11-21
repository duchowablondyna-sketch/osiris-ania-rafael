// Składa tabele z dokumentu PSE „Informacja o dostępności mocy przyłączeniowej do sieci przesyłowej”
// ze słów z położeniem (wynik slowa-pdf.js). Bez zależności – tylko Node.
// Użycie jako program: node scripts/pse-moce/parsuj.mjs <slowa.json> <wyciag.json>
// Parser niczego nie zgaduje: czego nie rozpozna, zapisuje w „nierozpoznane” – sprawdzian (sprawdz.mjs) to zgłosi.
import { readFile, writeFile } from 'node:fs/promises';

const MIESIACE = {
  STYCZNIA: 1, LUTEGO: 2, MARCA: 3, KWIETNIA: 4, MAJA: 5, CZERWCA: 6,
  LIPCA: 7, SIERPNIA: 8, WRZEŚNIA: 9, PAŹDZIERNIKA: 10, LISTOPADA: 11, GRUDNIA: 12,
};

// Słowa jednej strony → linie (słowa o tej samej linii bazowej, ±2 pt), od góry, słowa od lewej.
function linie(strona) {
  const wynik = [];
  for (const s of [...strona.slowa].sort((a, b) => a.y1 - b.y1 || a.x0 - b.x0)) {
    const l = wynik.at(-1);
    if (l && Math.abs(l.y - s.y1) <= 2) l.slowa.push(s);
    else wynik.push({ y: s.y1, slowa: [s] });
  }
  for (const l of wynik) {
    l.slowa.sort((a, b) => a.x0 - b.x0);
    l.tekst = l.slowa.map((s) => s.t).join(' ');
  }
  return wynik;
}

const LICZBA = /^\d+$/;
const srodek = (s) => (s.x0 + s.x1) / 2;

function dataStanu(strony, nierozpoznane) {
  const tekst = linie(strony[0]).map((l) => l.tekst).join(' ');
  const m = tekst.match(/\(STAN NA (\d{1,2}) (\p{Lu}+) (\d{4}) ROKU\)/u);
  if (!m || !MIESIACE[m[2]]) {
    nierozpoznane.push('Nie znaleziono daty „STAN NA … ROKU” na pierwszej stronie.');
    return null;
  }
  return `${m[3]}-${String(MIESIACE[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// Rozdział 2: tabela mocy dla źródeł (wytwórczych). Kolumny [1]–[4] rozpoznajemy po nagłówku, nie po stałych liczbach.
function tabelaWytworcza(strony, nierozpoznane) {
  let kolumny = null; // środki nagłówków [1]..[4]
  let wTabeli = false;
  let koniec = false;
  const surowe = []; // { lp, nazwa: [fragmenty], wartosci: [4] | null }
  const legenda = [];
  for (const strona of strony) {
    for (const l of linie(strona)) {
      const t = l.tekst;
      if (/^\[[1-4]\] Rok \d{4}/.test(t)) legenda.push(t);
      if (koniec) continue;
      const naglowek = l.slowa.filter((s) => /^\[[1-4]\]$/.test(s.t));
      if (/^L\.p\. Obszary \/ Grupy \/ Węzły/.test(t) && naglowek.length === 4) {
        kolumny = naglowek.map(srodek);
        wTabeli = true;
        continue;
      }
      if (!wTabeli) continue;
      if (/^Legenda:/.test(t)) {
        koniec = true;
        continue;
      }
      // Numer strony (sama liczba w środku dołu strony) – pomijamy.
      if (l.slowa.length === 1 && LICZBA.test(t) && l.y > strona.wys - 60) continue;
      const lp = l.slowa[0].x1 < kolumny[0] - 230 && /^\d+(\.\d+)*\.?$/.test(l.slowa[0].t) ? l.slowa[0].t : null;
      const reszta = lp ? l.slowa.slice(1) : l.slowa;
      const nazwa = reszta.filter((s) => s.x1 < kolumny[0] - 15).map((s) => s.t);
      const liczby = reszta.filter((s) => s.x1 >= kolumny[0] - 15);
      let wartosci = null;
      if (liczby.length) {
        wartosci = [null, null, null, null];
        for (const s of liczby) {
          const k = kolumny.findIndex((x) => Math.abs(x - srodek(s)) < 20);
          if (k < 0 || !LICZBA.test(s.t) || wartosci[k] !== null) {
            nierozpoznane.push(`Tabela źródeł: nierozpoznana wartość „${s.t}” w wierszu „${t}”.`);
            continue;
          }
          wartosci[k] = Number(s.t);
        }
      }
      surowe.push({ lp, nazwa, wartosci, tekst: t });
    }
  }
  if (!kolumny) nierozpoznane.push('Nie znaleziono nagłówka tabeli źródeł („L.p. Obszary / Grupy / Węzły [1] [2] [3] [4]”).');

  // Nazwy w dwóch liniach („Grupa AGLOMERACJA” + „SZCZECIŃSKA 0 0 0 0”): linia bez wartości łączy się z następną.
  const wiersze = [];
  let zaleglosc = null;
  for (const r of surowe) {
    if (!r.wartosci) {
      if (zaleglosc) nierozpoznane.push(`Tabela źródeł: dwie linie z rzędu bez wartości: „${zaleglosc.tekst}”, „${r.tekst}”.`);
      zaleglosc = r;
      continue;
    }
    const lp = zaleglosc?.lp ?? r.lp;
    const nazwa = [...(zaleglosc?.nazwa ?? []), ...r.nazwa].join(' ');
    if (zaleglosc && zaleglosc.lp && r.lp) nierozpoznane.push(`Tabela źródeł: dwa numery w jednym wierszu: „${zaleglosc.tekst}” / „${r.tekst}”.`);
    zaleglosc = null;
    if (r.wartosci.includes(null)) nierozpoznane.push(`Tabela źródeł: brak którejś z 4 wartości w wierszu „${nazwa}”.`);
    wiersze.push({ lp, nazwa, wartosci: r.wartosci });
  }
  if (zaleglosc) nierozpoznane.push(`Tabela źródeł: linia bez wartości na końcu tabeli: „${zaleglosc.tekst}”.`);

  // Poziomy: POLSKA → Obszar → (Podobszar) → Grupa → stacja. Przypisanie do nadrzędnych – według kolejności w tabeli.
  let obszar = null, podobszar = null, grupa = null;
  const wynik = [];
  for (const w of wiersze) {
    let poziom, nazwa = w.nazwa;
    if (nazwa === 'POLSKA') poziom = 'polska';
    else if (nazwa.startsWith('Obszar ')) poziom = 'obszar';
    else if (nazwa.startsWith('Podobszar ')) poziom = 'podobszar';
    else if (nazwa.startsWith('Grupa ')) poziom = 'grupa';
    else poziom = 'stacja';
    const wPrzyszlosci = / \(w przyszłości\)$/.test(nazwa);
    if (wPrzyszlosci) nazwa = nazwa.replace(/ \(w przyszłości\)$/, '');
    const rekord = { lp: w.lp, poziom, nazwa, wartosci: w.wartosci };
    if (poziom === 'stacja') rekord.w_przyszlosci = wPrzyszlosci;
    if (poziom === 'obszar') { obszar = nazwa; podobszar = null; grupa = null; }
    if (poziom === 'podobszar') { rekord.obszar = obszar; podobszar = nazwa; grupa = null; }
    if (poziom === 'grupa') { rekord.obszar = obszar; if (podobszar) rekord.podobszar = podobszar; grupa = nazwa; }
    if (poziom === 'stacja') { rekord.obszar = obszar; if (podobszar) rekord.podobszar = podobszar; rekord.grupa = grupa; }
    if (poziom !== 'polska' && poziom !== 'obszar' && !obszar) nierozpoznane.push(`Tabela źródeł: wiersz „${nazwa}” przed pierwszym obszarem.`);
    if (poziom === 'stacja' && !grupa) nierozpoznane.push(`Tabela źródeł: stacja „${nazwa}” poza grupą.`);
    wynik.push(rekord);
  }
  return { legenda, wiersze: wynik };
}

// Rozdział 5: dwie tabele mocy dla odbiorców. Wiersz: „N.” KOD „–” opis, liczba w kolumnie „Dostępna moc”.
function tabeleOdbiorcze(strony, nierozpoznane) {
  const tabele = [];
  let kolumnaMocy = null;
  let biezaca = null;
  for (const strona of strony) {
    for (const l of linie(strona)) {
      const t = l.tekst;
      if (/^L\.p\. Stacje Dostępna moc$/.test(t)) {
        kolumnaMocy = srodek(l.slowa.at(-1)) - 10; // „Dostępna moc” / „przyłączeniowa” – środek kolumny
        biezaca = [];
        tabele.push(biezaca);
        continue;
      }
      if (!biezaca) continue;
      if (/^przyłączeniowa$/.test(t)) continue;
      const m = t.match(/^(\d+)\. (\S+) – (.+) (\d+)$/);
      const ostatnie = l.slowa.at(-1);
      if (m && Math.abs(srodek(ostatnie) - kolumnaMocy) < 40) {
        biezaca.push({ lp: Number(m[1]), kod: m[2], opis: m[3], moc: Number(m[4]) });
        continue;
      }
      // Koniec tabeli: zwykły tekst (akapit, „Uwaga:”) albo numer strony.
      if (biezaca.length && !/^\d+\.\s/.test(t)) {
        if (/^\d+$/.test(t)) continue; // numer strony między częściami tabeli
        biezaca = null;
        continue;
      }
      if (/^\d+\.\s/.test(t)) nierozpoznane.push(`Tabela odbiorców: nierozpoznany wiersz „${t}”.`);
    }
  }
  return tabele;
}

// Zdania, których obecność sprawdzamy (zmiana sensu danych, np. gdy istniejące stacje dostaną moc ≠ 0).
export const KLUCZOWE_ZDANIA = [
  'Dostępne moce przyłączeniowe wyznaczone w kroku 2 uznać należy za prawdopodobne i przewidziane są do publikacji.',
  'Dla stacji istniejących w chwili obecnej identyfikuje się zerowe wartości dostępnych mocy przyłączeniowych.',
  'Dostępne moce przyłączeniowe odbiorcze podano dla roku 2031',
  'Dostępna moc przyłączeniowa dla danej stacji ma wpływ na dostępną moc przyłączeniową w stacjach sąsiednich.',
];
export const TYTULY = [
  '2. Zestawienie dostępnych mocy przyłączeniowych wytwórczych w roku 2026 i 2031',
  '5. Zestawienie dostępnych mocy przyłączeniowych odbiorczych',
];

export function parsuj(slowa) {
  const strony = slowa.strony;
  const nierozpoznane = [];
  const caly = strony.map((s) => linie(s).map((l) => l.tekst).join(' ')).join(' ');
  const wytworcze = tabelaWytworcza(strony, nierozpoznane);
  return {
    stan_na: dataStanu(strony, nierozpoznane),
    liczba_stron: strony.length,
    tytuly_obecne: TYTULY.filter((t) => caly.includes(t)),
    zdania_obecne: KLUCZOWE_ZDANIA.filter((z) => caly.includes(z)),
    legenda_zrodel: wytworcze.legenda,
    zrodla: wytworcze.wiersze,
    odbiorcy: tabeleOdbiorcze(strony, nierozpoznane),
    nierozpoznane,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , wej, wyj] = process.argv;
  if (!wej || !wyj) {
    console.error('Użycie: node scripts/pse-moce/parsuj.mjs <slowa.json> <wyciag.json>');
    process.exit(2);
  }
  const wyciag = parsuj(JSON.parse(await readFile(wej, 'utf-8')));
  await writeFile(wyj, `${JSON.stringify(wyciag, null, 2)}\n`);
  const stacje = wyciag.zrodla.filter((w) => w.poziom === 'stacja').length;
  console.log(
    `Stan na: ${wyciag.stan_na} · wierszy źródeł: ${wyciag.zrodla.length} (stacji: ${stacje}) · tabel odbiorców: ${wyciag.odbiorcy.length} (${wyciag.odbiorcy.map((t) => t.length).join('+')}) · nierozpoznane: ${wyciag.nierozpoznane.length}`,
  );
}
