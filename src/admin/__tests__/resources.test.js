// @vitest-environment node
// B3 — contrato de los descriptores de CONTENIDO. No monta nada: valida la forma
// declarativa que consumen AdminShell/ResourceConsole (B1) y /api/classify (A1).
import { describe, expect, it } from "vitest";
import CONTENT_RESOURCES, { CONTENT_ITEM_TYPES } from "../resources";

const ITEM_TYPES = new Set(["entry", "file", "track", "playlist", "capsule", "drop"]);

const EXPECTED_ENDPOINTS = {
  entry: "/api/admin/entries",
  file: "/api/admin/files",
  track: "/api/admin/tracks",
  playlist: "/api/admin/playlists",
  capsule: "/api/admin/capsules",
  drop: "/api/admin/drops",
};

describe("B3 — descriptores de CONTENIDO", () => {
  it("1. son las 6 entidades y cada key coincide con un item_type de /api/classify", () => {
    expect(CONTENT_RESOURCES).toHaveLength(6);
    for (const resource of CONTENT_RESOURCES) {
      expect(ITEM_TYPES.has(resource.key), `key "${resource.key}" no es item_type válido`).toBe(true);
    }
    expect(new Set(CONTENT_ITEM_TYPES).size).toBe(6);
  });

  it("2. contrato del descriptor: endpoint admin (plural REST), columnas y campos coherentes", () => {
    for (const resource of CONTENT_RESOURCES) {
      expect(resource.label, resource.key).toBeTruthy();
      expect(resource.endpoint, resource.key).toBe(EXPECTED_ENDPOINTS[resource.key]);
      expect(resource.columns.length, `${resource.key} sin columnas`).toBeGreaterThan(0);
      for (const column of resource.columns) {
        expect(column.k, resource.key).toBeTruthy();
        expect(column.label, resource.key).toBeTruthy();
      }
      expect(resource.fields.length, `${resource.key} sin campos de formulario`).toBeGreaterThan(0);
      expect(resource.actions, resource.key).toEqual(
        expect.arrayContaining(["classify", "unclassify", "delete"])
      );
    }
  });

  it("3. el borrado exige teclear un campo real de la fila y deja snapshot", () => {
    for (const resource of CONTENT_RESOURCES) {
      const deleteSpec = resource.destructive?.delete;
      expect(deleteSpec, `${resource.key} sin destructive.delete`).toBeTruthy();
      expect(deleteSpec.confirmTyping, resource.key).toBeTruthy();
      expect(deleteSpec.snapshot, resource.key).toBe(true);
      const knownKeys = new Set([
        ...resource.columns.map((column) => column.k),
        ...resource.fields.map((field) => field.k),
      ]);
      expect(
        knownKeys.has(deleteSpec.confirmTyping),
        `${resource.key} confirmTyping "${deleteSpec.confirmTyping}" no es un campo conocido`
      ).toBe(true);
    }
  });

  it("4. marcado en lote: era en entry/file/track/drop; tag en entry/file/track; playlist y capsule sin lote", () => {
    const byEra = CONTENT_RESOURCES.filter((resource) => resource.batch?.byEra).map((resource) => resource.key).sort();
    const byTag = CONTENT_RESOURCES.filter((resource) => resource.batch?.byTag).map((resource) => resource.key).sort();
    const withoutBatch = CONTENT_RESOURCES.filter((resource) => !resource.batch).map((resource) => resource.key).sort();
    expect(byEra).toEqual(["drop", "entry", "file", "track"]);
    expect(byTag).toEqual(["entry", "file", "track"]);
    expect(withoutBatch).toEqual(["capsule", "playlist"]);
  });

  it("5. cero emoji", () => {
    for (const resource of CONTENT_RESOURCES) {
      expect(JSON.stringify(resource)).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
