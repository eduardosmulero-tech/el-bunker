# ESTADO.md — el_bunker
> Actualizar al cerrar cada sesión.

---

## BUGS ACTIVOS — PRÓXIMA SESIÓN 28

> Ordenados por prioridad. Esta sección reemplaza cualquier "cola de trabajo" separada.

### P1 — Bloqueantes
| ID | Descripción | Pliego |
|---|---|---|
| BUG-NUEVO-07 | Token 403 para David: pantalla de error sin salida sin `clear site data` manual. Implementar reautenticación automática en `_refreshToken`: limpiar localStorage + forzar `signIn()` popup sin acción del usuario. | PLIEGO-068 — Realizado · Sin confirmar con David |

### P2 — Reproductor
*(vacío — bugs 12 y 13 resueltos en PLIEGO-071) sin testear*

### P3 — UX / MusicLab
| ID | Descripción | Pliego |
|---|---|---|
| BUG-NUEVO-14 | Editar track muestra lista edición + lista tracks simultáneamente. | PLIEGO-072 |
| BUG-NUEVO-15 | Crear playlist con Enter sin botón visible — UX confusa, crea duplicados accidentales. | PLIEGO-072 |
| BUG-NUEVO-23 | Eliminar playlist no persiste en DB. Restricción owner innecesaria (app privada de pareja). | PLIEGO-072 |
| BUG-NUEVO-18 | Slider volumen master no afecta `audioRef.current.volume` para tracks Drive. | PLIEGO-073 |
| BUG-NUEVO-19 | `activeVibe` cambia acento de color solo en reproductor, no en toda la app. | PLIEGO-073 |
| BUG-NUEVO-22 | Botones físicos de volumen Android no sincronizan con reproducción. (Investigar compatibilidad MediaSession en WebView/TWA antes de generar Pliego.) | PLIEGO-073 |

### P4 — Feature Gaps
| ID | Descripción |
|---|---|
| FEAT-GAP-01 | Lockscreen skip no implementado (botón MediaSession no existe). Confirmar si limitación del SO antes de planificar Pliego. |
| BUG-NUEVO-20 | Feature "Añadir siguiente" en cola no existe. |
| BUG-NUEVO-21 | Cola no permite duplicados de la misma canción. |

### Sin probar (no son bugs confirmados)
- Upload MP3 a Drive — feature de subida no implementada.
- Stream MP3 desde Drive — bloqueado por Upload.
- 30 min reproducción continua Drive — bloqueado por Stream.
- Volumen SmokeSession sincronizado con PlayerContext — pendiente probar con Smoke abierto.
- Notificación con sonido breve no interrumpe reproducción.
- PLIEGO-071 (skip anterior + scroll título) — aplicado, sin confirmar en producción.

---
## SESIÓN 27 — 22 Mayo 2026
**Pliegos:** 071
**Commits:**
- `[HASH]` PLIEGO-071: fix skip anterior invertido (currentTRef) + scroll título condicional (requestAnimationFrame + width:100%)

---
## SESIÓN 26 — 22 Mayo 2026
**Pliegos:** 069, 070
**Commits:**
- `[HASH]` PLIEGO-069/070: loop triestado + fixes reproductor BUG-09/10/11/12/13/16/17/19

## SESIÓN 25 — 22 Mayo 2026
**Pliegos:** 068
**Commits:**
- `[]` PLIEGO-068: fix reauth automatica en 403 para David

## SESIÓN 24 — 21 Mayo 2026
**Pliegos:** 066, 066b, 067
**Commits:**
- `[HASH]` PLIEGO-066: Eliminar polling/ytReady del PlayerContext — progreso es UI local
- `[HASH]` PLIEGO-066b: Fix setYtReady residual en onReady tras refactor
- `[HASH]` PLIEGO-067: Polling YT local reactivo a isPlaying + fix dep [] Drive

**Resultado:** Build limpio. Barra de progreso funcional en YouTube y Drive confirmada por Edu. Testing completo con checklist → bugs listados arriba.

---

## SESIÓN 23 — 21 Mayo 2026
**Pliegos:** 065, 065b, 065c, 065d, 065e
**Commits:**
- `[HASH]` PLIEGO-065: Fix iframe YT persistente en PlayerProvider
- `[HASH]` PLIEGO-065b: Fix TDZ skipRef — mover declaración tras skip()
- `[HASH]` PLIEGO-065c: Fix YT.Player — loadVideoById en vez de destroy()
- `[HASH]` PLIEGO-065d: Fix setYtReady residual en WinampPlayer
- `[HASH]` PLIEGO-065e: Fix div YT imperativo fuera de React DOM

---

## SESIÓN 22 — 20 Mayo 2026
**Pliegos:** 053, 054, 018-STRINGS
**Commits:**
- `[HASH]` PLIEGO-053: Reorganización src/ en carpetas core/layout/vault/musiclab/smoke
- `[HASH]` PLIEGO-054: BUG-NUEVO-04 consumo masterVolume vía context en SmokeSession
- `[HASH]` PLIEGO-018-STRINGS: manifest.json encoding UTF-8 sin BOM

**Resultado:** Build limpio (vite build exitoso).

> ⚠️ Sesión 20 no documentada — posible salto en numeración o sesión de diagnóstico sin Pliegos aplicados.

---

## SESIÓN 21 — 21 Mayo 2026
**Pliegos:** 061, 062, 063, 064
**Commits:**
- `9df252f` PLIEGO-061/062/063/064: Trilogía del Reproductor + Grupo 2 UI

---

## SESIÓN 19 — 21 Mayo 2026
**Pliegos:** 051, 055, 056, 057, 058, 059, 060, 060b
**Commits:**
- `[HASH]` Bloque B completo + fix MusicLab import useState

---

## SESIÓN 18 — 20 Mayo 2026
**Pliegos:** 046, 047, 048, 049, 050
**Commits:**
- `[HASH]` PlayerContext + fixes UI. Build limpio. Push a master.

---

## REGLAS CRÍTICAS CONSOLIDADAS

1. **Progreso es UI local.** `currentTime`, `duration`, `progress` → NUNCA en `useState` del Context. Siempre estado local de `WinampPlayer`. Re-renders de alta frecuencia con Framer Motion activo degradan el rendimiento.
2. **`useEffect` con `[audioRef.current]` es inerte.** React no re-ejecuta cuando muta un ref. Suscribirse al `<audio>` con dep `[]` en mount.
3. **Polling YT en WinampPlayer, no en Context.** Arrancar reactivamente a `isPlaying` con `useEffect([playing, track?.id])`.
4. **Div target de YT.Player NUNCA en JSX.** YT reemplaza el div con un iframe; React pierde el nodo y explota en `removeChild`. Crear el div imperativamente con `document.createElement` + `document.body.appendChild` en `useEffect` de montaje único en `PlayerProvider`.
5. **Diagnóstico completo antes del primer Pliego** en bugs de reproductor. Leer los dos archivos implicados íntegros, mapear el flujo, identificar residuos antes de escribir un SEARCH/REPLACE.
6. **`onReady` de YT.Player** recibe un evento — el player es `e.target`, no `e`.
7. **Loop es triestado `"off" | "list" | "track"`.** Nunca usar boolean para `loop`. `loopModeRef` necesario para callbacks YT sin stale closure.
8. **`mountedRef` guard en efecto `track?.id`.** Evita resetear `isPlaying` en montaje inicial (BUG-10 desync UI al volver de pestaña).
9. **`currentTRef` para callbacks con stale closure.** `skipDir` y cualquier callback que lea `currentTime` deben usar un `ref` sincronizado en `onTimeUpdate` y en el polling YT. Nunca leer `currentT` del closure directamente en callbacks de MediaSession.
10. **Bug = síntoma + causa.** Al registrar un bug nuevo, incluir una línea de causa probable. Si la causa no está clara, el bug queda como "sin diagnóstico" hasta que se investigue. No numerar síntomas del mismo problema como bugs distintos.

---

## DEUDA TÉCNICA

| Item | Acción |
|---|---|
| `ACID` y `PURPLE` en Vault.jsx | Migrar a tokens.js cuando se toque el archivo |
| `patchDb` race condition | Pospuesto hasta pérdidas reales en producción |
| PowerShell no admite `&&` | Siempre comandos en líneas separadas |
| FEAT-BATCH-UPLOAD | Diseñar post-Fase 2 |
| Ctrl+A+pegar → verificar línea 1 = `import React` | Bug recurrente desde S19 |
| MediaSession no funciona en Android PWA con YouTube | Investigar si es limitación del SO o del iframe |
| AudioVisualizer: ciclo predeterminadas→negro→predeterminadas | Pendiente solución estable con análisis de audio real |
| Playlist: añadir tracks en bloque, tags a playlist, indicador activa en reproductor | Post-estabilización |
| BUG-NUEVO-07 sin test real con David | Confirmar fix PLIEGO-068 en sesión siguiente |
| ADR-008 pendiente de Pliego de corrección | Refactorización PlayerContext: playbackContext + contextPointer + manualQueue |

---

## INFRAESTRUCTURA
- [x] Google Cloud Console: 3 usuarios de prueba, scopes correctos
- [x] Vercel conectado a GitHub (master), trigger automático
- [x] PWA instalada en Android de Edu y David
- [x] Estructura de carpetas (core/layout/vault/musiclab/smoke)

---

## FEATURES POST-ESTABILIZACIÓN
- Página de aterrizaje con módulos
- Historial de escucha (quién, cuándo, contador)
- Shuffle por tag · Notas por track
- Menú de edición de vibe tags
- Normalización de volumen · Crossfade Drive-Drive
- Sleep timer · Gapless playback
- "La canción de esta era" — conexión con Vault
- Modo Party / visualizador compartido
- Thumbnail manual · Drops colaborativos en playlists
- Autoplay por vibe (cola vacía → barajar tracks del vibe activo)
- Cola con drag & drop en mobile

---

## ERRORES RESUELTOS

| # | Descripción | Solución | Commit |
|---|---|---|---|
| 1 | Tailwind v4 incompatible | Downgrade a v3.4.19. NO actualizar. | — |
| 2 | Email vacío, 401 userinfo | Añadir userinfo.email + userinfo.profile a SCOPES | — |
| 3 | SW cacheando versión rota | Clear site data completo + hard refresh | — |
| 4 | Login admin bloqueado en Opera GX | Usar Chrome | — |
| 5 | Continue webview en blanco | Cerrar todos Code.exe y reiniciar. Migrado a Cline | — |
| 6 | Deploy Vercel | VITE vars en Vercel + URL en Google Cloud Console + Chrome | — |
| 7 | Qwen trunca funciones largas | Rechazar diff. Reenviar con código explícito | — |
| 8 | Qwen genera SEARCH incorrecto | Copiar SEARCH literal desde archivo con PowerShell | — |
| 9 | Timeout Ollama | Verificar `ollama list` antes de lanzar Pliegos | — |
| 10 | Ctrl+H falla por encoding PowerShell | Ir directo a la línea en VS Code | — |
| 11 | PWA no instala como standalone | Iconos 192px y 512px obligatorios en public/icons/ | — |
| 12 | Commits bloqueados en Vercel | Git con bansovi.py@gmail.com | — |
| 13 | Separador `---` dentro de JS | NO usar en JS. Usar `// ─────` | — |
| 14 | toast no declarado (pantalla blanca) | Verificar bloque useState antes de cualquier lógica | — |
| 21 | SW interceptaba YouTube | Añadir youtube.com, ytimg.com, googlevideo.com a BYPASS_PATTERNS | — |
| 22 | Migración schema no se ejecutaba | Actualizar CONFIG.SCHEMA_VERSION | — |
| 23 | `<audio>` con URL YouTube | NO funciona. iframe para YT, `<audio>` para Drive | — |
| 24 | Modales no mutuamente excluyentes | PLIEGO-023 | a484f2f |
| 27/28 | Loop/shuffle/skip stale closures | PLIEGO-021 | e792889 |
| 29 | Play en drop navega a MusicLab | PLIEGO-033 | aplicado |
| 35 | YT.Player no carga video inicial | PLIEGO-028b | f6af422 |
| Bug B | Sin persistencia OAuth2 | PLIEGO-022 | 200a1a3 |
| BUG-CRÍTICO-02 | Pantalla blanca MusicLab (TDZ) | PLIEGO-034 | f598adb |
| PLIEGO-035/036 | MusicLab.jsx 2119 líneas | Extracción a 6 archivos | 51d4ddb |
| BUG-024-PERSIST | Editar track no persistía | PLIEGO-044 | — |
| BUG-NUEVO-05 | URL playlist YouTube crasheaba | PLIEGO-045 | 254bcb3 |
| Vercel cache s17 | Pantalla blanca pese a código correcto | git commit --allow-empty + push | — |
| App.jsx s18 | `user` redeclarado en AppCore | Eliminar destructuring duplicado | — |
| WinampPlayer s18 | `startPolling` redeclarado | Renombrar local a `startPollingLocal` | — |
| MusicLab s19 | `useState is not defined` pantalla blanca | Import React faltante tras Ctrl+A+pegar | — |
| BUG-NUEVO-04 | Volumen master estático | PLIEGO-054 | aplicado |
| S21 BUG-PLAYLIST-INTEGRATION + BUG-DUPLICATE-KEYS + DROPS-VACIO | Varios | PLIEGO-064 | 9df252f |
| 018-STRINGS | manifest.json encoding roto | PLIEGO-018-STRINGS | aplicado |
| S23 TDZ skipRef | skipRef declarado antes de skip() | PLIEGO-065b | — |
| S23 removeChild | div YT en JSX React → conflicto DOM | PLIEGO-065e: div imperativo fuera de árbol React | — |
| S23 pantalla blanca | setYtReady residual en WinampPlayer | PLIEGO-065d | — |
| S24 barra progreso inerte Drive | `useEffect` dep `[audioRef.current]` inerte | PLIEGO-067: dep `[]` | — |
| S24 barra progreso inerte YT | startPolling nunca se llamaba | PLIEGO-067: `useEffect([playing, track?.id])` local | — |
| S24 setYtReady is not defined | Residuo tras eliminar ytReady del contexto | PLIEGO-066b | — |
| BUG-NUEVO-08 | Loop solo 2 estados | PLIEGO-069: loop triestado `"off"\|"list"\|"track"` | [S26] |
| BUG-NUEVO-09 | Cola agotada + loop OFF → reproduce primer track | PLIEGO-070: `setIsPlaying(false); return` | [S26] |
| BUG-NUEVO-10 | Volver a MusicLab → barra en 0:00, botón Play aunque suene | PLIEGO-070: `mountedRef` guard | [S26] |
| BUG-NUEVO-11 | Tap en track activo reproduciéndose no pausa | PLIEGO-070: toggle en `playTrack` si mismo `activeTrack` | [S26] |
| BUG-NUEVO-16 | Shuffle no funciona: salta al siguiente en cola | PLIEGO-070: cola con prioridad solo si `!shuffle` | [S26] |
| BUG-NUEVO-17 | Track Drive termina → no autoplay siguiente | PLIEGO-070: `getStreamUrl` para URL autenticada | [S26] |
| BUG-NUEVO-19 | `activeVibe` solo cambia acento en reproductor | PLIEGO-070 (parcial B13): `vibeConf` desde `activeVibe` en WinampPlayer | [S26] |
| BUG-NUEVO-12 | Skip anterior invertido: <3s reiniciaba en vez de ir atrás | PLIEGO-071: `currentTRef` para evitar stale closure en `skipDir` | [S27] |
| BUG-NUEVO-13 | Título siempre animado aunque cupiera en pantalla | PLIEGO-071: `requestAnimationFrame` en `useLayoutEffect` + `width:100%` en contenedor | [S27] |

## FEATURES — ESTADO REAL

| Feature | Archivo | Estado |
|---|---|---|
| Login OAuth + whitelist | GoogleDriveService.js | ✅ REAL |
| DB en Drive (crear/leer/escribir) | GoogleDriveService.js | ✅ REAL |
| StatusBar, BottomNav, boot terminal | Layout.jsx / LoginScreen.jsx | ✅ REAL |
| Adventure Counter | Vault.jsx | ✅ REAL |
| HeartbeatWidget | Vault.jsx | ✅ REAL |
| Slider de Eras (con datos reales) | Vault.jsx | ✅ REAL si hay eras en DB |
| Botón +ERA | Vault.jsx | ⚠️ SOLO LOG — modal no implementado |
| Cápsulas del Tiempo | Vault.jsx | ❌ HARDCODED — no conecta con DB |
| Timeline (tab 2) | — | ❌ PLACEHOLDER intencional |
| Reproductor Winamp + visualizador | WinampPlayer.jsx / AudioVisualizer.jsx | ✅ REAL |
| Loop triestado (off/list/track) | PlayerContext.jsx / WinampPlayer.jsx | ✅ REAL (PLIEGO-069) |
| Filtros Vibe + tracks | MusicLab.jsx / TrackCard.jsx | ✅ REAL |
| Añadir/editar/eliminar track | AddTrackForm.jsx | ✅ REAL |
| The Drop (enviar/recibir) | DropsManager.jsx | ✅ REAL |
| Playlists (crear/asignar) | PlaylistManager.jsx | ✅ REAL (bugs menores activos) |
| Cola de reproducción | PlayerContext.jsx | ✅ REAL (bugs P2 reducidos) |
| Subida MP3 a Drive | — | ❌ NO IMPLEMENTADO |
| UI de bibliotecas | — | ❌ NO IMPLEMENTADO (lógica sí existe) |
| Smoke Session (timer + fade) | SmokeSession.jsx | ✅ REAL |
