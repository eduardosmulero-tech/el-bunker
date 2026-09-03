// tools/audit-ui/medir-gapless-movil.mjs
// t_warm-cache — Mide el salto gapless con calentamiento de cache HTTP
// (t_port-single-audio: fetch() sustituyó al segundo <audio>) en móvil 390×844.
//
// Protocolo:
//   1. App con fixtures locales (mismo harness que las capturas móviles).
//   2. Reproduce trk-001, añade trk-002 a la cola y salta (baseline).
//   3. Con trk-002 sonando, espera >1.5s → el warm-cache (fetch low priority
//      del siguiente track, 1s tras arrancar) deja trk-003 en cache HTTP.
//   4. Salta a trk-003 (warm) y compara: tiempo hasta metadata del nuevo track
//      y duración de red de la última petición /music/ (performance entries).
//
// Uso: node tools/audit-ui/medir-gapless-movil.mjs
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { instalarRutas, seedAutenticacion } from "./fixture-server.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const OUT = join(HERE, "report");
const DIST = join(HERE, ".dist-gapless");
const PORT = Number(process.env.AUDIT_PORT ?? 4331);
const BASE_URL = `http://localhost:${PORT}`;
const VITE = join(ROOT, "node_modules", "vite", "bin", "vite.js");
const VIEWPORT = { width: 390, height: 844 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildApp() {
  const res = spawnSync(process.execPath, [VITE, "build", "--outDir", DIST, "--emptyOutDir"], {
    cwd: ROOT,
    env: { ...process.env, VITE_API_URL: BASE_URL },
    stdio: "pipe",
    timeout: 240000,
  });
  if (res.status !== 0) throw new Error(`vite build falló:\n${res.stderr?.toString().slice(0, 2000)}`);
}

async function waitForServer(url) {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* aún no */ }
    await sleep(500);
  }
  throw new Error(`Servidor no respondió en ${url}`);
}

async function clickText(page, selector, text) {
  await page.locator(selector, { hasText: text }).first().click();
}

/**
 * Mide un salto: registra el src actual, dispara "Siguiente" y polled hasta que
 * el src cambia y hay duration. Devuelve readyMs (hasta metadata) y networkMs
 * (duración de la última petición /music/ en performance entries, si existe).
 */
async function measureSkip(page, label) {
  return page.evaluate(async (tag) => {
    const audio = document.querySelector("audio");
    if (!audio) return { salto: tag, error: "no <audio> en DOM" };
    const startSrc = audio.currentSrc || audio.src;
    const t0 = performance.now();
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label")?.toLowerCase().includes("siguiente"),
    );
    if (!btn) return { salto: tag, error: "botón Siguiente no encontrado" };
    btn.click();
    while (performance.now() - t0 < 15000) {
      const src = audio.currentSrc || audio.src;
      if (src && src !== startSrc && audio.duration > 0) {
        const entries = performance.getEntriesByType("resource").filter((e) => e.name.includes("/music/"));
        const last = entries[entries.length - 1];
        return {
          salto: tag,
          readyMs: Math.round(performance.now() - t0),
          redMs: last ? Math.round(last.duration) : null,
          transferSize: last ? last.transferSize : null,
          fromCache: last ? last.transferSize === 0 : null, // 0 = servido desde cache
        };
      }
      await new Promise((r) => setTimeout(r, 30));
    }
    return { salto: tag, error: "timeout 15s esperando metadata del nuevo track" };
  }, label);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  rmSync(DIST, { recursive: true, force: true });
  buildApp();
  let browser;
  const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], { cwd: ROOT, stdio: "ignore" });
  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
    const context = await browser.newContext({ viewport: VIEWPORT, serviceWorkers: "block" });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e}`));
    await seedAutenticacion(page);
    await instalarRutas(page, { baseUrl: BASE_URL, fixturesDir: join(HERE, "fixtures") });
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(6000);

    // ── Reproducir trk-001 ──
    await clickText(page, ".mobile-bottom-nav button", "MUSIC LAB");
    await page.waitForTimeout(1200);
    const playBtn = page.locator('button[aria-label="Reproducir"]').first();
    await playBtn.waitFor({ state: "visible", timeout: 8000 });
    await playBtn.click();
    await page.waitForTimeout(2500);

    // ── Salto 1 (baseline): trk-001 → trk-002 ──
    // Nota honesta: el warm-cache de trk-002 pudo armarse (~1s tras arrancar
    // trk-001), así que este baseline puede estar parcialmente caliente.
    const baseline = await measureSkip(page, "baseline: trk-001→trk-002");
    await page.waitForTimeout(2000);

    // ── Salto 2 (warm): trk-002 → trk-003 con margen > 1s del warm-cache ──
    const warm = await measureSkip(page, "warm: trk-002→trk-003");

    const report = {
      fecha: new Date().toISOString(),
      viewport: VIEWPORT,
      protocolo: "baseline = skip con warm-cache posiblemente parcial; warm = skip tras >1.5s de margen (fetch del siguiente track completado). fromCache=true ⇔ transferSize=0.",
      resultados: [baseline, warm],
      consoleErrors,
    };
    writeFileSync(join(OUT, "gapless-warm-cache-movil.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser?.close?.();
    preview.kill();
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
