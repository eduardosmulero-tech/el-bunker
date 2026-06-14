# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.
> Actualizar antes de cerrar sesión.

**Próximo pliego:** S96 — Vault.jsx: filtro por categoría en vista principal de entradas
**Última sesión:** S95 — Galería con filtros 14 categorías + badges (VaultGallery.jsx)
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

## FASE 8 — VAULT Profundo (S93-S95, 3 sesiones) 🟢 EN PROGRESO

| Sesión | Qué | Commits |
|---|---|---|
| **S93** | Taxonomía 14 categorías: ENTRY_TYPES 8→71 tipos en AddEntryForm | `0c390be` |
| **S94** | UI por categoría: campos extra (fecha, rating, url, location, amount, mood) | — |
| **S95** | VaultGallery: filtros 14 categorías + badges + entriesWithMedia | `fca7fa9` |

> **Progreso Fase 8:** 3/8 sesiones. Taxonomía 100% en UI. Galería multi-categoría funcional.

---

## Resumen de estado (post-S95)

| Módulo | % | Estado |
|---|---|---|
| Core/Infra | 96% | Worker 24 endpoints, D1 16 tablas, JWT, FileUpload, StatsEngine, MediaSession stop ✅ |
| VAULT CRUD | 98% | 71 tipos en 14 categorías, campos extra por categoría, upload a R2, toast feedback ✅ |
| VAULT Galería | 95% | 6 modos + filtros 14 categorías + badges + entriesWithMedia ✅ |
| CAPSULES | 90% | Timeline filtros+paginación, Smoke historial/rachas, TimeCapsules CRUD, RECAP Wrapped ✅ |
| MUSIC LAB | 98% | Cola Q6/Q12/Q15-Q17, S1/S2/S4, MediaSession M1-M12, soft delete S3, ID3 EC-TR6 ✅ |
| Persistencia | 95% | Playlists/tracks/drops/entries/tags 100% Worker API ✅ |

**Pendiente:** Escucha compartida, Chromecast, Android audio focus A5, Vault.jsx filtro categoría.
