// ============================================================
//  EL BÚNKER — workers/routes/health.js
//  GET /api/health — público, sin auth
// ============================================================

import { json } from "../utils/response.js";

export default async function handleHealth(env, userId) {
  const dbOk = await env.DB.prepare("SELECT 1 as ok").first();
  return json({
    status: "ok",
    db: !!dbOk,
    auth: !!userId,
    timestamp: new Date().toISOString(),
  });
}
