import { describe, expect, it } from "vitest";
import { ENTRY_CATEGORY, SECCIONES, SECCION_LABEL, seccionDeEntrada, getImageUrl, getMediaType, isClassified, monthsSince, resolveEraId, resolveEntryDate, timeSince, timeUntil, MODES } from "../VaultHelpers";

const NOW = new Date("2026-08-04T12:00:00.000Z");

describe("VaultHelpers", () => {
  it("calculates elapsed calendar time and total days deterministically", () => {
    expect(timeSince("2025-06-04T12:00:00.000Z", NOW)).toEqual({ years: 1, months: 2, days: 0, totalDays: 426 });
  });

  it("handles empty dates and countdown boundaries", () => {
    expect(timeSince(null, NOW)).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
    expect(timeUntil(null, NOW)).toBeNull();
    expect(timeUntil("2026-08-04T11:59:00.000Z", NOW)).toEqual({ unlocked: true });
    expect(timeUntil("2026-08-05T13:30:00.000Z", NOW)).toEqual({ unlocked: false, days: 1, hours: 1, minutes: 30 });
  });

  it("calculates calendar months independently of the day", () => {
    expect(monthsSince("2025-12-31T00:00:00.000Z", NOW)).toBe(8);
    expect(monthsSince(null, NOW)).toBe(0);
  });

  it("normalizes invalid dates without throwing", () => {
    expect(timeSince("not-a-date", NOW)).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
    expect(monthsSince("not-a-date", NOW)).toBe(0);
    expect(timeUntil("not-a-date", NOW)).toBeNull();
  });

  it("prefers signed URLs and supports R2 keys and data URLs", () => {
    expect(getImageUrl({ content: { images: [{ url: "https://signed.test/image" }] } })).toBe("https://signed.test/image");
    expect(getImageUrl({ content: { images: [{ r2_key: "vault/photos/image.jpg" }] } })).toContain("vault/photos/image.jpg");
    expect(getImageUrl({ content: { images: [{ dataUrl: "data:image/png;base64,abc" }] } })).toBe("data:image/png;base64,abc");
    expect(getImageUrl({ content: {} })).toBeNull();
  });

  it("resolves media subtype and keeps the taxonomy lookup centralized", () => {
    expect(getMediaType({ type: "photo", content: { images: [{ media_type: "video" }] } })).toBe("video");
    expect(getMediaType({ type: "note" })).toBe("note");
    expect(ENTRY_CATEGORY.photo).toBeDefined();
    expect(ENTRY_CATEGORY.note).toBeDefined();
    expect(Object.keys(ENTRY_CATEGORY).length).toBeGreaterThan(10);
  });

  // ── Modo Visita (A5): forma saneada del diseño §3 ──────────
  it("isClassified detecta la forma saneada (classified === true) y nada más", () => {
    expect(isClassified({ classified: true })).toBe(true);
    expect(isClassified({ id: "x", classified: true, blurhash: null, fecha: "2026-01-01", era: "e1" })).toBe(true);
    expect(isClassified({ classified: false })).toBe(false);
    expect(isClassified({ classified: 1 })).toBe(false);
    expect(isClassified({})).toBe(false);
    expect(isClassified(null)).toBe(false);
    expect(isClassified(undefined)).toBe(false);
  });

  it("resolveEraId prefiere era_id (forma completa) y cae a era (forma saneada A3)", () => {
    expect(resolveEraId({ era_id: "e1", era: "e2" })).toBe("e1");
    expect(resolveEraId({ era: "e2" })).toBe("e2");
    expect(resolveEraId({ era: null })).toBeNull();
    expect(resolveEraId({})).toBeNull();
    expect(resolveEraId(null)).toBeNull();
  });

  it("resolveEntryDate prefiere created_at y cae a fecha (forma saneada A3)", () => {
    expect(resolveEntryDate({ created_at: "2026-01-01", fecha: "2025-01-01" })).toBe("2026-01-01");
    expect(resolveEntryDate({ fecha: "2025-01-01" })).toBe("2025-01-01");
    expect(resolveEntryDate({ fecha: null })).toBeNull();
    expect(resolveEntryDate({})).toBeNull();
    expect(resolveEntryDate(null)).toBeNull();
  });

  // ── ADR-033: cuatro secciones y mapeo AL LEER (nunca UPDATE en D1) ──
  it("define exactamente las 4 secciones de ADR-033 sin la caja fuerte", () => {
    expect(SECCIONES.map((s) => s.id)).toEqual(["memoria", "palabras", "lugares", "listas"]);
    expect(SECCION_LABEL).toEqual({ memoria: "MEMORIA", palabras: "PALABRAS", lugares: "LUGARES", listas: "LISTAS" });
  });

  it("mapea AL LEER por la tabla explícita: 1->MEMORIA, 2->PALABRAS, 4->LUGARES, 6->LISTAS", () => {
    expect(seccionDeEntrada({ type: "photo" })).toBe("memoria");       // categoría 1
    expect(seccionDeEntrada({ type: "video" })).toBe("memoria");       // categoría 1
    expect(seccionDeEntrada({ type: "audio" })).toBe("memoria");       // categoría 1
    expect(seccionDeEntrada({ type: "note" })).toBe("palabras");       // categoría 2
    expect(seccionDeEntrada({ type: "letter" })).toBe("palabras");     // categoría 2
    expect(seccionDeEntrada({ type: "place" })).toBe("lugares");       // categoría 4
    expect(seccionDeEntrada({ type: "travel" })).toBe("lugares");      // categoría 4
    expect(seccionDeEntrada({ type: "movies" })).toBe("listas");       // categoría 6
    expect(seccionDeEntrada({ type: "books" })).toBe("listas");        // categoría 6
  });

  it("mapea 3 y 12 a CAJA FUERTE (no construida: se queda sin sección visible)", () => {
    expect(seccionDeEntrada({ type: "legal_doc" })).toBe("cajafuerte");
    expect(seccionDeEntrada({ type: "safe_box" })).toBe("cajafuerte");
  });

  it("no toca el campo type original: el mapeo solo lee, nunca escribe", () => {
    const entrada = { type: "photo", title: "original" };
    seccionDeEntrada(entrada);
    expect(entrada.type).toBe("photo");
  });

  it("lo que no mapea (categorías retiradas) devuelve null y no inventa sección", () => {
    expect(seccionDeEntrada({ type: "milestone" })).toBeNull();   // categoría 5 retirada
    expect(seccionDeEntrada({ type: "budget" })).toBeNull();      // categoría 10 retirada
    expect(seccionDeEntrada({})).toBeNull();
    expect(seccionDeEntrada(null)).toBeNull();
  });

  it("MODES conserva los 6 modos de ADR-021 para la cabecera de MEMORIA (X-5)", () => {
    expect(MODES.map((m) => m.id)).toEqual(["wall", "cinema", "map", "dialogue", "exhibition", "reel"]);
  });
});
