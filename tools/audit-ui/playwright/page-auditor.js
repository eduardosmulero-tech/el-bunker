// tools/audit-ui/playwright/page-auditor.js
// Auditor completo de la app: Edge instalado (channel msedge), sin descargar
// navegador; intercepta TODA llamada a /api/ y la responde con ficheros de
// tools/audit-ui/fixtures/; aborta cualquier otra petición externa (nunca red,
// nunca login, nunca D1). Sesión ADR-028 sembrada en sessionStorage para que
// la app arranque autenticada sin tocar Google ni la clave real.
import { chromium } from 'playwright';
import {
  readFileSync,
  readdirSync,
  mkdirSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createCollectors } from './measure-page.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const AUDIT_UI_ROOT = resolve(AQUI, '..');
export const REPO_ROOT = resolve(AQUI, '..', '..');

export const SCREENS = [
  { id: 'vault', tab: 'VAULT' },
  { id: 'music', tab: 'MUSIC LAB' },
  { id: 'capsules', tab: 'CAPSULES' },
];

export const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

// ─── meta.fixtures: sha1 del directorio de fixtures ─────────
export function hashFixtures(fixturesDir) {
  const ficheros = readdirSync(fixturesDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const hash = createHash('sha1');
  for (const fichero of ficheros) {
    hash.update(fichero);
    hash.update(readFileSync(join(fixturesDir, fichero)));
  }
  return hash.digest('hex').slice(0, 12);
}

function commitActual() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

// ─── Mapa ruta → fixture ─────────────────────────────────────
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

/** Resuelve el fichero fixture para un pathname; fallback por prefijo de 2 segmentos. */
function fixturePara(pathname) {
  if (FIXTURE_MAP.has(pathname)) return FIXTURE_MAP.get(pathname);
  const partes = pathname.split('/');
  if (partes.length >= 3) {
    const prefijo = `/${partes[1]}/${partes[2]}`;
    if (FIXTURE_MAP.has(prefijo)) return FIXTURE_MAP.get(prefijo);
  }
  return null;
}

/** Intercepta /api/ → fixtures; mismo origen → continue; externo → abort. */
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
    const esApi = url.pathname.startsWith('/api/');
    if (esApi) {
      const fixture = fixturePara(url.pathname);
      if (fixture) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: leerFixture(fixture),
        });
      } else {
        // Sin fixture: 404 local — el hallazgo http_error delata la pantalla
        // que llama a un endpoint no cubierto (mejor que fugarse a la red).
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'fixture no encontrado para ' + url.pathname }),
        });
      }
      return;
    }
    if (url.origin === baseUrl) {
      route.continue();
      return;
    }
    // Recurso externo (R2, Google, fuentes…): 204 vacío, NUNCA abort —
    // un abort provoca "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT"
    // en la consola y ensucia los hallazgos error_consola con ruido del
    // propio harness. El 204 es una respuesta válida: sin errores de consola.
    route.fulfill({ status: 204, body: '' });
  });
}

/** Sesión ADR-028 ficticia: la app arranca autenticada sin login ni clave real. */
function sembrarSesion(page) {
  return page.addInitScript(() => {
    try {
      const user = {
        id: 'admin',
        name: 'Admin',
        email: 'thebunker.admin@gmail.com',
        role: 'admin',
        avatar: null,
      };
      sessionStorage.setItem('bunker_jwt', 'audit-fixture-jwt');
      sessionStorage.setItem('bunker_session_kind', 'access_key');
      sessionStorage.setItem('bunker_user', JSON.stringify(user));
    } catch { /* storage bloqueado: la app caerá a login y la pantalla se medirá igual */ }
  });
}

/**
 * @param {{ baseUrl: string, fixturesDir: string, reportDir: string,
 *           screens?: Array<{id: string, tab: string}>,
 *           viewports?: Array<{width: number, height: number}> }} opciones
 * @returns {Promise<object>} informe con la forma del anexo del veredicto
 */
export async function runAudit({
  baseUrl,
  fixturesDir,
  reportDir,
  screens = SCREENS,
  viewports = VIEWPORTS,
}) {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const versionNavegador = await browser.version();
  const contexto = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'block',
  });

  const dirCapturas = join(reportDir, 'screenshots');
  mkdirSync(dirCapturas, { recursive: true });

  const hallazgos = [];

  try {
    for (const pantalla of screens) {
      for (const viewport of viewports) {
        const page = await contexto.newPage();
        await page.setViewportSize(viewport);
        const colectores = createCollectors();
        colectores.attach(page);
        await sembrarSesion(page);
        await interceptarRutas(page, baseUrl, fixturesDir);

        await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // La navegación visible depende del breakpoint: BottomNav (<nav>) en
        // móvil y DesktopRail (<aside>) desde 1280px. El nombre accesible puede
        // repetirse (el Icon aporta label + el texto), por eso se localiza por
        // texto dentro del contenedor visible y no por getByRole exacto.
        const contenedorNav = viewport.width >= 1280 ? 'aside.desktop-rail' : 'nav';
        const pestaña = page.locator(`${contenedorNav} button:has-text("${pantalla.tab}")`).first();
        await pestaña.waitFor({ state: 'visible', timeout: 20000 });
        // Si no es la pantalla inicial, navegar a ella.
        if (pantalla.id !== 'vault') {
          await pestaña.click();
        }
        // Asentar render (animaciones framer-motion + datos de fixtures).
        await page.waitForTimeout(1200);

        const vista = `${pantalla.id}@${viewport.width}x${viewport.height}`;
        const hallazgosVista = await colectores.measure(page, {
          screenKey: pantalla.id,
          viewport,
        });

        const nombreCaptura = `${pantalla.id}-${viewport.width}x${viewport.height}.png`;
        await page.screenshot({
          path: join(dirCapturas, nombreCaptura),
          fullPage: false,
        });
        for (const hallazgo of hallazgosVista) {
          hallazgo.captura = `screenshots/${nombreCaptura}`;
        }
        hallazgos.push(...hallazgosVista);
        console.log(`[audit-ui] ${vista}: ${hallazgosVista.length} hallazgos`);

        colectores.detach(page);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return {
    meta: {
      fecha: new Date().toISOString(),
      commit: commitActual(),
      navegador: `msedge/${versionNavegador}`,
      fixtures: hashFixtures(fixturesDir),
    },
    // La cobertura (estático ∩ ejercitado) es la tarjeta AUD-3: aquí queda el
    // contenedor vacío para no romper la forma del anexo.
    cobertura: {
      estatico: 0,
      ejercitado: 0,
      no_ejercitado: [],
    },
    hallazgos,
  };
}
