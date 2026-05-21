# ESTADO.md — el_bunker
> Actualizar al cerrar cada sesión.

---

## SESIÓN 21 (21 Mayo 2026) — Trilogía del Reproductor Aplicada + Grupo 2 UI Estabilizado

Pliegos aplicados: 061, 062, 063 (Trilogía del Reproductor) y 064 (Fix UI Group 2). Build limpio confirmado (429 módulos en 580ms). Push a master realizado (hash: `9df252f`). Grupo 1 y Grupo 2 completamente estabilizados.

Cola de trabajo siguiente (Bloque C — Smoke y reorganización):
1. PLIEGO-054 — `SmokeSession.jsx`: BUG-NUEVO-04 (volumen master estático).
2. PLIEGO-053 — Reorganización de la carpeta `src/` en subcarpetas.
3. PLIEGO-018-STRINGS — `manifest.json`: Encoding roto.

Bugs activos:
- BUG-NUEVO-04 [P3]: Volumen master estático en SmokeSession (Pendiente en PLIEGO-054).

---

## REGLAS CRÍTICAS DE COMPORTAMIENTO DEL MODELO (Lecciones Aprendidas S21)
1. PROHIBIDO solicitar archivos de código fuente al usuario sin presentar previamente un plan validado que cite un bug activo o un pliego pendiente documentado.
2. PROHIBIDO extraer o forzar la implementación de elementos listados en "FEATURES POST-ESTABILIZACIÓN" para rellenar respuestas o justificar lecturas de archivos si el usuario no lo ha ordenado explícitamente.
3. Si un lote de archivos (Grupo) se encuentra estable y sin fallas registradas, el modelo debe declarar abiertamente: "Grupo estabilizado, sin cambios requeridos".

---

## HISTORIAL DE SESIONES ANTERIORES

## SESIÓN 19 (21 Mayo 2026) — Bloque B completo + fix MusicLab
Pliegos aplicados: 051 (App.jsx — drop alert global), 055 (PlayerContext — activeVibe + vibe-accent + masterVolume), 056 (MusicLab — consume activeVibe + drop compose), 057 (DropsManager — minute_mark slider), 058 (WinampPlayer — masterVolume sync), 059 (AddTrackForm — selector YouTube/Drive + español), 060+060b (PlaylistManager + MusicLab — PlaylistDetailModal FEAT-LISTS), fix (MusicLab import useState faltante).
Build limpio confirmado. Push a master realizado.

## SESIÓN 18 (20 Mayo 2026) — PlayerContext + fixes UI
Pliegos aplicados: 046, 047, 048, 049, 050.
Build limpio confirmado. Push a master realizado.

---

## INFRAESTRUCTURA
- [x] Google Cloud Console: 3 usuarios de prueba, scopes correctos
- [x] Vercel conectado a GitHub (master), trigger automático
- [x] PWA instalada en Android de Edu y David

---

## DEUDA TÉCNICA
- `ACID` y `PURPLE` definidos localmente en Vault.jsx — migrar cuando se toque ese archivo.
- `patchDb` race condition — pospuesto hasta pérdidas reales.
- manifest.json encoding roto — PLIEGO-018-STRINGS.
- PowerShell no admite `&&` — comandos en líneas separadas.
- FEAT-BATCH-UPLOAD — diseñar post-Fase 2.
- **Al hacer Ctrl+A+pegar verificar siempre línea 1 = import React** (bug recurrente s19).
- Reproductor construido con fuente de verdad repartida entre PlayerContext, MusicLab y WinampPlayer. Rediseño estructural pendiente en PLIEGO-061/063.
- MediaSession no funciona en Android PWA con YouTube — investigar si es limitación del SO o del iframe.

---

## FEATURES POST-ESTABILIZACIÓN
- [ ] Página de aterrizaje con módulos
- [ ] Historial de escucha (quién, cuándo, contador)
- [ ] Shuffle por tag
- [ ] Notas por track
- [ ] Menú de edición de vibe tags (crear/editar/eliminar, barra deslizable)
- [ ] Normalización de volumen
- [ ] Crossfade Drive-Drive
- [ ] Sleep timer
- [ ] Gapless playback
- [ ] "La canción de esta era" — conexión con Vault
- [ ] Modo Party / visualizador compartido
- [ ] Thumbnail manual
- [ ] Drops colaborativos en playlists
- [ ] Autoplay por vibe (cola vacía → barajar tracks del vibe activo)
- [ ] Cola con drag & drop en mobile

---

## ERRORES RESUELTOS (referencia — no repetir caminos)

| # | Descripción | Solución |
|---|---|---|
| 1 | Tailwind v4 incompatible | Downgrade a v3.4.19. NO actualizar. |
| 2 | Email vacío, 401 userinfo | Añadir userinfo.email + userinfo.profile a SCOPES. |
| 3 | SW cacheando versión rota | Clear site data completo + hard refresh. |
| 4 | Login admin bloqueado en Opera GX | Usar Chrome. |
| 5 | Continue webview en blanco | Cerrar todos Code.exe y reiniciar. Migrado a Cline. |
| 6 | Deploy Vercel | VITE vars en Vercel + URL en Google Cloud Console + Chrome. |
| 7 | Qwen trunca funciones largas | Rechazar diff. Reenviar con código explícito. |
| 8 | Qwen genera SEARCH incorrecto | Copiar SEARCH literal desde archivo con PowerShell. |
| 9 | Timeout Ollama | Verificar `ollama list` antes de lanzar Pliegos. |
| 10 | Ctrl+H falla por encoding PowerShell | Ir directo a la línea en VS Code. |
| 11 | PWA no instala como standalone | Iconos 192px y 512px obligatorios en public/icons/. |
| 12 | Commits bloqueados en Vercel | Git con bansovi.py@gmail.com. |
| 13 | Separador `---` dentro de JS | NO usar en JS. Usar `// ─────`. |
| 14 | toast no declarado (pantalla blanca) | Verificar bloque useState antes de cualquier lógica. |
| 21 | SW interceptaba YouTube | Añadir youtube.com, ytimg.com, googlevideo.com a BYPASS_PATTERNS. |
| 22 | Migración schema no se ejecutaba | Actualizar CONFIG.SCHEMA_VERSION. |
| 23 | `<audio>` con URL YouTube | NO funciona. iframe para YT, `<audio>` para drive. |
| 24 | Modales no mutuamente excluyentes | PLIEGO-023. |
| 27/28 | Loop/shuffle/skip stale closures | PLIEGO-021. |
| 29 | Play en drop navega a MusicLab | PLIEGO-033. |
| 35 | YT.Player no carga video inicial | PLIEGO-028b. |
| Bug B | Sin persistencia OAuth2 | PLIEGO-022. |
| BUG-CRÍTICO-02 | Pantalla blanca MusicLab (TDZ) | PLIEGO-034. |
| PLIEGO-035/036 | MusicLab.jsx 2119 líneas | Extracción a 6 archivos. |
| BUG-024-PERSIST | Editar track no persistía | PLIEGO-044. |
| BUG-NUEVO-05 | URL playlist YouTube crasheaba | PLIEGO-045. |
| Vercel cache s17 | Pantalla blanca pese a código correcto | git commit --allow-empty + push. |
| App.jsx s18 | `user` redeclarado en AppCore | Eliminar destructuring duplicado. |
| WinampPlayer s18 | `startPolling` redeclarado | Renombrar local a `startPollingLocal`. |
| MusicLab s19 | `useState is not defined` pantalla blanca | Import React faltante tras Ctrl+A+pegar. |
| S21 | BUG-PLAYLIST-INTEGRATION + BUG-DUPLICATE-KEYS + DROPS-VACIO | Resuelto en PLIEGO-064 (9df252f). |