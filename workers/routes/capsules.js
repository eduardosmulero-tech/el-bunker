// ============================================================
//  EL BÚNKER — workers/routes/capsules.js
//  GET/POST/PATCH /api/time_capsules (auth required, ADR-020)
// ============================================================

import { json, err } from "../utils/response.js";
import { isVisitMode, loadClassifiedIds, sanitizeCapsule } from "../utils/visit-filter.js";

function parseJson(value, fallback = null) {
  if (typeof value !== "string") return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function itemReference(item) {
  const content = parseJson(item.content, {});
  if (item.type === "entry_ref") return content?.entry_id ?? null;
  if (item.type === "playlist_ref") return content?.playlist_id ?? null;
  return null;
}

function playlistSnapshot(item) {
  const content = parseJson(item.content, {});
  if (item.type !== "playlist_ref" || !content?.playlist_id) return null;
  return {
    playlist_id: content.playlist_id,
    snapshot_track_ids: Array.isArray(content.snapshot_track_ids) ? content.snapshot_track_ids : [],
  };
}

function isContentAccessible(row) {
  if (Number(row.is_unlocked) === 1) return true;
  const unlockDate = parseDate(row.unlock_at);
  return Boolean(unlockDate && unlockDate <= new Date());
}

function contentResponse({ row, capsuleItems, entryIds, playlistSnapshots }) {
  const playlistIds = playlistSnapshots.map((snapshot) => snapshot.playlist_id);
  const accessible = isContentAccessible(row);
  const contentCounts = { entries: entryIds.length, playlists: playlistIds.length };
  const contentSnapshot = accessible
    ? { entry_ids: entryIds, playlist_ids: playlistIds, playlist_snapshots: playlistSnapshots }
    : { counts: contentCounts };

  return {
    ...row,
    is_unlocked: Number(row.is_unlocked) === 1,
    content_counts: contentCounts,
    capsule_items: accessible
      ? capsuleItems.map((item) => ({ ...item, content: parseJson(item.content, {}) }))
      : [],
    entry_ids: accessible ? entryIds : [],
    playlist_ids: accessible ? playlistIds : [],
    playlist_snapshots: accessible ? playlistSnapshots : [],
    content_snapshot: JSON.stringify(contentSnapshot),
  };
}

async function persistDueUnlocks(rows, env, userId) {
  const now = new Date();
  const nowIso = now.toISOString();

  for (const row of rows) {
    if (Number(row.is_unlocked) === 1) continue;
    const unlockDate = parseDate(row.unlock_at);
    if (!unlockDate || unlockDate > now) continue;

    const [updateResult] = await env.DB.batch([
      env.DB.prepare(
        "UPDATE time_capsules SET is_unlocked = 1, unlocked_at = ?1 WHERE id = ?2 AND is_unlocked = 0"
      ).bind(nowIso, row.id),
      env.DB.prepare(
        `INSERT INTO events (event_type, user_id, entity_type, entity_id, payload)
         SELECT ?1,?2,'time_capsule',?3,?4
         WHERE EXISTS (
           SELECT 1 FROM time_capsules
           WHERE id = ?5 AND is_unlocked = 1 AND unlocked_at = ?6
         )
         AND NOT EXISTS (
           SELECT 1 FROM events
           WHERE event_type = 'capsule_unlocked' AND entity_type = 'time_capsule' AND entity_id = ?7
         )`
      ).bind("capsule_unlocked", userId, row.id, JSON.stringify({ title: row.title }), row.id, nowIso, row.id),
    ]);
    const changes = updateResult?.meta?.changes ?? updateResult?.changes ?? 0;
    if (!changes) continue;

    row.is_unlocked = 1;
    row.unlocked_at = nowIso;
  }

  return rows;
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
    const playlistSnapshots = capsuleItems.map(playlistSnapshot).filter(Boolean);
    return contentResponse({ row, capsuleItems, entryIds, playlistSnapshots });
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
    await persistDueUnlocks(results, env, userId);
    const enriched = await enrichCapsuleRows(results, env);
    // A3: en modo visita, vaciar las cápsulas clasificadas y su contenido
    // (sin título ni nota). Las no clasificadas se devuelven tal cual.
    if (isVisitMode(request)) {
      const classifiedIds = await loadClassifiedIds(env, "capsule", enriched.map((c) => c.id));
      if (classifiedIds.size) {
        return json(enriched.map((capsule) => classifiedIds.has(capsule.id) ? sanitizeCapsule(capsule) : capsule));
      }
    }
    return json(enriched);
  }

  // POST /api/time_capsules
  if (method === "POST" && path === "/api/time_capsules") {
    const body = await request.json().catch(() => null);
    if (!body?.title || !body?.unlock_at) return err("title and unlock_at required", 400);
    const unlockDate = parseDate(body.unlock_at);
    if (!unlockDate) return err("unlock_at must be a valid date", 400);
    if (unlockDate <= new Date()) return err("unlock_at must be in the future", 400);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const entryIds = Array.isArray(body.entry_ids) ? [...new Set(body.entry_ids.filter(Boolean))] : [];
    const playlistIds = Array.isArray(body.playlist_ids) ? [...new Set(body.playlist_ids.filter(Boolean))] : [];
    const playlistSnapshots = [];

    if (entryIds.length) {
      const placeholders = entryIds.map(() => "?").join(",");
      const { results: entryRows } = await env.DB.prepare(
        `SELECT id FROM entries WHERE is_deleted = 0 AND id IN (${placeholders})`
      ).bind(...entryIds).all();
      if (entryRows.length !== entryIds.length) {
        return err("Some entries not found or deleted", 400);
      }
    }

    if (playlistIds.length) {
      const placeholders = playlistIds.map(() => "?").join(",");
      const { results: playlistRows } = await env.DB.prepare(
        `SELECT p.id, pt.track_id
         FROM playlists p
         LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
         WHERE p.id IN (${placeholders})
         ORDER BY p.id, pt.position`
      ).bind(...playlistIds).all();
      const tracksByPlaylist = new Map(playlistIds.map((playlistId) => [playlistId, []]));
      const foundPlaylists = new Set();
      for (const row of playlistRows) {
        foundPlaylists.add(row.id);
        if (row.track_id) tracksByPlaylist.get(row.id)?.push(row.track_id);
      }
      if (foundPlaylists.size !== playlistIds.length) {
        return err("Some playlists not found", 400);
      }
      for (const playlistId of playlistIds) {
        playlistSnapshots.push({
          playlist_id: playlistId,
          snapshot_track_ids: tracksByPlaylist.get(playlistId) ?? [],
        });
      }
    }

    const snapshotByPlaylist = new Map(playlistSnapshots.map((snapshot) => [snapshot.playlist_id, snapshot]));
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
      ).bind(crypto.randomUUID(), id, JSON.stringify({ playlist_id: playlistId, snapshot_track_ids: snapshotByPlaylist.get(playlistId)?.snapshot_track_ids ?? [] }), entryIds.length + index, userId)),
      env.DB.prepare(
        "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'time_capsule',?3,?4)"
      ).bind("capsule_created", userId, id, JSON.stringify({
        title: body.title,
        content_counts: { entries: entryIds.length, playlists: playlistIds.length },
      })),
    ];
    await env.DB.batch(statements);
    const createdRow = {
      id,
      title: body.title,
      description: body.description || "",
      unlock_at: body.unlock_at,
      created_by: userId,
      is_unlocked: false,
    };
    return json(contentResponse({
      row: createdRow,
      capsuleItems: [],
      entryIds,
      playlistSnapshots,
    }), 201);
  }

  // PATCH /api/time_capsules/:id — unlock only; sealed capsules are not deletable.
  if (method === "PATCH" && path.startsWith("/api/time_capsules/")) {
    const capsuleId = path.split("/")[3];
    const capsule = await env.DB.prepare("SELECT id, unlock_at, is_unlocked FROM time_capsules WHERE id = ?1").bind(capsuleId).first();
    if (!capsule) return err("Capsule not found", 404);
    const body = await request.json().catch(() => null);
    if (body?.is_unlocked) {
      if (Number(capsule.is_unlocked) === 1) return json({ ok: true, id: capsuleId });
      const unlockDate = parseDate(capsule.unlock_at);
      if (!unlockDate || unlockDate > new Date()) {
        return err("Capsule is still sealed", 409);
      }
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
