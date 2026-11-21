// Wspólna reguła dla „Wykazu rozdzielni na stacjach bez możliwości przyłączenia nowych obiektów” (PSE):
// którym stacjom z mocą dla odbiorców i jak to oznaczamy. Bez zależności – używają jej mapa (src/moce.js),
// wyciąg (scripts/pse-moce/rozdzielnie.mjs) i testy (scripts/pse-moce/testy.mjs).
//
// Decyzja Ani (21.11.2026): pusty sześciokąt tylko wtedy, gdy wykaz obejmuje rozdzielnię 220 albo 400 kV tej stacji
// (do tych napięć przyłączają się najwięksi odbiorcy). Gdy wykaz wymienia tylko rozdzielnię 110 kV – pełny sześciokąt
// i zawężone zdanie w okienku („o rozdzielniach 220/400 kV wykaz nie mówi”).

const napiecieKv = (rozdzielnia) => Number(rozdzielnia.match(/(\d+)\s*kV/)?.[1] ?? NaN);

// Kody stacji z list 2 i 3 (planowane rozdzielnie: „Wnioski … pozostaną bez weryfikacji i bez rozpatrzenia”).
// Wynik: kod → { lista, tytul_listy, rozdzielnie: ['Rozdzielnia 110 kV', …], najwyzsze_kv, pusty }.
export function stacjeBezRozpatrzenia(wykaz) {
  const wynik = new Map();
  wykaz.listy.slice(1).forEach((l, i) => {
    for (const r of l.rozdzielnie) {
      for (const kod of r.kody) {
        const s = wynik.get(kod) ?? { lista: i + 2, tytul_listy: l.tytul, rozdzielnie: [] };
        if (!s.rozdzielnie.includes(r.rozdzielnia)) s.rozdzielnie.push(r.rozdzielnia);
        wynik.set(kod, s);
      }
    }
  });
  for (const s of wynik.values()) {
    s.najwyzsze_kv = Math.max(...s.rozdzielnie.map(napiecieKv).filter(Number.isFinite));
    s.pusty = czyPusty(s);
  }
  return wynik;
}

// Pusty sześciokąt: w wykazie jest rozdzielnia 220 kV albo 400 kV tej stacji.
export function czyPusty(wpis) {
  return Boolean(wpis) && wpis.rozdzielnie.some((r) => [220, 400].includes(napiecieKv(r)));
}
