// Gdzie postawić okienko (wzór C): obok punktu (kursor albo kropka na mapie), zawsze w całości na ekranie
// i – jeśli się da – bez zasłaniania paneli (okienko PSE, Karta Polski, legenda…). Bez DOM, żeby dało się to
// sprawdzić w Node: node --test scripts/testy-okienko.mjs
//
// punkt: { x, y } – w pikselach okna przeglądarki; rozmiar: { w, h } – okienka;
// ekran: { left, top, right, bottom }; przeszkody: lista prostokątów { left, top, right, bottom } (panele).
// Wynik: { left, top } – lewy górny róg okienka.

const pole = (a, b) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

// Porównanie po kolei: decyduje pierwsza różniąca się liczba; przy pełnym remisie zostaje wcześniejszy kandydat.
function lepszaOcena(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}

export function wybierzPozycje(punkt, rozmiar, ekran, przeszkody = [], odstep = 14, margines = 8) {
  const { x, y } = punkt;
  const { w, h } = rozmiar;
  // Kolejność = pierwszeństwo przy remisie: najpierw w prawo w dół od punktu (tam zwykle patrzy oko po kliknięciu).
  const kandydaci = [
    [x + odstep, y + odstep],
    [x + odstep, y - odstep - h],
    [x - odstep - w, y + odstep],
    [x - odstep - w, y - odstep - h],
    [x - w / 2, y + odstep],
    [x - w / 2, y - odstep - h],
  ];
  // Dociągnięcie do ekranu; okienko większe niż ekran – przyklejone do lewej / górnej krawędzi.
  const naEkran = (wartosc, od, doo, rozm) => Math.max(od + margines, Math.min(wartosc, doo - margines - rozm));
  // Punkt (kursor, kropka) z małym marginesem – okienko nie może go przykryć.
  const wokolPunktu = { left: x - odstep / 2, top: y - odstep / 2, right: x + odstep / 2, bottom: y + odstep / 2 };

  let najlepszy = null;
  for (const [l, t] of kandydaci) {
    const left = naEkran(l, ekran.left, ekran.right, w);
    const top = naEkran(t, ekran.top, ekran.bottom, h);
    const prost = { left, top, right: left + w, bottom: top + h };
    // Ocena (mniej = lepiej, po kolei): przykrywa punkt? → ile zasłania paneli → o ile trzeba było dosunąć do ekranu.
    const ocena = [pole(prost, wokolPunktu) > 0 ? 1 : 0, przeszkody.reduce((s, p) => s + pole(prost, p), 0), Math.abs(left - l) + Math.abs(top - t)];
    if (!najlepszy || lepszaOcena(ocena, najlepszy.ocena)) najlepszy = { left, top, ocena };
  }
  return { left: Math.round(najlepszy.left), top: Math.round(najlepszy.top) };
}
