// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleTracks from "../tracks.js";
import handleDrops from "../drops.js";
import handleEvents from "../events.js";
import handleEntries from "../entries.js";

// Mock D1 mínimo: registra SQL, responde a SELECT de eras.
function makeDb({ eraExists = true, batchError = null, fileReservation = null } = {}) {
  const calls = [];
  const batches = [];
  let runCalls = 0;
  const statement = (sql) => {
    const s = {
      sql,
      async first() {
        if (sql.includes("FROM eras")) return eraExists ? { id: "era-1" } : null;
        if (sql.includes("FROM files")) return fileReservation;
        return null;
      },
      async run() {
        runCalls++;
        return { meta: { changes: 1 } };
      },
      async all() {
        return { results: [] };
      },
      bind(..._bindings) {
        calls.push({ sql, bindings: _bindings });
        return s;
      },
    };
    return s;
  };
  return {
    calls,
    batches,
    get runCalls() {
      return runCalls;
    },
    prepare(sql) {
      return statement(sql);
    },
    async batch(statements) {
      batches.push(statements.map((statement) => statement.sql));
      if (batchError) throw batchError;
      return statements.map(() => ({ meta: { changes: 1 } }));
    },
  };
}

function req(method, path, body) {
  return new Request(`https://bunker.test${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function json(response) {
  return response.json();
}

describe("R11 — validaciones POST (BUG-5)", () => {
  describe("POST /api/tracks", () => {
    it("rejects a missing title", async () => {
      const db = makeDb();
      const response = await handleTracks(req("POST", "/api/tracks", { artist: "X" }), { DB: db }, new URL("https://bunker.test/api/tracks"), "edu");
      expect(response.status).toBe(400);
      expect((await json(response)).error).toContain("title is required");
    });

    it("rejects a blank title", async () => {
      const db = makeDb();
      const response = await handleTracks(req("POST", "/api/tracks", { title: "   " }), { DB: db }, new URL("https://bunker.test/api/tracks"), "edu");
      expect(response.status).toBe(400);
    });

    it("rejects a title longer than 200 chars", async () => {
      const db = makeDb();
      const response = await handleTracks(req("POST", "/api/tracks", { title: "a".repeat(201) }), { DB: db }, new URL("https://bunker.test/api/tracks"), "edu");
      expect(response.status).toBe(400);
    });

    it("accepts a valid track and inserts", async () => {
      const db = makeDb();
      const response = await handleTracks(req("POST", "/api/tracks", { title: "  Mi tema  ", artist: "X" }), { DB: db }, new URL("https://bunker.test/api/tracks"), "edu");
      expect(response.status).toBe(201);
      const inserts = db.calls.filter(c => c.sql.includes("INSERT INTO tracks"));
      expect(inserts).toHaveLength(1);
      expect(inserts[0].bindings[2]).toBe("Mi tema"); // title recortado
      expect((await json(response)).title).toBe("Mi tema");
    });

    it("rejects an r2_key outside the music prefix", async () => {
      const db = makeDb();
      const response = await handleTracks(req("POST", "/api/tracks", { title: "X", r2_key: "vault/docs/private.pdf" }), { DB: db }, new URL("https://bunker.test/api/tracks"), "edu");
      expect(response.status).toBe(400);
      expect(db.calls.some((call) => call.sql.includes("INSERT INTO tracks"))).toBe(false);
    });

    it("rejects a music r2_key without an owned reservation", async () => {
      const db = makeDb({ fileReservation: null });
      const response = await handleTracks(req("POST", "/api/tracks", { id: "track-1", title: "X", r2_key: "music/unreserved.mp3" }), { DB: db }, new URL("https://bunker.test/api/tracks"), "edu");
      expect(response.status).toBe(403);
      expect(db.calls.some((call) => call.sql.includes("INSERT INTO tracks"))).toBe(false);
    });
  });

  describe("POST /api/drops", () => {
    it("rejects an invalid to_user", async () => {
      const db = makeDb();
      const response = await handleDrops(req("POST", "/api/drops", { to_user: "hacker" }), { DB: db }, new URL("https://bunker.test/api/drops"), "edu");
      expect(response.status).toBe(400);
      expect((await json(response)).error).toContain("Invalid to_user");
    });

    it("defaults to_user to self when omitted", async () => {
      const db = makeDb();
      const response = await handleDrops(req("POST", "/api/drops", {}), { DB: db }, new URL("https://bunker.test/api/drops"), "edu");
      expect(response.status).toBe(201);
      const insert = db.calls.find(c => c.sql.includes("INSERT INTO drops"));
      expect(insert.bindings[4]).toBe("edu");
    });

    it("accepts a known to_user", async () => {
      const db = makeDb();
      const response = await handleDrops(req("POST", "/api/drops", { to_user: "david" }), { DB: db }, new URL("https://bunker.test/api/drops"), "edu");
      expect(response.status).toBe(201);
    });
  });

  describe("POST /api/events", () => {
    it("rejects an unknown event_type", async () => {
      const db = makeDb();
      const response = await handleEvents(req("POST", "/api/events", { event_type: "totally_unknown" }), { DB: db }, new URL("https://bunker.test/api/events"), "edu");
      expect(response.status).toBe(400);
      expect((await json(response)).error).toContain("Invalid event_type");
    });

    it("accepts a known event_type", async () => {
      const db = makeDb();
      const response = await handleEvents(req("POST", "/api/events", { event_type: "track_play", payload: { title: "X" } }), { DB: db }, new URL("https://bunker.test/api/events"), "edu");
      expect(response.status).toBe(201);
    });

    it("rejects internal classification events from non-admin callers", async () => {
      const db = makeDb();
      const response = await handleEvents(req("POST", "/api/events", { event_type: "item_classified" }), { DB: db }, new URL("https://bunker.test/api/events"), "edu");
      expect(response.status).toBe(403);
      expect(db.calls).toHaveLength(0);
    });

    it("rejects internal classification events even from direct admin event callers", async () => {
      const db = makeDb();
      const response = await handleEvents(req("POST", "/api/events", { event_type: "item_unclassified" }), { DB: db }, new URL("https://bunker.test/api/events"), "admin");
      expect(response.status).toBe(403);
      expect(db.calls).toHaveLength(0);
    });

    it("rejects invalid JSON body", async () => {
      const db = makeDb();
      const response = await handleEvents(new Request("https://bunker.test/api/events", { method: "POST", body: "not-json" }), { DB: db }, new URL("https://bunker.test/api/events"), "edu");
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/entries", () => {
    it("defaults type to note when absent", async () => {
      const db = makeDb();
      const response = await handleEntries(req("POST", "/api/entries", { title: "Sin tipo" }), { DB: db }, new URL("https://bunker.test/api/entries"), "edu");
      expect(response.status).toBe(201);
      const insert = db.calls.find(c => c.sql.includes("INSERT INTO entries"));
      expect(insert.bindings[2]).toBe("note");
    });

    it("trims and caps type length", async () => {
      const db = makeDb();
      const response = await handleEntries(req("POST", "/api/entries", { type: "  photo  ", title: "X" }), { DB: db }, new URL("https://bunker.test/api/entries"), "edu");
      expect(response.status).toBe(201);
      const insert = db.calls.find(c => c.sql.includes("INSERT INTO entries"));
      expect(insert.bindings[2]).toBe("photo");
    });

    it("persists content and audit side effects in one atomic batch", async () => {
      const db = makeDb();
      const response = await handleEntries(req("POST", "/api/entries", {
        id: "entry-atomic",
        era_id: "era-1",
        type: "note",
        title: "Recuerdo persistente",
        content: { text: "Texto", event_date: "2026-08-04" },
        to_user: "david",
        tags: ["tag-a", "tag-b"],
        file_ids: ["file-a"],
      }), { DB: db }, new URL("https://bunker.test/api/entries"), "edu");

      expect(response.status).toBe(201);
      expect(await json(response)).toMatchObject({
        id: "entry-atomic",
        type: "note",
        from_user: "edu",
        to_user: "david",
        content: { text: "Texto", event_date: "2026-08-04" },
      });
      expect(db.batches).toHaveLength(1);
      expect(db.batches[0]).toHaveLength(5); // entry + 2 tags + file + event
      expect(db.batches[0][0]).toContain("INSERT INTO entries");
      expect(db.batches[0][1]).toContain("INSERT OR IGNORE INTO entry_tags");
      expect(db.batches[0][3]).toContain("UPDATE files SET entry_id");
      expect(db.batches[0][4]).toContain("INSERT INTO events");
      expect(db.calls.find((call) => call.sql.includes("INSERT INTO entries")).bindings).toEqual([
        "entry-atomic", "era-1", "note", "Recuerdo persistente",
        JSON.stringify({ text: "Texto", event_date: "2026-08-04" }),
        "edu", "david", expect.any(String),
      ]);
    });

    it("does not complete the request when the atomic batch fails", async () => {
      const db = makeDb({ batchError: new Error("FOREIGN KEY constraint failed") });
      await expect(handleEntries(req("POST", "/api/entries", {
        title: "No debe quedar a medias",
        tags: ["missing-tag"],
      }), { DB: db }, new URL("https://bunker.test/api/entries"), "edu")).rejects.toThrow("FOREIGN KEY constraint failed");
      expect(db.batches).toHaveLength(1);
      expect(db.runCalls).toBe(0);
    });

    it("returns the sanitized type used by persistence", async () => {
      const db = makeDb();
      const response = await handleEntries(req("POST", "/api/entries", { type: "  photo  ", title: "X" }), { DB: db }, new URL("https://bunker.test/api/entries"), "edu");
      expect(response.status).toBe(201);
      expect((await json(response)).type).toBe("photo");
    });

    it("rejects invalid JSON body", async () => {
      const db = makeDb();
      const response = await handleEntries(new Request("https://bunker.test/api/entries", { method: "POST", body: "nope" }), { DB: db }, new URL("https://bunker.test/api/entries"), "edu");
      expect(response.status).toBe(400);
    });
  });
});
