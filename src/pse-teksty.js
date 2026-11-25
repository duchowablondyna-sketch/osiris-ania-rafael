// Okienko „Wiatr, słońce i cena prądu” – napisy z danych (Etap C3, decyzje Ani 25.11.2026).
// Bez DOM i bez mapy, żeby dało się to sprawdzić w Node: node --test scripts/testy-pse.mjs
// Okienko (src/main.js) tylko wstawia te napisy na stronę. Teksty: słowniki src/teksty/pl.js i en.js.
import { t, tn, liczba, formatDoby } from './jezyk.js';

const MS_KWADRANS = 15 * 60_000;
const STREFA = 'Europe/Warsaw';

// Cena z dwoma miejscami po przecinku – ta sama funkcja dla zdania-wniosku i podpisów „maks./min.” wykresu.
export const formatCeny = (c) => liczba(c, 2);
// Doba wg czasu polskiego (RRRR-MM-DD), niezależnie od strefy komputera widza.
export const dobaPL = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: STREFA });
// „15:45 - 16:00” (PSE) → „15:45–16:00” (półpauza, jak wszędzie na stronie).
const okres = (p) => String(p.okres).replace(' - ', '–');
// Twarda spacja między liczbą a słowem w odmianie („2 kwadranse”) – nie rozdzielają się na dwa wiersze.
const zTwardaSpacja = (tekst) => tekst.replace(' ', '\u00a0');

// Cała doba bez dziur: pierwszy kwadrans od 00:00, ostatni do 24:00, kolejne końce co 15 min, wszystkie w tej dobie.
// Liczbę kwadransów daje sam czas (96; w dniu zmiany czasu 92 albo 100) – bez wpisywania jej na sztywno.
export function pelnaDoba(seria, doba) {
  const s = (seria ?? []).filter((p) => typeof p.cena === 'number' && Number.isFinite(p.cena) && p.koniec_utc && p.okres);
  if (s.length < 2 || s.length !== (seria ?? []).length) return null;
  if (!String(s[0].okres).startsWith('00:00') || !String(s.at(-1).okres).endsWith('24:00')) return null;
  for (let i = 0; i < s.length; i++) {
    const k = Date.parse(s[i].koniec_utc);
    if (!Number.isFinite(k) || dobaPL(k - MS_KWADRANS) !== doba) return null;
    if (i > 0 && k - Date.parse(s[i - 1].koniec_utc) !== MS_KWADRANS) return null;
  }
  return s;
}

// Najtańszy albo najdroższy kwadrans: najwcześniejszy z tą ceną; przy remisie – „i N inne” (decyzja D3).
function kwadransZCena(seria, cena) {
  const takie = seria.filter((p) => p.cena === cena);
  return takie.length > 1 ? t('mapa.rce_remis', okres(takie[0]), tn('mapa.rce_inne', takie.length - 1)) : okres(takie[0]);
}

// Zdanie-wniosek o cenie RCE bieżącej doby (wariant B, czas teraźniejszy – D1). Brak pełnej doby → null (brak zdania).
// Część z „razy” tylko gdy najniższa cena > 0 i iloraz (1 miejsce po przecinku) ≥ 1,1 (D2).
export function wniosekCeny(rce, teraz) {
  const doba = dobaPL(teraz);
  const seria = pelnaDoba(rce?.doby?.[doba], doba);
  if (!seria) return null;
  const ceny = seria.map((p) => p.cena);
  const min = Math.min(...ceny);
  const maks = Math.max(...ceny);
  let tekst = t('mapa.rce_wniosek', kwadransZCena(seria, min), formatCeny(min), kwadransZCena(seria, maks), formatCeny(maks));
  const razy = min > 0 ? Math.round((maks / min) * 10) / 10 : null;
  if (razy !== null && razy >= 1.1) tekst += ` ${t('mapa.rce_wniosek_razy', liczba(razy, 1))}`;
  return { tekst, min: formatCeny(min), maks: formatCeny(maks), razy };
}

// Linijka ograniczenia wiatru (D4: neutralnie, bez „polecenie”). MWh – przeliczenie OSIRIS z MW (ZRODLA.md).
export function tekstOgraniczenia(ogr) {
  if (!ogr || typeof ogr.mwh !== 'number' || !Number.isFinite(ogr.mwh) || !ogr.doba) return { ok: false, tekst: t('mapa.ograniczenie_brak') };
  const kwadranse = Number.isInteger(ogr.kwadranse) && ogr.kwadranse > 0 ? zTwardaSpacja(tn('mapa.ograniczenie_kwadranse', ogr.kwadranse)) : null;
  return { ok: true, tekst: t('mapa.ograniczenie', formatDoby(ogr.doba), liczba(ogr.mwh), kwadranse) };
}
