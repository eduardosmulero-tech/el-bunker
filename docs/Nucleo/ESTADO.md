# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** S121-A — S1/S2 posición tracks + S4 sin red → neutral
**Última sesión:** Auditoría specs vs código real — ROADMAP_COMPLETO reescrito
**Rama activa:** `master`

---

## Bugs activos

### P1
ninguno

### P2/resto

| Bug | Estado |
|---|---|
| V6 R2 signed URLs | 🟡 DIFERIDO |
| V7 schema constraint (seen_at <= favorited_at) | 🟡 DIFERIDO |
| A6 No Molestar | 🟡 DIFERIDO (Chromium-only) |
| TRACKS-SORT verificar en dispositivo | 🟡 PENDIENTE |

---

## ESLint
✅ 7 errores src/ (todos pre-existentes: worker.js global `atob`/`crypto`)

## Tests
✅ 12/12 (vitest + jsdom)

## Build
✅ 17.61s · 647 KB JS · 0 errores

---

## S112 — ROADMAP COMPLETADO

| Sesión | Qué | Archivos |
|---|---|---|
| S112-A | 3 P0 audio (B1, B2, B3) | PlayerContext.jsx |
| S112-B | 4 P1 queue/shuffle (B4-B7) | PlayerContext.jsx, MusicLab.jsx |
| S112-D | 12 tests vitest | PlayerContext.test.jsx |
| S113-W | 10/11 Worker security fixes | workers/worker.js |
| S115-D2 | WorkerClient singleton | WorkerClient.js |
| S117 | Token consistency (PURPLE, GLASS_*) | 5 archivos |

---

## S119 — RECAP ANUAL GUARDABLE + JWT CLEANUP

| Sesión | Qué | Archivos |
|---|---|---|
| S119 | Botón "GUARDAR COMO ENTRADA" en RECAP anual | Recaps.jsx |
| S117 | CSP meta tag + GlobalErrorBoundary | index.html, App.jsx |
| S115-D3d | MusicLab WorkerClient migration (12 calls) | MusicLab.jsx, WorkerClient.js |
| — | jwtToken muerto eliminado de Vault + VaultGallery + Capsules | 4 archivos |

## S114-W — WORKER REFACTOR ROUTES/

| Sesión | Qué | Archivos |
|---|---|---|
| S114-W | Worker monolith (600 líneas) → 19 archivos modulares | worker.js + 18 nuevos |
| — | config.js + utils/ (response, auth, rate-limit) | 4 archivos |
| — | routes/ (health, auth, tracks, drops, playlists, tags, entries, eras, files, queue, events, capsules, upload, r2) | 14 archivos |
| — | worker.js dispatcher: 81 líneas con array ROUTES | worker.js (reescrito) |

## S116-L2 — SPLIT APP.JSX

| Sesión | Qué | Archivos |
|---|---|---|
| S116-L2 | BootScreen.jsx (GlobalLoadingScreen + ErrorScreen + PageLoader) | BootScreen.jsx (nuevo) |
| S116-L2 | PageWrappers.jsx (VaultPage + MusicPage + CapsulesPage) | PageWrappers.jsx (nuevo) |
| S116-L2 | TabShell.jsx (AuthenticatedApp + UnauthorizedScreen) | TabShell.jsx (nuevo) |
| S116-L2 | App.jsx reducido: 480→119 líneas | App.jsx (reescrito) |

## 🔍 AUDITORÍA SPECS vs CÓDIGO (16 Junio 2026)

### Hallazgos clave

**✅ Production-ready (28 features):** Infra D1+R2+Worker, WorkerClient, Drive purge, auth JWT, CI/CD, PlayerContext core, Chromecast, soft delete, VAULT CRUD+search, WALL masonry, CAPSULES 4 sub-tabs, Smoke Session, Time Capsules, RECAP, MusicLab tracks/playlists/drops, ErrorBoundary, CSP.

**⚠️ Parcial — UI existe pero no cumple la spec (5):** CINEMA (visor simple, falta swipe+música), DIALOGUE (conteo, falta emparejamiento+hilos), EXHIBITION (cards por Era, falta Canvas 2D), REEL (thumbnails, falta auto-generación), MAP (placeholder "Próximamente").

**🔴 Ausente — 0% (10+ features):** Escucha compartida SC1-SC14, S1/S2 posición tracks, Q6/Q12/Q15 cola avanzada, EC-C2/EC-C3 contexto dinámico, SS-1/SS-4/SS-7/SS-8 Smoke enhancements, ID3 metadata, VAULT 14 categorías.

### Roadmap actualizado: 5 fases, ~46h
- **Fase A** (8h): MusicLab polish — S1/S2, Q6/Q12/Q15, EC-C2/EC-C3, ID3
- **Fase B** (16h): Gallery premium — CINEMA, DIALOGUE, EXHIBITION, REEL, MAP
- **Fase C** (12h): Escucha compartida SC1-SC14
- **Fase D** (6h): Capsules/Smoke — SS-1, SS-4, SS-7, SS-8, rachas
- **Fase E** (4h): Cierre — smoke test completo + fixes

## Próximos pasos
1. **Manual**: commit + push (todo el trabajo acumulado de S114-S120)
2. **Manual Dashboard**: eliminar secret basura en Cloudflare Workers
3. **Manual**: `npx wrangler deploy` — desplegar el worker refactorizado
4. **S121-A**: S1/S2 posición tracks + S4 sin red → estado neutral
