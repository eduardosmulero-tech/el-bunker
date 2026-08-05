# Entregable para coordinador — Luna — 2026-08-05

## Solicitud de Edu

Edu pidió terminar lo pendiente de la entrega anterior y dejar explícito al coordinador si alguna acción quedaba fuera de contrato. Por esa petición se ejecutó, además del alcance original de A1 y B2, un contenedor separado de integración en `plan-cierre-hermes-2026-08-04`.

## Dentro de contrato Luna

- **A1**, tarjeta `t_6a19ff8b`, commit `e74e122`, board `done`: `classified_items`, `files.blurhash`, `classify.js`, rollback local y tests. Migración aplicada/revertida en D1 local; rama `191/191`, lint/build/sintaxis/diff-check verdes.
- **B2**, tarjeta `t_be0de816`, commit `8387460`, board `done`: `require-admin.js`, `admin.js` y tests. Admin atraviesa al placeholder; Edu/David reciben 403 antes de `DB.prepare()`; rama `182/182`, lint/build/sintaxis/diff-check verdes.

## Fuera de contrato original — ejecutado por petición expresa de Edu

Las tarjetas A1/B2 prohibían tocar `workers/worker.js`, la whitelist global y los metadatos de versión. La exclusión era deliberada: P6 evita que dos worktrees del mismo carril editen el router compartido y permite que Sonnet revise cada tarjeta de forma aislada. Por tanto, las excepciones siguientes **no se atribuyen a A1/B2**: constituyen una integración posterior, solicitada expresamente por Edu, y deben ser revisadas por el coordinador como tal.

| Cambio | Por qué se hizo | Riesgo si no se hacía | Evidencia y aprobación |
|---|---|---|---|
| `workers/worker.js`: registro de `classify.js` y `admin.js` | Las rutas de A1/B2 existían en sus worktrees, pero sin wiring no eran alcanzables por el Worker real. La integración posterior era necesaria para convertir entregas aisladas en funcionalidad conectable. | El código podía pasar sus tests unitarios y, aun así, responder 404 en producción; también se habría dejado la guardia B2 sin superficie real. | `router-contract.test.js`, suite 202/202 y sintaxis PASS. **Revisión del coordinador y autorización de Edu antes de deploy.** |
| Orden `/api/admin/g2` antes de `/api/admin/` | El prefijo genérico `/api/admin/` puede capturar `/api/admin/g2/*`; se mantuvo primero la ruta específica para no interceptar el contenedor G2 existente. | Regresión silenciosa del endpoint G2: una petición válida podría llegar al placeholder genérico y perder la inspección admin. | Test de precedencia y handlers concretos PASS. **No sustituye una prueba desplegada.** |
| `workers/utils/validation.js`: `item_classified`/`item_unclassified` | A1 emite dos eventos canónicos nuevos y la whitelist global debe conocerlos para que el vocabulario de eventos no quede incoherente. | Los eventos reales de A1 podrían quedar rechazados por validación o aparecer como tipos desconocidos para consumidores futuros. | Tests de whitelist PASS. Además, `POST /api/events` rechaza ambos tipos incluso para `admin`: solo `classify.js` los emite, evitando falsificación de auditoría. **Revisión del coordinador requerida.** |
| `workers/schema.sql`: `1.1.0` | A1 añade estructura D1 compatible sin romper el modelo existente; ADR-012 exige bump MINOR para una ampliación compatible. El seed de instalaciones nuevas debe anunciar la versión final. | Bases nuevas podrían declarar `1.0.0` aunque incluyan `classified_items`/`blurhash`, dejando metadata incoherente y dificultando diagnóstico. | Verificación local fresca: `schema_version=1.1.0`. **No autoriza aplicar schema remoto.** |
| `migrations/0003_schema_version_1_1_0.sql` | `schema.sql` solo cubre instalaciones nuevas; las bases existentes necesitan actualizar `app_config` sin recrear datos ni repetir el schema base. | Una actualización existente conservaría `1.0.0`, aunque la migración 0002 ya estuviera aplicada, y los clientes recibirían una versión falsa. | Cadena local 0001+0002+0003 PASS. **Aplicación remota requiere autorización explícita de Edu y snapshot/rollback.** |
| `workers/__tests__/router-contract.test.js` | El alcance original no incluía el router; al añadir wiring fuera de contrato hacía falta una prueba mínima que fijara handlers, auth y precedencia. | El wiring podría cambiar accidentalmente en un merge sin que los tests de cada ruta lo detectaran. | Test estático PASS: inspecciona la matriz y handlers concretos. **No prueba el dispatcher real ni un Worker desplegado; queda riesgo residual.** |

**Nota de rollback de A1:** `migrations/0002_classified_items.rollback.sql.txt` usa `.txt` deliberadamente para que Wrangler no lo trate como migración hacia delante. Se ejecuta manualmente y solo en local/revisión; no es una migración remota automática y requiere aprobación antes de cualquier uso destructivo.

Este bloque quedó materializado en el commit separado `3ee54dc` (`feat: integrate Luna admin and classification routes`), distinto de los commits Luna, y no incluye la lógica de B1. La primera versión de la documentación quedó en `3996625`; esta ampliación de justificación quedó en el commit documental `68462a8` (`docs: justify out-of-contract Luna integration`).

### Estado de aprobación

- **Hecho y validado localmente:** código, tests, lint, build, sintaxis y cadena de migraciones.
- **Pendiente de revisión:** coordinador debe aceptar el bloque como excepción al contrato A1/B2.
- **Pendiente de autorización:** Edu debe autorizar cualquier merge final si procede, deploy o migración D1/R2 remota.

## B1 / admin-core — completado por Luna

- **Tarjeta:** `t_0a8cf470`, board `done`.
- **Commit:** `ab5d813` (`feat(admin-core): complete reusable admin panel core`).
- **Ámbito:** `src/admin/core/**` y cinco tests contractuales nuevos en `src/admin/__tests__/**`; no se modificaron las specs existentes.
- **Implementado:** `useAdminResource`, `ConfirmDialog`, `ResourceTable`, `ResourceForm`, `ResourceConsole`, `AdminShell`, `AdminGuard` y barril `index.js`.
- **Contrato cubierto:** carga/debounce/paginación/orden/filtros/carreras de requests/mutaciones/auditoría; formulario descriptor-driven con validación y coerción; confirmación destructiva con escritura exacta y aviso de snapshot; tabla controlada con selección; shell responsive y guardia de experiencia.
- **Portabilidad:** cero imports o referencias a `vault`, `musiclab`, `capsules`, `smoke`, contextos del Búnker, servicios de persistencia o `lucide-react` directo. Revisión de fronteras PASS.
- **Validación:** `npx vitest run src/admin` — **8 archivos, 64/64 tests**; `npm test` — **34 archivos, 242/242 tests**; `npm run build` PASS; `npm run lint` PASS.
- **Límites:** el documento de diseño heredado quedó fuera del commit; no hubo merge, push, deploy ni mutación remota. El merge lo debe revisar y ejecutar Edu/coordinador según el protocolo.

## Ronda posterior — P0 completada; FIX-SB bloqueada; V-A1 verificada en remoto

Se continuó con la misma mecánica de Luna después de A1/B2:

- `t_9800bed2` — P0 original: quedó `blocked` porque Hermes entregó un workspace `scratch` vacío, sin `.git` ni checkout. No se modificó el checkout principal.
- `t_09474b0d` — V-A1 original: quedó `blocked` por el mismo workspace inválido. Fue sustituida por `t_e8175ccc`.
- `t_e8175ccc` — V-A1 se ejecutó en un worktree válido con consulta remota estrictamente read-only: `classified_items_table=0`, `files_blurhash_column=0`, `schema_version=1.0.0`, `changes=0`, `changed_db=false`, `rows_written=0`, `rows_read=92`. Quedó `blocked` porque el remoto carece de 0002/0003 y esta tarjeta no autoriza mutaciones.
- `t_6e54a79d` — V-A1-APPLY fue creada a petición de Edu como tarjeta separada para la aplicación remota. No es un bloqueo técnico: por indicación de Edu quedó en **`review`**, pendiente de revisión/OK explícito antes de cualquier mutación. El evento auditado registra la transición `blocked → review`; no se ejecutó SQL de escritura.
- `t_eb4788e7` — FIX-SB quedó `blocked` por workspace scratch inválido, sin `.git`, `package.json` ni archivo objetivo; no se tocó el checkout principal.
- `t_e19b5128` — P0 recreada con workspace Git válido: quedó `done` con commit `6f3d55c` (`fix: exclude worktrees from vitest`). En `vite.config.js` se importó `configDefaults` desde `vitest/config` y se añadió `exclude: [...configDefaults.exclude, '**/.worktrees/**']`. El cambio fue exclusivamente de configuración, dentro del ámbito contratado.

**Evidencia P0 (`t_e19b5128`):** `npx vitest run` recogió **29 archivos** y pasó **202/202 tests** con los worktrees abiertos; `npm run lint`, `npm run build`, `node --check vite.config.js` y `git -c core.whitespace=cr-at-eol diff --check` también pasaron. La revisión independiente no encontró blockers. No hubo merge, push, deploy ni mutación remota.

**Diagnóstico y justificación:** no se ejecutó desde el checkout principal porque el arranque de Luna exige que todo trabajo ocurra en el workspace devuelto por `claim`; saltarse esa regla habría mezclado cambios entre carriles y habría invalidado la trazabilidad. FIX-SB sí está bloqueada por infraestructura. La aplicación remota no está bloqueada por fallo técnico: está en `review` por decisión de Edu y sigue prohibida hasta su OK explícito.

## Validación y límites

- Validación del worktree B1 en commit `ab5d813`: **34 archivos, 242/242 tests** en la suite principal.
- Validación específica del mismo worktree: **8 archivos, 64/64 tests** de B1.
- El checkout principal no incorpora aún `ab5d813`; los resultados anteriores no deben confundirse con una validación post-merge.
- Lint, build y sintaxis de Worker: PASS.
- Migración local fresca: `schema_version=1.1.0`, `classified_items` y `files.blurhash` presentes.
- Contrato de wiring estático: handlers concretos y precedencia `/api/admin/g2` antes de `/api/admin/` verificadas.
- Diff staged: PASS con `core.whitespace=cr-at-eol` (el archivo histórico `worker.js` usa CRLF).
- No hubo deploy, push ni mutación remota D1/R2. V-A1 sí ejecutó una consulta remota estrictamente read-only (`changes=0`, `rows_written=0`, `changed_db=false`); no se aplicaron migraciones.

El test de wiring es deliberadamente estático: verifica la matriz de rutas y sus handlers, no una ejecución del dispatcher real ni una ejecución remota. El riesgo residual está documentado arriba; el coordinador debe revisar el commit `3ee54dc` y la justificación completa como integración fuera de contrato solicitada por Edu.
