// ============================================================
//  EL BÚNKER — workers/routes/r2.js
//  Fallback: servir archivos binarios públicos desde R2
//  GET /:r2_key (sin auth, sin /api/ prefix)
// ============================================================

import { CORS_HEADERS } from "../config.js";
import { err } from "../utils/response.js";

export default async function handleR2(request, env, path) {
  if (request.method !== "GET") return err("Method not allowed", 405);

  const r2_key = path.slice(1); // quitar / inicial
  if (!r2_key) return err("Not found", 404);

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
