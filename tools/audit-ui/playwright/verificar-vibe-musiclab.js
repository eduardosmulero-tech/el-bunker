// tools/audit-ui/playwright/verificar-vibe-musiclab.js
// Verificación t_8cbd0ca2: con vibe naranja (dnb) activo, los bordes de tracks,
// la búsqueda, el botón "cargar más" y las marcas del footer (MUSIC LAB v1.0 /
// WEB AUDIO API) deben usar el accentColor del vibe, no el verde ACID.
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
        // Inyectar tag 'dnb' (naranja) en TODOS los tracks
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

  // Navegar a MUSIC LAB (rail izquierdo desktop)
  try {
    const musicBtn = page.locator('nav button, aside button, .desktop-rail button, button', { hasText: 'MUSIC' }).first();
    await musicBtn.click({ timeout: 6000 });
  } catch { /* ya en music */ }
  await page.waitForTimeout(1500);
  const tab = await page.evaluate(() => {
    const t = [...document.querySelectorAll('main, section, div')].find((d) => /MUSIC LAB/i.test(d.textContent || '') && /MUSIC LAB v1\.0|WEB AUDIO API/i.test(d.textContent || ''));
    return t ? { tieneFooter: /WEB AUDIO API/.test(t.textContent), tieneBuscar: /BUSCAR TRACK/.test(t.textContent) } : { noEncontrado: true };
  });
  console.log('TAB_ACTIVA', JSON.stringify(tab));

  // Capturar vista de lista con vibe naranja
  await page.screenshot({ path: 'tools/audit-ui/report/musiclab-vibe-naranja.png' });

  // Datos DOM: color de las marcas del footer y de la búsqueda
  const info = await page.evaluate(() => {
    const css = (el) => (el ? getComputedStyle(el).color : null);
    const footer = [...document.querySelectorAll('footer')].pop();
    const marcas = footer ? [...footer.querySelectorAll('span')].slice(0, 3).map((s) => css(s)) : [];
    const buscar = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').includes('BUSCAR'));
    const botonCargar = [...document.querySelectorAll('button')].find((b) => /cargar más|más tracks|50/i.test(b.textContent || ''));
    return {
      marcasFooter: marcas,
      colorBuscar: css(buscar),
      colorBotonCargar: botonCargar ? getComputedStyle(botonCargar).color : null,
      tracks: [...document.querySelectorAll('div')].filter((d) => /dnb|vibe/i.test(d.className || '')).length,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Zoom al footer para la marca WEB AUDIO API
  const footer = await page.evaluate(() => {
    const f = [...document.querySelectorAll('footer')].pop();
    if (!f) return null;
    const r = f.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (footer && footer.h > 0) {
    await page.screenshot({ path: 'tools/audit-ui/report/musiclab-vibe-naranja-footer.png',
      clip: { x: 0, y: footer.y, width: Math.min(1440, footer.w), height: Math.min(120, footer.h + 20) } });
  }
} finally {
  await browser.close();
}
