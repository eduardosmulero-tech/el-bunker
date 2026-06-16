# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** S130-A — Fase 1: MAP (Leaflet pines + líneas viaje + slider temporal)
**Última sesión:** Auditoría REAL specs vs código — porcentaje honesto ~68% (no 92%)
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
| **Galería VAULT** | **35%** | 🔴 4/6 modos placeholder |
| VIZ/Otros | 33% | 🔴 0% implementado |
| **GLOBAL** | **~68%** | (antes decía 92% — inflado) |

### Placeholders activos (texto hardcodeado)
- **MAP** (VaultGallery.jsx L869-880): `<p>Las entradas necesitan coordenadas...</p>` — 0%
- **EXHIBITION** (VaultGallery.jsx L765-802): `<div className="flex flex-col gap-5">` — 5%
- **REEL** (VaultGallery.jsx L805-866): lista flex sin Pin ni banda sonora — 15%

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
