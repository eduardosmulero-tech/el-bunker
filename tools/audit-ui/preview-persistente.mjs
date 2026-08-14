// tools/audit-ui/preview-persistente.mjs — build + vite preview que PERMANECE vivo.
// Uso: node tools/audit-ui/preview-persistente.mjs (Ctrl+C para parar)
import { spawn, spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(AQUI, '..', '..');
// Puerto configurable: en carriles paralelos dos worktrees no pueden compartir 4317 (--strictPort).
// Cada carril exporta AUDIT_PORT antes de arrancar. Sin variable, el de siempre.
const PORT = Number(process.env.AUDIT_PORT ?? 4317);
const DIST = join(AQUI, '.dist-audit');
const BASE_URL = `http://localhost:${PORT}`;
const VITE_BIN = join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

console.log('[preview] build (VITE_API_URL local, sin red)…');
const build = spawnSync(process.execPath, [VITE_BIN, 'build', '--outDir', DIST, '--emptyOutDir'], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  env: { ...process.env, VITE_API_URL: BASE_URL },
});
if (build.status !== 0) process.exit(build.status ?? 1);

console.log(`[preview] vite preview en ${BASE_URL} (persistente; Ctrl+C para parar)`);
const preview = spawn(process.execPath, [VITE_BIN, 'preview', '--port', String(PORT), '--strictPort', '--outDir', DIST], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
});
preview.on('exit', (code) => { console.log(`[preview] terminado (código ${code})`); process.exit(code ?? 0); });
