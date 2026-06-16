// ============================================================
//  EL BÚNKER — workers/routes/sync.js
//  POST/GET /api/sync — Escucha Compartida (Fase C, SC1-SC14)
//  Long-polling: GET bloquea hasta 25s esperando cambios,
//  POST publica eventos de sincronización.
// ============================================================

import { json, err } from "../utils/response.js";

const POLL_TIMEOUT = 25000;  // 25s max (Cloudflare free tier: 30s)
const POLL_INTERVAL = 2000;  // Check every 2s

export default async function handleSync(request, env, url, userId) {
  if (!userId) return err("Unauthorized", 401);

  if (request.method === "GET") {
    const action = url.searchParams.get("action");

    // SC5/SC14: Presence check — ¿está el otro usuario escuchando?
    if (action === "presence") {
      const otherUser = userId === "edu" ? "david" : "edu";
      const presence = await env.DB.prepare(
        "SELECT value FROM app_config WHERE key = ?"
      ).bind(`presence_${otherUser}`).first();

      if (!presence) return json({ active: false });

      try {
        const data = JSON.parse(presence.value);
        const age = Date.now() - (data.updated_at || 0);
        // Presencia viva si el heartbeat es de los últimos 5 minutos
        if (age < 5 * 60 * 1000) {
          return json({ active: true, active_track: { id: data.track_id, title: data.track_title } });
        }
      } catch { /* valor corrupto */ }

      return json({ active: false });
    }

    // Long-polling: esperar cambios desde `since`
    const since = parseInt(url.searchParams.get("since") || "0", 10);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return json({ active: false });

    const deadline = Date.now() + POLL_TIMEOUT;

    while (Date.now() < deadline) {
      const session = await env.DB.prepare(
        "SELECT * FROM shared_sessions WHERE id = ?"
      ).bind(sessionId).first();

      if (!session) return json({ active: false, ended: true });

      const sessionUpdated = new Date(session.updated_at).getTime();
      if (sessionUpdated > since) {
        return json({
          active: true,
          session_id: session.id,
          host_id: session.host_user_id,
          guest_id: session.guest_user_id,
          active_track_id: session.active_track_id,
          position: session.position,
          is_playing: session.is_playing === 1,
          action: session.last_action,
          action_by: session.last_action_by,
          queue_json: session.queue_json ? JSON.parse(session.queue_json) : [],
          updated_at: session.updated_at,
        });
      }

      // Esperar antes del siguiente poll
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }

    // Timeout — no hay cambios
    return json({ active: true, unchanged: true, timeout: true });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body) return err("Invalid JSON", 400);

    const { action, session_id, track_id, position, is_playing, queue } = body;

    // HEARTBEAT: actualizar presencia (SC5)
    if (action === "heartbeat") {
      const { track_id, track_title } = body;
      const presence = JSON.stringify({
        track_id: track_id || null,
        track_title: track_title || null,
        updated_at: Date.now(),
      });
      await env.DB.prepare(
        "INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)"
      ).bind(`presence_${userId}`, presence).run();
      return json({ ok: true });
    }

    // CREATE session (join/heart)
    if (action === "create") {
      const sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await env.DB.prepare(
        `INSERT INTO shared_sessions (id, host_user_id, guest_user_id, active_track_id, position,
         is_playing, last_action, last_action_by, queue_json, created_at, updated_at)
         VALUES (?, ?, NULL, NULL, 0, 0, 'created', ?, '[]', datetime('now'), datetime('now'))`
      ).bind(sessionId, userId).run();
      return json({ session_id: sessionId, active: true, host_id: userId });
    }

    // JOIN session
    if (action === "join" && session_id) {
      const session = await env.DB.prepare(
        "SELECT * FROM shared_sessions WHERE id = ?"
      ).bind(session_id).first();
      if (!session) return err("Session not found", 404);

      await env.DB.prepare(
        `UPDATE shared_sessions SET guest_user_id = ?, last_action = 'joined',
         last_action_by = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(userId, userId, session_id).run();

      return json({
        active: true,
        session_id,
        active_track_id: session.active_track_id,
        position: session.position,
        is_playing: session.is_playing === 1,
        queue_json: session.queue_json ? JSON.parse(session.queue_json) : [],
      });
    }

    // LEAVE session
    if (action === "leave" && session_id) {
      const session = await env.DB.prepare(
        "SELECT * FROM shared_sessions WHERE id = ?"
      ).bind(session_id).first();
      if (!session) return err("Session not found", 404);

      if (session.guest_user_id === userId) {
        // Guest leaves — clear guest
        await env.DB.prepare(
          `UPDATE shared_sessions SET guest_user_id = NULL, last_action = 'left',
           last_action_by = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(userId, session_id).run();
      } else if (session.host_user_id === userId) {
        // Host leaves — end session
        await env.DB.prepare(
          `DELETE FROM shared_sessions WHERE id = ?`
        ).bind(session_id).run();
      }

      return json({ active: false, ended: true });
    }

    // SYNC: play/pause/skip/seek events
    if (session_id) {
      await env.DB.prepare(
        `UPDATE shared_sessions SET active_track_id = COALESCE(?, active_track_id),
         position = COALESCE(?, position), is_playing = COALESCE(?, is_playing),
         queue_json = COALESCE(?, queue_json),
         last_action = ?, last_action_by = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).bind(
        track_id || null,
        position != null ? position : null,
        is_playing != null ? (is_playing ? 1 : 0) : null,
        queue ? JSON.stringify(queue) : null,
        action,
        userId,
        session_id
      ).run();

      return json({ ok: true });
    }

    return err("session_id required for sync actions", 400);
  }

  // END session (DELETE)
  if (request.method === "DELETE") {
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return err("session_id required", 400);
    await env.DB.prepare("DELETE FROM shared_sessions WHERE id = ?").bind(sessionId).run();
    return json({ ended: true });
  }

  return err("Method not allowed", 405);
}
