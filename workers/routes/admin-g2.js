// G2 admin inspection — read-only integration container.
// This route deliberately does not enqueue repairs, write audit rows, touch R2,
// or mutate any product entity. Destructive/admin operations remain out of scope.

import { isAdmin } from "../utils/authorization.js";
import { json, err } from "../utils/response.js";

const G2_TABLES = [
  "file_references",
  "admin_audit_log",
  "repair_queue",
  "repair_attempts",
];

const PREVIEW_ENTITY_TYPES = new Set(["entry", "track", "file"]);

const COUNT_QUERIES = Object.freeze({
  fileReferences: "SELECT COUNT(*) AS count FROM file_references",
  adminAuditLog: "SELECT COUNT(*) AS count FROM admin_audit_log",
  repairQueue: "SELECT COUNT(*) AS count FROM repair_queue",
  repairAttempts: "SELECT COUNT(*) AS count FROM repair_attempts",
});

const PREVIEW_SUMMARY_QUERIES = Object.freeze({
  entry: `
    SELECT
      COUNT(DISTINCT f.id) AS legacy_file_count,
      COALESCE(SUM(f.size_bytes), 0) AS legacy_total_bytes,
      (SELECT COUNT(DISTINCT fr.file_id)
         FROM file_references fr
        WHERE fr.owner_type = 'entry' AND fr.owner_id = ?1) AS policy_reference_count,
      (SELECT COUNT(DISTINCT fr.file_id)
         FROM file_references fr
         JOIN (SELECT file_id, COUNT(*) AS reference_count
                 FROM file_references GROUP BY file_id) shared
           ON shared.file_id = fr.file_id
        WHERE fr.owner_type = 'entry' AND fr.owner_id = ?1
          AND shared.reference_count > 1) AS shared_file_count
    FROM files f WHERE f.entry_id = ?1`,
  track: `
    SELECT
      COUNT(DISTINCT f.id) AS legacy_file_count,
      COALESCE(SUM(f.size_bytes), 0) AS legacy_total_bytes,
      (SELECT COUNT(DISTINCT fr.file_id)
         FROM file_references fr
        WHERE fr.owner_type = 'track' AND fr.owner_id = ?1) AS policy_reference_count,
      (SELECT COUNT(DISTINCT fr.file_id)
         FROM file_references fr
         JOIN (SELECT file_id, COUNT(*) AS reference_count
                 FROM file_references GROUP BY file_id) shared
           ON shared.file_id = fr.file_id
        WHERE fr.owner_type = 'track' AND fr.owner_id = ?1
          AND shared.reference_count > 1) AS shared_file_count
    FROM files f WHERE f.track_id = ?1`,
  file: `
    SELECT
      1 AS legacy_file_count,
      COALESCE(f.size_bytes, 0) AS legacy_total_bytes,
      (SELECT COUNT(*) FROM file_references fr WHERE fr.file_id = f.id) AS policy_reference_count,
      CASE WHEN (SELECT COUNT(*) FROM file_references fr WHERE fr.file_id = f.id) > 1
           THEN 1 ELSE 0 END AS shared_file_count
    FROM files f WHERE f.id = ?1`,
});

const PREVIEW_ENTITY_QUERY = {
  entry: "SELECT id, is_deleted AS deleted FROM entries WHERE id = ?1",
  track: "SELECT id, is_deleted AS deleted FROM tracks WHERE id = ?1",
  file: "SELECT id, 0 AS deleted FROM files WHERE id = ?1",
};

const QUEUE_STATES_QUERY =
  "SELECT state, COUNT(*) AS count FROM repair_queue GROUP BY state ORDER BY state";

const TABLES_QUERY =
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (?1, ?2, ?3, ?4) ORDER BY name";

async function loadAdminRole(env, userId) {
  return env.DB.prepare(
    "SELECT id, role FROM users WHERE id = ?1"
  ).bind(userId).first();
}

async function countTable(env, query) {
  const row = await env.DB.prepare(query).first();
  return Number(row?.count ?? 0);
}

async function loadPreview(env, entityType, entityId) {
  const entity = await env.DB.prepare(PREVIEW_ENTITY_QUERY[entityType]).bind(entityId).first();
  if (!entity) return null;

  const summary = await env.DB.prepare(PREVIEW_SUMMARY_QUERIES[entityType])
    .bind(entityId)
    .first();

  const legacyFileCount = Number(summary?.legacy_file_count ?? 0);
  const policyReferenceCount = Number(summary?.policy_reference_count ?? 0);
  const legacyTotalBytes = Number(summary?.legacy_total_bytes ?? 0);
  const sharedFileCount = Number(summary?.shared_file_count ?? 0);

  return {
    entityType,
    entityId: entity.id,
    deleted: Boolean(entity.deleted),
    legacyFileCount,
    policyReferenceCount,
    totalBytes: legacyTotalBytes,
    sharedFileCount,
    hasSharedReferences: sharedFileCount > 0,
    ownershipCoverageComplete: false,
    readyForSnapshot: false,
  };
}

/** GET /api/admin/g2/inspect and /preview-purge — admin-only, read-only G2 operations. */
export default async function handleAdminG2(request, env, url, userId) {
  if (request.method !== "GET" || !["/api/admin/g2/inspect", "/api/admin/g2/preview-purge"].includes(url.pathname)) {
    return err("Not found", 404);
  }
  if (!userId) return err("Unauthorized", 401);
  if (!isAdmin(userId)) return err("Forbidden — only admin can inspect G2", 403);

  const actor = await loadAdminRole(env, userId);
  if (!actor || actor.role !== "admin") {
    return err("Forbidden — admin role required", 403);
  }

  if (url.pathname === "/api/admin/g2/preview-purge") {
    const entityType = url.searchParams.get("entity_type");
    const entityId = url.searchParams.get("entity_id");
    if (!PREVIEW_ENTITY_TYPES.has(entityType)) return err("entity_type must be entry, track, or file", 400);
    const hasControlCharacter = [...(entityId || "")].some(char => char.charCodeAt(0) < 32);
    if (!entityId || entityId.length > 256 || hasControlCharacter) {
      return err("entity_id required and invalid", 400);
    }
    const preview = await loadPreview(env, entityType, entityId);
    if (!preview) return err("Entity not found", 404);
    return json({ ok: true, readOnly: true, preview });
  }

  const [tableRows, fileReferences, adminAuditLog, repairQueue, repairAttempts, stateRows] =
    await Promise.all([
      env.DB.prepare(TABLES_QUERY).bind(...G2_TABLES).all(),
      countTable(env, COUNT_QUERIES.fileReferences),
      countTable(env, COUNT_QUERIES.adminAuditLog),
      countTable(env, COUNT_QUERIES.repairQueue),
      countTable(env, COUNT_QUERIES.repairAttempts),
      env.DB.prepare(QUEUE_STATES_QUERY).all(),
    ]);

  const presentTables = (tableRows.results || []).map(row => row.name);
  const queueStates = {};
  for (const row of stateRows.results || []) {
    queueStates[row.state] = Number(row.count ?? 0);
  }

  return json({
    ok: true,
    readOnly: true,
    schema: {
      migration: "0001_g2_policy.sql",
      tablesPresent: presentTables,
      migrationApplied: G2_TABLES.every(table => presentTables.includes(table)),
    },
    counts: {
      fileReferences,
      adminAuditLog,
      repairQueue,
      repairAttempts,
    },
    queueStates,
  });
}
