// @vitest-environment node
import { describe, expect, it } from "vitest";
import handleSession from "../session.js";
import { signJWT } from "../../utils/auth.js";
import { JWT_EXPIRY } from "../../config.js";

const DEV_SECRET = "dev-secret-change-me";
const EDU = { id: "edu", email: "bansovi.py@gmail.com", name: "edu", role: "user" };
const ADMIN = { id: "admin", email: "thebunker.admin@gmail.com", name: "admin", role: "admin" };
const ADMIN_ACCESS_KEY = "test-admin-access-key-0123456789abcdef"; // >= MIN_KEY_LENGTH

function decodePayload(token) {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    )
  );
}

function makeDb({ users = {} } = {}) {
  return {
    prepare() {
      return {
        bind(userId) {
          this._userId = userId;
          return this;
        },
        async first() {
          return users[this._userId] ?? null;
        },
        async run() {
          return {};
        },
      };
    },
  };
}

function makeEnv({ users = { edu: EDU, admin: ADMIN }, keys = {} } = {}) {
  return { DB: makeDb({ users }), JWT_SECRET: DEV_SECRET, ...keys };
}

function visitRequest({ token, body, ip } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (ip) headers["CF-Connecting-IP"] = ip;
  return new Request("https://bunker.test/api/session/visit", {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function visitUrl() {
  return new URL("https://bunker.test/api/session/visit");
}

async function tokenFor(sub, claims = {}) {
  return signJWT({ sub, email: EDU.email, method: "google", ...claims }, DEV_SECRET);
}

describe("/api/session/visit — encender modo visita sin clave", () => {
  it("devuelve 200 con un JWT que lleva visit:true, misma identidad y misma caducidad", async () => {
    const token = await tokenFor("edu");
    const response = await handleSession(
      visitRequest({ token, ip: "10.0.0.1" }),
      makeEnv(),
      visitUrl(),
      "edu",
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.visit).toBe(true);
    expect(data.user.id).toBe("edu");

    const payload = decodePayload(data.token);
    expect(payload.sub).toBe("edu");
    expect(payload.email).toBe(EDU.email);
    expect(payload.visit).toBe(true);
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp).toBeGreaterThanOrEqual(now + JWT_EXPIRY - 5);
    expect(payload.exp).toBeLessThanOrEqual(now + JWT_EXPIRY + 5);
  });
});

describe("/api/session/visit — apagar modo visita", () => {
  it("apagar sin clave responde 401 (claim visit activo en el token)", async () => {
    const token = await tokenFor("edu", { visit: true });
    const response = await handleSession(
      visitRequest({ token, ip: "10.0.0.2" }),
      makeEnv(),
      visitUrl(),
      "edu",
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Access key required to disable visit mode",
    });
  });

  it("apagar con clave válida devuelve 200 con un JWT sin el claim visit", async () => {
    const token = await tokenFor("edu", { visit: true });
    const response = await handleSession(
      visitRequest({ token, body: { access_key: ADMIN_ACCESS_KEY }, ip: "10.0.0.3" }),
      makeEnv({ keys: { ADMIN_ACCESS_KEY } }),
      visitUrl(),
      "edu",
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    const payload = decodePayload(data.token);
    expect(payload.visit).toBeUndefined();
    expect(payload.sub).toBe("admin"); // la clave define la identidad (ADR-028)
    expect(data.user.id).toBe("admin");
  });

  it("apagar con clave inválida responde 401", async () => {
    const token = await tokenFor("edu", { visit: true });
    const response = await handleSession(
      visitRequest({ token, body: { access_key: "wrong-key-wrong-key-wrong-key-00" }, ip: "10.0.0.4" }),
      makeEnv({ keys: { ADMIN_ACCESS_KEY } }),
      visitUrl(),
      "edu",
    );

    expect(response.status).toBe(401);
  });

  it("apagar con clave corta responde 401", async () => {
    const token = await tokenFor("edu", { visit: true });
    const response = await handleSession(
      visitRequest({ token, body: { access_key: "short" }, ip: "10.0.0.5" }),
      makeEnv({ keys: { ADMIN_ACCESS_KEY } }),
      visitUrl(),
      "edu",
    );

    expect(response.status).toBe(401);
  });

  it("apagar sin claves configuradas responde 503 (mismo contrato que /api/auth/token)", async () => {
    const token = await tokenFor("edu", { visit: true });
    const response = await handleSession(
      visitRequest({ token, body: { access_key: ADMIN_ACCESS_KEY }, ip: "10.0.0.6" }),
      makeEnv({ keys: {} }),
      visitUrl(),
      "edu",
    );

    expect(response.status).toBe(503);
  });

  it("apagar con clave válida también funciona si la sesión no estaba en modo visita", async () => {
    const token = await tokenFor("edu");
    const response = await handleSession(
      visitRequest({ token, body: { access_key: ADMIN_ACCESS_KEY }, ip: "10.0.0.7" }),
      makeEnv({ keys: { ADMIN_ACCESS_KEY } }),
      visitUrl(),
      "edu",
    );

    expect(response.status).toBe(200);
    expect(decodePayload((await response.json()).token).visit).toBeUndefined();
  });
});

describe("/api/session/visit — el claim sobrevive a la recarga de sesión", () => {
  it("el JWT emitido conserva visit:true y la siguiente petición lo lee del token", async () => {
    // 1) Encender: se obtiene un JWT con visit:true.
    const first = await handleSession(
      visitRequest({ token: await tokenFor("edu"), ip: "10.0.0.8" }),
      makeEnv(),
      visitUrl(),
      "edu",
    );
    expect(first.status).toBe(200);
    const visitToken = (await first.json()).token;

    // 2) Recarga/refresco: una petición nueva con ese mismo JWT conserva el estado
    //    (el claim vive en el token, no en el navegador).
    const reloaded = await handleSession(
      visitRequest({ token: visitToken, ip: "10.0.0.9" }),
      makeEnv(),
      visitUrl(),
      "edu",
    );
    expect(reloaded.status).toBe(401); // apagar sin clave, porque el claim sigue activo

    // 3) Con clave se apaga desde la sesión recargada.
    const off = await handleSession(
      visitRequest({ token: visitToken, body: { access_key: ADMIN_ACCESS_KEY }, ip: "10.0.0.10" }),
      makeEnv({ keys: { ADMIN_ACCESS_KEY } }),
      visitUrl(),
      "edu",
    );
    expect(off.status).toBe(200);
    expect(decodePayload((await off.json()).token).visit).toBeUndefined();
  });
});

describe("/api/session/visit — rate limit 10/min", () => {
  it("admite 10 encendidos en el minuto y responde 429 al undécimo (misma IP)", async () => {
    const env = makeEnv();
    for (let i = 0; i < 10; i++) {
      const response = await handleSession(
        visitRequest({ token: await tokenFor("edu"), ip: "10.99.0.1" }),
        env,
        visitUrl(),
        "edu",
      );
      expect(response.status).toBe(200);
    }
    const blocked = await handleSession(
      visitRequest({ token: await tokenFor("edu"), ip: "10.99.0.1" }),
      env,
      visitUrl(),
      "edu",
    );
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: "Too many auth attempts" });
  });

  it("no comparte el contador entre IPs distintas", async () => {
    const env = makeEnv();
    for (let i = 0; i < 10; i++) {
      const response = await handleSession(
        visitRequest({ token: await tokenFor("edu"), ip: `10.99.1.${i}` }),
        env,
        visitUrl(),
        "edu",
      );
      expect(response.status).toBe(200);
    }
    const other = await handleSession(
      visitRequest({ token: await tokenFor("edu"), ip: "10.99.2.1" }),
      env,
      visitUrl(),
      "edu",
    );
    expect(other.status).toBe(200);
  });
});

describe("/api/session/visit — validación de entrada", () => {
  it("rechaza sin identidad con 401 antes de tocar nada", async () => {
    const response = await handleSession(
      visitRequest({ ip: "10.0.0.20" }),
      makeEnv(),
      visitUrl(),
      null,
    );
    expect(response.status).toBe(401);
  });

  it("rechaza métodos que no sean POST con 405", async () => {
    const response = await handleSession(
      new Request("https://bunker.test/api/session/visit", { method: "GET" }),
      makeEnv(),
      visitUrl(),
      "edu",
    );
    expect(response.status).toBe(405);
  });

  it("rechaza rutas fuera de /api/session/visit con 404", async () => {
    const token = await tokenFor("edu");
    const response = await handleSession(
      visitRequest({ token, ip: "10.0.0.21" }),
      makeEnv(),
      new URL("https://bunker.test/api/session/other"),
      "edu",
    );
    expect(response.status).toBe(404);
  });

  it("rechaza JSON mal formado con 400", async () => {
    const token = await tokenFor("edu");
    const response = await handleSession(
      new Request("https://bunker.test/api/session/visit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: "{",
      }),
      makeEnv(),
      visitUrl(),
      "edu",
    );
    expect(response.status).toBe(400);
  });
});
