---
describe: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx
sincronizado_con: S64 — VaultContext → Worker API (carga híbrida)
stale_si_pliego_toca: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx
---

# Ownership Map (post-S64)

## Dueños del dato (OWNERS)

| Dato | Dueño | Persistencia |
|---|---|---|
| eras[] | VAULT (Vault.jsx) | Worker API → D1 `eras` table ✅ |
| entries[] | VAULT (Vault.jsx) | Worker API → D1 `entries` table ✅ |
| tracks[] | MUSIC LAB (MusicLab.jsx) | Worker API → D1 `tracks` table ✅ |
| playlists[] | MUSIC LAB (PlaylistManager.jsx) | Drive JSON → D1 `playlists` table (transición) |
| drops[] | MUSIC LAB (DropsManager.jsx) | Drive JSON → D1 `drops` table (transición) |
| tags (vibe) | MUSIC LAB (TagManager.jsx) | Drive JSON → D1 `tags` (namespace: music, transición) |
| tags (contexto) | VAULT (AddEntryForm.jsx) | Worker API → D1 `entry_tags` junction ✅ |
| queue | MUSIC LAB (PlayerContext.jsx) | Worker API → D1 `queue_items` ✅ |
| time_capsules | CAPSULES (TimeCapsules.jsx) | Worker API → D1 `time_capsules` ✅ |
| events | STATS ENGINE (StatsEngine.js) | D1 `events` table (append-only) ✅ |
| libraries[] | VAULT (VaultContext) | Drive JSON (sin migración planeada) |
| files (R2) | FileUploadService | R2 bucket + D1 `files` table ✅ |
| jwtToken | VaultContext (_fetchJwt) | localStorage (`bunker_jwt`) + Worker API |

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
| StatsEngine (emitter) | PlayerContext + Vault + useMusicActions | `setStatsToken(jwt)` |
| StatsEngine (aggregator) | Timeline + RECAP (vía Worker API) | JWT en header |
| TagManager UI | MusicLab (vibe tags) + VAULT (context tags) | Distintos namespaces |
| VaultContext._refreshWorkerData | Boot + refreshDb | jwtToken de estado |

## Flujo de ownership en boot (S64)

1. VaultContext inicia → Google OAuth2 → perfil → whitelist.
2. VaultContext obtiene JWT del Worker API → persiste en localStorage → inyecta en FileUploadService + StatsEngine.
3. VaultContext carga Drive JSON (libraries, playlists, drops, tags).
4. VaultContext carga Worker API (entries, eras, tracks) → mergea en db.
5. PlayerContext consume tracks[] desde db.music_lab.tracks.
6. CAPSULES consume events y capsules desde Worker API con jwtToken.
