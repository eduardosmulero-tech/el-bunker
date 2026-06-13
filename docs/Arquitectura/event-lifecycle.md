---
describe: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx
sincronizado_con: S49 (Refundación del producto)
stale_si_pliego_toca: PlayerContext.jsx, WinampPlayer.jsx
---

# Event Lifecycle

## App Startup (post-S49)
1. BOOT.INIT_SERVICES: Carga gapi, validación OAuth2.
2. BOOT.INIT_DB: Fetch `the_vault_database.json` (transición) → Workers API (futuro).
3. BOOT.READY: Hidratación completada, router expone 3 tabs.

## Playback Lifecycle
- Play: `playTrack()` → `isPlaying(true)`, WakeLock, MediaSession update.
- Pause: `setIsPlaying(false)`, WakeLock release.
- Stop: loopMode "off" + fin de lista → `setIsPlaying(false)`, fade a UI base.
- Seek: `audioRef.current.currentTime = X` (solo audio nativo).

## Queue Lifecycle
- Add Track: mutación local → persistencia asíncrona Drive/D1.
- Remove Track: soft delete si es track activo (termina y luego se elimina).
- Shuffle: mutación visual, no física. Botón anterior → historial real.
- Loop: triestado (`off`/`list`/`track`). `loopModeRef` para callbacks.

## Stats Events (NUEVO S49)
Cada acción emite a tabla `events`:
- `playback_start` / `playback_end`
- `entry_create` / `entry_update` / `entry_delete`
- `drop_sent` / `drop_received`
- `smoke_session_start` / `smoke_session_end`
- `capsule_created` / `capsule_unlocked`
- `era_created`

## VAULT Lifecycle (NUEVO S49)
- Crear entrada → evento `entry_create` → Timeline + RECAP.
- Subir archivo → FileUploadService → pre-signed PUT a R2 → referencia en entry.
- Ver galería → 6 modos de navegación. Capa ambiental reactiva.

## CAPSULES Lifecycle (NUEVO S49)
- Timeline: consume `events` table en tiempo real.
- Smoke Session: play → timer → fade-out (últimos 2 min) → evento `smoke_session_end`.
- Time Capsule: sellar → bloqueo por fecha → desbloqueo con notificación.
- RECAP: generación automática semanal/mensual/anual desde `events`.
