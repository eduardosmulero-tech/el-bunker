// tools/audit-ui/probe-texto-movil.mjs
// Sondeo diagnóstico: nombra el texto visible en la franja superior (<150px)
// de cada pestaña en móvil (390x844) para cazar residuos del chrome desktop.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const DIST = join(HERE, ".dist-full-audit");
const PORT = Number(process.env.AUDIT_PORT ?? 4320);
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

const TABS = ["VAULT", "MUSIC LAB", "CAPSULES"];

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

function probeInPage(page) {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length > 0) continue;
      const r = el.getBoundingClientRect();
      if (r.height === 0 || r.top > 150) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const text = (el.textContent ?? "").trim();
      if (!text) continue;
      const owner = el.closest(".desktop-only") ? "DESKTOP-ONLY" : el.closest("main") ? "lienzo" : "chrome-movil";
      out.push({ y: Math.round(r.top), text: text.slice(0, 70), origen: owner, cls: (el.className?.toString?.() ?? "").slice(0, 60) });
    }
    return out.sort((a, b) => a.y - b.y);
  });
}

const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], {
  cwd: ROOT,
  stdio: "ignore",
});
try {
  await waitForServer(BASE_URL);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    sessionStorage.setItem("bunker_jwt", "audit-fixture-jwt");
    sessionStorage.setItem("bunker_session_kind", "access_key");
    sessionStorage.setItem("bunker_user", JSON.stringify({ id: "edu", name: "Edu", email: "edu@example.com", role: "user", avatar: null }));
  });
  await installRoutes(page);

  const report = { meta: { viewport: "390x844", franja: "top<150px" }, tabs: {} };
  for (const tab of TABS) {
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1600);
    await page.locator(".mobile-bottom-nav button").filter({ hasText: tab }).first().click();
    await page.waitForTimeout(900);
    report.tabs[tab] = await probeInPage(page);
  }
  await browser.close();
  writeFileSync(join(HERE, "report", "texto-movil.json"), JSON.stringify(report, null, 2));
  for (const [tab, rows] of Object.entries(report.tabs)) {
    console.log(`\n=== ${tab} ===`);
    rows.forEach((r) => console.log(`  y=${String(r.y).padStart(4)} [${r.origen}] "${r.text}"`));
  }
} finally {
  preview.kill();
}
