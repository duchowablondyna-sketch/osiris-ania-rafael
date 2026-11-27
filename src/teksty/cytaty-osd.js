// Tłumaczenia cytatów z dokumentów operatorów dystrybucyjnych (OSD) na angielski – tłumaczenie SOURCE, tak jak cytaty
// PSE (src/teksty/cytaty-pse.js): na /en/map/ tłumaczenie, a pod nim mniejszym drukiem oryginał po polsku.
// Klucz = dokładny tekst operatora z danych (public/data/osd-pge.json i osd-energa.json → cytaty.*.tekst).
// Nowy cytat bez tłumaczenia – strona pokaże oryginał z dopiskiem, a test (scripts/testy-osd.mjs) wskaże brak.

export default {
  // ── PGE Dystrybucja, „Informacja o łącznej dostępnej mocy przyłączeniowej …” – III kwartał 2026 ──
  'grupy węzłów koherentnych tzn. takich, w których przyłączenia znacząco oddziaływają na siebie':
    'groups of coherent nodes, i.e. nodes where connections significantly affect one another',
  'wyznaczone wartości dostępnych mocy przyłączeniowych należy traktować jako wartości szacunkowe':
    'the calculated values of available connection capacity should be treated as estimates',
  'stacje niebędące własnością PGE Dystrybucja SA': 'substations not owned by PGE Dystrybucja SA',

  // ── Energa-Operator, „Informacja o wartości łącznej dostępnej odbiorczej mocy przyłączeniowej …” – stan na 31.08.2026 ──
  'węzły spójne pod względem wpływu przyłączanej do nich mocy na obciążenia elementów sieci dystrybucyjnej ENERGA-OPERATOR SA':
    'nodes that are consistent in terms of how the capacity connected to them affects the loading of ENERGA-OPERATOR SA distribution network elements',
  'wyznaczone wartości dostępnych mocy przyłączeniowych należy traktować jako szacunkowe':
    'the calculated values of available connection capacity should be treated as estimates',
  'będzie możliwy jedynie w przypadku realizacji w całości założeń inwestycyjnych':
    'will be possible only if the investment assumptions are implemented in full',
  'uwzględnione są wszystkie, nieobjęte dodatkowymi zastrzeżeniami inwestycje z Planu Rozwoju PSE S.A.':
    'all investments from the PSE S.A. Development Plan that are not subject to additional reservations are taken into account',
  'kolorem czerwonym zaznaczono znajdujące się na terenie działania ENERGA stacje abonenckie (niebędące majątkiem ENERGA) lub częściowo należące do ENERGA (w zakresie rozdzielni 110 kV)':
    'marked in red: customer-owned substations in the ENERGA area (not owned by ENERGA) or substations partly owned by ENERGA (as regards the 110 kV switchyard)',
  'w 2035 grupa 37 połączona z grupą 36 (Kutno 1)': 'in 2035 group 37 is merged with group 36 (Kutno 1)',
};
