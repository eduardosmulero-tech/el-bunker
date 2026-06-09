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
        let q = "SELECT * FROM tracks WHERE is_deleted = 0";
        const binds = [];
        if (era) { q += " AND era_id = ?1"; binds.push(era); }
        if (vibe) { q += ` AND tag_id = ?${binds.length + 1}`; binds.push(vibe); }
        q += " ORDER BY created_at DESC";
        const stmt = env.DB.prepare(q);
        const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
        return json(results);
      }

      if (path === "/api/tracks" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO tracks (id, era_id, title, artist, tag_id, r2_key, format, note, duration, thumbnail, added_by)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`
        ).bind(id, body.era_id||null, body.title, body.artist||"", body.tag_id||null,
               body.r2_key||null, body.format||"mp3", body.note||"", body.duration||null,
               body.thumbnail||null, userId).run();
        // Emitir evento (ADR-019)
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'track',?3,?4)"
        ).bind("track_created", userId, id, JSON.stringify({ title: body.title })).run();
        return json({ id, ...body, added_by: userId }, 201);
      }

      // PATCH /api/tracks/:id (S55)
      if (path.startsWith("/api/tracks/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const trackId = path.split("/")[3];
        const body = await request.json();
        const sets = []; const binds = [];
        for (const [k, v] of Object.entries(body)) {
          if (["id","created_at","added_by","is_deleted"].includes(k)) continue;
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
        return json(results);
      }

      if (path === "/api/drops" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO drops (id, era_id, track_id, from_user, to_user, drop_date, memory, mood)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8)`
        ).bind(id, body.era_id||null, body.track_id||null, userId, body.to_user||userId,
               body.drop_date||null, body.memory||"", body.mood||"").run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'drop',?3,?4)"
        ).bind("drop_sent", userId, id, JSON.stringify({ to_user: body.to_user||userId, track_id: body.track_id })).run();
        return json({ id, ...body, from_user: userId }, 201);
      }

      // ═══ PLAYLISTS ════════════════════════════════════════
      if (path === "/api/playlists" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM playlists ORDER BY created_at DESC"
        ).all();
        return json(results);
      }

      if (path === "/api/playlists" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO playlists (id, name, description, created_by) VALUES (?1,?2,?3,?4)"
        ).bind(id, body.name, body.description||"", userId).run();
        return json({ id, ...body, created_by: userId }, 201);
      }

      // PATCH /api/playlists/:id (S55)
      if (path.startsWith("/api/playlists/") && !path.includes("/tracks") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const plId = path.split("/")[3];
        const body = await request.json();
        const sets = []; const binds = [];
        for (const [k, v] of Object.entries(body)) {
          if (["id","created_at","created_by"].includes(k)) continue;
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
      if (path.startsWith("/api/playlists/") && !path.includes("/tracks") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
        const plId = path.split("/")[3];
        await env.DB.prepare("DELETE FROM playlists WHERE id = ?1").bind(plId).run();
        return json({ ok: true, id: plId });
      }

      // POST /api/playlists/:id/tracks (S55)
      if (path.endsWith("/tracks") && request.method === "POST") {
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
        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO tags (id, namespace, label, icon, color, created_by) VALUES (?1,?2,?3,?4,?5,?6)"
        ).bind(id, body.namespace||"music", body.label, body.icon||"◈", body.color||"#ffffff", userId).run();
        return json({ id, ...body, created_by: userId }, 201);
      }

      // PATCH /api/tags/:id (S55)
      if (path.startsWith("/api/tags/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const tagId = path.split("/")[3];
        const body = await request.json();
        const sets = []; const binds = [];
        for (const [k, v] of Object.entries(body)) {
          if (["id","created_at","created_by"].includes(k)) continue;
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

      // ═══ ENTRIES (S56 — VAULT CRUD) ═══════════════════════
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
        const stmt = env.DB.prepare(q);
        const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
        return json(results);
      }

      if (path === "/api/entries" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO entries (id, era_id, type, title, content, from_user, to_user)
           VALUES (?1,?2,?3,?4,?5,?6,?7)`
        ).bind(id, body.era_id||null, body.type||"note", body.title||"",
               JSON.stringify(body.content||{}), userId, body.to_user||"both").run();
        // Vincular tags si vienen (ADR-023)
        if (Array.isArray(body.tags) && body.tags.length) {
          const stmt = env.DB.prepare("INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?1,?2)");
          await env.DB.batch(body.tags.map(tid => stmt.bind(id, tid)));
        }
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'entry',?3,?4)"
        ).bind("entry_created", userId, id, JSON.stringify({ type: body.type, title: body.title })).run();
        return json({ id, ...body, from_user: userId }, 201);
      }

      // PATCH /api/entries/:id (S56)
      if (path.startsWith("/api/entries/") && request.method === "PATCH") {
        if (!userId) return err("Unauthorized", 401);
        const entryId = path.split("/")[3];
        const body = await request.json();
        const { tags, ...fields } = body;
        const sets = []; const binds = [];
        for (const [k, v] of Object.entries(fields)) {
          if (["id","created_at","from_user","is_deleted"].includes(k)) continue;
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
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'entry',?3)"
        ).bind("entry_updated", userId, entryId).run();
        return json({ id: entryId, ...body });
      }

      // DELETE /api/entries/:id (S56 — soft delete)
      if (path.startsWith("/api/entries/") && request.method === "DELETE") {
        if (!userId) return err("Unauthorized", 401);
        const entryId = path.split("/")[3];
        await env.DB.prepare("UPDATE entries SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?1").bind(entryId).run();
        await env.DB.prepare(
          "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'entry',?3)"
        ).bind("entry_deleted", userId, entryId).run();
        return json({ ok: true, id: entryId });
      }

      // ═══ QUEUE ════════════════════════════════════════════
      if (path.startsWith("/api/queue/") && request.method === "GET") {
        const queueUser = path.split("/")[3];
        const { results } = await env.DB.prepare(
          "SELECT * FROM queue_items WHERE user_id = ?1 ORDER BY position"
        ).bind(queueUser).all();
        return json(results);
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

      // ═══ UPLOAD: pre-signed URL R2 (S57 — ADR-022) ═══════
      if (path === "/api/upload" && request.method === "POST") {
        if (!userId) return err("Unauthorized", 401);
        const body = await request.json().catch(() => null);
        if (!body?.prefix || !body?.filename) return err("prefix and filename required", 400);
        // Validar prefix
        const VALID_PREFIXES = ["music", "vault/photos", "vault/videos", "vault/docs", "vault/audio"];
        if (!VALID_PREFIXES.includes(body.prefix)) return err(`Invalid prefix. Valid: ${VALID_PREFIXES.join(", ")}`, 400);
        const r2_key = `${body.prefix}/${crypto.randomUUID()}_${body.filename}`;
        // Generar pre-signed URL para PUT directo a R2 (válida 15 min)
        const uploadUrl = await env.BUNKER.createMultipartUpload(r2_key); // placeholder — ver abajo
        // Guardar referencia en files
        const fileId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO files (id, entry_id, track_id, r2_key, r2_bucket, prefix, filename, mime_type, size_bytes, uploaded_by)
           VALUES (?1,?2,?3,?4,'el-bunker-music',?5,?6,?7,?8,?9)`
        ).bind(fileId, body.entry_id||null, body.track_id||null, r2_key,
               body.prefix, body.filename, body.mime_type||null, body.size_bytes||null, userId).run();
        return json({ r2_key, upload_url: uploadUrl, file_id: fileId }, 201);
      }

      // ═══ 404 ══════════════════════════════════════════════
      return err("Not found", 404);

    } catch (e) {
      console.error("[Búnker Worker]", e);
      return err(e.message || "Internal server error", 500);
    }
  },
};
