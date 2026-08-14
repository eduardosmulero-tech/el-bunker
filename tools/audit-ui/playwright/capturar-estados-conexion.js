// tools/audit-ui/playwright/capturar-estados-conexion.js
// Capturas para t_2729d060 (iteracion 1 FAIL): render real desktop del estado de
// conexion. (a) DB ONLINE sin partner; (b) partner escuchando (presence activa).
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'report', 'capturas-conexion');
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

/** Con partnerMode=true, /api/sync?action=presence devuelve partner activo. */
function interceptarRutas(page, baseUrl, partnerMode) {
  const cache = new Map();
  const leer = (n) => { if (!cache.has(n)) cache.set(n, readFileSync(join(FIXTURES, n), 'utf8')); return cache.get(n); };
  return page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      const f = fixturePara(url.pathname);
      if (f) {
        if (f === 'sync.json' && url.pathname === '/api/sync' && url.searchParams.get('action') === 'presence' && partnerMode) {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
            active: true,
            active_track: { id: 'trk-003', title: 'Midnight City', vibe: 'gaming' },
            pending_session_id: null,
          }) });
          return;
        }
        route.fulfill({ status: 200, contentType: 'application/json', body: leer(f) });
      } else {
        route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      }
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
  for (const [modo, archivo, descripcion] of [
    ['sin-partner', 'a-topbar-offline-footer-online.png', 'DB ONLINE sin partner: topbar OFFLINE + footer STATUS · ONLINE'],
    ['con-partner', 'b-topbar-partner-footer-online.png', 'Partner escuchando: topbar David · track + footer STATUS · ONLINE'],
  ]) {
    const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const page = await contexto.newPage();
    await sembrarSesion(page);
    await interceptarRutas(page, baseUrl, modo === 'con-partner');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500); // dar tiempo a que la app marque ONLINE y al poll de presencia

    const estado = await page.evaluate(() => {
      const topbar = document.querySelector('.desktop-topbar__presence');
      const footer = document.querySelector('.desktop-footer');
      return {
        topbar: topbar ? topbar.textContent.replace(/\s+/g, ' ').trim() : null,
        footer: footer ? footer.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : null,
      };
    });

    const ruta = join(OUT, archivo);
    await page.screenshot({ path: ruta, fullPage: false });
    console.log(`[${modo}] ${descripcion}`);
    console.log(`  topbar: "${estado.topbar}" | footer: "${estado.footer}"`);
    console.log(`  captura: ${ruta}`);
    await contexto.close();
  }
} finally {
  await browser.close();
}
