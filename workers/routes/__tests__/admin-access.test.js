// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleAdminAccess from "../admin-access.js";
import { ROUTES } from "../../worker.js";

const ACCESS_URL = "https://bunker.test/api/admin/access";

// Usuarios whitelist (ADR-006) con su contador ADR-031 en D1.
const USERS = [
  { id: "admin", email: "thebunker.admin@gmail.com", name: "admin", role: "admin", token_epoch: 3 },
  { id: "edu", email: "bansovi.py@gmail.com", name: "edu", role: "user", token_epoch: 0 },
  { id: "david", email: "dcgdozt@gmail.com", name: "david", role: "user", token_epoch: 1 },
];

// auth_login observados por usuario (payload de issueToken, ADR-019).
const LOGINS = {
  admin: [
    { payload: JSON.stringify({ method: "access_key", ip: "1.2.3.4", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" }), created_at: "2026-08-12 04:00:00" },
    { payload: JSON.stringify({ method: "google", ip: "5.6.7.8", ua: "Mozilla/5.0" }), created_at: "2026-08-11 04:00:00" },
  ],
  edu: [],
  david: [
    { payload: JSON.stringify({ method: "google", ip: "9.9.9.9", ua: "Mozilla/5.0" }), created_at: "2026-08-10 04:00:00" },
  ],
};

const EVENTS = [
  { id: 5, event_type: "auth_revoked", user_id: "admin", entity_type: "user", entity_id: "edu", payload: "{}", created_at: "2026-08-12 05:00:00" },
  { id: 4, event_type: "auth_login", user_id: "admin", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 04:00:00" },
  { id: 3, event_type: "visit_mode_on", user_id: "edu", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 03:00:00" },
  { id: 2, event_type: "visit_mode_off", user_id: "edu", entity_type: "session", entity_id: null, payload: "{}", created_at: "2026-08-12 02:00:00" },
];

const ADMIN_ACCESS_KEY = "test-admin-access-key-0123456789abcdef"; // >= MIN_KEY_LENGTH

function makeRequest(method = "GET", url = ACCESS_URL, body = undefined) {
  return new Request(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
}

function makeDb({ userRows = USERS, loginRows = LOGINS, eventsRows = EVENTS, total = EVENTS.length, updateChanges = 1, currentEpoch = 2 } = {}) {
  const calls = [];
  const prepared = [];
  let lastStatement = null;

  function statement(sql) {
    return {
      async first() {
        if (/\bCOUNT\(\*\)/i.test(sql)) return { count: total };
        if (sql.includes("SELECT token_epoch FROM users")) return { token_epoch: currentEpoch };
        return null;
      },
      async all() {
        if (sql.includes("SELECT id, email, name, role, token_epoch FROM users")) return { results: userRows };
        if (sql.includes("auth_login' AND user_id")) {
          const userId = this.lastBind?.[0];
          return { results: loginRows[userId] ?? [] };
        }
        if (sql.includes("FROM events")) return { results: eventsRows };
        return { results: [] };
      },
      async run() {
        return { meta: { changes: updateChanges } };
      },
      bind(...values) {
        this.lastBind = values;
        return this;
      },
    };
  }

  return {
    calls,
    prepared,
    get lastStatement() {
      return lastStatement;
    },
    prepare(sql) {
      const st = statement(sql);
      lastStatement = st;
      const record = { sql, binds: null };
      const originalBind = st.bind.bind(st);
      st.bind = (...values) => {
        record.binds = values;
        return originalBind(...values);
      };
      prepared.push(record);
      calls.push(sql);
      return st;
    },
  };
}

function makeEnv(overrides = {}) {
  return {
    DB: makeDb(),
    ADMIN_ACCESS_KEY,
    ...overrides,
  };
}

function routeUrl(value = ACCESS_URL) {
  return new globalThis.URL(value);
}

function routeIndex(prefix) {
  return ROUTES.findIndex(([routePrefix]) => routePrefix === prefix);
}

describe("registro del endpoint /api/admin/access (B6)", () => {
  it("registra el prefijo como endpoint autenticado antes del admin genérico, sin romper el orden audit", () => {
    expect(ROUTES.find(([prefix]) => prefix === "/api/admin/access")).toEqual([
      "/api/admin/access",
      handleAdminAccess,
      true,
    ]);
    expect(routeIndex("/api/admin/access")).toBeGreaterThan(routeIndex("/api/admin/audit"));
    expect(routeIndex("/api/admin/")).toBeGreaterThan(routeIndex("/api/admin/access"));
  });
});

describe("GET /api/admin/access — usuarios whitelist (pruebas 2 y 6 del diseño)", () => {
  it("rejects a missing identity before querying D1", async () => {
    const db = makeDb();
    const response = await handleAdminAccess(makeRequest(), { DB: db }, routeUrl(), null);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(db.calls).toEqual([]);
  });

  it("rejects a non-admin identity before querying D1 (edu → 403)", async () => {
    const db = makeDb();
    const response = await handleAdminAccess(makeRequest(), { DB: db }, routeUrl(), "edu");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden — admin required" });
    expect(db.calls).toEqual([]);
  });

  it("devuelve los usuarios con token_epoch, métodos, último acceso y clave configurada — nunca el valor de la clave", async () => {
    const response = await handleAdminAccess(makeRequest(), makeEnv(), routeUrl(), "admin");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, readOnly: false });
    expect(body.users).toHaveLength(3);

    const admin = body.users.find((user) => user.id === "admin");
    expect(admin.token_epoch).toBe(3);
    expect(admin.methods).toEqual(["access_key", "google"]);
    expect(admin.lastLogin.at).toBe("2026-08-12 04:00:00");
    expect(admin.lastLogin.ip).toBe("1.2.3.4");
    expect(admin.lastLogin.ua).toHaveLength(80); // UA truncado del último acceso
    expect(admin.lastLogin.ua.startsWith("Mozilla/5.0")).toBe(true);
    expect(admin.hasAccessKey).toBe(true); // ADMIN_ACCESS_KEY configurada en env

    const david = body.users.find((user) => user.id === "david");
    expect(david.hasAccessKey).toBe(false); // david no tiene binding (access-keys.js)

    const edu = body.users.find((user) => user.id === "edu");
    expect(edu.methods).toEqual([]);
    expect(edu.lastLogin).toBeNull(); // nunca ha entrado: vacío, nada inventado

    // Nunca se filtra el valor de una clave (diseño §6.1).
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(ADMIN_ACCESS_KEY);
    for (const user of body.users) {
      expect(typeof user.hasAccessKey).toBe("boolean");
      expect(user).not.toHaveProperty("key");
      expect(user).not.toHaveProperty("secret");
    }
  });

  it("solo expone usuarios de la whitelist (ADR-006), ignorando filas extra de users", async () => {
    const db = makeDb({
      userRows: [...USERS, { id: "intruso", email: "x@x.com", name: "x", role: "user", token_epoch: 0 }],
    });
    const response = await handleAdminAccess(makeRequest(), { DB: db }, routeUrl(), "admin");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users.map((user) => user.id).sort()).toEqual(["admin", "david", "edu"]);
  });

  it("rejects non-GET methods", async () => {
    const db = makeDb();
    const response = await handleAdminAccess(makeRequest("POST", ACCESS_URL), { DB: db }, routeUrl(), "admin");

    expect(response.status).toBe(405);
    expect(db.calls).toEqual([]);
  });
});

describe("POST /api/admin/access/:userId/revoke (pruebas 3, 4 y 5 del diseño)", () => {
  it("incrementa token_epoch en D1 y emite auth_revoked con {by, target, reason}", async () => {
    const db = makeDb({ currentEpoch: 4 });
    const response = await handleAdminAccess(
      makeRequest("POST", "https://bunker.test/api/admin/access/edu/revoke", { reason: "prueba" }),
      { DB: db },
      routeUrl("https://bunker.test/api/admin/access/edu/revoke"),
      "admin",
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, userId: "edu", token_epoch: 4 });

    // UPDATE con el target como bind, y SELECT del nuevo valor tras él.
    const update = db.prepared.find((record) => /\bUPDATE users SET token_epoch = token_epoch \+ 1\b/i.test(record.sql));
    expect(update).toBeTruthy();
    expect(update.binds).toEqual(["edu"]);
    const epochRead = db.prepared.find((record) => record.sql.includes("SELECT token_epoch FROM users"));
    expect(epochRead).toBeTruthy();
    expect(epochRead.binds).toEqual(["edu"]);
    expect(db.prepared.indexOf(epochRead)).toBeGreaterThan(db.prepared.indexOf(update));

    // auth_revoked emitido (INSERT en events) con {by, target, reason} en el payload.
    const insert = db.prepared.find((record) => /\bINSERT INTO events\b/i.test(record.sql));
    expect(insert).toBeTruthy();
    expect(insert.binds[0]).toBe("auth_revoked");
    expect(insert.binds[1]).toBe("admin"); // by = el admin que revoca
    expect(insert.binds[2]).toBe("user"); // entity_type
    expect(insert.binds[3]).toBe("edu"); // entity_id = target
    const payload = JSON.parse(insert.binds[4]);
    expect(payload).toEqual({ by: "admin", target: "edu", reason: "prueba" });
  });

  it("repetirlo vuelve a subir el contador: es seguro llamarlo dos veces", async () => {
    const db = makeDb({ currentEpoch: 5 });
    const env = { DB: db };
    const url = routeUrl("https://bunker.test/api/admin/access/david/revoke");

    const first = await handleAdminAccess(makeRequest("POST", url.href, { reason: null }), env, url, "admin");
    const second = await handleAdminAccess(makeRequest("POST", url.href, { reason: null }), env, url, "admin");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((await second.json()).token_epoch).toBe(5);
    const updates = db.calls.filter((sql) => /\bUPDATE users SET token_epoch\b/i.test(sql));
    expect(updates).toHaveLength(2);
  });

  it("valida :userId contra la whitelist (ADR-006) antes de tocar D1", async () => {
    const db = makeDb();
    const url = routeUrl("https://bunker.test/api/admin/access/intruso/revoke");
    const response = await handleAdminAccess(makeRequest("POST", url.href), { DB: db }, url, "admin");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User not found" });
    expect(db.calls).toEqual([]);
  });

  it("devuelve 404 si el UPDATE no afecta a ninguna fila (usuario whitelist sin fila en D1)", async () => {
    const db = makeDb({ updateChanges: 0 });
    const url = routeUrl("https://bunker.test/api/admin/access/edu/revoke");
    const response = await handleAdminAccess(makeRequest("POST", url.href), { DB: db }, url, "admin");

    expect(response.status).toBe(404);
  });

  it("rejects a non-admin identity before touching D1 (prueba 6)", async () => {
    const db = makeDb();
    const url = routeUrl("https://bunker.test/api/admin/access/admin/revoke");
    const response = await handleAdminAccess(makeRequest("POST", url.href), { DB: db }, url, "edu");

    expect(response.status).toBe(403);
    expect(db.calls).toEqual([]);
  });
});

describe("GET /api/admin/access/logins — lector de la traza de ACCESOS (prueba 5)", () => {
  it("devuelve solo los 4 tipos de la traza con paginación y binds ordenados", async () => {
    const db = makeDb({ eventsRows: EVENTS, total: 4 });
    const response = await handleAdminAccess(
      makeRequest("GET", `${ACCESS_URL}/logins`),
      { DB: db },
      routeUrl(`${ACCESS_URL}/logins`),
      "admin",
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, readOnly: true, total: 4, page: 1, pageSize: 25 });
    expect(body.items.map((row) => row.event_type).sort()).toEqual([
      "auth_login",
      "auth_revoked",
      "visit_mode_off",
      "visit_mode_on",
    ]);

    const select = db.calls[1];
    expect(select).toContain("event_type IN (?1, ?2, ?3, ?4)");
    expect(select).toContain("ORDER BY created_at DESC, id DESC");
    expect(select).toContain("LIMIT ?5 OFFSET ?6");
    expect(db.lastStatement.lastBind).toEqual(["auth_login", "auth_revoked", "visit_mode_on", "visit_mode_off", 25, 0]);
    expect(db.calls.every((sql) => !/\b(INSERT|UPDATE|DELETE|ALTER|DROP)\b/i.test(sql))).toBe(true);
  });

  it("filtra por usuario con binds numerados sin colisión con los 4 tipos", async () => {
    const db = makeDb({ eventsRows: [], total: 0 });
    const response = await handleAdminAccess(
      makeRequest("GET", `${ACCESS_URL}/logins?user=edu&page=2&pageSize=5`),
      { DB: db },
      routeUrl(`${ACCESS_URL}/logins?user=edu&page=2&pageSize=5`),
      "admin",
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(5);
    const select = db.calls[1];
    expect(select).toContain("user_id = ?5");
    expect(db.lastStatement.lastBind).toEqual(["auth_login", "auth_revoked", "visit_mode_on", "visit_mode_off", "edu", 5, 5]);
  });

  it("filtra por fechas since/until", async () => {
    const db = makeDb({ eventsRows: [], total: 0 });
    const response = await handleAdminAccess(
      makeRequest("GET", `${ACCESS_URL}/logins?since=2026-08-01&until=2026-08-31`),
      { DB: db },
      routeUrl(`${ACCESS_URL}/logins?since=2026-08-01&until=2026-08-31`),
      "admin",
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    const select = db.calls[1];
    expect(select).toContain("created_at >= ?5");
    expect(select).toContain("created_at <= ?6");
    expect(db.lastStatement.lastBind).toEqual(["auth_login", "auth_revoked", "visit_mode_on", "visit_mode_off", "2026-08-01", "2026-08-31", 25, 0]);
    expect(body.total).toBe(0);
  });

  it("rejects a non-admin identity before querying D1", async () => {
    const db = makeDb();
    const response = await handleAdminAccess(
      makeRequest("GET", `${ACCESS_URL}/logins`),
      { DB: db },
      routeUrl(`${ACCESS_URL}/logins`),
      "edu",
    );

    expect(response.status).toBe(403);
    expect(db.calls).toEqual([]);
  });
});

describe("rutas y métodos no contemplados", () => {
  it("404 para caminos desconocidos y revoke sin el segmento esperado", async () => {
    const db = makeDb();
    const unknown = await handleAdminAccess(
      makeRequest("GET", "https://bunker.test/api/admin/access/extra"),
      { DB: db },
      routeUrl("https://bunker.test/api/admin/access/extra"),
      "admin",
    );
    const missingSegment = await handleAdminAccess(
      makeRequest("POST", "https://bunker.test/api/admin/access/revoke"),
      { DB: db },
      routeUrl("https://bunker.test/api/admin/access/revoke"),
      "admin",
    );

    expect(unknown.status).toBe(404);
    expect(missingSegment.status).toBe(404);
    expect(db.calls).toEqual([]);
  });

  it("405 para métodos no permitidos en revoke y logins", async () => {
    const db = makeDb();
    const getRevoke = await handleAdminAccess(
      makeRequest("GET", "https://bunker.test/api/admin/access/edu/revoke"),
      { DB: db },
      routeUrl("https://bunker.test/api/admin/access/edu/revoke"),
      "admin",
    );
    const postLogins = await handleAdminAccess(
      makeRequest("POST", `${ACCESS_URL}/logins`),
      { DB: db },
      routeUrl(`${ACCESS_URL}/logins`),
      "admin",
    );

    expect(getRevoke.status).toBe(405);
    expect(postLogins.status).toBe(405);
    expect(db.calls).toEqual([]);
  });
});
