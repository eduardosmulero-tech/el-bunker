// tools/audit-ui/playwright/capturar-scroll-desktop.js
// Capturas desktop 1440x900 de vault/music/capsules (t_006ace5f, AC 4).
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'report', 'capturas-scroll');
mkdirSync(OUT, { recursive: true });

const FIXTURE_MAP = new Map([
  ['/api/entries', 'entries.json'], ['/api/eras', 'eras.json'], ['/api/tracks', 'tracks.json'],
  ['/api/tags', 'tags.json'], ['/api/playlists', 'playlists.json'], ['/api/drops', 'drops.json'],
  ['/api/files', 'files.json'], ['/api/config', 'config.json'], ['/api/events', 'events.json'],
  ['/api/time_capsules', 'time_capsules.json'], ['/api/stats/recap', 'stats_recap.json'],
  ['/api/queue', 'queue.json'], ['/api/sync', 'sync.json'],
]);
function fixturePara(pathname) {
  if (FIXTURE_MAP.has(pathname)) return FIXTURE_MAP.get(pathname);
  const partes = pathname.split('/');
  if (partes.length >= 3) {
    const prefijo = `/${partes[1]}/${partes[2]}`;
    if (FIXTURE_MAP.has(prefijo)) return FIXTURE_MAP.get(prefijo);
  }
  return null;
}
function interceptarRutas(page, baseUrl) {
  const cache = new Map();
  const leer = (n) => { if (!cache.has(n)) cache.set(n, readFileSync(join(FIXTURES, n), 'utf8')); return cache.get(n); };
  return page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      const f = fixturePara(url.pathname);
      if (f) route.fulfill({ status: 200, contentType: 'application/json', body: leer(f) });
      else route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.origin === baseUrl) { route.continue(); return; }
    route.fulfill({ status: 204, body: '' });
  });
}
function sembrarSesion(page) {
  return page.addInitScript(() => {
    try {
      const user = { id: 'admin', name: 'Admin', email: 'thebunker.admin@gmail.com', role: 'admin', avatar: null };
      sessionStorage.setItem('bunker_jwt', 'audit-fixture-jwt');
      sessionStorage.setItem('bunker_session_kind', 'access_key');
      sessionStorage.setItem('bunker_user', JSON.stringify(user));
    } catch { /* storage bloqueado */ }
  });
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const baseUrl = 'http://localhost:4317';
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await contexto.newPage();
  await sembrarSesion(page);
  await interceptarRutas(page, baseUrl);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  const pestañas = [
    ['vault', 'VAULT', 'vault-sin-scroll-x.png'],
    ['music', 'MUSIC LAB', 'music-sin-scroll-x.png'],
    ['capsules', 'CAPSULES', 'capsules-sin-scroll-x.png'],
  ];
  for (const [, etiqueta, archivo] of pestañas) {
    try {
      const btn = page.locator('.desktop-rail__destination', { hasText: etiqueta }).first();
      await btn.click({ timeout: 6000 });
      await page.waitForTimeout(1400);
    } catch { /* ya en la pestaña */ }
    const path = join(OUT, archivo);
    await page.screenshot({ path, fullPage: false });
    console.log(`captura: ${path}`);
  }
} finally {
  await browser.close();
}
