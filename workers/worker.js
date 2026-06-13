// ============================================================
//  EL BÚNKER — worker.js
//  Cloudflare Workers · Thin REST layer (ADR-024)
//  Bindings: DB (D1), BUNKER (R2)
//  S55-S57 · Fase 1 — API CRUD completa + JWT + Upload + Stats
// ============================================================

// ═══ CORS ════════════════════════════════════════════════════
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json", ...extraHeaders },
  });
}

function err(message, status = 500) {
  return json({ error: message }, status);
}

// ═══ JWT AUTH (S55 — firma real HMAC-SHA256) ════════════════
const JWT_EXPIRY = 24 * 60 * 60; // 24 horas

function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY })));
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${headerB64}.${payloadB64}`));
  return `${headerB64}.${payloadB64}.${base64url(sig)}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("HMAC", key, base64urlDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.sub;
  } catch { return null; }
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// Lista hardcodeada de usuarios autorizados (ADR-006)
const WHITELIST = {
  "thebunker.admin@gmail.com": "admin",
  "bansovi.py@gmail.com": "edu",
  "dcgdozt@gmail.com": "david",
};

async function authenticate(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyJWT(auth.slice(7), env.JWT_SECRET || "dev-secret-change-me");
}

// ═══ ROUTER ══════════════════════════════════════════════════
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const userId = await authenticate(request, env);

    try {
      // ── Health ───────────────────────────────────────────
      if (path === "/api/health") {
        const dbOk = await env.DB.prepare("SELECT 1 as ok").first();
        return json({ status: "ok", db: !!dbOk, auth: !!userId, timestamp: new Date().toISOString() });
      }

      // ── Auth: Login (S55) ────────────────────────────────
      if (path === "/api/auth/login" && request.method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body?.email || !body?.google_token) return err("email and google_token required", 400);
        // Verificar Google token contra Google API
        const gRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(body.google_token)}`);
        if (!gRes.ok) return err("Invalid Google token", 401);
        const gData = await gRes.json();
        const verifiedEmail = gData.email?.toLowerCase();
        if (!WHITELIST[verifiedEmail]) return err("Email not authorized", 403);
        const token = await signJWT({ sub: WHITELIST[verifiedEmail], email: verifiedEmail }, env.JWT_SECRET || "dev-secret-change-me");
        return json({ token, user: { id: WHITELIST[verifiedEmail], email: verifiedEmail } });
      }

      // ═══ TRACKS ═══════════════════════════════════════════
      if (path === "/api/tracks" && request.method === "GET") {
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
        // Mapear: tag_id → tag (string ID, compatible con frontend track.tag)
        //         tag_color → color (compatible con Drive JSON track.color)
        // S64 audit: incluir track_tags multi-tag como tags[] (batched para evitar SQL variable limit)
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
        const mapped = results.map((r) => ({
          ...r,
          tag: r.tag_id,
          color: r.color || r.tag_color || '#bfff00',
          tags: tagsByTrack[r.id] || [],
          tag_label: undefined, tag_icon: undefined, tag_color: undefined,
        }));
        return json(mapped);
      }

      if (path === "/api/tracks" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        // S64 audit: aceptar id y timestamps del cliente para migración
        const id = body.id || crypto.randomUUID();
        const now = body.created_at || new Date().toISOString();
        const addedBy = body.added_by || userId;
        await env.DB.prepare(
          `INSERT INTO tracks (id, era_id, title, artist, tag_id, r2_key, format, note, duration, thumbnail, drive_file_id, color, play_count, last_played, added_by, created_at, updated_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17)`
        ).bind(id, body.era_id||null, body.title, body.artist||"", body.tag_id||null,
               body.r2_key||null, body.format||"mp3", body.note||"", body.duration||null,
               body.thumbnail||null, body.drive_file_id||null, body.color||null,
               body.play_count||0, body.last_played||null, addedBy, now, now).run();
        // Vincular multi-tags (track_tags junction)
        if (Array.isArray(body.tags) && body.tags.length) {
          const stmt = env.DB.prepare("INSERT OR IGNORE INTO track_tags (track_id, tag_id) VALUES (?1,?2)");
          await env.DB.batch(body.tags.map(tid => stmt.bind(id, tid)));
        }
        // Emitir evento (ADR-019)
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'track',?3,?4)"
        ).bind("track_created", userId, id, JSON.stringify({ title: body.title })).run();
        return json({ id, ...body, added_by: addedBy }, 201);
      }

      // PATCH /api/tracks/:id (S55)
      if (path.startsWith("/api/tracks/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const TRACK_FIELDS = new Set(["era_id","title","artist","tag_id","r2_key","format","note","duration","thumbnail","drive_file_id","color","play_count","last_played"]);
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
        sets.push(`updated_at = datetime('now')`);
        await env.DB.prepare(`UPDATE tracks SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'track',?3,?4)"
        ).bind("track_updated", userId, trackId, JSON.stringify(body)).run();
        return json({ id: trackId, ...body, updated_by: userId });
      }

      // DELETE /api/tracks/:id (S55 — soft delete)
      if (path.startsWith("/api/tracks/") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
        const trackId = path.split("/")[3];
        await env.DB.prepare("UPDATE tracks SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?1").bind(trackId).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'track',?3)"
        ).bind("track_deleted", userId, trackId).run();
        return json({ ok: true, id: trackId });
      }

      // ═══ DROPS ════════════════════════════════════════════
      if (path === "/api/drops" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM drops ORDER BY created_at DESC LIMIT 200"
        ).all();
        // S64 audit: mapear from_user→from, to_user→to para compatibilidad frontend
        const mapped = results.map(r => ({ ...r, from: r.from_user, to: r.to_user }));
        return json(mapped);
      }

      if (path === "/api/drops" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        // S64 audit: aceptar id, timestamps, from_user, favorited del cliente
        const id = body.id || crypto.randomUUID();
        const now = body.created_at || new Date().toISOString();
        const fromUser = body.from_user || userId;
        await env.DB.prepare(
          `INSERT INTO drops (id, era_id, track_id, from_user, to_user, drop_date, memory, mood, favorited, favorited_by, created_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`
        ).bind(id, body.era_id||null, body.track_id||null, fromUser, body.to_user||userId,
               body.drop_date||null, body.memory||"", body.mood||"",
               body.favorited ? 1 : 0, body.favorited_by||null, now).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'drop',?3,?4)"
        ).bind("drop_sent", userId, id, JSON.stringify({ to_user: body.to_user||userId, track_id: body.track_id })).run();
        return json({ id, ...body, from_user: userId }, 201);
      }

      // DELETE /api/drops/:id — DEL-DROP regression fix (S83)
      // Mirror de DELETE /api/playlists/:id. Valida existencia (404) y emite
      // evento drop_deleted para audit trail. Cualquier user autenticado puede
      // borrar (sender o recipient) — restricción de ownership es scope futuro.
      if (path.startsWith("/api/drops/") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
        const dropId = path.split("/")[3];
        const exists = await env.DB.prepare(
          "SELECT id FROM drops WHERE id = ?1"
        ).bind(dropId).first();
        if (!exists) return err("Drop not found", 404);
        await env.DB.prepare("DELETE FROM drops WHERE id = ?1").bind(dropId).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'drop',?3)"
        ).bind("drop_deleted", userId, dropId).run();
        return json({ ok: true, id: dropId });
      }

      // ═══ PLAYLISTS ════════════════════════════════════════
      if (path === "/api/playlists" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM playlists ORDER BY created_at DESC"
        ).all();
        // S64 audit: incluir track_ids via playlist_tracks JOIN (batched)
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
          for (const pl of results) {
            pl.track_ids = tracksByPl[pl.id] || [];
          }
        }
        return json(results);
      }

      if (path === "/api/playlists" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        // S64 audit: aceptar id y timestamps del cliente
        const id = body.id || crypto.randomUUID();
        const now = body.created_at || new Date().toISOString();
        await env.DB.prepare(
          "INSERT INTO playlists (id, name, description, created_by, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?5)"
        ).bind(id, body.name, body.description||"", body.created_by || userId, now).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'playlist',?3,?4)"
        ).bind("playlist_created", userId, id, JSON.stringify({ name: body.name })).run();
        return json({ id, ...body, created_by: userId }, 201);
      }

      // PATCH /api/playlists/:id (S55)
      if (path.startsWith("/api/playlists/") && !path.endsWith("/tracks") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const PL_FIELDS = new Set(["name","description"]);
        const plId = path.split("/")[3];
        const body = await request.json();
        const sets = []; const binds = [];
        for (const [k, v] of Object.entries(body)) {
          if (!PL_FIELDS.has(k)) continue;
          sets.push(`${k} = ?${sets.length + 1}`);
          binds.push(v);
        }
        if (!sets.length) return err("No fields to update", 400);
        binds.push(plId);
        sets.push(`updated_at = datetime('now')`);
        await env.DB.prepare(`UPDATE playlists SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
        return json({ id: plId, ...body });
      }

      // DELETE /api/playlists/:id (S55)
      if (path.startsWith("/api/playlists/") && !path.endsWith("/tracks") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
        const plId = path.split("/")[3];
        await env.DB.prepare("DELETE FROM playlists WHERE id = ?1").bind(plId).run();
        return json({ ok: true, id: plId });
      }

      // POST /api/playlists/:id/tracks (S55)
      if (path.startsWith("/api/playlists/") && path.endsWith("/tracks") && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
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

      // ═══ TAGS ════════════════════════════════════════════
      if (path === "/api/tags" && request.method === "GET") {
        const ns = url.searchParams.get("namespace");
        const query = ns
          ? "SELECT * FROM tags WHERE namespace = ?1 ORDER BY sort_order"
          : "SELECT * FROM tags ORDER BY namespace, sort_order";
        const { results } = ns
          ? await env.DB.prepare(query).bind(ns).all()
          : await env.DB.prepare(query).all();
        return json(results);
      }

      if (path === "/api/tags" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        // S66: aceptar id del cliente para mantener consistencia Drive JSON ↔ D1
        const id = body.id || crypto.randomUUID();
        await env.DB.prepare(
          "INSERT OR IGNORE INTO tags (id, namespace, label, icon, color, created_by) VALUES (?1,?2,?3,?4,?5,?6)"
        ).bind(id, body.namespace||"music", body.label, body.icon||"◈", body.color||"#ffffff", userId).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'tag',?3,?4)"
        ).bind("tag_created", userId, id, JSON.stringify({ label: body.label, namespace: body.namespace })).run();
        return json({ id, ...body, created_by: userId }, 201);
      }

      // PATCH /api/tags/:id (S55)
      if (path.startsWith("/api/tags/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const TAG_FIELDS = new Set(["label","icon","color","sort_order","namespace"]);
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

      // DELETE /api/tags/:id (S55)
      if (path.startsWith("/api/tags/") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
        const tagId = path.split("/")[3];
        await env.DB.prepare("DELETE FROM tags WHERE id = ?1").bind(tagId).run();
        return json({ ok: true, id: tagId });
      }

      // ═══ ENTRIES (S62 — VAULT CRUD mejorado) ══════════════
      // GET /api/entries — listado con tags y archivos
      if (path === "/api/entries" && request.method === "GET") {
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
        // S62: enriquecer con tags y archivos (batched para evitar SQL variable limit)
        if (results.length) {
          const entryIds = results.map(e => e.id);
          const BATCH = 100;
          const tagsByEntry = {};
          const filesByEntry = {};
          for (let i = 0; i < entryIds.length; i += BATCH) {
            const batch = entryIds.slice(i, i + BATCH);
            const placeholders = batch.map(() => "?").join(",");
            // Tags via junction
            const { results: allTags } = await env.DB.prepare(
              `SELECT et.entry_id, t.id, t.label, t.icon, t.color, t.namespace
               FROM entry_tags et JOIN tags t ON t.id = et.tag_id
               WHERE et.entry_id IN (${placeholders})`
            ).bind(...batch).all();
            for (const row of allTags) {
              if (!tagsByEntry[row.entry_id]) tagsByEntry[row.entry_id] = [];
              tagsByEntry[row.entry_id].push({ id: row.id, label: row.label, icon: row.icon, color: row.color, namespace: row.namespace });
            }
            // Files
            const { results: allFiles } = await env.DB.prepare(
              `SELECT id, entry_id, r2_key, prefix, filename, mime_type, size_bytes
               FROM files WHERE entry_id IN (${placeholders})`
            ).bind(...batch).all();
            for (const row of allFiles) {
              if (!filesByEntry[row.entry_id]) filesByEntry[row.entry_id] = [];
              filesByEntry[row.entry_id].push({ id: row.id, r2_key: row.r2_key, prefix: row.prefix, filename: row.filename, mime_type: row.mime_type, size_bytes: row.size_bytes });
            }
          }
          // S64 audit: mapear from_user→from, to_user→to para compatibilidad frontend
          for (const entry of results) {
            entry.from = entry.from_user;
            entry.to = entry.to_user;
            entry.tags = tagsByEntry[entry.id] || [];
            entry.files = filesByEntry[entry.id] || [];
          }
        }
        return json(results);
      }

      // GET /api/entries/:id — detalle de una entrada (NUEVO S62)
      if (path.startsWith("/api/entries/") && request.method === "GET") {
        const entryId = path.split("/")[3];
        if (!entryId) return err("entry id required", 400);
        const entry = await env.DB.prepare(
          "SELECT * FROM entries WHERE id = ?1 AND is_deleted = 0"
        ).bind(entryId).first();
        if (!entry) return err("Entry not found", 404);
        // Tags
        const { results: tags } = await env.DB.prepare(
          `SELECT t.id, t.label, t.icon, t.color, t.namespace
           FROM entry_tags et JOIN tags t ON t.id = et.tag_id
           WHERE et.entry_id = ?1`
        ).bind(entryId).all();
        entry.tags = tags;
        // S64 audit: mapear from_user→from, to_user→to
        entry.from = entry.from_user;
        entry.to = entry.to_user;
        // Files
        const { results: files } = await env.DB.prepare(
          "SELECT id, r2_key, prefix, filename, mime_type, size_bytes FROM files WHERE entry_id = ?1"
        ).bind(entryId).all();
        entry.files = files;
        return json(entry);
      }

      if (path === "/api/entries" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        // S64 audit: aceptar id y timestamps del cliente; respetar from_user si viene
        const id = body.id || crypto.randomUUID();
        const now = body.created_at || new Date().toISOString();
        const fromUser = body.from_user || userId;
        await env.DB.prepare(
          `INSERT INTO entries (id, era_id, type, title, content, from_user, to_user, created_at, updated_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)`
        ).bind(id, body.era_id||null, body.type||"note", body.title||"",
               JSON.stringify(body.content||{}), fromUser, body.to_user||"both", now).run();
        // Vincular tags si vienen (ADR-023)
        if (Array.isArray(body.tags) && body.tags.length) {
          const stmt = env.DB.prepare("INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?1,?2)");
          await env.DB.batch(body.tags.map(tid => stmt.bind(id, tid)));
        }
        // Vincular archivos si vienen (S62)
        if (Array.isArray(body.file_ids) && body.file_ids.length) {
          const stmt = env.DB.prepare("UPDATE files SET entry_id = ?1 WHERE id = ?2 AND entry_id IS NULL");
          await env.DB.batch(body.file_ids.map(fid => stmt.bind(id, fid)));
        }
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'entry',?3,?4)"
        ).bind("entry_created", userId, id, JSON.stringify({ type: body.type, title: body.title })).run();
        return json({ id, ...body, from_user: userId }, 201);
      }

      // PATCH /api/entries/:id (S62 — con validación de existencia)
      if (path.startsWith("/api/entries/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const ENTRY_FIELDS = new Set(["era_id","type","title","content","to_user"]);
        const entryId = path.split("/")[3];
        // Validar existencia (S62)
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
          sets.push(`updated_at = datetime('now')`);
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

      // DELETE /api/entries/:id (S62 — soft delete con validación)
      if (path.startsWith("/api/entries/") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
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

      // ═══ ERAS (S63 — VAULT CRUD) ════════════════════════
      // GET /api/eras — listado con conteo de entradas
      if (path === "/api/eras" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM eras ORDER BY sort_order, created_at"
        ).all();
        // Enriquecer con conteo de entradas no eliminadas (batched)
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

      // GET /api/eras/:id — detalle de una era (NUEVO S63)
      if (path.startsWith("/api/eras/") && request.method === "GET") {
        const eraId = path.split("/")[3];
        if (!eraId) return err("era id required", 400);
        const era = await env.DB.prepare(
          "SELECT * FROM eras WHERE id = ?1"
        ).bind(eraId).first();
        if (!era) return err("Era not found", 404);
        const { count } = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM entries WHERE era_id = ?1 AND is_deleted = 0"
        ).bind(eraId).first();
        era.entry_count = count || 0;
        return json(era);
      }

      if (path === "/api/eras" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        if (!body.name) return err("name required", 400);
        // S64 audit: aceptar id y timestamps del cliente
        const id = body.id || crypto.randomUUID();
        const now = body.created_at || new Date().toISOString();
        // Usar INSERT...SELECT para sort_order atómico (S63 fix: race condition)
        await env.DB.prepare(
          `INSERT INTO eras (id, name, description, start_date, end_date, color, cover_image, sort_order, created_at, updated_at)
           SELECT ?1,?2,?3,?4,?5,?6,?7, COALESCE(MAX(sort_order), -1) + 1, ?8, ?8 FROM eras`
        ).bind(id, body.name, body.description||"", body.start_date||null, body.end_date||null,
               body.color||"#bfff00", body.cover_image||null, now).run();
        // Si el cliente envió sort_order explícito, actualizarlo
        if (body.sort_order != null) {
          await env.DB.prepare("UPDATE eras SET sort_order = ?1 WHERE id = ?2").bind(body.sort_order, id).run();
        }
        // Leer el sort_order real asignado
        const created = await env.DB.prepare("SELECT sort_order FROM eras WHERE id = ?1").bind(id).first();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'era',?3,?4)"
        ).bind("era_created", userId, id, JSON.stringify({ name: body.name })).run();
        return json({ id, ...body, sort_order: created?.sort_order ?? 0 }, 201);
      }

      // PATCH /api/eras/:id (S63)
      if (path.startsWith("/api/eras/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const ERA_FIELDS = new Set(["name","description","start_date","end_date","color","cover_image","sort_order"]);
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
        sets.push(`updated_at = datetime('now')`);
        await env.DB.prepare(`UPDATE eras SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'era',?3,?4)"
        ).bind("era_updated", userId, eraId, JSON.stringify(body)).run();
        return json({ id: eraId, ...body });
      }

      // DELETE /api/eras/:id (S63)
      if (path.startsWith("/api/eras/") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
        const eraId = path.split("/")[3];
        const exists = await env.DB.prepare("SELECT id FROM eras WHERE id = ?1").bind(eraId).first();
        if (!exists) return err("Era not found", 404);
        // Desvincular entries: set era_id = NULL
        await env.DB.prepare("UPDATE entries SET era_id = NULL WHERE era_id = ?1").bind(eraId).run();
        await env.DB.prepare("DELETE FROM eras WHERE id = ?1").bind(eraId).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'era',?3)"
        ).bind("era_deleted", userId, eraId).run();
        return json({ ok: true, id: eraId });
      }

      // ═══ FILES (S63 — listado R2) ════════════════════════
      if (path === "/api/files" && request.method === "GET") {
        const entry = url.searchParams.get("entry_id");
        const prefix = url.searchParams.get("prefix");
        const track = url.searchParams.get("track_id");
        let q = "SELECT * FROM files WHERE 1=1";
        const binds = [];
        if (entry) { q += " AND entry_id = ?1"; binds.push(entry); }
        if (prefix) { q += ` AND prefix = ?${binds.length + 1}`; binds.push(prefix); }
        if (track) { q += ` AND track_id = ?${binds.length + 1}`; binds.push(track); }
        q += " ORDER BY created_at DESC LIMIT 200";
        const { results } = binds.length
          ? await env.DB.prepare(q).bind(...binds).all()
          : await env.DB.prepare(q).all();
        return json(results);
      }

      // ═══ QUEUE ════════════════════════════════════════════
      if (path.startsWith("/api/queue/") && request.method === "GET") {
        const queueUser = path.split("/")[3];
        const { results } = await env.DB.prepare(
          "SELECT * FROM queue_items WHERE user_id = ?1 ORDER BY position"
        ).bind(queueUser).all();
        // Transformar is_manual (0/1) → _manual (boolean) para frontend
        return json(results.map(r => ({ ...r, _manual: !!r.is_manual })));
      }

      if (path.startsWith("/api/queue/") && request.method === "PUT") {
        if (!userId) return err("Unauthorized", 401);
        const queueUser = path.split("/")[3];
        const body = await request.json().catch(() => null);
        if (!body) return err("Invalid JSON body", 400);
        const items = body.items || (body.track_ids || []).map(tid => ({ track_id: tid, is_manual: 1 }));
        await env.DB.prepare("DELETE FROM queue_items WHERE user_id = ?1").bind(queueUser).run();
        if (items.length) {
          const stmt = env.DB.prepare(
            "INSERT INTO queue_items (user_id, track_id, position, is_manual, context_name) VALUES (?1,?2,?3,?4,?5)"
          );
          await env.DB.batch(items.map((item, i) =>
            stmt.bind(queueUser, item.track_id, i, item.is_manual ? 1 : 0, body.context_name || null)
          ));
        }
        return json({ ok: true, count: items.length });
      }

      // ═══ EVENTS (ADR-019) ═════════════════════════════════
      if (path === "/api/events" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json().catch(() => null);
        if (!body) return err("Invalid JSON body", 400);
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,?3,?4,?5)"
        ).bind(body.event_type, userId, body.entity_type||null, body.entity_id||null, JSON.stringify(body.payload||{})).run();
        return json({ ok: true, event_type: body.event_type }, 201);
      }

      if (path === "/api/events" && request.method === "GET") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
        const type = url.searchParams.get("type");
        const since = url.searchParams.get("since");
        const until = url.searchParams.get("until");
        let q = "SELECT * FROM events WHERE 1=1";
        const binds = [];
        if (type) { q += " AND event_type = ?1"; binds.push(type); }
        if (since) { q += ` AND created_at >= ?${binds.length + 1}`; binds.push(since); }
        if (until) { q += ` AND created_at <= ?${binds.length + 1}`; binds.push(until); }
        q += ` ORDER BY created_at DESC LIMIT ?${binds.length + 1}`;
        binds.push(limit);
        const { results } = await env.DB.prepare(q).bind(...binds).all();
        return json(results);
      }

      // ═══ TIME CAPSULES (S68 — ADR-020) ═══════════════════
      if (path === "/api/time_capsules" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM time_capsules ORDER BY created_at DESC LIMIT 100"
        ).all();
        return json(results);
      }

      if (path === "/api/time_capsules" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json().catch(() => null);
        if (!body?.title || !body?.unlock_at) return err("title and unlock_at required", 400);
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO time_capsules (id, title, description, unlock_at, created_by)
           VALUES (?1,?2,?3,?4,?5)`
        ).bind(id, body.title, body.description||"", body.unlock_at, userId).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'time_capsule',?3,?4)"
        ).bind("capsule_created", userId, id, JSON.stringify({ title: body.title })).run();
        return json({ id, title: body.title, unlock_at: body.unlock_at, created_by: userId }, 201);
      }

      // PATCH /api/time_capsules/:id — unlock (S68)
      if (path.startsWith("/api/time_capsules/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const capsuleId = path.split("/")[3];
        const body = await request.json().catch(() => null);
        if (body?.is_unlocked) {
          await env.DB.prepare("UPDATE time_capsules SET is_unlocked = 1, unlocked_at = datetime('now') WHERE id = ?1").bind(capsuleId).run();
          await env.DB.prepare(
            "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'time_capsule',?3,?4)"
          ).bind("capsule_unlocked", userId, capsuleId, JSON.stringify({ title: "desbloqueado" })).run();
        }
        return json({ ok: true, id: capsuleId });
      }

      // ═══ UPLOAD: pre-signed URL R2 (S57 — ADR-022) ═══════
      if (path === "/api/upload" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json().catch(() => null);
        if (!body?.prefix || !body?.filename) return err("prefix and filename required", 400);
        // Validar prefix
        const VALID_PREFIXES = ["music", "vault/photos", "vault/videos", "vault/docs", "vault/audio"];
        if (!VALID_PREFIXES.includes(body.prefix)) return err(`Invalid prefix. Valid: ${VALID_PREFIXES.join(", ")}`, 400);
        const r2_key = `${body.prefix}/${crypto.randomUUID()}_${body.filename}`;
        // Guardar referencia en files y devolver r2_key para upload directo
        const fileId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO files (id, entry_id, track_id, r2_key, r2_bucket, prefix, filename, mime_type, size_bytes, uploaded_by)
           VALUES (?1,?2,?3,?4,'el-bunker-music',?5,?6,?7,?8,?9)`
        ).bind(fileId, body.entry_id||null, body.track_id||null, r2_key,
               body.prefix, body.filename, body.mime_type||null, body.size_bytes||null, userId).run();
        return json({ r2_key, file_id: fileId }, 201);
      }

      // PUT /api/upload/:key — subir binario directo a R2 (S57)
      if (path.startsWith("/api/upload/") && request.method === "PUT") {
        if (!userId) return err("Unauthorized", 401);
        const r2_key = decodeURIComponent(path.split("/api/upload/")[1]);
        if (!r2_key) return err("r2_key required", 400);
        const data = await request.arrayBuffer();
        await env.BUNKER.put(r2_key, data, {
          httpMetadata: { contentType: request.headers.get("Content-Type") || "application/octet-stream" },
        });
        return json({ ok: true, r2_key, size: data.byteLength }, 201);
      }

      // ═══ R2: servir archivos (streaming audio, imágenes, etc.) ══
      if (request.method === "GET" && !path.startsWith("/api/")) {
        const r2_key = path.slice(1); // quitar / inicial
        if (!r2_key) return err("Not found", 404);
        const obj = await env.BUNKER.get(r2_key);
        if (!obj) return err("Not found", 404);
        return new Response(obj.body, {
          headers: {
            "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
            "Content-Length": obj.size,
            "Accept-Ranges": "bytes",
            ...CORS_HEADERS,
          },
        });
      }

      // ═══ 404 ══════════════════════════════════════════════
      return err("Not found", 404);

    } catch (e) {
      console.error("[Búnker Worker]", e);
      return err(e.message || "Internal server error", 500);
    }
  },
};
