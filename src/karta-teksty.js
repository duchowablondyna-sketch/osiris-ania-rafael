// Karta Polski – wszystkie napisy panelu „Ile i jak czysto” z karta.json i rce.json.
// Bez DOM i bez sieci, żeby dało się to sprawdzić w Node: node --test scripts/karta/testy-panel.mjs
// Panel (src/karta.js) tylko wstawia te napisy na stronę – liczby nie są liczone drugi raz gdzie indziej.
// Teksty: słowniki src/teksty/pl.js i en.js (t() z src/jezyk.js); liczby i daty wg języka strony.
import { wygladaJakKarta } from '../scripts/karta/licz.mjs';
import { t, liczba, zDanych, LOCALE, formatCzasu as formatCzasuJezyka, formatDnia, formatDoby } from './jezyk.js';

// Dane starsze niż tyle godzin dostają plakietkę (decyzja Ani 21.11.2026): strona przebudowuje się co 4 h,
// PSE publikuje miks z opóźnieniem ok. 30–45 min, więc zwykle dane mają do ok. 5 h.
export const PROG_STARYCH_H = 6;

const MS_KWADRANS = 15 * 60_000;
const STREFA = 'Europe/Warsaw';

// Wszystkie daty i godziny – wg czasu polskiego, niezależnie od strefy komputera widza.
const dobaPL = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: STREFA }); // RRRR-MM-DD
const godzinaPL = (ms) => new Date(ms).toLocaleTimeString(LOCALE, { timeZone: STREFA, hour: '2-digit', minute: '2-digit' });
const dzienPL = (ms) => formatDnia(dobaPL(ms)); // „20.11” / „20 Nov”
export const formatCzasu = (iso) => formatCzasuJezyka(iso);

// „17:30”, a gdy to nie dziś – „20.11, 23:45” (EN: „20 Nov, 23:45”).
function chwila(ms, teraz, zawszeZData = false) {
  return zawszeZData || dobaPL(ms) !== dobaPL(teraz) ? `${dzienPL(ms)}, ${godzinaPL(ms)}` : godzinaPL(ms);
}

const procent1 = (u) => `${liczba(u * 100, 1)}%`;
const zl = (c) => liczba(c, 2);

// Nazwa ze słownika liczona w chwili użycia (getter) – działa w języku strony, także gdy test przełączy język.
const nazwana = (klucz, reszta) => Object.defineProperty({ ...reszta }, 'nazwa', { get: () => t(klucz), enumerable: true });

// Kolejność i nazwy na pasku (grupy z scripts/karta/licz.mjs).
export const PASEK = [
  nazwana('karta.grupa.kamienny', { grupa: 'kamienny' }),
  nazwana('karta.grupa.brunatny', { grupa: 'brunatny' }),
  nazwana('karta.grupa.gaz_i_inne', { grupa: 'gaz_i_inne' }),
  nazwana('karta.grupa.oze', { grupa: 'oze' }),
];

// Okienko Polski, przypadek OZE: podział OZE na rodzaje (kody PSE z scripts/karta/licz.mjs).
// Biomasa i „inne OZE” razem – żeby kawałki składały się na całe OZE (decyzja Ani 23.11.2026).
export const PODZIAL_OZE = [
  nazwana('karta.oze.wiatr_lad', { grupa: 'wiatr_lad', kody: ['WI'] }),
  nazwana('karta.oze.wiatr_morze', { grupa: 'wiatr_morze', kody: ['WM'] }),
  nazwana('karta.oze.slonce', { grupa: 'slonce', kody: ['ES'] }),
  nazwana('karta.oze.woda', { grupa: 'woda', kody: ['WP', 'WZ'] }),
  nazwana('karta.oze.biomasa', { grupa: 'biomasa', kody: ['BM', 'BG'] }),
];

// Paski „Ile pracuje z tego, co mamy”: produkcja teraz (kody PSE z karta.json) na tle mocy zainstalowanej
// (wiersze PSE, Raport 2025 KSE, Tabela 1.1 – scripts/karta/moc-zainstalowana-pse-2025.json). Decyzje Ani 23.11.2026:
// bez paska wody (moc „zawodowe wodne” obejmuje prawdopodobnie szczytowo-pompowe, których nie liczymy w produkcji),
// gaz = tylko gaz ziemny (GZ), jeden pasek kreskowany z „?” dla wiatru, słońca i innych OZE (raport ich nie rozdziela).
// Olej, odpady, „inne” i gaz z węgla – bez paska (brak wiersza mocy).
export const PASKI_MOCY = [
  nazwana('karta.grupa.kamienny', { klucz: 'kamienny', kody: ['WK'], wiersz: 'wegiel_kamienny' }),
  nazwana('karta.grupa.brunatny', { klucz: 'brunatny', kody: ['WB'], wiersz: 'wegiel_brunatny' }),
  nazwana('karta.moc.gaz', { klucz: 'gaz', kody: ['GZ'], wiersz: 'gazowe' }),
  nazwana('karta.moc.oze', { klucz: 'oze', kody: ['WI', 'WM', 'ES', 'BM', 'BG'], wiersz: 'wiatrowe_i_inne_odnawialne', niepewny: true }),
];

const gw = (mw) => liczba(mw / 1000, 1);

// karta – karta.json (z polem moc_zainstalowana); stan – „13:45” albo „22.11, 13:45” (ten sam co w podpisie panelu).
export function tekstyMocy(karta, stan) {
  const brak = { ok: false, tekst: t('karta.moc_brak') };
  const moc = karta?.moc_zainstalowana;
  const data = /^(\d{4})-(\d{2})-(\d{2})$/.exec(moc?.stan_na ?? '');
  if (!moc?.wiersze || !data || !Array.isArray(karta.paliwa)) return brak;
  const stanMocy = formatDoby(moc.stan_na); // „31.12.2025” / „31 Dec 2025”
  const mwKodu = new Map(karta.paliwa.filter((p) => typeof p.mw === 'number').map((p) => [p.kod_pse, p.mw]));
  const paski = [];
  for (const { klucz, nazwa, kody, wiersz, niepewny = false } of PASKI_MOCY) {
    const mocMw = moc.wiersze[wiersz];
    if (!(typeof mocMw === 'number' && mocMw > 0) || !kody.every((k) => mwKodu.has(k))) return brak;
    const produkcjaMw = Math.max(0, kody.reduce((s, k) => s + mwKodu.get(k), 0));
    const ponad = produkcjaMw > mocMw;
    paski.push({
      klucz,
      nazwa,
      niepewny,
      produkcja_mw: produkcjaMw,
      moc_mw: mocMw,
      udzial: Math.min(1, produkcjaMw / mocMw), // szerokość kolorowego paska; nigdy ponad 100%
      ponad,
      tekst: t('karta.moc_tekst', gw(produkcjaMw), gw(mocMw)),
      dopisek: ponad ? t('karta.moc_ponad', stanMocy) : null,
    });
  }
  return {
    ok: true,
    podpis: t('karta.moc_podpis', stan, stanMocy),
    paski,
    zrodlo: t('karta.moc_zrodlo', stanMocy),
  };
}

// Skala paska CO2 w okienku Polski: 0–1500 g CO₂eq/kWh.
export const CO2_SKALA_MAX = 1500;

// Cena RCE w bieżącym kwadransie (ta sama zasada co w okienku PSE: tylko doba dzisiejsza wg czasu polskiego).
export function tekstCeny(rce, teraz) {
  const seria = (rce?.doby?.[dobaPL(teraz)] ?? []).filter((p) => typeof p.cena === 'number' && p.koniec_utc);
  const biezacy = seria.find((p) => {
    const k = Date.parse(p.koniec_utc);
    return teraz >= k - MS_KWADRANS && teraz < k;
  });
  if (!biezacy) return { ok: false, wartosc: t(rce ? 'karta.cena_brak_dzis' : 'wspolne.brak_danych_pse'), opis: '' };
  return { ok: true, wartosc: `${zl(biezacy.cena)} ${t('jednostka.zl_mwh')}`, opis: biezacy.okres.replace(' - ', '–') };
}

function tekstWymiany(saldo) {
  const mw = Math.round(Math.abs(saldo) / 10) * 10;
  if (mw === 0) return { wartosc: t('karta.wymiana_zero'), opis: t('karta.wymiana_zero_opis') };
  // Plus – prąd płynie do Polski („kupuje” / „importing”), minus – z Polski („sprzedaje” / „exporting”).
  return { wartosc: t(saldo > 0 ? 'karta.wymiana_kupuje' : 'karta.wymiana_sprzedaje', liczba(mw)), opis: t('karta.wymiana_planowo') };
}

// Kawałki OZE z listy paliw w karta.json; udział = suma MW rodzaju / cała produkcja (jak udziały grup w licz.mjs).
// Starszy plik bez listy paliw: jeden kawałek „OZE” (ta sama liczba co na pasku), bez zgadywania podziału.
function kawalkiOze(karta) {
  const paliwa = Array.isArray(karta.paliwa) ? karta.paliwa : [];
  const mwKodu = new Map(paliwa.filter((p) => typeof p.mw === 'number').map((p) => [p.kod_pse, p.mw]));
  const komplet = PODZIAL_OZE.every((r) => r.kody.every((k) => mwKodu.has(k))) && karta.produkcja_mw > 0;
  if (!komplet) return [{ grupa: 'oze', nazwa: t('karta.grupa.oze'), udzial: karta.grupy.oze.udzial, tekst: procent1(karta.grupy.oze.udzial) }];
  return PODZIAL_OZE.map(({ grupa, nazwa, kody }) => {
    const udzial = kody.reduce((s, k) => s + mwKodu.get(k), 0) / karta.produkcja_mw;
    return { grupa, nazwa, udzial, tekst: procent1(udzial) };
  });
}

// Powód plakietki z karta.json (po polsku, scripts/karta/pobierz.mjs) → tekst w języku strony.
const powodPlakietki = (powod) => zDanych(powod, 'karta.powod.');

// karta – obiekt z karta.json albo null (plik się nie wczytał); rce – obiekt z rce.json albo null; teraz – ms.
export function tekstyKarty(karta, rce, teraz = Date.now()) {
  const cena = tekstCeny(rce, teraz);
  const pobrano = karta?.czas_pobrania ? formatCzasu(karta.czas_pobrania) : null;

  if (!wygladaJakKarta(karta)) {
    const powod = typeof karta?.plakietka === 'string' ? karta.plakietka : null;
    return {
      ok: false,
      plakietka: powod ? t('karta.plakietka_brak_powod', powodPlakietki(powod)) : t('karta.plakietka_brak'),
      skrot: t('wspolne.brak_danych_pse'),
      cena,
      pobrano: null, // czas_pobrania przy braku danych to tylko czas nieudanej próby
      moc: { ok: false, tekst: t('karta.moc_brak') },
    };
  }

  const koniec = Date.parse(karta.kwadrans.koniec_utc);
  const stan = chwila(koniec, teraz);
  const stanZData = chwila(koniec, teraz, true);

  let plakietka = null;
  if (typeof karta.plakietka === 'string' && karta.plakietka) {
    plakietka = t('karta.plakietka_nie_najnowsze', powodPlakietki(karta.plakietka), stanZData);
  } else if (teraz - koniec > PROG_STARYCH_H * 3_600_000) {
    plakietka = t('karta.plakietka_stare', PROG_STARYCH_H, stanZData);
  }

  // Liczba-bohater: tego, czego więcej – węgla (razem) albo OZE; przy remisie węgiel (decyzja Ani 21.11.2026).
  const oze = karta.oze_udzial > karta.wegiel_udzial;
  const bohater = {
    grupa: oze ? 'oze' : 'wegiel',
    procent: `${Math.round((oze ? karta.oze_udzial : karta.wegiel_udzial) * 100)}%`,
    zdanie: t(oze ? 'karta.bohater_oze' : 'karta.bohater_wegiel'),
    krotko: t(oze ? 'karta.krotko_oze' : 'karta.krotko_wegiel'),
  };

  const publikacja = Date.parse(karta.kwadrans.publikacja_utc);
  const stanIPublikacja = t('karta.stan', stan) + (Number.isFinite(publikacja) ? t('karta.opublikowalo', chwila(publikacja, teraz)) : '');
  const podpis = t('karta.podpis', stanIPublikacja);

  const pasek = PASEK.map(({ grupa, nazwa }) => ({ grupa, nazwa, udzial: karta.grupy[grupa].udzial, tekst: procent1(karta.grupy[grupa].udzial) }));
  const co2 = { wartosc: t('karta.co2_wartosc', liczba(karta.co2.g_kwh_ok)), opis: t('karta.co2_opis') };

  return {
    ok: true,
    plakietka,
    skrot: `${bohater.procent} ${bohater.krotko} · ${t('karta.stan', stan)}`,
    bohater,
    podpis,
    pasek,
    moc: tekstyMocy(karta, stan),
    cena,
    co2,
    // Okienko Polski (po najechaniu na liczbę-bohatera): pierścień = to samo, co liczba-bohater.
    okienko: {
      naglowek: t('okienko_polski.naglowek', bohater.krotko),
      stan: stanIPublikacja,
      kawalki: oze ? kawalkiOze(karta) : pasek.filter((p) => p.grupa === 'kamienny' || p.grupa === 'brunatny'),
      // „razem” z całości (nie z sumy zaokrąglonych kawałków), z jednym miejscem po przecinku.
      razem: procent1(oze ? karta.oze_udzial : karta.wegiel_udzial),
      co2: {
        wartosc: co2.wartosc,
        tekst: t('okienko_polski.tu', co2.wartosc),
        polozenie: Math.min(1, Math.max(0, karta.co2.g_kwh_ok / CO2_SKALA_MAX)),
      },
      zdanie: t('okienko_polski.zdanie'),
    },
    wymiana: tekstWymiany(karta.wymiana.saldo_mw),
    pobrano,
    metodologia: {
      co2: t('karta.co2_dokladnie', liczba(karta.co2.g_kwh, 1)),
      sprawdzian: karta.sprawdzian
        ? t('karta.sprawdzian', karta.sprawdzian.porownane_kwadranse, liczba(karta.sprawdzian.maks_roznica_mw))
        : null,
    },
  };
}
