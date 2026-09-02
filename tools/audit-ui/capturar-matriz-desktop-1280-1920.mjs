// tools/audit-ui/capturar-matriz-desktop-1280-1920.mjs
// Runner: build + preview temporal + matriz desktop 1280/1920.
import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const DIST = join(HERE, ".dist-desktop-1280-1920");
const PORT = Number(process.env.AUDIT_PORT ?? 4317);
const BASE_URL = `http://localhost:${PORT}`;
const VITE = join(ROOT, "node_modules", "vite", "bin", "vite.js");
const CHILD = join(HERE, "playwright", "capturar-matriz-desktop-1280-1920.mjs");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} → ${result.status}`);
}
async function waitForServer(url) {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try { if ((await fetch(url)).ok) return; } catch { /* arrancando */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Preview no respondió en ${url}`);
}
run(process.execPath, [VITE, "build", "--outDir", DIST, "--emptyOutDir"], {
  cwd: ROOT,
  env: { ...process.env, VITE_API_URL: BASE_URL },
});
const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], {
  cwd: ROOT,
  stdio: "ignore",
});
try {
  await waitForServer(BASE_URL);
  run(process.execPath, [CHILD], { cwd: ROOT, env: { ...process.env, AUDIT_BASE_URL: BASE_URL } });
} finally {
  preview.kill();
  rmSync(DIST, { recursive: true, force: true });
}
