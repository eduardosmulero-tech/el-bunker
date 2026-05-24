# event-lifecycle.md

# Event Lifecycle

## App Startup

1. `BOOT.INIT_SERVICES`: Carga asíncrona de gapi y validación de tokens.
2. `BOOT.INIT_DB`: Fetch de la base de datos `the_vault_database.json` verificando whitelist.
3. `BOOT.READY`: Hidratación completada, enrutador expone `AppCore`.

---

# Playback Lifecycle

## Play
Disparo por `playTrack()` -> setea `isPlaying(true)`. WinampPlayer arranca su polling loop. El WakeLock del navegador se solicita activamente.
## Pause
Setea `isPlaying(false)`. WinampPlayer destruye su polling local. El WakeLock se libera.
## Stop
En loopMode "off" y fin de la lista, el sistema forza `setIsPlaying(false)` y detiene los motores.
## Seek
(UI visual) `WinampPlayer` invoca `audioRef.current.currentTime = X` o `ytPlayerRef.current.seekTo(X)`.

---

# Queue Lifecycle

## Add Track
Mutación local inmediata a `localQueue`. Dispara efecto asíncrono hacia `saveQueue(userId)` de Google Drive.
## Remove Track
Filtro de array. Si el track eliminado era el activo, hace skip automático al siguiente.
## Shuffle
Mutación de estado visual `setShuffle`. Modifica la matemática dentro del callback `skip()` sin mutar físicamente el array original.
## Loop
Ciclo secuencial estricto via `toggleLoopMode`: "off" -> "list" -> "track". Se pasa por Ref (`loopModeRef`) para evitar stale closures en callbacks nativos de YouTube.

---

# YouTube Lifecycle

## Init
Efecto global en `PlayerProvider` crea `div#yt-player-div` imperativamente fuera de `<div id="root">`.
## Ready
Objeto `new window.YT.Player` se adhiere al ref y recibe `masterVolume`.
## State Change
Captura de constantes (PLAYING, PAUSED, ENDED) para sincronizar con el `setIsPlaying` de React y trigger del skip automático.
## Destroy
**Nunca.** El reproductor sobrevive cambios de pestaña por diseño. Recibe `loadVideoById` para reusarse.

---

# Problemas detectados

- Mutación de Drive (`patchDb`) durante la reproducción fluida puede causar tirones de framerate en UI.
- Si el polling de Drops global encuentra un drop, el aviso re-renderiza la app entera.
- Si falla la red durante un cambio de cola, el reproductor puede desincronizarse visualmente del estado de Drive.