# Źródła danych projektu OSIRIS

Poziomy weryfikacji:
- 0 = zajawka z wyszukiwarki, strona nieotwarta
- 1 = Claude otworzył i przeczytał stronę w całości
- 2 = drugie sprawdzenie innym narzędziem (Claude w Chrome, Copilot)
- 3 = człowiek przeczytał źródło i potwierdził
- 4 = potwierdzone w źródle pierwotnym (np. dane z API, tekst licencji u autora)

## Natural Earth: kontur Polski

- **Co:** granice państw, warstwa Admin 0 – Countries, skala 1:10m (GeoJSON).
- **Używamy w:** `public/data/polska-kontur.geojson` (tło mapy).
- **Wersja:** tag `v5.1.2`, commit `f1890d9` (`f1890d9f152c896d250a77557a5751a93d494776`), data wydania 13.05.2022.
- **Wydanie:** https://github.com/nvkelso/natural-earth-vector/releases/tag/v5.1.2
- **Dokładny link do pliku:** https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson
- **SHA-256 pliku źródłowego:** `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255`
- **Przetworzenie:** skrypt `scripts/wytnij-polske.mjs` wybiera tylko obiekt z `ADM0_A3 = "POL"`; geometria bez zmian, atrybuty zastąpione nazwą i źródłem.
- **Licencja:** public domain (domena publiczna), https://www.naturalearthdata.com/about/terms-of-use/
- **Data sprawdzenia:** 18.11.2026
- **Poziom weryfikacji:** 1

## PSE: produkcja z wiatru

- **Co:** produkcja z wiatru, raport „Wielkości podstawowe” (`his-wlk-cal`), pole `wi`, okresy 15-minutowe.
- **Używamy w:** `public/data/wiatr.json`, generowany przy budowaniu przez `scripts/pobierz-pse.mjs` (okienko na mapie). Od 20.11.2026 także `public/data/doba.json` – odtworzenie doby: wczorajsza pełna doba (96 kwadransów; w dniu zmiany czasu 92/100), a gdy wczoraj niepełne – przedwczoraj; bez uzupełniania luk. Uwaga: wiatr za wczoraj bywa kompletny dopiero ok. 3:00 (doba 19.11.2026: publikacja 20.11.2026, 02:52).
- **Link:** https://api.raporty.pse.pl/api/his-wlk-cal (API), https://raporty.pse.pl/ (raporty)
- **Jednostka:** MW – niepotwierdzona w źródle (API nie podaje jednostki).
- **Aktualność:** dane z bieżącej doby, opóźnienie ok. 1 godz. (sprawdzone 18.11.2026 14:23); czy wartości są wstępne – niepotwierdzone.
- **Przetworzenie:** wybieramy ostatni rekord z wartością `wi`, zaokrąglamy do pełnych MW.
- **Licencja:** Warunki ponownego wykorzystywania informacji z www.pse.pl: podanie źródła i daty pobrania, informacja o przetworzeniu, bez logo PSE (przeczytane w całości przez Claude w czacie, poziom 1). Czy obejmują API raporty.pse.pl – niepotwierdzone; na etapie prototypu stosujemy te warunki.
- **Data sprawdzenia:** 18.11.2026
- **Poziom weryfikacji:** 1

### PSE: ograniczenia wiatru (raport poze-redoze)

- **Co:** raport „Nierynkowe redysponowanie źródeł OZE” (`poze-redoze`), okresy 15-minutowe (96 na dobę).
- **Używamy w:** `public/data/wiatr.json`, pole `ograniczenie`, generowany przy budowaniu przez `scripts/pobierz-pse.mjs` (tekst w okienku pod produkcją wiatru).
- **Link:** https://api.raporty.pse.pl/api/poze-redoze (API), https://raporty.pse.pl/ (raport)
- **Opis pól:** „Mapowanie endpointów API” (przewodnik migracji API V1 → V2), https://api.raporty.pse.pl/EndpointsMap.pdf – przeczytany tylko fragment o tym raporcie (tekst wyciągnięty z PDF Pythonem, bez programu do PDF), poziom 1:
  - `wi_red_balance` – „Źródło Wiatrowe – Bilansowanie KSE” (ograniczenie z powodu bilansu całego systemu),
  - `wi_red_network` – „Źródło Wiatrowe – Zarządzanie ograniczeniami systemowymi” (ograniczenie z powodu ograniczeń sieci).
  - Dokument nie podaje jednostki ani definicji. Wyjaśnienia w nawiasach to opis Claude, nie PSE.
- **Wartości:** ujemne (ograniczenie); brak ograniczenia = pole puste (`null`), zer w danych nie widzieliśmy. Rekordy na dobę D pojawiają się z pustymi polami już ok. 00:10 doby D−1.
- **Jednostka:** zakładamy MW – **niepotwierdzone przez PSE**, poziom 1. Sprawdzenie: suma `wi_red_balance` + `wi_red_network` za październik 2025 ÷ 4 = 110,5 GWh (zapytanie 19.11.2026); Gramwzielone.pl za Forum Energii podaje dla października 2025 105,2 GWh ograniczeń wiatru na polecenie PSE (https://www.gramwzielone.pl/energia-wiatrowa/20341453/rekord-produkcji-energii-wiatrowej-w-polsce-i-rekordowe-wylaczenia, 18.11.2025, przeczytany w całości 19.11.2026, źródło wtórne). Przy jednostce MWh na kwadrans wyszłoby 442 GWh, więc MW pasuje; przyczyna różnicy ok. 5% – nieznana.
- **Przetworzenie:** najnowsza doba z ostatnich 120 dni, w której `wi_red_balance` lub `wi_red_network` ma wartość; suma obu pól ze wszystkich kwadransów tej doby ÷ 4, wartość dodatnia, zaokrąglona do pełnych MWh.
- **Uwagi:** dane mogą być **poleceniami** PSE, a nie zmierzonym wykonaniem (np. doba 26.10.2026 opublikowana 25.10.2026 o 23:37) – niepotwierdzone. PSE publikuje **poprawki**: cała doba bywa publikowana ponownie po tygodniach lub miesiącach (np. 10.05.2026 – ponownie 9.06.2026; 11.05.2025 – ponownie 6.11.2025).
- **Licencja:** jak wyżej (warunki PSE: źródło, data pobrania, informacja o przetworzeniu, bez logo).
- **Data sprawdzenia:** 19.11.2026
- **Poziom weryfikacji:** 1

### PSE: cena prądu RCE (raport rce-pln)

- **Co:** raport „Rynkowa cena energii elektrycznej (RCE)” (`rce-pln`); na stronie PSE pełna nazwa „Rynkowa cena energii elektrycznej dla okresu rozliczenia niezbilansowania”.
- **Używamy w:** `public/data/rce.json` (doba dzisiejsza i – jeśli już jest – jutrzejsza), generowany przy budowaniu przez `scripts/pobierz-pse.mjs`. Przeglądarka wybiera bieżący kwadrans wg czasu Europe/Warsaw, bez łączenia się z API; cena z innej doby nie jest pokazywana jako aktualna. Od 20.11.2026 także `public/data/doba.json` – odtworzenie doby (ta sama doba co wiatr, kwadranse łączone po czasie końca `dtime_utc`; zapytanie `rce-pln?$filter=business_date eq 'RRRR-MM-DD'`), zawsze z podpisem daty odtwarzanej doby.
- **Linki:**
  - API: https://api.raporty.pse.pl/api/rce-pln
  - raport: https://raporty.pse.pl/report/rce-pln
  - opis u PSE: https://www.pse.pl/oire/rce-rynkowa-cena-energii-elektrycznej (przeczytany w całości 19.11.2026 – zawiera tylko tytuł i linki do cen do 13.06.2024 i od 14.06.2024; bez definicji, jednostki i godzin publikacji)
  - ceny do 13.06.2024: https://www.pse.pl/dane-systemowe/funkcjonowanie-rb/raporty-dobowe-z-funkcjonowania-rb/podstawowe-wskazniki-cenowe-i-kosztowe/rynkowa-cena-energii-elektrycznej-rce
  - opis pól: https://api.raporty.pse.pl/EndpointsMap.pdf (fragment o RCE): `rce_pln` (RCE), `dtime`, `dtime_utc`, `period` (OREB), `period_utc`, `business_date`, `publication_ts`, `publication_ts_utc`.
- **Jednostka:** zł/MWh – **z podpisów na stronie raporty.pse.pl** (oś wykresu „PLN/MWh”, kolumna „Rynkowa cena energii [PLN]”), nie z opisu pola (PDF nie podaje jednostki przy `rce_pln`). Poziom 1.
- **Okres:** OREB – „okres rozliczenia energii bilansującej” (strona PSE; długości nie podaje). Obserwacja: kwadranse 15-minutowe, 96 na zwykłą dobę; ceny różnią się w obrębie godziny (19.11.2026: 24 z 24 godzin).
- **Publikacja (obserwacje, nie dokumentacja):** cena na dobę D pojawia się w dobie D−1 między ok. 13:34 a 14:14, jednorazowo (32 doby 20.10–20.11.2026, bez poprawek). Przed tą godziną jutrzejszej doby jeszcze nie ma.
- **Ceny ujemne:** występują – w 2026 r. 1339 kwadransów w 80 dobach, najniższa −1457,59 zł/MWh (1.05.2026, 14:15–14:30); stan 19.11.2026.
- **Przetworzenie:** bez zmiany wartości; zapisujemy okres, koniec kwadransu w UTC i cenę; w okienku cena z dwoma miejscami po przecinku; wykres bieżącej doby z min., maks., kreską „teraz” i linią zera, gdy są ceny ujemne.
- **Licencja:** jak wyżej (warunki PSE).
- **Data sprawdzenia:** 19.11.2026
- **Poziom weryfikacji:** 1

## NASA GIBS: tło satelitarne Blue Marble

- **Co:** warstwa `BlueMarble_NextGeneration` – „Blue Marble (August 2004)”, „MODIS / NASA Earth Observatory” (metadane: https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/BlueMarble_NextGeneration.json). Warstwa bez wymiaru czasu.
- **Używamy w:** tło mapy (warstwa rastrowa w `src/main.js`). Kafelki pobiera **przeglądarka widza** bezpośrednio z serwera NASA – nie zapisujemy ich u nas (patrz BEZPIECZENSTWO.md).
- **Adres kafelków (WMTS REST, EPSG:3857):** `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg` – szablon z GetCapabilities (https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities), punkt dostępu i wzór REST z https://nasa-gibs.github.io/gibs-api-docs/access-basics/. JPEG, 256 px, poziomy 0–8; serwer wysyła `access-control-allow-origin: *`; bez klucza API.
- **Podziękowanie (wymagane przez GIBS, https://nasa-gibs.github.io/gibs-api-docs/, „Data Use Guidance and Acknowledgements”):** „We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS).” – w stopce, dosłownie.
- **Warunki użycia:**
  - NASA Images and Media Usage Guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/): materiały NASA co do zasady nie są chronione prawem autorskim w USA; użycie rzeczowe, które nie sugeruje poparcia NASA, bez potrzeby zgody; NASA należy podać jako źródło; logo NASA („Meatball”, „Worm”, pieczęć) chronione prawem – **nie używamy logo i nie sugerujemy poparcia NASA**.
  - Earthdata Open Data Policy (https://www.earthdata.nasa.gov/engage/open-data-services-software-policies): „ESDS encourages citation and acknowledgment of NASA data and services”.
- **Przetworzenie:** brak – kafelki wyświetlane bez zmian.
- **Data sprawdzenia:** 19.11.2026
- **Poziom weryfikacji:** 1 (dokumentacja GIBS i wytyczne NASA – przeczytane fragmenty dotyczące dostępu, podziękowania i warunków; kafelek nad Polską pobrany i obejrzany)

## NASA GIBS: tło nocne Black Marble (światła miast)

- **Co:** warstwa `VIIRS_Black_Marble` – „Black Marble (Annual, 2012 & 2016)”, „Suomi NPP / VIIRS via NASA Earth Observatory”, warstwa nieaktualizowana (metadane: https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/VIIRS_Black_Marble.json). Używamy zdjęcia z **2016 r.** (wpisane na stałe w adresie).
- **Co pokazują światła:** to przybliżenie aktywności i oświetlenia (głównie oświetlenia ulic i zabudowy), **a nie pomiar zużycia prądu**. Zdjęcie jest z 2016 r., więc nie pokazuje obecnego stanu.
- **Używamy w:** tło mapy w trybie Noc (domyślny), warstwa rastrowa w `src/main.js`. Kafelki pobiera **przeglądarka widza** bezpośrednio z serwera NASA (patrz BEZPIECZENSTWO.md).
- **Adres kafelków (WMTS REST, EPSG:3857):** `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png` – szablon z GetCapabilities (https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml; wymiar czasu: 2012-01-01 i 2016-01-01, domyślnie 2016-01-01). PNG, 256 px, poziomy 0–8 (poziom 9 zwraca błąd 400 – sprawdzone 20.11.2026); `access-control-allow-origin: *`; bez klucza API.
- **Podpis w stopce:** „Tło nocne: Black Marble (2016), Suomi NPP / VIIRS, NASA Earth Observatory.” Podziękowanie dla GIBS i warunki użycia – jak przy Blue Marble (wpis wyżej).
- **Przetworzenie:** brak – kafelki wyświetlane bez zmian. Pod złotymi liniami dodana ciemna obwódka (zmiana naszej warstwy, nie obrazu NASA).
- **Data sprawdzenia:** 20.11.2026
- **Poziom weryfikacji:** 1 (GetCapabilities i metadane GIBS; kafelek nad Polską pobrany i obejrzany; strony produktu Black Marble w NASA Earth Observatory nie czytałam)

## EMODnet: morskie farmy wiatrowe

- **Co:** EMODnet Human Activities, Energy, Wind Farms – punkty morskich farm wiatrowych (warstwa WFS `emodnet:windfarms`).
- **Używamy w:** `public/data/farmy-baltyk.geojson` (warstwa farm na mapie), pobrany raz przez `scripts/pobierz-farmy.mjs`.
- **Metadane:** https://emodnet.ec.europa.eu/geonetwork/srv/api/records/8201070b-4b0b-4d54-8910-abcea5dce57f
- **Zapytanie:** https://ows.emodnet-humanactivities.eu/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=emodnet:windfarms&outputFormat=application/json&srsName=EPSG:4326&bbox=14.0,53.9,19.8,55.9
- **Wersja danych:** `EMODnet_HA_Energy_WindFarms_20260710` (aktualizacja 10.07.2026; zbiór aktualizowany raz w roku). Twórca danych: CETMAR.
- **Przetworzenie:** z prostokąta 14,0–19,8°E, 53,9–55,9°N wybieramy tylko obiekty z `country = "Poland"` (26 z 33 w dniu sprawdzenia); zostawiamy pola `name` (jako `nazwa`), `status` i `power_mw` (jako `moc_mw`, MW wg opisu zbioru).
- **Licencja:** Creative Commons CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Wymagany podpis wg metadanych: „This data was downloaded from the EMODnet Portal (https://emodnet.ec.europa.eu/en/). The data originator is CETMAR.”
- **Data sprawdzenia:** 18.11.2026
- **Poziom weryfikacji:** 1

### Porównanie z listą MKiŚ

- **Źródło porównania:** Ministerstwo Klimatu i Środowiska, „Obecnie realizowane projekty w Polsce”, https://www.gov.pl/web/morska-energetyka-wiatrowa/obecnie-realizowane-projekty-w-polsce – tabela 19 projektów (7 w I fazie, 12 w II fazie systemu wsparcia), stan: styczeń 2024. Przeczytane w całości 19.11.2026, poziom 1.
- **Wynik:** pole `weryfikacja` w `public/data/farmy-baltyk.geojson`, przypisane według tabeli w `scripts/weryfikacja-farm.mjs` (przyporządkowanie: Ania, 19.11.2026; zgodność nazw z listą sprawdzona przez Claude).
  - **„na liście MKiŚ” (20 rekordów, 18 projektów):** Baltic Power; Baltyk I Phase 1 i Phase 2 (razem 1560 MW = MFW Bałtyk I); Baltica 1, 2, 2+, 3; Baltyk II, III; FEW Baltic II; BC Wind B i C (= BC-Wind, 2 × 250 MW); Baltica IV Offshore wind farm 1 (= Baltica 7, PGE Baltica 4, 990 MW); Baltica V (= Baltica 5, 555 MW); Baltica 9; Energa MFW 1 i 2; Orlen Neptun III i IV (= 14.E.3, 14.E.4); Baltic East (= Orlen Neptun 46.E.1, spółka Orlen Neptun VIII).
  - **„prawdopodobny duplikat”** (oznaczony tylko jeden rekord z pary; punkty 9–11 km od siebie):
    - „Orlen Neptun VIII Offshore wind farm 1” → Baltic East. Powód: Baltic East ma w EMODnet 966 MW, tyle samo co Orlen Neptun 46.E.1 (spółka Orlen Neptun VIII) w PSZW na liście MKiŚ; rekord Orlen Neptun VIII ma w EMODnet 1000 MW. Według Atlasu Morskiego Baltic East „należący do Orlen Neptun” uzyskał wsparcie w aukcji w grudniu 2025 (https://am.gdynia.pl/farmy-wiatrowe-na-baltyku/, stan sierpień 2026, przeczytane w całości 19.11.2026, poziom 1, źródło wtórne). Artykuł nie podaje, że to spółka Orlen Neptun VIII – to wniosek ze zgodności mocy.
    - „B-Wind” → BC Wind Offshore wind farm B; „C-Wind” → BC Wind Offshore wind farm C. Powód: MKiŚ podaje BC-Wind jako 2 × 250 MW (spółka C-Wind Polska sp. z o.o.).
  - **„brak na liście MKiŚ”:** Sharco Duo, Freeboard I, Licence Application No. 76.
  - Baltica 2 i Baltica 2+ (punkty ok. 4 km od siebie) to na liście MKiŚ osobne projekty – bez zmian.
- **Baltica 1+ (1185 MW)** jest na liście MKiŚ, ale nie ma jej w EMODnet (nie ma jej na mapie).
- **Różnice mocy EMODnet vs lista MKiŚ** (w okienku zostaje moc z EMODnet):
  - Baltic Power: EMODnet 1140 MW; MKiŚ: PSZW 1200 MW, decyzja URE 1197 MW.
  - Energa MFW 1: EMODnet 900 MW; MKiŚ 812 MW. Energa MFW 2: EMODnet 800 MW; MKiŚ 896 MW. Wartości wyglądają na zamienione – niepotwierdzone, czy to błąd w EMODnet.
  - Orlen Neptun III i IV: EMODnet po 1200 MW; MKiŚ po 1204 MW.
  - Orlen Neptun VIII: EMODnet 1000 MW; MKiŚ (46.E.1) 966 MW.
- **Wygląd na mapie:** farmy „na liście MKiŚ” – pełna kropka; „prawdopodobny duplikat” i „brak na liście MKiŚ” – kropka pusta w środku; w okienku linia „weryfikacja: …”.

### Uzupełnienie statusu: Baltic Power

- **Dane EMODnet zostają bez zmian** (status „Construction”, 1140 MW). Uzupełnienie jest osobnym tekstem w okienku farmy (`KOREKTY_STATUSU` w `src/main.js`) i jednym zdaniem w stopce.
- **Źródła (przeczytane w całości 20.11.2026, poziom 1 – źródło inwestora):**
  - Komunikat z 10.07.2026, https://balticpower.pl/aktualnosci/morska-farma-wiatrowa-baltic-power-po-raz-pierwszy-wyprodukowa%C5%82a-i-dostarczy%C5%82a-energi%C4%99-z-morza-dla-polskiej-sieci-energetycznej/ – „Odbiór energii na stacji w gminie Choczewo potwierdziły Polskie Sieci Energetyczne”; wtedy „ponad 50 z 76 turbin”, kolejne dołączane „aż do osiągnięcia pełnej mocy wytwórczej”; koncesja URE zapowiedziana na II połowę 2026.
  - Komunikat z 7.10.2026, https://balticpower.pl/news/baltic-power-project-completes-installation-of-all-76-turbines-the-first-polish-offshore-wind-farm-in-poland-enters-the-final-stage-before-commercial-operations/ – „installation of the last, 76th turbine”; po podłączeniu turbina przechodzi „240-hour trial operation”; elektrownia „does not yet hold a generation license”; brak daty eksploatacji komercyjnej i brak informacji o pracy pełną mocą.
- **Moc:** 76 × 15 MW = 1140 MW (= EMODnet); inwestor i GEM podają „ok. 1,2 GW” / 1200 MW.
- **Opis w okienku:** rozruch od pierwszej energii do sieci 10.07.2026, wszystkie turbiny zainstalowane, bez koncesji, przed eksploatacją komercyjną; w EMODnet i GEM: „w budowie”.

## Global Energy Monitor: lądowe farmy wiatrowe (i wyciąg innych źródeł prądu)

- **Co:** Global Integrated Power Tracker, September 2026 release (plik „Global Integrated Power September 2026 V2.xlsx”, arkusz „Power facilities”), https://globalenergymonitor.org/projects/global-integrated-power-tracker
- **Atrybucja (zalecana przez GEM, dosłownie):** „Global Energy Monitor, Global Integrated Power Tracker, September 2026 release.”
- **Licencja:** CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ (wg arkusza About). Zmodyfikowane: wyciąg.
- **Dane wiatrowe są starsze niż wydanie:** według arkusza About wydanie z września 2026 zawiera dane wiatrowe z **Global Wind Power Tracker z lutego 2026** („The second update in February 2026 incorporated the latest release of the Global Solar Plant Tracker and Global Wind Plant Tracker”).
- **Surowy plik nie jest w repo** (`.gitignore`: `*.xlsx`, `Global Integrated Power*`). Wyciąg robi jednorazowo `scripts/wyciag-gem.py` (Python bez dodatkowych pakietów), wynik: `public/data/zrodla-gem.geojson` – 699 punktów (jeden punkt = jedna faza/blok), pola: typ, technologia, nazwa, faza, moc, status, rok uruchomienia, dokładność lokalizacji, identyfikatory GEM, link GEM.wiki.
- **Wykluczenia:**
  - fotowoltaika (typ „utility-scale solar”, 4778 wierszy dla Polski) – cała;
  - wiersze z oznaczeniem TransitionZero („TZ:” w kolumnie „Other IDs (unit/phase)”; arkusz About nazywa je „TZ ID”) – wg About pochodzą z TransitionZero Solar Asset Mapper na licencji **CC BY-NC 4.0**. Dla Polski: 2 wiersze, oba fotowoltaika. Skrypt wyklucza je dla każdego typu i wypisuje ich liczbę.
- **Próg:** GEM obejmuje farmy wiatrowe **≥10 MW** („≥1MW data are provided for some countries when the data were readily available” – dla Polski najmniejsza działająca ma dokładnie 10 MW). **Kropki na mapie to tylko duże farmy** – mniejsze farmy i pojedyncze turbiny nie są pokazane.
- **Na mapie:** tylko wiatr lądowy (`Onshore`) o statusie „operating” (pełna zielona kropka, 260 wierszy, 233 lokalizacje) i „construction” (pierścień z kropką, 7 wierszy, 313 MW). Nie pokazujemy: planowanych (pre-construction, announced), wstrzymanych ani anulowanych. Farmy morskie z GEM (28 wierszy) nie są pokazywane – morskie są z EMODnet.
- **Dokładność lokalizacji:** wg About „approximate” = najbliższa miejscowość lub inne informacje, „exact” = widoczne na mapie lub podane w źródłach. Działające lądowe: 129 exact, 131 approximate – informacja w okienku farmy.
- **Sprawdzian prawdy (moc działających farm lądowych):** wyciąg: **8 962,5 MW** (260 wierszy). Porównanie z mocą zainstalowaną wg PSE: liczba **11,16 GW (czerwiec 2026) – do potwierdzenia**: nie znaleziono oficjalnego dokumentu PSE z tą wartością (20.11.2026 sprawdzone: strony raportów miesięcznych KSE i „Informacje o zasobach wytwórczych KSE” na pse.pl nie pokazują plików za 2026). Źródło wtórne (gramwzielone.pl, wyniki wyszukiwania, nieprzeczytane w całości) cytuje PSE: 11 191 MW na 1.06.2026 – też do potwierdzenia. Liczba PSE **nie trafia na stronę**, dopóki nie będzie oficjalnego źródła.
  - Możliwe przyczyny różnicy (ok. 2,2 GW, niezmierzone): próg 10 MW w GEM (mniejsze farmy i pojedyncze turbiny poza danymi); dane wiatrowe GEM z lutego 2026, a stan PSE z czerwca 2026 (farmy oddane w tym czasie mogą być w GEM jako „construction” albo nie być wcale).
- **Data sprawdzenia:** 20.11.2026
- **Poziom weryfikacji:** 1 (arkusz About przeczytany w całości; wyciąg sprawdzony liczbowo: 8 962,5 MW działających farm lądowych zgodne z analizą pliku źródłowego)

## OpenStreetMap: linie najwyższych napięć 220/400 kV

- **Co:** linie elektroenergetyczne `power=line` z napięciem 220 kV lub 400 kV (tag `voltage` zawiera `220000` lub `400000`) w granicach Polski.
- **Używamy w:** `public/data/linie-nn.geojson` (warstwa linii na mapie), pobrany raz przez `scripts/pobierz-linie.mjs`.
- **Plik z danymi `public/data/linie-nn.geojson` jest na licencji ODbL** (© OpenStreetMap contributors), bo powstał z danych OSM.
- **Zapytanie:** Overpass API, https://overpass-api.de/api/interpreter; treść zapytania w `scripts/pobierz-linie.mjs`.
- **Stan danych:** OSM z 19.11.2026, 10:15:41 UTC (`timestamp_osm_base`); 2635 odcinków (way): 1351 z 400 kV, 1284 z 220 kV.
- **Przetworzenie:** każdy odcinek (way) zapisany jako LineString; zostawiamy tylko `name` (jako `nazwa`) i `napiecie`: 400, jeśli wśród napięć jest 400 kV, w przeciwnym razie 220 (odcinki na wspólnych słupach z kilkoma napięciami liczone jako 400 kV). Pominięte: inne napięcia, np. HVDC SwePol 450 kV; kable `power=cable` nie były pobierane.
- **Uwaga:** odcinki przechodzące przez granicę mają pełną geometrię, także poza Polską. Dane OSM są tworzone przez społeczność – nie są danymi PSE (sprawdzian prawdy: osobny krok).
- **Licencja:** Open Database License (ODbL) 1.0, https://opendatacommons.org/licenses/odbl/. Wymagania wg https://www.openstreetmap.org/copyright: podpis „© OpenStreetMap contributors”, jasna informacja o ODbL (link do strony copyright); przy udostępnianiu danych w postaci pliku – nazwa i link do licencji; utwory pochodne tylko na tej samej licencji. Szczegółowe wytyczne OSMF (https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) – nieprzeczytane.
- **Data sprawdzenia:** 19.11.2026
- **Poziom weryfikacji:** 1

### Sprawdzian prawdy

- **Porównanie wizualne z PSE** – poziom 3 (Ania, 19.11.2026). Mapa porównana na oko ze schematem PSE „Plan istniejącej sieci przesyłowej najwyższych napięć” (pse.pl, strona „istniejąca”, 19.11.2026): https://www.pse.pl/obszary-dzialalnosci/krajowy-system-elektroenergetyczny/plan-sieci-elektroenergetycznej-najwyzszych-napiec/istniejaca
  - Zgodne główne korytarze: wybrzeże (Słupsk, Żarnowiec, Gdańsk, Dunowo), Litwa (Ełk–Alytus), Niemcy (Krajnik–Vierraden, Mikułowa–Hagenwerder), Słowacja (Krosno–Lemešany), połączenia na wschodzie, gęsta sieć na Śląsku.
  - SwePol (DC) celowo pominięty.
- **Porównanie długości w km** – jeszcze nie zrobione (OSM daje długość tras, PSE prawdopodobnie długość torów; potrzebne źródło PSE).
