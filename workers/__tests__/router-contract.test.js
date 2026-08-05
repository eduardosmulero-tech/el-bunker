// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ROUTES } from "../worker.js";
import handleAdmin from "../routes/admin.js";
import handleAdminG2 from "../routes/admin-g2.js";
import handleClassify from "../routes/classify.js";
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
