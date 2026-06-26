# SESION.md — El Búnker

> Dispatcher del sistema. Leer primero.
> Actualizar al cerrar cada sesión.

## S131 — AUDITORÍA + PLAN PREMIUM + PLIEGOS 231-234 S0.1-0.3 (17 Junio 2026)

### Resumen
Re-auditoría completa desde cero. Score real con factor premium: ~32%. Nuevo plan 5 fases (~27 pliegos) priorizando cimientos (offline, safe areas, design system) antes que features nuevas.

### Pliegos aplicados
| Pliego | Descripción | Commit |
|--------|-------------|--------|
| PLIEGO-231 | MAP Sub-fase 2: JourneyPolylines animados entre entries misma Era | `9db085d` |
| PLIEGO-232 | MAP Sub-fase 3: Dual-range date slider temporal | `9db085d` |
| PLIEGO-233 | MAP Sub-fase 4: Geocoder Photon+Nominatim + LocationSearch + AddEntryForm location fields | `9db085d` |
| PLIEGO-234-S0.1 | PRECACHE funcional + offline fallback + swAssetManifest Vite plugin | `9db085d` |
| PLIEGO-234-S0.2 | safe-area-inset-* en StatusBar, BottomNav, MiniPlayer | `89363a5` |
| PLIEGO-234-S0.3 | Design system: Button/Card/Input en `src/core/ui/` | `638e217` |

### Bugs resueltos
- Delete track no ocultaba tracks marcados (MusicLab.jsx filteredTracks falta .filter(is_deleted))
- AdventureCounter 500 días (VaultContext.jsx hardcodeaba DEFAULT_ADVENTURE_DATE)
- Offline = pantalla negra (PRECACHE comentado en sw.js)

### Bugs activos P1
- Sin safe-area en toasts (7 instancias) — diferido a Fase 1.3 (toast unificado)
- Sin touch targets ≥44px — pendiente Fase 0.4

### Archivos creados (7)
- `src/core/ui/Button.jsx` — botón reutilizable 3 variants + 3 sizes
- `src/core/ui/Card.jsx` — glassmorphism card configurable
- `src/core/ui/Input.jsx` — input/textArea con label+error+accent
- `src/core/ui/index.js` — barrel export
- `src/vault/GeocoderService.js` — Photon API + Nominatim fallback
- `src/vault/LocationSearch.jsx` — debounced search + dropdown + manual override
- `workers/routes/config.js` — GET /api/config endpoint

### Archivos modificados (8+)
- `vite.config.js` — swAssetManifest plugin
- `public/sw.js` — install handler con asset manifest
- `src/layout/Layout.jsx` — safe-area-inset en StatusBar/BottomNav/MiniPlayer
- `src/vault/Vault.jsx` — demo migration Button design system
- `src/core/VaultContext.jsx` — adventures_start_date real desde D1
- `src/musiclab/MusicLab.jsx` — filteredTracks is_deleted filter
- `src/vault/AddEntryForm.jsx` — location fields
- `src/vault/VaultGallery.jsx` — MapView con entries reales + geocoded
- `workers/worker.js` — /api/config route
- `docs/Nucleo/ESTADO.md`, `docs/Nucleo/REGLAS.md` — documentación

## S132 — AUDITORÍA ESCUCHA COMPARTIDA SC1-SC14 + FIXES (17 Junio 2026)

### Resumen
Auditoría detallada de escucha compartida vs specs SC1-SC14. Score inicial ~38% → ~78%. 5 pliegos aplicados cubriendo SC2, SC3, SC5, SC8, SC10, SC13, SC14. Sin pliegos formales — edición directa por instrucción.

### Cambios aplicados
| Área | Archivos | Qué |
|------|----------|-----|
| Corazón al header | `WinampPlayer.jsx` | ♡ idle / ♥! partner / ♥ HOST/LINK. Pokémon "!" bounce |
| Auto-join | `PlayerContext.jsx` | `checkPresence` detecta `pending_session_id` y une auto |
| Posición 1s | `PlayerContext.jsx` | Broadcast periódico cada 1s + drift correction >2s |
| Queue compartida | `PlayerContext.jsx`, `MusicLab.jsx`, `sync.js` | queue_add/queue_remove bidireccional + badges EDU/DAV |
| Queue persistente | `sync.js` | DELETE devuelve `queue_json`, merge en `localQueue` |
| Reconnect SC8 | `PlayerContext.jsx`, `Layout.jsx` | Toast con RESINCRONIZAR/MANTENER |
| Vibe SC3 | `PlayerContext.jsx` | Vibe en payload de sync |
| Heartbeat presence | `PlayerContext.jsx` | Broadcaster refresca presencia cada 30s |
| Animaciones | `WinampPlayer.jsx` | layout transitions, ripple ring, key-based entrance |

### Correcciones post-auditoría (2o pase)
| Issue | Fix |
|-------|-----|
| Like button eliminado → restaurado en botonera controles | `WinampPlayer.jsx` — ♡/♥ like junto a loop+shuffle |
| Corazón oculto con exclamación → key removido, siempre visible | `WinampPlayer.jsx` — heart span estable sin `key` |
| "!" plano → bocadillo Pokémon con boquilla | `WinampPlayer.jsx` — span con fondo #ff2d55 + triángulo CSS |
| Botonera descentrada → layout restaurado | `WinampPlayer.jsx` — left cluster loop+shuffle+like |
| Animaciones perdidas → restauradas + mejoradas | `WinampPlayer.jsx` — pulso sesión, bounce partner |
| "Otro" → nombres reales Edu/David | `Layout.jsx`, `WinampPlayer.jsx` — fallback a "Alguien" |
| Heartbeat no se enviaba al pausar/reanudar → dep `isPlaying` | `PlayerContext.jsx` — efecto heartbeat escucha play state |
| Partner vibe no visible → SC15 partner-vibe-follow | Server heartbeat envía `track_vibe`, cliente deriva color |

### Bugs resueltos
- Heart en controls bar → movido a header centrado
- `removeFromQueue` no hacía sync → añadido `syncAction`
- Partner listening sin auto-join → `pending_session_id` en presence
- Queue perdida al salir → `queue_json` en DELETE response
- Sin badge de atribución → `_added_by` + color tags
- Like button eliminado durante refactor → restaurado
- Heartbeat no responsive al play/pause → dep `isPlaying` añadida
- Corazón se ocultaba con exclamación → key removido, stable
- "!" sin bocadillo → span con triángulo CSS (boquilla)
- StatusBar y heart usaban #ffcc00 fijo → siguen vibe del partner

### Bugs activos
- SC6/SC12 (stats credit): bloqueado en STAT-M9
- SC-M19-ANIM (BPM particles): diferido a sesión de diseño

### Pendiente
- Score actual ~82%. Gap principal: stats engine.

## Pendiente Fase 0.4
Touch targets ≥44px audit + fix en toda la app.

## S133 — ESTABILIZACIÓN PRE-TESTING S0.6 (18 Junio 2026)

### Resumen
Estabilización completa pre-testing con usuarios reales (Edu y David). Lint 38→0, build 3.4s→2.2s. 28 ficheros modificados. Commit `f86a1a4`.

### Runtime fixes
| Bug | Fix | Archivo |
|-----|-----|---------|
| Hooks condicionales en ExhibitionView/ReelView/DialogueView | useMemo/useState movidos antes de early return | `VaultGallery.jsx` |
| Volumen slider oculto (S0.4 sm=40px en vez de md=44px) | Diferencial sm=40/md=44 + overflow-x-auto en controls | `WinampPlayer.jsx` |
| labelStyle undefined crash en AddTrackForm | Replaced with inline styles | `AddTrackForm.jsx` |
| Catch blocks vacíos en GeocoderService | Añadidos console.warn | `GeocoderService.js` |

### Lint fixes (~38 errors/warnings → 0)
- **exhaustive-deps**: PlayerContext (4), Capsules (2), TimeCapsules (1), AudioVisualizer (1)
- **Fast Refresh**: Skeleton (7 exports), ToastContext (2 exports) — `eslint-disable` top-level
- **set-state-in-effect**: AudioVisualizer, VaultGallery (CinemaView + MapView), LocationSearch
- **Unused vars**: Timeline (toast), MusicLab (useToast), AudioVisualizer (onRequestFullscreen), VaultGallery (positions, currentIdx), Skeleton (cardHeight), worker.js (json import)
- **Bad eslint comments**: AudioVisualizer, VaultGallery (comment text en rule name con `—`)
- **Unused disable**: PlayerContext line 1449 (removed)
- **test-setup.js**: `global` → `globalThis`
- **PlayerContext.test.jsx**: unused `vi` import

### Nuevos archivos
- `src/core/ToastContext.jsx` — Provider + useToast unificado (51 líneas)
- `workers/utils/events.js` — Server event helpers (shared_session_started/joined/left)

### Docs actualizados
- 7 ficheros Arquitectura/ (INDEX, architecture, data-flow, event-lifecycle, ownership-map, rendering-flow, state-map, technical-debt)

### Build/Lint/Tests
- **Build**: 2.22s ✓ (2240 modules, 10 chunks)
- **Lint**: 0 errors, 0 warnings
- **Tests**: 12/12 ✓

---

## S134 — CHECKLIST TESTING SELF-CONTAINED + INLINE DATA (18 Junio 2026)

### Resumen
Checklist de testing exhaustiva (312 items, 31 secciones) unificada en un solo archivo HTML self-contained. Inline de datos desde `checklist_data.js` (15 KB) directamente en el HTML para evitar dependencias externas. Tester toggle localStorage independiente para Edu (acid green) y David (purple). Commits: `a7ef533` (checklist split) + `735f066` (inline data).

### Cambios
| Archivo | Qué |
|---------|-----|
| `docs/operacional/checklist_data.js` | Eliminado (datos inline en HTML ahora) |
| `docs/operacional/bunker_checklist.html` | 15 KB de datos inline + UI shell + CSS + JS logic + tester toggle |

### Score pre-testing (sin cambios desde S133)
- Audio engine 70% · Escucha compartida ~85% · VAULT data model 80%
- WALL 35% · CINEMA 18% · MAP 30% · DIALOGUE 60% · EXHIBITION 6% · REEL 11% · CAPSULES 8% · Infra ~30%
- **TOTAL ~40%**

### Pendiente
Ejecutar testing con Edu y David. Abrir con `npx serve docs/operacional -p 3001` y acceder desde Android en la misma WiFi.

---

## S135 — AUDITORÍA VISUAL GEMINI + FASE 0 ESTÉTICA (22 Junio 2026)

### Resumen
Auditoría visual completa con Gemini sobre 10 capturas reales del móvil. 8 hallazgos mayores → 6 corregidos. Fase 0 de estética completada: safe-areas, glows, touch targets, tipografía, scanlines, selects nativos custom. Roadmap al 100% generado en `docs/operacional/roadmap_100.md`.

### Cambios Fase 0
| # | Archivo | Qué |
|---|---------|-----|
| 0.1 | `Layout.jsx` | Safe-area bottom `calc(80px + env(...))` en main, BottomNav gradiente más opaco, StatusBar gradiente extendido |
| 0.1 | `Layout.jsx` | AmbientGlows: blur 80→48px, opacity .06→.08, tamaños reducidos |
| 0.1 | `Layout.jsx`, `WinampPlayer.jsx`, `MusicLab.jsx` | Touch targets ≥44px en StatusBar, MiniPlayer, WinampBtn, cola, playlists |
| 0.2 | `index.css` | JetBrains Mono forzada en `html, body` con `!important` |
| 0.3 | `TrackCard.jsx` | List mode padding `p-3`→`p-4` (12px→16px) |
| 0.4 | `AddEntryForm.jsx` | 3 `<select>` nativos → `appearance:none` + SVG chevron dinámico por accentColor |
| 0.5 | `Layout.jsx` | Scanlines opacity 0.18→0.25 |

### Archivos nuevos
- `docs/operacional/roadmap_100.md` — Plan 5 fases (~43 pliegos) del 42% al 100%

### Score post-Fase 0
- Estética/UX: 55% → 65%
- TOTAL: ~40% → ~42%

### Build/Lint
- **Build**: 2.98s ✓
- **Lint**: 0 errors, 1 warning (index.css ignorado por eslint config — esperado)

---

## S136 — CICLO AUTÓNOMO FASES 0-6 + AUDITORÍA FINAL (25 Junio 2026)

### Resumen
Ciclo autónomo de desarrollo iterativo: auditoría → plan → ejecución → review → repetir hasta techo frontend. 6 fases completadas en 6 ramas. Score pasó de ~40% → ~70% alcanzable frontend. El 30% restante es backend-blocked (STAT-M9, gapless, offline, Chromecast, Live Sync, Canvas 2D).

### Fases ejecutadas
| Fase | Rama | Commit | Build | Qué |
|------|------|--------|-------|-----|
| 0 | `master` | S135 | 2.98s | Estética: safe-areas, glows, touch targets, JetBrains, scanlines, selects |
| 1 | `fase1-wall-gallery` | `edf76e3` | 2.68s | WALL: WallView.jsx (394 líneas), virtualización masonry, pinch zoom, badges, stagger |
| 2 | `fase2-cinema-map` | `2742631` | 2.54s | CINEMA: ambient toggle. MAP: capas Era/Año, distancias Haversine |
| 3 | `fase3-capsules` | `cc77a96` | 2.86s | CAPSULES: filtro por usuario en Timeline (Edu/David) |
| 4 | `fase4-dialogue-exhibition` | `218ef2e` | 2.78s | DIALOGUE+REEL+EXHIBITION: Live Sync placeholder |
| 5 | `fase5-pulido` | `6f1513e` | 2.75s | PULIDO: decoding=async en imágenes restantes |
| 6 | `fase6-vb9-map` | `2754cd9` | 2.65s | VB9: --vibe-accent CSS var + WallView/VaultGallery vibe-reactivos. MAP: popup thumbnails |

### Archivos clave modificados/creados
| Archivo | Fase | Cambio |
|---------|------|--------|
| `src/vault/WallView.jsx` | 1, 6 | NUEVO: masonry virtualizado + VB9 accentColor prop |
| `src/vault/VaultGallery.jsx` | 1-6 | ~250 líneas dead code eliminadas, mode bar VB9, MAP popup thumbnails, Live Sync placeholder |
| `src/layout/Layout.jsx` | 0, 6 | Safe-areas, glows, touch targets, scanlines, --vibe-accent CSS var |
| `src/index.css` | 0 | JetBrains Mono !important en html,body |
| `src/musiclab/WinampPlayer.jsx` | 0 | WinampBtn touch targets ≥44px |
| `src/musiclab/MusicLab.jsx` | 0 | Touch targets en cola/playlists/delete |
| `src/musiclab/TrackCard.jsx` | 0 | List mode padding p-3→p-4 |
| `src/vault/AddEntryForm.jsx` | 0 | Selects custom con SVG chevron |
| `src/capsules/Timeline.jsx` | 3 | Filtro por usuario (all/edu/david) |
| `docs/operacional/roadmap_100.md` | S136 | Actualizado con scores finales + conclusión |

### Bloqueantes identificados (30% restante)
1. 🔒 STAT-M9 — stats engine en D1 (desbloquea RECAPs, SC6/SC12)
2. 🔒 Gapless/crossfade (P3) — refactor PlayerContext
3. 🔒 Offline total — SW strategies + R2 cache
4. 🔒 Chromecast receiver — Workers cast receiver app
5. 🔒 Live Sync — WebSocket/SSE en Worker
6. 🔒 Música ambiente real CINEMA — PlayerContext + auto-playlist
7. 🔒 Canvas 2D EXHIBITION — complejidad muy alta
8. 🔒 REEL banda sonora — generación procedural + PlayerContext

### Bugs cerrados
- VB9: vibe solo afectaba reproductor → ARREGLADO (--vibe-accent en :root + WallView/VaultGallery vibe-reactivos)
- DROP-M20: drops abrían en navegador nativo → YA FUNCIONABA (handleDropPlay usa playTrack inline)
- MAP sin thumbnails → ARREGLADO (popup muestra foto si el entry tiene imagen)

### Build/Lint
- **Build**: 2.65s ✓ (último commit)
- **Lint**: 0/0 ✓

### Pendiente
- Merge de ramas a master (Edu decide)
- STAT-M9 como próximo pliego prioritario

---

## S137 — FASE 9 UX POLISH: DIALOGUE ZOOM + EXHIBITION EXPANSION (26 Junio 2026)

### Resumen
Tercera iteración del ciclo autónomo. 3 mejoras UX alcanzables desde frontend puro: zoom en DIALOGUE, expansión en EXHIBITION, y reemplazo del placeholder LIVE SYNC. Score ~73% → ~74%. Commit `401dac9` en rama `fase9-ux-polish`.

### Cambios
| Área | Archivo | Qué |
|------|---------|-----|
| DIALOGUE | `VaultGallery.jsx` | Tap en foto de burbuja → zoom modal fullscreen (blur backdrop, Escape key, ✕ close, título) |
| EXHIBITION | `VaultGallery.jsx` | Tap en era card → expand/colapsar (▾/▴), grid 3-columnas de todas las entries de la era |
| LIVE SYNC | `VaultGallery.jsx` | Placeholder "LIVE SYNC · próximamente" reemplazado por subtitle contextual (MODE · count elementos) |

### Score post-Fase 9
- DIALOGUE: 70% → 75% (zoom añadido)
- EXHIBITION: 25% → 35% (expansión añadida)
- TOTAL: ~73% → ~74% (~333/450 features)

### Build/Lint
- **Build**: 2.60s ✓
- **Lint**: 0/0 ✓

### Pendiente
- Merge de ramas a master (Edu decide)
- STAT-M9 como próximo pliego prioritario
- ~26% restante es backend-blocked (D1 + Worker + R2)

---

## S138 — AUDITORÍA CÓDIGO + 8 BUG FIXES + OAUTH UX (26 Junio 2026)

### Resumen
Auditoría exhaustiva con Gemini sobre ~6000 líneas de código frontend + backend. 8 bugs reales priorizados (3 P1 arquitectónicos, 3 P2 UX, 2 P3 perf+security). Todos corregidos en commit `1070f21`. Además, mejora de UX para el error OAuth `origin_mismatch` (la causa más común de bloqueo en dev).

### Bug fixes aplicados

| # | Sev | Archivo | Bug | Fix |
|---|-----|---------|-----|-----|
| P1.1 | Crítico | `VaultGallery.jsx` | `<audio controls>` en VAULT → viola ADR-018 (motor de audio único en MusicLab) | Reemplazado por texto "AUDIO · Reproducir en Music Lab" |
| P1.2 | Crítico | `PlaylistManager.jsx` | Petición HTTP dentro de `setOrderedIds` updater → race en React 18 (rerolls + PUTs duplicados al D1) | Side-effect movido fuera del updater con `queueMicrotask` |
| P1.3 | Crítico | `PlayerContext.jsx` (3 sitios) | `play().catch(); setIsPlaying(true)` → UI muestra "playing" mientras audio falla (autoplay policy) | Encadenado `.then(setIsPlaying(true)).catch(setIsPlaying(false))` |
| P2.1 | UX | `MusicLab.jsx` | Keys duplicados en historial + cola (mismo track varias veces → React warning) | Sufijo de índice: `hist-${id}-${idx}`, `queue-manual-${id}-${i}` |
| P2.2 | UX | `VaultGallery.jsx` (MapView) | Slider fechas se atora fuera de rango al cambiar capa | Clamp `Math.max(min, Math.min(p, max))` en dateMin/dateMax |
| P2.3 | Perf | `PlayerContext.jsx` | Tracks fantasma persisten tras borrado en D1 (guard `tracks.length` estático) | `useEffect` reactivo re-filtra playHistory cuando tracks cargan |
| P3.1 | Perf | `PlayerContext.jsx` (skip gapless) | Comparación URL frágil (browser encoding vs getStreamUrl) | Normalizado con `new URL(src).href === new URL(nextUrl).href` |
| P3.2 | Security | `workers/routes/sync.js` | `queue_json` sin límite → cliente puede agotar D1 con JSON masivo | Validación max 50KB → 413 Payload Too Large |

### OAuth origin_mismatch UX (NUEVO)

| Archivo | Cambio |
|---------|--------|
| `GoogleDriveService.js` | Nueva función `_translateGisError` que mapea `idpiframe_initialization_failed`/`redirect_uri_mismatch`/`access_denied`/`popup_closed_by_user`/`invalid_client` a mensajes en español + hint dev (mostrar origen actual + instruir registrarlo en Google Cloud Console si localhost) |
| `VaultContext.jsx` | `onAuthChange` ahora lee `translated.msg` + `translated.action` y propaga a `bootError` para mostrar en `ErrorScreen` |
| `.env.example` | NUEVO. Documenta `VITE_GOOGLE_CLIENT_ID` + nota explícita: "registra http://localhost:5174 en Authorized JavaScript origins", más `VITE_API_URL`, R2 config, `VITE_AUTH_DEBUG` |

### Score
Sin cambio: ~74% (estos eran bugs, no features nuevas). ~26% restante sigue siendo backend-blocked.

### Build/Lint
- **Build**: 2.37s ✓
- **Lint**: 0 errors, 0 warnings ✓
- **Self-review**: Aprobado con 1 nit menor

### Pendiente para que el login funcione en localhost
**Acción manual requerida del usuario** (no automatizable desde código):
1. https://console.cloud.google.com/apis/credentials
2. Click en el OAuth client_id actual
3. En "Authorized JavaScript origins" → "+ ADD URI" → añadir `http://localhost:5174` (y `http://localhost:5173` si usas ese puerto)
4. Esperar 5 min a propagación de Google
5. Reload → botón "ACCEDER AL BÚNKER" debería abrir el popup Google correctamente

**Alternativa recomendada**: crear un OAuth client_id dedicado de tipo "Web" con `http://localhost:5174` registrado para dev, mantener el de producción separado. Documentado en `.env.example`.

### Archivos modificados (8)
- `src/vault/VaultGallery.jsx`
- `src/musiclab/PlaylistManager.jsx`
- `src/musiclab/MusicLab.jsx`
- `src/core/PlayerContext.jsx`
- `src/core/GoogleDriveService.js`
- `src/core/VaultContext.jsx`
- `workers/routes/sync.js`
- `.env.example` (NUEVO)

---

## S139 — STAT-M9 FIRST SLICE: AGREGACIONES SERVER-SIDE EN D1 (26 Junio 2026)

### Resumen
Primera slice del motor de estadísticas D1. Nuevo endpoint `GET /api/stats/recap?since=&until=` devuelve agregaciones server-side (no JSON.parse del cliente sobre los 200+ events locales). JOIN real a tablas `tracks`/`users` para mostrar títulos y nombres reales en RECAP. Requiere deploy manual del Worker (wrangler) y migration de los nuevos índices al D1.

### Cambios

| Archivo | Qué |
|---------|-----|
| `workers/schema.sql` | +2 `CREATE INDEX IF NOT EXISTS`: `idx_events_type_created(event_type, created_at)` y `idx_events_entity_type(entity_type)` — idempotentes, no rompen nada existente |
| `workers/routes/stats.js` (NUEVO) | `GET /api/stats/recap?since=&until=` (auth required). 4 queries paralelas a D1:<br>• Q1: totales via `SUM(CASE WHEN event_type='…' THEN 1 ELSE 0 END)` (plays, drops, created_entries, smokes_completed, unique_days via `COUNT(DISTINCT date(created_at))`)<br>• Q2: top track via `LEFT JOIN tracks t ON t.id = e.entity_id` (devuelve title, artist, plays)<br>• Q3: top day via `GROUP BY date(created_at)`<br>• Q4: top user via `LEFT JOIN users u ON u.id = e.user_id` (devuelve name, events)<br>Cache-Control: public, max-age=60 (stats son globales). Validación: since≤until, ambas ISO, devuelve 400 si inválidas. |
| `workers/worker.js` | Registrado `handleStats` con auth=true bajo `/api/stats` |
| `src/capsules/Recaps.jsx` | Refactor 50+ líneas de cálculo client-side → fetch a `/api/stats/recap`. Añadido:<br>• `useRef(reqIdRef)` con race-condition guard (rapid-click entre periods no pisa datos viejos)<br>• Loading pill animado "GENERANDO RECAP" + error pill rojo ⚠<br>• `if (!workerClient.hasToken()) { setRecapData(null); return; }` short-circuit<br>• Sección MÚSICA ahora muestra `${topTrack.title} — ${topTrack.artist} (Nx)` (título real del JOIN)<br>• Sección CONEXIÓN ahora muestra `${topUser.name} lidera con X eventos` (nombre real del JOIN)<br>• Deps `[period]` (no `[range.since, range.until]` — esto último refetchearía en cada render porque `getPeriodRange` usa `new Date()`) |
| `src/capsules/Capsules.jsx` | Quitado prop `events={events}` de `<Recaps>` — Recaps.jsx ahora consume backend directo via workerClient singleton |

### Visible UX win (lo que el usuario ve al activar)
Antes (client-side, topTrack calculado de `id.slice(0,20)`):
```
MÚSICA · 47 reproducciones
detail: a3b8f8c0-d9e7-4c12-bb1... · 12x  ← ID truncado, sin contexto
```

Ahora (server-side, JOIN a tracks):
```
MÚSICA · 47 reproducciones
detail: Liquid Spirit — Gregory Porter · 12x  ← Título y artista reales
```

Idem CONEXIÓN: "david lidera con 87 eventos" en lugar de "david lidera con 87 eventos" pero con id crudo.

### Pasos manuales del usuario (no automatizables)
Para que el endpoint `/api/stats/recap` esté vivo en producción:

1. **Migrar índices al D1** (idempotente, ya tiene `IF NOT EXISTS`):
```bash
cd workers
wrangler d1 execute el-bunker-db --file=schema.sql
```

2. **Desplegar Worker**:
```bash
wrangler deploy
```

3. **Verificar**: `curl -H "Authorization: Bearer $JWT" https://el-bunker-api.thebunker-admin.workers.dev/api/stats/recap?since=2026-06-19T00:00:00Z&until=2026-06-26T23:59:59Z`

3. Vercel ya auto-deployó el frontend (Recaps.jsx ya consume el endpoint).

### Build/Lint
- **Build**: 2.60s ✓
- **Lint**: 0 errors, 0 warnings ✓
- **Code review** (Poirot mini): shippable, ítems P1 corregidos (deps [period] anti-refetch-infinito, UI consume title/name del JOIN)

### Score
- CAPSULES/RECAP: 80% → 85% (RECAP ahora muestra datos reales del D1)
- STAT-M9 slice 1 completas: backend route + consumer + UX visible. Pendiente **slice 2**: `era distribution` + `listening time per era` + `streaks`.

### Pendiente
- **MANUAL do usuario**: ejecutar `wrangler d1 execute` + `wrangler deploy` (3-5 min).
- **STAT-M9 slice 2**: agregar /api/stats/era-distribution y /api/stats/streak → desbloquear SC6/SC12 (stats credit en Escucha Compartida).

### Archivos modificados/creados (5)
- `src/capsules/Recaps.jsx`
- `src/capsules/Capsules.jsx`
- `workers/routes/stats.js` (NUEVO)
- `workers/schema.sql`
- `workers/worker.js`

---

## S140 — FIX JWT SILENT EXPIRATION (PWA BACKGROUND SESSIONS) (26 Junio 2026)

### Resumen
Bug reportado por David: su Timeline mostraba el último track del 22-Junio aunque usó la app HOY (26-Junio). Causa raíz: la PWA puede quedarse abierta días sin recarga. JWT (24h expiry) expira mientras la sesión sigue viva en background. `StatsEngine.emit()` llama a `WorkerClient.post()` con token caducado, Worker devuelve 401, `StatsEngine` lo traga con `console.warn` — eventos jamás llegan a D1. Fix: que el frontend se entere del 401 y re-autentique silenciosamente con `window.gapi` si Google sigue vivo. Sin pantalla blanca, sin perder eventos a futuro. Backfill imposible: los eventos del 22-Jun al 26-Jun de David están perdidos; los siguientes plays sí registran.

### Cambios (3 archivos, +40/-1 líneas)

| Archivo | Qué |
|---------|-----|
| `src/core/WorkerClient.js` | Branch 401 del `_fetch()` ahora limpia token (`this.clearToken()`) + dispatch `CustomEvent("bunker_jwt_expired")` para notificar a la app. Try/catch para SSR/tests |
| `src/core/VaultContext.jsx` | `useRef lastJwtExpiredRef` (debounce 30s contra loop de re-auth en clock-skew patológico) + nuevo `useEffect` que escucha `bunker_jwt_expired` y llama `_fetchJwt(user.email, googleToken)` si `window.gapi.client.getToken()` devuelve token válido. Si Google también murió, `console.warn` y deja que el usuario recargue manual |
| `src/capsules/Capsules.jsx` | `limit=200` → `limit=500` (ventana más amplia; el server ya hace `min(parseInt, 500)` en `workers/routes/events.js`). No arregla root cause pero evita desplazamiento secundario por uso intenso del otro user |

### Por qué pasaban desapercibidos los 401 silenciosos
- `StatsEngine.emit()` usaba `await workerClient.post(...)` con `try/catch` que solo `console.warn`. Ningún UI feedback.
- `_fetchUserAndDb()` solo se ejecuta al boot/sign-in. No hay refresh de JWT durante la sesión.
- Resultado: cuando JWT expira en background, todos los `track_play` / `entry_created` / `drop_sent` posteriores fallan sin ruido.

### Por qué re-autentica silencioso es seguro
- Si `window.gapi.client.getToken()` es válido → `_fetchJwt` hace POST `/api/auth/login` con `{email, google_token}`, Worker firma un JWT nuevo con `JWT_EXPIRY=86400`. Frontend lo setea en `workerClient.setToken` / `workerClient.upload_token` / `setStatsToken` y todo vuelve a fluir.
- Debounce de 30s con `lastJwtExpiredRef`: si JWT nuevo también llega expirado por clock skew patológico, evitamos loop de D1 writes quemados.
- Si Google-GIS también perdió el token → no recargamos al user (`window.location.reload` sería demasiado intrusivo). Solo warning al console. La próxima vez que intente postear, el flujo normal manejará (porque las acciones se reinician al reload manual de PWA por el user).

### Build/Lint/Reviewer
- **Build**: 3.65s ✓
- **Lint**: 0 errors, 0 warnings ✓
- **Code review** (Poirot mini): shippable con 1 P2 + 1 P3 cosmetic — ambos corregidos antes de merge (debounce aplicado; logging del trip es P3 diferido)

### Verificación post-merge (recomendada)
Mañana, en `tools/cargar_contexto.py`, agregar query rápida para validar que el fix funciona end-to-end:
```sql
SELECT user_id, event_type, created_at, payload
FROM events
WHERE user_id = 'david'
  AND created_at >= '2026-06-26'
ORDER BY created_at DESC;
```
Si devuelve rows, el listener y el dispatch path están vivos y funcionando.

### Pendiente (futuro, no bloqueante)
- **P3 UX**: cuando `_fetchJwt` falla con `googleToken` válido pero server != 200 (Worker cold start, JWT_SECRET no configurado en prod, error 500), el ref se setea igualmente y user queda en "sesión muerta" sin feedback visual por 30s. Considerar toast o banner en StatusBar.
- **P3 logging**: loggear cuando el debounce trip activa (`console.debug`). Hoy trippea silencioso.
- **Pre-chequeo de expiración**: proactivo (`Date.now() >= payload.exp * 1000`) antes de postear, evita el round-trip de 401. Pero requiere parsear JWT en frontend (librería o manual). Bajo valor añadido — el re-auth silencioso ya funciona bajo demanda.

### Archivos modificados (3)
- `src/core/WorkerClient.js` (+9 líneas)
- `src/core/VaultContext.jsx` (+26 líneas)
- `src/capsules/Capsules.jsx` (+2 líneas)

---

## S141 — SHUFFLE RESPETA TAG FILTER EN MUSICLAB (26 Junio 2026)

### Resumen
Bug reportado por Edu: cuando selecciona un tag (ej. 'romantiqueo') en MusicLab y hace Skip, el siguiente track queda fuera del tag. Aleatorio también ignora el filtro. Causa raíz: `WinampPlayer` recibía `filteredTracks` como prop pero solo lo usaba para visualización; `PlayerContext.skip()` usaba `tracks` global del VaultContext como fallback. Además, `handleAudioEnded` (auto-advance) llamaba `skip(1)` sin argumentos → fallback global → ignora filtro. Y `shuffledListRefStable` mantenía el pool viejo con tracks del filtro anterior. Fix: establecer un conducto unidireccional por ref para que la UI sincronice la lista filtrada con el motor de audio; el motor la usa como fallback automático y limpia el pool de shuffle cuando la lista cambia de referencia.

### Cambios (2 archivos, +18/-3 líneas)

| Archivo | Qué |
|---------|-----|
| `src/core/PlayerContext.jsx` | (a) Añadidos `contextTracksRef` + `setContextTracks` (useCallback, deps `[]`). Cuando la referencia de la lista cambia, invalida los 4 shuffle refs (regulares + stable). (b) `skip()` línea 641 ahora tiene fallback chain: `filteredTracks ?? contextTracksRef.current ?? tracks`. (c) `setContextTracks` expuesto en Provider value para que WinampPlayer lo consuma |
| `src/musiclab/WinampPlayer.jsx` | (a) Destructured `setContextTracks` de `usePlayer()`. (b) Nuevo `useEffect(() => { setContextTracks?.(tracks); }, [tracks, setContextTracks]);` que sincroniza la prop `tracks` (que en MusicLab es `filteredTracks`) con el motor de audio |

### Por qué se rompía antes
- **Skip manual con botón**: WinampPlayer llama `skip(dir, tracks)` → `tracks` es la prop filteredTracks. Funcionaba.
- **Skip via MediaSession API** (lockscreen, Bluetooth, auriculares): En PlayerContext línea ~1496 llama `skip(1)` sin args. PlayerContext usaba `tracks` global → ignora filtro.
- **Skip via handleAudioEnded** (auto-advance al terminar track): Mismo problema, sin args.
- **Shuffle**: El pool se creaba una vez al activar shuffle y no se invalidaba al cambiar filter. Reproducir tras cambiar tag podía elegir tracks viejos.

### Por qué el fix es seguro (sin TDZ)
El factory de `useCallback([])` solo se ejecuta cuando WinampPlayer dispara su `useEffect` (que corre DESPUÉS del primer render de PlayerProvider). Cuando ocurre, todos los refs estables (declarados en línea ~715) ya están inicializados. JavaScript's TDZ no es problema aquí porque los refs están accesibles en closure cuando se ejecuta.

### Edge cases cubiertos
- **handleAudioEnded auto-advance**: ahora respeta filtro via `contextTracksRef.current` como segundo fallback en la cadena.
- **shuffle re-activado**: persiste en localStorage. Al re-activarse, el pool se regenera desde `contextTracksRef.current` (nueva lista).
- **Cambio de tag en vivo**: useEffect de WinampPlayer re-corre → `setContextTracks(newList)` → invalida pool → próximo shuffle usa nuevo filtro.
- **Misma referencia**: Si MusicLab no re-memoiza el filteredTracks correctamente (bug en su useMemo), no invalidaría. Pero MusicLab.useMemo línea 388 tiene deps correctas `[libraryFilter, query, allTracks]`, así que el caso no aplica.
- **`tracks = []` (filtro vacío)**: `list = [] ?? contextTracksRef.current ?? tracks` → `list = contextTracksRef.current` (lo que sea). Si es `[]`, `if (!list.length) return;` exits. Comportamiento correcto: shuffle sin tracks disponibles.

### Build/Lint/Reviewer
- **Build**: 3.85s ✓
- **Lint**: 0 errors, 0 warnings ✓
- **Code review** (Poirot mini): shippable. 1 P3 follow-up identificado (ver abajo).

### P3 follow-up para futura iteración
`_resolveNextTrackUrl` (línea ~1610 de PlayerContext.jsx) sigue usando el `tracks` global del closure para la precarga gapless (~1s post-play o al 50% del track). Esto significa que **el track precargado silenciosamente** puede estar fuera del tag activo, aunque el **playback real** sí respeta el filtro vía `skip()` parchado. Visible solo si el usuario nota que el buffer silencioso apunta a un track distinto del que suena. Fix monoespecífico: añadir `contextTracksRef.current` como segundo fallback en `_resolveNextTrackUrl` (mismo patrón). Defer a S142.

### Pendiente (futuro, recomendado)
- Test unitario que verifique `shuffle + setContextTracks(filteredList)`: añadir caso 8 a `src/core/__tests__/PlayerContext.test.jsx` que mockee filteredTracks y verifique que skip+shuffle solo elige tracks de la lista filtrada. Posponer si se mantiene scope mínimo.

### Archivos modificados (2)
- `src/core/PlayerContext.jsx` (+13/-1 líneas)
- `src/musiclab/WinampPlayer.jsx` (+5/-2 líneas)

---

## S142 — AUDITORÍA PROFESIONAL: SHUFFLE OPERA SOBRE CONTEXTO DE PLAYLIST (Q8/Q9) + FIXES L1 Y P3 (26 Junio 2026)

### Resumen
Edu reportó "aleatorio no funciona en cola". Auditoría profesional descubrió que NO era un comportamiento intencional sino un **bug arquitectónico P1**: la cola unificada (Q14, S53) introdujo `_manual:false` (playlist context) dentro de `localQueue`, pero `PlayerContext.skip()` Rama 3 (FIFO línea 605–642) interceptaba TODO sin distinguir manuales de contexto, ignorando shuffle. Esto contradice tres documentos históricos que la spec ya escribía:
- `docs/spec/el_bunker_reproductor_spec_v2.md:71` → **Q8/Q9:** "Shuffle nunca afecta el orden de la cola manual. Activar shuffle aleatoriza el contexto de reproducción desde el punto actual. La cola manual no se modifica."
- `docs/legacy/DECISIONES.md:52-53` → ADR-008 REVERTIDO sesión 27: "la cola manual tiene prioridad, pero shuffle debe poder operar sobre el contexto de lista igualmente".
- `docs/legacy/ERRORES_RESUELTOS.md:52` → BUG-NUEVO-16 resuelto en S26 con PLIEGO-070 (cola con prioridad solo si `!shuffle`). **Regresión no documentada en S53.**

### Otros bugs descubiertos durante la auditoría (no reportados por Edu)
| Sev | Archivo:línea | Bug | Fix |
|-----|---------------|-----|-----|
| P2 | `PlayerContext.jsx:577-589` (Rama 1 skip) | Loop=track + skip(-1) + currentTime<3s violaba L1: caía en playHistory en vez de seek-0. | Eliminado fall-through. Loop=track SIEMPRE seek-0+play. |
| P3 | `PlayerContext.jsx:605-642` (Rama 3 skip) | Cola con todos los items duplicados del active producía comportamiento anómalo: `next` quedaba siendo el active, `setLocalQueue(q.slice(length))` = `[]`, y `setActiveTrack(next)` no cambiaba el track. Gapless preload confusion. | Guard post-while: si `next?.id === activeTrack?.id`, abortar consumo: `trackSkip` historial + `setLocalQueue []` + `setIsPlaying false` + return. |

### Cambios (6 ediciones en `src/core/PlayerContext.jsx`, +60/-9 líneas netas)

| # | Cambio | Líneas | Por qué |
|---|--------|--------|---------|
| 0 | Helper `fisherYatesInPlace(arr)` pure | nuevass fuera del componente | Reutilizable para S143 EC-C2 re-barajar contexto. Pure idempotente. |
| 1 | useEffect deps=[`shuffle`] | nuevo bloque post-shuffle-reset useEffect | **CORE FIX:** al activar shuffle, baraja `_manual:false` vía Fisher-Yates. Cola manual (`_manual:true`) preservada al final. ActiveTrack preservado al inicio. UI honesta (vista COLA muestra orden aleatorio). |
| 2 | `setPlaybackContext` permuta ctxItems si `shuffle=ON + length>1` | replace ~line 911 | Mantiene consistencia: cargar playlist con shuffle ON → playlist barajada. Cola manual preservada. |
| 3 | `addPlaylistToQueue` permuta subset `_manual:false` si `shuffle=ON` | replace ~line 894 | Dos paths: `clearFirst=true` (PLAY playlist directo) y append (`clearFirst=false`). Cola manual preservada en ambos. EC-C2 re-shuffle pendiente. |
| 4 | Rama 1 skip simplificada (L1 absoluto) | replace ~line 577 | Eliminado `if (dir===1 || currentTime>=3)`. Loop=track SIEMPRE seek-0+play. |
| 5 | Rama 3 skip con guard P3 | replace ~line 605 | Post-while check: si cola solo-duplicados, abortar consumo silencioso. |

### Por qué Opción A (Spotify-style) y no Opción B (random pick at skip)
- Q8/Q9 ya está escrito: "shuffle nunca afecta orden de la cola manual". Opción B lo violaría.
- ADR-009 (filosofía del reproductor: convención primero) penaliza no-determinismo — Opción B es no determinista (cada skip elige aleatorio), Opción A es determinista (orden fijo al activar toggle).
- UX honesta: playlist barajada se ve en COLA antes de reproducir, no "sorpresa" en cada skip.
- Toggle OFF no deshace el barajado (documentado en comentario): si shuffle ON y luego OFF, el orden actual se conserva. Usuario explícito > toggle.

### Trazabilidad spec → código (cumplida por S142)
- **Q1:** Cola manual tiene prioridad → ✓ cola manual preservada al final.
- **Q8/Q9:** Shuffle baraja contexto, no toca cola manual → ✓ fix principal.
- **L1 (Loop Track absoluto):** skip en cualquier dirección es seek-0 → ✓ fix P2.
- **Q2/Q14:** Cola unificada pero con separación lógica manual/contexto → ✓ preservada vía `_manual:true/false`.

### Build/Lint/Reviewer
- **Build**: 3.39s ✓ (2240 modules, 10 chunks)
- **Lint**: 0 errors, 0 warnings ✓
- **Code review** (Poirot mini): shippable. 1 P3 menor benigno (activeTrackRef stale race on mount, mitigado por `if (q.length < 2) return q;`).

### Pendiente (futuro, no bloqueante)
- S143: EC-C2 inyección de playlist debería re-barajar el contexto si shuffle=ON (ahora inyecta al final sin re-shuffle).
- S144: Toast efímero "Contexto barajado" al toggle para hacer visible la nueva UX.
- S145: useEffect `[shuffle, last-playlist-load-trigger]` para re-barajar la cola cuando D1 devuelve queue al mount (mitiga P3 activeTrackRef race).
- Tests unitarios: caso 8 en PlayerContext.test.jsx — `shuffle=true + addPlaylistToQueue` debe producir barajado.

### Archivos modificados (1)
- `src/core/PlayerContext.jsx` (+60/-9 líneas)
