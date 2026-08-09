# CONTRATO — Luna (carril `luna`, board `el-bunker`), tarjetas P0 + V-A1 + B1 + FIX-SB

> Preparado por Sonnet (coordinador) el 5-ago-2026. Autocontenido a propósito: no asumas que has
> leído nada más de este repo salvo lo que este contrato te señala explícitamente. Las cuatro
> tarjetas ya existen en el kanban, asignadas a `luna`.

## Orden — esto no es opcional

```
▶ t_9800bed2  ready   P0 — Excluir .worktrees/ de vitest         ← HAZ ESTA PRIMERO
◻ t_0a8cf470  todo    B1 — admin-core (bloqueada por P0)
◻ t_eb4788e7  todo    FIX-SB — regex vacía (bloqueada por P0)
▶ t_09474b0d  ready   V-A1 — verificar migraciones D1 remota      ← independiente, cuando quieras
```

**Por qué P0 va primero (Opus, 5-ago):** mientras `vite.config.js` no excluya `.worktrees/`,
`npx vitest run` desde el repo principal recorre los 4 árboles y cada test se cuenta hasta 4
veces — un rojo tuyo en un worktree tiñe el check de los demás carriles y viceversa. B1 y
FIX-SB están enlazadas como bloqueadas por P0 en el kanban (`hermes kanban link`): no pasan a
`ready` hasta que completes P0. No hace falta que hagas nada para desbloquearlas, el sistema las
suelta solo. V-A1 no toca vitest (es una consulta D1 de solo lectura), así que puedes hacerla en
cualquier momento, incluso antes o en paralelo con P0.

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

---

## P0 — Excluir `.worktrees/` de vitest (`t_9800bed2`)

**Problema verificado (Opus, 5-ago):** `vite.config.js` no excluye `.worktrees/`. Medido: 29
ficheros de test en el árbol principal, 112 recogidos por vitest, 762 tests ejecutados (la línea
base documentada era 141).

**Ámbito:** `vite.config.js` (sección `test`), opcionalmente `eslint.config.js` si tiene el mismo
problema.

**Encargo:** añade `exclude` en la sección `test` de `vite.config.js` que descarte
`.worktrees/**`, conservando los excludes por defecto de vitest (`node_modules`, `dist`). El
bloque actual es:

```js
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
  ...
```

Vitest hereda los `exclude` por defecto solo si no defines el array tú mismo — si añades
`exclude`, tienes que incluir también los patrones por defecto de vitest
(`**/node_modules/**`, `**/dist/**`, `**/.git/**`, etc., ver docs de vitest) más
`**/.worktrees/**`.

**DoD:** `npx vitest run` desde `C:\proyectos\dev\el-bunker` (el repo principal, no un worktree)
recoge 29 ficheros de test, no 112, con los worktrees abiertos. Pega el conteo de ficheros en el
`--result` del `complete`.

---

## V-A1 — Verificar migraciones 0002/0003 en D1 remota (`t_09474b0d`)

**Riesgo verificado (Opus, 5-ago):** A1 entregó `migrations/0002_classified_items.sql`
(`CREATE TABLE classified_items` + `ALTER TABLE files ADD COLUMN blurhash`) y existe
`0003_schema_version_1_1_0.sql`. Los tests de `classify.js` usan una DB falsa, así que la suite
está verde tanto si la migración se aplicó en remoto como si no. Si NO está aplicada,
`/api/classify` devuelve 500 en producción con todo en verde — mismo patrón que ya mordió en G2.

**Encargo:** consulta de **SOLO LECTURA** a la D1 remota (`wrangler d1 execute <db> --remote
--command "..."`, revisa `wrangler.toml`/`wrangler.jsonc` para el nombre exacto de la DB) que
confirme:
1. Existe la tabla `classified_items`.
2. Existe la columna `files.blurhash`.
3. Qué dice `schema_version` (si existe esa tabla/valor).

**Regla dura — irreversibles:** si falta algo, **NO apliques nada sin OK de Edu**. Reporta en el
`complete` y para ahí. Aplicar una migración en remoto sin snapshot+rollback+autorización no es
tu decisión ni la mía.

**DoD:** la salida literal de la consulta pegada en el `--result` del `complete`. Si falta la
migración, dilo explícitamente — se abrirá una tarjeta aparte para aplicarla con snapshot y
rollback.

---

## B1 — admin-core: shell, ResourceTable, ResourceForm, ConfirmDialog, useAdminResource (`t_0a8cf470`)

**Solo empieza esta cuando el kanban la muestre `ready`** (se desbloquea sola al completar P0).

Esta tarjeta ya tiene diseño y contrato de tests entregados por Opus en un turno anterior — tu
trabajo es implementar, no diseñar.

**Diseño paso a paso (autocontenido, ya copiado a tu worktree):**
`docs/disenos/DISENO_B1_ADMIN_CORE_2026-08-05.md` — 7 piezas, props exactas, estado interno,
orden de dependencia, ANEXO A (nombres accesibles exigidos por los tests) y ANEXO B (porte a
vinos-carta-app). **Está sin commitear** (espera OK de Edu) — por eso te lo copié manualmente al
worktree en vez de que lo veas por git; no lo confundas con canon commiteado, es tu spec de
trabajo para esta tarjeta.

**Contrato ejecutable, ya en tu worktree (commit `4bc8ec7`):**
- `src/admin/__tests__/admin-core-boundaries.test.js` — 7/7 **VERDE**, no lo toques.
- `src/admin/__tests__/useAdminResource.test.jsx` — 14 casos, **ROJO a propósito**.
- `src/admin/__tests__/toy-mount.test.jsx` — 9 casos, **ROJO a propósito**.
- `src/admin/__tests__/fixtures/toyDescriptor.js` + `fixtures/fakeClient.js`.

Los rojos fallan por módulo inexistente (`src/admin/core/**` no existe todavía), no por sintaxis.

**Encargo exacto:** pon en verde `useAdminResource.test.jsx` y `toy-mount.test.jsx`
implementando `src/admin/core/**` según el diseño. **NO MODIFIQUES LOS TESTS** — si el ejecutor
puede editar la spec, deja de ser spec. Además, escribe los tests 12.2–12.6 que describe el
diseño (sección de plan de pruebas).

**Ámbito:** `src/admin/core/**`, `src/admin/__tests__/**` (solo añadir, no editar los 3 ficheros
ya commiteados salvo los nuevos 12.2–12.6).

**Verifica con `npx vitest run src/admin` DESDE TU WORKTREE**, nunca desde el repo principal
(motivo: P0 arriba). El worktree ya tiene el `apiClient.js` mínimo commiteado en `2ab6951` —
reutilízalo, no lo reescribas.

**Trampas ya pagadas (ANEXO A del diseño, para que no las redescubras):**
- `core/ui/Button.jsx` **no hace spread de `...rest`** — un `aria-label` que le pases **se
  pierde**. Los botones solo-icono del diseño usan `title`, no `aria-label`, por eso.
- `core/ui/Input.jsx` **sí hace spread** — comportamiento distinto entre los dos, no es un bug,
  es el estado real del código.
- `core/ui/Dialog.jsx` ya exporta un `ConfirmDialog` **con ese mismo nombre**, distinto del que
  pide esta tarjeta. Importa siempre el `Dialog` **default** de ese fichero, nunca el named
  export `ConfirmDialog` — hay un test que lo verifica explícitamente.

**DoD:** `useAdminResource.test.jsx` y `toy-mount.test.jsx` en verde + tests 12.2–12.6 escritos +
`admin-core-boundaries.test.js` sigue en 7/7 (no lo rompas) + `npx eslint src/admin/` limpio +
build en verde.

---

## FIX-SB — regex vacía en `service-boundaries.test.js` (`t_eb4788e7`)

**Solo empieza esta cuando el kanban la muestre `ready`** (se desbloquea sola al completar P0).

**Bug verificado (Opus, 5-ago):** `src/core/__tests__/service-boundaries.test.js:11` usa

```js
return /\\.(js|jsx)$/.test(entry.name) ? [fullPath] : [];
```

La doble barra (`\\.`) hace que la regex busque un backslash literal seguido de cualquier
carácter — no casa con `VaultContext.jsx` ni con ningún nombre de fichero real (reconstruida y
probada). Consecuencia: el test *"does not import the retired Drive facade from any source
module"* (línea 90) itera sobre **cero** ficheros y pasa en vacío desde que se escribió — no
prueba nada.

**Ámbito:** `src/core/__tests__/service-boundaries.test.js`, solo la línea de la regex y,
si hace falta, un `expect` nuevo.

**Encargo:** corrige la regex a `/\.(js|jsx)$/` (una sola barra) y vuelve a ejecutar. Añade un
`expect` explícito de que la lista de ficheros iterados tiene longitud `> 0` (patrón igual al de
`admin-core-boundaries.test.js`, para que un futuro "vacío que pasa en silencio" no vuelva a
colarse).

**Si al corregir la regex el test se pone rojo, ES UN HALLAZGO REAL — repórtalo en el
`complete`, no lo silencies ni cambies el test para que pase.** Puede significar que hay un
import real de `GoogleDriveService` en algún fichero que nadie había detectado porque el test
nunca lo miró.

**DoD:** el test itera sobre `> 0` ficheros (afirmado con `expect`), y la suite sigue verde (o,
si aparece un hallazgo real, lo reportas explícitamente en vez de forzarlo a verde).

---

## Convenciones generales del repo (por si tocas algo fuera de lo ya cubierto arriba)

- **Sin comentarios explicativos de qué hace el código** — solo el porqué no obvio, si lo hay.
- **Sin coautoría de IA** en mensajes de commit.
- Vitest, `// @vitest-environment node` al principio de los ficheros de test que no tocan DOM
  (workers/utils, lógica pura). Los de `src/admin/**` sí tocan DOM (React), no lleva esa
  cabecera.

## Verificación que hará Sonnet al cerrar cada tarjeta

1. `git -C <worktree> diff --name-only master...HEAD` — todo dentro del ámbito declarado.
2. La suite indicada en cada DoD, corrida **desde el worktree correspondiente**, en verde (salvo
   FIX-SB si reporta hallazgo real).
3. Para P0 específicamente: conteo de ficheros recogidos por vitest desde el repo principal.
4. Lectura puntual del diff contra este contrato antes de dar cualquiera por "hecho" (Regla de
   Oro — no se cree sin verificar contra el código real).
