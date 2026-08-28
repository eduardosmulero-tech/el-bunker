// tools/audit-ui/medir-uso-desktop.mjs
// Auditoría de DISEÑO desktop (no de contención): mide cuánto del lienzo
// útil (entre raíl y dock) está realmente ocupado por contenido, la mayor
// banda vertical vacía y señales de duplicación (reproductores, canvases,
// cabeceras COLA). Complementa auditoria-completa.mjs, que solo mide errores.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const DIST = join(HERE, ".dist-full-audit");
const PORT = Number(process.env.AUDIT_PORT ?? 4319);
const BASE_URL = `http://localhost:${PORT}`;
const FIXTURES = join(HERE, "fixtures");
const VITE = join(ROOT, "node_modules", "vite", "bin", "vite.js");

const API_FIXTURES = new Map([
  ["/api/entries", "entries.json"], ["/api/eras", "eras.json"], ["/api/tracks", "tracks.json"],
  ["/api/tags", "tags.json"], ["/api/playlists", "playlists.json"], ["/api/drops", "drops.json"],
  ["/api/files", "files.json"], ["/api/config", "config.json"], ["/api/events", "events.json"],
  ["/api/time_capsules", "time_capsules.json"], ["/api/stats/recap", "stats_recap.json"],
  ["/api/queue", "queue.json"], ["/api/sync", "sync.json"],
]);

const STATES = [
  { id: "music-tracks", tab: "MUSIC LAB", sub: "TRACKS" },
  { id: "music-queue", tab: "MUSIC LAB", sub: "COLA" },
  { id: "vault-wall", tab: "VAULT" },
  { id: "capsules-timeline", tab: "CAPSULES", sub: "TIMELINE" },
];

async function waitForServer(url) {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    try { if ((await fetch(url)).ok) return; } catch { /* arrancando */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview no respondió en ${url}`);
}

async function installRoutes(page) {
  const cache = new Map();
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/queue" || url.pathname.startsWith("/api/queue/")) {
      const tracks = JSON.parse(readFileSync(join(FIXTURES, "tracks.json"), "utf8"));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tracks.slice(0, 2).map((t) => ({ track_id: t.id, _manual: true }))) });
      return;
    }
    const fixtureName = API_FIXTURES.get(url.pathname);
    if (url.pathname.startsWith("/api/")) {
      if (!fixtureName) {
        route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: `sin fixture ${url.pathname}` }) });
        return;
      }
      if (!cache.has(fixtureName)) cache.set(fixtureName, readFileSync(join(FIXTURES, fixtureName), "utf8"));
      route.fulfill({ status: 200, contentType: "application/json", body: cache.get(fixtureName) });
      return;
    }
    if (url.origin === BASE_URL) route.continue();
    else route.fulfill({ status: 204, body: "" });
  });
}

async function openTab(page, tab, sub) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1600);
  await page.locator(".desktop-rail__destination").filter({ hasText: tab }).first().click();
  await page.waitForTimeout(900);
  if (sub) {
    await page.locator(".desktop-rail__child").filter({ hasText: sub }).first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
  }
}

function measureInPage(page) {
  return page.evaluate(() => {
    const rail = document.querySelector(".desktop-rail")?.getBoundingClientRect();
    const dock = document.querySelector(".desktop-dock")?.getBoundingClientRect();
    const left = (rail?.right ?? 0) + 8;
    const right = (dock?.left ?? window.innerWidth) - 8;
    const top = 44 + 10;
    const bottom = window.innerHeight - 28 - 10;
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 12) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) !== 0;
    };
    // Contenido = hojas con texto real o media (img/canvas/svg de icono no cuenta:
    // un icono solo no llena espacio). Los contenedores de fondo NO cuentan:
    // miden chrome, no densidad.
    const isContent = (el) => {
      if (el.children.length > 0) return false;
      if (el.matches("img, canvas, video")) return true;
      return Boolean(el.textContent?.trim());
    };
    const rects = [...document.querySelectorAll("body *")]
      .filter((el) => {
        if (!visible(el) || !isContent(el)) return false;
        const r = el.getBoundingClientRect();
        return r.right > left && r.left < right && r.bottom > top && r.top < bottom;
      })
      .map((el) => el.getBoundingClientRect());
    const covered = (x, y) => rects.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
    const STEP = 8;
    let coveredPts = 0;
    let totalPts = 0;
    let maxEmptyBand = 0;
    let currentEmpty = 0;
    for (let y = top; y < bottom; y += STEP) {
      let rowCovered = 0;
      let rowTotal = 0;
      for (let x = left; x < right; x += STEP) {
        rowTotal += 1;
        if (covered(x, y)) rowCovered += 1;
      }
      const ratio = rowCovered / Math.max(1, rowTotal);
      coveredPts += rowCovered;
      totalPts += rowTotal;
      if (ratio < 0.02) {
        currentEmpty += 1;
        maxEmptyBand = Math.max(maxEmptyBand, currentEmpty);
      } else {
        currentEmpty = 0;
      }
    }
    const bigPlayers = document.querySelectorAll('[aria-label="Reproductor grande de MUSIC LAB"]').length;
    const colaHeaders = [...document.querySelectorAll("body *")].filter(
      (el) => el.children.length === 0 && /COLA \[/.test(el.textContent ?? "")
    ).length;
    const canvases = document.querySelectorAll("canvas").length;
    const dockHasPlayer = Boolean(document.querySelector(".desktop-dock .winamp, .desktop-dock canvas"));
    return {
      lienzoUtilPx: Math.round(right - left),
      coberturaContenidoPct: Math.round((100 * coveredPts) / Math.max(1, totalPts)),
      bandaVaciaMaxPx: maxEmptyBand * STEP,
      elementosContenido: rects.length,
      bigPlayers,
      colaHeaders,
      canvases,
      dockConReproductor: dockHasPlayer,
    };
  });
}

const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], {
  cwd: ROOT,
  stdio: "ignore",
});
try {
  await waitForServer(BASE_URL);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    sessionStorage.setItem("bunker_jwt", "audit-fixture-jwt");
    sessionStorage.setItem("bunker_session_kind", "access_key");
    sessionStorage.setItem("bunker_user", JSON.stringify({ id: "edu", name: "Edu", email: "edu@example.com", role: "user", avatar: null }));
  });
  await installRoutes(page);

  const report = { meta: { viewport: "1440x900", url: BASE_URL }, results: {} };
  for (const state of STATES) {
    await openTab(page, state.tab, state.sub);
    report.results[state.id] = await measureInPage(page);
  }
  await browser.close();
  writeFileSync(join(HERE, "report", "uso-desktop.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.results, null, 2));
} finally {
  preview.kill();
}
