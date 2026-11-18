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
