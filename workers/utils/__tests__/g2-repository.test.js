// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  appendAdminAudit,
  appendRepairAttempt,
  claimRepairLease,
  enqueueRepair,
} from "../g2-repository.js";

function makeDb({ runResults = [], firstResults = [] } = {}) {
  const runs = [];
  const firsts = [];
  return {
    runs,
    firsts,
    prepare(sql) {
      return {
        bind(...bindings) {
          return {
            async run() {
              runs.push({ sql, bindings });
              return runResults.shift() ?? { meta: { changes: 1 } };
            },
            async first() {
              firsts.push({ sql, bindings });
              return firstResults.shift() ?? null;
            },
          };
        },
      };
    },
  };
}

describe("G2 repository audit", () => {
  it("appends a bounded, serialized audit row", async () => {
    const db = makeDb();
    await expect(appendAdminAudit(db, {
      operationId: "op-1",
      actorUserId: "admin",
      action: "purge_plan",
      entityType: "file",
      entityId: "file-1",
      reason: "approved review",
      result: "planned",
      details: { count: 1 },
      r2ManifestHash: "sha256:abc",
    })).resolves.toEqual({ changes: 1 });

    expect(db.runs).toHaveLength(1);
    expect(db.runs[0].sql).toContain("INSERT INTO admin_audit_log");
    expect(db.runs[0].bindings.at(-2)).toBe('{"count":1}');
    expect(db.runs[0].bindings.at(-1)).toBe("sha256:abc");
  });

  it("rejects unsupported audit actions and oversized details before D1", async () => {
    const db = makeDb();
    await expect(appendAdminAudit(db, {
      operationId: "op-1",
      actorUserId: "admin",
      action: "delete_everything",
      reason: "bad",
      result: "planned",
    })).rejects.toThrow("action is not supported");
    await expect(appendAdminAudit(db, {
      operationId: "op-2",
      actorUserId: "admin",
      action: "purge_plan",
      reason: "bad",
      result: "planned",
      details: { value: "x".repeat(32_769) },
    })).rejects.toThrow("details is too large");
    expect(db.runs).toHaveLength(0);
  });
});

describe("G2 repository repair queue", () => {
  it("enqueues idempotently and returns the canonical row", async () => {
    const row = {
      id: 7,
      operation_id: "op-2",
      state: "pending",
      attempt_count: 0,
    };
    const db = makeDb({ firstResults: [row] });
    await expect(enqueueRepair(db, {
      operationId: "op-2",
      kind: "r2_delete_retry",
      entityType: "file",
      entityId: "file-1",
      r2Key: "vault/photos/file-1.jpg",
      payload: { errorCode: "R2_TIMEOUT" },
    })).resolves.toEqual(row);

    expect(db.runs[0].sql).toContain("ON CONFLICT(operation_id) DO NOTHING");
    expect(db.runs[0].bindings.at(-1)).toBe('{"errorCode":"R2_TIMEOUT"}');
    expect(db.firsts).toHaveLength(1);
  });

  it("rejects invalid repair kinds, URLs, and non-serializable payloads", async () => {
    const db = makeDb();
    await expect(enqueueRepair(db, {
      operationId: "op-3",
      kind: "unknown",
    })).rejects.toThrow("kind is not supported");
    await expect(enqueueRepair(db, {
      operationId: "op-3-url",
      kind: "purge",
      r2Key: "https://example.test/signed?token=secret",
    })).rejects.toThrow("r2Key must be an object key");
    const circular = {};
    circular.self = circular;
    await expect(enqueueRepair(db, {
      operationId: "op-4",
      kind: "purge",
      payload: circular,
    })).rejects.toThrow("payload must be JSON-serializable");
    await expect(enqueueRepair(db, {
      operationId: "op-5",
      kind: "purge",
      payload: { url: "https://example.test/private" },
    })).rejects.toThrow("payload must not contain URLs");
    expect(db.runs).toHaveLength(0);
  });

  it("rejects a conflicting scope when operation_id already exists", async () => {
    const db = makeDb({ firstResults: [{ kind: "purge", entity_type: "file", entity_id: "file-1", r2_key: "a.jpg", file_id: "f1" }] });
    await expect(enqueueRepair(db, {
      operationId: "op-existing",
      kind: "purge",
      entityType: "file",
      entityId: "file-2",
      r2Key: "a.jpg",
      fileId: "f1",
    })).rejects.toThrow("different repair scope");
  });
});

describe("G2 repository leases", () => {
  it("uses a conditional D1 update and returns the claimed row", async () => {
    const row = {
      id: 7,
      operation_id: "op-2",
      state: "retrying",
      lease_owner: "worker-a",
      lease_until: "2026-08-03T12:05:00.000Z",
      attempt_count: 1,
    };
    const db = makeDb({ firstResults: [row] });
    await expect(claimRepairLease(db, {
      operationId: "op-2",
      owner: "worker-a",
      nowIso: "2026-08-03T12:00:00.000Z",
      leaseUntilIso: "2026-08-03T12:05:00.000Z",
    })).resolves.toEqual(row);

    expect(db.runs[0].sql).toContain("lease_until IS NULL OR lease_until < ?3");
    expect(db.runs[0].sql).toContain("state IN ('pending', 'retrying')");
    expect(db.runs[0].sql).toContain("state = CASE WHEN state = 'pending' THEN 'retrying'");
    expect(db.firsts).toHaveLength(1);
  });

  it("returns null when the conditional update wins zero rows", async () => {
    const db = makeDb({ runResults: [{ meta: { changes: 0 } }] });
    await expect(claimRepairLease(db, {
      operationId: "op-2",
      owner: "worker-b",
      nowIso: "2026-08-03T12:00:00.000Z",
      leaseUntilIso: "2026-08-03T12:05:00.000Z",
    })).resolves.toBeNull();
    expect(db.firsts).toHaveLength(0);
  });

  it("rejects non-canonical dates and invalid date order before D1", async () => {
    const db = makeDb();
    await expect(claimRepairLease(db, {
      operationId: "op-2",
      owner: "worker-a",
      nowIso: "2026-08-03 12:00:00",
      leaseUntilIso: "2026-08-03T12:05:00.000Z",
    })).rejects.toThrow("canonical UTC ISO date");
    await expect(claimRepairLease(db, {
      operationId: "op-2",
      owner: "worker-a",
      nowIso: "2026-08-03T12:05:00.000Z",
      leaseUntilIso: "2026-08-03T12:00:00.000Z",
    })).rejects.toThrow("leaseUntilIso must be after nowIso");
    expect(db.runs).toHaveLength(0);
  });
});

describe("G2 repository attempts", () => {
  it("appends a valid immutable attempt", async () => {
    const db = makeDb();
    await expect(appendRepairAttempt(db, {
      queueId: 7,
      attemptNumber: 1,
      actorUserId: null,
      outcome: "retryable_failure",
      errorCode: "R2_TIMEOUT",
      errorMessage: "temporary failure",
    })).resolves.toEqual({ changes: 1 });
    expect(db.runs[0].sql).toContain("INSERT INTO repair_attempts");
  });

  it("rejects invalid attempt values", async () => {
    const db = makeDb();
    await expect(appendRepairAttempt(db, {
      queueId: 0,
      attemptNumber: 1,
      outcome: "started",
    })).rejects.toThrow("queueId must be a positive integer");
    await expect(appendRepairAttempt(db, {
      queueId: 7,
      attemptNumber: 1,
      outcome: "unknown",
    })).rejects.toThrow("outcome is not supported");
    await expect(appendRepairAttempt(db, {
      queueId: 7,
      attemptNumber: 4,
      outcome: "started",
    })).rejects.toThrow("attemptNumber must be an integer from 1 to 3");
    expect(db.runs).toHaveLength(0);
  });
});

