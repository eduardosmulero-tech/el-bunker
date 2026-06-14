# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.
> Actualizar antes de cerrar sesión.

**Próximo pliego:** MANUAL STEPS URGENTES (wrangler deploy + ALTER TABLE playlists.sort_order) → Phase 2 visuales P1
**Última sesión:** S85c — Autonomous Roadmap Batch (P1 mini-player, S8 persist, Q6 toast, UX3.7, debounce, event naming, Capsules toast infra) — 6 archivos
**Rama activa:** `master`

---

## Bugs activos

### P0 — CRÍTICO (bloquea validación en prod)
- **S84-MANUAL-STEPS:** ejecutar `wrangler deploy` + `ALTER TABLE playlists ADD COLUMN sort_order INTEGER DEFAULT 0` + `CREATE INDEX idx_playlists_order`. Sin esto, los 4 endpoints nuevos del S84 (`/api/playlists/reorder`, `PUT/DELETE /api/playlists/:id/tracks`, `PATCH /api/playlists/:id`) devuelven 404 y todos los handlers del patrón DEL-PLAYLIST rompen en producción.

### P1 — visuales (Phase 2, tras manual steps)
- **MINI-PLAYER:** opaco, transparencias dejan ver contenido de abajo (colapsa texto). Botonera no funciona, faltan botones. (baseline BACKLOG G7)
- **ERA-COLOR:** selector de color de nueva era no coincide con el de tags (hecho a mano). Estética "menú 2000s", monotona, no encaja con el design system.
- **PLAYLISTS-TAB:** al lado de la de tracks, parece de otra app (diseño inferior).

### P1 — accesibilidad
- ~~**WCAG-ROMANTIQUEEO:** el color `#bf00ff` (vibe romantiqueo/purple) da contrast ratio 4.40:1 sobre `#0a0a0a` — falla WCAG AA para texto normal (necesita 4.5:1).~~ **CERRADO en S85** cambiando a `#d966ff` (~5.5:1 sobre #0a0a0a, pasa AA). Aplica a 11 archivos.

### P2/resto
- **TRACKS-SORT:** botones de ordenar se ven horribles, replantear posición en pantalla.
- ~~**EVENT-NAMING-CONSISTENCY:**~~ **CERRADO en S85c** — `playlist_reordered` → `playlist_tracks_reordered` en worker.js. Verificación: no quedan consumers con el nombre viejo.

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

## Sister-Bug Cleanup S84 — CERRADO ✅

8 commits pusheados a origin/master:
- `9351603` — RENAME-PLAYLIST (sister #1): `handleRenamePlaylist` routea por `PATCH /api/playlists/:id`
- `ee9263f` — REORDER/REMOVE-TRACK (sister #2): 2 endpoints nuevos + wirings
- `f68f8df` — toasts de error en 3 catches (handleDeletePlaylist, onDeleteDrop, handleRenamePlaylist)
- `d12bf3b` — COLA tab vibe-aware refactor (ACID → accentColor, 49 refs scoped)
- `3828446` — toasts extendidos (onRemoveTrack, onReorderTracks, handleDeleteEntry + toast infra en Vault.jsx)
- `3405d16` — handlePlDrop (sister #3): sort_order column + `POST /api/playlists/reorder` + wiring
- `4c94540` — DEL-PLAYLIST fix (pre-S84, ya cerrado)
- `a71171e` — DEL-DROP fix (pre-S84, ya cerrado)

**Patrón cerrado:** 6 sister bugs del mismo tipo (handler solo llama `patchDb` sin Worker API) aplicadas. Cero silent catches en handlers principales. Coherencia vibe-aware completa en TRACKS/LISTS/COLA.

**Verificación live (recomendada tras manual steps):** refreshDb tras cada operación del patrón (delete/rename/reorder playlist, remove/reorder track, delete entry, drop) no debe restaurar el estado stale.

---

## Pliegos sin confirmar
ninguno

---

## Changelog usuario
→ docs/Nucleo/CHANGELOG.md

## Docs stale
Actualizados en S85: SESION.md, ESTADO.md, CHANGELOG.md, PLIEGOS_HISTORIAL.md, legacy/SESIONES.md. Sin stale pendiente.

---

## Resumen de estado (post-S85)

> S85 fue accesibilidad WCAG (romantiqueo `#bf00ff`→`#d966ff`, pasa AA) + dead code cleanup (extractor de YouTube eliminado en 3 archivos, código inalcanzable desde migración a R2 en S54).

| Módulo | % | Estado |
|---|---|---|
| Core/Infra | 95% | Worker 24 endpoints (+2 reorder), D1, JWT, FileUpload, StatsEngine, AnalyserNode ✅ · S64 safety gates ✅ |
| VAULT CRUD | 96% | Entradas/eras en D1, edit/delete, foto upload a R2 ✅ · **+selector MULTIMEDIA 5 sub-tipos (8.1)** ✅ · **+toast feedback en delete (S84)** ✅ |
| VAULT Galería | 90% | WALL+CINEMA+DIALOGUE+MAP+EXHIBITION+REEL completos ✅ · render multimedia (8.2) 🟡 |
| CAPSULES | 90% | Timeline filtros, Smoke historial/rachas, TimeCapsules content picker, RECAP Wrapped ✅ |
| MUSIC LAB | 97% | Cola Q6/Q12/Q15-Q17, posición S1/S2, UX táctil, MediaSession M1-M12 ✅ · **+6 sister bugs cerradas (S84)** ✅ · **+toast feedback global (S84)** ✅ · **+vibe-aware COLA (S84)** ✅ |
| Persistencia | 90% | **6 sister bugs del patrón DEL-PLAYLIST cerradas (S84)** — playlists/tracks/drops/entries 100% Worker API; Drive solo libraries/heartbeat 🟡 |

**Pendiente:** MANUAL STEPS S84 (wrangler deploy + ALTER TABLE) → Phase 2 visuales P1 (mini player, era selector, tab playlists) + roadmap Fases 8.2–15 (schema `media_type` en D1, render multimedia, validación por tipo, búsqueda por categoría). WCAG romantiqueo cerrado en S85.
