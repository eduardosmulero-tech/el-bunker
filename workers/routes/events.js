// ============================================================
//  EL BÚNKER — workers/routes/events.js
//  GET/POST /api/events (auth required, ADR-019)
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleEvents(request, env, url, userId) {
  const method = request.method;

  if (!userId) return err("Unauthorized", 401);

  // POST /api/events
  if (method === "POST" && url.pathname === "/api/events") {
    const body = await request.json().catch(() => null);
    if (!body) return err("Invalid JSON body", 400);
    const payload = JSON.stringify(body.payload || {});
    if (payload.length > 4096) return err("Payload too large (max 4KB)", 413);
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,?3,?4,?5)"
    ).bind(body.event_type, userId, body.entity_type || null, body.entity_id || null, payload).run();
    return json({ ok: true, event_type: body.event_type }, 201);
  }

  // GET /api/events
  if (method === "GET" && url.pathname === "/api/events") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
    const type = url.searchParams.get("type");
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");
    let q = "SELECT * FROM events WHERE 1=1";
    const binds = [];
    if (type) {
      q += " AND event_type = ?1";
      binds.push(type);
    } else {
      // ADR-028: la auditoría de login no es feed. Solo sale si se pide por ?type=.
      q += " AND event_type NOT LIKE 'auth\\_%' ESCAPE '\\'";
    }
    if (since) { q += ` AND created_at >= ?${binds.length + 1}`; binds.push(since); }
    if (until) { q += ` AND created_at <= ?${binds.length + 1}`; binds.push(until); }
    q += ` ORDER BY created_at DESC LIMIT ?${binds.length + 1}`;
    binds.push(limit);
    const { results } = await env.DB.prepare(q).bind(...binds).all();
    return json(results);
  }

  return err("Not found", 404);
}
