// „↓ więcej poniżej” – jeden sygnał dla każdego miejsca na stronie, które się przewija (zasada Ani 23.11.2026):
// treść się nie mieści → od razu (bez klikania) zanikanie u dołu i przycisk „↓ więcej poniżej” pod spodem;
// przycisk przewija w dół o mniej więcej wysokość obszaru i znika po dojechaniu do końca.
// Używają go: okienko C (src/okienko.js), zakładki Karty Polski, legenda „Co oznaczają znaczki”, stopka „Źródła i licencje”.
// Mac ukrywa paski przewijania – bez tego sygnału widz nie wie, że coś jest niżej.
// Wygląd: .przewijane--wiecej (zanikanie) i .wiecej-ponizej (przycisk) w src/style.css.
import { t } from './jezyk.js';

const MIN_PRZEWINIECIE_PX = 40;
const ZAPAS_PX = 32; // tyle zostaje z poprzedniego widoku po przewinięciu (oko nie gubi miejsca)

// obszar – element, który się przewija (overflow: auto). Przycisk staje zaraz za nim (poza przewijaną częścią).
// Zwraca sprawdz() – do wywołania po podmianie treści, gdy wynik jest potrzebny od razu (np. pomiar okienka C).
export function wiecejPonizej(obszar) {
  const przycisk = document.createElement('button');
  przycisk.type = 'button';
  przycisk.className = 'wiecej-ponizej';
  przycisk.textContent = t('wspolne.wiecej_ponizej');
  przycisk.hidden = true;
  obszar.after(przycisk);
  // Obszar bez własnego tabindex dostaje go tylko na czas przewijania (Tab, potem strzałki);
  // obszary, które już go mają (zakładki Karty), zostają bez zmian.
  const wlasnyTabindex = obszar.hasAttribute('tabindex');

  function sprawdz() {
    const nadmiar = obszar.scrollHeight - obszar.clientHeight > 1;
    const doKonca = obszar.scrollTop + obszar.clientHeight >= obszar.scrollHeight - 2;
    if (!wlasnyTabindex) {
      if (nadmiar) obszar.tabIndex = 0;
      else obszar.removeAttribute('tabindex');
    }
    const bylFokusNaPrzycisku = document.activeElement === przycisk;
    const pokaz = nadmiar && !doKonca;
    obszar.classList.toggle('przewijane--wiecej', pokaz);
    przycisk.hidden = !pokaz;
    // Przycisk znika po dojechaniu do końca – fokus z klawiatury przechodzi na treść, a nie „w nicość”.
    if (bylFokusNaPrzycisku && !pokaz) obszar.focus({ preventScroll: true });
  }

  obszar.addEventListener('scroll', sprawdz, { passive: true });
  przycisk.addEventListener('click', () => {
    // Płynnie, a przy „ogranicz ruch” – od razu (sprawdzane przy każdym kliknięciu: ustawienie mogło się zmienić).
    const bezRuchu = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    obszar.scrollBy({ top: Math.max(MIN_PRZEWINIECIE_PX, obszar.clientHeight - ZAPAS_PX), behavior: bezRuchu ? 'instant' : 'smooth' });
  });

  // Zmiana rozmiaru obszaru (okno, zakładka pokazana / ukryta) albo treści (dane doszły, rozwinięte <details>).
  // Treść obserwujemy przez dzieci obszaru – sam obszar przy max-height nie rośnie, gdy rośnie treść.
  const rozmiar = new ResizeObserver(sprawdz);
  rozmiar.observe(obszar);
  for (const dziecko of obszar.children) rozmiar.observe(dziecko);
  new MutationObserver((zmiany) => {
    for (const z of zmiany) for (const nowe of z.addedNodes) if (nowe instanceof Element) rozmiar.observe(nowe);
    sprawdz();
  }).observe(obszar, { childList: true });

  sprawdz();
  return sprawdz;
}

// Wysokość przycisku w pikselach (zmienna CSS --wiecej-ponizej-wys) – do rezerwowania miejsca pod przewijaną treścią.
export function wysokoscPrzycisku() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--wiecej-ponizej-wys')) || 0;
}
