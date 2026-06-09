// ============================================================
//  EL BÚNKER — worker.js
//  Cloudflare Workers · Thin REST layer (ADR-024)
//  Bindings: DB (D1), BUNKER (R2)
//  S54 · Fase 1 — Infraestructura Cloudflare
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

function error(message, status = 500) {
  return json({ error: message }, status);
}

// ═══ JWT AUTH (placeholder — S56 implementa firma real) ═════
async function authenticate(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth) return null;
  try {
    const token = auth.replace("Bearer ", "");
    // TODO S56: verify JWT signature with env.JWT_SECRET
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub; // user_id
  } catch {
    return null;
  }
}

// ═══ ROUTER ══════════════════════════════════════════════════
export default {
  async fetch(request, env) {
    // CORS preflight
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
        return json({
          status: "ok",
          db: !!dbOk,
          auth: !!userId,
          timestamp: new Date().toISOString(),
        });
      }

      // ── Tracks ───────────────────────────────────────────
      if (path === "/api/tracks" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM tracks WHERE is_deleted = 0 ORDER BY created_at DESC"
        ).all();
        return json(results);
      }

      if (path === "/api/tracks" && request.method === "POST") {
        if (!userId) return error("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO tracks (id, era_id, title, artist, tag_id, r2_key, format, note, duration, thumbnail, added_by)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
        ).bind(id, body.era_id || null, body.title, body.artist || "", body.tag_id || null,
               body.r2_key || null, body.format || "mp3",
               body.note || "", body.duration || null, body.thumbnail || null, userId).run();
        return json({ id, ...body, added_by: userId }, 201);
      }

      // ── Drops ────────────────────────────────────────────
      if (path === "/api/drops" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM drops ORDER BY created_at DESC LIMIT 200"
        ).all();
        return json(results);
      }

      if (path === "/api/drops" && request.method === "POST") {
        if (!userId) return error("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO drops (id, era_id, track_id, from_user, to_user, drop_date, memory, mood)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        ).bind(id, body.era_id || null, body.track_id || null, userId, body.to_user || userId,
               body.drop_date || null, body.memory || "", body.mood || "").run();
        return json({ id, ...body, from_user: userId }, 201);
      }

      // ── Playlists ────────────────────────────────────────
      if (path === "/api/playlists" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM playlists ORDER BY created_at DESC"
        ).all();
        return json(results);
      }

      if (path === "/api/playlists" && request.method === "POST") {
        if (!userId) return error("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO playlists (id, name, description, created_by) VALUES (?1, ?2, ?3, ?4)"
        ).bind(id, body.name, body.description || "", userId).run();
        return json({ id, ...body, created_by: userId }, 201);
      }

      // ── Tags ─────────────────────────────────────────────
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
        if (!userId) return error("Unauthorized", 401);
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO tags (id, namespace, label, icon, color, created_by)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
        ).bind(id, body.namespace || "music", body.label, body.icon || "◈",
               body.color || "#ffffff", userId).run();
        return json({ id, ...body, created_by: userId }, 201);
      }

      // ── Queue ────────────────────────────────────────────
      if (path.startsWith("/api/queue/") && request.method === "GET") {
        const queueUser = path.split("/")[3];
        const { results } = await env.DB.prepare(
          "SELECT * FROM queue_items WHERE user_id = ?1 ORDER BY position"
        ).bind(queueUser).all();
        return json(results);
      }

      if (path.startsWith("/api/queue/") && request.method === "PUT") {
        if (!userId) return error("Unauthorized", 401);
        const queueUser = path.split("/")[3];
        const body = await request.json().catch(() => null);
        if (!body) return error("Invalid JSON body", 400);
        // Q14: aceptar { items: [{ track_id, is_manual }], context_name }
        // o formato legacy { track_ids: string[], context_name }
        const items = body.items || (body.track_ids || []).map((tid) => ({ track_id: tid, is_manual: 1 }));
        await env.DB.prepare("DELETE FROM queue_items WHERE user_id = ?1").bind(queueUser).run();
        if (items.length) {
          const stmt = env.DB.prepare(
            "INSERT INTO queue_items (user_id, track_id, position, is_manual, context_name) VALUES (?1, ?2, ?3, ?4, ?5)"
          );
          const batch = items.map((item, i) =>
            stmt.bind(queueUser, item.track_id, i, item.is_manual ? 1 : 0, body.context_name || null)
          );
          await env.DB.batch(batch);
        }
        return json({ ok: true, count: items.length });
      }

      // ── Events (ADR-019 — append-only) ───────────────────
      if (path === "/api/events" && request.method === "POST") {
        if (!userId) return error("Unauthorized", 401);
        const body = await request.json().catch(() => null);
        if (!body) return error("Invalid JSON body", 400);
        await env.DB.prepare(
          `INSERT INTO events (event_type, user_id, entity_type, entity_id, payload)
           VALUES (?1, ?2, ?3, ?4, ?5)`
        ).bind(body.event_type, userId, body.entity_type || null,
               body.entity_id || null, JSON.stringify(body.payload || {})).run();
        return json({ ok: true, event_type: body.event_type }, 201);
      }

      if (path === "/api/events" && request.method === "GET") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
        const type = url.searchParams.get("type");
        const query = type
          ? "SELECT * FROM events WHERE event_type = ?1 ORDER BY created_at DESC LIMIT ?2"
          : "SELECT * FROM events ORDER BY created_at DESC LIMIT ?1";
        const { results } = type
          ? await env.DB.prepare(query).bind(type, limit).all()
          : await env.DB.prepare(query).bind(limit).all();
        return json(results);
      }

      // ── 404 ──────────────────────────────────────────────
      return error("Not found", 404);

    } catch (err) {
      console.error("[Búnker Worker]", err);
      return error(err.message || "Internal server error", 500);
    }
  },
};
