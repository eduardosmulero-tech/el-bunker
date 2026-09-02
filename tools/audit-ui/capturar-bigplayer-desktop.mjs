// tools/audit-ui/capturar-bigplayer-desktop.mjs
// Revisión del reproductor grande de MUSIC LAB (≥1280px) con los controles
// portados del audit fastpotify: NOW PLAYING/LIVE, seek clicable, shuffle,
// repetición y volumen. Captura evidencia + verificación DOM en JSON.
// Regenerable: AUDIT_PORT=4322 node tools/audit-ui/capturar-bigplayer-desktop.mjs
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { instalarRutas, seedAutenticacion } from "./fixture-server.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const FIXTURES = join(HERE, "fixtures");
const OUT = join(HERE, "report", "bigplayer-desktop");
const DIST = join(OUT, ".dist-bigplayer");
const PORT = Number(process.env.AUDIT_PORT ?? 4322);
const BASE_URL = `http://localhost:${PORT}`;
const VITE = join(ROOT, "node_modules", "vite", "bin", "vite.js");
const VIEWPORT = { width: 1600, height: 900 };

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

async function main() {
  mkdirSync(OUT, { recursive: true });
  run(process.execPath, [VITE, "build", "--outDir", DIST, "--emptyOutDir"], { cwd: ROOT, env: { ...process.env, VITE_API_URL: BASE_URL } });
  const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], { cwd: ROOT, stdio: "ignore" });
  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
    const context = await browser.newContext({ viewport: VIEWPORT, serviceWorkers: "block" });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e}`));
    await seedAutenticacion(page);
    await instalarRutas(page, { baseUrl: BASE_URL, fixturesDir: FIXTURES });
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(6000);

    // Ir a MUSIC LAB en desktop (raíl lateral)
    const nav = page.locator("button").filter({ hasText: "MUSIC LAB" }).first();
    await nav.waitFor({ state: "visible", timeout: 10000 });
    await nav.click();
    await page.waitForTimeout(1500);

    // Reproducir con el play del dock (activeTrack = primer track)
    const playBtn = page.locator('button[aria-label="Reproducir"]').first();
    await playBtn.waitFor({ state: "visible", timeout: 8000 });
    await playBtn.click();
    await page.waitForTimeout(2500);

    await page.screenshot({ path: join(OUT, "bigplayer_track_reproduciendo.png"), animations: "disabled" });

    // Verificación DOM de los controles portados
    const verificacion = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const big = q('section[aria-label="Reproductor grande de MUSIC LAB"]');
      const title = big?.querySelector("h2") ?? null;
      const titleStyle = title ? getComputedStyle(title) : null;
      return {
        bigPlayerMontado: Boolean(big),
        estadoNowPlaying: big?.textContent?.includes("NOW PLAYING") ?? false,
        estadoLive: /LIVE|PAUSED/.test(big?.textContent ?? ""),
        seekSlider: Boolean(q('[role="slider"][aria-label="Posición de reproducción"]')),
        shuffle: Boolean(q('button[aria-pressed][aria-label*="leatorio"], [aria-pressed]')), // refinado abajo
        shufflePorIcono: Boolean(q('section[aria-label="Reproductor grande de MUSIC LAB"] button[aria-pressed]')),
        repeticion: Boolean(q('button[aria-label^="Repetición"]')),
        volumen: Boolean(q('input[type="range"][aria-label="Volumen"]')),
        tituloTexto: title?.textContent ?? null,
        tituloOverflow: titleStyle ? { whiteSpace: titleStyle.whiteSpace, textOverflow: titleStyle.textOverflow, overflowWrap: titleStyle.overflowWrap } : null,
        unSoloAudio: document.querySelectorAll("audio").length,
      };
    });
    // shuffle: el botón porta aria-pressed (framer button). Búsqueda directa:
    verificacion.shuffle = await page.locator('section[aria-label="Reproductor grande de MUSIC LAB"] button[aria-pressed]').count();

    // Interacción: click en el seek a mitad y leer aria-valuenow del input volumen
    const seek = page.locator('[role="slider"][aria-label="Posición de reproducción"]');
    if (await seek.count()) {
      const box = await seek.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
        await page.waitForTimeout(800);
        verificacion.seekTrasClick = await seek.getAttribute("aria-valuenow");
      }
    }
    const vol = page.locator('input[type="range"][aria-label="Volumen"]');
    if (await vol.count()) verificacion.volumenValor = await vol.inputValue();

    // S-bp-a11y: prueba de TECLADO del slider del big player (←/→ ±5s, Home/End).
    // Lee currentTime del <audio> antes/después de cada tecla.
    const sliderKb = page.locator('[role="slider"][aria-label="Posición de reproducción"]');
    if (await sliderKb.count()) {
      await sliderKb.focus();
      const leerT = () => page.evaluate(() => document.querySelector("audio")?.currentTime ?? null);
      const base = await leerT();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(400);
      const trasRight = await leerT();
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(400);
      const trasLeft = await leerT();
      await page.keyboard.press("Home");
      await page.waitForTimeout(400);
      const trasHome = await leerT();
      verificacion.teclado = {
        base: base?.toFixed(2),
        trasFlechaDerecha: trasRight?.toFixed(2),
        avanceAprox5s: base != null && trasRight != null ? Math.abs(trasRight - base - 5) < 1.5 : null,
        trasFlechaIzquierda: trasLeft?.toFixed(2),
        retrocesoAprox5s: trasRight != null && trasLeft != null ? Math.abs(trasLeft - trasRight + 5) < 1.5 : null,
        trasHome: trasHome?.toFixed(2),
        homeA0: trasHome != null && trasHome < 0.6,
      };
      await page.waitForTimeout(1200); // reponer un poco de pista antes de la captura final
    }

    await page.screenshot({ path: join(OUT, "bigplayer_tras_seek.png"), animations: "disabled" });

    writeFileSync(join(OUT, "bigplayer-verificacion.json"), JSON.stringify({
      meta: { generatedAt: new Date().toISOString(), viewport: VIEWPORT },
      verificacion,
      consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
    }, null, 2));
    console.log(JSON.stringify({ verificacion, consoleErrors: [...new Set(consoleErrors)].slice(0, 5) }, null, 2));
    await browser.close();
  } finally {
    preview.kill();
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error("[bigplayer-desktop] fallo:", error); process.exit(1); });
