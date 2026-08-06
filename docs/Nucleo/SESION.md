# SESION.md — El Búnker
> Dispatcher. Leer primero. Max 40 líneas.
> Historial completo → `git log --oneline docs/Nucleo/SESION.md`

## S154 — B1 admin-core: diseño + DoD ejecutable (5 Ago 2026 · Opus, carril `claude`)
Turno de diseño de la tarjeta `t_0a8cf470`. **Handoff completo:
`docs/planes/HANDOFF_OPUS_B1_2026-08-05.md`** — leer ese, no este resumen.

**Entregado:** `docs/disenos/DISENO_B1_ADMIN_CORE_2026-08-05.md` (7 piezas, props exactas, 2 anexos)
+ el DoD escrito como suite ejecutable en `.worktrees/t_0a8cf470/src/admin/__tests__/` (commit
`4bc8ec7`): fronteras 7/7 en verde, `useAdminResource` (14 casos) y `toy-mount` (9 casos) en **rojo
a propósito** — son la especificación. Ejecutar B1 = ponerlos en verde sin tocarlos.

**Hallazgos verificados:** (1) `vite.config.js` no excluye `.worktrees/` → `npx vitest run` recorre
los 4 árboles (29 ficheros reales, 112 recogidos), tarjeta `t_9800bed2`; (2) la regex de
`service-boundaries.test.js:11` no casa con ningún fichero, ese test pasa en vacío (`t_eb4788e7`);
(3) `core/ui/Button.jsx` no hace spread de `...rest` — `aria-label` se pierde, los botones
solo-icono usan `title`.

**Piloto de paralelismo:** tres carriles sin un solo conflicto de merge — la apuesta salió. Reserva:
`workers/worker.js` no estaba en el ámbito de ninguna tarjeta, así que A1 y B2 llegaron a `done`
con endpoints que ningún HTTP alcanzaba; lo cerró Luna a petición directa de Edu, fuera de contrato
(`3ee54dc`, justificado en `68462a8`). Corrección propuesta: tarjeta de integración por ola con
dueño único (`t_565f2055`).

**A1 y B2 las coordina y cierra Sonnet, no Opus.** Pendiente de verificar antes de cerrarlas:
migraciones `0002`/`0003` aplicadas en la D1 **remota** (`t_09474b0d`).

## S149 — ADAPTACIÓN A PIPELINE PROMETHE-OS + CANON v1.0 (22 Jul 2026 · Hermes Principal)
Primera sesión con Hermes en el-bunker. Adaptación completa al pipeline Promethe-os.

**Consolidación:** 6 commits de cierre v1.0 (S146-S148) que estaban sin commitear desde
hacía 9 días. Build reparado (rolldown binding nativo faltante en WSL). Lint clean.

**Pipeline:** Creado AGENTS.md con formato Promethe-os. CLAUDE.md reducido a stub.
Kanban board el-bunker activado como estado vivo (FASE C+D → done, bugs pendientes en
triage). task_deepseek.md eliminado (reemplazado por contratos kanban).

**Workers ejecutados:** Documentador vía constructor CLI (laguna-s-2.1-free gratis) para
AGENTS.md + task_deepseek.md. Workers paralelizados (CLAUDE.md stub directo, kanban vía
terminal, documentador en background).

**Pendiente histórico:** Bug canciones repetidas (t_725f1797), subir PRUEBA (t_c316b835),
deploy frontend (t_1afa45b1). Este bloque conserva el estado de aquella sesión.

## S152 — G0–G8 refactor/higiene y cierre documental (3 ago 2026 · Buffy)
Se completaron contenedores locales G0–G5 y G7. Se extrajeron fronteras puras de MusicLab, sesión/JWT, carga D1, cola y Timeline; se sustituyeron iconos funcionales por `Icon` y se añadió contrato PWA/SW. G6 tiene layout/overflow comprobados en móvil/desktop, pero la aceptación visual completa quedó inconclusa por falta de artefacto legible del navegador. G8 sincronizó manual, estado, informe, acta y registro.

**Validación:** 114/114 tests, lint, build, sintaxis SW/Worker y diff-check verdes. Sin deploy, commit/push ni mutación D1/R2 en esta reanudación. Pendientes: aceptación humana reproducible, Cloudflare 7403/huérfano G2 y decisión sobre retirada del facade Drive.

## S153 — Bloque de auditoría: cola, audio del vault y docs (4 ago 2026 · Buffy)
Continuación del bloque de auditoría (no del refactor). Reordenamiento drag & drop de la cola corregido para usar IDs estables (`reorderQueueByIds` en QueueTransforms), sin mezclar manuales/contexto ni depender de índices de vistas filtradas; `TrackTransforms.js` extrae la ordenación pura. Vídeos del vault silenciados permanentemente (`muted` + `onPlay`/`onVolumeChange` → muted/volume 0 en VaultGallery y EntryLightbox); el playback sigue centralizado en PlayerProvider (ADR-018). Documentación alineada: CONTRATO, REGLAS, data-flow, PROYECTO, architecture, rendering-flow, technical-debt e INDEX (audio principal vs preload técnico, límites runtime).

**Validación:** 124/124 tests, lint, build OK. Sin deploy ni cambios D1/R2. Pendiente explícito de la auditoría: aceptación visual reproducible (desktop 1440 / tablet 1024 / móvil 390) y prueba real de instalación/offline/update PWA.
