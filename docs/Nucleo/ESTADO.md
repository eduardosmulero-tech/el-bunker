# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** Fase 0.4 — Touch targets ≥44px audit.
**Última sesión:** PLIEGO-234-S0.3. Design system creado: `<Button>`, `<Card>`, `<Input>` en `src/core/ui/`.
**Rama activa:** `master`
**Commit:** `89363a5` → S0.2 (safe-area)

---

## 📊 Auditoría real (17 Junio 2026) — con factor premium

| Módulo | % | Gap principal |
|---|---|---|
| Audio engine | 70% | Sin gapless/crossfade |
| VAULT data model | 80% | UI de entrada básica |
| WALL | 35% | Sin virtualización → OOM |
| CINEMA | 18% | Sin música ambiente, audioguías, transiciones |
| MAP | 30% | Sin carrusel, distancias, capas |
| DIALOGUE | 60% | Sin Live Sync |
| EXHIBITION | 6% | Es lista, spec pide canvas 2D |
| REEL | 11% | Sin banda sonora, pinning, animaciones |
| CAPSULES | 8% | Timeline y RECAP no existen |
| Infraestructura | 6% | Offline roto (✅ FIXED S0.1), sin safe areas, sin skeletons |
| **TOTAL** | **~32%** | |

## Bugs activos

### P1
- ~~Offline = blank screen~~ ✅ RESUELTO S0.1 (PRECACHE + sw-assets.json)
- Sin safe-area-inset-* en elementos fijos (PENDIENTE S0.2)

### P2/resto
| Bug | Estado |
|---|---|
| V6 R2 signed URLs | 🟡 DIFERIDO |
| V7 schema constraint | 🟡 DIFERIDO |
| A6 No Molestar | 🟡 DIFERIDO |
| TRACKS-SORT verificar | 🟡 PENDIENTE |
| Sin paginación API | 🟡 PENDIENTE |
| Sin token refresh JWT | 🟡 PENDIENTE |

---

## Build/Lint/Tests
✅ Build ~2.3s · 22 assets en sw-assets.json

---

## Roadmap premium (nuevo)

| Fase | Nombre | Pliegos | Gap |
|---|---|---|---|
| **0** | Cimientos | ~5 | Offline, safe areas, design system, touch targets, skeletons |
| **1** | UX Polish | ~5 | Error boundaries, toast unificado, micro-interacciones, teclado |
| **2** | CAPSULES real | ~4 | Timeline, RECAP, Smoke migration, TimeCapsules DB |
| **3** | Galería premium | ~8 | WALL virt + CINEMA full + MAP full + EXHIBITION canvas + REEL + DIALOGUE Live Sync |
| **4** | Infraestructura | ~4 | Paginación, token refresh, FileUploadService, Stats |
| **5** | Android edge | ~3 | Haptic, OOM, a11y |
