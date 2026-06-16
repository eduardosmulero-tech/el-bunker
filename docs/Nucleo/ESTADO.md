# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** Deploy worker + smoke test manual
**Última sesión:** S112 — Roadmap ejecución (Fase 0 + S113-W + S115-D2 + S117)
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

## Próximos pasos
1. `wrangler deploy` desde raíz para subir worker con security fixes
2. Smoke test manual: login → play track → add entry → check cross-user queue auth
3. Migrar D1: `ALTER TABLE drops ADD CHECK(seen_at <= favorited_at)` (V7)
