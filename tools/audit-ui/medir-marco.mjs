// tools/audit-ui/medir-marco.mjs — Runner: build local + preview + medición
// de geometría del marco desktop (1440x900) por pestaña. Sin red, sin D1.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { medirGeometria } from './playwright/medir-geometria.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(AQUI, '..', '..');
const PORT = 4317;
const DIST = join(AQUI, '.dist-audit');
const FIXTURES = join(AQUI, 'fixtures');
const REPORT = join(AQUI, 'report');
const BASE_URL = `http://localhost:${PORT}`;
const VITE_BIN = join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

function ejecutar(comando, argumentos, opciones = {}) {
  const resultado = spawnSync(comando, argumentos, { stdio: 'inherit', ...opciones });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) throw new Error(`${comando} ${argumentos.join(' ')} → código ${resultado.status}`);
}

async function esperarServidor(url, timeoutMs = 30000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* aún no */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite preview no respondió en ${url}`);
}

async function main() {
  console.log('[medir-marco] build (VITE_API_URL local, sin red)…');
  ejecutar(process.execPath, [VITE_BIN, 'build', '--outDir', DIST, '--emptyOutDir'], { cwd: REPO_ROOT, env: { ...process.env, VITE_API_URL: BASE_URL } });

  console.log(`[medir-marco] vite preview en ${BASE_URL}…`);
  const preview = spawn(process.execPath, [VITE_BIN, 'preview', '--port', String(PORT), '--strictPort', '--outDir', DIST], { cwd: REPO_ROOT, stdio: 'ignore' });
  try {
    await esperarServidor(BASE_URL);
    const resultado = {};
    for (const pantalla of ['vault', 'music', 'capsules']) {
      const medidas = await medirGeometria({ baseUrl: BASE_URL, fixturesDir: FIXTURES, width: 1440, height: 900, pantalla });
      resultado[pantalla] = medidas;
      console.log(`\n── ${pantalla.toUpperCase()} @1440x900 ──`);
      console.log(JSON.stringify(medidas, null, 2));
    }
    mkdirSync(REPORT, { recursive: true });
    writeFileSync(join(REPORT, 'geometria-marco.json'), JSON.stringify(resultado, null, 2));
    console.log(`\n[medir-marco] informe: ${join(REPORT, 'geometria-marco.json')}`);
  } finally {
    preview.kill();
  }
}

main().catch((error) => { console.error('[medir-marco] fallo:', error.message); process.exit(1); });
