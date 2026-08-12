// ============================================================
//  EL BÚNKER — workers/routes/entries.js
//  CRUD /api/entries (auth required)
// ============================================================

import { json, err } from "../utils/response.js";
import { isSensitiveR2Key, signR2Read } from "../utils/r2-sign.js";
import { canManageOwned } from "../utils/authorization.js";
import { cleanString } from "../utils/validation.js";
import {
  isVisitMode,
  loadClassifiedIds,
  loadEntryBlurhash,
  sanitizeEntry,
  sanitizeFile,
} from "../utils/visit-filter.js";

// FASE D.1 (V4): para entries con imágenes en prefijos sensibles
// (vault/docs/, vault/audio/), inyecta `url` firmada HMAC en cada imagen.
// El frontend prefiere `img.url` sobre `${R2_PUBLIC_BASE}/${img.r2_key}`.
// Sin secret, solo local/development conserva compatibilidad pública; cualquier
// otro entorno elimina la referencia sensible para no filtrar una key inútil.
// MUTA el entry in-place (no devuelve nuevo objeto) — así los callers no
// necesitan reasignar (entry es const en el handler de detalle).
async function signEntryImages(entry, env, url) {
  const isLocalEnvironment = env?.ENVIRONMENT === "local" || env?.ENVIRONMENT === "development";
  const hasSigningSecret = Boolean(env?.R2_SIGN_SECRET);
  if (!hasSigningSecret && isLocalEnvironment) return;
  const content = typeof entry.content === "string" ? safeParseContent(entry.content) : entry.content;
  const images = content?.images;
  if (!Array.isArray(images) || !images.length) return;
  const origin = url.origin;
  let mutated = false;
  const signedImages = await Promise.all(
    images.map(async (img) => {
      if (!img?.r2_key || !isSensitiveR2Key(img.r2_key)) return img;
      const signed = await signR2Read(img.r2_key, env);
      if (!signed) {
        // Fail closed fuera de local/development: no enviar la key sensible.
        mutated = true;
        const safeImage = { ...img };
        delete safeImage.r2_key;
        delete safeImage.url;
        return { ...safeImage, protected: true };
      }
      mutated = true;
      return { ...img, url: `${origin}/${img.r2_key}?t=${signed.token}` };
    })
  );
  if (!mutated) return;
  const newContent = { ...content, images: signedImages };
  entry.content = typeof entry.content === "string" ? JSON.stringify(newContent) : newContent;
}

async function protectEntryFiles(files, env, url) {
  const isLocalEnvironment = env?.ENVIRONMENT === "local" || env?.ENVIRONMENT === "development";
  if (!Array.isArray(files) || (!env?.R2_SIGN_SECRET && isLocalEnvironment)) return files;
  return Promise.all(files.map(async (file) => {
    if (!file?.r2_key || !isSensitiveR2Key(file.r2_key)) return file;
    const signed = await signR2Read(file.r2_key, env);
    if (!signed) {
      const safeFile = { ...file };
      delete safeFile.r2_key;
      delete safeFile.url;
      return { ...safeFile, protected: true };
    }
    return { ...file, url: `${url.origin}/${file.r2_key}?t=${signed.token}` };
  }));
}

const safeParseContent = (c) => {
  if (typeof c !== "string") return c;
  try { return JSON.parse(c); } catch { return c; }
};

export default async function handleEntries(request, env, url, userId) {
  const method = request.method;
  const path = url.pathname;

  if (!userId) return err("Unauthorized", 401);

  // GET /api/entries
  if (method === "GET" && path === "/api/entries") {
    const era = url.searchParams.get("era_id");
    const type = url.searchParams.get("type");
    const from = url.searchParams.get("from_user");
    // S151: límite configurable con tope alto. El frontend carga /api/entries
    // sin paginar (VaultContext), y con contenido real (>200 entries) el viejo
    // LIMIT 200 fijo ocultaba entradas: 527 en D1, solo 200 visibles.
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "2000"), 5000);
    let q = "SELECT * FROM entries WHERE is_deleted = 0";
    const binds = [];
    if (era) { q += " AND era_id = ?1"; binds.push(era); }
    if (type) { q += ` AND type = ?${binds.length + 1}`; binds.push(type); }
    if (from) { q += ` AND from_user = ?${binds.length + 1}`; binds.push(from); }
    q += ` ORDER BY created_at DESC LIMIT ?${binds.length + 1}`;
    binds.push(limit);
    const { results } = binds.length
      ? await env.DB.prepare(q).bind(...binds).all()
      : await env.DB.prepare(q).all();
    // Enriquecer con tags y archivos (batched)
    if (results.length) {
      const entryIds = results.map(e => e.id);
      const BATCH = 100;
      const tagsByEntry = {};
      const filesByEntry = {};
      for (let i = 0; i < entryIds.length; i += BATCH) {
        const batch = entryIds.slice(i, i + BATCH);
        const placeholders = batch.map(() => "?").join(",");
        const { results: allTags } = await env.DB.prepare(
          `SELECT et.entry_id, t.id, t.label, t.icon, t.color, t.namespace
           FROM entry_tags et JOIN tags t ON t.id = et.tag_id
           WHERE et.entry_id IN (${placeholders})`
        ).bind(...batch).all();
        for (const row of allTags) {
          if (!tagsByEntry[row.entry_id]) tagsByEntry[row.entry_id] = [];
          tagsByEntry[row.entry_id].push({ id: row.id, label: row.label, icon: row.icon, color: row.color, namespace: row.namespace });
        }
        const { results: allFiles } = await env.DB.prepare(
          `SELECT id, entry_id, r2_key, prefix, filename, mime_type, size_bytes
           FROM files WHERE entry_id IN (${placeholders})`
        ).bind(...batch).all();
        for (const row of allFiles) {
          if (!filesByEntry[row.entry_id]) filesByEntry[row.entry_id] = [];
          filesByEntry[row.entry_id].push({ id: row.id, r2_key: row.r2_key, prefix: row.prefix, filename: row.filename, mime_type: row.mime_type, size_bytes: row.size_bytes });
        }
      }
      for (const entry of results) {
        entry.from = entry.from_user;
        entry.to = entry.to_user;
        entry.tags = tagsByEntry[entry.id] || [];
        entry.files = filesByEntry[entry.id] || [];
      }
      // FASE D.1: firmar o sanear referencias sensibles (paralelo, muta in-place).
      await Promise.all(results.map(async (entry) => {
        entry.files = await protectEntryFiles(entry.files, env, url);
        await signEntryImages(entry, env, url);
      }));
    }
    // A3: en modo visita, vaciar lo clasificado (sin r2_key, URL firmada,
    // título ni nota). Las entries no clasificadas se devuelven tal cual.
    if (isVisitMode(request)) {
      const classifiedIds = await loadClassifiedIds(env, "entry", results.map((e) => e.id));
      const classifiedFileIds = await loadClassifiedIds(
        env, "file", results.flatMap((e) => (e.files || []).map((f) => f.id))
      );
      if (classifiedIds.size || classifiedFileIds.size) {
        const blurhashByEntry = await loadEntryBlurhash(env, [...classifiedIds]);
        return json(results.map((entry) => {
          if (classifiedIds.has(entry.id)) {
            return sanitizeEntry(entry, blurhashByEntry.get(entry.id) ?? null);
          }
          if (classifiedFileIds.size && Array.isArray(entry.files)) {
            entry.files = entry.files.map((file) =>
              classifiedFileIds.has(file.id) ? sanitizeFile(file) : file
            );
          }
          return entry;
        }));
      }
    }
    return json(results);
  }

  // GET /api/entries/:id
  if (method === "GET" && path.startsWith("/api/entries/")) {
    const entryId = path.split("/")[3];
    if (!entryId) return err("entry id required", 400);
    const entry = await env.DB.prepare(
      "SELECT * FROM entries WHERE id = ?1 AND is_deleted = 0"
    ).bind(entryId).first();
    if (!entry) return err("Entry not found", 404);
    const { results: tags } = await env.DB.prepare(
      `SELECT t.id, t.label, t.icon, t.color, t.namespace
       FROM entry_tags et JOIN tags t ON t.id = et.tag_id WHERE et.entry_id = ?1`
    ).bind(entryId).all();
    entry.tags = tags;
    entry.from = entry.from_user;
    entry.to = entry.to_user;
    const { results: files } = await env.DB.prepare(
      "SELECT id, r2_key, prefix, filename, mime_type, size_bytes FROM files WHERE entry_id = ?1"
    ).bind(entryId).all();
    entry.files = await protectEntryFiles(files, env, url);
    // FASE D.1: firmar imágenes en prefijos sensibles (muta entry in-place, sin reasignar).
    await signEntryImages(entry, env, url);
    // A3: en modo visita, vaciar la entry clasificada (y sus files clasificados).
    if (isVisitMode(request)) {
      const classifiedIds = await loadClassifiedIds(env, "entry", [entry.id]);
      if (classifiedIds.has(entry.id)) {
        const blurhash = (await loadEntryBlurhash(env, [entry.id])).get(entry.id) ?? null;
        return json(sanitizeEntry(entry, blurhash));
      }
      const classifiedFileIds = await loadClassifiedIds(
        env, "file", (entry.files || []).map((f) => f.id)
      );
      if (classifiedFileIds.size) {
        entry.files = entry.files.map((file) =>
          classifiedFileIds.has(file.id) ? sanitizeFile(file) : file
        );
      }
    }
    return json(entry);
  }

  // POST /api/entries
  if (method === "POST" && path === "/api/entries") {
    const body = await request.json().catch(() => null);
    if (!body) return err("Invalid JSON body", 400);
    const type = cleanString(body.type, 50) || "note";
    if (body.era_id) {
      const era = await env.DB.prepare("SELECT id FROM eras WHERE id = ?1").bind(body.era_id).first();
      if (!era) return err(`Era ${body.era_id} not found`, 400);
    }
    const id = body.id || crypto.randomUUID();
    const now = body.created_at || new Date().toISOString();
    const fromUser = userId;
    const batch = [
      env.DB.prepare(
        `INSERT INTO entries (id, era_id, type, title, content, from_user, to_user, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)`
      ).bind(id, body.era_id || null, type, body.title || "",
             JSON.stringify(body.content || {}), fromUser, body.to_user || "both", now),
    ];
    if (Array.isArray(body.tags) && body.tags.length) {
      const stmt = env.DB.prepare("INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?1,?2)");
      batch.push(...body.tags.map(tid => stmt.bind(id, tid)));
    }
    if (Array.isArray(body.file_ids) && body.file_ids.length) {
      const stmt = env.DB.prepare("UPDATE files SET entry_id = ?1 WHERE id = ?2 AND entry_id IS NULL");
      batch.push(...body.file_ids.map(fid => stmt.bind(id, fid)));
    }
    batch.push(
      env.DB.prepare(
        "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'entry',?3,?4)"
      ).bind("entry_created", userId, id, JSON.stringify({ type, title: body.title }))
    );
    // Entry, tags, file links and audit event must commit or roll back together.
    await env.DB.batch(batch);
    return json({
      ...body,
      id,
      type,
      from_user: fromUser,
      to_user: body.to_user || "both",
      created_at: now,
      updated_at: now,
    }, 201);
  }

  // PATCH /api/entries/:id
  if (method === "PATCH" && path.startsWith("/api/entries/")) {
    const ENTRY_FIELDS = new Set(["era_id", "type", "title", "content", "to_user"]);
    const entryId = path.split("/")[3];
    const owner = await env.DB.prepare(
      "SELECT id, from_user FROM entries WHERE id = ?1 AND is_deleted = 0"
    ).bind(entryId).first();
    if (!owner) return err("Entry not found", 404);
    if (!canManageOwned(userId, owner.from_user)) return err("Forbidden", 403);
    const body = await request.json();
    const { tags, file_ids, ...fields } = body;
    const sets = []; const binds = [];
    for (const [k, v] of Object.entries(fields)) {
      if (!ENTRY_FIELDS.has(k)) continue;
      if (k === "content") { sets.push(`${k} = ?${sets.length + 1}`); binds.push(JSON.stringify(v)); }
      else { sets.push(`${k} = ?${sets.length + 1}`); binds.push(v); }
    }
    if (sets.length) {
      binds.push(entryId);
      sets.push("updated_at = datetime('now')");
      await env.DB.prepare(`UPDATE entries SET ${sets.join(", ")} WHERE id = ?${binds.length}`).bind(...binds).run();
    }
    if (Array.isArray(tags)) {
      await env.DB.prepare("DELETE FROM entry_tags WHERE entry_id = ?1").bind(entryId).run();
      if (tags.length) {
        const stmt = env.DB.prepare("INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?1,?2)");
        await env.DB.batch(tags.map(tid => stmt.bind(entryId, tid)));
      }
    }
    if (Array.isArray(file_ids)) {
      const stmt = env.DB.prepare("UPDATE files SET entry_id = ?1 WHERE id = ?2 AND entry_id IS NULL");
      await env.DB.batch(file_ids.map(fid => stmt.bind(entryId, fid)));
    }
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,'entry',?3,?4)"
    ).bind("entry_updated", userId, entryId, JSON.stringify(fields)).run();
    return json({ id: entryId, ...body });
  }

  // DELETE /api/entries/:id
  if (method === "DELETE" && path.startsWith("/api/entries/")) {
    const entryId = path.split("/")[3];
    const owner = await env.DB.prepare(
      "SELECT id, from_user FROM entries WHERE id = ?1 AND is_deleted = 0"
    ).bind(entryId).first();
    if (!owner) return err("Entry not found", 404);
    if (!canManageOwned(userId, owner.from_user)) return err("Forbidden", 403);
    await env.DB.prepare("UPDATE entries SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?1").bind(entryId).run();
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id) VALUES (?1,?2,'entry',?3)"
    ).bind("entry_deleted", userId, entryId).run();
    return json({ ok: true, id: entryId });
  }

  return err("Not found", 404);
}
