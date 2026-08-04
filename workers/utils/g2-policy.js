// G2 policy primitives. Pure functions only: no D1/R2 access and no side effects.

export const MAX_REPAIR_ATTEMPTS = 3;
export const MAX_REPAIR_WINDOW_MS = 24 * 60 * 60 * 1000;
export const BASE_BACKOFF_MS = 60 * 1000;
export const MAX_BACKOFF_MS = 60 * 60 * 1000;
export const LEASE_DURATION_MS = 5 * 60 * 1000;

export const REPAIR_STATES = Object.freeze([
  "pending",
  "retrying",
  "needs_admin",
  "completed",
  "blocked",
]);

export const PURGE_PHASES = Object.freeze([
  "planned",
  "d1_prepared",
  "r2_pending",
  "r2_deleted",
  "d1_finalized",
  "blocked_snapshot_failed",
  "blocked_shared_reference",
  "retrying_r2_delete",
  "needs_admin_r2_delete",
  "blocked_r2_deleted_d1_pending",
]);

const TRANSITIONS = Object.freeze({
  pending: ["retrying", "blocked"],
  retrying: ["retrying", "completed", "needs_admin", "blocked"],
  needs_admin: ["retrying", "completed", "blocked"],
  blocked: ["retrying", "completed"],
  completed: [],
});

const ADMIN_ONLY_SOURCES = new Set(["needs_admin", "blocked"]);

export function canTransitionRepair(from, to, { isAdmin = false } = {}) {
  if (!REPAIR_STATES.includes(from) || !REPAIR_STATES.includes(to)) return false;
  if (!TRANSITIONS[from].includes(to)) return false;
  return !ADMIN_ONLY_SOURCES.has(from) || isAdmin;
}

export function assertRepairTransition(from, to, options = {}) {
  if (!canTransitionRepair(from, to, options)) {
    throw new Error(`Invalid repair transition: ${from} -> ${to}`);
  }
  return to;
}

export function canAdvancePurgePhase(from, to) {
  if (from == null) return to === "planned";
  const allowed = {
    planned: ["d1_prepared", "blocked_snapshot_failed", "blocked_shared_reference"],
    d1_prepared: ["r2_pending", "blocked_shared_reference"],
    r2_pending: ["r2_deleted", "retrying_r2_delete", "needs_admin_r2_delete"],
    r2_deleted: ["d1_finalized", "blocked_r2_deleted_d1_pending"],
    d1_finalized: [],
    blocked_snapshot_failed: [],
    blocked_shared_reference: [],
    retrying_r2_delete: ["r2_deleted", "needs_admin_r2_delete"],
    needs_admin_r2_delete: ["retrying_r2_delete"],
    blocked_r2_deleted_d1_pending: ["d1_finalized"],
  };
  return Boolean(allowed[from]?.includes(to));
}

export function assertPurgePhase(from, to) {
  if (!canAdvancePurgePhase(from, to)) {
    throw new Error(`Invalid purge phase: ${from ?? "null"} -> ${to}`);
  }
  return to;
}

export function isRetryableError(errorCode) {
  return new Set([
    "R2_UNAVAILABLE",
    "R2_TIMEOUT",
    "NETWORK_ERROR",
    "D1_BUSY",
    "D1_TIMEOUT",
  ]).has(errorCode);
}

export function backoffDelayMs(attemptNumber, randomFraction = 0) {
  const safeAttempt = Math.max(1, Number(attemptNumber) || 1);
  const exponential = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * (2 ** (safeAttempt - 1)));
  const jitter = Math.min(0.25, Math.max(0, Number(randomFraction) || 0));
  return Math.round(exponential * (1 + jitter));
}

export function shouldRetry({ attemptCount = 0, firstFailedAt = null, now = Date.now(), errorCode } = {}) {
  if (!isRetryableError(errorCode)) return false;
  if (attemptCount >= MAX_REPAIR_ATTEMPTS) return false;
  if (firstFailedAt != null) {
    const failedAt = new Date(firstFailedAt).getTime();
    if (!Number.isFinite(failedAt) || !Number.isFinite(now)) return false;
    if (now - failedAt >= MAX_REPAIR_WINDOW_MS) return false;
  }
  return true;
}

export function claimLease({ leaseUntil = null, now = Date.now(), owner, leaseDurationMs = LEASE_DURATION_MS } = {}) {
  if (!owner || typeof owner !== "string") return null;
  if (!Number.isFinite(now) || !Number.isFinite(leaseDurationMs) || leaseDurationMs <= 0) return null;
  if (leaseUntil != null) {
    const currentLeaseUntil = new Date(leaseUntil).getTime();
    if (!Number.isFinite(currentLeaseUntil)) return null;
    if (currentLeaseUntil >= now) return null;
  }
  return {
    leaseOwner: owner,
    claimedAt: new Date(now).toISOString(),
    leaseUntil: new Date(now + leaseDurationMs).toISOString(),
  };
}
