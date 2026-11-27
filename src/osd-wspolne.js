// Wspólne drobiazgi sekcji operatorów dystrybucyjnych w zakładce „Gdzie” (F2.1 PGE – src/osd-pge.js,
// F2.2 Energa – src/osd-energa.js). Bez kopiowania kodu między operatorami.
import { t, liczba, cytatOsd } from './jezyk.js';

export const mw = (x) => `${liczba(x)} MW`;

export function element(tag, klasa, tekst) {
  const e = document.createElement(tag);
  if (klasa) e.className = klasa;
  if (tekst !== undefined) e.textContent = tekst;
  return e;
}

// Cytat operatora: po polsku sam tekst w cudzysłowie; po angielsku tłumaczenie, a pod nim mniejszym drukiem oryginał.
// kluczOryginalu – podpis oryginału w słowniku („cytat.oryginal_pge”, „cytat.oryginal_energa”).
export function cytat(tekstPl, kluczOryginalu) {
  const c = cytatOsd(tekstPl);
  const s = element('span', '', t('osd.cytat', c.tekst));
  if (c.oryginal) {
    const o = element('span', 'cytat-oryginal', t(kluczOryginalu, c.oryginal));
    o.lang = 'pl';
    return [s, o];
  }
  if (c.bezTlumaczenia) return [s, element('span', 'cytat-oryginal', t('cytat.bez_tlumaczenia'))];
  return [s];
}
