# BACKLOG.md — el_bunker
> Bugs en espera ordenados por prioridad.
> Un bug activo a la vez — ver docs/Nucleo/ESTADO.md.
> Al resolver: pliego_apply.py añade fila a la tabla de resueltos automáticamente.
> Límite: 60 líneas. Si crece más, revisar si hay bugs que ya no aplican.

---

## PRIORIDAD ALTA — desbloquean features

Ninguno. Ver RESUELTOS.

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
**Depende de:** D1-CLOUDFLARE (decisión pendiente)



## RESUELTOS

| ID | Fix | Archivo | Fecha |
|----|-----|---------|-------|
| PLIEGO-203 | Eliminar botón ⚡ lanzar drop de las TrackCards | TrackCard.jsx | 2026-06-01 |
| PLIEGO-204 | Menú de track como bottom sheet con botón ⋯ — elim… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-205 | Layout derecho card en fila, icono tag más grande … | TrackCard.jsx | 2026-06-01 |
| PLIEGO-206 | Bottom sheet en portal + icono tag doble tamaño al… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-207 | Icono tag fontSize 24, botón ⋮ fontSize 22 | TrackCard.jsx | 2026-06-01 |
| VB9 | Vibe propagado a shell completo — TRACKS Fase A ready | PlayerContext.jsx | 2026-06-01 |
