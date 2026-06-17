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

### Bugs resueltos
- Heart en controls bar → movido a header centrado
- `removeFromQueue` no hacía sync → añadido `syncAction`
- Partner listening sin auto-join → `pending_session_id` en presence
- Queue perdida al salir → `queue_json` en DELETE response
- Sin badge de atribución → `_added_by` + color tags

### Bugs activos
- SC6/SC12 (stats credit): bloqueado en STAT-M9
- SC-M19-ANIM (BPM particles): diferido a sesión de diseño

### Pendiente
- Score actual ~78%. Gap principal: stats engine.

## Pendiente Fase 0.4
Touch targets ≥44px audit + fix en toda la app.
