// Słownik PL – wszystkie teksty stron po polsku. Ten sam zestaw kluczy co src/teksty/en.js
// (pilnuje tego test: node --test scripts/testy-jezyki.mjs).
// Wartość: napis, funkcja (gdy w tekście jest liczba albo data) albo odmiana { one, few, many } (tn() z src/jezyk.js). W HTML stron można użyć tylko napisów –
// znacznik {{klucz}} (scripts/jezyki.mjs); w JavaScripcie – t('klucz', …) z src/jezyk.js.
// Teksty mogą zawierać proste znaczniki HTML (np. <sub>), bo trafiają do HTML strony.

export default {
  // ── <head>: tytuł karty i opisy do udostępniania ──
  'meta.tytul': 'SOURCE – energia w Polsce',
  'meta.opis':
    'Zobacz w jednym miejscu, skąd Polska bierze prąd i ile on kosztuje. Elektrownie, farmy wiatrowe, linie najwyższych napięć, produkcja z wiatru i cena energii – z oficjalnych, publicznych źródeł.',
  'meta.og_tytul': 'SOURCE – energia w Polsce',
  'meta.og_opis':
    'Skąd Polska bierze prąd i ile on kosztuje – elektrownie, farmy wiatrowe, sieć najwyższych napięć, wiatr i cena energii. Z oficjalnych, publicznych źródeł, z datą przy każdej liczbie.',
  'meta.og_obraz_alt':
    'SOURCE: napis „Energia w Polsce” i zdanie o źródłach danych obok nocnego globusa z zaznaczoną Polską',
  'meta.og_locale': 'pl_PL',
  // Obrazek do udostępniania (zrzut strony tytułowej w tym języku – sposób w ZRODLA.md).
  // Nowa nazwa pliku (27.11.2026): LinkedIn trzyma obrazek w pamięci po adresie – stary og-obraz.png pokazywał OSIRIS.
  'meta.og_obraz': 'https://osiris-ania-rafael.pages.dev/og-obraz-source.png',

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
  'tytulowa.nazwa': 'Energia w Polsce',
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
  'mapa.meta.tytul': 'Mapa · SOURCE – energia w Polsce',
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
  'mapa.powrot_aria': 'SOURCE – strona tytułowa',

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
  'mapa.slonce_dachy': 'PSE podaje, że dane obejmują źródła w rynku bilansującym i poza nim. Nie podaje, czy i jak liczy panele na dachach.',
  // Osobna informacja obok zdania o PSE (decyzja Ani 27.11.2026) – bez „w tym”, bez dodawania do liczby PSE.
  // Liczby zaokrąglone do 1 MW: ARE 13 735,3 (dymek wykresu, wrzesień 2026), URE 13 088,621 (raport, Tabela 3). ZRODLA.md.
  'mapa.slonce_prosumenci':
    'Moc paneli fotowoltaicznych prosumentów: 13 735 MW – stan na koniec września 2026 (<a href="https://www.are.waw.pl/badania-statystyczne/energetyka-w-liczbach" target="_blank" rel="noopener">ARE</a>, dane wstępne). Oficjalny raport roczny: 13 089 MW – stan na koniec 2025 (<a href="https://www.ure.gov.pl/download/3/20600/RaportPrezesaUREart6auOZE.pdf" target="_blank" rel="noopener">URE, raport z 25.03.2026</a>).',
  'mapa.pse_skrot_brak': 'Wiatr: brak danych PSE',
  // Etap C3 (D4, decyzja Ani 25.11.2026): neutralnie, bez „polecenie” – PSE nie podaje, czy to polecenie, czy wykonanie.
  // Dane tylko dla wiatru (pola wi_red_*; słońce PSE podaje osobno). MWh – przeliczenie OSIRIS z MW (ZRODLA.md).
  'mapa.ograniczenie_etykieta': 'Ostatnie ograniczenie wiatru w raporcie PSE:',
  'mapa.ograniczenie': (doba, mwh, kwadranse) =>
    `Ostatnie ograniczenie wiatru w raporcie PSE: doba ${doba} – ok.\u00a0${mwh}\u00a0MWh${kwadranse ? ` (${kwadranse})` : ''}`,
  'mapa.ograniczenie_kwadranse': { one: 'kwadrans', few: 'kwadranse', many: 'kwadransów' },
  'mapa.ograniczenie_brak': 'Ostatnie ograniczenie wiatru w raporcie PSE: brak danych PSE',
  'mapa.rce_etykieta': 'Cena prądu (RCE):',
  'mapa.cena_biezaca': 'Cena prądu (RCE) w bieżącej dobie:',
  'mapa.cena_brak_dzis': 'Cena prądu (RCE): brak danych na dziś',
  'mapa.cena_brak_pse': 'Cena prądu (RCE): brak danych PSE',
  'mapa.cena_kwadrans': (cena, okres) => `Cena prądu (RCE): ${cena} zł/MWh, ${okres}`,
  // Etap C3: zdanie-wniosek o cenie bieżącej doby (wariant B; D1 – czas teraźniejszy, bo ceny całej doby są znane z góry).
  // Liczby i kwadranse z rce.json (src/pse-teksty.js); część „razy” tylko przy najniższej cenie > 0 i ilorazie ≥ 1,1 (D2).
  'mapa.rce_wniosek': (tanioOkres, tanioCena, drogoOkres, drogoCena) =>
    `Dziś najtańszy kwadrans: ${tanioOkres} (${tanioCena}\u00a0zł/MWh), najdroższy: ${drogoOkres} (${drogoCena}\u00a0zł/MWh).`,
  'mapa.rce_wniosek_razy': (x) => `Najdroższy kwadrans doby kosztuje ${x} razy więcej niż najtańszy.`,
  // Remis (D3): najwcześniejszy kwadrans + ile jest jeszcze takich samych.
  'mapa.rce_remis': (okres, inne) => `${okres} i ${inne}`,
  'mapa.rce_inne': { one: 'inny', few: 'inne', many: 'innych' },
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
  // Etap C1 (decyzje Ani 25.11.2026): data wykazu z danych zamiast „obecnie”, czas przeszły (wykaz ma swoją datę).
  'leg.moce_pusty': (data) =>
    `pusty sześciokąt: według wykazu PSE${data ? ` z ${data}` : ''} wnioski do rozdzielni 220/400 kV tej stacji nie były rozpatrywane`,
  'leg.moce_110':
    'dopisek „110 kV – bez rozpatrzenia”: w wykazie PSE jest tylko rozdzielnia 110 kV tej stacji; o rozdzielniach 220/400 kV wykaz nic nie mówi',
  'leg.linie': 'Linie najwyższych napięć',
  'leg.linie_opis': '– 220 i 400 kV (grubsza linia: 400 kV); kliknij linię na mapie, by zobaczyć szczegóły',
  'leg.morskie': 'Morskie farmy wiatrowe',
  'leg.morskie_opis': '– puste kółko: brak w wykazie MKiŚ (stan: styczeń 2024) – szczegóły po kliknięciu',
  'leg.morskie_duplikaty': (ile) => `· ${ile} – widoczne po przybliżeniu`,
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
  'liczba.duplikat': { one: 'możliwy duplikat', few: 'możliwe duplikaty', many: 'możliwych duplikatów' },
  'liczba.planowana': { one: 'planowana', few: 'planowane', many: 'planowanych' },
  'liczba.odcinek': { one: 'odcinek', few: 'odcinki', many: 'odcinków' },
  'liczba.blok': { one: 'blok', few: 'bloki', many: 'bloków' },
  'liczba.stacja': { one: 'stacja', few: 'stacje', many: 'stacji' },
  'liczba.stacja_ma': { one: 'stacja ma', few: 'stacje mają', many: 'stacji ma' },
  'liczba.stacja_planowana': { one: 'stacja planowana', few: 'stacje planowane', many: 'stacji planowanych' },
  // F2.1: grupy stacji PGE – „47 grup”, „w 2 grupach”.
  'liczba.grupa': { one: 'grupa', few: 'grupy', many: 'grup' },
  'liczba.grupa_w': { one: 'grupie', few: 'grupach', many: 'grupach' },
  'licznik.ladowe': (farmy, moc, wBudowie) => `${farmy} · ${moc} · ${wBudowie} w budowie`,
  'licznik.linie': (odcinki, data) => `${odcinki} · OSM ${data}`,
  // Licznik farm morskich: „26 wpisów · 1 w rozruchu, 25 planowanych” (części bez zer – src/main.js, licznikMorskich).
  'licznik.morskie': (ile, czesci) => `${ile} · ${czesci}`,
  'licznik.w_rozruchu': (n) => `${n} w rozruchu`,
  'licznik.w_budowie': (n) => `${n} w budowie`,

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
  // Puste kółka – napisy w okienku (wartości w pliku danych zostają bez zmian, są kluczami wyżej).
  'farmy.zrodlo_mkis': 'MKiŚ',
  'farmy.pokaz.duplikat': 'możliwy duplikat: ',
  'farmy.pokaz.brak': 'brak w wykazie MKiŚ (stan: styczeń 2024) – do sprawdzenia',
  // Baltic Power: nie „działa” – bez koncesji i eksploatacji komercyjnej (decyzja Ani 25.11.2026).
  'farmy.rozruch': 'w rozruchu – część turbin produkuje',
  'farmy.aukcja_ure': (data) => `wygrał aukcję URE ${data}`,
  'farmy.aukcja_ure_baltyk1': (data, moc) => `wygrał aukcję URE ${data} (cały projekt MFW Bałtyk I: ${moc})`,
  'farmy.moc_baltic_east': (pozwolenie, aukcja) => `moc: ${pozwolenie} (maks. wg pozwolenia lokalizacyjnego) · w aukcji URE: ${aukcja}`,
  'farmy.korekta.baltic_power':
    'stan wg Northland Power (raport za III kw. 2026, 12.11.2026): wszystkie 76 turbin zainstalowane, ponad 70% produkuje prąd, ' +
    'rozruch trwa w IV kwartale 2026. Pierwsza energia do sieci: 10.07.2026 (ORLEN, Northland Power). ' +
    'Według balticpower.pl (7.10.2026) jeszcze bez koncesji na wytwarzanie, przed eksploatacją komercyjną. ' +
    'W danych EMODnet (10.07.2026) i GEM (luty 2026): w budowie.',
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
    'Sieć najwyższych napięć (220/400 kV) – dla największych odbiorców, np. fabryk i centrów danych.',
  // OSD – linki do operatorów dystrybucyjnych (25.11.2026): tylko linki do stron operatorów, danych nie pobieramy
  // (ZRODLA.md → „Operatorzy dystrybucyjni”). Obszary – „głównie”, bo obszary operatorów nie pokrywają się z regionami.
  // F2.1 (decyzja Ani 26.11.2026): PGE pokazujemy w osobnej sekcji niżej; pozostali operatorzy – nadal tylko linki.
  'moce.osd_wstep':
    'Odbiorcy przyłączają się do sieci PSE albo do sieci operatorów dystrybucyjnych (OSD). SOURCE pokazuje na razie dane PGE i Energi; pozostali operatorzy – w\u00a0linkach:',
  'moce.osd_aria': 'Strony operatorów dystrybucyjnych z informacją o dostępnej mocy',
  'moce.osd.stoen': 'Stoen Operator (Warszawa)',
  'moce.osd.pge': 'PGE Dystrybucja (głównie wschód i centrum)',
  'moce.osd.energa': 'Energa-Operator (głównie północ)',
  'moce.osd.enea': 'Enea Operator (głównie zachód)',
  'moce.osd.tauron': 'TAURON Dystrybucja (głównie południe)',
  'moce.lista1': 'Stacje dla nowych odbiorców',
  'moce.lista2': 'Stacje budowane głównie dla sieci i nowych źródeł – według PSE mogą też zasilać odbiorców',
  'moce.szacunek':
    'Wykorzystanie mocy w jednej stacji może zmniejszyć moc w sąsiednich – dlatego mocy stacji nie sumujemy.',
  'moce.zrodla_etykieta': 'Moc dla nowych źródeł:',
  'moce.stan_etykieta': 'stan na:',
  'moce.zrodla_zero': 'PSE: 0 MW dla nowych źródeł w sieci najwyższych napięć – w całej Polsce (2026 i 2031)',
  'moce.zrodla': (a, b) => `PSE: ${a} (2026) i ${b} (2031) dla nowych źródeł w sieci najwyższych napięć – w całej Polsce`,
  'moce.zrodla_brak': 'Moc dla nowych źródeł: brak danych',
  'moce.zrodla_dotyczy': 'Dotyczy nowych elektrowni, nie odbiorców prądu.',
  // Trudne słowa zakładki „Gdzie” (Etap C1, forma F1: podkreślone słowo z okienkiem C) – jedno źródło tekstu.
  'slownik.kv_termin': 'kV',
  'slownik.kv': 'napięcie, czyli „ciśnienie” w sieci: 400 i 220 kV to autostrady prądu, 110 kV – drogi krajowe',
  'slownik.rozdzielnia_termin': 'rozdzielnia',
  'slownik.rozdzielnia': 'część stacji pracująca na jednym napięciu (np. 110 kV), z której prąd rozchodzi się liniami dalej – jak węzeł autostradowy',
  // Słowo w podsumowaniu, które dostaje wyjaśnienie (forma w zdaniu).
  'slownik.rozdzielnia_w_zdaniu': 'rozdzielni',
  'slownik.aria': (termin) => `Co znaczy „${termin}”? – wyjaśnienie`,
  // Podpis w okienku zamiast linijki źródła (to nasze wyjaśnienie, nie dane).
  'slownik.objasnienie': 'objaśnienie SOURCE',
  // Etap C2 – objaśnienia w Karcie (F1). Nazwy KOBiZE i IPCC: ZRODLA.md.
  'slownik.mw_termin': 'MW, GW',
  'slownik.mw': 'megawat – miara mocy, czyli ile prądu płynie w danej chwili; 1 GW = 1 000 MW',
  'slownik.mwh_termin': 'MWh, kWh',
  'slownik.mwh': 'megawatogodzina – ilość energii: moc 1 MW przez godzinę; 1 MWh = 1 000 kWh. Na rachunku za prąd stoją kWh',
  'slownik.saldo_termin': 'saldo',
  'slownik.saldo_w_zdaniu': 'sald',
  'slownik.saldo': 'różnica między prądem, który według planu przypływa z zagranicy, a tym, który wypływa; plus – Polska kupuje, minus – sprzedaje',
  'slownik.oze_termin': 'OZE',
  'slownik.oze_w_zdaniu': 'OZE',
  'slownik.oze': 'odnawialne źródła energii – w SOURCE: wiatr, słońce, woda, biomasa i biogaz (bez odpadów)',
  'slownik.kobize_termin': 'KOBiZE',
  'slownik.kobize': 'Krajowy Ośrodek Bilansowania i Zarządzania Emisjami, działający w Instytucie Ochrony Środowiska – Państwowym Instytucie Badawczym; publikuje m.in. wskaźniki emisyjności dla energii elektrycznej',
  'slownik.ipcc_termin': 'IPCC',
  'slownik.ipcc': 'Międzyrządowy Zespół do spraw Zmian Klimatu (IPCC); jego raport AR5 (2014) podaje typowy ślad CO₂ źródeł prądu w całym cyklu życia',
  'slownik.osd_termin': 'OSD',
  'slownik.osd_w_zdaniu': 'OSD',
  'slownik.osd':
    'operator systemu dystrybucyjnego – firma, która zarządza siecią prądu niższych napięć (110 kV i mniej) w swoim regionie; to u niego mniejsze firmy składają wniosek o przyłączenie',
  'slownik.rce_termin': 'RCE',
  // RCE – tylko to, co podaje PSE (decyzja Ani 25.11.2026: bez „netto” i „prosumentów”); zdanie OSIRIS osobno, z podpisem.
  'slownik.rce': 'Rynkowa cena energii elektrycznej dla okresu rozliczenia niezbilansowania – publikowana przez PSE.',
  'slownik.rce_zrodlo': 'źródło: PSE (pse.pl, OIRE → Rynkowe ceny energii)',
  'slownik.rce_osiris': 'To cena hurtowa, nie cena z faktury firmy.',
  // Etap C3 – objaśnienia w okienku „Wiatr, słońce i cena prądu” (F1). Ograniczenie: część PSE = nazwa raportu i rubryk
  // (strona raporty.pse.pl, odczyt 25.11.2026), część OSIRIS = objaśnienie. KSE bez rozwinięcia (brak źródła w repo).
  'slownik.ograniczenie_termin': 'ograniczenie wiatru',
  'slownik.ograniczenie_pse':
    'Raport PSE „Nierynkowe redysponowanie źródeł OZE”. Dla farm wiatrowych podaje dwie rubryki, w MW: „Bilansowanie KSE” i „Zarządzanie ograniczeniami systemowymi”.',
  'slownik.ograniczenie_zrodlo': 'źródło: PSE (raporty.pse.pl → Funkcjonowanie KSE → Plany pracy KSE)',
  'slownik.ograniczenie_osiris':
    'PSE nie podaje, czy to polecenie, czy wykonane zmniejszenie. MWh to przeliczenie SOURCE z mocy w MW podanej przez PSE dla każdego kwadransa (MW × ¼ godziny).',
  'slownik.mw_mwh_termin': 'MW i MWh',
  'slownik.mw_mwh': 'MW to moc w danej chwili – jak prędkość auta; MWh to ilość energii w czasie – jak przejechane kilometry: 1 MW przez godzinę = 1 MWh.',
  // Analogia przy „nie sumujemy” (Etap C1, wariant Y).
  'moce.szacunek_analogia': 'Jak parkingi przy jednej drodze dojazdowej: im więcej aut wjedzie na jeden, tym trudniej dojechać do drugiego.',
  // Zdanie-wniosek na górze zakładki (Etap C1, wariant B, decyzje Ani 25.11.2026): liczby, daty, „0 MW” i rok z danych
  // (src/moce-teksty.js; „0 MW” i rok – ze zdań PSE w moce-pse.json → wyciag.zdania_obecne).
  // Bez podwójnego przeczenia (poprawka Ani 25.11.2026); zZastrzezeniami + bez = wszystkie stacje (test).
  'moce.wniosek_b': (dataMocy, mocIstniejacych, stacjePlanowane, zZastrzezeniami, dataWykazu, bez, rok) =>
    `Dla dużego odbiorcy: według PSE (stan na ${dataMocy}) istniejące stacje mają ${mocIstniejacych} – wolną moc mają tylko ${stacjePlanowane}. ` +
    `Przy ${zZastrzezeniami} z nich wykaz PSE z ${dataWykazu} podaje, że wnioski do części rozdzielni nie były rozpatrywane; przy ${bez} takich zastrzeżeń nie podaje. ` +
    `To szacunek operatora na ${rok} r., nie gwarancja przyłączenia.`,
  'moce.lok_okolica': (rejon, miejsce, km) =>
    `Lokalizacja przybliżona – PSE podaje tylko »${rejon}«; środek koła wybrany przez SOURCE (${miejsce}, promień ${km} km).`,
  'moce.lok_osm': (nazwa) => `Lokalizacja: planowana stacja w OpenStreetMap („${nazwa}”) – dopasowanie niepewne.`,
  'moce.lok_brak': 'Brak na mapie – PSE nie podaje miejscowości albo nie da się jej ustalić bez zgadywania.',
  'moce.w_tym_miejscu': (stacje) => `${stacje} w tym miejscu`,
  'moce.moc': (mw) => `wolna moc dla odbiorców: ${mw} (rok 2031)`,
  'moce.tabela2': 'stacja budowana głównie dla sieci i nowych źródeł – według PSE może też zasilać odbiorców',
  // Jedno brzmienie zgodne z wykazem (wymienia rozdzielnie, nie całe stacje); napięcia tej stacji z wykazu (src/moce-teksty.js).
  // ile – liczba rozdzielni (tylko EN: switchyard / switchyards); po polsku „rozdzielni” pasuje do obu.
  'moce.uwaga_pusty': (data, napiecia, ile) => `Uwaga: według wykazu PSE z ${data} wnioski do rozdzielni ${napiecia} tej stacji nie były rozpatrywane.`,
  'moce.uwaga_110': (data) =>
    `Uwaga: według wykazu PSE z ${data} wnioski do rozdzielni 110 kV tej stacji nie były rozpatrywane; o rozdzielniach 220/400 kV wykaz nic nie mówi.`,
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
  'moce.wstrzymane_pusty': (napiecia) => ` · ${napiecia} – bez rozpatrzenia`,
  'moce.wstrzymane_110': ' · 110 kV – bez rozpatrzenia',
  // napiecia – z wykazu dla tych stacji, np. „220 lub 400 kV” (src/moce-teksty.js, test w scripts/pse-moce/testy.mjs).
  'moce.podsumowanie': (ile, pelne, napiecia, tylko110, dataWykazu, dataMocy) =>
    `${ile} moc dla odbiorców. Według wykazu PSE z ${dataWykazu} w ${pelne} z nich wnioski do rozdzielni ${napiecia} nie były rozpatrywane; ` +
    `przy ${tylko110} kolejnych wykaz dotyczy tylko rozdzielni 110 kV (moce – stan na ${dataMocy}).`,
  'moce.podsumowanie_bez_wykazu': (ile) => `${ile} moc dla odbiorców. Wykaz rozdzielni PSE (gdzie wnioski nie są rozpatrywane): brak danych.`,
  'moce.sprawdzono_robot': (data) => `sprawdzono automatycznie: ${data}`,
  'moce.sprawdzono': (data) => `sprawdzono: ${data} (data przyjęcia danych)`,
  'moce.stan': (data, sprawdzono) => `stan na: ${data} · ${sprawdzono}`,
  'moce.licznik': (planowane, naMapie, stan, wykaz) => `${planowane} · ${naMapie} na mapie · stan ${stan} · ${wykaz}`,
  'moce.licznik_wykaz': (pelne, napiecia, tylko110, data) => `${pelne} bez rozpatrywania wniosków (${napiecia}), ${tylko110} – tylko 110 kV (wykaz ${data})`,
  'moce.licznik_wykaz_brak': 'wykaz rozdzielni: brak danych',
  'moce.brak': 'Wolne moce PSE: brak danych',

  // E1 „Planuję inwestycję” (decyzje Ani 26.11.2026): pole nad listą stacji w zakładce „Gdzie” (src/wyszukiwarka-mocy.js).
  // Każda stacja osobno, bez sumowania; bez ocen i rad. Twarda spacja (\u00a0) przed jednostkami i „r.” (tylko w nowych tekstach).
  'szukaj.etykieta': 'Ile MW potrzebujesz?',
  'szukaj.podpowiedz': 'np. 300',
  // Od narzędzi „Gdzie” (27.11.2026) pole MW filtruje też grupy operatorów – zdanie dla wszystkich (decyzja Ani 27.11.2026).
  'szukaj.opis':
    'Pokażemy stacje PSE i grupy stacji operatorów, przy których podano co najmniej tyle wolnej mocy na 2031\u00a0r. – każdą osobno, bez sumowania.',
  'szukaj.pasuje': (n, razem) => `Pasuje: ${n} z ${razem} stacji`,
  'szukaj.wszystkie': 'Pokaż wszystkie stacje',
  'szukaj.blad_zero': 'Wpisz liczbę większą od 0 (w\u00a0MW).',
  'szukaj.blad_liczba': 'Wpisz samą liczbę megawatów, np. 300.',
  'szukaj.blad_kropka': 'Wpisz liczbę bez kropki, np. 1500.',
  'szukaj.blad_przecinek': 'Wpisz liczbę bez przecinka, np. 1500.',
  'szukaj.blad_jednostka': 'Wpisz moc w\u00a0MW (1\u00a0GW = 1000\u00a0MW).',
  // mw, max – już z jednostką („1 500 MW”); max – największa moc przy JEDNEJ stacji, liczona z danych (nie suma).
  'szukaj.brak': (mw, data, rok, max) =>
    `Według PSE (stan na ${data}) żadna planowana stacja nie ma co najmniej ${mw} wolnej mocy dla odbiorców na\u00a0${rok}\u00a0r. ` +
    `Najwięcej przy jednej stacji: ${max}. Mocy kilku stacji nie dodajemy – wykorzystanie mocy w jednej może zmniejszyć moc w sąsiednich.`,
  'szukaj.brak_osd': 'Przyłączenia do sieci 110\u00a0kV i niższych napięć obsługują operatorzy dystrybucyjni (OSD) –',
  'szukaj.brak_osd_link': 'zobacz listę operatorów',
  'szukaj.co_dalej': 'Co dalej: wzory wniosków o warunki przyłączenia do sieci PSE –',
  'szukaj.co_dalej_link': 'strona PSE „Dokumenty”',
  'szukaj.co_dalej_sciezka': 'Wzory wniosków i umów → Wnioski o określenie warunków przyłączenia do sieci przesyłowej',
  'szukaj.moc': (rok, data) => `na\u00a0${rok}\u00a0r. · stan na ${data}`,

  // F2.1 „PGE na liście w Gdzie” (decyzje Ani 26.11.2026): grupy stacji 110 kV PGE Dystrybucja (public/data/osd-pge.json,
  // src/osd-pge.js). Zawsze rok przy MW (bez „teraz”); cytat PGE i osobno „objaśnienie SOURCE” (zasada F1);
  // moc wspólna dla grupy – bez dzielenia i bez sumowania. Twarda spacja przed MW i „r.”.
  // ── Narzędzia „Gdzie” (decyzje Ani 27.11.2026, src/gdzie-narzedzia.js): pole nazwy obok pola MW, podsumowanie
  // na operatorów (lista, operator pod operatorem), mocy nie sumujemy. mw – już z jednostką (twarda spacja).
  'gdzie.nazwa_etykieta': 'Szukaj stacji po nazwie',
  'gdzie.nazwa_podpowiedz': 'np. Kutno',
  'gdzie.nazwa_opis': 'Szukamy w stacjach PSE i w grupach stacji operatorów dystrybucyjnych – wystarczy fragment nazwy.',
  'gdzie.nazwa_wyczysc': 'Wyczyść',
  'gdzie.naglowek_mw': (rok, mw) => `Pasuje (${rok} r., co najmniej ${mw}):`,
  'gdzie.naglowek_nazwa': (tekst) => `Stacje z „${tekst}” w nazwie:`,
  'gdzie.naglowek_oba': (rok, mw, tekst) => `Pasuje (${rok} r., co najmniej ${mw}, „${tekst}” w nazwie):`,
  'gdzie.lista_aria': 'Wynik według operatorów',
  'gdzie.operator.pse': 'PSE',
  'gdzie.operator.pge': 'PGE Dystrybucja',
  'gdzie.operator.energa': 'Energa-Operator',
  // „3 z 25 stacji”, „5 z 47 grup” – po „z N” zawsze dopełniacz liczby mnogiej.
  // Słowo zdejmowane z początku opisu PSE w podsumowaniu (stoi już w zdaniu „PSE – stacja …”).
  'gdzie.stacja_slowo': 'stacja',
  'gdzie.jednostka.stacja': 'stacji',
  'gdzie.jednostka.grupa': 'grup',
  'gdzie.liczba': (operator, n, razem, jednostka) => `${operator} – ${n} z ${razem} ${jednostka}`,
  'gdzie.lista.grupa': (operator, n, nazwy) => (n === 1 ? `${operator} – grupa ${nazwy}` : `${operator} – grupy: ${nazwy}`),
  'gdzie.lista.stacja': (operator, n, nazwy) => (n === 1 ? `${operator} – stacja ${nazwy}` : `${operator} – stacje: ${nazwy}`),
  'gdzie.brak': (operator) => `${operator} – brak`,
  'gdzie.brak_danych': (operator) => `${operator} – brak danych`,
  'gdzie.do_listy': 'przejdź do listy',
  'gdzie.dokladne': (nazwa, grup) => `Stacja o nazwie „${nazwa}” jest w ${grup} – mogą to być różne miejsca o tej samej nazwie.`,
  'gdzie.nie_sumujemy': 'Moc nie jest sumowana między operatorami ani grupami.',
  'osd.tytul': 'Wolna moc dla odbiorców · PGE Dystrybucja 110\u00a0kV',
  'osd.stan': (data) => `stan na ${data}`,
  'osd.liczba_grup_aria': 'Liczba grup – wyjaśnienie',
  'osd.liczba_grup_wyjasnienie': (n, wTekscie) => `${n} grup według tabel PGE (tekst dokumentu podaje ${wTekscie}).`,
  'osd.pge': 'PGE:',
  'osd.cytat': (tekst) => `„${tekst}”`,
  'osd.cytat_podpis': (strony) => `źródło: PGE Dystrybucja, informacja o łącznej dostępnej mocy przyłączeniowej, s.\u00a0${strony}`,
  'osd.objasnienie_grupy': 'Jedna liczba MW dotyczy całej grupy stacji – nie dzielimy jej na stacje i nie dodajemy grup.',
  'osd.lista_tytul': 'Grupy stacji 110\u00a0kV – kolejność jak w tabeli PGE',
  'osd.wiersz_grupa': (nazwa, stacji) => `Grupa ${nazwa} · ${stacji}`,
  'osd.wiersz_mw': (rokA, a, rokB, b) => `${rokA}: ${a} · ${rokB}: ${b}`,
  'osd.pokaz_stacje': 'stacje w grupie',
  'osd.gwiazdka': (cytat) => `* PGE: ${cytat}`,
  'osd.szacunek': (cytat) => `Wartości szacunkowe – PGE: ${cytat}`,
  'osd.przetworzone': (data) => `Odczyt tabeli z PDF i przetworzenie: SOURCE; pobrano ${data}. SOURCE nie jest powiązany z PGE Dystrybucja S.A.`,
  'osd.zrodlo_nazwa': 'PGE Dystrybucja',
  'osd.pasuje': (n, razem, rok) => `Pasuje: ${n} z ${razem} grup PGE na\u00a0${rok}\u00a0r. (moc wspólna dla całej grupy)`,
  // mw, max – już z jednostką; max – największa moc w JEDNEJ grupie (z danych, nie suma).
  'osd.brak': (data, mw, rok, max) =>
    `Według danych PGE (stan na ${data}) żadna grupa nie miała ${mw} w\u00a0${rok}\u00a0r. Najwięcej w jednej grupie: ${max} w\u00a0${rok}\u00a0r.`,
  'osd.brak_danych': 'Dane PGE: brak danych',
  'cytat.oryginal_pge': (tekst) => `oryginał PGE: „${tekst}”`,
  // ── F2.2 „Energa w Gdzie” (decyzje Ani 26–27.11.2026): grupy stacji 110 kV Energa-Operator (src/osd-energa.js) ──
  // Cytaty Energi dosłownie z public/data/osd-energa.json (tłumaczenia: src/teksty/cytaty-osd.js); rok 2035 tylko w „?”.
  'osd.energa.tytul': 'Wolna moc dla odbiorców · Energa-Operator 110\u00a0kV',
  'osd.energa.grupy_wstep': 'Energa – grupy węzłów koherentnych, czyli',
  'osd.energa.cytat_podpis': (strony) =>
    `źródło: Energa-Operator, informacja o wartości łącznej dostępnej odbiorczej mocy przyłączeniowej, s. ${strony}`,
  'osd.energa.lista_tytul': 'Grupy stacji 110 kV – kolejność jak w tabeli Energi',
  'osd.energa.wiersz_grupa': (nazwa, stacji) => `Grupa ${nazwa} · ${stacji} (model sieci na 2026 r.)`,
  'osd.energa.pytajnik_aria': (nazwa) => `Grupa ${nazwa} – rok 2035 i uwagi`,
  'osd.energa.grupa_tytul': (nazwa) => `Grupa ${nazwa}`,
  // mw – już z jednostką.
  'osd.energa.rok_docelowy': (rok, mw) => `${rok} (rok docelowy według Energi): ${mw}`,
  'osd.energa.rok_docelowy_brak': (rok) => `${rok} (rok docelowy według Energi): bez osobnej wartości – Energa:`,
  'osd.energa.rok_docelowy_opis': (cytat) => `Rok docelowy – Energa: ${cytat}`,
  // Uwagi SOURCE do odczytu PDF (potwierdzone przez Anię 26.11.2026); stacje – nazwy z danych.
  'osd.energa.uwaga.gwiazdka_bez_objasnienia': (stacje) => `Przy stacjach ${[].concat(stacje).join(' i ')} Energa postawiła gwiazdkę bez objaśnienia.`,
  'osd.energa.uwaga.kutno_bez_przecinka': (stacje) => `„${[].concat(stacje)[0]}” – w dokumencie bez przecinka; mogą to być dwie stacje.`,
  // Zmiana grupy – przy stacji w starej grupie (decyzja Ani 27.11.2026); w nowej grupie stacji nie pokazujemy.
  'osd.energa.przeniesienie': (rok, nr, nazwa) => `od ${rok} w grupie ${nr} (${nazwa})`,
  // Nowe stacje – lata jak w PDF, bez „od” (decyzja Ani 27.11.2026): „Mielno (2028–2035)”.
  'osd.energa.nowe_stacje': 'nowe stacje w kolejnych latach:',
  'osd.energa.szacunek': (cytat) => `Wartości szacunkowe – Energa: ${cytat}`,
  'osd.energa.inwestycje': (rokA, rokB) => `Wzrost mocy w latach ${rokA}–${rokB} – Energa: `,
  'osd.energa.czerwone': (cytat) => `* Energa: ${cytat}`,
  'osd.energa.zrodlo_nazwa': 'Energa-Operator',
  'osd.energa.przetworzone': (data) =>
    `Odczyt tabel z PDF i przetworzenie: SOURCE; pobrano ${data}. SOURCE nie jest powiązany z Energa-Operator S.A.`,
  'osd.energa.pasuje': (n, razem, rok) => `Pasuje: ${n} z ${razem} grup Energi na ${rok} r. (moc wspólna dla całej grupy)`,
  // mw, max – już z jednostką; max – największa moc w JEDNEJ grupie (z danych, nie suma).
  'osd.energa.brak': (data, mw, rok, max) =>
    `Według danych Energi (stan na ${data}) żadna grupa nie miała ${mw} w ${rok} r. Najwięcej w jednej grupie: ${max} w ${rok} r.`,
  'osd.energa.brak_danych': 'Dane Energi: brak danych',
  'cytat.oryginal_energa': (tekst) => `oryginał Energi: „${tekst}”`,
  // Linijka z projektu planu rozwoju sieci PSE 2027–2036 (public/data/plan-rozwoju-pse.json; ZRODLA.md).
  'plan.linia': (miesiac, od, doRoku) =>
    `Projekt planu rozwoju sieci PSE (${miesiac}, przed uzgodnieniem z\u00a0URE) – zadanie budowy stacji: ${od}–\u2060${doRoku} (rozpoczęcie – zakończenie zadania)`,
  'plan.krotko': (od, doRoku) => `Projekt planu PSE – zadanie budowy stacji: ${od}–\u2060${doRoku}`,
  'plan.krotko_aria': (stacja) => `${stacja} – zastrzeżenia PSE i projekt planu rozwoju sieci`,
  // Skróty przypisów PSE na wierzchu (wariant A, decyzja Ani 26.11.2026); pełne brzmienie z oryginałem – w okienku „?”.
  // (1) i (4): PSE pisze o „zasadności i terminie/harmonogramie” – czyli czy i kiedy; (2): tylko termin; (6): harmonogram.
  'plan.skrot.1': '· realizacja zależy od odbiorców (PSE)',
  'plan.skrot.2': '· termin zależy od budowy elektrowni, zakładu odbiorcy lub magazynu energii (PSE)',
  'plan.skrot.4': '· realizacja zależy od budowy Portu Polska (PSE)',
  'plan.skrot.6': '· harmonogram zależy od liczby, mocy i budowy bloków (PSE)',
  'plan.okienko_tytul': 'Projekt planu rozwoju sieci PSE',
  'plan.niepewne.POM':
    'Dopasowanie niepewne: w planie – rozbudowa istniejącej stacji 110\u00a0kV Pomorzany o rozdzielnię 220\u00a0kV; w wykazie mocy PSE – stacja planowana.',
  // Przypisy PSE przy latach (str. 62 i 76) – prostymi słowami, bez zmiany sensu; oryginał w objaśnieniu („PSE”).
  'plan.przypis.1': 'PSE: czy i kiedy zadanie zostanie zrealizowane, zależy od tego, czy na tym terenie powstaną i rozwiną się odbiorcy prądu.',
  'plan.przypis.2': 'PSE: termin zależy od tego, czy i kiedy powstanie elektrownia, zakład odbiorcy albo magazyn energii.',
  'plan.przypis.4': 'PSE: czy i kiedy zadanie zostanie zrealizowane, zależy od budowy infrastruktury Portu Polska.',
  'plan.przypis.6': 'PSE: harmonogram zależy od liczby bloków energetycznych, ich mocy i harmonogramu ich budowy.',
  'plan.cytat': (tekst) => `„${tekst}”`,
  'plan.zrodlo': (strony) => `źródło: PSE, projekt planu rozwoju sieci 2027–2036, str.\u00a0${strony}`,
  'slownik.zakonczenie_pse': 'Data zakończenia zadania „zarówno pod względem technicznym jak i finansowym i formalnym”.',
  'slownik.zakonczenie_osiris': 'To nie jest dzień, w którym stacja zaczyna działać.',
  // Decyzja Ani 26.11.2026: budowa stacji i linii do niej to w planie osobne zadania – lat linii nie pokazujemy.
  'slownik.zakonczenie_linie': 'Linie, które doprowadzą prąd do stacji, są w planie osobnymi zadaniami – czasem z późniejszym terminem.',
  'slownik.ure': 'Urząd Regulacji Energetyki – jego prezes uzgadnia plan rozwoju sieci PSE.',

  // ── ILE I JAK CZYSTO: liczba-bohater, pasek, paski mocy, trzy liczby ──
  'karta.miks_aria': 'Miks produkcji w Polsce',
  'karta.moce_tytul': 'Ile pracuje z tego, co mamy',
  'karta.moce_aria': 'Produkcja teraz na tle mocy zainstalowanej',
  'karta.uwaga_dostepna': 'Moc zainstalowana to nie moc dostępna: część bloków stoi w remoncie albo w rezerwie.',
  'karta.uwaga_pogoda': 'Wiatr i słońce pracują, gdy wieje i świeci – krótki pasek to pogoda albo pora dnia, a nie awaria.',
  'karta.pytajnik_znak': '„?” –',
  'karta.niepewnosc':
    'PSE w raporcie podaje jedną moc dla wiatru (na lądzie i na morzu), słońca i innych OZE – bez podziału. Raport nie podaje też, czy i jak ta moc obejmuje panele na dachach. Wody tu nie wliczamy.',
  'karta.uwaga_bez_paska': 'Bez paska: woda, olej, odpady i „inne” – raport PSE nie podaje dla nich mocy, którą da się porównać z produkcją.',
  'karta.uwaga_mapa': 'Mapa pokazuje tylko większe elektrownie, dlatego suma mocy na mapie (zakładka „Skąd”) jest mniejsza.',
  'karta.raport_kse': 'PSE, Raport 2025 KSE, Tabela 1.1',
  'karta.cena_rce': 'Cena RCE',
  // Etap C2: jedno znaczenie w PL i EN (decyzja Ani 25.11.2026).
  'karta.slad_co2': 'Ślad CO<sub>2</sub> w cyklu życia',
  'karta.wymiana': 'Wymiana z zagranicą (planowa)',
  'karta.przetworzenie': 'przetworzenie i ślad CO2: SOURCE',
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
  'karta.wymiana_zero': 'ok. 0\u00a0GW',
  'karta.wymiana_zero_opis': 'prawie bez wymiany',
  // Etap C2 (odbiór 25.11.2026): wymiana w GW z jednym miejscem po przecinku – jak produkcja.
  // Twarda spacja – liczba i „GW” zawsze w jednym wierszu (wąski kafelek).
  'karta.wymiana_kupuje': (gw) => `kupuje ok. ${gw}\u00a0GW`,
  'karta.wymiana_sprzedaje': (gw) => `sprzedaje ok. ${gw}\u00a0GW`,
  'karta.wymiana_planowo': 'planowo',
  'karta.plakietka_brak_powod': (powod) => `Brak danych o miksie: ${powod}.`,
  'karta.plakietka_brak': 'Brak danych PSE o miksie.',
  'karta.plakietka_nie_najnowsze': (powod, stan) => `Dane nie są najnowsze: ${powod}. Pokazujemy stan na ${stan}.`,
  'karta.plakietka_stare': (godzin, stan) => `Dane sprzed ponad ${godzin} godzin. Pokazujemy stan na ${stan}.`,
  // Powody plakietki z karta.json (scripts/karta/pobierz.mjs) – dokładnie te teksty (pilnuje test).
  'karta.powod.sprawdzian': 'nowe dane nie przeszły sprawdzianu',
  'karta.powod.pobranie': 'nie udało się pobrać nowych danych PSE',
  // Czas przeszły – liczba dotyczy kwadransu z danych (odbiór C2, 25.11.2026).
  'karta.bohater_oze': 'prądu w Polsce pochodziło z OZE (źródeł odnawialnych)',
  'karta.bohater_wegiel': 'prądu w Polsce pochodziło z węgla',
  'karta.krotko_oze': 'z OZE',
  'karta.krotko_wegiel': 'z węgla',
  'karta.stan': (stan) => `stan na ${stan}`,
  // Zwinięta linijka Karty (tryb spokojny, wariant 1A): „56% z węgla · PSE, stan na 08:15”.
  'karta.skrot': (co, stan) => `${co} · PSE, stan na ${stan}`,
  // ── Etap C2 (decyzje Ani 25.11.2026): pierwszy ekran P1 – zwinięta Karta: jedna linijka = jedno pytanie (odbiór 25.11.2026):
  // 1. udziały i produkcja, 2. cena RCE, 3. wolna moc PSE, 4. „PSE, stan na …”; na telefonie kafelki 2×2;
  // każda linijka otwiera Kartę na swojej zakładce. Liczby z danych (src/karta-teksty.js, testy w scripts/karta/testy-panel.mjs).
  'karta.skrot_produkcja': (gw) => `produkcja ${gw} GW`,
  'karta.skrot_oze': (p) => `OZE ${p}`,
  'karta.skrot_wegiel': (p) => `węgiel ${p}`,
  'karta.skrot_rce': (cena) => `RCE ${cena} zł/MWh`,
  // Wolna moc: liczba stacji planowanych i rok z danych (nie sugeruje mocy „dziś”). Twarda spacja – nawias „(na 2031)” się nie rozdziela.
  'karta.skrot_moce': (stacje, rok) => `wolna moc PSE: ${stacje} (na\u00a0${rok})`,
  'karta.skrot_stan': (stan) => `PSE, stan na ${stan}`,
  'karta.kafel_udzial': 'z produkcji',
  'karta.kafel_rce': 'cena RCE',
  'karta.kafel_moce': (rok) => `wolna moc PSE (na ${rok})`,
  'karta.kafel_aria': (co) => `${co} – otwiera Kartę Polski`,
  // Krótki wniosek pierwszego ekranu (czas przeszły, kwadrans z danych). K1 – z liczbami.
  // Wariant K2: sam wniosek, bez powtarzania liczb z nagłówka. „większość” przy ≥ 50%, „najwięcej” – gdy ta grupa ma najwięcej.
  'karta.wniosek_krotki': (okres, wiekszosc, k1) =>
    wiekszosc ? `W kwadransie ${okres} większość prądu wyprodukowanego w Polsce pochodziła ${k1}.` : `W kwadransie ${okres} najwięcej prądu wyprodukowanego w Polsce pochodziło ${k1}.`,
  // Pełniejszy wniosek – zakładka „Ile i jak czysto”. „w większości” tylko przy udziale ≥ 50%.
  'karta.wn_produkcja': (okres, gw) => `W kwadransie ${okres} Polska produkowała ${gw} GW`,
  // Poniżej 50%: ten sam styl (odbiór C2) – „najwięcej” tylko, gdy ta grupa ma najwięcej (jak w krótkim wniosku); inaczej sama liczba.
  'karta.wn_udzialy': (wiekszosc, k1, p1, k2, p2, najwiecej) =>
    wiekszosc ? ` – w większości ${k1} (${p1}), a ${p2} ${k2}.` : najwiecej ? ` – najwięcej ${k1} (${p1}), a ${p2} ${k2}.` : ` – ${p1} ${k1}, a ${p2} ${k2}.`,
  'karta.wn_kupuje': (gw) => ` Według planu PSE kupowała za granicą ok. ${gw} GW.`,
  'karta.wn_sprzedaje': (gw) => ` Według planu PSE sprzedawała za granicę ok. ${gw} GW.`,
  'karta.wn_co2': (g) => ` Szacunek SOURCE dla tego kwadransa: ok. ${g} g CO₂eq na każdą kWh, licząc cały cykl życia elektrowni.`,
  // „Ile pracuje z tego, co mamy”: zapotrzebowanie PSE (pole demand) i wiatr + słońce – procent od produkcji w Polsce.
  // Wymiana – tylko saldo PSE (swm_p + swm_np), nie różnica zapotrzebowanie − produkcja (ZRODLA.md).
  'karta.zapotrzebowanie': (zap, prod, wymiana) => `Zapotrzebowanie (PSE): ${zap} GW · produkcja w Polsce: ${prod} GW · wymiana: ${wymiana}`,
  'karta.wiatr_slonce_z': (x, y, p) => `Wiatr i słońce dały ${x} GW z ${y} GW produkcji (${p}).`,
  'karta.cena_kwh': (x) => `= ${x} zł/kWh`,
  'karta.opublikowalo': (kiedy) => ` · PSE opublikowało ${kiedy}`,
  'karta.podpis': (okres, stan) => `w kwadransie ${okres} · z produkcji w Polsce · ${stan}`,
  // Ślad CO2 w ekwiwalencie (CO₂eq) – mediany IPCC są w ekwiwalencie (decyzja Ani 23.11.2026, obie wersje mówią to samo).
  'karta.co2_wartosc': (g) => `ok. ${g} g CO₂eq/kWh`,
  'karta.co2_opis': 'szacunek SOURCE',
  'karta.co2_dokladnie': (x) => `${x} g CO₂eq/kWh`,
  'karta.sprawdzian': (kwadranse, mw) => `${kwadranse} wspólnych kwadransów, największa różnica ${mw} MW`,
  'okienko_polski.naglowek': (krotko) => `Polska · prąd ${krotko}`,
  'okienko_polski.tu': (wartosc) => `tu jesteśmy: ${wartosc} – szacunek SOURCE wg IPCC`,
  'okienko_polski.zdanie': 'z produkcji w Polsce · dane PSE co 15 min',
  'okienko_polski.razem': '= razem',
  'okienko_polski.co2_tytul': 'Ślad CO<sub>2</sub> w cyklu życia',
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
    '<strong>Ślad CO<sub>2</sub> – szacunek SOURCE:</strong> produkcja z każdego paliwa × typowy ślad CO<sub>2</sub> w całym cyklu życia elektrowni, ' +
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
  'stopka.prosumenci':
    'Moc paneli fotowoltaicznych prosumentów: Agencja Rynku Energii S.A., <a href="https://www.are.waw.pl/badania-statystyczne/energetyka-w-liczbach" target="_blank" rel="noopener">„Energetyka w liczbach”</a>, wykres „Prosumenci energii odnawialnej – moc zainstalowana”, stan na koniec września 2026, dane wstępne, odczyt 27.11.2026; Prezes URE, <a href="https://www.ure.gov.pl/download/3/20600/RaportPrezesaUREart6auOZE.pdf" target="_blank" rel="noopener">raport o mikroinstalacjach za 2025 r.</a> (art. 6a ustawy OZE, 25.03.2026), Tabela 3. Zaokrąglone do 1 MW.',
  'stopka.karta':
    'Karta Polski (miks paliw, wymiana z zagranicą): PSE S.A., raporty his-gen-pal-sire i his-wlk-cal, dane pobrane <span id="karta-pobrano">wczytywanie…</span>, przetworzone (udziały, sprawdzian; ślad CO2 (CO₂eq) – szacunek SOURCE wg IPCC AR5 i wskaźników KOBiZE, metoda w panelu „Metodologia”).',
  'stopka.morskie':
    'Morskie farmy wiatrowe: <a href="https://emodnet.ec.europa.eu/en/" target="_blank" rel="noopener">EMODnet</a> Human Activities, Wind Farms (twórca danych: CETMAR, stan 10.07.2026), <a href="https://creativecommons.org/licenses/by/4.0/deed.pl" target="_blank" rel="noopener">CC BY 4.0</a>; wybrano tylko farmy w polskich obszarach morskich; porównane z <a href="https://www.gov.pl/web/morska-energetyka-wiatrowa/obecnie-realizowane-projekty-w-polsce" target="_blank" rel="noopener">listą projektów MKiŚ</a> (stan: styczeń 2024) – puste kropki: prawdopodobny duplikat albo brak na liście.',
  'stopka.baltic':
    'Status Baltic Power według <a href="https://northlandpower.com/northland-power-reports-third-quarter-2026-results-value-accretive-growth-updates-and-reaffirms-2026-guidance/" target="_blank" rel="noopener">Northland Power</a> (raport za III kw. 2026, 12.11.2026) i <a href="https://balticpower.pl/" target="_blank" rel="noopener">balticpower.pl</a> (7.10.2026). ' +
    'Wyniki pierwszej aukcji dla morskich farm wiatrowych: <a href="https://www.ure.gov.pl/pl/urzad/informacje-ogolne/aktualnosci/13009,Offshore-Pierwsza-aukcja-dla-morskich-farm-wiatrowych-rozstrzygnieta.html" target="_blank" rel="noopener">URE</a> (komunikat z 18.12.2025).',
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
    'Stacje, do których wnioski nie były rozpatrywane według wykazu (pusty sześciokąt – wykaz obejmuje rozdzielnię 220/400 kV; gdy tylko 110 kV – pełny sześciokąt i uwaga w okienku): PSE S.A., <a href="https://www.pse.pl/dane-systemowe/praca-kse/informacje-ogolne/wykaz-obiektow-planowanych-do-przylaczenia" target="_blank" rel="noopener">„Wykaz rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów”</a>, stan na 04.02.2026 (starszy niż moce – stan na 31.10.2026), plik pobrany 21.11.2026, przetworzone (wyciąg list 2 i 3).',
  'stopka.miejsca':
    'Miejsca stacji: OpenStreetMap (ODbL) – planowane stacje z OSM albo koła 20 km wokół miejscowości z opisu PSE (lokalizacja przybliżona, wybór SOURCE).',
  // F2.1: grupy stacji PGE w zakładce „Gdzie” (public/data/osd-pge.json, ZRODLA.md). Link do strony, nie do pliku z wersją.
  'stopka.osd_pge':
    'Grupy stacji 110\u00a0kV z wolną mocą dla odbiorców (zakładka „Gdzie”): PGE Dystrybucja S.A., <a href="https://pgedystrybucja.pl/przylaczenia/procedury-przylaczeniowe/informacja-o-lacznej-dostepnej-mocy-przylaczeniowej" target="_blank" rel="noopener">„Informacja o łącznej dostępnej mocy przyłączeniowej” – III kwartał 2026</a>, stan na 30.09.2026, plik pobrany 26.11.2026, przetworzone (odczyt tabeli mocy odbiorczej; mocy grup nie sumujemy). Wartości szacunkowe według PGE. SOURCE nie jest powiązany z PGE Dystrybucja S.A.',
  'stopka.osd_energa':
    'Grupy stacji 110\u00a0kV Energa-Operator z wolną mocą dla odbiorców (zakładka „Gdzie”): Energa-Operator S.A., <a href="https://energa-operator.pl/przylaczenie-do-sieci/informacje-o-stanie-przylaczen" target="_blank" rel="noopener">„Informacja o wartości łącznej dostępnej odbiorczej mocy przyłączeniowej” (napięcie wyższe niż 1\u00a0kV)</a>, stan na 31.08.2026, plik pobrany 26.11.2026, przetworzone (odczyt tabel 2.1 i 2.3; mocy grup nie sumujemy). Wartości szacunkowe według Energi. SOURCE nie jest powiązany z Energa-Operator S.A.',
  'stopka.linie':
    'Linie najwyższych napięć: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener">ODbL</a> (podpis widoczny też stale na mapie, w prawym dolnym rogu).',
  'stopka.czcionki':
    'Czcionki: Inter, JetBrains Mono i Outfit (logo), SIL Open Font License 1.1 (<a href="/licencje/OFL-Inter.txt" target="_blank" rel="noopener">licencja Inter</a>, <a href="/licencje/OFL-JetBrains-Mono.txt" target="_blank" rel="noopener">licencja JetBrains Mono</a>, <a href="/licencje/OFL-Outfit.txt" target="_blank" rel="noopener">licencja Outfit</a>); pliki czcionek są na naszym serwerze.',
  // ── Strona „O nas” (/o-nas/) – tekst Ani (25.11.2026) z poprawkami 1–7 przyjętymi przez Anię. Treść w HTML (bez skryptu). ──
  'onas.meta.tytul': 'O nas · SOURCE – energia w Polsce',
  'onas.meta.opis': 'Kto stoi za SOURCE i jak to zbudowaliśmy: dane z publicznych źródeł, praca z pomocą AI pod kontrolą ludzi i reguł.',
  'onas.logo_aria': 'SOURCE – strona główna',
  'onas.tytul': 'O nas',
  'onas.projekt_tytul': 'O projekcie',
  'onas.projekt':
    'SOURCE pokazuje w jednym miejscu, skąd Polska bierze prąd, ile on kosztuje i gdzie da się podłączyć nowe inwestycje. ' +
    'Wszystkie dane pochodzą z publicznych źródeł – m.in. PSE, URE, OpenStreetMap i EMODnet – przy każdej liczbie jest źródło i data.',
  'onas.kto_tytul': 'Kto za tym stoi',
  'onas.anna':
    '<strong>Anna Kołodziejczyk</strong> – twórczyni i prowadząca rozmowy „Anna Kołodziejczyk | AI Revolution” z ludźmi, którzy kształtują sztuczną inteligencję. ' +
    'Wyznacza kierunek i wygląd SOURCE i decyduje, co trafia na stronę.',
  'onas.rafael':
    '<strong>Rafael Knuth</strong> – doradca i trener. Pomaga zespołom biznesowym i technicznym budować z AI tak, żeby efekt wytrzymał lata: ' +
    'według wspólnych zasad inżynierskich i reguł, które obowiązują tak samo człowieka, jak agenta AI. Mentor projektu.',
  'onas.jak_tytul': 'Jak to zbudowaliśmy',
  'onas.jak':
    'AI pisze szybko – dlatego o tym, co trafia na stronę, decydują ludzie i reguły. SOURCE zbudowaliśmy w kilka tygodni z pomocą AI (Claude Code). ' +
    'Każda zmiana jest najpierw oglądana i sprawdzana, a dopiero potem publikowana. ' +
    'Robot co tydzień sprawdza, czy PSE opublikowało nowy dokument o wolnej mocy przyłączeniowej; dane o prądzie odświeżamy co 4 godziny. ' +
    'Kod jest publiczny <a href="https://github.com/duchowablondyna-sketch/osiris-ania-rafael" target="_blank" rel="noopener noreferrer">na GitHubie<span class="tylko-czytnik"> (otwiera się w nowej karcie)</span></a>.',
  'onas.czym_tytul': 'Czym SOURCE nie jest',
  'onas.czym':
    'To nie jest oficjalny serwis PSE ani operatorów sieci. Wyliczenia własne (np. ślad CO₂) oznaczamy jako „szacunek SOURCE”. ' +
    'Wolna moc to szacunek operatora, a nie gwarancja przyłączenia.',
  'onas.kontakt_tytul': 'Kontakt',
  'onas.linkedin_anna': 'Anna Kołodziejczyk na LinkedIn',
  'onas.linkedin_rafael': 'Rafael Knuth na LinkedIn',
  'onas.nowa_karta': '(otwiera się w nowej karcie)',
  'onas.dol_aria': 'Dalej',
  'onas.strona_glowna': 'Strona główna',
  'onas.mapa': 'Mapa',
  'onas.zrodla_info': 'Źródła i licencje wszystkich danych – w stopce mapy.',
  'stopka.o_nas': 'O nas',
  // Prawa autorskie (decyzja Ani 25.11.2026): komputer – w wierszu stopki obok „O nas”; telefon – na górze rozwiniętej
  // sekcji „Źródła i licencje”; zawsze na dole strony „O nas”. Jeden tekst dla wszystkich trzech miejsc.
  'stopka.prawa': '© 2026 Anna Kołodziejczyk, Rafael Knuth. Wszelkie prawa zastrzeżone.',
};
