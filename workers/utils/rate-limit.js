// ============================================================
//  EL BÚNKER — workers/utils/rate-limit.js
//  Rate limiting simple en memoria del isolate:
//   · checkRateLimit      — 10 req/s por IP, todas las rutas /api/ (S113-W)
//   · checkAuthRateLimit  — 10 intentos/min por IP, solo /api/auth/* (ADR-028)
// ============================================================

const RATE_LIMIT = new Map();

export function checkRateLimit(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// ─── Auth: ventana larga, límite bajo ───────────────────────
const AUTH_LIMIT     = new Map();
const AUTH_MAX       = 10;
const AUTH_WINDOW_MS = 60_000;

/** Purga entradas caducadas: el endpoint de auth es blanco de fuerza bruta y el
 *  Map no debe crecer sin límite en un isolate de vida larga. */
function sweepAuthLimit(now) {
  if (AUTH_LIMIT.size < 1000) return;
  for (const [ip, entry] of AUTH_LIMIT) {
    if (now > entry.resetAt) AUTH_LIMIT.delete(ip);
  }
}

export function checkAuthRateLimit(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  sweepAuthLimit(now);
  const entry = AUTH_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    AUTH_LIMIT.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return true;
  }
  if (entry.count >= AUTH_MAX) return false;
  entry.count++;
  return true;
}
