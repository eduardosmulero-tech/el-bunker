// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleAdminG2 from "../admin-g2.js";

const INSPECT_URL = "https://bunker.test/api/admin/g2/inspect";
const PREVIEW_URL = "https://bunker.test/api/admin/g2/preview-purge";

function makeRequest(method = "GET", url = INSPECT_URL) {
  return new Request(url, { method });
}

function makeDb({
  role = "admin",
  counts = {},
  tables = [
    "admin_audit_log",
    "file_references",
    "repair_attempts",
    "repair_queue",
  ],
  states = [],
  entity = { id: "entry-1", deleted: 1 },
  summary = {
    legacy_file_count: 2,
    legacy_total_bytes: 4096,
    policy_reference_count: 0,
    shared_file_count: 0,
  },
} = {}) {
  const calls = [];

  function resultFor(sql) {
    if (sql.includes("FROM users")) return { id: "admin", role };
    if (sql.includes("legacy_file_count")) return summary;
    if (sql.includes("FROM entries") || sql.includes("FROM tracks") || sql.includes("FROM files f WHERE f.id") || sql.includes("FROM files WHERE id")) {
      return entity;
    }
    if (sql.includes("admin_audit_log")) return { count: counts.adminAuditLog ?? 0 };
    if (sql.includes("repair_attempts")) return { count: counts.repairAttempts ?? 0 };
    if (sql.includes("repair_queue")) return { count: counts.repairQueue ?? 0 };
    if (sql.includes("file_references")) return { count: counts.fileReferences ?? 0 };
    return null;
  }

  function statement(sql) {
    const boundStatement = {
      async first() {
        return resultFor(sql);
      },
      async all() {
        if (sql.includes("sqlite_master")) return { results: tables.map(name => ({ name })) };
        return { results: states };
      },
    };

    return {
      ...boundStatement,
      bind(..._bindings) {
        return boundStatement;
      },
    };
  }

  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return statement(sql);
    },
  };
}

async function readJson(response) {
  return response.json();
}

function routeUrl(value = INSPECT_URL) {
  return new globalThis.URL(value);
}

describe("GET /api/admin/g2/inspect", () => {
  it("rejects a missing identity before querying D1", async () => {
    const db = makeDb();
    const response = await handleAdminG2(makeRequest(), { DB: db }, routeUrl(), null);

    expect(response.status).toBe(401);
    expect(await readJson(response)).toEqual({ error: "Unauthorized" });
    expect(db.calls).toEqual([]);
  });

  it("rejects a non-admin identity before querying G2", async () => {
    const db = makeDb();
    const response = await handleAdminG2(makeRequest(), { DB: db }, routeUrl(), "edu");

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: "Forbidden — only admin can inspect G2" });
    expect(db.calls).toEqual([]);
  });

  it("rejects an admin-shaped identity without an admin D1 role", async () => {
    const db = makeDb({ role: "user" });
    const response = await handleAdminG2(makeRequest(), { DB: db }, routeUrl(), "admin");

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: "Forbidden — admin role required" });
    expect(db.calls).toHaveLength(1);
  });

  it("returns migration state and counts without executing writes", async () => {
    const db = makeDb({ counts: {
      fileReferences: 0,
      adminAuditLog: 0,
      repairQueue: 0,
      repairAttempts: 0,
    } });
    const response = await handleAdminG2(makeRequest(), { DB: db }, routeUrl(), "admin");
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      readOnly: true,
      schema: {
        migration: "0001_g2_policy.sql",
        tablesPresent: ["admin_audit_log", "file_references", "repair_attempts", "repair_queue"],
        migrationApplied: true,
      },
      counts: {
        fileReferences: 0,
        adminAuditLog: 0,
        repairQueue: 0,
        repairAttempts: 0,
      },
      queueStates: {},
    });
    expect(db.calls.every(sql => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP)\b/i.test(sql))).toBe(true);
  });

  it("returns queue state counts without exposing queue payloads", async () => {
    const db = makeDb({ states: [
      { state: "blocked", count: 1 },
      { state: "pending", count: 2 },
    ] });
    const response = await handleAdminG2(makeRequest(), { DB: db }, routeUrl(), "admin");
    const body = await readJson(response);

    expect(body.queueStates).toEqual({ blocked: 1, pending: 2 });
    expect(body).not.toHaveProperty("payload");
    expect(body).not.toHaveProperty("r2Key");
  });

  it("does not serve non-GET or another path", async () => {
    const db = makeDb();
    const response = await handleAdminG2(makeRequest("POST"), { DB: db }, routeUrl(), "admin");

    expect(response.status).toBe(404);
    expect(db.calls).toEqual([]);
  });
});

describe("GET /api/admin/g2/preview-purge", () => {
  it("rejects missing identity and non-admin identity", async () => {
    const missing = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=entry&entity_id=entry-1`),
      { DB: makeDb() },
      routeUrl(`${PREVIEW_URL}?entity_type=entry&entity_id=entry-1`),
      null,
    );
    const nonAdmin = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=entry&entity_id=entry-1`),
      { DB: makeDb() },
      routeUrl(`${PREVIEW_URL}?entity_type=entry&entity_id=entry-1`),
      "edu",
    );

    expect(missing.status).toBe(401);
    expect(nonAdmin.status).toBe(403);
  });

  it("returns aggregated legacy entry impact and marks policy coverage incomplete", async () => {
    const db = makeDb({
      entity: { id: "entry-1", deleted: 1 },
      summary: {
        legacy_file_count: 2,
        legacy_total_bytes: 4096,
        policy_reference_count: 0,
        shared_file_count: 1,
      },
    });
    const response = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=entry&entity_id=entry-1`),
      { DB: db },
      routeUrl(`${PREVIEW_URL}?entity_type=entry&entity_id=entry-1`),
      "admin",
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.preview).toMatchObject({
      entityType: "entry",
      entityId: "entry-1",
      deleted: true,
      legacyFileCount: 2,
      policyReferenceCount: 0,
      totalBytes: 4096,
      sharedFileCount: 1,
      hasSharedReferences: true,
      ownershipCoverageComplete: false,
      readyForSnapshot: false,
    });
    expect(body.preview).not.toHaveProperty("r2_key");
    expect(body.preview).not.toHaveProperty("content");
    expect(db.calls.every(sql => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP)\b/i.test(sql))).toBe(true);
  });

  it("supports track and file previews without exposing object keys", async () => {
    for (const entityType of ["track", "file"]) {
      const db = makeDb({ entity: { id: `${entityType}-1`, deleted: 0 } });
      const url = `${PREVIEW_URL}?entity_type=${entityType}&entity_id=${entityType}-1`;
      const response = await handleAdminG2(makeRequest("GET", url), { DB: db }, routeUrl(url), "admin");
      const body = await readJson(response);

      expect(response.status).toBe(200);
      expect(body.preview.entityType).toBe(entityType);
      expect(body.preview).not.toHaveProperty("r2_key");
      expect(db.calls.every(sql => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP)\b/i.test(sql))).toBe(true);
    }
  });

  it("rejects invalid entity types and IDs before preview queries", async () => {
    const db = makeDb();
    const invalidType = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=playlist&entity_id=p1`),
      { DB: db },
      routeUrl(`${PREVIEW_URL}?entity_type=playlist&entity_id=p1`),
      "admin",
    );
    const missingId = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=entry`),
      { DB: db },
      routeUrl(`${PREVIEW_URL}?entity_type=entry`),
      "admin",
    );
    const controlId = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=entry&entity_id=%01`),
      { DB: db },
      routeUrl(`${PREVIEW_URL}?entity_type=entry&entity_id=%01`),
      "admin",
    );
    const longId = "x".repeat(257);
    const tooLongId = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=entry&entity_id=${longId}`),
      { DB: db },
      routeUrl(`${PREVIEW_URL}?entity_type=entry&entity_id=${longId}`),
      "admin",
    );

    expect(invalidType.status).toBe(400);
    expect(missingId.status).toBe(400);
    expect(controlId.status).toBe(400);
    expect(tooLongId.status).toBe(400);
    expect(db.calls).toHaveLength(4);
  });

  it("returns 404 for an entity that does not exist", async () => {
    const db = makeDb({ entity: null });
    const response = await handleAdminG2(
      makeRequest("GET", `${PREVIEW_URL}?entity_type=track&entity_id=missing`),
      { DB: db },
      routeUrl(`${PREVIEW_URL}?entity_type=track&entity_id=missing`),
      "admin",
    );

    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({ error: "Entity not found" });
    expect(db.calls).toHaveLength(2);
  });
});
