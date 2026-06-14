# Phase 2.5 — Bugfixes + Q18-Visual + Roadmap 8.2 Prep
> Fecha: 2026-06-14 · Sesion: S87 (planning) · Bloque actual: P0 diagnostic + P1 features

## Estado al cierre de Phase 2 (S86)

Cierres confirmados:
- PLIEGO-230: mini player opaco + botonera consolidada (commit 34344ac)
- PLIEGOS-231+232: LISTS tab visual fixes + ERA-COLOR stale cleanup (commit 8d6d878)
- S86-001: React key audit (6 fixes, commit 989b158)
- S86-002 nit: drop redundant cursor:grab (commit 339833f)
- S86-003: S84 manual steps prod deploy + D1 migration (commit bbf573f)

Modulos segun ESTADO post-S86:
- MUSIC LAB: 97% (subido desde 92% en S84)
- Persistencia: 90% (subido desde 80% en S84)
- P0 cerrado (S84-MANUAL-STEPS)

## Issues pendientes (post-Phase 2)

### P0 — diagnostics pendientes (no son bugs de codigo confirmado)

| # | Issue | Origen | Diagnostico requerido |
|---|-------|--------|------------------------|
| 1 | React key warnings persistentes | browser-use S86 verification | TrackCard.jsx:293/368 (tags dupes) o data duplication en D1. Stack trace del console es definitivo. |
| 2 | "CARGANDO SERVICIOS..." hang en prod | browser-use S86 prod verification | Worker API init falla, CORS, o Google OAuth init bloqueado. Network tab diagnostic. |

### P1 — features (Q18 + UX)

| # | Issue | Archivo | Estimacion |
|---|-------|---------|------------|
| 3 | Q18-visual: drag&drop reorder tracks en PlaylistDetailModal | PlaylistDetailModal.jsx (en MusicLab.jsx) | 1 pliego, ~30 LOC |
| 4 | TRACKS-SORT: botones de ordenar horribles, replantear posicion | MusicLab.jsx COLA tab | 1 pliego, ~20 LOC |

### P2 — Roadmap 8.2 prep (multimedia)

| # | Issue | Estimacion |
|---|-------|------------|
| 5 | Schema `media_type` en D1 (tabla entries) | 1 pliego schema, 1 migration |
| 6 | Render multimedia basico en VaultGallery (image, video, audio embed) | 1 pliego, ~50 LOC |

## Pliegos propuestos (orden de ejecucion)

### BLOQUE 1: Diagnostics (P0)

**PLIEGO-233 — React key warnings preventive fix (TrackCard.jsx)**
- ARCHIVOS: src/musiclab/TrackCard.jsx
- CAMBIO: dedupe `track.tags` antes de .map() + cambiar `key={t}` a `key={\`${t}-${i}\`}` (lines 293, 368). Fix preventivo — si TrackCard es el culprit, este fix lo cierra. Si no, el stack trace del console apuntara al verdadero culprit.
- CRITERIO: lint 0, build clean. Verificacion manual: login prod + filter console por "same key" + confirmar 0 warnings.
- ESFUERZO: 5 min, 2 str_replaces.

**PLIEGO-234 — Data duplication audit D1**
- ARCHIVOS: ninguno (audit via wrangler d1 execute)
- CAMBIO: ejecutar queries de dup detection en todas las tablas (events, drops, eras, files, tracks, playlists, tags, entries). Si hay dupes, decidir: dedupe en backend o cambiar keys a `${id}-${i}`.
- CRITERIO: 0 tablas con duplicate IDs. Si hay, fix en backend o key fallback.
- ESFUERZO: 15 min (audit + posible fix).

**PLIEGO-235 — CARGANDO SERVICIOS hang diagnostic (no code, solo documentacion)**
- ARCHIVOS: docs/operacional/CARGANDO_diagnostic.md
- CAMBIO: documentar los 3 posibles causas (Worker API init fail, CORS, Google OAuth blocked) + pasos de Network tab diagnostic. Sin code change — el user tiene que hacer el diagnostic manual.
- CRITERIO: doc claro + checklist de Network tab.
- ESFUERZO: 5 min, doc-only.

### BLOQUE 2: Q18-Visual (P1)

**PLIEGO-236 — Q18-visual drag&drop reorder en PlaylistDetailModal**
- ARCHIVOS: src/musiclab/MusicLab.jsx (PlaylistDetailModal section)
- CAMBIO: HTML5 native drag (draggable + onDragStart/onDragOver/onDrop) consistente con handlePlDrop. Visuales: drag handle visible, drop indicator dashed accent. Backend ya soporta (PUT /api/playlists/:id/tracks del S84).
- CRITERIO: lint 0, build clean. Verificacion E2E: reordenar tracks en PlaylistDetailModal + F5 debe persistir.
- ESFUERZO: 30 min, 1 componente, ~50 LOC.

### BLOQUE 3: UX (P1)

**PLIEGO-237 — TRACKS-SORT replantear posicion**
- ARCHIVOS: src/musiclab/MusicLab.jsx COLA tab
- CAMBIO: mover botones de sort de su posicion actual a un dropdown menu o icon row en el header del tab. Iconos mas sutiles (no botones grandes). Matchear la estetica vibe-aware del reproductor.
- CRITERIO: lint 0, build clean. Verificacion visual: browser-use confirma botones discretos, no horribles.
- ESFUERZO: 20 min, ~30 LOC.

### BLOQUE 4: Roadmap 8.2 prep (P2)

**PLIEGO-238 — Schema media_type en entries D1**
- ARCHIVOS: workers/schema.sql, workers/worker.js
- CAMBIO: `ALTER TABLE entries ADD COLUMN media_type TEXT DEFAULT 'text'` + index. Worker: GET/POST/PATCH entries acepta `media_type`. Frontend: AddEntryForm.jsx selector de media type (text/image/video/audio/link).
- CRITERIO: lint 0, build clean, migration aplicada en prod. E2E: crear entry de cada tipo + verificar que persiste.
- ESFUERZO: 1h, 3 archivos, ~80 LOC + migration.

**PLIEGO-239 — Render multimedia basico VaultGallery**
- ARCHIVOS: src/vault/VaultGallery.jsx
- CAMBIO: render condicional segun `entry.media_type` (text=actual, image=img tag, video=video tag, audio=audio tag, link=iframe o a tag). Mantener glassmorphism.
- CRITERIO: lint 0, build clean. E2E: crear entries de varios tipos + verificar render correcto.
- ESFUERZO: 1h, 1 archivo, ~80 LOC.

## Out of scope (logged, no prioritarios)

- Re-audit completo de los 12 sitios "safe" del S86-001 (solo si warnings persisten post-PLIEGO-233)
- Toast infra en otros modulos (Capsules, Smoke) — auditado en S85d, no hay silent catches pendientes
- Fix WCAG romantiqueo — ya cerrado en S85
- Debounce/queue para drags concurrentes — logged en S85d, no es P0
- EVENT-NAMING-CONSISTENCY — ya cerrado en S85c

## Estimacion total del bloque

- BLOQUE 1 (diagnostics): 25 min
- BLOQUE 2 (Q18): 30 min
- BLOQUE 3 (UX): 20 min
- BLOQUE 4 (Roadmap 8.2): 2h

Total: ~3h 15min para cerrar el bloque completo.

## Recomendacion de orden

1. **Empezar por BLOQUE 1 (diagnostics)** — son 25 min, prerequisite para verificar si BLOQUE 2-4 tienen bugs latentes
2. **PLIEGO-236 (Q18 drag&drop)** — bloque importante de UX que el user ya solicito
3. **PLIEGO-237 (TRACKS-SORT)** — UX rapido
4. **PLIEGOS 238-239 (Roadmap 8.2)** — bloque mas grande, dejar para ultimo
