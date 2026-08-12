// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleAdmin from "../admin.js";

function makeDb({ rows = [], total = 0, first = null } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return {
        bind() { return this; },
        async first() { return first ?? { total }; },
        async all() { return { results: rows }; },
        async run() { return { changes: 1 }; },
      };
    },
  };
}

function request(method = "GET", path = "/api/admin/entries", body) {
  return new Request(`https://bunker.test${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function routeUrl(path = "/api/admin/entries") {
  return new URL(`https://bunker.test${path}`);
}

describe("/api/admin resources", () => {
  it("allows admin through the guard and returns a paginated resource envelope", async () => {
    const db = makeDb({ rows: [{ id: "entry-1", title: "Hola", classified: 1 }], total: 1 });
    const response = await handleAdmin(request(), { DB: db }, routeUrl(), "admin");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      items: [{ id: "entry-1", title: "Hola", classified: 1 }],
      total: 1,
      page: 1,
      pageSize: 25,
    });
    expect(db.calls.some((sql) => sql.includes("FROM entries"))).toBe(true);
  });

  it("rejects edu with 403 before touching D1", async () => {
    const db = makeDb();
    const response = await handleAdmin(request(), { DB: db }, routeUrl(), "edu");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden — admin required" });
    expect(db.calls).toEqual([]);
  });

  it("rejects missing identity with 403 before touching D1", async () => {
    const db = makeDb();
    const response = await handleAdmin(request(), { DB: db }, routeUrl(), null);

    expect(response.status).toBe(403);
    expect(db.calls).toEqual([]);
  });

  it("returns not found outside the admin namespace after authorization", async () => {
    const db = makeDb();
    const response = await handleAdmin(request("GET", "/api/entries"), { DB: db }, routeUrl("/api/entries"), "admin");

    expect(response.status).toBe(404);
    expect(db.calls).toEqual([]);
  });

  it("creates, classifies and soft-deletes an entry through the admin contract", async () => {
    const db = makeDb({ first: { id: "entry-1", title: "Hola", from_user: "edu" } });
    const created = await handleAdmin(
      request("POST", "/api/admin/entries", { title: "Nueva" }),
      { DB: db }, routeUrl("/api/admin/entries"), "admin",
    );
    expect(created.status).toBe(201);

    const classified = await handleAdmin(
      request("POST", "/api/admin/entries/entry-1/classify"),
      { DB: db }, routeUrl("/api/admin/entries/entry-1/classify"), "admin",
    );
    expect(classified.status).toBe(200);

    const deleted = await handleAdmin(
      request("DELETE", "/api/admin/entries/entry-1"),
      { DB: db }, routeUrl("/api/admin/entries/entry-1"), "admin",
    );
    expect(deleted.status).toBe(200);
    expect(db.calls.some((sql) => sql.includes("INSERT INTO events"))).toBe(true);
  });

  it("keeps unsupported methods, bare namespace and G2 namespace as 404", async () => {
    const db = makeDb();
    const unsupported = await handleAdmin(
      request("PUT", "/api/admin/entries"), { DB: db }, routeUrl("/api/admin/entries"), "admin",
    );
    const bareNamespace = await handleAdmin(
      request("GET", "/api/admin"), { DB: db }, routeUrl("/api/admin"), "admin",
    );
    const g2 = await handleAdmin(
      request("GET", "/api/admin/g2/inspect"), { DB: db }, routeUrl("/api/admin/g2/inspect"), "admin",
    );

    expect(unsupported.status).toBe(404);
    expect(bareNamespace.status).toBe(404);
    expect(g2.status).toBe(404);
  });
});
