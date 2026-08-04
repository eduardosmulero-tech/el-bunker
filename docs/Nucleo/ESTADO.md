# ESTADO.md — el_bunker
> Max 30 líneas. Bugs en espera → Kanban (`hermes kanban list` board el-bunker).
> Pipeline canónica: AGENTS.md.

**MODO: PIPELINE PROMETHE-OS. Kanban = estado vivo.**
⚠️ **El board `el-bunker` NO existe todavía** (verificado 4-ago: `hermes kanban boards list` solo
lista `default` y `empleo`). Lo crea la fase E1 de
`cerebro/normas/loop-agentico/ENCARGO_PILOTO_PARALELISMO_ELBUNKER_2026-08-04.md`. Hasta entonces,
este archivo es la re-entrada.

## ▶ SIGUIENTE (4-ago, decidido por Edu — arranca aquí)
**el-bunker es la PRIORIDAD GLOBAL del workspace**, por encima de vinos y empleo.
Dos frentes nuevos, ya diseñados y en BORRADOR pendientes de OK de Edu:
- `docs/disenos/DISENO_MODO_VISITA_2026-08-04.md` — censura de contenido para poder enseñar la app.
- `docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md` — panel `/admin` reutilizable en vinos.
- `docs/planes/PLAN_CARRILES_ELBUNKER_2026-08-04.md` — las tarjetas, ya repartidas en carriles.

**Dos bloqueos previos, ambos de Edu:** (1) los 16 ficheros modificados sin commitear son los
mismos que tocan las tarjetas — commitear o descartar antes de abrir carriles; (2) faltan perfiles
de Hermes y falta decidir proveedor gratuito de lo automático, así que hoy todos los carriles son
de terminal (los abre Edu).

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
- **HUD DESKTOP (requisito de Edu, 3 peticiones, tarjeta t_504a2707 en fase IDEA):** rediseñar la HUD para aprovechar el escritorio — móvil compacta y visible, desktop con capacidades que el móvil no tiene. Medido en auditoría UI 4-ago: 23 títulos truncados en WALL, 14 en MUSIC LAB, 2 en TIMELINE a 1264px (H-11/H-12/H-13, canon DOM-first). Docs contradictorios (S152/S153 y ACTA G0-G1 dicen "responsive desktop hecho"; PROYECTO.md:54 dice "no optimizada para desktop") — alinear en CONTRATO/SPEC.
- Aceptación móvil real (390x844) y PWA instalada/offline/update en dispositivo físico; revisar modales y controles táctiles. Sin sustituto de navegador headless.
- Confirmar EntryLightbox en móvil (t_9badd928).
- **7403 RESUELTO (4-ago):** la query remota D1 funciona (files=527 verificado); el fallo de G2-1J fue transitorio. **Huérfano G2 RESUELTO (4-ago):** `prueba_dod.jpg` (c4c564a9, residuo de DoD 2-ago, sin objeto R2) borrado con OK de Edu; rollback en `C:\proyectos\.trabajo\orphan_rollback.sql`. El residuo R2 `c1f11fad…` pendiente de verificar por API (el CLI no lista objetos).
- **Backfill G2 HECHO (4-ago, autorizado por Edu):** `file_references` poblada — 1.054 referencias (527 files × 2: files_fk + entry_content_json), 0 colgantes, 0 duplicados, baseline intacto (files 527 / entries 527 / tracks 1.117). Snapshot `tools/snapshots/d1_pre_g2_backfill_20260804.sql`; rollback fuera del repo. Detalle en acta G2-1M.
- Código Drive facade/fallback: retirada solo tras evidencia externa y decisión de compatibilidad. Verificado 4-ago: 0 tracks con drive_file_id, 0 consumidores del facade en src.
- **R11 HECHO (4-ago):** validaciones POST (BUG-5) en tracks (title requerido), drops (to_user whitelist admin/edu/david), events (event_type en whitelist de 28 tipos emitidos) y entries (type saneado). Helper `workers/utils/validation.js` + tests. Suite 141/141.
- Revisión humana del plan completo y gate final antes de deploy.

## Infra
- Worker desplegado v `afdf7c2c` (2-ago), R2 gate vivo
- Rama: master sincronizado con origin/master al inicio; cambios G0–G8 actuales son locales/no desplegados
- No se ejecutó commit ni push en esta reanudación autónoma
