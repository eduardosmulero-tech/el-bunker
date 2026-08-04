---
describe: PlayerContext.jsx, GoogleAuthService.js, GoogleDriveService.js, VaultContext.jsx, workers/worker.js, workers/routes/sync.js, StatsEngine.js, ToastContext.jsx
sincronizado_con: G3-1 — frontera Google OAuth / D1-R2 y Escucha Compartida
stale_si_pliego_toca: PlayerContext.jsx, GoogleAuthService.js, GoogleDriveService.js, VaultContext.jsx, workers/worker.js, workers/routes/sync.js, StatsEngine.js, ToastContext.jsx
---

# Data Flow

## Flujo principal de reproducción
1. Usuario selecciona track → `playTrack(track)` en `PlayerContext`.
2. Contexto actualiza `activeTrack`, dispara `autoPlaySignal`, emite evento `trackPlay` vía StatsEngine.
3. `audioRef.current.src = getStreamUrl(r2_key)` → streaming desde R2 con byte-range.
4. Solo PlayerProvider/MusicLab posee playback: mantiene el `<audio>` principal y el preload silencioso gapless. VAULT/CAPSULES no reproducen audio; no hay iframes ni APIs externas.

## Flujo Queue → Playback
- `addToQueue(track)` → mutación local en PlayerContext → persistencia en `queue_items` (D1 vía Worker API `PUT /api/queue/:user`).
- `onEnded` → `skip(1)` calcula próximo track considerando `shuffle`, `loopMode`, `_manual`.
- `setActiveTrack(next)` → re-render del reproductor + MediaSession update + evento StatsEngine.

## Flujo Persistencia (D1 Source of Truth — post-S115)

### Worker API → D1 (PRIMARIO y ÚNICO desde S115-D5)
- `_buildDbFromWorker(jwt)`: `GET /api/entries` + `/api/eras` + `/api/tracks` + `/api/tags` + `/api/playlists` + `/api/drops` + `/api/files` en paralelo (7 fetches).
- Mergea en `db` state: Worker data reemplaza entries/eras/music_lab.tracks.parsing `content` JSON safe.
- Si Worker falla → fallback a `EMPTY_DB()` (sin Drive JSON). S115-D5 eliminó la dualidad.
- `refreshDb()`: solo Worker refresh (sin Drive refresh).
- `patchDb(updater)`: **local-only** desde S115-D5. NO escribe a Drive. Mutaciones a D1 requieren llamada explícita Worker API (POST/PATCH/DELETE).

### Google Drive (retirado como fuente de datos)
- Google Identity Services se usa únicamente para autenticación y perfil (`userinfo.email`, `userinfo.profile`).
- `GoogleAuthService` no contiene scopes ni lecturas/escrituras Drive.
- `GoogleDriveService` se conserva solo como facade legacy sin operaciones activas; sus APIs de biblioteca/capacidad fallan explícitamente y no hacen red.
- Las acciones de biblioteca en `VaultContext` son compatibilidad local y no representan persistencia autorizada.
- Datos de contenido (entries/eras/tracks/playlists/drops/tags), archivos y reproducción: **solo Worker/D1/R2**.

### Carga progresiva en boot (S116+S132)
1. **`App.jsx` mount**: `VaultProvider` arranca → boot phase = INIT_SERVICES.
2. **`initGoogleServices()`**: gapi + GIS carga. `restoreToken()` chequea sessionStorage.
3. **`_onSignedIn(token)`** vía `onAuthChange`: `_fetchUserAndDb(token)` → boot phase = INIT_DB.
4. **`_fetchUserAndDb`**: google profile → whitelist check (3 usuarios) → si falla, `setBootPhase(UNAUTHORIZED)`.
5. **`_fetchJwt(email, googleToken)`**: `POST /api/auth/login` Worker API → token JWT → persistido en `sessionStorage("bunker_jwt")` → inyectado en `workerClient.setToken()`, `setUploadToken()`, `setStatsToken()`.
6. **`_buildDbFromWorker(jwt)`**: 7 fetches paralelos + 1 fetch `/api/config` para adventures_start_date.
7. **`setDb(data)`** → boot phase = READY → UI renderiza.
8. **Updates live**: cambios de presencia/escucha compartida via `/api/sync`; el Service Worker no registra Background Sync ni Push y no promete una cola offline durable.

### Carga progresiva histórica (S64) — supersedida
El flujo Drive JSON descrito en S64 ya no existe en el código actual. Se conserva aquí como historial arquitectónico, no como comportamiento vigente. La carga actual es la descrita en `Persistencia (D1 Source of Truth)` y no presenta datos Drive antes de D1.

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
