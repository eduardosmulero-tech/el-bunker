// ============================================================
//  EL BÚNKER — workers/routes/config.js
//  GET /api/config — Devuelve app_config (adventures_start_date, etc.)
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleConfig(request, env) {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT key, value FROM app_config"
    ).all();
    const config = {};
    for (const row of results) {
      config[row.key] = row.value;
    }
    return json(config);
  }
  return err("Method not allowed", 405);
}
