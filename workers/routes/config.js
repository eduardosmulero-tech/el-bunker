// ============================================================
//  EL BÚNKER — workers/routes/config.js
//  GET /api/config — Devuelve app_config (adventures_start_date, etc.)
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleConfig(request, env) {
  if (request.method === "GET") {
    // Whitelist: solo devolvemos claves no sensibles.
    // presence_edu / presence_david viajan exclusivamente por /api/sync (auth).
    const WHITELIST = ["schema_version", "adventures_start_date"];
    const placeholders = WHITELIST.map(() => "?").join(", ");
    const { results } = await env.DB.prepare(
      `SELECT key, value FROM app_config WHERE key IN (${placeholders})`
    ).bind(...WHITELIST).all();
    const config = {};
    for (const row of results) {
      config[row.key] = row.value;
    }
    return json(config);
  }
  return err("Method not allowed", 405);
}
