# BACKLOG.md — el_bunker
> Bugs en espera ordenados por prioridad.
> Un bug activo a la vez — ver docs/Nucleo/ESTADO.md.
> Al resolver: pliego_apply.py añade fila a la tabla de resueltos automáticamente.
> Límite: 60 líneas. Si crece más, revisar si hay bugs que ya no aplican.

---

## PRIORIDAD ALTA — desbloquean features

### CTX-1 — Menú ⋮ no abre en tracks recién añadidos
**Archivo:** `src/musiclab/TrackCard.jsx`
**Causa raíz:** pendiente — error en terminal por confirmar en próxima sesión
**Síntoma:** tap en ⋮ tras añadir track nuevo lanza error, bottom sheet no aparece

### TRACKS-M23 — CERRADO S44 (acciones al ⋮, bottom sheet)
### UX10/UI-M25 — CERRADO S44 (toggle ☰/⊞/❒, modo tarjeta difere a STAT-M9)

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
| PLIEGO-207 | Icono tag fontSize 24, botón ⋮ fontSize 22 | TrackCard.jsx | 2026-06-01 |
| VB9 | Vibe propagado a shell completo — TRACKS Fase A ready | PlayerContext.jsx | 2026-06-01 |
| PLIEGO-211 | Toggle viewMode lista/grid/tarjeta con persistenci… | MusicLab.jsx | 2026-06-01 |
| PLIEGO-212 | Modo tarjeta expandida (viewMode card) + component… | TrackCard.jsx | 2026-06-01 |
| PLIEGO-213 | Añadir TrackCardGrid al import de TrackCard | MusicLab.jsx | 2026-06-01 |
