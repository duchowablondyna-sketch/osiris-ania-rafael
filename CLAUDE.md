# OSIRIS: zasady projektu

## Etap: TRACER BULLET (obowiązuje, dopóki nie zostanie odwołany)
Tracer bullet nr 1 (liczba z PSE na stronie) – zakończony 18.11.2026.
Tracer bullet nr 2 (farmy na Bałtyku) – zakończony 18.11.2026.
Cel: Tracer bullet nr 3: linie najwyższych napięć 220 kV i 400 kV z OpenStreetMap (ODbL) na mapie, z podpisem w stopce, ze sprawdzianem prawdy (porównanie z danymi PSE: długość linii i schemat sieci) i opublikowane na Cloudflare Pages.
Robimy tylko to, bez czego cel nie zostanie osiągnięty.
Nie robimy teraz: kontaktów i zgód od instytucji, nowych narzędzi i testów, innych warstw niż linie 220/400 kV, wyglądu, historii danych, optymalizacji, rozbudowanej dokumentacji.
Zanim zaproponujesz cokolwiek, sprawdź: czy bez tego cel zostanie osiągnięty? Jeśli tak — nie proponuj, dopisz najwyżej jedną linię do listy „Do zrobienia” w BEZPIECZENSTWO.md.

## Cel
Strona z mapą pokazującą, jak i gdzie Polska może uzyskać więcej prądu. Repo: osiris-ania-rafael (Ania i Rafael).

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
