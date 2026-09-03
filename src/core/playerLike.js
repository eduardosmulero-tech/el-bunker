// ============================================================
//  EL BÚNKER — playerLike.js
//  t_like-unificado: lógica del like de tracks, compartida por
//  PlayerContext (estado real dock/deck) y por sus tests.
//  Persistencia local por usuario hasta que exista backend de
//  track_likes en D1 (hoy solo drops.favorited tiene servidor).
// ============================================================

export const likedKeyFor = (userId) => (userId ? `el_bunker_liked_${userId}` : null);

/** Lee la lista persistida de likes de un usuario (Set). Tolera JSON corrupto. */
export function readLikedIds(userId) {
  const key = likedKeyFor(userId);
  if (!key) return new Set();
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/** Persiste la lista de likes. Sin userId → noop (sesión sin auth, sin clave). */
export function writeLikedIds(userId, idsSet) {
  const key = likedKeyFor(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify([...idsSet]));
  } catch { /* localStorage lleno o no disponible */ }
}

/**
 * Toggle puro: devuelve { next: Set, nowLiked: boolean } sin mutar el Set previo.
 * Los tests del PlayerContext y el botón/tecla comparten esta única implementación.
 */
export function toggleLikedId(idsSet, trackId) {
  if (!trackId) return { next: idsSet, nowLiked: idsSet.has(trackId) };
  const next = new Set(idsSet);
  const nowLiked = !next.has(trackId);
  if (nowLiked) next.add(trackId);
  else next.delete(trackId);
  return { next, nowLiked };
}
