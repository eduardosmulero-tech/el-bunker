// ============================================================
//  EL BÚNKER — workers/utils/response.js
//  Helpers para generar Responses JSON
// ============================================================

import { CORS_HEADERS } from "../config.js";

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json", ...extraHeaders },
  });
}

export function err(message, status = 500) {
  return json({ error: message }, status);
}
