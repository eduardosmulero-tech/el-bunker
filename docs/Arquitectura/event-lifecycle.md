---
describe: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, StatsEngine.js, workers/worker.js, workers/routes/sync.js, ToastContext.jsx
sincronizado_con: G3-1 — D1/R2 source of truth, Google OAuth only, Escucha Compartida SC1-SC14
stale_si_pliego_toca: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, workers/routes/sync.js, ToastContext.jsx
---

# Event Lifecycle

## App Startup (vigente G3-1)

1. **BOOT.INIT_SERVICES**: carga Google Identity Services para autenticación y restaura la sesión de acceso por clave si existe.
2. **BOOT.INIT_DB**:
   - obtiene perfil Google mediante `userinfo.email`/`userinfo.profile` y valida la whitelist;
   - o canjea `POST /api/auth/token` para la sesión por clave test/admin;
   - obtiene el JWT común y lo inyecta en `WorkerClient`, `FileUploadService` y `StatsEngine`;
   - `_buildDbFromWorker(jwt)`: carga entries, eras, tracks, tags, playlists, drops, files y `/api/config` desde Worker/D1.
3. **BOOT.READY**: la app queda hidratada desde D1/R2; si el Worker falla, usa `EMPTY_DB()` seguro. No se consulta Drive para datos.

### Flujo histórico S64
El antiguo `initDatabase()`/`_refreshWorkerData()` con Drive JSON queda conservado como historial de migración y no describe el comportamiento actual.

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

## Stats Events (wired S58-S132)
Cada acción emite vía `StatsEngine.emit()` → `POST /api/events` → tabla `events` en D1:

| Evento | Emisor | Archivo |
|---|---|---|
| `track_play` / `track_pause` / `track_skip` | PlayerContext | `src/core/PlayerContext.jsx` |
| `entry_created` | Vault (AddEntryForm submit) | `src/vault/Vault.jsx` |
| `drop_sent` | useMusicActions | `src/musiclab/useMusicActions.js` |
| `smoke_session_started` / `smoke_session_completed` / `smoke_session_abandoned` | SmokeSession | `src/smoke/SmokeSession.jsx` (vía Worker API directo) |
| `track_created` / `track_updated` / `track_deleted` | Worker API | `workers/worker.js` |
| `entry_created` / `entry_updated` / `entry_deleted` | Worker API | `workers/worker.js` |
| `era_created` / `era_updated` / `era_deleted` | Worker API | `workers/worker.js` |
| `capsule_sealed` / `capsule_opened` | Worker API | `workers/worker.js` |
| `playlist_created` / `tag_created` / `drop_sent` | Worker API | `workers/worker.js` |

## Escucha Compartida Lifecycle (S132 — SC1-SC14)

### Presence detection (`/api/sync?action=presence`, polling 5s + heartbeat 30s)
- `PlayerContext.checkPresence()`: `GET /api/sync?action=presence` cada 5s en background.
- Worker lee `app_config` tabla: `presence_{otherUser}` blob JSON `{ track_id, track_title, track_vibe, updated_at }`.
- Stale detection: si `updated_at > 5min` → presence inactive.
- Si activo + `pending_session_id` existe → expone al cliente para auto-join.
- Cliente broadcaster (PlayerContext) envía `POST /api/sync action=heartbeat` cada 30s con track_id/title/vibe.

### Session lifecycle
- **Create:** cliente broadcaster → `POST /api/sync action=create` → `shared_sessions` row con `host_user_id`, `guest_user_id=NULL`. Recibe `session_id`.
- **Join auto:** cliente guest → if `presence.active AND pending_session_id` → `POST /api/sync action=join session_id` → set `guest_user_id`.
- **Long-poll sync:** cliente guest hace **`GET /api/sync?session_id=X&since=TS`** que bloquea hasta **20s** (`POLL_TIMEOUT = 20000` en `sync.js`) en servidor, devuelve `{ session_id, position, active_track_id, is_playing, queue_json, action }` cuando hay cambio (poll interno cada 1s).
- **Sync actions:** `sync`, `queue_add`, `queue_remove` → `POST /api/sync` actualiza `position`, `is_playing`, `queue_json`, `last_action`.
- **Leave:** cliente → `POST /api/sync action=leave session_id` → si guest, limpia `guest_user_id`; si host, `DELETE` row.
- **End (DELETE):** server → `DELETE /api/sync?session_id=X` → response `{ ended, queue_json: [...] }` merged en client localQueue (SC10+SC13).

### Toast session lifecycle (S132 SC8 reconnect UI)
- Cuando `sync long-poll` retorna `changed=true` con `is_playing=false` (drift host paused): toast sessionId aparece con action buttons: `RESINCRONIZAR` (re-sync) / `MANTENER` (local position).
- Renderizado vía `useToast()` unificado (`ToastContext`), posicionado por `Layout.jsx`.

## VAULT UI Lifecycle (S130-B + S131)
- **Submit AddEntryForm:** `useVault().patchDb(local)` + `workerClient.post('/api/entries', payload)` + `FileUploadService.uploadFile()` (si hay foto). Optimistic local → D1 sync en background.
- **Edit entry:** `useVault().updateEntry(id, patch)` → `workerClient.patch(...)` + local update optimism.
- **Delete entry:** soft-delete vía `useVault().deleteEntry(id)` → `workerClient.del(...)` + local `is_deleted=true`.
- **Era create:** `workerClient.post('/api/eras')` + `patchDb(local)`. Color via `ColorPicker` design system.
- **AdventureCounter** (Vault.jsx) ahora lee `db.adventures_start_date` desde `app_config` (D1) — antes hardcoded 500d.
- **MapView real (S131):** `react-leaflet` + `react-leaflet-cluster` lazy-loaded en `VaultGallery.jsx`. CartoDB Dark tiles y `FitBoundsToMarkers`; los datos proceden de entries reales, sin fixtures DEMO en producción.

## Boot lifecycle (S116 + S132)
- **BOOT.INIT_SERVICES**: gapi + GIS init + restore JWT de `sessionStorage("bunker_jwt")`.
- **BOOT.INIT_DB**: Google profile → whitelist check → `POST /api/auth/login` → JWT → 7 fetches paralelos + `/api/config`.
- **BOOT.READY**: renderiza con db cargada. Service Worker registra `install` handler con `sw-assets.json` precache (S131).
- **Page Visibility (vivo):** `document.visibilityState === "visible"` → `heartbeat()` ejecuta `lastHeartbeat = now`.
- **Reconnect SC8:** si sync long-poll retorna drift >2s entre local y session position → toast RESINCRONIZAR/MANTENER.

## CAPSULES Lifecycle (S130-B + S132)
- **Timeline:** `GET /api/events?limit=200` + filtros Era/module/tipo → feed visual cronológico con "Un día como hoy" (S72). Vista MODE toggles entre timeline/compact.
- **Smoke Session:** timer local + fade-out últimos 2 min + `workerClient.post('/api/events', { event_type: 'smoke_session_started' | 'completed' })` → tabla `events`. Streak counter local (8.3).
- **Time Capsules:** `GET /api/time_capsules` + `PATCH /api/time_capsules/:id` para unlock/sellado (S74 opening animation).
- **RECAP:** agregación desde `GET /api/events` por período (semana/mes/año) con resumen visual.

## VAULT Lifecycle
- **Crear entrada**: AddEntryForm → FileUploadService (si hay foto) → Worker API `POST /api/entries` → evento `entry_created`.
- **Subir archivo**: FileUploadService → `POST /api/upload` (pre-signed key) → `PUT /api/upload/:key` (binario a R2) → referencia `file_id` en entry.
- **Ver galería**: 6 modos de navegación. Capa ambiental reactiva por Era. Imágenes reales desde R2 (r2_key) o dataUrl.

## CAPSULES Lifecycle
- **Timeline**: `GET /api/events` desde Worker API con JWT → feed visual cronológico.
- **Smoke Session**: play → timer → fade-out → evento de sesión en `events`.
- **Time Capsule**: `POST /api/time_capsules` (sellar) → `capsule_items` → bloqueo por `unlock_at` → `PATCH /api/time_capsules/:id`.
- **RECAP**: agregación desde `GET /api/events` por período (semana/mes/año).

## Persistence Lifecycle (vigente G3-1)
- **Worker API/D1/R2**: fuente única para entries, eras, tracks, playlists, drops, tags, queue, cápsulas, eventos y archivos.
- **Google Identity Services**: solo autenticación y perfil; no persiste datos.
- **GoogleDriveService**: facade legacy sin operaciones Drive activas; no se permiten imports nuevos.
- **Heartbeat**: estado local y presencia/escucha compartida vía `/api/sync` autenticado.
- **Drops**: estado cargado desde Worker/D1 y mutaciones explícitas por Worker API; no hay polling Drive.
