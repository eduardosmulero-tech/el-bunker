// tools/audit-ui/playwright/verificar-chip-vibe.js
// Verificación t_8fbbbac3: inyecta tag 'dnb' en trk-001 (fixture interceptado),
// carga el dock desktop y captura el chip de tag/vibe para verificar que
// label+icon se renderizan (antes: undefined por desktopVibeConf incompleto).
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
        // Inyectar tag 'dnb' en TODOS los tracks (el activo por defecto es trk-008)
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

  const info = await page.evaluate(() => {
    const dock = document.querySelector('.desktop-dock');
    if (!dock) return { error: 'no dock' };
    const chips = [...dock.querySelectorAll('span')].filter((s) => /DNB|GAMING|420/i.test(s.textContent || ''));
    return {
      chips: chips.map((c) => ({ text: c.textContent.trim().slice(0, 40), cls: (c.className || '').slice(0, 60) })),
      dockText: dock.textContent.slice(0, 200).replace(/\s+/g, ' '),
    };
  });

  await page.screenshot({ path: 'report/screenshots/chip-vibe-dock.png' });
  console.log(JSON.stringify(info, null, 2));
} finally {
  await browser.close();
}
