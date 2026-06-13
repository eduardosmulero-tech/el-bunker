// ============================================================
//  EL BÚNKER — sw.js
//  Service Worker · PWA · Offline Support
//  Estrategia: Cache-First para assets / Network-First para API
//  Version: 1.0.0
// ============================================================

const SW_VERSION    = self.__BUNKER_SW_VERSION__ ?? "dev";
const CACHE_NAME    = `bunker-${SW_VERSION}`;
const RUNTIME_CACHE = `bunker-runtime-${SW_VERSION}`;

// ── Assets to pre-cache on install ───────────────────────────
// These are the critical shell files for offline use.
// Vite generates hashed filenames — add your build output paths here.
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Vite output — update after each build if not using Workbox:
  // "/assets/index-HASH.js",
  // "/assets/index-HASH.css",
];

// ── Google APIs — never cache, always network ────────────────
const BYPASS_PATTERNS = [
  /googleapis\.com/,
  /accounts\.google\.com/,
  /gstatic\.com/,
  /chrome-extension/,
];

// ─── INSTALL ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[Búnker SW] Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Búnker SW] Pre-caching shell assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Activate immediately — don't wait for old SW to die
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn("[Búnker SW] Pre-cache partial failure:", err);
        // Don't block install on individual asset failures
      })
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[Búnker SW] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((stale) => {
              console.log("[Búnker SW] Deleting stale cache:", stale);
              return caches.delete(stale);
            })
        )
      )
      .then(() => {
        // Take control of all open clients immediately
        return self.clients.claim();
      })
  );
});

// ─── FETCH ───────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url         = new URL(request.url);

  // ── 1. Skip non-GET requests ──────────────────────────────
  if (request.method !== "GET") return;

  // ── 2. Skip Google APIs — always go to network ───────────
  if (BYPASS_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return; // browser handles normally
  }

  // ── 3. HTML navigation → Network-First with cache fallback
  //       Ensures users always get fresh app shell if online.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithFallback(request, "/index.html"));
    return;
  }

  // ── 3.5. R2 Audio (búnker R2 proxy /music/*) → Cache-First (Fase 1.3 — P1)
  //       Audio MP3 servido desde caché local si ya fue reproducido antes.
  //       Sin caché → network + cache para siguiente reproducción.
  if (url.hostname === "el-bunker-r2-proxy.thebunker-admin.workers.dev" && url.pathname.startsWith("/music/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── 4. Same-origin assets (JS, CSS, images) → Cache-First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── 5. External resources (fonts, CDNs) → Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ─── STRATEGIES ──────────────────────────────────────────────

/**
 * Cache-First
 * Return from cache if available; fetch + cache on miss.
 * Best for versioned/hashed assets that never change.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return a minimal offline page
    return offlineFallback(request);
  }
}

/**
 * Network-First with Cache Fallback
 * Try network; on failure, return cached version.
 * Best for HTML documents.
 */
async function networkFirstWithFallback(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request) || await caches.match(fallbackUrl);
    if (cached) return cached;
    return offlineFallback(request);
  }
}

/**
 * Stale-While-Revalidate
 * Return cache immediately; fetch update in background.
 * Best for fonts, external CDN assets.
 */
async function staleWhileRevalidate(request) {
  const cache  = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise || offlineFallback(request);
}

/**
 * offlineFallback(request)
 * Minimal response for uncached resources when offline.
 */
function offlineFallback(request) {
  // For image requests, return a transparent 1x1 pixel SVG
  if (request.destination === "image") {
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`,
      { headers: { "Content-Type": "image/svg+xml" } }
    );
  }

  // For everything else, return a styled offline page
  return new Response(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>El Búnker — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #050505;
      color: #bfff00;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 24px;
      padding: 32px;
    }
    .heart { font-size: 48px; animation: pulse 1.8s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
    h1 { font-size: 14px; letter-spacing: 0.4em; text-transform: uppercase; text-shadow: 0 0 12px #bfff00; }
    p  { font-size: 11px; letter-spacing: 0.2em; opacity: 0.4; text-transform: uppercase; text-align: center; }
    .scanlines {
      position: fixed; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.2) 2px, rgba(0,0,0,.2) 4px);
      mix-blend-mode: overlay;
    }
  </style>
</head>
<body>
  <div class="scanlines"></div>
  <div class="heart">♥</div>
  <h1>El Búnker</h1>
  <p>Sin conexión · Los datos están seguros</p>
  <p>Reconéctate para sincronizar</p>
</body>
</html>`,
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

// ─── BACKGROUND SYNC (future-proofing) ───────────────────────
// If the browser supports Background Sync, queue failed DB writes
// and replay them when connectivity is restored.
self.addEventListener("sync", (event) => {
  if (event.tag === "bunker-db-sync") {
    console.log("[Búnker SW] Background sync triggered: bunker-db-sync");
    // Drive API calls happen in the main thread via gapi;
    // this tag signals the app to retry pending writes.
    event.waitUntil(
      self.clients
        .matchAll({ includeUncontrolled: true, type: "window" })
        .then((clients) =>
          clients.forEach((client) =>
            client.postMessage({ type: "BUNKER_SYNC_READY" })
          )
        )
    );
  }
});

// ─── PUSH NOTIFICATIONS (stub) ───────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "El Búnker", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: "bunker-push",
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};
  // Fase 2.4 M8: Abrir en Music Lab si la notificación es de música
  let targetUrl = data.url ?? "/";
  if (data.tab === "music") {
    targetUrl = `/?tab=music`;
  } else if (data.url && !data.url.includes("?tab=") && data.tab) {
    targetUrl = `${data.url}?tab=${data.tab}`;
  }
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(targetUrl) || c.url === targetUrl);
        if (existing) {
          existing.postMessage({ type: "BUNKER_NAVIGATE", tab: data.tab ?? "vault" });
          return existing.focus();
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

console.log("[Búnker SW] Script loaded ✓");
