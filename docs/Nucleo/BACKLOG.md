# BACKLOG.md — el_bunker
> Bugs en espera ordenados por prioridad.
> Un bug activo a la vez — ver docs/Nucleo/ESTADO.md.
> Límite: 60 líneas. Si crece más, revisar si hay bugs que ya no aplican.

---

## PRIORIDAD ALTA — desbloquean features

### Q2/Q3 — Historial se pierde al recargar
**Archivo:** `src/core/PlayerContext.jsx`
**Causa raíz:** localStorage no implementado para historial
**Spec:** Q2/Q3 — historial en localStorage por usuario, sobrevive reinicios

### SH1 — Shuffle aleatoriza todos, no solo los restantes
**Archivo:** `src/core/PlayerContext.jsx`
**Causa raíz:** Shuffle no respeta posición actual en la lista

### L1 — Loop track: skip hace seek al inicio en lugar de salir
**Archivo:** `src/core/PlayerContext.jsx`
**Causa raíz:** El handler de skip no distingue si está en modo loop track

### Q10 — Cola no sobrevive a cambios de contexto
**Archivo:** `src/core/PlayerContext.jsx`
**Causa raíz:** Cola manual se destruye al cambiar de playlist/contexto
**Bloqueada por:** Q14

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
| PLIEGO-227 | Modo Edición persistente | MusicLab.jsx | 2026-06-04 |
