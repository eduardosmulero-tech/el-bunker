# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** S126-A — Fase 1: Galería MAP (Leaflet pines + líneas viaje + slider temporal)
**Última sesión:** Auditoría post-S123: specs vs código real — roadmap al 100% (~19h restantes)
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
| S116-L2 | App.jsx reducido: 480→119 líneas | App.jsx (reescrito) |## 📊 AUDITORÍA POST-S123 — Completitud vs Specs

### ✅ COMPLETO (~92%)
- **MusicLab core:** S1/S2/S4, cola Q6/Q12/Q15, contexto EC-C2/EC-C3, ID3
- **Escucha compartida:** SC1-SC14 (sync endpoint + long-polling + corazón 3 estados)
- **Gallery:** WALL, DIALOGUE (emparejamiento + chat layout + asimetría)
- **Capsules:** Timeline, Smoke Session, Time Capsules CRUD, RECAP
- **Infra:** D1+R2+Worker (15 rutas), WorkerClient, CI/CD, 12 tests

### 🟡 PARCIAL (~5%)
- **CINEMA:** swipe + overlay OK, falta audioguía real + crossfade entre Eras + música Era de fondo
- **EXHIBITION:** grid por Era OK, falta canvas 2D espacial (zoom/pan estilo Miro)
- **REEL:** secuencias auto-generadas OK, falta botón 📌 Pin para guardar como entrada tipo `reel`
- **Time Capsules:** falta selector de contenido + snapshot de playlist
- **SC2:** sync de cola OK, falta avatar/nombre de quién añadió cada track

### 🔴 PENDIENTE (~3% = ~19h)

| Fase | Sesión | Qué | Horas |
|---|---|---|---|
| **1** | S126-A | MAP: Leaflet pines + líneas viaje + slider temporal | 4h |
| **1** | S126-B | CINEMA audio-guía + REEL pinning | 2.5h |
| **1** | S126-C | EXHIBITION canvas 2D (react-zoom-pan-pinch) | 1.5h |
| **2** | S127-A | Time Capsules: selector contenido + snapshot playlist | 3h |
| **2** | S127-B | Drops: fix M20 (in-app vs browser) + snapshots M21 | 3h |
| **3** | S128-A | VIZ: lockscreen wallpaper + animación entrada primer vibe | 3.5h |
| **3** | S128-B | SC2 atribución cola + smoke test 2 dispositivos | 1.5h |

### ⚪ DIFERIDO (decisión consciente)
FLAC/OPUS, DLNA Cast, fusión playlists (EC-LI4), 60+ tipos taxonomía VAULT, live wallpaper lockscreen avanzado

---

## S112 — ROADMAP COMPLETADO (legacy)
