---
describe: PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx, workers/worker.js, StatsEngine.js
sincronizado_con: S64 — VaultContext → Worker API (carga híbrida)
stale_si_pliego_toca: PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx, workers/worker.js
---

# Data Flow

## Flujo principal de reproducción
1. Usuario selecciona track → `playTrack(track)` en `PlayerContext`.
2. Contexto actualiza `activeTrack`, dispara `autoPlaySignal`, emite evento `trackPlay` vía StatsEngine.
3. `audioRef.current.src = getStreamUrl(r2_key)` → streaming desde R2 con byte-range.
4. Solo MusicLab/WinampPlayer instancia `<audio>`. Sin iframes ni APIs externas.

## Flujo Queue → Playback
- `addToQueue(track)` → mutación local en PlayerContext → persistencia en `queue_items` (D1 vía Worker API `PUT /api/queue/:user`).
- `onEnded` → `skip(1)` calcula próximo track considerando `shuffle`, `loopMode`, `_manual`.
- `setActiveTrack(next)` → re-render del reproductor + MediaSession update + evento StatsEngine.

## Flujo Persistencia (híbrido S64)

### Worker API → D1 (primario para entries/eras/tracks/events/queue/capsules)
- `_refreshWorkerData(jwtToken)`: `GET /api/entries` + `GET /api/eras` + `GET /api/tracks` en paralelo.
- Mergea en `db` state: Worker data reemplaza entries/eras/music_lab.tracks.
- `content` de entries se parsea de JSON string a objeto (safeParse).
- Si Worker falla → fallback silencioso a Drive JSON.
- `refreshDb()`: Drive refresh → Worker refresh secuencial.

### Google Drive JSON (para libraries/playlists/drops/tags — en transición)
- `patchDb(updater)`: actualización optimista local → `updateData()` → Drive.
- `initDatabase()`: descarga `the_vault_database.json` → migración v5 → hidratación.
- Polling de drops cada 30s en VaultContext.
- Heartbeat cada 20 min vía `triggerHeartbeat()`.

### Carga progresiva en boot (S64)
1. `_fetchUserAndDb()`: Google OAuth2 → perfil → JWT (Worker API `POST /api/auth/login`).
2. `initDatabase()`: carga Drive JSON → `setDb(data)` → `setDbStatus("ONLINE")`.
3. `_refreshWorkerData(jwt)`: fire-and-forget → Worker API entries/eras/tracks → `setDb(prev => ...)` merge.
4. UI renderiza con Drive data primero, se enriquece con Worker data al completar.

## Flujo Stats Engine
- `StatsEngine.js`: módulo con token JWT global (`setStatsToken(token)` desde VaultContext).
- `emit(type, payload)`: `POST /api/events` → tabla `events` en D1 (append-only).
- Emisores: PlayerContext (trackPlay/Pause/Skip), Vault (entryCreated), useMusicActions (dropSent).
- Consumidores: Timeline (`GET /api/events`), RECAP (agregación por período).

## Flujo FileUploadService
- `setUploadToken(token)` desde VaultContext al obtener JWT.
- `uploadFile(file, prefix, metadata)`: `POST /api/upload` → obtiene `r2_key` + `file_id` → `PUT /api/upload/:key` binario directo a R2.
- AddEntryForm: dynamic `import("../core/FileUploadService")` para subida de fotos.

## Flujo CAPSULES
- Capsules.jsx recibe `jwtToken` vía App.jsx → fetch real a Worker API.
- Timeline: `GET /api/events` con filtros → feed cronológico.
- Smoke Session: controla `masterVolume` vía PlayerContext + timer local.
- Time Capsules: `GET /api/time_capsules` + `PATCH /api/time_capsules/:id` para unlock.
- RECAP: agrega `events` por período (semana/mes/año) desde Worker API.

## Flujo VAULT (galería)
- Fotos/vídeos → FileUploadService → pre-signed PUT a R2 → referencia en `entries` vía `file_ids`.
- Worker API enriquece entries con `tags[]` y `files[]` (batch JOINs).
- Galería 6 modos consulta `entries` filtradas por `era_id` y `type`.
- Capa ambiental: paleta reactiva por Era + AnalyserNode para pulso acústico.
