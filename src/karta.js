// Karta Polski – panel B na /mapa/ (lewy dolny róg). Napisy liczy src/karta-teksty.js; tu tylko wstawiamy je na stronę,
// obsługujemy zakładki i pilnujemy wysokości panelu. Dane: public/data/karta.json (scripts/karta/pobierz.mjs)
// i rce.json (ten sam plik co w okienku PSE – przekazywany z src/main.js, bez drugiego pobrania).
import { tekstyKarty, formatCzasu, CO2_SKALA_MAX } from './karta-teksty.js';
import { wiecejPonizej, wysokoscPrzycisku } from './wiecej-ponizej.js';

const $ = (id) => document.getElementById(id);

function ustaw(id, tekst, brak = false) {
  const e = $(id);
  e.textContent = tekst;
  e.classList.toggle('brak-danych', brak);
}

// „?” przy pasku „wiatr, słońce i inne OZE” – przycisk z okienkiem C (zasada: każdy „?” na stronie jest klikalny).
// Jeden stały element: panel przebudowuje paski co minutę, a podpięcie okienka (okienka.podlacz) zostaje na przycisku.
const pytajnikOze = document.createElement('button');
pytajnikOze.type = 'button';
pytajnikOze.className = 'karta__moc-pytajnik';
pytajnikOze.textContent = '?';
pytajnikOze.setAttribute('aria-label', 'Dlaczego znak zapytania? – wyjaśnienie');
pytajnikOze.setAttribute('aria-haspopup', 'dialog');

// Treść okienka „?”: nagłówek + to samo wyjaśnienie co w liście pod paskami (czytane ze strony – jedno źródło tekstu)
// + linijka źródła z tekstyMocy() (ta sama co pod paskami).
function trescPytajnika() {
  const m = ostatnie?.moc;
  const wyjasnienie = $('karta-moce-niepewnosc')?.textContent.trim();
  if (!m?.ok || !wyjasnienie) return null;
  const el = document.createElement('div');
  el.className = 'okienko-pytajnik';
  const tytul = document.createElement('strong');
  tytul.textContent = 'Dlaczego znak zapytania?';
  const tekst = document.createElement('p');
  tekst.textContent = wyjasnienie;
  const zrodlo = document.createElement('p');
  zrodlo.className = 'zrodlo';
  const etykieta = document.createElement('span');
  etykieta.className = 'zrodlo__etykieta';
  etykieta.textContent = 'Źródło';
  zrodlo.append(etykieta, ` ${m.zrodlo}`);
  el.append(tytul, tekst, zrodlo); // okienko C przykleja linijkę źródła do dołu
  return el;
}

// Paski „Ile pracuje z tego, co mamy”: szary tor = moc zainstalowana, kolorowy pasek = produkcja teraz.
// Wszystkie liczby i napisy z tekstyMocy() (src/karta-teksty.js). Tor jest tylko dla oka – liczby stoją w tekście obok.
function pokazMoce(m) {
  const lista = $('karta-moce-lista');
  if (!m.ok) {
    ustaw('karta-moce-podpis', m.tekst, true);
    lista.replaceChildren();
    return;
  }
  ustaw('karta-moce-podpis', m.podpis);
  $('karta-moce-zrodlo').textContent = m.zrodlo;
  lista.replaceChildren(
    ...m.paski.map((p) => {
      const li = document.createElement('li');
      li.className = `karta__moc karta__moc--${p.klucz}` + (p.niepewny ? ' karta__moc--niepewny' : '') + (p.ponad ? ' karta__moc--ponad' : '');
      const wiersz = document.createElement('div');
      wiersz.className = 'karta__moc-wiersz';
      const nazwa = document.createElement('span');
      nazwa.textContent = p.nazwa;
      const liczba = document.createElement('span');
      liczba.className = 'liczby';
      liczba.textContent = p.tekst;
      if (p.niepewny) liczba.append(' ', pytajnikOze); // ten sam przycisk przy każdym odświeżeniu – okienko C zostaje podpięte
      wiersz.append(nazwa, liczba);
      const tor = document.createElement('div');
      tor.className = 'karta__moc-tor';
      tor.setAttribute('aria-hidden', 'true');
      const produkcja = document.createElement('span');
      produkcja.className = 'karta__moc-produkcja';
      produkcja.style.width = `${(p.udzial * 100).toFixed(2)}%`;
      tor.append(produkcja);
      li.append(wiersz, tor);
      if (p.dopisek) {
        const d = document.createElement('p');
        d.className = 'karta__moc-dopisek';
        d.textContent = `▸ ${p.dopisek}`;
        li.append(d);
      }
      return li;
    }),
  );
}

// Ostatnie napisy panelu – z nich (i tylko z nich) powstaje okienko Polski.
let ostatnie = null;

function pokaz(karta, rce) {
  const t = tekstyKarty(karta, rce, Date.now());
  ostatnie = t;

  $('karta-plakietka').hidden = !t.plakietka;
  $('karta-plakietka-tekst').textContent = t.plakietka ?? '';
  $('karta-skrot').textContent = t.plakietka ? `${t.skrot} · ⚠ dane nie są najnowsze` : t.skrot;
  $('karta-skrot').classList.toggle('brak-danych', Boolean(t.plakietka));

  ustaw('karta-cena', t.cena.wartosc, !t.cena.ok);
  $('karta-cena-opis').textContent = t.cena.opis;
  ustaw('karta-zrodlo', t.pobrano ? `PSE · pobrano: ${t.pobrano}` : 'PSE · brak danych', !t.pobrano);
  pokazMoce(t.moc);

  const procent = $('karta-procent');
  // Bez danych o miksie – podpis i pasek znikają (bez pustej przerwy w panelu).
  for (const id of ['karta-podpis', 'karta-pasek', 'karta-legenda-paska']) $(id).hidden = !t.ok;
  procent.disabled = !t.ok; // bez danych nie ma czego pokazać w okienku
  if (!t.ok) {
    procent.textContent = '';
    procent.className = 'karta__procent liczby';
    procent.removeAttribute('aria-label');
    ustaw('karta-zdanie', 'brak danych PSE o miksie', true);
    $('karta-podpis').textContent = '';
    $('karta-pasek').replaceChildren();
    $('karta-legenda-paska').replaceChildren();
    for (const id of ['karta-co2', 'karta-wymiana']) ustaw(id, 'brak danych PSE', true);
    for (const id of ['karta-co2-opis', 'karta-wymiana-opis']) $(id).textContent = '';
    $('karta-co2-dokladnie').textContent = 'brak danych';
    $('karta-sprawdzian').textContent = 'brak danych';
    return;
  }

  procent.textContent = t.bohater.procent;
  procent.className = `karta__procent liczby karta__procent--${t.bohater.grupa}`;
  procent.setAttribute('aria-label', `${t.bohater.procent} ${t.bohater.krotko} – szczegóły`);
  ustaw('karta-zdanie', t.bohater.zdanie);
  $('karta-podpis').textContent = t.podpis;

  // Pasek: szerokość odcinka = udział; kolory jak na mapie (zmienne CSS, zmieniają się z Dzień/Noc).
  // Dla czytnika ekranu i bez kolorów – legenda pod paskiem z nazwami i procentami.
  $('karta-pasek').replaceChildren(
    ...t.pasek.map((p) => {
      const s = document.createElement('span');
      s.className = `karta__odcinek karta__odcinek--${p.grupa}`;
      s.style.width = `${(p.udzial * 100).toFixed(2)}%`;
      return s;
    }),
  );
  $('karta-legenda-paska').replaceChildren(
    ...t.pasek.map((p) => {
      const li = document.createElement('li');
      const kolor = document.createElement('span');
      kolor.className = `karta__kolor karta__odcinek--${p.grupa}`;
      kolor.setAttribute('aria-hidden', 'true');
      const liczba = document.createElement('span');
      liczba.className = 'liczby';
      liczba.textContent = p.tekst;
      li.append(kolor, `${p.nazwa} `, liczba);
      return li;
    }),
  );

  ustaw('karta-co2', t.co2.wartosc);
  $('karta-co2-opis').textContent = t.co2.opis;
  ustaw('karta-wymiana', t.wymiana.wartosc);
  $('karta-wymiana-opis').textContent = t.wymiana.opis;
  $('karta-co2-dokladnie').textContent = t.metodologia.co2;
  $('karta-sprawdzian').textContent = t.metodologia.sprawdzian ?? 'brak danych';
}

// Zakładki (wzorzec WAI-ARIA „Tabs”): kliknięcie albo strzałki ←/→, Home, End; aktywna zakładka ma tabindex 0.
function zakladki() {
  const lista = [...document.querySelectorAll('.karta [role="tab"]')];
  function wybierz(zakladka, fokus = false) {
    for (const z of lista) {
      const wybrana = z === zakladka;
      z.setAttribute('aria-selected', String(wybrana));
      z.tabIndex = wybrana ? 0 : -1;
      $(z.getAttribute('aria-controls')).hidden = !wybrana;
    }
    if (fokus) zakladka.focus();
  }
  for (const z of lista) {
    z.addEventListener('click', () => wybierz(z));
    z.addEventListener('keydown', (e) => {
      const i = lista.indexOf(z);
      const cel = { ArrowRight: lista[(i + 1) % lista.length], ArrowLeft: lista[(i - 1 + lista.length) % lista.length], Home: lista[0], End: lista.at(-1) }[e.key];
      if (!cel) return;
      e.preventDefault();
      wybierz(cel, true);
    });
  }
}

// Wysokość: rozwinięty panel kończy się 12 px pod okienkiem PSE (nie zasłania „Odtwórz dobę”).
// Nagłówek i zakładki stoją na stałe u góry; przewija się tylko treść zakładki (zmienna --karta-tresc-max).
// Wcześniej przewijał się cały panel i zakładki wjeżdżały pod półprzezroczysty nagłówek „Karta Polski” (23.11.2026).
// Okienko PSE zmienia wysokość (dane, odtwarzanie doby) – stąd obserwator rozmiaru zamiast jednego pomiaru.
const NAJMNIEJ_PX = 160;
function pilnujWysokosci() {
  const karta = $('karta');
  const okno = document.querySelector('.wskaznik');
  const main = karta.parentElement;
  const naglowek = karta.querySelector('.karta__naglowek');
  const zakladki = karta.querySelector('.karta__zakladki');
  const dopasuj = () => {
    const gora = okno ? okno.offsetTop + okno.offsetHeight + 12 : 16;
    const dol = parseFloat(getComputedStyle(karta).bottom) || 0; // odstęp od dołu z CSS (nad „← OSIRIS”)
    const panel = Math.max(NAJMNIEJ_PX, main.clientHeight - gora - dol);
    const ramka = karta.offsetHeight - karta.clientHeight; // górna + dolna krawędź panelu
    // Stałe części panelu + miejsce na „↓ więcej poniżej” pod treścią (src/wiecej-ponizej.js).
    const stale = naglowek.offsetHeight + zakladki.offsetHeight + ramka + wysokoscPrzycisku();
    karta.style.setProperty('--karta-tresc-max', `${Math.max(60, panel - stale)}px`);
  };
  const obserwator = new ResizeObserver(dopasuj);
  obserwator.observe(main);
  if (okno) obserwator.observe(okno);
  obserwator.observe(naglowek);
  dopasuj();
}

// ── Okienko Polski (wzór C, src/okienko.js): po najechaniu na dużą liczbę „XX%” albo Tabem; kliknięcie przypina. ──
// Wszystkie liczby z tekstyKarty() (te same co w panelu) – tu nic się nie liczy, tylko wstawia napisy.
const SVG = 'http://www.w3.org/2000/svg';
const PROMIEN = 100 / (2 * Math.PI); // obwód 100 – długość kawałka = procent

function element(tag, klasa, tekst) {
  const e = document.createElement(tag);
  if (klasa) e.className = klasa;
  if (tekst !== undefined) e.textContent = tekst;
  return e;
}

// Pierścień: kawałki po kolei od godziny 12, zgodnie z ruchem wskazówek; reszta prądu – szary tor. W środku „razem”.
function pierscien(o) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 42 42');
  svg.setAttribute('class', 'okienko-polski__pierscien');
  svg.setAttribute('aria-hidden', 'true');
  const kolo = (klasa) => {
    const c = document.createElementNS(SVG, 'circle');
    c.setAttribute('cx', '21');
    c.setAttribute('cy', '21');
    c.setAttribute('r', String(PROMIEN));
    c.setAttribute('class', klasa);
    return c;
  };
  svg.append(kolo('okienko-polski__tor'));
  let start = 0;
  for (const k of o.kawalki) {
    const dl = k.udzial * 100;
    // Mała przerwa po każdym kawałku (podobne odcienie zieleni się nie zlewają); bardzo małe kawałki zostają widoczne.
    const kreska = Math.max(0, dl - Math.min(0.6, dl / 3));
    const c = kolo(`okienko-polski__luk okienko-polski__kolor--${k.grupa}`);
    c.setAttribute('stroke-dasharray', `${kreska.toFixed(3)} ${(100 - kreska).toFixed(3)}`);
    c.setAttribute('stroke-dashoffset', (25 - start).toFixed(3)); // 25 = przesunięcie na godzinę 12
    svg.append(c);
    start += dl;
  }
  const napis = document.createElementNS(SVG, 'text');
  napis.setAttribute('x', '21');
  napis.setAttribute('y', '21');
  napis.setAttribute('class', 'okienko-polski__srodek');
  napis.textContent = o.razem;
  svg.append(napis);
  return svg;
}

function trescOkienka(t, wiecej) {
  if (!t?.ok) return null;
  const o = t.okienko;
  const el = element('div', `okienko-polski okienko-polski--${t.bohater.grupa}`);
  el.append(element('strong', '', o.naglowek), element('div', 'okienko-polski__stan', o.stan));
  if (t.plakietka) {
    const p = element('p', 'karta__plakietka okienko-polski__plakietka');
    const znak = element('span', '', '⚠');
    znak.setAttribute('aria-hidden', 'true');
    p.append(znak, ` ${t.plakietka}`);
    el.append(p);
  }

  // Pierścień + lista kawałków (lista jest dla czytnika ekranu i bez kolorów; pierścień tylko dla oka).
  const miks = element('div', 'okienko-polski__miks');
  const lista = element('ul', 'okienko-polski__lista');
  lista.setAttribute('aria-label', o.naglowek);
  for (const k of o.kawalki) {
    const li = element('li');
    const kolor = element('span', `karta__kolor okienko-polski__kolor--${k.grupa}`);
    kolor.setAttribute('aria-hidden', 'true');
    li.append(kolor, element('span', 'okienko-polski__nazwa', k.nazwa), element('span', 'liczby', k.tekst));
    lista.append(li);
  }
  const razem = element('li', 'okienko-polski__razem');
  razem.append(element('span', 'okienko-polski__nazwa', '= razem'), element('span', 'liczby', o.razem));
  lista.append(razem);
  miks.append(pierscien(o), lista);
  el.append(miks);

  // Pasek CO2 0–1500 g/kWh z kropką „tu jesteśmy”.
  const co2 = element('div', 'okienko-polski__co2');
  const tytul = element('div', 'okienko-polski__co2-tytul');
  tytul.innerHTML = 'Ślad CO<sub>2</sub>';
  const skala = element('div', 'okienko-polski__skala');
  skala.setAttribute('aria-hidden', 'true');
  const kropka = element('span', 'okienko-polski__kropka');
  kropka.style.left = `${(o.co2.polozenie * 100).toFixed(2)}%`;
  skala.append(kropka);
  const krance = element('div', 'okienko-polski__krance liczby');
  krance.setAttribute('aria-hidden', 'true');
  krance.append(element('span', '', '0'), element('span', '', `${CO2_SKALA_MAX.toLocaleString('pl-PL')} g/kWh`));
  co2.append(tytul, skala, krance, element('div', 'okienko-polski__tu', o.co2.tekst));
  el.append(co2);

  el.append(element('div', 'okienko-polski__zdanie', o.zdanie));
  const przycisk = element('button', 'okienko-polski__wiecej', 'Więcej');
  przycisk.type = 'button';
  przycisk.setAttribute('aria-label', 'Więcej – Metodologia w panelu Karty Polski');
  przycisk.addEventListener('click', wiecej);
  el.append(przycisk);

  const zrodlo = element('p', 'zrodlo');
  zrodlo.append(element('span', 'zrodlo__etykieta', 'Źródło'), t.pobrano ? `PSE · pobrano: ${t.pobrano}` : 'PSE');
  el.append(zrodlo); // okienko C przykleja linijkę źródła do dołu
  return el;
}

// Wołane z src/main.js po wczytaniu mapy (wtedy powstają okienka).
export function podlaczOkienkoPolski(okienka) {
  // „Więcej”: okienko się zamyka, w zakładce ILE I JAK CZYSTO rozwija się Metodologia, fokus na jej nagłówek.
  const wiecej = () => {
    okienka.zamknij();
    document.getElementById('zakladka-ile').click();
    const metodologia = document.querySelector('#karta-ile .karta__metodologia');
    metodologia.open = true;
    metodologia.querySelector('summary').focus();
  };
  okienka.podlacz($('karta-procent'), () => trescOkienka(ostatnie, wiecej));
  okienka.podlacz(pytajnikOze, trescPytajnika); // „?” przy pasku OZE → „Dlaczego znak zapytania?”
}

// rceGotowe: obietnica z obiektem rce.json albo null (src/main.js).
export function uruchomKarte(rceGotowe) {
  zakladki();
  pilnujWysokosci();
  // Każda zakładka, która się nie mieści: zanikanie u dołu i „↓ więcej poniżej” (jak w okienku C).
  for (const tresc of document.querySelectorAll('.karta__tresc')) wiecejPonizej(tresc);
  // Cloudflare Pages na brakujący plik odpowiada stroną HTML (kod 200) – wtedy .json() rzuca błąd i mamy „brak danych”.
  const kartaGotowa = fetch(`${import.meta.env.BASE_URL}data/karta.json`, { cache: 'no-store' })
    .then((odp) => (odp.ok ? odp.json() : null))
    .catch(() => null);
  return Promise.all([kartaGotowa, rceGotowe.catch(() => null)]).then(([karta, rce]) => {
    pokaz(karta, rce);
    if (karta?.kwadrans && karta.czas_pobrania) $('karta-pobrano').textContent = formatCzasu(karta.czas_pobrania); // stopka „Źródła i licencje”
    // Co minutę: nowy kwadrans ceny i sprawdzenie wieku danych (plakietka po 6 h).
    setInterval(() => pokaz(karta, rce), 60_000);
    return karta;
  });
}
