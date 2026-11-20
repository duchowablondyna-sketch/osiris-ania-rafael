import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Dwie strony: strona tytułowa (/) i mapa (/mapa/).
// Wspólna stopka „Źródła i licencje” jest w jednym pliku (src/czesci/stopka.html) i trafia do obu stron
// w miejsce znacznika <!-- STOPKA --> – bez kopiowania tej samej treści w dwóch miejscach.
const KATALOG = import.meta.dirname;
const wstawStopke = {
  name: 'osiris-wstaw-stopke',
  transformIndexHtml(html) {
    const stopka = readFileSync(resolve(KATALOG, 'src/czesci/stopka.html'), 'utf-8');
    if (!html.includes('<!-- STOPKA -->')) throw new Error('Brak znacznika <!-- STOPKA --> w stronie HTML');
    return html.replace('<!-- STOPKA -->', stopka);
  },
};

export default defineConfig({
  plugins: [wstawStopke],
  build: {
    rolldownOptions: {
      input: {
        tytulowa: resolve(KATALOG, 'index.html'),
        mapa: resolve(KATALOG, 'mapa/index.html'),
      },
    },
  },
});
