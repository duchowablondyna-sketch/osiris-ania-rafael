#!/usr/bin/env python3
"""Jednorazowy wyciąg z Global Integrated Power Tracker (Global Energy Monitor) dla Polski.

Uruchomienie (surowy plik GEM zostaje POZA repo – podajemy tylko jego ścieżkę):
    python3 scripts/wyciag-gem.py "/ścieżka/Global Integrated Power September 2026 V2.xlsx"

Co robi:
- czyta arkusz „Power facilities” bez dodatkowych pakietów (xlsx to archiwum ZIP z plikami XML),
- zostawia tylko Polskę,
- pomija fotowoltaikę (typ „utility-scale solar”),
- pomija wiersze z oznaczeniem TransitionZero („TZ:” w kolumnie „Other IDs (unit/phase)”) dowolnego typu –
  według arkusza About są na licencji CC BY-NC 4.0, a reszta GEM na CC BY 4.0,
- zapisuje tylko potrzebne pola do public/data/zrodla-gem.geojson (jeden punkt = jedna faza/blok).
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

WYNIK = 'public/data/zrodla-gem.geojson'
ARKUSZ = 'Power facilities'
M = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

# Kolumna w pliku GEM → nazwa pola w naszym wyciągu
POLA = {
    'Type': 'typ',
    'Technology': 'technologia',
    'Plant / Project name': 'nazwa',
    'Unit / Phase name': 'faza',
    'Capacity (MW)': 'moc_mw',
    'Status': 'status',
    'Start year': 'rok_uruchomienia',
    'Location accuracy': 'dokladnosc_lokalizacji',
    'GEM location ID': 'gem_location_id',
    'GEM unit/phase ID': 'gem_unit_id',
    'GEM.Wiki URL': 'gem_wiki',
}
TZ = re.compile(r'\bTZ:')


def numer_kolumny(ref):
    n = 0
    for znak in re.match(r'[A-Z]+', ref).group():
        n = n * 26 + ord(znak) - 64
    return n - 1


def wiersze_arkusza(sciezka, nazwa_arkusza):
    z = zipfile.ZipFile(sciezka)
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    cele = {r.get('Id'): r.get('Target') for r in rels}
    cel = next(cele[s.get(R + 'id')] for s in wb.find(M + 'sheets') if s.get('name') == nazwa_arkusza)
    wspolne = []
    for _, e in ET.iterparse(z.open('xl/sharedStrings.xml')):
        if e.tag == M + 'si':
            wspolne.append(''.join(t.text or '' for t in e.iter(M + 't')))
            e.clear()
    for _, e in ET.iterparse(z.open('xl/' + cel.lstrip('/').removeprefix('xl/'))):
        if e.tag != M + 'row':
            continue
        w = {}
        for c in e.findall(M + 'c'):
            v = c.find(M + 'v')
            if c.get('t') == 's' and v is not None:
                w[numer_kolumny(c.get('r'))] = wspolne[int(v.text)]
            elif c.get('t') == 'inlineStr':
                w[numer_kolumny(c.get('r'))] = ''.join(t.text or '' for t in c.iter(M + 't'))
            elif v is not None:
                w[numer_kolumny(c.get('r'))] = v.text
        e.clear()
        yield w


def liczba(tekst):
    try:
        return float(tekst)
    except (TypeError, ValueError):
        return None


def main():
    if len(sys.argv) != 2:
        sys.exit('Podaj ścieżkę do pliku GEM: python3 scripts/wyciag-gem.py "/ścieżka/plik.xlsx"')
    wiersze = wiersze_arkusza(sys.argv[1], ARKUSZ)
    pierwszy = next(wiersze)
    naglowek = [pierwszy.get(i) for i in range(max(pierwszy) + 1)]
    idx = {k: naglowek.index(k) for k in [*POLA, 'Country/area', 'Latitude', 'Longitude', 'Other IDs (unit/phase)']}

    polska = pominiete_pv = pominiete_tz = tz_poza_pv = bez_wspolrzednych = 0
    cechy = []
    for w in wiersze:
        if w.get(idx['Country/area']) != 'Poland':
            continue
        polska += 1
        jest_tz = bool(TZ.search(w.get(idx['Other IDs (unit/phase)']) or ''))
        jest_pv = w.get(idx['Type']) == 'utility-scale solar'
        if jest_tz:
            pominiete_tz += 1
            if not jest_pv:
                tz_poza_pv += 1
        if jest_pv:
            pominiete_pv += 1
        if jest_tz or jest_pv:
            continue
        lat, lon = liczba(w.get(idx['Latitude'])), liczba(w.get(idx['Longitude']))
        if lat is None or lon is None:
            bez_wspolrzednych += 1
            continue
        wl = {nowa: w.get(idx[stara]) for stara, nowa in POLA.items()}
        wl['moc_mw'] = liczba(wl['moc_mw'])
        if wl['faza'] in ('--', ''):
            wl['faza'] = None
        cechy.append({
            'type': 'Feature',
            'geometry': {'type': 'Point', 'coordinates': [round(lon, 5), round(lat, 5)]},
            'properties': wl,
        })

    geojson = {
        'type': 'FeatureCollection',
        'atrybucja': 'Global Energy Monitor, Global Integrated Power Tracker, September 2026 release',
        'licencja': 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); zmodyfikowane: wyciąg',
        'przetworzenie': 'tylko Polska; bez fotowoltaiki; bez wierszy z oznaczeniem TransitionZero (TZ:, CC BY-NC 4.0); tylko wybrane pola',
        'features': cechy,
    }
    with open(WYNIK, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, separators=(',', ':'))

    lad = [c['properties'] for c in cechy if c['properties']['typ'] == 'wind' and c['properties']['technologia'] == 'Onshore']
    dzialajace = [p for p in lad if p['status'] == 'operating']
    print(f'Wiersze dla Polski: {polska}')
    print(f'Pominięte: fotowoltaika {pominiete_pv}, z oznaczeniem TZ {pominiete_tz} (w tym poza fotowoltaiką: {tz_poza_pv}), bez współrzędnych {bez_wspolrzednych}')
    print(f'Zapisane do {WYNIK}: {len(cechy)} punktów')
    print(f'Wiatr lądowy: {len(lad)} wierszy, działające {len(dzialajace)}, suma mocy działających {sum(p["moc_mw"] or 0 for p in dzialajace):.1f} MW')


if __name__ == '__main__':
    main()
