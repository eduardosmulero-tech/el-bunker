// tools/audit-ui/playwright/capturar-tab.js
// Captura una pestaña a un ancho dado, con las fixtures de audit-ui.
// Uso: node tools/audit-ui/playwright/capturar-tab.js <tab> <ancho> <alto> <nombre-salida>
//   ej: node tools/audit-ui/playwright/capturar-tab.js CAPSULES 1440 900 capsules-una-navegacion
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , tabArg = 'CAPSULES', anchoArg = '1440', altoArg = '900', nombre = 'captura'] = process.argv;
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

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  // Debe apuntar al preview de TU worktree, no al de otro: medir el arbol equivocado da PASS falsos.
  const baseUrl = process.env.AUDIT_BASE_URL ?? `http://localhost:${process.env.AUDIT_PORT ?? 4317}`;
  const contexto = await browser.newContext({
    viewport: { width: Number(anchoArg), height: Number(altoArg) },
    serviceWorkers: 'block',
  });
  const page = await contexto.newPage();
  await page.addInitScript(() => {
    sessionStorage.setItem('bunker_jwt', 'audit-fixture-jwt');
    sessionStorage.setItem('bunker_session_kind', 'access_key');
    sessionStorage.setItem('bunker_user', JSON.stringify({ id: 'admin', name: 'Admin', email: 'thebunker.admin@gmail.com', role: 'admin' }));
  });

  const cache = new Map();
  const leer = (n) => { if (!cache.has(n)) cache.set(n, readFileSync(join(FIXTURES, n), 'utf8')); return cache.get(n); };
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/sync') { route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active: false }) }); return; }
      const f = fixturePara(url.pathname);
      if (f) route.fulfill({ status: 200, contentType: 'application/json', body: leer(f) });
      else route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.origin === baseUrl) { route.continue(); return; }
    route.fulfill({ status: 204, body: '' });
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  try { await page.locator('button', { hasText: tabArg }).first().click({ timeout: 6000 }); } catch { /* ya estaba */ }
  await page.waitForTimeout(1500);

  // V-3 del diseño. Contar etiquetas NO basta: un destino puede aparecer una sola vez y aun así
  // ser inalcanzable si quien lo pinta es un <span> decorativo. Se separan las dos cosas.
  const navegaciones = await page.evaluate((tab) => {
    // Los destinos de segundo nivel dependen de la pestaña (ADR-029 §6 P2).
    // VAULT no tiene todavía: sus secciones llegan con ADR-033.
    const POR_PESTANA = {
      CAPSULES: ['TIMELINE', 'SMOKE', 'TIME CAPSULES', 'RECAP'],
      MUSIC: ['COLA', 'TRACKS', 'LISTS', 'DROPS'],
      VAULT: [],
    };
    const etiquetas = POR_PESTANA[tab.toUpperCase()] ?? [];
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
    };
    const casa = (el, texto) => (el.textContent || '').trim().toUpperCase() === texto;
    const clicables = [...document.querySelectorAll('button, a, [role="tab"], [role="button"]')].filter(visible);
    const decorativos = [...document.querySelectorAll('span, div')].filter(
      (el) => visible(el) && el.children.length === 0 && !el.closest('button, a, [role="tab"], [role="button"]'),
    );
    const porEtiqueta = {};
    for (const e of etiquetas) {
      porEtiqueta[e] = {
        alcanzable: clicables.filter((el) => casa(el, e)).length,
        decorativo: decorativos.filter((el) => casa(el, e)).length,
      };
    }
    const canvas = document.querySelector('main.desktop-canvas');
    return {
      segundoNivel: porEtiqueta,
      inalcanzables: etiquetas.filter((e) => porEtiqueta[e].alcanzable === 0),
      duplicados: etiquetas.filter((e) => porEtiqueta[e].alcanzable > 1),
      anchoLienzo: canvas ? Math.round(canvas.getBoundingClientRect().width) : null,
      scrollHorizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  }, tabArg);

  const ruta = join('report', 'screenshots', `${nombre}.png`);
  await page.screenshot({ path: ruta });
  console.log(JSON.stringify({ captura: ruta, ...navegaciones }, null, 2));
} finally {
  await browser.close();
}
