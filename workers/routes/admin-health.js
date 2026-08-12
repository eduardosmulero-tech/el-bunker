// ============================================================
//  EL BÚNKER — workers/routes/admin-health.js
//  GET /api/admin/health — consola de SALUD (B4)
//  Reproduce los recuentos que Edu hacía a mano sobre D1:
//  files, entries, tracks activos y soft-deleted, referencias y
//  colgantes de file_references. Solo lectura y solo admin:
//  401 sin identidad, 403 sin rol admin, siempre antes de tocar D1.
// ============================================================

import { isAdmin } from "../utils/authorization.js";
import { json, err } from "../utils/response.js";

const COUNT_QUERIES = Object.freeze({
  files: "SELECT COUNT(*) AS count FROM files",
  entries: "SELECT COUNT(*) AS count FROM entries",
  tracksActive: "SELECT COUNT(*) AS count FROM tracks WHERE is_deleted = 0",
  tracksSoftDeleted: "SELECT COUNT(*) AS count FROM tracks WHERE is_deleted = 1",
  references: "SELECT COUNT(*) AS count FROM file_references",
  danglingReferences:
    "SELECT COUNT(*) AS count FROM file_references r LEFT JOIN files f ON f.id = r.file_id WHERE f.id IS NULL",
});

async function countRows(db, query) {
  const row = await db.prepare(query).first();
  return Number(row?.count ?? 0);
}

/** GET /api/admin/health — admin-only, read-only D1 counts (B4). */
export default async function handleAdminHealth(request, env, url, userId) {
  if (request.method !== "GET" || url.pathname !== "/api/admin/health") {
    return err("Not found", 404);
  }
  if (!userId) return err("Unauthorized", 401);
  if (!isAdmin(userId)) return err("Forbidden — admin required", 403);

  const [files, entries, tracksActive, tracksSoftDeleted, references, danglingReferences] =
    await Promise.all([
      countRows(env.DB, COUNT_QUERIES.files),
      countRows(env.DB, COUNT_QUERIES.entries),
      countRows(env.DB, COUNT_QUERIES.tracksActive),
      countRows(env.DB, COUNT_QUERIES.tracksSoftDeleted),
      countRows(env.DB, COUNT_QUERIES.references),
      countRows(env.DB, COUNT_QUERIES.danglingReferences),
    ]);

  return json({
    ok: true,
    readOnly: true,
    counts: {
      files,
      entries,
      tracksActive,
      tracksSoftDeleted,
      references,
      danglingReferences,
    },
    generatedAt: new Date().toISOString(),
  });
}
