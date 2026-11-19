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
- **Używamy w:** `public/data/wiatr.json`, generowany przy budowaniu przez `scripts/pobierz-pse.mjs` (okienko na mapie).
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
- **Używamy w:** `public/data/rce.json` (doba dzisiejsza i – jeśli już jest – jutrzejsza), generowany przy budowaniu przez `scripts/pobierz-pse.mjs`. Przeglądarka wybiera bieżący kwadrans wg czasu Europe/Warsaw, bez łączenia się z API; cena z innej doby nie jest pokazywana jako aktualna.
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
