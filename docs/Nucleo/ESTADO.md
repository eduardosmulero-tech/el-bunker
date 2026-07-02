# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** **PLIEGO-235 — FASE A.1 "Cero pantallas rotas"** (ver `docs/operacional/auditoria_fable_1.0.md` §8): Layout.jsx (StatusBar sin solape + pt real + tag_id→label en MiniPlayer) + config.js (cerrar leak presence) + filtro categoría duplicado. Tras aplicar: **`wrangler deploy` manual de Edu** (mata a la vez el leak de /api/config y el 404 de /api/stats/recap).
**Plan vigente hasta v1.0:** `docs/operacional/auditoria_fable_1.0.md` — Fases A→D + checklist cerrada §6. Score real verificado: ~52%.
**Última sesión:** S143 — Fable reverificó la auditoría de Opus: todos los P1/P2/P3 CONFIRMADOS contra código + producción. 2 errores factuales de Opus corregidos (17 tablas, no 13; 16 rutas, no 17). Plan A-D y PLIEGO-235 aprobados.
**Rama activa:** `master`
**Commit:** `d566188` — docs: S142 AUDITORÍA reproductor + Q8/Q9 shuffle fix session log + ESTADO bump

---

## Build/Lint/Tests
✅ **Build 2.60s** · **Lint 0/0** · **Tests: sin cambios**

## Score post-Fase 9 (S137)

| Módulo | Score | Gap | Bloqueo |
|--------|-------|-----|---------|
| Audio Engine | 70% | Gapless/crossfade | 🔒 Backend |
| Escucha Compartida | 85% | STAT-M9 stats credit | 🔒 Backend |
| VAULT Data Model | 80% | UI creación avanzada | 🟡 Frontend |
| WALL | 80% | Pulido animaciones | 🟢 |
| CINEMA | 50% | Música ambiente real | 🔒 PlayerContext |
| MAP | 75% | Pulido | 🟢 |
| DIALOGUE | 75% | Live Sync | 🔒 WebSocket |
| EXHIBITION | 35% | Canvas 2D | 🔒 Complejidad alta |
| REEL | 40% | Banda sonora | 🔒 PlayerContext |
| CAPSULES | 80% | STAT-M9 RECAPs reales | 🔒 Backend |
| Infraestructura | 40% | Offline/paginación | 🔒 Backend |
| Estética/UX | 80% | Micro-interacciones | 🟢 |
| **TOTAL** | **~74%** | **26% backend-blocked** | |

## Bugs activos (verificados en vivo por Fable, 2026-07-02)

### P1 — objetivo de PLIEGO-235 (FASE A)
- **RECAP roto en prod: `/api/stats/recap` → 404** (stats.js commiteado, Worker NO desplegado). Fix: `wrangler deploy` manual.
- **Leak: `/api/config` sin auth devuelve presence_edu/presence_david** (título track + timestamp). `worker.js:47` + `config.js`. Fix seguro: whitelist keys (verificado: nada consume presence vía config).
- **Header "EL BÚNKER" solapado con la fecha** en todas las pantallas (`Layout.jsx` StatusBar).
- **MiniPlayer muestra UUID como tag** (`Layout.jsx:282`, `tag_label` no se setea en ningún sitio).
- **Contenido recortado bajo StatusBar** (`Layout.jsx:577` pt-10=40px vs header ~70-90px).
- **Filtro de categoría DUPLICADO en VAULT** con estados independientes (`Vault.jsx:902` + `VaultGallery.jsx:1224`).

### P1 (backend-blocked, post-Fase A)
- STAT-M9 slice 2: era distribution + listening-time por Era + streaks en D1
- Gapless/crossfade (P3): requiere PlayerContext refactor
- Offline total: SW strategies + R2 cache
- Chromecast receiver: cast receiver app en Workers

### Resueltos recientes
- **S140**: Timeline no registraba eventos para David (último track del 22-Jun aunque usó app hoy 26-Jun). Causa raíz: JWT expiraba silencioso en PWA → StatsEngine.emit() recibia 401swallowed→ eventos jamás llegaban a D1. Fix: WorkerClient dispatcha `bunker_jwt_expired` on 401 + VaultContext listener re-autentica silenciosamente con debounce 30s. PR `67cf81f` ya en master.
- **S141**: Shuffle no respetaba el tag filter activo en MusicLab — al filtrar por 'romantiqueo' y hacer Skip, el siguiente track quedaba fuera del tag. Causa raíz: `WinampPlayer` recibía `filteredTracks` como prop pero solo lo usaba para visualización; el motor de audio en `PlayerContext` usaba `tracks` global del VaultContext. Fix: añadido `contextTracksRef` + `setContextTracks` con invalidación automática del shuffle pool cuando cambia la referencia, y fallback chain `filteredTracks ?? contextTracksRef.current ?? tracks` en `skip()`. PR `d48042d` ya en master.
- **S142**: **Auditoría completa del reproductor.** Edu reportó "aleatorio no funciona en cola". Diagnóstico: `PlayerContext.skip()` Rama 3 (FIFO) interceptaba TODO sin distinguir manuales vs contexto de playlist — CONTRADICE spec Q8/Q9 (`docs/spec/el_bunker_reproductor_spec_v2.md:71`) y `docs/legacy/DECISIONES.md:52-53` (ADR-008 REVERTIDO sesión 27). Regresión de BUG-NUEVO-16 (`ERRORES_RESUELTOS.md:52`, resuelto en S26 con PLIEGO-070) introducida inadvertidamente en S53 al unificar `_manual:false` playlist context dentro de `localQueue` (Q14). Fix: 6 ediciones en `PlayerContext.jsx` — `fisherYatesInPlace` helper (Fisher-Yates puro in-place) + useEffect que permuta sección `_manual:false` al activar shuffle (UI honesta Spotify-style) + `setPlaybackContext` y `addPlaylistToQueue` barajan si shuffle=ON (consistencia con toggle) + fixes P2 (loop=track absoluto L1: skip en cualquier dirección ahora seek-0) y P3 (cola de solo-duplicados del active aborta consumo en silencio). PR `2ebf8bf` ya en master.

### P2/resto (frontend achievable)
- Shuffle Q1/Q8/Q9 → verificado OK en PlayerContext
- AddEntryForm preview + validation → alcanzable frontend
- WALL micro-animaciones → alcanzable frontend
