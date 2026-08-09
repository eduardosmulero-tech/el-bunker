// ============================================================
//  EL BÚNKER — workers/routes/session.js
//  POST /api/session/visit — Modo Visita (ADR-029 / A2)
//  · Encender: cualquier sesión autenticada, sin clave → JWT con visit:true
//  · Apagar:   solo quien tenga la clave de acceso (ADR-028) → JWT sin el claim
//  El claim vive en el JWT (diseño Modo Visita §5): sobrevive a la recarga.
//  Reutiliza el emisor de tokens de ADR-028 (issueToken de auth.js) y el
//  rate limit de auth (10 intentos/min). authenticate() NO se toca.
// ============================================================

import { err } from "../utils/response.js";
import { checkAuthRateLimit } from "../utils/rate-limit.js";
import { emitEvent } from "../utils/events.js";
import {
  resolveAccessKey,
  hasAccessKeysConfigured,
  MIN_KEY_LENGTH,
} from "../utils/access-keys.js";
import { issueToken, loadUser } from "./auth.js";

/** Bearer token de la cabecera Authorization, o null. */
function bearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/** Payload del JWT. El dispatcher ya verificó la firma (authenticate); aquí solo
 *  se lee el claim `visit` y el email de respaldo. Nunca es fuente de identidad. */
function decodeJwtPayload(token) {
  try {
    const b64 = (token.split(".")[1] || "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const text = new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    );
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function ipOf(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export default async function handleSession(request, env, url, userId) {
  if (!userId) return err("Unauthorized", 401);
  if (request.method !== "POST") return err("Method not allowed", 405);
  if (url.pathname !== "/api/session/visit") return err("Not found", 404);
  if (!checkAuthRateLimit(request)) return err("Too many auth attempts", 429);

  const rawBody = await request.text();
  let body = {};
  if (rawBody) {
    try { body = JSON.parse(rawBody); }
    catch { return err("Invalid JSON body", 400); }
  }

  const key = body?.access_key;
  const ua = (request.headers.get("User-Agent") || "").slice(0, 200);

  // ── Apagar: exige clave de acceso (ADR-028) ──────────────────────
  if (key !== undefined && key !== null && key !== "") {
    if (typeof key !== "string" || key.length < MIN_KEY_LENGTH) {
      return err("Invalid access key", 401);
    }
    if (!hasAccessKeysConfigured(env)) {
      console.error("[session] ⛔ ninguna ACCESS_KEY configurada en el worker");
      return err("Access key auth not configured", 503);
    }
    const keyUser = await resolveAccessKey(key, env);
    if (!keyUser) return err("Invalid access key", 401);
    const user = await loadUser(env, keyUser);
    if (!user) return err("Access key user missing in D1", 500);

    await emitEvent(env, "visit_mode_off", keyUser, "session", null, {
      ip: ipOf(request),
      ua,
    });
    return issueToken(env, request, user, "visit_off");
  }

  // ── Encender: cualquier sesión autenticada, sin clave ─────────────
  const payload = decodeJwtPayload(bearerToken(request));
  if (payload?.visit === true) {
    // El claim ya está encendido: apagar sin clave no está permitido.
    return err("Access key required to disable visit mode", 401);
  }

  const user =
    (await loadUser(env, userId)) ??
    { id: userId, email: payload?.email || "unknown", name: userId, role: "user" };

  await emitEvent(env, "visit_mode_on", userId, "session", null, {
    ip: ipOf(request),
    ua,
  });
  return issueToken(env, request, user, "visit_on", { visit: true });
}
