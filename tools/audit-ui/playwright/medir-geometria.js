// tools/audit-ui/playwright/medir-geometria.js
// Mide la geometría del marco desktop (ADR-029): alturas reales de topbar,
// rail, dock, footer, canvas y contenido útil en un viewport dado.
// Reutiliza la infraestructura del harness (fixtures locales + sesión ADR-028).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURE_MAP = new Map([
  ['/api/entries', 'entries.json'],
  ['/api/eras', 'eras.json'],
  ['/api/tracks', 'tracks.json'],
  ['/api/tags', 'tags.json'],
  ['/api/playlists', 'playlists.json'],
  ['/api/drops', 'drops.json'],
  ['/api/files', 'files.json'],
  ['/api/config', 'config.json'],
  ['/api/events', 'events.json'],
  ['/api/time_capsules', 'time_capsules.json'],
  ['/api/stats/recap', 'stats_recap.json'],
  ['/api/queue', 'queue.json'],
  ['/api/sync', 'sync.json'],
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

function interceptarRutas(page, baseUrl, fixturesDir) {
  const cache = new Map();
  const leerFixture = (nombre) => {
    if (!cache.has(nombre)) {
      cache.set(nombre, readFileSync(join(fixturesDir, nombre), 'utf8'));
    }
    return cache.get(nombre);
  };
  return page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      const fixture = fixturePara(url.pathname);
      if (fixture) {
        route.fulfill({ status: 200, contentType: 'application/json', body: leerFixture(fixture) });
      } else {
        route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'sin fixture ' + url.pathname }) });
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
    } catch { /* storage bloqueado: la app caerá a login */ }
  });
}

/**
 * Mide la geometría del marco desktop en el viewport dado.
 * @param {{ baseUrl: string, fixturesDir: string, width: number, height: number,
 *           pantalla?: 'vault'|'music'|'capsules' }} opciones
 * @returns {Promise<object>} medidas crudas del DOM
 */
export async function medirGeometria({ baseUrl, fixturesDir, width = 1440, height = 900, pantalla = 'vault' }) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const contexto = await browser.newContext({
      viewport: { width, height },
      serviceWorkers: 'block',
    });
    const page = await contexto.newPage();
    await sembrarSesion(page);
    await interceptarRutas(page, baseUrl, fixturesDir);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Navegar a la pestaña pedida (los fixtures arrancan en vault por defecto).
    const tabLabel = { vault: 'VAULT', music: 'MUSIC LAB', capsules: 'CAPSULES' }[pantalla];
    if (tabLabel) {
      try {
        const railBtn = page.locator('.desktop-rail__destination', { hasText: tabLabel }).first();
        await railBtn.click({ timeout: 8000 });
        await page.waitForTimeout(1200);
      } catch { /* la pestaña por defecto ya es la pedida o el botón no existe */ }
    }
    await page.waitForTimeout(1200);

    const medidas = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          top: Math.round(r.top), bottom: Math.round(r.bottom),
          height: Math.round(r.height), width: Math.round(r.width),
          paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
        };
      };
      const canvas = document.querySelector('main.desktop-canvas');
      const contenidoUtil = canvas
        ? { clientHeight: canvas.clientHeight, scrollHeight: canvas.scrollHeight, scrollTop: canvas.scrollTop }
        : null;
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        topbar: box('.desktop-topbar'),
        rail: box('.desktop-rail'),
        dock: box('.desktop-dock'),
        footer: box('.desktop-footer'),
        canvas: box('main.desktop-canvas'),
        contenidoUtil,
        // Primer bloque de contenido dentro del canvas (widgets/header según pantalla)
        primerBloque: (() => {
          const canvasEl = document.querySelector('main.desktop-canvas');
          if (!canvasEl) return null;
          const hijos = [...canvasEl.children].filter((el) => el.children.length > 0);
          if (!hijos.length) return null;
          const r = hijos[0].getBoundingClientRect();
          return { top: Math.round(r.top), height: Math.round(r.height), tag: hijos[0].tagName, cls: (hijos[0].className || '').toString().slice(0, 80) };
        })(),
      };
    });

    const captura = join('report', 'screenshots', `geometria-${pantalla}-${width}x${height}.png`);
    await page.screenshot({ path: captura, fullPage: false });
    medidas.captura = captura;
    return medidas;
  } finally {
    await browser.close();
  }
}
