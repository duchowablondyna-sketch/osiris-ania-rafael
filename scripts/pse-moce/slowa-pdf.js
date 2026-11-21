// Wyciąga z PDF słowa wraz z położeniem na stronie – wbudowany w macOS PDFKit (JXA), bez instalowania narzędzi.
// Użycie: osascript -l JavaScript scripts/pse-moce/slowa-pdf.js <plik.pdf> <wynik.json>
// Wynik: { strony: [{ szer, wys, slowa: [{ t, x0, x1, y0, y1 }] }] } – y liczone od GÓRY strony, w punktach PDF.
// Skrypt tylko czyta tekst (bez uruchamiania czegokolwiek z PDF); całą logikę tabel ma parsuj.mjs.
ObjC.import('PDFKit');
ObjC.import('Foundation');

function run(argv) {
  const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0]));
  if (!doc || doc.isNil()) throw new Error('Nie udało się otworzyć PDF');
  const strony = [];
  for (let s = 0; s < doc.pageCount; s++) {
    const strona = doc.pageAtIndex(s);
    const ramka = strona.boundsForBox($.kPDFDisplayBoxMediaBox);
    const wys = ramka.size.height;
    const liczbaZnakow = strona.numberOfCharacters;
    const slowa = [];
    let biezace = null;
    let poprzedni = '';
    const zamknij = () => {
      if (biezace) slowa.push(biezace);
      biezace = null;
    };
    for (let i = 0; i < liczbaZnakow; i++) {
      // Znak i jego położenie z tego samego zaznaczenia – numeracja znaków PDFKit nie zawsze zgadza się
      // z numeracją w page.string (np. przy polskich literach), więc nie łączymy tych dwóch źródeł.
      const zazn = strona.selectionForRange($.NSMakeRange(i, 1));
      if (!zazn || zazn.isNil()) continue;
      const znak = ObjC.unwrap(zazn.string) || '';
      if (!znak || /^\s+$/.test(znak)) {
        zamknij();
        continue;
      }
      const r = zazn.boundsForPage(strona);
      const x0 = r.origin.x, x1 = r.origin.x + r.size.width;
      const y0 = wys - (r.origin.y + r.size.height), y1 = wys - r.origin.y;
      // Znak końca linii PDFKit zwraca jako powtórzenie ostatniej litery w tym samym miejscu – pomijamy.
      const klucz = `${znak}|${x0}|${x1}|${y1}`;
      if (klucz === poprzedni) continue;
      poprzedni = klucz;
      // Nowe słowo, gdy znak nie leży tuż za poprzednim w tej samej linii (PDF nie zawsze ma spacje między komórkami).
      if (biezace && (Math.abs(y1 - biezace.y1) > 2.5 || x0 - biezace.x1 > 1.5 || x0 < biezace.x1 - 1)) zamknij();
      if (!biezace) biezace = { t: '', x0, x1, y0, y1 };
      biezace.t += znak;
      biezace.x1 = Math.max(biezace.x1, x1);
      biezace.y0 = Math.min(biezace.y0, y0);
      biezace.y1 = Math.max(biezace.y1, y1);
    }
    zamknij();
    for (const w of slowa) for (const k of ['x0', 'x1', 'y0', 'y1']) w[k] = Math.round(w[k] * 10) / 10;
    strony.push({ szer: ramka.size.width, wys, slowa });
  }
  const wynik = $(JSON.stringify({ strony }));
  if (!wynik.writeToFileAtomicallyEncodingError(argv[1], true, $.NSUTF8StringEncoding, null)) throw new Error('Nie zapisano wyniku');
  return `stron: ${strony.length}, słów: ${strony.reduce((a, s) => a + s.slowa.length, 0)}`;
}
