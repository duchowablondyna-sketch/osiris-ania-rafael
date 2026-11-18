import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import './style.css';

// Vite przepakowuje bibliotekę i gubi jej plik workera, więc podajemy adres wprost.
// ?url sprawia, że Vite skopiuje ten plik do gotowej strony i zwróci jego adres.
maplibregl.setWorkerUrl(workerUrl);

// Kontur Polski leży w public/data/ i jest serwowany razem ze stroną.
// Nie używamy zewnętrznych kafelków ani kluczy API.
const KONTUR_URL = `${import.meta.env.BASE_URL}data/polska-kontur.geojson`;

// Przybliżony prostokąt obejmujący Polskę: [zachód, południe], [wschód, północ].
const GRANICE_POLSKI = [
  [14.0, 48.9],
  [24.2, 54.9],
];

const map = new maplibregl.Map({
  container: 'mapa',
  bounds: GRANICE_POLSKI,
  fitBoundsOptions: { padding: 24 },
  style: {
    version: 8,
    sources: {
      polska: { type: 'geojson', data: KONTUR_URL },
    },
    layers: [
      { id: 'tlo', type: 'background', paint: { 'background-color': '#eef2f5' } },
      { id: 'polska-wypelnienie', type: 'fill', source: 'polska', paint: { 'fill-color': '#ffffff' } },
      { id: 'polska-kontur', type: 'line', source: 'polska', paint: { 'line-color': '#1f3a5f', 'line-width': 1.5 } },
    ],
  },
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
