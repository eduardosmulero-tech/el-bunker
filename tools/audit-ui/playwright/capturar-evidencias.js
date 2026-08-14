// tools/audit-ui/playwright/capturar-evidencias.js
// Capturas de evidencia para las REV pendientes (preventivo, mismo hueco que t_2729d060):
// 1. tarjeta SEGURO sin circulo y centrada (t_4a376547)
// 2. pantalla util: WALL con mas de 1/4 del viewport (t_b960a081)
// 3. rail desktop con atajo 1/2/3 como boton accionable (t_28e582bd)
// 4. topbar desktop con botones reload/logout centrados (t_548f0131)
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'report', 'capturas-rev');
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
  await page.waitForTimeout(3000);

  // 1. SEGURO sin circulo + centrado — primer viewport del vault
  const seguro = await page.evaluate(() => {
    const tb = document.body.textContent || '';
    const sinCirculo = !/◎\s*SEGURO|◌\s*SEGURO/.test(tb);
    const widget = [...document.querySelectorAll('main div')].find((el) => /SEGURO/.test(el.textContent || '') && el.textContent.length < 120);
    let rect = null;
    if (widget) { const r = widget.getBoundingClientRect(); rect = { top: Math.round(r.top), h: Math.round(r.height) }; }
    return { sinCirculo, widget: rect };
  });
  await page.screenshot({ path: join(OUT, '1-seguro-sin-circulo.png'), fullPage: false });
  console.log('1. SEGURO:', JSON.stringify(seguro));

  // 3. rail con atajo accionable
  const rail = await page.evaluate(() => {
    const hint = document.querySelector('.desktop-rail__hint');
    if (!hint) return { ok: false, razon: 'sin hint' };
    return { ok: hint.tagName === 'BUTTON', tag: hint.tagName, texto: hint.textContent.trim() };
  });
  await page.screenshot({ path: join(OUT, '3-rail-atajo-accionable.png'), fullPage: false });
  console.log('3. rail:', JSON.stringify(rail));

  // 2. pantalla util: scroll hasta el WALL y capturar (contenido util > 1/4)
  await page.evaluate(() => {
    const canvas = document.querySelector('main.desktop-canvas');
    if (canvas) canvas.scrollTop = 200;
  });
  await page.waitForTimeout(600);
  const wall = await page.evaluate(() => {
    const canvas = document.querySelector('main.desktop-canvas');
    return { scrollTop: canvas?.scrollTop, scrollHeight: canvas?.scrollHeight, clientHeight: canvas?.clientHeight };
  });
  await page.screenshot({ path: join(OUT, '2-pantalla-util-wall.png'), fullPage: false });
  console.log('2. pantalla util:', JSON.stringify(wall));

  // 4. topbar botones centrados
  await page.evaluate(() => { const c = document.querySelector('main.desktop-canvas'); if (c) c.scrollTop = 0; });
  await page.waitForTimeout(400);
  const topbar = await page.evaluate(() => {
    const tb = document.querySelector('.desktop-topbar');
    const btns = [...document.querySelectorAll('.desktop-topbar__actions button')];
    const r = (el) => { const x = el.getBoundingClientRect(); return (x.top + x.bottom) / 2; };
    return {
      tbCenter: tb ? r(tb) : null,
      btnCenters: btns.map((b) => ({ label: b.getAttribute('aria-label') || b.title, c: Math.round(r(b) * 10) / 10 })),
    };
  });
  await page.screenshot({ path: join(OUT, '4-topbar-botones-centrados.png'), fullPage: false });
  console.log('4. topbar:', JSON.stringify(topbar));
} finally {
  await browser.close();
}
