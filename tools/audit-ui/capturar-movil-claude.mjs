// tools/audit-ui/capturar-movil-claude.mjs
// Capturas móviles (390x844) para la auditoría externa de Claude:
// reproduce un track real y captura las pantallas documentadas en
// HALLAZGOS_Y_CAPTURAS_CLAUDE_2026-08-29.md §3. Solo usa fixtures locales.
// Regenerable: node tools/audit-ui/capturar-movil-claude.mjs
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { instalarRutas, seedAutenticacion } from "./fixture-server.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const OUT = join(HERE, "report", "claude-audit");
const SHOTS = join(OUT);
const DIST = join(HERE, ".dist-claude-audit");
const PORT = Number(process.env.AUDIT_PORT ?? 4317);
const BASE_URL = `http://localhost:${PORT}`;
const VITE = join(ROOT, "node_modules", "vite", "bin", "vite.js");
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
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Preview no respondió en ${url}`);
}

async function clickText(page, selector, text, optional = false) {
  const locator = page.locator(selector).filter({ hasText: text }).first();
  try { await locator.waitFor({ state: "visible", timeout: 10000 }); await locator.click(); return true; } catch (error) { if (optional) return false; throw error; }
}

async function scrollCanvas(page, y) {
  await page.evaluate((top) => {
    const canvas = document.querySelector("main.desktop-canvas") || document.querySelector("main");
    if (canvas) canvas.scrollTop = top;
    window.scrollTo(0, top);
  }, y);
  await page.waitForTimeout(600);
}

async function capture(page, name, consoleErrors, httpErrors) {
  const file = join(SHOTS, name);
  await page.screenshot({ path: file });
  return { file: `report/claude-audit/${name}`, consoleErrors: [...consoleErrors], httpErrors: [...httpErrors] };
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  run(process.execPath, [VITE, "build", "--outDir", DIST, "--emptyOutDir"], { cwd: ROOT, env: { ...process.env, VITE_API_URL: BASE_URL } });
  const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], { cwd: ROOT, stdio: "ignore" });
  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
    const context = await browser.newContext({ viewport: VIEWPORT, serviceWorkers: "block" });
    const page = await context.newPage();
    const consoleErrors = [];
    const httpErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e}`));
    page.on("response", (r) => { if (r.status() >= 400) httpErrors.push({ status: r.status(), url: r.url() }); });
    await seedAutenticacion(page);
    await instalarRutas(page, { baseUrl: BASE_URL, fixturesDir: join(HERE, "fixtures") });
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    // La app carga datos del fixture a los ~4-7s.
    await page.waitForTimeout(6000);

    const results = [];

    // ── Reproducir un track de verdad ──
    await clickText(page, ".mobile-bottom-nav button", "MUSIC LAB");
    await page.waitForTimeout(1200);
    const playBtn = page.locator('button[aria-label="Reproducir"]').first();
    await playBtn.waitFor({ state: "visible", timeout: 8000 });
    await playBtn.click();
    await page.waitForTimeout(2500);
    results.push({ name: "3_musiclab_track_reproduciendo.png", ...(await capture(page, "3_musiclab_track_reproduciendo.png", consoleErrors, httpErrors)) });

    // ── LISTS sin scroll (el título no se solapa al entrar) ──
    await clickText(page, "main button", "LISTS");
    await page.waitForTimeout(800);
    results.push({ name: "4_musiclab_lists_sinscroll.png", ...(await capture(page, "4_musiclab_lists_sinscroll.png", consoleErrors, httpErrors)) });

    // ── COLA vacía (COLA [00], sin sección PRÓXIMOS) ──
    await clickText(page, "main button", "COLA");
    await page.waitForTimeout(800);
    results.push({ name: "5_musiclab_cola_vacia.png", ...(await capture(page, "5_musiclab_cola_vacia.png", consoleErrors, httpErrors)) });

    // ── VAULT → MEMORIA con el mini-player presente (track sonando) ──
    await clickText(page, ".mobile-bottom-nav button", "VAULT");
    await page.waitForTimeout(1200);
    await scrollCanvas(page, 0);
    results.push({ name: "1_vault_memoria_top_miniplayer.png", ...(await capture(page, "1_vault_memoria_top_miniplayer.png", consoleErrors, httpErrors)) });
    await scrollCanvas(page, 650);
    results.push({ name: "2_vault_memoria_scroll650.png", ...(await capture(page, "2_vault_memoria_scroll650.png", consoleErrors, httpErrors)) });

    // ── CAPSULES → TIMELINE: top (chips de era), shared session, fin de feed ──
    await clickText(page, ".mobile-bottom-nav button", "CAPSULES");
    await page.waitForTimeout(1200);
    await clickText(page, "main button", "TIMELINE");
    await page.waitForTimeout(1000);
    await scrollCanvas(page, 0);
    results.push({ name: "6_capsules_timeline_filtro_eras.png", ...(await capture(page, "6_capsules_timeline_filtro_eras.png", consoleErrors, httpErrors)) });
    // Fila SHARED SESSION STARTED (los fixtures la ponen reciente, arriba del feed)
    const sharedFound = await page.getByText("SHARED SESSION STARTED").first().isVisible().catch(() => false);
    if (sharedFound) {
      await page.getByText("SHARED SESSION STARTED").first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      results.push({ name: "8_capsules_timeline_shared_session.png", ...(await capture(page, "8_capsules_timeline_shared_session.png", consoleErrors, httpErrors)) });
    }
    // Fin del feed
    await scrollCanvas(page, 999999);
    results.push({ name: "7_capsules_timeline_final.png", ...(await capture(page, "7_capsules_timeline_final.png", consoleErrors, httpErrors)) });

    // ── SMOKE presets ──
    await scrollCanvas(page, 0);
    await clickText(page, "main button", "SMOKE");
    await page.waitForTimeout(1000);
    results.push({ name: "9_capsules_smoke_presets.png", ...(await capture(page, "9_capsules_smoke_presets.png", consoleErrors, httpErrors)) });

    // ── RECAP → SEMANAL, portada ──
    await clickText(page, "main button", "RECAP");
    await page.waitForTimeout(1500);
    results.push({ name: "10_capsules_recap_portada.png", ...(await capture(page, "10_capsules_recap_portada.png", consoleErrors, httpErrors)) });

    // Informe de consola
    const issues = { consoleErrors: [...new Set(consoleErrors)].slice(0, 20), httpErrors: httpErrors.slice(0, 20) };
    writeFileSync(join(OUT, "console-issues.json"), JSON.stringify(issues, null, 2));

    await browser.close();
    writeFileSync(join(OUT, "capturas.json"), JSON.stringify({ meta: { generatedAt: new Date().toISOString() }, results }, null, 2));
    console.log(JSON.stringify({ captures: results.map((r) => r.name), consoleIssues: issues }, null, 2));
  } finally {
    preview.kill();
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error("[capturar-movil-claude] fallo:", error); process.exit(1); });
