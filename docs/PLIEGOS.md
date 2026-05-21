# PLIEGOS.md — el_bunker
> Registro secuencial. Número no se resetea entre sesiones.
> **PRÓXIMO: PLIEGO-065**

---

## PLANTILLA

PLIEGO-[NNN] — [nombre]
Fecha: YYYY-MM-DD
Modelo: [qwen3-8b-nothink | qwen3-8b-think | qwen3-14b-nothink | qwen3-14b-think]
Estado: [pendiente | aplicado | descartado]
ARCHIVO: [ruta desde raíz]
CAMBIO: [descripción técnica]
CRITERIO DE ÉXITO: [cómo verificar]
RESULTADO: [rellenar tras aplicar]


---

## HISTORIAL

| # | Archivo | Cambio | Commit |
|---|---|---|---|
| 001 | GoogleDriveService.js | _findDatabaseFile → carpeta compartida | — |
| 002 | GoogleDriveService.js | _createDatabaseFile → carpeta compartida | — |
| 003 | GoogleDriveService.js | supportsAllDrives en _updateDatabaseFile | c72bff4 |
| 004 | App.jsx | Cablear onMarkDropSeen | c72bff4 |
| 005 | Vault.jsx | Ocultar bloque Cápsulas demo | f8b300c |
| 006 | Vault.jsx | Umbral HeartbeatWidget 20→18 meses | f8b300c |
| 007 | Vault.jsx | Eliminar CornerBrackets | 26f2690 |
| 008 | MusicLab.jsx | Toast feedback al añadir track | f8b300c |
| 009 | GoogleDriveService.js | Eliminar drive.appdata de SCOPES | 3935240 |
| 010 | Vault.jsx | Exportación JSON admin en footer | 6237d1a |
| tokens | tokens.js | Crear archivo design tokens | 26f2690 |
| SW | sw.js + vite.config.js | Versionado dinámico __BUNKER_SW_VERSION__ | b899017 |
| QUEUE-A | GoogleDriveService.js | Infraestructura colas queue_[userId].json | 6237d1a |
| QUEUE-B | MusicLab.jsx + App.jsx | UI cola: carga, persistencia, indicador sync | 327ffb1 |
| PLAYLIST-A | GoogleDriveService.js | Schema 3.2.0 + CRUD playlists | c84e028 |
| PLAYLIST-B | MusicLab.jsx | UI playlists: long press, menú contextual, tab LISTS | aabc838 |
| MEDIASESSION-1 | MusicLab.jsx | MediaSession API: metadatos lockscreen | b76801c |
| MEDIASESSION-2 | MusicLab.jsx | WakeLock API + resiliencia Android | 9c8a331 |
| 014 | MusicLab.jsx | Fix toast useState no declarado | ad968de |
| 015 | GoogleDriveService.js | Token refresh automático en 401 | 1a8c83b |
| 015b | sw.js | Bypass YouTube/ytimg/googlevideo | dc29e82 |
| 015c | GoogleDriveService.js | uploadMusicFile + schema 3.3.0 | 588f055 |
| 016 | GoogleDriveService.js | Scope drive.file → drive | b575177 |
| 016b | GoogleDriveService.js | getStreamUrl(fileId) para stream MP3 | 5434d2b |
| 016c | MusicLab.jsx | Player youtube/drive: iframe YT + audio nativo | cc849d9 |
| 017b | MusicLab.jsx | Play/pause YouTube via postMessage | 71c3567 |
| 018 | MusicLab.jsx | Modal eliminar track con lista inline | 08fe0ef |
| 019 | MusicLab.jsx | Modal editar track con formulario precargado | 53f2928 |
| 020 | VaultContext.jsx | Fix drops to/from + filtro d.to===userId | 140bce9 |
| 021 | MusicLab.jsx | Fix stale closures loop/shuffle/skip | e792889 |
| 022 | GoogleDriveService.js | OAuth2 persistencia localStorage | 200a1a3 |
| 023 | MusicLab.jsx | Fix modales mutuamente excluyentes | a484f2f |
| 024 | App.jsx | onEditTrack + onDeleteTrack persisten en Drive | ee57b41 |
| 025 | Layout.jsx + index.css | user-select:none + overscroll:none + botón ↺ | f94bb0a |
| 026 | Layout.jsx | Botón EXIT en StatusBar | 3eb21c9 |
| 027 | App.jsx | Conectar logout al botón EXIT | 78e4f12 |
| 028/028b | MusicLab.jsx | videoId obligatorio en constructor YT.Player | f6af422 |
| 029 | MusicLab.jsx | Eliminar CornerBrackets | c27438a |
| 030 | GoogleDriveService.js | Schema 3.4.0 + favorited/favorited_by en drops | — |
| 031 | MusicLab.jsx | Cola real estilo Spotify | — |
| 032 | CLAUDE.md | Reglas arranque de sesión | — |
| 033 | MusicLab.jsx | Play inline en drop + marcar drops vistos | aplicado |
| 033b | MusicLab.jsx | Fix duplicado handleRemoveFromQueue | aplicado |
| 034 | MusicLab.jsx | Fix TDZ: mover skip antes de initYTPlayer | f598adb |
| 035 | src/ (6 archivos) | Extracción dominio estricto a archivos planos | 51d4ddb |
| 036 | MusicLab.jsx | Reescribir MusicLab.jsx (~720 líneas orquestación) | 51d4ddb |
| 037 | WinampPlayer.jsx + MusicLab.jsx | Cablear autoPlay + skip lee cola | 09cb608 |
| 038 | AudioVisualizer.jsx | Fix canvas negro: guardia dimensiones | 09cb608 |
| 039 | TrackCard.jsx | Color vibe en cards inactivas opacity 0.55 | 09cb608 |
| 040 | AddTrackForm.jsx | Botón submit condicional GUARDAR/ADD | 09cb608 |
| 041 | WinampPlayer.jsx | autoPlaySignal counter + MediaSession YT | b02ad44 |
| 042 | MusicLab.jsx | autoPlaySignal + BUG-041 queue crash fix | b02ad44 |
| 043 | AudioVisualizer.jsx | Canvas retry BUG-008 | 254bcb3 |
| 044 | AddTrackForm.jsx | Fix BUG-024-PERSIST: no regenerar uuid al editar | — |
| 045 | AddTrackForm.jsx | Validación URL playlist YouTube | — |
| 045b | DropsManager.jsx | Drop polling global ERROR-33 | 254bcb3 |
| 046 | PlayerContext.jsx | Nuevo — estado global reproducción (ADR-004) | s18 |
| 047 | App.jsx | Wrap AppCore con PlayerProvider | s18 |
| 048 | MusicLab.jsx | Consume PlayerContext · UI-01 · UI-02 · BUG-035 | s18 |
| 049 | WinampPlayer.jsx | Consume PlayerContext · BUG-NUEVO-06 seek visual | s18 |
| 050 | DropsManager.jsx | BUG-054 · BUG-059 · separación pendientes/guardados | s18 |
| 051 | App.jsx | ERROR-33: drop alert global | s19 |
| 055 | PlayerContext.jsx | activeVibe + vibe-accent + masterVolume | s19 |
| 056 | MusicLab.jsx | Consume activeVibe + drop compose modal | s19 |
| 057 | DropsManager.jsx | minute_mark slider en drop | s19 |
| 058 | WinampPlayer.jsx | masterVolume sync | s19 |
| 059 | AddTrackForm.jsx | Selector YouTube/Drive + validación + español | s19 |
| 060 | PlaylistManager.jsx | FEAT-LISTS completo (absorbe 052) | s19 |
| 061 | PlayerContext.jsx | Fix skip() + cola fuente verdad | aplicado |
| 062 | AudioVisualizer.jsx | Fix canvas negro mobile | aplicado |
| 063 | WinampPlayer.jsx + PlayerContext.jsx | Fix BUG-CRÍTICO-04: <audio> a PlayerProvider | aplicado |
| 064 | MusicLab.jsx | Fix BUG-PLAYLIST-INTEGRATION + BUG-DUPLICATE-KEYS + BUG-DROPS-VACIO | 9df252f |

---

## PENDIENTES

### Bloque C — Smoke y reorganización (post-estabilización Bloque B)

**PLIEGO-054** — `SmokeSession.jsx`
BUG-NUEVO-04: volumen master estático. Leer `masterVolume` / `setMasterVolume` de PlayerContext en lugar del estado local. El fadeout actúa sobre el reproductor real.
Modelo: qwen3-8b-think.

**PLIEGO-053** — reorganización `src/` en carpetas
Mover archivos a subcarpetas (core/, layout/, vault/, musiclab/, smoke/). Actualizar todos los imports. Cero cambios de lógica.
Modelo: qwen3-8b-nothink.
Ver spec en DECISIONES.md § Estructura de carpetas.

---

### Sin urgencia

**PLIEGO-018-STRINGS** — `manifest.json`
Encoding roto en manifest.json. (Los textos de MusicLab ya se absorben en PLIEGO-056.)
Modelo: qwen3-8b-nothink.