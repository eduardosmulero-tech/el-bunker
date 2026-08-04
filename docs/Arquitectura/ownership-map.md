---
describe: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx, Layout.jsx, ToastContext.jsx, GoogleAuthService.js, GoogleDriveService.js
sincronizado_con: G3-1 — D1/R2 source of truth, Google OAuth only
stale_si_pliego_toca: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Layout.jsx, ToastContext.jsx, GoogleAuthService.js, GoogleDriveService.js, workers/routes/sync.js
---

# Ownership Map (post-S64)

## Dueños del dato (OWNERS)

| Dato | Dueño | Persistencia |
|---|---|---|
| eras[] | VAULT (Vault.jsx) | Worker API → D1 `eras` table ✅ |
| entries[] | VAULT (Vault.jsx) | Worker API → D1 `entries` table ✅ |
| tracks[] | MUSIC LAB (MusicLab.jsx) | Worker API → D1 `tracks` table ✅ |
| playlists[] | MUSIC LAB (PlaylistManager.jsx) | Worker API → D1 `playlists` + `playlist_tracks` ✅ (S130 migración completada) |
| drops[] | MUSIC LAB (DropsManager.jsx) | Worker API → D1 `drops` ✅ (S111) |
| tags (vibe) | MUSIC LAB (TagManager.jsx) | Worker API → D1 `tags` (namespace: music) ✅ (S66) |
| tags (contexto) | VAULT (AddEntryForm.jsx) | Worker API → D1 `entry_tags` junction ✅ |
| queue | MUSIC LAB (PlayerContext.jsx) | Worker API → D1 `queue_items` ✅ |
| time_capsules | CAPSULES (TimeCapsules.jsx) | Worker API → D1 `time_capsules` + `capsule_items` ✅ |
| events | STATS ENGINE (StatsEngine.js) | D1 `events` table (append-only) ✅ |
| adventures_start_date | VAULT (VaultContext → /api/config) | D1 `app_config` table ✅ (S130-B) |
| shared_sessions | MUSIC LAB + Escucha Compartida (PlayerContext sync.js) | D1 `shared_sessions` table (S132) ✅ |
| presence_{user} | MUSIC LAB (PlayerContext heartbeats) | D1 `app_config` table (presence_* keys) ✅ (S132) |
| toasts[] | UI Shell (Layout.jsx via ToastContext) | React state en `ToastContext` (transient) ✅ (S132) |
| libraries[] | VAULT (VaultContext) | Estado local de compatibilidad; no hay persistencia Drive autorizada |
| files (R2) | FileUploadService | R2 bucket + D1 `files` table ✅ |
| jwtToken | VaultContext (_fetchJwt) | **sessionStorage** (`bunker_jwt`) + Worker API (S116) |
| Google auth token | GoogleAuthService | Memoria/localStorage de token OAuth; solo Google Identity Services, nunca Drive |

## Clientes (CONSUMERS, no owners)

| Módulo | Consume de |
|---|---|
| TIMELINE | `events` table vía Worker API → feed visual |
| RECAP | `events` table vía Worker API → resúmenes agregados |
| SMOKE SESSION | PlayerContext (masterVolume) |
| TIME CAPSULES | Worker API (`/api/time_capsules`) |
| VAULT GALLERY | `entries` vía db state (Worker API) + `eras` para filtros |
| WINAMP PLAYER | PlayerContext (activeTrack, isPlaying, masterVolume) |
| LAYOUT | PlayerContext (trackVibe → `--vibe-accent` en `:root`) |
| ADD ENTRY FORM | FileUploadService (uploadFile) + VaultContext (jwtToken) |

## Servicios compartidos (SHARED)

| Servicio | Consumido por | Token |
|---|---|---|
| FileUploadService | MusicLab (MP3) + VAULT (fotos, vídeos, docs) | `setUploadToken(jwt)` |
| StatsEngine (emitter) | PlayerContext + Vault + useMusicActions + SmokeSession | `setStatsToken(jwt)` |
| StatsEngine (aggregator) | Timeline + RECAP (vía Worker API) | JWT en header |
| **ToastContext (NEW S132)** | Layout (renders unified toasts) + 7 consumidores (Vault/MusicLab/Tags/Capsules/Timeline/TimeCapsules/Smoke) | `useToast()` hook |
| Sync service (`workers/routes/sync.js`) | PlayerContext (presence + session sync) | JWT auth via Worker API |
| TagManager UI | MusicLab (vibe tags) + VAULT (context tags) | Distintos namespaces |
| Design System (`src/core/ui/*`) | Layout + Vault (Button en +ERA) + cualquier page | import directo |
| ColorPicker (`src/core/ColorPicker.jsx`) | TagManager + VAULT (Era color) | import directo |
| VaultContext._buildDbFromWorker | Boot + refreshDb | jwtToken de sessionStorage |
| WorkerClient (`src/core/WorkerClient.js`) | Todos los módulos que llaman D1 API | singleton con `setToken(jwt)` |

## Flujo de ownership en boot (G3-1, S116 + S132)

1. VaultProvider arranca → gapi + GIS init → `onAuthChange` listeners.
2. Si usuario ya autenticado (restaurado): `_fetchUserAndDb(tokenAcceso)`.
3. `_fetchGoogleProfile(token)` → oauth2 userinfo API → whitelist check.
4. Si NO en whitelist → `signOut()` + `setBootPhase(UNAUTHORIZED)` (nunca había sido específico).
5. Si en whitelist → `_fetchJwt(email, googleToken)` → `POST /api/auth/login` → JWT → `sessionStorage.setItem("bunker_jwt", token)` + `workerClient.setToken(token)` + `setUploadToken(token)` + `setStatsToken(token)`.
6. `_buildDbFromWorker(jwt)` → 8 fetches paralelos (entries/eras/tracks/tags/playlists/drops/files + /api/config) → setDb.
7. Heartbeat scheduler setea `last_heartbeat_check` cada 20 min (local-only).
8. **Presence broadcast (S132):** si PlayerProvider montado → heartbeat a `/api/sync?action=heartbeat` cada 30s.
9. PlayerContext consume `db.music_lab.tracks` inicial → listo para play.
10. CAPSULES consume `events` y `capsules` directamente de Worker API con `workerClient.hasToken()` check.
11. Layout renderiza → `PresenceIndicator` aparece si partner activo → `MiniPlayer` overlay si active track.
12. **Presence polling (S132):** PlayerContext hace `GET /api/sync?action=presence` cada 5s → actualiza `partnerListening`, `partnerTrack`, `partnerTrackVibe` → reactiva corazón en header + auto-join si `pending_session_id`.
