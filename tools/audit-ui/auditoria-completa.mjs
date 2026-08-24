// tools/audit-ui/auditoria-completa.mjs
// Auditoría de producto reproducible: captura cada destino, subvista, modo de
// galería y consola admin en 390x844 y 1440x900. Solo usa fixtures locales.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const FIXTURES = join(HERE, "fixtures");
const REPORT = join(HERE, "report", "full-audit");
const DIST = join(HERE, ".dist-full-audit");
const PORT = Number(process.env.AUDIT_PORT ?? 4318);
const BASE_URL = `http://localhost:${PORT}`;
const VITE = join(ROOT, "node_modules", "vite", "bin", "vite.js");
const VIEWPORTS = [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }];

const API_FIXTURES = new Map([
  ["/api/entries", "entries.json"], ["/api/eras", "eras.json"], ["/api/tracks", "tracks.json"],
  ["/api/tags", "tags.json"], ["/api/playlists", "playlists.json"], ["/api/drops", "drops.json"],
  ["/api/files", "files.json"], ["/api/config", "config.json"], ["/api/events", "events.json"],
  ["/api/time_capsules", "time_capsules.json"], ["/api/stats/recap", "stats_recap.json"],
  ["/api/queue", "queue.json"], ["/api/sync", "sync.json"],
]);

const APP_STATES = [
  { id: "vault-wall", tab: "VAULT", tabId: "vault", mode: "WALL" },
  { id: "vault-add-entry", tab: "VAULT", tabId: "vault", action: "add-entry" },
  { id: "vault-cinema", tab: "VAULT", tabId: "vault", mode: "CINEMA" },
  { id: "vault-map", tab: "VAULT", tabId: "vault", mode: "MAP" },
  { id: "vault-dialogue", tab: "VAULT", tabId: "vault", mode: "DIALOGUE" },
  { id: "vault-reel", tab: "VAULT", tabId: "vault", mode: "REEL" },
  { id: "vault-exhibition", tab: "VAULT", tabId: "vault", mode: "EXHIBITION" },
  { id: "music-tracks", tab: "MUSIC LAB", tabId: "music", sub: "TRACKS" },
  { id: "music-add-track", tab: "MUSIC LAB", tabId: "music", sub: "TRACKS", action: "add-track" },
  { id: "music-queue", tab: "MUSIC LAB", tabId: "music", sub: "COLA" },
  { id: "music-lists", tab: "MUSIC LAB", tabId: "music", sub: "LISTS" },
  { id: "music-drops", tab: "MUSIC LAB", tabId: "music", sub: "DROPS" },
  { id: "capsules-timeline", tab: "CAPSULES", tabId: "capsules", sub: "TIMELINE" },
  { id: "capsules-smoke", tab: "CAPSULES", tabId: "capsules", sub: "SMOKE" },
  { id: "capsules-timecapsules", tab: "CAPSULES", tabId: "capsules", sub: "TIME CAPSULES" },
  { id: "capsules-recap", tab: "CAPSULES", tabId: "capsules", sub: "RECAP" },
];

const ADMIN_STATES = [
  { id: "admin-contenido-entradas", route: "/admin", adminSection: "contenido", label: "CONTENIDO", resource: "ENTRADAS" },
  { id: "admin-contenido-archivos", route: "/admin", adminSection: "contenido", label: "CONTENIDO", resource: "ARCHIVOS" },
  { id: "admin-contenido-tracks", route: "/admin", adminSection: "contenido", label: "CONTENIDO", resource: "TRACKS" },
  { id: "admin-contenido-playlists", route: "/admin", adminSection: "contenido", label: "CONTENIDO", resource: "PLAYLISTS" },
  { id: "admin-contenido-capsulas", route: "/admin", adminSection: "contenido", label: "CONTENIDO", resource: "CÁPSULAS" },
  { id: "admin-contenido-drops", route: "/admin", adminSection: "contenido", label: "CONTENIDO", resource: "DROPS" },
  { id: "admin-salud", route: "/admin", adminSection: "salud", label: "SALUD" },
  { id: "admin-auditoria", route: "/admin", adminSection: "auditoria", label: "AUDITORÍA" },
  { id: "admin-accesos", route: "/admin", adminSection: "accesos", label: "ACCESOS" },
];

const AUTH_STATES = [{ id: "login", route: "/", auth: true }];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} → ${result.status}`);
}

async function waitForServer(url) {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    try { if ((await fetch(url)).ok) return; } catch { /* arrancando */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Preview no respondió en ${url}`);
}

function userFor(kind) {
  return kind === "admin"
    ? { id: "admin", name: "Admin", email: "thebunker.admin@gmail.com", role: "admin", avatar: null }
    : { id: "edu", name: "Edu", email: "edu@example.com", role: "user", avatar: null };
}

function readFixture(name) {
  return readFileSync(join(FIXTURES, name), "utf8");
}

function adminResponse(pathname) {
  if (pathname === "/api/admin/health") return { counts: { files: 4, entries: 12, tracksActive: 8, tracksSoftDeleted: 0, references: 4, danglingReferences: 0 } };
  if (pathname === "/api/admin/access") return { users: [
    { id: "admin", email: "thebunker.admin@gmail.com", methods: ["access_key"], token_epoch: 1, hasAccessKey: true },
    { id: "edu", email: "edu@example.com", methods: ["google", "access_key"], token_epoch: 0, hasAccessKey: true },
    { id: "david", email: "david@example.com", methods: ["google"], token_epoch: 0, hasAccessKey: false },
  ] };
  if (pathname === "/api/admin/audit" || pathname === "/api/admin/access/logins") {
    const events = JSON.parse(readFixture("events.json"));
    return { items: events, total: events.length };
  }
  const resourceMatch = pathname.match(/^\/api\/admin\/(entries|files|tracks|playlists|capsules|drops)$/);
  if (resourceMatch) {
    const source = { entries: "entries.json", files: "files.json", tracks: "tracks.json", playlists: "playlists.json", capsules: "time_capsules.json", drops: "drops.json" }[resourceMatch[1]];
    const items = JSON.parse(readFixture(source)).map((item) => ({ ...item, classified: false }));
    return { items, total: items.length };
  }
  return null;
}

async function seedSession(page, kind) {
  await page.addInitScript((user) => {
    sessionStorage.setItem("bunker_jwt", "audit-fixture-jwt");
    sessionStorage.setItem("bunker_session_kind", "access_key");
    sessionStorage.setItem("bunker_user", JSON.stringify(user));
  }, userFor(kind));
}

async function installRoutes(page) {
  const cache = new Map();
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const admin = adminResponse(url.pathname);
    if (admin) {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(admin) });
      return;
    }
    if (url.pathname === "/api/queue" || url.pathname.startsWith("/api/queue/")) {
      const tracks = JSON.parse(readFixture("tracks.json"));
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tracks.slice(0, 2).map((track) => ({ track_id: track.id, _manual: true }))) });
      return;
    }
    const fixtureName = API_FIXTURES.get(url.pathname);
    if (url.pathname.startsWith("/api/")) {
      if (!fixtureName) {
        route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: `sin fixture ${url.pathname}` }) });
        return;
      }
      if (!cache.has(fixtureName)) cache.set(fixtureName, readFixture(fixtureName));
      route.fulfill({ status: 200, contentType: "application/json", body: cache.get(fixtureName) });
      return;
    }
    if (url.origin === BASE_URL) route.continue();
    else route.fulfill({ status: 204, body: "" });
  });
}

async function clickVisible(page, selector, text, optional = false) {
  const locator = page.locator(selector).filter({ hasText: text }).first();
  try {
    await locator.waitFor({ state: "visible", timeout: 10000 });
    await locator.click();
    return true;
  } catch (error) {
    if (optional) return false;
    throw error;
  }
}

async function openAppState(page, state, viewport) {
  await page.goto(`${BASE_URL}${state.route ?? "/"}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1400);
  if (state.auth) {
    // Login tiene una secuencia de boot propia; no capturar la pantalla intermedia
    // de servicios como si fuese la pantalla de acceso.
    await page.getByText("IDENTIFICACIÓN VÍA GOOGLE REQUERIDA").waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  let navigation = { modeReached: true, subReached: true };
  if (state.tabId) {
    const nav = viewport.width >= 1280 ? ".desktop-rail__destination" : ".mobile-bottom-nav button";
    await clickVisible(page, nav, state.tab);
    await page.waitForTimeout(900);
  }
  if (state.mode) {
    navigation.modeReached = await clickVisible(page, "main nav button", state.mode);
    await page.waitForTimeout(700);
  }
  if (state.sub) {
    const nav = viewport.width >= 1280 ? ".desktop-rail__child" : "main button";
    // COLA/DROPS pueden incluir contadores; hasText conserva la intención del estado.
    navigation.subReached = await clickVisible(page, nav, state.sub, true);
    // Si la cola persistida llega vacía, el producto no pinta COLA en móvil.
    // Para auditar la pantalla de cola se intenta una acción legítima de añadir.
    if (!navigation.subReached && state.sub === "COLA" && viewport.width < 1280) {
      await clickVisible(page, "main button", "Añadir a cola", true);
      await page.waitForTimeout(700);
      navigation.subReached = await clickVisible(page, nav, state.sub, true);
    }
    await page.waitForTimeout(700);
  }
  if (state.action === "add-entry") await clickVisible(page, "main button", "+ ENTRADA", true);
  if (state.action === "add-track") await clickVisible(page, 'button[title="Añadir track"]', "", true);
  return navigation;
}

async function openAdminState(page, state, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  // La navegación se ejerce en el mismo viewport que se captura. Esto evita
  // que una captura desktop herede una selección realizada solo en móvil.
  await clickVisible(page, 'nav[aria-label="SECCIONES DEL PANEL"]:visible button', state.label);
  await page.waitForTimeout(700);
  if (state.resource) {
    const resourceNav = viewport.width >= 1280
      ? 'aside button'
      : 'nav[aria-label="RECURSOS DEL PANEL"] button';
    await clickVisible(page, resourceNav, state.resource, true);
    await page.waitForTimeout(700);
  }
  return { adminSectionReached: true, viewportNavigation: viewport.width >= 1280 ? "desktop" : "mobile" };
}

async function measure(page, state, viewport, consoleErrors, httpErrors) {
  return page.evaluate(({ state, viewport, consoleErrors, httpErrors }) => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden";
    };
    const clipped = [...document.querySelectorAll("*")].filter((el) => {
      if (!visible(el) || !el.textContent?.trim()) return false;
      const cs = getComputedStyle(el);
      return ["hidden", "clip"].includes(cs.overflowX) && el.scrollWidth > el.clientWidth + 7;
    }).slice(0, 30).map((el) => ({ tag: el.tagName, id: el.id || null, className: typeof el.className === "string" ? el.className : null, text: el.textContent.trim().slice(0, 140), needed: el.scrollWidth, available: el.clientWidth }));
    const overflowSources = [...document.querySelectorAll("*")].filter((el) => {
      if (!visible(el)) return false;
      return el.scrollWidth > el.clientWidth + 7;
    }).slice(0, 20).map((el) => ({ tag: el.tagName, id: el.id || null, className: typeof el.className === "string" ? el.className : null, needed: el.scrollWidth, available: el.clientWidth }));
    return {
      id: state.id,
      viewport,
      url: location.pathname,
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      clipped,
      overflowSources,
      headings: [...document.querySelectorAll("h1,h2,h3")].filter(visible).map((el) => el.textContent.trim()).slice(0, 20),
      buttons: [...document.querySelectorAll("button")].filter(visible).map((el) => (el.textContent || el.getAttribute("aria-label") || "").trim()).filter(Boolean).slice(0, 80),
      consoleErrors,
      httpErrors,
      bodyText: document.body.innerText.slice(0, 2000),
    };
  }, { state, viewport, consoleErrors, httpErrors });
}

async function captureState(browser, state, viewport, kind) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  const page = await context.newPage();
  const consoleErrors = [];
  const httpErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() }); });
  if (!state.auth) await seedSession(page, kind);
  if (state.auth) {
    await page.addInitScript(() => {
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: () => ({ requestAccessToken() {} }),
            revoke(_token, callback) { callback?.(); },
          },
        },
      };
    });
  }
  await installRoutes(page);
  const navigation = state.adminSection
    ? await openAdminState(page, state, viewport)
    : await openAppState(page, state, viewport);
  const viewportName = viewport.width >= 1280 ? "desktop" : "mobile";
  const file = `${state.id}-${viewportName}.png`;
  const path = join(REPORT, "screenshots", file);
  await page.screenshot({ path, fullPage: false });
  const metrics = await measure(page, state, { name: viewportName, ...viewport }, consoleErrors, httpErrors);
  metrics.navigation = navigation;
  metrics.capture = `screenshots/${file}`;
  await context.close();
  return metrics;
}

async function main() {
  mkdirSync(join(REPORT, "screenshots"), { recursive: true });
  run(process.execPath, [VITE, "build", "--outDir", DIST, "--emptyOutDir"], { cwd: ROOT, env: { ...process.env, VITE_API_URL: BASE_URL } });
  const preview = spawn(process.execPath, [VITE, "preview", "--port", String(PORT), "--strictPort", "--outDir", DIST], { cwd: ROOT, stdio: "ignore" });
  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    const results = [];
    for (const state of [...AUTH_STATES, ...APP_STATES]) {
      for (const viewport of VIEWPORTS) results.push(await captureState(browser, state, viewport, "user"));
      console.log(`[full-audit] ${state.id}`);
    }
    for (const state of ADMIN_STATES) {
      for (const viewport of VIEWPORTS) results.push(await captureState(browser, state, viewport, "admin"));
      console.log(`[full-audit] ${state.id}`);
    }
    await browser.close();
    const report = {
      meta: { generatedAt: new Date().toISOString(), browser: "msedge", viewports: VIEWPORTS, appStates: APP_STATES.length, adminStates: ADMIN_STATES.length },
      results,
      summary: {
        captures: results.length,
        overflow: results.filter((result) => result.overflowX).length,
        clippedElements: results.reduce((sum, result) => sum + result.clipped.length, 0),
        consoleErrors: results.reduce((sum, result) => sum + result.consoleErrors.length, 0),
        httpErrors: results.reduce((sum, result) => sum + result.httpErrors.length, 0),
      },
    };
    writeFileSync(join(REPORT, "audit.json"), JSON.stringify(report, null, 2));
    console.log(`[full-audit] OK — ${results.length} capturas; informe ${join(REPORT, "audit.json")}`);
  } finally {
    preview.kill();
    rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error("[full-audit] fallo:", error); process.exit(1); });
