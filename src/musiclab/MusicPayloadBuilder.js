// Pure MusicLab payload transformations.
// No network, persistence, React context, or audio dependencies.

const ALLOWED_TRACK_KEYS = new Set([
  "era_id", "title", "artist", "tag_id", "r2_key", "format", "note",
  "duration", "thumbnail", "drive_file_id", "color", "play_count", "last_played",
]);

export function buildEditPayload(updatedTrack = {}) {
  const body = { ...updatedTrack };
  if (body.tag !== undefined || body.vibe !== undefined) {
    body.tag_id = body.tag || body.vibe || null;
    delete body.tag;
    delete body.vibe;
  }

  return Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_TRACK_KEYS.has(key)),
  );
}

export function normalizeNewTrack(trackData = {}, created = {}, uploaded = null) {
  return {
    ...trackData,
    ...created,
    file: undefined,
    r2_key: created?.r2_key ?? uploaded?.r2_key ?? null,
    tag: created?.tag_id ?? trackData?.tag ?? trackData?.vibe,
  };
}

export { ALLOWED_TRACK_KEYS };
