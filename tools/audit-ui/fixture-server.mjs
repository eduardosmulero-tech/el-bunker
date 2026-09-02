// tools/audit-ui/fixture-server.mjs
// Módulo compartido del harness de auditoría: enrutado de /api/* a fixtures
// locales y audio R2 emulado con soporte de peticiones Range (206).
// Sin Range, Chrome marca el medio no-seekable y los tests de seek fallan
// (hallazgo documentado en docs/auditoria-capturas/VERIFICACION_V1_VAULT_MOVIL_Y_BIGPLAYER_2026-09-02.md).
// Uso: await page.addInitScript(seedAutenticacion()); await instalarRutas(page, { baseUrl, fixturesDir });
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MAPA_FIXTURES = new Map([
  ["/api/entries", "entries.json"], ["/api/eras", "eras.json"], ["/api/tracks", "tracks.json"],
  ["/api/tags", "tags.json"], ["/api/playlists", "playlists.json"], ["/api/drops", "drops.json"],
  ["/api/files", "files.json"], ["/api/config", "config.json"], ["/api/events", "events.json"],
  ["/api/time_capsules", "time_capsules.json"], ["/api/stats/recap", "stats_recap.json"],
  ["/api/queue", "queue.json"], ["/api/sync", "sync.json"],
]);

function fixturePara(pathname, mapa = MAPA_FIXTURES) {
  if (mapa.has(pathname)) return mapa.get(pathname);
  const partes = pathname.split("/");
  return partes.length >= 3 ? mapa.get(`/${partes[1]}/${partes[2]}`) ?? null : null;
}

/**
 * Instala el enrutado de auditoría sobre una página Playwright:
 *  - /music/*.mp3 → WAV de fixture con Range 206 (R2 emulado, seekable)
 *  - /api/* → fixtures JSON locales (404 si no hay fixture)
 *  - resto del origen → pasa al preview; orígenes externos → 204
 * @param {import("playwright").Page} page
 * @param {{ baseUrl: string, fixturesDir: string, audioFixture?: string, mapa?: Map<string,string> }} opts
 */
export async function instalarRutas(page, { baseUrl, fixturesDir, audioFixture = "tone-60s.wav", mapa = MAPA_FIXTURES }) {
  const cache = new Map();
  const leerFixture = (name) => { if (!cache.has(name)) cache.set(name, readFileSync(join(fixturesDir, name), "utf8")); return cache.get(name); };
  const wav = readFileSync(join(fixturesDir, audioFixture));

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/music/") && /\.(mp3|wav)$/.test(url.pathname)) {
      const range = route.request().headers()["range"];
      const m = range?.match(/bytes=(\d+)-(\d*)/);
      if (m) {
        const start = Number(m[1]);
        const end = m[2] ? Number(m[2]) : wav.length - 1;
        const slice = wav.subarray(start, end + 1);
        route.fulfill({
          status: 206,
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": String(slice.length),
            "Content-Range": `bytes ${start}-${end}/${wav.length}`,
            "Accept-Ranges": "bytes",
          },
          body: slice,
        });
        return;
      }
      route.fulfill({ status: 200, contentType: "audio/wav", headers: { "Accept-Ranges": "bytes", "Content-Length": String(wav.length) }, body: wav });
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/sync") { route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ active: false }) }); return; }
      if (url.pathname.startsWith("/api/queue")) { route.fulfill({ status: 200, contentType: "application/json", body: "[]" }); return; }
      const fixture = fixturePara(url.pathname, mapa);
      if (fixture) { route.fulfill({ status: 200, contentType: "application/json", body: leerFixture(fixture) }); return; }
      route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
      return;
    }
    if (url.origin === baseUrl) { route.continue(); return; }
    route.fulfill({ status: 204, body: "" });
  });
}

/**
 * Semilla de sesión de auditoría: JWT de fixture + usuario edu.
 * @param {import("playwright").Page} page
 */
export async function seedAutenticacion(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("bunker_jwt", "audit-fixture-jwt");
    sessionStorage.setItem("bunker_session_kind", "access_key");
    sessionStorage.setItem("bunker_user", JSON.stringify({ id: "edu", name: "Edu", email: "edu@example.com", role: "user", avatar: null }));
  });
}
