// Trudne słowa z objaśnieniem F1 (Etap C1/C2, decyzje Ani 25.11.2026): podkreślone słowo (przycisk) z okienkiem C.
// Wspólne dla zakładki „Gdzie” (src/moce.js) i Karty Polski (src/karta.js) – jeden kod zamiast kopii.
// Okienko: tytuł, części (tekst + drobny podpis: „objaśnienie OSIRIS” albo źródło) – teksty tylko ze słownika
// (src/teksty: slownik.*). Działa myszą, dotykiem i z klawiatury (Tab + Enter, Esc) – okienka.podlacz (wzór C).
import { t } from './jezyk.js';

const ZNAKI = /[.*+?^${}()|[\]\\]/g;
// Całe słowo: bez liter i cyfr tuż przed i bez liter tuż po (np. „MW” nie trafia w „MWh”).
const wzorzec = (slowo) => new RegExp(`(?<![\\p{L}\\p{N}])${slowo.replace(ZNAKI, '\\$&')}(?![\\p{L}])`, 'u');

function tresc(tytul, czesci) {
  const d = document.createElement('div');
  d.className = 'okienko-pytajnik';
  const n = document.createElement('strong');
  n.textContent = tytul;
  d.append(n);
  for (const { tekst, podpis } of czesci) {
    const p = document.createElement('p');
    p.textContent = tekst;
    const z = document.createElement('p');
    z.className = 'zrodlo';
    z.textContent = podpis;
    d.append(p, z);
  }
  return d;
}

// Zwykłe objaśnienie OSIRIS (jedna część z podpisem „objaśnienie OSIRIS”).
export const objasnienie = (klucz) => [{ tekst: t(klucz), podpis: t('slownik.objasnienie') }];

// RCE – część PSE ze źródłem i zdanie OSIRIS z podpisem (Etap C2). Wspólne dla Karty Polski i okienka PSE (Etap C3).
export const terminRce = () => ({
  slowo: 'RCE',
  tytul: t('slownik.rce_termin'),
  czesci: [{ tekst: t('slownik.rce'), podpis: t('slownik.rce_zrodlo') }, ...objasnienie('slownik.rce_osiris')],
});

// terminy: [{ slowo, tytul, czesci }] – w el (z potomkami) podkreśla PIERWSZE wystąpienie każdego słowa.
// Słowa już oznaczone (.termin) i przyciski są pomijane. Brak słowa w tekście – nic się nie dzieje.
export function oznaczTerminy(el, terminy, okienka) {
  if (!el || !okienka) return;
  for (const { slowo, tytul, czesci } of terminy) {
    const re = wzorzec(slowo);
    const chodzik = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('button, .termin') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let wezel = chodzik.nextNode(); wezel; wezel = chodzik.nextNode()) {
      const m = re.exec(wezel.textContent);
      if (!m) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'termin';
      b.textContent = m[0];
      b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-label', `${m[0]} – ${t('slownik.aria', tytul)}`);
      okienka.podlacz(b, () => tresc(tytul, czesci));
      // Znaki interpunkcji przy słowie (np. „(OSD)”, „kV,”) – w jednym wierszu ze słowem: przycisk jest osobnym
      // pudełkiem, więc bez tego przeglądarka może zostawić „(” na końcu wiersza albo przenieść sam „)” do następnego
      // (25.11.2026, telefon). Słowo bez takich znaków – sam przycisk, jak dotąd.
      const przed = /[(\[„«“]+$/.exec(wezel.textContent.slice(0, m.index))?.[0] ?? '';
      const po = wezel.splitText(m.index - przed.length);
      po.textContent = po.textContent.slice(przed.length + m[0].length);
      const za = /^[)\].,;:!?»”]+/.exec(po.textContent)?.[0] ?? '';
      if (przed || za) {
        const razem = document.createElement('span');
        razem.className = 'bez-lamania';
        razem.append(przed, b, za);
        po.textContent = po.textContent.slice(za.length);
        po.parentNode.insertBefore(razem, po);
      } else {
        po.parentNode.insertBefore(b, po);
      }
      break;
    }
  }
}
