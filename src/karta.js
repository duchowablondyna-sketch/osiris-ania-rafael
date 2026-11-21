// Karta Polski – panel B na /mapa/ (lewy dolny róg). Napisy liczy src/karta-teksty.js; tu tylko wstawiamy je na stronę,
// obsługujemy zakładki i pilnujemy wysokości panelu. Dane: public/data/karta.json (scripts/karta/pobierz.mjs)
// i rce.json (ten sam plik co w okienku PSE – przekazywany z src/main.js, bez drugiego pobrania).
import { tekstyKarty, formatCzasu } from './karta-teksty.js';

const $ = (id) => document.getElementById(id);

function ustaw(id, tekst, brak = false) {
  const e = $(id);
  e.textContent = tekst;
  e.classList.toggle('brak-danych', brak);
}

function pokaz(karta, rce) {
  const t = tekstyKarty(karta, rce, Date.now());

  $('karta-plakietka').hidden = !t.plakietka;
  $('karta-plakietka-tekst').textContent = t.plakietka ?? '';
  $('karta-skrot').textContent = t.plakietka ? `${t.skrot} · ⚠ dane nie są najnowsze` : t.skrot;
  $('karta-skrot').classList.toggle('brak-danych', Boolean(t.plakietka));

  ustaw('karta-cena', t.cena.wartosc, !t.cena.ok);
  $('karta-cena-opis').textContent = t.cena.opis;
  ustaw('karta-zrodlo', t.pobrano ? `PSE · pobrano: ${t.pobrano}` : 'PSE · brak danych', !t.pobrano);

  const procent = $('karta-procent');
  // Bez danych o miksie – podpis i pasek znikają (bez pustej przerwy w panelu).
  for (const id of ['karta-podpis', 'karta-pasek', 'karta-legenda-paska']) $(id).hidden = !t.ok;
  if (!t.ok) {
    procent.textContent = '';
    procent.className = 'karta__procent liczby';
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

// Wysokość: rozwinięty panel kończy się 12 px pod okienkiem PSE (nie zasłania „Odtwórz dobę”); resztę przewija się w panelu.
// Okienko PSE zmienia wysokość (dane, odtwarzanie doby) – stąd obserwator rozmiaru zamiast jednego pomiaru.
const NAJMNIEJ_PX = 160;
function pilnujWysokosci() {
  const karta = $('karta');
  const okno = document.querySelector('.wskaznik');
  const main = karta.parentElement;
  const dopasuj = () => {
    const gora = okno ? okno.offsetTop + okno.offsetHeight + 12 : 16;
    const dol = main.clientHeight - karta.offsetTop - karta.offsetHeight; // odstęp od dołu z CSS (nad „← OSIRIS”)
    karta.style.maxHeight = `${Math.max(NAJMNIEJ_PX, main.clientHeight - gora - dol)}px`;
  };
  const obserwator = new ResizeObserver(dopasuj);
  obserwator.observe(main);
  if (okno) obserwator.observe(okno);
  dopasuj();
}

// rceGotowe: obietnica z obiektem rce.json albo null (src/main.js).
export function uruchomKarte(rceGotowe) {
  zakladki();
  pilnujWysokosci();
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
