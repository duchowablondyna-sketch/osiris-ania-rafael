// Karta Polski – wszystkie napisy panelu „Ile i jak czysto” z karta.json i rce.json.
// Bez DOM i bez sieci, żeby dało się to sprawdzić w Node: node --test scripts/karta/testy-panel.mjs
// Panel (src/karta.js) tylko wstawia te napisy na stronę – liczby nie są liczone drugi raz gdzie indziej.
import { wygladaJakKarta } from '../scripts/karta/licz.mjs';

// Dane starsze niż tyle godzin dostają plakietkę (decyzja Ani 21.11.2026): strona przebudowuje się co 4 h,
// PSE publikuje miks z opóźnieniem ok. 30–45 min, więc zwykle dane mają do ok. 5 h.
export const PROG_STARYCH_H = 6;

const MS_KWADRANS = 15 * 60_000;
const STREFA = 'Europe/Warsaw';

// Wszystkie daty i godziny – wg czasu polskiego, niezależnie od strefy komputera widza.
const dobaPL = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: STREFA }); // RRRR-MM-DD
const godzinaPL = (ms) => new Date(ms).toLocaleTimeString('pl-PL', { timeZone: STREFA, hour: '2-digit', minute: '2-digit' });
const dzienPL = (ms) => {
  const [, m, d] = dobaPL(ms).split('-');
  return `${d}.${m}`;
};
export const formatCzasu = (iso) =>
  new Date(iso).toLocaleString('pl-PL', { timeZone: STREFA, dateStyle: 'short', timeStyle: 'short' });

// „17:30”, a gdy to nie dziś – „20.11, 23:45”.
function chwila(ms, teraz, zawszeZData = false) {
  return zawszeZData || dobaPL(ms) !== dobaPL(teraz) ? `${dzienPL(ms)}, ${godzinaPL(ms)}` : godzinaPL(ms);
}

const procent1 = (u) => `${(u * 100).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const zl = (c) => c.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Kolejność i nazwy na pasku (grupy z scripts/karta/licz.mjs).
export const PASEK = [
  { grupa: 'kamienny', nazwa: 'węgiel kamienny' },
  { grupa: 'brunatny', nazwa: 'węgiel brunatny' },
  { grupa: 'gaz_i_inne', nazwa: 'gaz i inne' },
  { grupa: 'oze', nazwa: 'OZE' },
];

// Cena RCE w bieżącym kwadransie (ta sama zasada co w okienku PSE: tylko doba dzisiejsza wg czasu polskiego).
export function tekstCeny(rce, teraz) {
  const seria = (rce?.doby?.[dobaPL(teraz)] ?? []).filter((p) => typeof p.cena === 'number' && p.koniec_utc);
  const biezacy = seria.find((p) => {
    const k = Date.parse(p.koniec_utc);
    return teraz >= k - MS_KWADRANS && teraz < k;
  });
  if (!biezacy) return { ok: false, wartosc: rce ? 'brak danych na dziś' : 'brak danych PSE', opis: '' };
  return { ok: true, wartosc: `${zl(biezacy.cena)} zł/MWh`, opis: biezacy.okres.replace(' - ', '–') };
}

function tekstWymiany(saldo) {
  const mw = Math.round(Math.abs(saldo) / 10) * 10;
  if (mw === 0) return { wartosc: 'ok. 0 MW', opis: 'planowo, prawie bez wymiany' };
  return { wartosc: `${saldo > 0 ? 'kupuje' : 'sprzedaje'} ok. ${mw.toLocaleString('pl-PL')} MW`, opis: 'planowo' };
}

// karta – obiekt z karta.json albo null (plik się nie wczytał); rce – obiekt z rce.json albo null; teraz – ms.
export function tekstyKarty(karta, rce, teraz = Date.now()) {
  const cena = tekstCeny(rce, teraz);
  const pobrano = karta?.czas_pobrania ? formatCzasu(karta.czas_pobrania) : null;

  if (!wygladaJakKarta(karta)) {
    const powod = typeof karta?.plakietka === 'string' ? karta.plakietka : null;
    return {
      ok: false,
      plakietka: powod ? `Brak danych o miksie: ${powod}.` : 'Brak danych PSE o miksie.',
      skrot: 'brak danych PSE',
      cena,
      pobrano: null, // czas_pobrania przy braku danych to tylko czas nieudanej próby
    };
  }

  const koniec = Date.parse(karta.kwadrans.koniec_utc);
  const stan = chwila(koniec, teraz);
  const stanZData = chwila(koniec, teraz, true);

  let plakietka = null;
  if (typeof karta.plakietka === 'string' && karta.plakietka) {
    plakietka = `Dane nie są najnowsze: ${karta.plakietka}. Pokazujemy stan na ${stanZData}.`;
  } else if (teraz - koniec > PROG_STARYCH_H * 3_600_000) {
    plakietka = `Dane sprzed ponad ${PROG_STARYCH_H} godzin. Pokazujemy stan na ${stanZData}.`;
  }

  // Liczba-bohater: tego, czego więcej – węgla (razem) albo OZE; przy remisie węgiel (decyzja Ani 21.11.2026).
  const oze = karta.oze_udzial > karta.wegiel_udzial;
  const bohater = {
    grupa: oze ? 'oze' : 'wegiel',
    procent: `${Math.round((oze ? karta.oze_udzial : karta.wegiel_udzial) * 100)}%`,
    zdanie: oze ? 'prądu w Polsce pochodzi z OZE (źródeł odnawialnych)' : 'prądu w Polsce pochodzi z węgla',
    krotko: oze ? 'z OZE' : 'z węgla',
  };

  const publikacja = Date.parse(karta.kwadrans.publikacja_utc);
  const podpis = `z produkcji w Polsce · stan na ${stan}` + (Number.isFinite(publikacja) ? ` · PSE opublikowało ${chwila(publikacja, teraz)}` : '');

  return {
    ok: true,
    plakietka,
    skrot: `${bohater.procent} ${bohater.krotko} · stan na ${stan}`,
    bohater,
    podpis,
    pasek: PASEK.map(({ grupa, nazwa }) => ({ grupa, nazwa, udzial: karta.grupy[grupa].udzial, tekst: procent1(karta.grupy[grupa].udzial) })),
    cena,
    co2: { wartosc: `ok. ${karta.co2.g_kwh_ok} g/kWh`, opis: 'szacunek OSIRIS' },
    wymiana: tekstWymiany(karta.wymiana.saldo_mw),
    pobrano,
    metodologia: {
      co2: `${karta.co2.g_kwh.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} g/kWh`,
      sprawdzian: karta.sprawdzian
        ? `${karta.sprawdzian.porownane_kwadranse} wspólnych kwadransów, największa różnica ${karta.sprawdzian.maks_roznica_mw.toLocaleString('pl-PL')} MW`
        : null,
    },
  };
}
