// tools/audit-ui/playwright/medir-topbar-iconos.js — mide la posición del icono
// (svg) DENTRO de cada botón de acción de la topbar desktop.
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
  await page.waitForTimeout(2000);

  const datos = await page.evaluate(() => {
    const topbar = document.querySelector('.desktop-topbar');
    const tb = topbar.getBoundingClientRect();
    const tbCenter = (tb.top + tb.bottom) / 2;
    const acciones = document.querySelector('.desktop-topbar__actions');
    const out = { topbarCenter: tbCenter };
    if (!acciones) return out;
    out.items = [...acciones.querySelectorAll('button, span')].map((el) => {
      const r = el.getBoundingClientRect();
      const elCenter = (r.top + r.bottom) / 2;
      const icono = el.querySelector('svg');
      let icon = null;
      if (icono) {
        const ir = icono.getBoundingClientRect();
        icon = { top: ir.top, bottom: ir.bottom, h: ir.height, center: (ir.top + ir.bottom) / 2, offset: ((ir.top + ir.bottom) / 2) - tbCenter };
      }
      return {
        tag: el.tagName,
        label: el.getAttribute('aria-label') || el.textContent.slice(0, 25),
        center: elCenter,
        offsetBtn: elCenter - tbCenter,
        icono: icon,
      };
    });
    return out;
  });

  console.log(JSON.stringify(datos, null, 2));
} finally {
  await browser.close();
}
