# ESTADO.md — el_bunker
> Max 30 líneas. Bugs en espera → Kanban (`hermes kanban list` board el-bunker).
> Pipeline canónica: AGENTS.md.

**MODO: PIPELINE PROMETHE-OS. Kanban = estado vivo.**
Board `el-bunker` activo. Este archivo es snapshot documental, no fuente de estado.

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
- Aceptación móvil real (390x844) y PWA instalada/offline/update en dispositivo físico; revisar modales y controles táctiles. Sin sustituto de navegador headless.
- Confirmar EntryLightbox en móvil (t_9badd928).
- **7403 RESUELTO (4-ago):** la query remota D1 funciona (files=527 verificado); el fallo de G2-1J fue transitorio. **Huérfano G2 RESUELTO (4-ago):** `prueba_dod.jpg` (c4c564a9, residuo de DoD 2-ago, sin objeto R2) borrado con OK de Edu; rollback en `C:\proyectos\.trabajo\orphan_rollback.sql`. El residuo R2 `c1f11fad…` pendiente de verificar por API (el CLI no lista objetos).
- Código Drive facade/fallback: retirada solo tras evidencia externa y decisión de compatibilidad. Verificado 4-ago: 0 tracks con drive_file_id, 0 consumidores del facade en src.
- Revisión humana del plan completo y gate final antes de deploy.

## Infra
- Worker desplegado v `afdf7c2c` (2-ago), R2 gate vivo
- Rama: master sincronizado con origin/master al inicio; cambios G0–G8 actuales son locales/no desplegados
- No se ejecutó commit ni push en esta reanudación autónoma
