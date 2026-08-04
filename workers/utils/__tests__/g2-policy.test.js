// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  MAX_REPAIR_ATTEMPTS,
  MAX_REPAIR_WINDOW_MS,
  LEASE_DURATION_MS,
  assertPurgePhase,
  assertRepairTransition,
  backoffDelayMs,
  canAdvancePurgePhase,
  canTransitionRepair,
  claimLease,
  shouldRetry,
} from "../g2-policy.js";

describe("G2 repair state policy", () => {
  it("allows normal transitions and rejects terminal transitions", () => {
    expect(canTransitionRepair("pending", "retrying")).toBe(true);
    expect(canTransitionRepair("retrying", "completed")).toBe(true);
    expect(canTransitionRepair("completed", "retrying", { isAdmin: true })).toBe(false);
    expect(() => assertRepairTransition("completed", "retrying", { isAdmin: true })).toThrow();
  });

  it("requires admin to reactivate needs_admin or blocked", () => {
    expect(canTransitionRepair("needs_admin", "retrying")).toBe(false);
    expect(canTransitionRepair("needs_admin", "retrying", { isAdmin: true })).toBe(true);
    expect(canTransitionRepair("blocked", "completed")).toBe(false);
    expect(canTransitionRepair("blocked", "completed", { isAdmin: true })).toBe(true);
  });
});

describe("G2 purge phases", () => {
  it("accepts the happy path and partial failure paths", () => {
    expect(canAdvancePurgePhase(null, "planned")).toBe(true);
    expect(canAdvancePurgePhase("planned", "d1_prepared")).toBe(true);
    expect(canAdvancePurgePhase("d1_prepared", "r2_pending")).toBe(true);
    expect(canAdvancePurgePhase("r2_pending", "retrying_r2_delete")).toBe(true);
    expect(canAdvancePurgePhase("retrying_r2_delete", "needs_admin_r2_delete")).toBe(true);
    expect(canAdvancePurgePhase("r2_deleted", "blocked_r2_deleted_d1_pending")).toBe(true);
    expect(canAdvancePurgePhase("needs_admin_r2_delete", "blocked_r2_deleted_d1_pending")).toBe(false);
    expect(canAdvancePurgePhase("d1_finalized", "r2_pending")).toBe(false);
    expect(() => assertPurgePhase("d1_finalized", "r2_pending")).toThrow();
  });

  it("keeps a shared-reference phase separate from a confirmed R2 deletion", () => {
    expect(canAdvancePurgePhase("planned", "blocked_shared_reference")).toBe(true);
    expect(canAdvancePurgePhase("blocked_shared_reference", "r2_deleted")).toBe(false);
  });
});

describe("G2 retry policy", () => {
  it("limits retries to three attempts and 24 hours", () => {
    expect(shouldRetry({ attemptCount: 0, errorCode: "R2_TIMEOUT" })).toBe(true);
    expect(shouldRetry({ attemptCount: MAX_REPAIR_ATTEMPTS, errorCode: "R2_TIMEOUT" })).toBe(false);
    expect(shouldRetry({ attemptCount: 0, errorCode: "INVALID_REFERENCE" })).toBe(false);
    expect(shouldRetry({
      attemptCount: 1,
      firstFailedAt: new Date(Date.now() - MAX_REPAIR_WINDOW_MS).toISOString(),
      errorCode: "R2_TIMEOUT",
    })).toBe(false);
    expect(shouldRetry({ attemptCount: 0, firstFailedAt: "not-a-date", errorCode: "R2_TIMEOUT" })).toBe(false);
  });

  it("uses bounded exponential backoff with jitter", () => {
    expect(backoffDelayMs(1, 0)).toBe(60_000);
    expect(backoffDelayMs(2, 0.25)).toBe(150_000);
    expect(backoffDelayMs(100, 0.25)).toBeLessThanOrEqual(4_500_000);
  });
});

describe("G2 lease policy", () => {
  it("claims an expired lease and rejects an active lease", () => {
    const now = Date.parse("2026-08-03T12:00:00.000Z");
    expect(claimLease({ leaseUntil: "2026-08-03T11:59:00.000Z", now, owner: "worker-a" })).toEqual({
      leaseOwner: "worker-a",
      claimedAt: "2026-08-03T12:00:00.000Z",
      leaseUntil: "2026-08-03T12:05:00.000Z",
    });
    expect(claimLease({ leaseUntil: "2026-08-03T12:01:00.000Z", now, owner: "worker-b" })).toBeNull();
    expect(claimLease({ leaseUntil: null, now, owner: "worker-a" })).toMatchObject({
      leaseOwner: "worker-a",
      leaseUntil: "2026-08-03T12:05:00.000Z",
    });
    expect(claimLease({ leaseUntil: "not-a-date", now, owner: "worker-a" })).toBeNull();
    expect(claimLease({ leaseUntil: null, now, owner: "worker-a", leaseDurationMs: LEASE_DURATION_MS })).not.toBeNull();
  });
});
