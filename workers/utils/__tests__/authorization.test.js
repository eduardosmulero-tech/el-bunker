// @vitest-environment node
import { describe, expect, it } from "vitest";
import { canManageOwned, canManageParticipant, isAdmin } from "../authorization.js";

describe("authorization helpers", () => {
  it("recognizes only the admin identity", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("edu")).toBe(false);
  });

  it("allows the owner or admin to manage an owned entity", () => {
    expect(canManageOwned("edu", "edu")).toBe(true);
    expect(canManageOwned("admin", "david")).toBe(true);
    expect(canManageOwned("david", "edu")).toBe(false);
  });

  it("allows participants or admin to manage a shared entity", () => {
    expect(canManageParticipant("edu", ["edu", "david"])).toBe(true);
    expect(canManageParticipant("admin", ["david"])).toBe(true);
    expect(canManageParticipant("david", ["edu"])).toBe(false);
  });
});
