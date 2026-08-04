// ============================================================
//  EL BÚNKER — workers/utils/validation.js
//  Validaciones compartidas para POST (pliego R11 / BUG-5)
// ============================================================

// Whitelist exhaustiva de event_type emitidos por la app (4-ago-2026):
// workers/routes/* (bind directo + emitEvent), src/core/StatsEngine.js,
// src/smoke/SmokeSession.jsx y el mapa de iconos de Timeline.jsx.
export const EVENT_TYPES = new Set([
  "auth_login",
  "capsule_created",
  "capsule_opened",
  "capsule_sealed",
  "capsule_unlocked",
  "drop_deleted",
  "drop_seen",
  "drop_sent",
  "entry_created",
  "entry_deleted",
  "entry_updated",
  "era_created",
  "era_deleted",
  "era_updated",
  "playlist_created",
  "playlist_deleted",
  "playlist_track_removed",
  "playlist_tracks_reordered",
  "playlists_reordered",
  "shared_session_joined",
  "shared_session_left",
  "shared_session_started",
  "smoke_session_abandoned",
  "smoke_session_completed",
  "smoke_session_started",
  "tag_created",
  "tag_deleted",
  "track_created",
  "track_deleted",
  "track_pause",
  "track_play",
  "track_skip",
]);

// IDs de usuario válidos (tabla users en D1: admin, edu, david — ADR-006)
export const USER_IDS = new Set(["admin", "edu", "david"]);

/** Devuelve el string recortado o null si no es un string no vacío. */
export function cleanString(value, maxLength = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

/** True si el tipo es un event_type conocido de la app. */
export function isValidEventType(value) {
  return typeof value === "string" && EVENT_TYPES.has(value);
}

/** True si el id es un usuario de la whitelist (ADR-006). */
export function isValidUserId(value) {
  return typeof value === "string" && USER_IDS.has(value);
}
