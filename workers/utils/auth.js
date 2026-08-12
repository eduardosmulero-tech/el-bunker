// ============================================================
//  EL BÚNKER — workers/utils/auth.js
//  JWT sign/verify + authenticate middleware
// ============================================================

import { JWT_EXPIRY } from "../config.js";

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

export async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY
  })));
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC", key,
    enc.encode(`${headerB64}.${payloadB64}`)
  );
  return `${headerB64}.${payloadB64}.${base64url(sig)}`;
}

export async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["verify"]
    );
    const ok = await crypto.subtle.verify(
      "HMAC", key,
      base64urlDecode(parts[2]),
      enc.encode(`${parts[0]}.${parts[1]}`)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ADR-031 — frescura del token: todo JWT emitido lleva el claim `epoch` con el
// contador users.token_epoch vigente en la firma. Un token solo vale mientras su
// epoch coincida con el del usuario en D1: revocar = incrementar el contador.
// Un token sin el claim `epoch` (emitido antes del despliegue de ADR-031) nunca
// coincide con un entero y queda rechazado: desplegar esta versión mata las
// sesiones previas, que es el comportamiento de una rotación implícita.
async function checkEpochFreshness(env, payload) {
  if (!payload?.sub) return false;
  const row = await env.DB.prepare(
    "SELECT token_epoch FROM users WHERE id = ?1"
  ).bind(payload.sub).first();
  if (!row) return false;
  return row.token_epoch === payload.epoch;
}

export async function authenticate(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  let secret = env.JWT_SECRET;
  if (!secret) {
    if (env.ENVIRONMENT === "production") {
      console.error("[Búnker] ⛔ JWT_SECRET no configurado en producción");
      return null;
    }
    secret = "dev-secret-change-me";
  }
  const payload = await verifyJWT(auth.slice(7), secret);
  if (!payload) return null;
  if (!(await checkEpochFreshness(env, payload))) return null;
  return payload.sub;
}
