# Acta G0/G1 — Refactor e higiene técnica

**Fecha:** 3 de agosto de 2026  
**Plan:** `PLAN_REFACTOR_HIGIENE_2026-08-03.md`  
**Registro operativo completo:** `REGISTRO_TRAZABILIDAD_G2_2026-08-03.md`  
**Estado:** G0/G1 ejecutados; política G2 aprobada por Edu; migración estructural G2 aplicada y verificada en D1 remoto el 3 de agosto de 2026; backfill, endpoints, cron y purgas siguen bloqueados.

## Resultado ejecutivo

G0 y G1 quedan completados como diagnóstico y baseline. G2-1D aplicó únicamente la migración estructural aditiva en D1 remoto; no se ejecutaron borrados, backfill, cambios en R2 ni despliegues.

El código fuente pasa las comprobaciones técnicas. El lint global inicial fallaba porque ESLint recorría bundles temporales generados por Wrangler bajo `.wrangler/`; se añadió esa carpeta a los ignores de ESLint. El lint dirigido sobre código del proyecto pasa.

## Evidencia local

| Comprobación | Resultado |
|---|---|
| `npm test` | ✅ 28/28 |
| `npm run build` | ✅ correcto |
| ESLint dirigido (`src workers tools public/sw.js`) | ✅ correcto |
| Sintaxis Worker (`node --check`) | ✅ correcta |
| Rama/upstream | `master` / `origin/master` |
| Último commit de código | `75093b6` |

## Evidencia D1 no destructiva

Wrangler está autenticado con la cuenta administradora y D1 responde. La consulta UNION de todos los conteos superó el límite de términos de SQLite, por lo que no se considera evidencia válida y debe repetirse por consultas separadas si se necesitan conteos completos.

Sí se obtuvo correctamente:

- `drive_file_id` no nulos en `tracks`: **0**.
- Tracks con `r2_key`: **1.117**.
- Files sin `entry_id` ni `track_id`: **528**.
- Files con `entry_id` inexistente: **0**.
- Files con `track_id` inexistente: **0**.

Los 528 files sin padre no se borran: pueden ser archivos de prueba, reservas, fotos aún no vinculadas u otra categoría. Requieren clasificación por prefijo, fecha, tamaño, existencia del objeto R2 y relación con la operación de aceptación.

El snapshot disponible más reciente es de junio de 2026. No se ha creado uno nuevo porque G2 aún no autoriza operaciones de borrado/migración y el plan exige decidir la política antes de tocar datos. Antes de cualquier modificación remota se tomará un snapshot nuevo y verificable.

## Mapa de dependencias confirmado

- `GoogleDriveService` todavía es importado por `VaultContext` y `PlayerContext`.
- `GoogleDriveService` conserva OAuth GIS/GAPI y lecturas de bibliotecas Drive (`listLibraryContents`, `calculateLibraryUsage`, `checkLibraryCapacity`) además del fallback `drive_file_id` en `getStreamUrl`.
- `VaultContext` sigue siendo dueño combinado de sesión, JWT, carga D1, estado local, polling y API legacy de bibliotecas.
- `PlayerContext` sigue siendo dueño del motor de audio, cola, loop, shuffle, presencia y escucha compartida.
- La búsqueda de `<audio>` encuentra dos elementos en `PlayerContext`: el audio persistente y el audio de precarga. No se ha cambiado porque ADR-018 exige que MusicLab sea el único dueño y la precarga necesita una decisión/validación específica.
- `WorkerClient`, `FileUploadService` y `StatsEngine` son servicios compartidos con consumidores en varios módulos; no se deben dividir sin búsqueda de referencias y tests de contrato.

## Bloqueos de G2 — política de borrado

La implementación actual no tiene una política homogénea:

- `entries` y `tracks`: soft-delete.
- `files`/R2: reserva y purga física separadas; existen files sin entidad padre.
- `playlists`, `drops`, `eras`, `tags`, `queue_items` y sesiones compartidas: operaciones físicas o reemplazos.
- `time_capsules`/`capsule_items`: cascada por FK al borrar cápsula.
- `events`: append-only.

No se cambia ningún endpoint ni esquema hasta que Edu apruebe por entidad: visibilidad, retención, restauración, autorización, cascadas, purga R2 y auditoría.

## Bloqueos de G3 — Drive y documentación

La evidencia confirma que ya no hay tracks activos con `drive_file_id`, pero el fallback y los consumidores de bibliotecas siguen en código. Antes de retirarlos se exige:

1. conteo de filas legacy y archivos relacionados;
2. consumidores de código;
3. prueba de reproducción/lectura que confirme que R2 cubre el uso real;
4. decisión de retirar o mantener una ventana de transición;
5. snapshot y rollback si se toca D1/R2.

También hay documentación histórica contradictoria: `CONTRATO.md`, `PROYECTO.md`, `architecture.md`, `data-flow.md` y otros documentos aún presentan Drive como fuente activa o ADR-028 como pendiente. Se corregirá mediante enmienda documental, no borrando el historial.

## Hallazgo adicional de G2 — fotos sin vínculo relacional

La clasificación no destructiva de los 528 `files` sin padre devuelve:

- `prefix`: `vault/photos` en los 528 casos;
- tipo: `image/jpeg` en los 528 casos;
- fecha: agosto de 2026 en los 528 casos;
- tamaño: presente en todos, aproximadamente 934,756,845 bytes en total;
- `r2_key`: presente en los 528 casos;
- entries que contienen referencias de imágenes/R2: 527;
- files con `entry_id` o `track_id`: 0.

La hipótesis operativa es una vinculación D1 incompleta durante la carga de la prueba: los objetos y las referencias existen, pero la relación `files.entry_id` no quedó escrita. La correlación exacta no destructiva confirma: **527 de 528 files** aparecen en exactamente una entry; **0** aparecen en más de una; **527 entries** tienen exactamente un match; **0 entries** tienen varios matches. Queda un file sin match que requiere identificación controlada, no inferencia.

Esto **no autoriza borrar** ningún objeto ni fila. Antes de corregir los 527 vínculos se necesita snapshot remoto nuevo, revisión del SQL, dry-run que demuestre los pares y rollback. El listado R2 no se pudo completar con la sintaxis inicial de Wrangler; la ayuda de la versión instalada confirma que no existe listado de objetos R2 en ese CLI, por lo que la existencia de los objetos debe verificarse mediante el endpoint/API autorizado o una herramienta S3-compatible, sin borrar nada.

## Resultado de G2-1A — vinculación aprobada

Edu aprobó conservar los 528 files y vincular automáticamente solo coincidencias exactas y únicas. Antes de escribir se creó el snapshot remoto:

- `tools/snapshots/d1_pre_g2_files_link_20260803_055548.sql`
- SHA-256: `e5b57451a8d1f094c4eb9344a165ab83d757b1bce930be8fbea598438b8e4568`

El dry-run produjo 527 pares exactos, 527 files distintos y ninguna coincidencia múltiple. Se aplicó un único `UPDATE` restringido a esos pares. Verificación posterior:

- files vinculados: **527**;
- files sin padre: **1**;
- files sin match: **1**;
- matches múltiples: **0**;
- entries con exactamente un file vinculado: **527**.

El file restante y su objeto R2 no se han tocado. La reparación no elimina datos ni modifica el esquema.

La revisión posterior con SQLite JSON1 confirmó que los 527 vínculos coinciden exactamente con valores `images[*].r2_key`: 527 coincidencias estructurales, 0 vínculos sin coincidencia estructural y 0 entries con varias coincidencias. Se generó un rollback local limitado a los mismos 527 IDs:

- `tools/snapshots/d1_rollback_g2_files_link_20260803.sql`;
- 527 IDs distintos, 21.329 bytes;
- no ejecutado; requiere revisión explícita antes de cualquier uso.

El snapshot y el rollback están cubiertos por `.gitignore` mediante `tools/snapshots/`; no se incluirán en commits.

## Siguiente paso autorizado

Edu ha aprobado el contrato de política G2 consolidado en `PLAN_REFACTOR_HIGIENE_2026-08-03.md` §23, con las precisiones técnicas de §24 y los defaults operativos de §25. La spec técnica §26 y la migración aditiva local `migrations/0001_g2_policy.sql` ya están preparadas y validadas localmente. La revisión SQL, el snapshot remoto, el rollback y las validaciones locales se completaron antes de la aplicación estructural G2-1D. Como Wrangler no ofrece dry-run para esta operación, la aplicación remota se ejecutó solo después de la autorización explícita de Edu. El siguiente trabajo es integrar y probar el uso de las tablas G2; hasta entonces quedan prohibidos:

- borrar files u objetos R2;
- cambiar soft-delete/hard-delete;
- añadir columnas de archivo o migraciones;
- retirar fallback Drive;
- eliminar stubs del Service Worker;
- refactorizar contextos críticos;
- desplegar Worker o frontend.

## Resultado G2-1B — diseño y validación local

Se creó un contenedor exclusivamente local para las estructuras de política:

- `migrations/0001_g2_policy.sql`: `file_references`, `admin_audit_log`, `repair_queue` y `repair_attempts`, con índices, FK y constraints; sin backfill ni cambios destructivos.
- `workers/utils/g2-policy.js`: transiciones puras de reparación/purga, backoff, ventana máxima de 24 horas y leases de 5 minutos.
- `workers/utils/__tests__/g2-policy.test.js`: cobertura de estados, fases, errores permanentes/transitorios, límite de reintentos y leases.
- `wrangler.toml`: `migrations_dir = "migrations"`; no se añadió trigger `scheduled` todavía.

Evidencia local:

- migración ejecutada con `npx wrangler d1 execute el-bunker-db --local --file=migrations/0001_g2_policy.sql`: **13 comandos correctos**;
- segunda ejecución sobre la misma D1 local: **13 comandos correctos**, confirmando idempotencia estructural;
- tablas e índices G2 presentes en `sqlite_master`;
- tests focales G2: **7/7**;
- no se usó `--remote`, no se modificó D1/R2 de producción y no se hizo backfill.

La revisión independiente detectó y se corrigió: transición inválida de fase R2, fechas inválidas en retry/lease, lease sin expiración centralizada, FK de referencias sin política explícita y unicidad vulnerable a `NULL` en `source_path`. El contenedor queda preparado para revisión SQL, no para aplicación remota.

`CREATE TABLE IF NOT EXISTS` garantiza que la estructura nueva sea repetible en una base limpia, pero no altera una tabla preexistente con una definición distinta. Antes de aplicar esta migración a cualquier D1 existente habrá que comprobar el esquema real y preparar una migración específica/rollback si procede; la segunda ejecución local solo acredita idempotencia estructural de estas tablas nuevas.

Se añadió `tools/0001_g2_policy.rollback.sql`, fuera de `migrations/` para que Wrangler nunca lo trate como migración aplicable; está limitado a las cuatro tablas G2 nuevas. Validación local completa en una D1 temporal:

- schema base aplicado;
- migración G2 aplicada dos veces mediante `wrangler d1 migrations apply --local`;
- `UNIQUE` de referencias, FK `ON DELETE RESTRICT`, `CHECK` de estado y unicidad de `operation_id` rechazaron escrituras inválidas;
- rollback aplicado desde `tools/0001_g2_policy.rollback.sql`;
- tablas G2 eliminadas y tablas base `users`, `files`, `events` conservadas;
- resultado: `G2_LOCAL_SQL_VALIDATION=PASS`.

No se creó un script permanente de validación porque la herramienta de escritura no pudo materializarlo; la comprobación se ejecutó directamente con comandos locales reproducibles y el rollback sí queda versionable como artefacto revisable.

## Resultado G2-1C — preflight remoto y snapshot

Se inspeccionó D1 remoto en modo lectura antes de considerar cualquier aplicación:

- identidad Wrangler: cuenta administradora autenticada;
- D1: `el-bunker-db`, ID `795e5e88-6fab-4aa2-a294-d24640a0de05`, región `WEUR`;
- esquema: 18 tablas incluyendo `_cf_KV`; las cuatro tablas G2 no existen;
- `files.entry_id` mantiene `ON DELETE CASCADE`, por lo que el backfill/FK compartida sigue bloqueado y no se incluye en `0001_g2_policy.sql`;
- migraciones pendientes: únicamente `0001_g2_policy.sql`; el rollback está fuera de `migrations/` y Wrangler no lo aplicará;
- no existe opción `--dry-run` para `d1 migrations apply` en Wrangler 4.118.0.

Snapshot D1 remoto válido, solo lectura:

- archivo gitignored: `tools/snapshots/d1_pre_g2_policy_20260803.json`;
- timestamp UTC: `2026-08-03T15:45:08.049610+00:00`;
- SHA-256: `e3093b1ffe39b007a57c44ff8a52e874e4bff1f4a701e69d6f4db16558502039`;
- 14 tablas / 3.299 filas capturadas; 0 tablas fallidas.

Manifiesto técnico R2/D1, sin enumerar ni modificar objetos:

- archivo gitignored: `tools/snapshots/r2_manifest_pre_g2_policy_20260803.json`;
- files D1: 528; bytes registrados: 934.756.845; claves distintas: 528;
- objetos R2 enumerados: no; la migración estructural no toca objetos;
- SHA-256: `aedee399aef1d8ab7f4c63969e1dc9d48fece84e21f648a5e1b53b916ec74653`.

**Gate previo cerrado:** Edu autorizó explícitamente continuar con «Adelante». Se ejecutó `npx wrangler d1 migrations apply el-bunker-db --remote` el 3 de agosto de 2026. Wrangler informó `0001_g2_policy.sql ✅` y `Executed 14 commands`. No se ejecutó el rollback, no se modificó R2 y no se hizo backfill.

## Resultado G2-1D — aplicación remota estructural

La migración forward quedó aplicada en D1 `el-bunker-db` (`795e5e88-6fab-4aa2-a294-d24640a0de05`). Verificación posterior en modo lectura:

- Wrangler: `No migrations to apply`;
- existen las cuatro tablas: `file_references`, `admin_audit_log`, `repair_queue`, `repair_attempts`;
- existen los 9 índices explícitos G2 esperados (además de los autoíndices de PK/UNIQUE);
- `file_references.file_id` referencia `files(id)` con `ON DELETE RESTRICT`;
- `source_path` es `NOT NULL DEFAULT ''`;
- constraints de unicidad y estructura de `repair_queue` presentes;
- filas G2: `file_references=0`, `admin_audit_log=0`, `repair_queue=0`, `repair_attempts=0`;
- baseline conservado: `users=3`, `files=528`, `entries=527`, `tracks=1117`, `events=3542`.

La aplicación fue exclusivamente estructural y aditiva. El rollback continúa en `tools/0001_g2_policy.rollback.sql`, fuera de `migrations/`; no se ha ejecutado. Siguen expresamente fuera de alcance: backfill de referencias, endpoints administrativos, scheduler/cron, cambios de FKs existentes, borrado de files/objetos R2, purgas y despliegue del Worker/frontend.

El siguiente gate es implementar y revisar el uso de estas tablas en código, con tests de integración contra D1 local y una decisión separada antes de cualquier operación de reparación o purga.

## Resultado G2-1E — repositorio D1 preparado, todavía inactivo

Se añadió un adaptador interno no registrado en el router:

- `workers/utils/g2-repository.js`: persistencia acotada para `admin_audit_log`, alta idempotente de `repair_queue`, leases condicionales y `repair_attempts` append-only;
- `workers/utils/__tests__/g2-repository.test.js`: 10 casos con mock D1;
- no se modificaron rutas, `worker.js`, `workers/schema.sql`, scheduler, R2 ni datos remotos;
- el adaptador no está importado por el Worker y no puede activar por sí mismo una reparación o purga.

Guardrails implementados: JSON limitado y sin URLs, claves R2 sin query/token, fechas UTC ISO canónicas, scope conflictivo rechazado al reutilizar `operation_id`, lease atómico `UPDATE ... WHERE`, transición `pending → retrying` y máximo de 3 intentos.

Validación G2-1E: **17/17 tests focales**, sintaxis y lint focal **OK**.

Bloqueos explícitos antes de integrar operaciones de escritura: `attempt_count` debe actualizarse coordinadamente con la inserción de `repair_attempts`; y debe resolverse la semántica de `operation_id` en `admin_audit_log` (la tabla permite múltiples registros por operación para plan/resultado, mientras que la unicidad de la operación ya está garantizada en `repair_queue`). No se crea una migración adicional por estas reservas.

## Resultado G2-1F — inspección admin-only de solo lectura

Se integró una única superficie administrativa read-only:

- `GET /api/admin/g2/inspect`, registrado en `workers/worker.js`;
- doble autorización: identidad `admin` y comprobación `users.role = 'admin'` en D1;
- devuelve presencia de las cuatro tablas G2, contadores agregados y estados de `repair_queue`;
- no devuelve payloads de reparaciones, claves R2, contenido privado ni filas de auditoría;
- ejecuta únicamente consultas `SELECT`; no importa ni invoca `g2-repository`;
- no modifica D1, entidades de producto, R2 ni configuración de cron/scheduler.

Tests de contrato del handler: **6/6** (401, 403 por identidad, 403 por rol D1, respuesta read-only, estados de cola y método/ruta inválidos). Batería G2 focal: **23/23**; sintaxis, lint dirigido y `git diff --check` de los archivos nuevos: **OK**.

La revisión independiente aprobó el contenedor. La prueba del dispatcher completo queda cubierta por la importación/registro estático y la sintaxis del Worker; no se añade una prueba que arranque el Worker porque este contenedor no autoriza despliegue ni ejecución remota.

Siguen bloqueados: `POST` de planificación o confirmación, restauración/archivado, purgas, ejecución de `repair_queue`, `scheduled`, backfill, cambios de FK, R2, migraciones adicionales, despliegue y UI administrativa.

Siguiente gate: diseñar el procedimiento admin de **planificación no destructiva** con resumen de impacto, snapshot/manifiesto y auditoría previa, pero sin confirmación ni ejecución automática hasta revisión específica del contrato y pruebas D1/R2 sintéticas.

## Resultado G2-1G — preview admin-only de impacto, solo lectura

Se amplió `GET /api/admin/g2/preview-purge?entity_type=entry|track|file&entity_id=...` dentro de `workers/routes/admin-g2.js`.

- Doble autorización: identidad `admin` y `users.role = 'admin'`.
- Solo devuelve metadatos agregados: estado soft-delete, cantidad legacy, bytes, referencias de policy y referencias compartidas.
- No devuelve `r2_key`, contenido, payloads, listas de IDs ni filas de auditoría.
- Distingue archivos legacy (`files.entry_id`/`track_id`) de `file_references` G2.
- Declara expresamente `ownershipCoverageComplete: false` y `readyForSnapshot: false`; el preview no autoriza purgas ni snapshots.
- Validación de tipo e ID, incluidos caracteres de control y longitud máxima.
- No ejecuta INSERT/UPDATE/DELETE/ALTER/DROP, no toca R2, no usa `g2-repository` ni scheduler.

Tests focales del contenedor: **28/28**; sintaxis Worker/ruta, lint dirigido y `git diff --check`: **OK**. Revisión independiente: **aprobado**, manteniendo los flags de cobertura/snapshot en `false` hasta completar y verificar el backfill de referencias.

El siguiente contenedor será una clasificación/backfill **local sintética** de `file_references`, con dry-run y rollback, sin aplicar D1 remoto ni modificar R2.

## Resultado G2-1H — clasificador local de referencias

Se creó `workers/utils/g2-file-classifier.js` con tests en `workers/utils/__tests__/g2-file-classifier.test.js`.

- Funciones puras en memoria: no reciben `env`, no acceden a D1/R2/red y no están importadas por Worker/rutas.
- Clasifica exhaustivamente files como `exact`, `shared`, `ambiguous` u `orphans`.
- Examina `files.entry_id/track_id`, `entries.content.images[*].r2_key`, `tracks.r2_key` y `tracks.thumbnail`.
- Un FK sin evidencia inferida, un FK colgante o un conflicto FK/JSON/campo queda `ambiguous`; no se genera plan para esas categorías.
- El plan solo acepta candidatos exactos, valida owner/source contra los CHECK de la migración y genera SQL parametrizado forward + rollback por tupla.
- IDs deterministas mediante representación canónica JSON y límite de longitud; fixtures con IDs duplicados son rechazados.
- El rollback incluye `executeOnlyWhenInsertChanges: 1`: el ejecutor futuro solo podrá aplicarlo si el INSERT correspondiente confirmó `changes = 1`, para no borrar filas preexistentes.

Validación focal: **8/8 tests**, lint y sintaxis **OK**. Revisión independiente: aprobado con la reserva operativa del guard de `changes` documentada.

El siguiente paso es ejecutar el plan únicamente contra una D1/SQLite local sintética, verificar constraints y probar rollback; queda prohibido usar D1 remoto o R2.

## Resultado G2-1I — dry-run D1 local y rollback sintético

Se ejecutó el plan sobre la D1 local persistente de Wrangler, sin `--remote` y sin R2.

- Primer intento documentado: falló antes de ejecutar fixtures porque `.read` no es aceptado por `wrangler d1 execute`; no produjo mutación remota.
- Segundo intento: `workers/schema.sql` no se reaplicó porque la D1 local ya contenía `users`; el schema base no es idempotente. No se reseteó ni se borró la D1 local.
- Tercer intento válido: migración G2 `IF NOT EXISTS` aplicada; fixtures sintéticos con IDs únicos creados; tablas G2 y FK verificadas.
- Inserción exacta en `file_references`: `inserted_changes=1`, referencia presente: 1.
- Rollback por tupla: `rollback_changes=1`, referencias restantes: 0.
- `files` y `entries` sintéticos preservados: 1/1.
- Limpieza posterior: referencias/files/entries/users sintéticos restantes: 0/0/0/0; temporales `.tmp-g2-*`: ninguno.

El rollback se ejecutó solo después de que la inserción confirmara `changes=1`, conforme al guard del plan. No se aplicó ningún SQL del clasificador a D1 remoto; el SQL usado fue exclusivamente sintético y local.

G2-1I queda cerrado. Siguiente gate: preparar snapshot D1 remoto y plan exacto de backfill en modo read-only. Cualquier escritura remota de `file_references` requiere autorización explícita separada; siguen bloqueados R2, purgas, reparaciones, cron, cambios de FK y despliegue.

## Resultado G2-1J — snapshot remoto y clasificación agregada

- La consulta remota D1 read-only falló con Cloudflare **7403** (`account is not valid or is not authorized to access this service`); no se ejecutó SQL mutante.
- `wrangler whoami` confirmó sesión OAuth autenticada, pero no se considera prueba de permiso efectivo para query D1.
- El export remoto read-only sí se completó mediante `npx wrangler d1 export el-bunker-db --remote` y se descargó en `tools/snapshots/d1_pre_g2_backfill_20260803.json` (gitignored).
- Snapshot: **2.269.865 bytes**; SHA-256 `13212e41824032834749a43841204badfe81b5698ac8731d17911c0c6b1ef654`.
- Análisis local sin imprimir filas privadas: 23 tablas; `files=528`, `entries=527`, `tracks=1117`; G2 vacío; 1 file sin FK; 527 matches FK/JSON exactos.
- Plan agregado `tools/snapshots/g2_backfill_plan_20260803.json` (gitignored), SHA-256 `4d1bad7e101010ff760279a9c3ba6b9751944183c1aa4eb7eba0f6991b55ba58`: `exact=527`, `shared=0`, `ambiguous=0`, `orphans=1`, `planStatus=blocked_unresolved_categories`, `planReferenceCount=0`.
- El único huérfano queda descrito solo de forma agregada: 1 objeto `vault/photos`, `image/jpeg`, fecha `2026-08-02`, tamaño 1.234 bytes; fingerprint no reversible `d4ba8badb7b488b88c012599023caf45ec6b5e4730b1455cc9c8260e273466ab`. No se muestra ni se infiere su clave/ID.

El backfill remoto queda bloqueado por **7403** y por el huérfano no identificado. No se tocaron R2, filas remotas ni despliegues.

## Resultado G2-1K — endurecimiento del ejecutor local (`EJECUTADO · VALIDACIÓN LOCAL`)

- Se creó/endureció `workers/utils/g2-reference-executor.js`; permanece deliberadamente sin importar en `worker.js` ni en rutas.
- La allowlist exige igualdad exacta con las dos plantillas SQL canónicas generadas por `g2-file-classifier`; se rechazan sufijos, cláusulas extra y sentencias no generadas.
- Cada rollback debe tener exactamente cinco bindings y coincidir con `up.bindings.slice(1)` mediante comparación estricta; un desajuste se rechaza antes de ejecutar SQL.
- Se valida el plan completo, incluyendo todas sus sentencias, antes del primer `run()`.
- El modo seguro por defecto no permite escrituras; además se exige el guard operativo existente. Este marcador de código no equivale por sí mismo a autorización humana ni habilita el Worker.
- Cada INSERT debe devolver `changes=1`. Solo esas inserciones confirmadas entran en rollback; una inserción con otro resultado aborta el lote.
- Un fallo de rollback queda expuesto junto con el error original, el número revertido y `rollbackError`; no se oculta una posible inconsistencia parcial.
- Tests añadidos para SQL malicioso, bindings desparejados, validación de una sentencia posterior antes del primer write, rollback parcial y rollback fallido.
- Validación focal: **18/18 tests**, lint focal y sintaxis **OK**.
- No se usó `--remote`, no se ejecutó el plan contra D1/R2, no se desplegó y no se registró el ejecutor en producción.

El ejecutor queda preparado únicamente como componente local revisable. El siguiente gate no cambia: resolver el acceso Cloudflare **7403**, resolver con evidencia el único huérfano y regenerar un plan exacto antes de considerar cualquier autorización humana separada para una escritura remota.

## Resultado G2-1L — validación final del contenedor (`EJECUTADO · VALIDACIÓN LOCAL`)

- Suite completa `npm test`: **79/79 tests**, 11 archivos, código 0.
- `npm run lint`: **OK**, código 0.
- `npm run build`: **OK**, código 0.
- `node --check`: Worker, ejecutor y clasificador **OK**.
- `git diff --check`: **OK**.
- Aislamiento confirmado: `g2-reference-executor` no aparece importado en `workers/worker.js` ni en `workers/routes`.
- Residuos: no existen temporales `.tmp-g2-*`.
- No se usó `--remote`, no se modificó D1/R2, no hubo despliegue y no se ejecutó backfill.

G2-1K/L queda cerrado como contenedor local revisado. El siguiente gate sigue bloqueado por Cloudflare 7403, por el único huérfano sin identificación probada, por la necesidad de regenerar el plan exacto y por la autorización humana separada requerida antes de cualquier escritura remota.

## Resultado G3-1 — frontera Google OAuth / D1-R2 y preflight reanudado (`EJECUTADO · VALIDACIÓN`)

- `GoogleAuthService.js` queda limitado a Google Identity Services: scopes `userinfo.email` y `userinfo.profile`; no contiene scopes Drive, APIs Drive ni persistencia.
- `GoogleDriveService.js` queda como facade legacy de compatibilidad: reexporta auth, reproduce desde R2 mediante `r2_key` y sus APIs de biblioteca/capacidad fallan explícitamente sin red. No hay consumidores del facade en `src`.
- Se añadió una prueba de frontera que cubre SW/API, OAuth sin Drive, facade retirado e imports estáticos/dinámicos/require/side-effect del facade en todo `src`.
- Documentación actualizada: `CONTRATO.md` (ADR-002/005/016/024/028), `architecture.md`, `data-flow.md`, `event-lifecycle.md`, `ownership-map.md` y `technical-debt.md`. Las referencias antiguas se conservan como histórico marcado, no como comportamiento vigente.
- Preflight D1 remoto actual: lectura autorizada correcta; tablas G2 presentes y vacías; conteos agregados `files=528`, `entries=527`, `tracks=1117`, `file_references=0`, `admin_audit_log=0`, `repair_queue=0`, `repair_attempts=0`.
- Snapshot read-only de reanudación: `tools/snapshots/d1_pre_g2_backfill_resume_20260803.sql`, 2.269.865 bytes, SHA-256 `13212e41824032834749a43841204badfe81b5698ac8731d17911c0c6b1ef654`.
- Plan agregado: `tools/snapshots/g2_backfill_plan_resume_20260803.json`, SHA-256 `a91fabd2a3a81492d324ff0972cd0e77167819b0fb0fae42c39b73b83b7c72af`; `exact=527`, `shared=0`, `ambiguous=0`, `orphans=1`, `planStatus=blocked_unresolved_categories`, `planReferenceCount=0`.
- El huérfano permanece intacto. La comprobación de lectura R2 devolvió `127` porque la instalación de Wrangler no dispone de esa suborden; es una limitación del CLI, no evidencia de inexistencia del objeto. No se imprimieron ni conservaron clave, contenido o filas privadas.
- Aceptación pública inicial: `https://el-bunker-beige.vercel.app` cargó la pantalla de acceso, con cero errores de consola; no se introdujeron credenciales ni se ejecutaron mutaciones UI.
- Validación local final del contenedor: **81/81 tests**, lint, build, sintaxis Worker y `git diff --check` OK.
- No hubo despliegue, backfill, purga, modificación remota de D1/R2 ni uso del ejecutor G2 contra producción.

G3-1 queda cerrado. Siguiente gate: G4 incremental — extraer primero normalización/acciones puras y sesión/auth compatible, con búsqueda de consumidores y tests; no dividir `PlayerContext` ni tocar el único `<audio>` hasta disponer de red de pruebas específica.

## Resultado G4-1 — extracción pura de payloads MusicLab (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Objetivo cerrado: extraer normalización de tracks fuera del hook sin cambiar `useMusicActions`, `useVault()`, WorkerClient, endpoints, persistencia ni audio.
- Archivos nuevos: `src/musiclab/MusicPayloadBuilder.js` y `src/musiclab/__tests__/MusicPayloadBuilder.test.js`.
- Archivo integrado: `src/musiclab/useMusicActions.js` importa `buildEditPayload` y `normalizeNewTrack`; se conservaron los flujos POST/PATCH, limpieza de uploads y `patchDb`.
- `buildEditPayload` conserva la whitelist de campos API y la precedencia existente `tag || vibe || null`; elimina `tag`, `vibe` y campos UI/File del payload.
- `normalizeNewTrack` conserva la precedencia `created.r2_key → uploaded.r2_key → null`, mapea `created.tag_id` a `tag` y no retiene el objeto File. Se endureció la tolerancia ante respuestas nulas/parciales del servidor mediante optional chaining.
- Tests focales: **4/4**. Suite completa: **85/85** en 12 archivos.
- `npm run lint`: **OK**; `npm run build`: **OK**; sintaxis Worker: **OK**; `git diff --check`: **OK**.
- Revisión independiente: aprobada; no se detectaron cambios de contrato, doble estado, segundo `<audio>` ni regresión de persistencia.
- No hubo acceso remoto, mutación D1/R2, deploy, migración, commit ni push en este contenedor.

G4-1 queda cerrado como extracción local revisada. Siguiente gate: G4-2 — inventariar y extraer sesión/auth de `VaultContext` manteniendo `useVault()` y nombres públicos; antes habrá búsqueda completa de consumidores y pruebas de contrato. `PlayerContext`, el único `<audio>`, las tres tabs y WorkerClient permanecen fuera de alcance.

## Resultado G4-2 — frontera persistida de sesión/JWT (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Objetivo cerrado: aislar almacenamiento/restauración/limpieza de sesión y propagación del JWT sin extraer aún la orquestación React/OAuth ni cambiar `useVault()`.
- Archivo nuevo: `src/core/SessionBridge.js`; tests: `src/core/__tests__/SessionBridge.test.js`; integración: `src/core/VaultContext.jsx`.
- `SessionBridge` no contiene React, red ni OAuth. Centraliza claves `bunker_jwt`, `bunker_session_kind`, `bunker_user` y `bunker_access_key`, además de aplicar/limpiar el JWT en `WorkerClient`, `FileUploadService` y `StatsEngine`.
- Se preservó el comportamiento de login Google, acceso por clave, restauración, logout, reautenticación y todos los nombres públicos del contexto.
- Endurecimientos incorporados: storage bloqueado/privado, `applyJwt(null)` no persiste la cadena `null`, y JSON de usuario corrupto no invalida credenciales JWT válidas.
- La clave de acceso solo se conserva en `localStorage` cuando el usuario marca «recordar en este dispositivo», igual que antes; no se registran secretos en documentación ni tests persistentes.
- Tests focales: **11/11** (SessionBridge + frontera de servicios). Suite completa: **92/92** en 13 archivos.
- `npm run lint`: **OK**; `npm run build`: **OK**; sintaxis Worker: **OK**; `git diff --check`: **OK**.
- Revisión independiente: aprobada.
- No hubo acceso remoto, mutación D1/R2, deploy, migración, commit ni push.

G4-2 queda cerrado como extracción local revisada. Siguiente gate: G4-3 — separar carga/refresh D1 de estado UI y polling, preservando `WorkerClient`, `useVault()`, el único `<audio>` y las tres tabs. Se requiere inventario de `_buildDbFromWorker`, `_completeSession`, `refreshDb`, heartbeat y efectos antes de editar.

## Resultado G4-3 — frontera de lectura Worker/D1/R2 (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Objetivo cerrado: extraer la construcción y normalización de la DB desde Worker API sin mover el estado React ni el polling.
- Archivo nuevo: `src/core/WorkerDataService.js`; tests: `src/core/__tests__/WorkerDataService.test.js`; integración: `src/core/VaultContext.jsx`.
- El servicio conserva los siete reads paralelos (`entries`, `eras`, `tracks`, `tags`, `playlists`, `drops`, `files`), `/api/config`, parseo seguro, mapeo `from_user/to_user`, fallback no fatal de files y fecha de aventura por defecto.
- `VaultContext` sigue siendo dueño de `db`, `dbStatus`, `refreshDb`, heartbeat, efectos, auth y polling; no se creó un segundo estado ni se cambió `useVault()`.
- Barrera añadida a `service-boundaries.test.js`: la carga debe pasar por `WorkerDataService` y no reaparecer inline en `VaultContext`.
- Validación inicial: focal **16/16**; suite completa **97/97**; lint, build, sintaxis Worker y diff-check OK. Validación posterior de barrera: **10/10** y diff-check OK.
- Revisión independiente: aprobada.
- No hubo acceso remoto, mutación D1/R2, deploy, migración, commit ni push.

G4-3 queda cerrado como extracción local revisada. Siguiente gate: G4-4 — extraer funciones puras de cola/shuffle/normalización de `PlayerContext`, sin mover el proveedor, la sincronización compartida ni el único `<audio>`.

## Resultado G4-4 — transformaciones puras de cola/audio (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Objetivo cerrado: extraer Fisher-Yates y la política de límite de cola sin mover el proveedor ni el motor de audio.
- Archivo nuevo: `src/core/QueueTransforms.js`; tests: `src/core/__tests__/QueueTransforms.test.js`; integración: `src/core/PlayerContext.jsx`.
- `fisherYatesInPlace` conserva el algoritmo existente; `enforceQueueLimit` conserva la prioridad de tracks manuales y el límite `MAX_QUEUE_SIZE=75`.
- `PlayerContext` mantiene el estado React, refs, `<audio>`, presencia, escucha compartida, sincronización Worker y exports públicos. Solo usa un wrapper estable `limitQueue` para inyectar el límite actual.
- El mock de `Math.random` queda restaurado mediante `finally` incluso si una aserción falla.
- Validación focal: **21/21**; suite completa: **102/102** en 15 archivos; lint, build y sintaxis Worker OK.
- `git diff --check` respetando CRLF preexistente (`core.whitespace=cr-at-eol`): **OK**. La normalización global de line endings queda fuera de alcance para evitar ruido masivo.
- Revisión independiente: aprobada.
- No hubo acceso remoto, mutación D1/R2, deploy, migración, commit ni push.

G4-4 queda cerrado como extracción local revisada. Siguiente gate: G4-5 — cerrar fronteras restantes de contextos/acciones con inventario de consumidores; no dividir `PlayerContext` ni crear segundo estado de audio.

## Resultado G4-5 — filtros de Timeline aislados (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Objetivo cerrado: separar estado/derivaciones de filtros de `Timeline.jsx` sin cambiar props, presentación ni datos.
- Archivo nuevo: `src/capsules/useTimelineFilters.js`; tests: `src/capsules/__tests__/useTimelineFilters.test.js`; integración: `src/capsules/Timeline.jsx`.
- Se conservaron whitelist de track events, filtros módulo/tipo/era/usuario, payload JSON tolerante, “Un día como hoy”, tipos disponibles y paginación de 50.
- Los handlers del hook reinician paginación igual que la implementación anterior; la UI conserva botones, etiquetas, modo timeline/compact y composición.
- Primer fallo documentado: el test pasó eventos sin whitelist a `getTodayEvents`; se corrigió para respetar el contrato real del hook (`filteredEvents → todayEvents`).
- Validación final: focal **10/10**; suite completa **107/107** en 16 archivos; lint, build, sintaxis Worker y diff-check CRLF-aware OK.
- Revisión independiente: aprobada.
- No hubo acceso remoto, mutación D1/R2, deploy, migración, commit ni push.

G4-5 queda cerrado como extracción local revisada. G4 estructural queda completado en sus contenedores seguros. Siguiente gate: G5 — inventario y sustitución de iconografía funcional/emojis, preservando cualquier emoji que sea contenido de usuario.

## Resultado G5 — iconografía funcional y aliases legacy (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Objetivo cerrado: sustituir iconos Unicode funcionales por el sistema SVG `Icon` existente sin migrar contenido persistido.
- Archivos: `src/core/ui/Icon.jsx`, `src/core/ui/__tests__/Icon.test.js`, `src/musiclab/MusicLab.jsx` y `src/musiclab/DropsManager.jsx`.
- `resolveIconName` permite verificar y mantener aliases legacy para emojis/iconos históricos de taxonomía; los valores persistidos de `AddEntryForm` y `tokens.js` no se alteran.
- Reemplazos funcionales: vistas list/grid/card (incluido icono `grid` real), opciones de ordenación, tabs queue/drops, temporizadores y favoritos de Drops, y llamada visual de lanzamiento de Drop.
- Se conservaron labels/contexto accesible y no se añadió dependencia: `lucide-react` ya formaba parte del proyecto.
- Validación focal: **8/8**; suite completa: **110/110** en 17 archivos; lint, build, sintaxis Worker y diff-check OK.
- Revisión independiente: aprobada.
- No hubo acceso remoto, mutación D1/R2, deploy, migración, commit ni push.

G5 queda cerrado como sustitución funcional compatible. Siguiente gate: G6 — aceptación responsive móvil/desktop en navegador con capturas y comprobación de overflow, modales y controles táctiles.

## TL;DR ejecutivo — estado al cierre de G4-2

- **Hecho:** G0/G1 documentados; G2 implementado hasta contenedores locales y endpoint read-only; G3 separó Google OAuth de Drive; G4-1 extrajo transformaciones MusicLab; G4-2 aisló la frontera de sesión/JWT.
- **Verificado:** suite **92/92**, lint, build, sintaxis Worker y diff-check en verde; revisiones independientes aprobadas.
- **Protegido:** D1/R2 siguen siendo la fuente de datos; Google solo autentica; `useVault()`, las tres tabs, `PlayerContext` y el único `<audio>` no se han roto ni duplicado.
- **No hecho en G4-2:** no deploy, no commit/push, no backfill, no purga, no R2/D1 remoto ni migración nueva. Como antecedente separado, G2-1D sí aplicó una migración estructural remota autorizada; no pertenece a G4-2.
- **Bloqueos existentes:** Cloudflare 7403 y un huérfano R2/D1 sin identificar mantienen bloqueado el backfill; la aceptación visual completa móvil/desktop aún es un gate posterior.
- **Siguiente recomendado histórico:** G4-3, extracción de carga/refresh D1 con búsqueda de consumidores y tests antes de tocar el contexto.

## Resultado G6 — responsive y aceptación de navegador (`EJECUTADO · VALIDACIÓN PARCIAL`)

- Layout y ausencia de overflow horizontal verificados en la ejecución de navegador para móvil **390×844** y desktop **1440×900**; la pantalla pública de acceso y el panel de acceso test/admin fueron localizados sin credenciales ni mutaciones.
- El primer diagnóstico encontró una key duplicada bajo `StrictMode` en `BootTerminal`; se corrigió limpiando timers y estabilizando `onComplete`.
- El script Chromecast dejó de cargarse en el `head`; ahora se solicita bajo demanda por HTTPS mediante `CastSdkService`, con timeout, limpieza del callback global, deduplicación y reintento.
- Limitación honesta: las ejecuciones finales del agente de navegador no dejaron un artefacto legible de consola/captura. Por tanto **no se declara consola limpia, aceptación visual completa, instalación PWA ni prueba real de CAST**.
- Cambios locales: `src/layout/LoginScreen.jsx`, `index.html`, `src/core/CastSdkService.js`, `src/core/PlayerContext.jsx`, test de Cast. Se retiró también el emoji funcional del texto de lanzamiento de Drop en `src/musiclab/MusicLab.jsx`.

## Resultado G7 — Service Worker y contrato PWA (`EJECUTADO · VALIDACIÓN`)

- `SmokeSession` ya referencia `/icons/icon-192.png`, recurso existente; se eliminó la referencia inexistente `/manifest-icon-192.png`.
- Contrato añadido en `src/core/__tests__/service-boundaries.test.js`: manifest y shortcuts resolubles, `/api/` sin `respondWith/cacheFirst/cache.put`, `/music/` delimitado a `cacheFirst`, lifecycle `skipWaiting/clients.claim`, y ausencia de listeners Push/Background Sync.
- El SW mantiene precache/versionado, Network-First para navegación y fallback offline. El fallback runtime del SW se verifica estáticamente; no se presenta como prueba de instalación offline en un dispositivo real.
- Validación final del contenedor: focal **6/6**; suite **114/114** en 18 archivos; lint, build, sintaxis SW/Worker y diff-check CRLF-aware **OK**. Revisión independiente: aprobada.
- No hubo deploy, commit/push, mutación D1/R2 ni cambio de contrato de producto.

## Resultado G8 — documentación sincronizada (`EJECUTADO · ESCRITURA LOCAL`)

- Actualizados `docs/Nucleo/ESTADO.md`, `docs/Nucleo/SESION.md`, `src/MANUAL_USUARIO_EL_BUNKER.md` y `docs/Arquitectura/technical-debt.md` para reflejar D1/R2 como persistencia, Google solo auth, tres tabs y offline limitado sin sync automática.
- El histórico de auditorías y ADRs no se borra ni se reescribe silenciosamente; contradicciones normativas requieren enmienda separada.
- Validación global posterior a la edición documental: **114/114 tests**, lint/build/sintaxis SW-Worker/diff-check OK. La búsqueda de emojis funcionales solo devuelve valores persistidos permitidos en Vault (`AddEntryForm`/categorías), no iconos funcionales activos en MusicLab/Drops/VaultGallery.
- Reanudación autónoma (4-ago): VaultGallery sustituyó sus seis iconos de navegación Unicode por `Icon` SVG; contrato focal y suite completa permanecen verdes. G6 continúa parcial por falta de artefacto navegador legible.

## Resultado G9 — resolución de bloqueos de reanudación (4-ago, con Edu)

- **Cloudflare 7403 resuelto:** la query remota D1 funciona de nuevo (verificado por artefacto: `files=527` tras el borrado, `PRAGMA table_info` y consultas SELECT correctas). El fallo de G2-1J fue transitorio; no es un bloqueo de permiso vigente. El backfill remoto deja de estar bloqueado por acceso.
- **Huérfano G2 resuelto con autorización de Edu:** identificado como `prueba_dod.jpg` (fila `c4c564a9-1123-4402-86f4-c1e386ff1669`, 1.234 B, `vault/photos`, 2026-08-02 14:18:53), residuo de la prueba de Definition of Done del 2-ago. Su objeto R2 **no existe** (verificado con `wrangler r2 object get`: "The specified key does not exist"). Con OK explícito de Edu se ejecutó `DELETE FROM files WHERE id = 'c4c564a9…' AND entry_id IS NULL AND track_id IS NULL`: `changes=1`, verificado después: files 528→**527**, huérfanos sin padre **0**.
  - Rollback preparado y conservado fuera del repo: `C:\proyectos\.trabajo\orphan_rollback.sql` (INSERT completo de la fila) + `orphan_row_backup.json` (SELECT original).
  - Pendiente menor: el segundo residuo anotado en ESTADO.md ("objeto R2 `c1f11fad…`") no es verificable con este CLI de Wrangler (no lista objetos); requiere la API autorizada o una herramienta S3-compatible.
- **Aceptación visual G6 con artefacto navegador (4-ago):** login test/admin verificado de punta a punta (canje de clave → JWT en sessionStorage → vault con 527 entries reales); los 6 modos WALL/CINEMA/MAP/DIALOGUE/EXHIBITION/REEL confirmados con `<svg>` real por inspección DOM (no por visión); consola sin errores JS; sin overflow horizontal a 1264px. Límite honesto: el agente headless no emula viewport móvil (`resizeTo` sin efecto), la comprobación 390x844 sigue pendiente de dispositivo real.
- **PWA parcial verificada:** manifest válido (standalone, 5 iconos, 2 shortcuts), SW registrado y `activated` controlando la página, cachés pobladas (`bunker-dev` 3, `bunker-runtime-dev` 8). Instalación/offline/update en runtime solo en dispositivo físico.
- **Preparado para retirada del facade Drive:** verificado 0 tracks con `drive_file_id` y 0 consumidores de `GoogleDriveService` en `src/`. Decisión de retirada sigue pendiente de Edu.
- Sin commit/push/deploy en este contenedor; el commit del refactor G0-G8 queda autorizado por Edu como paso siguiente.
