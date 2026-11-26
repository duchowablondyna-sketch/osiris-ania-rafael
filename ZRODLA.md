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

### PSE: produkcja ze słońca (pole pv)

- **Co:** produkcja ze słońca, raport „Wielkości podstawowe” (`his-wlk-cal`), pole `pv`, okresy 15-minutowe – ten sam raport i ten sam rekord (kwadrans) co wiatr (`wi`).
- **Używamy w:** okienko „Wiatr, słońce i cena prądu” na mapie (od 25.11.2026): `public/data/wiatr.json` (pole `slonce` – ostatni kwadrans z wartością `wi`; seria `pv` – do wspólnego wykresu z wiatrem) i `public/data/doba.json` (pole `pv` w odtworzeniu doby; doba jest pełna tylko wtedy, gdy każdy kwadrans ma `wi`, `pv` i cenę). Plik: `scripts/pobierz-pse.mjs`.
- **Link:** https://api.raporty.pse.pl/api/his-wlk-cal (API), https://raporty.pse.pl/report/his-wlk-cal (strona raportu)
- **Co wiemy na pewno:**
  - Nazwa pola wg PSE (EndpointsMap.pdf): `pv` = „Sumaryczna generacja Źródeł fotowoltaicznych”. Nagłówek kolumny na stronie raportu (wersja angielska): „Total generation of Photovoltaic Sources [MW]”.
  - Komentarz PSE pod tabelą raportu (dosłownie, odczyt 25.11.2026): „Aggregate generation of Wind Sources and Aggregate generation of Photovoltaic Sources include both the JGz that are in the balancing market and outside the balancing market”.
  - Nocą PSE publikuje **0**, nie puste pole (API, doby 24.11 i 25.11.2026, kwadranse 06:00–07:00 czasu polskiego: `pv` = 0; wschód słońca ok. 07:15). Puste pole (`null`) = kwadrans jeszcze nieopublikowany.
  - `pv` = „ES” w raporcie `his-gen-pal-sire` (Karta Polski) – sprawdzian przy każdym pobraniu Karty (tolerancja 1 MW), patrz wpis „PSE: produkcja według paliw (raport his-gen-pal-sire)”.
  - Czas: pola `period` i `business_date` – czas polski; `dtime_utc` – koniec kwadransu w UTC (jednoznaczny także w dniu zmiany czasu).
- **Czego nie wiemy:**
  - czy wartość jest zmierzona, czy szacowana przez PSE – PSE tego nie opisuje;
  - czy obejmuje panele na dachach (mikroinstalacje) – PSE tego nie opisuje; strona pomocy raporty.pse.pl/faq: 404 (sprawdzone 23.11.2026). Na stronie pod liczbą stoi zdanie: „PSE nie podaje, czy liczy panele na dachach – to może nie być cała fotowoltaika w Polsce.”
- **Jednostka:** MW – z podpisu „[MW]” na stronie raportu.
- **Przetworzenie:** wartość z tego samego rekordu co wiatr (ten sam kwadrans), zaokrąglona do pełnych MW na stronie; w serii do 0,1 MW. Przy 0 MW, gdy cały kwadrans wypada przed wschodem albo po zachodzie słońca dla środka Polski, okienko dopisuje: „Po zmroku i przed świtem panele nie pracują – 0 MW to pora dnia, a nie awaria.” Godziny wschodu i zachodu: uproszczony wzór NOAA (https://gml.noaa.gov/grad/solcalc/solareqns.PDF), `src/slonce.js`; sprawdzone dla Warszawy 25.11 i 21.06.2026 – zgodność do kilku minut. 0 MW w dzień – bez dopisku.
- **Lekcja (25.11.2026):** liczba 107,9 MW odczytana z tabeli strony raportu przepisanej jako tekst okazała się polem `jgm1` (magazyny energii), nie `pv` – puste komórki przesunęły kolumny. Liczby bierzemy z API (JSON).
- **Licencja:** jak wiatr (warunki PSE).
- **Data sprawdzenia:** 25.11.2026
- **Poziom weryfikacji:** 1 (opis PSE przeczytany; wartości z API porównane przez Claude z rekordami surowymi; porównanie ze stroną raporty.pse.pl przez Anię – do zrobienia)

### PSE: ograniczenia wiatru (raport poze-redoze)

- **Co:** raport „Nierynkowe redysponowanie źródeł OZE” (`poze-redoze`), okresy 15-minutowe (96 na dobę).
- **Używamy w:** `public/data/wiatr.json`, pole `ograniczenie`, generowany przy budowaniu przez `scripts/pobierz-pse.mjs` (tekst w okienku pod produkcją wiatru).
- **Link:** https://api.raporty.pse.pl/api/poze-redoze (API), https://raporty.pse.pl/ (raport)
- **Opis pól:** „Mapowanie endpointów API” (przewodnik migracji API V1 → V2), https://api.raporty.pse.pl/EndpointsMap.pdf – przeczytany tylko fragment o tym raporcie (tekst wyciągnięty z PDF Pythonem, bez programu do PDF), poziom 1:
  - `wi_red_balance` – „Źródło Wiatrowe – Bilansowanie KSE” (ograniczenie z powodu bilansu całego systemu),
  - `wi_red_network` – „Źródło Wiatrowe – Zarządzanie ograniczeniami systemowymi” (ograniczenie z powodu ograniczeń sieci).
  - Dokument nie podaje jednostki ani definicji. Wyjaśnienia w nawiasach to opis Claude, nie PSE.
- **Wartości:** ujemne (ograniczenie); brak ograniczenia = pole puste (`null`), zer w danych nie widzieliśmy. Rekordy na dobę D pojawiają się z pustymi polami już ok. 00:10 doby D−1.
- **Tylko wiatr (sprawdzone 25.11.2026):** raport ma osobne kolumny dla „Źródło fotowoltaiczne” (`pv_red_balance`, `pv_red_network`) i „Źródło Wiatrowe” (`wi_red_balance`, `wi_red_network`) – strona bierze tylko pola `wi_*`. Przykład (API, doba 21.11.2026): `wi_red_balance` = −300 w kwadransach 11:00–11:15 i 11:15–11:30, pozostałe pola puste.
- **Jednostka MW – z PSE (od 25.11.2026):** nagłówek każdej kolumny na stronie raportu https://raporty.pse.pl/report/poze-redoze (odczyt w przeglądarce 25.11.2026, PL i EN): „Bilansowanie KSE [MW]”, „Zarządzanie ograniczeniami systemowymi [MW]” / „Balancing of Polish Power System [MW]”, „System constraints management [MW]”. Opis pól API (EndpointsMap.pdf) jednostki nie podaje; metadanych API brak (`/api/$metadata` → 404). Nazwa raportu w EN wg PSE: „Non-market redispatch of RES resources”; menu: Funkcjonowanie KSE → Plany pracy KSE (EN: Polish Power System Operation → Polish Power System Operation Schedule). Skrót KSE strona raportu nie rozwija; pliku „Raport 2025 KSE” nie ma w `~/Projekty/_dane/` – na stronie OSIRIS KSE bez rozwinięcia.
- **Jednostka MWh – wniosek OSIRIS (uzasadnienie):** PSE podaje moc w MW dla każdego kwadransu; energię liczymy jako MW × ¼ godziny w każdym kwadransie i sumujemy (21.11.2026: 2 × 300 MW × ¼ h = 150 MWh). Założenie: moc ograniczenia trwała cały kwadrans – PSE tego nie podaje. Na stronie: w objaśnieniu F1 („MWh przeliczył OSIRIS …”, podpis „objaśnienie OSIRIS”). Wcześniejsze sprawdzenie zgodności rzędu wielkości: suma `wi_red_balance` + `wi_red_network` za październik 2025 ÷ 4 = 110,5 GWh (zapytanie 19.11.2026); Gramwzielone.pl za Forum Energii podaje dla października 2025 105,2 GWh ograniczeń wiatru na polecenie PSE (https://www.gramwzielone.pl/energia-wiatrowa/20341453/rekord-produkcji-energii-wiatrowej-w-polsce-i-rekordowe-wylaczenia, 18.11.2025, przeczytany w całości 19.11.2026, źródło wtórne). Przy jednostce MWh na kwadrans wyszłoby 442 GWh, więc MW pasuje; przyczyna różnicy ok. 5% – nieznana.
- **Przetworzenie:** najnowsza doba z ostatnich 120 dni, w której `wi_red_balance` lub `wi_red_network` ma wartość; suma obu pól ze wszystkich kwadransów tej doby ÷ 4, wartość dodatnia, zaokrąglona do pełnych MWh.
- **Na stronie (Etap C3, decyzja Ani 25.11.2026):** linijka neutralna „Ostatnie ograniczenie wiatru w raporcie PSE: doba DD.MM.RRRR – ok. X MWh (N kwadransów)” – bez słowa „polecenie” (PSE go nie używa) i bez czasownika (doba bywa jutrzejsza). Objaśnienie F1 dwuczęściowe: część PSE = nazwa raportu i dwóch rubryk (ze źródłem), część OSIRIS (podpis „objaśnienie OSIRIS”) = że PSE nie podaje, czy to polecenie, czy wykonanie, i skąd MWh (MW × ¼ godziny w każdym kwadransie). Liczba kwadransów = pole `kwadranse` (kwadranse z wartością).
- **Uwagi:** dane mogą być **poleceniami** PSE, a nie zmierzonym wykonaniem (np. doba 26.10.2026 opublikowana 25.10.2026 o 23:37) – niepotwierdzone. PSE publikuje **poprawki**: cała doba bywa publikowana ponownie po tygodniach lub miesiącach (np. 10.05.2026 – ponownie 9.06.2026; 11.05.2025 – ponownie 6.11.2025).
- **Licencja:** jak wyżej (warunki PSE: źródło, data pobrania, informacja o przetworzeniu, bez logo).
- **Data sprawdzenia:** 25.11.2026
- **Poziom weryfikacji:** 3 – Ania obejrzała 25.11.2026 stronę PSE (zrzut pse-poze-redoze-pl.png) i potwierdziła jednostkę MW w nagłówkach.

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
- **Nazwa i wydawca – źródło wskazane przez Anię (25.11.2026):** pse.pl, zakładka OIRE → Rynkowe ceny energii – „Rynkowa cena energii elektrycznej dla okresu rozliczenia niezbilansowania”, publikowana przez PSE. Na stronie (objaśnienie F1 przy „RCE”, od Etapu C2) tylko to; **bez** „netto” i „rozliczania prosumentów” (brak źródła w repo). Zdanie „To cena hurtowa, nie cena z faktury firmy.” jest **objaśnieniem OSIRIS** (podpis na stronie), nie cytatem PSE. Strony OIRE Claude nie czytał w tym etapie (bez połączeń z PSE).
- **zł/kWh (od Etapu C2):** na stronie także „= X zł/kWh” – ta sama cena ÷ 1000, dwa miejsca po przecinku.
- **Okres:** OREB – „okres rozliczenia energii bilansującej” (strona PSE; długości nie podaje). Obserwacja: kwadranse 15-minutowe, 96 na zwykłą dobę; ceny różnią się w obrębie godziny (19.11.2026: 24 z 24 godzin).
- **Publikacja (obserwacje, nie dokumentacja):** cena na dobę D pojawia się w dobie D−1 między ok. 13:34 a 14:14, jednorazowo (32 doby 20.10–20.11.2026, bez poprawek). Przed tą godziną jutrzejszej doby jeszcze nie ma.
- **Ceny ujemne:** występują – w 2026 r. 1339 kwadransów w 80 dobach, najniższa −1457,59 zł/MWh (1.05.2026, 14:15–14:30); stan 19.11.2026.
- **Przetworzenie:** bez zmiany wartości; zapisujemy okres, koniec kwadransu w UTC i cenę; w okienku cena z dwoma miejscami po przecinku; wykres bieżącej doby z min., maks., kreską „teraz” i linią zera, gdy są ceny ujemne.
- **Zdanie-wniosek w okienku (Etap C3, decyzje Ani 25.11.2026):** najtańszy i najdroższy kwadrans bieżącej doby z cenami (ta sama funkcja zapisu co podpisy wykresu); przy remisie – najwcześniejszy kwadrans i „i N inne”; „Najdroższy kwadrans doby kosztuje x razy więcej niż najtańszy” – iloraz maks./min. z jednym miejscem po przecinku, tylko gdy najniższa cena > 0 i iloraz ≥ 1,1. Czas teraźniejszy – ceny całej doby są znane z góry. Tylko przy pełnej dobie (od 00:00 do 24:00 czasu polskiego, kolejne kwadranse bez dziur; 96, a w dni zmiany czasu 92 lub 100); inaczej bez zdania; w trakcie odtwarzania doby ukryte. Kod: `src/pse-teksty.js`, testy: `scripts/testy-pse.mjs`.
- **Licencja:** jak wyżej (warunki PSE).
- **Data sprawdzenia:** 19.11.2026
- **Poziom weryfikacji:** 1

## Karta Polski: miks paliw, wymiana z zagranicą, ślad CO2

Pliki źródłowe (PDF) pobrane 21.11.2026 leżą poza repo: `~/Projekty/_dane/karta/`. Tekst czytany wbudowanym w macOS PDFKit (bez instalowania programów).

### PSE: produkcja według paliw (raport his-gen-pal-sire)

- **Co:** produkcja w Polsce według rodzaju paliwa, co 15 min. Każdy rekord: `alias_sire` (kod PSE), `alias_entsoe` (kod ENTSO-E), `value`, `period`, `dtime_utc`, `publication_ts`.
- **Używamy w:** `public/data/karta.json`, generowany przy budowaniu przez `scripts/karta/pobierz.mjs` (logika: `scripts/karta/licz.mjs`, testy: `node --test scripts/karta/testy.mjs`). Na stronie: panel „Karta Polski” na /mapa/, zakładka „Ile i jak czysto” (`src/karta.js`; wszystkie napisy z liczbami – `src/karta-teksty.js`, testy: `node --test scripts/karta/testy-panel.mjs`), Metodologia rozwijana w panelu. Bierzemy doby „wczoraj” i „dziś” (czas polski), `$first=2000` – cała doba (1 440 rekordów = 96 kwadransów × 15 kodów) w jednym zapytaniu.
- **Link:** https://api.raporty.pse.pl/api/his-gen-pal-sire (API). Strona raportu https://raporty.pse.pl/report/his-gen-pal-sire zwraca 404 (21.11.2026); raportu nie ma też w EndpointsMap.pdf – jego opisu u PSE nie znaleźliśmy.
- **Wartości z przecinkiem:** `value` to tekst, np. `"7556,431"` – zamieniamy na liczbę (7556.431). Inny zapis (spacje, kropki tysięcy, pusty) = błąd danych → sprawdzian nie przechodzi.
- **Jednostka:** MW – **wniosek, nie opis PSE**: WI+WM i ES zgadzają się co do 0,001 z polami `wi` i `pv` raportu `his-wlk-cal`, które na raporty.pse.pl mają podpis „[MW]”.
- **Słońce (ES / `pv`) – dachy i pomiar: PSE tego nie opisuje** (sprawdzone 23.11.2026). EndpointsMap.pdf: `pv` = „Sumaryczna generacja Źródeł fotowoltaicznych”, nic więcej. Komentarz pod tabelą https://raporty.pse.pl/report/his-wlk-cal: „Aggregate generation of Wind Sources and Aggregate generation of Photovoltaic Sources include both the JGz that are in the balancing market and outside the balancing market” – nie mówi, czy mikroinstalacje na dachach są w tych JGz, ani czy wartość jest zmierzona, czy szacowana. Strona pomocy raporty.pse.pl/faq: 404.
- **Aktualność (obserwacja):** 21.11.2026 o 18:02 najnowszy kwadrans to 17:15–17:30 (publikacja 17:52) – opóźnienie ok. 30–45 min. Doba poprzednia uzupełniona w nocy (doba 20.11: publikacja 21.11, 02:52). Przy budowaniu co 4 h dane mają zwykle 1–5 h.
- **Sprawdzian przy każdym pobraniu:** w każdym kwadransie obecnym w obu raportach WI+WM = `wi` i ES = `pv` z `his-wlk-cal`, tolerancja 1 MW. Kwadranse tylko w jednym raporcie pomijamy (miks bywa o kwadrans nowszy). Dodatkowo: nieznany kod PSE, kod ENTSO-E inny niż w tabeli niżej albo podwójny kod = błąd danych. Gdy sprawdzian nie przejdzie: zostaje poprzedni `karta.json` pobrany z https://osiris-ania-rafael.pages.dev/data/karta.json (tylko ten adres, bez przekierowań) z plakietką „nowe dane nie przeszły sprawdzianu”; gdy PSE nie odpowie – ta sama droga z plakietką „nie udało się pobrać nowych danych PSE”; gdy i to zawiedzie – brak danych.
- **Wybór kwadransu:** najnowszy, który ma wszystkie 15 kodów w miksie oraz `wi`, `pv`, `swm_p`, `swm_np` w `his-wlk-cal`.
- **Przetworzenie:** udziały liczone **z produkcji w Polsce** (suma 14 kodów bez WS); szczytowo-pompowe (WS, magazyn) pomijane w udziałach i w śladzie CO2, zapisywane osobno (do Metodologii). Pasek: kamienny (WK) / brunatny (WB) / gaz i inne (GZ, GK, OO, OD, IN) / OZE. **OZE (decyzja Ani 21.11.2026):** WI, WM, ES, WP, WZ, BM, BG; odpady (OD) nie są OZE.
- **Sprawdzian ręczny (Claude, 21.11.2026):** doba 20.11.2026, 12:00–12:15: WI 2591,804 + WM 582,400 = 3174,204 = `wi`; ES 3853,504 = `pv`. Produkcja 22 755,8 MW; węgiel 53,5%; OZE 33,4%; ślad CO2 554,1 g/kWh – przeliczone niezależnie w Pythonie i w teście (`scripts/karta/testy/pse-2026-11-20-1200.json` – prawdziwe odpowiedzi API).
- **Licencja:** jak wyżej (warunki PSE).
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 1 – wiatr (WI+WM) i PV (ES) potwierdzone pośrednio przez Anię (21.11) w his-wlk-cal; węgiel, gaz i pozostałe paliwa – tylko sprawdzian automatyczny, strona raportu na raporty.pse.pl niedostępna (404).

### PSE: moc zainstalowana – paski „Ile pracuje z tego, co mamy” (od 23.11.2026)

- **Co:** „Raport 2025 KSE” („Zestawienie danych ilościowych dotyczących funkcjonowania KSE w 2025 roku”, „Dane operatywne – wielkości brutto*”), **Tabela 1.1 „Struktura mocy zainstalowanej w KSE [MW]”**, kolumna **31.12.2025 r.**
- **Link:** https://www.pse.pl/dane-systemowe/funkcjonowanie-kse/raporty-roczne-z-funkcjonowania-kse-za-rok/raporty-za-rok-2025#t1_1 (strona HTML; tabela przeczytana w całości 23.11.2026).
- **Przypis PSE do „*” (dosłownie):** „Prezentowane wielkości są wyznaczane na podstawie pomiarów zbieranych przez OSP w czasie bieżącego prowadzenia ruchu KSE. Dlatego w niektórych przypadkach mogą one różnić się od ostatecznych danych przedstawianych przez przedsiębiorstwa energetyczne dla celów statystycznych.”
- **Stan na:** 31.12.2025 · **data pobrania:** 23.11.2026
- **Plik w repo:** `scripts/karta/moc-zainstalowana-pse-2025.json` (wartości przepisane ręcznie). `scripts/karta/pobierz.mjs` dopisuje go do `public/data/karta.json` jako `moc_zainstalowana`. Napisy: `src/karta-teksty.js` (`tekstyMocy`), testy: `node --test scripts/karta/testy-panel.mjs`.
- **Wartości (MW, 31.12.2025):** Ogółem **77 331**; Elektrownie zawodowe 40 225; Elektrownie zawodowe wodne 2 431; Elektrownie zawodowe cieplne 37 794, w tym: na węglu kamiennym **23 097**, na węglu brunatnym **8 351**, gazowe **6 346**; Elektrownie wiatrowe i inne odnawialne **37 106**; JWCD 28 124; nJWCD 49 207. Sumy się zgadzają (sprawdza test).
- **Paski (decyzje Ani 23.11.2026):**

  | Pasek | Produkcja (kody PSE z karta.json) | Moc (wiersz Tabeli 1.1) |
  |---|---|---|
  | węgiel kamienny | WK | na węglu kamiennym |
  | węgiel brunatny | WB | na węglu brunatnym |
  | gaz ziemny | GZ | gazowe |
  | wiatr, słońce i inne OZE (kreskowany, „?”) | WI + WM + ES + BM + BG | Elektrownie wiatrowe i inne odnawialne |

  Bez paska: woda (WP, WZ), olej (OO), odpady (OD), inne (IN), gaz z węgla (GK).
- **Czego raport nie rozdziela (nie zgadujemy):**
  - wiatru na lądzie i na morzu, słońca, biomasy – jeden wiersz „wiatrowe i inne odnawialne”. Wiersz „El. wiatrowe” w Tabeli 5.1 tego samego raportu to **moc osiągalna, średnia z porannych szczytów dni roboczych** (10 898,8 MW w 2025) – inna miara, nieużyta;
  - nie wiadomo, czy „inne odnawialne” obejmują mikroinstalacje na dachach ani małe elektrownie wodne spoza zawodowych;
  - **woda:** „zawodowe wodne” obejmują **prawdopodobnie** elektrownie szczytowo-pompowe – wniosek, nie opis PSE (w Tabeli 5.1 wodne JWCD: 1 738 MW; GEM: szczytowo-pompowe 1 875 MW), a w produkcji szczytowo-pompowych (WS) nie liczymy → bez paska wody;
  - węgiel i gaz w tabeli to **tylko elektrownie zawodowe** – elektrowni przemysłowych tabela nie wymienia, a czy PSE wlicza je do produkcji WK/GZ w `his-gen-pal-sire` – nie wiadomo;
  - czy „gazowe” obejmują elektrownie na gazie z węgla albo oleju – nie wiadomo (dlatego pasek gazu = tylko GZ).
- **Produkcja większa niż moc z raportu:** pasek pełny (bez procentu ponad 100), liczby bez przycinania, dopisek „więcej niż moc z raportu PSE (stan 31.12.2025) – od tego czasu mogły przybyć nowe elektrownie”.
- **Dopiski na stronie:** moc zainstalowana ≠ moc dostępna (remonty, rezerwa); krótki pasek wiatru i słońca = pogoda albo pora dnia, nie awaria; „?” – brak podziału OZE i niejasne panele na dachach; mapa (GEM) pokazuje tylko większe elektrownie.
- **Porównanie z GEM (zakładka „Skąd”):** patrz sekcja GEM niżej („Sprawdzian prawdy”) – GEM ma 87% węgla, 84% gazu, 86% wody z tej tabeli. Na stronie przy licznikach GEM: „na mapie · bloki od 30 MW (GEM)” (węgiel), „od 20 MW” (gaz), „od 30 MW” (woda, szczytowo-pompowe).
- **Licencja:** jak wyżej (warunki PSE).
- **Poziom weryfikacji:** 1 (tabela przeczytana w całości na stronie PSE; sumy wierszy sprawdzone testem; wartości do porównania przez Anię)

### PSE: saldo wymiany z zagranicą (his-wlk-cal, pola swm_p i swm_np)

- **Co:** `swm_p` – „Krajowe saldo wymiany międzysystemowej (równoległa)”, `swm_np` – „… (nierównoległa)” (EndpointsMap.pdf, przeczytany cały fragment o `his-wlk-cal`).
- **Znak – z opisu PSE, nie z wniosku:** komentarz pod tabelą raportu na https://raporty.pse.pl/report/his-wlk-cal (odczyt 21.11.2026): „For planned cross-border exchange following sign convention was used: '+' represents energy import to Poland, '-' represents energy export from Poland.” Czyli **+ = Polska kupuje, − = Polska sprzedaje**.
- **Wymiana planowa**, nie zmierzona (słowo „planned” w komentarzu PSE). Na stronie: „wymiana planowa”.
- **Przetworzenie:** saldo = `swm_p` + `swm_np`. Sprawdzenie bilansu (informacyjnie, nie blokuje): 20.11.2026 12:00–12:15 produkcja 22 755,8 + saldo 1 225,1 = 23 980,9 MW wobec zapotrzebowania `demand` 23 993,5 MW (różnica 12,6 MW).
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 3 (Ania, 21.11.2026, porównanie z raporty.pse.pl: kwadrans 17:15–17:30 – `swm_p` −791,200, `swm_np` 205,606 zgodne z `karta.json`)

### PSE: zapotrzebowanie (his-wlk-cal, pole demand) – od Etapu C2 (25.11.2026)

- **Co:** `demand` – „Zapotrzebowanie na moc” / „KSE power demand” (EndpointsMap.pdf, str. 6, plik w `~/Projekty/_dane/karta/pse-endpointsmap-pobrano-2026-11-21.pdf`, odczyt PDFKit 25.11.2026). Ten sam raport i ten sam kwadrans co miks Karty.
- **Używamy w:** `public/data/karta.json` → `bilans.zapotrzebowanie_mw` (`scripts/karta/licz.mjs`); na stronie od Etapu C2: Karta Polski → „Ile pracuje z tego, co mamy” – linijka „Zapotrzebowanie (PSE): … GW · produkcja w Polsce: … GW · wymiana: …” (`src/karta-teksty.js`, `tekstZapotrzebowania`).
- **Jednostka:** MW – **wniosek, nie opis PSE** (PDF nie podaje jednostki): produkcja + szczytowo-pompowe + saldo ≈ `demand` (20.11.2026 12:00–12:15: różnica 12,6 MW; 25.11.2026 06:30–06:45: 38,5 MW).
- **Dlaczego przy wymianie pokazujemy saldo PSE, a nie różnicę zapotrzebowanie − produkcja (decyzja Ani 25.11.2026):** saldo (`swm_p` + `swm_np`) to wartość podana wprost przez PSE (wymiana planowa). Różnica zapotrzebowanie − produkcja nie jest tym samym: produkcja na stronie nie wlicza elektrowni szczytowo-pompowych (WS), a bilans PSE w danym kwadransie nie zamyka się co do MW (powyżej). Tej różnicy nie liczymy i nie wyjaśniamy na stronie.
- **Procenty na stronie** (OZE, węgiel, wiatr i słońce) – zawsze od produkcji w Polsce (`produkcja_mw`), nie od zapotrzebowania.
- **Licencja:** jak wyżej (warunki PSE).
- **Data sprawdzenia:** 25.11.2026
- **Poziom weryfikacji:** 1

### ENTSO-E: znaczenia kodów źródeł (B01–B20)

- **Źródło:** ENTSO-E, „ENTSO-E Code Lists”, wersja 36, wydanie 0 (2015-06-09), lista typów zasobów (B01–B20): https://www.entsoe.eu/Documents/EDI/Library/Core/entso-e-code-list-v36r0.pdf – SHA-256 `46c24a92f04c578594b0c175f295e48c9f1e52de4f151a1403884121dfb624eb`. Nowszych wersji listy nie sprawdzaliśmy.
- **Powiązanie kodów PSE z ENTSO-E:** podaje samo PSE w każdym rekordzie (`alias_sire` ↔ `alias_entsoe`); skrypt sprawdza je przy każdym pobraniu.

| PSE | ENTSO-E | ENTSO-E (oryginał) | Na stronie | Grupa | OZE |
|---|---|---|---|---|---|
| WK | B05 | Fossil Hard coal | węgiel kamienny | kamienny | nie |
| WB | B02 | Fossil Brown coal/Lignite | węgiel brunatny | brunatny | nie |
| GZ | B04 | Fossil Gas | gaz ziemny | gaz i inne | nie |
| GK | B03 | Fossil Coal-derived gas | gaz z węgla | gaz i inne | nie |
| OO | B06 | Fossil Oil | olej | gaz i inne | nie |
| OD | B17 | Waste | odpady | gaz i inne | nie |
| IN | B20 | Other | inne | gaz i inne | nie |
| WI | B19 | Wind Onshore | wiatr na lądzie | OZE | tak |
| WM | B18 | Wind Offshore | wiatr na morzu | OZE | tak |
| ES | B16 | Solar | słońce | OZE | tak |
| WP | B11 | Hydro Run-of-river and poundage | woda przepływowa | OZE | tak |
| WZ | B12 | Hydro Water Reservoir | woda zbiornikowa | OZE | tak |
| BM | B01 | Biomass | biomasa | OZE | tak |
| BG | B15 | Other renewable | inne OZE | OZE | tak |
| WS | B10 | Hydro Pumped Storage | szczytowo-pompowe (magazyn) | pomijane | – |

- **Nieznane:** co dokładnie PSE wlicza do BG („inne OZE”) i IN („inne”) – brak opisu u PSE.
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 1

### Nazwy instytucji w objaśnieniach F1 (Etap C2, 25.11.2026)

- **IPCC:** angielska nazwa „Intergovernmental Panel on Climate Change” – z PDF IPCC AR5 Annex III (`~/Projekty/_dane/karta/`, odczyt PDFKit 25.11.2026). Polska nazwa „Międzyrządowy Zespół do spraw Zmian Klimatu (IPCC)” – źródło wskazane przez Anię: Protokół z Kioto, Dz.U. 2005 nr 203 poz. 1684 (**dokumentu Claude nie czytał**).
- **KOBiZE:** „Krajowy Ośrodek Bilansowania i Zarządzania Emisjami (KOBiZE) funkcjonujący w Instytucie Ochrony Środowiska – Państwowym Instytucie Badawczym” – z PDF KOBiZE „Wskaźniki emisyjności … 2024” (`~/Projekty/_dane/karta/`, odczyt PDFKit 25.11.2026). Nazwa angielska na stronie EN – tłumaczenie OSIRIS.

### IPCC AR5: ślad CO2 źródeł prądu (cykl życia)

- **Źródło:** Schlömer S. i in., 2014: Annex III: Technology-specific cost and performance parameters. W: Climate Change 2014: Mitigation of Climate Change. Contribution of Working Group III to the Fifth Assessment Report of the IPCC. Cambridge University Press. **Tabela A.III.2** „Emissions of selected electricity supply technologies (gCO2eq/kWh)”, kolumna „Lifecycle emissions (incl. albedo effect)”, mediana.
- **Link:** https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_annex-iii.pdf – SHA-256 `dec39383e03caf843f833ad8f4b373f72be3b86ada6d826bd172e8955ffe24c2`
- **Wartości (mediana, g CO2eq/kWh):** węgiel PC 820, gaz – cykl kombinowany 490, biomasa dedykowana 230, woda 24, PV na farmach (utility) 48 (decyzja Ani: 48, nie 41 dla dachów), wiatr na lądzie 11, wiatr na morzu 12.
- **Ograniczenia:** wartości dla typowych technologii z literatury, nie dla polskich elektrowni; gaz 490 to blok gazowo-parowy (w Polsce pracują też inne bloki gazowe); węgla brunatnego, oleju, gazu z węgla, odpadów i „innych” tabela nie podaje (założenia niżej).
- **Licencja:** warunków ponownego użycia IPCC nie czytaliśmy; używamy tylko liczb z podaniem źródła.
- **Data sprawdzenia:** 21.11.2026 (tabela przeczytana w całości)
- **Poziom weryfikacji:** 1

### KOBiZE: wskaźniki emisyjności dla energii elektrycznej za 2024 (553 kg/MWh)

- **Dokument:** KOBiZE, „Wskaźniki emisyjności CO2, SO2, NOx, CO i pyłu całkowitego dla energii elektrycznej na podstawie informacji zawartych w Krajowej bazie o emisjach gazów cieplarnianych i innych substancji za 2024 rok”, Warszawa, grudzień 2025 (8 stron, przeczytany w całości).
- **Oryginalny adres:** https://www.kobize.pl/uploads/materialy/materialy_do_pobrania/aktualnosci/2025/142_Wskazniki_emisyjnosci_2025.pdf – 21.11.2026 zwraca stronę HTML zamiast pliku (serwis kobize.pl w przebudowie).
- **Kopia w Internet Archive (12.06.2026, 04:20:33 UTC):** https://web.archive.org/web/20260612042033/https://www.kobize.pl/uploads/materialy/materialy_do_pobrania/aktualnosci/2025/142_Wskazniki_emisyjnosci_2025.pdf
- **SHA-256 pliku:** `d14908ca6c5b73cefa4e5bb14f15288e696b6659d297c84d71539e40b73c1d41` (dwa pobrania 21.11.2026 – zgodne)
- **Wartości:** Tabela 1 – 717 kg CO2/MWh dla energii wyprodukowanej w instalacjach spalania paliw; Tabela 2 – **553 kg CO2/MWh dla odbiorców końcowych**.
- **Co to znaczy (z rozdziałów 1, 4, 5 dokumentu):** tylko emisja **ze spalania** (raporty instalacji do Krajowej bazy, wszystkie paliwa, w tym biomasa), rozłożona na całą energię w kraju (spalanie 123,7 TWh + woda 3,1 TWh + wiatr i inne OZE 42,2 TWh − straty i różnice bilansowe 8,6 TWh = 160,4 TWh). **To nie jest cykl życia** jak w IPCC – liczb OSIRIS i KOBiZE nie porównujemy wprost (zapis do Metodologii).
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 1

### KOBiZE: wartości opałowe i wskaźniki emisji CO2 paliw (Tabele 14, 16, 17)

- **Dokument:** KOBiZE, „Wartości opałowe (WO) i wskaźniki emisji CO2 (WE) w roku 2022 do raportowania w ramach Systemu Handlu Uprawnieniami do Emisji za rok 2025”, Warszawa, grudzień 2024 (7 stron, przeczytany w całości).
- **Oryginalny adres:** https://www.kobize.pl/uploads/materialy/materialy_do_pobrania/monitorowanie_raportowanie_weryfikacja_emisji_w_eu_ets/WO_i_WE_do_monitorowania-ETS-2025.pdf – 21.11.2026 zwraca stronę HTML zamiast pliku.
- **Kopia w Internet Archive (16.04.2026, 15:15:11 UTC):** https://web.archive.org/web/20260416151511/https://kobize.pl/uploads/materialy/materialy_do_pobrania/monitorowanie_raportowanie_weryfikacja_emisji_w_eu_ets/WO_i_WE_do_monitorowania-ETS-2025.pdf
- **SHA-256 pliku:** `e25798a0d3999f3fa1bf00c9f61dc82d71913f4bd9ad049d661f3bf4ba056fd3` (dwa pobrania 21.11.2026 – zgodne)
- **Wartości (kg CO2/GJ):** Tabela 17 (średnie krajowe WO): węgiel kamienny **94,84**, węgiel brunatny **110,71**. Tabela 14: olej opałowy **76,86**. Tabela 16 (wartości z wytycznych IPCC 2006): odpady komunalne niebiogeniczne **91,70**, odpady przemysłowe 143,00, gaz koksowniczy 44,40, gaz wielkopiecowy 260,00, biogaz 54,60 (w systemie handlu emisjami biomasy i biogazu się nie wlicza).
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 1

### Założenia OSIRIS: ślad CO2 paliw bez wartości w IPCC (zatwierdziła Ania 21.11.2026)

Metoda dla paliw kopalnych: 820 g/kWh (IPCC, węgiel) × (wskaźnik KOBiZE paliwa ÷ 94,84, wskaźnik KOBiZE węgla kamiennego). Zakłada tę samą sprawność elektrowni co dla węgla – to uproszczenie.

| Kod | Paliwo | g CO2/kWh | Jak wyliczone |
|---|---|---|---|
| WB / B02 | węgiel brunatny | **957** | 820 × 110,71 / 94,84 = 957,2 (KOBiZE tab. 17) |
| OO / B06 | olej | **665** | 820 × 76,86 / 94,84 = 664,5 (KOBiZE tab. 14) |
| GK / B03 | gaz z węgla | **820** | jak węgiel kamienny, z którego pochodzi; KOBiZE ma dwa skrajne wskaźniki (koksowniczy 44,40 → 384; wielkopiecowy 260,00 → 2 248), a proporcji nie znamy |
| OD / B17 | odpady | **793** | 820 × 91,70 / 94,84 = 792,9 (KOBiZE tab. 16, odpady komunalne niebiogeniczne); liczone w całości jak paliwo kopalne |
| IN / B20 | inne | **717** | KOBiZE 2024, tab. 1 – średnia dla prądu ze spalania paliw (to emisja bez cyklu życia) |
| BG / B15 | inne OZE | **230** | jak biomasa dedykowana w IPCC (brak wartości dla „innych OZE”) |

- **Waga założeń (20.11.2026, 12:00–12:15):** te paliwa (bez węgla brunatnego) to 4,2% produkcji; skrajne warianty dają 543–570 g/kWh wobec 554 z założeniami (Claude, obliczenie w czacie 21.11.2026).
- **Na stronie:** ślad CO2 zaokrąglony do dziesiątek, z „ok.” (np. „ok. 550 g/kWh”), podpis „szacunek OSIRIS wg IPCC”; dokładna wartość tylko w Metodologii. Średnia ważona produkcją (bez WS), bez prądu kupionego za granicą.
- **Poziom weryfikacji:** 1 (założenie – do potwierdzenia przez Anię)

## NASA GIBS: tło satelitarne Blue Marble

- **Co:** warstwa `BlueMarble_NextGeneration` – „Blue Marble (August 2004)”, „MODIS / NASA Earth Observatory” (metadane: https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/BlueMarble_NextGeneration.json). Warstwa bez wymiaru czasu.
- **Używamy w:** tło mapy (warstwa rastrowa w `src/main.js`). Kafelki pobiera **przeglądarka widza** bezpośrednio z serwera NASA – nie zapisujemy ich u nas (patrz BEZPIECZENSTWO.md).
- **Adres kafelków (WMTS REST, EPSG:3857):** `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg` – szablon z GetCapabilities (https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities), punkt dostępu i wzór REST z https://nasa-gibs.github.io/gibs-api-docs/access-basics/. JPEG, 256 px, poziomy 0–8; serwer wysyła `access-control-allow-origin: *`; bez klucza API.
- **Podziękowanie (wymagane przez GIBS, https://nasa-gibs.github.io/gibs-api-docs/, „Data Use Guidance and Acknowledgements”):** „We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS).” – w stopce, dosłownie.
- **Warunki użycia:**
  - NASA Images and Media Usage Guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/): materiały NASA co do zasady nie są chronione prawem autorskim w USA; użycie rzeczowe, które nie sugeruje poparcia NASA, bez potrzeby zgody; NASA należy podać jako źródło; logo NASA („Meatball”, „Worm”, pieczęć) chronione prawem – **nie używamy logo i nie sugerujemy poparcia NASA**.
  - Earthdata Open Data Policy (https://www.earthdata.nasa.gov/engage/open-data-services-software-policies): „ESDS encourages citation and acknowledgment of NASA data and services”.
- **Przetworzenie:** tło przetworzone (przyciemnione) – od 20.11.2026 w MapLibre: `raster-saturation: -0.5`, `raster-brightness-max: 0.7`, `raster-contrast: -0.1` (tryb Dzień), żeby dane mocniej się wyróżniały. Same kafelki NASA są pobierane bez zmian. Informacja także w stopce.
- **Data sprawdzenia:** 19.11.2026
- **Poziom weryfikacji:** 1 (dokumentacja GIBS i wytyczne NASA – przeczytane fragmenty dotyczące dostępu, podziękowania i warunków; kafelek nad Polską pobrany i obejrzany)

## NASA GIBS: tło nocne Black Marble (światła miast)

- **Co:** warstwa `VIIRS_Black_Marble` – „Black Marble (Annual, 2012 & 2016)”, „Suomi NPP / VIIRS via NASA Earth Observatory”, warstwa nieaktualizowana (metadane: https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/VIIRS_Black_Marble.json). Używamy zdjęcia z **2016 r.** (wpisane na stałe w adresie).
- **Co pokazują światła:** to przybliżenie aktywności i oświetlenia (głównie oświetlenia ulic i zabudowy), **a nie pomiar zużycia prądu**. Zdjęcie jest z 2016 r., więc nie pokazuje obecnego stanu.
- **Używamy w:** tło mapy w trybie Noc (domyślny), warstwa rastrowa w `src/main.js`. Kafelki pobiera **przeglądarka widza** bezpośrednio z serwera NASA (patrz BEZPIECZENSTWO.md).
- **Adres kafelków (WMTS REST, EPSG:3857):** `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png` – szablon z GetCapabilities (https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml; wymiar czasu: 2012-01-01 i 2016-01-01, domyślnie 2016-01-01). PNG, 256 px, poziomy 0–8 (poziom 9 zwraca błąd 400 – sprawdzone 20.11.2026); `access-control-allow-origin: *`; bez klucza API.
- **Podpis w stopce:** „Tło nocne: Black Marble (2016), Suomi NPP / VIIRS, NASA Earth Observatory.” Podziękowanie dla GIBS i warunki użycia – jak przy Blue Marble (wpis wyżej).
- **Przetworzenie:** tło przetworzone (odbarwione i przygaszone) – w MapLibre: `raster-saturation: -0.3`, `raster-brightness-max: 0.7` (światła przygaszone o 30% – od 23.11.2026, wariant A, decyzja Ani: pełne światła konkurowały ze znaczkami), `raster-contrast: 0` (tryb Noc); światła miast są mniej żółte, łatwiej odróżnić je od złotych linii. Od 20.11 do 23.11.2026 bez przyciemniania (`brightness-max: 1`) – pomiar 20.11.2026 (Warszawa, Śląsk): przy `brightness-max` 0,75 i 0,85 najjaśniejsze środki miast stawały się szare, zbliżone jasnością do znaczków, i kontrast danych z nimi spadał (np. węgiel na Śląsku 3,38 → 1,84 / 2,38). 23.11.2026 Ania wybrała przygaszenie mimo tego – ważniejsze, żeby światła miast nie zagłuszały znaczków na całej mapie; znaczki nad najjaśniejszymi środkami miast mają przez to niższy kontrast. Same kafelki NASA są pobierane bez zmian. Pod złotymi liniami dodana ciemna obwódka (zmiana naszej warstwy, nie obrazu NASA).
- **Data sprawdzenia:** 20.11.2026
- **Poziom weryfikacji:** 1 (GetCapabilities i metadane GIBS; kafelek nad Polską pobrany i obejrzany; strony produktu Black Marble w NASA Earth Observatory nie czytałam)

### Kopia kafelków Black Marble 2016 dla globusa na stronie tytułowej

- **Co:** te same kafelki co wyżej (`VIIRS_Black_Marble`, 2016-01-01, PNG 256 px), **tylko przybliżenia 0–3** – wszystkie 85 (1 + 4 + 16 + 64), razem **1 901 156 B** (ok. 1,8 MB). Zapisane **bajt w bajt, bez obróbki**; odbarwienie (`raster-saturation: -0.3`) robi MapLibre przy rysowaniu.
- **Gdzie:** `public/kafelki/black-marble-2016/{z}/{y}/{x}.png`; sumy SHA-256 każdego kafelka i data pobrania: `public/kafelki/black-marble-2016/sumy-sha256.txt`.
- **Jak:** jednorazowo, ręcznie: `node scripts/pobierz-kafelki-globusa.mjs` (pobranie 21.11.2026, sprawdza kod 200, typ `image/png` i nagłówek PNG); sprawdzenie plików z sumami bez sieci: `node scripts/pobierz-kafelki-globusa.mjs --sprawdz` (21.11.2026: 85/85 zgodnych). Skrypt nie działa przy budowaniu.
- **Używamy w:** globus na stronie tytułowej (`src/tytulowa.js`, `maxzoom: 3` – na bardzo wysokich ekranach kafelki z poziomu 3 są powiększane zamiast pobierania poziomu 4 z NASA). **Od 22.11.2026 także mapa /mapa/:** w trybie Noc kopia jest warstwą spodnią, zawsze widoczną (`src/main.js`, źródło `tlo-noc-baza`, `maxzoom: 3`) – pierwszy widok kuli idzie tylko z niej; kafelki NASA GIBS (wpis wyżej) dochodzą na wierzch dopiero od przybliżenia 4. Tryb Dzień (Blue Marble) nadal w całości z NASA. Cloudflare Pages wysyła dla `/kafelki/*` nagłówek `Cache-Control: public, max-age=31536000, immutable` (`public/_headers`).
- **Po co:** serwer NASA wysyła `cache-control: max-age=0, no-store, no-cache` i odpowiada ok. 0,2–0,8 s na kafelek – przy każdym powrocie na stronę tytułową kula była przez chwilę „urwana” (pomiar 21.11.2026). Z kopią: 0 połączeń z NASA na stronie tytułowej, kafelki gotowe w ok. 0,1–0,5 s od wejścia (pomiar 21.11.2026 na wersji zbudowanej, przejście mapa → strona tytułowa).
- **Warunki (przeczytane w całości 21.11.2026):** NASA Earthdata, „Data Use and Citation Guidance”, https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance – treści NASA ESDIS, w tym obrazy, „are generally not copyrighted” i można ich używać m.in. na stronach internetowych; dane z misji prowadzonych przez NASA bez oznaczonej licencji są na licencji CC0 („no restrictions on the use”, z bardzo mocną prośbą o podanie źródła); niechronione prawem autorskim materiały NASA „may be reproduced and distributed without further permission from NASA”; NASA należy podać jako źródło; nie wolno sugerować poparcia NASA ani używać materiałów w sposób wprowadzający w błąd. Strona odsyła do wskazówek GIBS (podziękowanie – wpis o Blue Marble wyżej, w stopce).
- **Podpis:** na stronie tytułowej bez zmian „Tło: NASA Black Marble 2016 (GIBS)”; w stopce podpis Black Marble i podziękowanie dla GIBS – bez zmian. Bez logo NASA, bez sugerowania poparcia.
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 1 (warunki przeczytane w całości; kafelek z Europą obejrzany; sumy zgodne)

### Plakat kuli na stronie tytułowej (obraz pochodny od kafelków wyżej)

- **Co:** `public/obrazy/globus-plakat.webp` – nieruchomy obraz naszego globusa (kafelki Black Marble 2016 z kopii wyżej, odbarwienie MapLibre `raster-saturation: -0.3`, atmosfera MapLibre, złoty punkt Polski), widoczny od pierwszej klatki strony, zanim MapLibre i WebGL się uruchomią; potem prawdziwa kula przejmuje go w 0,3 s (`src/tytulowa.js`, `src/tytulowa.css`). WebP 1482 × 1482 px z przezroczystością, jakość 0,9, **92 728 B**, SHA-256 `f134f7b686300460706eeb51254c4ae99d313e8883aebe5bdcf78eead42df527`.
- **Jak powstał (23.11.2026, po obrocie kuli – wariant B, decyzja Ani):** zbudowana strona tytułowa (podgląd 127.0.0.1), okno 1440 × 900 przy gęstości pikseli 2, „ogranicz ruch” (kula stoi w pozycji startowej obrotu: środek widoku 19,4° E, 15,1° N – 37° na południe od Polski); po narysowaniu kuli wycięty z płótna MapLibre kwadrat 1482 px wokół środka (kula 1347 px = 0,6451 wysokości kontenera) i zapisany przez przeglądarkę jako WebP. Żeby płótno dało się odczytać, skrypt startowy przeglądarki (tylko na czas zrzutu, poza repo) włączał `preserveDrawingBuffer`. Narzędzie: agent-browser (Chrome) na komputerze Ani – bez pakietów w projekcie.
- **Wcześniej:** plakat z 21.11.2026 (72 614 B, SHA-256 `be57623d…`) – środek widoku 7,9° S, na kuli głównie Afryka. Zastąpiony 23.11.2026.
- **Zgodność położenia (23.11.2026):** zrzut z samym plakatem i z samą kulą w tej samej chwili – PSNR 34,1 dB (1440 × 900), 36,4 dB (1280 × 720), 36,9 dB (1920 × 1080); dla poprzedniego plakatu było 35,5 / 38,0 / 38,2 dB.
- **Kiedy wygenerować od nowa:** po zmianie środka widoku, wielkości kuli (`zoomKuli` w `src/tytulowa.js`), położenia `#globus` w CSS, kafelków albo wyglądu globusa (odbarwienie, atmosfera, punkt Polski).
- **Warunki i podpis:** jak przy kafelkach wyżej (NASA – bez ograniczeń, podać źródło, bez sugerowania poparcia); podpis „Tło: NASA Black Marble 2016 (GIBS)” bez zmian.
- **Data sprawdzenia:** 23.11.2026
- **Poziom weryfikacji:** 1 (obraz obejrzany; położenie zmierzone na trzech rozmiarach okna)

### Obrazki do udostępniania (og:image) – PL i EN (zrzut strony tytułowej)

- **Co:** `public/og-obraz.png` (strony PL: `/`, `/mapa/`) i `public/og-obraz-en.png` (strony EN: `/en/`, `/en/map/`) – zrzut
  strony tytułowej w danym języku, pokazywany przy udostępnianiu linku. PNG 1200 × 630 px: PL **260 636 B**, SHA-256
  `5647ed3fdce63a5acdadd2bdf454211a86f1541e2fe58dbbd1cc4d53e4521376`; EN **260 256 B**, SHA-256
  `f87cc2a71f408bad9cfe817f39226441b83fbd3e36300b6f767dbd6069cbd884`. Adres obrazka w stronie: klucz `meta.og_obraz`
  w słownikach `src/teksty/pl.js` / `en.js`.
- **Jak powstały (23.11.2026, wersja 3 strony tytułowej – napis „PRĄD W POLSCE” / „ELECTRICITY IN POLAND”, małe logo
  OSIRIS w pasku, kula po obrocie, jeden ekran bez sekcji „Co znajdziesz” – stopka na dole ekranu; oba tą samą metodą –
  decyzja Ani):** zbudowana strona (`npx vite build`, podgląd
  127.0.0.1:4173), przeglądarka agent-browser (Chrome) na komputerze Ani – bez pakietów w projekcie; okno 1200 × 630 przy
  gęstości pikseli 1, ciemny motyw i „ogranicz ruch” (duży napis w pełnej jasności, kula w pozycji startowej obrotu);
  czekanie, aż kula się narysuje (`#globus.globus--gotowy`) i wczytają się liczby, potem 1,2 s; na czas zrzutu ukryte
  (`visibility: hidden`, układ bez zmian) tylko to, co by się zestarzało: linijka „ostatnie pobranie / last retrieved”
  (`#liczba-pse`) i zegar „CZAS WARSZAWA / WARSAW TIME” (`.zegar`), a także rogi paska: „Źródła i licencje”, „Opis ▾”
  (`.rog--lewy`), przełącznik „PL | EN” (`.gora .jezyki`) i napis stopki „Źródła i licencje ▸” (`.stopka__zrodla summary`;
  zostaje cienka linia stopki) – decyzje Ani 23.11.2026; od 25.11.2026 przy następnym zrzucie ukryć tak samo także
  prawa autorskie w wierszu stopki (`.stopka__prawa--wiersz`) – wtedy obrazek wygląda jak dotąd; logo OSIRIS i podpis NASA zostają;
  zrzut całego okna. Liczby na obrazku: stan danych z dnia zrzutu (40 · 27,3 GW, 233 · 9,0 GW, 23).
- **Wcześniej:** polski obrazek z 20.11.2026 (commit 2ac509f) – sposób powstania nie był zapisany; pokazywał starszy wygląd
  strony i datę „ostatnie pobranie: 20.11, 15:50”. Zastąpiony 23.11.2026. Obrazki z 23.11.2026 z dużym napisem OSIRIS
  (PL 275 119 B, SHA-256 `602df1ab…`; EN 276 027 B, SHA-256 `bf80e8ad…`) – zastąpione tego samego dnia wersją 3. Pierwsze obrazki wersji 3 (PL 276 691 B, SHA-256 `56eb2433…`; EN 276 255 B,
  SHA-256 `3cc7b241…`) – jeszcze z kafelkami nad sekcją „Co znajdziesz”; zastąpione tego samego dnia (jeden ekran).
- **Kiedy wygenerować od nowa:** po zmianie wyglądu strony tytułowej, haseł, liczb (np. nowe dane GEM/EMODnet) albo tła.
- **Warunki i podpis:** na obrazku widać tło NASA Black Marble 2016 – warunki jak przy kafelkach wyżej; podpis
  „Tło: NASA Black Marble 2016 (GIBS)” / „Background: NASA Black Marble 2016 (GIBS)” jest na obrazku.
- **Data sprawdzenia:** 23.11.2026
- **Poziom weryfikacji:** 1 (oba obrazy obejrzane; wymiary i rozmiar plików sprawdzone)

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
- **Wygląd na mapie (od 25.11.2026, wariant C – decyzja Ani):** farmy „na liście MKiŚ” – pełna kropka; „brak na liście MKiŚ” – puste kółko widoczne zawsze, w okienku „weryfikacja: brak w wykazie MKiŚ (stan: styczeń 2024) – do sprawdzenia”; „prawdopodobny duplikat” – puste kółko widoczne dopiero od przybliżenia 9 (osobna warstwa `farmy-duplikaty`), w okienku „weryfikacja: możliwy duplikat: …”. Wartości w pliku danych bez zmian (są kluczami słownika); napisy na stronie – `farmy.pokaz.…` w `src/teksty/`. W każdym okienku farmy linijka źródła „MKiŚ · stan: styczeń 2024”.
- **Wykaz MKiŚ – przeczytany ponownie 25.11.2026 (tabela HTML, liczby do sprawdzenia oczami):** kolumna „Pozwolenie na wznoszenie i wykorzystywanie sztucznych wysp (PSZW) – maksymalna moc zainstalowana”; strona nazywa PSZW „pozwolenia lokalizacyjne”. Orlen Neptun 46.E.1 (Orlen Neptun VIII sp. z o.o.): 966 MW – stąd w okienku Baltic East „966 MW (maks. wg pozwolenia lokalizacyjnego)”.
- **EMODnet – surowe pola farm „brak na liście MKiŚ” (pobrane 25.11.2026):** Sharco Duo, Freeboard I i Licence Application No. 76 mają `status` „Planned”, `notes` puste; żadne pole nie opisuje ich jako wniosków (tylko nazwa „Licence Application No. 76”) – dlatego bez dopisku o wniosku.

### Aukcja URE dla morskich farm wiatrowych (AMFW/1/2025, 17.12.2025)

- **Źródło:** Urząd Regulacji Energetyki, „Offshore: Pierwsza aukcja dla morskich farm wiatrowych rozstrzygnięta”, aktualność 13009, data publikacji 18.12.2025: https://www.ure.gov.pl/pl/urzad/informacje-ogolne/aktualnosci/13009,Offshore-Pierwsza-aukcja-dla-morskich-farm-wiatrowych-rozstrzygnieta.html (wersja PDF z tej samej strony – zgodna).
- **Treść (przeczytane w całości 25.11.2026, HTML i PDF; liczby z tekstu strony – do sprawdzenia oczami):** trzech zwycięzców, łącznie 3,435 GW: „ORLEN Neptun VIII Sp. z o.o. – Morska Farma Wiatrowa Baltic East, o mocy zainstalowanej elektrycznej 900 MW”; „Elektrownia Wiatrowa Baltica 9 Sp. z o.o. – MFW Baltica 9, o mocy zainstalowanej elektrycznej 975 MW”; „MFW Bałtyk I S.A. – MFW Bałtyk I, o mocy zainstalowanej elektrycznej 1560 MW”. Ceny w zwycięskich ofertach: 476,88–492,32 zł/MWh. Pierwsza energia do sieci w ciągu 7 lat od zamknięcia sesji aukcji.
- **Szczegółowe wyniki w BIP URE** (https://bip.ure.gov.pl/bip/odnawialne-zrodla-energ/morskie-farmy-wiatrowe/4847,Ogloszenia-i-wyniki-aukcji.html) – nieczytane.
- **Na mapie:** dopisek „wygrał aukcję URE 17.12.2025” w okienkach Baltic East, Baltica 9 i obu faz Bałtyku I (przy fazach: „cały projekt MFW Bałtyk I: 1560 MW”); Baltic East: „moc: 966 MW (maks. wg pozwolenia lokalizacyjnego) · w aukcji URE: 900 MW”. Linijka źródła „URE · stan: 18.12.2025” z linkiem (`UZUPELNIENIA_FARM` w `src/main.js`).
- **Wniosek potwierdzony:** komunikat URE łączy spółkę ORLEN Neptun VIII z farmą Baltic East – wcześniej (19.11.2026) tylko wniosek ze zgodności mocy.
- **Licencja:** informacja publiczna; podajemy źródło i link.
- **Data sprawdzenia:** 25.11.2026
- **Poziom weryfikacji:** 1

### Uzupełnienie statusu: Baltic Power

- **Dane EMODnet zostają bez zmian** (status „Construction”, 1140 MW). Na stronie (od 25.11.2026): status „w rozruchu – część turbin produkuje” zamiast „w budowie” – **nie „działa”** (brak koncesji na wytwarzanie i eksploatacji komercyjnej; decyzja Ani 25.11.2026). Dopisek w okienku farmy, linijki źródeł z linkami i jedno zdanie w stopce (`UZUPELNIENIA_FARM` w `src/main.js`). Licznik: „23 farmy · 1 w rozruchu, 22 planowane” (legenda i zakładka „Skąd”).
- **Northland Power, raport za III kwartał 2026 (12.11.2026)** – https://northlandpower.com/northland-power-reports-third-quarter-2026-results-value-accretive-growth-updates-and-reaffirms-2026-guidance/ – przeczytany w całości 25.11.2026 (bez tabel finansowych), poziom 1 – źródło inwestora (49% udziałów):
  - „Reached a major milestone at Baltic Power by completing the installation of all 76 turbines, over 70% generating power and the project advancing through commissioning.”
  - „Northland continued to advance construction of the 1.1 GW Baltic Power project in Poland, with all 76 turbines installed and over 70% generating power. The project is advancing through commissioning in the fourth quarter of 2026.”
  - Brak daty eksploatacji komercyjnej i brak informacji o koncesji; przychody opisane jako „pre-completion revenues”.
- **ORLEN, komunikat z 10.07.2026** – https://www.orlen.pl/en/about-the-company/media/press-releases/current/2026/July-2026/a-historic-milestone-the-wind-farm-in-the-baltic-sea-delivers-first-power-to-the-polish-grid – przeczytany w całości 25.11.2026, poziom 1 – źródło inwestora (51% udziałów):
  - „Electricity generated by the Baltic Power offshore wind farm has entered Poland’s national power grid today. […] 54 of 76 turbines have already been installed offshore, with the first now generating electricity.”
  - „Achieving the First Power milestone means that the first turbine has started generating electricity and that the wind farm is entering the phased commissioning process.” Koncesja URE – „the final step”, po zakończeniu budowy.
- **Northland Power, komunikat z 10.07.2026** – https://northlandpower.com/northlands-baltic-power-reaches-first-power-delivering-first-offshore-wind-electricity-to-polands-grid/ – przeczytany w całości 25.11.2026, poziom 1: „has achieved first power, delivering the first electricity ever generated from offshore wind to Poland’s national grid”; „1.1-gigawatt”, „owned 49% by Northland and 51% by ORLEN”.
- **balticpower.pl (przeczytane w całości 20.11.2026, poziom 1):**
  - Komunikat z 10.07.2026, https://balticpower.pl/aktualnosci/morska-farma-wiatrowa-baltic-power-po-raz-pierwszy-wyprodukowa%C5%82a-i-dostarczy%C5%82a-energi%C4%99-z-morza-dla-polskiej-sieci-energetycznej/ – „Odbiór energii na stacji w gminie Choczewo potwierdziły Polskie Sieci Energetyczne”.
  - Komunikat z 7.10.2026, https://balticpower.pl/news/baltic-power-project-completes-installation-of-all-76-turbines-the-first-polish-offshore-wind-farm-in-poland-enters-the-final-stage-before-commercial-operations/ – „installation of the last, 76th turbine”; elektrownia „does not yet hold a generation license”; brak daty eksploatacji komercyjnej. To najnowsza informacja o koncesji, jaką mamy – na stronie z datą 7.10.2026.
- **Moc:** 76 × 15 MW = 1140 MW (= EMODnet); ORLEN podaje „approximately 1.2 GW”, Northland „1.1 GW”.

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

### Elektrownie działające: węgiel, gaz i olej, woda (od 20.11.2026)

- **Co na mapie:** z tego samego wyciągu (`public/data/zrodla-gem.geojson`, od 20.11.2026 z polem `paliwo` = kolumna „Fuel (combustion only)”) – tylko status „operating”, typy `coal`, `oil/gas`, `hydropower`. Bloki zsumowane w przeglądarce do jednej lokalizacji (`gem_location_id`) i rodzaju. Szczytowo-pompowe: technologia GEM „pumped storage”. Nie pokazujemy: bloków w budowie (np. gaz: 11 bloków, 4951 MW), biomasy, planowanych, wycofanych.
- **Liczby na mapie:** węgiel 40 elektrowni / 129 bloków / 27 262 MW; gaz i olej 23 / 30 / 5 326 MW; woda 2 / 2 / 226 MW; szczytowo-pompowe 6 / 6 / 1 875 MW.
- **Rodzaj węgla (pole Fuel):** „coal: bituminous” → węgiel kamienny (95 bloków, 18 115,5 MW), „coal: lignite” → węgiel brunatny (21 bloków, 8 527 MW), „coal: unknown” → rodzaj nieznany (13 bloków, 619,5 MW).
- **Progi GEM – dosłownie z arkusza About (tabela „Power Trackers | Latest release | Summary Tables include capacity above specified thresholds”):**
  - „Coal | 46204 | ≥30 megawatts (MW) or larger within the following parameters: all operating/mothballed units; all units retired since 2000; and all units proposed since 2010.”
  - „Oil and gas | 46235 | ≥50MW; ≥20MW in the European Union and the United Kingdom”
  - „Hydropower | 46082 | ≥30MW (≥10MW data are provided for some countries when the data were readily available.)”
  - Liczby 46204, 46235, 46082 to daty w formacie Excela (liczone od 46023 = styczeń 2026 w changelogu About): 46204 = lipiec 2026 (węgiel), 46235 = sierpień 2026 (gaz i olej), 46082 = marzec 2026 (woda).
  - Uwaga: w danych jest elektrownia gazowa o łącznej mocy 8,5 MW – poniżej progu 20 MW (GEM czasem podaje mniejsze obiekty).
- **Sprawdzian prawdy – porównanie z oficjalnymi danymi PSE:** „Raport 2025 KSE”, Tabela 1.1 „Struktura mocy zainstalowanej w KSE [MW]”, stan 31.12.2025, „Dane operatywne – wielkości brutto”, https://www.pse.pl/dane-systemowe/funkcjonowanie-kse/raporty-roczne-z-funkcjonowania-kse-za-rok/raporty-za-rok-2025 (tabela przeczytana w surowej treści strony 20.11.2026):

  | Rodzaj | GEM (działające) | PSE 31.12.2025 | GEM / PSE |
  |---|---|---|---|
  | węgiel kamienny | 18 115,5 MW (+ 619,5 MW „nieznany”) | 23 097 MW | 78% (81% z „nieznanym”) |
  | węgiel brunatny | 8 527 MW | 8 351 MW | 102% |
  | węgiel razem | 27 262 MW | 31 448 MW | 87% |
  | gaz (GEM: gaz i olej) | 5 326 MW | 6 346 MW („gazowe”) | 84% |
  | woda (GEM: wodne + szczytowo-pompowe) | 2 101 MW | 2 431 MW („Elektrownie zawodowe wodne”) | 86% |

  Możliwe przyczyny różnic (niezmierzone): progi GEM (węgiel od 30 MW, gaz od 20 MW w UE, woda od 30 MW – mniejsze bloki poza danymi); różne daty (PSE: 31.12.2025, GEM: marzec–sierpień 2026 – bloki wyłączone lub oddane w tym czasie); różne definicje (PSE dzieli na elektrownie zawodowe i „wiatrowe i inne odnawialne”, GEM ma też elektrownie przemysłowe; GEM „oil/gas” obejmuje gaz koksowniczy i olej); bloki przestawione na biomasę są w GEM jako bioenergia; PSE podaje wartości brutto. Węgiel brunatny w GEM o 2% więcej niż w PSE – niewyjaśnione.
  - Liczby porównania są tylko tutaj – na stronie ich nie ma (na stronie tylko moc poszczególnych elektrowni z GEM).

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

## PSE: dostępność mocy przyłączeniowej (wolne moce dla odbiorców i dla źródeł)

- **Co:** dokument PSE S.A. „Informacja o dostępności mocy przyłączeniowej do sieci przesyłowej” (Departament Rozwoju Systemu), obowiązek z art. 7 ust. 8l Prawa energetycznego. Rozdział 2: moc dla nowych źródeł (obszary, podobszary, grupy, stacje; kolumny 2026/2031, krok 1/krok 2 – PSE wskazuje do publikacji krok 2). Rozdział 5: moc dla odbiorców w 25 stacjach **planowanych** (dwie tabele: 14 stacji „dedykowanych dla zasilania nowych odbiorców” i 11 stacji budowanych z innych powodów, które „mogą również służyć do zasilania obiektów odbiorczych”). Dla stacji istniejących PSE podaje 0 MW.
- **Używamy w:** `public/data/moce-pse.json` (warstwa „Wolna moc dla odbiorców” i panel na mapie, `src/moce.js`), tworzony przez `scripts/pse-moce/robot.mjs` (odczyt PDF: `slowa-pdf.js` – wbudowany w macOS PDFKit, `parsuj.mjs`; sprawdzian prawdy: `sprawdz.mjs`; testy: `node --test scripts/pse-moce/testy.mjs`).
- **Link:** strona https://www.pse.pl/obszary-dzialalnosci/krajowy-system-elektroenergetyczny/informacja-o-dostepnosci-mocy-przylaczeniowej, PDF https://www.pse.pl/documents/20182/51490/informacja_o_dostepnosci_mocy_przylaczeniowej_do_sieci_przesylowej.pdf/81835e70-c6bb-4ed1-8154-1959a45b44f1
- **Stan danych:** 31.10.2026 („STAN NA 31 PAŹDZIERNIKA 2026 ROKU”, str. 1). Plik: Last-Modified 04.11.2026 14:04 GMT, 1 120 807 B, SHA-256 `e3612af437f862d071f299ff795081d4af15c2eb34b22dc5819e1ff8dd272555`. Surowy PDF – poza repo (`~/Projekty/_dane/pse/`).
- **Aktualizacja:** dokument: „co najmniej raz na miesiąc” (str. 3); strona www PSE podaje „co najmniej raz na kwartał” – niespójność u źródła. U nas: Robot OSIRIS (`.github/workflows/robot-osiris-pse.yml`) **co tydzień w środę o 05:17 UTC** (06:17 zimą, 07:17 latem czasu polskiego; od 21.11.2026), od 25.11.2026 także w czwartek o 05:47 UTC (zapas), i ręcznie – porównanie SHA-256; nowe dane tylko przez PR do akceptacji Ani, problem – issue. Wykaz rozdzielni (wpis niżej) robot jeszcze nie sprawdza – na liście „Do zrobienia” w BEZPIECZENSTWO.md.
- **Przetworzenie:** wyciąg tabel z rozdziałów 2 i 5 (wartości bez zmian, MW); nazwy stacji jak w PSE (kod + opis). Mocy różnych stacji nie sumujemy (PSE, str. 13: moc jednej stacji wpływa na moc stacji sąsiednich). Moc dla źródeł na mapie tylko jako jedno zdanie (wiersz „POLSKA”, krok 2). Jednostka w tabelach odbiorców nie jest podana w nagłówku – przyjmujemy MW z kontekstu (do potwierdzenia u PSE).
- **Zastrzeżenia PSE (dosłownie, wybór):** „Dostępne moce przyłączeniowe wyznaczone w kroku 2 uznać należy za prawdopodobne i przewidziane są do publikacji.”; „Dostępne moce przyłączeniowe odbiorcze podano dla roku 2031, ale należy zaznaczyć, że niektóre z nowych stacji planowane są do budowy w terminie późniejszym niż rok 2031.”; „Trasy linii oraz lokalizacje stacji należy traktować poglądowo”. W dokumencie nie pada słowo „szacunkowe” – „szacunek operatora” w okienku to nasze określenie.
- **Licencja:** w dokumencie brak jawnej licencji. Plik leży na www.pse.pl – prawdopodobnie obejmują go warunki ponownego wykorzystywania informacji z www.pse.pl (źródło, data pobrania, informacja o przetworzeniu, bez logo PSE – patrz wpis „PSE: produkcja z wiatru”). **Status do potwierdzenia.**
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 3 – Ania porównała wycinki PDF (`~/Projekty/_dane/pse/kontrola/`: POLSKA, Ostrów, EPK, DZO, CPK) z `moce-pse.json`: zgodne (21.11.2026). Wcześniej poziom 2 (21.11.2026). Pierwszy odczyt: położenia słów z PDFKit (`slowa-pdf.js` + `parsuj.mjs`), porównany przez Claude z obrazami stron 5–8 i 12–13. Drugi odczyt inną metodą: zwykły tekst stron z PDFKit (`page.string`, kolejność strumienia tekstu, osobny skrypt bez parsera) dla wiersza POLSKA i wszystkich 25 stacji z mocą dla odbiorców – 26/26 zgodnych, 0 różnic. Zastrzeżenie: obie metody korzystają z tej samej biblioteki (PDFKit w macOS), różni je sposób odczytu.

### PSE: wykaz rozdzielni bez możliwości przyłączenia (uwaga przy stacjach z mocą dla odbiorców)

- **Co:** „Wykaz rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów” (XLSX), arkusz „Lista zajętych rozdzielni”, „Stan na dzień 4.02.2026 r.”. Trzy listy, w każdym wierszu „Liczba dostępnych miejsc przyłączenia” = 0: (1) 37 rozdzielni istniejących stacji – „Wnioski będą rozpatrywane poprzez wydanie odmowy określenia warunków przyłączenia ze względu na brak warunków technicznych i ekonomicznych, bez weryfikacji złożonego wniosku.”; (2) 6 planowanych rozdzielni, „których PSE S.A. nie będą właścicielem, lub ich realizacja nie została jeszcze przesądzona”; (3) 24 planowane rozdzielnie, „których realizacja została uwzględniona warunkowo” – dla (2) i (3): „Wnioski złożone do tych rozdzielni pozostaną bez weryfikacji i bez rozpatrzenia”.
- **Używamy w:** `public/data/rozdzielnie-pse.json` (wyciąg: `scripts/pse-moce/rozdzielnie.mjs`, bez pakietów – XLSX czytany wbudowanym zlib). Na mapie: 16 z 25 stacji z mocą dla odbiorców jest na listach 2 i 3, ale wykaz wymienia różne rozdzielnie, więc rozróżniamy (decyzja Ani 21.11.2026, reguła w `src/wykaz-rozdzielni.js`, pilnowana testem):
  - **11 stacji z rozdzielnią 220 lub 400 kV w wykazie** (DZO, EPK, GNA, KUZ, LWN, MAO, REM, SBO, SWR, WRS, ZER – wszystkie z 400 kV, niektóre także 110/220 kV): pusty sześciokąt, w okienku „wnioski o przyłączenie do tej stacji obecnie pozostają bez rozpatrzenia”.
  - **5 stacji tylko z rozdzielnią 110 kV w wykazie** (DMO, EJ1 – w wykazie „BEB (EJ1)”, MKA, PBO, PSC; lista 2): pełny sześciokąt, w okienku zawężone zdanie „wnioski do rozdzielni 110 kV tej stacji obecnie pozostają bez rozpatrzenia; o rozdzielniach 220/400 kV wykaz nie mówi”, na liście „110 kV – bez rozpatrzenia”. Powód: do 220/400 kV przyłączają się najwięksi odbiorcy, a o tych rozdzielniach wykaz nic nie mówi.
- **Link:** strona https://www.pse.pl/dane-systemowe/praca-kse/informacje-ogolne/wykaz-obiektow-planowanych-do-przylaczenia, plik https://www.pse.pl/documents/20182/51490/20260204_Lista_rozdzielni-brak_mozliwosci_przylaczenia.xlsx (na stronie także archiwalne wersje z 13.08.2025 i 4.09.2025).
- **Plik:** Last-Modified 04.02.2026 09:26 GMT, 16 074 B, SHA-256 `5fb56e497860b7584734386122910e5d10deae750b21d4b0557dc70a970e1348`. Surowy XLSX – poza repo (`~/Projekty/_dane/pse/`).
- **Różnica dat:** wykaz ma stan na **04.02.2026**, a moce przyłączeniowe – stan na **31.10.2026**. 21.11.2026 na stronie PSE nie było nowszego wykazu. Nie wiemy, czy PSE uważa wykaz za nadal aktualny – w okienku piszemy obie daty i „obecnie pozostają bez rozpatrzenia” według wykazu.
- **Przetworzenie:** wyciąg wszystkich wierszy trzech list (ZKO PSE, symbol stacji, nazwa albo pozycja w PRSP, rozdzielnia, liczba miejsc) oraz uwag końcowych. **Nie przenosimy komentarza z arkusza** (notatka wewnętrzna z danymi autora). Symbol „BEB (EJ1)” = oba kody tej samej stacji.
- **Licencja:** w pliku brak – jak wyżej (warunki www.pse.pl, **status do potwierdzenia**).
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 1 (Claude: arkusz przeczytany w całości Pythonem i osobno skryptem Node – wyniki zgodne, test `wykaz: prawdziwy XLSX`).
- **Sprawdzenie 26.11.2026:** nowszej wersji brak – strona PSE (oba adresy działu) jako aktualny podaje plik `20260204_…` (XLSX i PDF), obok tylko wersje z 13.08.2025 i 4.09.2025; nagłówki pliku bez zmian (Last-Modified 04.02.2026 09:26:46 GMT, 16 074 B).

### Lokalizacje stacji z mocą dla odbiorców (OpenStreetMap)

- **Co:** miejsce na mapie dla 23 z 25 stacji: 4 planowane stacje są już w OSM (`power=substation` w budowie/planowane albo bez kodu PSE – dopasowanie niepewne), 19 to koła o promieniu 20 km wokół miejscowości z OSM (`place`) wskazanej w opisie PSE („w rejonie X”, nazwa stacji). Promień 20 km i wybór środka (np. Sopot dla „rejonu Trójmiasta”) – nasza decyzja, PSE ich nie podaje. Bez miejsca: PBO Podborze (w OSM kilkanaście miejscowości, żadna w rejonie ze schematu PSE) i SBO („na terenie Pomorza Zachodniego”).
- **Używamy w:** `scripts/pse-moce/lokalizacje.json` (wybór z uzasadnieniem przy każdej stacji, współrzędne z `scripts/pse-moce/pobierz-lokalizacje.mjs`) → `public/data/moce-pse.json`. **Te współrzędne są na licencji ODbL** (© OpenStreetMap contributors).
- **Stan OSM:** 21.11.2026, 07:33:06 UTC (`timestamp_osm_base`).
- **Licencja:** ODbL 1.0 – jak wpis „OpenStreetMap: linie najwyższych napięć”.
- **Data sprawdzenia:** 21.11.2026
- **Poziom weryfikacji:** 1 (wybór Claude; do sprawdzenia przez Anię).

### PSE: projekt planu rozwoju sieci przesyłowej 2027–2036 (terminy zadań budowy stacji z mocą dla odbiorców, od 26.11.2026)

- **Co:** „Plan rozwoju w zakresie zaspokojenia obecnego i przyszłego zapotrzebowania na energię elektryczną na lata 2027-2036. Dokument główny”, okładka „Kwiecień 2026 r.”, 120 stron – wersja „projekt po konsultacjach”. Tab. 5.2 „Planowane zadania inwestycyjne…” (str. 56–62) i Tab. 5.3 „Realizowane zadania inwestycyjne…” (str. 63–76): numer zadania, nazwa, cel, rok rozpoczęcia, rok zakończenia z przypisami.
- **Status:** projekt, **przed uzgodnieniem z Prezesem URE**. Wpis PSE z 2.02.2026: „Po przeprowadzeniu konsultacji dokument trafi do uzgodnienia z Prezesem Urzędu Regulacji Energetyki”. Informacji o uzgodnieniu nie znaleziono (26.11.2026: aktualności PSE, wyszukiwarka; nie przejrzano całego archiwum).
- **Używamy w:** `public/data/plan-rozwoju-pse.json` (25 wpisów, odczyt ręczny) → linijka „zadanie budowy stacji: RRRR–RRRR” przy stacji w zakładce „Gdzie” (E1 „Planuję inwestycję”); test: `node --test scripts/testy-wyszukiwarka.mjs`.
- **Link:** wpis https://www.pse.pl/-/projekt-nowego-planu-rozwoju-sieci-przesylowej-na-lata-2027-2036 (2.02.2026, przeczytany w całości), PDF https://www.pse.pl/documents/20182/7102190804/PRSP_2027-2036-dokument_glowny_projekt_po_konsultacji.pdf/de2f004f-8a80-4264-907a-a38d52c5d50f
- **Plik:** Last-Modified 23.04.2026 11:49:46 GMT, 4 510 145 B, SHA-256 `5273f6837f5051a2de077f8904cb497fb9dcbab3e9302d8a4f8d34211ca3cc19`. Surowy PDF – poza repo (`~/Projekty/_dane/pse/pse-prsp-2027-2036-projekt-po-konsultacji-pobrano-2026-11-26.pdf`).
- **„Rok zakończenia”:** przypis *3: „Data zakończenia zadania zarówno pod względem technicznym jak i finansowym i formalnym” – nie data uruchomienia stacji. Budowa stacji i budowa linii do niej to w planie **osobne zadania**, linie bywają z późniejszym terminem (np. Toruń: stacja III.63 do 2032, linie III.64–III.66 do 2035 – wskazała Ania 26.11.2026, zgodne z obrazem str. 57). Na stronie zawsze „zadanie budowy stacji: RRRR–RRRR” / „substation construction task”, nigdy „stacja gotowa” ani „uruchomienie”; lat linii nie pokazujemy (decyzja Ani 26.11.2026).
- **Przypisy przy latach (str. 62 i 76, dosłownie):** (1) „Zasadność realizacji zadania i jego termin uzależnione są od powstania i rozwoju odbiorców energii na danym terenie inwestycyjnym.” (2) „Termin realizacji zadania uzależniony jest od faktu oraz harmonogramu fizycznej budowy: źródła wytwórczego, odbiorcy energii elektrycznej albo magazynu energii elektrycznej.” (4) „Zasadność realizacji zadania i jego harmonogram uzależnione są od budowy infrastruktury Portu Polska.” (6) „Harmonogram realizacji zadania uzależniony jest od liczby bloków, ich mocy oraz harmonogramu budowy.” Na stronie – prostymi słowami (teksty `plan.przypis.*`), oryginał w objaśnieniu.
- **Dopasowanie stacji** (kodów PSE w tabelach nie ma – są tylko na mapach str. 84–92, bez lat; pole `dopasowanie` w pliku danych, na stronie tylko „niepewne”): 16 stacji przez numer z kolumny „Poz. w PRSP 2025 - 2034” wykazu rozdzielni → pełna nazwa zadania w planie 2025–2034 → to samo zadanie w projekcie 2027–2036 (m.in. ZER = linia Kromolice-Pątnów, PSC = Baczyna-Plewiska; REM = Mościska-Miłosna, SWR = Kozienice-Miłosna); 8 tylko po nazwie (NOR, WIG, WYP, DSC, CPK, WTN, MAK, ZGN); POM – niepewne: w planie „rozbudowa stacji 110 kV Pomorzany o rozdzielnię 220 kV” (istniejąca stacja), w wykazie mocy PSE – stacja planowana (na stronie: lata z dopiskiem dlaczego – decyzja Ani 26.11.2026).
- **Przeczytane strony:** 57–60, 62–63, 65, 67, 69, 71–73, 75–76 (obrazy stron z PDFKit; numery i nazwy także w tekście). Nie cały dokument.
- **Licencja:** w dokumencie brak – jak inne pliki z www.pse.pl (status do potwierdzenia).
- **Data sprawdzenia:** 26.11.2026
- **Poziom weryfikacji:** **3 dla 10 stacji** – Ania 26.11.2026 porównała w PDF pobranym ze strony pse.pl (SHA-256 zgodny z plikiem OSIRIS) lata i przypisy: MKA (III.19), PBO (II.70), LWN (III.70), ZER (III.71), REM (III.73), SWR (III.77), DZO (III.63), MAO (III.67), EPK (III.68), WRS (III.69) – wszystkie zgodne. **1 dla pozostałych 15** (odczyt Claude). Pole `poziom_weryfikacji` przy każdej stacji w pliku danych.

### PSE: plan rozwoju sieci przesyłowej 2025–2034 (uzgodniony – tylko do dopasowania, od 26.11.2026)

- **Co:** „Plan rozwoju … na lata 2025-2034. Dokument główny”, „Grudzień 2024 r.”, 100 stron. **Uzgodniony przez Prezesa URE 20.12.2024** (wpis PSE z 2.01.2025: https://www.pse.pl/-/projekt-nowego-planu-rozwoju-sieci-przesylowej-na-lata-2025-2034-uzgodniony – „20 grudnia 2024 r. Prezes URE uzgodnił Plan rozwoju sieci przesyłowej (PRSP) na lata 2025-2034”).
- **Używamy w:** tylko do dopasowania numerów z wykazu rozdzielni („Poz. w PRSP 2025 - 2034”) do nazw zadań (pole `pozycja_prsp_2025_2034` w `plan-rozwoju-pse.json`); lat z tego planu na stronie nie pokazujemy.
- **Link:** https://www.pse.pl/documents/20182/21595261/PRSP_2025_2034_dokument_glowny_2024_12_20.pdf/55b0f905-3dd9-4e7e-b33a-78694e893928
- **Plik:** Last-Modified 26.03.2025 12:58:43 GMT, 3 012 554 B, SHA-256 `bab5922f592e933cc7ccc0f201dcab7109fb285822ec704c2d2780ad08dbaae6`. Surowy PDF – poza repo (`~/Projekty/_dane/pse/pse-prsp-2025-2034-uzgodniony-pobrano-2026-11-26.pdf`).
- **Uwaga:** tytuł rozdz. 6 dokumentu o dostępności mocy mówi o „PRSP na lata 2026-2035” – takiego planu nie znaleziono (str. 3 tego samego dokumentu: PRSP 2025–2034). Niespójność u źródła.
- **Przeczytane strony:** 54, 56, 58 (obrazy) + wyszukiwanie numerów w tekście.
- **Data sprawdzenia:** 26.11.2026 · **Poziom weryfikacji:** 1

### PSE: „co dalej” – strona „Dokumenty” (link w zakładce „Gdzie”, od 26.11.2026)

- **Adres:** https://www.pse.pl/dokumenty – HTTP 200 (26.11.2026). Ścieżka w menu strony: „Wzory wniosków i umów → Wnioski o określenie warunków przyłączenia do sieci przesyłowej” (folder otwierany skryptem – bez własnego adresu, dlatego link do strony i opis ścieżki). Tylko link, bez kopiowania treści i bez rad.
- **Odrzucone:** komunikat PSE „Zmiany w sposobie rozpatrywania wniosków o określenie warunków przyłączenia” (31.07.2025, przeczytany w całości 26.11.2026) – o kolejce i zmianach od 1.08.2025, nie o drodze odbiorcy; zapowiadana reforma („jesienią 2025 r.”) nieaktualna.
- **Licencja:** nie dotyczy (sam link). **Data sprawdzenia:** 26.11.2026 · **Poziom weryfikacji:** 1

## Operatorzy dystrybucyjni – strony z informacją o dostępnej mocy (od 25.11.2026)

- **Co:** linki w zakładce „Gdzie” Karty Polski do stron pięciu największych operatorów systemu dystrybucyjnego (OSD), na których publikują informację o dostępnej mocy przyłączeniowej w swojej sieci. **Tylko linki – danych operatorów nie pobieramy, nie zapisujemy i nie pokazujemy** (na stronie: „OSIRIS jeszcze tych danych nie pokazuje”).
- **Adresy** (linkujemy do strony operatora, nie do pliku PDF z wersją w adresie; każdy otwiera się – HTTP 200, sprawdzone 25.11.2026):
  - Stoen Operator (Warszawa): https://www.stoen.pl/strona/siec – na stronie: „Zgodnie z art. 7 ust. 8l pkt. 2 Ustawy Prawo Energetyczne, Stoen Operator przedstawia wielkości dostępnej mocy przyłączeniowej w sieci elektroenergetycznej o napięciu wyższym niż 1 kV.”
  - PGE Dystrybucja (głównie wschód i centrum): https://pgedystrybucja.pl/przylaczenia/procedury-przylaczeniowe/informacja-o-lacznej-dostepnej-mocy-przylaczeniowej – strona „Informacja o łącznej dostępnej mocy przyłączeniowej”. Tekst strony mówi o mocach „dla źródeł wytwórczych przyłączanych do sieci o napięciu znamionowym wyższym niż 1kV” i że opracowanie „ma charakter szacunkowy” – ale **plik PDF z tej strony ma też moc dla odbiorców**: „Informacja o łącznej dostępnej mocy przyłączeniowej dla obiektów przyłączanych do sieci elektroenergetycznej PGE Dystrybucja S.A. o napięciu znamionowym powyżej 1 kV – III kwartał 2026”, stan na 30.09.2026, 12 stron; tabela „Wartości łącznej dostępnej mocy przyłączeniowej [MW] **odbiorczej** dla obiektów przyłączanych do sieci o napięciu znamionowym powyżej 1 kV” (w odczycie tekstu „Tabela 0.2”; w researchu Ani 21.11.2026 – Tabela 2.2; numeru w druku nie oglądałam) obok tabeli mocy wytwórczej. Plik otwarty 25.11.2026 tylko do odczytu (przez przeglądarkę, chwilowo w folderze roboczym poza repo, potem usunięty) – w repo go nie ma i liczb z niego nie bierzemy. Dlatego link bez dopisku „dla elektrowni”. Strona ma zabezpieczenie przed automatami (odczyt tylko przez przeglądarkę; drugie żądanie w tej samej sesji PGE odrzuca).
  - Energa-Operator (głównie północ): https://energa-operator.pl/przylaczenie-do-sieci/informacje-o-stanie-przylaczen – „Informacja o wartości łącznej dostępnej odbiorczej mocy przyłączeniowej … sporządzona zgodnie z wymaganiami Art. 7 ust. 8l pkt 1), 3) i 4)” oraz osobno moc wytwórcza (pkt 2).
  - Enea Operator (głównie zachód): https://www.operator.enea.pl/przylaczenie-do-sieci/dostepne-moce – strona „Dostępne moce odbiorcze”.
  - TAURON Dystrybucja (głównie południe): https://www.tauron-dystrybucja.pl/przylaczenie-do-sieci/dostepne-moce – „Dostępne Moce przyłączeniowe dla Odbiorców i Wytwórców”; z niej portal z mapą https://dostepnemoce.tauron-dystrybucja.pl/ („Dane prezentowane na mapach mają charakter orientacyjny”).
- **Na stronie:** zakładka „Gdzie” Karty Polski – zdanie o OSD z objaśnieniem F1 i lista 5 linków widoczna od razu (wariant B, decyzja Ani 25.11.2026).
- **Obszary w nawiasach** („głównie …”) – opis OSIRIS w przybliżeniu; obszary działania operatorów nie pokrywają się z regionami kraju.
- **Podstawa prawna:** ustawa Prawo energetyczne, tekst jednolity Dz.U. 2026 poz. 43 (obwieszczenie Marszałka Sejmu z 5.12.2025; w ISAP status „obowiązujący”; PDF z https://api.sejm.gov.pl/eli/acts/DU/2026/43/text.pdf odczytany 25.11.2026). Art. 7 ust. 8l: przedsiębiorstwo zajmujące się przesyłaniem lub dystrybucją energii elektrycznej sporządza informacje o podmiotach ubiegających się o przyłączenie źródeł (pkt 1) i o „wartości łącznej dostępnej mocy przyłączeniowej dla źródeł” (pkt 2), zamieszcza je na swojej stronie internetowej i **„aktualizuje co najmniej raz na kwartał”**. **Ograniczenia tego odczytu:** w tym tekście jednolitym ust. 8l ma tylko pkt 1 i 2 (oba o źródłach), a **ust. 8m nie znaleziono**; Energa powołuje się przy mocy *odbiorczej* na pkt 3 i 4 – prawdopodobnie z późniejszej zmiany ustawy (w ISAP data zmiany aktu: 26.10.2026), niesprawdzone.
- **TAURON – wtórne wykorzystanie danych:** według researchu Ani TAURON zakazuje wtórnego wykorzystania swojej bazy. W tym sprawdzeniu (strona główna portalu dostepnemoce.tauron-dystrybucja.pl i strona „Dostępne moce” na tauron-dystrybucja.pl, 25.11.2026) tego zdania nie znaleziono – do potwierdzenia, zanim kiedykolwiek pobierzemy dane. Do tego czasu – tylko link.
- **Licencja:** nie dotyczy (sam link do publicznej strony, bez kopiowania treści).
- **Data sprawdzenia:** 25.11.2026
- **Poziom weryfikacji:** 1 (strony otwarte i przeczytane przez Claude – curl i Chrome przez Playwright; PGE tylko przez przeglądarkę)

## Inspiracje (bez kopiowania kodu)

- **God's Eye View**, Bilawal Sidhu, https://github.com/bilawalsidhu/gods-eye-view, licencja MIT (kod). Inspiracja dla wyglądu i zaufania do danych: linijka „źródło i data” w okienkach, liczniki i stan danych przy warstwach, typografia o stałej szerokości z małymi etykietami wielkimi literami, panele „szkło”, narożniki ramek. Kod OSIRIS jest napisany od nowa – żaden fragment nie jest skopiowany. Nie przejmujemy efektów NVG/FLIR/CRT: FLIR w God's Eye View pokazuje „temperaturę” wyliczoną z jasności obrazu, a NVG znacznik „REC” – sugerują pomiar i nagrywanie, których nie ma.
- Przeczytane 20.11.2026 (lokalny klon do odczytu, bez uruchamiania).
- **Strona tytułowa OSIRIS (od 20.11.2026)** – inspiracja stylem God's Eye View: ciemne tło, cienki wielki tytuł z rozstrzelonymi literami, małe etykiety czcionką o stałej szerokości, cienkie ramki, kolorowe chipy, rząd liczb, zegar w rogu, obracający się globus z turkusowo-niebieską poświatą atmosfery. Nie kopiujemy kodu, logo, tekstów ani układu 1:1 – teksty, układ, kolory danych (złoto, zieleń, czerwień węgla…) i liczby są nasze; czcionki: nasze Inter i JetBrains Mono.

## Czcionki (nie są źródłem danych – dla porządku licencji)

- **Inter** i **JetBrains Mono**, SIL Open Font License 1.1. Pliki z paczek npm `@fontsource/inter` 5.3.0 i `@fontsource/jetbrains-mono` 5.3.0 (przypięte wersje), tylko zestawy znaków „latin” i „latin-ext” (polskie litery), grubości 400 i 600 – deklaracje w `src/czcionki.css`. Teksty licencji: `public/licencje/OFL-Inter.txt`, `public/licencje/OFL-JetBrains-Mono.txt` (trafiają do gotowej strony razem z czcionkami; link w stopce). Czcionki są na naszym serwerze – przeglądarka widza nie łączy się z Google Fonts.
- **Outfit** (tylko logo SOURCE, od 26.11.2026 – zmiana nazwy, decyzja Ani), SIL Open Font License 1.1, grubość 300, tylko zestaw „latin” (w logo nie ma polskich liter). Plik `public/fonts/outfit-latin-300-normal.woff2` – **13 956 B**, SHA-256 `ef88e74f63ce75b54cce4d5a4087c6f180750b9ebae6ab6e5bf2a9939bf6958f`, z paczki `@fontsource/outfit` **5.3.0** (licencja OFL-1.1, bez skryptów instalacyjnych i zależności – rejestr npm, 26.11.2026), pobrany **bez npm** z kopii paczki na jsDelivr (wersja przypięta w adresie): https://cdn.jsdelivr.net/npm/@fontsource/outfit@5.3.0/files/outfit-latin-300-normal.woff2. Licencja: `public/licencje/OFL-Outfit.txt` – 4 387 B, SHA-256 `0e5fcef5d93bfcae273c11c00f0bb453d3b5491860e1ac8b658767b7577c938f` („Copyright 2021 The Outfit Project Authors (https://github.com/Outfitio/Outfit-Fonts)”), z https://cdn.jsdelivr.net/npm/@fontsource/outfit@5.3.0/LICENSE; link w stopce. Deklaracja: `src/czcionki.css`. Plik na naszym serwerze – przeglądarka widza nie łączy się z Google Fonts ani z jsDelivr. Data sprawdzenia: 26.11.2026 · Poziom weryfikacji: 1.
