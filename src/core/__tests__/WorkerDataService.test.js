// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { buildDbFromWorker, safeParse } from "../WorkerDataService.js";

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
  "/api/config": { adventures_start_date: "2026-01-01T00:00:00.000Z" },
};

describe("WorkerDataService", () => {
  it("returns null without a Worker token and performs no reads", async () => {
    const worker = makeWorker(baseResponses, { hasToken: false });
    await expect(buildDbFromWorker(worker, "fallback")).resolves.toBeNull();
    expect(worker.get).not.toHaveBeenCalled();
  });

  it("loads all collections and preserves frontend compatibility mappings", async () => {
    const worker = makeWorker(baseResponses);
    const db = await buildDbFromWorker(worker, "fallback");

    expect(db).toMatchObject({
      eras: [{ id: "era-1" }],
      files: [{ id: "file-1" }],
      adventures_start_date: "2026-01-01T00:00:00.000Z",
    });
    expect(db.entries[0]).toMatchObject({
      content: { title: "Hola" },
      from: "edu",
      to: "david",
    });
    expect(db.music_lab.drops[0]).toMatchObject({ from: "edu", to: "david" });
    expect(worker.get).toHaveBeenCalledTimes(8);
  });

  it("uses the fallback adventure date when config is unavailable", async () => {
    const worker = makeWorker({ ...baseResponses, "/api/config": new Error("offline") });
    const db = await buildDbFromWorker(worker, "fallback-date");
    expect(db.adventures_start_date).toBe("fallback-date");
  });

  it("keeps malformed JSON content as the original string", () => {
    expect(safeParse("{bad-json")).toBe("{bad-json");
    expect(safeParse({ already: "parsed" })).toEqual({ already: "parsed" });
  });

  it("returns null when a required collection read fails", async () => {
    const worker = makeWorker({ ...baseResponses, "/api/tracks": new Error("401") });
    await expect(buildDbFromWorker(worker, "fallback")).resolves.toBeNull();
  });
});
