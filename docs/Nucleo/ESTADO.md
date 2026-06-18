# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** Testing checklist con usuarios (Edu y David).
**Última sesión:** S133 — Estabilización pre-testing S0.6. Lint 0, build 2.2s, runtime fixes.
**Rama activa:** `master`
**Commit:** `f86a1a4` — S0.6: Estabilización pre-testing — lint 0, build 2.2s, runtime fixes

---

## Build/Lint/Tests
✅ **Build 2.22s** · **Lint 0/0** · **Tests 12/12**
✅ Vercel desplegando desde master

## Bugs activos

### P1
- SC6/SC12 stats credit: bloqueado en STAT-M9 (stats engine)
- WALL OOM sin virtualización (35%)
- CINEMA (18%) sin música ambiente/transiciones
- Timeline y RECAP (8%) no existen
- Sin paginación API

### P2/resto
| Bug | Estado |
|---|---|
| V6 R2 signed URLs | 🟡 DIFERIDO |
| V7 schema constraint | 🟡 DIFERIDO |
| A6 No Molestar | 🟡 DIFERIDO |
| TRACKS-SORT verificar | 🟡 PENDIENTE |
| Sin token refresh JWT | 🟡 PENDIENTE |

---

## Score real pre-testing
| Módulo | % | Gap |
|--------|---|---|
| Audio engine | 70% | Sin gapless/crossfade |
| Escucha compartida | ~85% | SC6/SC12 stats (bloq STAT-M9), server events nuevos |
| VAULT data model | 80% | UI de entrada básica |
| WALL | 35% | Sin virtualización → OOM |
| CINEMA | 18% | Sin música, audioguías, transiciones |
| MAP | 30% | Sin carrusel, distancias, capas |
| DIALOGUE | 60% | Sin Live Sync |
| EXHIBITION | 6% | Lista, spec pide canvas 2D |
| REEL | 11% | Sin banda sonora, pinning, animaciones |
| CAPSULES | 8% | Timeline y RECAP no existen |
| Infraestructura | ~30% | Offline PRECACHE + safe areas + skeletons + ToastContext |
| **TOTAL** | **~40%** | |
