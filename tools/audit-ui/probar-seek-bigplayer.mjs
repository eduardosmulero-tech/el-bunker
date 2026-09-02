// tools/audit-ui/probar-seek-bigplayer.mjs
// Sonda de diagnóstico: ¿el clic sobre la barra de seek del reproductor grande
// cambia audio.currentTime? También cataloga los <audio> del DOM (V-7).
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { instalarRutas, seedAutenticacion } from "./fixture-server.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const FIXTURES = join(HERE, "fixtures");
const DIST = join(HERE, "report", "bigplayer-desktop", ".dist-seek");
const PORT = 4323;
const BASE_URL = `http://localhost:${PORT}`;
const VITE = join(ROOT, "node_modules", "vite", "bin", "vite.js");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} → ${result.status}`);
}
async function waitForServer(url) {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview no respondió en ${url}`);
}

async function main() {
  mkdirSync(DIST, { recursive: true });
  run(process.execPath, [VITE, "build", "--outDir", DIST, "--emptyOutDir"], { cwd: ROOT, env: { ...process.env, VITE_API_URL: BASE_URL } });
  const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], { cwd: ROOT, stdio: "ignore" });
  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: "block" });
    const page = await context.newPage();
    await seedAutenticacion(page);
    await instalarRutas(page, { baseUrl: BASE_URL, fixturesDir: FIXTURES });
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(6000);
    await page.locator("button").filter({ hasText: "MUSIC LAB" }).first().click();
    await page.waitForTimeout(1200);
    await page.locator('button[aria-label="Reproducir"]').first().click();
    await page.waitForTimeout(2000);

    // Instrumentar eventos del <audio> principal alrededor del clic
    await page.evaluate(() => {
      const a = document.querySelector("audio");
      // Interceptar asignaciones de currentTime (valor exacto que calcula el handler)
      const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime");
      window.__sets = [];
      Object.defineProperty(a, "currentTime", {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { window.__sets.push({ v, t: performance.now().toFixed(1), dur: desc.get.call(this).toFixed(2) === v ? "=actual" : undefined, duracion: a.duration }); desc.set.call(this, v); },
      });
      window.__evts = [];
      const t0 = performance.now();
      for (const ev of ["seeking", "seeked", "emptied", "loadstart", "play", "pause", "timeupdate"]) {
        a.addEventListener(ev, (e) => {
          const marcas = { seeking: "currentTime=" + desc.get.call(a).toFixed(2), timeupdate: "t=" + desc.get.call(a).toFixed(2), emptied: "src reset", loadstart: "src=" + (a.currentSrc || "").slice(-25) };
          window.__evts.push(`${((performance.now() - t0) / 1000).toFixed(2)}s ${ev} ${marcas[ev] ?? ""}`.trim());
          if (window.__evts.length > 40) window.__evts.shift();
        });
      }
    });

    const antes = await page.evaluate(() => {
      const audios = [...document.querySelectorAll("audio")];
      return {
        currentTime: audios[0]?.currentTime ?? null,
        duration: audios[0]?.duration ?? null,
        audios: audios.map((a) => ({ src: (a.currentSrc || a.src || "").slice(-60), enDOM: a.isConnected, padre: a.parentElement?.tagName ?? null })),
      };
    });

    const seek = page.locator('[role="slider"][aria-label="Posición de reproducción"]');
    const nSliders = await seek.count();
    const rects = [];
    for (let i = 0; i < nSliders; i++) rects.push(await seek.nth(i).boundingBox());
    const box = await seek.first().boundingBox();
    const clickX = box.x + box.width * 0.5, clickY = box.y + box.height / 2;
    const topmost = await page.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      const cadena = [];
      let cur = el;
      while (cur && cadena.length < 5) { cadena.push(`${cur.tagName.toLowerCase()}${cur.getAttribute("aria-label") ? `[aria-label="${cur.getAttribute("aria-label")}"]` : ""}${cur.className && typeof cur.className === "string" ? "." + cur.className.split(" ").slice(0, 2).join(".") : ""}`); cur = cur.parentElement; }
      return { topmost: cadena[0] ?? null, cadena };
    }, [clickX, clickY]);
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(1000);

    const despues = await page.evaluate(() => {
      const a = document.querySelector("audio");
      const s = a?.seekable;
      return { currentTime: a?.currentTime ?? null, ariaValuenow: document.querySelector('[role="slider"][aria-label="Posición de reproducción"]')?.getAttribute("aria-valuenow") ?? null,
        seekable: s ? { length: s.length, inicio: s.length ? s.start(0) : null, fin: s.length ? s.end(0) : null } : null };
    });
    // Muestreo temporal: identidad del primer <audio> + posición, cada 200ms
    const muestras = [];
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(200);
      muestras.push(await page.evaluate(() => {
        const a = document.querySelector("audio");
        return { t: a?.currentTime.toFixed(2) ?? null, src: (a?.currentSrc || "").slice(-18), enDOM: a?.isConnected ?? null };
      }));
    }
    const eventos = await page.evaluate(() => ({ evts: window.__evts ?? [], sets: window.__sets ?? [] }));
    console.log(JSON.stringify({ antes, despues, muestras, nSliders, rects, clicEn: { x: clickX, y: clickY, anchoCaja: box.width }, topmost, eventos }, null, 2));
    await browser.close();
  } finally {
    preview.kill();
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error("[probar-seek] fallo:", error); process.exit(1); });
