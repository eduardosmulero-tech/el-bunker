# DISEÑO — REVOCACIÓN DE JWT Y CONSOLA DE ACCESOS

> **Estado: 🟡 PROPUESTA** (Opus, 12-ago-2026). Tarjeta `t_f0964cab` (B6), carril `opus`.
> **Origen:** `PLAN_CARRILES_ELBUNKER_2026-08-04.md`, ola 3, B6: *"resolver primero CÓMO SE REVOCA
> un JWT autofirmado de 24h; es decisión de diseño, no de implementación"*. La pregunta venía
> marcada como pendiente desde el diseño del panel (`DISENO_PANEL_ADMIN_2026-08-04.md:78-79`:
> *"[VERIFICAR: … Decidir en implementación; no inventar aquí]"*).
> **Canon leído antes de diseñar:** `CONTRATO.md` (29 ADRs), `REGLAS.md`, `ESTADO.md`,
> `docs/spec/INDEX.md`, `SPEC_ACCESO_TEST_ADMIN_2026-08-02.md` (vía ADR-028).
> **Alcance:** diseño y especificación. Cero código.

---

## 0. Reto a la tarjeta

La tarjeta pide elegir mecanismo de revocación entre cuatro opciones, como paso previo a la consola
de ACCESOS del panel admin — la consola que su propia fuente calificó de *"la más enredada"* y dejó
la última en el orden de valor (`DISENO_PANEL_ADMIN_2026-08-04.md:130-132`).

Contrastado contra el código, **la tarjeta se queda corta en tres sitios**:

1. **No es una funcionalidad de admin: es la pieza que le falta al Modo Visita**, que ya está
   construido. Sin revocación, encender el Modo Visita no invalida el token anterior — y ese token
   sigue dando acceso sin censura hasta 24 horas (§1).
2. **El canon contiene una afirmación falsa sobre este asunto.** ADR-028 dice *"Revocación = borrar
   o rotar el secret"* (`CONTRATO.md:153`). No es cierto para las sesiones vivas (§2). Cualquier
   diseño que se apoye en esa frase parte de una premisa rota.
3. **La opción (b) de la tarjeta está muerta al nacer.** Versionar la clave de acceso en el claim no
   puede revocar la sesión de David: David entra por Google (ADR-025) y no tiene clave que versionar
   (`workers/utils/access-keys.js:12-15`, sin entrada para `david`). Y la sesión de David es
   justamente la que el Modo Visita necesita poder cortar.

**Veredicto: la tarjeta pasa el reto, y sube de prioridad.** No es la última consola del panel: es
un prerrequisito de una función que ya está escrita y esperando integración.

### Nota de estado verificada, y necesaria para leer esto

El Modo Visita **está a medias en el árbol principal**. En `master` vive el emisor del claim
(`workers/routes/session.js`, A2), pero **nada lo consume**: `grep -rn "visit" workers/` solo
aparece en `auth.js` y `session.js`. El filtrado server-side (`workers/utils/visit-filter.js`), el
del feed y la UI viven **solo en sus ramas** (`t_f1fd90c0`, `t_ed564218`, `t_fc51cdc9`).

Las tres tarjetas están en `done`, que es **exactamente donde deben estar**: en este board `done`
significa *pendiente de merge* y `archived` significa *mergeada* (convención de Edu). No hay nada
que corregir en el board. Lo que sí importa para este diseño es la consecuencia práctica: **el Modo
Visita todavía no protege nada en producción**, porque lo que censura no está integrado. Por eso lo
de abajo se especifica sobre el Modo Visita completo, y por eso la fase R2 (§8) espera al merge.

---

## 1. El hallazgo: el Modo Visita es una cerradura de papel

Cómo funciona hoy, en cuatro líneas de código reales:

1. Encender el Modo Visita emite un **token nuevo** con el claim `visit:true`
   (`session.js:100`) — el anterior no se invalida, porque no hay forma de invalidarlo.
2. Apagarlo exige la clave de acceso (`session.js:64-83`). Ese es el candado que Edu ve.
3. El servidor decide censurar **leyendo el claim del token que le presentan**
   (`visit-filter.js`, `isVisitMode(request)`).
4. `verifyJWT` solo comprueba firma y caducidad (`workers/utils/auth.js:39-58`). Un token viejo,
   bien firmado y sin caducar, es indistinguible de uno nuevo.

De donde salen dos consecuencias:

- **El candado se salta con el token anterior.** Quien conserve una copia del JWT de antes de
  encender la visita —otra pestaña abierta, un `localStorage` copiado, un token en un log— sigue
  viendo la app sin censura hasta 24h (`config.js:28`), sin necesidad de la clave.
- **La censura es por dispositivo, no por cuenta.** Encender el Modo Visita en el móvil no toca la
  sesión abierta del portátil ni la PWA instalada en otro aparato. Si el invitado coge el otro
  dispositivo, no hay censura. **Para una función cuyo propósito literal es "poder enseñar la app",
  ese no es un caso borde: es el caso central.**

**Dimensión honesta de la amenaza.** Esto no es ejecución remota ni robo de cuenta. El atacante es
un invitado con un aparato de Edu en la mano y el daño es ver contenido marcado como clasificado.
Pero es exactamente el adversario contra el que se diseñó la función, y hoy la función no lo para.

---

## 2. Corrección de canon: rotar la clave no revoca nada

ADR-028 (`CONTRATO.md:153`) dice: *"Revocación = borrar o rotar el secret"*. El código dice otra
cosa:

- Las `ACCESS_KEY` solo intervienen **en la emisión**: se comparan en `resolveAccessKey`
  (`access-keys.js:44-55`) al canjear la clave por token.
- La firma del JWT usa **`JWT_SECRET`**, no la clave (`workers/utils/auth.js:19-37`).

Rotar `ADMIN_ACCESS_KEY` cierra la puerta a quien quiera entrar a partir de ahora; **no echa a quien
ya está dentro**. Los tokens vivos siguen valiendo hasta 24h.

Rotar `JWT_SECRET` sí los mata, pero es indiscriminado: tira también la sesión de Google de David,
que no tiene nada que ver. Es un martillo, no un mecanismo, y por eso ADR-031 (§7) enmienda esa
frase en vez de dejarla.

---

## 3. Las cuatro opciones

| | Mecanismo | Revoca sesiones vivas | Cubre a David (Google) | Granularidad | Coste |
|---|---|---|---|---|---|
| **(a)** | Lista negra de `jti` en D1 | Sí | Sí | **Por token** | Alto: hoy no hay `jti` ni `iat` en el payload (`utils/auth.js:23-26`, solo `exp`); tabla nueva, lectura por request y recolección de expirados |
| **(b)** | Versión de la clave en el claim | Solo sesiones abiertas con clave | **No** — no tiene clave | Por clave | Bajo, pero **no resuelve el problema**: deja fuera el caso del Modo Visita |
| **(c)** | Caducidad corta sin revocación | No | — | — | Bajo, y engañoso: bajar de 24h a 1h deja **una hora** de bypass y obliga a reloguear a diario |
| **(d)** | **Epoch por usuario en D1** | **Sí** | **Sí** | Por usuario | **Bajo:** una columna, un claim, una comparación |

- **(a)** es la única que revoca *una* sesión dejando vivas las demás. Con tres usuarios en whitelist
  (ADR-006) y sin sesiones concurrentes que gestionar, esa granularidad no compra nada y cuesta una
  tabla con mantenimiento. Es artillería para un problema de cerrojo.
- **(b)** queda descartada por cobertura, no por coste.
- **(c)** no es revocación: es esperar. Sirve como refuerzo, no como mecanismo.

---

## 4. Decisión: epoch por usuario (opción d)

### 4.1 El mecanismo, entero

1. **D1** (migración `0004_token_epoch.sql`):
   `ALTER TABLE users ADD COLUMN token_epoch INTEGER NOT NULL DEFAULT 0;`
2. **Emisión:** `issueToken` (`workers/routes/auth.js:30-45`) añade `epoch: user.token_epoch` al
   payload. Un campo más en el objeto que ya se firma. **`session.js` lo hereda gratis**, porque
   reutiliza el mismo emisor (`session.js:19`) — el Modo Visita queda cubierto sin tocarlo.
3. **Verificación:** `authenticate()` (`workers/utils/auth.js:61-73`) rechaza el token si
   `payload.epoch !== users.token_epoch` del usuario. Una lectura por clave primaria.
4. **Revocar** = `UPDATE users SET token_epoch = token_epoch + 1 WHERE id = ?1`. Todas las sesiones
   de ese usuario mueren en el acto. Sin tabla nueva, sin recolección de basura, sin `jti`.
5. **Auditoría:** se emite `auth_revoked` en `events` con `{ by, reason, target }`.

### 4.2 Por qué contador y no marca de tiempo

La variante «`revoked_before` = fecha; el token lleva `iat`» hace lo mismo, pero depende del reloj y
obliga a añadir `iat` al payload. Un contador se compara por igualdad exacta y no tiene reloj que
pueda ir torcido — y este proyecto ya se comió un bug de *clock skew* en la re-autenticación
(`VaultContext.jsx:141-143`). Contador.

### 4.3 El coste real, dicho sin adornos

Una lectura D1 por petición autenticada, por clave primaria. Es el precio del mecanismo y hay que
mirarlo de frente:

- **Primera versión: sin caché.** Tres usuarios y una app privada; medir antes de optimizar.
- **Si molesta:** caché en memoria del isolate (`Map` de `userId → {epoch, ts}`) con TTL de 60s. El
  techo de latencia de revocación pasa a ser 60 segundos y **eso se documenta**, porque cambia la
  promesa: «revocado al instante» pasa a «revocado en menos de un minuto». Para el caso del invitado
  con el móvil en la mano, un minuto sigue siendo aceptable; para un secreto filtrado, también,
  porque el atacante no sabe que le han revocado.

### 4.4 Qué contratos toca, y con qué permiso

- **ADR-028 decía que `authenticate()` no cambia.** Cambia, y por eso hace falta ADR (§7). Lo que se
  preserva es el fondo de aquella decisión: la API sigue aceptando **exclusivamente** JWT firmados
  con `JWT_SECRET`, y sigue habiendo dos emisores del mismo token, no dos formas de entrar. Lo que se
  añade es una condición de **frescura**, no un camino de autenticación nuevo.
- **🔒-2 intacta:** el estado vive en D1. Ni KV, ni Durable Objects, ni servidor propio.
- **ADR-019 🔒-5 intacta:** `auth_revoked` es un evento más en la tabla `events`. La consola de
  ACCESOS es **cliente** del motor de eventos; no calcula agregados propios.

---

## 5. Lo que esto arregla en el Modo Visita (no estaba pedido, y es el motivo de hacerlo ya)

Con el epoch, encender el Modo Visita pasa a ser **una sola operación con dos pasos en este orden**:

1. `token_epoch += 1` → mueren todas las sesiones previas de ese usuario, en todos sus dispositivos;
2. se firma el token nuevo **con el epoch ya incrementado**, con `visit: true`.

Resultado: la censura deja de ser una propiedad del aparato que tocaste y pasa a ser una propiedad
de la cuenta. El token anterior deja de servir, que es lo que todo el mundo daba por hecho que
pasaba.

**El efecto secundario hay que contárselo a Edu antes, porque lo va a notar:** encender el Modo
Visita en el móvil **cierra la sesión del portátil**. Es lo correcto —lo contrario es la cerradura
de papel del §1— pero es visible. Si con el uso resulta molesto, la salida es un segundo contador
(`visit_epoch`) que solo mate las sesiones sin claim de visita; **no se hace ahora**: es complejidad
comprada por adelantado contra una molestia que todavía no existe.

---

## 6. Spec de la consola de ACCESOS

### 6.1 Worker — `workers/routes/admin-access.js`

Todo bajo `requireAdmin` (B2), montado en `/api/admin/access*`.

| Método y ruta | Qué hace | Detalle que importa |
|---|---|---|
| `GET /api/admin/access` | Los 3 usuarios de la whitelist (`workers/config.js:13`) con: método(s) de entrada observados, último acceso, IP y UA truncados del último, `token_epoch` actual y si tienen clave configurada | **Nunca devuelve el valor de una clave.** El "tiene clave" sale de `hasAccessKeysConfigured` por binding (`access-keys.js:32-37`), no del secret |
| `POST /api/admin/access/:userId/revoke` | Incrementa `token_epoch`. Emite `auth_revoked` con `{by, target, reason}` | Valida `:userId` contra la whitelist (ADR-006) antes de tocar D1. Repetirlo vuelve a subir: es seguro llamarlo dos veces |
| `GET /api/admin/access/logins` | Lector de `events` filtrado a `auth_login`, `auth_revoked`, `visit_mode_on`, `visit_mode_off`, con filtros de usuario y fecha y paginación | Cliente del motor (ADR-019). Cero agregados nuevos |

**Lo que este módulo NO hace: rotar claves por API.** El plan lo pedía como función de la consola y
se responde que no, por dos razones que no son de gusto: un endpoint capaz de escribir secrets del
worker es superficie de ataque nueva sobre lo más sensible que hay, y el runtime de Workers no puede
reescribir sus propios secrets — eso es `wrangler secret put`, fuera de la app. **La consola muestra
el procedimiento** (el comando exacto, ya documentado en `docs/operacional/ACCESO_TEST_ADMIN.md`) y,
al terminar, ofrece el botón de revocar, que es el paso que de verdad faltaba. Rotar + revocar sí es
una revocación completa; rotar solo, no (§2).

### 6.2 Frontend — `src/admin/screens/Accesos.jsx`

No es un CRUD y no se fuerza a serlo: `ResourceTable` en modo lectura (usuarios) + un lector de
eventos + acciones explícitas. Reglas heredadas del panel:

- **Revocar exige `ConfirmDialog` escribiendo el `user_id`**, la misma regla que los borrados
  (`DISENO_PANEL_ADMIN_2026-08-04.md:71`). Revocar la sesión de David mientras está usando la app es
  una acción destructiva aunque no borre nada.
- Iconografía del registro `Icon.jsx` (`key`, `lock`, `shield`), cero emoji.
- **Nada inventado en pantalla** (REGLAS.md): si un usuario nunca ha entrado, la fila dice vacío, no
  una fecha de relleno.
- Tema por las variables `--admin-*` del diseño hermano (`DISENO_ADMIN_EN_LA_APP_2026-08-12.md`).

### 6.3 ACEPTACIÓN por artefacto

La prueba 4 es la que decide si esto está hecho: **hoy devuelve 200 y tiene que devolver 401.**

| # | Comprobación | Esperado |
|---|---|---|
| 1 | `POST /api/auth/token` con la clave de admin; decodificar el payload | el JWT lleva `epoch` |
| 2 | `GET /api/entries` con ese JWT | `200` |
| 3 | `POST /api/admin/access/admin/revoke` con JWT de admin | `200`, `token_epoch` sube en 1 en D1 |
| 4 | Repetir la 2 **con el JWT de antes de revocar** | **`401`** — hoy esta prueba ni siquiera se puede ejecutar: no hay endpoint que revoque, y el token viejo sigue valiendo hasta su `exp` |
| 5 | `GET /api/admin/access/logins` | aparece `auth_revoked` con `by=admin` |
| 6 | Cualquier `/api/admin/access*` con JWT de `edu` | `403` |
| 7 | Modo Visita: token A sin `visit` → encender visita → token B; `GET /api/entries` con **A** | **`401`**. Sin este ADR y con el Modo Visita ya integrado, A devuelve `200` sin censura: ese es el agujero del §1. (En master hoy no se puede medir, porque el filtrado sigue sin integrar — §0) |
| 8 | `npx vitest run workers/` | verde, incluidos los tests de auth existentes |
| 9 | Sesión de Google de David tras revocar a `admin` | **sigue viva** (la revocación es por usuario, no global) |

---

## 7. ADR-031 — texto firmable, y enmienda a ADR-028

> **ADR-031 — Revocación de sesiones por epoch de usuario** (propuesto 12-ago-2026).
>
> Los JWT del Búnker son autofirmados y duran 24h (ADR-028). Para poder cortar una sesión antes de
> su caducidad, cada usuario lleva en D1 un contador `users.token_epoch`. Todo token emitido
> incorpora el claim `epoch` con el valor vigente en el momento de la firma, y `authenticate()`
> rechaza el token cuyo `epoch` no coincida con el del usuario. **Revocar todas las sesiones de un
> usuario es incrementar su contador**; no hay lista negra, ni `jti`, ni recolección de expirados.
>
> El mecanismo es **por usuario**, no por token: con tres usuarios en whitelist (ADR-006) la
> granularidad por token no aporta y sí cuesta una tabla con mantenimiento. Cubre por igual las
> sesiones de Google (ADR-025) y las de clave de acceso (ADR-028), porque actúa en el emisor común.
>
> Encender el Modo Visita incrementa el epoch y firma el token de visita con el valor nuevo, en esa
> orden. Así la censura del Modo Visita deja de ser una propiedad del dispositivo donde se activó y
> pasa a serlo de la cuenta.
>
> Toda revocación emite `auth_revoked` en la tabla `events` (ADR-019 🔒-5: la consola de ACCESOS es
> cliente del motor de eventos, no un agregador nuevo). El estado vive en D1 (🔒-2).
>
> **Enmienda a ADR-028.** Donde ADR-028 dice *"Revocación = borrar o rotar el secret"*, se corrige:
> rotar o borrar una `ACCESS_KEY` **impide entradas futuras pero no invalida las sesiones ya
> emitidas**, porque la clave solo interviene en el canje y la firma usa `JWT_SECRET`. La revocación
> de sesiones vivas es la de este ADR. Rotar `JWT_SECRET` sigue siendo el martillo global y se
> reserva para el compromiso del propio secreto de firma.
>
> **Alcance de la excepción a "authenticate() no cambia" (ADR-028).** `authenticate()` añade una
> comprobación de frescura contra D1. Lo que ADR-028 protegía se mantiene entero: la API sigue
> aceptando exclusivamente JWT firmados con `JWT_SECRET` y sigue habiendo dos emisores del mismo
> token, no dos formas de entrar.

---

## 8. Orden de trabajo y lo que queda fuera

| # | Fase | Depende de |
|---|---|---|
| **R1** | Migración `0004_token_epoch.sql` + claim `epoch` en `issueToken` + comprobación en `authenticate()` + tests | — |
| **R2** | Bump de epoch al encender el Modo Visita | R1 y la **integración en master de A3/A4/A5** (§0) |
| **R3** | `workers/routes/admin-access.js` bajo `requireAdmin` | R1 |
| **R4** | `src/admin/screens/Accesos.jsx` | R3 y el contrato de tema del diseño hermano |

**Fuera de alcance, dicho para que no se cuele luego:** rotación de secrets por API (§6.1), caducidad
distinta de 24h (ADR-028 sigue mandando), revocación por token individual (§3, opción a), y cualquier
almacén fuera de D1 (🔒-2).

**Coordinación:** al cerrar esta tarjeta, el coordinador crea las tarjetas R1-R4 para el carril
nativo. R2 queda bloqueada hasta que el Modo Visita esté integrado en master.
