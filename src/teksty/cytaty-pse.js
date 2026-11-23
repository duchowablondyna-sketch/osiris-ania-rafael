// Tłumaczenia cytatów z dokumentów PSE na angielski (tłumaczenie OSIRIS, decyzja Ani 23.11.2026).
// Na /en/map/ pokazujemy tłumaczenie, a pod nim mniejszym drukiem oryginał po polsku.
// Klucz = dokładny tekst PSE z danych (moce-pse.json: opis_pse; rozdzielnie-pse.json: tytuły list).
// Nowy cytat bez tłumaczenia (np. po aktualizacji przez Robota OSIRIS) – strona pokaże sam oryginał z dopiskiem
// „PSE wording, not yet translated”, a test (scripts/testy-jezyki.mjs) wskaże brakujące tłumaczenie.
// Nazwy miejscowości i stacji – bez tłumaczenia (w mianowniku).

export default {
  // ── Opisy stacji (moce-pse.json → odbiorcy[].opis_pse) ──
  Norki: 'Norki',
  'stacja Wigry': 'Wigry substation',
  'stacja w rejonie Warszawy (Wypędy)': 'substation in the Warsaw area (Wypędy)',
  'stacja w rejonie Legnicy': 'substation in the Legnica area',
  'stacja w rejonie Warszawy': 'substation in the Warsaw area',
  'stacja w rejonie Stalowej Woli': 'substation in the Stalowa Wola area',
  'stacja w rejonie Opola': 'substation in the Opole area',
  'stacja w rejonie Opola (Wrzoski)': 'substation in the Opole area (Wrzoski)',
  'stacja w rejonie Złoczewa': 'substation in the Złoczew area',
  'stacja w rejonie Poznania': 'substation in the Poznań area',
  'stacja w rejonie Konina': 'substation in the Konin area',
  'stacja w rejonie Trójmiasta': 'substation in the Tricity area (Gdańsk, Gdynia, Sopot)',
  'stacja w rejonie Torunia': 'substation in the Toruń area',
  'stacja w rejonie Portu Polska': 'substation in the Port Polska area',
  'stacja Stryków (Dmosin)': 'Stryków substation (Dmosin)',
  'stacja w rejonie Kutna': 'substation in the Kutno area',
  'stacja Jarosław': 'Jarosław substation',
  'stacja Żagań (Marszów)': 'Żagań substation (Marszów)',
  'stacja Pomorzany': 'Pomorzany substation',
  'stacja Podborze': 'Podborze substation',
  'stacja na terenie Pomorza Zachodniego': 'substation in West Pomerania',
  'stacja Biebrowo (elektrownia jądrowa)': 'Biebrowo substation (nuclear power plant)',
  'stacja w rejonie Włocławka': 'substation in the Włocławek area',

  // ── Tytuły list wykazu rozdzielni (rozdzielnie-pse.json → listy[].tytul) ──
  'Lista rozdzielni PSE S.A., dla których brak jest dostępnych miejsc przyłączenia':
    'List of PSE S.A. switchyards with no available connection points',
  'Lista planowanych rozdzielni, których PSE S.A. nie będą właścicielem, lub ich realizacja nie została jeszcze przesądzona':
    'List of planned switchyards that PSE S.A. will not own, or whose construction has not yet been decided',
  'Lista planowanych rozdzielni PSE S.A., których realizacja została uwzględniona warunkowo':
    'List of planned PSE S.A. switchyards whose construction has been included conditionally',
};
