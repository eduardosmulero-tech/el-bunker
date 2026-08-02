// @vitest-environment node
import { describe, it, expect } from "vitest";
import { resolveAccessKey, hasAccessKeysConfigured, MIN_KEY_LENGTH } from "../access-keys.js";

const ADMIN = "A".repeat(43);   // 43 chars = clave base64url de 32 bytes
const EDU   = "B".repeat(43);
const env   = { ADMIN_ACCESS_KEY: ADMIN, EDU_ACCESS_KEY: EDU };

describe("resolveAccessKey", () => {
  it("resuelve la clave de admin a 'admin'", async () => {
    expect(await resolveAccessKey(ADMIN, env)).toBe("admin");
  });

  it("resuelve la clave de edu a 'edu'", async () => {
    expect(await resolveAccessKey(EDU, env)).toBe("edu");
  });

  it("rechaza una clave que no corresponde a ningún secret", async () => {
    expect(await resolveAccessKey("C".repeat(43), env)).toBeNull();
  });

  it("rechaza claves más cortas que el mínimo", async () => {
    const corta = "D".repeat(MIN_KEY_LENGTH - 1);
    expect(await resolveAccessKey(corta, { ADMIN_ACCESS_KEY: corta })).toBeNull();
  });

  it("ignora un secret configurado demasiado corto", async () => {
    expect(await resolveAccessKey("x".repeat(43), { ADMIN_ACCESS_KEY: "corta" })).toBeNull();
  });

  it("rechaza entradas que no son string", async () => {
    expect(await resolveAccessKey(null, env)).toBeNull();
    expect(await resolveAccessKey(12345, env)).toBeNull();
  });

  it("devuelve null si no hay ningún secret en el entorno", async () => {
    expect(await resolveAccessKey(ADMIN, {})).toBeNull();
  });
});

describe("hasAccessKeysConfigured", () => {
  it("es true con al menos un secret válido", () => {
    expect(hasAccessKeysConfigured({ EDU_ACCESS_KEY: EDU })).toBe(true);
  });

  it("es false con el entorno vacío o con secrets cortos", () => {
    expect(hasAccessKeysConfigured({})).toBe(false);
    expect(hasAccessKeysConfigured({ ADMIN_ACCESS_KEY: "corta" })).toBe(false);
  });
});
