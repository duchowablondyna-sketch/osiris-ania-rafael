// Karta Polski – proste funkcje bez sieci i bez plików (testy: node --test scripts/karta/testy.mjs).
// Dane wejściowe: rekordy z API PSE his-gen-pal-sire (miks paliw) i his-wlk-cal (wiatr, PV, saldo wymiany).
// Źródła wszystkich liczb poniżej: ZRODLA.md, sekcje „Karta Polski”.

export const WERSJA = 1;
export const TOLERANCJA_MW = 1; // sprawdzian: największa dopuszczalna różnica między raportami PSE

// Kod PSE (alias_sire) → kod ENTSO-E (alias_entsoe, sprawdzany w każdym rekordzie), grupa na pasku,
// OZE (decyzja Ani 21.11.2026) i ślad CO2 w g/kWh (cykl życia).
// ipcc = mediana z IPCC AR5 WGIII, Annex III, Tabela A.III.2; zalozenie = założenie OSIRIS (metoda w ZRODLA.md).
// Szczytowo-pompowe (WS) to magazyn: pomijane w udziałach i w śladzie CO2, pokazywane tylko w Metodologii.
export const PALIWA = {
  WK: { entsoe: 'B05', nazwa: 'węgiel kamienny', grupa: 'kamienny', oze: false, g: 820, skad: 'ipcc' },
  WB: { entsoe: 'B02', nazwa: 'węgiel brunatny', grupa: 'brunatny', oze: false, g: 957, skad: 'zalozenie' },
  GZ: { entsoe: 'B04', nazwa: 'gaz ziemny', grupa: 'gaz_i_inne', oze: false, g: 490, skad: 'ipcc' },
  GK: { entsoe: 'B03', nazwa: 'gaz z węgla', grupa: 'gaz_i_inne', oze: false, g: 820, skad: 'zalozenie' },
  OO: { entsoe: 'B06', nazwa: 'olej', grupa: 'gaz_i_inne', oze: false, g: 665, skad: 'zalozenie' },
  OD: { entsoe: 'B17', nazwa: 'odpady', grupa: 'gaz_i_inne', oze: false, g: 793, skad: 'zalozenie' },
  IN: { entsoe: 'B20', nazwa: 'inne', grupa: 'gaz_i_inne', oze: false, g: 717, skad: 'zalozenie' },
  WI: { entsoe: 'B19', nazwa: 'wiatr na lądzie', grupa: 'oze', oze: true, g: 11, skad: 'ipcc' },
  WM: { entsoe: 'B18', nazwa: 'wiatr na morzu', grupa: 'oze', oze: true, g: 12, skad: 'ipcc' },
  ES: { entsoe: 'B16', nazwa: 'słońce', grupa: 'oze', oze: true, g: 48, skad: 'ipcc' },
  WP: { entsoe: 'B11', nazwa: 'woda przepływowa', grupa: 'oze', oze: true, g: 24, skad: 'ipcc' },
  WZ: { entsoe: 'B12', nazwa: 'woda zbiornikowa', grupa: 'oze', oze: true, g: 24, skad: 'ipcc' },
  BM: { entsoe: 'B01', nazwa: 'biomasa', grupa: 'oze', oze: true, g: 230, skad: 'ipcc' },
  BG: { entsoe: 'B15', nazwa: 'inne OZE', grupa: 'oze', oze: true, g: 230, skad: 'zalozenie' },
  WS: { entsoe: 'B10', nazwa: 'elektrownie szczytowo-pompowe (magazyn)', grupa: null, oze: false, g: null, skad: null },
};
export const GRUPY = ['kamienny', 'brunatny', 'gaz_i_inne', 'oze'];
const KODY = Object.keys(PALIWA);

// Błąd danych: PSE odpowiedziało, ale dane nie przeszły sprawdzianu (wtedy zostają poprzednie dane ze strony).
export class BladSprawdzianu extends Error {}

// „7556,431” → 7556.431. Liczby przepuszczamy; wszystko inne (np. „1 234,5”, „”, null) to błąd danych.
export function liczba(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && /^-?\d+(,\d+)?$/.test(v)) return Number(v.replace(',', '.'));
  throw new BladSprawdzianu(`nieoczekiwana wartość liczbowa: ${JSON.stringify(v)}`);
}

// „2026-11-20 11:15:00” (UTC z API) → „2026-11-20T11:15:00Z”
export const iso = (utc) => `${String(utc).slice(0, 19).replace(' ', 'T')}Z`;
const isoLubNull = (utc) => (utc ? iso(utc) : null);

const zaokr = (x, miejsca) => Math.round(x * 10 ** miejsca) / 10 ** miejsca;

// Rekordy miksu → Map(dtime_utc → { kody: {WK: MW, …}, rekord: pierwszy rekord kwadransa }).
export function grupujMiks(rekordy) {
  const kwadranse = new Map();
  for (const r of rekordy) {
    const p = PALIWA[r.alias_sire];
    if (!p) throw new BladSprawdzianu(`nieznany kod paliwa PSE: ${JSON.stringify(r.alias_sire)} (${r.alias_entsoe})`);
    if (r.alias_entsoe !== p.entsoe) {
      throw new BladSprawdzianu(`kod PSE ${r.alias_sire} ma kod ENTSO-E ${r.alias_entsoe}, a oczekiwany ${p.entsoe}`);
    }
    if (!r.dtime_utc) throw new BladSprawdzianu('rekord miksu bez dtime_utc');
    if (!kwadranse.has(r.dtime_utc)) kwadranse.set(r.dtime_utc, { kody: {}, rekord: r });
    const k = kwadranse.get(r.dtime_utc);
    if (r.alias_sire in k.kody) throw new BladSprawdzianu(`podwójny kod ${r.alias_sire} w kwadransie ${r.dtime_utc} UTC`);
    k.kody[r.alias_sire] = liczba(r.value);
  }
  return kwadranse;
}

const pelny = (k) => KODY.every((kod) => kod in k.kody);
const maLiczby = (w, pola) => pola.every((p) => typeof w[p] === 'number');

// Sprawdzian: w każdym kwadransie obecnym w obu raportach WI+WM = wi i ES = pv (z tolerancją).
// Kwadranse, których nie ma w obu raportach (np. najnowszy), pomijamy – to nie jest błąd.
export function sprawdzian(miks, wlk, tolerancja = TOLERANCJA_MW) {
  let porownane = 0;
  let maks = 0;
  const bledy = [];
  for (const w of wlk) {
    const k = miks.get(w.dtime_utc);
    if (!k || !maLiczby(w, ['wi', 'pv'])) continue;
    if (!['WI', 'WM', 'ES'].every((kod) => kod in k.kody)) continue;
    porownane++;
    const rWiatr = Math.abs(k.kody.WI + k.kody.WM - w.wi);
    const rPv = Math.abs(k.kody.ES - w.pv);
    maks = Math.max(maks, rWiatr, rPv);
    if (rWiatr > tolerancja) bledy.push(`${w.business_date} ${w.period}: wiatr WI+WM ${zaokr(k.kody.WI + k.kody.WM, 3)} ≠ wi ${w.wi}`);
    if (rPv > tolerancja) bledy.push(`${w.business_date} ${w.period}: PV ES ${k.kody.ES} ≠ pv ${w.pv}`);
  }
  if (porownane === 0) bledy.push('brak wspólnych kwadransów w raportach his-gen-pal-sire i his-wlk-cal');
  return { ok: bledy.length === 0, porownane, maks_roznica_mw: zaokr(maks, 3), tolerancja_mw: tolerancja, bledy };
}

// Najnowszy kwadrans z pełnym miksem (wszystkie kody) i z wiatrem, PV i saldem w his-wlk-cal.
export function wybierzKwadrans(miks, wlk) {
  const wlkPoCzasie = new Map(wlk.map((w) => [w.dtime_utc, w]));
  const czasy = [...miks.keys()].sort().reverse();
  for (const t of czasy) {
    const w = wlkPoCzasie.get(t);
    if (pelny(miks.get(t)) && w && maLiczby(w, ['wi', 'pv', 'swm_p', 'swm_np'])) return { miks: miks.get(t), wlk: w };
  }
  throw new BladSprawdzianu('brak kwadransu z pełnym miksem i saldem wymiany w obu raportach');
}

// Liczby na kartę z jednego kwadransa. Udziały: z produkcji w Polsce, bez szczytowo-pompowych.
export function policz({ miks, wlk }) {
  const kody = miks.kody;
  const liczone = KODY.filter((kod) => PALIWA[kod].grupa);
  const produkcja = liczone.reduce((s, kod) => s + kody[kod], 0);
  if (!(produkcja > 0)) throw new BladSprawdzianu(`produkcja w kwadransie nie jest dodatnia: ${produkcja}`);

  const paliwa = liczone.map((kod) => ({
    kod_pse: kod,
    kod_entsoe: PALIWA[kod].entsoe,
    nazwa: PALIWA[kod].nazwa,
    grupa: PALIWA[kod].grupa,
    oze: PALIWA[kod].oze,
    mw: zaokr(kody[kod], 1),
    udzial: zaokr(kody[kod] / produkcja, 4),
    g_kwh: PALIWA[kod].g,
    wartosc_co2: PALIWA[kod].skad,
  }));
  const grupy = Object.fromEntries(
    GRUPY.map((g) => {
      const mw = liczone.filter((kod) => PALIWA[kod].grupa === g).reduce((s, kod) => s + kody[kod], 0);
      return [g, { mw: zaokr(mw, 1), udzial: zaokr(mw / produkcja, 4) }];
    }),
  );
  const co2 = liczone.reduce((s, kod) => s + kody[kod] * PALIWA[kod].g, 0) / produkcja;
  const saldo = wlk.swm_p + wlk.swm_np;
  const r = miks.rekord;

  return {
    kwadrans: {
      doba: r.business_date,
      okres: r.period,
      koniec: r.dtime,
      koniec_utc: iso(r.dtime_utc),
      publikacja: r.publication_ts,
      publikacja_utc: iso(r.publication_ts_utc),
      publikacja_wlk_utc: isoLubNull(wlk.publication_ts_utc),
    },
    produkcja_mw: zaokr(produkcja, 1),
    wegiel_udzial: zaokr((grupy.kamienny.mw + grupy.brunatny.mw) / produkcja, 4),
    oze_udzial: grupy.oze.udzial,
    grupy,
    paliwa,
    szczytowo_pompowe_mw: zaokr(kody.WS, 1),
    co2: {
      g_kwh: zaokr(co2, 1),
      g_kwh_ok: Math.round(co2 / 10) * 10,
      opis: 'szacunek OSIRIS wg IPCC (cykl życia), z produkcji w Polsce',
    },
    wymiana: {
      saldo_mw: zaokr(saldo, 1),
      swm_p: wlk.swm_p,
      swm_np: wlk.swm_np,
      kierunek: saldo > 0 ? 'kupuje' : saldo < 0 ? 'sprzedaje' : 'bez wymiany',
      opis: 'wymiana planowa (swm_p + swm_np); + zakup z zagranicy, − sprzedaż za granicę',
    },
    // Tylko informacyjnie (nie blokuje): produkcja + saldo ≈ zapotrzebowanie PSE.
    bilans: typeof wlk.demand === 'number'
      ? { zapotrzebowanie_mw: wlk.demand, roznica_mw: zaokr(produkcja + kody.WS + saldo - wlk.demand, 1) }
      : null,
  };
}

// Całość: rekordy z dwóch raportów → obiekt karta.json. Rzuca BladSprawdzianu, gdy dane są niezgodne.
export function zbudujKarte(rekordyMiksu, rekordyWlk, czasPobrania) {
  const miks = grupujMiks(rekordyMiksu);
  const spr = sprawdzian(miks, rekordyWlk);
  if (!spr.ok) {
    const e = new BladSprawdzianu(`sprawdzian nie przeszedł: ${spr.bledy.slice(0, 3).join('; ')}${spr.bledy.length > 3 ? ` (i ${spr.bledy.length - 3} więcej)` : ''}`);
    e.sprawdzian = spr;
    throw e;
  }
  return {
    wersja: WERSJA,
    czas_pobrania: czasPobrania,
    zrodlo: 'PSE S.A., raporty.pse.pl (raporty his-gen-pal-sire i his-wlk-cal); przetworzenie i ślad CO2: OSIRIS',
    plakietka: null,
    sprawdzian: { ok: true, porownane_kwadranse: spr.porownane, maks_roznica_mw: spr.maks_roznica_mw, tolerancja_mw: spr.tolerancja_mw },
    ...policz(wybierzKwadrans(miks, rekordyWlk)),
    kobize: { kg_mwh: 553, rok: 2024, opis: 'KOBiZE: emisja ze spalania u odbiorców końcowych (nie cykl życia) – nie porównywać wprost' },
  };
}

// Czy obiekt wygląda jak nasz karta.json (sprawdzamy poprzednią wersję pobraną ze strony, zanim jej użyjemy).
export function wygladaJakKarta(o) {
  return (
    o?.wersja === WERSJA &&
    typeof o.kwadrans?.koniec_utc === 'string' &&
    typeof o.wegiel_udzial === 'number' &&
    typeof o.co2?.g_kwh_ok === 'number' &&
    GRUPY.every((g) => typeof o.grupy?.[g]?.udzial === 'number') &&
    typeof o.wymiana?.saldo_mw === 'number'
  );
}
