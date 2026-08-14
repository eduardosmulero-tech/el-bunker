// tools/audit-ui/playwright/detectar-scroll-x.js
// Detecta contenedores con scroll horizontal real (scrollWidth > clientWidth)
// en desktop 1440x900 por pestaña — t_006ace5f.
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
  await page.waitForTimeout(3000);

  const pestañas = ['vault', 'music', 'capsules'];
  const etiquetas = { vault: 'VAULT', music: 'MUSIC LAB', capsules: 'CAPSULES' };

  for (const p of pestañas) {
    try {
      const btn = page.locator('.desktop-rail__destination', { hasText: etiquetas[p] }).first();
      await btn.click({ timeout: 6000 });
      await page.waitForTimeout(1500);
    } catch { /* ya en la pestaña */ }

    const data = await page.evaluate(() => {
      const canvas = document.querySelector('main.desktop-canvas');
      const hallazgos = [];
      const revisar = (el) => {
        if (el.scrollWidth > el.clientWidth + 2) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || el.scrollWidth > el.clientWidth + 40) {
            hallazgos.push({
              tag: el.tagName,
              cls: (el.className || '').toString().slice(0, 70),
              scrollW: el.scrollWidth, clientW: el.clientWidth,
              overflowX: cs.overflowX,
              top: Math.round(r.top), h: Math.round(r.height),
            });
          }
        }
      };
      const todos = canvas ? [...canvas.querySelectorAll('*')] : [];
      for (const el of todos) revisar(el);
      // solo uniques por clase+scroll
      const unicos = [];
      const vistos = new Set();
      for (const h of hallazgos) {
        const key = `${h.cls}|${h.overflowX}`;
        if (!vistos.has(key)) { vistos.add(key); unicos.push(h); }
      }
      return unicos.slice(0, 12);
    });
    console.log(`\n── ${p.toUpperCase()} ──`);
    for (const h of data) {
      console.log(`  ${h.tag} ${h.cls} | scrollW=${h.scrollW} clientW=${h.clientW} ox=${h.overflowX} y=${h.top}h=${h.h}`);
    }
    if (!data.length) console.log('  (sin scroll horizontal)');
  }
} finally {
  await browser.close();
}
