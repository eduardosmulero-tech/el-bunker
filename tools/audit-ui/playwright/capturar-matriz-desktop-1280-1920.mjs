// tools/audit-ui/playwright/capturar-matriz-desktop-1280-1920.mjs
// Captura las superficies principales en los dos anchos desktop exigidos por ADR-029.
// Requiere preview local en AUDIT_BASE_URL (por defecto localhost:4317).
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const AUDIT_ROOT = resolve(HERE, "..", "..");
const FIXTURES = resolve(HERE, "..", "fixtures");
const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://localhost:4317";
const OUT = resolve(HERE, "..", "report", "desktop-1280-1920");
const SHOTS = join(OUT, "screenshots");
const HEIGHT = 900;
const WIDTHS = [1280, 1920];
const STATES = [
  { id: "vault-wall", tab: "VAULT", child: "MEMORIA" },
  { id: "music-tracks", tab: "MUSIC LAB", child: "TRACKS" },
  { id: "music-lists", tab: "MUSIC LAB", child: "LISTS" },
  { id: "music-drops", tab: "MUSIC LAB", child: "DROPS" },
  { id: "capsules-timeline", tab: "CAPSULES", child: "TIMELINE" },
  { id: "capsules-smoke", tab: "CAPSULES", child: "SMOKE" },
  { id: "capsules-timecapsules", tab: "CAPSULES", child: "TIME CAPSULES" },
  { id: "capsules-recap", tab: "CAPSULES", child: "RECAP" },
  { id: "admin", admin: true },
];

const FIXTURE_MAP = new Map([
  ["/api/entries", "entries.json"], ["/api/eras", "eras.json"], ["/api/tracks", "tracks.json"],
  ["/api/tags", "tags.json"], ["/api/playlists", "playlists.json"], ["/api/drops", "drops.json"],
  ["/api/files", "files.json"], ["/api/config", "config.json"], ["/api/events", "events.json"],
  ["/api/time_capsules", "time_capsules.json"], ["/api/stats/recap", "stats_recap.json"],
  ["/api/queue", "queue.json"], ["/api/sync", "sync.json"],
]);
function fixtureFor(pathname) {
  if (FIXTURE_MAP.has(pathname)) return FIXTURE_MAP.get(pathname);
  const parts = pathname.split("/");
  return parts.length >= 3 ? FIXTURE_MAP.get(`/${parts[1]}/${parts[2]}`) ?? null : null;
}
function adminResponse(pathname) {
  if (pathname === "/api/admin/health") return { counts: { files: 4, entries: 12, tracksActive: 8, tracksSoftDeleted: 0, references: 4, danglingReferences: 0 } };
  if (pathname === "/api/admin/access") return { users: [] };
  if (pathname === "/api/admin/audit" || pathname === "/api/admin/access/logins") return { items: [], total: 0 };
  const match = pathname.match(/^\/api\/admin\/(entries|files|tracks|playlists|capsules|drops)$/);
  if (!match) return null;
  const source = { entries: "entries.json", files: "files.json", tracks: "tracks.json", playlists: "playlists.json", capsules: "time_capsules.json", drops: "drops.json" }[match[1]];
  const items = JSON.parse(readFileSync(join(FIXTURES, source), "utf8")).map((item) => ({ ...item, classified: false }));
  return { items, total: items.length };
}
function installRoutes(page) {
  const cache = new Map();
  const readFixture = (name) => { if (!cache.has(name)) cache.set(name, readFileSync(join(FIXTURES, name), "utf8")); return cache.get(name); };
  return page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const admin = adminResponse(url.pathname);
    if (admin) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(admin) });
    if (url.pathname.startsWith("/api/queue")) return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    if (url.pathname.startsWith("/api/")) {
      const fixture = fixtureFor(url.pathname);
      return fixture
        ? route.fulfill({ status: 200, contentType: "application/json", body: readFixture(fixture) })
        : route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    }
    if (url.origin === BASE_URL) return route.continue();
    return route.fulfill({ status: 204, body: "" });
  });
}
function seed(page) {
  return page.addInitScript(() => {
    sessionStorage.setItem("bunker_jwt", "audit-fixture-jwt");
    sessionStorage.setItem("bunker_session_kind", "access_key");
    sessionStorage.setItem("bunker_user", JSON.stringify({ id: "admin", name: "Admin", email: "thebunker.admin@gmail.com", role: "admin" }));
  });
}
async function clickText(page, selector, text) {
  const locator = page.locator(selector).filter({ hasText: text }).first();
  try { await locator.waitFor({ state: "visible", timeout: 8000 }); await locator.click(); return true; } catch { return false; }
}
async function inspect(page) {
  return page.evaluate(() => {
    const visible = (selector) => [...document.querySelectorAll(selector)].filter((el) => {
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
    });
    const box = (selector) => { const el = visible(selector)[0]; if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; };
    return {
      desktop: visible(".desktop-topbar").length > 0,
      mobileNav: visible(".mobile-bottom-nav").length > 0,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      topbar: box(".desktop-topbar"), rail: box(".desktop-rail"), dock: box(".desktop-dock"), footer: box(".desktop-footer"), canvas: box("main.desktop-canvas"),
      bodyText: document.body.innerText.slice(0, 500),
    };
  });
}
function validate(result) {
  const errors = [];
  if (!result.desktop || result.mobileNav) errors.push("layout desktop incorrecto");
  if (result.overflowX) errors.push("overflow horizontal");
  if (result.topbar?.height !== 44) errors.push(`topbar=${result.topbar?.height}`);
  if (result.rail?.width !== 208) errors.push(`rail=${result.rail?.width}`);
  if (result.dock?.width !== 336) errors.push(`dock=${result.dock?.width}`);
  if (result.footer?.height !== 28) errors.push(`footer=${result.footer?.height}`);
  return errors;
}

mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const width of WIDTHS) {
    for (const state of STATES) {
      const context = await browser.newContext({ viewport: { width, height: HEIGHT }, serviceWorkers: "block" });
      const page = await context.newPage();
      const consoleErrors = [];
      const httpErrors = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
      page.on("response", (response) => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });
      await seed(page);
      await installRoutes(page);
      await page.goto(state.admin ? `${BASE_URL}/admin` : BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1800);
      if (state.admin) {
        // ADMIN mantiene un shell propio; se valida como superficie admin separada.
        await clickText(page, 'nav[aria-label="SECCIONES DEL PANEL"]:visible button', "CONTENIDO");
      } else {
        await clickText(page, ".desktop-rail__destination", state.tab);
        await page.waitForTimeout(500);
        await clickText(page, ".desktop-rail__child", state.child);
      }
      await page.waitForTimeout(700);
      const snapshot = await inspect(page);
      const errors = state.admin ? [] : validate(snapshot);
      const filename = `${state.id}-${width}px.png`;
      await page.screenshot({ path: join(SHOTS, filename) });
      results.push({ width, state: state.id, capture: `screenshots/${filename}`, snapshot, errors, consoleErrors, httpErrors });
      await context.close();
    }
  }
} finally {
  await browser.close();
}
const report = {
  meta: { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, browser: "msedge", widths: WIDTHS, height: HEIGHT, states: STATES.map((state) => state.id) },
  summary: {
    captures: results.length,
    failures: results.filter((result) => result.errors.length || result.consoleErrors.length || result.httpErrors.length).length,
    overflow: results.filter((result) => result.snapshot.overflowX).length,
    consoleErrors: results.reduce((sum, result) => sum + result.consoleErrors.length, 0),
    httpErrors: results.reduce((sum, result) => sum + result.httpErrors.length, 0),
  },
  results,
};
writeFileSync(join(OUT, "desktop-1280-1920.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
if (report.summary.failures) process.exitCode = 1;
