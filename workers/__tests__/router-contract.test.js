// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ROUTES } from "../worker.js";
import handleAdmin from "../routes/admin.js";
import handleAdminG2 from "../routes/admin-g2.js";
import handleClassify from "../routes/classify.js";
import handleSession from "../routes/session.js";
import { EVENT_TYPES, isValidEventType } from "../utils/validation.js";

function routeIndex(prefix) {
  return ROUTES.findIndex(([routePrefix]) => routePrefix === prefix);
}

describe("coordinated A1/B2 integration", () => {
  it("registers the intended handlers as authenticated endpoints", () => {
    expect(ROUTES.find(([prefix]) => prefix === "/api/classify")).toEqual(["/api/classify", handleClassify, true]);
    expect(ROUTES.find(([prefix]) => prefix === "/api/admin/")).toEqual(["/api/admin/", handleAdmin, true]);
    expect(ROUTES.find(([prefix]) => prefix === "/api/admin/g2")).toEqual(["/api/admin/g2", handleAdminG2, true]);
  });

  it("keeps the specific G2 route ahead of the generic admin skeleton", () => {
    expect(routeIndex("/api/admin/g2")).toBeGreaterThanOrEqual(0);
    expect(routeIndex("/api/admin/")).toBeGreaterThan(routeIndex("/api/admin/g2"));
  });

  it("recognizes the classification audit events", () => {
    expect(EVENT_TYPES.has("item_classified")).toBe(true);
    expect(EVENT_TYPES.has("item_unclassified")).toBe(true);
    expect(isValidEventType("item_classified")).toBe(true);
    expect(isValidEventType("item_unclassified")).toBe(true);
  });
});

// ─── INT-Ola2 (P12): la ruta de sesión de A2 entra en el router ───────
describe("INT-Ola2 — /api/session (A2) registrada", () => {
  it("registers the session handler as an authenticated endpoint", () => {
    expect(ROUTES.find(([prefix]) => prefix === "/api/session")).toEqual(["/api/session", handleSession, true]);
  });

  it("the session route responds 401 without an authenticated user", async () => {
    const request = new Request("https://el-bunker-api.test/api/session/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const env = { JWT_SECRET: "test-secret" };
    const response = await handleSession(request, env, new URL(request.url), null);
    expect(response.status).toBe(401);
  });

  it("does not shadow the existing auth prefix", () => {
    expect(routeIndex("/api/auth")).toBeLessThan(routeIndex("/api/session"));
  });
});
