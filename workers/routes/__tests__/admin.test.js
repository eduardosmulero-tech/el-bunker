// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleAdmin from "../admin.js";

function makeDb() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push(sql);
      return { bind() { return this; }, async first() { return null; }, async all() { return { results: [] }; } };
    },
  };
}

function request(method = "GET", path = "/api/admin/entries") {
  return new Request(`https://bunker.test${path}`, { method });
}

function routeUrl(path = "/api/admin/entries") {
  return new URL(`https://bunker.test${path}`);
}

describe("/api/admin skeleton", () => {
  it("allows admin through the guard and returns the placeholder", async () => {
    const db = makeDb();
    const response = await handleAdmin(request(), { DB: db }, routeUrl(), "admin");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Admin route not implemented" });
    expect(db.calls).toEqual([]);
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

  it("keeps unsupported methods and the bare namespace as 404 placeholders", async () => {
    const db = makeDb();
    const unsupported = await handleAdmin(
      request("POST", "/api/admin/entries"), { DB: db }, routeUrl("/api/admin/entries"), "admin",
    );
    const bareNamespace = await handleAdmin(
      request("GET", "/api/admin"), { DB: db }, routeUrl("/api/admin"), "admin",
    );

    expect(unsupported.status).toBe(404);
    expect(bareNamespace.status).toBe(404);
    expect(db.calls).toEqual([]);
  });

  // The eventual router must keep /api/admin/g2 ahead of this generic handler.
  it("leaves the existing G2 handler namespace to the integrator", async () => {
    const db = makeDb();
    const response = await handleAdmin(
      request("GET", "/api/admin/g2/inspect"), { DB: db }, routeUrl("/api/admin/g2/inspect"), "admin",
    );

    expect(response.status).toBe(404);
    expect(db.calls).toEqual([]);
  });
});
