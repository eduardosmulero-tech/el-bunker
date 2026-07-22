// ============================================================
//  EL BÚNKER — workers/routes/tracks.js
//  CRUD /api/tracks (auth required)
// ============================================================

import { json, err } from "../utils/response.js";

// FASE D.2 (veredicto V5 Fable S147): helper local para emitir eventos de track.
// Contrato explícito: POST emite track_created, DELETE emite track_deleted,
// PATCH es mudo (un cambio de metadata no es una memoria — V5). El helper vive
// en este mismo archivo (dependencia cero, ADR-015 contenedor completo).
async function emitTrackEvent(env, eventType, userId, trackId, payload = null) {
  if (payload !== null) {
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'track',?3,?4)"
    ).bind(eventType, userId, trackId, JSON.stringify(payload)).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'track',?3)"
    ).bind(eventType, userId, trackId).run();
  }
}

export default async function handleTracks(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // GET /api/tracks
  if (method === "GET" && path === "/api/tracks") {
    const era = url.searchParams.get("era_id");
    const vibe = url.searchParams.get("tag_id");
    let q = `SELECT t.*, tg.label as tag_label, tg.icon as tag_icon, tg.color as tag_color
             FROM tracks t
             LEFT JOIN tags tg ON t.tag_id = tg.id
             WHERE t.is_deleted = 0`;
    const binds = [];
    if (era) { q += " AND t.era_id = ?1"; binds.push(era); }
    if (vibe) { q += ` AND t.tag_id = ?${binds.length + 1}`; binds.push(vibe); }
    q += " ORDER BY t.created_at DESC";
    const stmt = env.DB.prepare(q);
    const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();

    // Multi-tags batch
    const trackIds = results.map(r => r.id);
    let tagsByTrack = {};
    const BATCH = 100;
    for (let i = 0; i < trackIds.length; i += BATCH) {
      const batch = trackIds.slice(i, i + BATCH);
      const placeholders = batch.map(() => "?").join(",");
      const { results: allTags } = await env.DB.prepare(
        `SELECT tt.track_id, t.id, t.label, t.icon, t.color
         FROM track_tags tt JOIN tags t ON t.id = tt.tag_id
         WHERE tt.track_id IN (${placeholders})`
      ).bind(...batch).all();
      for (const row of allTags) {
        if (!tagsByTrack[row.track_id]) tagsByTrack[row.track_id] = [];
        tagsByTrack[row.track_id].push({ id: row.id, label: row.label, icon: row.icon, color: row.color });
      }
    }
    const mapped = results.map(r => ({
      ...r,
      tag: r.tag_id,
      color: r.color || r.tag_color || "#bfff00",
      tags: tagsByTrack[r.id] || [],
      thumbnail: r.thumbnail ? (r.thumbnail.startsWith("http") ? r.thumbnail : `${url.origin}/${r.thumbnail}`) : null,
      tag_label: undefined, tag_icon: undefined, tag_color: undefined,
    }));
    return json(mapped);
  }

  // POST /api/tracks
  if (method === "POST" && path === "/api/tracks") {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    const now = body.created_at || new Date().toISOString();
    const addedBy = body.added_by || userId;
    await env.DB.prepare(
      `INSERT INTO tracks (id, era_id, title, artist, tag_id, r2_key, format, note, duration, thumbnail, drive_file_id, color, play_count, last_played, added_by, created_at, updated_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17)`
    ).bind(id, body.era_id || null, body.title, body.artist || "", body.tag_id || null,
           body.r2_key || null, body.format || "mp3", body.note || "", body.duration || null,
           body.thumbnail || null, body.drive_file_id || null, body.color || null,
           body.play_count || 0, body.last_played || null, addedBy, now, now).run();
    if (Array.isArray(body.tags) && body.tags.length) {
      const stmt = env.DB.prepare("INSERT OR IGNORE INTO track_tags (track_id, tag_id) VALUES (?1,?2)");
      await env.DB.batch(body.tags.map(tid => stmt.bind(id, tid)));
    }
    // FASE D.2: POST emite track_created vía helper local.
    await emitTrackEvent(env, "track_created", userId, id, { title: body.title });
    return json({ id, ...body, added_by: addedBy }, 201);
  }

  // PATCH /api/tracks/:id
  if (method === "PATCH" && path.startsWith("/api/tracks/")) {
    const TRACK_FIELDS = new Set(["era_id", "title", "artist", "tag_id", "r2_key", "format", "note", "duration", "thumbnail", "drive_file_id", "color", "play_count", "last_played"]);
    const trackId = path.split("/")[3];
    const body = await request.json();
    const sets = []; const binds = [];
    for (const [k, v] of Object.entries(body)) {
      if (!TRACK_FIELDS.has(k)) continue;
      sets.push(`${k} = ?${sets.length + 1}`);
      binds.push(v);
    }
    if (!sets.length) return err("No fields to update", 400);
    binds.push(trackId);
    sets.push("updated_at = datetime('now')");
    await env.DB.prepare(`UPDATE tracks SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
    // FASE D.2 (V5): PATCH es mudo — un cambio de metadata no es una memoria.
    // El histórico de eventos previos NO se borra (🔒-3 append-only); Timeline filtra
    // el ruido en lectura (RECAP no agregaba este tipo de evento). POST y DELETE
    // siguen emitiendo vía emitTrackEvent.
    return json({ id: trackId, ...body, updated_by: userId });
  }

  // DELETE /api/tracks/:id (soft delete)
  if (method === "DELETE" && path.startsWith("/api/tracks/")) {
    const trackId = path.split("/")[3];
    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE tracks SET is_deleted = 1, deleted_at = ?1, deleted_by = ?2, updated_at = ?1 WHERE id = ?3"
    ).bind(now, userId, trackId).run();
    // FASE D.2: DELETE emite track_deleted vía helper local (sin payload).
    await emitTrackEvent(env, "track_deleted", userId, trackId);
    return json({ ok: true, id: trackId });
  }

  return err("Not found", 404);
}
