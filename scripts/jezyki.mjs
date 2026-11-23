// Wersja PL i EN z jednego szablonu strony (decyzja Ani 23.11.2026) – bez kopiowania kodu stron.
// W index.html i mapa/index.html zamiast tekstu stoi znacznik {{klucz}}; tekst bierze się ze słownika
// src/teksty/pl.js albo src/teksty/en.js. Znaczniki specjalne (wylicza je ten plik):
//   {{@adres:tytulowa}}, {{@adres:mapa}} – adres strony w języku tej wersji,
//   {{@adres-pelny}} – pełny adres tej strony (og:url).
// <!-- JEZYKI --> – przełącznik PL | EN (prowadzi do tej samej strony w drugim języku).
// Wtyczka Vite: przy budowaniu każda strona dostaje wersję PL (pod starym adresem) i EN (pod /en/…);
// w `npm run dev` adres /en/… pokazuje wersję angielską. Test: node --test scripts/testy-jezyki.mjs.
import pl from '../src/teksty/pl.js';
import en from '../src/teksty/en.js';

export const SLOWNIKI = { pl, en };
export const ADRES_SERWISU = 'https://osiris-ania-rafael.pages.dev';

// Strony i ich adresy (en: null – angielskiej wersji jeszcze nie ma).
// przelacznik: wygląd PL | EN – „tekst” (strona tytułowa, obok zegara) albo „pigulka” (mapa, para z DZIEŃ | NOC).
export const STRONY = {
  tytulowa: { plik: 'index.html', pl: '/', en: '/en/', przelacznik: 'tekst' },
  mapa: { plik: 'mapa/index.html', pl: '/mapa/', en: '/en/map/', przelacznik: 'pigulka' },
};

const adres = (strona, jezyk) => STRONY[strona][jezyk] ?? STRONY[strona].pl;

const doAtrybutu = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Przełącznik PL | EN. Każda nazwa języka w swoim języku (lang), bieżący – aria-current.
// „tekst”: PL | EN jak zegar (strona tytułowa); „pigulka”: dwa przyciski w szkle, jak DZIEŃ | NOC (mapa).
function przelacznik(strona, jezyk) {
  const pigulka = STRONY[strona].przelacznik === 'pigulka';
  const klasa = pigulka ? 'przelacznik__opcja' : 'jezyki__link';
  const link = (j, skrot, nazwa) =>
    `<a class="${klasa}" href="${adres(strona, j)}" lang="${j}" hreflang="${j}" aria-label="${nazwa}"` +
    `${j === jezyk ? ' aria-current="page"' : ''}>${skrot}</a>`;
  const etykieta = doAtrybutu(SLOWNIKI[jezyk]['wspolne.jezyki_etykieta']);
  if (pigulka) {
    return `<nav class="przelacznik przelacznik--jezyki" aria-label="${etykieta}">${link('pl', 'PL', 'Polski')}${link('en', 'EN', 'English')}</nav>`;
  }
  return (
    `<nav class="jezyki" aria-label="${etykieta}">` +
    `${link('pl', 'PL', 'Polski')}<span class="jezyki__kreska" aria-hidden="true">|</span>${link('en', 'EN', 'English')}</nav>`
  );
}

// Szablon strony → gotowy HTML w danym języku. Rzuca błąd, gdy brakuje tekstu (budowanie się zatrzyma).
export function wypelnij(html, jezyk, strona) {
  const slownik = SLOWNIKI[jezyk];
  const wartosc = (klucz) => {
    if (klucz.startsWith('@adres:')) return adres(klucz.slice('@adres:'.length), jezyk);
    if (klucz === '@adres-pelny') return ADRES_SERWISU + adres(strona, jezyk);
    const w = slownik[klucz];
    if (typeof w !== 'string') throw new Error(`Brak tekstu „${klucz}” (${jezyk}) albo to nie napis – strona ${strona}`);
    return w;
  };
  let wynik = html.replace(/<html lang="[^"]*"/, `<html lang="${jezyk}"`);
  if (wynik.includes('<!-- JEZYKI -->')) {
    if (!STRONY[strona].en) throw new Error(`Przełącznik języka na stronie ${strona}, której nie ma jeszcze po angielsku`);
    wynik = wynik.replace('<!-- JEZYKI -->', przelacznik(strona, jezyk));
  }
  // Najpierw atrybuty (cała wartość = jeden znacznik) – z zamianą cudzysłowów; potem zwykły tekst.
  wynik = wynik.replace(/="\{\{([@\w.:-]+)\}\}"/g, (_, k) => `="${doAtrybutu(wartosc(k))}"`);
  wynik = wynik.replace(/\{\{([@\w.:-]+)\}\}/g, (_, k) => wartosc(k));
  return wynik;
}

const stronaZPliku = (plik) => Object.keys(STRONY).find((s) => STRONY[s].plik === plik.replace(/^\//, ''));

export function wtyczkaJezykow() {
  return {
    name: 'osiris-jezyki',
    // 'post' – po wtyczkach Vite: dopiero wtedy w generateBundle jest gotowy HTML (z adresami plików z hashem).
    enforce: 'post',
    // `npm run dev`: /en/ → szablon index.html (język rozpoznaje transformIndexHtml po pierwotnym adresie).
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [sciezka, zapytanie = ''] = req.url.split('?');
        const strona = Object.values(STRONY).find((s) => s.en && s.en === sciezka);
        if (strona) req.url = `/${strona.plik}${zapytanie && `?${zapytanie}`}`;
        next();
      });
    },
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html; // przy budowaniu – niżej, w generateBundle (obie wersje z gotowego HTML)
      const strona = stronaZPliku(ctx.path);
      const sciezka = (ctx.originalUrl ?? ctx.path).split('?')[0];
      const jezyk = Object.values(STRONY).some((s) => s.en === sciezka) ? 'en' : 'pl';
      return wypelnij(html, jezyk, strona);
    },
    generateBundle(_opcje, paczka) {
      for (const [strona, s] of Object.entries(STRONY)) {
        const plik = paczka[s.plik];
        if (!plik) throw new Error(`Brak ${s.plik} w gotowej stronie – wtyczka języków nie widzi HTML`);
        const szablon = String(plik.source);
        plik.source = wypelnij(szablon, 'pl', strona);
        if (s.en) this.emitFile({ type: 'asset', fileName: `${s.en.slice(1)}index.html`, source: wypelnij(szablon, 'en', strona) });
      }
    },
  };
}
