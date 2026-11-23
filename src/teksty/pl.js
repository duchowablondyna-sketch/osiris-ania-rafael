// Słownik PL – wszystkie teksty stron po polsku. Ten sam zestaw kluczy co src/teksty/en.js
// (pilnuje tego test: node --test scripts/testy-jezyki.mjs).
// Wartość: napis albo funkcja (gdy w tekście jest liczba albo data). W HTML stron można użyć tylko napisów –
// znacznik {{klucz}} (scripts/jezyki.mjs); w JavaScripcie – t('klucz', …) z src/jezyk.js.
// Teksty mogą zawierać proste znaczniki HTML (np. <sub>), bo trafiają do HTML strony.

export default {
  // ── <head>: tytuł karty i opisy do udostępniania ──
  'meta.tytul': 'OSIRIS – mapa prądu Polski',
  'meta.opis':
    'Zobacz w jednym miejscu, skąd Polska bierze prąd i ile on kosztuje. Elektrownie, farmy wiatrowe, linie najwyższych napięć, produkcja z wiatru i cena energii – z oficjalnych, publicznych źródeł.',
  'meta.og_tytul': 'OSIRIS – serce danych o polskim prądzie',
  'meta.og_opis':
    'Skąd Polska bierze prąd i ile on kosztuje – elektrownie, farmy wiatrowe, sieć najwyższych napięć, wiatr i cena energii. Z oficjalnych, publicznych źródeł, z datą przy każdej liczbie.',
  'meta.og_obraz_alt': 'OSIRIS – mapa prądu Polski: tytuł i nocny globus z zaznaczoną Polską',
  'meta.og_locale': 'pl_PL',

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
  'tytulowa.co_znajdziesz': 'CO ZNAJDZIESZ',
  'tytulowa.karta_mapa_tytul': 'Mapa źródeł prądu',
  'tytulowa.karta_mapa_tekst': 'Elektrownie i farmy wiatrowe na tle sieci najwyższych napięć.',
  'tytulowa.karta_wiatr_tytul': 'Wiatr na żywo',
  'tytulowa.karta_wiatr_tekst': 'Ile prądu dają teraz polskie wiatraki i kiedy PSE ostatnio kazało ograniczyć ich pracę.',
  'tytulowa.karta_cena_tytul': 'Cena prądu',
  'tytulowa.karta_cena_tekst': 'Godzina po godzinie, z odtwarzaniem całej doby.',
  'tytulowa.zapowiedz': 'ZAPOWIEDŹ',
  'tytulowa.wkrotce_tytul': 'Wkrótce: gdzie jeszcze da się podłączyć',
  'tytulowa.wkrotce_tekst': 'Wolne moce przyłączeniowe w całej Polsce.',
};
