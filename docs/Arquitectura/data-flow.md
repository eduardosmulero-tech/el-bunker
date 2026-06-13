---
describe: PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx, WinampPlayer.jsx
sincronizado_con: S49 (Refundación del producto)
stale_si_pliego_toca: PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx
---

# Data Flow

## Flujo principal de reproducción (post-S49)
1. Usuario selecciona track → `playTrack(track)` en `PlayerContext`.
2. Contexto actualiza `activeTrack`, dispara `autoPlaySignal`.
3. `audioRef.current.src = r2_signed_url` (pre-signed URL desde Workers/R2).
4. Solo MusicLab instancia `<audio>`. Sin iframes ni APIs externas.

## Flujo Queue → Playback
- `addToQueue(track)` → mutación local → persistencia en `queue_[userId].json` (Drive transición) o `queue_items` (D1 futuro).
- `onEnded` → `skip(1)` calcula próximo track considerando `shuffle`, `loopMode`, `_manual`.
- `setActiveTrack(next)` → re-render del reproductor.

## Flujo Persistencia (transición Drive→D1)
### Actual (Drive JSON)
- `patchDb(updater)` → actualización optimista local → `updateData()` → Drive.
- `loadDatabase()` → descarga JSON → migración → hidratación de `db` state.
### Futuro (D1 + Workers)
- Workers API → D1 SQL queries → JSON responses.
- `events` table: append-only, alimenta Timeline y RECAP.
- R2 pre-signed URLs: PUT para uploads, GET para streams.

## Flujo Stats Engine
- Cada acción significativa emite evento → `POST /api/events` → tabla `events` en D1.
- Agregador consulta `events` para: Timeline feed, RECAPs, stats de escucha, rachas.
- Timeline consume el agregador para mostrar el feed unificado.

## Flujo VAULT (galería)
- Fotos/vídeos → R2 (pre-signed PUT) → referencia en `entries`.
- Galería 6 modos consulta `entries` filtradas por `era_id` y `category`.
- Capa ambiental: paleta reactiva por Era + AnalyserNode para pulso acústico.

## Flujo CAPSULES
- Timeline: consume `events` table → feed visual.
- Smoke Session: controla `masterVolume` vía PlayerContext.
- Time Capsules: consulta `time_capsules` + `capsule_items`.
- RECAP: agrega `events` por período (semana/mes/año).
