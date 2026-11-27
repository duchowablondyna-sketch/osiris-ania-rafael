// Sprawdzian PR, poziom 2: zbudowana strona (dist/) w Chrome bez okna.
// Na 6 stronach (PL i EN) nie może być błędów naszego JavaScriptu; na mapie musi się pojawić sama mapa i przyciski okien.
// Działa bez internetu: przeglądarka dostaje tylko nasz serwer (vite preview na 127.0.0.1) – NASA, PSE i wszystko
// inne jest odcinane od razu. Pliki z danymi PSE (powstają przy budowaniu na Cloudflare) dostają „brak” (404),
// także lokalnie, gdzie zostały po wcześniejszym budowaniu – test sprawdza, że strona przeżywa awarię PSE (wariant (a),
// decyzja Ani 25.11.2026).
// Czerwono: nieprzechwycony błąd JS albo odrzucona obietnica, każdy console.error z naszego kodu (np. „Brak tekstu …”).
// Nie czerwono: nieudane wczytanie zasobu (odcięty kafelek, brakujący JSON).
// Uruchamianie: najpierw vite build, potem node scripts/testy-przegladarka.mjs (albo całość: npm run sprawdz).
// Przeglądarka: Google Chrome zainstalowany w systemie (na GitHubie jest na ubuntu-24.04) – playwright-core nic nie pobiera.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { connect } from 'node:net';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const KATALOG = resolve(import.meta.dirname, '..');
const PORT = 4173;
const BAZA = `http://127.0.0.1:${PORT}`;
const STRONY = ['/', '/mapa/', '/en/', '/en/map/', '/o-nas/', '/en/about/'];
const MAPY = new Set(['/mapa/', '/en/map/']);
// Mapa: płótno MapLibre i nagłówki okien (na telefonie to przyciski przy lewej krawędzi).
const NA_MAPIE = ['canvas.maplibregl-canvas', '#okienko-pse > summary', '.legenda > summary', '#karta > summary'];
// Prawa autorskie (25.11.2026) muszą być widoczne: „O nas” – na dole; inne strony – w wierszu stopki (komputer)
// albo na górze rozwiniętej sekcji „Źródła i licencje” (telefon).
const O_NAS = new Set(['/o-nas/', '/en/about/']);
const prawaAutorskie = (widok, sciezka) =>
  O_NAS.has(sciezka) ? '.o-nas__prawa' : widok.nazwa === 'telefon' ? '.stopka__prawa--zrodla' : '.stopka__prawa--wiersz';
const BEZ_PSE = new Set(
  ['wiatr', 'rce', 'doba', 'karta', 'podsumowanie', 'moce-pse-sprawdzono'].map((n) => `/data/${n}.json`),
);
const WIDOKI = [
  { nazwa: 'komputer', viewport: { width: 1280, height: 800 } },
  { nazwa: 'telefon', viewport: { width: 390, height: 844 } },
];

if (!existsSync(join(KATALOG, 'dist', 'index.html'))) {
  console.error('Brak dist/ – najpierw zbuduj stronę: npx vite build');
  process.exit(1);
}

// Port zajęty (np. stary podgląd z innej sesji – 25.11.2026 na 4174 wisiał serwer z 23.11 z próbną wersją strony):
// nasz serwer by nie wystartował, a test sprawdziłby cudzą stronę. Dlatego najpierw: czy ktoś już słucha na porcie.
function portZajety() {
  return new Promise((gotowe) => {
    const gniazdo = connect({ host: '127.0.0.1', port: PORT });
    gniazdo.setTimeout(1000);
    gniazdo.once('connect', () => (gniazdo.destroy(), gotowe(true)));
    gniazdo.once('timeout', () => (gniazdo.destroy(), gotowe(true)));
    gniazdo.once('error', () => gotowe(false));
  });
}

async function uruchomSerwer() {
  if (await portZajety()) {
    throw new Error(
      `port ${PORT} jest zajęty przez inny program – test nie sprawdzi cudzej strony.\n` +
        `  Sprawdź, co to jest: lsof -nP -iTCP:${PORT} -sTCP:LISTEN (i zatrzymaj, jeśli to stary podgląd).`,
    );
  }
  const vite = join(KATALOG, 'node_modules', 'vite', 'bin', 'vite.js');
  const serwer = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: KATALOG,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  for (let i = 0; i < 100; i++) {
    if (serwer.exitCode !== null) throw new Error(`vite preview zakończył się (kod ${serwer.exitCode})`);
    let odp;
    try {
      odp = await fetch(BAZA + '/');
    } catch {
      // serwer jeszcze nie słucha
    }
    if (odp?.ok) {
      // Drugi bezpiecznik: serwer musi podawać dokładnie naszą zbudowaną stronę tytułową.
      if ((await odp.text()) === readFileSync(join(KATALOG, 'dist', 'index.html'), 'utf-8')) return serwer;
      serwer.kill();
      throw new Error(`${BAZA}/ podaje inną stronę niż dist/index.html – to nie jest nasz podgląd.`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  serwer.kill();
  throw new Error('vite preview nie odpowiada po 15 s');
}

// E1 „Planuję inwestycję” (26.11.2026): zakładka „Gdzie”, pole „Ile MW potrzebujesz?” filtruje listę stacji.
// Dane mocy i planu są w repo (public/data), więc działa także „bez PSE”. Sprawdza po kodach stacji – niezależnie od języka.
async function sprawdzWyszukiwarke(strona, widok) {
  const bledy = [];
  const widoczne = () =>
    strona.evaluate(() => [...document.querySelectorAll('#moce-lista-1 li, #moce-lista-2 li')].filter((l) => !l.hidden).map((l) => l.dataset.kod));
  await strona.locator('#karta > summary').click();
  await strona.locator('#zakladka-gdzie').click();
  const pole = strona.locator('#szukaj-mw-pole');
  await pole.waitFor({ state: 'attached', timeout: 15_000 });
  await strona.locator('#szukaj-mw').waitFor({ state: 'visible', timeout: 15_000 });
  const wszystkie = (await widoczne()).length;
  if (wszystkie !== 25) bledy.push(`wyszukiwarka: na starcie ${wszystkie} stacji zamiast 25`);
  await pole.fill('600');
  const k600 = (await widoczne()).join(',');
  if (k600 !== 'MKA,EPK,DZO') bledy.push(`wyszukiwarka: 600 MW → ${k600} (oczekiwano MKA,EPK,DZO)`);
  // Narzędzia „Gdzie” (27.11.2026): licznik „N z 25 stacji” – w podsumowaniu na operatorów (pozycja PSE).
  const pozycja = (op) => strona.locator(`#gdzie-podsumowanie li[data-operator="${op}"]`).textContent();
  if (!(await pozycja('pse')).includes('3')) bledy.push('wyszukiwarka: podsumowanie PSE przy 600 MW bez „3”');
  if (!(await strona.locator('#gdzie-naglowek').textContent()).includes('2031')) bledy.push('podsumowanie: w nagłówku brak roku 2031');
  await pole.fill('1500');
  if ((await widoczne()).length) bledy.push('wyszukiwarka: 1500 MW → są stacje (nic nie sumujemy, max 1000 MW)');
  if (!(await strona.locator('#szukaj-mw-brak').isVisible())) bledy.push('wyszukiwarka: 1500 MW → nie widać zdania „brak wyniku”');
  if (!(await strona.locator('#szukaj-mw-do-osd').isVisible())) bledy.push('wyszukiwarka: 1500 MW → nie widać odesłania do OSD');
  await pole.fill('abc');
  if ((await widoczne()).length !== 25) bledy.push('wyszukiwarka: „abc” → lista niepełna');
  if (!(await strona.locator('#szukaj-mw-status').textContent()).trim()) bledy.push('wyszukiwarka: „abc” → brak komunikatu');
  await strona.locator('#szukaj-mw-wszystkie').click();
  if ((await pole.inputValue()) !== '' || (await widoczne()).length !== 25) bledy.push('wyszukiwarka: „Pokaż wszystkie” nie czyści filtra');
  // F2.1: grupy PGE (public/data/osd-pge.json) – ten sam filtr MW (według 2031) i osobne szukanie stacji po nazwie.
  const grupy = () => strona.evaluate(() => [...document.querySelectorAll('#osd-pge-lista li')].filter((l) => !l.hidden).map((l) => l.dataset.nr).join(','));
  await strona.locator('#osd-pge').waitFor({ state: 'attached', timeout: 15_000 });
  await strona.waitForFunction(() => document.querySelectorAll('#osd-pge-lista li').length > 0, null, { timeout: 15_000 });
  if ((await grupy()).split(',').length !== 47) bledy.push('PGE: na starcie nie 47 grup');
  await pole.fill('150');
  if ((await grupy()) !== '31,33,35') bledy.push(`PGE: 150 MW → ${await grupy()} (oczekiwano 31,33,35)`);
  await pole.fill('300');
  if ((await grupy()) !== '' || !(await strona.locator('#osd-pge-brak').isVisible())) bledy.push('PGE: 300 MW → są grupy albo nie widać zdania „brak wyniku”');
  await pole.fill('');
  const szukajPge = strona.locator('#gdzie-nazwa'); // wspólne pole nazwy narzędzi „Gdzie”
  await szukajPge.fill('belchatow');
  if ((await grupy()) !== '18,19') bledy.push(`PGE: „belchatow” → ${await grupy()} (oczekiwano 18,19)`);
  if (widok.nazwa === 'telefon') {
    const h = await szukajPge.evaluate((e) => e.getBoundingClientRect().height);
    if (h < 44) bledy.push(`narzędzia (telefon): pole nazwy ma ${h} px wysokości (min. 44)`);
    const s = await strona.locator('#osd-pge-lista li:not([hidden]) summary').first().evaluate((e) => e.getBoundingClientRect().height);
    if (s < 44) bledy.push(`PGE (telefon): „stacje w grupie” ma ${s} px wysokości (min. 44)`);
  }
  await strona.locator('#gdzie-nazwa-wyczysc').click();
  if ((await grupy()).split(',').length !== 47) bledy.push('PGE: „Wyczyść” nie pokazuje wszystkich grup');
  // F2.2: grupy Energi (public/data/osd-energa.json) – ten sam filtr MW (według 2031); szukanie stacji w polu PGE.
  const grupyEnergi = () => strona.evaluate(() => [...document.querySelectorAll('#osd-energa-lista li')].filter((l) => !l.hidden).map((l) => l.dataset.nr).join(','));
  await strona.waitForFunction(() => document.querySelectorAll('#osd-energa-lista li').length > 0, null, { timeout: 15_000 });
  if ((await grupyEnergi()).split(',').length !== 48) bledy.push('Energa: na starcie nie 48 grup');
  await pole.fill('230');
  if ((await grupyEnergi()) !== '1,10') bledy.push(`Energa: 230 MW → ${await grupyEnergi()} (oczekiwano 1,10)`);
  await pole.fill('300');
  if ((await grupyEnergi()) !== '' || !(await strona.locator('#osd-energa-brak').isVisible())) bledy.push('Energa: 300 MW → są grupy albo nie widać zdania „brak wyniku”');
  await pole.fill('');
  await szukajPge.fill('ostrow');
  if ((await grupyEnergi()) !== '6,13,50') bledy.push(`Energa: „ostrow” w polu PGE → ${await grupyEnergi()} (oczekiwano 6,13,50)`);
  // Sprawdzamy to, co jest takie samo po polsku i po angielsku: nazwy grup, kody stacji, odnośnik albo jego brak.
  const odnosnikow = (op) => strona.locator(`#gdzie-podsumowanie li[data-operator="${op}"] a`).count();
  if (!(await pozycja('energa')).includes('Słupsk Poznańska, Gdańsk Błonia, Ostrów')) bledy.push(`podsumowanie: „ostrow” → Energa: ${await pozycja('energa')}`);
  // Podsumowanie na operatorów (decyzje Ani 27.11.2026): operator bez wyniku – „– brak”; nic u nikogo – trzy razy „brak”.
  await szukajPge.fill('belchatow');
  if (!(await pozycja('pge')).includes('Bełchatów, Piotrków') || (await odnosnikow('energa')) !== 0) bledy.push(`podsumowanie: „belchatow” → ${await pozycja('pge')} | ${await pozycja('energa')}`);
  await szukajPge.fill('kutno');
  if (!(await pozycja('pse')).includes('Kutn') || (await pozycja('pse')).includes('WTN') || (await odnosnikow('pse')) !== 1) bledy.push(`podsumowanie: „kutno” → PSE: ${await pozycja('pse')} (uzupełnienie SOURCE: Kutno)`);
  await szukajPge.fill('gdansk'); // DSC „w rejonie Trójmiasta” – rozwinięcie nazwy (uzupełnienie SOURCE)
  if (!(await pozycja('pse')).includes('Tr') || (await odnosnikow('pse')) !== 1) bledy.push(`podsumowanie: „gdansk” → PSE: ${await pozycja('pse')}`);
  await szukajPge.fill('xyzxyz');
  if ((await strona.locator('#gdzie-podsumowanie a').count()) !== 0) bledy.push('podsumowanie: „xyzxyz” → są odnośniki');
  if (!(await strona.locator('.gdzie__nie-sumujemy').isVisible())) bledy.push('podsumowanie: nie widać zdania o niesumowaniu mocy');
  if (widok.nazwa === 'telefon') {
    await szukajPge.fill('plock');
    const h = await strona.locator('#gdzie-podsumowanie a').first().evaluate((e) => e.getBoundingClientRect().height);
    if (h < 44) bledy.push(`podsumowanie (telefon): pozycja ma ${h} px wysokości (min. 44)`);
  }
  // „↓” przewija do sekcji operatora.
  await szukajPge.fill('mielno');
  await strona.locator('#gdzie-podsumowanie a[href="#osd-energa"]').click();
  await strona.waitForTimeout(600);
  const widacEnerge = await strona.locator('#osd-energa-tytul').evaluate((e) => {
    const r = e.getBoundingClientRect();
    return r.top >= 0 && r.top < window.innerHeight;
  });
  if (!widacEnerge) bledy.push('podsumowanie: „↓” Energi nie przewija do sekcji Energi');
  await szukajPge.fill('ostrow'); // dalej (telefon) mierzymy widoczny wiersz Energi
  if (widok.nazwa === 'telefon') {
    const s = await strona.locator('#osd-energa-lista li:not([hidden]) summary').first().evaluate((e) => e.getBoundingClientRect().height);
    if (s < 44) bledy.push(`Energa (telefon): „stacje w grupie” ma ${s} px wysokości (min. 44)`);
    // „?” przy grupie: niewidoczne pole dotyku min. 44 × 44 px (zasada z CLAUDE.md).
    const p = await strona.locator('#osd-energa-lista li:not([hidden]) .karta__moc-pytajnik').first().evaluate((e) => {
      const r = getComputedStyle(e, '::before');
      return { w: parseFloat(r.width) || 0, h: parseFloat(r.height) || 0 };
    });
    if (p.w < 44 || p.h < 44) bledy.push(`Energa (telefon): pole dotyku „?” ${p.w} × ${p.h} px (min. 44 × 44)`);
  }
  await strona.locator('#gdzie-nazwa-wyczysc').click();
  if ((await grupyEnergi()).split(',').length !== 48) bledy.push('Energa: „Wyczyść” nie pokazuje wszystkich grup');
  if (widok.nazwa === 'telefon') {
    const m = await pole.evaluate((e) => ({ h: e.getBoundingClientRect().height, f: parseFloat(getComputedStyle(e).fontSize) }));
    if (m.h < 44) bledy.push(`wyszukiwarka (telefon): pole ma ${m.h} px wysokości (min. 44)`);
    if (m.f < 16) bledy.push(`wyszukiwarka (telefon): czcionka pola ${m.f} px (min. 16 – inaczej iPhone przybliża)`);
    const szer = await strona.evaluate(() => document.documentElement.scrollWidth);
    if (szer > widok.viewport.width) bledy.push(`wyszukiwarka (telefon): przewijanie w bok (${szer} px)`);
  }
  return bledy;
}

async function sprawdzStrone(przegladarka, widok, sciezka) {
  const bledy = [];
  const odciete = new Set();
  const kontekst = await przegladarka.newContext({ viewport: widok.viewport });
  await kontekst.route('**/*', (trasa) => {
    const adres = new URL(trasa.request().url());
    if (adres.origin !== BAZA) {
      odciete.add(adres.host);
      return trasa.abort('blockedbyclient');
    }
    if (BEZ_PSE.has(adres.pathname)) {
      return trasa.fulfill({ status: 404, contentType: 'text/plain', body: 'brak (test bez PSE)' });
    }
    return trasa.continue();
  });
  const strona = await kontekst.newPage();
  strona.on('pageerror', (blad) => bledy.push(`błąd JS: ${blad.stack || blad.message}`));
  strona.on('console', (wiad) => {
    if (wiad.type() !== 'error') return;
    const tekst = wiad.text();
    if (tekst.startsWith('Failed to load resource')) return;
    if ([...odciete].some((host) => tekst.includes(host))) return;
    const gdzie = wiad.location()?.url ? ` (${wiad.location().url}:${wiad.location().lineNumber})` : '';
    bledy.push(`console.error: ${tekst}${gdzie}`);
  });

  try {
    await strona.goto(BAZA + sciezka, { waitUntil: 'load', timeout: 30_000 });
    if (MAPY.has(sciezka)) {
      for (const wybor of NA_MAPIE) {
        try {
          await strona.locator(wybor).first().waitFor({ state: 'visible', timeout: 15_000 });
        } catch {
          bledy.push(`nie widać: ${wybor}`);
        }
      }
    }
    // Chwila na to, co skrypty robią po wczytaniu (pobieranie danych, odpowiedzi 404).
    await strona.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await strona.waitForTimeout(500);
    const prawa = prawaAutorskie(widok, sciezka);
    if (prawa === '.stopka__prawa--zrodla') {
      await strona.evaluate(() => {
        const zrodla = document.getElementById('zrodla');
        if (zrodla) zrodla.open = true;
      });
    }
    if (!(await strona.locator(prawa).first().isVisible())) bledy.push(`nie widać praw autorskich: ${prawa}`);
    if (MAPY.has(sciezka)) {
      if (prawa === '.stopka__prawa--zrodla') await strona.evaluate(() => (document.getElementById('zrodla').open = false));
      bledy.push(...(await sprawdzWyszukiwarke(strona, widok)));
    }
  } catch (blad) {
    bledy.push(`nie wczytała się: ${blad.message.split('\n')[0]}`);
  } finally {
    await kontekst.close();
  }
  return bledy;
}

let serwer;
try {
  serwer = await uruchomSerwer();
} catch (blad) {
  console.error(`✗ Serwer podglądu: ${blad.message}`);
  process.exit(1);
}
let przegladarka;
let czerwone = 0;
try {
  przegladarka = await chromium.launch({
    channel: 'chrome',
    headless: true,
    // WebGL dla MapLibre na serwerze bez karty graficznej (programowy SwiftShader).
    args: ['--enable-unsafe-swiftshader'],
  });
  console.log(`Chrome ${przegladarka.version()} bez okna, ${BAZA}, bez internetu i bez danych PSE.`);
  for (const widok of WIDOKI) {
    for (const sciezka of STRONY) {
      const bledy = await sprawdzStrone(przegladarka, widok, sciezka);
      const znak = bledy.length ? '✗' : '✓';
      console.log(`${znak} ${widok.nazwa.padEnd(8)} ${sciezka}${MAPY.has(sciezka) && !bledy.length ? '  (mapa, 3 przyciski okien i wyszukiwarka MW)' : ''}`);
      for (const b of bledy) console.log(`    ${b.replace(/\n/g, '\n    ')}`);
      if (bledy.length) czerwone++;
    }
  }
} finally {
  await przegladarka?.close();
  serwer.kill();
}

if (czerwone) {
  console.error(`\nPrzeglądarka: ${czerwone} z ${STRONY.length * WIDOKI.length} sprawdzeń z błędem.`);
  process.exit(1);
}
console.log(`\nPrzeglądarka: ${STRONY.length * WIDOKI.length} sprawdzeń bez błędu.`);
