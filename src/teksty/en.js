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
//   ślad CO2                            → life-cycle carbon footprint (od Etapu C2, 25.11.2026; wcześniej carbon intensity); w Metodologii i wyjaśnieniach dokładnie:
//                                         life-cycle carbon intensity (g CO₂eq/kWh), OSIRIS estimate based on IPCC
//   szacunek OSIRIS                     → OSIRIS estimate
//   moc zainstalowana                   → installed capacity
//   produkcja                           → generation
//   OZE                                 → renewables
//   węgiel kamienny / brunatny          → hard coal / lignite
//   gaz i inne                          → gas and other
//   wymiana z zagranicą                 → scheduled cross-border exchange (import / export) – PLANOWA, nie zmierzona
//   linie najwyższych napięć 220/400 kV → extra-high-voltage lines (220/400 kV)
//   stacja                              → substation
//   rozdzielnia                         → switchyard (część stacji, np. „rozdzielnia 110 kV tej stacji”; decyzja Ani 23.11.2026)
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
//   Robot OSIRIS                        → w zdaniu: „the OSIRIS robot” (np. „checked by the OSIRIS robot: …”, decyzja Ani 23.11.2026)
//   kafelek śladu CO2                   → Life-cycle carbon intensity: approx. N g CO₂eq/kWh · OSIRIS estimate
//   kupuje / sprzedaje (wymiana)        → importing / exporting
// Nazwy instytucji bez tłumaczenia (PSE, KOBiZE, GEM, OSM, EMODnet, NASA GIBS); krótkie wyjaśnienie po angielsku
// przy pierwszym użyciu, np. „PSE (Poland's transmission system operator)”.
// Cytaty z PSE: nasze tłumaczenie, pod nim mniejszym drukiem oryginał po polsku (tłumaczenia: src/teksty/cytaty-pse.js).

export default {
  // ── <head> ──
  'meta.tytul': 'OSIRIS – Electricity in Poland',
  'meta.opis':
    'See in one place where Poland gets its electricity and what it costs. Power plants, wind farms, extra-high-voltage lines, wind generation and the energy price – from official, public sources.',
  'meta.og_tytul': 'OSIRIS – Electricity in Poland',
  'meta.og_opis':
    'Where Poland gets its electricity and what it costs – power plants, wind farms, the extra-high-voltage grid, wind and the energy price. From official, public sources, with a date next to every number.',
  'meta.og_obraz_alt':
    'OSIRIS: the title “Electricity in Poland” above a night-time globe with Poland marked, with figures on power plants and wind farms',
  'meta.og_locale': 'en_GB',
  // Obrazek do udostępniania (zrzut strony tytułowej w tym języku – sposób w ZRODLA.md).
  'meta.og_obraz': 'https://osiris-ania-rafael.pages.dev/og-obraz-en.png',

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
  // Duży napis (wersja 3, decyzja Ani 23.11.2026) – zwykła pisownia; wielkie litery robi CSS.
  // <br class="tytul__lamanie"> – łamanie tylko na telefonie („ELECTRICITY” / „IN POLAND”, decyzja Ani 23.11.2026);
  // na komputerze CSS go ukrywa, spacja przed nim zostaje.
  'tytulowa.nazwa': 'Electricity <br class="tytul__lamanie" />in Poland',
  'tytulowa.haslo': "THE HEART OF POLAND'S POWER DATA.",
  'tytulowa.otworz_mape': 'OPEN MAP →',
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

  // ══ Mapa (/en/map/) – e2 ══
  // ── Wspólne ──
  'wspolne.wczytywanie': 'loading…',
  'wspolne.zrodlo': 'Source',
  'wspolne.brak_danych_pse': 'no PSE data',
  'wspolne.po_polsku': '(in Polish)',
  'zrodlo.pobrano': (data) => `retrieved: ${data}`,
  'zrodlo.dane': (data) => `data: ${data}`,
  'zrodlo.stan': (data) => `as of ${data}`,
  'jednostka.zl_mwh': 'PLN/MWh',
  'cytat.oryginal': (tekst) => `PSE original, in Polish: „${tekst}”`,
  'cytat.bez_tlumaczenia': 'PSE wording, not yet translated',

  // ── <head>, mapa, przyciski ──
  'mapa.meta.tytul': 'Map · OSIRIS – Electricity in Poland',
  'mapa.meta.opis':
    "Map of Poland's power sources: power plants, onshore and Baltic offshore wind farms, extra-high-voltage lines, available connection capacity for large consumers on the PSE grid, wind generation and the energy price – from official, public sources.",
  'mapa.meta.og_opis': 'Where Poland gets its electricity and what it costs – from official, public sources, with a date next to every number.',
  'mapa.aria_mapa': 'Map of Poland',
  'mapa.przybliz': 'Zoom in',
  'mapa.oddal': 'Zoom out',
  'mapa.atrybucja': 'Show or hide source credits',
  'mapa.tlo_aria': 'Map background',
  'mapa.dzien': 'Day',
  'mapa.noc': 'Night',
  'mapa.noc_opis':
    'Night lights (2016 image) approximate activity and lighting – mainly street and building lights – not a measurement of electricity use.',
  'mapa.powrot_aria': 'OSIRIS home page',

  // ── Okienko PSE ──
  'mapa.wiatr_etykieta': 'Wind generation (latest available quarter-hour):',
  'mapa.wiatr_stan': (doba, okres) => `as of: ${doba}, ${okres}`,
  'mapa.pse_tytul': 'Wind, solar and electricity price',
  'mapa.pse_skrot_wiatr': (mw) => `Wind ${mw}`,
  'mapa.pse_skrot_slonce': (pv) => `Solar ${pv}`,
  'mapa.pse_skrot_stan': (kiedy) => `as of ${kiedy} · PSE`,
  'mapa.slonce_etykieta': 'Solar generation (same quarter-hour):',
  'mapa.slonce_noc': 'Solar panels don’t work between sunset and sunrise – 0 MW is the time of day, not a breakdown.',
  'mapa.slonce_brak': 'no data',
  'mapa.slonce_dachy': 'PSE does not say whether it counts rooftop panels – this may not be all solar power in Poland.',
  'mapa.pse_skrot_brak': 'Wind: no PSE data',
  'mapa.ograniczenie_etykieta': 'Latest wind curtailment in the PSE report:',
  'mapa.ograniczenie': (doba, mwh, kwadranse) =>
    `Latest wind curtailment in the PSE report: ${doba} – approx.\u00a0${mwh}\u00a0MWh${kwadranse ? ` (${kwadranse})` : ''}`,
  'mapa.ograniczenie_kwadranse': { one: 'quarter-hour', other: 'quarter-hours' },
  'mapa.ograniczenie_brak': 'Latest wind curtailment in the PSE report: no PSE data',
  'mapa.rce_etykieta': 'Electricity price (RCE):',
  'mapa.cena_biezaca': 'Electricity price (RCE) today:',
  'mapa.cena_brak_dzis': 'Electricity price (RCE): no data for today',
  'mapa.cena_brak_pse': 'Electricity price (RCE): no PSE data',
  'mapa.cena_kwadrans': (cena, okres) => `Electricity price (RCE): ${cena} PLN/MWh, ${okres}`,
  'mapa.rce_wniosek': (tanioOkres, tanioCena, drogoOkres, drogoCena) =>
    `Today's cheapest quarter-hour: ${tanioOkres} (${tanioCena}\u00a0PLN/MWh), most expensive: ${drogoOkres} (${drogoCena}\u00a0PLN/MWh).`,
  'mapa.rce_wniosek_razy': (x) => `The most expensive quarter-hour of the day costs ${x} times as much as the cheapest.`,
  'mapa.rce_remis': (okres, inne) => `${okres} and ${inne}`,
  'mapa.rce_inne': { one: 'other', other: 'others' },
  // Pierwsze PSE na mapie – krótkie wyjaśnienie, kim jest PSE.
  'mapa.pse_pobrano': (kiedy) => `PSE (Poland's transmission system operator) · retrieved: ${kiedy}`,
  'mapa.pse_braki': (lista) => ` · no data: ${lista}`,
  'mapa.brak_wiatr': 'wind',
  'mapa.brak_cena': 'price',
  'wykres.wiatr_opis': (doba) => `Wind generation ${doba}, every 15 minutes, in MW`,
  'wykres.wiatr_slonce_opis': (doba) => `Wind and solar generation ${doba}, every 15 minutes, in MW`,
  'wykres.linia_wiatr': 'wind',
  'wykres.linia_slonce': 'solar',
  'wykres.cena_opis': (doba) => `RCE electricity price ${doba}, every 15 minutes, in PLN/MWh`,
  'wykres.biezaca_doba': 'today',
  'wykres.w_dobie': (doba) => `on ${doba}`,
  'wykres.maks': (x) => `max ${x}`,
  'wykres.maks_linie': (lista) => `max: ${lista}`,
  'wykres.min': (x) => `min ${x}`,
  'wykres.teraz': 'now',
  'odtw.start': '▶ Replay the day',
  'odtw.wroc': 'Back to now',
  'odtw.pauza': '❚❚ Pause',
  'odtw.wznow': '▶ Resume',
  'odtw.data': (doba) => `Day replay: ${doba}`,
  'odtw.wiatr_etykieta': 'Wind generation:',
  'odtw.slonce_etykieta': 'Solar generation:',
  'odtw.kwadrans': (okres) => `quarter-hour ${okres}`,
  'odtw.ogl_start': (doba) => `Replaying ${doba}, 1 second is 1 hour.`,
  'odtw.ogl_pauza': (godzina) => `Paused at ${godzina}.`,
  'odtw.ogl_wznow': 'Replay resumed.',
  'odtw.ogl_teraz': 'Showing current data.',
  'odtw.ogl_koniec': 'End of the day replay. Showing current data.',
  'odtw.brak': 'Day replay: no complete data',

  // ── Legenda ──
  'leg.tytul': 'What the markers mean',
  'leg.zrodla': 'Sources: GEM · OpenStreetMap · EMODnet · PSE',
  'leg.wiecej': 'more',
  'leg.mniej': 'less',
  'leg.moce': 'Available connection capacity for large consumers (PSE)',
  'leg.moce_opis': '– extra-high-voltage grid (220/400 kV), for the largest consumers; hexagon: planned substation with available capacity;',
  'leg.moce_kolo': 'circle: approximate location;',
  'leg.moce_pusty': (data) =>
    `empty hexagon: according to the PSE list${data ? ` of ${data}` : ''}, applications for this substation's 220/400 kV switchyards were not being processed`,
  'leg.moce_110':
    "note “110 kV – not processed”: the PSE list includes only this substation's 110 kV switchyard; it says nothing about its 220/400 kV switchyards",
  'leg.linie': 'Extra-high-voltage lines',
  'leg.linie_opis': '– 220 and 400 kV (thicker line: 400 kV); click a line on the map to see details',
  'leg.morskie': 'Offshore wind farms',
  'leg.morskie_opis': '– empty circle: not in the MKiŚ list (Polish Ministry of Climate and Environment, as of January 2024) – details on click',
  'leg.morskie_duplikaty': (ile) => `· ${ile} – visible when zoomed in`,
  'leg.ladowe': 'Onshore wind farms of 10 MW and above',
  'leg.ladowe_opis': '– filled dot: operating; ring with a dot: under construction',
  'leg.wegiel': 'Coal power plants',
  'leg.gaz': 'Gas and oil power plants',
  'leg.woda': 'Hydropower plants',
  'leg.pompowa': 'Pumped-storage power plants',
  'leg.kwadrat': '– square: plant that burns fuel',
  'leg.pompowa_opis': '– energy storage: they pump water uphill when power is plentiful and give it back when it runs short',
  'leg.elektrownie_uwaga': 'Power plants: operating and large ones only (thresholds in “Sources and licences”)',
  'leg.rozmiar': 'Marker size = installed capacity, not current generation',
  'leg.skala_1000': '1,000 MW',
  'leg.skala_5000': '5,000 MW',
  'leg.wzorce': 'Size examples: 100 MW – small square, 1,000 MW – medium, 5,000 MW – large.',
  'liczba.elektrownia': { one: 'power plant', other: 'power plants' },
  'liczba.farma_dziala': { one: 'farm operating', other: 'farms operating' },
  'liczba.farma': { one: 'farm', other: 'farms' },
  'liczba.duplikat': { one: 'possible duplicate', other: 'possible duplicates' },
  'liczba.planowana': { one: 'planned', other: 'planned' },
  'liczba.odcinek': { one: 'segment', other: 'segments' },
  'liczba.blok': { one: 'unit', other: 'units' },
  'liczba.stacja': { one: 'substation', other: 'substations' },
  'liczba.stacja_ma': { one: 'substation has', other: 'substations have' },
  'liczba.stacja_planowana': { one: 'planned substation', other: 'planned substations' },
  'licznik.ladowe': (farmy, moc, wBudowie) => `${farmy} · ${moc} · ${wBudowie} under construction`,
  'licznik.linie': (odcinki, data) => `${odcinki} · OSM ${data}`,
  'licznik.morskie': (ile, czesci) => `${ile} · ${czesci}`,
  'licznik.w_rozruchu': (n) => `${n} commissioning`,
  'licznik.w_budowie': (n) => `${n} under construction`,

  // ── Okienka elektrowni, farm i linii ──
  'elektrownia.wegiel': 'coal power plant',
  'elektrownia.gaz': 'gas or oil power plant',
  'elektrownia.woda': 'hydropower plant',
  'elektrownia.pompowa': 'pumped-storage power plant (energy storage)',
  'elektrownia.pompowa_opis': 'pumps water uphill when power is plentiful and gives it back when it runs short – it is storage, not a source of energy',
  'elektrownia.rodzaj_wegla': (lista) => `type: ${lista}`,
  'elektrownia.paliwo': (lista) => `fuel: ${lista}`,
  'elektrownia.typ': (lista) => `type: ${lista}`,
  'elektrownia.moc': (moc, bloki) => `capacity: ${moc} MW (${bloki} in the data)`,
  'elektrownia.moc_zainstalowana': 'installed capacity – not current generation',
  'lokalizacja.dokladna': 'location: exact',
  'lokalizacja.przyblizona': 'location: approximate (e.g. nearest town)',
  'gem.paliwo.coal: bituminous': 'hard coal',
  'gem.paliwo.coal: lignite': 'lignite',
  'gem.paliwo.coal: unknown': 'coal (type unknown)',
  'gem.paliwo.fossil gas: natural gas': 'natural gas',
  'gem.paliwo.industrial by-product: coke oven gas': 'coke oven gas',
  'gem.paliwo.fossil liquids: heavy fuel oil': 'heavy fuel oil',
  'gem.paliwo.fossil liquids: fuel oil': 'fuel oil',
  'gem.technologia.run-of-river': 'run-of-river',
  'gem.technologia.conventional storage': 'reservoir',
  'gem.technologia.pumped storage': 'pumped storage',
  'farmy.faza': (faza) => `phase ${faza}: `,
  'farmy.lad.operating': 'operating',
  'farmy.lad.construction': 'under construction – not producing yet, or only partly',
  'farmy.moc_brak': 'capacity: no data',
  'farmy.uruchomienie': (rok) => `, commissioned: ${rok}`,
  'farmy.morskie.Planned': 'planned',
  'farmy.morskie.Construction': 'under construction',
  'farmy.morskie.Production': 'operating',
  'farmy.status': (status) => `status: ${status}`,
  'farmy.moc': (moc) => `capacity: ${moc}`,
  'farmy.weryfikacja': (opis) => `verification: ${opis}`,
  'farmy.weryfikacja.na_liscie': 'on the MKiŚ list',
  'farmy.weryfikacja.brak_na_liscie': 'not on the MKiŚ list',
  'farmy.weryfikacja.duplikat': 'likely duplicate: ',
  'farmy.weryfikacja.opis_baltyk1': 'on the MKiŚ list, part of the MFW Bałtyk I project',
  'farmy.weryfikacja.opis_baltic_east': 'on the MKiŚ list as Orlen Neptun 46.E.1 (company Orlen Neptun VIII)',
  'farmy.zrodlo_mkis': 'MKiŚ',
  'farmy.pokaz.duplikat': 'possible duplicate: ',
  'farmy.pokaz.brak': 'not in the MKiŚ list (as of January 2024) – to be checked',
  'farmy.rozruch': 'commissioning – some turbines generating',
  'farmy.aukcja_ure': (data) => `won the URE auction on ${data}`,
  'farmy.aukcja_ure_baltyk1': (data, moc) => `won the URE auction on ${data} (whole MFW Bałtyk I project: ${moc})`,
  'farmy.moc_baltic_east': (pozwolenie, aukcja) => `capacity: ${pozwolenie} (max. under the location permit) · in the URE auction: ${aukcja}`,
  'farmy.korekta.baltic_power':
    'status per Northland Power (Q3 2026 report, 12 Nov 2026): all 76 turbines installed, over 70% generating power, ' +
    'commissioning continues in Q4 2026. First power to the grid: 10 Jul 2026 (ORLEN, Northland Power). ' +
    'Per balticpower.pl (7 Oct 2026) no generation licence yet, before commercial operation. ' +
    'In EMODnet data (10 Jul 2026) and GEM (February 2026): under construction.',
  'linie.podpowiedz': 'click – line details',
  'linie.bez_nazwy': 'Line with no name in OpenStreetMap',
  'linie.napiecie': (kv) => `extra-high-voltage line: ${kv} kV`,
  'okienko.zamknij': 'Close',

  // ── Poland at a glance: nagłówek, zakładki, WHERE FROM ──
  'karta.tytul': 'Poland at a glance',
  'karta.zakladka_skad': 'Where from',
  'karta.zakladka_gdzie': 'Where to connect',
  'karta.zakladka_ile': 'How much & how clean',
  'karta.zakladka_zmiany': "What's next",
  'karta.skad_wstep': 'Power sources on the map – choose what to show:',
  'karta.prog_bloki_30': 'on the map · units of 30 MW and above (GEM)',
  'karta.prog_bloki_20': 'on the map · units of 20 MW and above (GEM)',
  'karta.prog_30': 'on the map · 30 MW and above (GEM)',
  'karta.skad_uwaga': 'Marker size = installed capacity, not current generation. All markers are explained in the legend on the right.',
  'karta.klodka': 'Site card – coming soon',
  'karta.wkrotce': 'Coming soon.',

  // ── WHERE TO CONNECT ──
  'moce.tytul': 'Available connection capacity for large consumers · PSE 220/400 kV',
  'moce.wazne':
    "Extra-high-voltage grid (220/400 kV) – for the largest consumers, such as factories and data centres. Smaller businesses connect to the networks of distribution system operators (DSOs) – the next stage of OSIRIS.",
  'moce.lista1': 'Substations for new consumers',
  'moce.lista2': 'Substations built mainly for the grid and new generators – according to PSE they can also supply consumers',
  'moce.szacunek':
    'Using capacity at one substation may reduce it at neighbouring ones – so we do not add up their capacities.',
  'moce.zrodla_etykieta': 'Capacity for new generators:',
  'moce.stan_etykieta': 'as of:',
  'moce.zrodla_zero': 'PSE: 0 MW for new generators on the extra-high-voltage grid – across Poland (2026 and 2031)',
  'moce.zrodla': (a, b) => `PSE: ${a} (2026) and ${b} (2031) for new generators on the extra-high-voltage grid – across Poland`,
  'moce.zrodla_brak': 'Capacity for new generators: no data',
  'moce.zrodla_dotyczy': 'This applies to new power plants, not to electricity consumers.',
  'slownik.kv_termin': 'kV',
  'slownik.kv': 'voltage – the “pressure” in the grid: 400 and 220 kV are the motorways of electricity, 110 kV the main roads',
  'slownik.rozdzielnia_termin': 'switchyard',
  'slownik.rozdzielnia': 'the part of a substation working at one voltage level (e.g. 110 kV), from which power branches out along lines – like a motorway junction',
  'slownik.rozdzielnia_w_zdaniu': 'switchyard',
  'slownik.aria': (termin) => `What does “${termin}” mean? – explanation`,
  'slownik.objasnienie': 'OSIRIS explanation',
  'slownik.mw_termin': 'MW, GW',
  'slownik.mw': 'megawatt – a measure of power, i.e. how much electricity flows at a given moment; 1 GW = 1,000 MW',
  'slownik.mwh_termin': 'MWh, kWh',
  'slownik.mwh': 'megawatt-hour – an amount of energy: 1 MW for one hour; 1 MWh = 1,000 kWh. Electricity bills use kWh',
  'slownik.saldo_termin': 'balance',
  'slownik.saldo_w_zdaniu': 'balances',
  'slownik.saldo': 'the difference between scheduled power flowing into Poland and flowing out; plus – Poland imports, minus – exports',
  'slownik.oze_termin': 'renewables',
  'slownik.oze_w_zdaniu': 'renewables',
  'slownik.oze': 'renewable energy sources – in OSIRIS: wind, solar, hydro, biomass and biogas (excluding waste)',
  'slownik.kobize_termin': 'KOBiZE',
  'slownik.kobize': "Poland's National Centre for Emissions Balancing and Management (KOBiZE), part of the Institute of Environmental Protection – National Research Institute; publishes, among others, emission factors for electricity",
  'slownik.ipcc_termin': 'IPCC',
  'slownik.ipcc': 'Intergovernmental Panel on Climate Change (IPCC); its AR5 report (2014) gives typical life-cycle carbon footprints of power sources',
  'slownik.rce_termin': 'RCE',
  'slownik.rce': 'Market price of electricity for the imbalance settlement period – published by PSE.',
  'slownik.rce_zrodlo': 'source: PSE (pse.pl, OIRE section)',
  'slownik.rce_osiris': "This is a wholesale price, not the price on a company's invoice.",
  // Names of the PSE report and its columns – PSE's own English wording (raporty.pse.pl, EN version, read 25.11.2026).
  'slownik.ograniczenie_termin': 'wind curtailment',
  'slownik.ograniczenie_pse':
    'PSE report “Non-market redispatch of RES resources”. For wind generation units it gives two columns, in MW: “Balancing of Polish Power System” and “System constraints management”.',
  'slownik.ograniczenie_zrodlo': 'source: PSE (raporty.pse.pl → Polish Power System Operation → Polish Power System Operation Schedule)',
  'slownik.ograniczenie_osiris':
    'PSE does not say whether this is an order or the reduction actually made. OSIRIS converted it to MWh from the power in MW that PSE gives for each quarter-hour (MW × ¼ hour).',
  'slownik.mw_mwh_termin': 'MW and MWh',
  'slownik.mw_mwh': 'MW is power at a given moment – like a car’s speed; MWh is the amount of energy over time – like the distance driven: 1 MW for one hour = 1 MWh.',
  'moce.szacunek_analogia': 'Like car parks on a single access road: the more cars enter one, the harder it is to reach the other.',
  'moce.wniosek_b': (dataMocy, mocIstniejacych, stacjePlanowane, zZastrzezeniami, dataWykazu, bez, rok) =>
    `For a large consumer: according to PSE (as of ${dataMocy}), existing substations have ${mocIstniejacych} – only the ${stacjePlanowane} have available capacity. ` +
    `For ${zZastrzezeniami} of them, the PSE list of ${dataWykazu} states that applications for some switchyards were not being processed; for ${bez}, it lists no such restriction. ` +
    `This is the operator's estimate for ${rok}, not a guarantee of connection.`,
  'moce.lok_okolica': (rejon, miejsce, km) =>
    `Approximate location – PSE gives only »${rejon}«; OSIRIS chose the centre of the circle (${miejsce}, radius ${km} km).`,
  'moce.lok_osm': (nazwa) => `Location: planned substation in OpenStreetMap (“${nazwa}”) – uncertain match.`,
  'moce.lok_brak': "Not on the map – PSE gives no town, or it can't be identified without guessing.",
  'moce.w_tym_miejscu': (stacje) => `${stacje} at this location`,
  'moce.moc': (mw) => `available connection capacity for large consumers: ${mw} (year 2031)`,
  'moce.tabela2': 'substation built mainly for the grid and new generators – according to PSE it can also supply consumers',
  'moce.uwaga_pusty': (data, napiecia, ile) =>
    `Note: according to the PSE list of ${data}, applications for this substation's ${napiecia} switchyard${ile > 1 ? 's' : ''} were not being processed.`,
  'moce.uwaga_110': (data) =>
    `Note: according to the PSE list of ${data}, applications for this substation's 110 kV switchyard were not being processed; the list says nothing about its 220/400 kV switchyards.`,
  'moce.lista_pse': (tytul, rozdzielnie) => `PSE list: “${tytul}”; switchyards in the list: ${rozdzielnie}.`,
  'moce.daty_rozne': (wykaz, moce, sprawdzone) =>
    `The dates differ: the switchyard list is as of ${wykaz}, the capacities as of ${moce}. PSE has not published a newer list (checked ${sprawdzone}).`,
  'moce.wykaz_brak': "PSE switchyard list (substations where applications are not processed): no data – we don't know whether applications are being processed.",
  'moce.kazda_osobno': "Each substation has its own capacity – we don't add them up.",
  'moce.siec_nn': 'Extra-high-voltage grid (220/400 kV) – for the largest consumers.',
  'moce.szacunek_okienko': (data) =>
    `Operator's estimate (PSE), as of ${data}. Planned substation, capacity given for 2031. Using capacity at one substation may reduce capacity at neighbouring ones. This is not a guarantee of connection.`,
  'moce.zrodlo_wykaz': 'PSE – switchyard list',
  'moce.zrodlo_osm': 'OpenStreetMap (location)',
  'moce.podpis_przyblizona': 'approximate location',
  'moce.lok_krotko.okolica': 'approximate location',
  'moce.lok_krotko.stacja-osm': 'uncertain match (OSM)',
  'moce.lok_krotko.brak': 'not on the map',
  'moce.wstrzymane_pusty': (napiecia) => ` · ${napiecia} – not processed`,
  'moce.wstrzymane_110': ' · 110 kV – not processed',
  'moce.podsumowanie': (ile, pelne, napiecia, tylko110, dataWykazu, dataMocy) =>
    `${ile} capacity for consumers. According to the PSE list of ${dataWykazu}, at ${pelne} of them applications for the ${napiecia} switchyard were not being processed; ` +
    `for ${tylko110} more, the list covers only the 110 kV switchyard (capacities as of ${dataMocy}).`,
  'moce.podsumowanie_bez_wykazu': (ile) => `${ile} capacity for consumers. PSE switchyard list (where applications are not processed): no data.`,
  'moce.sprawdzono_robot': (data) => `checked by the OSIRIS robot: ${data}`,
  'moce.sprawdzono': (data) => `checked: ${data} (date the data was accepted)`,
  'moce.stan': (data, sprawdzono) => `as of: ${data} · ${sprawdzono}`,
  'moce.licznik': (planowane, naMapie, stan, wykaz) => `${planowane} · ${naMapie} on the map · as of ${stan} · ${wykaz}`,
  'moce.licznik_wykaz': (pelne, napiecia, tylko110, data) =>
    `at ${pelne}, applications are not being processed (${napiecia}); at ${tylko110} – only 110 kV (list as of ${data})`,
  'moce.licznik_wykaz_brak': 'switchyard list: no data',
  'moce.brak': 'PSE available capacity: no data',

  // ── HOW MUCH & HOW CLEAN ──
  'karta.miks_aria': 'Generation mix in Poland',
  'karta.moce_tytul': 'How much of what we have is running',
  'karta.moce_aria': 'Current generation against installed capacity',
  'karta.uwaga_dostepna': 'Installed capacity is not available capacity: some units are under maintenance or in reserve.',
  'karta.uwaga_pogoda': 'Wind and solar run when the wind blows and the sun shines – a short bar means weather or time of day, not a breakdown.',
  'karta.pytajnik_znak': '“?” –',
  'karta.niepewnosc':
    "In its report PSE gives a single capacity for wind (onshore and offshore), solar and other renewables – with no breakdown. We also don't know whether it counts rooftop panels. Hydro is not included here.",
  'karta.uwaga_bez_paska': 'No bar: hydro, oil, waste and “other” – the PSE report gives no capacity for them that can be compared with generation.',
  'karta.uwaga_mapa': 'The map shows only larger power plants, so the capacity total on the map (“Where from” tab) is smaller.',
  'karta.raport_kse': 'PSE, KSE Report 2025 (Polish power system), Table 1.1',
  'karta.cena_rce': 'RCE price',
  'karta.slad_co2': 'Life-cycle carbon footprint',
  'karta.wymiana': 'Cross-border exchange (scheduled)',
  'karta.przetworzenie': 'processing and carbon intensity: OSIRIS',
  'karta.pytajnik_aria': 'Why the question mark? – explanation',
  'karta.pytajnik_tytul': 'Why the question mark?',
  'karta.skrot_stare': (skrot) => `${skrot} · ⚠ data not the latest`,
  'karta.zrodlo_pobrano': (kiedy) => `PSE · retrieved: ${kiedy}`,
  'karta.zrodlo_brak': 'PSE · no data',
  'karta.brak_miksu': 'no PSE data on the mix',
  'karta.procent_aria': (procent, krotko) => `${procent} ${krotko} – details`,
  'karta.grupa.kamienny': 'hard coal',
  'karta.grupa.brunatny': 'lignite',
  'karta.grupa.gaz_i_inne': 'gas and other',
  'karta.grupa.oze': 'renewables',
  'karta.oze.wiatr_lad': 'onshore wind',
  'karta.oze.wiatr_morze': 'offshore wind',
  'karta.oze.slonce': 'solar',
  'karta.oze.woda': 'hydro',
  'karta.oze.biomasa': 'biomass and other renewables',
  'karta.moc.gaz': 'natural gas',
  'karta.moc.oze': 'wind, solar and other renewables',
  'karta.moc_brak': 'no data on installed capacity',
  'karta.moc_tekst': (produkcja, moc) => `${produkcja} of ${moc} GW`,
  'karta.moc_ponad': (stan) => `more than the capacity in the PSE report (as of ${stan}) – new power plants may have been added since`,
  'karta.moc_podpis': (stan, stanMocy) => `generation: as of ${stan} · capacity across Poland: PSE, as of ${stanMocy}`,
  'karta.moc_zrodlo': (stanMocy) => `PSE, KSE Report 2025 (Polish power system), Table 1.1 · as of ${stanMocy}`,
  'karta.cena_brak_dzis': 'no data for today',
  'karta.wymiana_zero': 'approx. 0\u00a0GW',
  'karta.wymiana_zero_opis': 'almost no exchange',
  'karta.wymiana_kupuje': (gw) => `importing approx. ${gw}\u00a0GW`,
  'karta.wymiana_sprzedaje': (gw) => `exporting approx. ${gw}\u00a0GW`,
  'karta.wymiana_planowo': 'scheduled',
  'karta.plakietka_brak_powod': (powod) => `No data on the mix: ${powod}.`,
  'karta.plakietka_brak': 'No PSE data on the mix.',
  'karta.plakietka_nie_najnowsze': (powod, stan) => `Data is not the latest: ${powod}. Showing the state as of ${stan}.`,
  'karta.plakietka_stare': (godzin, stan) => `Data older than ${godzin} hours. Showing the state as of ${stan}.`,
  'karta.powod.sprawdzian': 'new data failed the cross-check',
  'karta.powod.pobranie': 'new PSE data could not be retrieved',
  'karta.bohater_oze': "of Poland's electricity came from renewables",
  'karta.bohater_wegiel': "of Poland's electricity came from coal",
  'karta.krotko_oze': 'from renewables',
  'karta.krotko_wegiel': 'from coal',
  'karta.stan': (stan) => `as of ${stan}`,
  'karta.skrot': (co, stan) => `${co} · PSE, as of ${stan}`,
  'karta.skrot_produkcja': (gw) => `generation ${gw} GW`,
  'karta.skrot_oze': (p) => `renewables ${p}`,
  'karta.skrot_wegiel': (p) => `coal ${p}`,
  'karta.skrot_rce': (cena) => `RCE ${cena} PLN/MWh`,
  'karta.skrot_moce': (stacje, rok) => `PSE available capacity: ${stacje} (for\u00a0${rok})`,
  'karta.skrot_stan': (stan) => `PSE, as of ${stan}`,
  'karta.kafel_udzial': 'of generation',
  'karta.kafel_rce': 'RCE price',
  'karta.kafel_moce': (rok) => `PSE available capacity (for ${rok})`,
  'karta.kafel_aria': (co) => `${co} – opens Poland at a glance`,
  'karta.wniosek_krotki': (okres, wiekszosc, k1) =>
    wiekszosc ? `In the quarter-hour ${okres}, most of the electricity generated in Poland came ${k1}.` : `In the quarter-hour ${okres}, the largest share of the electricity generated in Poland came ${k1}.`,
  'karta.wn_produkcja': (okres, gw) => `In the quarter-hour ${okres} Poland generated ${gw} GW`,
  // najwiecej – tylko dla PL (ten sam zestaw argumentów co w pl.js); EN bez zmian (odbiór C2).
  'karta.wn_udzialy': (wiekszosc, k1, p1, k2, p2, najwiecej) => (wiekszosc ? ` – mostly ${k1} (${p1}), ${p2} ${k2}.` : ` – ${p1} ${k1}, ${p2} ${k2}.`),
  'karta.wn_kupuje': (gw) => ` According to PSE's schedule, it was importing approx. ${gw} GW.`,
  'karta.wn_sprzedaje': (gw) => ` According to PSE's schedule, it was exporting approx. ${gw} GW.`,
  'karta.wn_co2': (g) => ` OSIRIS estimate for this quarter-hour: approx. ${g} g CO₂eq per kWh, over the power plants' whole life cycle.`,
  'karta.zapotrzebowanie': (zap, prod, wymiana) => `Demand (PSE): ${zap} GW · generation in Poland: ${prod} GW · exchange: ${wymiana}`,
  'karta.wiatr_slonce_z': (x, y, p) => `Wind and solar provided ${x} GW of the ${y} GW generated (${p}).`,
  'karta.cena_kwh': (x) => `= ${x} PLN/kWh`,
  'karta.opublikowalo': (kiedy) => ` · published by PSE at ${kiedy}`,
  'karta.podpis': (okres, stan) => `in the quarter-hour ${okres} · of generation in Poland · ${stan}`,
  'karta.co2_wartosc': (g) => `approx. ${g} g CO₂eq/kWh`,
  'karta.co2_opis': 'OSIRIS estimate',
  'karta.co2_dokladnie': (x) => `${x} g CO₂eq/kWh`,
  'karta.sprawdzian': (kwadranse, mw) => `${kwadranse} matching quarter-hours, largest difference ${mw} MW`,
  'okienko_polski.naglowek': (krotko) => `Poland · power ${krotko}`,
  'okienko_polski.tu': (wartosc) => `we are here: ${wartosc} – OSIRIS estimate based on IPCC`,
  'okienko_polski.zdanie': 'of generation in Poland · PSE data every 15 min',
  'okienko_polski.razem': '= total',
  'okienko_polski.co2_tytul': 'Life-cycle carbon footprint',
  'okienko_polski.wiecej': 'More',
  'okienko_polski.wiecej_aria': 'More – Methodology in the Poland at a glance panel',

  // ── Methodology ──
  'met.tytul': 'Methodology',
  'met.skad':
    "<strong>Data source:</strong> PSE, report “his-gen-pal-sire” – electricity generation in Poland by fuel, every 15 minutes. PSE usually publishes it 30–45 minutes late, and the site retrieves data every 4 hours.",
  'met.sprawdzian':
    "<strong>Cross-check:</strong> at every retrieval, wind and solar from this report must match (within 1 MW) a second PSE report (“his-wlk-cal”). If they don't, the previous data stays, with a badge. Last time:",
  'met.udzialy':
    '<strong>Shares:</strong> calculated from generation in Poland. We leave out pumped-storage plants – they store energy, they are not a source. Waste is not counted as renewable.',
  'met.co2':
    '<strong>Life-cycle carbon intensity (g CO₂eq/kWh), OSIRIS estimate based on IPCC:</strong> generation from each fuel × typical life-cycle emissions ' +
    'of a power plant, in CO₂ equivalent (CO₂eq) – IPCC medians, AR5 report, 2014. For fuels IPCC doesn\'t cover ' +
    '(lignite, oil, coal-derived gas, waste, “other”, “other renewables”), we made our own assumptions based on factors from KOBiZE ' +
    '(Polish National Centre for Emissions Management). In the quarter-hour we checked (20 Nov 2026, 12:00–12:15), the extreme variants ' +
    'of these assumptions – excluding lignite – changed the result by less than 3%. Electricity bought abroad is not included. Exactly now:',
  'met.kobize':
    "<strong>KOBiZE's 553 kg CO<sub>2</sub>/MWh (2024)</strong> is a different measure: combustion emissions only, averaged over the whole year. We do not compare it directly with our estimate.",
  'met.wymiana':
    '<strong>Scheduled cross-border exchange:</strong> scheduled exchange according to PSE (sum of two balances: swm_p + swm_np), not measured. “Importing” – power flows into Poland, “exporting” – out of Poland.',

  // ── Stopka „Źródła i licencje” (src/czesci/stopka.html) – e3 ──
  // Linki, nazwy licencji i podpisy – w oryginale (te same co w PL); streszczenie CC BY 4.0 po angielsku (deed.en, decyzja Ani 23.11.2026).
  // Wyjaśnienia instytucji przy pierwszym użyciu: PSE, EMODnet, MKiŚ, GEM, OSM, KOBiZE (GIBS – w podpisie NASA).
  'stopka.tytul':
    'Sources and licences',
  'stopka.kontur':
    'Outline of Poland: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> (public domain), data simplified to the outline of a single country.',
  'stopka.wiatr':
    'Wind and solar generation: PSE S.A. (Poland\'s transmission system operator), <a href="https://raporty.pse.pl/" target="_blank" rel="noopener">raporty.pse.pl</a>, data retrieved <span id="wiatr-pobrano">loading…</span>, processed.',
  'stopka.ograniczenia':
    'Wind curtailment: PSE S.A., report “Nierynkowe redysponowanie źródeł OZE” (non-market redispatch of renewable sources), same retrieval time, processed (sum of quarter-hours ÷ 4, assuming the values are in MW).',
  'stopka.rce':
    'Electricity price (RCE): PSE S.A., <a href="https://raporty.pse.pl/report/rce-pln" target="_blank" rel="noopener">report “Rynkowa cena energii elektrycznej”</a> (market price of electricity), data retrieved <span id="rce-pobrano">loading…</span>, processed.',
  'stopka.odtworzenie':
    'Day replay: PSE S.A., reports his-wlk-cal and rce-pln, day <span id="odtw-zrodlo-doba">loading…</span>, processed.',
  'stopka.karta':
    'Poland at a glance (fuel mix, scheduled cross-border exchange): PSE S.A., reports his-gen-pal-sire and his-wlk-cal, data retrieved <span id="karta-pobrano">loading…</span>, processed (shares, cross-check; life-cycle carbon intensity in g CO₂eq/kWh – OSIRIS estimate based on IPCC AR5 and factors from KOBiZE (Polish National Centre for Emissions Management), method in the “Methodology” panel).',
  'stopka.morskie':
    'Offshore wind farms: <a href="https://emodnet.ec.europa.eu/en/" target="_blank" rel="noopener">EMODnet</a> (European Marine Observation and Data Network) Human Activities, Wind Farms (data creator: CETMAR, as of 10 Jul 2026), <a href="https://creativecommons.org/licenses/by/4.0/deed.en" target="_blank" rel="noopener">CC BY 4.0</a>; only farms in Polish marine areas were selected; compared with the <a href="https://www.gov.pl/web/morska-energetyka-wiatrowa/obecnie-realizowane-projekty-w-polsce" target="_blank" rel="noopener">project list of MKiŚ</a> (Polish Ministry of Climate and Environment) (as of January 2024) – empty dots: likely duplicate or not on the list.',
  'stopka.baltic':
    'Baltic Power status per <a href="https://northlandpower.com/northland-power-reports-third-quarter-2026-results-value-accretive-growth-updates-and-reaffirms-2026-guidance/" target="_blank" rel="noopener">Northland Power</a> (Q3 2026 report, 12 Nov 2026) and <a href="https://balticpower.pl/" target="_blank" rel="noopener">balticpower.pl</a> (7 Oct 2026). ' +
    'Results of the first offshore wind auction: <a href="https://www.ure.gov.pl/pl/urzad/informacje-ogolne/aktualnosci/13009,Offshore-Pierwsza-aukcja-dla-morskich-farm-wiatrowych-rozstrzygnieta.html" target="_blank" rel="noopener">URE</a> (Poland\'s energy regulator; announcement of 18 Dec 2025).',
  'stopka.ladowe':
    'Onshore wind farms (green): Global Energy Monitor (GEM), <a href="https://globalenergymonitor.org/projects/global-integrated-power-tracker/" target="_blank" rel="noopener">Global Integrated Power Tracker</a>, September 2026 release (wind data from the Global Wind Power Tracker, February 2026), <a href="https://creativecommons.org/licenses/by/4.0/deed.en" target="_blank" rel="noopener">CC BY 4.0</a>, modified (extract).',
  'stopka.ladowe_tylko':
    'Only onshore wind farms of 10 MW and above – smaller farms and single turbines are not shown.',
  'stopka.ladowe_znaczki':
    'Filled dot: operating; ring with a dot: under construction; planned farms are not shown. About half of the locations are approximate.',
  'stopka.elektrownie':
    'Power plants (squares, circles, diamonds): the same GEM extract, CC BY 4.0, modified (units summed per power plant); operating only.',
  'stopka.progi':
    'GEM thresholds: coal – units of 30 MW and above; gas and oil – 20 MW and above in the EU; hydro (including pumped storage) – 30 MW and above, 10 MW for some countries.',
  'stopka.dane':
    'Data: coal – July 2026, gas and oil – August 2026, hydro – March 2026. Marker size = installed capacity, not current generation.',
  'stopka.tlo_dzien':
    'Daytime background: Blue Marble (August 2004), MODIS / NASA Earth Observatory.',
  'stopka.tlo_noc':
    'Night-time background: Black Marble (2016), Suomi NPP / VIIRS, NASA Earth Observatory.',
  'stopka.tla':
    'Backgrounds processed so the data is easier to see: daytime darkened and desaturated, night-time desaturated and dimmed by 30%.',
  'stopka.moce':
    'Available connection capacity for large consumers (hexagons, circles) and the sentence on capacity for new generators: PSE S.A., <a href="https://www.pse.pl/obszary-dzialalnosci/krajowy-system-elektroenergetyczny/informacja-o-dostepnosci-mocy-przylaczeniowej" target="_blank" rel="noopener">“Informacja o dostępności mocy przyłączeniowej do sieci przesyłowej”</a> (information on available connection capacity in the transmission grid), as of 31 Oct 2026, document retrieved 21 Nov 2026, processed (extract of the tables; we do not add up substation capacities). The operator\'s estimate, not a guarantee of connection.',
  'stopka.wykaz':
    'Substations where applications were not being processed according to the list (empty hexagon – the list covers the 220/400 kV switchyard; if only 110 kV – filled hexagon and a note in the pop-up): PSE S.A., <a href="https://www.pse.pl/dane-systemowe/praca-kse/informacje-ogolne/wykaz-obiektow-planowanych-do-przylaczenia" target="_blank" rel="noopener">“Wykaz rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów”</a> (list of switchyards at substations where new facilities cannot be connected), as of 4 Feb 2026 (older than the capacities – as of 31 Oct 2026), file retrieved 21 Nov 2026, processed (extract of lists 2 and 3).',
  'stopka.miejsca':
    'Substation locations: OpenStreetMap (OSM), ODbL – planned substations from OSM, or 20 km circles around the town named by PSE (approximate location, chosen by OSIRIS).',
  'stopka.linie':
    'Extra-high-voltage lines: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener">ODbL</a> (this credit is also always visible on the map, bottom right).',
  'stopka.czcionki':
    'Fonts: Inter and JetBrains Mono, SIL Open Font License 1.1 (<a href="/licencje/OFL-Inter.txt" target="_blank" rel="noopener">Inter licence</a>, <a href="/licencje/OFL-JetBrains-Mono.txt" target="_blank" rel="noopener">JetBrains Mono licence</a>); the font files are hosted on our server.',
  // ── About page (/en/about/) ──
  'onas.meta.tytul': 'About · OSIRIS – electricity in Poland',
  'onas.meta.opis': 'Who is behind OSIRIS and how it was built: data from public sources, built with AI under the control of people and rules.',
  'onas.logo_aria': 'OSIRIS – home page',
  'onas.tytul': 'About',
  'onas.projekt_tytul': 'About the project',
  'onas.projekt':
    'OSIRIS shows in one place where Poland gets its electricity, what it costs and where new investments can connect to the grid. ' +
    'All data comes from public sources – including PSE (Poland\'s transmission system operator), URE, OpenStreetMap and EMODnet – with the source and date next to every number.',
  'onas.kto_tytul': 'Who is behind it',
  'onas.anna':
    '<strong>Anna Kołodziejczyk</strong> – creator and host of “Anna Kołodziejczyk | AI Revolution”, conversations with people shaping artificial intelligence. ' +
    'She sets the direction and design of OSIRIS and decides what goes live.',
  'onas.rafael':
    '<strong>Rafael Knuth</strong> – consultant and trainer. He helps business and technology teams build with AI in a way that lasts – ' +
    'using shared engineering principles and rules that apply equally to humans and AI agents. Project mentor.',
  'onas.jak_tytul': 'How we built it',
  'onas.jak':
    'AI writes fast – so people and rules decide what goes live. OSIRIS was built in a few weeks with AI (Claude Code). ' +
    'Every change is reviewed and checked before it is published. ' +
    'A robot checks weekly whether PSE has published a new document on available connection capacity; electricity data is refreshed every 4 hours. ' +
    'The code is public <a href="https://github.com/duchowablondyna-sketch/osiris-ania-rafael" target="_blank" rel="noopener noreferrer">on GitHub<span class="tylko-czytnik"> (opens in a new tab)</span></a>.',
  'onas.czym_tytul': 'What OSIRIS is not',
  'onas.czym':
    'It is not an official service of PSE or grid operators. Our own calculations (e.g. carbon intensity) are labelled “OSIRIS estimate”. ' +
    'Available connection capacity is the operator\'s estimate, not a guarantee of connection.',
  'onas.kontakt_tytul': 'Contact',
  'onas.linkedin_anna': 'Anna Kołodziejczyk on LinkedIn',
  'onas.linkedin_rafael': 'Rafael Knuth on LinkedIn',
  'onas.nowa_karta': '(opens in a new tab)',
  'onas.dol_aria': 'More',
  'onas.strona_glowna': 'Home',
  'onas.mapa': 'Map',
  'onas.zrodla_info': 'Sources and licences for all data – in the map footer.',
  'stopka.o_nas': 'About',
  'stopka.prawa': '© 2026 Anna Kołodziejczyk, Rafael Knuth. All rights reserved.',
};
