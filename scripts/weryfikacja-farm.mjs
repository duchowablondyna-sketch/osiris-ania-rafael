// Porównanie farm z EMODnet z listą projektów MKiŚ (stan: styczeń 2024),
// https://www.gov.pl/web/morska-energetyka-wiatrowa/obecnie-realizowane-projekty-w-polsce
// Opis decyzji i powody: ZRODLA.md, wpis EMODnet, „Porównanie z listą MKiŚ”.
// Klucz: nazwa farmy w EMODnet. Wartość: { weryfikacja, opis? } – opis zastępuje tekst w okienku.
const NA_LISCIE = 'na liście MKiŚ';
const BRAK = 'brak na liście MKiŚ';
const duplikat = (nazwa) => `prawdopodobny duplikat: ${nazwa}`;

export const WERYFIKACJA = {
  'Baltic Power': { weryfikacja: NA_LISCIE },
  'Baltyk I Phase 1': { weryfikacja: NA_LISCIE, opis: 'na liście MKiŚ, część projektu MFW Bałtyk I' },
  'Baltyk I Phase 2': { weryfikacja: NA_LISCIE, opis: 'na liście MKiŚ, część projektu MFW Bałtyk I' },
  'Baltica 1': { weryfikacja: NA_LISCIE },
  'Baltica 2': { weryfikacja: NA_LISCIE },
  'Baltica 2+': { weryfikacja: NA_LISCIE },
  'Baltica 3': { weryfikacja: NA_LISCIE },
  'Baltyk II': { weryfikacja: NA_LISCIE },
  'Baltyk III': { weryfikacja: NA_LISCIE },
  'FEW Baltic II': { weryfikacja: NA_LISCIE },
  'BC Wind Offshore wind farm B': { weryfikacja: NA_LISCIE },
  'BC Wind Offshore wind farm C': { weryfikacja: NA_LISCIE },
  'Baltica IV Offshore wind farm 1': { weryfikacja: NA_LISCIE },
  'Baltica V Offshore wind farm 1': { weryfikacja: NA_LISCIE },
  'Baltica 9': { weryfikacja: NA_LISCIE },
  'Energa MFW 1 Offshore wind farm 1': { weryfikacja: NA_LISCIE },
  'Energa MFW 2 Offshore wind farm 1': { weryfikacja: NA_LISCIE },
  'Orlen Neptun III Offshore wind farm 1': { weryfikacja: NA_LISCIE },
  'Orlen Neptun IV Offshore wind farm 1': { weryfikacja: NA_LISCIE },
  'Baltic East': {
    weryfikacja: NA_LISCIE,
    opis: 'na liście MKiŚ jako Orlen Neptun 46.E.1 (spółka Orlen Neptun VIII)',
  },
  'Orlen Neptun VIII Offshore wind farm 1': { weryfikacja: duplikat('Baltic East') },
  'B-Wind': { weryfikacja: duplikat('BC Wind Offshore wind farm B') },
  'C-Wind': { weryfikacja: duplikat('BC Wind Offshore wind farm C') },
  'Sharco Duo Offshore wind farm': { weryfikacja: BRAK },
  'Freeboard I Offshore wind farm 1': { weryfikacja: BRAK },
  'Licence Application No. 76': { weryfikacja: BRAK },
};

// Dodaje do właściwości farmy pola weryfikacja i (jeśli jest) weryfikacja_opis.
// Farma spoza tabelki dostaje „nie sprawdzono”, żeby nic nie przeszło niezauważone.
export function dodajWeryfikacje(properties) {
  const w = WERYFIKACJA[properties.nazwa];
  const wynik = { ...properties, weryfikacja: w?.weryfikacja ?? 'nie sprawdzono' };
  if (w?.opis) wynik.weryfikacja_opis = w.opis;
  return wynik;
}
