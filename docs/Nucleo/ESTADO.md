# ESTADO.md — el_bunker
> Max 30 líneas. Bugs en espera → Kanban (`hermes kanban list` board el-bunker).
> Pipeline canónica: AGENTS.md.

**MODO: PIPELINE PROMETHE-OS. Kanban = estado vivo.**
Board `el-bunker` activo. Este archivo es snapshot documental, no fuente de estado.

## ✅ Cerrado
- v1.0 en código + prod (S148, 13-jul)
- 7 commits consolidados (S146-S149)
- Build ✅ · Lint ✅ · Tests 12/12 (1-ago)
- AGENTS.md creado · CLAUDE.md reducido a stub
- task_deepseek.md eliminado (contratos via kanban)
- FASE C + FASE D → done en kanban
- **1-ago (re-entrada):** wrangler 4.118.0 devDependency (toolchain Windows nativo, WSL sin distros).
  Pliego login HECHO y DESPLEGADO: scope `drive.readonly` quitado del OAuth (0 tracks legacy
  verificados en D1). Push a origin (master sincronizado). Auditoría línea base:
  `docs/operacional/auditoria_reentrada_2026-08-01.md` (BORRADOR).

## ▶ Pendientes
- Consola Google (Edu): quitar scope Drive de la pantalla de consentimiento + David como test user
- Confirmar con David que el login nuevo va fluido (Gate 1)
- **HALLAZGO SCHEMA (1-ago):** D1 remota NO tiene `deleted_at`/`deleted_by` — el DELETE de `workers/routes/tracks.js:122` falla en producción (SQLITE_ERROR). Alinear schema.sql con D1 o quitar columnas del worker.
- Bug canciones repetidas (t_725f1797) — **RESUELTO 1-ago**: 30 duplicados exactos activos soft-deleted (529 activos, 0 grupos duplicados). Detalle + backup: `docs/operacional/duplicados_d1_revisar_2026-08-01.md`
- Subir PRUEBA a vault (t_c316b835)
- Confirmar EntryLightbox en móvil (t_9badd928)

## Infra
- Worker desplegado v `aa502226`, R2 gate vivo
- Rama: master (7 ahead of origin/master)

