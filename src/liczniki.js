// Wspólne funkcje liczące – używa ich mapa (legenda) i skrypt scripts/podsumowanie.mjs (liczby na stronie tytułowej),
// żeby liczby w obu miejscach zawsze się zgadzały. Bez DOM i bez MapLibre – działa też w Node.

import { tekstPl } from './jezyk.js';

// Odmiana liczebników (1 elektrownia, 2 elektrownie, 5 elektrowni; EN: 1 power plant, 2 power plants) – tn() z src/jezyk.js.

// Moc: od 1000 MW w GW z jednym miejscem po przecinku, poniżej w MW. Format liczby wg języka strony
// (locale: 'pl-PL' → 8,3 GW, 'en-GB' → 8.3 GW; domyślnie polski – tak liczy też scripts/podsumowanie.mjs).
export const formatMocy = (mw, locale = 'pl-PL') =>
  mw >= 1000
    ? `${(mw / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} GW`
    : `${Math.round(mw).toLocaleString(locale)} MW`;

// Bloki z wyciągu GEM zsumowane do jednej lokalizacji i rodzaju (jeden znaczek = jedna elektrownia).
// Tylko status „operating”. Szczytowo-pompowe: technologia GEM zawierająca „pumped storage”.
export function zbierzElektrownie(geo) {
  const lokalizacje = new Map();
  for (const f of geo.features) {
    const p = f.properties;
    if (p.status !== 'operating') continue;
    let rodzaj;
    if (p.typ === 'coal') rodzaj = 'wegiel';
    else if (p.typ === 'oil/gas') rodzaj = 'gaz';
    else if (p.typ === 'hydropower') rodzaj = /pumped storage/i.test(p.technologia ?? '') ? 'pompowa' : 'woda';
    else continue;
    const klucz = `${p.gem_location_id}|${rodzaj}`;
    if (!lokalizacje.has(klucz)) {
      lokalizacje.set(klucz, {
        wspolrzedne: f.geometry.coordinates,
        nazwa: p.nazwa,
        rodzaj,
        moc: 0,
        bloki: 0,
        paliwa: new Set(),
        technologie: new Set(),
        dokladnosc: p.dokladnosc_lokalizacji,
      });
    }
    const e = lokalizacje.get(klucz);
    e.moc += p.moc_mw ?? 0;
    e.bloki += 1;
    if (p.paliwo) for (const paliwo of p.paliwo.split(', ')) e.paliwa.add(paliwo);
    if (p.technologia) e.technologie.add(p.technologia);
  }
  return {
    type: 'FeatureCollection',
    features: [...lokalizacje.values()].map((e) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: e.wspolrzedne },
      properties: {
        nazwa: e.nazwa,
        rodzaj: e.rodzaj,
        moc: Math.round(e.moc * 10) / 10,
        bloki: e.bloki,
        paliwa: [...e.paliwa].join(';'),
        technologie: [...e.technologie].join(';'),
        dokladnosc: e.dokladnosc,
      },
    })),
  };
}

// Lądowe farmy wiatrowe (GEM): farma = lokalizacja GEM; moc działających sumowana z faz.
export function podsumujLadowe(geo) {
  const lad = geo.features.map((f) => f.properties).filter((p) => p.typ === 'wind' && p.technologia === 'Onshore');
  const dzialajace = lad.filter((p) => p.status === 'operating');
  const lokalizacje = (lista) => new Set(lista.map((p) => p.gem_location_id)).size;
  return {
    farmy: lokalizacje(dzialajace),
    mocMw: dzialajace.reduce((suma, p) => suma + (p.moc_mw ?? 0), 0),
    wBudowie: lokalizacje(lad.filter((p) => p.status === 'construction')),
  };
}

// Elektrownie wg rodzaju (z wyniku zbierzElektrownie): liczba i suma mocy.
export function podsumujElektrownie(elektrownie, rodzaj) {
  const e = elektrownie.features.filter((f) => f.properties.rodzaj === rodzaj).map((f) => f.properties);
  return { liczba: e.length, mocMw: e.reduce((suma, p) => suma + p.moc, 0) };
}

// Farmy morskie (EMODnet): wszystkie rekordy, w rozruchu, w budowie, planowane i „projekty” = bez możliwych duplikatów.
// wRozruchu – nazwy farm, których status uzupełniamy z nowszego źródła (src/main.js, UZUPELNIENIA_FARM): liczone osobno,
// nie jako „w budowie” z EMODnet.
export function podsumujMorskie(geo, wRozruchu = []) {
  const p = geo.features.map((f) => f.properties);
  // „prawdopodobny duplikat: …” – wartość z danych (po polsku), ta sama co w słowniku.
  const duplikat = (x) => String(x.weryfikacja ?? '').startsWith(tekstPl('farmy.weryfikacja.duplikat'));
  const rozruch = (x) => wRozruchu.includes(x.nazwa);
  return {
    rekordy: p.length,
    wRozruchu: p.filter(rozruch).length,
    wBudowie: p.filter((x) => x.status === 'Construction' && !rozruch(x)).length,
    planowane: p.filter((x) => x.status === 'Planned' && !rozruch(x)).length,
    duplikaty: p.filter(duplikat).length,
    duplikatyPlanowane: p.filter((x) => duplikat(x) && x.status === 'Planned').length,
    projekty: p.filter((x) => !duplikat(x)).length,
  };
}
