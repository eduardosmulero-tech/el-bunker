// ============================================================
//  EL BÚNKER — workers/routes/r2.js
//  Fallback: servir archivos binarios públicos desde R2
//  GET /:r2_key (sin /api/ prefix)
//
//  FASE D.1 (veredicto V4 Fable S147): gate HMAC para prefijos
//  sensibles `vault/docs/` y `vault/audio/`. Sin token válido → 404
//  (no 401/403: no revelar existencia). El resto de prefijos
//  (music/, vault/photos/, vault/videos/) sigue público sin gate.
//  Si R2_SIGN_SECRET no está configurado, el gate se omite (compat
//  hacia atrás mientras Edu no levante la pausa de deploy).
// ============================================================

import { CORS_HEADERS } from "../config.js";
import { err } from "../utils/response.js";
import { isSensitiveR2Key, verifyR2Read } from "../utils/r2-sign.js";

export default async function handleR2(request, env, path) {
  if (request.method !== "GET") return err("Method not allowed", 405);

  const r2_key = path.slice(1); // quitar / inicial
  if (!r2_key) return err("Not found", 404);

  // FASE D.1: gate HMAC para prefijos sensibles.
  // Si el secret no está configurado (env.R2_SIGN_SECRET vacío), verifyR2Read
  // devuelve false y bloquearía TODO el acceso sensible. Para no romper el
  // arranque mientras Edu no setee el secret, comprobamos su presencia aquí:
  // sin secret → el gate se omite y el comportamiento es el de antes.
  if (env?.R2_SIGN_SECRET && isSensitiveR2Key(r2_key)) {
    const url = new URL(request.url);
    const token = url.searchParams.get("t");
    const ok = await verifyR2Read(r2_key, token, env);
    if (!ok) return err("Not found", 404); // no revela existencia
  }

  const obj = await env.BUNKER.get(r2_key);
  if (!obj) return err("Not found", 404);

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Content-Length": obj.size,
      "Accept-Ranges": "bytes",
      ...CORS_HEADERS,
    },
  });
}
