// Nagłówki bezpieczeństwa (decyzja Ani 26.11.2026): sprawdzian pliku public/_headers (Cloudflare Pages).
// Lokalny „vite preview” nie czyta _headers – nagłówki na żywo sprawdzamy na podglądzie Cloudflare (curl -I).
// Uruchom: node --test scripts/testy-naglowki.mjs (także w npm run sprawdz).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PLIK = resolve(import.meta.dirname, '..', 'public/_headers');

// Plik _headers: wiersz bez wcięcia = ścieżka, wiersze z wcięciem = „Nazwa: wartość” dla tej ścieżki.
function reguly(tekst) {
  const wynik = new Map();
  let sciezka = null;
  for (const wiersz of tekst.split('\n')) {
    if (!wiersz.trim() || wiersz.trim().startsWith('#')) continue;
    if (!/^\s/.test(wiersz)) {
      sciezka = wiersz.trim();
      wynik.set(sciezka, new Map());
      continue;
    }
    const i = wiersz.indexOf(':');
    assert.ok(sciezka && i > 0, `zły wiersz: „${wiersz}”`);
    wynik.get(sciezka).set(wiersz.slice(0, i).trim().toLowerCase(), wiersz.slice(i + 1).trim());
  }
  return wynik;
}

test('public/_headers istnieje', () => {
  assert.ok(existsSync(PLIK));
});

test('/*: HSTS bez preload, X-Frame-Options DENY, Permissions-Policy, CSP włączone (od 27.11.2026)', () => {
  const r = reguly(readFileSync(PLIK, 'utf-8')).get('/*');
  assert.ok(r, 'brak reguły /*');
  assert.match(r.get('strict-transport-security'), /^max-age=31536000; includeSubDomains$/);
  assert.ok(!/preload/i.test(r.get('strict-transport-security')), 'HSTS bez preload');
  assert.equal(r.get('x-frame-options'), 'DENY');
  const pp = r.get('permissions-policy');
  for (const f of ['camera', 'microphone', 'geolocation', 'fullscreen']) assert.match(pp, new RegExp(`(^|, )${f}=\\(\\)`), `Permissions-Policy: ${f}`);
  // 27.11.2026: Report-Only → Content-Security-Policy (żywa strona: 0 naruszeń na 6 stronach, komputer i telefon).
  const csp = r.get('content-security-policy');
  assert.ok(csp, 'brak Content-Security-Policy');
  assert.ok(!r.has('content-security-policy-report-only'), 'została też wersja Report-Only');
  for (const d of ["default-src 'self'", "script-src 'self'", "frame-ancestors 'none'", "object-src 'none'"]) assert.ok(csp.includes(d), `CSP: ${d}`);
  assert.match(csp, /connect-src [^;]*https:\/\/gibs\.earthdata\.nasa\.gov/);
});

test('/kafelki/*: reguła długiego przechowywania została bez zmian', () => {
  const r = reguly(readFileSync(PLIK, 'utf-8')).get('/kafelki/*');
  assert.ok(r, 'brak reguły /kafelki/*');
  assert.equal(r.get('cache-control'), 'public, max-age=31536000, immutable');
});
