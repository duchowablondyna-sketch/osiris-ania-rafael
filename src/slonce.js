// Czy kwadrans PSE wypada po zmroku – do dopisku „po zmroku panele nie pracują” przy 0 MW ze słońca.
// Wschód i zachód słońca liczymy uproszczonym wzorem NOAA (General Solar Position Calculations,
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF) dla jednego punktu: środka Polski. Dokładność rzędu kilku minut;
// między wschodnią a zachodnią granicą Polski różnica to ok. 40 minut – dlatego dopisek pokazujemy tylko przy 0 MW,
// a o tym, czy to noc, decyduje cały kwadrans (przed wschodem albo po zachodzie). Bez bibliotek.

const RAD = Math.PI / 180;
const ZENIT = 90.833; // wschód / zachód: górna krawędź tarczy na horyzoncie, z refrakcją

// Wschód i zachód słońca w minutach od północy UTC dla doby (UTC) daty `data`. null – dzień polarny / noc polarna.
function wschodZachod(data, szer, dl) {
  const poczatekRoku = Date.UTC(data.getUTCFullYear(), 0, 1);
  const dzien = Math.floor((Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()) - poczatekRoku) / 86400_000);
  const g = ((2 * Math.PI) / 365) * dzien; // rok ułamkowy (w południe)
  const rownanieCzasu =
    229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const deklinacja =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = Math.cos(ZENIT * RAD) / (Math.cos(szer * RAD) * Math.cos(deklinacja)) - Math.tan(szer * RAD) * Math.tan(deklinacja);
  if (cosH < -1 || cosH > 1) return null;
  const h = Math.acos(cosH) / RAD;
  return { wschod: 720 - 4 * (dl + h) - rownanieCzasu, zachod: 720 - 4 * (dl - h) - rownanieCzasu };
}

// koniecUtc: koniec kwadransu (ms od 1970, UTC). Noc = cały kwadrans przed wschodem albo po zachodzie.
export function poZmroku(koniecUtc, { szer, dl }) {
  if (!Number.isFinite(koniecUtc)) return false;
  const koniec = new Date(koniecUtc);
  const ws = wschodZachod(koniec, szer, dl);
  if (!ws) return false;
  const polnoc = Date.UTC(koniec.getUTCFullYear(), koniec.getUTCMonth(), koniec.getUTCDate());
  const poczatek = koniecUtc - 15 * 60_000;
  return koniecUtc <= polnoc + ws.wschod * 60_000 || poczatek >= polnoc + ws.zachod * 60_000;
}
