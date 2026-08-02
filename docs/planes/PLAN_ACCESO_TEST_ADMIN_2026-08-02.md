# Acceso test/admin sin Google — Plan de implementación

> **Para el implementador:** este plan se ejecuta tarea a tarea, en orden. Cada tarea acaba
> con algo verificable por artefacto (comando + salida esperada), nunca por informe.
> Metodología del proyecto (REGLAS.md, S145): el encargo va a `task_deepseek.md`, DeepSeek
> lee el código real y edita los archivos; Sonnet verifica contra el código antes de dar por
> buena una tarea. **Sonnet no edita `src/` ni `workers/` salvo instrucción explícita de Edu.**

**Objetivo:** que el agente y Edu obtengan un JWT válido de la API de producción sin pasar
por Google, canjeando una clave de acceso, sin tocar `authenticate()` ni el flujo de David.

**Arquitectura:** un segundo emisor del mismo JWT. `POST /api/auth/token` compara la clave
presentada (hash SHA-256, tiempo constante) contra secrets del worker, resuelve el usuario
en la tabla `users` de D1 y firma el JWT de siempre con `JWT_SECRET`. La API sigue
aceptando exclusivamente JWT. El frontend gana un `sessionKind` que separa "hay sesión" de
"hay token de Google".

**Stack:** Cloudflare Workers (ESM) + D1 · React 19 + Vite + Tailwind · Vitest · Wrangler 4.

**SPEC de referencia:** `docs/spec/SPEC_ACCESO_TEST_ADMIN_2026-08-02.md` (contiene el
veredicto de diseño, el contrato de API y el ADR propuesto).
**Contrato origen:** `C:\proyectos\.trabajo\CONTRATO_ACCESO_TEST_ADMIN_2026-08-02.md`.

## Restricciones globales (aplican a TODAS las tareas)

- **`workers/utils/auth.js` NO se toca.** Si una tarea parece necesitarlo, para y reporta.
- **Congelación ADDENDUM 8-jul:** `WinampPlayer.jsx`, `AudioVisualizer.jsx`, el motor de
  `PlayerContext.jsx` y `tokens.js` no se tocan. `LoginScreen.jsx` sí se amplía (declarado
  no congelado en el contrato), reutilizando sus tokens visuales (`ACID`, `RED`, `FONT`).
- **Sin micro-edición (ADR-015 / R17):** cada cambio abarca el contenedor lógico completo
  (función, componente o archivo entero cuando procede).
- **Nada destructivo sin gate de Edu (R19).** `wrangler secret put/delete`, `wrangler deploy`
  y cualquier `git commit`/`push` los ejecuta **Edu**. El plan presenta el comando y espera.
- **Sin coautoría IA en commits (R4).** Español en código, comentarios y docs.
- **Ninguna clave real aparece en el repo, en un commit, ni en un comando con la clave
  escrita en línea.** Se usan variables de entorno y `wrangler secret put` interactivo.
- Verificación de cada tarea: `npx eslint src/ workers/` sin errores nuevos y
  `npm run test` en verde (12/12 actuales + los nuevos).

---

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `workers/utils/access-keys.js` | **crear** | Resolver clave → `userId`. Hash + comparación en tiempo constante. Único sitio que conoce el mapa clave↦usuario. |
| `workers/utils/__tests__/access-keys.test.js` | **crear** | Tests unitarios de lo anterior (entorno node). |
| `workers/utils/rate-limit.js` | modificar | Añadir `checkAuthRateLimit` (ventana por minuto para `/api/auth/*`). |
| `workers/utils/__tests__/rate-limit.test.js` | **crear** | Tests del limitador de auth. |
| `workers/routes/auth.js` | reescribir | Dispatch `/login` (Google) y `/token` (clave). Emisión única de JWT + evento de auditoría. |
| `workers/routes/events.js` | modificar | `GET /api/events` excluye `auth_%` salvo `?type=` explícito. |
| `src/core/VaultContext.jsx` | modificar | `sessionKind`, `loginWithAccessKey`, restauración de sesión antes de Google, gates de `refreshDb`/`patchDb`, caducidad de JWT. |
| `src/layout/LoginScreen.jsx` | modificar | Panel "ACCESO TEST / ADMIN" (input + recordar). |
| `src/layout/App.jsx` | modificar | Pasar `onAccessKeyLogin` a `LoginScreen`. |
| `docs/operacional/ACCESO_TEST_ADMIN.md` | **crear** | Manual: generar, usar, rotar, revocar, auditar. |
| `AGENTS.md` | modificar | Una fila en MAPA DE DOCS. Sigue magro. |
| `docs/Nucleo/CONTRATO.md` | modificar | ADR-028 + enmienda ADR-025 (texto listo en la SPEC §9). |
| `docs/Nucleo/ESTADO.md`, `BACKLOG.md`, `docs/Arquitectura/INDEX.md` | modificar | Checklist de cierre de REGLAS.md. |

---

## Tarea 1 — Resolución de claves de acceso

**Archivos**
- Crear: `workers/utils/access-keys.js`
- Test: `workers/utils/__tests__/access-keys.test.js`

**Interfaces**
- Consume: nada (módulo hoja).
- Produce: `MIN_KEY_LENGTH: number`, `ACCESS_KEY_BINDINGS: {secret,userId}[]`,
  `hasAccessKeysConfigured(env): boolean`,
  `resolveAccessKey(key: string, env: object): Promise<string|null>`.

- [ ] **Paso 1: escribir el test que falla**

Crear `workers/utils/__tests__/access-keys.test.js`:

```js
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { resolveAccessKey, hasAccessKeysConfigured, MIN_KEY_LENGTH } from "../access-keys.js";

const ADMIN = "A".repeat(43);   // 43 chars = clave base64url de 32 bytes
const EDU   = "B".repeat(43);
const env   = { ADMIN_ACCESS_KEY: ADMIN, EDU_ACCESS_KEY: EDU };

describe("resolveAccessKey", () => {
  it("resuelve la clave de admin a 'admin'", async () => {
    expect(await resolveAccessKey(ADMIN, env)).toBe("admin");
  });

  it("resuelve la clave de edu a 'edu'", async () => {
    expect(await resolveAccessKey(EDU, env)).toBe("edu");
  });

  it("rechaza una clave que no corresponde a ningún secret", async () => {
    expect(await resolveAccessKey("C".repeat(43), env)).toBeNull();
  });

  it("rechaza claves más cortas que el mínimo", async () => {
    const corta = "D".repeat(MIN_KEY_LENGTH - 1);
    expect(await resolveAccessKey(corta, { ADMIN_ACCESS_KEY: corta })).toBeNull();
  });

  it("ignora un secret configurado demasiado corto", async () => {
    expect(await resolveAccessKey("x".repeat(43), { ADMIN_ACCESS_KEY: "corta" })).toBeNull();
  });

  it("rechaza entradas que no son string", async () => {
    expect(await resolveAccessKey(null, env)).toBeNull();
    expect(await resolveAccessKey(12345, env)).toBeNull();
  });

  it("devuelve null si no hay ningún secret en el entorno", async () => {
    expect(await resolveAccessKey(ADMIN, {})).toBeNull();
  });
});

describe("hasAccessKeysConfigured", () => {
  it("es true con al menos un secret válido", () => {
    expect(hasAccessKeysConfigured({ EDU_ACCESS_KEY: EDU })).toBe(true);
  });

  it("es false con el entorno vacío o con secrets cortos", () => {
    expect(hasAccessKeysConfigured({})).toBe(false);
    expect(hasAccessKeysConfigured({ ADMIN_ACCESS_KEY: "corta" })).toBe(false);
  });
});
```

- [ ] **Paso 2: ejecutar el test y ver que falla**

```bash
npx vitest run workers/utils/__tests__/access-keys.test.js
```
Esperado: FAIL — `Failed to resolve import "../access-keys.js"`.

- [ ] **Paso 3: implementar el módulo**

Crear `workers/utils/access-keys.js` con exactamente esto:

```js
// ============================================================
//  EL BÚNKER — workers/utils/access-keys.js
//  Claves de acceso test/admin (ADR-028).
//  Se canjean por JWT en POST /api/auth/token. NO son un bypass
//  de authenticate(): solo alimentan al emisor de JWT.
// ============================================================

/** Longitud mínima de una clave (32 chars ≈ 192 bits en base64url). */
export const MIN_KEY_LENGTH = 32;

/** Secret del worker → usuario de la whitelist (ADR-006). Sin entrada para david. */
export const ACCESS_KEY_BINDINGS = [
  { secret: "ADMIN_ACCESS_KEY", userId: "admin" },
  { secret: "EDU_ACCESS_KEY",   userId: "edu"   },
];

/** SHA-256 en hex. Siempre 64 chars → la comparación no filtra la longitud real. */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparación en tiempo constante de dos digests hex. */
function constantTimeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** ¿Hay al menos una clave configurada? Sirve para distinguir 401 (mala) de 503 (sin configurar). */
export function hasAccessKeysConfigured(env) {
  return ACCESS_KEY_BINDINGS.some(({ secret }) => {
    const value = env?.[secret];
    return typeof value === "string" && value.length >= MIN_KEY_LENGTH;
  });
}

/**
 * resolveAccessKey — userId de la clave presentada, o null.
 * Recorre TODOS los bindings sin cortocircuito: el tiempo de respuesta no
 * revela cuál acertó ni cuántas claves hay configuradas.
 */
export async function resolveAccessKey(key, env) {
  if (typeof key !== "string" || key.length < MIN_KEY_LENGTH) return null;
  const presented = await sha256Hex(key);
  let match = null;
  for (const { secret, userId } of ACCESS_KEY_BINDINGS) {
    const configured = env?.[secret];
    if (typeof configured !== "string" || configured.length < MIN_KEY_LENGTH) continue;
    const expected = await sha256Hex(configured);
    if (constantTimeEqualHex(presented, expected)) match = userId;
  }
  return match;
}
```

- [ ] **Paso 4: ejecutar el test y ver que pasa**

```bash
npx vitest run workers/utils/__tests__/access-keys.test.js
```
Esperado: PASS, 9 tests.

- [ ] **Paso 5: presentar el commit a Edu (no ejecutarlo)**

```bash
git add workers/utils/access-keys.js workers/utils/__tests__/access-keys.test.js
git commit -m "feat(auth): resolución de claves de acceso test/admin (ADR-028)"
```

---

## Tarea 2 — Rate limit específico del endpoint de auth

**Archivos**
- Modificar: `workers/utils/rate-limit.js` (hoy 19 líneas; se reescribe entero)
- Test: `workers/utils/__tests__/rate-limit.test.js`

**Interfaces**
- Consume: nada.
- Produce: `checkAuthRateLimit(request): boolean` (10 intentos / 60 s por IP).
  `checkRateLimit` sigue exportada e **idéntica en comportamiento** (10 req/s).

> Por qué 10/min y no 5: el flujo de Google re-autentica solo con debounce de 30 s
> (`VaultContext.jsx:375`) y una recarga insistente de Edu no debe autobloquearle. Contra
> fuerza bruta el limitador es cinturón, no tirantes: la defensa real son los 256 bits de
> entropía de la clave.

- [ ] **Paso 1: escribir el test que falla**

Crear `workers/utils/__tests__/rate-limit.test.js`:

```js
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { checkAuthRateLimit } from "../rate-limit.js";

const req = (ip) => new Request("https://x/api/auth/token", { headers: { "CF-Connecting-IP": ip } });

describe("checkAuthRateLimit", () => {
  it("permite 10 intentos por IP y bloquea el 11º", () => {
    const r = req("1.2.3.4");
    for (let i = 0; i < 10; i++) expect(checkAuthRateLimit(r)).toBe(true);
    expect(checkAuthRateLimit(r)).toBe(false);
  });

  it("cuenta por IP de forma independiente", () => {
    const otra = req("5.6.7.8");
    expect(checkAuthRateLimit(otra)).toBe(true);
  });
});
```

- [ ] **Paso 2: ejecutar el test y ver que falla**

```bash
npx vitest run workers/utils/__tests__/rate-limit.test.js
```
Esperado: FAIL — `checkAuthRateLimit is not a function`.

- [ ] **Paso 3: reescribir `workers/utils/rate-limit.js` entero**

```js
// ============================================================
//  EL BÚNKER — workers/utils/rate-limit.js
//  Rate limiting simple en memoria del isolate:
//   · checkRateLimit      — 10 req/s por IP, todas las rutas /api/ (S113-W)
//   · checkAuthRateLimit  — 10 intentos/min por IP, solo /api/auth/* (ADR-028)
// ============================================================

const RATE_LIMIT = new Map();

export function checkRateLimit(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// ─── Auth: ventana larga, límite bajo ───────────────────────
const AUTH_LIMIT     = new Map();
const AUTH_MAX       = 10;
const AUTH_WINDOW_MS = 60_000;

/** Purga entradas caducadas: el endpoint de auth es blanco de fuerza bruta y el
 *  Map no debe crecer sin límite en un isolate de vida larga. */
function sweepAuthLimit(now) {
  if (AUTH_LIMIT.size < 1000) return;
  for (const [ip, entry] of AUTH_LIMIT) {
    if (now > entry.resetAt) AUTH_LIMIT.delete(ip);
  }
}

export function checkAuthRateLimit(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  sweepAuthLimit(now);
  const entry = AUTH_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    AUTH_LIMIT.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return true;
  }
  if (entry.count >= AUTH_MAX) return false;
  entry.count++;
  return true;
}
```

- [ ] **Paso 4: ejecutar los tests y ver que pasan**

```bash
npx vitest run workers/utils/__tests__/
```
Esperado: PASS, 11 tests (9 de claves + 2 de rate limit).

- [ ] **Paso 5: presentar el commit a Edu**

```bash
git add workers/utils/rate-limit.js workers/utils/__tests__/rate-limit.test.js
git commit -m "feat(auth): rate limit por minuto para /api/auth"
```

---

## Tarea 3 — Endpoint `POST /api/auth/token` + auditoría

**Archivos**
- Reescribir entero: `workers/routes/auth.js` (42 → ~105 líneas; contenedor lógico completo, ADR-015)

**Interfaces**
- Consume: `WHITELIST` (`workers/config.js:13`), `signJWT` (`workers/utils/auth.js:19`),
  `emitEvent` (`workers/utils/events.js:20`), `json`/`err` (`workers/utils/response.js`),
  `checkAuthRateLimit` (Tarea 2), `resolveAccessKey`/`hasAccessKeysConfigured`/
  `MIN_KEY_LENGTH` (Tarea 1).
- Produce: `POST /api/auth/token` → `{ token, user:{id,email,name,role} }`.
  `POST /api/auth/login` conserva su contrato y añade `name`/`role` a `user`.

**Cambio de comportamiento deliberado:** hoy `handleAuth` responde a **cualquier** path bajo
`/api/auth`; pasa a aceptar solo `/api/auth/login` y `/api/auth/token` (404 en el resto). El
frontend solo usa `/api/auth/login` (`VaultContext.jsx:252`), así que no rompe nada.

- [ ] **Paso 1: reescribir el archivo completo**

```js
// ============================================================
//  EL BÚNKER — workers/routes/auth.js
//  POST /api/auth/login — Google token → JWT       (Edu y David)
//  POST /api/auth/token — clave de acceso → JWT    (ADR-028: agente y Edu)
//  Emisor único de JWT. authenticate() NO se toca.
// ============================================================

import { WHITELIST } from "../config.js";
import { json, err } from "../utils/response.js";
import { signJWT } from "../utils/auth.js";
import { emitEvent } from "../utils/events.js";
import { checkAuthRateLimit } from "../utils/rate-limit.js";
import {
  resolveAccessKey,
  hasAccessKeysConfigured,
  MIN_KEY_LENGTH,
} from "../utils/access-keys.js";

/** Usuario completo desde D1 — fuente única de identidad (schema.sql: tabla users). */
async function loadUser(env, userId) {
  return env.DB.prepare(
    "SELECT id, email, name, role FROM users WHERE id = ?1"
  ).bind(userId).first();
}

/** Firma el JWT y registra la emisión en events (ADR-019). Único punto de firma. */
async function issueToken(env, request, user, method) {
  const secret = env.JWT_SECRET;
  if (!secret && env.ENVIRONMENT === "production") {
    return err("JWT_SECRET not configured", 500);
  }
  const token = await signJWT(
    { sub: user.id, email: user.email, method },
    secret || "dev-secret-change-me"
  );
  await emitEvent(env, "auth_login", user.id, "session", null, {
    method,
    ip: request.headers.get("CF-Connecting-IP") || "unknown",
    ua: (request.headers.get("User-Agent") || "").slice(0, 200),
  });
  return json({ token, user });
}

/** POST /api/auth/login — OAuth2 de Google. Flujo de David: sin cambios. */
async function handleGoogleLogin(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.google_token) {
    return err("email and google_token required", 400);
  }

  const gRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(body.google_token)}`
  );
  if (!gRes.ok) return err("Invalid Google token", 401);

  const gData = await gRes.json();
  const verifiedEmail = gData.email?.toLowerCase();
  const userId = WHITELIST[verifiedEmail];
  if (!userId) return err("Email not authorized", 403);

  const user =
    (await loadUser(env, userId)) ??
    { id: userId, email: verifiedEmail, name: userId, role: "user" };
  return issueToken(env, request, user, "google");
}

/** POST /api/auth/token — clave de acceso test/admin (ADR-028). */
async function handleAccessKeyLogin(request, env) {
  const body = await request.json().catch(() => null);
  const key = body?.key;
  if (typeof key !== "string" || key.length < MIN_KEY_LENGTH) {
    return err("key required", 400);
  }
  if (!hasAccessKeysConfigured(env)) {
    console.error("[auth] ⛔ ninguna ACCESS_KEY configurada en el worker");
    return err("Access key auth not configured", 503);
  }

  const userId = await resolveAccessKey(key, env);
  if (!userId) {
    // Los fallos no van a events: events.user_id tiene FK a users y aquí no hay usuario.
    console.warn("[auth] clave de acceso rechazada", {
      ip: request.headers.get("CF-Connecting-IP") || "unknown",
    });
    return err("Invalid access key", 401);
  }

  const user = await loadUser(env, userId);
  if (!user) return err("Access key user missing in D1", 500);
  return issueToken(env, request, user, "access_key");
}

export default async function handleAuth(request, env, url, _userId) {
  if (request.method !== "POST") return err("Method not allowed", 405);
  if (!checkAuthRateLimit(request)) return err("Too many auth attempts", 429);

  if (url.pathname === "/api/auth/token") return handleAccessKeyLogin(request, env);
  if (url.pathname === "/api/auth/login") return handleGoogleLogin(request, env);
  return err("Not found", 404);
}
```

- [ ] **Paso 2: verificar en local que el worker arranca y responde**

```bash
npx wrangler dev --local --port 8788
```
En otra terminal:
```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:8788/api/auth/token \
  -H 'Content-Type: application/json' -d '{"key":"corta"}'          # → 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:8788/api/auth/token \
  -H 'Content-Type: application/json' -d '{"key":"'"$(printf 'Z%.0s' {1..43})"'"}'   # → 503 (sin secrets en local)
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8788/api/auth/token        # → 405
```
Cerrar `wrangler dev` al terminar.

- [ ] **Paso 3: lint**

```bash
npx eslint workers/
```
Esperado: exit 0, sin errores nuevos.

- [ ] **Paso 4: presentar el commit a Edu**

```bash
git add workers/routes/auth.js
git commit -m "feat(auth): endpoint /api/auth/token y auditoria auth_login (ADR-028)"
```

---

## Tarea 4 — Los eventos de login no contaminan la Timeline

**Archivos**
- Modificar: `workers/routes/events.js:26-40` (bloque `GET /api/events` completo)

**Interfaces**
- Consume: nada nuevo.
- Produce: `GET /api/events` sin `?type=` ya no devuelve eventos `auth_*`.
  `GET /api/events?type=auth_login` sí los devuelve.

> Sin esto, `Timeline.jsx:58` clasifica `auth_login` como evento de módulo "system" y los
> logins aparecen en el feed de la pareja.

- [ ] **Paso 1: sustituir el bloque `GET /api/events` completo**

```js
  // GET /api/events
  if (method === "GET" && url.pathname === "/api/events") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
    const type = url.searchParams.get("type");
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");
    let q = "SELECT * FROM events WHERE 1=1";
    const binds = [];
    if (type) {
      q += " AND event_type = ?1";
      binds.push(type);
    } else {
      // ADR-028: la auditoría de login no es feed. Solo sale si se pide por ?type=.
      q += " AND event_type NOT LIKE 'auth\\_%' ESCAPE '\\'";
    }
    if (since) { q += ` AND created_at >= ?${binds.length + 1}`; binds.push(since); }
    if (until) { q += ` AND created_at <= ?${binds.length + 1}`; binds.push(until); }
    q += ` ORDER BY created_at DESC LIMIT ?${binds.length + 1}`;
    binds.push(limit);
    const { results } = await env.DB.prepare(q).bind(...binds).all();
    return json(results);
  }
```

- [ ] **Paso 2: lint + build**

```bash
npx eslint workers/
npm run build
```
Esperado: ambos exit 0.

- [ ] **Paso 3: presentar el commit a Edu**

```bash
git add workers/routes/events.js
git commit -m "fix(events): excluir auditoria auth_ del feed de eventos"
```

---

## Tarea 5 — Secrets, deploy y verificación en producción (ejecuta **Edu**)

**Archivos:** ninguno. Es la puerta de calidad de todo el backend: **si esta tarea no da
200, no se empieza el frontend.**

- [ ] **Paso 1: confirmar dónde vive `JWT_SECRET`**

```bash
npx wrangler secret list
```
Esperado: aparece `JWT_SECRET`. Si aparece bajo un `--env` concreto, los secrets nuevos van
al mismo `--env`.

- [ ] **Paso 2: generar dos claves (no pegarlas en ningún archivo)**

```bash
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='   # → clave del agente
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='   # → clave de Edu
```

- [ ] **Paso 3: instalar los secrets (interactivo: pega cada clave cuando la pida)**

```bash
npx wrangler secret put ADMIN_ACCESS_KEY
npx wrangler secret put EDU_ACCESS_KEY
npx wrangler secret list          # → JWT_SECRET, ADMIN_ACCESS_KEY, EDU_ACCESS_KEY
```

- [ ] **Paso 4: desplegar el worker**

```bash
npx wrangler deploy
```

- [ ] **Paso 5: verificación por artefacto (DoD §7 del contrato, puntos 1, 2 y 5)**

Exporta la clave del agente en la sesión de terminal (no en un archivo):
```bash
export BUNKER_ADMIN_KEY='<clave del agente>'
API=https://el-bunker-api.thebunker-admin.workers.dev

JWT=$(curl -s -X POST "$API/api/auth/token" -H 'Content-Type: application/json' \
      -d "{\"key\":\"$BUNKER_ADMIN_KEY\"}" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

curl -s -o /dev/null -w 'eras     %{http_code}\n' "$API/api/eras"    -H "Authorization: Bearer $JWT"
curl -s -o /dev/null -w 'entries  %{http_code}\n' "$API/api/entries" -H "Authorization: Bearer $JWT"
curl -s -o /dev/null -w 'anon     %{http_code}\n' "$API/api/eras"
curl -s -o /dev/null -w 'malakey  %{http_code}\n' -X POST "$API/api/auth/token" \
     -H 'Content-Type: application/json' -d '{"key":"00000000000000000000000000000000"}'
curl -s -X POST "$API/api/upload" -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' \
     -d '{"prefix":"vault/photos","filename":"prueba.jpg","content_type":"image/jpeg"}' | head -c 200; echo
```
Esperado: `eras 200`, `entries 200`, `anon 401`, `malakey 401`, y el upload devuelve JSON con
`upload_url`.

- [ ] **Paso 6: verificar que el login de David sigue vivo (DoD §7 punto 4)**

David entra en la app con Google como siempre. Esperado: VAULT carga con sus datos, sin
cambios visibles.

- [ ] **Paso 7: verificar la auditoría**

```bash
npx wrangler d1 execute el-bunker-db --remote --command \
  "SELECT created_at, user_id, payload FROM events WHERE event_type='auth_login' ORDER BY created_at DESC LIMIT 5"
```
Esperado: filas con `user_id` `admin` (agente) y `david`/`edu` (Google), con `method` en el
payload.

---

## Tarea 6 — Sesión sin Google en VaultContext

**Archivos**
- Modificar: `src/core/VaultContext.jsx` — bloques completos: estado del provider, efecto de
  boot (206-246), `_fetchJwt` (249-276), listener de caducidad (370-389), `_fetchUserAndDb`
  (392-456), `_onSignedOut` (463-477), `refreshDb` (555-573), `patchDb` (580-590) y el objeto
  `value` del provider.

**Interfaces**
- Consume: `POST /api/auth/token` (Tarea 3).
- Produce, en el contexto: `sessionKind: "google"|"access_key"|null` y
  `loginWithAccessKey(key: string, opts?: {remember?: boolean}) => Promise<{ok: boolean, error?: string}>`.

- [ ] **Paso 1: añadir estado de sesión y helpers de persistencia**

Junto a los `useState` del provider (tras `jwtToken`, línea 126):

```js
  // ADR-028: cómo se entró — Google o clave de acceso.
  const [sessionKind, setSessionKind] = useState(null);
  const sessionKindRef = useRef(null);
```

Y, antes del efecto de boot, estos cuatro helpers:

```js
  // ── ADR-028: helpers de sesión ─────────────────────────────
  const _setSessionKind = useCallback((kind) => {
    sessionKindRef.current = kind;
    setSessionKind(kind);
    try {
      if (kind) sessionStorage.setItem("bunker_session_kind", kind);
      else sessionStorage.removeItem("bunker_session_kind");
    } catch { /* modo privado */ }
  }, []);

  /** ¿Hay sesión? Google O clave. Se lee del ref: los callbacks tienen deps []. */
  const _hasSession = useCallback(
    () => isAuthenticated() || sessionKindRef.current === "access_key",
    []
  );

  /** Aplica un JWT a todos los clientes que lo necesitan. */
  const _applyJwt = useCallback((token) => {
    setJwtToken(token);
    try { sessionStorage.setItem("bunker_jwt", token); } catch { /* modo privado */ }
    workerClient.setToken(token);
    setUploadToken(token);
    setStatsToken(token);
  }, []);

  /** Guarda el usuario de la sesión y, si Edu lo pidió, la clave en este dispositivo. */
  const _persistAccessSession = useCallback((fullUser, keyToRemember) => {
    try {
      sessionStorage.setItem("bunker_user", JSON.stringify(fullUser));
      if (keyToRemember) localStorage.setItem("bunker_access_key", keyToRemember);
      else localStorage.removeItem("bunker_access_key");
    } catch { /* modo privado */ }
  }, []);
```

- [ ] **Paso 2: extraer la cola común de arranque de sesión**

`_fetchUserAndDb` termina construyendo la db y dejando la app en `READY`. Esa cola la
necesitan los dos caminos de login, así que se extrae. Añadir tras `_buildDbFromWorker`:

```js
  /**
   * _completeSession(fullUser, jwt)
   * Cola común a los dos logins: fija el usuario, construye la db desde D1
   * y deja la app en READY. No sabe nada de cómo se consiguió el JWT.
   */
  const _completeSession = useCallback(async (fullUser, jwt) => {
    setUser(fullUser);
    let data = jwt ? await _buildDbFromWorker(jwt) : null;
    if (data) {
      data.libraries = [];
      data.heartbeat = new Date().toISOString();
      data.adventures_start_date = data.adventures_start_date ?? DEFAULT_ADVENTURE_DATE;
      console.info("[Búnker] DB cargada desde Worker API (D1) ✓");
    } else {
      console.info("[Búnker] Worker no disponible, usando DB vacía como fallback...");
      data = EMPTY_DB();
    }
    setDb(data);
    setLastHeartbeat(data.heartbeat ?? new Date().toISOString());
    setDbStatus("ONLINE");
    setBootPhase(BOOT.READY);
    _scheduleHeartbeat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_buildDbFromWorker]);
```

Y sustituir en `_fetchUserAndDb` todo el bloque que va desde `// S64: Worker API como fuente
PRIMARIA` (línea 424) hasta `_scheduleHeartbeat();` (línea 448) por:

```js
      _setSessionKind("google");
      await _completeSession(fullUser, jwt);
```

(`setUser(fullUser)` de la línea 415 pasa a hacerlo `_completeSession`; elimínalo del sitio
antiguo para no duplicarlo.)

- [ ] **Paso 3: reescribir `_fetchJwt` para usar `_applyJwt`**

```js
  const _fetchJwt = useCallback(async (email, googleToken) => {
    if (!email || !googleToken) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, google_token: googleToken }),
      });
      if (!res.ok) {
        console.warn("[Búnker] JWT login failed:", res.status);
        return null;
      }
      const { token } = await res.json();
      if (!token) return null;
      _applyJwt(token);
      console.info("[Búnker] JWT obtenido ✓");
      return token;
    } catch (e) {
      console.warn("[Búnker] JWT fetch error:", e.message);
      return null;
    }
  }, [_applyJwt]);
```

- [ ] **Paso 4: implementar `loginWithAccessKey`**

Junto a las demás acciones públicas de auth (antes de `login`, línea 534):

```js
  /**
   * loginWithAccessKey(key, { remember })
   * ADR-028 — entra sin Google canjeando la clave por un JWT.
   * Devuelve { ok, error } en vez de lanzar: la pantalla de login pinta el error.
   */
  const loginWithAccessKey = useCallback(async (key, { remember = false } = {}) => {
    const cleanKey = (key ?? "").trim();
    if (!cleanKey) return { ok: false, error: "Introduce la clave de acceso." };

    setBootPhase(BOOT.INIT_SERVICES);
    setBootError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey }),
      });
      if (!res.ok) {
        const msg =
          res.status === 401 ? "Clave de acceso no válida." :
          res.status === 429 ? "Demasiados intentos. Espera un minuto." :
          res.status === 503 ? "El acceso por clave no está configurado en el worker." :
          `Error de acceso (${res.status}).`;
        setBootPhase(BOOT.IDLE);
        setBootError(msg);
        return { ok: false, error: msg };
      }

      const { token, user: apiUser } = await res.json();
      const fullUser = { ...apiUser, avatar: null };
      _applyJwt(token);
      _persistAccessSession(fullUser, remember ? cleanKey : null);
      _setSessionKind("access_key");
      setBootPhase(BOOT.INIT_DB);
      setDbStatus("SYNCING");
      await _completeSession(fullUser, token);
      return { ok: true };
    } catch (e) {
      const msg = "No se pudo contactar con el worker: " + (e?.message ?? e);
      console.error("[Búnker] Access key login error:", e);
      setBootPhase(BOOT.IDLE);
      setBootError(msg);
      return { ok: false, error: msg };
    }
  }, [_applyJwt, _persistAccessSession, _setSessionKind, _completeSession]);
```

- [ ] **Paso 5: restaurar la sesión por clave ANTES de inicializar Google**

Añadir el restaurador y reescribir el efecto de boot (206-246):

```js
  /**
   * _tryRestoreAccessSession()
   * Sesión por clave restaurada desde el navegador. Se intenta ANTES que Google:
   * en un navegador embebido o con accounts.google.com bloqueado,
   * initGoogleServices() manda la app a ERROR y no llegaríamos a ofrecer nada.
   */
  const _tryRestoreAccessSession = useCallback(async () => {
    let savedJwt = null, savedUser = null, savedKind = null, savedKey = null;
    try {
      savedJwt  = sessionStorage.getItem("bunker_jwt");
      savedKind = sessionStorage.getItem("bunker_session_kind");
      savedUser = JSON.parse(sessionStorage.getItem("bunker_user") || "null");
      savedKey  = localStorage.getItem("bunker_access_key");
    } catch { /* modo privado */ }

    if (savedKind === "access_key" && savedJwt && savedUser) {
      _applyJwt(savedJwt);
      _setSessionKind("access_key");
      setBootPhase(BOOT.INIT_DB);
      setDbStatus("SYNCING");
      await _completeSession(savedUser, savedJwt);
      return true;
    }
    if (savedKey) {
      const { ok } = await loginWithAccessKey(savedKey, { remember: true });
      return ok;
    }
    return false;
  }, [_applyJwt, _setSessionKind, _completeSession, loginWithAccessKey]);

  // ── Step 1: sesión por clave → si no, servicios de Google ──
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setBootPhase(BOOT.INIT_SERVICES);
      try {
        // ADR-028: camino sin Google. Si prende, no se toca gapi en absoluto.
        if (await _tryRestoreAccessSession()) return;
        if (cancelled) return;

        await initGoogleServices();
        if (cancelled) return;

        onAuthChange(({ event, token, error, translated }) => {
          if (event === "SIGNED_IN"  && !cancelled) _onSignedIn(token);
          if (event === "SIGNED_OUT" && !cancelled) _onSignedOut();
          if (event === "AUTH_ERROR" && !cancelled) {
            console.error("[Búnker] Auth error:", error);
            const friendly = translated?.msg ?? error?.error_description ?? "Error de autenticación";
            const actionHint = translated?.action ? ` · ${translated.action}` : "";
            setBootPhase(BOOT.ERROR);
            setBootError(friendly + actionHint);
          }
        });

        if (isAuthenticated()) {
          await _fetchUserAndDb();
        } else if (restoreToken()) {
          await _fetchUserAndDb();
        } else {
          setBootPhase(BOOT.IDLE);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[Búnker] Boot failed:", err);
          setBootPhase(BOOT.ERROR);
          setBootError(err.message ?? "No se pudieron cargar los servicios de Google.");
        }
      }
    };

    boot();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Paso 6: caducidad del JWT en sesión por clave**

Reescribir el `handler` del listener `bunker_jwt_expired` (370-389):

```js
    const handler = async () => {
      if (Date.now() - lastJwtExpiredRef.current < 30_000) return;
      lastJwtExpiredRef.current = Date.now();

      // ADR-028: sesión por clave — re-canjear si Edu la recordó; si no, volver al login.
      if (sessionKindRef.current === "access_key") {
        let savedKey = null;
        try { savedKey = localStorage.getItem("bunker_access_key"); } catch { /* modo privado */ }
        if (savedKey) {
          console.info("[Búnker] ♻ Re-canjeando clave de acceso (JWT expirado)...");
          await loginWithAccessKey(savedKey, { remember: true });
          return;
        }
        console.warn("[Búnker] Sesión por clave caducada — hay que reintroducir la clave");
        _onSignedOut();
        setBootError("Sesión caducada — vuelve a introducir la clave de acceso.");
        return;
      }

      const googleToken = window.gapi?.client?.getToken?.()?.access_token;
      if (!user?.email || !googleToken) {
        console.warn("[Búnker] JWT expirado sin Google token — recarga manual necesaria");
        return;
      }
      console.info("[Búnker] ♻ Re-autenticando silenciosamente (JWT expirado)...");
      await _fetchJwt(user.email, googleToken);
    };
```

- [ ] **Paso 7: limpiar la sesión por clave al salir**

En `_onSignedOut` (463-477), tras `sessionStorage.removeItem("bunker_jwt");`:

```js
    _setSessionKind(null);
    try {
      sessionStorage.removeItem("bunker_user");
      localStorage.removeItem("bunker_access_key");
    } catch { /* modo privado */ }
```

- [ ] **Paso 8: los gates dejan de preguntar por Google**

`refreshDb` (556) y `patchDb` (581): sustituir `if (!isAuthenticated()) return;` por
`if (!_hasSession()) return;` en **ambos**, y añadir `_hasSession` a sus arrays de deps.

> Sin el de `patchDb`, una sesión por clave arranca pero **todas** las actualizaciones
> optimistas de la UI son no-ops silenciosos: se ve la app, no se puede usar. Es el fallo
> más probable de esta tarea; compruébalo explícitamente en el Paso 10.

- [ ] **Paso 9: exponer lo nuevo en el `value` del provider**

En el objeto que devuelve el provider, junto a `login`, añadir `loginWithAccessKey`, y junto
a `authStatus`, añadir `sessionKind`.

- [ ] **Paso 10: verificar build, lint y tests**

```bash
npm run build
npx eslint src/
npm run test
```
Esperado: build OK, eslint exit 0 (sin warnings nuevos de `react-hooks/exhaustive-deps`),
tests en verde (12/12 previos + 11 nuevos de worker).

- [ ] **Paso 11: presentar el commit a Edu**

```bash
git add src/core/VaultContext.jsx
git commit -m "feat(auth): sesion por clave de acceso en VaultContext (ADR-028)"
```

---

## Tarea 7 — Panel de acceso en LoginScreen

**Archivos**
- Modificar: `src/layout/LoginScreen.jsx` — añadir el componente `AccessPanel` y montarlo en
  el bloque CTA (449-475). Nada más se toca.

**Interfaces**
- Consume: `onAccessKeyLogin(key, { remember }) => Promise<{ok, error}>` (Tarea 6).
- Produce: nueva prop opcional `onAccessKeyLogin` en `LoginScreen`. Si no se pasa, el panel
  no se renderiza (la pantalla sigue funcionando igual que hoy).

- [ ] **Paso 1: añadir el componente `AccessPanel`**

Antes de `// ─── ERROR BANNER ───`:

```jsx
// ─── ACCESS PANEL (ADR-028) ──────────────────────────────────
/**
 * Entrada alternativa sin Google: canjea una clave de acceso por un JWT.
 * Discreta a propósito — no es la puerta principal de la app.
 */
const AccessPanel = ({ onSubmit }) => {
  const [open, setOpen]         = useState(false);
  const [accessKey, setKey]     = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy]         = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !accessKey.trim()) return;
    setBusy(true);
    await onSubmit?.(accessKey.trim(), { remember });
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs tracking-[0.25em] uppercase opacity-30 hover:opacity-70 transition-opacity min-h-[44px] px-4"
        style={{ color: ACID, fontFamily: FONT }}
      >
        › ACCESO TEST / ADMIN
      </button>
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto flex flex-col gap-3 px-4 py-4 rounded-sm"
      style={{
        background: "rgba(191,255,0,0.03)",
        border: `1px solid ${ACID}22`,
        fontFamily: FONT,
      }}
    >
      <label
        htmlFor="bunker-access-key"
        className="text-xs tracking-[0.3em] uppercase opacity-40"
        style={{ color: ACID }}
      >
        CLAVE DE ACCESO
      </label>

      <input
        id="bunker-access-key"
        type="password"
        autoComplete="off"
        spellCheck="false"
        value={accessKey}
        onChange={(e) => setKey(e.target.value)}
        disabled={busy}
        className="w-full px-3 py-3 text-sm rounded-sm outline-none"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${ACID}33`,
          color: ACID,
          fontFamily: FONT,
          letterSpacing: "0.15em",
        }}
      />

      <label className="flex items-center gap-2 text-xs opacity-40 cursor-pointer" style={{ color: ACID }}>
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          disabled={busy}
        />
        <span className="tracking-widest uppercase">RECORDAR EN ESTE DISPOSITIVO</span>
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !accessKey.trim()}
          className="flex-1 text-xs tracking-[0.3em] uppercase py-3 min-h-[44px] rounded-sm"
          style={{
            color: ACID,
            border: `1px solid ${ACID}${busy || !accessKey.trim() ? "22" : "66"}`,
            background: `${ACID}0a`,
            fontFamily: FONT,
            cursor: busy || !accessKey.trim() ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "VERIFICANDO..." : "ENTRAR →"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setKey(""); }}
          disabled={busy}
          className="text-xs tracking-[0.3em] uppercase py-3 px-4 min-h-[44px] opacity-40"
          style={{ color: ACID, fontFamily: FONT }}
        >
          ✕
        </button>
      </div>
    </motion.form>
  );
};
```

- [ ] **Paso 2: montar el panel y aceptar la nueva prop**

Firma del componente:

```jsx
export default function LoginScreen({ onLogin, onAccessKeyLogin, isLoading = false, error = null }) {
```

Y dentro del bloque CTA, entre `<AccessButton ... />` y `{error && <ErrorBanner .../>}`:

```jsx
              {onAccessKeyLogin && <AccessPanel onSubmit={onAccessKeyLogin} />}
```

- [ ] **Paso 3: build + lint**

```bash
npm run build
npx eslint src/
```
Esperado: exit 0 los dos.

- [ ] **Paso 4: presentar el commit a Edu**

```bash
git add src/layout/LoginScreen.jsx
git commit -m "feat(ui): panel de acceso test/admin en LoginScreen (ADR-028)"
```

---

## Tarea 8 — Conectar App.jsx y verificar la app entera

**Archivos**
- Modificar: `src/layout/App.jsx:68-83` (componente `AppCore` completo)

**Interfaces**
- Consume: `loginWithAccessKey` del contexto (Tarea 6), `onAccessKeyLogin` de
  `LoginScreen` (Tarea 7).
- Produce: nada nuevo.

- [ ] **Paso 1: pasar la acción a la pantalla de login**

```jsx
const AppCore = () => {
  const { authStatus, bootPhase, bootError, isLoading, login, loginWithAccessKey, user, db, jwtToken } = useVault();

  if (isLoading) return <GlobalLoadingScreen phase={bootPhase} />;

  if (authStatus === "unauthorized") {
    return <UnauthorizedScreen userEmail={user?.email} />;
  }

  if (authStatus === "error") {
    return <ErrorScreen message={bootError} onRetry={() => window.location.reload()} />;
  }

  if (authStatus !== "authenticated") {
    return (
      <LoginScreen
        onLogin={login}
        onAccessKeyLogin={loginWithAccessKey}
        isLoading={false}
        error={bootError}
      />
    );
  }
```
(El resto de `AppCore` queda igual.)

- [ ] **Paso 2: build, lint y tests completos**

```bash
npm run build
npx eslint src/ workers/
npm run test
```
Esperado: los tres exit 0.

- [ ] **Paso 3: verificar que no se tocó nada congelado**

```bash
git diff --stat <commit_base>..HEAD
```
Esperado: **no** aparecen `WinampPlayer.jsx`, `AudioVisualizer.jsx`, `PlayerContext.jsx`,
`tokens.js` ni `workers/utils/auth.js`.

- [ ] **Paso 4: prueba manual en la app desplegada (la hace Edu)**

1. Abrir la app en un navegador **sin sesión de Google** (o en incógnito).
2. "› ACCESO TEST / ADMIN" → pegar la clave de Edu → ENTRAR.
3. Comprobar: VAULT carga eras y entradas reales; la Timeline **no** muestra eventos de
   login; crear una nota funciona (esto valida el gate de `patchDb`); recargar la página
   mantiene la sesión si se marcó "recordar" y la pide si no.
4. David entra por Google: sin cambios.

- [ ] **Paso 5: presentar el commit a Edu**

```bash
git add src/layout/App.jsx
git commit -m "feat(ui): conectar acceso por clave en App"
```

---

## Tarea 9 — Documentación y canon

**Archivos**
- Crear: `docs/operacional/ACCESO_TEST_ADMIN.md`
- Modificar: `AGENTS.md` (una fila), `docs/Nucleo/CONTRATO.md` (ADR-028 + enmienda ADR-025),
  `docs/Nucleo/ESTADO.md`, `docs/Nucleo/BACKLOG.md`, `docs/Arquitectura/INDEX.md`

> Los docs los edita Sonnet directamente (REGLAS.md: los docs son trabajo de coordinación).
> El ADR necesita **OK explícito de Edu** antes de tocar `CONTRATO.md`.

- [ ] **Paso 1: escribir el manual del mecanismo**

Crear `docs/operacional/ACCESO_TEST_ADMIN.md` con estas secciones, sin ninguna clave real:

1. **Qué es** — dos frases + enlace a `docs/spec/SPEC_ACCESO_TEST_ADMIN_2026-08-02.md`.
2. **Para el agente** — exportar `BUNKER_ADMIN_KEY`, el `curl` de canje y el de uso
   (copiar de la SPEC §8).
3. **Para Edu en la app** — "› ACCESO TEST / ADMIN", qué hace "recordar en este
   dispositivo" y por qué viene desmarcado.
4. **Rotación y revocación** — copiar de la SPEC §7, incluida la opción nuclear
   (`JWT_SECRET` nuevo tumba también la sesión de David).
5. **Auditoría** — la consulta `wrangler d1 execute` de `auth_login` y dónde ver los
   intentos fallidos (logs del worker, `head_sampling_rate = 1`).
6. **Qué NO es** — no es un bypass de `authenticate()`; no hay clave para David; la clave
   nunca va al repo ni a un commit.

- [ ] **Paso 2: una fila en `AGENTS.md`** (tabla MAPA DE DOCS, mantener el archivo magro)

```markdown
| docs/operacional/ACCESO_TEST_ADMIN.md | Acceso test/admin sin Google (ADR-028) |
```

- [x] **Paso 3: ~~pedir a Edu el OK para el ADR y aplicarlo~~ — HECHO 2-ago-2026**

Edu dio el OK el mismo día. Ya aplicado en `docs/Nucleo/CONTRATO.md`: ADR-028 nuevo (marcado
como *implementación pendiente*), enmienda del ADR-025, reformulación de la fila 🔒-6 y fila
en el RESUMEN (28 ADRs). El contrato origen quedó archivado en
`docs/operacional/CONTRATO_ACCESO_TEST_ADMIN_2026-08-02.md`.
**Al cerrar la implementación:** quitar la nota "implementación pendiente" del ADR-028.

- [ ] **Paso 4: cerrar el checklist de tarea de REGLAS.md**

- `docs/Nucleo/ESTADO.md` — mecanismo desplegado + qué desbloquea (subida PRUEBA,
  t_c316b835).
- `docs/Nucleo/BACKLOG.md` — fila en RESUELTOS.
- `docs/Arquitectura/INDEX.md` — marcar stale lo que describa el flujo de auth
  (`architecture.md`, `data-flow.md`, `state-map.md` si lo mencionan).

- [ ] **Paso 5: presentar el commit a Edu**

```bash
git add docs/ AGENTS.md
git commit -m "docs: manual y ADR-028 del acceso test/admin"
```

---

## Cierre: DoD del contrato §7, punto por punto

| # | Criterio | Dónde se verifica |
|---|---|---|
| 1 | JWT sin Google, comando reproducible | Tarea 5 paso 5 + manual §2 |
| 2 | `/api/eras` 200, upload 201, `/api/entries` 200 | Tarea 5 paso 5 |
| 3 | Edu entra a la app sin Google | Tarea 8 paso 4 |
| 4 | El login de David sigue funcionando | Tarea 5 paso 6 y Tarea 8 paso 4 |
| 5 | Secret fuera del repo + rotación documentada | Tarea 5 pasos 2-3 + manual §4 |
| 6 | build limpio, lint 0, tests verdes | Tarea 8 paso 2 |
| 7 | Ningún archivo congelado tocado | Tarea 8 paso 3 |
| 8 | ADR + sección en el manual | Tarea 9 |
