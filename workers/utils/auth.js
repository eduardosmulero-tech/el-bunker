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
    return payload.sub;
  } catch { return null; }
}

export async function authenticate(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const secret = env.JWT_SECRET;
  if (!secret) {
    if (env.ENVIRONMENT === "production") {
      console.error("[Búnker] ⛔ JWT_SECRET no configurado en producción");
      return null;
    }
    return verifyJWT(auth.slice(7), "dev-secret-change-me");
  }
  return verifyJWT(auth.slice(7), secret);
}
