# CONTRATO — Luna (carril `luna`, board `el-bunker`), tarjetas A1 + B2

> Preparado por Sonnet (coordinador) el 5-ago-2026. Autocontenido a propósito: no asumas que has
> leído nada más de este repo. Las dos tarjetas ya existen en el kanban
> (`t_6a19ff8b` A1, `t_be0de816` B2), `ready`, cada una con su propio worktree resuelto por
> `hermes kanban claim`. Son independientes entre sí (ámbitos disjuntos) — puedes hacerlas en el
> orden que quieras, cada una en su propio `claim`/worktree/commit/`complete`.

## Cómo cerrar cada una (recordatorio del canon)

```
hermes kanban --board el-bunker claim <id> --ttl 3600      # imprime tu worktree
hermes kanban --board el-bunker heartbeat <id> --note "..."  # si tardas
hermes kanban --board el-bunker complete <id> \
  --result "<qué hiciste, 2 líneas>" \
  --metadata '{"changed_files":["…"],"build":"ok"}'
```
Commits solo en tu rama del worktree, nunca en `master`, nunca mergees. Sin coautoría de IA en
el mensaje del commit. Si algo te bloquea de verdad: `block <id> --reason "..."` y deja el
worktree tal cual — no borres trabajo a medias.

**Ninguna de las dos tarjetas toca `workers/worker.js`** (el router que registra las rutas) aunque
ambas crean rutas nuevas — está fuera de ámbito a propósito: dos tarjetas tocando el mismo fichero
a la vez es justo lo que el canon prohíbe paralelizar (P6). La wiring del router la hace quien
integra, en un commit aparte, después. No lo añadas aunque parezca el paso obvio que falta.

---

## Convenciones del repo (aplican a las dos tarjetas)

- **Módulo de ruta:** función `export default async function handleX(request, env, url, userId)`
  — `userId` ya viene resuelto por `authenticate()` en el router (JWT verificado, `sub` del
  token). Ver `workers/routes/admin-g2.js` como ejemplo real más cercano a lo que vas a escribir
  (ruta admin ya existente, mismo repo).
- **Respuestas:** `import { json, err } from "../utils/response.js"` — `json(data, status=200)`,
  `err(message, status=500)`. No construyas `Response` a mano.
- **Autorización de admin ya existe, no la reinventes:**
  `workers/utils/authorization.js` exporta `isAdmin(userId)` (`userId === "admin"`) y
  `ADMIN_USER_ID`. Impórtalo, no reescribas la comparación.
- **D1:** `env.DB.prepare(sql).bind(...).first()` / `.all()` / `.run()`. Los tests mockean `DB`
  como un objeto `{ prepare(sql) → { bind(...) → { first(), all(), run() } } }` — patrón exacto en
  `workers/routes/__tests__/admin-g2.test.js`.
- **Rate limit:** ya se aplica globalmente a todo `/api/*` en `workers/worker.js`
  (`checkRateLimit`). No añadas uno propio salvo que la tarjeta lo pida explícitamente (no es el
  caso aquí).
- **Tests:** Vitest, `// @vitest-environment node` al principio del fichero (las rutas de worker
  no tocan DOM). Mock de D1 igual que `admin-g2.test.js`. `npm test` corre todo con `vitest run`.
- **Sin comentarios explicativos de qué hace el código** — solo el porqué no obvio, si lo hay.

---

## A1 — `classified_items` + `files.blurhash` + endpoints de marcado

**Referencia de diseño:** `docs/disenos/DISENO_MODO_VISITA_2026-08-04.md` §4 (modelo de datos),
literal — no lo reinterpretes:

```sql
CREATE TABLE classified_items (
  item_type  TEXT NOT NULL,   -- entry | file | track | playlist | capsule | drop
  item_id    TEXT NOT NULL,
  marked_by  TEXT NOT NULL,   -- FK users (ADR-006)
  marked_at  INTEGER NOT NULL,
  PRIMARY KEY (item_type, item_id)
);
```
`marked_by` referencia `users(id)`. `marked_at` es entero (epoch) — el resto del schema usa
`TEXT` con `datetime('now')` (ver `workers/schema.sql`), pero el diseño fija `INTEGER` aquí a
propósito; no lo cambies a `TEXT` por consistencia con el resto, sigue el diseño.

Además: `ALTER TABLE files ADD COLUMN blurhash TEXT;` (nullable — nadie lo rellena todavía, eso
es la tarjeta A6, fuera de esta).

**Migración:** sigue el patrón de `migrations/0001_g2_policy.sql` (aditiva, `CREATE TABLE IF NOT
EXISTS`, comentario de cabecera explicando que es aditiva). Numera el siguiente fichero
(`0002_...`). Bump de schema **MINOR** (ADR-012) — si hay un fichero de versión de schema en el
repo, actualízalo; si no lo encuentras en tu ámbito, coméntalo en el `complete` y no lo toques
(está fuera de `migrations/**`).

**Endpoints — `workers/routes/classify.js` (nuevo):**
- Marcar/desmarcar un ítem individual.
- Marcar/desmarcar en lote (por era, por tag, o por selección explícita de IDs) — la UI de
  marcado en lote es la tarjeta B3, más adelante; aquí solo hace falta que el endpoint lo
  acepte.
- Todo mutador exige `isAdmin(userId)` — el marcado de clasificación es una acción admin
  (`403` si no, antes de tocar D1, mismo patrón que B2 más abajo).
- Sin `blurhash`: esta tarjeta no lo calcula, solo declara la columna.

**Ámbito (no te salgas):** `migrations/**`, `workers/routes/classify.js` (nuevo),
`workers/routes/__tests__/classify.test.js` (nuevo).

**DoD:**
- La migración aplica y revierte limpia en D1 local (`wrangler d1 migrations apply` local +
  verificación de que un `DROP TABLE classified_items` / quitar la columna deja el schema como
  estaba).
- Tests: marcar individual, desmarcar individual, marcar en lote, desmarcar en lote, y el 403 de
  no-admin antes de tocar D1.
- `npm test` en verde.

---

## B2 — `requireAdmin` + esqueleto `/api/admin/*`

**Referencia de diseño:** `docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md` §3 — *"Guardia en el
Worker, no en la UI... Edu y David con su sesión normal reciben 403 del servidor, no un enlace
escondido."*

**Encargo:** `workers/utils/require-admin.js` (nuevo) — un helper `requireAdmin(userId)` que
devuelve `null` si es admin o una `Response` 403 ya construida (con `err(...)`) si no, para que
cada handler pueda hacer `const denied = requireAdmin(userId); if (denied) return denied;` como
primera línea, **antes de cualquier `env.DB.prepare`**. Por debajo, usa
`isAdmin` de `workers/utils/authorization.js` — no reimplementes la comparación de `userId`.

`workers/routes/admin.js` (nuevo): esqueleto de rutas `/api/admin/*` — sin lógica de negocio
todavía (eso son B3/B4/B5/B6, tarjetas futuras). Solo el guardia aplicado y un 404 base para
cualquier subruta no reconocida todavía. Puede ser tan simple como: aplica `requireAdmin`,
si pasa, responde 404 "not implemented" para cualquier subruta (placeholder consciente, no un
error de programación).

**No lo registres en `workers/worker.js`** (ver nota general arriba) — ni tampoco mezcles esta
ruta con `/api/admin/g2` (`admin-g2.js`), que ya existe y es un container distinto; deja ambas
convivir sin tocar la existente.

**Ámbito:** `workers/routes/admin.js` (nuevo), `workers/utils/require-admin.js` (nuevo), sus
tests.

**DoD:**
- JWT de `admin` → 200 (o lo que responda el esqueleto para una subruta válida).
- JWT de `edu` → **403 antes de tocar D1** (verificable en el test: el mock de `DB` no recibe
  ninguna llamada `prepare()` en ese caso, mismo patrón que
  `admin-g2.test.js` — *"rejects a missing identity before querying D1"*).
- Test que prueba explícitamente ambos casos.

---

## Verificación que hará Sonnet al cerrar cada tarjeta (para que sepas contra qué se mide)

1. `git -C <worktree> diff --name-only master...HEAD` — todo dentro del ámbito declarado, nada
   fuera (ni siquiera `workers/worker.js`).
2. `npm test` en verde dentro del worktree.
3. Lectura puntual del diff contra este contrato (Regla de Oro — no se da "hecho" sin verificar
   contra el código real).
