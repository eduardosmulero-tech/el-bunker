# BACKLOG.md — el_bunker
> Bugs en espera ordenados por prioridad.
> Un bug activo a la vez — ver docs/Nucleo/ESTADO.md.
> Al resolver: pliego_apply.py añade fila a la tabla de resueltos automáticamente.
> Límite: 60 líneas. Si crece más, revisar si hay bugs que ya no aplican.

---

## PRIORIDAD ALTA — desbloquean features

### VB9 — Vibe solo afecta WinampPlayer, no se propaga a toda la UI
**Archivo:** `src/musiclab/WinampPlayer.jsx` + CSS global
**Causa raíz:** Variables CSS de vibe no se setean en `:root`, solo en el componente
**Fix conocido:** Propagar variables CSS dinámicas en `:root` desde PlayerContext
**Bloquea:** VB1 completo (spec: vibe afecta toda la UI excepto botones destructivos)

---

## PRIORIDAD MEDIA — funcionalidad pendiente de spec

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
| PLIEGO-172 | Reemplazar el archivo vacío con el formato definit… | SESION.md | 2026-06-01 |
| PLIEGO-173 | Crear BACKLOG.md canónico en docs/Nucleo/ con los … | BACKLOG.md | 2026-06-01 |
| PLIEGO-175 | Eliminar audit histórico S42-S43 de BACKLOG.md par… | BACKLOG.md | 2026-06-01 |
| PLIEGO-176 | append_resuelto_backlog mantiene maximo 5 filas en… | pliego_apply.py | 2026-06-01 |
