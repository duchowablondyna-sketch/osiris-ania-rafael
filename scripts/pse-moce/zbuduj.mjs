// Buduje plik dla mapy (public/data/moce-pse.json) z wyciągu PSE, danych o pobranym pliku i wybranych lokalizacji.
// Nazwy stacji zostają takie jak w dokumencie PSE (kod + opis) – niczego nie dopisujemy od siebie.

export function zbuduj(wyciag, zrodlo, lokalizacje, przyjeto) {
  const polska = wyciag.zrodla.find((r) => r.poziom === 'polska');
  const odbiorcy = wyciag.odbiorcy.flatMap((tabela, i) =>
    tabela.map((r) => {
      const l = lokalizacje.stacje[r.kod];
      const lokalizacja = !l || l.rodzaj === 'brak' || typeof l.lat !== 'number'
        ? { rodzaj: 'brak', uwaga: l?.uwaga ?? 'Stacja nowa w dokumencie PSE – lokalizacja jeszcze niewybrana (do uzupełnienia w scripts/pse-moce/lokalizacje.json).' }
        : { rodzaj: l.rodzaj, lon: l.lon, lat: l.lat, osm: l.osm, nazwa_osm: l.nazwa_osm, uwaga: l.uwaga };
      return { tabela: i + 1, lp: r.lp, kod: r.kod, opis_pse: r.opis, moc_mw: r.moc, lokalizacja };
    }),
  );
  return {
    opis: 'Wolne moce przyłączeniowe w sieci przesyłowej PSE (220/400 kV) – wyciąg OSIRIS. Szacunek operatora, nie gwarancja przyłączenia. Mocy stacji nie sumujemy.',
    zrodlo,
    stan_na: wyciag.stan_na,
    przyjeto,
    lokalizacje: { stan_osm: lokalizacje.stan_osm, promien_km: lokalizacje.promien_km, licencja: '© OpenStreetMap contributors, ODbL' },
    // Moc dla nowych źródeł – kolumny wskazane przez PSE do publikacji (krok 2) dla całej Polski.
    zrodla_polska: { rok_2026_krok_2: polska.wartosci[2], rok_2031_krok_2: polska.wartosci[3] },
    odbiorcy,
    wyciag,
  };
}
