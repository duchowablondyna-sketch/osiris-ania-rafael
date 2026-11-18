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
