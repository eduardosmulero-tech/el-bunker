# SPEC — Acceso de testing y admin sin Google OAuth

> Fase del pipeline: **SPEC**. Escrita por Opus el 2-ago-2026 bajo
> `CONTRATO_ACCESO_TEST_ADMIN_2026-08-02.md`.
> Plan de implementación: `docs/planes/PLAN_ACCESO_TEST_ADMIN_2026-08-02.md`.
> Normativo por encima de esta spec: `docs/Nucleo/CONTRATO.md` y `docs/Nucleo/REGLAS.md`.

---

## 1. Veredicto de diseño

**Diseño elegido: emisor alternativo de JWT (clave de acceso → JWT), candidato 1 corregido.**

Se añade un **segundo endpoint que emite el MISMO JWT** que ya emite el login de Google:
`POST /api/auth/token`, que recibe una clave de acceso de alta entropía y devuelve un JWT
firmado con `JWT_SECRET`, idéntico en forma y caducidad al que hoy emite
`POST /api/auth/login`. Cada clave está atada a un usuario de la whitelist (ADR-006) y vive
como secret del worker.

**La corrección sobre el candidato 1 del contrato es dónde se comprueba la clave.** El
contrato proponía comprobar un `ADMIN_TOKEN` dentro de `authenticate()`. Eso es peor:

| | Token comprobado en `authenticate()` (candidato 1 literal) | Clave canjeada en `/api/auth/token` (elegido) |
|---|---|---|
| Superficie | La credencial permanente viaja en **cada** request de la API | Viaja **una vez**, solo contra el endpoint de canje |
| `authenticate()` | Se modifica el único punto que protege 14 rutas | **No se toca**: sigue siendo "JWT válido o nada" |
| Caducidad | Ninguna — el token vale para siempre | 24 h (`JWT_EXPIRY`), igual que Google |
| Identidad | Hay que inventar un `userId` sintético dentro del middleware | `sub` sale de la tabla `users` de D1, como en Google |
| Revocación | Rotar el secret | Rotar/borrar el secret; los JWT vivos mueren en ≤24 h |
| Auditoría | Imposible distinguir sesión de request | Un evento por emisión (ADR-019) |

Es decir: **una sola puerta de entrada a la API (JWT), dos formas de conseguir la llave**.
Esa es la diferencia entre "mecanismo de auth" y "backdoor".

**Candidatos descartados**

- **(2) Usuario/contraseña en D1.** Rechazado por desproporcionado: obliga a tabla de
  credenciales, hashing PBKDF2 en el worker, flujo de cambio/reseteo y sesiones, para dos
  humanos que ya tienen identidad en `users`. Una clave aleatoria de 256 bits **es** una
  contraseña, con la ventaja de no necesitar reseteo (se rota con `wrangler secret put`) y
  de no persistir credenciales en la base de datos del proyecto. Si algún día hace falta
  auth propia completa, este diseño es su primer escalón, no un obstáculo.
- **(3) OAuth de Google con redirect en vez de popup.** Rechazado **como solución**: no
  desbloquea nada de lo pedido para el agente (un navegador headless no puede completar el
  consentimiento de Google ni tiene sesión iniciada) y deja el acceso dependiendo de un
  tercero. Sigue siendo una mejora legítima del flujo de Google para Edu/David en el móvil,
  pero es **otro trabajo** — fuera del alcance de este contrato (§8 del contrato).
- **(4) Combinación.** El diseño elegido ya es una combinación sana: mismo mecanismo para
  API (curl) y UI (pantalla de login), un solo camino de código que mantener.

**Coste asumido y declarado:** existe una credencial permanente por usuario en el secret
store de Cloudflare. Quien la tenga entra como ese usuario. Se mitiga con: entropía de 256
bits, comparación en tiempo constante sobre hash, rate limit específico del endpoint de
auth, evento de auditoría por emisión, y procedimiento de rotación documentado (§7).

---

## 2. Arquitectura

```
                     ┌──────────────────────────────────────────┐
   Google (David,    │  POST /api/auth/login                    │
   Edu si quiere) ──▶│    verifica access_token contra Google   │──┐
                     │    whitelist por email (ADR-006)         │  │
                     └──────────────────────────────────────────┘  │
                                                                   ├──▶ signJWT({sub,email,method})
                     ┌──────────────────────────────────────────┐  │      JWT_SECRET · 24 h
   Clave de acceso   │  POST /api/auth/token                    │  │
   (Hermes, Edu)  ──▶│    sha256(clave) vs sha256(secret)       │──┘
                     │    clave ↦ user_id (admin | edu)         │
                     └──────────────────────────────────────────┘
                                                                   │
                                        ┌──────────────────────────▼─────────┐
                                        │ authenticate()  — SIN CAMBIOS      │
                                        │ Bearer JWT → payload.sub → userId  │
                                        └────────────────────────────────────┘
```

Invariante que se conserva: **ninguna ruta de la API acepta nada que no sea un JWT válido
firmado con `JWT_SECRET`**. `workers/utils/auth.js` no se modifica en toda la
implementación.

---

## 3. Contrato de API

### 3.1 `POST /api/auth/token` (nuevo)

Sin autenticación previa. `Content-Type: application/json`.

**Request**
```json
{ "key": "<clave de acceso, ≥32 caracteres>" }
```

**200 OK**
```json
{
  "token": "<JWT HS256, exp = now + 24h>",
  "user": { "id": "admin", "email": "thebunker.admin@gmail.com", "name": "Admin", "role": "admin" }
}
```

**Errores**

| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | Falta `key`, no es string o mide <32 | `{"error":"key required"}` |
| 401 | La clave no corresponde a ningún secret configurado | `{"error":"Invalid access key"}` |
| 405 | Método ≠ POST | `{"error":"Method not allowed"}` |
| 429 | >10 intentos/60 s desde la misma IP | `{"error":"Too many auth attempts"}` |
| 500 | `JWT_SECRET` ausente en producción | `{"error":"JWT_SECRET not configured"}` |
| 503 | Ningún secret de clave configurado en el worker | `{"error":"Access key auth not configured"}` |

El 401 es **idéntico** para "clave inexistente" y "clave equivocada": el error nunca revela
qué claves existen ni cuántas.

### 3.2 `POST /api/auth/login` (existente, se conserva)

Comportamiento funcional intacto: mismo request, mismo `token`. Dos añadidos no rompientes:
`user` pasa a incluir `name` y `role` (hoy solo `id` y `email`; el frontend hoy solo lee
`token`, verificado en `VaultContext.jsx:261`), y el payload del JWT lleva
`method: "google"`. **El flujo de David no cambia.**

### 3.3 Payload del JWT

```json
{ "sub": "admin", "email": "thebunker.admin@gmail.com", "method": "access_key", "exp": 1754200000 }
```

`verifyJWT()` sigue devolviendo solo `payload.sub` (`workers/utils/auth.js:57`), así que
ninguna ruta existente cambia de comportamiento. `method` queda disponible para políticas
futuras (p. ej. exigir Google para operaciones destructivas) sin necesitar migración.

### 3.4 `GET /api/events` (modificación defensiva)

Los eventos de auditoría de login **no son memorias de la pareja** y no deben aparecer en
la Timeline. Hoy `Timeline.jsx:58` mete en el módulo "system" todo `event_type` que no
empiece por `entry_|track_|drop_|smoke_|era_|playlist_`, así que un `auth_login` se
colaría en el feed. Se excluyen **en el servidor** (un solo sitio, protege a Timeline y a
cualquier consumidor futuro): `GET /api/events` sin parámetro `type` explícito no devuelve
`event_type LIKE 'auth\_%'`. Con `?type=auth_login` sí los devuelve (consulta de auditoría
deliberada).

---

## 4. Claves de acceso: modelo

Dos secrets, uno por identidad. Una identidad por clave — nunca una clave compartida.

| Secret del worker | `user_id` emitido | Para quién |
|---|---|---|
| `ADMIN_ACCESS_KEY` | `admin` | Agente (Hermes), scripts, verificación por artefacto |
| `EDU_ACCESS_KEY` | `edu` | Edu, entrada a la app sin Google |

- **No existe clave para David** (requisito del contrato: su flujo no se toca).
- Un secret ausente = esa puerta no existe. Borrarlo es la revocación instantánea de esa
  identidad, sin tocar código ni afectar a las demás.
- La comparación es sobre `SHA-256` hex de ambos lados, byte a byte con XOR acumulado
  (tiempo constante, longitud constante de 64 chars → no filtra la longitud de la clave).
  Se recorren **todos** los bindings sin `break`, para que el tiempo de respuesta no
  dependa de qué clave acertó.
- Longitud mínima 32 caracteres, exigida a los dos lados: si el secret configurado es más
  corto, ese binding se ignora (evita que una clave débil puesta a mano abra la puerta).

**Atribución de contenido.** El agente entra como `admin`; si un contenido debe figurar
como de Edu, se manda explícito en el body — `POST /api/entries` respeta `body.from_user`
sobre el `userId` del token (`workers/routes/entries.js:135`). No hace falta usar la clave
de Edu para eso.

---

## 5. Frontend: entrada sin Google

### 5.1 Flujo

```
LoginScreen
  ├─ botón "ACCEDER AL BÚNKER"  → login()               [Google, sin cambios]
  └─ enlace discreto "ACCESO TEST / ADMIN"
        └─ panel: input type=password + checkbox "recordar en este dispositivo"
              └─ loginWithAccessKey(key, { remember })
                    POST /api/auth/token
                    ├─ 200 → sesión lista (JWT + user + db desde D1) → READY
                    └─ 4xx → mensaje en el ErrorBanner existente, sigue en LoginScreen
```

### 5.2 Estado de sesión

Se introduce `sessionKind: "google" | "access_key" | null` en `VaultContext`. Es el
concepto que hoy falta: la app usa `isAuthenticated()` de `GoogleDriveService` (¿hay
access_token de Google?) como sinónimo de "hay sesión", y eso deja fuera cualquier otra
forma de entrar.

Puntos que dependen de ello y **deben** pasar a preguntar por la sesión, no por Google:

| Sitio | Hoy | Con la spec |
|---|---|---|
| `VaultContext.jsx:556` (`refreshDb`) | `if (!isAuthenticated()) return;` | `if (!_hasSession()) return;` |
| `VaultContext.jsx:581` (`patchDb`) | `if (!isAuthenticated()) return;` | `if (!_hasSession()) return;` |
| `VaultContext.jsx:227` (boot) | `isAuthenticated()` / `restoreToken()` | precedido del intento de sesión por clave |

`patchDb` es crítico: sin este cambio, una sesión por clave arrancaría y **todas las
actualizaciones optimistas de la UI serían no-ops silenciosos**. Es el fallo más probable
de una implementación descuidada.

`_hasSession()` lee un `useRef` (`sessionKindRef`), no el state, porque los callbacks
afectados tienen `deps: []` y capturarían un valor obsoleto.

### 5.3 Orden de arranque (importante para el caso de uso)

El boot actual llama a `initGoogleServices()` **antes que nada** y manda a `BOOT.ERROR` si
falla. En un navegador embebido o con `accounts.google.com` bloqueado —exactamente el
escenario de testing que motiva el contrato— eso tumba la app antes de poder ofrecer la
alternativa. Nuevo orden:

1. ¿Hay sesión por clave restaurable? (JWT + `user` en `sessionStorage`, o clave recordada
   en `localStorage`) → restaurar, construir db, `READY`. **Google no se inicializa.**
2. Si no: flujo actual de Google, idéntico al de hoy.

Con esto, la app entra en un navegador sin Google en absoluto.

### 5.4 Persistencia en el cliente

| Dato | Dónde | Vida |
|---|---|---|
| JWT | `sessionStorage.bunker_jwt` | Como hoy (S116) |
| `sessionKind` | `sessionStorage.bunker_session_kind` | Igual que el JWT |
| `user` (id/email/name/role) | `sessionStorage.bunker_user` | Igual que el JWT |
| Clave de acceso | `localStorage.bunker_access_key` | **Solo si Edu marca "recordar"** |

"Recordar" está **desmarcado por defecto** y es una decisión explícita del usuario: guarda
una credencial permanente en el dispositivo a cambio de no volver a teclearla en la PWA
(el `sessionStorage` de una PWA Android muere al cerrar la app). Se documenta como tal en
el manual, y su antídoto es la rotación del secret (§7). El agente **nunca** usa este
camino: lee la clave de una variable de entorno de la terminal de Edu.

### 5.5 Caducidad del JWT en sesión por clave

El listener de `bunker_jwt_expired` (`VaultContext.jsx:370-389`) hoy solo sabe
re-autenticar por Google. Con `sessionKind === "access_key"`:

- si hay clave recordada → re-canjea en silencio (misma llamada, mismo debounce de 30 s);
- si no la hay → cierra la sesión y vuelve a `LoginScreen` con el mensaje
  "Sesión caducada — vuelve a introducir la clave de acceso". Sin bucles: la sesión se
  limpia antes de renderizar.

---

## 6. Auditoría (ADR-019)

Cada **emisión** de JWT (Google y clave) escribe un evento con el helper existente
`emitEvent()` (`workers/utils/events.js`), fire-and-forget:

```
event_type  : "auth_login"
user_id     : "admin" | "edu" | "david"      (FK a users — las 3 filas existen, schema.sql:239)
entity_type : "session"
entity_id   : null
payload     : { "method": "access_key" | "google", "ip": "<CF-Connecting-IP>", "ua": "<User-Agent, 200 chars>" }
```

Los **intentos fallidos** no van a D1: `events.user_id` tiene FK a `users` y un fallo no
tiene usuario. Se registran con `console.warn("[auth] clave rechazada", { ip })` — la
observabilidad del worker está activa con `head_sampling_rate = 1` (`wrangler.toml:29-31`),
así que quedan en los logs de Cloudflare, que es donde debe mirarse un ataque.

Consulta de auditoría (Edu o el agente):

```bash
npx wrangler d1 execute el-bunker-db --remote --command \
  "SELECT created_at, user_id, payload FROM events WHERE event_type='auth_login' ORDER BY created_at DESC LIMIT 20"
```

---

## 7. Generación, rotación y revocación de claves

**Generar** (32 bytes aleatorios, 43 chars base64url):
```bash
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

**Instalar** (Edu, interactivo — pega la clave cuando la pida; nunca en el historial de
comandos, nunca en el repo):
```bash
npx wrangler secret list                       # confirmar en qué worker vive JWT_SECRET
npx wrangler secret put ADMIN_ACCESS_KEY       # mismo worker/env que JWT_SECRET
npx wrangler secret put EDU_ACCESS_KEY
```

> Verificación previa obligatoria: `wrangler secret list` debe mostrar `JWT_SECRET`. Los
> secrets nuevos van al **mismo worker y el mismo `--env`** que ese, o el endpoint
> responderá 503 en producción.

**Rotar** (misma orden `secret put` con una clave nueva): las sesiones ya emitidas siguen
vivas hasta 24 h. **Revocar de golpe** una identidad:
`npx wrangler secret delete EDU_ACCESS_KEY` → nadie puede volver a canjear con ella.
**Revocación inmediata de todas las sesiones vivas** (opción nuclear, tumba también a
David): `npx wrangler secret put JWT_SECRET` con un valor nuevo.

Higiene: la clave del agente vive en la terminal de Edu como variable de entorno
(`BUNKER_ADMIN_KEY`), no en un archivo del repo. `.gitignore` no necesita cambios porque no
se crea ningún archivo de credenciales.

---

## 8. Verificación por artefacto (DoD del contrato §7)

```bash
API=https://el-bunker-api.thebunker-admin.workers.dev

# 1) Canje de clave → JWT (sin Google)
JWT=$(curl -s -X POST "$API/api/auth/token" \
       -H 'Content-Type: application/json' \
       -d "{\"key\":\"$BUNKER_ADMIN_KEY\"}" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
echo "${JWT:0:20}..."                                   # → cabecera del JWT, no vacío

# 2) Lectura real de D1
curl -s -o /dev/null -w '%{http_code}\n' "$API/api/eras"    -H "Authorization: Bearer $JWT"   # → 200
curl -s -o /dev/null -w '%{http_code}\n' "$API/api/entries" -H "Authorization: Bearer $JWT"   # → 200

# 3) Clave inválida
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/api/auth/token" \
     -H 'Content-Type: application/json' -d '{"key":"00000000000000000000000000000000"}'      # → 401

# 4) Anónimo sigue cerrado
curl -s -o /dev/null -w '%{http_code}\n' "$API/api/eras"                                      # → 401

# 5) Subida completa (upload + PUT binario a R2)
curl -s -X POST "$API/api/upload" -H "Authorization: Bearer $JWT" \
     -H 'Content-Type: application/json' \
     -d '{"prefix":"vault/photos","filename":"prueba.jpg","content_type":"image/jpeg"}'        # → 201 + upload_url

# 6) Auditoría
npx wrangler d1 execute el-bunker-db --remote --command \
  "SELECT user_id, payload FROM events WHERE event_type='auth_login' ORDER BY created_at DESC LIMIT 3"
```

Y en la UI: abrir la app en un navegador **sin sesión de Google**, entrar por
"ACCESO TEST / ADMIN", comprobar que VAULT carga eras y entradas reales.

---

## 9. ADR propuesto (para `docs/Nucleo/CONTRATO.md`)

> No se aplica en esta spec. Lo escribe Edu, o Sonnet con su OK, al cerrar la
> implementación (checklist de REGLAS.md).

```markdown
### ✅ ADR-028 — Acceso por clave para test y admin (NUEVO S150)
Además del login de Google, el worker acepta canjear una **clave de acceso** de alta
entropía por el mismo JWT (`POST /api/auth/token`). Cada clave es un secret del worker
atado a un usuario de la whitelist (ADR-006): `ADMIN_ACCESS_KEY`→`admin`,
`EDU_ACCESS_KEY`→`edu`. No hay clave para David.
`authenticate()` NO cambia: la API sigue aceptando exclusivamente JWT firmados con
`JWT_SECRET`. Lo que cambia es que hay dos emisores de ese JWT, no dos formas de entrar.
Toda emisión (Google y clave) escribe `auth_login` en `events` (ADR-019). Revocación =
borrar/rotar el secret. Manual: `docs/operacional/ACCESO_TEST_ADMIN.md`.
```

**Enmienda al ADR-025 y a la regla 🔒-6** (sustituir el texto vigente):

```markdown
### ✅ ADR-025 — Google OAuth2 solo para auth (ENMENDADO S150)
Google OAuth2 se mantiene como método de autenticación de los usuarios humanos y NO se usa
Google Drive para almacenar datos ni archivos (esta parte es inamovible, 🔒-6).
**Enmienda S150:** Google deja de ser el ÚNICO mecanismo de login. ADR-028 añade el canje
de clave de acceso para test y admin. La prohibición de usar Drive como persistencia queda
intacta.
```

Tabla de reglas inamovibles, fila 🔒-6 → "**Drive nunca como persistencia.** Ni una línea
nueva sobre Drive. El login puede ser Google (ADR-025) o clave de acceso (ADR-028)."

---

## 10. Fuera de alcance

Confirmado el §8 del contrato, y además:

- **`authenticate()` no se toca.** Si una implementación propone modificarlo, contradice
  esta spec y se detiene.
- No se añade clave para David ni registro de usuarios nuevos (ADR-006 intacto).
- No se toca el motor de audio, el reproductor, `tokens.js` ni la estética
  (congelación ADDENDUM 8-jul). `LoginScreen.jsx` sí se amplía —el contrato lo declara no
  congelado— reutilizando sus tokens visuales existentes (`ACID`, `RED`, `FONT`), sin
  paleta nueva.
- No se implementa el redirect de Google (candidato 3): queda como idea para otro contrato.
- La subida de la selección PRUEBA (t_c316b835) es trabajo posterior al deploy.
