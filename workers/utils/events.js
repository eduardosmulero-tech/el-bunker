// ============================================================
//  EL BÚNKER — workers/utils/events.js
//  Helper server-side para append-only events (ADR-019).
//  Fire-and-forget: try/catch evita que un fallo de stats rompa la sesión.
//  Payload sin cap server-side: D1 TEXT admite hasta ~1MB; el cap 4KB
//  solo aplica al endpoint /api/events HTTP (cliente).
// ============================================================

/**
 * emitEvent — INSERT directo en tabla events desde el worker.
 *
 * @param {object} env   — Worker env (necesita env.DB)
 * @param {string} event_type — ej: 'shared_session_started', 'shared_session_joined'
 * @param {string} userId    — actor (de authenticate()). 'edu' | 'david' | 'admin'
 * @param {string} entity_type — ej: 'session' | 'track' | 'drop'
 * @param {string} entity_id  — ej: session_id
 * @param {object} payload    — datos específicos (auto JSON.stringify)
 * @returns {Promise<void>}
 */
export async function emitEvent(env, event_type, userId, entity_type, entity_id, payload = {}) {
  try {
    const serialized = JSON.stringify(payload);
    // Warn-only: server-side sin cap. Log para monitoring de payloads anómalos.
    if (serialized.length > 4096) {
      console.warn(
        `[events] payload '${event_type}' is ${serialized.length} chars (>4KB HTTP cap) — OK server-side`
      );
    }
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1, ?2, ?3, ?4, ?5)"
    ).bind(
      event_type,
      userId,
      entity_type || null,
      entity_id || null,
      serialized
    ).run();
  } catch (e) {
    console.warn(`[events] emit failed for ${event_type}:`, e.message);
    // Fire-and-forget: stats no debe romper la operación principal.
  }
}
