# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** PLIEGO-234 — Sub-fase 5 MAP (privacy mask + advanced manual coords). Tras: PLIEGO-235+ EXHIBITION/REEL/CINEMA premium.
**Última sesión:** S130-D Sub-fase 1-4 completadas en sesión única. MAP al 100% funcional (polylines + slider temp + geocoder Photon/Nominatim + AddEntryForm con buscador de ubicaciones). 2 bugs corregidos (delete track + contador días).
**Rama activa:** `master`
**Roadmap:** 4 fases, ~52h → docs/operacional/ROADMAP_COMPLETO.md

---

## 📊 Auditoría real (17 Junio 2026)

| Área | % | Veredicto |
|---|---|---|
| Infraestructura | 95% | ✅ Sólida |
| Cápsulas | 95% | ✅ Completa |
| MusicLab | 90% | ✅ Base sólida |
| Reproductor visual | 85% | 🟡 Sin auto-activación |
| Escucha Compartida | 80% | 🟡 SC2 = 0% |
| DROPS | 40% | 🔴 M20/M21 rotos |
| **Galería VAULT** | **~65%** | 🟢 MAP Sub-fases 1-4 completas (85%); EXHIBITION/REEL/CINEMA placeholder |
| VIZ/Otros | 33% | 🔴 0% implementado |
| **GLOBAL** | **~72%** | |

### Placeholders activos (texto hardcodeado)
- **EXHIBITION** (VaultGallery.jsx): `<div className="flex flex-col gap-5">` — 5%
- **REEL** (VaultGallery.jsx): lista flex sin Pin ni banda sonora — 15%
- **CINEMA premium uplit**: swipe+Ken Burns+overlay hecho. Faltan audioguias + crossfade + musica Era — 40%→100% pendiente
- **MAP** (VaultGallery.jsx): 🟢 Sub-fases 1-4 completadas (polylines animados + slider temporal ±7% + geocoder Photon+Nominatim + AddEntryForm con buscador + entries reales con lat/lng en content). 85%. Pendiente Sub-fase 5 (privacy mask).

---

## Bugs activos

### P1
ninguno

### P2/resto

| Bug | Estado |
|---|---|
| V6 R2 signed URLs | 🟡 DIFERIDO |
| V7 schema constraint | 🟡 DIFERIDO |
| A6 No Molestar | 🟡 DIFERIDO (Chromium-only) |
| TRACKS-SORT verificar | 🟡 PENDIENTE |
| ~~VISUALIZER-MODE-NOT-DEFINED~~ | ✅ RESUELTO S124 (17 Junio) |
| ~~DOUBLE-VOLUME-BAR-SMOKE~~ | ✅ RESUELTO S126 (17 Junio, commit b7f3ff7) |
| ~~PLAY-BUTTON-REDUNDANT~~ | ✅ RESUELTO S126 (outlined cuando !running) |
| ~~VAULT-DETAIL-ROW-DENSE~~ | ✅ RESUELTO S126 (S97 quitado + slice 2 + mobile buttons) |

---

## Build/Lint/Tests
✅ Build ~2.6s · ESLint 7 warnings (pre-existentes: worker.js global) · Tests 12/12

---

## Roadmap rápido (detalle en ROADMAP_COMPLETO.md)

| Fase | Nombre | Horas | Gap principal |
|---|---|---|---|
| **1** | 🏛️ La Galería que Prometimos | 22h | MAP+EXHIBITION+REEL+CINEMA |
| **2** | 💞 Lo que Nos Conecta | 12h | DROPS+SC2+VIZ |
| **3** | ✨ Brillo Premium | 10h | Pulido+Ambiental+Cápsulas |
| **4** | 🚀 Entrega | 8h | Smoke test+Deploy+Docs |
