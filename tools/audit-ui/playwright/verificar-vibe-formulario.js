// tools/audit-ui/playwright/verificar-vibe-formulario.js
// Verificacion t_a7d1f4aa: con vibe naranja (dnb) activo en desktop, el formulario
// de nueva entrada sigue el accentColor (naranja) — sin verdes ACID en bordes/texto.
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'report');
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
      if (f) {
        let body = leer(f);
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

  // Abrir el formulario de nueva entrada: boton "+ ENTRADA" en el header de la era activa
  const boton = page.locator('main button', { hasText: '+ ENTRADA' }).first();
  await boton.click({ timeout: 8000 });
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    // Colores usados por el formulario: naranja dnb (#ff6b35) vs verde ACID (#bfff00)
    const naranja = '#ff6b35';
    const verde = '#bfff00';
    const aHex = (c) => {
      if (!c) return null;
      c = c.trim().toLowerCase();
      const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        return '#' + [m[1], m[2], m[3]].map((v) => parseInt(v, 10).toString(16).padStart(2, '0')).join('');
      }
      return c.startsWith('#') ? c.slice(0, 7) : null;
    };
    const cuantos = (hex) => {
      const t = hex.toLowerCase();
      let n = 0;
      for (const el of document.querySelectorAll('main *')) {
        const st = getComputedStyle(el);
        const colores = [st.color, st.borderColor, st.backgroundColor, st.borderBottomColor, st.borderTopColor, st.borderLeftColor, st.borderRightColor];
        for (const c of colores) {
          const h = aHex(c);
          if (h === t) { n++; break; }
        }
      }
      return n;
    };
    const muestra = [...document.querySelectorAll('main input, main textarea, main select')].slice(0, 6).map((el) => {
      const st = getComputedStyle(el);
      return { tag: el.tagName, color: aHex(st.color), border: aHex(st.borderColor) };
    });
    const verdes = [];
    for (const el of document.querySelectorAll('main *')) {
      const st = getComputedStyle(el);
      const colores = [['color', st.color], ['border', st.borderColor], ['bg', st.backgroundColor]];
      for (const [k, c] of colores) {
        if (aHex(c) === verde) { verdes.push({ tag: el.tagName, k, cls: (el.className || '').toString().slice(0, 50), txt: (el.textContent || '').slice(0, 30).replace(/\s+/g, ' ') }); break; }
      }
    }
    return { naranja: cuantos(naranja), verde: cuantos(verde), formularioVisible: !!document.querySelector('main input, main textarea, main select'), muestra, verdes: verdes.slice(0, 25) };
  });

  await page.screenshot({ path: join(OUT, 'vibe-formulario-naranja.png'), fullPage: false });
  console.log(JSON.stringify(info, null, 2));
} finally {
  await browser.close();
}
