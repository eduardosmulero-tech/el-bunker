// ============================================================
//  EL BÚNKER — workers/utils/visit-filter.js
//  A3 — Saneamiento server-side en modo visita (ADR-029, diseño §3/§6)
//  Con el claim `visit:true` en el JWT, lo clasificado se devuelve
//  vaciado: sin r2_key, sin URL firmada, sin título, sin nota.
//  Sin el claim, todas las funciones son no-ops (regresión cero).
// ============================================================

// El dispatcher ya verificó la firma (authenticate); aquí solo se lee el
// claim `visit` del payload, igual que hace session.js. Nunca es fuente
// de identidad: si el claim falta o no es true, no hay modo visita.
export function isVisitMode(request) {
  const auth = request?.headers?.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  try {
    const b64 = (auth.slice(7).split(".")[1] || "")
      .replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const text = new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    );
    return JSON.parse(text)?.visit === true;
  } catch {
    return false;
  }
}

// ids clasificados de un tipo entre los ids dados (un IN, diseño §4).
// Devuelve un Set vacío si no hay ids o si no hay ninguno clasificado.
export async function loadClassifiedIds(env, itemType, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Set();
  const placeholders = unique.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT item_id FROM classified_items WHERE item_type = ?1 AND item_id IN (${placeholders})`
  ).bind(itemType, ...unique).all();
  return new Set(results.map((r) => r.item_id));
}

// blurhash de las files de las entries dadas (solo en modo visita: la
// SELECT de files del listado normal no lo incluye → regresión cero).
export async function loadEntryBlurhash(env, entryIds) {
  const unique = [...new Set(entryIds.filter(Boolean))];
  if (!unique.length) return new Map();
  const placeholders = unique.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT entry_id, blurhash FROM files WHERE entry_id IN (${placeholders}) AND blurhash IS NOT NULL`
  ).bind(...unique).all();
  const byEntry = new Map();
  for (const row of results) {
    if (!byEntry.has(row.entry_id)) byEntry.set(row.entry_id, row.blurhash);
  }
  return byEntry;
}

// ── Vaciado por entidad (diseño §6) ────────────────────────────────

// VAULT: sin imagen (r2_key/URL firmada), título, nota, lugar, tags.
// Solo { id, classified: true, blurhash, fecha, era }.
export function sanitizeEntry(entry, blurhash = null) {
  return {
    id: entry.id,
    classified: true,
    blurhash,
    fecha: entry.created_at,
    era: entry.era_id ?? null,
  };
}

// MUSIC LAB: sin título, artista, portada, r2_key, nota. El audio no
// suena porque no hay r2_key (motor único intacto, 🔒-3).
export function sanitizeTrack(track) {
  return {
    id: track.id,
    classified: true,
    blurhash: null,
    fecha: track.created_at,
    era: track.era_id ?? null,
  };
}

// CAPSULES: sin título, descripción ni contenido. La regla de fecha
// (lock) sigue intacta y los recuentos no mienten a la baja (§6).
export function sanitizeCapsule(capsule) {
  return {
    id: capsule.id,
    classified: true,
    blurhash: null,
    fecha: capsule.created_at,
    era: null,
    is_unlocked: Number(capsule.is_unlocked) === 1,
    unlock_at: capsule.unlock_at ?? null,
    content_counts: capsule.content_counts ?? { entries: 0, playlists: 0 },
  };
}

// DROPS: sin mensaje (memory) ni destinatario (to_user/to). Forma
// canónica del diseño §3: solo { id, classified, blurhash, fecha, era }.
export function sanitizeDrop(drop) {
  return {
    id: drop.id,
    classified: true,
    blurhash: null,
    fecha: drop.drop_date ?? drop.created_at,
    era: drop.era_id ?? null,
  };
}

// Fichero clasificado (item_type 'file'): sin r2_key ni URL firmada.
// La imagen no viaja; el resto del objeto (id, prefix, blurhash…)
// se conserva para que la UI pueda pintar la tesela.
export function sanitizeFile(file) {
  const { r2_key: _r2_key, url: _url, ...rest } = file;
  return { ...rest, classified: true };
}

// Reemplaza los items clasificados por su versión vaciada; el resto se
// devuelve tal cual (la app se ve llena, diseño §3).
export function applyVisitFilter(items, classifiedIds, sanitize) {
  return items.map((item) => (classifiedIds.has(item.id) ? sanitize(item) : item));
}
