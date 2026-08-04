# Registro de trazabilidad G2 — El Búnker

**Apertura:** 2026-08-03
**Propósito:** registro operativo para auditoría posterior completa.

> Las entradas RECONSTRUIDO proceden de actas/resultados conservados antes del corte. Las entradas EJECUTADO corresponden a la reanudación actual. No se registran secretos, claves, JWT, tokens, URLs firmadas ni contenido privado.

## Reglas permanentes

- Registrar cada contenedor, decisión, archivo, acción, resultado, error, revisión, límite y siguiente gate.
- Etiquetar cada acción como LECTURA, ESCRITURA LOCAL, MUTACIÓN REMOTA AUTORIZADA o VALIDACIÓN.
- Separar local/remoto y conservar errores/correcciones.
- No atribuir cambios preexistentes a contenedores nuevos.
- Tests verdes no sustituyen aceptación visual, de producto o autorización de despliegue.

## Historial reconstruido

### G2-1A — files

527 vinculaciones exactas y únicas; 1 file sin padre/match; 0 coincidencias múltiples. Sin borrados de filas ni objetos R2.

### G2-1B — policy local

Migración, policy, tests y rollback local validados. Sin backfill ni producción.

### G2-1C — preflight

Lectura de D1, esquema, migraciones y FK; snapshot D1/manifiesto R2 con hashes en el acta. Wrangler no ofrecía dry-run.

### G2-1D — migración remota autorizada

Edu autorizó «Adelante». Se aplicó 0001_g2_policy.sql: 14 comandos. Verificación posterior: cuatro tablas G2, 9 índices, FK RESTRICT y tablas vacías. Baseline: users=3, files=528, entries=527, tracks=1117, events=3542. No rollback, backfill, R2, borrados ni despliegue.

### G2-1E — repository aislado

Preparadas auditoría append-only, cola idempotente, lease y repair_attempts. Sin importación en Worker/rutas. Reservas: admin, attempt_count y semántica operation_id.

## Reanudación post-corte

### R2-REC-01 — EJECUTADO / LECTURA

Se leyeron árbol, acta, plan, Worker, auth, policy, repository y migración; se buscaron imports y scheduler. Artefactos presentes; repository no importado; scheduled ausente. Cambios preexistentes detectados y preservados.

### R2-REC-02 — EJECUTADO / DECISIÓN

Se eligió únicamente GET /api/admin/g2/inspect. Quedaron fuera POST, restauración, archivado, purgas, reparaciones, backfill, cron, R2, migraciones y despliegue.

### G2-1F — EJECUTADO

Creado workers/routes/admin-g2.js y test; worker.js registra /api/admin/g2. Doble autorización: identidad admin y users.role=admin. Solo SELECT de tablas, contadores y estados. Sin g2-repository, escrituras D1, entidades, R2 ni scheduler.

### R2-REC-03 — EJECUTADO / DOCUMENTACIÓN

- Dos intentos de crear este registro mediante la herramienta de escritura fallaron antes de materializar el archivo; no modificaron archivos.
- Se verificó que el fallo no era por el directorio mediante un probe de escritura, que también falló; el probe no quedó como archivo.
- Se creó finalmente este registro mediante escritura shell heredoc controlada.
- Se enlazó desde `ACTA_G0_G1_REFACTOR_2026-08-03.md`.
- La suite 56/56, lint y build corresponden a la validación del código antes de este último cambio documental; la validación documental posterior se registra separadamente a continuación.

Primer fallo de test: mock D1 sin first/all directos y contador no determinista. Corrección: mock determinista y cobertura 401. Revisión independiente aprobada.

Validación local:

- focal G2: 23/23;
- suite completa: 56/56 en 9 archivos;
- npm run lint: OK;
- npm run build: OK;
- node --check worker/ruta: OK;
- git diff --check focal: OK.

### R2-REC-04 — VALIDACIÓN DOCUMENTAL POSTERIOR (`EJECUTADO · VALIDACIÓN`)

- Registro existente y no vacío: **OK**, 90 líneas en la validación anterior; se volverá a comprobar tras esta corrección.
- Enlace desde el acta: **OK**.
- Archivo de prueba `REGISTRO_G2.md`: ausente, **OK**.
- Búsqueda de patrones de claves privadas, Bearer/JWT y secrets: **sin coincidencias**, **OK**.
- `git diff --check` sobre registro y acta: **OK**.
- La revisión independiente final queda solicitada para esta versión; no se marcará como aprobada hasta recibir su veredicto explícito.

## G2-1G — preview admin-only de impacto (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Se amplió `workers/routes/admin-g2.js` con `GET /api/admin/g2/preview-purge?entity_type=entry|track|file&entity_id=...`.
- Se mantuvo doble autorización (`admin` en identidad y `users.role = 'admin'` en D1).
- El preview usa únicamente SELECT y devuelve metadatos agregados: estado, archivos legacy, bytes, referencias G2 y compartición.
- Se separaron explícitamente las relaciones legacy (`files.entry_id`/`track_id`) de `file_references`; como G2 está vacío, el endpoint devuelve `ownershipCoverageComplete: false` y `readyForSnapshot: false`.
- No devuelve `r2_key`, contenido, payloads, listas de IDs ni filas de auditoría; no llama a R2, scheduler ni `g2-repository`.
- Hubo dos iteraciones de tests: primero falló el mock por no reconocer `file` y se contaron mal las consultas de rol; se corrigieron ambos, además del lint de caracteres de control. Se añadieron tests de 401/403, tipos entry/track/file, IDs inválidos, 404 y garantía read-only.
- Revisión independiente: aprobada.
- Validación focal final: **28/28**, sintaxis, lint y diff-check OK.
- Límites: no se desplegó, no se consultó ni mutó D1 remoto, no se tocó R2, no se hizo backfill, purga, reparación ni scheduler.

## G2-1H — clasificador local de referencias (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Creados `workers/utils/g2-file-classifier.js` y `workers/utils/__tests__/g2-file-classifier.test.js`.
- El módulo es puro y local: sin `env`, D1, R2, fetch ni importación en Worker/rutas.
- Clasifica exhaustivamente `exact`, `shared`, `ambiguous` y `orphans` usando FK legacy, JSON de entries y campos de tracks.
- FK sin evidencia, FK colgante y conflictos entre propietarios quedan ambiguos; solo exactos pueden generar plan.
- El plan es parametrizado, valida owner/source, IDs duplicados y límites, y produce rollback por tupla.
- La revisión detectó y se corrigió el riesgo de rollback por ID/colisión; ahora el rollback incluye `executeOnlyWhenInsertChanges: 1` y solo podrá ejecutarse si D1 confirma `changes = 1` para el INSERT asociado.
- Hubo iteraciones de tests por semántica de ambigüedad, IDs y rollback; estado final: **8/8 tests**, lint y sintaxis OK.
- Revisión independiente: aprobada con la reserva operativa del guard de `changes` documentada.
- No se usó remoto, no se tocó D1 ni R2 y no se ejecutó ningún SQL generado.

## G2-1I — dry-run D1 local y rollback sintético (`EJECUTADO · VALIDACIÓN LOCAL`)

- Primer comando: falló porque Wrangler/D1 no acepta `.read` en el SQL; el temporal se eliminó y no hubo remoto.
- Segundo comando: se detuvo porque `workers/schema.sql` no es idempotente y la D1 local persistente ya tenía `users`; no se reseteó ni se borró la base local.
- Tercer comando válido: se aplicó `migrations/0001_g2_policy.sql` localmente; tablas G2 y FK verificadas; fixtures sintéticos con IDs únicos insertados.
- La referencia exacta obtuvo `inserted_changes=1` y `exact_refs=1`.
- El rollback por tupla obtuvo `rollback_changes=1` y dejó `refs_after_rollback=0`; entries/files sintéticos permanecieron.
- Limpieza local posterior: fixtures restantes refs/files/entries/users = `0/0/0/0`; temporales `.tmp-g2-*` ausentes.
- La comprobación `TEMP_CLEAN_RC=1` del comando anterior fue un defecto de orden: el `trap` había borrado el temporal antes del `test`; la verificación posterior correcta confirmó ausencia.
- No se usó `--remote`, no se tocó R2 y no se ejecutó SQL generado contra producción.

## Estado final y límites

Durante la reanudación no hubo despliegue, mutación D1 remota, R2, backfill, purga, reparación ni scheduler. Archivos del contenedor: admin-g2.js, su test, worker.js (import/registro), acta y este registro. Cambios ajenos permanecen intactos.

## Protocolo futuro

Antes de cerrar cada paso registrar ID/objetivo, autorización, archivos, acciones local/remotas, resultado/errores, revisión, límites/no-go y siguiente gate. Este registro enlaza, pero no sustituye, tests, snapshots, hashes, actas ni evidencias de navegador.

## Siguiente gate

G2-1I queda cerrado. Preparar snapshot D1 remoto y plan exacto de backfill en modo read-only. Cualquier escritura remota de `file_references` requiere autorización explícita separada. Siguen bloqueados confirmación, purga, reparación automática, cron, cambios de FK, R2 y despliegue.

## G2-1J — snapshot remoto y clasificación agregada (`EJECUTADO · READ-ONLY/BLOQUEADO`)

- Las consultas D1 remotas read-only fallaron con Cloudflare **7403**; `wrangler whoami` mostró sesión OAuth autenticada, pero no se asumió permiso de query.
- El export remoto read-only sí terminó correctamente: `tools/snapshots/d1_pre_g2_backfill_20260803.json`, 2.269.865 bytes, SHA-256 `13212e41824032834749a43841204badfe81b5698ac8731d17911c0c6b1ef654`.
- El snapshot no se modificó durante el análisis local. Se obtuvieron solo agregados: 23 tablas; files=528; entries=527; tracks=1117; G2 vacío; 1 file sin FK; 527 matches FK/JSON exactos.
- El clasificador real produjo plan agregado gitignored `tools/snapshots/g2_backfill_plan_20260803.json`, SHA-256 `4d1bad7e101010ff760279a9c3ba6b9751944183c1aa4eb7eba0f6991b55ba58`: exact=527, shared=0, ambiguous=0, orphans=1, bloqueado, 0 referencias planificables.
- El huérfano solo se describió por agregados: 1 `vault/photos`, `image/jpeg`, fecha 2026-08-02, 1.234 bytes; no se imprimió ni guardó su ID, clave o contenido.
- No se ejecutó INSERT/UPDATE/DELETE remoto, no se tocó R2 y no se desplegó nada.

### Bloqueos y siguiente gate

1. Resolver el error Cloudflare 7403 mediante acceso/permisos válidos; `whoami` no basta.
2. Resolver mediante decisión/evidencia el único huérfano; no inferir su propietario.
3. Regenerar el plan exacto después de resolver ambos bloqueos.
4. Solo entonces pedir autorización explícita para escritura remota de `file_references`.

## Estado final y límites
Siguiente gate actualizado: resolver 7403 y huérfano; regenerar plan; pedir autorización explícita antes de escritura remota.

## G2-1K — ejecutor exacto local (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Archivo: `workers/utils/g2-reference-executor.js`; test: `workers/utils/__tests__/g2-reference-executor.test.js`.
- Aislamiento: sin importación en Worker/rutas y sin acceso implícito a R2/red.
- Seguridad del plan: allowlist SQL por igualdad exacta; bindings de rollback comparados estrictamente con los cinco valores no-ID del INSERT; validación de todas las parejas antes del primer `run()`.
- Seguridad de ejecución: escritura bloqueada por defecto; `changes=1` obligatorio; rollback únicamente de INSERTs confirmados; fallo de rollback preserva causa/estado parcial.
- Cobertura: SQL malicioso, rollback desparejado, sentencia inválida posterior, cambios distintos de 1, rollback parcial, rollback fallido, guard de autorización y ejecución correcta.
- Resultado: **18/18 tests focales**, lint y sintaxis OK.
- Límites: no `--remote`, no D1 remoto, no R2, no deploy, no backfill y no registro del ejecutor en rutas.

### Gate posterior a G2-1K

Se mantienen los bloqueos de G2-1J: resolver Cloudflare 7403; resolver el huérfano mediante evidencia/decisión sin inferencia; regenerar el plan exacto; y pedir autorización explícita separada antes de cualquier escritura remota. El texto `EXPLICIT_AUTHORIZATION` es un guard del componente, no una credencial ni sustituto de autorización humana.

## G2-1L — validación final (`EJECUTADO · VALIDACIÓN`)

- `npm test`: **79/79**, 11 archivos, OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Sintaxis Worker/ejecutor/clasificador: OK.
- `git diff --check`: OK.
- Aislamiento: sin referencias del ejecutor en Worker/rutas; temporales `.tmp-g2-*` ausentes.
- No remoto: sin `--remote`, sin D1/R2, sin deploy y sin backfill.

Cierre del contenedor local: aprobado por revisión independiente. Gate siguiente sin cambios: resolver 7403; resolver el huérfano con evidencia; regenerar el plan; y solicitar autorización explícita separada antes de cualquier escritura remota.

## G3-1 — frontera Google OAuth / D1-R2 y preflight reanudado (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- Código/documentación: `GoogleAuthService` solo OAuth de perfil; `GoogleDriveService` facade legacy no operativo; sin imports del facade en `src`; ADRs y arquitectura enmendados.
- Tests añadidos: frontera de Service Worker, scopes/API prohibidos, facade y búsqueda recursiva de imports estáticos/dinámicos/require/side-effect.
- Evidencia local: **81/81 tests**, lint, build, sintaxis Worker y diff-check OK.
- Evidencia pública limitada: landing de Vercel cargó correctamente y consola sin errores; no se introdujeron credenciales ni datos.
- D1 remoto read-only: tablas G2 presentes y vacías; baseline `files=528`, `entries=527`, `tracks=1117`; G2 cuatro contadores a cero.
- Snapshot: `d1_pre_g2_backfill_resume_20260803.sql`, SHA-256 `13212e41824032834749a43841204badfe81b5698ac8731d17911c0c6b1ef654`, 2.269.865 bytes; gitignored.
- Clasificación: `exact=527`, `shared=0`, `ambiguous=0`, `orphans=1`; plan bloqueado, cero referencias aplicables; resumen SHA-256 `a91fabd2a3a81492d324ff0972cd0e77167819b0fb0fae42c39b73b83b7c72af`.
- R2: `R2_GET_RC=127` por suborden no disponible en Wrangler; no se clasifica como objeto ausente. Sin PUT/DELETE/listado mutante.
- Límites: sin backfill, purga, migración, deploy o ejecutor remoto.

### Gate posterior a G3-1

G4 será incremental y local: normalización/acciones puras primero; después sesión/auth compatible; búsqueda de consumidores, tests y rollback por contenedor. Se preservan `useVault()`, las tres tabs, el único `<audio>` de MusicLab y WorkerClient como ruta de datos.

## G4-1 — extracción pura de payloads MusicLab (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- **Objetivo:** aislar transformaciones síncronas de tracks sin modificar contratos públicos ni límites de ownership.
- **Archivos:** creado `src/musiclab/MusicPayloadBuilder.js`; creado `src/musiclab/__tests__/MusicPayloadBuilder.test.js`; integrado `src/musiclab/useMusicActions.js`.
- **Acción local:** `buildEditPayload` y `normalizeNewTrack` sustituyeron únicamente bloques inline equivalentes del hook. No hubo red, D1, R2, migraciones, deploy, commit ni push.
- **Semántica preservada:** whitelist de PATCH; `tag || vibe || null`; precedencia de `r2_key` del servidor sobre upload; `created.tag_id → tag`; `file` eliminado del estado normalizado.
- **Corrección durante revisión:** el primer diseño asumía `created` no nulo; se añadió optional chaining y prueba con argumentos nulos/parciales. La revisión independiente aprobó el ajuste.
- **Validación final:** focal **4/4**; suite **85/85** en 12 archivos; lint, build, sintaxis Worker y `git diff --check` OK.
- **No-go confirmado:** no se tocó `PlayerContext`, no se creó otro `<audio>`, no se cambió `useVault()`, no se duplicó estado de tracks y no se alteró WorkerClient/endpoints.

### Gate posterior a G4-1

G4-2 será extracción local de sesión/auth desde `VaultContext`, manteniendo `useVault()` y todos sus nombres públicos. Requiere inventario completo de consumidores, pruebas de contrato y rollback por contenedor. Quedan fuera `PlayerContext`, el único `<audio>`, las tres tabs, WorkerClient como ruta de datos y cualquier despliegue.

## G4-2 — frontera persistida de sesión/JWT (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- **Objetivo:** separar la frontera de almacenamiento/restauración/limpieza de sesión y propagación JWT; no separar todavía la orquestación React/OAuth.
- **Archivos:** creado `src/core/SessionBridge.js`; creado `src/core/__tests__/SessionBridge.test.js`; integrado `src/core/VaultContext.jsx`.
- **Acción local:** se reemplazó lógica inline de storage/JWT por funciones puras compatibles. Se conservaron `useVault()`, los exports, endpoints, login Google, acceso ADR-028 por clave y `WorkerClient` como dueño de red.
- **Contrato cubierto:** lectura JWT; persistencia/restauración de usuario y clave recordada; propagación a React/WorkerClient/upload/stats; logout completo; storage bloqueado; JWT nulo; JSON de usuario corrupto.
- **Correcciones durante revisión:** getters de storage protegidos antes del `try`; comentario `sessionStorage` corregido; `applyJwt(null)` elimina el token; JSON de usuario corrupto se aísla sin perder JWT/kind/key.
- **Validación final:** focal **11/11**; suite **92/92** en 13 archivos; lint, build, sintaxis Worker y diff-check OK.
- **Revisión independiente:** aprobada.
- **No-go:** sin deploy, commit, push, acceso remoto, D1/R2, migración, backfill, purga, cambio de tabs, `PlayerContext` o `<audio>`.

### Gate posterior a G4-2

G4-3: separar carga/refresh D1 de estado UI y polling. Antes de editar se debe inventariar `_buildDbFromWorker`, `_completeSession`, `refreshDb`, heartbeat, efectos y consumidores; mantener `useVault()`, `WorkerClient`, tres tabs y único audio.

## G4-3 — frontera de lectura Worker/D1/R2 (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- **Objetivo:** aislar construcción/normalización de DB sin extraer estado React, auth ni polling.
- **Archivos:** creado `src/core/WorkerDataService.js`; creado `src/core/__tests__/WorkerDataService.test.js`; integrado `src/core/VaultContext.jsx`.
- **Contrato preservado:** siete lecturas paralelas, `/api/config`, parseo JSON tolerante, mapeo de usuarios en entries/drops, fallback no fatal de files, fallback de fecha y `null` si falla una colección requerida.
- **Ownership preservado:** `VaultContext` conserva `db`, `dbStatus`, `refreshDb`, `_completeSession`, heartbeat, efectos y polling; no hay segundo estado ni fetches directos nuevos.
- **Guard:** `service-boundaries.test.js` obliga a usar `WorkerDataService` y detecta la reintroducción del mapeo inline.
- **Validación:** focal inicial **16/16**; suite **97/97**; lint/build/sintaxis Worker/diff-check OK. Tras añadir guard: **10/10** focal y diff-check OK.
- **Revisión:** aprobada.
- **No-go:** sin remoto, D1/R2, deploy, migración, commit, push, cambios de audio, tabs o `useVault()`.

### Gate posterior a G4-3

G4-4: extraer funciones puras de cola/shuffle/normalización de `PlayerContext`, sin mover el proveedor, sincronización compartida ni el único `<audio>`.

## G4-4 — transformaciones puras de cola/audio (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- **Objetivo:** aislar Fisher-Yates y límite de cola sin tocar audio/DOM/red/estado externo.
- **Archivos:** creado `src/core/QueueTransforms.js`; creado `src/core/__tests__/QueueTransforms.test.js`; integrado `src/core/PlayerContext.jsx`.
- **Semántica:** Fisher-Yates sin cambios; `enforceQueueLimit` conserva manuales y limita a 75, igual que el bloque inline anterior.
- **Ownership:** `PlayerContext` sigue siendo dueño de estado, refs, proveedor, audio, presencia y escucha compartida; no cambia `usePlayer()` ni sus exports.
- **Corrección de test:** mock de `Math.random` restaurado en `finally`.
- **Validación:** focal **21/21**; suite **102/102** en 15 archivos; lint/build/sintaxis Worker OK; diff-check con `core.whitespace=cr-at-eol` OK porque el CRLF ya era del archivo base.
- **Revisión:** aprobada.
- **No-go:** sin remoto, D1/R2, deploy, migración, commit, push, segundo audio, cambio de tabs o sync.

### Gate posterior a G4-4

G4-5: cerrar fronteras restantes de contextos/acciones con inventario de consumidores; no dividir `PlayerContext` ni crear segundo estado de audio.

## G4-5 — filtros de Timeline aislados (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- **Objetivo:** extraer filtros/derivaciones de Timeline sin cambiar props, UI ni fuente de eventos.
- **Archivos:** creado `src/capsules/useTimelineFilters.js`; creado `src/capsules/__tests__/useTimelineFilters.test.js`; integrado `src/capsules/Timeline.jsx`.
- **Contrato:** whitelist track; filtros module/type/era/user; JSON tolerante; “Un día como hoy”; eventTypes estable; paginación 50 y reset al cambiar filtro.
- **Corrección:** primer test falló al pasar eventos sin filtrar a `getTodayEvents`; se alineó con el contrato interno y quedó verde.
- **Validación:** focal **10/10**; suite **107/107** en 16 archivos; lint/build/sintaxis Worker/diff-check CRLF-aware OK.
- **Revisión:** aprobada.
- **No-go:** sin remoto, D1/R2, deploy, migración, commit, push ni cambios de API/audio.

### Gate posterior a G4-5

G4 estructural seguro completado. Siguiente gate G5: inventario y sustitución de iconografía funcional/emojis; emojis de contenido de usuario se conservan.

## G5 — iconografía funcional y aliases legacy (`EJECUTADO · ESCRITURA LOCAL/VALIDACIÓN`)

- **Objetivo:** eliminar emojis funcionales visibles sin romper iconos persistidos ni contenido de usuario.
- **Archivos:** `src/core/ui/Icon.jsx`, test `src/core/ui/__tests__/Icon.test.js`, `src/musiclab/MusicLab.jsx`, `src/musiclab/DropsManager.jsx`.
- **Acción:** añadido `resolveIconName`; aliases legacy siguen resolviendo a SVG; usos funcionales de vistas/sort/tabs/drop/timer/favorito pasan a nombres canónicos, incluido `grid` real.
- **Compatibilidad:** taxonomía persistida de `AddEntryForm`/`tokens.js` intacta; no migración de datos.
- **Validación:** focal **8/8**; suite **110/110** en 17 archivos; lint/build/sintaxis Worker/diff-check OK.
- **Revisión:** aprobada.
- **No-go:** sin remoto, D1/R2, deploy, migración, commit ni push.

### Gate posterior a G5

G6: aceptación responsive móvil/desktop con navegador, capturas y verificación de overflow, modales y controles táctiles.

## TL;DR de reanudación hasta G4-2

- G2: estructuras/política y superficies admin read-only preparadas; backfill bloqueado por 7403 y un huérfano sin evidencia de propietario.
- G3-1: Google OAuth separado de Drive; D1/R2 como fuente; fachada Drive legacy explícita; documentación y prueba de frontera actualizadas.
- G4-1: payloads MusicLab extraídos a módulo puro; sin cambios de audio/estado público.
- G4-2: sesión persistida/JWT extraída a `SessionBridge`; login/logout y acceso por clave conservados.
- Calidad: **92/92 tests**, lint/build/sintaxis/diff-check OK y revisiones independientes aprobadas.
- Límites: todo local; sin deploy, commit/push ni mutaciones remotas.
- Próximo paso histórico: G4-3, extracción de carga/refresh D1 con contrato y tests.

## G6 — responsive y aceptación de navegador (`EJECUTADO · VALIDACIÓN PARCIAL`)

- Se verificaron layout y ausencia de overflow horizontal en móvil 390×844 y desktop 1440×900; no se usaron credenciales ni se ejecutaron mutaciones.
- Se corrigió duplicate-key causado por timers duplicados de `BootTerminal` bajo StrictMode mediante cleanup y callback estable.
- Se retiró la carga automática del Cast SDK y se creó `CastSdkService` lazy HTTPS con timeout, cleanup, retry y estado `unavailable`.
- El agente de navegador no dejó artefacto legible en las ejecuciones finales; se registra como **inconclusa**, no como consola limpia ni aceptación visual/PWA/CAST.

## G7 — Service Worker/PWA (`EJECUTADO · VALIDACIÓN`)

- Corrección: `src/smoke/SmokeSession.jsx` pasó de `/manifest-icon-192.png` inexistente a `/icons/icon-192.png` existente.
- Contrato: `service-boundaries.test.js` valida referencias del manifest/shortcuts, ausencia de listeners Push/Sync, lifecycle del SW, no cache de API y cache explícito solo para `/music/` del host API.
- Validación: focal **6/6**; suite **114/114** en 18 archivos; lint/build/sintaxis SW/Worker/diff-check **OK**; revisión independiente aprobada.
- Límite: esto es contrato estático y build; no sustituye una prueba runtime instalada de offline/update/cache.
- Sin remoto, D1/R2, deploy, commit ni push.

## G8 — documentación (`EJECUTADO · ESCRITURA LOCAL`)

- Se sincronizaron `ESTADO.md`, `SESION.md`, manual de usuario, technical debt e informe ejecutivo.
- Se corrigieron afirmaciones antiguas del manual: no presenta Drive como almacén, reconoce tres tabs y describe offline limitado sin sync automática.
- No se reescribieron ADRs ni auditorías históricas; las contradicciones normativas quedan para enmienda explícita.
- Validación global posterior: **114/114 tests**, lint/build/sintaxis SW-Worker/diff-check OK. El escaneo de emojis funcionales solo conserva excepciones de contenido/valores persistidos de Vault (`AddEntryForm`/`VaultGallery`); no quedan usos funcionales activos en MusicLab/Drops.

## Registro final de la reanudación — 3 ago 2026

**Cambios locales:** G4-5 Timeline, Icon resolver/funcionales, cleanup BootTerminal, CastSdkService lazy, contrato PWA/SW, SmokeSession icon, documentación G8.

**Resultados:** G4-5 y G5 revisados; G6 parcial; G7 cerrado; G8 actualizado. Validación final posterior: **114/114 tests**, lint/build/sintaxis SW-Worker/diff-check OK. Escaneo funcional: excepciones persistidas permitidas en Vault; MusicLab/Drops sin emojis funcionales activos.

**No se hizo:** commit, push, deploy, mutación D1/R2, backfill, purga, migración nueva ni ejecución remota del reparador.

**Siguiente gate histórico:** validación global post-G8; completado con 114/114 tests, lint/build/sintaxis/diff-check y revisión independiente.

## Reanudación autónoma posterior — G6 y pendiente local de iconografía (`4 ago 2026`)

- Se intentó obtener aceptación G6 reproducible en `http://127.0.0.1:5174/`; el servidor Vite respondió `200`, pero el agente navegador no devolvió artefacto legible. No se declara consola limpia, captura aprobatoria, PWA instalada, offline runtime ni CAST probado.
- Inventario local seguro: no se tocaron credenciales, remoto, D1/R2 ni políticas de borrado. Prompts nativos y huérfano G2 quedan pendientes porque requieren decisión/evidencia adicional.
- Corrección aplicada: `src/vault/VaultGallery.jsx` sustituyó los seis iconos Unicode de navegación (`WALL`, `CINEMA`, `MAP`, `DIALOGUE`, `EXHIBITION`, `REEL`) por nombres canónicos SVG de `Icon`; se añadió contrato en `src/core/__tests__/service-boundaries.test.js`.
- No se alteraron emojis persistidos de `AddEntryForm`/categorías ni contenido de usuario.
- Validación de la corrección: focal **6/6**, suite **114/114**, lint/build/sintaxis Worker/SW/diff-check OK; revisión independiente aprobada.
- Estado: cambios locales, sin commit/push/deploy ni mutación remota.
