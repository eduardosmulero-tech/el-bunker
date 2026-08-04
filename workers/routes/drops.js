// ============================================================
//  EL BÚNKER — workers/routes/drops.js
//  CRUD /api/drops (auth required)
// ============================================================

import { json, err } from "../utils/response.js";
import { canManageParticipant } from "../utils/authorization.js";
import { isValidUserId } from "../utils/validation.js";

export default async function handleDrops(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // GET /api/drops
  if (method === "GET" && path === "/api/drops") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM drops ORDER BY created_at DESC LIMIT 200"
    ).all();
    const mapped = results.map(r => ({ ...r, from: r.from_user, to: r.to_user }));
    return json(mapped);
  }

  // POST /api/drops
  if (method === "POST" && path === "/api/drops") {
    const body = await request.json().catch(() => null);
    if (!body) return err("Invalid JSON body", 400);
    const toUser = body.to_user || userId;
    if (!isValidUserId(toUser)) return err("Invalid to_user: must be admin, edu or david", 400);
    const id = body.id || crypto.randomUUID();
    const now = body.created_at || new Date().toISOString();
    const fromUser = userId;
    await env.DB.prepare(
      `INSERT INTO drops (id, era_id, track_id, from_user, to_user, drop_date, memory, mood, favorited, favorited_by, created_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`
    ).bind(id, body.era_id || null, body.track_id || null, fromUser, toUser,
           body.drop_date || null, body.memory || "", body.mood || "",
           body.favorited ? 1 : 0, body.favorited ? userId : null, now).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'drop',?3,?4)"
    ).bind("drop_sent", userId, id, JSON.stringify({ to_user: toUser, track_id: body.track_id })).run();
    return json({ id, ...body, from_user: userId }, 201);
  }

  // PATCH /api/drops/:id
  if (method === "PATCH" && path.startsWith("/api/drops/")) {
    const dropId = path.split("/")[3];
    if (!dropId) return err("drop id required", 400);
    const owner = await env.DB.prepare("SELECT from_user, to_user FROM drops WHERE id = ?1").bind(dropId).first();
    if (!owner) return err("Drop not found", 404);
    if (!canManageParticipant(userId, [owner.from_user, owner.to_user])) return err("Forbidden", 403);
    const DROP_FIELDS = new Set(["seen", "favorited", "memory", "mood"]);
    const body = await request.json().catch(() => ({}));
    const sets = []; const binds = [];
    for (const [k, v] of Object.entries(body)) {
      if (!DROP_FIELDS.has(k)) continue;
      if (k === "seen" || k === "favorited") {
        sets.push(`${k} = ?${sets.length + 1}`);
        binds.push(v ? 1 : 0);
      } else {
        sets.push(`${k} = ?${sets.length + 1}`);
        binds.push(v);
      }
    }
    if (!sets.length) return err("No fields to update", 400);
    const exists = await env.DB.prepare("SELECT id FROM drops WHERE id = ?1").bind(dropId).first();
    if (!exists) return err("Drop not found", 404);
    binds.push(dropId);
    await env.DB.prepare(`UPDATE drops SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
    if (body.favorited) {
      await env.DB.prepare("UPDATE drops SET favorited_by = ?1 WHERE id = ?2").bind(userId, dropId).run();
    } else if (body.favorited === false) {
      await env.DB.prepare("UPDATE drops SET favorited_by = NULL WHERE id = ?1").bind(dropId).run();
    }
    return json({ ok: true, id: dropId });
  }

  // DELETE /api/drops/:id
  if (method === "DELETE" && path.startsWith("/api/drops/")) {
    const dropId = path.split("/")[3];
    const owner = await env.DB.prepare("SELECT from_user, to_user FROM drops WHERE id = ?1").bind(dropId).first();
    if (!owner) return err("Drop not found", 404);
    if (!canManageParticipant(userId, [owner.from_user, owner.to_user])) return err("Forbidden", 403);
    await env.DB.prepare("DELETE FROM drops WHERE id = ?1").bind(dropId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'drop',?3)"
    ).bind("drop_deleted", userId, dropId).run();
    return json({ ok: true, id: dropId });
  }

  return err("Not found", 404);
}
