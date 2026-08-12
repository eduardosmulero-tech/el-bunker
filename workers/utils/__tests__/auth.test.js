// @vitest-environment node
// ADR-031 — epoch por usuario: el claim `epoch` del JWT se compara contra
// users.token_epoch en authenticate(). Revocar = incrementar el contador:
// el token emitido antes deja de coincidir y el dispatcher responde 401.
// La prueba 4 del diseño (DISENO_REVOCACION_JWT §6.3) es la que decide:
// "el token de antes de revocar tiene que dar 401". Aquí se demuestra a
// nivel del verificador; la 7 (Modo Visita) es el mismo mecanismo con el
// bump al encender visita.
import { describe, expect, it } from "vitest";
import { signJWT, verifyJWT, authenticate } from "../auth.js";
import { issueToken } from "../../routes/auth.js";

const DEV_SECRET = "dev-secret-change-me";

function decodePayload(token) {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
    )
  );
}

// D1 fake: responde al SELECT de frescura (token_epoch) por usuario.
function makeDb({ epochByUser = {} } = {}) {
  return {
    prepare() {
      return {
        bind(userId) {
          this._userId = userId;
          return this;
        },
        async first() {
          return epochByUser[this._userId] !== undefined
            ? { token_epoch: epochByUser[this._userId] }
            : null;
        },
        async run() {
          return {};
        },
      };
    },
  };
}

function authRequest(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("https://bunker.test/api/entries", { headers });
}

// JWT con exp en el pasado y firma HMAC válida: signJWT siempre pone exp
// futuro, así que para probar la rama de caducidad se fabrica a mano.
async function makeExpiredToken(payload, secret) {
  const enc = new TextEncoder();
  const b64url = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) - 10,
  })));
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`)));
  return `${header}.${body}.${sig}`;
}

describe("issueToken — el claim epoch entra en el JWT (prueba 1 del diseño)", () => {
  it("firma el payload con epoch = token_epoch del usuario", async () => {
    const env = { JWT_SECRET: DEV_SECRET, DB: makeDb({ epochByUser: { edu: 4 } }) };
    const response = await issueToken(
      env,
      authRequest(),
      { id: "edu", email: "bansovi.py@gmail.com", name: "edu", role: "user", token_epoch: 4 },
      "access_key",
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    const payload = decodePayload(data.token);
    expect(payload.sub).toBe("edu");
    expect(payload.method).toBe("access_key");
    expect(payload.epoch).toBe(4);
  });

  it("extraClaims (visit del Modo Visita) conviven con epoch", async () => {
    const env = { JWT_SECRET: DEV_SECRET, DB: makeDb({ epochByUser: { edu: 2 } }) };
    const response = await issueToken(
      env,
      authRequest(),
      { id: "edu", email: "bansovi.py@gmail.com", name: "edu", role: "user", token_epoch: 2 },
      "visit_on",
      { visit: true },
    );

    expect(response.status).toBe(200);
    const payload = decodePayload((await response.json()).token);
    expect(payload.visit).toBe(true);
    expect(payload.epoch).toBe(2);
  });
});

describe("authenticate — frescura del epoch (ADR-031)", () => {
  it("verifica firma y devuelve la identidad si el epoch coincide (prueba 2: 200)", async () => {
    const token = await signJWT({ sub: "edu", email: "bansovi.py@gmail.com", method: "access_key", epoch: 1 }, DEV_SECRET);
    const userId = await authenticate(authRequest(token), {
      JWT_SECRET: DEV_SECRET,
      DB: makeDb({ epochByUser: { edu: 1 } }),
    });

    expect(userId).toBe("edu");
  });

  it("PRUEBA 4 (la que decide): tras revocar (epoch +1), el token anterior da null → el dispatcher responde 401", async () => {
    // Token emitido con epoch 1...
    const token = await signJWT({ sub: "edu", email: "bansovi.py@gmail.com", method: "access_key", epoch: 1 }, DEV_SECRET);
    // ...y el usuario revocado: UPDATE users SET token_epoch = token_epoch + 1 → 2.
    const userId = await authenticate(authRequest(token), {
      JWT_SECRET: DEV_SECRET,
      DB: makeDb({ epochByUser: { edu: 2 } }),
    });

    expect(userId).toBeNull(); // 401 en el dispatcher
  });

  it("PRUEBA 7: el token emitido antes de encender el Modo Visita muere con el bump de epoch (visit)", async () => {
    // Token A sin visit, emitido con epoch 0 (sesión normal).
    const tokenA = await signJWT({ sub: "edu", email: "bansovi.py@gmail.com", method: "access_key", epoch: 0 }, DEV_SECRET);
    // Encender visita incrementa el contador y firma B con el valor nuevo.
    const userId = await authenticate(authRequest(tokenA), {
      JWT_SECRET: DEV_SECRET,
      DB: makeDb({ epochByUser: { edu: 1 } }),
    });

    expect(userId).toBeNull(); // A ya no vale: 401 sin censura de por medio
  });

  it("rechaza un token sin el claim epoch (emitido antes del despliegue de ADR-031)", async () => {
    const token = await signJWT({ sub: "edu", email: "bansovi.py@gmail.com", method: "access_key" }, DEV_SECRET);
    const userId = await authenticate(authRequest(token), {
      JWT_SECRET: DEV_SECRET,
      DB: makeDb({ epochByUser: { edu: 0 } }),
    });

    expect(userId).toBeNull(); // undefined !== 0 → rotación implícita al desplegar
  });

  it("rechaza un token de un usuario sin fila en D1", async () => {
    const token = await signJWT({ sub: "edu", email: "bansovi.py@gmail.com", method: "access_key", epoch: 0 }, DEV_SECRET);
    const userId = await authenticate(authRequest(token), {
      JWT_SECRET: DEV_SECRET,
      DB: makeDb({ epochByUser: {} }),
    });

    expect(userId).toBeNull();
  });

  it("rechaza una firma inválida o un token caducado (comportamiento previo intacto)", async () => {
    const env = { JWT_SECRET: DEV_SECRET, DB: makeDb({ epochByUser: { edu: 0 } }) };
    const forged = await signJWT({ sub: "edu", method: "access_key", epoch: 0 }, "otro-secret");
    const expired = await makeExpiredToken({ sub: "edu", method: "access_key", epoch: 0 }, DEV_SECRET);

    expect(await authenticate(authRequest(forged), env)).toBeNull();
    expect(await authenticate(authRequest(expired), env)).toBeNull();
  });

  it("devuelve null sin cabecera Authorization", async () => {
    const env = { JWT_SECRET: DEV_SECRET, DB: makeDb() };
    expect(await authenticate(authRequest(null), env)).toBeNull();
  });
});

describe("verifyJWT — expone el payload completo (el epoch viaja con el token)", () => {
  it("devuelve el payload, no solo el sub", async () => {
    const token = await signJWT({ sub: "david", email: "dcgdozt@gmail.com", method: "google", epoch: 7 }, DEV_SECRET);
    const payload = await verifyJWT(token, DEV_SECRET);

    expect(payload).toMatchObject({ sub: "david", method: "google", epoch: 7 });
    expect(typeof payload.exp).toBe("number");
  });
});
