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
Cel: „Prąd nocą”: przełącznik Dzień/Noc – w trybie Noc tło NASA GIBS VIIRS_Black_Marble (światła miast), w trybie Dzień obecny Blue Marble; złota sieć i farmy widoczne w obu trybach.
Robimy tylko to, bez czego cel nie zostanie osiągnięty.
Nie robimy teraz: innych animacji, nowych warstw danych i wersji na telefon (to później).
Zanim zaproponujesz cokolwiek, sprawdź: czy bez tego cel zostanie osiągnięty? Jeśli tak — nie proponuj, dopisz najwyżej jedną linię do listy „Do zrobienia” w BEZPIECZENSTWO.md.

## Cel
Strona z mapą pokazującą, jak i gdzie Polska może uzyskać więcej prądu. Repo: osiris-ania-rafael (Ania i Rafael).

## Zasady wyglądu (decyzje Ani, stałe)
- Bohater ekranu: prąd.
- Ciemne, kosmiczne tło (inspiracja: God's Eye View, Bilawal Sidhu).
- Linie najwyższych napięć w kolorze złotym (energia).
- Wiatr (farmy, wykres wiatru) na jasnoniebiesko, dobrze widoczny na ciemnym tle.
- Globus od razu przybliżony do Polski.
- Priorytet: komputer (telefon później).
- Ruch: jeden lot wprowadzający przy otwarciu (bez lotu przy prefers-reduced-motion); inne animacje – decyzja później.

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

## Dane i źródła
- Każde źródło danych ma wpis w pliku ZRODLA.md: link, licencja, data sprawdzenia, poziom weryfikacji (0-4).
- Czytaj źródła w całości, nie z zajawek wyszukiwarki. Nie podawaj liczb bez źródła.
- Na stronie jest stała stopka ze źródłami. Dla PSE: źródło, data pobrania, informacja o przetworzeniu danych, bez logo PSE.

## Technologia
- Vite + MapLibre GL JS, strona statyczna na Cloudflare Pages.
- Dane z PSE pobieramy przy budowaniu strony na Cloudflare Pages i zapisujemy jako plik JSON w gotowej stronie. Przeglądarka nie łączy się z API bezpośrednio.
