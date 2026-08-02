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
- **1-ago (confirmado por Edu):** consola Google — scope Drive quitado de la pantalla de
  consentimiento + David como test user. Login de David fluido (Gate 1 OK).
- **1-ago (pliego P1):** bug canciones repetidas RESUELTO — 30 duplicados exactos soft-deleted
  (529 activos, 0 grupos duplicados) + D1 migrada (`deleted_at`/`deleted_by` en tracks).
  Commits `66b0a85` + `d5e1e9c` pusheados.

## ▶ Pendientes
- Subir PRUEBA a vault (t_c316b835) — **selección lista**: `D:\bunker-import-review\PRUEBA`
  (590 archivos: 527 jpg + 63 mp4, 4,1 GB, 15 carpetas mensuales 2021-06→2022-08, fotos
  Takeout + staging-manifest.json). Prompt de sesión: `C:\proyectos\.trabajo\prompt_subida_prueba_vault_2026-08-01.md`
- Confirmar EntryLightbox en móvil (t_9badd928)
- **ADR-028 (2-ago):** acceso test/admin sin Google IMPLEMENTADO en código (POST
  /api/auth/token + sessionKind + panel LoginScreen + filtro auth_ en events). Pendiente
  de Edu: secrets (ADMIN_ACCESS_KEY/EDU_ACCESS_KEY) + `wrangler deploy` + verificación
  DoD (tarea 5 del plan). Tras deploy → desbloquea la subida de PRUEBA.

## Infra
- Worker desplegado v `aa502226`, R2 gate vivo
- Rama: master (7 ahead of origin/master)

