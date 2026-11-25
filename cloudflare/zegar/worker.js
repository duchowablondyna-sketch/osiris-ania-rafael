// OSIRIS – „niezawodny zegar”: Cloudflare Worker z Cron Trigger (opis i kroki w panelu: cloudflare/zegar/README.md).
// Co 4 h wywołuje Deploy Hook Cloudflare Pages – strona buduje się od nowa i pobiera świeże dane PSE.
// Zastępuje harmonogram GitHub Actions, który pomija i spóźnia przebiegi (19–25.11.2026: 22 z 37 terminów pominięte,
// spóźnienia do 4 h).
// Adres Deploy Hook – TYLKO jako zaszyfrowana zmienna Workera (typ „Secret”) o nazwie DEPLOY_HOOK, ustawiona w panelu
// Cloudflare. Nigdy w tym pliku, w repo ani w logach.
// Ten plik to kopia do wglądu i przeglądu w PR – Worker zakłada się i wkleja kod ręcznie w panelu (bez wranglera,
// bez pakietów). Składnię sprawdza scripts/sprawdz-skladnie.mjs (npm run sprawdz).
export default {
  // Cron Trigger (ustawiany w panelu): "23 1-23/4 * * *" – UTC 01:23, 05:23, 09:23, 13:23, 17:23, 21:23.
  async scheduled(controller, env) {
    if (!env.DEPLOY_HOOK) throw new Error('Brak zmiennej DEPLOY_HOOK');
    const odp = await fetch(env.DEPLOY_HOOK, { method: 'POST' });
    // Do logu tylko kod odpowiedzi i godzina – nigdy adres hooka ani treść odpowiedzi.
    if (!odp.ok) throw new Error(`Deploy Hook odpowiedział HTTP ${odp.status}`);
    console.log(`Przebudowa zlecona: ${new Date(controller.scheduledTime).toISOString()} (HTTP ${odp.status})`);
  },

  // Z internetu nic nie da się uruchomić: każde żądanie HTTP dostaje 404, bez wywołania Deploy Hook.
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};
