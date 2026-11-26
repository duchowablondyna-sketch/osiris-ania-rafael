// Warstwa „Wolna moc dla odbiorców” – dane PSE (stacje 220/400 kV), plik public/data/moce-pse.json
// (scripts/pse-moce/robot.mjs). Zasady (decyzje Ani, 21.11.2026):
// – znaczek: sześciokąt w kolorze turkusowym #2DD4BF; wypełniony = moc dla odbiorców, przerywana obwódka = stacja planowana;
// – stacje „w rejonie X”: półprzezroczyste koło (promień z pliku) z podpisem „lokalizacja przybliżona”;
// – moc dla źródeł: bez znaczków, tylko zdanie w legendzie i w panelu;
// – mocy stacji nigdy nie sumujemy (PSE: moc jednej stacji wpływa na moc stacji sąsiednich).
import { stacjeBezRozpatrzenia, podzialStacji } from './wykaz-rozdzielni.js';
import { t, tn, liczba, cytatPse, formatDoby, formatMiesiaca, tekstPl, JEZYK } from './jezyk.js';
import { oznaczTerminy, objasnienie } from './terminy.js';
import { tekstPodsumowania, tekstUwagi, dopisekListy, napieciaLub, tekstWniosku, tekstMocySkrot, zZdanPse } from './moce-teksty.js';
import { czytajMw, filtrujStacje, najwiekszaMoc, terminPlanu } from './wyszukiwarka-mocy.js';
import { dodajOsdPge } from './osd-pge.js';

export const KOLOR_MOCY = '#2DD4BF';
const KOSMOS = '#05070D';
const WARSTWY = ['moce-kola', 'moce-kola-obwodka', 'moce-podpis', 'moce'];

// Daty i liczby wg języka strony (src/jezyk.js): 31.10.2026 / 31 Oct 2026, 1 200 MW / 1,200 MW.
const formatDaty = formatDoby;
const formatMw = (mw) => `${liczba(mw)} MW`;
// E1: w nowych tekstach twarda spacja przed „MW” (decyzja Ani 26.11.2026 – ujednolicenie reszty strony na później).
const formatMwTwarda = (mw) => `${liczba(mw)}\u00a0MW`;

// Strony PDF planu z objaśnieniem „roku zakończenia” (przypis *3) i z zastrzeżeniami (1)–(6) – plan-rozwoju-pse.json.
const STRONA_ZAKONCZENIA = '62';

// Cytat z PSE jako elementy strony: po angielsku nasze tłumaczenie, a pod nim mniejszym drukiem oryginał po polsku
// (decyzja Ani 23.11.2026); bez tłumaczenia – oryginał z dopiskiem. Po polsku – sam tekst.
function podCytatem(tekstPl) {
  const c = cytatPse(tekstPl);
  if (!c.oryginal && !c.bezTlumaczenia) return null;
  const s = document.createElement('span');
  s.className = 'cytat-oryginal';
  if (c.oryginal) {
    s.lang = 'pl';
    s.textContent = t('cytat.oryginal', c.oryginal);
  } else {
    s.textContent = t('cytat.bez_tlumaczenia');
  }
  return s;
}

// Koło o promieniu r km wokół punktu – wielokąt na powierzchni Ziemi (rośnie razem z przybliżeniem mapy).
function kolo(lon, lat, rKm, punkty = 72) {
  const R = 6371.0088;
  const d = rKm / R;
  const f1 = (lat * Math.PI) / 180;
  const l1 = (lon * Math.PI) / 180;
  const pierscien = [];
  for (let i = 0; i <= punkty; i++) {
    const b = (2 * Math.PI * i) / punkty;
    const f2 = Math.asin(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(b));
    const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2));
    pierscien.push([(l2 * 180) / Math.PI, (f2 * 180) / Math.PI]);
  }
  return { type: 'Polygon', coordinates: [pierscien] };
}

// Sześciokąt (wierzchołek u góry) – ścieżka na płótnie.
function sciezkaSzesciokata(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Znaczek: turkusowy sześciokąt z ciemną krawędzią + przerywana turkusowa obwódka (stacja planowana).
// Rysowany w kodzie (bez obrazków z zewnątrz), w podwójnej rozdzielczości (pixelRatio 2).
// Rozmiar: o 30% większy niż pierwsza wersja (decyzja Ani, 21.11.2026) – kształt ma odróżniać go od zielonych kropek farm.
// przygaszony = według wykazu rozdzielni PSE wnioski do stacji obecnie pozostają bez rozpatrzenia: pusty środek
// (ciemny), cieńsza i przygaszona obwódka – moc w dokumencie jest, ale dziś nie da się z niej skorzystać.
const SKALA_ZNACZKA = 1.3;
function znaczekSzesciokat(przygaszony = false) {
  const S = 2, k = SKALA_ZNACZKA, N = Math.ceil(22 * k) * S;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d');
  const sr = N / 2;
  // Ciemny pas pod przerywaną obwódką – żeby kreski były widoczne także na jasnym tle (Dzień) i na światłach miast.
  sciezkaSzesciokata(ctx, sr, sr, 9.4 * k * S);
  ctx.lineWidth = 3 * S;
  ctx.strokeStyle = 'rgba(5, 7, 13, 0.75)';
  ctx.stroke();
  ctx.setLineDash([2.4 * k * S, 1.8 * k * S]);
  ctx.lineWidth = 1.6 * S;
  // Przygaszona przerywana: 0,7 (pomiar 21.11.2026: przy 0,55 kontrast z ciemnym pasem tylko 3,2–3,8 : 1, przy 0,7 – 4,2–5,5 : 1).
  ctx.strokeStyle = przygaszony ? 'rgba(45, 212, 191, 0.7)' : KOLOR_MOCY;
  ctx.stroke();
  ctx.setLineDash([]);
  sciezkaSzesciokata(ctx, sr, sr, 6.2 * k * S);
  if (przygaszony) {
    ctx.fillStyle = 'rgba(5, 7, 13, 0.85)';
    ctx.fill();
    // Ciemna krawędź pod obwódką (z obu stron) – na światłach miast turkus ma podobną jasność jak tło (1,2–1,6 : 1),
    // więc oddziela go ciemny pasek, jak przy wypełnionym sześciokącie.
    ctx.lineWidth = 3.6 * S;
    ctx.strokeStyle = KOSMOS;
    ctx.stroke();
    // Obwódka 0,9 (pomiar 21.11.2026: przy 0,75 kontrast z tłem 3,8–6,1 : 1, przy 0,9 – 4,8–8,3 : 1).
    ctx.lineWidth = 1.6 * S;
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.9)';
    ctx.stroke();
  } else {
    ctx.fillStyle = KOLOR_MOCY;
    ctx.fill();
    ctx.lineWidth = 1.5 * S;
    ctx.strokeStyle = KOSMOS;
    ctx.stroke();
  }
  return { obraz: ctx.getImageData(0, 0, N, N), pixelRatio: S };
}

// Podpis „lokalizacja przybliżona” jako obrazek (mapa nie ma serwera czcionek – nie dokładamy połączenia z zewnątrz).
async function obrazekPodpisu(tekst) {
  const S = 2;
  const czcionka = `500 ${11 * S}px Inter, system-ui, sans-serif`;
  try {
    await document.fonts.load(czcionka);
  } catch {
    /* zostaje czcionka systemowa */
  }
  const pomiar = document.createElement('canvas').getContext('2d');
  pomiar.font = czcionka;
  const szer = Math.ceil(pomiar.measureText(tekst).width) + 8 * S;
  const wys = 16 * S;
  const c = document.createElement('canvas');
  c.width = szer;
  c.height = wys;
  const ctx = c.getContext('2d');
  ctx.font = czcionka;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4 * S;
  ctx.strokeStyle = 'rgba(5, 7, 13, 0.9)';
  ctx.strokeText(tekst, szer / 2, wys / 2);
  ctx.fillStyle = KOLOR_MOCY;
  ctx.fillText(tekst, szer / 2, wys / 2);
  return { obraz: ctx.getImageData(0, 0, szer, wys), pixelRatio: S };
}

// Moc dla nowych źródeł: jedno zdanie z liczb PSE (wiersz „POLSKA”, krok 2) – bez znaczków na mapie.
export function zdanieZrodel(zp) {
  const a = zp?.rok_2026_krok_2, b = zp?.rok_2031_krok_2;
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  if (a === 0 && b === 0) return t('moce.zrodla_zero');
  return t('moce.zrodla', formatMw(a), formatMw(b));
}

// „stacja w rejonie Warszawy” → „w rejonie Warszawy”; „Norki” → „Norki” (to, co PSE podaje o miejscu).
// Po angielsku – całe przetłumaczone określenie („substation in the Warsaw area”); oryginał stoi pod nagłówkiem okienka.
const rejonPse = (opis) => {
  const c = cytatPse(opis);
  return c.oryginal || c.bezTlumaczenia ? c.tekst : opis.replace(/^stacja /, '');
};
function opisLokalizacji(s, promien) {
  const l = s.lokalizacja;
  if (l.rodzaj === 'okolica') return t('moce.lok_okolica', rejonPse(s.opis_pse), l.nazwa_osm, promien);
  if (l.rodzaj === 'stacja-osm') return t('moce.lok_osm', l.nazwa_osm);
  return t('moce.lok_brak');
}

export function dodajWarstweMocy(map, { linijkaZrodla, ustawLicznik, okienka }) {
  // „OSD” w zdaniu o operatorach dystrybucyjnych (F1, 25.11.2026) – tekst stały w HTML, więc bez czekania na dane.
  oznaczTerminy(
    document.getElementById('moce-osd-wstep'),
    [{ slowo: t('slownik.osd_w_zdaniu'), tytul: t('slownik.osd_termin'), czesci: objasnienie('slownik.osd') }],
    okienka,
  );
  // F2.1: grupy stacji 110 kV PGE w tej samej zakładce (src/osd-pge.js) – własne dane, działa też bez danych PSE.
  const osdPge = dodajOsdPge({ okienka, linijkaZrodla });
  let dane = null;
  let wykaz = null; // wykaz rozdzielni PSE (public/data/rozdzielnie-pse.json); null = nie wczytał się
  let bezRozpatrzenia = new Map();
  const panel = document.getElementById('panel-moce');

  // Treść okienka jednej albo kilku stacji w tym samym miejscu (np. dwie stacje „w rejonie Warszawy”) – każda osobno,
  // bez sumy. Przy kilku stacjach nagłówek mówi to wprost („2 stacje w tym miejscu”).
  function trescOkienka(kody) {
    if (!dane) return null;
    const stacje = kody.map((k) => dane.odbiorcy.find((s) => s.kod === k)).filter(Boolean);
    if (!stacje.length) return null;
    const el = document.createElement('div');
    el.className = 'okienko-mocy';
    const span = (tekst, klasa) => {
      const s = document.createElement('span');
      s.textContent = tekst;
      if (klasa) s.className = klasa;
      return s;
    };
    if (stacje.length > 1) {
      const ile = document.createElement('strong');
      ile.className = 'okienko-mocy__ile';
      ile.textContent = t('moce.w_tym_miejscu', tn('liczba.stacja', stacje.length));
      el.append(ile, document.createElement('hr'));
    }
    stacje.forEach((s, i) => {
      if (i) el.append(document.createElement('hr'));
      const tytul = document.createElement('strong');
      tytul.textContent = `${s.kod} – ${cytatPse(s.opis_pse).tekst}`;
      el.append(tytul, document.createElement('br'));
      const oryginal = podCytatem(s.opis_pse);
      if (oryginal) el.append(oryginal, document.createElement('br'));
      el.append(span(t('moce.moc', formatMw(s.moc_mw)), 'okienko-mocy__moc'), document.createElement('br'));
      if (s.tabela === 2) el.append(span(t('moce.tabela2')), document.createElement('br'));
      el.append(span(opisLokalizacji(s, dane.lokalizacje.promien_km)), document.createElement('br'));
      const wstrz = bezRozpatrzenia.get(s.kod);
      if (wstrz) {
        el.append(
          span(tekstUwagi(wstrz, wykaz.stan_na), 'okienko-mocy__ostrzezenie'),
          document.createElement('br'),
          span(
            t('moce.lista_pse', cytatPse(wstrz.tytul_listy).tekst, wstrz.rozdzielnie.map((r) => r.replace(/^Rozdzielnia /, '')).join(', ')),
            'okienko-mocy__uwaga',
          ),
          document.createElement('br'),
        );
        const oryginalListy = podCytatem(wstrz.tytul_listy);
        if (oryginalListy) el.append(oryginalListy, document.createElement('br'));
        el.append(
          span(t('moce.daty_rozne', formatDaty(wykaz.stan_na), formatDaty(dane.stan_na), formatDaty(wykaz.zrodlo.pobrano)), 'okienko-mocy__uwaga'),
          document.createElement('br'),
        );
      } else if (!wykaz) {
        el.append(span(t('moce.wykaz_brak'), 'okienko-mocy__ostrzezenie brak-danych'), document.createElement('br'));
      }
    });
    if (stacje.length > 1) el.append(span(t('moce.kazda_osobno'), 'okienko-mocy__uwaga'), document.createElement('br'));
    el.append(span(t('moce.siec_nn'), 'okienko-mocy__uwaga'), document.createElement('br'));
    el.append(span(t('moce.szacunek_okienko', formatDaty(dane.stan_na)), 'okienko-mocy__uwaga'));
    el.append(linijkaZrodla('PSE', 'stan', formatDaty(dane.stan_na)));
    if (stacje.some((s) => bezRozpatrzenia.has(s.kod))) el.append(linijkaZrodla(t('moce.zrodlo_wykaz'), 'stan', formatDaty(wykaz.stan_na)));
    if (stacje.some((s) => s.lokalizacja.rodzaj !== 'brak')) el.append(linijkaZrodla(t('moce.zrodlo_osm'), 'stan', formatDaty(dane.lokalizacje.stan_osm?.slice(0, 10))));
    return el;
  }

  // Okienko wzoru C (src/okienko.js): najechanie i kliknięcie na mapie.
  okienka.dodaj({
    id: 'moce',
    warstwy: ['moce'],
    tresc: (obiekty) => {
      const el = trescOkienka([...new Set(obiekty.map((f) => f.properties.kod))]);
      return el ? { el, lngLat: obiekty[0].geometry.coordinates } : null;
    },
  });

  map.addSource('moce-kola', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('moce', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  });
  // Koła pod liniami (nie zasłaniają złotych linii), znaczki na samym wierzchu.
  const pod = map.getLayer('linie-nn-obwodka') ? 'linie-nn-obwodka' : undefined;
  // Koło, w którym wszystkie stacje mają wnioski bez rozpatrzenia, jest bledsze (jak przygaszony znaczek).
  map.addLayer(
    { id: 'moce-kola', type: 'fill', source: 'moce-kola', paint: { 'fill-color': KOLOR_MOCY, 'fill-opacity': ['case', ['get', 'wstrzymane'], 0.05, 0.12] } },
    pod,
  );
  map.addLayer(
    {
      id: 'moce-kola-obwodka',
      type: 'line',
      source: 'moce-kola',
      paint: { 'line-color': KOLOR_MOCY, 'line-opacity': ['case', ['get', 'wstrzymane'], 0.4, 0.75], 'line-width': 1.2, 'line-dasharray': [3, 2] },
    },
    pod,
  );
  const z = znaczekSzesciokat();
  map.addImage('znaczek-szesciokat', z.obraz, { pixelRatio: z.pixelRatio });
  const zp = znaczekSzesciokat(true);
  map.addImage('znaczek-szesciokat-przygaszony', zp.obraz, { pixelRatio: zp.pixelRatio });
  map.addLayer({
    id: 'moce',
    type: 'symbol',
    source: 'moce',
    layout: {
      'icon-image': ['case', ['get', 'wstrzymane'], 'znaczek-szesciokat-przygaszony', 'znaczek-szesciokat'],
      // Przygaszone pod spodem – gdy dwa znaczki się nakładają, wyżej jest ten, do którego wnioski są rozpatrywane.
      'symbol-sort-key': ['case', ['get', 'wstrzymane'], 0, 1],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 6, 1, 9, 1.4],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });
  obrazekPodpisu(t('moce.podpis_przyblizona')).then((p) => {
    map.addImage('podpis-przyblizona', p.obraz, { pixelRatio: p.pixelRatio });
    // Podpis od przybliżenia 6 (przy widoku całej Polski 20 podpisów zlałoby się w jedną plamę); nachodzące się podpisy
    // MapLibre sam ukrywa. Przy mniejszym przybliżeniu objaśnia to legenda.
    map.addLayer(
      {
        id: 'moce-podpis',
        type: 'symbol',
        source: 'moce',
        minzoom: 6,
        filter: ['==', ['get', 'rodzaj'], 'okolica'],
        layout: {
          'icon-image': 'podpis-przyblizona',
          'icon-anchor': 'top',
          'icon-offset': [0, 17],
          visibility: map.getLayoutProperty('moce', 'visibility') ?? 'visible',
        },
      },
      'moce',
    );
  });

  map.on('mouseenter', 'moce', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'moce', () => (map.getCanvas().style.cursor = ''));


  // ── E1 „Planuję inwestycję” (wariant A – decyzja Ani 26.11.2026): przy stacji jedna krótka linijka z projektu planu
  // rozwoju sieci PSE + krótki skrót przypisu PSE; całość (pełne zdanie wykazu rozdzielni, linijka planu, przypisy
  // z oryginałem, „zakończenie zadania”, po angielsku oryginał opisu stacji) – w okienku „?” (wzór C).
  const element = (tag, klasa, tekst) => {
    const e = document.createElement(tag);
    if (klasa) e.className = klasa;
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  };
  // Części okienka „?” stacji – teksty tylko ze słowników i z danych (jedno źródło tekstu).
  function czesciOkienkaStacji(s, wpis, plan, wpisPlanu) {
    const czesci = [];
    if (JEZYK !== 'pl') czesci.push({ tekst: t('cytat.oryginal', s.opis_pse), podpis: `PSE · ${t('zrodlo.stan', formatDaty(dane.stan_na))}` });
    // Pełne zdanie wykazu (np. „…o rozdzielniach 220/400 kV wykaz nic nie mówi”) – żeby krótkie „110 kV – bez rozpatrzenia”
    // nie było czytane jako „stacja odpada” (decyzja Ani 26.11.2026).
    if (wpis) {
      czesci.push({
        tekst: tekstUwagi(wpis, wykaz.stan_na),
        podpis: `${t('wspolne.zrodlo')}: ${t('moce.zrodlo_wykaz')} · ${t('zrodlo.stan', formatDaty(wykaz.stan_na))}`,
      });
    }
    czesci.push({
      tekst: t('plan.linia', formatMiesiaca(plan.zrodlo.data_dokumentu), wpisPlanu.rok_rozpoczecia, wpisPlanu.rok_zakonczenia),
      podpis: t('plan.zrodlo', wpisPlanu.strona),
    });
    for (const nr of wpisPlanu.przypisy) {
      czesci.push({ tekst: `${t(`plan.przypis.${nr}`)} ${t('plan.cytat', plan.przypisy_pse[nr])}`, podpis: t('plan.zrodlo', plan.przypisy_strony.join(', ')) });
    }
    czesci.push({
      tekst: JEZYK === 'pl' ? t('slownik.zakonczenie_pse') : `${t('slownik.zakonczenie_pse')} ${t('plan.cytat', plan.rok_zakonczenia_pse)}`,
      podpis: t('plan.zrodlo', STRONA_ZAKONCZENIA),
    });
    // Trzy zdania OSIRIS pod jednym podpisem.
    czesci.push({ tekst: ['slownik.zakonczenie_osiris', 'slownik.zakonczenie_linie', 'slownik.ure'].map((k) => t(k)).join(' '), podpis: t('slownik.objasnienie') });
    return czesci;
  }
  // Okienko „?” stacji: podpis każdej części tuż pod nią (mały, szary – nie przyklejany na dół jak .zrodlo w okienku C,
  // bo przy kilku częściach podpisy zbiłyby się pod spodem); na dole jedna linijka źródła jak w okienku stacji na mapie.
  function trescOkienkaStacji(nazwa, czesci) {
    const d = element('div', 'okienko-pytajnik');
    d.append(element('strong', '', nazwa));
    for (const { tekst, podpis } of czesci) d.append(element('p', '', tekst), element('p', 'okienko-pytajnik__podpis', podpis));
    d.append(linijkaZrodla('PSE', 'stan', formatDaty(dane.stan_na)));
    return d;
  }
  // Linijka planu przy stacji: „Projekt planu PSE – zadanie budowy stacji: 2023–2031 · realizacja zależy od odbiorców (PSE) ?”.
  // „?” trzyma się ostatniego słowa (nie spada sam do nowej linii – telefon).
  function linijkaPlanu(s, wpis, plan, wpisPlanu) {
    const tekst = [t('plan.krotko', wpisPlanu.rok_rozpoczecia, wpisPlanu.rok_zakonczenia), ...wpisPlanu.przypisy.map((nr) => t(`plan.skrot.${nr}`))].join(' ');
    const ostatnia = tekst.lastIndexOf(' ');
    const linia = element('span', 'panel-moce__plan', tekst.slice(0, ostatnia + 1));
    const razem = element('span', 'bez-lamania', `${tekst.slice(ostatnia + 1)}\u00a0`);
    const pyt = element('button', 'karta__moc-pytajnik', '?');
    pyt.type = 'button';
    const nazwa = `${s.kod} – ${cytatPse(s.opis_pse).tekst}`;
    pyt.setAttribute('aria-label', t('plan.krotko_aria', nazwa));
    pyt.setAttribute('aria-haspopup', 'dialog');
    okienka.podlacz(pyt, () => trescOkienkaStacji(nazwa, czesciOkienkaStacji(s, wpis, plan, wpisPlanu)));
    razem.append(pyt);
    linia.append(razem);
    return linia;
  }
  // Linijki E1 dopisywane do pozycji listy (po nazwie, mocy i linijce „na 2031 r. · stan · lokalizacja”).
  function linijkiE1(s, wpis, plan) {
    const wpisPlanu = terminPlanu(plan, s.kod);
    if (!wpisPlanu) return [];
    const wynik = [linijkaPlanu(s, wpis, plan, wpisPlanu)];
    // POM (decyzja Ani 26.11.2026): lata z dopiskiem, dlaczego dopasowanie jest niepewne – zawsze widoczny.
    if (wpisPlanu.dopasowanie === 'niepewne') wynik.push(element('span', 'panel-moce__niepewne', t(`plan.niepewne.${s.kod}`)));
    return wynik;
  }

  // Filtr E1: pole „Ile MW potrzebujesz?” ukrywa stacje z mniejszą mocą (każda osobno), licznik „Pasuje: N z 25 stacji”.
  const szukaj = {
    blok: document.getElementById('szukaj-mw'),
    pole: document.getElementById('szukaj-mw-pole'),
    wszystkie: document.getElementById('szukaj-mw-wszystkie'),
    status: document.getElementById('szukaj-mw-status'),
    brak: document.getElementById('szukaj-mw-brak'),
    brakZdanie: document.getElementById('szukaj-mw-brak-zdanie'),
  };
  const BLEDY = { zero: 'szukaj.blad_zero', 'nie-liczba': 'szukaj.blad_liczba', jednostka: 'szukaj.blad_jednostka', kropka: 'szukaj.blad_kropka', przecinek: 'szukaj.blad_przecinek' };
  function zastosujFiltr() {
    if (!dane) return;
    const { stan, mw } = czytajMw(szukaj.pole.value);
    osdPge.filtruj(stan, mw);
    const pasujace = stan === 'ok' ? new Set(filtrujStacje(dane.odbiorcy, mw).map((s) => s.kod)) : null;
    for (const nr of [1, 2]) {
      let widac = 0;
      for (const li of document.getElementById(`moce-lista-${nr}`).children) {
        li.hidden = Boolean(pasujace) && !pasujace.has(li.dataset.kod);
        if (!li.hidden) widac++;
      }
      document.getElementById(`moce-lista-${nr}-tytul`).hidden = widac === 0;
    }
    szukaj.wszystkie.hidden = stan === 'pusty';
    szukaj.status.classList.toggle('szukaj-mw__status--blad', Boolean(BLEDY[stan]));
    szukaj.status.textContent = BLEDY[stan] ? t(BLEDY[stan]) : pasujace ? t('szukaj.pasuje', pasujace.size, dane.odbiorcy.length) : '';
    const brak = Boolean(pasujace) && pasujace.size === 0;
    szukaj.brak.hidden = !brak;
    if (brak) {
      szukaj.brakZdanie.textContent = t(
        'szukaj.brak',
        formatMwTwarda(mw),
        formatDaty(dane.stan_na),
        zZdanPse(dane).rok ?? '–',
        formatMwTwarda(najwiekszaMoc(dane.odbiorcy)),
      );
    }
  }
  szukaj.pole.addEventListener('input', zastosujFiltr);
  szukaj.wszystkie.addEventListener('click', () => {
    szukaj.pole.value = '';
    zastosujFiltr();
    szukaj.pole.focus();
  });
  // „zobacz listę operatorów” – przewinięcie do listy OSD w tej samej zakładce i fokus na pierwszym linku.
  document.getElementById('szukaj-mw-do-osd').addEventListener('click', (e) => {
    e.preventDefault();
    const lista = document.getElementById('moce-osd');
    const ruch = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    lista.scrollIntoView({ block: 'start', behavior: ruch });
    lista.querySelector('a')?.focus({ preventScroll: true });
  });
  // Po angielsku pod ścieżką menu PSE – oryginał po polsku (jak cytaty PSE).
  if (JEZYK !== 'pl') {
    const o = element('span', 'cytat-oryginal', t('cytat.oryginal', tekstPl('szukaj.co_dalej_sciezka')));
    o.lang = 'pl';
    document.getElementById('szukaj-mw-co-dalej').append(o);
  }

  // Lista w panelu: przycisk otwiera okienko stacji (bez ruchu kamery).
  function wypelnijPanel(sprawdzono, plan) {
    const rok = zZdanPse(dane).rok;
    for (const nr of [1, 2]) {
      const ul = document.getElementById(`moce-lista-${nr}`);
      ul.replaceChildren(
        ...dane.odbiorcy
          .filter((s) => s.tabela === nr)
          .map((s) => {
            const li = document.createElement('li');
            li.dataset.kod = s.kod;
            const nazwa = document.createElement(s.lokalizacja.rodzaj === 'brak' ? 'span' : 'button');
            nazwa.className = 'panel-moce__nazwa';
            nazwa.textContent = `${s.kod} – ${cytatPse(s.opis_pse).tekst}`;
            if (nazwa.tagName === 'BUTTON') {
              nazwa.type = 'button';
              nazwa.addEventListener('click', () => {
                const razem = dane.odbiorcy.filter((x) => x.lokalizacja.lon === s.lokalizacja.lon && x.lokalizacja.lat === s.lokalizacja.lat).map((x) => x.kod);
                const el = trescOkienka(razem);
                if (el) okienka.przypnij(el, [s.lokalizacja.lon, s.lokalizacja.lat], nazwa);
              });
            }
            const moc = document.createElement('span');
            moc.className = 'panel-moce__mw liczby';
            moc.textContent = formatMw(s.moc_mw);
            const lok = document.createElement('span');
            lok.className = 'panel-moce__lok';
            // E1: „na 2031 r. · stan na … · lokalizacja …” (rok i data z danych; bez roku w danych – jak dotąd).
            const lokalizacja = t(`moce.lok_krotko.${s.lokalizacja.rodzaj}`);
            lok.textContent = rok ? `${t('szukaj.moc', rok, formatDaty(dane.stan_na))} · ${lokalizacja}` : lokalizacja;
            const wpis = bezRozpatrzenia.get(s.kod);
            if (wpis) {
              // „· 220 i 400 kV – bez rozpatrzenia” w całości w jednym wierszu (łamanie tylko przed „·” – E1, decyzja Ani).
              const w = document.createElement('span');
              w.className = 'panel-moce__wstrzymane bez-lamania';
              w.textContent = dopisekListy(wpis).trimStart();
              lok.append(' ', w);
              if (wpis.pusty) li.classList.add('panel-moce__pozycja--wstrzymana');
            }
            li.append(nazwa, moc, lok);
            // EN: oryginał opisu PSE – w okienku „?” (E1); bez planu – jak dotąd pod nazwą.
            const oryginal = terminPlanu(plan, s.kod) ? null : podCytatem(s.opis_pse);
            if (oryginal) li.append(oryginal);
            li.append(...linijkiE1(s, wpis, plan));
            return li;
          }),
      );
    }
    const podsumowanie = document.getElementById('moce-podsumowanie');
    const ile = dane.odbiorcy.length;
    if (wykaz) {
      podsumowanie.textContent = tekstPodsumowania(dane, wykaz, bezRozpatrzenia);
      // Trudne słowa w podsumowaniu (F1, Etap C1): „rozdzielni” i „kV” – wspólny kod src/terminy.js.
      oznaczTerminy(
        podsumowanie,
        [
          { slowo: t('slownik.rozdzielnia_w_zdaniu'), tytul: t('slownik.rozdzielnia_termin'), czesci: objasnienie('slownik.rozdzielnia') },
          { slowo: 'kV', tytul: t('slownik.kv_termin'), czesci: objasnienie('slownik.kv') },
        ],
        okienka,
      );
      const wniosek = document.getElementById('moce-wniosek');
      wniosek.textContent = tekstWniosku(dane, wykaz, bezRozpatrzenia) ?? '';
      wniosek.hidden = !wniosek.textContent;
      podsumowanie.append(linijkaZrodla(t('moce.zrodlo_wykaz'), 'stan', formatDaty(wykaz.stan_na)));
    } else {
      podsumowanie.textContent = t('moce.podsumowanie_bez_wykazu', tn('liczba.stacja_ma', ile));
      podsumowanie.classList.add('brak-danych');
    }
    // Zdanie o mocy dla nowych źródeł + dopisek, że dotyczy elektrowni, nie odbiorców (Etap C1) – w zakładce i w legendzie.
    const zdanie = zdanieZrodel(dane.zrodla_polska);
    const zdanieZDopiskiem = zdanie ? `${zdanie}. ${t('moce.zrodla_dotyczy')}` : null;
    document.getElementById('moce-zrodla-zdanie').textContent = zdanieZDopiskiem ?? t('moce.zrodla_brak');
    const sp = sprawdzono?.data
      ? sprawdzono.zrodlo === 'robot'
        ? t('moce.sprawdzono_robot', formatDaty(sprawdzono.data))
        : t('moce.sprawdzono', formatDaty(sprawdzono.data))
      : t('moce.sprawdzono', formatDaty(dane.przyjeto));
    document.getElementById('moce-stan').textContent = t('moce.stan', formatDaty(dane.stan_na), sp);
    document.getElementById('moce-zrodlo').replaceChildren(linijkaZrodla('PSE', 'stan', formatDaty(dane.stan_na)));
    const legZdanie = document.getElementById('legenda-moce-zrodla');
    legZdanie.textContent = zdanieZDopiskiem ?? t('moce.zrodla_brak');
    legZdanie.append(linijkaZrodla('PSE', 'stan', formatDaty(dane.stan_na)));
  }

  const sprawdzonoGotowe = fetch(`${import.meta.env.BASE_URL}data/moce-pse-sprawdzono.json`, { cache: 'no-store' })
    .then((o) => (o.ok ? o.json() : null))
    .catch(() => null);
  // E1: terminy zadań z projektu planu rozwoju sieci PSE (public/data/plan-rozwoju-pse.json); brak pliku – lista bez tej linijki.
  const planGotowy = fetch(`${import.meta.env.BASE_URL}data/plan-rozwoju-pse.json`, { cache: 'no-store' })
    .then((o) => (o.ok ? o.json() : null))
    .then((p) => (Array.isArray(p?.stacje) && p.przypisy_pse && p.zrodlo ? p : null))
    .catch(() => null);
  const wykazGotowy = fetch(`${import.meta.env.BASE_URL}data/rozdzielnie-pse.json`, { cache: 'no-store' })
    .then((o) => (o.ok ? o.json() : null))
    .then((w) => (Array.isArray(w?.listy) && w.listy.length === 3 ? w : null))
    .catch(() => null);
  fetch(`${import.meta.env.BASE_URL}data/moce-pse.json`, { cache: 'no-store' })
    .then((o) => (o.ok ? o.json() : null))
    .then(async (d) => {
      if (!Array.isArray(d?.odbiorcy)) throw new Error('brak pliku');
      dane = d;
      wykaz = await wykazGotowy;
      bezRozpatrzenia = wykaz ? stacjeBezRozpatrzenia(wykaz) : new Map();
      const promien = d.lokalizacje.promien_km;
      const naMapie = d.odbiorcy.filter((s) => s.lokalizacja.rodzaj !== 'brak');
      map.getSource('moce').setData({
        type: 'FeatureCollection',
        features: naMapie.map((s) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.lokalizacja.lon, s.lokalizacja.lat] },
          properties: { kod: s.kod, rodzaj: s.lokalizacja.rodzaj, wstrzymane: Boolean(bezRozpatrzenia.get(s.kod)?.pusty) },
        })),
      });
      // Jedno koło na miejsce (dwie stacje „w rejonie Warszawy” mają to samo koło).
      const miejsca = new Map();
      for (const s of naMapie.filter((x) => x.lokalizacja.rodzaj === 'okolica')) {
        const klucz = `${s.lokalizacja.lon},${s.lokalizacja.lat}`;
        const m = miejsca.get(klucz) ?? { l: s.lokalizacja, wszystkieWstrzymane: true };
        m.wszystkieWstrzymane &&= Boolean(bezRozpatrzenia.get(s.kod)?.pusty);
        miejsca.set(klucz, m);
      }
      map.getSource('moce-kola').setData({
        type: 'FeatureCollection',
        features: [...miejsca.values()].map(({ l, wszystkieWstrzymane }) => ({
          type: 'Feature',
          geometry: kolo(l.lon, l.lat, promien),
          properties: { wstrzymane: wszystkieWstrzymane },
        })),
      });
      const lw = wykaz ? podzialStacji(d.odbiorcy, bezRozpatrzenia) : null;
      ustawLicznik(
        'moce',
        t(
          'moce.licznik',
          tn('liczba.stacja_planowana', d.odbiorcy.length),
          naMapie.length,
          formatDaty(d.stan_na),
          lw ? t('moce.licznik_wykaz', lw.pelne, napieciaLub(lw.napieciaPelnych), lw.tylko110, formatDaty(wykaz.stan_na)) : t('moce.licznik_wykaz_brak'),
        ),
        !wykaz,
      );
      // Legenda: opis pustego sześciokąta z datą wykazu z danych (zamiast „obecnie”).
      document.getElementById('legenda-moce-pusty').textContent = t('leg.moce_pusty', wykaz ? formatDaty(wykaz.stan_na) : null);
      // Etap C2 (P1): liczba stacji z wolną mocą w zwiniętej Karcie i w kafelku telefonu (te same dane).
      const sm = tekstMocySkrot(d);
      const skrotMoce = document.getElementById('skrot-moce');
      skrotMoce.textContent = sm?.skrot ?? '';
      skrotMoce.hidden = !sm;
      document.getElementById('kafel-moce').textContent = sm?.kafelLiczba ?? '–';
      document.getElementById('kafel-moce-opis').textContent = sm?.kafelOpis ?? '';
      wypelnijPanel(await sprawdzonoGotowe, await planGotowy);
      szukaj.blok.hidden = false;
      zastosujFiltr();
    })
    .catch(() => {
      ustawLicznik('moce', t('wspolne.brak_danych'), true);
      document.getElementById('legenda-moce-pusty').textContent = t('leg.moce_pusty', null);
      document.getElementById('moce-stan').textContent = t('moce.brak');
      document.getElementById('moce-stan').classList.add('brak-danych');
      document.getElementById('legenda-moce-zrodla').textContent = t('moce.zrodla_brak');
    });

  return { warstwy: WARSTWY, panel };
}
