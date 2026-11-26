# OSIRIS: zasady projektu

## Etap: TRACER BULLET (obowiązuje, dopóki nie zostanie odwołany)
Tracer bullet nr 1 (liczba z PSE na stronie) – zakończony 18.11.2026.
Tracer bullet nr 2 (farmy na Bałtyku) – zakończony 18.11.2026.
Tracer bullet nr 3 (linie 220/400 kV z OpenStreetMap) – zakończony 19.11.2026.
Tracer bullet nr 4 (ograniczenia wiatru przez PSE w okienku) – zakończony 19.11.2026.
Tracer bullet nr 5 (wykres produkcji wiatru z bieżącej doby) – zakończony 19.11.2026.
Tracer bullet nr 6 (cena prądu RCE teraz i wykres bieżącej doby) – zakończony 19.11.2026.
Automatyczne odświeżanie strony (Cloudflare Deploy Hook z GitHub Actions, co 4 godziny) – zakończone 19.11.2026.
Wygląd 1 (globus + ciemny kosmiczny motyw + tło satelitarne NASA GIBS) – zakończony 20.11.2026.
„Prąd nocą” (przełącznik Dzień/Noc, tło nocne NASA Black Marble 2016) – zakończony 20.11.2026.
„Odtwarzanie doby” (wiatr i cena RCE co 15 min, przycisk) – zakończony 20.11.2026.
Mapa źródeł prądu, część 1 (lądowe farmy wiatrowe ≥10 MW z GEM) – zakończona 20.11.2026.
Mapa źródeł prądu, część 2 (działające elektrownie z GEM, legenda z przełącznikami, zwijana stopka) – zakończona 20.11.2026.
„Wygląd i zaufanie” (źródło w okienkach, liczniki, czcionki u nas, szkło, lot po przełączeniu) – zakończony 20.11.2026.
Strona tytułowa na / i mapa na /mapa/ – zakończone (PR #16).
Wolne moce przyłączeniowe – część 1: PSE (warstwa „Wolna moc dla odbiorców”, wykaz rozdzielni, Robot OSIRIS etap A) – zakończona 21.11.2026 (PR #17, #18).
Robot OSIRIS etap B (co tydzień, środa 05:17 UTC i czwartek 05:47 UTC, sprawdza dokument PSE o dostępności mocy przyłączeniowej; ręczne uruchamianie zostaje) – działa od 21.11.2026 (PR #22).

Cel: „Karta Polski”.
- 5 kafelków: główne źródło (węgiel razem), cena RCE, ślad CO2 (szacunek OSIRIS), OZE %, wymiana z zagranicą.
- Paski: produkcja na tle mocy zainstalowanej; wiatr i PV kreskowane, z „?” – osobny, późniejszy PR (d). Panel B (PR b) ma jeden pasek miksu (kamienny / brunatny / gaz i inne / OZE).
- Panel B – wariant B (decyzja Ani 21.11.2026): lewy dolny róg, zwijany, zwinięty na starcie (tryb spokojny, decyzja Ani 23.11.2026; po rozwinięciu otwarta zakładka ILE I JAK CZYSTO); 4 zakładki: SKĄD (te same pola warstw elektrowni i farm co legenda, bez lotu), GDZIE (panel wolnej mocy), ILE I JAK CZYSTO (otwarta na starcie: liczba-bohater – węgiel albo OZE, czego więcej – pasek z legendą do 0,1%, w rzędzie cena RCE / ślad CO2 / wymiana, źródło, Metodologia rozwijana w panelu, kłódka „Karta lokalizacji – wkrótce”), CO SIĘ ZMIENI („Wkrótce.”). Plakietka starych danych po 6 h. OZE zielony #4ade80; turkus tylko dla wolnej mocy; KOBiZE tylko w Metodologii.
- Podpis „stan na HH:MM · PSE opublikowało HH:MM” zamiast „teraz”.
- Źródło miksu: PSE API `his-gen-pal-sire`; przy każdym pobraniu sprawdzian zgodności z `his-wlk-cal` (wiatr i PV).

Wersja angielska (/en/, /en/map/) – zakończona 23.11.2026 (PR #33 e1, #34 e2, e3 stopka + obrazki do udostępniania).
Zasady na dalej:
- Jeden szablon strony, dwa słowniki (src/teksty/pl.js i en.js, słowniczek pojęć na górze en.js), cytaty PSE:
  src/teksty/cytaty-pse.js, wtyczka scripts/jezyki.mjs. Każdy nowy tekst na stronie – od razu w obu słownikach.
- Test: node --test scripts/testy-jezyki.mjs (lista przejściowa pusta – nowy tekst bez tłumaczenia go wywraca).
- Licencje i wymagane podpisy w stopce – w oryginale; tłumaczymy tylko nasze objaśnienia.
- Obrazki do udostępniania (public/og-obraz.png, og-obraz-en.png) – po zmianie wyglądu strony tytułowej zrobić od nowa
  (sposób w ZRODLA.md).
- Robot OSIRIS, jego issue i PR-y oraz ZRODLA.md zostają po polsku.

Następne w kolejce: operatorzy OSD (Stoen, potem PGE, Energa).

W tle (nie blokują celu): Otwarte punkty Robota OSIRIS: patrz BEZPIECZENSTWO.md → Do zrobienia.

Robimy tylko to, bez czego cel nie zostanie osiągnięty.
Nie robimy teraz: innych animacji, nowych warstw danych na mapie i wersji na telefon (to później).
Zanim zaproponujesz cokolwiek, sprawdź: czy bez tego cel zostanie osiągnięty? Jeśli tak — nie proponuj, dopisz najwyżej jedną linię do listy „Do zrobienia” w BEZPIECZENSTWO.md.

## Cel
Strona z mapą pokazującą, jak i gdzie Polska może uzyskać więcej prądu. Repo: osiris-ania-rafael (Ania i Rafael).

## Zasady wyglądu (decyzje Ani, stałe)
- Nazwa na stronie (decyzje Ani 26.11.2026): **SOURCE**, tytuł „ENERGIA W POLSCE” / „ENERGY IN POLAND”. Logo: krój Outfit 300 (u nas, `public/fonts/`), litera O = „zaćmienie” (ciemny krąg, złoty pierścień `--zloto`, iskra u góry po prawej; `.wm`, `.o`, `.iskra` w src/style.css), bez ruchu, czytnik czyta „SOURCE”. Strona tytułowa – rozmiar jak dawny OSIRIS (0,875rem); przycisk powrotu na mapie – bez napisu: „←” + ikona zaćmienia (komputer 18 px, telefon 16 px, pole dotyku min. 44 × 44 px; aria-label „SOURCE – strona tytułowa”); kropka przy „CZAS WARSZAWA” – mniejsza, w kolorze napisu (decyzje Ani 26.11.2026); „O nas” – zwykły tekst. Na stronie „sprawdzono automatycznie” (nie „Robot OSIRIS”). Wewnątrz (repo, Robot OSIRIS, workflow, klucze, komentarze) nazwa OSIRIS zostaje.
- Bohater ekranu: prąd.
- Ciemne, kosmiczne tło (inspiracja: God's Eye View, Bilawal Sidhu).
- Linie najwyższych napięć w kolorze złotym (energia).
- Wiatr (farmy, wykres wiatru) na jasnoniebiesko, dobrze widoczny na ciemnym tle.
- Morskie farmy (decyzje Ani 25.11.2026, wariant C): puste kółko – „brak w wykazie MKiŚ (stan: styczeń 2024)” widoczne zawsze, „możliwy duplikat” innego wpisu EMODnet dopiero od przybliżenia 9; Baltic Power „w rozruchu – część turbin produkuje” (nie „działa”, dopóki nie ma koncesji i eksploatacji komercyjnej); zwycięzcy aukcji URE z dopiskiem i linkiem do komunikatu.
- Słońce (produkcja PV w okienku PSE) w kolorze jasnej cytryny #FEF08A – linia ciągła z podpisem „słońce” przy linii; kreskowanie zarezerwowane dla danych wstępnych (decyzja Ani 25.11.2026).
- Globus od razu przybliżony do Polski.
- Priorytet: komputer (telefon później). Wyjątek (decyzja Ani 26.11.2026): E1 „Planuję inwestycję” (wyszukiwarka stacji w zakładce „Gdzie”) od razu także na telefonie 390×844.
- Ruch: jeden lot wprowadzający przy otwarciu (bez lotu przy prefers-reduced-motion); odtwarzanie doby uruchamiane przyciskiem przez widza; inne animacje – decyzja później.
- Płynne przejście między stronami (View Transitions) i plakat kuli na stronie tytułowej – decyzja Ani 21.11; bez animacji przy ogranicz ruch.
- Reguła przenikania (`@view-transition`) musi być także w małym `<style>` w `<head>` obu stron (index.html i mapa/index.html), nie tylko w src/style.css – sama reguła w zewnętrznym CSS przegrywa w Chrome wyścig z ciężkim modułem (22.11.2026).
- Mapa w trybie spokojnym (decyzja Ani 23.11.2026): na start widać mapę i krótkie linijki, szczegóły po kliknięciu. Okienko PSE zwinięte do „WIATR, SŁOŃCE I CENA PRĄDU  Wiatr … · Słońce … · stan na … · PSE ▸” (słońce od 25.11.2026; na wąskim ekranie łamie się tylko przed „stan na …”, nigdy w środku godzin) (złoty tytuł jak „KARTA POLSKI”; bez ceny – cena „teraz” tylko w Karcie), Karta Polski do „Karta Polski · XX% z … · PSE, stan na … ▸”, legenda do listy warstw (znaczek, nazwa, pole wyboru) + źródła; liczniki, opisy i skala po „więcej ▸”. Strzałki ▸/▾ w nagłówkach i „więcej ▸” – na złoto (widać, że okno się rozwija). W zwiniętej linijce zawsze źródło i „stan na”; cała linijka klikalna, z klawiatury też. Rozwinięcie pamiętane tylko w karcie przeglądarki (sessionStorage, `src/zwijanie.js`); zapis zablokowany – start zwinięty. Kadr Polski liczony z rozwiniętej szerokości okienka PSE (mapa się nie przesuwa). Zwinięcie okienka PSE kończy odtwarzanie doby.
- Telefon (ekrany do 640 px; decyzje Ani 23.11.2026): komputer (1024 px i więcej) wygląda dokładnie tak jak przed zmianą – style telefonu tylko w bloku `@media (max-width: 640px)`; sprawdzać zrzutami przed/po. Przyciski i linijki do kliknięcia min. 44 px, tekst nie mniejszy niż na komputerze, bez przewijania w bok. Strona tytułowa: pasek w dwóch rzędach (OSIRIS na środku; źródła / opis z lewej, PL | EN z prawej), bez zegara; duży napis pełna biel, grubszy, bez błysku, PL w jednej linii, EN „ELECTRICITY” / „IN POLAND”; napis i kula wyżej. Mapa: wszystko zwinięte na starcie (także legenda), cała Polska na środku; przy lewej krawędzi pionowo przyciski okien = ich własne nagłówki (sam złoty podpis i ▸ – wariant A); rozwinięte okno – panel od dołu (max 70%, ▾ do zamknięcia, jeden naraz, Esc zwija); + / − ukryte; okna nie przywracają zapamiętanego rozwinięcia (`TELEFON` w `src/zwijanie.js`); małe elementy w zdaniu („?”, ✕) – niewidoczne pole dotyku 44 × 44 px.
- Po obróceniu telefonu albo zmianie wielkości okna Polska wraca na środek tak jak na starcie – tylko gdy widz jeszcze nie ruszał mapy, bez animacji (wariant A, decyzja Ani 25.11.2026). Każde rozwinięte okno, które nie mieści się w wysokości ekranu, przewija się (okienko PSE – bez „↓ więcej poniżej”, wyjątek niżej).
- Wszystkie okienka na mapie korzystają z jednego wzoru C (`src/okienko.js`): najechanie – obok kursora, kliknięcie – przypięte, Esc zamyka, okienko nad panelami, źródło przyklejone na dole. Nowe okienka nie używają `maplibregl.Popup` (23.11.2026).
- Każdy znak „?” na stronie (znaczek niepewności przy liczbie) jest klikalny i otwiera wyjaśnienie we wzorze C (`okienka.podlacz`, dostępny z klawiatury: Tab + Enter). Treść okienka = to samo wyjaśnienie, które stoi na stronie (jedno źródło tekstu, bez kopiowania) + linijka źródła (23.11.2026).
- Każde miejsce na stronie, które się przewija, od razu (bez klikania) pokazuje ten sam sygnał co okienko C: zanikanie u dołu + klikalny przycisk „↓ więcej poniżej”, który przewija w dół i znika po dojechaniu do końca. Jeden wspólny kod: `src/wiecej-ponizej.js` (bez kopiowania); „ogranicz ruch” – bez animacji. Nagłówki paneli stoją, przewija się tylko treść. Wyjątek: okienko PSE (lewa góra) (23.11.2026).
- Strona „O nas” (/o-nas/, /en/about/; decyzje Ani 25.11.2026): sam tekst w HTML, bez skryptu i bez wspólnej stopki; link „O nas” w stopce przy prawej krawędzi (strona tytułowa i mapa); e-mail zapisany encjami; linki zewnętrzne w nowej karcie z rel="noopener noreferrer" i dopiskiem dla czytnika.
- Przełącznik PL | EN na obu stronach, prowadzi do tej samej strony w drugim języku (/ ↔ /en/, /mapa/ ↔ /en/map/), bez przekierowania po języku przeglądarki. Strona tytułowa: prawy górny róg, obok „CZAS WARSZAWA” / „WARSAW TIME”. Mapa (od e2): prawy górny róg, obok przełącznika DZIEŃ | NOC, w tym samym stylu (para), bez zasłaniania przycisków + / − (23.11.2026).

## Jak ze mną pracować
- Odpowiadaj po polsku, prostymi słowami.
- Zanim uruchomisz polecenie, napisz w jednym zdaniu, co robi i dlaczego.
- Rób jeden krok naraz i czekaj na moją zgodę.
- Jeśli czegoś nie wiesz albo nie jesteś pewien, powiedz to wprost. Nie wymyślaj.

## Bezpieczeństwo
- Nigdy nie wpisuj tokenów, haseł ani kluczy do kodu, commitów, logów ani czatu.
- Sekrety trzymamy tylko w GitHub Secrets albo w pliku .env, który jest w .gitignore.
- Nie instaluj żadnego pakietu bez pytania. Przed instalacją podaj nazwę, wersję i powód.
- Nie zmieniaj ustawień globalnych komputera (Homebrew, git config --global, pliki poza repo).
- Przypinaj wersje pakietów i akcji GitHub.

## Git
- Pracujemy na gałęziach. Nigdy nie commituj bezpośrednio na main.
- Zmiany trafiają na main tylko przez pull request.

## Robot OSIRIS (PR i issue z „[Robot OSIRIS]” w tytule)
- Robot nigdy nie scala. PR z nowymi danymi scala tylko Ania – po porównaniu kilku liczb z PDF i aktualizacji poziomu weryfikacji w ZRODLA.md.
- PR i issue z „[TEST]” / „SYMULACJA” – tylko zamknąć, nie scalać; gałąź `robot-osiris/test-…` usunąć.
- Issue „Problem z danymi PSE” – najpierw przeczytać dokument PSE, potem poprawić odczyt albo opisać zmianę u PSE. Szczegóły: BEZPIECZENSTWO.md, sekcja „Robot OSIRIS”.

## Dane i źródła
- Każde źródło danych ma wpis w pliku ZRODLA.md: link, licencja, data sprawdzenia, poziom weryfikacji (0-4).
- Czytaj źródła w całości, nie z zajawek wyszukiwarki. Nie podawaj liczb bez źródła.
- Liczby do sprawdzianów i opisów bierzemy z API (JSON), nigdy z tabel stron przepisanych jako tekst – puste komórki przesuwają kolumny.
- Na stronie jest stała stopka ze źródłami. Dla PSE: źródło, data pobrania, informacja o przetworzeniu danych, bez logo PSE.

## Technologia
- Vite + MapLibre GL JS, strona statyczna na Cloudflare Pages.
- Dane z PSE pobieramy przy budowaniu strony na Cloudflare Pages i zapisujemy jako plik JSON w gotowej stronie. Przeglądarka nie łączy się z API bezpośrednio.
