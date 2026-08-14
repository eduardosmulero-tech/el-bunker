// tools/audit-ui/playwright/medir-boton-drop.js
// Diagnóstico t_7d51c821: alineación del icono + "DROP IT" en el botón del modal.
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

  // Abrir el modal de drop desde el dock desktop
  try {
    await page.locator('button[aria-label="Lanzar drop"]').first().click({ timeout: 6000 });
  } catch (e) {
    console.log('no drop button', e.message);
  }
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => /DROP IT/i.test(b.textContent || ''));
    if (!btns.length) return { error: 'no DROP IT button' };
    const btn = btns[0];
    const r = btn.getBoundingClientRect();
    const icon = btn.querySelector('svg') || btn.querySelector('.icon');
    const ir = icon ? icon.getBoundingClientRect() : null;
    // centro del botón vs centro del icono
    const cs = getComputedStyle(btn);
    const textNode = [...btn.childNodes].find((n) => n.nodeType === 3 && /DROP IT/.test(n.textContent || ''));
    return {
      boton: { x: r.x, y: r.y, w: r.width, h: r.height, centerX: r.x + r.width / 2, centerY: r.y + r.height / 2 },
      icono: ir ? { x: ir.x, y: ir.y, w: ir.width, h: ir.height, centerX: ir.x + ir.width / 2, centerY: ir.y + ir.height / 2 } : null,
      textAlign: cs.textAlign, display: cs.display, alignItems: cs.alignItems, justifyContent: cs.justifyContent,
      textY: textNode ? null : null,
      textoPresente: !!textNode,
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'tools/audit-ui/report/drop-it-antes.png' });
} finally {
  await browser.close();
}
