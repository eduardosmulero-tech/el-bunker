// ============================================================
//  EL BÚNKER — workers/routes/playlists.js
//  CRUD /api/playlists + reorder + tracks sub-routes (auth required)
// ============================================================

import { json, err } from "../utils/response.js";
import { canManageOwned } from "../utils/authorization.js";

export default async function handlePlaylists(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // POST /api/playlists/reorder (verificar antes de rutas con :id)
  if (method === "POST" && path === "/api/playlists/reorder") {
    const body = await request.json();
    const ids = body.playlist_ids;
    if (!Array.isArray(ids) || ids.length === 0) return err("playlist_ids array required", 400);
    const placeholders = ids.map(() => "?").join(",");
    const { results: existing } = await env.DB.prepare(
      `SELECT id FROM playlists WHERE id IN (${placeholders})`
    ).bind(...ids).all();
    if (existing.length !== ids.length) {
      return err(`Some playlists not found (${existing.length}/${ids.length})`, 404);
    }
    const stmt = env.DB.prepare("UPDATE playlists SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2");
    await env.DB.batch(ids.map((id, i) => stmt.bind(i, id)));
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'playlist',?3,?4)"
    ).bind("playlists_reordered", userId, "bulk", JSON.stringify({ count: ids.length })).run();
    return json({ ok: true, count: ids.length });
  }

  // GET /api/playlists
  if (method === "GET" && path === "/api/playlists") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM playlists ORDER BY sort_order ASC, created_at DESC"
    ).all();
    if (results.length) {
      const plIds = results.map(p => p.id);
      const BATCH = 100;
      const tracksByPl = {};
      for (let i = 0; i < plIds.length; i += BATCH) {
        const batch = plIds.slice(i, i + BATCH);
        const placeholders = batch.map(() => "?").join(",");
        const { results: allTracks } = await env.DB.prepare(
          `SELECT playlist_id, track_id FROM playlist_tracks
           WHERE playlist_id IN (${placeholders}) ORDER BY playlist_id, position`
        ).bind(...batch).all();
        for (const row of allTracks) {
          if (!tracksByPl[row.playlist_id]) tracksByPl[row.playlist_id] = [];
          tracksByPl[row.playlist_id].push(row.track_id);
        }
      }
      for (const pl of results) pl.track_ids = tracksByPl[pl.id] || [];
    }
    return json(results);
  }

  // POST /api/playlists
  if (method === "POST" && path === "/api/playlists") {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    const now = body.created_at || new Date().toISOString();
    if (body.sort_order != null) {
      await env.DB.prepare(
        "INSERT INTO playlists (id, name, description, created_by, sort_order, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?6)"
      ).bind(id, body.name, body.description || "", body.created_by || userId, body.sort_order, now).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO playlists (id, name, description, created_by, sort_order, created_at, updated_at)
         SELECT ?1,?2,?3,?4, COALESCE(MAX(sort_order), -1) + 1, ?5, ?5 FROM playlists`
      ).bind(id, body.name, body.description || "", body.created_by || userId, now).run();
    }
    const created = await env.DB.prepare("SELECT sort_order FROM playlists WHERE id = ?1").bind(id).first();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'playlist',?3,?4)"
    ).bind("playlist_created", userId, id, JSON.stringify({ name: body.name })).run();
    return json({ id, ...body, created_by: userId, sort_order: created?.sort_order ?? 0 }, 201);
  }

  // PUT /api/playlists/:id/tracks (reorder tracks)
  if (method === "PUT" && path.startsWith("/api/playlists/") && path.endsWith("/tracks")) {
    const plId = path.split("/")[3];
    const body = await request.json();
    const trackIds = body.track_ids;
    if (!Array.isArray(trackIds)) return err("track_ids array required", 400);
    const exists = await env.DB.prepare("SELECT id FROM playlists WHERE id = ?1").bind(plId).first();
    if (!exists) return err("Playlist not found", 404);
    await env.DB.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ?1").bind(plId).run();
    if (trackIds.length) {
      const stmt = env.DB.prepare("INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?1,?2,?3)");
      await env.DB.batch(trackIds.map((tid, i) => stmt.bind(plId, tid, i)));
    }
    await env.DB.prepare("UPDATE playlists SET updated_at = datetime('now') WHERE id = ?1").bind(plId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'playlist',?3,?4)"
    ).bind("playlist_tracks_reordered", userId, plId, JSON.stringify({ count: trackIds.length })).run();
    return json({ ok: true, playlist_id: plId, count: trackIds.length });
  }

  // POST /api/playlists/:id/tracks (add track)
  if (method === "POST" && path.startsWith("/api/playlists/") && path.endsWith("/tracks")) {
    const plId = path.split("/")[3];
    const body = await request.json();
    const trackId = body.track_id;
    if (!trackId) return err("track_id required", 400);
    const { count } = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM playlist_tracks WHERE playlist_id = ?1"
    ).bind(plId).first();
    await env.DB.prepare(
      "INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?1,?2,?3)"
    ).bind(plId, trackId, count).run();
    await env.DB.prepare("UPDATE playlists SET updated_at = datetime('now') WHERE id = ?1").bind(plId).run();
    return json({ ok: true, playlist_id: plId, track_id: trackId }, 201);
  }

  // DELETE /api/playlists/:id/tracks/:trackId (remove track)
  if (method === "DELETE" && path.startsWith("/api/playlists/") && path.includes("/tracks/")) {
    const parts = path.split("/");
    const plId = parts[3];
    const trackId = parts[5];
    if (!plId || !trackId) return err("playlist_id and track_id required", 400);
    const { changes } = await env.DB.prepare(
      "DELETE FROM playlist_tracks WHERE playlist_id = ?1 AND track_id = ?2"
    ).bind(plId, trackId).run();
    if (!changes) return err("Track not in playlist", 404);
    await env.DB.prepare("UPDATE playlists SET updated_at = datetime('now') WHERE id = ?1").bind(plId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'playlist',?3,?4)"
    ).bind("playlist_track_removed", userId, plId, JSON.stringify({ track_id: trackId })).run();
    return json({ ok: true, playlist_id: plId, track_id: trackId });
  }

  // PATCH /api/playlists/:id (rename)
  if (method === "PATCH" && path.startsWith("/api/playlists/") && !path.endsWith("/tracks")) {
    const PL_FIELDS = new Set(["name", "description"]);
    const plId = path.split("/")[3];
    const owner = await env.DB.prepare("SELECT created_by FROM playlists WHERE id = ?1").bind(plId).first();
    if (!owner) return err("Playlist not found", 404);
    if (!canManageOwned(userId, owner.created_by)) return err("Forbidden", 403);
    const body = await request.json();
    const sets = []; const binds = [];
    for (const [k, v] of Object.entries(body)) {
      if (!PL_FIELDS.has(k)) continue;
      sets.push(`${k} = ?${sets.length + 1}`);
      binds.push(v);
    }
    if (!sets.length) return err("No fields to update", 400);
    binds.push(plId);
    sets.push("updated_at = datetime('now')");
    await env.DB.prepare(`UPDATE playlists SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
    return json({ id: plId, ...body });
  }

  // DELETE /api/playlists/:id — controlled hard-delete of the playlist only.
  if (method === "DELETE" && path.startsWith("/api/playlists/") && !path.endsWith("/tracks")) {
    const plId = path.split("/")[3];
    const owner = await env.DB.prepare("SELECT created_by FROM playlists WHERE id = ?1").bind(plId).first();
    if (!owner) return err("Playlist not found", 404);
    if (!canManageOwned(userId, owner.created_by)) return err("Forbidden", 403);
    await env.DB.prepare("DELETE FROM playlists WHERE id = ?1").bind(plId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'playlist',?3)"
    ).bind("playlist_deleted", userId, plId).run();
    return json({ ok: true, id: plId });
  }

  return err("Not found", 404);
}
