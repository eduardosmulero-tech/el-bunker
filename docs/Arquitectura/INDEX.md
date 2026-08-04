# INDEX.md — arquitectura el_bunker
> Fuente primaria de staleness. Leer en cada arranque.
> Actualizar al cerrar cada pliego que toque archivos listados en stale_si_pliego_toca.
> Última actualización: S153 — drag de cola por IDs, contrato de audio/preload y límites runtime documentados (FASE C.2 + D: EntryLightbox, WALL museo por eras, DEMO purge, R2 HMAC gate, track_updated silenciado).

---

## TABLA DE STALENESS

| Doc | sincronizado_con | stale_si_pliego_toca | Estado |
|---|---|---|---|
| architecture.md | S153 — audio/preload + responsive desktop + VaultHelpers | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Layout.jsx, ToastContext.jsx, core/ui/*, EntryLightbox.jsx, WallView.jsx, VaultGallery.jsx, AddEntryForm.jsx, VaultHelpers.js, workers/routes/r2.js, workers/routes/entries.js, workers/utils/r2-sign.js, workers/routes/tracks.js, src/capsules/Timeline.jsx | ✅ OK |
| data-flow.md | S132 — sync long-polling + queue bidireccional + adventures_start_date real | PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx, workers/worker.js, workers/routes/sync.js, ToastContext.jsx | ⚠️ STALE S150 — auth: ADR-028 añade POST /api/auth/token + sessionKind en VaultContext (ver docs/operacional/ACCESO_TEST_ADMIN.md) |
| event-lifecycle.md | S132 — Escucha Compartida wired SC1-SC14 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, workers/routes/sync.js, ToastContext.jsx | ✅ OK |
| ownership-map.md | S132 — shared_sessions new owner | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Layout.jsx, ToastContext.jsx, workers/routes/sync.js | ✅ OK |
| rendering-flow.md | S153 — reorder/audio-preload + responsive desktop + VaultHelpers | App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx, Layout.jsx, ToastContext.jsx, core/ui/*, EntryLightbox.jsx, WallView.jsx, VaultGallery.jsx, src/capsules/Timeline.jsx | ✅ OK |
| state-map.md | S132 — PlayerContext+escucha compartida + ToastContext ephemeral | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx, Vault.jsx, Layout.jsx, ToastContext.jsx | ✅ OK |
| technical-debt.md | S153 — reorder/audio-preload + responsive desktop + VaultHelpers; TD-1/TD-2 históricos | cualquier refactor estructural | ✅ OK |

---

## IMPACTO DE STALENESS

✅ **Resincronizado a S132** (17 Junio 2026): cubre S130-B (VaultContext D1-only), S131 (PRECACHE + safe-areas + design system + MapView), S132 (ToastProvider + Escucha Compartida SC1-SC14 + queue bidireccional + auto-join).

Cambios cubiertos por esta resincronización:
- 6 archivos `docs/Arquitectura/*.md` actualizados (`sincronizado_con: S132`).
- INDEX.md flags stale: **0** (todos ✅ OK).
- Nuevos componentes documentados: `ToastContext`, `Button/Card/Input/Skeleton`, `GeocoderService`, `LocationSearch`.
- Nuevas tablas D1 documentadas: `shared_sessions`, `presence_{user}` (app_config).
- Nuevos endpoints Worker documentados: `/api/sync` (long-polling + heartbeat), `/api/config`.
- Nuevos campos PlayerContext: `sessionId`, `partnerListening`, `partnerTrack`, `partnerName`, `partnerTrackVibe`, `joinPendingSession`, `leaveSession`, `broadcastPresence`.

---

## CUÁNDO ACTUALIZAR ESTE INDEX

Al cerrar un pliego: marcar stale cualquier doc cuyo campo `stale_si_pliego_toca` incluya un archivo tocado por ese pliego. Actualizar la columna `sincronizado_con` cuando se resincronice el doc.

Próximo pliego planeado: validación visual reproducible de desktop/móvil y pruebas runtime PWA; no hay cambios de datos vivos ni despliegue en este bloque.

---
