// tools/audit-ui/auditar-likes-sync.mjs
// Auditoría de navegador (1600×900, Chromium/Edge headless) del sync de likes
// (t_like-sync) sobre el harness de fixtures — sin red, sin producción.
//
// Escenarios verificados:
//   R1. push-on-mount IMPOSIBLE: tras boot + play, hay exactamente 1 GET y 0 PUT
//       aunque el pull cambie likedTrackIds (regresión del bug de pérdida de datos)
//   R2. merge honesto: toggle local + like "de otro dispositivo" → el PUT lleva
//       la unión, y solo UNO (debounce)
//   R3. persistencia multi-dispositivo: tras reload, el deck muestra LIKED con
//       lo que devolvió el pull
//   R4. contrato intacto: unSoloAudio=1 y 0 errores de consola
// Regenerable: AUDIT_PORT=4323 node tools/audit-ui/auditar-likes-sync.mjs
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { instalarRutas, seedAutenticacion } from "./fixture-server.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const FIXTURES = join(HERE, "fixtures");
const OUT = join(HERE, "report", "likes-sync");
const DIST = join(OUT, ".dist-likes");
const PORT = Number(process.env.AUDIT_PORT ?? 4323);
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

    // ── Instrumentación de red: registrar TODA llamada a /api/likes ──
    const likesCalls = [];
    // R3: el servidor "tiene" un like hecho desde otro dispositivo (trk-002);
    // tras el primer PUT se actualiza para el reload.
    let serverLikes = ["trk-002"];
    let failPuts = false;
    await seedAutenticacion(page);
    await instalarRutas(page, { baseUrl: BASE_URL, fixturesDir: FIXTURES });
    // NUESTRA ruta /api/likes se registra DESPUÉS de instalarRutas: Playwright
    // resuelve rutas en LIFO — si se registra antes, el catch-all "**/*" del
    // fixture la pisa y la instrumentación no ve ninguna llamada (bug cazado
    // en la primera corrida: likesCalls vacío con la app funcionando).
    await page.route("**/api/likes**", (route) => {
      const req = route.request();
      const entry = { method: req.method(), body: req.method() === "PUT" ? req.postData() : null, t: Date.now() };
      likesCalls.push(entry);
      if (req.method() === "GET") {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ liked_track_ids: serverLikes }) });
      } else if (req.method() === "PUT") {
        if (failPuts) { route.fulfill({ status: 500, contentType: "application/json", body: "{}" }); return; }
        try { serverLikes = JSON.parse(req.postData() || "{}").liked_track_ids ?? serverLikes; } catch { /* mantener */ }
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      } else {
        route.fulfill({ status: 405, contentType: "application/json", body: "{}" });
      }
    });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(6000);

    // Ir a MUSIC LAB y reproducir (mismo flujo que capturar-bigplayer-desktop)
    const nav = page.locator("button").filter({ hasText: "MUSIC LAB" }).first();
    await nav.waitFor({ state: "visible", timeout: 10000 });
    await nav.click();
    await page.waitForTimeout(1500);
    const playBtn = page.locator('button[aria-label="Reproducir"]').first();
    await playBtn.waitFor({ state: "visible", timeout: 8000 });
    await playBtn.click();
    await page.waitForTimeout(2500);

    const likeChip = page.locator('section[aria-label="Reproductor grande de MUSIC LAB"] button[aria-pressed]').filter({ hasText: /LIKE/ }).first();
    if (!(await likeChip.count())) throw new Error("Chip LIKE del deck no encontrado");
    const r1AntesDeToggle = {
      gets: likesCalls.filter((c) => c.method === "GET").length,
      puts: likesCalls.filter((c) => c.method === "PUT").length,
    };
    const likedPorPull = await likeChip.getAttribute("aria-pressed");
    // El pull aplica aunque el chip del track ACTIVO no cambie (el like remoto
    // es sobre trk-002, no sobre el que suena): la observación honesta es el
    // estado persistido tras el merge (localStorage ya contiene la unión).
    const likedLocalTrasPull = await page.evaluate(() => JSON.parse(localStorage.getItem("el_bunker_liked_edu") || "[]"));

    // ── R2: toggle → debounce 2s → EXACTAMENTE un PUT con la unión ──
    await likeChip.click();
    await page.waitForTimeout(600); // UI optimista ya, PUT aún no (debounce)
    const putsAntesDeDebounce = likesCalls.filter((c) => c.method === "PUT").length;
    await page.waitForTimeout(2600);
    const puts = likesCalls.filter((c) => c.method === "PUT");
    const r2Merge = {
      putsAntesDeDebounce,
      putsTotales: puts.length,
      cuerpoDelPut: puts[0]?.body ? JSON.parse(puts[0].body).liked_track_ids : null,
      chipTrasToggle: await likeChip.getAttribute("aria-pressed"),
      textoChipTrasToggle: (await likeChip.textContent())?.trim() ?? null,
    };
    await page.screenshot({ path: join(OUT, "likes_tras_toggle.png"), animations: "disabled" });

    // ── R3: reload → el pull trae lo persistido → deck LIKED sin tocar nada ──
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);
    const nav2 = page.locator("button").filter({ hasText: "MUSIC LAB" }).first();
    await nav2.click();
    await page.waitForTimeout(1500);
    const likeChip2 = page.locator('section[aria-label="Reproductor grande de MUSIC LAB"] button[aria-pressed]').filter({ hasText: /LIKE/ }).first();
    const r3Reload = {
      likedTrasReload: await likeChip2.getAttribute("aria-pressed"),
      textoTrasReload: (await likeChip2.textContent())?.trim() ?? null,
      getsTrasReload: likesCalls.filter((c) => c.method === "GET").length,
    };
    await page.screenshot({ path: join(OUT, "likes_tras_reload.png"), animations: "disabled" });

    // ── Contrato transversal ──
    const contrato = await page.evaluate(() => ({
      unSoloAudio: document.querySelectorAll("audio").length,
    }));

    const verificacion = {
      meta: { generatedAt: new Date().toISOString(), viewport: VIEWPORT, tracksFixture: "trk-001 (toggle local) + trk-002 (like 'remoto' del pull)" },
      r1_noPushOnMount: r1AntesDeToggle,
      r1_pullAplicado: likedPorPull === "true", // trk-002 llegó del pull y el chip lo refleja
      r2_merge: r2Merge,
      r3_reload: r3Reload,
      contrato,
      likesCalls,
    };
    verificacion.veredicto = {
      r1_ok: r1AntesDeToggle.puts === 0 && r1AntesDeToggle.gets === 1,
      // Pull aplicado: la unión persistida incluye el like "remoto" trk-002
      r1_pullVisible: likedLocalTrasPull.includes("trk-002"),
      // Orden insensible: Set → spread no garantiza orden estable en el cuerpo
      r2_ok: r2Merge.putsTotales === 1
        && JSON.stringify([...(r2Merge.cuerpoDelPut ?? [])].sort()) === JSON.stringify(["trk-001", "trk-002"])
        && r2Merge.chipTrasToggle === "true",
      r3_ok: r3Reload.likedTrasReload === "true",
      sinDobleAudio: contrato.unSoloAudio === 1,
      sinErroresConsola: consoleErrors.length === 0,
    };
    verificacion.exito = Object.values(verificacion.veredicto).every(Boolean);

    writeFileSync(join(OUT, "likes-sync-verificacion.json"), JSON.stringify({ ...verificacion, consoleErrors: [...new Set(consoleErrors)].slice(0, 20) }, null, 2));
    console.log(JSON.stringify(verificacion, null, 2));
    await browser.close();
    if (!verificacion.exito) process.exitCode = 2;
  } finally {
    preview.kill();
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error("[likes-sync] fallo:", error); process.exit(1); });
