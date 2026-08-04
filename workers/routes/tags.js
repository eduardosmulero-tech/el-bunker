// ============================================================
//  EL BÚNKER — workers/routes/tags.js
//  CRUD /api/tags (GET público, POST/PATCH/DELETE requieren auth)
// ============================================================

import { json, err } from "../utils/response.js";
import { isAdmin } from "../utils/authorization.js";

export default async function handleTags(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  // GET /api/tags
  if (method === "GET" && path === "/api/tags") {
    const ns = url.searchParams.get("namespace");
    const query = ns
      ? "SELECT * FROM tags WHERE namespace = ?1 ORDER BY sort_order"
      : "SELECT * FROM tags ORDER BY namespace, sort_order";
    const { results } = ns
      ? await env.DB.prepare(query).bind(ns).all()
      : await env.DB.prepare(query).all();
    return json(results);
  }

  // POST /api/tags
  if (method === "POST" && path === "/api/tags") {
    if (!userId) return err("Unauthorized", 401);
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    await env.DB.prepare(
      "INSERT OR IGNORE INTO tags (id, namespace, label, icon, color, created_by) VALUES (?1,?2,?3,?4,?5,?6)"
    ).bind(id, body.namespace || "music", body.label, body.icon || "◈", body.color || "#ffffff", userId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'tag',?3,?4)"
    ).bind("tag_created", userId, id, JSON.stringify({ label: body.label, namespace: body.namespace })).run();
    return json({ id, ...body, created_by: userId }, 201);
  }

  // PATCH /api/tags/:id
  if (method === "PATCH" && path.startsWith("/api/tags/")) {
    if (!userId) return err("Unauthorized", 401);
    const TAG_FIELDS = new Set(["label", "icon", "color", "sort_order", "namespace"]);
    const tagId = path.split("/")[3];
    const body = await request.json();
    const sets = []; const binds = [];
    for (const [k, v] of Object.entries(body)) {
      if (!TAG_FIELDS.has(k)) continue;
      sets.push(`${k} = ?${sets.length + 1}`);
      binds.push(v);
    }
    if (!sets.length) return err("No fields to update", 400);
    binds.push(tagId);
    await env.DB.prepare(`UPDATE tags SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
    return json({ id: tagId, ...body });
  }

  // DELETE /api/tags/:id
  if (method === "DELETE" && path.startsWith("/api/tags/")) {
    if (!userId) return err("Unauthorized", 401);
    const tagId = path.split("/")[3];
    if (!isAdmin(userId)) return err("Forbidden — only admin can delete tags", 403);
    const exists = await env.DB.prepare("SELECT id FROM tags WHERE id = ?1").bind(tagId).first();
    if (!exists) return err("Tag not found", 404);
    const { entry_count } = await env.DB.prepare("SELECT COUNT(*) AS entry_count FROM entry_tags WHERE tag_id = ?1").bind(tagId).first();
    const { track_count } = await env.DB.prepare("SELECT COUNT(*) AS track_count FROM track_tags WHERE tag_id = ?1").bind(tagId).first();
    if (Number(entry_count) > 0 || Number(track_count) > 0) return err("Tag is in use; detach it before deletion", 409);
    await env.DB.prepare("DELETE FROM tags WHERE id = ?1").bind(tagId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'tag',?3)"
    ).bind("tag_deleted", userId, tagId).run();
    return json({ ok: true, id: tagId });
  }

  return err("Not found", 404);
}
