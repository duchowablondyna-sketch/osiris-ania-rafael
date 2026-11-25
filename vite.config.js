import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { wtyczkaJezykow } from './scripts/jezyki.mjs';

// Trzy strony: strona tytułowa (/), mapa (/mapa/) i „O nas” (/o-nas/).
// Wspólna stopka „Źródła i licencje” jest w jednym pliku (src/czesci/stopka.html) i trafia do obu stron
// w miejsce znacznika <!-- STOPKA --> – bez kopiowania tej samej treści w dwóch miejscach.
const KATALOG = import.meta.dirname;
const wstawStopke = {
  name: 'osiris-wstaw-stopke',
  transformIndexHtml(html) {
    const stopka = readFileSync(resolve(KATALOG, 'src/czesci/stopka.html'), 'utf-8');
    // „O nas” celowo bez tej stopki (daty w niej wypełnia skrypt mapy) – oznaczona <!-- BEZ STOPKI -->.
    if (html.includes('<!-- BEZ STOPKI -->')) return html;
    if (!html.includes('<!-- STOPKA -->')) throw new Error('Brak znacznika <!-- STOPKA --> w stronie HTML');
    return html.replace('<!-- STOPKA -->', stopka);
  },
};

export default defineConfig({
  // Kolejność ma znaczenie: najpierw stopka, potem teksty PL/EN (stopka też może mieć znaczniki {{…}}).
  // Wersja angielska (/en/…) – scripts/jezyki.mjs.
  plugins: [wstawStopke, wtyczkaJezykow()],
  build: {
    rolldownOptions: {
      input: {
        tytulowa: resolve(KATALOG, 'index.html'),
        mapa: resolve(KATALOG, 'mapa/index.html'),
        onas: resolve(KATALOG, 'o-nas/index.html'),
      },
    },
  },
});
