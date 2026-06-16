// ============================================================
//  EL BÚNKER — workers/routes/capsules.js
//  GET/POST/PATCH /api/time_capsules (auth required, ADR-020)
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleCapsules(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // GET /api/time_capsules
  if (method === "GET" && path === "/api/time_capsules") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM time_capsules ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json(results);
  }

  // POST /api/time_capsules
  if (method === "POST" && path === "/api/time_capsules") {
    const body = await request.json().catch(() => null);
    if (!body?.title || !body?.unlock_at) return err("title and unlock_at required", 400);
    if (new Date(body.unlock_at) <= new Date()) return err("unlock_at must be in the future", 400);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO time_capsules (id, title, description, unlock_at, created_by)
       VALUES (?1,?2,?3,?4,?5)`
    ).bind(id, body.title, body.description || "", body.unlock_at, userId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'time_capsule',?3,?4)"
    ).bind("capsule_created", userId, id, JSON.stringify({ title: body.title })).run();
    return json({ id, title: body.title, unlock_at: body.unlock_at, created_by: userId }, 201);
  }

  // PATCH /api/time_capsules/:id
  if (method === "PATCH" && path.startsWith("/api/time_capsules/")) {
    const capsuleId = path.split("/")[3];
    const body = await request.json().catch(() => null);
    if (body?.is_unlocked) {
      await env.DB.prepare(
        "UPDATE time_capsules SET is_unlocked = 1, unlocked_at = datetime('now') WHERE id = ?1"
      ).bind(capsuleId).run();
      await env.DB.prepare(
        "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'time_capsule',?3,?4)"
      ).bind("capsule_unlocked", userId, capsuleId, JSON.stringify({ title: "desbloqueado" })).run();
    }
    return json({ ok: true, id: capsuleId });
  }

  return err("Not found", 404);
}
