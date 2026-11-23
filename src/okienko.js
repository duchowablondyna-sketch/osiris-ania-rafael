// Okienko C – jeden wzór okienka dla całej mapy /mapa/ (decyzje Ani 23.11.2026):
// – najechanie myszką na obiekt → okienko obok kursora; zjechanie → znika po krótkiej chwili (da się wjechać w okienko);
// – kliknięcie → okienko przypięte (krzyżyk); zamyka: krzyżyk, klik w puste miejsce mapy, Esc;
// – przypięte jedzie razem ze swoją kropką, a gdy kropka wyjdzie poza mapę – znika;
// – zawsze na wierzchu (nad okienkiem PSE, Kartą Polski i legendą), w całości na ekranie (src/okienko-pozycja.js);
// – treść za długa → zanikanie u dołu i napis „↓ więcej poniżej” (Mac ukrywa paski przewijania);
// – linijki „ŹRÓDŁO …” przyklejone do dołu, zawsze widoczne w całości;
// – bez animacji (także przy „ogranicz ruch” nic się nie rusza).
// Okienko jest własne (nie MapLibre Popup): Popup jest częścią mapy, więc chował się pod panelami.
import { wybierzPozycje } from './okienko-pozycja.js';
import { wiecejPonizej } from './wiecej-ponizej.js';

// Panele, których okienko w miarę możliwości nie zasłania (zasłania tylko, gdy nie ma innego miejsca).
const PANELE = '.wskaznik, .legenda, .karta, .przelacznik, .maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right, .powrot, .stopka';
const OPOZNIENIE_UKRYCIA_MS = 300;

export function utworzOkienka(map) {
  const zrodla = []; // { id, warstwy, najechanie, tresc }

  const okno = document.createElement('div');
  okno.className = 'okienko';
  okno.hidden = true;
  okno.tabIndex = -1;
  okno.setAttribute('role', 'dialog');
  const krzyzyk = document.createElement('button');
  krzyzyk.type = 'button';
  krzyzyk.className = 'okienko__zamknij';
  krzyzyk.setAttribute('aria-label', 'Zamknij okienko');
  krzyzyk.textContent = '×';
  const tresc = document.createElement('div');
  tresc.className = 'okienko__tresc';
  const dol = document.createElement('div');
  dol.className = 'okienko__zrodla';
  okno.append(krzyzyk, tresc, dol);
  // Treść za długa → zanikanie u dołu i „↓ więcej poniżej” (wspólny kod: src/wiecej-ponizej.js).
  const sprawdzPrzewijanie = wiecejPonizej(tresc);
  // Podpowiedź przy kursorze (np. „kliknij – szczegóły linii”): jedna linijka, tylko dla myszy –
  // to samo mówi legenda, więc czytnik ekranu jej nie czyta.
  const podpowiedz = document.createElement('div');
  podpowiedz.className = 'podpowiedz';
  podpowiedz.hidden = true;
  podpowiedz.setAttribute('aria-hidden', 'true');
  document.body.append(okno, podpowiedz);

  // stan: null albo { klucz, przypiete, lngLat, punkt, powrotFokusu }
  let stan = null;
  let zegar = null;
  let oddajeFokus = false;

  const anulujUkrycie = () => {
    clearTimeout(zegar);
    zegar = null;
  };
  const zaplanujUkrycie = () => {
    if (!stan || stan.przypiete || zegar) return;
    zegar = setTimeout(zamknij, OPOZNIENIE_UKRYCIA_MS);
  };

  // Punkt zaczepienia w pikselach okna przeglądarki: kursor (najechanie) albo kropka (przypięte).
  function punktZaczepienia() {
    if (!stan.przypiete || !stan.lngLat) return stan.punkt;
    const r = map.getContainer().getBoundingClientRect();
    const p = map.project(stan.lngLat);
    if (p.x < 0 || p.y < 0 || p.x > r.width || p.y > r.height) return null; // kropka poza mapą
    return { x: r.left + p.x, y: r.top + p.y };
  }

  function ustaw() {
    if (!stan) return;
    const punkt = punktZaczepienia();
    if (!punkt) {
      zamknij();
      return;
    }
    const ekran = { left: 0, top: 0, right: document.documentElement.clientWidth, bottom: document.documentElement.clientHeight };
    const przeszkody = [...document.querySelectorAll(PANELE)].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
    const { left, top } = wybierzPozycje(punkt, { w: okno.offsetWidth, h: okno.offsetHeight }, ekran, przeszkody);
    okno.style.left = `${left}px`;
    okno.style.top = `${top}px`;
  }

  // el – treść okienka z budowniczego (nagłówek <strong>, linijki, na końcu linijki .zrodlo).
  function pokaz(el, { klucz = null, przypiete, lngLat = null, punkt = null, fokus = false }) {
    anulujUkrycie();
    const powrotFokusu = fokus ? document.activeElement : stan?.powrotFokusu ?? null;
    stan = { klucz, przypiete, lngLat, punkt, powrotFokusu };
    // Linijki źródła idą do przyklejonego dołu; reszta – do przewijanej części.
    const linijkiZrodla = [...el.querySelectorAll(':scope > .zrodlo')];
    dol.replaceChildren(...linijkiZrodla);
    dol.hidden = !linijkiZrodla.length;
    tresc.replaceChildren(el);
    const tytul = el.querySelector('strong');
    if (tytul) {
      tytul.id = 'okienko-tytul';
      okno.setAttribute('aria-labelledby', 'okienko-tytul');
    } else okno.removeAttribute('aria-labelledby');
    okno.classList.toggle('okienko--przypiete', przypiete);
    krzyzyk.hidden = !przypiete;
    okno.hidden = false;
    tresc.scrollTop = 0;
    sprawdzPrzewijanie();
    ustaw();
    if (fokus) okno.focus({ preventScroll: true });
  }

  function zamknij() {
    anulujUkrycie();
    if (!stan) return;
    const { powrotFokusu } = stan;
    const fokusWOkienku = okno.contains(document.activeElement);
    stan = null;
    okno.hidden = true;
    tresc.replaceChildren();
    dol.replaceChildren();
    // Fokus wraca tam, skąd przyszedł (np. przycisk stacji w zakładce GDZIE) – albo na mapę.
    // oddajeFokus: powrót fokusu na przycisk z podlacz() nie otwiera okienka od nowa.
    if (fokusWOkienku) {
      oddajeFokus = true;
      (powrotFokusu?.isConnected ? powrotFokusu : map.getCanvas()).focus({ preventScroll: true });
      oddajeFokus = false;
    }
  }

  krzyzyk.addEventListener('click', zamknij);
  okno.addEventListener('mouseenter', anulujUkrycie);
  okno.addEventListener('mouseleave', zaplanujUkrycie);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stan) {
      e.preventDefault();
      zamknij();
    }
  });
  window.addEventListener('resize', ustaw);

  // Co jest pod kursorem: najwyżej narysowany obiekt spośród zgłoszonych warstw wybiera źródło
  // (stacje PSE na samym wierzchu wygrywają z kropkami, kropki – z liniami).
  function trafienie(punkt) {
    const warstwy = zrodla.flatMap((z) => z.warstwy).filter((id) => map.getLayer(id));
    if (!warstwy.length) return null;
    const obiekty = map.queryRenderedFeatures(punkt, { layers: warstwy });
    if (!obiekty.length) return null;
    const zrodlo = zrodla.find((z) => z.warstwy.includes(obiekty[0].layer.id));
    return { zrodlo, obiekty: obiekty.filter((o) => zrodlo.warstwy.includes(o.layer.id)) };
  }
  const kluczObiektu = (zrodlo, obiekty) => `${zrodlo.id}:${JSON.stringify(obiekty[0].geometry.coordinates)}`;
  const punktOkna = (e) => {
    const r = map.getContainer().getBoundingClientRect();
    return { x: r.left + e.point.x, y: r.top + e.point.y };
  };

  // Podświetlenie obiektu pod kursorem (linie 220/400 kV) – zawsze tylko jeden naraz.
  let podswietlone = null; // { zrodlo, id }
  function podswietl(zrodlo, obiekt) {
    const nowe = zrodlo?.podswietl && obiekt?.id !== undefined ? { zrodlo, id: obiekt.id } : null;
    if (podswietlone?.zrodlo === nowe?.zrodlo && podswietlone?.id === nowe?.id) return;
    if (podswietlone) podswietlone.zrodlo.podswietl(podswietlone.id, false);
    podswietlone = nowe;
    if (nowe) nowe.zrodlo.podswietl(nowe.id, true);
  }

  // Podpowiedź: pojawia się, gdy kursor zatrzyma się na obiekcie na ok. 0,4 s (przy zwykłym przesuwaniu
  // myszy zegar startuje od nowa – bez migotania); gdy już jest – idzie za kursorem; znika po zjechaniu.
  const ZWLOKA_PODPOWIEDZI_MS = 400;
  let zegarPodpowiedzi = null;
  function schowajPodpowiedz() {
    clearTimeout(zegarPodpowiedzi);
    zegarPodpowiedzi = null;
    podpowiedz.hidden = true;
  }
  function postawPodpowiedz(punkt) {
    const szer = document.documentElement.clientWidth;
    const wys = document.documentElement.clientHeight;
    const w = podpowiedz.offsetWidth;
    const h = podpowiedz.offsetHeight;
    const left = punkt.x + 14 + w > szer - 8 ? punkt.x - 14 - w : punkt.x + 14;
    const top = punkt.y + 18 + h > wys - 8 ? punkt.y - 10 - h : punkt.y + 18;
    podpowiedz.style.left = `${Math.max(8, left)}px`;
    podpowiedz.style.top = `${Math.max(8, top)}px`;
  }
  function podpowiedzNaNajechanie(tekst, punkt) {
    if (!tekst) return schowajPodpowiedz();
    if (!podpowiedz.hidden) return postawPodpowiedz(punkt);
    clearTimeout(zegarPodpowiedzi);
    zegarPodpowiedzi = setTimeout(() => {
      podpowiedz.textContent = tekst;
      podpowiedz.hidden = false;
      postawPodpowiedz(punkt);
    }, ZWLOKA_PODPOWIEDZI_MS);
  }

  map.on('mousemove', (e) => {
    const t = trafienie(e.point);
    podswietl(t?.zrodlo, t?.obiekty[0]);
    // Podpowiedzi nie ma, gdy jakieś okienko jest przypięte.
    podpowiedzNaNajechanie(t && !stan?.przypiete ? t.zrodlo.podpowiedz : null, punktOkna(e));
    if (stan?.przypiete) return; // przypięte okienko wygrywa z najechaniem
    if (!t || !t.zrodlo.najechanie) {
      zaplanujUkrycie();
      return;
    }
    anulujUkrycie();
    const klucz = kluczObiektu(t.zrodlo, t.obiekty);
    if (stan?.klucz === klucz) return; // ten sam obiekt – okienko zostaje tam, gdzie się pojawiło
    const w = t.zrodlo.tresc(t.obiekty, e);
    if (w) pokaz(w.el, { klucz, przypiete: false, punkt: punktOkna(e) });
  });
  map.on('mouseout', () => {
    zaplanujUkrycie();
    schowajPodpowiedz();
    podswietl(null);
  });

  map.on('click', (e) => {
    schowajPodpowiedz();
    const t = trafienie(e.point);
    if (!t) {
      zamknij(); // klik w puste miejsce mapy
      return;
    }
    const w = t.zrodlo.tresc(t.obiekty, e);
    if (w) pokaz(w.el, { klucz: kluczObiektu(t.zrodlo, t.obiekty), przypiete: true, lngLat: w.lngLat, punkt: punktOkna(e) });
  });

  // Ruch mapy: okienko z najechania znika, przypięte jedzie z kropką.
  map.on('movestart', () => {
    schowajPodpowiedz();
    if (stan && !stan.przypiete) zamknij();
  });
  map.on('move', () => {
    if (stan?.przypiete) ustaw();
  });

  return {
    // Zgłoszenie warstw z okienkiem. tresc(obiekty, e) → { el, lngLat } albo null.
    // najechanie: false – okienko tylko po kliknięciu (linie 220/400 kV: są wszędzie, migałyby przy każdym ruchu myszy).
    // podpowiedz – krótki napis przy kursorze po zatrzymaniu się na obiekcie;
    // podswietl(id, wlacz) – podświetlenie obiektu pod kursorem (id z MapLibre).
    dodaj({ id, warstwy, najechanie = true, tresc: budowniczy, podpowiedz: napis = null, podswietl: swiatlo = null }) {
      zrodla.push({ id, warstwy, najechanie, tresc: budowniczy, podpowiedz: napis, podswietl: swiatlo });
    },
    // Przypięcie spoza mapy (np. przycisk stacji w zakładce GDZIE): przy kropce, a gdy kropki nie widać
    // na mapie – obok przycisku, który okienko otworzył (bez ruchu kamery).
    przypnij(el, lngLat, przycisk) {
      const r = przycisk?.getBoundingClientRect();
      const obokPrzycisku = r ? { x: r.right, y: r.top + r.height / 2 } : null;
      stan = { przypiete: true, lngLat };
      const widacKropke = Boolean(punktZaczepienia());
      stan = null;
      pokaz(el, { przypiete: true, lngLat: widacKropke ? lngLat : null, punkt: obokPrzycisku, fokus: true });
    },
    // Okienko przy elemencie strony, nie przy obiekcie na mapie (np. duża liczba w Karcie Polski – przycisk).
    // Najechanie albo Tab → okienko obok (kursora / przycisku); zjechanie albo wyjście Tabem → znika jak przy mapie;
    // kliknięcie, Enter, spacja → przypięte; z klawiatury fokus przechodzi do okienka, a Esc oddaje go przyciskowi.
    // budowniczy() → element treści albo null (np. brak danych).
    podlacz(przycisk, budowniczy) {
      const klucz = Symbol('element');
      const obokPrzycisku = () => {
        const r = przycisk.getBoundingClientRect();
        return { x: r.right, y: r.top + r.height / 2 };
      };
      const najechanie = (punkt) => {
        if (stan?.przypiete) return;
        anulujUkrycie();
        if (stan?.klucz === klucz) return; // okienko zostaje tam, gdzie się pojawiło
        const el = budowniczy();
        if (el) pokaz(el, { klucz, przypiete: false, punkt });
      };
      przycisk.addEventListener('mouseenter', (e) => najechanie({ x: e.clientX, y: e.clientY }));
      przycisk.addEventListener('mouseleave', zaplanujUkrycie);
      przycisk.addEventListener('focus', () => {
        if (!oddajeFokus && przycisk.matches(':focus-visible')) najechanie(obokPrzycisku());
      });
      przycisk.addEventListener('blur', () => {
        if (stan?.klucz === klucz && !stan.przypiete) zamknij();
      });
      przycisk.addEventListener('click', (e) => {
        const el = budowniczy();
        if (!el) return;
        const zKlawiatury = e.detail === 0; // Enter i spacja na przycisku dają kliknięcie bez myszy
        pokaz(el, { klucz, przypiete: true, punkt: zKlawiatury ? obokPrzycisku() : { x: e.clientX, y: e.clientY }, fokus: zKlawiatury });
      });
    },
    zamknij,
  };
}
