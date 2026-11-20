# Bezpieczeństwo projektu OSIRIS

## Znane i zaakceptowane ryzyka

### picomatch <= 4.0.7 (zależność Vite)

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
- `npm run dev` uruchamiamy tylko bez opcji `--host` (podgląd dostępny wyłącznie na tym komputerze).
- Sprawdzamy dostępność poprawki co tydzień, docelowo automatycznie przez Dependabota.

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

## Połączenia przeglądarki widza z zewnętrznymi serwerami

- Od etapu „Wygląd 1” (19.11.2026) przeglądarka widza pobiera kafelki tła satelitarnego z serwera NASA GIBS (`gibs.earthdata.nasa.gov`), więc NASA widzi adres IP odwiedzającego. Od etapu „Prąd nocą” (20.11.2026) dotyczy to obu teł: Blue Marble (Dzień) i VIIRS_Black_Marble (Noc). Dane PSE nadal są pobierane tylko przy budowaniu strony.

### Do zrobienia
- [ ] Robot Playwright jako wymagany test.
- [ ] `dependabot.yml`.
- [ ] Private vulnerability reporting.
- [ ] Po dołączeniu Rafaela: 1 zatwierdzenie i CODEOWNERS.
- [ ] Bramka Jev przed agentem.
- [ ] Sprawdzić secret scanning non-provider patterns i validity checks (czy darmowe dla repo publicznego).
- [ ] Potwierdzić w źródle jednostkę pola `wi` (MW) i czy warunki PSE obejmują API raporty.pse.pl.
- [ ] Porównanie długości linii OSM z danymi PSE.
- [ ] Harmonogram w publicznym repo wyłącza się po 60 dniach bez aktywności ([dokumentacja GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)); po przerwie sprawdzić workflow „Odśwież stronę” i włączyć ponownie.
- [ ] W niedalekiej przyszłości profesjonalne tło satelitarne (rozważyć płatne źródło), gdy będzie potrzeba.
- [ ] Rozważyć kafelki tła dla Polski zapisane u nas (żeby przeglądarka widza nie łączyła się z NASA GIBS).
- [ ] Harmonogram GitHub Actions bywa opóźniany lub pomijany (20.11.2026: zamiast 5 uruchomień były 2, z opóźnieniem 2–3 h) – jeśli się powtarza, rozważyć Cloudflare Cron Triggers.
- [ ] Pulsowanie farm wiatrowych w rytm produkcji krajowej – dopiero po dodaniu farm lądowych; skala względem mocy zainstalowanej, nie maksimum doby.
- [ ] Okienko farmy zasłania kropki, a kropki blisko siebie nachodzą na siebie (np. Baltic Power pod pustą kropką Orlen Neptun VIII, 2,5 km) – okienko powinno pokazywać wszystkie farmy w klikniętym miejscu, nie tylko tę z wierzchu.
- [ ] Moc farm wiatrowych poniżej 10 MW z innego źródła (np. URE) – GEM ich nie obejmuje.
- [ ] Potwierdzić w oficjalnym dokumencie PSE moc zainstalowaną farm wiatrowych (czerwiec 2026; podawane 11,16 GW / 11 191 MW) – do tego czasu liczba nie trafia na stronę.
- [x] Warstwa VIIRS_Black_Marble (nocne światła miast, NASA GIBS) – zrobione w etapie „Prąd nocą” (20.11.2026).
