// tools/audit-ui/playwright/detectar-scroll-x2.js — detalle del contenedor con
// scroll horizontal en MUSIC LAB desktop (t_006ace5f).
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
  await page.waitForTimeout(2500);

  const btn = page.locator('.desktop-rail__destination', { hasText: 'MUSIC LAB' }).first();
  await btn.click({ timeout: 6000 });
  await page.waitForTimeout(1500);

  const data = await page.evaluate(() => {
    const canvas = document.querySelector('main.desktop-canvas');
    const out = [];
    if (!canvas) return out;
    for (const el of canvas.querySelectorAll('div')) {
      if (el.scrollWidth > el.clientWidth + 2 && (getComputedStyle(el).overflowX === 'auto' || getComputedStyle(el).overflowX === 'scroll')) {
        const r = el.getBoundingClientRect();
        out.push({
          cls: (el.className || '').toString().slice(0, 80) || '(sin clase)',
          scrollW: el.scrollWidth, clientW: el.clientWidth,
          overflowX: getComputedStyle(el).overflowX,
          y: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width),
          texto: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          hijos: el.children.length,
        });
      }
    }
    return out;
  });
  console.log(JSON.stringify(data, null, 1));
} finally {
  await browser.close();
}
