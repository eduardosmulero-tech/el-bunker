# PLIEGOS.md — el_bunker
> Registro secuencial. Número no se resetea entre sesiones.
> **PRÓXIMO: PLIEGO-072**

---

## PLANTILLA

```
PLIEGO-[NNN] — [nombre]
Fecha: YYYY-MM-DD
Modelo: [qwen3-8b-nothink | qwen3-8b-think | qwen3-14b-nothink | qwen3-14b-think]
Estado: [pendiente | aplicado | descartado]
ARCHIVOS: [rutas desde raíz — uno por Pliego salvo excepciones documentadas]
CAMBIO: [descripción técnica]
CRITERIO DE ÉXITO: [cómo verificar]
RESULTADO: [rellenar tras aplicar]
```

---

## PENDIENTES

### PLIEGO-072 — `src/musiclab/MusicLab.jsx` + `src/musiclab/AddTrackForm.jsx` + `src/musiclab/PlaylistManager.jsx`
**Bugs:** BUG-NUEVO-14, BUG-NUEVO-15, BUG-NUEVO-23
- Editar track: ocultar lista de tracks mientras el modal de edición está abierto.
- Crear playlist: botón explícito visible + Enter sin confirmación no debe crear.
- Eliminar playlist: quitar restricción de owner (app privada de pareja) + fix persistencia en DB.
**Modelo:** qwen3-14b-nothink

---

### PLIEGO-073 — `src/musiclab/WinampPlayer.jsx` + `src/core/PlayerContext.jsx`
**Bugs:** BUG-NUEVO-18, BUG-NUEVO-19, BUG-NUEVO-22
- Slider volumen master: sincronizar con `audioRef.current.volume` para tracks Drive.
- `activeVibe`: propagar acento de color a toda la app vía CSS custom property en `<body>`, no solo al reproductor.
- Botones físicos de volumen Android: **incertidumbre técnica** — la API MediaSession no expone un evento `volumechange`. Investigar si `navigator.mediaSession` o el contexto TWA/WebView permiten interceptar los botones físicos antes de generar este bloque del Pliego. Si no hay API viable, documentar como limitación de plataforma.
**Modelo:** qwen3-14b-nothink

---

## HISTORIAL

| # | Archivo/s | Cambio | Commit |
|---|---|---|---|
| 001 | GoogleDriveService.js | `_findDatabaseFile` → carpeta compartida | — |
| 002 | GoogleDriveService.js | `_createDatabaseFile` → carpeta compartida | — |
| 003 | GoogleDriveService.js | `supportsAllDrives` en `_updateDatabaseFile` | c72bff4 |
| 004 | App.jsx | Cablear `onMarkDropSeen` | c72bff4 |
| 005 | Vault.jsx | Ocultar bloque Cápsulas demo | f8b300c |
| 006 | Vault.jsx | Umbral HeartbeatWidget 20→18 meses | f8b300c |
| 007 | Vault.jsx | Eliminar CornerBrackets | 26f2690 |
| 008 | MusicLab.jsx | Toast feedback al añadir track | f8b300c |
| 009 | GoogleDriveService.js | Eliminar drive.appdata de SCOPES | 3935240 |
| 010 | Vault.jsx | Exportación JSON admin en footer | 6237d1a |
| tokens | tokens.js | Crear archivo design tokens | 26f2690 |
| SW | sw.js + vite.config.js | Versionado dinámico `__BUNKER_SW_VERSION__` | b899017 |
| QUEUE-A | GoogleDriveService.js | Infraestructura colas `queue_[userId].json` | 6237d1a |
| QUEUE-B | MusicLab.jsx + App.jsx | UI cola: carga, persistencia, indicador sync | 327ffb1 |
| PLAYLIST-A | GoogleDriveService.js | Schema 3.2.0 + CRUD playlists | c84e028 |
| PLAYLIST-B | MusicLab.jsx | UI playlists: long press, menú contextual, tab LISTS | aabc838 |
| MEDIASESSION-1 | MusicLab.jsx | MediaSession API: metadatos lockscreen | b76801c |
| MEDIASESSION-2 | MusicLab.jsx | WakeLock API + resiliencia Android | 9c8a331 |
| 014 | MusicLab.jsx | Fix toast useState no declarado | ad968de |
| 015 | GoogleDriveService.js | Token refresh automático en 401 | 1a8c83b |
| 015b | sw.js | Bypass YouTube/ytimg/googlevideo | dc29e82 |
| 015c | GoogleDriveService.js | `uploadMusicFile` + schema 3.3.0 | 588f055 |
| 016 | GoogleDriveService.js | Scope `drive.file` → `drive` | b575177 |
| 016b | GoogleDriveService.js | `getStreamUrl(fileId)` para stream MP3 | 5434d2b |
| 016c | MusicLab.jsx | Player youtube/drive: iframe YT + audio nativo | cc849d9 |
| 017b | MusicLab.jsx | Play/pause YouTube via postMessage | 71c3567 |
| 018 | MusicLab.jsx | Modal eliminar track con lista inline | 08fe0ef |
| 019 | MusicLab.jsx | Modal editar track con formulario precargado | 53f2928 |
| 020 | VaultContext.jsx | Fix drops to/from + filtro `d.to===userId` | 140bce9 |
| 021 | MusicLab.jsx | Fix stale closures loop/shuffle/skip | e792889 |
| 022 | GoogleDriveService.js | OAuth2 persistencia localStorage | 200a1a3 |
| 023 | MusicLab.jsx | Fix modales mutuamente excluyentes | a484f2f |
| 024 | App.jsx | `onEditTrack` + `onDeleteTrack` persisten en Drive | ee57b41 |
| 025 | Layout.jsx + index.css | `user-select:none` + `overscroll:none` + botón ↺ | f94bb0a |
| 026 | Layout.jsx | Botón EXIT en StatusBar | 3eb21c9 |
| 027 | App.jsx | Conectar logout al botón EXIT | 78e4f12 |
| 028/028b | MusicLab.jsx | videoId obligatorio en constructor `YT.Player` | f6af422 |
| 029 | MusicLab.jsx | Eliminar CornerBrackets | c27438a |
| 030 | GoogleDriveService.js | Schema 3.4.0 + `favorited`/`favorited_by` en drops | — |
| 031 | MusicLab.jsx | Cola real estilo Spotify | — |
| 032 | CLAUDE.md | Reglas arranque de sesión | — |
| 033 | MusicLab.jsx | Play inline en drop + marcar drops vistos | aplicado |
| 033b | MusicLab.jsx | Fix duplicado `handleRemoveFromQueue` | aplicado |
| 034 | MusicLab.jsx | Fix TDZ: mover skip antes de `initYTPlayer` | f598adb |
| 035 | src/ (6 archivos) | Extracción dominio estricto a archivos planos | 51d4ddb |
| 036 | MusicLab.jsx | Reescribir MusicLab.jsx (~720 líneas orquestación) | 51d4ddb |
| 037 | WinampPlayer.jsx + MusicLab.jsx | Cablear autoPlay + skip lee cola | 09cb608 |
| 038 | AudioVisualizer.jsx | Fix canvas negro: guardia dimensiones | 09cb608 |
| 039 | TrackCard.jsx | Color vibe en cards inactivas opacity 0.55 | 09cb608 |
| 040 | AddTrackForm.jsx | Botón submit condicional GUARDAR/ADD | 09cb608 |
| 041 | WinampPlayer.jsx | `autoPlaySignal` counter + MediaSession YT | b02ad44 |
| 042 | MusicLab.jsx | `autoPlaySignal` + BUG-041 queue crash fix | b02ad44 |
| 043 | AudioVisualizer.jsx | Canvas retry BUG-008 | 254bcb3 |
| 044 | AddTrackForm.jsx | Fix BUG-024-PERSIST: no regenerar uuid al editar | — |
| 045 | AddTrackForm.jsx | Validación URL playlist YouTube | — |
| 045b | DropsManager.jsx | Drop polling global ERROR-33 | 254bcb3 |
| 046 | PlayerContext.jsx | Nuevo — estado global reproducción (ADR-004) | [S18] |
| 047 | App.jsx | Wrap AppCore con `<PlayerProvider>` | [S18] |
| 048 | MusicLab.jsx | Consume PlayerContext · UI-01 · UI-02 · BUG-035 | [S18] |
| 049 | WinampPlayer.jsx | Consume PlayerContext · BUG-NUEVO-06 seek visual (parcial) | [S18] |
| 050 | DropsManager.jsx | BUG-054 · BUG-059 · separación pendientes/guardados | [S18] |
| 051 | App.jsx | ERROR-33: drop alert global | [S19] |
| 053 | src/ (reorg) | Reorganización en carpetas core/layout/vault/musiclab/smoke | [S22] |
| 054 | SmokeSession.jsx | BUG-NUEVO-04: consumo masterVolume vía context | [S22] |
| 055 | PlayerContext.jsx | `activeVibe` + vibe-accent + `masterVolume` | [S19] |
| 056 | MusicLab.jsx | Consume `activeVibe` + drop compose modal | [S19] |
| 057 | DropsManager.jsx | `minute_mark` slider en drop | [S19] |
| 058 | WinampPlayer.jsx | `masterVolume` sync | [S19] |
| 059 | AddTrackForm.jsx | Selector YouTube/Drive + validación + español | [S19] |
| 060 | PlaylistManager.jsx | FEAT-LISTS completo (absorbe 052) | [S19] |
| 061 | PlayerContext.jsx | Fix `skip()` + cola fuente verdad | 9df252f |
| 062 | AudioVisualizer.jsx | Fix canvas negro mobile | 9df252f |
| 063 | WinampPlayer.jsx + PlayerContext.jsx | Fix BUG-CRÍTICO-04: `<audio>` a PlayerProvider | 9df252f |
| 064 | MusicLab.jsx | Fix BUG-PLAYLIST-INTEGRATION + BUG-DUPLICATE-KEYS + BUG-DROPS-VACIO | 9df252f |
| 018-STRINGS | manifest.json | Encoding UTF-8 sin BOM | [S22] |
| 065 | PlayerContext.jsx + WinampPlayer.jsx | Fix iframe YT persistente — mover a PlayerProvider | [S23] |
| 065b | PlayerContext.jsx | Fix TDZ skipRef — mover declaración tras `skip()` | [S23] |
| 065c | PlayerContext.jsx | Fix YT.Player — `loadVideoById` en vez de `destroy()` | [S23] |
| 065d | WinampPlayer.jsx | Fix `setYtReady` residual eliminado | [S23] |
| 065e | PlayerContext.jsx + WinampPlayer.jsx | Fix div YT imperativo fuera de React DOM | [S23] |
| 066 | PlayerContext.jsx | Eliminar polling/ytReady del contexto — progreso es UI local | [S24] |
| 066b | PlayerContext.jsx | Fix `setYtReady` residual en `onReady` tras refactor | [S24] |
| 067 | WinampPlayer.jsx | Polling YT local reactivo a `isPlaying` + fix dep `[]` Drive | [S24] |
| 068 | GoogleDriveService.js | Fix reauth automática en 403 para David | [S25] |
| 069 | PlayerContext.jsx + WinampPlayer.jsx | Loop triestado `"off"\|"list"\|"track"` + `loopModeRef` + `toggleLoopMode` + icono triestado | [S26] |
| 070 | PlayerContext.jsx + WinampPlayer.jsx | BUG-09 cola agotada+loopOFF para · BUG-10 mountedRef desync · BUG-11 toggle tap track activo · BUG-16 shuffle ignora cola · BUG-17 getStreamUrl Drive · BUG-19 vibeConf desde activeVibe · BUG-12 skipDir reiniciar <3s · BUG-13 scroll título condicional | [S26] |
| 071 | WinampPlayer.jsx | BUG-NUEVO-12 skip anterior invertido (currentTRef stale closure) · BUG-NUEVO-13 título siempre animado (requestAnimationFrame + width:100%) | [S27] |
