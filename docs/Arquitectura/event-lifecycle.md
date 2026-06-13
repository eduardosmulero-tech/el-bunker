---
describe: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, StatsEngine.js, workers/worker.js
sincronizado_con: S64 — VaultContext → Worker API (carga híbrida)
stale_si_pliego_toca: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx
---

# Event Lifecycle

## App Startup (post-S64)

1. **BOOT.INIT_SERVICES**: Carga gapi, validación OAuth2, restaura JWT de localStorage (`bunker_jwt`).
2. **BOOT.INIT_DB**: 
   - Fetch perfil Google → validación whitelist (3 usuarios).
   - `_fetchJwt(email, googleToken)`: `POST /api/auth/login` → JWT (HMAC-SHA256, 24h).
   - `initDatabase()`: descarga `the_vault_database.json` de Drive.
   - `_refreshWorkerData(jwt)`: fire-and-forget — fetch entries/eras/tracks de Worker API y merge en `db`.
3. **BOOT.READY**: Hidratación completada, router expone 3 tabs. Worker data se mergea asíncronamente.

## Playback Lifecycle
- **Play**: `playTrack()` → `isPlaying(true)`, WakeLock, MediaSession update, `trackPlay` event → StatsEngine.
- **Pause**: `setIsPlaying(false)`, WakeLock release, `trackPause` event.
- **Stop**: loopMode "off" + fin de lista → `setIsPlaying(false)`, fade a UI base.
- **Seek**: `audioRef.current.currentTime = X` (audio nativo). Doble tap seek en progreso (Fase 5).
- **Skip**: `trackSkip` event → StatsEngine.

## Queue Lifecycle
- **Add Track**: mutación local en PlayerContext → persistencia `PUT /api/queue/:user` (D1 `queue_items`).
- **Remove Track**: filtro de array local + persistencia asíncrona.
- **Shuffle**: mutación visual, no física. Botón anterior → historial real. Shuffle solo aleatoriza restantes (SH1, S51).
- **Loop**: triestado (`off`/`list`/`track`). `loopModeRef` para callbacks. Loop track: seek al inicio (L1, S52).

## Stats Events (wired S58-S59)
Cada acción emite vía `StatsEngine.emit()` → `POST /api/events` → tabla `events` en D1:

| Evento | Emisor | Archivo |
|---|---|---|
| `track_play` / `track_pause` / `track_skip` | PlayerContext | `src/core/PlayerContext.jsx` |
| `entry_created` | Vault (AddEntryForm submit) | `src/vault/Vault.jsx` |
| `drop_sent` | useMusicActions | `src/musiclab/useMusicActions.js` |
| `track_created` / `track_updated` / `track_deleted` | Worker API | `workers/worker.js` |
| `entry_created` / `entry_updated` / `entry_deleted` | Worker API | `workers/worker.js` |
| `era_created` / `era_updated` / `era_deleted` | Worker API | `workers/worker.js` |
| `capsule_created` / `capsule_unlocked` | Worker API | `workers/worker.js` |
| `playlist_created` / `tag_created` / `drop_sent` | Worker API | `workers/worker.js` |

## VAULT Lifecycle
- **Crear entrada**: AddEntryForm → FileUploadService (si hay foto) → Worker API `POST /api/entries` (futuro S65) → evento `entry_created`.
- **Subir archivo**: FileUploadService → `POST /api/upload` (pre-signed key) → `PUT /api/upload/:key` (binario a R2) → referencia `file_id` en entry.
- **Ver galería**: 6 modos de navegación. Capa ambiental reactiva por Era. Imágenes reales desde R2 (r2_key) o dataUrl.

## CAPSULES Lifecycle
- **Timeline**: `GET /api/events` desde Worker API con JWT → feed visual cronológico.
- **Smoke Session**: play → timer → fade-out (últimos 2 min) → `smoke_session_end` event (futuro).
- **Time Capsule**: `POST /api/time_capsules` (sellar) → bloqueo por `unlock_at` → `PATCH /api/time_capsules/:id` (desbloquear).
- **RECAP**: agregación desde `GET /api/events` por período (semana/mes/año).

## Persistence Lifecycle (híbrido S64)
- **Drive JSON**: libraries, playlists, drops, tags — `patchDb(updater)` → `updateData()` → Drive.
- **Worker API**: entries, eras, tracks, events, queue, capsules — REST endpoints con JWT auth.
- **Heartbeat**: `triggerHeartbeat()` cada 20 min + al volver de background (Page Visibility API).
- **Drop polling**: `fetchData()` cada 30s en VaultContext para detectar drops entrantes.
