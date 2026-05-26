# ERRORES_RESUELTOS.md — el_bunker
> Append-only. Claude nunca lee este archivo en arranque.
> Al cerrar un bug: mover aquí desde ESTADO.md con commit y número de pliego.

---

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