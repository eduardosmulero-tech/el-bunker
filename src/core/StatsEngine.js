// ============================================================
//  EL BÚNKER — StatsEngine.js
//  Emisor de eventos al Worker (ADR-019)
//  Todos los módulos emiten eventos aquí. Append-only.
//  S115-D3: migrado a WorkerClient (token via singleton)
// ============================================================

import { workerClient } from "./WorkerClient";

/** @deprecated S115-D3: token ahora via workerClient singleton. Se mantiene por compatibilidad. */
export function setStatsToken(token) {
  workerClient.setToken(token);
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
  if (!workerClient.hasToken()) {
    console.warn("[StatsEngine] Sin token JWT — evento no emitido:", type);
    return;
  }
  try {
    await workerClient.post(`/api/events`, {
      event_type: type,
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id || null,
      payload: payload.payload || payload,
    });
  } catch (e) {
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
