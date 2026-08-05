// tools/audit-ui/run.mjs — Punto de entrada del pase de auditoría (AUD-1).
// 1) build de la app con VITE_API_URL apuntando al preview local (todo /api/
//    cae en la interceptación; nunca red externa).
// 2) vite preview + Playwright con el Edge instalado (channel msedge).
// 3) Medición DOM en 1440x900 y 390x844 por pantalla, capturas como evidencia
//    y un único JSON con la forma del anexo del veredicto.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from './playwright/page-auditor.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(AQUI, '..', '..');
const PORT = 4317;
const DIST = join(AQUI, '.dist-audit');
const FIXTURES = join(AQUI, 'fixtures');
const REPORT = join(AQUI, 'report');
const BASE_URL = `http://localhost:${PORT}`;
const VITE_BIN = join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

function ejecutar(comando, argumentos, opciones = {}) {
  const resultado = spawnSync(comando, argumentos, {
    stdio: 'inherit',
    ...opciones,
  });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) {
    throw new Error(`${comando} ${argumentos.join(' ')} → código ${resultado.status}`);
  }
}

async function esperarServidor(url, timeoutMs = 30000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    try {
      const respuesta = await fetch(url);
      if (respuesta.ok) return;
    } catch { /* aún no arranca */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`vite preview no respondió en ${url}`);
}

async function main() {
  const t0 = Date.now();

  console.log('[audit-ui] build (VITE_API_URL local, sin red)…');
  ejecutar(process.execPath, [VITE_BIN, 'build', '--outDir', DIST, '--emptyOutDir'], {
    cwd: REPO_ROOT,
    env: { ...process.env, VITE_API_URL: BASE_URL },
  });

  console.log(`[audit-ui] vite preview en ${BASE_URL}…`);
  const preview = spawn(process.execPath, [
    VITE_BIN,
    'preview',
    '--port', String(PORT),
    '--strictPort',
    '--outDir', DIST,
  ], { cwd: REPO_ROOT, stdio: 'ignore' });

  try {
    await esperarServidor(BASE_URL);
    const informe = await runAudit({
      baseUrl: BASE_URL,
      fixturesDir: FIXTURES,
      reportDir: REPORT,
    });

    const salida = join(REPORT, 'audit.json');
    mkdirSync(REPORT, { recursive: true });
    writeFileSync(salida, JSON.stringify(informe, null, 2));

    const porTipo = {};
    for (const hallazgo of informe.hallazgos) {
      porTipo[hallazgo.tipo] = (porTipo[hallazgo.tipo] ?? 0) + 1;
    }
    const segundos = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[audit-ui] OK en ${segundos}s — ${informe.hallazgos.length} hallazgos ${JSON.stringify(porTipo)}`);
    console.log(`[audit-ui] informe: ${salida}`);
    console.log(`[audit-ui] capturas: ${join(REPORT, 'screenshots')}`);
  } finally {
    preview.kill();
    // El build es un artefacto regenerable: fuera del árbol para que
    // `npx eslint tools/audit-ui/` no se tropiece con los bundles minificados.
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('[audit-ui] fallo:', error.message);
  process.exit(1);
});
