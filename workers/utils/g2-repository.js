// G2 D1 repository primitives.
// This module is intentionally not registered in the Worker router yet.
// It owns persistence mechanics only; authorization and operation orchestration
// belong to a future admin-only integration container.

const AUDIT_ACTIONS = new Set([
  "archive",
  "restore",
  "purge_plan",
  "purge_start",
  "purge_result",
  "repair_retry",
  "repair_block",
  "retention_sweep",
]);

const AUDIT_RESULTS = new Set([
  "planned",
  "started",
  "completed",
  "failed",
  "blocked",
]);

const REPAIR_KINDS = new Set([
  "purge",
  "r2_delete_retry",
  "d1_finalize",
  "reconcile_r2_deleted_d1_pending",
]);

const ATTEMPT_OUTCOMES = new Set([
  "started",
  "retryable_failure",
  "completed",
  "needs_admin",
  "blocked",
]);

const MAX_JSON_LENGTH = 32_768;
const MAX_TEXT_LENGTH = 4_096;
const MAX_REPAIR_ATTEMPTS = 3;

function requiredText(value, name, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  if (value.length > maxLength) throw new RangeError(`${name} is too long`);
  return value;
}

function optionalText(value, name, maxLength = MAX_TEXT_LENGTH) {
  if (value == null) return null;
  if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
  if (value.length > maxLength) throw new RangeError(`${name} is too long`);
  return value;
}

function jsonText(value, name) {
  let serialized;
  try {
    serialized = JSON.stringify(value ?? {});
  } catch {
    throw new TypeError(`${name} must be JSON-serializable`);
  }
  if (serialized.length > MAX_JSON_LENGTH) throw new RangeError(`${name} is too large`);
  // Audit/queue metadata must never carry signed URLs or external URLs.
  if (/https?:\/\//i.test(serialized)) {
    throw new TypeError(`${name} must not contain URLs`);
  }
  return serialized;
}

function validIso(value, name) {
  requiredText(value, name, 64);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new TypeError(`${name} must be a canonical UTC ISO date`);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    throw new TypeError(`${name} must be a canonical UTC ISO date`);
  }
  return value;
}

function assertSafeR2Key(value) {
  if (value == null) return null;
  if (/[?#]|https?:\/\//i.test(value)) throw new TypeError("r2Key must be an object key, not a URL");
  return value;
}

function changesOf(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

function requireAllowed(value, name, allowed) {
  requiredText(value, name, 128);
  if (!allowed.has(value)) throw new TypeError(`${name} is not supported`);
  return value;
}

/**
 * Append one administrative audit row. This function never updates/deletes
 * existing audit rows and does not emit a product event.
 */
export async function appendAdminAudit(db, {
  operationId,
  actorUserId,
  action,
  entityType = null,
  entityId = null,
  reason,
  result,
  details = {},
  r2ManifestHash = null,
} = {}) {
  const operation = requiredText(operationId, "operationId", 256);
  const actor = requiredText(actorUserId, "actorUserId", 128);
  const auditAction = requireAllowed(action, "action", AUDIT_ACTIONS);
  const auditResult = requireAllowed(result, "result", AUDIT_RESULTS);
  const auditReason = requiredText(reason, "reason");
  const type = optionalText(entityType, "entityType", 128);
  const id = optionalText(entityId, "entityId", 256);
  const manifestHash = optionalText(r2ManifestHash, "r2ManifestHash", 128);
  const detailsJson = jsonText(details, "details");

  const response = await db.prepare(
    `INSERT INTO admin_audit_log
      (operation_id, actor_user_id, action, entity_type, entity_id, reason,
       result, details_json, r2_manifest_hash)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`
  ).bind(
    operation,
    actor,
    auditAction,
    type,
    id,
    auditReason,
    auditResult,
    detailsJson,
    manifestHash,
  ).run();

  return { changes: changesOf(response) || 1 };
}

/**
 * Insert a repair only once. A repeated operation_id returns the original row.
 * No repair is executed by this function.
 */
export async function enqueueRepair(db, {
  operationId,
  parentOperationId = null,
  kind,
  entityType = null,
  entityId = null,
  r2Key = null,
  fileId = null,
  payload = {},
} = {}) {
  const operation = requiredText(operationId, "operationId", 256);
  const parent = optionalText(parentOperationId, "parentOperationId", 256);
  const repairKind = requireAllowed(kind, "kind", REPAIR_KINDS);
  const type = optionalText(entityType, "entityType", 128);
  const id = optionalText(entityId, "entityId", 256);
  const key = assertSafeR2Key(optionalText(r2Key, "r2Key", 1_024));
  const file = optionalText(fileId, "fileId", 256);
  const payloadJson = jsonText(payload, "payload");

  await db.prepare(
    `INSERT INTO repair_queue
      (operation_id, parent_operation_id, kind, entity_type, entity_id,
       r2_key, file_id, payload_json)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8)
     ON CONFLICT(operation_id) DO NOTHING`
  ).bind(operation, parent, repairKind, type, id, key, file, payloadJson).run();

  const row = await db.prepare(
    `SELECT id, operation_id, parent_operation_id, kind, entity_type, entity_id,
            r2_key, file_id, state, attempt_count, lease_owner, lease_until,
            payload_json, created_at, updated_at
     FROM repair_queue WHERE operation_id = ?1`
  ).bind(operation).first();

  if (!row) throw new Error("repair queue row was not returned after enqueue");
  const requestedScope = [repairKind, type, id, key, file];
  const storedScope = [row.kind, row.entity_type ?? null, row.entity_id ?? null, row.r2_key ?? null, row.file_id ?? null];
  if (row.kind != null && requestedScope.some((value, index) => value !== storedScope[index])) {
    throw new Error("operationId already exists with a different repair scope");
  }
  return row;
}

/**
 * Claim a lease atomically. A zero-row update means another worker owns an
 * active lease or the operation is not in a claimable state.
 */
export async function claimRepairLease(db, {
  operationId,
  owner,
  nowIso,
  leaseUntilIso,
} = {}) {
  const operation = requiredText(operationId, "operationId", 256);
  const leaseOwner = requiredText(owner, "owner", 256);
  const now = validIso(nowIso, "nowIso");
  const leaseUntil = validIso(leaseUntilIso, "leaseUntilIso");
  if (Date.parse(leaseUntil) <= Date.parse(now)) {
    throw new RangeError("leaseUntilIso must be after nowIso");
  }

  const response = await db.prepare(
    `UPDATE repair_queue
        SET state = CASE WHEN state = 'pending' THEN 'retrying' ELSE state END,
            lease_owner = ?1, lease_until = ?2, updated_at = ?3
      WHERE operation_id = ?4
        AND state IN ('pending', 'retrying')
        AND (lease_until IS NULL OR lease_until < ?3)`
  ).bind(leaseOwner, leaseUntil, now, operation).run();

  if (changesOf(response) !== 1) return null;
  return db.prepare(
    `SELECT id, operation_id, state, lease_owner, lease_until, attempt_count
       FROM repair_queue WHERE operation_id = ?1`
  ).bind(operation).first();
}

/** Append one immutable repair attempt. */
export async function appendRepairAttempt(db, {
  queueId,
  attemptNumber,
  actorUserId = null,
  outcome,
  errorCode = null,
  errorMessage = null,
} = {}) {
  if (!Number.isInteger(queueId) || queueId <= 0) throw new TypeError("queueId must be a positive integer");
  if (!Number.isInteger(attemptNumber) || attemptNumber <= 0 || attemptNumber > MAX_REPAIR_ATTEMPTS) {
    throw new TypeError("attemptNumber must be an integer from 1 to 3");
  }
  const actor = optionalText(actorUserId, "actorUserId", 128);
  const attemptOutcome = requireAllowed(outcome, "outcome", ATTEMPT_OUTCOMES);
  const code = optionalText(errorCode, "errorCode", 128);
  const message = optionalText(errorMessage, "errorMessage");

  const response = await db.prepare(
    `INSERT INTO repair_attempts
      (queue_id, attempt_number, actor_user_id, outcome, error_code, error_message)
     VALUES (?1,?2,?3,?4,?5,?6)`
  ).bind(queueId, attemptNumber, actor, attemptOutcome, code, message).run();

  return { changes: changesOf(response) || 1 };
}
