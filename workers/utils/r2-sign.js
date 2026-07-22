// ============================================================
//  EL BÚNKER — workers/utils/r2-sign.js
//  FASE D.1 (veredicto V4 Fable S147): firma HMAC de URLs de
//  lectura R2 para los prefijos sensibles vault/docs/ y vault/audio/.
//  TTL reutiliza JWT_EXPIRY (config.js). Secret: R2_SIGN_SECRET en env.
//  Sin secret configurado → el helper devuelve null y el gate deja
//  pasar como antes (no bloquea el arranque si falta el secret; Edu
//  lo setea con `wrangler secret put R2_SIGN_SECRET` al levantar la pausa).
// ============================================================

import { JWT_EXPIRY } from "../config.js";

// Prefijos que exigen token HMAC para lectura (V4: solo estos 2).
export const SENSITIVE_R2_PREFIXES = ["vault/docs/", "vault/audio/"];

export const isSensitiveR2Key = (r2_key) =>
  typeof r2_key === "string" && SENSITIVE_R2_PREFIXES.some((p) => r2_key.startsWith(p));

// TTL de los tokens de lectura R2 = JWT_EXPIRY (24h en segundos).
// Convertido a milisegundos para el timestamp de expiración.
export const R2_SIGN_TTL_MS = JWT_EXPIRY * 1000;

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// Deriva una CryptoKey HMAC-SHA256 a partir del secret (cacheada por secret).
let _cachedKey = null;
let _cachedSecret = null;
async function getHmacKey(secret) {
  if (_cachedKey && _cachedSecret === secret) return _cachedKey;
  const enc = new TextEncoder();
  _cachedKey = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign", "verify"]
  );
  _cachedSecret = secret;
  return _cachedKey;
}

/**
 * signR2Read(r2_key, env)
 * Genera un token HMAC firmado para leer `r2_key` desde R2.
 * Input del HMAC: `${r2_key}|${expiresAt}` (separador "|" evita ambigüedad).
 * Token = base64url(expiresAt) + "." + base64url(hmac).
 *
 * @returns {{ token: string, expiresAt: number } | null}
 *   null si no hay R2_SIGN_SECRET configurado (gate se omite).
 */
export async function signR2Read(r2_key, env) {
  const secret = env?.R2_SIGN_SECRET;
  if (!secret) return null;
  const expiresAt = Date.now() + R2_SIGN_TTL_MS;
  const enc = new TextEncoder();
  const payload = `${r2_key}|${expiresAt}`;
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return { token: `${base64url(enc.encode(String(expiresAt)))}.${base64url(sig)}`, expiresAt };
}

/**
 * verifyR2Read(r2_key, token, env)
 * Verifica un token HMAC de lectura R2 para `r2_key`.
 * Comprueba: formato, expiración, firma HMAC contra el mismo input.
 *
 * @returns {boolean} true si el token es válido y no ha expirado.
 *   false si: no hay secret, formato inválido, expirado, o firma no coincide.
 *   En todos los casos false, el caller DEBE responder 404 (no 401/403)
 *   para no revelar la existencia del recurso (V4).
 */
export async function verifyR2Read(r2_key, token, env) {
  const secret = env?.R2_SIGN_SECRET;
  if (!secret) return false;
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  let expiresAt;
  try {
    expiresAt = Number(new TextDecoder().decode(base64urlDecode(parts[0])));
  } catch {
    return false;
  }
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const enc = new TextEncoder();
  const payload = `${r2_key}|${expiresAt}`;
  const key = await getHmacKey(secret);
  try {
    return await crypto.subtle.verify(
      "HMAC", key,
      base64urlDecode(parts[1]),
      enc.encode(payload)
    );
  } catch {
    return false;
  }
}
