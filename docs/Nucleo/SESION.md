# SESION.md — El Búnker
> Dispatcher. Leer primero. Max 40 líneas.
> Historial completo → `git log --oneline docs/Nucleo/SESION.md`

## S145 — RONDA 6: menú sort se cierra al hacer scroll (6 Jul 2026 · DeepSeek + Sonnet)
Bug arrastrado 6 rondas (menú de sort en MusicLab no abría en móvil). Ronda 5 (onTap +
touchAction) lo resolvió — confirmado por Edu con toast de diagnóstico (`ref:OK`, pos válida).
Apareció bug nuevo: menú se quedaba flotando estático al hacer scroll (portal `position:fixed`
con coords calculadas una sola vez). Ronda 6 (DeepSeek): listener de scroll que cierra el menú,
mismo patrón que click-fuera/Escape. Build limpio, commiteado y pusheado (`1a6f2b1`, `d0dc42c`).

**⚠️ PENDIENTE — sin confirmar por Edu:** no se ha probado en el móvil tras el push de la ronda 6.
Además, "cerrar al hacer scroll" es una decisión de comportamiento (no "seguir" al botón) que
Edu no ha validado explícitamente — puede que prefiera que el menú se reposicione en vez de
cerrarse. Próxima sesión: preguntar/probar antes de dar el bug por cerrado.

## S144 — PLIEGO-235: FASE A.1 (2 Jul 2026 · DeepSeek)
PLIEGO-235 aplicado: StatusBar 2 filas, main paddingTop, MiniPlayer tag_id→label, config whitelist, filtro duplicado VAULT.
Edu: npx wrangler deploy (confirmado). RECAP responde 401 (antes 404), config sin leak.
Build 2.31s · Lint 0/0 · 4 archivos: Layout.jsx, VaultGallery.jsx, config.js.

**6 P1 cerrados:** header solapado, contenido recortado, UUID como tag, filtro duplicado, RECAP 404, leak /api/config.

**Próximo:** FASE B (reproductor premium) → FASE C (galería premium) → FASE D (endurecimiento).
Plan completo: `docs/operacional/auditoria_fable_1.0.md` §7.
