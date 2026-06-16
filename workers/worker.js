// ============================================================
//  EL BÚNKER — worker.js
//  Cloudflare Workers · Router delegado (S114-W refactor)
//  Bindings: DB (D1), BUNKER (R2)
// ============================================================

import { CORS_HEADERS } from "./config.js";
import { json, err } from "./utils/response.js";
import { authenticate } from "./utils/auth.js";
import { checkRateLimit } from "./utils/rate-limit.js";

import handleHealth from "./routes/health.js";
import handleAuth from "./routes/auth.js";
import handleTracks from "./routes/tracks.js";
import handleDrops from "./routes/drops.js";
import handlePlaylists from "./routes/playlists.js";
import handleTags from "./routes/tags.js";
import handleEntries from "./routes/entries.js";
import handleEras from "./routes/eras.js";
import handleFiles from "./routes/files.js";
import handleQueue from "./routes/queue.js";
import handleEvents from "./routes/events.js";
import handleCapsules from "./routes/capsules.js";
import handleUpload from "./routes/upload.js";
import handleR2 from "./routes/r2.js";

// Mapa de rutas: [prefix, handler, requiresAuth]
const ROUTES = [
  ["/api/health",          handleHealth,     false],
  ["/api/auth",            handleAuth,       false],
  ["/api/tracks",          handleTracks,     true],
  ["/api/drops",           handleDrops,      true],
  ["/api/playlists",       handlePlaylists,  true],
  ["/api/tags",            handleTags,       false],  // GET público, POST/PATCH/DELETE auth en handler
  ["/api/entries",         handleEntries,    true],
  ["/api/eras",            handleEras,       true],
  ["/api/files",           handleFiles,      true],
  ["/api/queue",           handleQueue,      true],
  ["/api/events",          handleEvents,     true],
  ["/api/time_capsules",   handleCapsules,   true],
  ["/api/upload",          handleUpload,     true],
];

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Rate limit (solo para endpoints /api/ — R2 binario va antes, sin límite)
    const url = new URL(request.url);
    const path = url.pathname;

    // R2 binary serving (público, sin /api/ prefix) — SIN rate limit
    if (!path.startsWith("/api/")) {
      try { return await handleR2(request, env, path); }
      catch (e) { return err(e.message || "R2 error", 500); }
    }

    if (!checkRateLimit(request)) return err("Too many requests", 429);

    // Autenticar (se aplica en el dispatcher para rutas que lo requieran)
    const userId = await authenticate(request, env);

    // Despachar a la ruta correcta
    for (const [prefix, handler, requiresAuth] of ROUTES) {
      if (path.startsWith(prefix)) {
        if (requiresAuth && !userId) return err("Unauthorized", 401);
        try {
          return await handler(request, env, url, userId);
        } catch (e) {
          console.error(`[Búnker Worker] ${prefix}:`, e);
          return err(e.message || "Internal server error", 500);
        }
      }
    }

    return err("Not found", 404);
  },
};
