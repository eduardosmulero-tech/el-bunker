// tools/audit-ui/playwright/verificar-visualizador-fullscreen.js
// Comprueba la auditoria humana de Edu (tarjeta t_703e99c7) sobre el visualizador,
// con audio REAL sonando y viewport de escritorio (1440x900, marco ADR-029 activo):
//   AFIRMACION 1 — el mini/dock reproductor no dibuja barras sobre la portada.
//   AFIRMACION 2 — el modo pantalla completa no funciona.
// Se mide por artefacto, no por impresion: rect del canvas, pixeles encendidos y
// quien ocupa realmente el centro del viewport (elementFromPoint).
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

// Cuenta pixeles no-negros del canvas: si el visualizador dibuja, hay pixeles encendidos.
const SONDA_CANVAS = () => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { existe: false };
  const rect = canvas.getBoundingClientRect();
  const ctx = canvas.getContext('2d');
  let encendidos = 0;
  try {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 12 || data[i + 1] > 12 || data[i + 2] > 12) encendidos++;
    }
  } catch { return { existe: true, error: 'getImageData bloqueado' }; }
  const total = canvas.width * canvas.height;
  return {
    existe: true,
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    clases: canvas.className,
    zIndex: getComputedStyle(canvas).zIndex,
    position: getComputedStyle(canvas).position,
    pixelesEncendidos: encendidos,
    porcentajeEncendido: total ? +(100 * encendidos / total).toFixed(2) : 0,
  };
};

// Quien ocupa de verdad el centro del viewport y las 4 esquinas del area util.
const SONDA_CENTRO = () => {
  const puntos = { centro: [720, 450], arribaIzq: [300, 120], abajoDer: [1200, 800] };
  const salida = {};
  for (const [nombre, [x, y]] of Object.entries(puntos)) {
    const el = document.elementFromPoint(x, y);
    salida[nombre] = el ? `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : ''}` : 'null';
  }
  salida.fullscreenElement = document.fullscreenElement ? document.fullscreenElement.tagName : null;
  return salida;
};

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const resultado = { afirmacion1_barras_en_dock: null, afirmacion2_pantalla_completa: null };
try {
  // Debe apuntar al preview de TU worktree, no al de otro: medir el arbol equivocado da PASS falsos.
  const baseUrl = process.env.AUDIT_BASE_URL ?? `http://localhost:${process.env.AUDIT_PORT ?? 4317}`;
  const contexto = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await contexto.newPage();
  const erroresConsola = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.text().includes('AudioVisualizer')) erroresConsola.push(m.text()); });

  await page.addInitScript(() => {
    sessionStorage.setItem('bunker_jwt', 'audit-fixture-jwt');
    sessionStorage.setItem('bunker_session_kind', 'access_key');
    sessionStorage.setItem('bunker_user', JSON.stringify({ id: 'admin', name: 'Admin', email: 'thebunker.admin@gmail.com', role: 'admin' }));
  });

  const wavBody = readFileSync(join(FIXTURES, 'tone-60s.wav'));
  const cache = new Map();
  const leer = (n) => { if (!cache.has(n)) cache.set(n, readFileSync(join(FIXTURES, n), 'utf8')); return cache.get(n); };

  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/music/') && url.pathname.endsWith('.mp3')) {
      route.fulfill({ status: 200, contentType: 'audio/wav', body: wavBody });
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/sync') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active: false }) });
        return;
      }
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

  // Reproducir de verdad: sin audio sonando el canvas es estatico por diseno.
  try { await page.locator('button', { hasText: 'MUSIC' }).first().click({ timeout: 6000 }); } catch { /* ya en music */ }
  await page.waitForTimeout(1200);
  try { await page.getByText('The Longest Wave').first().click({ timeout: 5000 }); } catch { /* ya sonando */ }
  await page.waitForTimeout(3000);

  const sonando = await page.evaluate(() => {
    const a = document.querySelector('audio');
    return a ? { currentTime: a.currentTime, paused: a.paused } : null;
  });

  // ── AFIRMACION 1: barras sobre la portada en el reproductor del marco ──
  const dock = await page.evaluate(SONDA_CANVAS);
  await page.screenshot({ path: 'report/screenshots/viz-dock-reproduciendo.png' });
  resultado.afirmacion1_barras_en_dock = { sonando, dock };

  // ── AFIRMACION 2: pantalla completa ──
  const antes = await page.evaluate(SONDA_CENTRO);

  // 2a — ¿el tap real llega al canvas, o lo intercepta la carátula?
  let tapNatural = 'llega al canvas';
  try {
    await page.locator('canvas').first().click({ timeout: 4000 });
  } catch (error) {
    const intercepta = /intercepts pointer events/.test(String(error));
    tapNatural = intercepta ? `INTERCEPTADO: ${String(error).match(/<[^>]+>[^<]*<\/[a-z]+>/)?.[0] ?? 'capa superpuesta'}` : `fallo: ${error.name}`;
  }
  resultado.tapNatural = tapNatural;

  // 2b — forzando el tap (saltándose el interceptor): ¿hay un SEGUNDO fallo detrás?
  await page.locator('canvas').first().dispatchEvent('click');
  await page.waitForTimeout(1500);
  const despues = await page.evaluate(SONDA_CENTRO);
  const canvasTrasTap = await page.evaluate(SONDA_CANVAS);
  await page.screenshot({ path: 'report/screenshots/viz-tras-tap-fullscreen.png' });

  resultado.afirmacion2_pantalla_completa = {
    centroAntes: antes,
    centroDespues: despues,
    canvasTrasTap,
    cubreViewport: canvasTrasTap.rect ? (canvasTrasTap.rect.w >= 1400 && canvasTrasTap.rect.h >= 850) : false,
    centroLoOcupaElCanvas: despues.centro.startsWith('canvas'),
  };
  resultado.erroresConsola = erroresConsola.slice(0, 10);

  console.log('RESULTADO', JSON.stringify(resultado, null, 2));
} finally {
  await browser.close();
}
