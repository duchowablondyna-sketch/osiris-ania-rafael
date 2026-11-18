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
