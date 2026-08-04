// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleCapsules from "../capsules.js";

function request(method, path, body) {
  return new Request(`https://bunker.test${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function readJson(response) {
  return response.json();
}

function makePostDb() {
  const calls = [];
  const statements = [];
  const db = {
    calls,
    statements,
    prepare(sql) {
      const statement = {
        sql,
        bindings: [],
        bind(...bindings) {
          this.bindings = bindings;
          calls.push({ sql, bindings });
          return this;
        },
        async all() {
          if (sql.includes("FROM entries")) return { results: [{ id: "entry-1" }] };
          if (sql.includes("FROM playlists p")) {
            return {
              results: [
                { id: "pl-1", track_id: "track-a" },
                { id: "pl-1", track_id: "track-b" },
              ],
            };
          }
          return { results: [] };
        },
        async run() {
          return { meta: { changes: 1 } };
        },
      };
      statements.push(statement);
      return statement;
    },
    async batch(batchStatements) {
      for (const statement of batchStatements) {
        statements.push(statement);
        calls.push({ sql: statement.sql, bindings: statement.bindings });
      }
      return { success: true };
    },
  };
  return db;
}

describe("Time Capsules", () => {
  it("persists selected entries and a D1-derived playlist track snapshot", async () => {
    const db = makePostDb();
    const response = await handleCapsules(
      request("POST", "/api/time_capsules", {
        title: "Nuestro aniversario",
        unlock_at: "2030-06-15T00:00:00.000Z",
        entry_ids: ["entry-1"],
        playlist_ids: ["pl-1"],
        // The server must not trust this client-provided snapshot.
        content_snapshot: JSON.stringify({ playlist_snapshots: [{ playlist_id: "pl-1", snapshot_track_ids: ["fake"] }] }),
      }),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "edu",
    );

    expect(response.status).toBe(201);
    const body = await readJson(response);
    expect(body.content_counts).toEqual({ entries: 1, playlists: 1 });
    expect(body.entry_ids).toEqual([]);
    expect(body.playlist_snapshots).toEqual([]);
    expect(JSON.parse(body.content_snapshot)).toEqual({ counts: { entries: 1, playlists: 1 } });

    const capsuleEvent = db.calls.find((call) => call.sql.includes("INSERT INTO events"));
    expect(capsuleEvent).toBeDefined();
    expect(JSON.parse(capsuleEvent.bindings[3])).toEqual({
      title: "Nuestro aniversario",
      content_counts: { entries: 1, playlists: 1 },
    });

    const playlistInsert = db.calls.find((call) => call.sql.includes("INSERT INTO capsule_items") && call.sql.includes("playlist_ref"));
    expect(playlistInsert).toBeDefined();
    expect(JSON.parse(playlistInsert.bindings[2])).toEqual({
      playlist_id: "pl-1",
      snapshot_track_ids: ["track-a", "track-b"],
    });
  });

  it("rejects a selected playlist that does not exist", async () => {
    const db = makePostDb();
    db.prepare = (sql) => {
      const statement = {
        sql,
        bindings: [],
        bind(...bindings) {
          this.bindings = bindings;
          db.calls.push({ sql, bindings });
          return this;
        },
        async all() {
          if (sql.includes("FROM entries")) return { results: [{ id: "entry-1" }] };
          if (sql.includes("FROM playlists p")) return { results: [] };
          return { results: [] };
        },
        async run() { return { meta: { changes: 1 } }; },
      };
      return statement;
    };

    const response = await handleCapsules(
      request("POST", "/api/time_capsules", {
        title: "Cápsula inválida",
        unlock_at: "2030-06-15T00:00:00.000Z",
        playlist_ids: ["missing-playlist"],
      }),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "edu",
    );

    expect(response.status).toBe(400);
    expect((await readJson(response)).error).toContain("playlists not found");
    expect(db.calls.some((call) => call.sql?.includes("INSERT INTO time_capsules"))).toBe(false);
  });

  it("rejects a selected entry that does not exist or is deleted", async () => {
    const db = makePostDb();
    db.prepare = (sql) => {
      const statement = {
        sql,
        bindings: [],
        bind(...bindings) {
          this.bindings = bindings;
          db.calls.push({ sql, bindings });
          return this;
        },
        async all() {
          if (sql.includes("FROM entries")) return { results: [] };
          return { results: [] };
        },
        async run() { return { meta: { changes: 1 } }; },
      };
      return statement;
    };

    const response = await handleCapsules(
      request("POST", "/api/time_capsules", {
        title: "Entrada inválida",
        unlock_at: "2030-06-15T00:00:00.000Z",
        entry_ids: ["deleted-entry"],
      }),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "edu",
    );

    expect(response.status).toBe(400);
    expect((await readJson(response)).error).toContain("entries not found");
    expect(db.calls.some((call) => call.sql?.includes("INSERT INTO time_capsules"))).toBe(false);
  });

  it("rejects an invalid unlock date", async () => {
    const db = makePostDb();
    const response = await handleCapsules(
      request("POST", "/api/time_capsules", { title: "Fecha rota", unlock_at: "not-a-date" }),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "edu",
    );

    expect(response.status).toBe(400);
    expect((await readJson(response)).error).toBe("unlock_at must be a valid date");
  });

  it("rejects unlocking a capsule before its unlock date", async () => {
    const db = {
      prepare(_sql) {
        return {
          bind() { return this; },
          async first() { return { id: "capsule-1", unlock_at: "2030-06-15T00:00:00.000Z", is_unlocked: 0 }; },
          async run() { throw new Error("must not write"); },
        };
      },
    };

    const response = await handleCapsules(
      request("PATCH", "/api/time_capsules/capsule-1", { is_unlocked: true }),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules/capsule-1"),
      "edu",
    );

    expect(response.status).toBe(409);
    expect((await readJson(response)).error).toBe("Capsule is still sealed");
  });

  it("unlocks a capsule after its unlock date and emits the event", async () => {
    const calls = [];
    const db = {
      prepare(sql) {
        const statement = {
          bind(...bindings) {
            calls.push({ sql, bindings });
            return this;
          },
          async first() {
            return { id: "capsule-1", unlock_at: "2020-06-15T00:00:00.000Z", is_unlocked: 0 };
          },
          async run() {
            return { meta: { changes: 1 } };
          },
        };
        return statement;
      },
    };

    const response = await handleCapsules(
      request("PATCH", "/api/time_capsules/capsule-1", { is_unlocked: true }),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules/capsule-1"),
      "edu",
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true, id: "capsule-1" });
    expect(calls.some((call) => call.sql.includes("UPDATE time_capsules SET is_unlocked"))).toBe(true);
    const event = calls.find((call) => call.sql.includes("INSERT INTO events"));
    expect(event).toBeDefined();
    expect(event.bindings[0]).toBe("capsule_unlocked");
  });

  it("persists a due unlock on GET and emits one shared event", async () => {
    const calls = [];
    const db = {
      prepare(sql) {
        const statement = {
          bind(...bindings) {
            calls.push({ sql, bindings });
            return this;
          },
          async all() {
            if (sql.includes("SELECT * FROM time_capsules")) {
              return { results: [{ id: "capsule-due", title: "Ya toca", unlock_at: "2020-06-15T00:00:00.000Z", created_by: "edu", is_unlocked: 0 }] };
            }
            return { results: [] };
          },
          async run() {
            return { meta: { changes: 1 } };
          },
        };
        return statement;
      },
      async batch() {
        return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }];
      },
    };

    const response = await handleCapsules(
      request("GET", "/api/time_capsules"),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "david",
    );

    expect(response.status).toBe(200);
    const [capsule] = await readJson(response);
    expect(capsule.is_unlocked).toBe(true);
    expect(calls.some((call) => call.sql.includes("UPDATE time_capsules SET is_unlocked"))).toBe(true);
    const event = calls.find((call) => call.sql.includes("INSERT INTO events"));
    expect(event).toBeDefined();
    expect(event.bindings[0]).toBe("capsule_unlocked");
    expect(event.bindings[1]).toBe("david");
  });

  it("does not emit a second event when a due unlock loses the compare-and-set", async () => {
    const batches = [];
    const db = {
      prepare(sql) {
        const statement = {
          sql,
          bind() { return this; },
          async all() {
            if (sql.includes("SELECT * FROM time_capsules")) {
              return { results: [{ id: "capsule-race", title: "Carrera", unlock_at: "2020-06-15T00:00:00.000Z", created_by: "edu", is_unlocked: 0 }] };
            }
            return { results: [] };
          },
        };
        return statement;
      },
      async batch(statements) {
        batches.push(statements);
        return [{ meta: { changes: 0 } }, { meta: { changes: 0 } }];
      },
    };

    const response = await handleCapsules(
      request("GET", "/api/time_capsules"),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "edu",
    );

    expect(response.status).toBe(200);
    expect(batches).toHaveLength(1);
    expect(batches[0][1].sql).toContain("INSERT INTO events");
    expect(batches[0][1].sql).toContain("NOT EXISTS");
  });

  it("is idempotent when unlocking an already unlocked capsule", async () => {
    const calls = [];
    const db = {
      prepare(sql) {
        return {
          bind(...bindings) {
            calls.push({ sql, bindings });
            return this;
          },
          async first() {
            return { id: "capsule-1", unlock_at: "2020-06-15T00:00:00.000Z", is_unlocked: 1 };
          },
        };
      },
    };

    const response = await handleCapsules(
      request("PATCH", "/api/time_capsules/capsule-1", { is_unlocked: true }),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules/capsule-1"),
      "edu",
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true, id: "capsule-1" });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("SELECT id, unlock_at, is_unlocked");
  });

  it("reconstructs playlist snapshots from capsule items on GET", async () => {
    const db = {
      prepare(sql) {
        return {
          bind() { return this; },
          async all() {
            if (sql.includes("SELECT * FROM time_capsules")) {
              return { results: [{ id: "capsule-1", title: "Después", is_unlocked: 1 }] };
            }
            return {
              results: [{
                id: "item-1",
                capsule_id: "capsule-1",
                type: "playlist_ref",
                content: JSON.stringify({ playlist_id: "pl-1", snapshot_track_ids: ["track-a", "track-b"] }),
                sort_order: 0,
                created_by: "edu",
                created_at: "2030-01-01T00:00:00.000Z",
              }],
            };
          },
        };
      },
    };

    const response = await handleCapsules(
      request("GET", "/api/time_capsules"),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "edu",
    );

    expect(response.status).toBe(200);
    const [capsule] = await readJson(response);
    expect(capsule.playlist_ids).toEqual(["pl-1"]);
    expect(capsule.playlist_snapshots).toEqual([
      { playlist_id: "pl-1", snapshot_track_ids: ["track-a", "track-b"] },
    ]);
    expect(capsule.capsule_items[0].content.snapshot_track_ids).toEqual(["track-a", "track-b"]);
  });

  it("hides capsule references while the capsule is still sealed", async () => {
    const db = {
      prepare(sql) {
        return {
          bind() { return this; },
          async all() {
            if (sql.includes("SELECT * FROM time_capsules")) {
              return { results: [{ id: "capsule-locked", title: "Secreto", unlock_at: "2030-06-15T00:00:00.000Z", is_unlocked: 0 }] };
            }
            return {
              results: [{
                id: "item-locked",
                capsule_id: "capsule-locked",
                type: "playlist_ref",
                content: JSON.stringify({ playlist_id: "private-playlist", snapshot_track_ids: ["private-track"] }),
                sort_order: 0,
                created_by: "edu",
                created_at: "2030-01-01T00:00:00.000Z",
              }],
            };
          },
        };
      },
    };

    const response = await handleCapsules(
      request("GET", "/api/time_capsules"),
      { DB: db },
      new URL("https://bunker.test/api/time_capsules"),
      "edu",
    );

    expect(response.status).toBe(200);
    const [capsule] = await readJson(response);
    expect(capsule.content_counts).toEqual({ entries: 0, playlists: 1 });
    expect(capsule.entry_ids).toEqual([]);
    expect(capsule.playlist_ids).toEqual([]);
    expect(capsule.playlist_snapshots).toEqual([]);
    expect(capsule.capsule_items).toEqual([]);
    expect(JSON.parse(capsule.content_snapshot)).toEqual({ counts: { entries: 0, playlists: 1 } });
  });
});
