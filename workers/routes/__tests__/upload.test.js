// @vitest-environment node
// Cobertura del hardening de uploads: reserva de track para música,
// límite de tamaño, Content-Length verificado y rollback de reservas.
import { describe, expect, it, vi } from "vitest";
import handleUpload from "../upload.js";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const BASE = "https://bunker.test";

function fakeRequest(method, path, { jsonBody = null, headers = {}, buffer = null } = {}) {
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    method,
    headers: { get: (name) => headerMap.get(name.toLowerCase()) ?? null },
    json: async () => jsonBody,
    arrayBuffer: async () => buffer,
  };
}

function makeDb({ track = null, reservation = null } = {}) {
  const calls = [];
  const statement = (sql) => {
    const current = {
      sql,
      bind(...bindings) {
        calls.push({ sql, bindings });
        return current;
      },
      async first() {
        if (sql.includes("FROM tracks WHERE")) return track;
        if (sql.includes("FROM files WHERE")) return reservation;
        return null;
      },
      async run() {
        return { meta: { changes: 1 } };
      },
    };
    return current;
  };
  return { calls, prepare: statement };
}

function makeEnv(db) {
  return {
    DB: db,
    BUNKER: {
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    },
  };
}

const musicPost = (extra = {}, dbOpts = {}) => {
  const db = makeDb(dbOpts);
  const request = fakeRequest("POST", "/api/upload", {
    jsonBody: { prefix: "music", filename: "song.mp3", size_bytes: 1024, ...extra },
  });
  return { db, promise: handleUpload(request, makeEnv(db), new URL(`${BASE}/api/upload`), "edu") };
};

describe("upload route — reservations and limits", () => {
  it("requires authentication", async () => {
    const response = await handleUpload(
      fakeRequest("POST", "/api/upload", { jsonBody: { prefix: "music", filename: "a.mp3" } }),
      makeEnv(makeDb()),
      new URL(`${BASE}/api/upload`),
      null,
    );
    expect(response.status).toBe(401);
  });

  it("returns 405 for unsupported methods", async () => {
    const response = await handleUpload(
      fakeRequest("PATCH", "/api/upload"),
      makeEnv(makeDb()),
      new URL(`${BASE}/api/upload`),
      "edu",
    );
    expect(response.status).toBe(405);
  });

  it("creates a music reservation with an existing track and sanitizes the filename", async () => {
    const { db, promise } = musicPost(
      { track_id: "track-1", filename: "My Song (1).mp3" },
      { track: { id: "track-1", added_by: "edu" } },
    );
    const response = await promise;
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.file_id).toBeTruthy();
    expect(body.r2_key).toMatch(/^music\/[0-9a-f-]{36}_My_Song__1_\.mp3$/);
    expect(db.calls.some(({ sql }) => sql.includes("INSERT INTO files"))).toBe(true);
  });

  it("rejects music uploads without a track reservation", async () => {
    const { promise } = musicPost();
    const response = await promise;
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("track reservation") });
  });

  it("rejects invalid prefixes", async () => {
    const { promise } = musicPost({ prefix: "evil", track_id: "track-1" });
    expect((await promise).status).toBe(400);
  });

  it("rejects oversized declared size", async () => {
    const { promise } = musicPost({ track_id: "track-1", size_bytes: MAX_UPLOAD_BYTES + 1 });
    expect((await promise).status).toBe(413);
  });

  it("rejects non-integer and negative declared sizes", async () => {
    for (const size_bytes of [1.5, -1]) {
      const { promise } = musicPost({ track_id: "track-1", size_bytes });
      expect((await promise).status, `size_bytes=${size_bytes}`).toBe(413);
    }
  });

  it("rejects uploads for a track that does not exist or belongs to another user", async () => {
    const missing = musicPost({ track_id: "track-1" });
    expect((await missing.promise).status).toBe(403);

    const foreign = musicPost({ track_id: "track-1" }, { track: { id: "track-1", added_by: "david" } });
    expect((await foreign.promise).status).toBe(403);
  });
});

describe("upload route — binary PUT", () => {
  const put = (r2Key, headers, buffer, reservation = { id: "file-1" }) => {
    const db = makeDb({ reservation });
    const request = fakeRequest("PUT", `/api/upload/${r2Key}`, { headers, buffer });
    return { db, promise: handleUpload(request, makeEnv(db), new URL(`${BASE}/api/upload/${r2Key}`), "edu") };
  };

  it("rejects uploads without a reservation", async () => {
    const { promise } = put("music/k.mp3", { "Content-Length": "3" }, new ArrayBuffer(3), null);
    expect((await promise).status).toBe(404);
  });

  it("rejects uploads for keys outside valid prefixes", async () => {
    const { promise } = put("evil/k.mp3", { "Content-Length": "3" }, new ArrayBuffer(3));
    expect((await promise).status).toBe(403);
  });

  it("rejects uploads without Content-Length", async () => {
    const { promise } = put("music/k.mp3", {}, new ArrayBuffer(3));
    expect((await promise).status).toBe(413);
  });

  it("rejects oversized Content-Length", async () => {
    const { promise } = put("music/k.mp3", { "Content-Length": String(MAX_UPLOAD_BYTES + 1) }, new ArrayBuffer(0));
    expect((await promise).status).toBe(413);
  });

  it("rejects when the body does not match Content-Length", async () => {
    const { promise } = put("music/k.mp3", { "Content-Length": "5" }, new ArrayBuffer(3));
    expect((await promise).status).toBe(400);
  });

  it("stores the binary with its content type when lengths match", async () => {
    const db = makeDb({ reservation: { id: "file-1" } });
    const env = makeEnv(db);
    const buffer = new ArrayBuffer(3);
    const request = fakeRequest("PUT", "/api/upload/music/k.mp3", {
      headers: { "Content-Length": "3", "Content-Type": "audio/mpeg" },
      buffer,
    });
    const response = await handleUpload(request, env, new URL(`${BASE}/api/upload/music/k.mp3`), "edu");
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ ok: true, size: 3 });
    expect(env.BUNKER.put).toHaveBeenCalledWith(
      "music/k.mp3",
      buffer,
      { httpMetadata: { contentType: "audio/mpeg" } },
    );
  });
});

describe("upload route — rollback DELETE", () => {
  it("rejects rollback outside valid prefixes", async () => {
    const response = await handleUpload(
      fakeRequest("DELETE", "/api/upload/evil/k.mp3"),
      makeEnv(makeDb()),
      new URL(`${BASE}/api/upload/evil/k.mp3`),
      "edu",
    );
    expect(response.status).toBe(403);
  });

  it("rejects rollback of a reservation that does not exist", async () => {
    const response = await handleUpload(
      fakeRequest("DELETE", "/api/upload/music/k.mp3"),
      makeEnv(makeDb({ reservation: null })),
      new URL(`${BASE}/api/upload/music/k.mp3`),
      "edu",
    );
    expect(response.status).toBe(404);
  });

  it("removes the R2 object and the files row on rollback", async () => {
    const db = makeDb({ reservation: { id: "file-1" } });
    const env = makeEnv(db);
    const response = await handleUpload(
      fakeRequest("DELETE", "/api/upload/music/k.mp3"),
      env,
      new URL(`${BASE}/api/upload/music/k.mp3?file_id=file-1`),
      "edu",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, file_id: "file-1" });
    expect(env.BUNKER.delete).toHaveBeenCalledWith("music/k.mp3");
    expect(db.calls.some(({ sql }) => sql.includes("DELETE FROM files"))).toBe(true);
  });
});
