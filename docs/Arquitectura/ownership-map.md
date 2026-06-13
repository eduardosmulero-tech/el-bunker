---
describe: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, PlaylistManager.jsx
sincronizado_con: S49 (Refundación del producto)
stale_si_pliego_toca: PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx
---

# Ownership Map (post-S49)

## Dueños del dato (OWNERS)

| Dato | Dueño | Persistencia |
|---|---|---|
| eras[] | VAULT (Vault.jsx) | Drive JSON → D1 `eras` table |
| entries[] | VAULT (Vault.jsx) | Drive JSON → D1 `entries` table |
| tracks[] | MUSIC LAB (MusicLab.jsx) | Drive JSON → D1 `tracks` table |
| playlists[] | MUSIC LAB (PlaylistManager.jsx) | Drive JSON → D1 `playlists` table |
| drops[] | MUSIC LAB (DropsManager.jsx) | Drive JSON → D1 `drops` table |
| tags (vibe) | MUSIC LAB (TagManager.jsx) | `music_lab.tags[]` → D1 `tags` (namespace: music) |
| tags (contexto) | VAULT (TagManager.jsx) | `vault.tags[]` → D1 `tags` (namespace: vault) |
| queue | MUSIC LAB (PlayerContext.jsx) | `queue_[userId].json` → D1 `queue_items` |
| time_capsules | CAPSULES (TimeCapsules.jsx) | Drive JSON → D1 `time_capsules` |
| events | STATS ENGINE (StatsEngine.js) | D1 `events` table (append-only) |

## Clientes (CONSUMERS, no owners)

| Módulo | Consume de |
|---|---|
| TIMELINE | `events` table → feed visual |
| RECAP | `events` table → resúmenes agregados |
| SMOKE SESSION | PlayerContext (volumen) + `events` (historial) |
| TIME CAPSULES | VAULT (entries) + MusicLab (playlists) |
| GALERÍA | VAULT (entries con category=photo/video) |
| WINAMP PLAYER | PlayerContext (track activo, volumen) |
| LAYOUT | PlayerContext (trackVibe → --vibe-accent) |

## Servicios compartidos (SHARED)

| Servicio | Consumido por |
|---|---|
| FileUploadService | MusicLab (MP3) + VAULT (fotos, vídeos, docs, audio) |
| TagManager UI | MusicLab (vibe tags) + VAULT (context tags) — distintos namespaces |
| StatsEngine (emitter) | Todos los módulos → emiten eventos |
| StatsEngine (aggregator) | Timeline + RECAP → consultan |
