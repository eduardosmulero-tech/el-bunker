// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ICONS, LEGACY_ICON_NAMES, resolveIconName } from "../Icon.jsx";

describe("Icon", () => {
  it("resolves canonical icon names to registered icons", () => {
    expect(resolveIconName("play")).toBe("play");
    expect(resolveIconName("grid")).toBe("grid");
    expect(ICONS[resolveIconName("play")]).toBeDefined();
    expect(ICONS[resolveIconName("grid")]).toBeDefined();
  });

  it("resolves every legacy presentation/content icon alias safely", () => {
    for (const [legacyName, canonicalName] of Object.entries(LEGACY_ICON_NAMES)) {
      expect(resolveIconName(legacyName), legacyName).toBe(canonicalName);
      expect(ICONS[canonicalName], legacyName).toBeDefined();
    }
  });

  it("returns null for unknown names so Icon can use its help fallback", () => {
    expect(resolveIconName("not-a-real-icon")).toBeNull();
  });
});
