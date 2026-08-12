// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleAdminHealth from "../admin-health.js";
import { ROUTES } from "../../worker.js";

const HEALTH_URL = "https://bunker.test/api/admin/health";

// Canon de la consola de SALUD (B4): lo que Edu verificaba a mano
// (files 527 / entries 527 / 1.054 refs / 0 colgantes; tracks 529
// activos y 0 soft-deleted tras la purga del 7-ago).
const CANON_COUNTS = {
  files: 527,
  entries: 527,
  tracksActive: 529,
  tracksSoftDeleted: 0,
  references: 1054,
  danglingReferences: 0,
};

function makeRequest(method = "GET", url = HEALTH_URL) {
  return new Request(url, { method });
}

function makeDb({ counts = {} } = {}) {
  const calls = [];

  function resultFor(sql) {
    if (sql.includes("LEFT JOIN files")) return { count: counts.danglingReferences ?? 0 };
    if (sql.includes("FROM files")) return { count: counts.files ?? 0 };
    if (sql.includes("FROM entries")) return { count: counts.entries ?? 0 };
    if (sql.includes("is_deleted = 0")) return { count: counts.tracksActive ?? 0 };
    if (sql.includes("is_deleted = 1")) return { count: counts.tracksSoftDeleted ?? 0 };
    if (sql.includes("file_references")) return { count: counts.references ?? 0 };
    return null;
  }

  function statement(sql) {
    return {
      async first() {
        return resultFor(sql);
      },
      async all() {
        return { results: [] };
      },
      bind() {
        return this;
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

function routeUrl(value = HEALTH_URL) {
  return new globalThis.URL(value);
}

function routeIndex(prefix) {
  return ROUTES.findIndex(([routePrefix]) => routePrefix === prefix);
}

describe("GET /api/admin/health — consola de SALUD (B4)", () => {
  it("registra el prefijo como endpoint autenticado sin romper el orden G2 → admin/", () => {
    expect(ROUTES.find(([prefix]) => prefix === "/api/admin/health")).toEqual([
      "/api/admin/health",
      handleAdminHealth,
      true,
    ]);
    expect(routeIndex("/api/admin/health")).toBeGreaterThan(routeIndex("/api/admin/g2"));
    expect(routeIndex("/api/admin/")).toBeGreaterThan(routeIndex("/api/admin/health"));
  });

  it("rejects a missing identity before querying D1", async () => {
    const db = makeDb();
    const response = await handleAdminHealth(makeRequest(), { DB: db }, routeUrl(), null);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(db.calls).toEqual([]);
  });

  it("rejects a non-admin identity before querying D1", async () => {
    const db = makeDb();
    const response = await handleAdminHealth(makeRequest(), { DB: db }, routeUrl(), "edu");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden — admin required" });
    expect(db.calls).toEqual([]);
  });

  it("returns the D1 counts for an admin without executing writes", async () => {
    const db = makeDb({ counts: CANON_COUNTS });
    const response = await handleAdminHealth(makeRequest(), { DB: db }, routeUrl(), "admin");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      readOnly: true,
      counts: CANON_COUNTS,
    });
    expect(typeof body.generatedAt).toBe("string");
    expect(db.calls).toHaveLength(6);
    expect(db.calls.every(sql => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP)\b/i.test(sql))).toBe(true);
  });

  it("reads every count from D1: a changed dataset comes back different", async () => {
    const db = makeDb({
      counts: { files: 1, entries: 2, tracksActive: 3, tracksSoftDeleted: 4, references: 5, danglingReferences: 6 },
    });
    const response = await handleAdminHealth(makeRequest(), { DB: db }, routeUrl(), "admin");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.counts).toEqual({
      files: 1,
      entries: 2,
      tracksActive: 3,
      tracksSoftDeleted: 4,
      references: 5,
      danglingReferences: 6,
    });
  });

  it("does not serve non-GET methods or other paths", async () => {
    const db = makeDb();
    const post = await handleAdminHealth(makeRequest("POST"), { DB: db }, routeUrl(), "admin");
    const other = await handleAdminHealth(
      makeRequest("GET", "https://bunker.test/api/admin/health/extra"),
      { DB: db },
      routeUrl("https://bunker.test/api/admin/health/extra"),
      "admin",
    );

    expect(post.status).toBe(404);
    expect(other.status).toBe(404);
    expect(db.calls).toEqual([]);
  });
});
