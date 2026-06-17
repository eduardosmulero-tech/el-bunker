// ============================================================
//  EL BÚNKER — workers/routes/sync.js
//  POST/GET /api/sync — Escucha Compartida (Fase C, SC1-SC14)
//  Long-polling: GET bloquea hasta 25s esperando cambios,
//  POST publica eventos de sincronización.
// ============================================================

import { json, err } from "../utils/response.js";

const POLL_TIMEOUT = 20000;  // 20s max
const POLL_INTERVAL = 1000;  // Check every 1s

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

      let response = { active: false };

      if (presence) {
        try {
          const data = JSON.parse(presence.value);
          const age = Date.now() - (data.updated_at || 0);
          if (age < 5 * 60 * 1000) {
            response = { active: true, active_track: { id: data.track_id, title: data.track_title, vibe: data.track_vibe || null } };
          }
        } catch { /* valor corrupto */ }
      }

      // SC5: check for pending session from the other user (auto-join)
      if (response.active) {
        const pendingSession = await env.DB.prepare(
          `SELECT id FROM shared_sessions
           WHERE host_user_id = ? AND guest_user_id IS NULL
           ORDER BY created_at DESC LIMIT 1`
        ).bind(otherUser).first();
        if (pendingSession) {
          response.pending_session_id = pendingSession.id;
        }
      }

      return json(response);
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

    const { action, session_id, track_id, position, is_playing, queue, track_data } = body;

    // HEARTBEAT: actualizar presencia (SC5)
    if (action === "heartbeat") {
      const { track_id, track_title, track_vibe } = body;
      const presence = JSON.stringify({
        track_id: track_id || null,
        track_title: track_title || null,
        track_vibe: track_vibe || null,
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
      ).bind(sessionId, userId, userId).run();
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

    // SC2: queue_remove — remove track from session queue
    if (action === "queue_remove" && session_id && track_id) {
      const session = await env.DB.prepare(
        "SELECT * FROM shared_sessions WHERE id = ?"
      ).bind(session_id).first();
      if (!session) return err("Session not found", 404);

      let q = [];
      try { q = session.queue_json ? JSON.parse(session.queue_json) : []; } catch { q = []; }
      q = q.filter(t => t.id !== track_id);

      await env.DB.prepare(
        `UPDATE shared_sessions SET queue_json = ?, last_action = 'queue_remove',
         last_action_by = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(JSON.stringify(q), userId, session_id).run();

      return json({ ok: true });
    }

    // SC2: queue_add — merge track into session queue with attribution
    if (action === "queue_add" && session_id && track_data) {
      const session = await env.DB.prepare(
        "SELECT * FROM shared_sessions WHERE id = ?"
      ).bind(session_id).first();
      if (!session) return err("Session not found", 404);

      let q = [];
      try { q = session.queue_json ? JSON.parse(session.queue_json) : []; } catch { q = []; }
      q.push({
        id: track_data.id,
        title: track_data.title || null,
        artist: track_data.artist || null,
        tag: track_data.tag || null,
        _added_by: userId,
        _added_by_name: userId === "edu" ? "Edu" : userId === "david" ? "David" : userId,
        _added_at: new Date().toISOString(),
        _manual: true,
      });

      await env.DB.prepare(
        `UPDATE shared_sessions SET queue_json = ?, last_action = 'queue_add',
         last_action_by = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(JSON.stringify(q), userId, session_id).run();

      return json({ ok: true, added_by: userId });
    }

    // SYNC: play/pause/skip/seek events
    if (session_id) {
      if (action === "sync") {
        // Position heartbeat — NO tocar last_action ni updated_at para no solapar acciones reales
        await env.DB.prepare(
          `UPDATE shared_sessions SET position = COALESCE(?, position),
           is_playing = COALESCE(?, is_playing) WHERE id = ?`
        ).bind(
          position != null ? position : null,
          is_playing != null ? (is_playing ? 1 : 0) : null,
          session_id
        ).run();
      } else {
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
      }

      return json({ ok: true });
    }

    return err("session_id required for sync actions", 400);
  }

  // END session (DELETE)
  if (request.method === "DELETE") {
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return err("session_id required", 400);
    const session = await env.DB.prepare("SELECT queue_json FROM shared_sessions WHERE id = ?").bind(sessionId).first();
    let finalQueue = [];
    if (session) { try { finalQueue = JSON.parse(session.queue_json || '[]'); } catch {} }
    await env.DB.prepare("DELETE FROM shared_sessions WHERE id = ?").bind(sessionId).run();
    return json({ ended: true, queue_json: finalQueue });
  }

  return err("Method not allowed", 405);
}
