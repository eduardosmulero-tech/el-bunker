# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.
> Actualizar antes de cerrar sesión.

**Próximo pliego:** FASE 8 — VAULT Profundo (S93) · Taxonomía VAULT 14 categorías
**Última sesión:** S92 — Cierre Fase 7 (verificación G5 + docs)
**Rama activa:** `master`

---

## Bugs activos

### P1
ninguno

### P2/resto

| Bug | Estado | Sesión |
|---|---|---|
| **Q12** — Añadir playlist entera a cola | ✅ CERRADO | S90 |
| **S3** — Soft delete tracks (deleted_at + deleted_by D1) | ✅ CERRADO | S90 |
| **EC-TR6** — Extraer metadatos ID3 al subir MP3 | ✅ CERRADO | S90 |
| **S4** — Sin red → estado neutral consciente | ✅ CERRADO | S91 |
| **A2/A3/A5** — Android audio focus (MediaSession stop) | ✅ CERRADO | S91 |
| **TRACKS-SORT** — Verificar en dispositivo real | 🟡 PENDIENTE | — |

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

## S86 Key Audit — CERRADO ✅

**Pliego aplicado:** S86-001 (commit `989b158`) — React Key Audit.

**Problema:** browser-use verification previa (S86) detectó que el console de React estaba flooded con warnings `Encountered two children with the same key, %s`. Causa raíz: position-dependent keys (suffixes con `-${i}`) y `key={i}` puros que forzaban remount innecesario en reorder.

**Audit scope:** 61 sitios `key={...}` revisados en `src/`:
- **43 OK** — ya usaban `key={x.id}` con IDs estables de D1
- **12 safe** — `key={i}` en arrays estáticos (Recaps/LoginScreen/SmokeSession/Vault — no reordenan); keys derivados de valores únicos en su scope (VaultGallery/TrackCard/ColorPicker)
- **6 corregidos** — position-dependent + non-unique:
  - Timeline.jsx:139 `<span key={i}>` → `key={e.id || \`ev-${i}\`}`
  - Timeline.jsx:256 `motion.div key={\`${e.id || i}-${i}\`}` → `key={e.id || \`tev-${i}\`}`
  - Timeline.jsx:283 `motion.div key={\`${e.id || day}-${i}\`}` → `key={e.id || \`${day}-${i}\`}`
  - MusicLab.jsx:812 `<div key={\`hist-${track.id}-${i}\`}>` → `key={\`hist-${track.id}\`}`
  - MusicLab.jsx:809 `.map((track, i) => {` → `.map((track) => {` (drop unused `i`)
  - SmokeSession.jsx:523 `<div key={h.id || i}>` → `key={h.id || \`session-${i}\`}`

**Validación:** lint 0 errors, build clean (1.81s). Code-reviewer ship-it.

**Verificación browser-use pendiente:** OAuth wall impide confirmar visualmente que los warnings desaparecieron. Diagnóstico manual recomendado (2 min): login en prod + filtrar console por "same key" + compartir stack trace del primer warning.

---

## FASE 7 — CERRADA ✅ (S89-S92, 4 sesiones)

| Sesión | Qué | Commits |
|---|---|---|
| **S89** | Auditoría BACKLOG: 6 bugs stale + 3 reales (G2 onAddEra, 2 alert()→toast). Roadmap v5 | `2df9e0c` |
| **S90** | Q12 (playlist entera a cola) + S3 (soft delete tracks D1) + EC-TR6 (ID3 metadata) | `317d263` |
| **S91** | S4 (red sin auto-reanudar + track sin archivo neutral) + A2/A3/A5 (MediaSession stop) | `08f8cfd` |
| **S92** | Verificación G5 + lint global + cierre docs | este commit |

> **Resultado Fase 7:** 11 bugs/features cerrados. 0 bugs P1. BACKLOG limpio. App lista para Fase 8 (VAULT Profundo).

---

## Resumen de estado (post-Fase 7)

| Módulo | % | Estado |
|---|---|---|
| Core/Infra | 96% | Worker 24 endpoints, D1 16 tablas, JWT, FileUpload, StatsEngine, AnalyserNode, MediaSession stop, red/sin-archivo neutral ✅ |
| VAULT CRUD | 96% | Entradas/eras en D1, edit/delete, foto upload a R2, 5 sub-tipos multimedia, toast feedback ✅ |
| VAULT Galería | 90% | WALL+CINEMA+DIALOGUE+MAP+EXHIBITION+REEL, render multimedia básico ✅ · taxonomía 14 categorías 🟡 |
| CAPSULES | 90% | Timeline filtros+paginación, Smoke historial/rachas/volumen, TimeCapsules CRUD, RECAP Wrapped ✅ |
| MUSIC LAB | 98% | Cola Q6/Q12/Q15-Q17, posición S1/S2/S4, UX táctil, MediaSession M1-M12, soft delete S3, ID3 EC-TR6 ✅ |
| Persistencia | 95% | Playlists/tracks/drops/entries/tags 100% Worker API ✅ · tags vía Worker API, Drive solo fallback 🟡 |

**Pendiente Fase 8+:** Taxonomía VAULT 14 categorías, render multimedia avanzado, escucha compartida, Chromecast, Android audio focus completo.
