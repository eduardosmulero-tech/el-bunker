# ESTADO.md — el_bunker
> Max 30 líneas. Bugs en espera → BACKLOG.md.

**Próximo pliego:** FASE B — Reproductor premium (carátula grande, controles limpios, sin CRT sobre arte).
**Plan vigente:** `docs/operacional/auditoria_fable_1.0.md` §7. FASE A completada S144.
**Última sesión:** S145 — DeepSeek+Sonnet · RONDA 6 menú sort (scroll cierra dropdown) · 6 Jul 2026.
**Rama:** `master`

## ⚠️ Pendiente de confirmar (S145)
Menú de sort (MusicLab): ronda 6 hace que se cierre al hacer scroll en vez de reposicionarse
(commits `1a6f2b1`, `d0dc42c`). **Edu no ha probado esto en el móvil todavía.** Confirmar si el
comportamiento (cerrar vs seguir al botón) es aceptable antes de dar el bug por cerrado.

## Build/Lint
✅ Build 2.30s · Lint 0/0

## Score real
~52% (auditoría Fable/Opus, `auditoria_fable_1.0.md` §2). PLIEGO-235/236 cerraron 6 P1 de higiene/seguridad pero ninguno de los gaps de «sensación premium» (carátula, CRT sobre arte, full-bleed, DEMO fallbacks). Recalcular tras FASE B/C.

## P1 (backend-blocked)
STAT-M9 slice 2 · Gapless/crossfade · Offline total · Chromecast

## P2 (objetivo FASES B+C)
Carátula grande ausente · CRT sobre arte · Galería sin full-bleed · DEMO fallbacks

## Resueltos PLIEGO-235 + PLIEGO-236
✅ 6 P1 (header, contenido, UUID tag, filtro duplicado, RECAP 404, leak config)
✅ PLIEGO-236: paddingTop/minHeight corregidos, tag?.name muerto eliminado, filterCategory propagate a WallView
