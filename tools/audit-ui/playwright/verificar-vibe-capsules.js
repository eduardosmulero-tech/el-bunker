// tools/audit-ui/playwright/verificar-vibe-capsules.js
// Verificación t_efe78432: con vibe naranja (dnb) activo, CAPSULES no debe
// mostrar verde ACID en contenedores — usa accentColor del vibe.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
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
      if (f) {
        let body = leer(f);
        if (f === 'tracks.json') {
          try {
            const data = JSON.parse(body);
            const lista = Array.isArray(data) ? data : data.tracks || data.data || [];
            for (const t of lista) { t.tag = 'dnb'; t.vibe = 'dnb'; }
            body = JSON.stringify(data);
          } catch { /* fixture intacto */ }
        }
        route.fulfill({ status: 200, contentType: 'application/json', body });
      } else {
        route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      }
      return;
    }
    if (url.origin === baseUrl) { route.continue(); return; }
    route.fulfill({ status: 204, body: '' });
  });
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const baseUrl = 'http://localhost:4317';
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await contexto.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem('bunker_jwt', 'audit-fixture-jwt');
    sessionStorage.setItem('bunker_session_kind', 'access_key');
    sessionStorage.setItem('bunker_user', JSON.stringify({ id: 'admin', name: 'Admin', email: 'thebunker.admin@gmail.com', role: 'admin' }));
  });
  await interceptarRutas(page, baseUrl);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Navegar a CAPSULES
  try {
    await page.locator('button', { hasText: 'CAPSULES' }).first().click({ timeout: 6000 });
  } catch { /* ya en capsules */ }
  await page.waitForTimeout(1500);

  const tab = await page.evaluate(() => {
    const textos = [...document.querySelectorAll('h2, h3, p')].map((t) => t.textContent.trim()).filter((t) => t.length > 3 && t.length < 60).slice(0, 12);
    return textos;
  });
  console.log('TAB_TEXTOS', JSON.stringify(tab, null, 1));

  await page.screenshot({ path: 'tools/audit-ui/report/capsules-vibe-naranja.png' });
} finally {
  await browser.close();
}
