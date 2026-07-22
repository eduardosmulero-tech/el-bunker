---
describe: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx, Layout.jsx, core/ToastContext.jsx, core/ui/Button.jsx, core/ui/Card.jsx, core/ui/Input.jsx, core/ui/Skeleton.jsx, core/ui/index.js, core/ColorPicker.jsx
sincronizado_con: S148 — FASE C.2+D cierre v1.0 (EntryLightbox unificado, WALL museo por eras, DEMO purge, R2 HMAC gate, track_updated silenciado)
stale_si_pliego_toca: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Layout.jsx, ToastContext.jsx, core/ui/Button.jsx, core/ui/Card.jsx, core/ui/Input.jsx, core/ui/Skeleton.jsx, core/ui/index.js
---

# Architecture

## Objetivo del sistema
PWA serverless tipo bóveda de memoria y reproductor musical colaborativo para una pareja (Edu y David).
Estética Cyber-Vandal. Persistencia híbrida: Cloudflare D1+R2 (entries/eras/tracks) + Google Drive JSON (libraries/playlists/drops/tags en transición).
Producción: https://el-bunker-beige.vercel.app · Worker API: https://el-bunker-api.thebunker-admin.workers.dev

## Módulos principales (post-S64)

### VAULT — Motor de contenido
Responsable de: eras, entries, documentos, fotos, tags de contexto, galería 6 modos.
Dueño del dato de contenido. Sin audio propio.
Carga de datos: Worker API (entries, eras) con fallback Drive JSON.
Archivos: `src/vault/Vault.jsx`, `src/vault/VaultGallery.jsx`, `src/vault/WallView.jsx`, `src/vault/EntryLightbox.jsx` (S148: lightbox unificado — portal+swipe+pinch, adoptado por los 6 modos), `src/vault/AddEntryForm.jsx`. Sin DEMO fallbacks desde S148 (estado vacío honesto).

### MUSIC LAB — Motor de audio
Responsable de: tracks, playlists, drops, tags de vibe, reproducción, escucha compartida.
ÚNICO módulo que instancia `<audio>`. Mini-player persistente sobre todas las tabs.
Carga de tracks: Worker API con fallback Drive JSON.
Archivos: `src/musiclab/*`, `src/core/PlayerContext.jsx`

### CAPSULES — Capa de experiencias temporales
4 sub-tabs: Timeline, Smoke Session, Time Capsules, RECAP.
Cliente de VAULT y MusicLab — no dueño del dato.
Fetch de datos: Worker API (`/api/events`, `/api/time_capsules`) vía jwtToken.
Archivos: `src/capsules/Capsules.jsx`, `src/capsules/Timeline.jsx`, `src/capsules/TimeCapsules.jsx`, `src/capsules/Recaps.jsx`, `src/smoke/SmokeSession.jsx`

### Persistence Engine (híbrido S64)
- **Worker API** (D1 + R2): fuente primaria para entries, eras, tracks, events, time_capsules, queue.
- **Google Drive JSON**: fuente para libraries, playlists, drops, tags (en transición a D1).
- `VaultContext._refreshWorkerData(token)`: mergea datos del Worker en `db` state. Fallback silencioso a Drive.

### Stats Engine
Tabla `events` en D1 — append-only (🔒-3). Todos los módulos emiten eventos vía `StatsEngine.js`.
Wired en S58-S59: `trackPlay/trackPause/trackSkip` desde PlayerContext, `entryCreated` desde Vault, `dropSent` desde useMusicActions.
Archivos: `src/core/StatsEngine.js`
**S148 FASE D:** `track_updated` deja de emitirse en PATCH (`workers/routes/tracks.js` — helper `emitTrackEvent` para POST/DELETE). El histórico previo NO se borra (🔒-3 append-only); `Timeline.jsx` filtra con whitelist `VISIBLE_TRACK_EVENTS` en lectura. POST (`track_created`) y DELETE (`track_deleted`) siguen emitiendo.

### FileUploadService + R2 Auth Gate (S148 FASE D)
Subida unificada a R2 con pre-signed keys. Consumido por MusicLab (MP3) y VAULT (fotos, vídeos, docs).
Token JWT inyectado vía `setUploadToken()` desde VaultContext.
Archivos: `src/core/FileUploadService.js`
**S148 FASE D — R2 gate:** prefijos sensibles (`vault/docs/`, `vault/audio/`) exigen token HMAC en GET (`workers/routes/r2.js` + helper `workers/utils/r2-sign.js`). `entries.js` firma server-side las URLs sensibles (campo `img.url`) y el frontend prefiere esa URL firmada sobre construir `${R2_PUBLIC_BASE}/${r2_key}` manualmente. Si `env.R2_SIGN_SECRET` no está configurado, el gate se omite (compat).

---

## Relaciones entre módulos

| Módulo | Depende de | Expone |
|---|---|---|
| App (Router) | VaultContext | Vista activa (3 tabs) + threading jwtToken |
| PlayerContext | VaultContext (userId, tracks) | APIs de control de media, cola, `trackVibe` |
| MusicLab | VaultContext, PlayerContext | Interfaz de gestión musical + reproducción |
| VAULT | VaultContext (db, jwtToken) | Galería 6 modos, Eras, AddEntryForm |
| VaultGallery | VAULT (entries, eras, jwtToken) | Renderizado de galería por modo |
| CAPSULES | VAULT, MusicLab, Worker API | Timeline, Smoke, Capsules, RECAP |
| WinampPlayer | PlayerContext | Controles visuales, canvas visualizador |
| FileUploadService | VaultContext (uploadToken) | uploadFile(), getStreamUrl() |
| StatsEngine | VaultContext (statsToken) | emit(), trackPlay/Pause/Skip |

---

## Cambios S49-S64

- **S49:** YouTube Engine eliminado. Motor exclusivo HTMLAudioElement + R2. 3 tabs definitivos.
- **S54:** D1 schema (16 tablas) + Workers init + Wrangler config.
- **S55-S57:** Worker API (18→22 endpoints) + JWT auth + FileUploadService + StatsEngine.
- **S58:** 12 bugs corregidos. Capsules fetchea Worker API real. StatsEngine wired.
- **S59:** JWT frontend wiring. AddEntryForm con subida real de fotos. Placeholders eliminados.
- **S60:** Fix imports MusicLab (Layout → tokens).
- **S61:** jwtToken threading: App → Vault → VaultGallery + MusicLab.
- **S62:** Worker CRUD entries: 5 endpoints con tags+files, validación 404.
- **S63:** Worker CRUD eras (5 endpoints) + files GET.
- **S64:** VaultContext → Worker API: carga híbrida Drive+Worker para entries/eras/tracks.

## Cambios S115-S132 (consolidación D1 + escucha compartida + design system)

### S115 — Worker API como source of truth única
- `_loadDriveComplement()` eliminado: Drive JSON ya no es fuente secundaria. D1 es SOLE source of truth desde S115-D5.
- `patchDb()` queda local-only (no escribe a Drive). Solo mutaciones D1 vía Worker.
- `WorkerClient` singleton: token JWT inyectado una vez vía `workerClient.setToken()`, omitido en cada `workerClient.get()` / `post()` / `patch()` / `del()`.
- Polling drops pasa de cada-30s-pull a presencia persistente (ver S132 sync.js).

### S130-B — VaultContext precisión
- `_buildDbFromWorker`: añade `/api/files` en fetch paralelo, mapea `from_user→from`/`to_user→to` para compatibilidad con componentes existentes.
- `_refreshWorkerData` ahora también consulta `/api/config` → `app_config.adventures_start_date` real (antes hardcoded a 500 días).
- `AdventureCounter` (Vault.jsx) lee fecha real desde db. Era ~500d morto → fecha real configurable en `app_config`.

### S131 — Cimientos (Fase 0)
- **Design System:** nuevo módulo `src/core/ui/` con `Button`, `Card`, `Skeletal`, pendiente migración a `Input`. **`Button` ya consumido** por `Vault.jsx` (Botón `CREAR ERA`) y otros CTAs planos. **`Card`** y **`Skeleton`** listos pero aún no migrados como reemplazo. **`Input`** existe pero `AddEntryForm.jsx` / `AddTrackForm.jsx` aún usan inputs inline (migración pendiente en próximo pliego).
- **PRECACHE:** `public/sw.js` con `install` handler real (antes comentado). `vite.config.js` → plugin `swAssetManifest` que genera `public/sw-assets.json` con hash de los 22 assets críticos. PWA instalable con offline fallback.
- **Safe areas:** `env(safe-area-inset-*)` en StatusBar (top), BottomNav (bottom), MiniPlayer (bottom). Android edge-to-edge respetado.
- **VAULT MAP Sub-fases 2-4:** `VaultGallery.jsx` ahora con MapView real (react-leaflet + react-leaflet-cluster + CartoDB Dark tiles). `JourneyPolylines` animados entre entries misma Era. Dual-range date slider temporal. `GeocoderService` con Photon API + Nominatim fallback. `LocationSearch` component con dropdown + manual override. `AddEntryForm` con location fields.
- **Botones gratuitos sin min-h:** corregidos ≥44 elementos en layout shell + reproductor.

### S132 — Escucha Compartida (Fase C, SC1-SC14)
- **ToastProvider unificado:** NUEVO `src/core/ToastContext.jsx` con `useToast()` hook + `toast()` API. Consolida **5 implementaciones dispersas** de toast en `Vault.jsx` + `TagManager.jsx` + `Capsules.jsx` + `Timeline.jsx` + `TimeCapsules.jsx`. Tipos: `info`/`error` + acciones (`OK` + dismiss). Render único en `Layout.jsx` (consumidor + renderer, no listado entre los 5 anteriores).
- **Corazón al header del reproductor:** `WinampPlayer.jsx` — `♡` idle / `♥!` partner bocadillo / `♥ HOST` sesión activa. 3 estados visuales con animación. Auto-join vía `pending_session_id` en presence.
- **Auto-join escucha compartida:** `PlayerContext.checkPresence()` polling de `/api/sync?action=presence` cada 5s. Detecta `pending_session_id` y une sin clicks.
- **Posición 1s + drift correction:** broadcast de posición cada 1s, drift correction >2s. Sin periodic position sync (legacy S132h removido).
- **Queue compartida bidireccional:** `PlayerContext` + `MusicLab.jsx` + `sync.js` añade/quita con atribución `_added_by` + `Edu`/`David` badges. Persistente: `queue_json` en `shared_sessions` y merge en `localQueue` tras DELETE.
- **Vibe SC3:** `track_vibe` incluido en payload de position sync. Cliente deriva color del partner.
- **Reconnect SC8:** toast sessionId con botones RESINCRONIZAR/MANTENER.
- **Heartbeats visibles:** broadcaster refresca `presence_{userId}` cada 30s; cliente filtra stale (>5min).

### Nuevos archivos desde S64

- `src/core/ToastContext.jsx` — Provider + hook unificado
- `src/core/ui/Button.jsx` — botón reutilizable design system
- `src/core/ui/Card.jsx` — glassmorphism card configurable
- `src/core/ui/Input.jsx` — input/textArea con label, error, accent
- `src/core/ui/Skeleton.jsx` — loaders por sección (Block, MusicLab, Capsules, VaultGallery)
- `src/core/ui/index.js` — barrel export design system
- `src/vault/GeocoderService.js` — Photon + Nominatim fallback
- `src/vault/LocationSearch.jsx` — debounced search + dropdown
- `src/vault/EntryLightbox.jsx` — lightbox unificado (S146/S148: portal+swipe+pinch, adoptado por los 6 modos vía `onOpenLightbox`)
- `public/sw-assets.json` — generado por swAssetManifest plugin
- `workers/routes/config.js` — GET /api/config (app_config table)
- `workers/utils/r2-sign.js` — helper HMAC-SHA256 para firmar lecturas R2 sensibles (S148 FASE D)

> S148: `DEMO_TRACKS`/`DEMO_ERAS`/`DEMO_ENTRIES_GEO` eliminados — ya no hay fallbacks hardcoded. Estado vacío honesto cuando no hay datos reales.

### Nuevas tablas D1 desde S64

- `shared_sessions` — table para escucha compartida (S132). Campos: id, host_user_id, guest_user_id, active_track_id, position, is_playing, last_action, last_action_by, queue_json, created_at, updated_at.
- `presence_{user}` — virtual, almacenado en `app_config` table (JSON blob con track_id, track_title, track_vibe, updated_at).
