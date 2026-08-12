// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleAdminAudit from "../admin-audit.js";
import { ROUTES } from "../../worker.js";

const AUDIT_URL = "https://bunker.test/api/admin/audit";

// Eventos de auditoría que pueblan events hoy (ADR-028 auth_login,
// modo visita visit_mode_on/off; acciones admin_* aún no existen).
const EVENTS = [
  { id: 3, event_type: "auth_login", user_id: "admin", entity_type: null, entity_id: null, payload: "{}", created_at: "2026-08-12 04:00:00" },
  { id: 2, event_type: "visit_mode_on", user_id: "edu", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 03:00:00" },
  { id: 1, event_type: "visit_mode_off", user_id: "edu", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 02:00:00" },
];

function makeRequest(method = "GET", url = AUDIT_URL) {
  return new Request(url, { method });
}

function makeDb({ rows = [], total = 0 } = {}) {
  const calls = [];
  let lastStatement = null;

  function statement(sql) {
    return {
      async first() {
        if (/\bCOUNT\(\*\)/i.test(sql)) return { count: total };
        return null;
      },
      async all() {
        return { results: rows };
      },
      bind(...values) {
        this.lastBind = values;
        return this;
      },
    };
  }

  return {
    calls,
    get lastStatement() {
      return lastStatement;
    },
    prepare(sql) {
      const st = statement(sql);
      lastStatement = st;
      calls.push(sql);
      return st;
    },
  };
}

function routeUrl(value = AUDIT_URL) {
  return new globalThis.URL(value);
}

function routeIndex(prefix) {
  return ROUTES.findIndex(([routePrefix]) => routePrefix === prefix);
}

describe("GET /api/admin/audit — consola de AUDITORÍA (B5)", () => {
  it("registra el prefijo como endpoint autenticado sin romper el orden G2 → admin/", () => {
    expect(ROUTES.find(([prefix]) => prefix === "/api/admin/audit")).toEqual([
      "/api/admin/audit",
      handleAdminAudit,
      true,
    ]);
    expect(routeIndex("/api/admin/audit")).toBeGreaterThan(routeIndex("/api/admin/g2"));
    expect(routeIndex("/api/admin/")).toBeGreaterThan(routeIndex("/api/admin/audit"));
  });

  it("rejects a missing identity before querying D1", async () => {
    const db = makeDb();
    const response = await handleAdminAudit(makeRequest(), { DB: db }, routeUrl(), null);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(db.calls).toEqual([]);
  });

  it("rejects a non-admin identity before querying D1", async () => {
    const db = makeDb();
    const response = await handleAdminAudit(makeRequest(), { DB: db }, routeUrl(), "edu");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden — admin required" });
    expect(db.calls).toEqual([]);
  });

  it("returns the audit events read from D1 with total and pagination for an admin", async () => {
    const db = makeDb({ rows: EVENTS, total: 3 });
    const response = await handleAdminAudit(makeRequest(), { DB: db }, routeUrl(), "admin");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      readOnly: true,
      items: EVENTS,
      total: 3,
      page: 1,
      pageSize: 25,
    });
    expect(typeof body.generatedAt).toBe("string");
    expect(db.calls).toHaveLength(2);
    expect(db.calls[0]).toMatch(/\bCOUNT\(\*\)/i);
    expect(db.calls[1]).toContain("FROM events");
    expect(db.calls[1]).toContain("ORDER BY created_at DESC, id DESC");
    expect(db.calls[1]).toContain("LIMIT ?1 OFFSET ?2");
    expect(db.calls.every(sql => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP)\b/i.test(sql))).toBe(true);
  });

  it("filters by type and user in the WHERE clause (audit filters)", async () => {
    const db = makeDb({ rows: [], total: 0 });
    const url = `${AUDIT_URL}?type=auth_login&user=admin`;
    const response = await handleAdminAudit(makeRequest("GET", url), { DB: db }, routeUrl(url), "admin");

    expect(response.status).toBe(200);
    expect(db.calls[0]).toContain("event_type = ?1");
    expect(db.calls[0]).toContain("user_id = ?2");
    // SELECT: binds = [type, user, pageSize, offset]; page 1 → offset 0.
    expect(db.lastStatement.lastBind).toEqual(["auth_login", "admin", 25, 0]);
  });

  it("applies the requested pagination page/pageSize", async () => {
    const db = makeDb({ rows: [], total: 37 });
    const url = `${AUDIT_URL}?page=2&pageSize=5`;
    const response = await handleAdminAudit(makeRequest("GET", url), { DB: db }, routeUrl(url), "admin");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(5);
    // SELECT: binds = [pageSize, offset]; offset = (page-1)*pageSize = 5.
    expect(db.lastStatement.lastBind).toEqual([5, 5]);
  });

  it("serves the full audit trail including auth_login and visit_mode_on/off (no auth_% exclusion)", async () => {
    const db = makeDb({ rows: EVENTS, total: 3 });
    const response = await handleAdminAudit(makeRequest(), { DB: db }, routeUrl(), "admin");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items.map((row) => row.event_type)).toEqual([
      "auth_login",
      "visit_mode_on",
      "visit_mode_off",
    ]);
    expect(db.calls.join("\n")).not.toMatch(/NOT LIKE/i);
  });

  it("does not serve non-GET methods or other paths", async () => {
    const db = makeDb();
    const post = await handleAdminAudit(makeRequest("POST"), { DB: db }, routeUrl(), "admin");
    const other = await handleAdminAudit(
      makeRequest("GET", "https://bunker.test/api/admin/audit/extra"),
      { DB: db },
      routeUrl("https://bunker.test/api/admin/audit/extra"),
      "admin",
    );

    expect(post.status).toBe(404);
    expect(other.status).toBe(404);
    expect(db.calls).toEqual([]);
  });
});
