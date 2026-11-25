# Bezpieczeństwo projektu OSIRIS

## Podgląd strony – zasada stała

- Podgląd (`npm run dev`, `npm run preview`) uruchamiamy z `--host 127.0.0.1` – dostępny wyłącznie na tym komputerze. Nigdy `--host` bez adresu ani `--host 0.0.0.0` (to udostępnia podgląd w sieci). Zmiana 20.11.2026: bez `--host` serwer słuchał tylko na IPv6 (`[::1]`), a przeglądarka łączyła się przez IPv4 (`127.0.0.1`) i podgląd nie działał.

## Znane i zaakceptowane ryzyka

### ✅ ROZWIĄZANE 20.11.2026: picomatch <= 4.0.7 (zależność Vite)

**Dlaczego rozwiązane:** GitHub wycofał wpis 18.11.2026 (`withdrawn_at: 2026-11-18T15:38:56Z`) z uzasadnieniem: „This advisory has been withdrawn because it is not a security issue.” (odnośnik do dyskusji: https://github.com/micromatch/picomatch/pull/235#issuecomment-6315749381; sprawdzone 20.11.2026 przez `gh api /advisories/GHSA-fc5q-39xc-vjpf` – tylko odczyt). Wersja w `package-lock.json` się nie zmieniła (nadal 4.0.7, poprawionej wersji nie ma) – `npm audit` przestał zgłaszać problem, bo wpis wycofano, a nie dlatego, że zaktualizowaliśmy pakiet. Poniżej zapis pierwotnej decyzji (bez zmian, dla historii).

- **Pakiet:** `picomatch` <= 4.0.7, zależność narzędzia `vite` 8.3.8 (łańcuch: `vite` → `tinyglobby` → `fdir` → `picomatch`).
- **Podatność:** [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) / CVE-2026-112366 (ReDoS przez wzorce typu extglob).
- **Ocena:** High, CVSS 8.7.
- **Skutek:** tylko dostępność, czyli możliwe zawieszenie programu. Brak wpływu na poufność i integralność danych.
- **Poprawka:** brak poprawionej wersji na dzień 18.11.2026.

**Dlaczego akceptujemy:**
- `picomatch` działa tylko lokalnie, przy uruchamianiu podglądu i budowaniu strony.
- Wzorce, które przetwarza, pochodzą z naszej konfiguracji, a nie od użytkowników strony.
- Pakiet nie trafia do gotowej strony w folderze `dist/`.

**Warunki akceptacji:**
- Podgląd uruchamiany tylko lokalnie (zasada przeniesiona 20.11.2026 do punktu „Podgląd strony – zasada stała” wyżej).
- Sprawdzamy dostępność poprawki co tydzień, docelowo automatycznie przez Dependabota (nieaktualne po wycofaniu wpisu 18.11.2026).

**Data decyzji:** 18.11.2026
**Decyzję podjęła:** Ania

## Ustawienia repozytorium na GitHubie (stan 18.11.2026)

### Widoczność
- Repo publiczne od 18.11.2026 (decyzja Ani i Rafaela).
- Wcześniej przegląd całej historii pod kątem sekretów, e-maili i danych prywatnych: czysto.
- Zasada: żadnych poufnych materiałów ani danych klientów w repo.

### Ochrona przed wyciekiem sekretów
- Secret Protection: włączone.
- Push protection: włączone.

### Zależności
- Dependency graph: włączone.
- Dependabot alerts: włączone.
- Malware alerts: włączone.
- Dependabot security updates: na razie wyłączone (włączymy razem z `dependabot.yml`).

### Pakiety pilnowane (przypięte wersje, `package.json`)
- `maplibre-gl` 6.19.0 – mapa (kod w przeglądarce widza).
- `vite` 8.3.8 – budowanie (tylko lokalnie i na Cloudflare, nie trafia do strony).
- `@fontsource/inter` 5.3.0 i `@fontsource/jetbrains-mono` 5.3.0 – pliki czcionek (OFL-1.1), dodane 20.11.2026 (`npm install --save-exact`). Przed instalacją sprawdzone w rejestrze npm: brak skryptów instalacyjnych (preinstall/postinstall), brak zależności. Do strony trafiają tylko pliki `.woff2` zestawów „latin” i „latin-ext”.
- `npm audit` po instalacji 20.11.2026: **0 podatności**. `picomatch` 4.0.7 nie jest już zgłaszany, bo GitHub wycofał wpis GHSA-fc5q-39xc-vjpf 18.11.2026 („not a security issue”) – szczegóły w punkcie „Znane i zaakceptowane ryzyka” (oznaczony jako rozwiązany).
- npm ostrzega, że `fsevents` 2.3.3 (opcjonalna zależność `vite`, była już wcześniej) ma skrypt instalacyjny nieobjęty `allowScripts` – nie uruchamiany przez nas; do przejrzenia przy konfiguracji Dependabota.

### Ruleset „ochrona-main” (Active, gałąź domyślna)
- Wymagany pull request (0 zatwierdzeń do czasu dołączenia Rafaela).
- Zakaz usuwania gałęzi.
- Zakaz force push.
- Bypass: Repository admin, tylko dla pull requestów.
- `require_extra_approval_for_unattributed_changes: true` – według dokumentacji REST API GitHuba: gdy Copilot otworzy PR bez człowieka, wymagane jest jedno dodatkowe zatwierdzenie (działa, gdy liczba wymaganych zatwierdzeń > 0); zostawiamy włączone.

**Crash test 18.11.2026:** `git push origin feat/szkielet-mapy:main` odrzucony z błędem GH013 „Changes must be made through a pull request”. Ochrona działa.

### GitHub Actions
- Domyślne uprawnienia: tylko do odczytu.
- Actions nie mogą tworzyć ani zatwierdzać pull requestów.
- Zgoda wymagana dla wszystkich zewnętrznych osób.
- Dozwolone tylko akcje GitHuba.
- Wymagane przypięcie akcji do pełnego SHA.

**Weryfikacja 18.11.2026:** ustawienia odczytane przez `gh api` (tylko GET) – zgodne z opisem (poziom 2). Malware alerts, Dependency graph i nazwa roli w bypass (Repository admin, tylko dla PR) – API nie podaje ich wprost; potwierdzone przez Anię na ekranie ustawień GitHuba (poziom 3).

## Robot OSIRIS – wolne moce PSE (od 21.11.2026; etap B: co tydzień + ręcznie)

- **Kiedy:** co środę o 05:17 UTC (06:17 zimą, 07:17 latem czasu polskiego) oraz ręcznie (Actions → „Robot OSIRIS – wolne moce PSE” → Run workflow; tryby `normalny`, `proba`, `wymus-pr`, `wymus-problem`). Przebieg z harmonogramu zawsze w trybie `normalny`. Testy etapu A zaliczone 21.11.2026: `proba` → bez zmian, `wymus-pr` → PR #19/#20 i e-mail z prośbą o przegląd, `wymus-problem` → issue #21; testowe PR i issue zamknięte, gałęzie `robot-osiris/test-*` usunięte.
- **Kto dostaje powiadomienia:** PR robota – prośba o przegląd do właścicielki repo (`duchowablondyna-sketch`, e-mail z GitHuba). Issue robota – **zawsze do Ani, niezależnie od „Watch”** (repo ma Watch 0): robot przypisuje issue do `duchowablondyna-sketch` (assignee) i wspomina `@duchowablondyna-sketch` na górze treści – według dokumentacji GitHuba przypisanie i wzmianka zapisują do wątku automatycznie. Przypisanie przy tworzeniu wymaga prawa push (dokumentacja REST API: inaczej „Assignees are silently dropped”) – zadanie „Zgłoś” ma `contents: write`, a robot po utworzeniu sprawdza przypisanie i w razie potrzeby dopisuje je ponownie (`gh issue edit --add-assignee`); `issues: write` samo by nie wystarczyło. Przebiegi z harmonogramu, które się nie udadzą – według dokumentacji GitHuba osoba, która ostatnia zmieniła linijkę `cron` w pliku workflow (dziś: konto `duchowablondyna-sketch`). Udany przebieg bez zmian nie wysyła nic.
- **Co robić z PR robota** („[Robot OSIRIS] Nowe dane PSE – stan na …” albo „… Nowy plik PSE, te same dane …”): przeczytać opis zmian, porównać kilka liczb z PDF (link w opisie), podnieść poziom weryfikacji w ZRODLA.md po sprawdzeniu, dopiero potem scalić. Nowe stacje bez miejsca na mapie – uzupełnić `scripts/pse-moce/lokalizacje.json`. PR z „[TEST]” i „SYMULACJA – NIE SCALAĆ” – tylko zamknąć (bez scalania) i usunąć gałąź `robot-osiris/test-…`.
- **Co robić z issue robota** („[Robot OSIRIS] Problem z danymi PSE – …”): na stronie nic się nie zmieniło. Otworzyć PDF, porównać z opisem problemu i zdecydować: poprawić odczyt (`scripts/pse-moce/`, testy) albo PSE zmieniło układ/znaczenie danych. Issue z „[TEST]” – zamknąć.

- Workflow `.github/workflows/robot-osiris-pse.yml`. Każdy PR, issue i commit robota ma w tytule „[Robot OSIRIS]”. Robot **nigdy nie scala** – nie ma takiego kroku; scala tylko Ania po przeglądzie.
- Uprawnienia: domyślnie `permissions: {}`. Zadanie „sprawdź” (macOS, czyta niezaufany PDF) – bez żadnych uprawnień i bez tokena zapisu. Zadanie „zgłoś” (Ubuntu, tylko przy nowych danych albo problemie) – `contents: write` (gałąź `robot-osiris/…`), `pull-requests: write`, `issues: write`. Robot nie odwołuje się do żadnego sekretu (w tym `CLOUDFLARE_DEPLOY_HOOK`).
- Krok „Zgłoś” (`scripts/pse-moce/zglos.mjs`, poprawka 21.11.2026 po nieudanym teście `wymus-pr` – przebieg #2 wywrócił się na „nothing to commit”; gałąź nie trafiła na GitHuba): „nic do zapisania” w trybie normalnym kończy się zielono z raportem, bez PR; `wymus-pr` zawsze daje PR „[Robot OSIRIS][TEST] …” z plikiem-znacznikiem `robot-osiris-test/ZNACZNIK-TESTU.md` i nagłówkiem „SYMULACJA – … NIE SCALAĆ”; nowy plik PSE z tym samym wyciągiem (stan `nowy-plik`) – PR tylko z nową informacją o pliku (SHA-256, Last-Modified, data pobrania).
- Bez gotowych akcji z zewnątrz; jedyne akcje to `actions/upload-artifact` i `actions/download-artifact` (GitHub), przypięte do pełnego SHA.
- Pobieranie tylko z `https://www.pse.pl` (sprawdzane także po przekierowaniu), plik do 20 MB, nagłówek `%PDF-`. Surowy PDF nie trafia do repo ani do artefaktów (`*.pdf` w `.gitignore`).
- Ustawienie potrzebne do tworzenia PR: Settings → Actions → General → Workflow permissions → „Allow GitHub Actions to create and approve pull requests” (decyzja Ani: włączy sama). Zatwierdzanie: autor PR (robot) nie może zatwierdzić własnego PR, a ruleset wymaga dziś 0 zatwierdzeń – decyzja o „1 wymaganym zatwierdzeniu” odłożona (Ania, 21.11.2026).
- Przy budowaniu strony (Cloudflare) `scripts/pse-moce/sprawdzono.mjs` pyta publiczne API GitHuba (api.github.com, bez tokena) o datę ostatniego potwierdzenia przez robota. To połączenie serwera budującego, nie przeglądarki widza.

## Połączenia przeglądarki widza z zewnętrznymi serwerami

- Od etapu „Wygląd 1” (19.11.2026) przeglądarka widza pobiera kafelki tła satelitarnego z serwera NASA GIBS (`gibs.earthdata.nasa.gov`), więc NASA widzi adres IP odwiedzającego. Od etapu „Prąd nocą” (20.11.2026) dotyczy to obu teł: Blue Marble (Dzień) i VIIRS_Black_Marble (Noc). Od etapu „Strona tytułowa” (20.11.2026) do 21.11.2026 także strona tytułowa (/) pobierała kafelki Black Marble do globusa z NASA. **Od 21.11.2026 globus na stronie tytułowej korzysta z naszej kopii kafelków** (`public/kafelki/black-marble-2016`, przybliżenia 0–3, sumy SHA-256 obok) – strona tytułowa nie łączy już widza z NASA; połączenie z NASA zaczyna się dopiero na /mapa/. Dane PSE nadal są pobierane tylko przy budowaniu strony.

### Do zrobienia
- [ ] Robot Playwright jako wymagany test.
- [ ] Testy karty uruchamiane automatycznie na GitHubie (Actions): `node --test scripts/karta/testy.mjs scripts/karta/testy-panel.mjs` (dziś tylko ręcznie; budowanie na Cloudflare ich nie uruchamia – dane zatrzymuje sam sprawdzian w skrypcie).
- [x] Kafelki NASA u nas – globus na stronie tytułowej: 85 kafelków Black Marble 2016 (przybliżenia 0–3, 1 901 156 B), `scripts/pobierz-kafelki-globusa.mjs`, sumy SHA-256, warunki NASA w ZRODLA.md – zrobione 21.11.2026. Mapa /mapa/ nadal korzysta z NASA bezpośrednio (punkt niżej o kafelkach tła dla Polski).
- [ ] Ślad CO2: policzyć wpływ założenia dla węgla brunatnego (957 g/kWh, ok. 17% produkcji) – zakres przy wartościach ze źródeł, do Metodologii i ZRODLA.md.
- [ ] `dependabot.yml`.
- [ ] Private vulnerability reporting.
- [ ] Po dołączeniu Rafaela: 1 zatwierdzenie i CODEOWNERS. Wtedy wrócić do „1 wymaganego zatwierdzenia” w rulesecie „ochrona-main” – Rafael jako recenzent (decyzja Ani 21.11.2026: nie teraz; powód: robot ma prawo zapisu, a przy 0 zatwierdzeń scalanie pilnuje tylko brak takiego kroku w workflow).
- [ ] Bramka Jev przed agentem.
- [ ] Sprawdzić secret scanning non-provider patterns i validity checks (czy darmowe dla repo publicznego).
- [ ] Potwierdzić w źródle jednostkę pola `wi` (MW) i czy warunki PSE obejmują API raporty.pse.pl.
- [ ] Porównanie długości linii OSM z danymi PSE.
- [ ] Harmonogram w publicznym repo wyłącza się po 60 dniach bez aktywności ([dokumentacja GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)); po przerwie sprawdzić workflow „Odśwież stronę” i „Robot OSIRIS – wolne moce PSE” (harmonogram od 21.11.2026) i włączyć ponownie.
- [x] Dopisek z „Wykazu rozdzielni na stacjach bez możliwości przyłączenia” PSE (XLSX, stan 4.02.2026) w okienkach 16 stacji (11 z rozdzielnią 400 kV – pusty sześciokąt; 5 tylko z 110 kV – pełny sześciokąt i zawężone zdanie), podsumowanie w panelu – zrobione 21.11.2026 (do przeglądu przez Anię).
- [ ] Robot OSIRIS: co tydzień sprawdzać też nową wersję „Wykazu rozdzielni” (dziś robot sprawdza tylko dokument o dostępności mocy) (link z datą w nazwie pliku – szukać na stronie PSE, porównać SHA-256, `scripts/pse-moce/rozdzielnie.mjs` + sprawdzian, PR albo issue).
- [x] Robot OSIRIS etap B: harmonogram w środy (05:17 UTC) – zrobione 21.11.2026.
- [ ] Robot OSIRIS: issue o niedostępności pse.pl dopiero po 2 nieudanych tygodniach z rzędu (dziś pojedynczy nieudany przebieg kończy się czerwono i e-mailem z GitHuba, bez issue).
- [ ] W niedalekiej przyszłości profesjonalne tło satelitarne (rozważyć płatne źródło), gdy będzie potrzeba.
- [ ] Rozważyć kafelki tła dla Polski zapisane u nas (żeby przeglądarka widza nie łączyła się z NASA GIBS).
- [x] Mapa: kopia kafelków NASA dla /mapa/ (żeby nie było samego konturu Polski po przejściu) – zrobione 22.11.2026: nocą spód z naszej kopii (poziomy 0–3), NASA GIBS na wierzchu od przybliżenia 4.
- [x] Kafelki: długie zapamiętywanie w Cloudflare (_headers) – zrobione 22.11.2026, tylko `/kafelki/*`.
- [ ] Na później: kafelki Polski z poziomów 4+ u nas, kopia warstwy Dzień (Blue Marble), dopasowanie położenia i skali kuli między stroną tytułową a /mapa/ (wtedy też rozważyć długie zapamiętywanie `/obrazy/*`).
- [ ] Na później: podświetlanie całej linii 220/400 kV od stacji do stacji (łączenie odcinków OSM po nazwie) – dziś najechanie podświetla tylko jeden odcinek z OSM (decyzja Ani 23.11.2026).
- [ ] Na później: okienko C otwarte przyciskiem spoza mapy („?” przy pasku OZE, okienko Polski) – po zamknięciu krzyżykiem fokus ma wracać na element, który je otworzył (dziś po kliknięciu myszą wraca na mapę) (23.11.2026).
- [ ] Na później: po rozwinięciu stopki „Źródła i licencje” panel Karta Polski robi się bardzo niski (za mało miejsca nad stopką) – do poprawy przy układzie strony (23.11.2026).
- [ ] Na później: na telefonie przy kadrze Polski sześciokąt stacji EJ1 (Biebrowo, wolna moc PSE) przykrywa kropkę Baltic Power – dotknięcie otwiera okienko stacji, farmę widać dopiero po przybliżeniu (25.11.2026).
- [ ] Test „czy skrypt mapy się uruchamia” w sprawdzianie PR (np. `node --check` wszystkich plików JS, a najlepiej zbudowanie strony) – 25.11.2026 powtórzona nazwa funkcji (`formatMW`) zatrzymała całą mapę, a test słowników tego nie wyłapał.
- [ ] Na później: przy niskim oknie komputera (poniżej ok. 625 px wysokości) linijka źródła w rozwiniętym okienku PSE jest widoczna dopiero po przewinięciu (25.11.2026).
- [ ] Na później: pełny widok poziomy telefonu i tablety 641–1023 px (dziś działa tam wygląd komputerowy; po obróceniu telefonu okna zajmują dużą część ekranu) (25.11.2026).
- [ ] Na później: okienko Polski mogłoby się pokazywać także po najechaniu na obrys Polski (Natural Earth – dane już są na mapie) (decyzja Ani 23.11.2026).
- [ ] Harmonogram GitHub Actions bywa opóźniany lub pomijany (20.11.2026: zamiast 5 uruchomień były 2, z opóźnieniem 2–3 h) – jeśli się powtarza, rozważyć Cloudflare Cron Triggers.
- [ ] Pulsowanie farm wiatrowych w rytm produkcji krajowej – dopiero po dodaniu farm lądowych; skala względem mocy zainstalowanej, nie maksimum doby.
- [ ] Okienko farmy zasłania kropki, a kropki blisko siebie nachodzą na siebie (np. Baltic Power pod pustą kropką Orlen Neptun VIII, 2,5 km – ten przypadek rozwiązany 25.11.2026: możliwe duplikaty widoczne dopiero od przybliżenia 9) – okienko powinno pokazywać wszystkie farmy w klikniętym miejscu, nie tylko tę z wierzchu.
- [ ] Przy zmianie domeny poprawić pełne adresy w meta Open Graph (`og:url`, `og:image` w `index.html` i `mapa/index.html` – dziś `https://osiris-ania-rafael.pages.dev/`) i odświeżyć podgląd linku w LinkedIn Post Inspector.
- [ ] Osobna podstrona „Źródła” przy rozbudowie strony (zamiast zwijanej stopki „Źródła i licencje”).
- [ ] Polskie nazwy elektrowni zamiast nazw z GEM (np. „Belchatow power station” → „Elektrownia Bełchatów”).
- [ ] Moc farm wiatrowych poniżej 10 MW z innego źródła (np. URE) – GEM ich nie obejmuje.
- [ ] Karta Polski, paski mocy: znaleźć oficjalne źródło mocy zainstalowanej osobno dla wiatru (ląd/morze) i słońca (w tym dachy) – wtedy osobne paski zamiast jednego „wiatr, słońce i inne OZE” (Raport 2025 KSE, Tabela 1.1 ich nie rozdziela).
- [ ] Ustalić z dokumentów (bez pisania do instytucji), czy produkcja PV w raportach PSE (`his-wlk-cal` `pv`, `his-gen-pal-sire` ES) obejmuje panele na dachach i czy jest mierzona, czy szacowana – dziś PSE tego nie opisuje (ZRODLA.md).
- [ ] Potwierdzić w oficjalnym dokumencie PSE moc zainstalowaną farm wiatrowych (czerwiec 2026; podawane 11,16 GW / 11 191 MW) – do tego czasu liczba nie trafia na stronę.
- [x] Warstwa VIIRS_Black_Marble (nocne światła miast, NASA GIBS) – zrobione w etapie „Prąd nocą” (20.11.2026).
- [x] Kula na stronie tytułowej i na obrazkach pokazuje głównie Afrykę, Polska jest na krawędzi – rozważyć obrót, żeby Europa była bliżej środka. Zrobione 23.11.2026: środek widoku 37° na południe od Polski (wariant B), nowy plakat kuli.
- [ ] Po wdrożeniu wersji 3 strony tytułowej (nowe og-obraz.png / og-obraz-en.png, tytuły podglądu) odświeżyć podgląd linków w LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) – dla /, /en/, /mapa/ i /en/map/.
- [ ] Zmienić nazwę klasy panelu na mapie (np. karta-polski), żeby style mapy nie działały na karty strony tytułowej – naprawa u źródła.
