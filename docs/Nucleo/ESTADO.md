# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** PLIEGO-231 → Sub-fase 2 MAP (polylines viaje entre same-Era). Tras: PLIEGO-232/233/234其余 sub-fases MAP + PLIEGO-235+ EXHIBITION/REEL/CINEMA premium restantes.
**Nota:** S128/S129 bajas a BACKLOG porque session atajo manualmente por bypass de pliego_apply.py.
**Última sesión:** S130-A Sub-fase 1 — MAP mode premium Leaflet real + CartoDB Dark + clustering + 9 demo entries (MAP 0%→25%). Commit 13e0c74.
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
| **Galería VAULT** | **~50%** | 🟡 MAP Sub-fase 1 hecha (25%); EXHIBITION/REEL/CINEMA siguen placeholder |
| VIZ/Otros | 33% | 🔴 0% implementado |
| **GLOBAL** | **~68%** | (antes decía 92% — inflado) |

### Placeholders activos (texto hardcodeado)
- **EXHIBITION** (VaultGallery.jsx ahora~L763-808): `<div className="flex flex-col gap-5">` — 5%
- **REEL** (VaultGallery.jsx ahora~L828-928): lista flex sin Pin ni banda sonora — 15%
- **CINEMA premium uplit**: swipe+Ken Burns+overlay hecho (~L427-575). Faltan audioguias + crossfade + musica Era — 40%→100% pendiente
- **MAP** (VaultGallery.jsx ahora~L984-1100): 🟢 Sub-fase 1 demo entries. 25% implementación real (Leaflet real con 9 pines hardcoded). SUB-FASE 4 (geocoder real wired AddEntryForm) es lo que llevo MAP a 100%.

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
