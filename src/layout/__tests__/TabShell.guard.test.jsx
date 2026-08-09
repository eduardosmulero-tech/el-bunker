// INT-Ola2 (P12) — DoD 3: guardia de tabs (ADR-017 🔒-4).
// TAB_MAP tiene EXACTAMENTE 3 claves. Un cuarto tab (o la fusión del panel
// dentro del shell) rompe esta suite: la ruta /admin es aparte, nunca un tab.
import { describe, expect, it } from "vitest";
import { TAB_MAP } from "../TabShell";

describe("INT-Ola2 — guardia de tabs (ADR-017 🔒-4)", () => {
  it("TAB_MAP tiene exactamente 3 claves", () => {
    expect(Object.keys(TAB_MAP)).toHaveLength(3);
  });

  it("las claves son exactamente vault, music y capsules", () => {
    expect(Object.keys(TAB_MAP).sort()).toEqual(["capsules", "music", "vault"]);
  });

  it("ninguna clave es admin (el panel es ruta aparte, no tab)", () => {
    expect(Object.keys(TAB_MAP)).not.toContain("admin");
  });
});
