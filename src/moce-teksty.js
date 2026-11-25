// Zdania zakładki „Gdzie” (wolna moc dla odbiorców) składane z danych – bez DOM, żeby testy w Node mogły sprawdzić,
// że liczby, napięcia i daty w zdaniach zgadzają się z plikami public/data/moce-pse.json i rozdzielnie-pse.json
// (Etap C1, decyzje Ani 25.11.2026: daty z danych zamiast „obecnie”, czas przeszły „nie były rozpatrywane”,
// napięcia z wykazu zamiast „400 kV” na sztywno). Testy: node --test scripts/pse-moce/testy.mjs.
import { t, tn, liczba, LOCALE, formatDoby } from './jezyk.js';
import { podzialStacji, napiecia220400 } from './wykaz-rozdzielni.js';

// [220, 400] → „220 lub 400 kV” / „220 or 400 kV” (alternatywa – różne stacje); „220 i 400 kV” / „220 and 400 kV”
// (obie rozdzielnie jednej stacji). Spójniki z Intl.ListFormat – zgodnie z językiem strony.
const napiecia = (kv, typ) => `${new Intl.ListFormat(LOCALE, { type: typ }).format(kv.map(String))} kV`;
export const napieciaLub = (kv) => napiecia(kv, 'disjunction');
export const napieciaI = (kv) => napiecia(kv, 'conjunction');

// Podsumowanie pod tytułem zakładki: „25 stacji ma moc dla odbiorców. Według wykazu PSE z 04.02.2026 w 11 z nich…”.
export function tekstPodsumowania(dane, wykaz, bezRozpatrzenia) {
  const p = podzialStacji(dane.odbiorcy, bezRozpatrzenia);
  return t(
    'moce.podsumowanie',
    tn('liczba.stacja_ma', p.razem),
    p.pelne,
    napieciaLub(p.napieciaPelnych),
    p.tylko110,
    formatDoby(wykaz.stan_na),
    formatDoby(dane.stan_na),
  );
}

// Ze zdań PSE w wyciągu (moce-pse.json → wyciag.zdania_obecne; Robot sprawdza ich obecność – scripts/pse-moce/parsuj.mjs):
// moc istniejących stacji („…identyfikuje się zerowe wartości…” → 0) i rok mocy dla odbiorców („…podano dla roku 2031”).
export function zZdanPse(dane) {
  const zdania = dane.wyciag?.zdania_obecne ?? [];
  const rok = zdania.map((z) => z.match(/odbiorcze podano dla roku (\d{4})/)?.[1]).find(Boolean) ?? null;
  const zero = zdania.some((z) => /stacji istniejących .* zerowe wartości dostępnych mocy/.test(z));
  return { rok, mocIstniejacych: zero ? 0 : null };
}

// Zdanie-wniosek na górze zakładki (Etap C1, wariant B). Bez zdań PSE w danych – null (zdanie się nie pokazuje).
export function tekstWniosku(dane, wykaz, bezRozpatrzenia) {
  const { rok, mocIstniejacych } = zZdanPse(dane);
  if (rok === null || mocIstniejacych === null) return null;
  const p = podzialStacji(dane.odbiorcy, bezRozpatrzenia);
  return t(
    'moce.wniosek_b',
    formatDoby(dane.stan_na),
    `${liczba(mocIstniejacych)} MW`,
    tn('liczba.stacja_planowana', p.razem),
    p.pelne + p.tylko110,
    formatDoby(wykaz.stan_na),
    p.bezZastrzezen,
    rok,
  );
}

// Uwaga w okienku stacji z wykazu: napięcia tej stacji (220/400 kV) albo zawężone zdanie o 110 kV.
export function tekstUwagi(wpis, dataWykazu) {
  if (!wpis.pusty) return t('moce.uwaga_110', formatDoby(dataWykazu));
  const kv = napiecia220400([wpis]);
  return t('moce.uwaga_pusty', formatDoby(dataWykazu), napieciaI(kv), kv.length);
}

// Dopisek przy stacji na liście: „ · 400 kV – bez rozpatrzenia” / „ · 110 kV – bez rozpatrzenia”.
export function dopisekListy(wpis) {
  return wpis.pusty ? t('moce.wstrzymane_pusty', napieciaI(napiecia220400([wpis]))) : t('moce.wstrzymane_110');
}
