// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleUpload from "../upload.js";
import handleR2 from "../r2.js";

function request(method, path, body, headers = {}) {
  return new Request(`https://bunker.test${path}`, {
    method,
    headers: body instanceof ArrayBuffer || body instanceof Uint8Array
      ? headers
      : { "Content-Type": "application/json", ...headers },
    body: body === undefined
      ? undefined
      : body instanceof ArrayBuffer || body instanceof Uint8Array
        ? body
        : JSON.stringify(body),
  });
}

function makeUploadDb({ reservation = null, track = { id: "track-1", added_by: "edu" } } = {}) {
  const calls = [];
  const statement = (sql) => {
    let bindings = [];
    const stmt = {
      async first() {
        if (sql.includes("FROM tracks")) return track;
        if (!sql.includes("SELECT id FROM files")) return null;
        if (!reservation) return null;
        return !reservation.uploaded_by || reservation.uploaded_by === bindings[1]
          ? { id: reservation.id }
          : null;
      },
      async run() {
        return { meta: { changes: 1 } };
      },
      bind(...nextBindings) {
        bindings = nextBindings;
        calls.push({ sql, bindings: nextBindings });
        return stmt;
      },
    };
    return stmt;
  };
  return {
    calls,
    prepare(sql) {
      return statement(sql);
    },
  };
}

describe("F2-B — upload y streaming MP3", () => {
  it("rejects an unsupported upload prefix", async () => {
    const DB = makeUploadDb();
    const response = await handleUpload(
      request("POST", "/api/upload", { prefix: "private", filename: "song.mp3" }),
      { DB },
      new URL("https://bunker.test/api/upload"),
      "edu",
    );

    expect(response.status).toBe(400);
    expect(DB.calls).toHaveLength(0);
  });

  it("sanitizes the filename and creates a music reservation", async () => {
    const DB = makeUploadDb();
    const response = await handleUpload(
      request("POST", "/api/upload", {
        prefix: "music",
        filename: "../Mi canción final?.mp3",
        mime_type: "audio/mpeg",
        size_bytes: 1234,
        track_id: "track-1",
      }),
      { DB },
      new URL("https://bunker.test/api/upload"),
      "edu",
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.r2_key).toMatch(/^music\/[0-9a-f-]+_\._Mi_canci_n_final_.mp3$/);
    expect(body.file_id).toEqual(expect.any(String));
    const insert = DB.calls.find((call) => call.sql.includes("INSERT INTO files"));
    expect(insert.bindings.slice(1, 3)).toEqual([null, "track-1"]);
    expect(insert.bindings[5]).toBe("._Mi_canci_n_final_.mp3");
  });

  it("rejects a track reservation owned by another user", async () => {
    const DB = makeUploadDb({ track: { id: "track-1", added_by: "edu" } });
    const response = await handleUpload(
      request("POST", "/api/upload", { prefix: "music", filename: "song.mp3", track_id: "track-1" }),
      { DB },
      new URL("https://bunker.test/api/upload"),
      "david",
    );
    expect(response.status).toBe(403);

  });

  it("does not allow a user to overwrite another user's reservation", async () => {
    const DB = makeUploadDb({ reservation: { id: "file-owned-by-edu", uploaded_by: "edu" } });
    const BUNKER = { put: async () => { throw new Error("must not put"); } };
    const response = await handleUpload(
      request("PUT", "/api/upload/music/foreign.mp3", new Uint8Array([1, 2, 3]), { "Content-Type": "audio/mpeg" }),
      { DB, BUNKER },
      new URL("https://bunker.test/api/upload/music/foreign.mp3"),
      "david",
    );

    expect(response.status).toBe(404);
  });

  it("uploads binary content only for the owner's reservation", async () => {
    const DB = makeUploadDb({ reservation: { id: "file-1" } });
    const puts = [];
    const BUNKER = { put: async (...args) => puts.push(args) };
    const response = await handleUpload(
      request("PUT", "/api/upload/music/song.mp3", new Uint8Array([1, 2, 3]), { "Content-Type": "audio/mpeg", "Content-Length": "3" }),
      { DB, BUNKER },
      new URL("https://bunker.test/api/upload/music/song.mp3"),
      "edu",
    );

    expect(response.status).toBe(201);
    expect(puts).toHaveLength(1);
    expect(puts[0][0]).toBe("music/song.mp3");
    expect(new Uint8Array(puts[0][1])).toEqual(new Uint8Array([1, 2, 3]));
    expect(puts[0][2].httpMetadata.contentType).toBe("audio/mpeg");
  });

  it("serves a valid MP3 range with 206 headers", async () => {
    const requested = [];
    const BUNKER = {
      head: async () => ({ size: 10, httpMetadata: { contentType: "audio/mpeg" } }),
      get: async (...args) => {
        requested.push(args);
        return {
          body: new Response("234").body,
          httpMetadata: { contentType: "audio/mpeg" },
        };
      },
    };
    const response = await handleR2(
      request("GET", "/music/song.mp3", undefined, { Range: "bytes=2-4" }),
      { BUNKER },
      "/music/song.mp3",
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(response.headers.get("Content-Length")).toBe("3");
    expect(response.headers.get("Content-Range")).toBe("bytes 2-4/10");
    expect(requested[0][1]).toEqual({ range: { offset: 2, length: 3 } });
  });
});
