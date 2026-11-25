// Słownik PL – wszystkie teksty stron po polsku. Ten sam zestaw kluczy co src/teksty/en.js
// (pilnuje tego test: node --test scripts/testy-jezyki.mjs).
// Wartość: napis, funkcja (gdy w tekście jest liczba albo data) albo odmiana { one, few, many } (tn() z src/jezyk.js). W HTML stron można użyć tylko napisów –
// znacznik {{klucz}} (scripts/jezyki.mjs); w JavaScripcie – t('klucz', …) z src/jezyk.js.
// Teksty mogą zawierać proste znaczniki HTML (np. <sub>), bo trafiają do HTML strony.

export default {
  // ── <head>: tytuł karty i opisy do udostępniania ──
  'meta.tytul': 'OSIRIS – prąd w Polsce',
  'meta.opis':
    'Zobacz w jednym miejscu, skąd Polska bierze prąd i ile on kosztuje. Elektrownie, farmy wiatrowe, linie najwyższych napięć, produkcja z wiatru i cena energii – z oficjalnych, publicznych źródeł.',
  'meta.og_tytul': 'OSIRIS – prąd w Polsce',
  'meta.og_opis':
    'Skąd Polska bierze prąd i ile on kosztuje – elektrownie, farmy wiatrowe, sieć najwyższych napięć, wiatr i cena energii. Z oficjalnych, publicznych źródeł, z datą przy każdej liczbie.',
  'meta.og_obraz_alt':
    'OSIRIS: napis „Prąd w Polsce” nad nocnym globusem z zaznaczoną Polską oraz liczby elektrowni i farm wiatrowych',
  'meta.og_locale': 'pl_PL',
  // Obrazek do udostępniania (zrzut strony tytułowej w tym języku – sposób w ZRODLA.md).
  'meta.og_obraz': 'https://osiris-ania-rafael.pages.dev/og-obraz.png',

  // ── Wspólne dla obu stron ──
  'wspolne.jezyki_etykieta': 'Wersja językowa',
  'wspolne.brak_danych': 'brak danych',
  'wspolne.wiecej_ponizej': '↓ więcej poniżej',

  // ── Strona tytułowa ──
  'tytulowa.globus_opis':
    'Obracający się globus z nocnym zdjęciem Ziemi (NASA), Polska zaznaczona złotym punktem',
  'tytulowa.zrodla_i_licencje': 'ŹRÓDŁA I LICENCJE',
  'tytulowa.opis_przycisk': 'OPIS',
  'tytulowa.opis':
    'Zobacz w jednym miejscu, skąd Polska bierze prąd i ile on kosztuje. Elektrownie, farmy wiatrowe na lądzie i na Bałtyku, linie najwyższych napięć, produkcja z wiatru i cena energii godzina po godzinie. Wszystko z oficjalnych, publicznych źródeł, z datą przy każdej liczbie. Dla zarządów i inwestorów, którzy pytają: gdzie i jak zdobyć więcej prądu?',
  'tytulowa.czas_warszawa': 'CZAS WARSZAWA',
  // Duży napis na stronie tytułowej (wersja 3, decyzja Ani 23.11.2026) – zwykła pisownia; wielkie litery robi CSS.
  'tytulowa.nazwa': 'Prąd w Polsce',
  'tytulowa.haslo': 'SERCE DANYCH O POLSKIM PRĄDZIE.',
  'tytulowa.otworz_mape': 'OTWÓRZ MAPĘ →',
  'tytulowa.wegiel_nazwa': 'ELEKTROWNIE WĘGLOWE',
  'tytulowa.wegiel_zrodlo': 'GEM · dane: lipiec 2026 · działające',
  'tytulowa.ladowe_nazwa': 'LĄDOWE FARMY WIATROWE',
  'tytulowa.ladowe_zrodlo': 'GEM · dane: luty 2026 · od 10 MW, działające',
  'tytulowa.baltyk_nazwa': 'PROJEKTY NA BAŁTYKU',
  'tytulowa.baltyk_zrodlo': 'EMODnet · bez prawdopodobnych duplikatów',
  'tytulowa.pse_tekst': 'DANE PSE · ODŚWIEŻANE ZWYKLE CO 4 H',
  'tytulowa.pse_pobranie_czeka': 'ostatnie pobranie: …',
  'tytulowa.pse_pobranie': (kiedy) => `ostatnie pobranie: ${kiedy}`,
  'tytulowa.brak_danych_pse': 'brak danych PSE',
  'tytulowa.tlo_nasa': 'Tło: NASA Black Marble 2016 (GIBS)',

  // ══ Mapa (/mapa/) – e2 ══
  // ── Wspólne ──
  'wspolne.wczytywanie': 'wczytywanie…',
  'wspolne.zrodlo': 'Źródło',
  'wspolne.brak_danych_pse': 'brak danych PSE',
  'wspolne.po_polsku': '(po polsku)',
  'zrodlo.pobrano': (data) => `pobrano: ${data}`,
  'zrodlo.dane': (data) => `dane: ${data}`,
  'zrodlo.stan': (data) => `stan: ${data}`,
  'jednostka.zl_mwh': 'zł/MWh',
  // Pod tłumaczeniem cytatu z PSE – oryginał (tylko w wersji EN; tu dla kompletu kluczy).
  'cytat.oryginal': (tekst) => `oryginał PSE: „${tekst}”`,
  'cytat.bez_tlumaczenia': 'tekst PSE, jeszcze bez tłumaczenia',

  // ── <head>, mapa, przyciski ──
  'mapa.meta.tytul': 'Mapa · OSIRIS – prąd w Polsce',
  'mapa.meta.opis':
    'Mapa źródeł prądu w Polsce: elektrownie, farmy wiatrowe na lądzie i na Bałtyku, linie najwyższych napięć, wolna moc przyłączeniowa dla odbiorców w sieci PSE, produkcja z wiatru i cena energii – z oficjalnych, publicznych źródeł.',
  'mapa.meta.og_opis': 'Skąd Polska bierze prąd i ile on kosztuje – z oficjalnych, publicznych źródeł, z datą przy każdej liczbie.',
  'mapa.aria_mapa': 'Mapa Polski',
  'mapa.przybliz': 'Przybliż',
  'mapa.oddal': 'Oddal',
  'mapa.atrybucja': 'Pokaż lub ukryj podpis źródeł',
  'mapa.tlo_aria': 'Tło mapy',
  'mapa.dzien': 'Dzień',
  'mapa.noc': 'Noc',
  'mapa.noc_opis':
    'Światła nocne (zdjęcie z 2016 r.) to przybliżenie aktywności i oświetlenia – głównie oświetlenia ulic i zabudowy – a nie pomiar zużycia prądu.',
  'mapa.powrot_aria': 'Strona główna OSIRIS',

  // ── Okienko PSE (lewa góra): wiatr, słońce, ograniczenia, cena, odtwarzanie doby ──
  'mapa.wiatr_etykieta': 'Produkcja z wiatru (ostatni dostępny kwadrans):',
  'mapa.wiatr_stan': (doba, okres) => `stan na: ${doba}, ${okres}`,
  // Tryb spokojny (decyzja Ani 23.11.2026): nagłówek rozwiniętego okienka PSE i jego zwinięta linijka (bez ceny –
  // cena „teraz” jest tylko w Karcie Polski). kiedy = „08:00–08:15” albo z datą, gdy pomiar nie jest z dziś.
  'mapa.pse_tytul': 'Wiatr, słońce i cena prądu',
  // Zwinięta linijka z trzech części, każda bez łamania w środku (na wąskim ekranie łamie się tylko między nimi).
  'mapa.pse_skrot_wiatr': (mw) => `Wiatr ${mw}`,
  'mapa.pse_skrot_slonce': (pv) => `Słońce ${pv}`,
  'mapa.pse_skrot_stan': (kiedy) => `stan na ${kiedy} · PSE`,
  // Słońce (pole pv raportu his-wlk-cal) – ten sam kwadrans co wiatr. Dopisek tylko przy 0 MW po zmroku albo przed świtem.
  'mapa.slonce_etykieta': 'Produkcja ze słońca (ten sam kwadrans):',
  'mapa.slonce_noc': 'Po zmroku i przed świtem panele nie pracują – 0 MW to pora dnia, a nie awaria.',
  'mapa.slonce_brak': 'brak danych',
  'mapa.slonce_dachy': 'PSE nie podaje, czy liczy panele na dachach – to może nie być cała fotowoltaika w Polsce.',
  'mapa.pse_skrot_brak': 'Wiatr: brak danych PSE',
  'mapa.ograniczenie_etykieta': 'Ostatnie polecenie PSE ograniczenia wiatru:',
  'mapa.ograniczenie': (doba, mwh) => `Ostatnie polecenie PSE ograniczenia wiatru: ${doba} – ok. ${mwh} MWh`,
  'mapa.ograniczenie_brak': 'Ostatnie polecenie PSE ograniczenia wiatru: brak danych PSE',
  'mapa.rce_etykieta': 'Cena prądu (RCE):',
  'mapa.cena_biezaca': 'Cena prądu (RCE) w bieżącej dobie:',
  'mapa.cena_brak_dzis': 'Cena prądu (RCE): brak danych na dziś',
  'mapa.cena_brak_pse': 'Cena prądu (RCE): brak danych PSE',
  'mapa.cena_kwadrans': (cena, okres) => `Cena prądu (RCE): ${cena} zł/MWh, ${okres}`,
  'mapa.pse_pobrano': (kiedy) => `PSE · pobrano: ${kiedy}`,
  'mapa.pse_braki': (lista) => ` · brak danych: ${lista}`,
  'mapa.brak_wiatr': 'wiatr',
  'mapa.brak_cena': 'cena',
  'wykres.wiatr_opis': (doba) => `Produkcja z wiatru ${doba}, co 15 minut, w MW`,
  'wykres.wiatr_slonce_opis': (doba) => `Produkcja z wiatru i ze słońca ${doba}, co 15 minut, w MW`,
  'wykres.linia_wiatr': 'wiatr',
  'wykres.linia_slonce': 'słońce',
  'wykres.cena_opis': (doba) => `Cena prądu RCE ${doba}, co 15 minut, w zł/MWh`,
  'wykres.biezaca_doba': 'w bieżącej dobie',
  'wykres.w_dobie': (doba) => `w dobie ${doba}`,
  'wykres.maks': (x) => `maks. ${x}`,
  'wykres.maks_linie': (lista) => `maks.: ${lista}`,
  'wykres.min': (x) => `min. ${x}`,
  'wykres.teraz': 'teraz',
  'odtw.start': '▶ Odtwórz dobę',
  'odtw.wroc': 'Wróć do teraz',
  'odtw.pauza': '❚❚ Pauza',
  'odtw.wznow': '▶ Wznów',
  'odtw.data': (doba) => `Odtworzenie doby: ${doba}`,
  'odtw.wiatr_etykieta': 'Produkcja z wiatru:',
  'odtw.slonce_etykieta': 'Produkcja ze słońca:',
  'odtw.kwadrans': (okres) => `kwadrans ${okres}`,
  'odtw.ogl_start': (doba) => `Odtwarzanie doby ${doba}, 1 sekunda to 1 godzina.`,
  'odtw.ogl_pauza': (godzina) => `Pauza, godzina ${godzina}.`,
  'odtw.ogl_wznow': 'Wznowiono odtwarzanie.',
  'odtw.ogl_teraz': 'Pokazuję dane bieżące.',
  'odtw.ogl_koniec': 'Koniec odtworzenia doby. Pokazuję dane bieżące.',
  'odtw.brak': 'Odtworzenie doby: brak pełnych danych',

  // ── Legenda „Co oznaczają znaczki” i liczniki ──
  'leg.tytul': 'Co oznaczają znaczki',
  // Tryb spokojny (wariant 3B): źródła pod listą warstw i przycisk „więcej ▸ / mniej ▾” (strzałkę dokłada CSS).
  'leg.zrodla': 'Źródła: GEM · OpenStreetMap · EMODnet · PSE',
  'leg.wiecej': 'więcej',
  'leg.mniej': 'mniej',
  'leg.moce': 'Wolna moc dla odbiorców (PSE)',
  'leg.moce_opis': '– sieć najwyższych napięć 220/400 kV, dla największych odbiorców; sześciokąt: stacja planowana z wolną mocą;',
  'leg.moce_kolo': 'koło: lokalizacja przybliżona;',
  'leg.moce_pusty': 'pusty sześciokąt: według wykazu PSE wnioski do rozdzielni 220/400 kV obecnie bez rozpatrzenia',
  'leg.linie': 'Linie najwyższych napięć',
  'leg.linie_opis': '– 220 i 400 kV (grubsza linia: 400 kV); kliknij linię na mapie, by zobaczyć szczegóły',
  'leg.morskie': 'Morskie farmy wiatrowe',
  'leg.morskie_opis': '– puste kółko: prawdopodobny duplikat lub brak na liście MKiŚ',
  'leg.ladowe': 'Lądowe farmy wiatrowe od 10 MW',
  'leg.ladowe_opis': '– pełne kółko: działa; pierścień z kropką: w budowie',
  'leg.wegiel': 'Elektrownie węglowe',
  'leg.gaz': 'Elektrownie gazowe i olejowe',
  'leg.woda': 'Elektrownie wodne',
  'leg.pompowa': 'Elektrownie szczytowo-pompowe',
  'leg.kwadrat': '– kwadrat: elektrownia spalająca paliwo',
  'leg.pompowa_opis': '– magazyn energii: pompują wodę w górę, gdy prądu jest dużo, i oddają go, gdy brakuje',
  'leg.elektrownie_uwaga': 'Elektrownie: tylko działające i tylko duże (progi w „Źródła i licencje”)',
  'leg.rozmiar': 'Rozmiar znaczka elektrowni = moc zainstalowana, nie bieżąca produkcja',
  'leg.skala_1000': '1 000 MW',
  'leg.skala_5000': '5 000 MW',
  'leg.wzorce': 'Wzorce rozmiaru: 100 MW – mały kwadrat, 1 000 MW – średni, 5 000 MW – duży.',
  'liczba.elektrownia': { one: 'elektrownia', few: 'elektrownie', many: 'elektrowni' },
  'liczba.farma_dziala': { one: 'farma działa', few: 'farmy działają', many: 'farm działa' },
  'liczba.farma': { one: 'farma', few: 'farmy', many: 'farm' },
  'liczba.planowana': { one: 'planowana', few: 'planowane', many: 'planowanych' },
  'liczba.odcinek': { one: 'odcinek', few: 'odcinki', many: 'odcinków' },
  'liczba.blok': { one: 'blok', few: 'bloki', many: 'bloków' },
  'liczba.stacja': { one: 'stacja', few: 'stacje', many: 'stacji' },
  'liczba.stacja_ma': { one: 'stacja ma', few: 'stacje mają', many: 'stacji ma' },
  'liczba.stacja_planowana': { one: 'stacja planowana', few: 'stacje planowane', many: 'stacji planowanych' },
  'licznik.ladowe': (farmy, moc, wBudowie) => `${farmy} · ${moc} · ${wBudowie} w budowie`,
  'licznik.linie': (odcinki, data) => `${odcinki} · OSM ${data}`,
  'licznik.morskie': (farmy, wBudowie, planowane) => `${farmy} · ${wBudowie} w budowie, ${planowane}`,

  // ── Okienka elektrowni, farm i linii ──
  'elektrownia.wegiel': 'elektrownia węglowa',
  'elektrownia.gaz': 'elektrownia gazowa lub olejowa',
  'elektrownia.woda': 'elektrownia wodna',
  'elektrownia.pompowa': 'elektrownia szczytowo-pompowa (magazyn energii)',
  'elektrownia.pompowa_opis': 'pompuje wodę w górę, gdy prądu jest dużo, i oddaje go, gdy brakuje – to magazyn, a nie źródło energii',
  'elektrownia.rodzaj_wegla': (lista) => `rodzaj: ${lista}`,
  'elektrownia.paliwo': (lista) => `paliwo: ${lista}`,
  'elektrownia.typ': (lista) => `typ: ${lista}`,
  'elektrownia.moc': (moc, bloki) => `moc: ${moc} MW (${bloki} w danych)`,
  'elektrownia.moc_zainstalowana': 'moc zainstalowana – nie bieżąca produkcja',
  'lokalizacja.dokladna': 'lokalizacja: dokładna',
  'lokalizacja.przyblizona': 'lokalizacja: przybliżona (np. najbliższa miejscowość)',
  // Kategorie GEM (dane źródłowe po angielsku, bez zmian) – tłumaczenie tylko wyświetlanego tekstu.
  'gem.paliwo.coal: bituminous': 'węgiel kamienny',
  'gem.paliwo.coal: lignite': 'węgiel brunatny',
  'gem.paliwo.coal: unknown': 'węgiel (rodzaj nieznany)',
  'gem.paliwo.fossil gas: natural gas': 'gaz ziemny',
  'gem.paliwo.industrial by-product: coke oven gas': 'gaz koksowniczy',
  'gem.paliwo.fossil liquids: heavy fuel oil': 'ciężki olej opałowy',
  'gem.paliwo.fossil liquids: fuel oil': 'olej opałowy',
  'gem.technologia.run-of-river': 'przepływowa',
  'gem.technologia.conventional storage': 'zbiornikowa',
  'gem.technologia.pumped storage': 'szczytowo-pompowa',
  'farmy.faza': (faza) => `faza ${faza}: `,
  'farmy.lad.operating': 'działa',
  'farmy.lad.construction': 'w budowie – jeszcze nie produkuje albo produkuje częściowo',
  'farmy.moc_brak': 'moc: brak danych',
  'farmy.uruchomienie': (rok) => `, uruchomienie: ${rok}`,
  // Statusy EMODnet (dane po angielsku, bez zmian).
  'farmy.morskie.Planned': 'planowana',
  'farmy.morskie.Construction': 'w budowie',
  'farmy.morskie.Production': 'działa',
  'farmy.status': (status) => `status: ${status}`,
  'farmy.moc': (moc) => `moc: ${moc}`,
  'farmy.weryfikacja': (opis) => `weryfikacja: ${opis}`,
  // Wartości z danych (farmy-baltyk.geojson) – dokładnie te teksty; po angielsku tłumaczy je src/jezyk.js (zDanych).
  'farmy.weryfikacja.na_liscie': 'na liście MKiŚ',
  'farmy.weryfikacja.brak_na_liscie': 'brak na liście MKiŚ',
  'farmy.weryfikacja.duplikat': 'prawdopodobny duplikat: ',
  'farmy.weryfikacja.opis_baltyk1': 'na liście MKiŚ, część projektu MFW Bałtyk I',
  'farmy.weryfikacja.opis_baltic_east': 'na liście MKiŚ jako Orlen Neptun 46.E.1 (spółka Orlen Neptun VIII)',
  'farmy.korekta.baltic_power':
    'stan wg balticpower.pl: w rozruchu – pierwsza energia do sieci 10.07.2026 (odbiór potwierdziły PSE), ' +
    'wszystkie 76 turbin zainstalowane (7.10.2026), każda po podłączeniu przechodzi 240-godzinną próbę; ' +
    'jeszcze bez koncesji na wytwarzanie, etap przed eksploatacją komercyjną (daty nie podano). ' +
    'W danych EMODnet (10.07.2026) i GEM (dane wiatrowe z lutego 2026): w budowie.',
  'linie.podpowiedz': 'kliknij – szczegóły linii',
  'linie.bez_nazwy': 'Linia bez nazwy w OpenStreetMap',
  'linie.napiecie': (kv) => `linia najwyższego napięcia: ${kv} kV`,
  'okienko.zamknij': 'Zamknij okienko',

  // ── Karta Polski: nagłówek, zakładki, SKĄD ──
  'karta.tytul': 'Karta Polski',
  'karta.zakladka_skad': 'Skąd',
  'karta.zakladka_gdzie': 'Gdzie',
  'karta.zakladka_ile': 'Ile i jak czysto',
  'karta.zakladka_zmiany': 'Co się zmieni',
  'karta.skad_wstep': 'Źródła prądu na mapie – zaznacz, co pokazać:',
  'karta.prog_bloki_30': 'na mapie · bloki od 30 MW (GEM)',
  'karta.prog_bloki_20': 'na mapie · bloki od 20 MW (GEM)',
  'karta.prog_30': 'na mapie · od 30 MW (GEM)',
  'karta.skad_uwaga': 'Rozmiar znaczka elektrowni = moc zainstalowana, nie bieżąca produkcja. Opis wszystkich znaczków: legenda po prawej.',
  'karta.klodka': 'Karta lokalizacji – wkrótce',
  'karta.wkrotce': 'Wkrótce.',

  // ── GDZIE: wolna moc dla odbiorców (PSE) ──
  'moce.tytul': 'Wolna moc dla odbiorców · PSE 220/400 kV',
  'moce.wazne':
    'Sieć najwyższych napięć (220/400 kV) – dla największych odbiorców, np. fabryk i centrów danych. Mniejsze firmy przyłączają się do sieci operatorów dystrybucyjnych (kolejny etap OSIRIS).',
  'moce.istniejace': 'Dla istniejących stacji PSE podaje 0 MW – wolną moc mają tylko stacje planowane. Moc podana dla roku 2031; niektóre stacje powstaną później.',
  'moce.lista1': 'Stacje dla nowych odbiorców',
  'moce.lista2': 'Stacje budowane głównie dla sieci i nowych źródeł – według PSE mogą też zasilać odbiorców',
  'moce.szacunek':
    'Szacunek operatora, nie gwarancja przyłączenia. Wykorzystanie mocy w jednej stacji może zmniejszyć moc w stacjach sąsiednich – dlatego mocy stacji nie sumujemy.',
  'moce.zrodla_etykieta': 'Moc dla nowych źródeł:',
  'moce.stan_etykieta': 'stan na:',
  'moce.zrodla_zero': 'PSE: 0 MW dla nowych źródeł w sieci najwyższych napięć – w całej Polsce (2026 i 2031)',
  'moce.zrodla': (a, b) => `PSE: ${a} (2026) i ${b} (2031) dla nowych źródeł w sieci najwyższych napięć – w całej Polsce`,
  'moce.zrodla_brak': 'Moc dla nowych źródeł: brak danych',
  'moce.lok_okolica': (rejon, miejsce, km) =>
    `Lokalizacja przybliżona – PSE podaje tylko »${rejon}«; środek koła wybrał OSIRIS (${miejsce}, promień ${km} km).`,
  'moce.lok_osm': (nazwa) => `Lokalizacja: planowana stacja w OpenStreetMap („${nazwa}”) – dopasowanie niepewne.`,
  'moce.lok_brak': 'Brak na mapie – PSE nie podaje miejscowości albo nie da się jej ustalić bez zgadywania.',
  'moce.w_tym_miejscu': (stacje) => `${stacje} w tym miejscu`,
  'moce.moc': (mw) => `wolna moc dla odbiorców: ${mw} (rok 2031)`,
  'moce.tabela2': 'stacja budowana głównie dla sieci i nowych źródeł – według PSE może też zasilać odbiorców',
  'moce.uwaga_pusty': (data) =>
    `Uwaga: według wykazu PSE (stan na ${data}) wnioski o przyłączenie do tej stacji obecnie pozostają bez rozpatrzenia.`,
  'moce.uwaga_110': (data) =>
    `Uwaga: według wykazu PSE (stan na ${data}) wnioski do rozdzielni 110 kV tej stacji obecnie pozostają bez rozpatrzenia; o rozdzielniach 220/400 kV wykaz nie mówi.`,
  'moce.lista_pse': (tytul, rozdzielnie) => `Lista PSE: „${tytul}”; rozdzielnie w wykazie: ${rozdzielnie}.`,
  'moce.daty_rozne': (wykaz, moce, sprawdzone) =>
    `Daty się różnią: wykaz rozdzielni ma stan na ${wykaz}, a moce – stan na ${moce}. Nowszego wykazu PSE nie opublikowało (sprawdzone ${sprawdzone}).`,
  'moce.wykaz_brak': 'Wykaz rozdzielni PSE (stacje bez rozpatrywania wniosków): brak danych – nie wiadomo, czy wnioski są rozpatrywane.',
  'moce.kazda_osobno': 'Każda stacja ma własną moc – nie sumujemy.',
  'moce.siec_nn': 'Sieć najwyższych napięć (220/400 kV) – dla największych odbiorców.',
  'moce.szacunek_okienko': (data) =>
    `Szacunek operatora (PSE), stan na ${data}. Stacja planowana, moc podana dla roku 2031. Wykorzystanie mocy w jednej stacji może zmniejszyć moc w stacjach sąsiednich. To nie jest gwarancja przyłączenia.`,
  'moce.zrodlo_wykaz': 'PSE – wykaz rozdzielni',
  'moce.zrodlo_osm': 'OpenStreetMap (lokalizacja)',
  'moce.podpis_przyblizona': 'lokalizacja przybliżona',
  'moce.lok_krotko.okolica': 'lokalizacja przybliżona',
  'moce.lok_krotko.stacja-osm': 'dopasowanie niepewne (OSM)',
  'moce.lok_krotko.brak': 'brak na mapie',
  'moce.wstrzymane_pusty': ' · wnioski bez rozpatrzenia',
  'moce.wstrzymane_110': ' · 110 kV – bez rozpatrzenia',
  'moce.podsumowanie': (ile, pelne, napiecia, tylko110, dataWykazu, dataMocy) =>
    `${ile} moc dla odbiorców. W ${pelne} z nich PSE obecnie nie rozpatruje wniosków (rozdzielnia ${napiecia}); ` +
    `przy ${tylko110} kolejnych wykaz dotyczy tylko rozdzielni 110 kV (wykaz rozdzielni, stan na ${dataWykazu}; moce – stan na ${dataMocy}).`,
  'moce.podsumowanie_bez_wykazu': (ile) => `${ile} moc dla odbiorców. Wykaz rozdzielni PSE (gdzie wnioski nie są rozpatrywane): brak danych.`,
  'moce.sprawdzono_robot': (data) => `sprawdzono przez Robota OSIRIS: ${data}`,
  'moce.sprawdzono': (data) => `sprawdzono: ${data} (data przyjęcia danych)`,
  'moce.stan': (data, sprawdzono) => `stan na: ${data} · ${sprawdzono}`,
  'moce.licznik': (planowane, naMapie, stan, wykaz) => `${planowane} · ${naMapie} na mapie · stan ${stan} · ${wykaz}`,
  'moce.licznik_wykaz': (pelne, napiecia, tylko110, data) => `${pelne} bez rozpatrywania wniosków (${napiecia}), ${tylko110} – tylko 110 kV (wykaz ${data})`,
  'moce.licznik_wykaz_brak': 'wykaz rozdzielni: brak danych',
  'moce.brak': 'Wolne moce PSE: brak danych',

  // ── ILE I JAK CZYSTO: liczba-bohater, pasek, paski mocy, trzy liczby ──
  'karta.miks_aria': 'Miks produkcji w Polsce',
  'karta.moce_tytul': 'Ile pracuje z tego, co mamy',
  'karta.moce_aria': 'Produkcja teraz na tle mocy zainstalowanej',
  'karta.uwaga_dostepna': 'Moc zainstalowana to nie moc dostępna: część bloków stoi w remoncie albo w rezerwie.',
  'karta.uwaga_pogoda': 'Wiatr i słońce pracują, gdy wieje i świeci – krótki pasek to pogoda albo pora dnia, a nie awaria.',
  'karta.pytajnik_znak': '„?” –',
  'karta.niepewnosc':
    'PSE w raporcie podaje jedną moc dla wiatru (na lądzie i na morzu), słońca i innych OZE – bez podziału. Nie wiemy też, czy liczy panele na dachach. Wody tu nie wliczamy.',
  'karta.uwaga_bez_paska': 'Bez paska: woda, olej, odpady i „inne” – raport PSE nie podaje dla nich mocy, którą da się porównać z produkcją.',
  'karta.uwaga_mapa': 'Mapa pokazuje tylko większe elektrownie, dlatego suma mocy na mapie (zakładka „Skąd”) jest mniejsza.',
  'karta.raport_kse': 'PSE, Raport 2025 KSE, Tabela 1.1',
  'karta.cena_rce': 'Cena RCE',
  'karta.slad_co2': 'Ślad CO<sub>2</sub>',
  'karta.wymiana': 'Wymiana z zagranicą',
  'karta.przetworzenie': 'przetworzenie i ślad CO2: OSIRIS',
  'karta.pytajnik_aria': 'Dlaczego znak zapytania? – wyjaśnienie',
  'karta.pytajnik_tytul': 'Dlaczego znak zapytania?',
  'karta.skrot_stare': (skrot) => `${skrot} · ⚠ dane nie są najnowsze`,
  'karta.zrodlo_pobrano': (kiedy) => `PSE · pobrano: ${kiedy}`,
  'karta.zrodlo_brak': 'PSE · brak danych',
  'karta.brak_miksu': 'brak danych PSE o miksie',
  'karta.procent_aria': (procent, krotko) => `${procent} ${krotko} – szczegóły`,
  'karta.grupa.kamienny': 'węgiel kamienny',
  'karta.grupa.brunatny': 'węgiel brunatny',
  'karta.grupa.gaz_i_inne': 'gaz i inne',
  'karta.grupa.oze': 'OZE',
  'karta.oze.wiatr_lad': 'wiatr na lądzie',
  'karta.oze.wiatr_morze': 'wiatr na morzu',
  'karta.oze.slonce': 'słońce',
  'karta.oze.woda': 'woda',
  'karta.oze.biomasa': 'biomasa i inne OZE',
  'karta.moc.gaz': 'gaz ziemny',
  'karta.moc.oze': 'wiatr, słońce i inne OZE',
  'karta.moc_brak': 'brak danych o mocy zainstalowanej',
  'karta.moc_tekst': (produkcja, moc) => `${produkcja} z ${moc} GW`,
  'karta.moc_ponad': (stan) => `więcej niż moc z raportu PSE (stan ${stan}) – od tego czasu mogły przybyć nowe elektrownie`,
  'karta.moc_podpis': (stan, stanMocy) => `produkcja: stan na ${stan} · moc w całej Polsce: PSE, stan ${stanMocy}`,
  'karta.moc_zrodlo': (stanMocy) => `PSE, Raport 2025 KSE, Tabela 1.1 · stan ${stanMocy}`,
  'karta.cena_brak_dzis': 'brak danych na dziś',
  'karta.wymiana_zero': 'ok. 0 MW',
  'karta.wymiana_zero_opis': 'planowo, prawie bez wymiany',
  'karta.wymiana_kupuje': (mw) => `kupuje ok. ${mw} MW`,
  'karta.wymiana_sprzedaje': (mw) => `sprzedaje ok. ${mw} MW`,
  'karta.wymiana_planowo': 'planowo',
  'karta.plakietka_brak_powod': (powod) => `Brak danych o miksie: ${powod}.`,
  'karta.plakietka_brak': 'Brak danych PSE o miksie.',
  'karta.plakietka_nie_najnowsze': (powod, stan) => `Dane nie są najnowsze: ${powod}. Pokazujemy stan na ${stan}.`,
  'karta.plakietka_stare': (godzin, stan) => `Dane sprzed ponad ${godzin} godzin. Pokazujemy stan na ${stan}.`,
  // Powody plakietki z karta.json (scripts/karta/pobierz.mjs) – dokładnie te teksty (pilnuje test).
  'karta.powod.sprawdzian': 'nowe dane nie przeszły sprawdzianu',
  'karta.powod.pobranie': 'nie udało się pobrać nowych danych PSE',
  'karta.bohater_oze': 'prądu w Polsce pochodzi z OZE (źródeł odnawialnych)',
  'karta.bohater_wegiel': 'prądu w Polsce pochodzi z węgla',
  'karta.krotko_oze': 'z OZE',
  'karta.krotko_wegiel': 'z węgla',
  'karta.stan': (stan) => `stan na ${stan}`,
  // Zwinięta linijka Karty (tryb spokojny, wariant 1A): „56% z węgla · PSE, stan na 08:15”.
  'karta.skrot': (co, stan) => `${co} · PSE, stan na ${stan}`,
  'karta.opublikowalo': (kiedy) => ` · PSE opublikowało ${kiedy}`,
  'karta.podpis': (stan) => `z produkcji w Polsce · ${stan}`,
  // Ślad CO2 w ekwiwalencie (CO₂eq) – mediany IPCC są w ekwiwalencie (decyzja Ani 23.11.2026, obie wersje mówią to samo).
  'karta.co2_wartosc': (g) => `ok. ${g} g CO₂eq/kWh`,
  'karta.co2_opis': 'szacunek OSIRIS',
  'karta.co2_dokladnie': (x) => `${x} g CO₂eq/kWh`,
  'karta.sprawdzian': (kwadranse, mw) => `${kwadranse} wspólnych kwadransów, największa różnica ${mw} MW`,
  'okienko_polski.naglowek': (krotko) => `Polska · prąd ${krotko}`,
  'okienko_polski.tu': (wartosc) => `tu jesteśmy: ${wartosc} – szacunek OSIRIS wg IPCC`,
  'okienko_polski.zdanie': 'z produkcji w Polsce · dane PSE co 15 min',
  'okienko_polski.razem': '= razem',
  'okienko_polski.co2_tytul': 'Ślad CO<sub>2</sub>',
  'okienko_polski.wiecej': 'Więcej',
  'okienko_polski.wiecej_aria': 'Więcej – Metodologia w panelu Karty Polski',

  // ── Metodologia (w panelu ILE I JAK CZYSTO) ──
  'met.tytul': 'Metodologia',
  'met.skad':
    '<strong>Skąd dane:</strong> PSE, raport „his-gen-pal-sire” – produkcja prądu w Polsce według paliw, co 15 minut. PSE publikuje go zwykle z opóźnieniem 30–45 minut, a strona pobiera dane co 4 godziny.',
  'met.sprawdzian':
    '<strong>Sprawdzian:</strong> przy każdym pobraniu wiatr i słońce z tego raportu muszą się zgadzać (do 1 MW) z drugim raportem PSE („his-wlk-cal”). Gdy się nie zgadzają, zostają poprzednie dane z plakietką. Ostatnio:',
  'met.udzialy':
    '<strong>Udziały:</strong> liczone z produkcji w Polsce. Elektrownie szczytowo-pompowe pomijamy – to magazyn energii, a nie źródło. Odpady nie są liczone jako OZE.',
  'met.co2':
    '<strong>Ślad CO<sub>2</sub> – szacunek OSIRIS:</strong> produkcja z każdego paliwa × typowy ślad CO<sub>2</sub> w całym cyklu życia elektrowni, ' +
    'liczony jako CO<sub>2</sub> ekwiwalent (CO<sub>2</sub>eq) – mediany IPCC, raport AR5 z 2014 r. Dla paliw, których IPCC nie podaje ' +
    '(węgiel brunatny, olej, gaz z węgla, odpady, „inne”, „inne OZE”), przyjęliśmy własne założenia na podstawie wskaźników KOBiZE. ' +
    'W sprawdzonym kwadransie (20.11.2026, 12:00–12:15) skrajne warianty założeń dla tych paliw – bez węgla brunatnego – zmieniały wynik ' +
    'o mniej niż 3%. Prądu kupionego za granicą nie wliczamy. Dokładnie teraz:',
  'met.kobize':
    '<strong>KOBiZE 553 kg CO<sub>2</sub>/MWh (2024)</strong> to inna miara: tylko emisja ze spalania, średnia z całego roku. Nie porównujemy jej wprost z naszym szacunkiem.',
  'met.wymiana':
    '<strong>Wymiana z zagranicą:</strong> wymiana planowa według PSE (suma dwóch sald: swm_p + swm_np), a nie zmierzona. „Kupuje” – prąd płynie do Polski, „sprzedaje” – z Polski.',

  // ── Stopka „Źródła i licencje” (src/czesci/stopka.html) – e3 ──
  // Linki, nazwy licencji i podpisy („© OpenStreetMap contributors”) – w oryginale; streszczenie CC BY 4.0 po polsku (deed.pl).
  'stopka.tytul':
    'Źródła i licencje',
  'stopka.kontur':
    'Kontur Polski: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> (domena publiczna), dane uproszczone do konturu jednego kraju.',
  'stopka.wiatr':
    'Produkcja z wiatru i ze słońca: PSE S.A., <a href="https://raporty.pse.pl/" target="_blank" rel="noopener">raporty.pse.pl</a>, dane pobrane <span id="wiatr-pobrano">wczytywanie…</span>, przetworzone.',
  'stopka.ograniczenia':
    'Ograniczenia wiatru: PSE S.A., raport „Nierynkowe redysponowanie źródeł OZE”, ten sam czas pobrania, przetworzone (suma kwadransów ÷ 4, przy założeniu, że wartości są w MW).',
  'stopka.rce':
    'Cena prądu (RCE): PSE S.A., <a href="https://raporty.pse.pl/report/rce-pln" target="_blank" rel="noopener">raport „Rynkowa cena energii elektrycznej”</a>, dane pobrane <span id="rce-pobrano">wczytywanie…</span>, przetworzone.',
  'stopka.odtworzenie':
    'Odtworzenie doby: PSE S.A., raporty his-wlk-cal i rce-pln, doba <span id="odtw-zrodlo-doba">wczytywanie…</span>, przetworzone.',
  'stopka.karta':
    'Karta Polski (miks paliw, wymiana z zagranicą): PSE S.A., raporty his-gen-pal-sire i his-wlk-cal, dane pobrane <span id="karta-pobrano">wczytywanie…</span>, przetworzone (udziały, sprawdzian; ślad CO2 (CO₂eq) – szacunek OSIRIS wg IPCC AR5 i wskaźników KOBiZE, metoda w panelu „Metodologia”).',
  'stopka.morskie':
    'Morskie farmy wiatrowe: <a href="https://emodnet.ec.europa.eu/en/" target="_blank" rel="noopener">EMODnet</a> Human Activities, Wind Farms (twórca danych: CETMAR, stan 10.07.2026), <a href="https://creativecommons.org/licenses/by/4.0/deed.pl" target="_blank" rel="noopener">CC BY 4.0</a>; wybrano tylko farmy w polskich obszarach morskich; porównane z <a href="https://www.gov.pl/web/morska-energetyka-wiatrowa/obecnie-realizowane-projekty-w-polsce" target="_blank" rel="noopener">listą projektów MKiŚ</a> (stan: styczeń 2024) – puste kropki: prawdopodobny duplikat albo brak na liście.',
  'stopka.baltic':
    'Status Baltic Power uzupełniony według <a href="https://balticpower.pl/" target="_blank" rel="noopener">balticpower.pl</a> (rozruch od 10.07.2026).',
  'stopka.ladowe':
    'Lądowe farmy wiatrowe (zielone): Global Energy Monitor, <a href="https://globalenergymonitor.org/projects/global-integrated-power-tracker/" target="_blank" rel="noopener">Global Integrated Power Tracker</a>, September 2026 release (dane wiatrowe z Global Wind Power Tracker, luty 2026), <a href="https://creativecommons.org/licenses/by/4.0/deed.pl" target="_blank" rel="noopener">CC BY 4.0</a>, zmodyfikowane (wyciąg).',
  'stopka.ladowe_tylko':
    'Tylko lądowe farmy wiatrowe od 10 MW – mniejsze farmy i pojedyncze turbiny nie są pokazane.',
  'stopka.ladowe_znaczki':
    'Pełna kropka: działa; pierścień z kropką: w budowie; planowanych nie pokazujemy. Około połowy lokalizacji jest przybliżonych.',
  'stopka.elektrownie':
    'Elektrownie (kwadraty, kółka, romby): ten sam wyciąg GEM, CC BY 4.0, zmodyfikowane (bloki zsumowane do elektrowni); tylko działające.',
  'stopka.progi':
    'Progi GEM: węgiel – bloki od 30 MW; gaz i olej – od 20 MW w UE; woda (także szczytowo-pompowe) – od 30 MW, dla niektórych krajów od 10 MW.',
  'stopka.dane':
    'Dane: węgiel – lipiec 2026, gaz i olej – sierpień 2026, woda – marzec 2026. Rozmiar znaczka = moc zainstalowana, nie bieżąca produkcja.',
  'stopka.tlo_dzien':
    'Tło dzienne: Blue Marble (August 2004), MODIS / NASA Earth Observatory.',
  'stopka.tlo_noc':
    'Tło nocne: Black Marble (2016), Suomi NPP / VIIRS, NASA Earth Observatory.',
  'stopka.tla':
    'Tła przetworzone, żeby dane były lepiej widoczne: dzienne przyciemnione i mniej nasycone, nocne mniej nasycone i przygaszone o 30%.',
  'stopka.moce':
    'Wolna moc dla odbiorców (sześciokąty, koła) i zdanie o mocy dla nowych źródeł: PSE S.A., <a href="https://www.pse.pl/obszary-dzialalnosci/krajowy-system-elektroenergetyczny/informacja-o-dostepnosci-mocy-przylaczeniowej" target="_blank" rel="noopener">„Informacja o dostępności mocy przyłączeniowej do sieci przesyłowej”</a>, stan na 31.10.2026, dokument pobrany 21.11.2026, przetworzone (wyciąg tabel; mocy stacji nie sumujemy). Szacunek operatora, nie gwarancja przyłączenia.',
  'stopka.wykaz':
    'Stacje, do których wnioski obecnie pozostają bez rozpatrzenia (pusty sześciokąt – wykaz obejmuje rozdzielnię 220/400 kV; gdy tylko 110 kV – pełny sześciokąt i uwaga w okienku): PSE S.A., <a href="https://www.pse.pl/dane-systemowe/praca-kse/informacje-ogolne/wykaz-obiektow-planowanych-do-przylaczenia" target="_blank" rel="noopener">„Wykaz rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów”</a>, stan na 04.02.2026 (starszy niż moce – stan na 31.10.2026), plik pobrany 21.11.2026, przetworzone (wyciąg list 2 i 3).',
  'stopka.miejsca':
    'Miejsca stacji: OpenStreetMap (ODbL) – planowane stacje z OSM albo koła 20 km wokół miejscowości z opisu PSE (lokalizacja przybliżona, wybór OSIRIS).',
  'stopka.linie':
    'Linie najwyższych napięć: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener">ODbL</a> (podpis widoczny też stale na mapie, w prawym dolnym rogu).',
  'stopka.czcionki':
    'Czcionki: Inter i JetBrains Mono, SIL Open Font License 1.1 (<a href="/licencje/OFL-Inter.txt" target="_blank" rel="noopener">licencja Inter</a>, <a href="/licencje/OFL-JetBrains-Mono.txt" target="_blank" rel="noopener">licencja JetBrains Mono</a>); pliki czcionek są na naszym serwerze.',
};
