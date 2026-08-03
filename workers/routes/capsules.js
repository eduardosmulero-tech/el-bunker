// ============================================================
//  EL BÚNKER — workers/routes/capsules.js
//  GET/POST/PATCH /api/time_capsules (auth required, ADR-020)
// ============================================================

import { json, err } from "../utils/response.js";

function parseJson(value, fallback = null) {
  if (typeof value !== "string") return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function itemReference(item) {
  const content = parseJson(item.content, {});
  if (item.type === "entry_ref") return content?.entry_id ?? null;
  if (item.type === "playlist_ref") return content?.playlist_id ?? null;
  return null;
}

async function enrichCapsuleRows(rows, env) {
  if (!rows.length) return rows;
  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(",");
  const { results: items } = await env.DB.prepare(
    `SELECT id, capsule_id, type, content, sort_order, created_by, created_at
     FROM capsule_items WHERE capsule_id IN (${placeholders}) ORDER BY sort_order ASC, created_at ASC`
  ).bind(...ids).all();
  const byCapsule = new Map(ids.map((id) => [id, []]));
  for (const item of items) byCapsule.get(item.capsule_id)?.push(item);

  return rows.map((row) => {
    const capsuleItems = byCapsule.get(row.id) ?? [];
    const entryIds = capsuleItems.filter((item) => item.type === "entry_ref").map(itemReference).filter(Boolean);
    const playlistIds = capsuleItems.filter((item) => item.type === "playlist_ref").map(itemReference).filter(Boolean);
    return {
      ...row,
      is_unlocked: Boolean(row.is_unlocked),
      capsule_items: capsuleItems.map((item) => ({ ...item, content: parseJson(item.content, {}) })),
      entry_ids: entryIds,
      playlist_ids: playlistIds,
      content_snapshot: JSON.stringify({ entry_ids: entryIds, playlist_ids: playlistIds }),
    };
  });
}

export default async function handleCapsules(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // GET /api/time_capsules
  if (method === "GET" && path === "/api/time_capsules") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM time_capsules ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json(await enrichCapsuleRows(results, env));
  }

  // POST /api/time_capsules
  if (method === "POST" && path === "/api/time_capsules") {
    const body = await request.json().catch(() => null);
    if (!body?.title || !body?.unlock_at) return err("title and unlock_at required", 400);
    if (new Date(body.unlock_at) <= new Date()) return err("unlock_at must be in the future", 400);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const entryIds = Array.isArray(body.entry_ids) ? [...new Set(body.entry_ids.filter(Boolean))] : [];
    const playlistIds = Array.isArray(body.playlist_ids) ? [...new Set(body.playlist_ids.filter(Boolean))] : [];
    const statements = [
      env.DB.prepare(
        `INSERT INTO time_capsules (id, title, description, unlock_at, created_by, created_at)
         VALUES (?1,?2,?3,?4,?5,?6)`
      ).bind(id, body.title, body.description || "", body.unlock_at, userId, now),
      ...entryIds.map((entryId, index) => env.DB.prepare(
        `INSERT INTO capsule_items (id, capsule_id, type, content, sort_order, created_by)
         VALUES (?1,?2,'entry_ref',?3,?4,?5)`
      ).bind(crypto.randomUUID(), id, JSON.stringify({ entry_id: entryId }), index, userId)),
      ...playlistIds.map((playlistId, index) => env.DB.prepare(
        `INSERT INTO capsule_items (id, capsule_id, type, content, sort_order, created_by)
         VALUES (?1,?2,'playlist_ref',?3,?4,?5)`
      ).bind(crypto.randomUUID(), id, JSON.stringify({ playlist_id: playlistId }), entryIds.length + index, userId)),
      env.DB.prepare(
        "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'time_capsule',?3,?4)"
      ).bind("capsule_created", userId, id, JSON.stringify({ title: body.title, entry_ids: entryIds, playlist_ids: playlistIds })),
    ];
    await env.DB.batch(statements);
    return json({
      id,
      title: body.title,
      description: body.description || "",
      unlock_at: body.unlock_at,
      created_by: userId,
      is_unlocked: false,
      entry_ids: entryIds,
      playlist_ids: playlistIds,
      content_snapshot: body.content_snapshot || JSON.stringify({ entry_ids: entryIds, playlist_ids: playlistIds }),
    }, 201);
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
