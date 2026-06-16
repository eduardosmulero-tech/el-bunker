// ============================================================
//  EL BÚNKER — workers/routes/entries.js
//  CRUD /api/entries (auth required)
// ============================================================

import { json, err } from "../utils/response.js";

export default async function handleEntries(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // GET /api/entries
  if (method === "GET" && path === "/api/entries") {
    const era = url.searchParams.get("era_id");
    const type = url.searchParams.get("type");
    const from = url.searchParams.get("from_user");
    let q = "SELECT * FROM entries WHERE is_deleted = 0";
    const binds = [];
    if (era) { q += " AND era_id = ?1"; binds.push(era); }
    if (type) { q += ` AND type = ?${binds.length + 1}`; binds.push(type); }
    if (from) { q += ` AND from_user = ?${binds.length + 1}`; binds.push(from); }
    q += " ORDER BY created_at DESC LIMIT 200";
    const { results } = binds.length
      ? await env.DB.prepare(q).bind(...binds).all()
      : await env.DB.prepare(q).all();
    // Enriquecer con tags y archivos (batched)
    if (results.length) {
      const entryIds = results.map(e => e.id);
      const BATCH = 100;
      const tagsByEntry = {};
      const filesByEntry = {};
      for (let i = 0; i < entryIds.length; i += BATCH) {
        const batch = entryIds.slice(i, i + BATCH);
        const placeholders = batch.map(() => "?").join(",");
        const { results: allTags } = await env.DB.prepare(
          `SELECT et.entry_id, t.id, t.label, t.icon, t.color, t.namespace
           FROM entry_tags et JOIN tags t ON t.id = et.tag_id
           WHERE et.entry_id IN (${placeholders})`
        ).bind(...batch).all();
        for (const row of allTags) {
          if (!tagsByEntry[row.entry_id]) tagsByEntry[row.entry_id] = [];
          tagsByEntry[row.entry_id].push({ id: row.id, label: row.label, icon: row.icon, color: row.color, namespace: row.namespace });
        }
        const { results: allFiles } = await env.DB.prepare(
          `SELECT id, entry_id, r2_key, prefix, filename, mime_type, size_bytes
           FROM files WHERE entry_id IN (${placeholders})`
        ).bind(...batch).all();
        for (const row of allFiles) {
          if (!filesByEntry[row.entry_id]) filesByEntry[row.entry_id] = [];
          filesByEntry[row.entry_id].push({ id: row.id, r2_key: row.r2_key, prefix: row.prefix, filename: row.filename, mime_type: row.mime_type, size_bytes: row.size_bytes });
        }
      }
      for (const entry of results) {
        entry.from = entry.from_user;
        entry.to = entry.to_user;
        entry.tags = tagsByEntry[entry.id] || [];
        entry.files = filesByEntry[entry.id] || [];
      }
    }
    return json(results);
  }

  // GET /api/entries/:id
  if (method === "GET" && path.startsWith("/api/entries/")) {
    const entryId = path.split("/")[3];
    if (!entryId) return err("entry id required", 400);
    const entry = await env.DB.prepare(
      "SELECT * FROM entries WHERE id = ?1 AND is_deleted = 0"
    ).bind(entryId).first();
    if (!entry) return err("Entry not found", 404);
    const { results: tags } = await env.DB.prepare(
      `SELECT t.id, t.label, t.icon, t.color, t.namespace
       FROM entry_tags et JOIN tags t ON t.id = et.tag_id WHERE et.entry_id = ?1`
    ).bind(entryId).all();
    entry.tags = tags;
    entry.from = entry.from_user;
    entry.to = entry.to_user;
    const { results: files } = await env.DB.prepare(
      "SELECT id, r2_key, prefix, filename, mime_type, size_bytes FROM files WHERE entry_id = ?1"
    ).bind(entryId).all();
    entry.files = files;
    return json(entry);
  }

  // POST /api/entries
  if (method === "POST" && path === "/api/entries") {
    const body = await request.json();
    if (body.era_id) {
      const era = await env.DB.prepare("SELECT id FROM eras WHERE id = ?1").bind(body.era_id).first();
      if (!era) return err(`Era ${body.era_id} not found`, 400);
    }
    const id = body.id || crypto.randomUUID();
    const now = body.created_at || new Date().toISOString();
    const fromUser = body.from_user || userId;
    await env.DB.prepare(
      `INSERT INTO entries (id, era_id, type, title, content, from_user, to_user, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)`
    ).bind(id, body.era_id || null, body.type || "note", body.title || "",
           JSON.stringify(body.content || {}), fromUser, body.to_user || "both", now).run();
    if (Array.isArray(body.tags) && body.tags.length) {
      const stmt = env.DB.prepare("INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?1,?2)");
      await env.DB.batch(body.tags.map(tid => stmt.bind(id, tid)));
    }
    if (Array.isArray(body.file_ids) && body.file_ids.length) {
      const stmt = env.DB.prepare("UPDATE files SET entry_id = ?1 WHERE id = ?2 AND entry_id IS NULL");
      await env.DB.batch(body.file_ids.map(fid => stmt.bind(id, fid)));
    }
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'entry',?3,?4)"
    ).bind("entry_created", userId, id, JSON.stringify({ type: body.type, title: body.title })).run();
    return json({ id, ...body, from_user: userId }, 201);
  }

  // PATCH /api/entries/:id
  if (method === "PATCH" && path.startsWith("/api/entries/")) {
    const ENTRY_FIELDS = new Set(["era_id", "type", "title", "content", "to_user"]);
    const entryId = path.split("/")[3];
    const exists = await env.DB.prepare(
      "SELECT id FROM entries WHERE id = ?1 AND is_deleted = 0"
    ).bind(entryId).first();
    if (!exists) return err("Entry not found", 404);
    const body = await request.json();
    const { tags, file_ids, ...fields } = body;
    const sets = []; const binds = [];
    for (const [k, v] of Object.entries(fields)) {
      if (!ENTRY_FIELDS.has(k)) continue;
      if (k === "content") { sets.push(`${k} = ?${sets.length + 1}`); binds.push(JSON.stringify(v)); }
      else { sets.push(`${k} = ?${sets.length + 1}`); binds.push(v); }
    }
    if (sets.length) {
      binds.push(entryId);
      sets.push("updated_at = datetime('now')");
      await env.DB.prepare(`UPDATE entries SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
    }
    if (Array.isArray(tags)) {
      await env.DB.prepare("DELETE FROM entry_tags WHERE entry_id = ?1").bind(entryId).run();
      if (tags.length) {
        const stmt = env.DB.prepare("INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?1,?2)");
        await env.DB.batch(tags.map(tid => stmt.bind(entryId, tid)));
      }
    }
    if (Array.isArray(file_ids)) {
      const stmt = env.DB.prepare("UPDATE files SET entry_id = ?1 WHERE id = ?2 AND entry_id IS NULL");
      await env.DB.batch(file_ids.map(fid => stmt.bind(entryId, fid)));
    }
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'entry',?3,?4)"
    ).bind("entry_updated", userId, entryId, JSON.stringify(fields)).run();
    return json({ id: entryId, ...body });
  }

  // DELETE /api/entries/:id
  if (method === "DELETE" && path.startsWith("/api/entries/")) {
    const entryId = path.split("/")[3];
    const exists = await env.DB.prepare(
      "SELECT id FROM entries WHERE id = ?1 AND is_deleted = 0"
    ).bind(entryId).first();
    if (!exists) return err("Entry not found", 404);
    await env.DB.prepare("UPDATE entries SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?1").bind(entryId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'entry',?3)"
    ).bind("entry_deleted", userId, entryId).run();
    return json({ ok: true, id: entryId });
  }

  return err("Not found", 404);
}
