# ESTADO.md — el_bunker
> Max 30 líneas. Bugs en espera → Kanban (`hermes kanban list` board el-bunker).
> Pipeline canónica: AGENTS.md.

**MODO: PIPELINE PROMETHE-OS. Kanban = estado vivo.**
✅ **El board `el-bunker` EXISTE y está en uso desde el 4-ago** (corregido 5-ago: la nota anterior
decía que no existía, y llevaba un día desfasada). **La re-entrada es
`hermes kanban --board el-bunker list`, no este archivo.**

## ▶ 20-ago — GATE 1 COMPLETADO: ADR-030 y ADR-031 subidos al CONTRATO
**ADR-030 y ADR-031 firmados y subidos a CONTRATO.md. Total: 33 ADRs vigentes.**
**El frente de escritorio queda sin bloqueos de diseño.** Los dos ADR están escritos en
`CONTRATO.md` (sin commit: acto de Edu) y `docs/spec/INDEX.md` actualizado — `taxonomia_vault.md`
deja de ser spec viva. Diseño completo: `docs/disenos/DISENO_INTERIOR_LIENZO_2026-08-14.md`.
Las 3 tarjetas de `opus` (`t_703e99c7`, `t_6997adaa`, `t_b08e83a5`) están cerradas y su
implementación repartida en fases con contrato propio. `t_0ea27342` sale de `blocked`.
**Plan de olas para la flota: `docs/planes/HANDOFF_FLOTA_2026-08-14.md`.**

## ▶ SIGUIENTE (5-ago — se lee del board, no de aquí)
**el-bunker es la PRIORIDAD GLOBAL del workspace**, por encima de vinos y empleo.
Ola 1 del piloto de paralelismo ejecutada: A1 y B2 en `done` (Luna, pendientes de que Sonnet las
coordine y cierre), B1 con diseño entregado y ejecución pendiente.

- Handoff del turno de Opus, con el veredicto sobre el piloto y las tarjetas nuevas:
  `docs/planes/HANDOFF_OPUS_B1_2026-08-05.md`.
- **Turno de Opus del 5-ago (2 tarjetas cerradas, docs sin commitear):**
  `docs/operacional/VEREDICTO_OPUS_AUDITORIA_3_CAPAS_2026-08-05.md` (`t_cf71309f`) y
  `docs/planes/OLA2_ELBUNKER_2026-08-05.md` + P12 del canon de paralelismo (`t_565f2055`).
  Tarjeta de integración de la Ola 2 creada: `t_74282e2b` (en `todo`, sin dueño — lo asigna Edu).
- Diseño ejecutable de admin-core: `docs/disenos/DISENO_B1_ADMIN_CORE_2026-08-05.md`.
- Los dos frentes de diseño siguen vigentes: `docs/disenos/DISENO_MODO_VISITA_2026-08-04.md` y
  `docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md` (🟢 canónico).
- **Aviso operativo de `.worktrees/` RESUELTO (6-ago, merge `t_8b21aec7`):** `vite.config.js` ya
  excluye `.worktrees/` en el árbol principal. `npx vitest run` desde el repo principal vuelve a
  medir solo este árbol.

## ▶ Madrugada del 5-ago (06:00-06:30, carril `opus` tras reinicio accidental)
- ~~**`done` = INTEGRADO EN MAIN**~~ **CORREGIDO por Edu el 12-ago y reafirmado el 14-ago:
  `done` = PENDIENTE DE MERGE. Lo mergeado es `archived`.** Una tarjeta en `done` cuyo trabajo aún
  no está en `master` **no es un desfase del board**: es el estado normal entre que el carril
  entrega y alguien integra. La redacción anterior de esta línea hizo que el 14-ago se reportara
  como incumplimiento algo que era funcionamiento correcto. En su día, B1 (`t_0a8cf470`) y P0
  (`t_e19b5128`) estaban pendientes de merge; A1, B2 y FIX-SB ya integradas.
  Tarjeta de merge: `t_8b21aec7` (carril `edu`).
- **Gateway de Hermes instalado y arrancado** (fallback carpeta Inicio, no Tarea Programada: pide
  UAC). Sin él no hay dispatcher: un worker muerto dejaba la tarjeta clavada en `running`.
- **AUD-1 (`t_420b2f04`) reasignada `obrero1` → `flash1`**: `obrero1/2/3` comparten una sola cuota
  de OpenRouter y se agotó. Despachada sola por el gateway a las 06:09.
- **Clave de zen rotada por Edu** antes del reinicio; verificado que los 3 `.env` llevan la nueva.
  Queda confirmar que la vieja está *revocada* y revisar `config.yaml:240` (`t_3564265b`).
- **Canon de paralelismo:** P13 (cuota por proveedor, no por perfil), P14 (lo del chat va a la
  tarjeta), P15 (`done` = **pendiente de merge**; `archived` = mergeado — corregido 12-ago) y §12 — el board ya implementaba media docena de reglas que
  el canon escribía a mano (`swarm`, columna `review`, `triage/specify/decompose`, `diagnostics`).

## ✅ Cerrado
- v1.0 en código + prod (S148, 13-jul) · G0–G5 higiene/refactor local ✅ · tests 114/114 (3-ago)
- **1-ago:** wrangler 4.118.0 (toolchain Windows nativo) · login Google sin scope Drive
  (Gate 1 David OK) · bug canciones repetidas resuelto (P1) · auditoría línea base:
  `docs/operacional/auditoria_reentrada_2026-08-01.md` (BORRADOR).
- **2-ago (ADR-028):** acceso test/admin sin Google IMPLEMENTADO, DESPLEGADO y VERIFICADO:
  POST /api/auth/token (canje clave→JWT 24h, authenticate() intacto), sessionKind en
  VaultContext, panel ACCESO TEST/ADMIN en LoginScreen, filtro auth_ en events, rate limit
  10/min. Secrets ADMIN_ACCESS_KEY+EDU_ACCESS_KEY en worker. Clave del agente en
  `C:\proyectos\.trabajo\bunker_admin_key.txt` (fuera del repo). Login sin popup OK en
  navegador embebido. DoD verificado por artefacto (canje 200, eras/entries 200, 401s,
  upload 201, R2 md5 ok, auditoría auth_login en D1).
- **2-ago (PRUEBA vault, t_c316b835):** 527 fotos subidas (selección
  `D:\bunker-import-review\PRUEBA`) → R2 + D1, fusionadas en 2 eras: **2021 (185)** y
  **2022 (342)**. Verificado 527/527 (D1=estado local, R2 respondiendo).
- **2-ago (fix S151):** GET /api/entries con límite configurable (antes LIMIT 200 fijo
  ocultaba entries — 527 en D1, solo 200 visibles). Desplegado (f2277dc).
- Commits 2-ago pusheados: a2ee907 + f5d8cab + 465534b + 9efcf67 + d2e038b + c97358e +
  0ee39d6 + f2277dc. Master sincronizado con origin.

## ▶ Estado de gates
- **G6:** código y overflow desktop verificados; aceptación visual verificada con artefacto navegador (4-ago): login test/admin OK, vault 527 entries reales, 6 modos con iconos SVG confirmados por DOM, consola 0 errores JS, sin overflow horizontal a 1264px. Pendiente: viewport móvil real (el agente headless no emula 390x844) y PWA instalada en dispositivo.
- **G7:** ✅ cerrado en código: SW sin listeners Push/Sync, `/api/` nunca cacheada, `/music/` delimitado, manifest resoluble (standalone, 5 iconos, 2 shortcuts) y fallback/versionado presentes. SW activated + cachés pobladas verificadas (4-ago).
- **G8:** ✅ documentación sincronizada en esta sesión; no se reescriben ADRs normativos sin enmienda.

## ▶ Pendientes reales
- **HUD DESKTOP (`t_504a2707`) — DISEÑO ENTREGADO Y FIRMADO (7-ago), ejecución pendiente.**
  Diseño: `docs/disenos/DISENO_HUD_DESKTOP_2026-08-07.md` (marco de escritorio a partir de 1280px;
  por debajo no cambia un pixel). Canonizado en **ADR-029**, que además cierra la contradicción
  S152/S153 vs `PROYECTO.md:54` y firma 4 enmiendas a las specs. La propuesta conceptual del 5-ago
  quedó rechazada por Edu y no se mergea. Plan de 6 fases en el §11 del diseño; F5 y F6
  (iconografía y microcopy) no dependen de nada y pueden ir en carril paralelo. Sigue pendiente la
  medición de truncados como línea base: 23 en WALL, 14 en MUSIC LAB, 2 en TIMELINE a 1264px
  (H-11/H-12/H-13).
- **Specs funcionales incorporadas al canon (7-ago):** `docs/spec/INDEX.md` entra en el
  `[requiere]` del grupo 2 del `CANON.manifest`. Motivo: `docs/spec/` no estaba en ningún grupo y
  el diseño de la HUD se escribió sin leerlo (3 contradicciones, 10 correcciones y 11 huecos al
  cruzarlo). **CANON-1 resuelto (8-ago):** `docs/spec/` queda declarado como especificación viva
  (`U3_PATH_DOCS + LIVE_SPEC`) en `REGLAS.md`; legacy/sesiones/historico/planes/disenos quedan
  históricos o de trabajo. Los informes fechados no se reescriben; el hook externo debe sincronizar
  esta regla.
- **Tarjetas nuevas sin dueño (7-ago):** `t_69b7d224` visualizador a pantalla completa roto
  (reporte de Edu; hipótesis: `AudioContext` sin limpieza en `AudioVisualizer.jsx`),
  `t_54f1d39e` canon/auditoría. `t_717572c4` queda resuelta: `TRACKS [529]` cuenta activos.
- Aceptación móvil real (390x844) y PWA instalada/offline/update en dispositivo físico; revisar modales y controles táctiles. Sin sustituto de navegador headless.
- Confirmar EntryLightbox en móvil (t_9badd928).
- **7403 RESUELTO (4-ago):** la query remota D1 funciona (files=527 verificado); el fallo de G2-1J fue transitorio. **Huérfano G2 RESUELTO (4-ago):** `prueba_dod.jpg` (c4c564a9, residuo de DoD 2-ago, sin objeto R2) borrado con OK de Edu; rollback en `C:\proyectos\.trabajo\orphan_rollback.sql`. El residuo R2 `c1f11fad…` pendiente de verificar por API (el CLI no lista objetos).
- **Backfill G2 HECHO (4-ago, autorizado por Edu):** `file_references` poblada — 1.054 referencias (527 files × 2: files_fk + entry_content_json), 0 colgantes, 0 duplicados. Baseline histórico pre-purga: files 527 / entries 527 / tracks 1.117. Snapshot `tools/snapshots/d1_pre_g2_backfill_20260804.sql`; rollback fuera del repo. Detalle en acta G2-1M.
- **Purga de tracks (7-ago):** 589 soft-deleted eliminados y 30 `track_tags` en cascada; quedan 529 tracks activos, 0 soft-deleted y 0 huérfanos. Snapshot previo `tools/snapshots/d1_pre_purga_softdeleted_tracks_20260807.sql`; SHA-256 `aded972277e786495141c5c55fb6c37c005ba380156c9f052979556cfc3e961a`.
- Código Drive facade/fallback: retirada solo tras evidencia externa y decisión de compatibilidad. Verificado 4-ago: 0 tracks con drive_file_id, 0 consumidores del facade en src.
- **R11 HECHO (4-ago):** validaciones POST (BUG-5) en tracks (title requerido), drops (to_user whitelist admin/edu/david), events (event_type en whitelist de 28 tipos emitidos) y entries (type saneado). Helper `workers/utils/validation.js` + tests. Suite 141/141.
- Revisión humana del plan completo y gate final antes de deploy.

## Infra
- Worker desplegado v `afdf7c2c` (2-ago), R2 gate vivo
- Rama: master sincronizado con origin/master al inicio; cambios G0–G8 actuales son locales/no desplegados
- No se ejecutó commit ni push en esta reanudación autónoma
