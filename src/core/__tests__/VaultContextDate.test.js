// @vitest-environment node
// ============================================================
//  VaultContextDate.test.js — hallazgo V-6
//  adventures_start_date es dato de usuario: el cliente NO lo fabrica.
//  Si D1 no trae el campo, el estado queda sin fecha (ausente/null).
//  Cadena real: VaultContext.jsx llama buildDbFromWorker(workerClient)
//  SIN fallback (V-6) -> WorkerDataService decide el campo desde /api/config.
// ============================================================
import { describe, expect, it, vi } from "vitest";
import { buildDbFromWorker } from "../WorkerDataService.js";

const makeWorker = (responses, { hasToken = true } = {}) => ({
  hasToken: () => hasToken,
  get: vi.fn(async (path) => {
    if (responses[path] instanceof Error) throw responses[path];
    return responses[path];
  }),
});

const baseResponses = {
  "/api/entries": [{ id: "entry-1", content: '{"title":"Hola"}', from_user: "edu", to_user: "david" }],
  "/api/eras": [{ id: "era-1" }],
  "/api/tracks": [{ id: "track-1" }],
  "/api/tags": [{ id: "tag-1" }],
  "/api/playlists": [{ id: "playlist-1" }],
  "/api/drops": [{ id: "drop-1", from_user: "edu", to_user: "david" }],
  "/api/files": [{ id: "file-1" }],
};

describe("V-6 — adventures_start_date no se fabrica en el estado", () => {
  it("sin adventures_start_date en D1: el estado queda sin fecha (ausente, no inventada)", async () => {
    // /api/config responde SIN adventures_start_date
    const worker = makeWorker({ ...baseResponses, "/api/config": {} });
    // Misma invocacion que VaultContext._buildDbFromWorker tras V-6: sin fallback.
    const db = await buildDbFromWorker(worker);

    expect(db.adventures_start_date).toBeUndefined();
    // Ninguna fecha fabricada: ni hoy, ni hace 500 dias, ni cualquier ISO.
    expect(db.adventures_start_date).toBeFalsy();
  });

  it("cuando D1 SI trae adventures_start_date: se conserva tal cual", async () => {
    const realDate = "2021-06-15T00:00:00.000Z";
    const worker = makeWorker({ ...baseResponses, "/api/config": { adventures_start_date: realDate } });
    const db = await buildDbFromWorker(worker);

    expect(db.adventures_start_date).toBe(realDate);
  });

  it("sin heartbeat en D1: no fabrica un timestamp de actividad", async () => {
    const worker = makeWorker({ ...baseResponses, "/api/config": {} });
    const db = await buildDbFromWorker(worker);

    expect(db.heartbeat).toBeNull();
  });

  it("cuando D1 trae heartbeat: se conserva tal cual", async () => {
    const realHeartbeat = "2026-08-24T20:00:00.000Z";
    const worker = makeWorker({ ...baseResponses, "/api/config": { heartbeat: realHeartbeat } });
    const db = await buildDbFromWorker(worker);

    expect(db.heartbeat).toBe(realHeartbeat);
  });

  it("si /api/config falla y no hay fallback: el estado queda sin fecha", async () => {
    const worker = makeWorker({ ...baseResponses, "/api/config": new Error("offline") });
    const db = await buildDbFromWorker(worker);

    expect(db.adventures_start_date).toBeUndefined();
  });
});
