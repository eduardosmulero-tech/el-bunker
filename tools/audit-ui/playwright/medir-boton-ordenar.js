// tools/audit-ui/playwright/medir-boton-ordenar.js
// Diagnóstico t_97a89abc: botón de ordenar cortado a la izquierda en MusicLab desktop.
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

  // Navegar a MUSIC LAB
  try {
    await page.locator('button', { hasText: 'MUSIC' }).first().click({ timeout: 6000 });
  } catch { /* ya en music */ }
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || '') === 'Cambiar ordenación');
    if (!btn) return { error: 'no sort button' };
    const r = btn.getBoundingClientRect();
    const parent = btn.parentElement;
    const pr = parent ? parent.getBoundingClientRect() : null;
    const inner = btn.querySelector('span');
    const ir = inner ? inner.getBoundingClientRect() : null;
    // Buscar cualquier scroll horizontal del contenedor y del canvas
    const cs = (el) => { if (!el) return null; const s = getComputedStyle(el); return { overflowX: s.overflowX, scrollW: el.scrollWidth, clientW: el.clientWidth, scrollLeft: el.scrollLeft }; };
    let anc = parent;
    const chain = [];
    for (let i = 0; i < 8 && anc; i++) { chain.push(cs(anc)); anc = anc.parentElement; }
    return {
      boton: { x: r.x, y: r.y, w: r.width, h: r.height, scrollWidth: btn.scrollWidth, clientWidth: btn.clientWidth },
      contenedor: pr ? { x: pr.x, y: pr.y, w: pr.width, h: pr.height } : null,
      spanInterno: ir ? { x: ir.x, y: ir.y, w: ir.width, h: ir.height } : null,
      overflowChain: chain,
      viewport: window.innerWidth,
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'tools/audit-ui/report/boton-ordenar-full.png' });
  // Zoom al botón de ordenar
  const btnBox = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '') === 'Cambiar ordenación');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (btnBox) {
    await page.screenshot({ path: 'tools/audit-ui/report/boton-ordenar-zoom.png',
      clip: { x: btnBox.x - 30, y: btnBox.y - 10, width: btnBox.w + 60, height: btnBox.h + 20 } });
  }
} finally {
  await browser.close();
}
