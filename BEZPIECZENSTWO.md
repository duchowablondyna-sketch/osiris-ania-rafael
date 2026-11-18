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

### Do zrobienia
- [ ] Robot Playwright jako wymagany test.
- [ ] `dependabot.yml`.
- [ ] Private vulnerability reporting.
- [ ] Po dołączeniu Rafaela: 1 zatwierdzenie i CODEOWNERS.
- [ ] Bramka Jev przed agentem.
- [ ] Sprawdzić secret scanning non-provider patterns i validity checks (czy darmowe dla repo publicznego).
- [ ] Potwierdzić w źródle jednostkę pola `wi` (MW) i czy warunki PSE obejmują API raporty.pse.pl.
