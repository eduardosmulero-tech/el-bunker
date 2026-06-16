// ============================================================
//  EL BÚNKER — workers/utils/rate-limit.js
//  Rate limiting simple: 10 req/s por IP (S113-W)
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
