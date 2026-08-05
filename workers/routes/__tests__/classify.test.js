// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleClassify from "../classify.js";

function request(method, path = "/api/classify", body) {
  return new Request(`https://bunker.test${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function makeDb({ selectionRows = [], calls = [], batches = [] } = {}) {
  return {
    calls,
    batches,
    prepare(sql) {
      calls.push(sql);
      const statement = {
        sql,
        bindings: [],
        bind(...values) {
          statement.bindings = values;
          return statement;
        },
        async all() {
          return { results: selectionRows };
        },
      };
      return statement;
    },
    async batch(statements) {
      batches.push(statements);
    },
  };
}

function routeUrl(path = "/api/classify") {
  return new URL(`https://bunker.test${path}`);
}

async function body(response) {
  return response.json();
}

describe("/api/classify authorization", () => {
  it("rejects a missing identity before parsing or querying D1", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("POST", "/api/classify", { item_type: "entry", item_id: "entry-1" }),
      { DB: db },
      routeUrl(),
      null,
    );

    expect(response.status).toBe(401);
    expect(db.calls).toEqual([]);
    expect(db.batches).toEqual([]);
  });

  it("rejects a non-admin before querying D1", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("POST", "/api/classify", { item_type: "entry", item_id: "entry-1" }),
      { DB: db },
      routeUrl(),
      "edu",
    );

    expect(response.status).toBe(403);
    expect(await body(response)).toEqual({ error: "Forbidden — only admin can classify items" });
    expect(db.calls).toEqual([]);
    expect(db.batches).toEqual([]);
  });
});

describe("individual classification", () => {
  it("classifies one item atomically with an audit event", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("POST", "/api/classify", { item_type: "entry", item_id: "entry-1" }),
      { DB: db },
      routeUrl(),
      "admin",
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({
      ok: true,
      action: "classify",
      item_type: "entry",
      item_ids: ["entry-1"],
      count: 1,
    });
    expect(db.batches).toHaveLength(1);
    expect(db.batches[0]).toHaveLength(2);
    expect(db.batches[0][0].sql).toContain("INSERT OR IGNORE INTO classified_items");
    expect(db.batches[0][0].bindings).toEqual(["entry", "entry-1", "admin", expect.any(Number)]);
    expect(db.batches[0][1].sql).toContain("INSERT INTO events");
    expect(db.batches[0][1].bindings.slice(0, 4)).toEqual(["item_classified", "admin", "entry", "entry-1"]);
  });

  it("unclassifies one item and emits the corresponding event", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("DELETE", "/api/classify/track/track-1"),
      { DB: db },
      routeUrl("/api/classify/track/track-1"),
      "admin",
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({
      ok: true,
      action: "unclassify",
      item_type: "track",
      item_ids: ["track-1"],
      count: 1,
    });
    expect(db.batches[0][0].sql).toContain("DELETE FROM classified_items");
    expect(db.batches[0][1].bindings.slice(0, 4)).toEqual(["item_unclassified", "admin", "track", "track-1"]);
  });
});

describe("batch classification", () => {
  it("classifies an explicit selection and removes duplicate IDs", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("POST", "/api/classify", {
        item_type: "file",
        item_ids: ["file-1", "file-1", "file-2"],
      }),
      { DB: db },
      routeUrl(),
      "admin",
    );

    expect(response.status).toBe(200);
    expect((await body(response)).item_ids).toEqual(["file-1", "file-2"]);
    expect(db.batches[0]).toHaveLength(4);
  });

  it("resolves an era selector for entries", async () => {
    const db = makeDb({ selectionRows: [{ id: "entry-1" }, { id: "entry-2" }] });
    const response = await handleClassify(
      request("POST", "/api/classify", { item_type: "entry", era_id: "era-1" }),
      { DB: db },
      routeUrl(),
      "admin",
    );

    expect(response.status).toBe(200);
    expect((await body(response)).item_ids).toEqual(["entry-1", "entry-2"]);
    expect(db.calls[0]).toContain("FROM entries WHERE era_id = ?1");
    expect(db.calls[0]).toContain("is_deleted = 0");
    expect(db.batches[0]).toHaveLength(4);
  });

  it("resolves a tag selector for tracks", async () => {
    const db = makeDb({ selectionRows: [{ id: "track-1" }] });
    const response = await handleClassify(
      request("DELETE", "/api/classify", { item_type: "track", tag_id: "tag-1" }),
      { DB: db },
      routeUrl(),
      "admin",
    );

    expect(response.status).toBe(200);
    expect((await body(response)).item_ids).toEqual(["track-1"]);
    expect(db.calls[0]).toContain("FROM track_tags");
    expect(db.batches[0][0].sql).toContain("DELETE FROM classified_items");
  });
});

describe("classification validation", () => {
  it("rejects malformed JSON, unsupported methods, and invalid paths", async () => {
    const db = makeDb();
    const malformed = await handleClassify(
      new Request("https://bunker.test/api/classify", { method: "POST", body: "{" }),
      { DB: db }, routeUrl(), "admin",
    );
    expect(malformed.status).toBe(400);

    const wrongMethod = await handleClassify(
      request("PATCH", "/api/classify", { item_type: "entry", item_id: "entry-1" }),
      { DB: db }, routeUrl(), "admin",
    );
    expect(wrongMethod.status).toBe(404);

    const wrongPath = await handleClassify(
      request("POST", "/api/classify/not-a-valid-path", { item_type: "entry", item_id: "entry-1" }),
      { DB: db }, routeUrl("/api/classify/not-a-valid-path"), "admin",
    );
    expect(wrongPath.status).toBe(404);
  });

  it("rejects a path/body item type mismatch", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("POST", "/api/classify/entry/entry-1", { item_type: "track" }),
      { DB: db }, routeUrl("/api/classify/entry/entry-1"), "admin",
    );
    expect(response.status).toBe(400);
    expect(db.calls).toEqual([]);
  });

  it("requires one supported item type and exactly one selector", async () => {
    const cases = [
      { item_type: "unknown", item_id: "x" },
      { item_type: "entry" },
      { item_type: "entry", item_id: "x", era_id: "era-1" },
      { item_type: "playlist", era_id: "era-1" },
      { item_type: "entry", item_ids: [] },
    ];

    for (const payload of cases) {
      const db = makeDb();
      const response = await handleClassify(request("POST", "/api/classify", payload), { DB: db }, routeUrl(), "admin");
      expect(response.status).toBe(400);
      expect(db.calls).toEqual([]);
      expect(db.batches).toEqual([]);
    }
  });

  it("does not silently truncate an oversized explicit selection", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("POST", "/api/classify", { item_type: "entry",      item_ids: Array.from({ length: 51 }, (_, i) => `entry-${i}`) }),
      { DB: db },
      routeUrl(),
      "admin",
    );

    expect(response.status).toBe(400);
    expect(db.calls).toEqual([]);
    expect(db.batches).toEqual([]);
  });

  it("unclassifies an explicit selection as a batch", async () => {
    const db = makeDb();
    const response = await handleClassify(
      request("DELETE", "/api/classify", { item_type: "entry", item_ids: ["entry-1", "entry-2"] }),
      { DB: db }, routeUrl(), "admin",
    );
    expect(response.status).toBe(200);
    expect((await body(response)).count).toBe(2);
    expect(db.batches[0]).toHaveLength(4);
    expect(db.batches[0][0].sql).toContain("DELETE FROM classified_items");
  });

  it("returns an idempotent empty result when a batch selector matches nothing", async () => {
    const db = makeDb({ selectionRows: [] });
    const response = await handleClassify(
      request("DELETE", "/api/classify", { item_type: "entry", era_id: "missing-era" }),
      { DB: db },
      routeUrl(),
      "admin",
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({ ok: true, count: 0, item_ids: [] });
    expect(db.batches).toEqual([]);
  });
});
