# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.
> Actualizar antes de cerrar sesión.

**Próximo pliego:** Phase 2 — visuales P1 (mini player opaco/botonera, era color selector, tab playlists)
**Última sesión:** S82 — Compat Sprint cerrado (3 commits: ff7e503 gates, 2838eb2 rename+deprecation, b91d477 files export)
**Rama activa:** `master`

---

## Bugs activos

### P1 — visuales (Phase 2, próximo pliego)
- **MINI-PLAYER:** opaco, transparencias dejan ver contenido de abajo (colapsa texto). Botonera no funciona, faltan botones. (baseline BACKLOG G7)
- **ERA-COLOR:** selector de color de nueva era no coincide con el de tags (hecho a mano). Estética "menú 2000s", monotona, no encaja con el design system.
- **PLAYLISTS-TAB:** al lado de la de tracks, parece de otra app (diseño inferior).
- **DEL-PLAYLIST (regresión):** "eliminar playlist no guarda, vuelve a salir" — el safety gate S64 evita reintroducción masiva, pero la causa raíz (DELETE en worker.js / caché frontend) no se ha diagnosticado.

### P2/resto
- **TRACKS-SORT:** botones de ordenar se ven horribles, replantear posición en pantalla.

---

## ESLint
✅ 0 errores en src/ · 0 errores en tools/ · 8 warnings pre-existentes en src/ (PlayerContext.jsx, WinampPlayer.jsx — exhaustive-deps y unused-disable no bloqueantes)

---

## Compat Sprint S64 — CERRADO ✅

3 commits pusheados a origin/master:
- `ff7e503` — 4 safety gates (D1>JSON, --force, all-None abort, snapshot pre-DROP, doc)
- `2838eb2` — rename `recreate_schema.sh` → `NUKE_schema.sh` + deploy_d1_migration.sh deprecation
- `b91d477` — `/api/files` añadido al export D1→JSON (files faltaba del backup)

**Causa raíz del P0 (3 data losses):** el JSON origen (`tools/the_vault_database.json`) estaba stale desde 31 mayo; re-correrlo sobre-escribía D1 con datos de testing. El export JSON nunca capturó entries/drops/eras/files.

**Verificación live contra D1:** tracks=558, playlists=6, entries=0, drops=0, eras=0, files=0, tags=4. (tags D1 > JSON stale → safety gate habría abortado.) Pérdida de datos del usuario confirmada **irrecuperable** (nunca estuvo en JSON, ahora tampoco en D1).

## Docs stale
Actualizados en S82: SESION.md, ESTADO.md, PROYECTO.md. Sin stale pendiente.

---

## Pliegos sin confirmar
ninguno

---

## Changelog usuario
→ docs/Nucleo/CHANGELOG.md

---

## Resumen de estado (post-S82)

> S82 fue Compat Sprint (gates + doc + export fix). % por módulo no cambió respecto a S81 — los visuales P1 son el siguiente bloque.

| Módulo | % | Estado |
|---|---|---|
| Core/Infra | 95% | Worker 22 endpoints, D1, JWT, FileUpload, StatsEngine, AnalyserNode ✅ · S64 safety gates (snapshot, NUKE gate, deprecation, doc) ✅ |
| VAULT CRUD | 96% | Entradas/eras en D1, edit/delete, foto upload a R2 ✅ · **+selector MULTIMEDIA 5 sub-tipos (8.1)** ✅ |
| VAULT Galería | 90% | WALL+CINEMA+DIALOGUE+MAP+EXHIBITION+REEL completos ✅ · render multimedia (8.2) 🟡 |
| CAPSULES | 90% | Timeline filtros, Smoke historial/rachas, TimeCapsules content picker, RECAP Wrapped ✅ |
| MUSIC LAB | 92% | Cola Q6/Q12/Q15-Q17, posición S1/S2, UX táctil, MediaSession M1-M12 ✅ |
| Persistencia | 80% | Entries/eras/tracks/playlists/drops/tags → Worker API; Drive solo libraries/heartbeat 🟡 |

**Pendiente:** Phase 2 visuales P1 (mini player, era selector, playlists tab) + DEL-PLAYLIST regression investigation + roadmap Fases 8.2–15 (schema `media_type` en D1, render multimedia, validación por tipo, búsqueda por categoría).
