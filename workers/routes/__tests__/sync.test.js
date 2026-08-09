// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleSync from "../sync.js";

function request(method, path, body) {
  return new Request(`https://bunker.test${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function makeDb({ session = null } = {}) {
  const calls = [];
  const statement = (sql) => {
    const current = {
      sql,
      bind(...bindings) {
        calls.push({ sql, bindings });
        return current;
      },
      async first() {
        if (sql.includes("FROM shared_sessions")) return session;
        return null;
      },
      async run() {
        return { meta: { changes: 1 } };
      },
      async all() {
        return { results: [] };
      },
    };
    return current;
  };
  return {
    calls,
    prepare: statement,
  };
}

async function body(response) {
  return response.json();
}

describe("shared listening sync route", () => {
  it("creates a session and returns its id for the host", async () => {
    const db = makeDb();
    const response = await handleSync(
      request("POST", "/api/sync", { action: "create" }),
      { DB: db },
      new URL("https://bunker.test/api/sync"),
      "edu",
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({ active: true, host_id: "edu" });
    expect(db.calls.some(({ sql }) => sql.includes("INSERT INTO shared_sessions"))).toBe(true);
    expect(db.calls.some(({ sql }) => sql.includes("INSERT INTO events"))).toBe(true);
  });

  it("rejects a non-participant from reading a session", async () => {
    const db = makeDb({ session: { id: "session-1", host_user_id: "edu", guest_user_id: "david" } });
    const response = await handleSync(
      request("GET", "/api/sync?session_id=session-1&since=0"),
      { DB: db },
      new URL("https://bunker.test/api/sync?session_id=session-1&since=0"),
      "admin",
    );

    expect(response.status).toBe(403);
  });

  it("rejects the host trying to join their own session", async () => {
    const db = makeDb({ session: { id: "session-1", host_user_id: "edu", guest_user_id: null } });
    const response = await handleSync(
      request("POST", "/api/sync", { action: "join", session_id: "session-1" }),
      { DB: db },
      new URL("https://bunker.test/api/sync"),
      "edu",
    );

    expect(response.status).toBe(409);
  });

  it("rejects an unrelated identity from joining", async () => {
    const db = makeDb({ session: { id: "session-1", host_user_id: "edu", guest_user_id: null } });
    const response = await handleSync(
      request("POST", "/api/sync", { action: "join", session_id: "session-1" }),
      { DB: db },
      new URL("https://bunker.test/api/sync"),
      "admin",
    );

    expect(response.status).toBe(403);
  });

  it("lets a guest leave without deleting the shared session", async () => {
    const db = makeDb({ session: { id: "session-1", host_user_id: "edu", guest_user_id: "david", queue_json: "[]" } });
    const response = await handleSync(
      request("POST", "/api/sync", { action: "leave", session_id: "session-1" }),
      { DB: db },
      new URL("https://bunker.test/api/sync"),
      "david",
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({ active: false, ended: false });
    expect(db.calls.some(({ sql }) => sql.includes("guest_user_id = NULL"))).toBe(true);
    expect(db.calls.some(({ sql }) => sql.includes("DELETE FROM shared_sessions"))).toBe(false);
  });

  it("lets only the host terminate the session with leave", async () => {
    const db = makeDb({ session: { id: "session-1", host_user_id: "edu", guest_user_id: "david", queue_json: "[]" } });
    const response = await handleSync(
      request("POST", "/api/sync", { action: "leave", session_id: "session-1" }),
      { DB: db },
      new URL("https://bunker.test/api/sync"),
      "edu",
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({ active: false, ended: true });
    expect(db.calls.some(({ sql }) => sql.includes("DELETE FROM shared_sessions"))).toBe(true);
  });

  it("rejects guest termination through DELETE", async () => {
    const db = makeDb({ session: { id: "session-1", host_user_id: "edu", guest_user_id: "david", queue_json: "[]" } });
    const response = await handleSync(
      request("DELETE", "/api/sync?session_id=session-1"),
      { DB: db },
      new URL("https://bunker.test/api/sync?session_id=session-1"),
      "david",
    );

    expect(response.status).toBe(403);
    expect(db.calls.some(({ sql }) => sql.includes("DELETE FROM shared_sessions"))).toBe(false);
  });

  it("rejects every session mutation from an unrelated identity", async () => {
    const session = { id: "session-1", host_user_id: "edu", guest_user_id: "david", queue_json: "[]" };
    const actions = [
      { action: "queue_add", track_data: { id: "track-1" } },
      { action: "queue_remove", track_id: "track-1" },
      { action: "play", track_id: "track-1" },
      { action: "sync", position: 12 },
    ];

    for (const action of actions) {
      const db = makeDb({ session });
      const response = await handleSync(
        request("POST", "/api/sync", { ...action, session_id: "session-1" }),
        { DB: db },
        new URL("https://bunker.test/api/sync"),
        "admin",
      );
      expect(response.status, action.action).toBe(403);
    }
  });

  it("returns host identity and current state when a guest joins", async () => {
    const session = {
      id: "session-1",
      host_user_id: "edu",
      guest_user_id: null,
      active_track_id: "track-1",
      position: 12.5,
      is_playing: 1,
      queue_json: "[]",
    };
    const db = makeDb({ session });
    const response = await handleSync(
      request("POST", "/api/sync", { action: "join", session_id: "session-1" }),
      { DB: db },
      new URL("https://bunker.test/api/sync"),
      "david",
    );

    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({
      active: true,
      session_id: "session-1",
      host_id: "edu",
      guest_id: "david",
      active_track_id: "track-1",
      position: 12.5,
      is_playing: true,
    });
  });
});
