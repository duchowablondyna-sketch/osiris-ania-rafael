// Sprawdzian prawdy dla wyciągu z dokumentu PSE o dostępności mocy przyłączeniowej (wynik parsuj.mjs).
// Błąd = nic nie publikujemy (robot otwiera issue). Ostrzeżenie = wolno otworzyć PR, ale ostrzeżenie trafia do opisu.
// Do tego lista zmian względem poprzedniej wersji (po polsku) – do opisu PR.
// Bez zależności; funkcje eksportowane do testów (testy.mjs).
import { KLUCZOWE_ZDANIA, TYTULY } from './parsuj.mjs';

// Układ, który znamy (wydanie „stan na 31.10.2026”). Zmiana tych tekstów = PSE zmieniło układ albo znaczenie kolumn.
export const WZORZEC_LEGENDY = [
  '[1] Rok 2026 - Moc dostępna bez uwzględnienia WP do sieci 110 kV [MW] – krok 1',
  '[2] Rok 2031 - Moc dostępna bez uwzględnienia WP do sieci 110 kV [MW] – krok 1',
  '[3] Rok 2026 - Moc dostępna z uwzględnieniem WP do sieci 110 kV [MW] – krok 2',
  '[4] Rok 2031 - Moc dostępna z uwzględnieniem WP do sieci 110 kV [MW] – krok 2',
];
export const LICZBA_OBSZAROW = 10;
const NAJMNIEJ_STACJI = 100; // w wydaniu z 31.10.2026: 127
const NAJWIECEJ_MW_ODBIORCY = 5000; // pojedyncza stacja – w wydaniu z 31.10.2026 najwyżej 1000
const KOLUMNY = ['2026, krok 1', '2031, krok 1', '2026, krok 2', '2031, krok 2'];
const DZIEN = 86_400_000;

const formatData = (iso) => iso.split('-').reverse().join('.');
const czyLiczba = (v) => Number.isInteger(v) && v >= 0;

function sprawdzDate(w, poprzedni, dzis, bledy, ostrzezenia) {
  if (!w.stan_na || !/^\d{4}-\d{2}-\d{2}$/.test(w.stan_na)) {
    bledy.push('Brak daty „stan na” w dokumencie albo nie da się jej odczytać.');
    return;
  }
  const stan = Date.parse(`${w.stan_na}T00:00:00Z`);
  const teraz = Date.parse(`${dzis}T00:00:00Z`);
  if (Number.isNaN(stan)) bledy.push(`Data „stan na” (${w.stan_na}) nie istnieje w kalendarzu.`);
  else if (stan > teraz) bledy.push(`Data „stan na” (${formatData(w.stan_na)}) jest późniejsza niż dziś (${formatData(dzis)}).`);
  else if (teraz - stan > 92 * DZIEN) bledy.push(`Data „stan na” (${formatData(w.stan_na)}) jest starsza niż 3 miesiące – to nie wygląda na nową wersję.`);
  if (poprzedni?.stan_na) {
    if (w.stan_na < poprzedni.stan_na)
      bledy.push(`Data „stan na” (${formatData(w.stan_na)}) jest wcześniejsza niż w danych na stronie (${formatData(poprzedni.stan_na)}).`);
    else if (w.stan_na === poprzedni.stan_na)
      ostrzezenia.push(`Plik się zmienił, ale data „stan na” jest ta sama (${formatData(w.stan_na)}) – prawdopodobnie poprawka PSE w tym samym wydaniu.`);
  }
  if (!Number.isNaN(stan)) {
    const nastepny = new Date(stan + DZIEN);
    if (nastepny.getUTCDate() !== 1) ostrzezenia.push(`Data „stan na” (${formatData(w.stan_na)}) nie jest ostatnim dniem miesiąca (dotąd zawsze była).`);
  }
}

function sprawdzUklad(w, bledy) {
  for (const t of TYTULY) if (!w.tytuly_obecne?.includes(t)) bledy.push(`Brak tytułu rozdziału: „${t}” – układ dokumentu się zmienił.`);
  for (const z of KLUCZOWE_ZDANIA)
    if (!w.zdania_obecne?.includes(z)) bledy.push(`Brak zdania PSE: „${z}” – mogło się zmienić znaczenie danych, trzeba przeczytać dokument.`);
  const legenda = w.legenda_zrodel ?? [];
  if (legenda.length !== 4 || legenda.some((l, i) => l !== WZORZEC_LEGENDY[i])) {
    bledy.push(
      `Opis kolumn tabeli źródeł różni się od znanego.\n  Oczekiwano:\n${WZORZEC_LEGENDY.map((l) => `  - ${l}`).join('\n')}\n  Znaleziono:\n${legenda.map((l) => `  - ${l}`).join('\n') || '  - (nic)'}`,
    );
  }
  for (const n of w.nierozpoznane ?? []) bledy.push(`Odczyt PDF: ${n}`);
}

// Sumy: POLSKA = suma obszarów; obszar = suma podobszarów albo grup; podobszar = suma grup; grupa = suma stacji.
// W wydaniu z 31.10.2026 te reguły są spełnione, ale PSE ich nie opisuje – niezgodność zgłaszamy do oceny przez człowieka.
function sprawdzZrodla(w, wszystkieBledy, ostrzezenia) {
  // Własna lista błędów: wcześniejsze błędy (np. daty) nie mogą wyłączyć sprawdzania sum.
  const bledy = [];
  sprawdzZrodlaSzczegoly(w, bledy, ostrzezenia);
  wszystkieBledy.push(...bledy);
}
function sprawdzZrodlaSzczegoly(w, bledy, ostrzezenia) {
  const z = w.zrodla ?? [];
  for (const r of z) {
    if (!Array.isArray(r.wartosci) || r.wartosci.length !== 4 || !r.wartosci.every(czyLiczba))
      bledy.push(`Tabela źródeł: „${r.nazwa}” nie ma 4 całkowitych, nieujemnych wartości (${JSON.stringify(r.wartosci)}).`);
  }
  if (bledy.length) return;
  const polska = z.filter((r) => r.poziom === 'polska');
  const obszary = z.filter((r) => r.poziom === 'obszar');
  const stacje = z.filter((r) => r.poziom === 'stacja');
  if (polska.length !== 1 || z[0]?.poziom !== 'polska') bledy.push('Tabela źródeł: brak wiersza „POLSKA” na początku.');
  if (obszary.length !== LICZBA_OBSZAROW) bledy.push(`Tabela źródeł: ${obszary.length} obszarów zamiast ${LICZBA_OBSZAROW} – układ się zmienił.`);
  if (stacje.length < NAJMNIEJ_STACJI) bledy.push(`Tabela źródeł: tylko ${stacje.length} stacji (oczekiwano co najmniej ${NAJMNIEJ_STACJI}) – odczyt prawdopodobnie niepełny.`);
  if (bledy.length) return;

  const suma = (wiersze) => [0, 1, 2, 3].map((k) => wiersze.reduce((a, r) => a + r.wartosci[k], 0));
  const porownaj = (opis, wartosci, skladniki, nazwaSkladnikow) => {
    // W wydaniu z 31.10.2026 każdy obszar ma grupy, a każda grupa stacje – pusty poziom to zmiana układu albo zły odczyt.
    if (!skladniki.length) {
      bledy.push(`${opis}: brak ${nazwaSkladnikow} pod tym wierszem – układ tabeli się zmienił albo odczyt jest niepełny.`);
      return;
    }
    const s = suma(skladniki);
    const rozne = [0, 1, 2, 3].filter((k) => s[k] !== wartosci[k]);
    if (rozne.length)
      bledy.push(
        `${opis}: wartość nie równa się sumie ${nazwaSkladnikow} (${rozne.map((k) => `${KOLUMNY[k]}: ${wartosci[k]} MW, suma ${s[k]} MW`).join('; ')}). PSE nie opisuje, jak liczy wartości grup – trzeba ocenić ręcznie.`,
      );
  };
  porownaj('POLSKA', polska[0].wartosci, obszary, 'obszarów');
  for (const o of obszary) {
    const podobszary = z.filter((r) => r.poziom === 'podobszar' && r.obszar === o.nazwa);
    const grupy = z.filter((r) => r.poziom === 'grupa' && r.obszar === o.nazwa);
    if (podobszary.length) {
      porownaj(o.nazwa, o.wartosci, podobszary, 'podobszarów');
      for (const p of podobszary) porownaj(p.nazwa, p.wartosci, grupy.filter((g) => g.podobszar === p.nazwa), 'grup');
    } else porownaj(o.nazwa, o.wartosci, grupy, 'grup');
    for (const g of grupy) porownaj(`${g.nazwa} (${o.nazwa})`, g.wartosci, stacje.filter((s) => s.grupa === g.nazwa && s.obszar === o.nazwa), 'stacji');
  }
}

function sprawdzOdbiorcow(w, bledy) {
  const t = w.odbiorcy ?? [];
  if (t.length !== 2) {
    bledy.push(`Tabele mocy dla odbiorców: ${t.length} zamiast 2 – układ się zmienił.`);
    return;
  }
  const kody = new Set();
  t.forEach((tabela, i) => {
    if (!tabela.length) bledy.push(`Tabela odbiorców nr ${i + 1} jest pusta.`);
    tabela.forEach((r, j) => {
      if (r.lp !== j + 1) bledy.push(`Tabela odbiorców nr ${i + 1}: numer ${r.lp} zamiast ${j + 1} – brakuje wiersza albo kolejność się zmieniła.`);
      if (!/^[A-Z0-9]{3}$/.test(r.kod)) bledy.push(`Tabela odbiorców nr ${i + 1}: nietypowy kod stacji „${r.kod}”.`);
      if (kody.has(r.kod)) bledy.push(`Tabele odbiorców: kod ${r.kod} występuje dwa razy.`);
      kody.add(r.kod);
      if (!Number.isInteger(r.moc) || r.moc <= 0) bledy.push(`Stacja ${r.kod}: moc „${r.moc}” nie jest dodatnią liczbą całkowitą.`);
      else if (r.moc > NAJWIECEJ_MW_ODBIORCY) bledy.push(`Stacja ${r.kod}: ${r.moc} MW – podejrzanie dużo (próg ${NAJWIECEJ_MW_ODBIORCY} MW), trzeba sprawdzić w PDF.`);
    });
  });
}

// Zmiany względem poprzedniej wersji – bez sumowania mocy różnych stacji.
export function zmiany(w, poprzedni) {
  const wynik = { odbiorcy: [], zrodla: [] };
  if (!poprzedni) return wynik;
  const mapaOdb = (x) => new Map((x.odbiorcy ?? []).flat().map((r) => [r.kod, r]));
  const teraz = mapaOdb(w), przed = mapaOdb(poprzedni);
  for (const [kod, r] of teraz) {
    const p = przed.get(kod);
    if (!p) wynik.odbiorcy.push(`nowa stacja ${kod} (${r.opis}): ${r.moc} MW`);
    else if (p.moc !== r.moc) wynik.odbiorcy.push(`${kod} (${r.opis}): ${p.moc} → ${r.moc} MW (${r.moc > p.moc ? '+' : ''}${r.moc - p.moc} MW)`);
  }
  for (const [kod, p] of przed) if (!teraz.has(kod)) wynik.odbiorcy.push(`usunięta stacja ${kod} (${p.opis}), było ${p.moc} MW`);

  const klucz = (r) => `${r.poziom}|${r.obszar ?? ''}|${r.nazwa}`;
  const mapaZr = (x) => new Map((x.zrodla ?? []).map((r) => [klucz(r), r]));
  const zt = mapaZr(w), zp = mapaZr(poprzedni);
  for (const [k, r] of zt) {
    const p = zp.get(k);
    if (!p) {
      if (r.poziom === 'stacja') wynik.zrodla.push(`nowa stacja w tabeli źródeł: ${r.nazwa} (${r.grupa})`);
      else wynik.zrodla.push(`nowy wiersz w tabeli źródeł: ${r.nazwa}`);
      continue;
    }
    const roznice = [0, 1, 2, 3].filter((i) => p.wartosci[i] !== r.wartosci[i]);
    if (roznice.length)
      wynik.zrodla.push(`${r.nazwa}: ${roznice.map((i) => `${KOLUMNY[i]} ${p.wartosci[i]} → ${r.wartosci[i]} MW`).join(', ')}`);
  }
  for (const [k, p] of zp) if (!zt.has(k)) wynik.zrodla.push(`usunięty wiersz z tabeli źródeł: ${p.nazwa}`);
  return wynik;
}

export function sprawdz(w, poprzedni, dzis) {
  const bledy = [], ostrzezenia = [];
  sprawdzDate(w, poprzedni, dzis, bledy, ostrzezenia);
  sprawdzUklad(w, bledy);
  sprawdzZrodla(w, bledy, ostrzezenia);
  sprawdzOdbiorcow(w, bledy);
  // Gwałtowny spadek liczby stacji względem poprzedniej wersji – raczej błąd odczytu niż decyzja PSE.
  if (poprzedni) {
    const n = (x) => (x.zrodla ?? []).filter((r) => r.poziom === 'stacja').length;
    if (n(w) < 0.7 * n(poprzedni)) bledy.push(`Liczba stacji w tabeli źródeł spadła z ${n(poprzedni)} do ${n(w)} – raczej błąd odczytu, trzeba sprawdzić.`);
  }
  const z = bledy.length ? { odbiorcy: [], zrodla: [] } : zmiany(w, poprzedni);
  return { ok: bledy.length === 0, bledy, ostrzezenia, zmiany: z };
}

// Opis po polsku do PR albo issue (Markdown).
export function opis(wynik, w, poprzedni, zrodlo) {
  const l = [];
  const stan = w.stan_na ? formatData(w.stan_na) : 'nieznany';
  if (wynik.ok) {
    l.push(`Robot OSIRIS znalazł nową wersję dokumentu PSE „Informacja o dostępności mocy przyłączeniowej do sieci przesyłowej” – **stan na ${stan}**${poprzedni?.stan_na ? ` (na stronie: stan na ${formatData(poprzedni.stan_na)})` : ''}.`);
    l.push('', 'Sprawdzian prawdy: **przeszedł** (data, układ tabel, opisy kolumn, sumy obszarów i grup, tabele odbiorców).');
    const lista = (x) => (!poprzedni ? ['- pierwsza wersja – nie ma z czym porównać'] : x.length ? x.map((y) => `- ${y}`) : ['- bez zmian']);
    l.push('', '### Moc dla odbiorców (tabele z rozdziału 5)', ...lista(wynik.zmiany.odbiorcy));
    l.push('', '### Moc dla nowych źródeł (tabela z rozdziału 2)', ...lista(wynik.zmiany.zrodla));
    const polska = w.zrodla.find((r) => r.poziom === 'polska');
    l.push('', `POLSKA, krok 2 (kolumny wskazane przez PSE do publikacji): 2026 – ${polska.wartosci[2]} MW, 2031 – ${polska.wartosci[3]} MW.`);
    if (wynik.ostrzezenia.length) l.push('', '### Ostrzeżenia', ...wynik.ostrzezenia.map((x) => `- ${x}`));
    l.push('', 'Mocy różnych stacji nie sumujemy (PSE: wykorzystanie mocy w jednej stacji może zmniejszyć moc w stacjach sąsiednich).');
    l.push('', '**Przed scaleniem:** porównaj kilka wartości z PDF (link niżej). Robot nigdy nie scala sam.');
  } else {
    l.push(`Robot OSIRIS pobrał nową wersję dokumentu PSE, ale **sprawdzian prawdy nie przeszedł** – na stronie nic się nie zmieniło (zostają dane ze stanem na ${poprzedni?.stan_na ? formatData(poprzedni.stan_na) : '–'}).`);
    l.push('', '### Co się nie zgadza', ...wynik.bledy.map((x) => `- ${x}`));
    if (wynik.ostrzezenia.length) l.push('', '### Ostrzeżenia', ...wynik.ostrzezenia.map((x) => `- ${x}`));
    l.push('', '**Co dalej:** otworzyć PDF, porównać z opisem wyżej i zdecydować, czy poprawić odczyt (skrypty w `scripts/pse-moce/`), czy PSE zmieniło sposób publikacji.');
  }
  if (zrodlo) {
    l.push('', '### Plik', `- link: ${zrodlo.url_pdf}`, `- pobrano: ${zrodlo.pobrano}`, `- SHA-256: \`${zrodlo.sha256}\``);
    if (zrodlo.last_modified) l.push(`- Last-Modified (serwer PSE): ${zrodlo.last_modified}`);
  }
  return l.join('\n');
}
