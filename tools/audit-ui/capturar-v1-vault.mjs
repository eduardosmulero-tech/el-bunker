// tools/audit-ui/capturar-v1-vault.mjs
// V-1 (regla dura #1 del frente): capturas de VAULT a 390x844 para comparar
// el working tree contra master. Sin tocar el árbol: para master se ejecuta
// este mismo script con AUDIT_ROOT apuntando a un worktree limpio.
// Regenerable: AUDIT_ROOT=<repo> AUDIT_OUT=<dir> node tools/audit-ui/capturar-v1-vault.mjs
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { instalarRutas, seedAutenticacion } from "./fixture-server.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.AUDIT_ROOT ? resolve(process.env.AUDIT_ROOT) : resolve(HERE, "..", "..");
const OUT = process.env.AUDIT_OUT ? resolve(process.env.AUDIT_OUT) : join(HERE, "report", "v1-vault");
// Fixtures SIEMPRE del repo principal: mismas entradas en ambas capturas.
const FIXTURES = join(HERE, "fixtures");
const DIST = join(OUT, ".dist-v1");
const PORT = Number(process.env.AUDIT_PORT ?? 4321);
const BASE_URL = `http://localhost:${PORT}`;
const VITE = join(
  existsSync(join(ROOT, "node_modules", "vite", "bin", "vite.js")) ? ROOT : resolve(HERE, "..", ".."),
  "node_modules", "vite", "bin", "vite.js"
);
const VIEWPORT = { width: 390, height: 844 };

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} → ${result.status}`);
}
async function waitForServer(url) {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try { if ((await fetch(url)).ok) return; } catch { /* arrancando */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview no respondió en ${url}`);
}

async function scrollCanvas(page, y) {
  await page.evaluate((top) => {
    const canvas = document.querySelector("main.desktop-canvas") || document.querySelector("main");
    if (canvas) canvas.scrollTop = top;
    window.scrollTo(0, top);
  }, y);
  await page.waitForTimeout(600);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  run(process.execPath, [VITE, "build", "--outDir", DIST, "--emptyOutDir"], { cwd: ROOT, env: { ...process.env, VITE_API_URL: BASE_URL } });
  const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], { cwd: ROOT, stdio: "ignore" });
  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: VIEWPORT, serviceWorkers: "block" });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e}`));
    await seedAutenticacion(page);
    await instalarRutas(page, { baseUrl: BASE_URL, fixturesDir: FIXTURES });
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(6000);

    const nav = page.locator(".mobile-bottom-nav button").filter({ hasText: "VAULT" }).first();
    await nav.waitFor({ state: "visible", timeout: 10000 });
    await nav.click();
    await page.waitForTimeout(1500);

    // animations:"disabled" congela pulsos infinitos (glows, dots) para que la
    // comparación pixel a pixel no mida animación sino geometría.
    await scrollCanvas(page, 0);
    await page.screenshot({ path: join(OUT, "vault_top.png"), animations: "disabled" });
    await scrollCanvas(page, 650);
    await page.screenshot({ path: join(OUT, "vault_scroll650.png"), animations: "disabled" });

    writeFileSync(join(OUT, "vault-capturas.json"), JSON.stringify({
      meta: { root: ROOT, generatedAt: new Date().toISOString(), viewport: VIEWPORT },
      consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
    }, null, 2));
    console.log(`[v1-vault] capturas en ${OUT}`);
    await browser.close();
  } finally {
    preview.kill();
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error("[v1-vault] fallo:", error); process.exit(1); });
