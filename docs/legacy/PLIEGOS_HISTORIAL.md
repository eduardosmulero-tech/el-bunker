# PLIEGOS_HISTORIAL.md — el_bunker
> Append-only. Claude nunca lee este archivo en arranque.
> Al cerrar sesión: mover pliegos aplicados desde PLIEGOS.md aquí.

---

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
| 070 | PlayerContext.jsx + WinampPlayer.jsx | BUG-09/10/11/16/17/19/12/13 — fixes reproductor bloque S26 | [S26] |
| 071 | WinampPlayer.jsx | BUG-NUEVO-12 skip anterior invertido · BUG-NUEVO-13 título siempre animado | [S27] |
### PLIEGO-072a — `src/musiclab/MusicLab.jsx`
Fecha: 2026-05-27 · Modelo: qwen3-14b-nothink · Estado: aplicado · Sesión: S29
BUG-14: ocultar TrackCards durante showEdit · BUG-15: botón explícito + formulario inline en pestaña LISTS · BUG-23: reemplazar deletePlaylist por patchDb para persistencia en DB

### PLIEGO-072b — `src/musiclab/PlaylistManager.jsx`
Fecha: 2026-05-27 · Modelo: qwen3-14b-nothink · Estado: aplicado · Sesión: S29
BUG-15: guard onKeyDown en PlaylistNameInput para prevenir creación accidental con Enter

### PLIEGO-073 — `src/musiclab/WinampPlayer.jsx`
Fecha: 2026-05-27 · Modelo: qwen3-14b-nothink · Estado: aplicado · Sesión: S29
BUG-18: sync masterVolume → audioRef.current.volume antes de play() en autoPlaySignal · BUG-22: listener volumechange para botones físicos Android · guarda feedback loop en efecto [masterVolume]

## PLIEGO-081 — WinampPlayer.jsx: Lógica de skip
- **Fecha:** 2026-05-28
- **Estado:** Aplicado.

## PLIEGO-082 — WinampPlayer.jsx: Scroll de título y skipDir
- **Fecha:** 2026-05-28
- **Estado:** Aplicado.
- **Cambio:** Fix de ADR-009 y cálculo de `scrollWidth`.

## PLIEGO-083 — MusicLab.jsx: Paginación en DOM
- **Fecha:** 2026-05-28
- **Estado:** Aplicado (Parcial). Bloques 1 y 3 en producción.
### PLIEGO-088 — WinampPlayer.jsx
Fecha: 2026-05-28 · Modelo: qwen3-8b-think · Estado: aplicado · Sesión: S34
skipDir no estaba en deps de useEffect MediaSession — stale closure en previoustrack handler

### PLIEGO-089 — tools/pliego_apply.py
Fecha: 2026-05-28 · Modelo: qwen3-8b-nothink · Estado: aplicado · Sesión: S34
npm.cmd en Windows — subprocess.run(["npm"]) no encontraba npm tras reinicio

### PLIEGO-090 — src/layout/App.jsx
Fecha: 2026-05-28 · Modelo: qwen3-8b-think · Estado: aplicado · Sesión: S34
patchDb no se pasaba a MusicLab — handleDeletePlaylist lanzaba ReferenceError

### PLIEGO-091 — src/musiclab/MusicLab.jsx
Fecha: 2026-05-28 · Modelo: qwen3-8b-nothink · Estado: aplicado · Sesión: S34
patchDb añadido a firma de props de MusicLab
Fecha: 2026-05-28 · Modelo: qwen3-14b-nothink · Estado: aplicado · Sesión: S34
### PLIEGO-083 — src/musiclab/MusicLab.jsx
visibleCount 50 inicial — reset al cambiar libraryFilter — botón CARGAR MÁS en bloques de 50

| # | Archivo/s | Cambio | Commit |
|---|---|---|---|
| 088 | WinampPlayer.jsx | skipDir en deps useEffect MediaSession — fix stale closure previoustrack | bbce744 |
| 089 | tools/pliego_apply.py | npm.cmd en Windows — subprocess no encontraba npm | e71961f |
| 090 | App.jsx | patchDb pasado a MusicLab — fix handleDeletePlaylist ReferenceError | 146959b |
| 091 | MusicLab.jsx | patchDb añadido a firma de props | e121410 |
| 094 | tokens.js | Sistema de tags canónico VIBE_TAGS + paletas HSL completas por tag | 7e97183 |
| 095/096 | PlayerContext.jsx, REGLAS.md | PlayerContext migra a getVibeAccent. REGLAS fix formato multi-bloque | 8650199 |
| 097 | AddTrackForm.jsx | Estado interno migra vibe→tag con fallback legacy | 2ad647d |
| 097b/098b | AddTrackForm.jsx, MusicLab.jsx | Migración tag completa | c82954d |
| 098 | MusicLab.jsx | DEMO_TRACKS migrar vibe→tag schema v4 | 73cb751 |
| 099 | WinampPlayer.jsx | accentColor leer vibeConf.palette.accent (campo correcto tokens.js) | 4137ada |
| 100 | WinampPlayer.jsx | Añadir import getVibeConfig desde tokens.js | 0ff2f6d |
| 100b/100c | WinampPlayer.jsx | Eliminar getVibeConfig local — usar tokens.js exclusivamente | 34fa56c |
| 101 | AudioVisualizer.jsx | Helper withAlpha() — fix canvas con accentColor HSL | 05b0d0a |
| 102 | WinampPlayer.jsx | Helper withAlpha() local — migración completa estilos inline hex→HSL | 3c20cfe |
- **PLIEGO-156:** Fix TAG-01 (useRef, emptyForm, eliminación IconPicker fantasma). [Aplicado]
- **PLIEGO-157:** Migración de TagManager fuera del tab TRACKS a overlay global. [Aplicado]
- **PLIEGO-158:** Propagación de prop `onOpenTagManager` en barras LISTS y COLA. [Aplicado]
- **PLIEGO-159:** Intento de scroll fix con `touchAction: pan-x`. [Aplicado]
- **PLIEGO-160:** Intento de scroll fix forzando reflow de width a 0. [Aplicado]
- **PLIEGO-161:** Intento de scroll fix eliminando contenedor flex externo. [Aplicado]
- **PLIEGO-162:** Ajuste de z-index y padding para evitar solapamiento de overlay con header. [Aplicado]
- **PLIEGO-163:** Fix definitivo scroll Android eliminando el listener `whileTap` de framer-motion. [Aplicado]
- **PLIEGO-164/165:** Intentos fallidos/parciales de corregir corte de bordes por colisión con `overflow-x`. [Descartado/Revertido]| PLIEGO-172 | Reemplazar el archivo vacío con el formato definit… | SESION.md | 2026-06-01 |
| PLIEGO-173 | Crear BACKLOG.md canónico en docs/Nucleo/ con los … | BACKLOG.md | 2026-06-01 |
| PLIEGO-175 | Eliminar audit histórico S42-S43 de BACKLOG.md par… | BACKLOG.md | 2026-06-01 |
| PLIEGO-176 | append_resuelto_backlog mantiene maximo 5 filas en… | pliego_apply.py | 2026-06-01 |
| PLIEGO-177 | Propagar trackVibe a todo el shell — StatusBar, Bo… | Layout.jsx | 2026-06-01 |
| PLIEGO-178 | Quitar setPlaybackContext del onClick de TrackCard… | MusicLab.jsx | 2026-06-01 |
| PLIEGO-179 | PlayerProvider recibe tags como prop y resuelve ge… | PlayerContext.jsx | 2026-06-01 |
| PLIEGO-180 | Pasar tags de DB a PlayerProvider para que resuelv… | App.jsx | 2026-06-01 |
| PLIEGO-184 | Fix regex update_proximo_pliego — ampliar patron p… | pliego_apply.py | 2026-06-01 |
| PLIEGO-185 | Exponer resolveVibeAccent en el valor del contexto… | PlayerContext.jsx | 2026-06-01 |
| PLIEGO-186 | Reemplazar getVibeAccent (solo conoce 4 tags canón… | Layout.jsx | 2026-06-01 |
| PLIEGO-187 | El botón LANZAR DROP tiene PURPLE hardcodeado. Deb… | WinampPlayer.jsx | 2026-06-01 |
| PLIEGO-188 | Añadir prop vibeConf opcional. Si se pasa, se usa … | WinampPlayer.jsx | 2026-06-01 |
| PLIEGO-189 | Pasar vibeConf del activeTrack (resuelto desde DB)… | MusicLab.jsx | 2026-06-01 |
| PLIEGO-190 | ALL se corta al inicio y botón config desalineado … | TrackCard.jsx | 2026-06-01 |
| PLIEGO-191 | getVibeConfig local devuelve tags con "color" dire… | MusicLab.jsx | 2026-06-01 |
| PLIEGO-192 | resolveVibeAccent busca palette?.accent y seedColo… | PlayerContext.jsx | 2026-06-01 |
| PLIEGO-193 | (1) El botón ⚡ del card tiene PURPLE hardcodeado —… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-194 | (1) El artista y la nota del card tienen color:ACI… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-195 | El título "TRACKS [558]", el icono ◎, los botones … | MusicLab.jsx | 2026-06-01 |
| PLIEGO-196 | El botón ⚙ tiene position:absolute top:0 y queda p… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-198 | Alinear botón ⚙ con las pastillas de tags en VibeT… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-199 | Botón ⚙ altura igual a pastillas, color accentColo… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-200 | Pasar accentColor a VibeTagBar y botón editar ✎ en… | MusicLab.jsx | 2026-06-01 |
| PLIEGO-201 | Botón ⚙ altura 24px para igualar visualmente las p… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-202 | Botón ⚙ sin height fijo — padding idéntico a las p… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-203 | Eliminar botón ⚡ lanzar drop de las TrackCards | TrackCard.jsx | 2026-06-01 |
| PLIEGO-204 | Menú de track como bottom sheet con botón ⋯ — elim… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-205 | Layout derecho card en fila, icono tag más grande … | TrackCard.jsx | 2026-06-01 |
| PLIEGO-206 | Bottom sheet en portal + icono tag doble tamaño al… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-207 | Icono tag fontSize 24, botón ⋮ fontSize 22 | TrackCard.jsx | 2026-06-01 |
| VB9 | Vibe propagado a shell completo — TRACKS Fase A ready | PlayerContext.jsx | 2026-06-01 |
| PLIEGO-211 | Toggle viewMode lista/grid/tarjeta con persistenci… | MusicLab.jsx | 2026-06-01 |
| PLIEGO-212 | Modo tarjeta expandida (viewMode card) + component… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-213 | Añadir TrackCardGrid al import de TrackCard | MusicLab.jsx | 2026-06-01 |
| PLIEGO-216 | CTX-1 fix AnimatePresence anidado en TrackCard — m… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-217 | Botón ⋮ modo portada con borde y área táctil mínim… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-218 | Tabs inactivas de nav suben de 4d a 88 (opacidad 5… | Layout.jsx | 2026-06-01 |
| PLIEGO-219 | Mueve botón ⋮ de TrackCardGrid fuera del motion.di… | TrackCard.jsx | 2026-06-01 |
| S84-001 | MusicLab.jsx | RENAME-PLAYLIST sister bug — handleRenamePlaylist routea por `PATCH /api/playlists/:id` antes de patchDb. Guard `_jwtToken` + toast "PLAYLIST RENOMBRADA" en success, "NO SE PUDO RENOMBRAR" en catch. | 9351603 |
| S84-002 | workers/worker.js + MusicLab.jsx | REORDER/REMOVE-TRACK sister bug — 2 endpoints nuevos (`PUT /api/playlists/:id/tracks` reorder atómico, `DELETE /api/playlists/:id/tracks/:trackId` remove con 404). Frontend: onRemoveTrack + onReorderTracks ahora routean por Worker. handleEditPlaylist eliminado (huérfano). | ee9263f |
| S84-003 | MusicLab.jsx | Toasts de error en 3 catches (handleDeletePlaylist, onDeleteDrop DROPS tab, handleRenamePlaylist). Patrón unificado: `console.warn` + `setToast("NO SE PUDO Y")` + `setTimeout(2500ms)` + return. Cero silent catches en estos handlers. | f68f8df |
| S84-004 | MusicLab.jsx | COLA tab vibe-aware refactor — mechanical `ACID` → `accentColor` scoped al bloque del tab COLA (49 refs). Preserva literales `#ff4444` (danger) y `#ffcc00` (sync). Coherencia vibe-aware completa en los 3 tabs. | d12bf3b |
| S84-005 | MusicLab.jsx + Vault.jsx | Toasts extendidos — patrón aplicado a onRemoveTrack ("NO SE PUDO ELIMINAR"), onReorderTracks ("NO SE PUDO REORDENAR"), handleDeleteEntry de Vault ("NO SE PUDO ELIMINAR"). Bonus: Vault.jsx ahora tiene sistema de toast propio (state + UI vibe-aware con `accent`) — `alert()` reemplazado. | 3828446 |
| S84-006 | workers/schema.sql + workers/worker.js + MusicLab.jsx | handlePlDrop sister bug #3 — Schema: `sort_order INTEGER DEFAULT 0` en `playlists` + `idx_playlists_order`. Worker: GET ordena por sort_order, POST auto-asigna (`INSERT...SELECT MAX+1`), nuevo `POST /api/playlists/reorder` con batch UPDATE + 404 + evento `playlists_reordered`. Frontend: handlePlDrop routea por endpoint nuevo. Manual steps en commit: `wrangler deploy` + `ALTER TABLE` + `CREATE INDEX`. | 3405d16 |
| S84-000a | MusicLab.jsx | DEL-PLAYLIST fix (pre-S84) — handleDeletePlaylist routea por `DELETE /api/playlists/:id` antes de patchDb. Causa raíz del patrón. | 4c94540 |
| S84-000b | MusicLab.jsx | DEL-DROP fix (pre-S84) — handleDeleteDrop (DROPS tab) routea por `DELETE /api/drops/:id` antes de patchDb. Mirror de DEL-PLAYLIST. | a71171e |
| S85-001 | tokens.js + 10 archivos | WCAG romantiqueo fix — `#bf00ff` → `#d966ff` (contrast 4.40:1 → ~5.5:1, pasa AA). Aplicado en tokens.js (source of truth), Layout/Vault/SmokeSession/LoginScreen, ColorPicker, GoogleDriveService, workers/schema.sql, backup JSON, 2 HTML de roadmap. | WCAG-FIX-1 |
| S85-002 | TrackCard.jsx + WinampPlayer.jsx + MusicLab.jsx | Dead YouTube code removal — `extractYouTubeId` function + 3 image branches en TrackCard, `ytId` extraction + artwork condicional en WinampPlayer, extractor inline + `ytId` wiring en MusicLab. Código inalcanzable desde migración a R2 (S54). MediaSession artwork simplificado a `track.thumbnail` único. | YT-CLEANUP-1 |
| S86-001 | Timeline.jsx + MusicLab.jsx + SmokeSession.jsx | React Key Audit — 6 str_replaces eliminan position-dependent keys y non-unique key warnings. Timeline x3 (lineas 139, 256, 283), MusicLab x2 (lineas 809, 812), SmokeSession x1 (linea 523). Audit scope: 61 sitios en src/ revisados, 43 OK, 12 safe, 6 corregidos. | 989b158 |
| 231 | VaultGallery.jsx | MAP Sub-fase 2: JourneyPolylines — polylines animados entre entries misma Era con CSS keyframe bunkerDashMove, era color, opacity 0.6, weight 2. | 9db085d |
| 232 | VaultGallery.jsx | MAP Sub-fase 3: Dual-range date slider — `dateRange` computado de entries, overlapping `<input type="range">` min/max, custom track visual, `filteredByDate` drives markers y polylines. | 9db085d |
| 233 | VaultGallery.jsx, GeocoderService.js, LocationSearch.jsx, AddEntryForm.jsx | MAP Sub-fase 4: Geocoder Photon+Nominatim + LocationSearch debounced + AddEntryForm location fields (lat/lng/place_name en content). | 9db085d |
| 234-S0.1 | vite.config.js, public/sw.js | PRECACHE funcional — swAssetManifest Vite plugin genera sw-assets.json, SW install handler precachea todos los assets del build. Offline fallback existente se activa. | 9db085d |
| 234-S0.2 | Layout.jsx, ESTADO.md | safe-area-inset-* en StatusBar (paddingTop), BottomNav (paddingBottom), MiniPlayer (bottom calc con safe-area). | 89363a5 |
| 234-S0.3 | src/core/ui/Button.jsx, Card.jsx, Input.jsx, index.js, Vault.jsx, REGLAS.md, ESTADO.md | Design system: Button (3 variants, 3 sizes, loading), Card (glassmorphism, padding configurable), Input (label, error, multiline). Demo migration botón CREAR ERA en Vault.jsx. | 638e217 |
| CTX-1 | AnimatePresence anidado en TrackCard — menú ⋮ no abría en tracks nuevos | TrackCard.jsx | 2026-06-01 |
| PLIEGO-224 | Unificar Modo Edición | MusicLab.jsx | 2026-06-04 |
| Q2 | skip(1) cola manual itera saltando duplicados activeTrack | PlayerContext.jsx | 2026-06-13 |
| Q3 | shuffle filtra playHistory al regenerar orden | PlayerContext.jsx | 2026-06-13 |
| Q10 | playTrack añade al historial al cambiar de track | PlayerContext.jsx | 2026-06-13 |
| SH1 | SmokeSession persiste endTime en localStorage | SmokeSession.jsx | 2026-06-13 |
| L1 | addLibrary refresca libraryCapacity automáticamente | VaultContext.jsx | 2026-06-13 |
| PLIEGO-227 | Modo Edición persistente | MusicLab.jsx | 2026-06-04 |
| G3 | VAULT vibe-aware — S85c ya añadió usePlayer() + trackVibe accent dinámico | Vault.jsx | 2026-06-14 |
| G4 | CAPSULES vibe-aware — S85c ya añadió usePlayer() + trackVibe accent dinámico | Capsules.jsx | 2026-06-14 |
| G1 | Densidad VaultGallery — buildMasonryColumns JS cambia columnas reales (no CSS columns) | VaultGallery.jsx | 2026-06-14 |
| G2 | Botón "+ ERA" — S89 fix: onAddEra ahora refresca eras desde Worker API | App.jsx, Vault.jsx | 2026-06-14 |
| W3 | Tags MusicLab → D1 — S85c añadió sync con Worker API /api/tags | App.jsx | 2026-06-14 |
| G5 | Timeline modos + paginación — S85c añadió viewMode (timeline/compact) + PAGE_SIZE + "CARGAR MÁS" | Timeline.jsx | 2026-06-14 |
| G6 | Volumen SmokeSession — S85c añadió `<input type="range">` funcional | SmokeSession.jsx | 2026-06-14 |
| G7 | Mini-player entre pestañas — Layout.jsx ya renderiza `<MiniPlayer>` en `activeTab !== "music"` | Layout.jsx | 2026-06-14 |
| ALERT-1/2 | alert() → toast vibe-aware en Vault.jsx (addEra + updateEntry) | Vault.jsx | 2026-06-14 |
| S126-A | VolumeFadeBar componente eliminado (S126 — doble barra decorativa duplicaba input range) | SmokeSession.jsx | 2026-06-17 |
| S126-B | Botón ▶ ACTIVAR outlined cuando !running (jerarquía secundaria sin perder hitbox) | SmokeSession.jsx | 2026-06-17 |
| S126-C | S97 inline category badge removido en EraDetailPanel row (filtro global arriba ya indica categoría) | Vault.jsx | 2026-06-17 |
| S126-D | S98 badges slice(0,2) + +N indicator con title discoverability | Vault.jsx | 2026-06-17 |
| S126-E | edit/delete buttons mobile-friendly con sm:group-hover dual-class | Vault.jsx | 2026-06-17 |
| S126-F | _CAT_LOOKUP dead code eliminado (era helper sin uso tras quitar S97) | Vault.jsx | 2026-06-17 |
| S130-A1 | react-leaflet-cluster 4.1.3 instalado con peer-deps match (React 19 + react-leaflet 5 + leaflet 1.9.4) | package.json | 2026-06-17 |
| S130-A2 | 3 CSS files vendor (Leaflet 14.8KB + MarkerCluster 997B + MarkerCluster.Default 1.4KB) en public/vendor/ | public/vendor/ | 2026-06-17 |
