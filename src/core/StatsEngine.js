// ============================================================
//  EL BÚNKER — StatsEngine.js
//  Emisor de eventos al Worker (ADR-019)
//  Todos los módulos emiten eventos aquí. Append-only.
//  S57 · Fase 1 — Infraestructura Cloudflare
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

let _token = null;

/** Configurar el token JWT antes de emitir eventos. */
export function setStatsToken(token) {
  _token = token;
}

/**
 * emit(type, payload)
 * Emite un evento inmutable a la tabla events de D1.
 * Fire-and-forget: la UI no espera respuesta.
 *
 * @param {string} type   — track_play|track_pause|track_skip|drop_sent|entry_created|...
 * @param {object} payload — datos específicos del evento (entity_type, entity_id, etc.)
 */
export async function emit(type, payload = {}) {
  if (!_token) {
    console.warn("[StatsEngine] Sin token JWT — evento no emitido:", type);
    return;
  }
  try {
    await fetch(`${API_BASE}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${_token}`,
      },
      body: JSON.stringify({
        event_type: type,
        entity_type: payload.entity_type || null,
        entity_id: payload.entity_id || null,
        payload: payload.payload || payload,
      }),
    });
  } catch (e) {
    // Fire-and-forget: no interrumpir la UX por un evento fallido
    console.warn("[StatsEngine] Evento no emitido:", type, e.message);
  }
}

// ─── Helpers tipados ─────────────────────────────────────────

export const trackPlay = (trackId, title) =>
  emit("track_play", { entity_type: "track", entity_id: trackId, payload: { title } });

export const trackPause = (trackId, position) =>
  emit("track_pause", { entity_type: "track", entity_id: trackId, payload: { position } });

export const trackSkip = (trackId, reason) =>
  emit("track_skip", { entity_type: "track", entity_id: trackId, payload: { reason } });

export const dropSent = (trackId, toUser) =>
  emit("drop_sent", { entity_type: "drop", entity_id: trackId, payload: { to_user: toUser } });

export const entryCreated = (entryId, type, title) =>
  emit("entry_created", { entity_type: "entry", entity_id: entryId, payload: { type, title } });

export const smokeSessionCompleted = (duration, vibe) =>
  emit("smoke_session_completed", { entity_type: "smoke", payload: { duration, vibe } });

export const capsuleUnlocked = (capsuleId, title) =>
  emit("capsule_unlocked", { entity_type: "capsule", entity_id: capsuleId, payload: { title } });

export default { emit, setStatsToken, trackPlay, trackPause, trackSkip, dropSent, entryCreated, smokeSessionCompleted, capsuleUnlocked };
