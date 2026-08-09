// ============================================================
//  EL BÚNKER — workers/routes/auth.js
//  POST /api/auth/login — Google token → JWT       (Edu y David)
//  POST /api/auth/token — clave de acceso → JWT    (ADR-028: agente y Edu)
//  Emisor único de JWT. authenticate() NO se toca.
// ============================================================

import { WHITELIST } from "../config.js";
import { json, err } from "../utils/response.js";
import { signJWT } from "../utils/auth.js";
import { emitEvent } from "../utils/events.js";
import { checkAuthRateLimit } from "../utils/rate-limit.js";
import {
  resolveAccessKey,
  hasAccessKeysConfigured,
  MIN_KEY_LENGTH,
} from "../utils/access-keys.js";

/** Usuario completo desde D1 — fuente única de identidad (schema.sql: tabla users).
 *  Exportado para session.js (A2): el Modo Visita reutiliza el emisor de ADR-028. */
export async function loadUser(env, userId) {
  return env.DB.prepare(
    "SELECT id, email, name, role FROM users WHERE id = ?1"
  ).bind(userId).first();
}

/** Firma el JWT y registra la emisión en events (ADR-019). Único punto de firma.
 *  Exportado para session.js (A2): extraClaims permite añadir el claim `visit`
 *  (diseño Modo Visita §5). Los emisores de login/token no cambian ({} por defecto). */
export async function issueToken(env, request, user, method, extraClaims = {}) {
  const secret = env.JWT_SECRET;
  if (!secret && env.ENVIRONMENT === "production") {
    return err("JWT_SECRET not configured", 500);
  }
  const token = await signJWT(
    { sub: user.id, email: user.email, method, ...extraClaims },
    secret || "dev-secret-change-me"
  );
  await emitEvent(env, "auth_login", user.id, "session", null, {
    method,
    ip: request.headers.get("CF-Connecting-IP") || "unknown",
    ua: (request.headers.get("User-Agent") || "").slice(0, 200),
  });
  return json({ token, user, ...extraClaims });
}

/** POST /api/auth/login — OAuth2 de Google. Flujo de David: sin cambios. */
async function handleGoogleLogin(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.google_token) {
    return err("email and google_token required", 400);
  }

  const gRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(body.google_token)}`
  );
  if (!gRes.ok) return err("Invalid Google token", 401);

  const gData = await gRes.json();
  const verifiedEmail = gData.email?.toLowerCase();
  const userId = WHITELIST[verifiedEmail];
  if (!userId) return err("Email not authorized", 403);

  const user =
    (await loadUser(env, userId)) ??
    { id: userId, email: verifiedEmail, name: userId, role: "user" };
  return issueToken(env, request, user, "google");
}

/** POST /api/auth/token — clave de acceso test/admin (ADR-028). */
async function handleAccessKeyLogin(request, env) {
  const body = await request.json().catch(() => null);
  const key = body?.key;
  if (typeof key !== "string" || key.length < MIN_KEY_LENGTH) {
    return err("key required", 400);
  }
  if (!hasAccessKeysConfigured(env)) {
    console.error("[auth] ⛔ ninguna ACCESS_KEY configurada en el worker");
    return err("Access key auth not configured", 503);
  }

  const userId = await resolveAccessKey(key, env);
  if (!userId) {
    // Los fallos no van a events: events.user_id tiene FK a users y aquí no hay usuario.
    console.warn("[auth] clave de acceso rechazada", {
      ip: request.headers.get("CF-Connecting-IP") || "unknown",
    });
    return err("Invalid access key", 401);
  }

  const user = await loadUser(env, userId);
  if (!user) return err("Access key user missing in D1", 500);
  return issueToken(env, request, user, "access_key");
}

export default async function handleAuth(request, env, url, _userId) {
  if (request.method !== "POST") return err("Method not allowed", 405);
  if (!checkAuthRateLimit(request)) return err("Too many auth attempts", 429);

  if (url.pathname === "/api/auth/token") return handleAccessKeyLogin(request, env);
  if (url.pathname === "/api/auth/login") return handleGoogleLogin(request, env);
  return err("Not found", 404);
}
