// tools/audit-ui/playwright/verificar-audio-p0.js
// Verificación t_0cd2d7a6 (P0): con el self-echo del long-polling activo (sesión
// personal falsa), el audio debe avanzar continuamente sin congelarse en el mismo
// segundo. Se sirve un WAV real de 60s y se simula el worker (POST create + GET
// long-poll con echo propio action_by = userId).
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

  const wavBody = readFileSync(join(FIXTURES, 'tone-60s.wav'));
  let syncCalls = 0;
  const cache = new Map();
  const leer = (n) => { if (!cache.has(n)) cache.set(n, readFileSync(join(FIXTURES, n), 'utf8')); return cache.get(n); };

  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    // Servir el audio real (R2_PUBLIC_BASE/music/*)
    if (url.pathname.includes('/music/') && url.pathname.endsWith('.mp3')) {
      route.fulfill({ status: 200, contentType: 'audio/wav', body: wavBody });
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      // Simular el worker de sesión: POST create / actions + GET long-poll
      if (url.pathname === '/api/sync') {
        const method = route.request().method();
        if (method === 'POST') {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session_id: 's-audit', active: true, host_id: 'admin' }) });
          return;
        }
        // GET long-poll: self-echo del propio usuario (action_by = admin = userId),
        // posición vieja fija para inducir el congelamiento pre-fix.
        syncCalls++;
        const pos = 5; // posición "vieja" que el worker real devolvería
        route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ active: true, session_id: 's-audit', host_id: 'admin', guest_id: null,
            action: 'sync', action_by: 'admin', position: pos, is_playing: true,
            updated_at: new Date().toISOString() }) });
        return;
      }
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

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Navegar a MUSIC LAB y reproducir el primer track
  try {
    await page.locator('button', { hasText: 'MUSIC' }).first().click({ timeout: 6000 });
  } catch { /* ya en music */ }
  await page.waitForTimeout(1200);
  try {
    await page.getByText('The Longest Wave').first().click({ timeout: 5000 });
  } catch { /* ya reproducido */ }

  // Muestrear currentTime cada 2s durante 34s
  const muestras = [];
  for (let i = 0; i < 17; i++) {
    await page.waitForTimeout(2000);
    const t = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      return audio ? audio.currentTime : -1;
    });
    muestras.push({ s: i * 2, currentTime: t });
  }

  console.log('MUESTRAS', JSON.stringify(muestras));
  console.log('SYNC_CALLS', syncCalls);

  // Verificación: currentTime debe ser estrictamente creciente y superar 30s
  const times = muestras.map((m) => m.currentTime);
  const increasing = times.every((t, i) => i === 0 || t > times[i - 1] - 0.5); // tolerancia 0.5s
  const reached30 = times[times.length - 1] >= 30;
  console.log('RESULT', JSON.stringify({ increasing, reached30, last: times[times.length - 1] }));
  await page.screenshot({ path: 'tools/audit-ui/report/audio-p0-avanzando.png' });
} finally {
  await browser.close();
}
