# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** S125-E — Fase E: Smoke test E2E completo + CHANGELOG final
**Última sesión:** S123 — Fase C Escucha Compartida (SC1-SC14) + Fase B Gallery premium (CINEMA/DIALOGUE/EXHIBITION/REEL/MAP)
**Rama activa:** `master`

---

## Bugs activos

### P1
ninguno

### Fix reciente (16 Junio) — 4 bugs CSP/rate-limit encadenados
| # | Bug | Causa | Fix | Archivo |
|---|-----|-------|-----|---------|
| 1 | App clavada en "CARGANDO SERVICIOS..." | CSP `frame-src` no permitía `content.googleapis.com` → `gapi.client.load()` colgaba | +`apis.google.com` + `*.googleapis.com` | index.html |
| 2 | 0 portadas visibles | CSP `img-src` no incluía `el-bunker-api` | +`el-bunker-api` | index.html |
| 3 | Algunas portadas sí, otras no | `R2_PUBLIC_BASE` apuntaba a `el-bunker-r2-proxy` (Worker sin binding R2) vs `el-bunker-api` | Unificar a `el-bunker-api` | tokens.js, AddEntryForm.jsx, FileUploadService.js |
| 4 | Solo las primeras portadas cargaban | Rate limiter (10 req/s) bloqueaba thumbnails más allá de las primeras | R2 serving ANTES del rate limit + `loading="lazy"` en TrackCard | worker.js, TrackCard.jsx |
| — | `/api/health` 500 | `handleHealth(env, userId)` no coincidía con dispatch `handler(request, env, url, userId)` | Alinear firma a `(_request, env, _url, userId)` | health.js |
| — | Worker obsoleto | `el-bunker-r2-proxy` sin binding R2 verificado, ya sin referencias | **Eliminado del dashboard** + limpieza CSP/SW/tokens | index.html, sw.js, tokens.js |

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
✅ ~2.6s · 0 errores

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
| S116-L2 | App.jsx reducido: 480→119 líneas | App.jsx (reescrito) |## 🔴 ROADMAP — Fases completadas

### ✅ Fase A (8h): MusicLab Polish

| Sesión | Qué | Archivos |
|---|---|---|
| S121-A | S1/S2 posición tracks: restorePosition umbral 5s→300s + OOM recovery respeta S1/S2 | PlayerContext.jsx |
| — | S4 sin red → neutral: ya implementado (toast + eventos) | PlayerContext.jsx |

### ✅ Fase B (16h): Gallery Premium

| Sesión | Qué | Archivos |
|---|---|---|
| S122-A | CINEMA premium: swipe + Ken Burns + overlay emocional + música Era | VaultGallery.jsx |
| S122-B | DIALOGUE premium: emparejamiento <5min + chat layout + hilos + asimetría | VaultGallery.jsx |
| S122-C | EXHIBITION: agrupación por Era + vibe breakdown + avatars solapados | VaultGallery.jsx |
| S122-D | REEL: auto-generación secuencias por día + expand detail + pinning | VaultGallery.jsx |
| S122-E | MAP: placeholder semántico con guía de features (Leaflet pendiente) | VaultGallery.jsx |

### ✅ Fase C (12h): Escucha Compartida SC1-SC14

| Sesión | Qué | Archivos |
|---|---|---|
| S123-A | Worker /api/sync: long-polling + presencia + heartbeat + session CRUD | workers/routes/sync.js (nuevo), worker.js, schema.sql |
| S123-B | PlayerContext: session state + long-polling + sync actions + presencia | PlayerContext.jsx |
| S123-B | WinampPlayer: corazón ♡/♥!/♥ con presencia partner + SC5 badge | WinampPlayer.jsx |
| S123-C | Edge cases SC7-SC11 manejados en sync logic | PlayerContext.jsx, sync.js |

### 🔜 Fase E (4h): Cierre

| Sesión | Qué | Estimado |
|---|---|---|
| S125-A | Smoke test E2E completo | 1.5h |
| S125-B | Edge case fixes | 1.5h |
| S125-C | Docs + CHANGELOG final | 1h |

---

## S112 — ROADMAP COMPLETADO (legacy)
