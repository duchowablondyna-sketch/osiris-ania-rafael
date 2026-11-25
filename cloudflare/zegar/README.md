# Zegar Cloudflare – przebudowa strony co 4 godziny

## Co to jest i po co

Strona OSIRIS jest statyczna: dane PSE (wiatr, słońce, ceny RCE, miks w Karcie Polski) pobiera **budowanie strony**
na Cloudflare Pages. Żeby dane były świeże, stronę trzeba przebudowywać regularnie – co 4 godziny.

Do tej pory robił to workflow GitHub Actions „Odśwież stronę” (`.github/workflows/odswiez-strone.yml`, harmonogram
`30 0,4,8,12,16,20 * * *`). **GitHub gubi i spóźnia przebiegi z harmonogramu** (sprawdzenie 25.11.2026, historia od 19.11):

- z **37** terminów odbyło się **15** – GitHub pominął **22 (ok. 60%)**;
- spóźnienia: od 21 do 239 minut;
- przerwy między przebudowami: **średnio 9,7 h, najdłuższa 14,7 h** (13 z 14 przerw dłuższych niż 6 h);
- skutek: plakietka „⚠ dane nie są najnowsze” (próg 6 h) i brak zdań-wniosków w Karcie przez **ok. połowę czasu**;
- ten sam kłopot ma Robot OSIRIS: przebieg ze środy 25.11 (05:17 UTC) ruszył o 15:36 UTC – ponad 10 h później.

**Zegar Cloudflare** to mały Worker z **Cron Trigger** (harmonogramem Cloudflare). Co 4 godziny wysyła POST na
**Deploy Hook** Cloudflare Pages – i nic więcej. Kod: `worker.js` w tym katalogu.

- `scheduled` – wywołuje Deploy Hook; do logu zapisuje tylko godzinę i kod odpowiedzi (np. HTTP 200), **nigdy adresu**.
- `fetch` – każde żądanie z internetu dostaje **404**: nikt z zewnątrz nie może uruchomić przebudowy.
- Bez wranglera, bez pakietów. Ten plik w repo to kopia do wglądu – Worker zakładasz i wklejasz kod ręcznie w panelu.
- Adres Deploy Hook to sekret (kto go zna, może uruchamiać przebudowy) – **tylko** w panelu Cloudflare jako zmienna typu
  „Secret”. Nigdy w repo, w commitach, w logach ani w czacie.

## Harmonogram: `23 1-23/4 * * *` (UTC)

Cloudflare liczy cron w **UTC**. Minuta 23 – celowo nie pełna godzina.

| UTC | czas polski zimą (CET, UTC+1) | czas polski latem (CEST, UTC+2) |
|---|---|---|
| 01:23 | 02:23 | 03:23 |
| 05:23 | 06:23 | 07:23 |
| 09:23 | 10:23 | 11:23 |
| 13:23 | **14:23** | **15:23** |
| 17:23 | 18:23 | 19:23 |
| 21:23 | 22:23 | 23:23 |

Dlaczego te godziny:
- **13:23 UTC wypada po publikacji cen RCE na jutro** (PSE publikuje je ok. 13:34–14:14 czasu polskiego – obserwacja,
  ZRODLA.md) – jutrzejsze ceny są na stronie od razu po południu.
- Miks PSE ma ok. 30–45 min opóźnienia, więc przy przebudowie co 4 h dane na stronie mają najwyżej ok. 4 h 45 min –
  poniżej progu plakietki (6 h).

## Kroki w panelu Cloudflare

> **Uwaga:** nazwy pozycji w panelu Cloudflare mogą się różnić od opisanych – Cloudflare zmienia układ panelu.
> Szukaj po sensie (np. „Deploy hooks”, „Variables and Secrets”, „Triggers”).

1. **Nowy Deploy Hook tylko dla Workera.** Workers & Pages → projekt Pages strony OSIRIS → Settings → Builds
   (& deployments) → **Deploy hooks** → dodaj hook o nazwie **`zegar-cloudflare`**, gałąź **`main`**. Skopiuj adres
   (pokazuje się raz) – nie wklejaj go nigdzie poza krokiem 3.
   Osobny hook = osobny klucz: można go unieważnić bez ruszania hooka GitHuba (`CLOUDFLARE_DEPLOY_HOOK`).
2. **Worker.** Workers & Pages → Create → Worker (np. nazwa `osiris-zegar`) → wklej treść `worker.js` → Deploy.
3. **Sekret.** Worker → Settings → **Variables and Secrets** → Add → typ **Secret**, nazwa **`DEPLOY_HOOK`**,
   wartość = adres hooka z kroku 1.
4. **Harmonogram.** Worker → Settings → **Triggers** → Cron Triggers → Add → `23 1-23/4 * * *`.
5. **Bez adresu w internecie (jeśli panel na to pozwala).** Worker → Settings → Domains & Routes → wyłącz
   **workers.dev** (i Preview URLs). Worker działa z harmonogramu i adresu nie potrzebuje; `fetch` i tak zwraca 404 –
   to druga warstwa.

## Jak sprawdzić, że działa

- **Lista wdrożeń Pages:** projekt Pages → Deployments – po każdym terminie z tabeli powinno pojawić się nowe wdrożenie
  z gałęzi `main` (przy wdrożeniu zwykle widać, że uruchomił je deploy hook).
- **Logi Workera:** Worker → Logs / Observability (albo lista minionych wywołań cron w Triggers) – wpis
  „Przebudowa zlecona: … (HTTP 200)”. Błąd wygląda jak „Deploy Hook odpowiedział HTTP …” albo „Brak zmiennej DEPLOY_HOOK”.
- **Na stronie:** w Karcie Polski „stan na” nie powinien być starszy niż ok. 5 h, a plakietka „⚠ dane nie są najnowsze”
  nie powinna się pojawiać (chyba że PSE nie publikuje).
- **Test bez czekania:** jeśli panel ma testowe wywołanie harmonogramu (np. przy Cron Triggers albo w edytorze
  Workera), uruchom je raz i sprawdź, czy w Deployments ruszyła przebudowa.

## Jak wyłączyć albo unieważnić

- **Wstrzymać zegar:** Worker → Settings → Triggers → usuń Cron Trigger (Worker zostaje, nic nie wywołuje).
- **Usunąć całkiem:** Worker → Settings → Delete.
- **Unieważnić hook** (np. gdy adres mógł wyciec): projekt Pages → Settings → Builds → Deploy hooks → usuń
  `zegar-cloudflare`. Stary adres od razu przestaje działać. Potem nowy hook i nowa wartość sekretu `DEPLOY_HOOK` (krok 1 i 3).

## Co dalej (BEZPIECZENSTWO.md → „Do zrobienia”)

Po kilku dniach poprawnej pracy zegara: usunąć `schedule` z workflow „Odśwież stronę” (zostaje ręczne uruchamianie)
i sprawdzić teksty „co 4 godziny” na stronie. Do tego czasu oba zegary działają równolegle – podwójne przebudowy
niczego nie psują, tylko zużywają limit przebudów Pages.
