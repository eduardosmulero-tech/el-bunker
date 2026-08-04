// ============================================================
//  EL BÚNKER — workers/routes/eras.js
//  CRUD /api/eras (auth required)
// ============================================================

import { json, err } from "../utils/response.js";
import { isAdmin } from "../utils/authorization.js";

export default async function handleEras(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // GET /api/eras
  if (method === "GET" && path === "/api/eras") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM eras ORDER BY sort_order, created_at"
    ).all();
    if (results.length) {
      const eraIds = results.map(e => e.id);
      const BATCH = 100;
      const countMap = {};
      for (let i = 0; i < eraIds.length; i += BATCH) {
        const batch = eraIds.slice(i, i + BATCH);
        const placeholders = batch.map(() => "?").join(",");
        const { results: counts } = await env.DB.prepare(
          `SELECT era_id, COUNT(*) as entry_count FROM entries WHERE is_deleted = 0 AND era_id IN (${placeholders}) GROUP BY era_id`
        ).bind(...batch).all();
        for (const row of counts) countMap[row.era_id] = row.entry_count;
      }
      for (const era of results) era.entry_count = countMap[era.id] || 0;
    }
    return json(results);
  }

  // GET /api/eras/:id
  if (method === "GET" && path.startsWith("/api/eras/")) {
    const eraId = path.split("/")[3];
    if (!eraId) return err("era id required", 400);
    const era = await env.DB.prepare("SELECT * FROM eras WHERE id = ?1").bind(eraId).first();
    if (!era) return err("Era not found", 404);
    const { count } = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM entries WHERE era_id = ?1 AND is_deleted = 0"
    ).bind(eraId).first();
    era.entry_count = count || 0;
    return json(era);
  }

  // POST /api/eras
  if (method === "POST" && path === "/api/eras") {
    const body = await request.json();
    if (!body.name) return err("name required", 400);
    if (body.owner_id && body.owner_id !== userId) return err("Forbidden — owner mismatch", 403);
    const id = body.id || crypto.randomUUID();
    const now = body.created_at || new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO eras (id, name, description, start_date, end_date, color, cover_image, sort_order, created_at, updated_at)
       SELECT ?1,?2,?3,?4,?5,?6,?7, COALESCE(MAX(sort_order), -1) + 1, ?8, ?8 FROM eras`
    ).bind(id, body.name, body.description || "", body.start_date || null, body.end_date || null,
           body.color || "#bfff00", body.cover_image || null, now).run();
    if (body.sort_order != null) {
      await env.DB.prepare("UPDATE eras SET sort_order = ?1 WHERE id = ?2").bind(body.sort_order, id).run();
    }
    const created = await env.DB.prepare("SELECT sort_order FROM eras WHERE id = ?1").bind(id).first();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'era',?3,?4)"
    ).bind("era_created", userId, id, JSON.stringify({ name: body.name })).run();
    return json({ id, ...body, sort_order: created?.sort_order ?? 0 }, 201);
  }

  // PATCH /api/eras/:id
  if (method === "PATCH" && path.startsWith("/api/eras/")) {
    const ERA_FIELDS = new Set(["name", "description", "start_date", "end_date", "color", "cover_image", "sort_order"]);
    const eraId = path.split("/")[3];
    const exists = await env.DB.prepare("SELECT id FROM eras WHERE id = ?1").bind(eraId).first();
    if (!exists) return err("Era not found", 404);
    const body = await request.json();
    const sets = []; const binds = [];
    for (const [k, v] of Object.entries(body)) {
      if (!ERA_FIELDS.has(k)) continue;
      sets.push(`${k} = ?${sets.length + 1}`);
      binds.push(v);
    }
    if (!sets.length) return err("No fields to update", 400);
    binds.push(eraId);
    sets.push("updated_at = datetime('now')");
    await env.DB.prepare(`UPDATE eras SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'era',?3,?4)"
    ).bind("era_updated", userId, eraId, JSON.stringify(body)).run();
    return json({ id: eraId, ...body });
  }

  // DELETE /api/eras/:id
  if (method === "DELETE" && path.startsWith("/api/eras/")) {
    const eraId = path.split("/")[3];
    const exists = await env.DB.prepare("SELECT id FROM eras WHERE id = ?1").bind(eraId).first();
    if (!exists) return err("Era not found", 404);
    if (!isAdmin(userId)) return err("Forbidden — only admin can delete eras", 403);
    const { count } = await env.DB.prepare("SELECT COUNT(*) AS count FROM entries WHERE era_id = ?1 AND is_deleted = 0").bind(eraId).first();
    if (Number(count) > 0) return err("Era has active entries; archive or move them first", 409);
    await env.DB.prepare("UPDATE entries SET era_id = NULL WHERE era_id = ?1").bind(eraId).run();
    await env.DB.prepare("DELETE FROM eras WHERE id = ?1").bind(eraId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'era',?3)"
    ).bind("era_deleted", userId, eraId).run();
    return json({ ok: true, id: eraId });
  }

  return err("Not found", 404);
}
