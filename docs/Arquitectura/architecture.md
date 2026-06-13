---
describe: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx
sincronizado_con: S64 — VaultContext → Worker API (carga híbrida)
stale_si_pliego_toca: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx
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
Archivos: `src/vault/Vault.jsx`, `src/vault/VaultGallery.jsx`, `src/vault/AddEntryForm.jsx`

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
Tabla `events` en D1 — append-only. Todos los módulos emiten eventos vía `StatsEngine.js`.
Wired en S58-S59: `trackPlay/trackPause/trackSkip` desde PlayerContext, `entryCreated` desde Vault, `dropSent` desde useMusicActions.
Archivos: `src/core/StatsEngine.js`

### FileUploadService
Subida unificada a R2 con pre-signed keys. Consumido por MusicLab (MP3) y VAULT (fotos, vídeos, docs).
Token JWT inyectado vía `setUploadToken()` desde VaultContext.
Archivos: `src/core/FileUploadService.js`

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
