// Słownik EN – te same klucze co src/teksty/pl.js (test: node --test scripts/testy-jezyki.mjs).
// Angielski brytyjski (en-GB) – tak jak format dat i liczb (23 Nov 2026, 8.3 GW).
//
// Słowniczek zaakceptowany przez Anię 23.11.2026 – trzymać się go w e2 i e3:
//   Serce danych o polskim prądzie      → The heart of Poland's power data
//   wolna moc dla odbiorców             → available connection capacity for large consumers
//   moc przyłączeniowa                  → connection capacity
//   OSD                                 → DSO (distribution system operator)
//   KSE                                 → Polish power system (KSE)
//   RCE                                 → RCE (market price of electricity, set by PSE for every 15 min)
//   ślad CO2                            → carbon intensity; w Metodologii i wyjaśnieniach dokładnie:
//                                         life-cycle carbon intensity (g CO₂eq/kWh), OSIRIS estimate based on IPCC
//   szacunek OSIRIS                     → OSIRIS estimate
//   moc zainstalowana                   → installed capacity
//   produkcja                           → generation
//   OZE                                 → renewables
//   węgiel kamienny / brunatny          → hard coal / lignite
//   gaz i inne                          → gas and other
//   wymiana z zagranicą                 → scheduled cross-border exchange (import / export) – PLANOWA, nie zmierzona
//   linie najwyższych napięć 220/400 kV → extra-high-voltage lines (220/400 kV)
//   rozdzielnia                         → substation
//   lądowa / morska farma wiatrowa      → onshore / offshore wind farm
//   ograniczenia wiatru przez PSE       → wind curtailment by PSE
//   odtwarzanie doby                    → replay the day
//   Prąd nocą (Dzień / Noc)             → Power at night (Day / Night)
//   stan na … · PSE opublikowało …      → as of … · published by PSE at …
//   plakietka starych danych            → Data older than 6 h
//   poziom weryfikacji                  → verification level
//   źródło · pobrano                    → source · retrieved
//   zł/MWh                              → PLN/MWh
//   CZAS WARSZAWA                       → WARSAW TIME
//   Wkrótce                             → Coming soon
//   SKĄD / GDZIE / ILE I JAK CZYSTO / CO SIĘ ZMIENI → WHERE FROM / WHERE TO CONNECT / HOW MUCH & HOW CLEAN / WHAT'S NEXT
//   Karta Polski                        → Poland at a glance
//   Robot OSIRIS                        → Robot OSIRIS (nazwa, bez tłumaczenia)
// Nazwy instytucji bez tłumaczenia (PSE, KOBiZE, GEM, OSM, EMODnet, NASA GIBS); krótkie wyjaśnienie po angielsku
// przy pierwszym użyciu, np. „PSE (Poland's transmission system operator)”.
// Cytaty z PSE: nasze tłumaczenie, pod nim mniejszym drukiem oryginał po polsku.

export default {
  // ── <head> ──
  'meta.tytul': "OSIRIS – Poland's power map",
  'meta.opis':
    'See in one place where Poland gets its electricity and what it costs. Power plants, wind farms, extra-high-voltage lines, wind generation and the energy price – from official, public sources.',
  'meta.og_tytul': "OSIRIS – the heart of Poland's power data",
  'meta.og_opis':
    'Where Poland gets its electricity and what it costs – power plants, wind farms, the extra-high-voltage grid, wind and the energy price. From official, public sources, with a date next to every number.',
  'meta.og_obraz_alt': "OSIRIS – Poland's power map: title and a night-time globe with Poland marked",
  'meta.og_locale': 'en_GB',

  // ── Wspólne ──
  'wspolne.jezyki_etykieta': 'Language',
  'wspolne.brak_danych': 'no data',
  'wspolne.wiecej_ponizej': '↓ more below',

  // ── Strona tytułowa ──
  'tytulowa.globus_opis': 'Rotating globe with a night-time image of the Earth (NASA), Poland marked with a gold dot',
  'tytulowa.zrodla_i_licencje': 'SOURCES AND LICENCES',
  'tytulowa.opis_przycisk': 'ABOUT',
  'tytulowa.opis':
    'See in one place where Poland gets its electricity and what it costs. Power plants, onshore and Baltic offshore wind farms, extra-high-voltage lines, wind generation and the energy price hour by hour. Everything from official, public sources, with a date next to every number. For boards and investors who ask: where and how can we get more power?',
  'tytulowa.czas_warszawa': 'WARSAW TIME',
  'tytulowa.haslo': "THE HEART OF POLAND'S POWER DATA.",
  // e1: angielskiej mapy jeszcze nie ma – przycisk prowadzi do polskiej i mówi to wprost (w e2: „OPEN MAP →”).
  'tytulowa.otworz_mape': 'OPEN MAP · IN POLISH FOR NOW →',
  'tytulowa.wegiel_nazwa': 'COAL POWER PLANTS',
  'tytulowa.wegiel_zrodlo': 'GEM · data: July 2026 · operating',
  'tytulowa.ladowe_nazwa': 'ONSHORE WIND FARMS',
  'tytulowa.ladowe_zrodlo': 'GEM · data: February 2026 · 10 MW and above, operating',
  'tytulowa.baltyk_nazwa': 'BALTIC OFFSHORE PROJECTS',
  'tytulowa.baltyk_zrodlo': 'EMODnet · likely duplicates excluded',
  'tytulowa.pse_tekst': 'PSE DATA · USUALLY REFRESHED EVERY 4 H',
  'tytulowa.pse_pobranie_czeka': 'last retrieved: …',
  'tytulowa.pse_pobranie': (kiedy) => `last retrieved: ${kiedy}`,
  'tytulowa.brak_danych_pse': 'no PSE data',
  'tytulowa.tlo_nasa': 'Background: NASA Black Marble 2016 (GIBS)',
  'tytulowa.co_znajdziesz': "WHAT YOU'LL FIND",
  'tytulowa.karta_mapa_tytul': 'Map of power sources',
  'tytulowa.karta_mapa_tekst': 'Power plants and wind farms against the extra-high-voltage grid.',
  'tytulowa.karta_wiatr_tytul': 'Wind live',
  'tytulowa.karta_wiatr_tekst':
    "How much power Polish wind turbines are producing now, and when PSE (Poland's transmission system operator) last ordered them to cut output.",
  'tytulowa.karta_cena_tytul': 'Electricity price',
  'tytulowa.karta_cena_tekst': 'Hour by hour, with a replay of the whole day.',
  'tytulowa.zapowiedz': 'COMING SOON',
  'tytulowa.wkrotce_tytul': 'Coming soon: where you can still connect',
  'tytulowa.wkrotce_tekst': 'Available connection capacity across Poland.',
};
