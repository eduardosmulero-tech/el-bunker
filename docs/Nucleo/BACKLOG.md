# BACKLOG.md — el_bunker
> Bugs en espera ordenados por prioridad.
> Un bug activo a la vez — ver docs/Nucleo/ESTADO.md.
> Límite: 60 líneas. Si crece más, revisar si hay bugs que ya no aplican.

---

## PRIORIDAD ALTA — desbloquean features

### W3 — Tags MusicLab no sincronizan con D1
**Archivo:** `src/musiclab/TagManager.jsx`, `workers/worker.js`
**Causa raíz:** Tags solo se guardan en Drive JSON, no en tabla `tags` de D1

---

## PRIORIDAD BAJA — features Fase A no urgentes

### Q12 — Añadir playlist entera a cola
**Bloqueada por:** Q14 (separación visual cola manual/contexto)

### S1/S2 — Persistencia posición tracks >25min
**Depende de:** stats engine / D1

---

## RESUELTOS

| ID | Fix | Archivo | Fecha |
|----|-----|---------|-------|
| CTX-1 | AnimatePresence anidado en TrackCard — menú ⋮ no abría en tracks nuevos | TrackCard.jsx | 2026-06-01 |
| PLIEGO-224 | Unificar Modo Edición | MusicLab.jsx | 2026-06-04 |
| Q2 | skip(1) cola manual itera saltando duplicados activeTrack | PlayerContext.jsx | 2026-06-13 |
| Q3 | shuffle filtra playHistory al regenerar orden | PlayerContext.jsx | 2026-06-13 |
| Q10 | playTrack añade al historial al cambiar de track | PlayerContext.jsx | 2026-06-13 |
| SH1 | SmokeSession persiste endTime en localStorage | SmokeSession.jsx | 2026-06-13 |
| L1 | addLibrary refresca libraryCapacity automáticamente | VaultContext.jsx | 2026-06-13 |
| PLIEGO-227 | Modo Edición persistente | MusicLab.jsx | 2026-06-04 |
