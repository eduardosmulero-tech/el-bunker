# INDEX.md — arquitectura el_bunker
> Fuente primaria de staleness. Leer en cada arranque.
> Actualizar al cerrar cada pliego que toque archivos listados en stale_si_pliego_toca.
> Última actualización: S54 — Fase 1: D1+Workers+Wrangler desplegados.

---

## TABLA DE STALENESS

| Doc | sincronizado_con | stale_si_pliego_toca | Estado |
|---|---|---|---|
| architecture.md | S49 | PlayerContext.jsx, VaultContext.jsx, App.jsx | ⚠️ STALE — Fase 0 (S50-S53) tocó PlayerContext.jsx y MusicLab.jsx. Workers/ añade nueva capa de infra. |
| data-flow.md | S49 | PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx | ⚠️ STALE — Flujo Drive→R2 en progreso. Workers/ cambia data flow. |
| event-lifecycle.md | S49 | PlayerContext.jsx, WinampPlayer.jsx | ⚠️ STALE — S50-S53 tocaron PlayerContext.jsx (playHistory, shuffle, loop, queue context). |
| ownership-map.md | S49 | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx | ⚠️ STALE — S53 tocó MusicLab.jsx (cola manual vs contexto).
| rendering-flow.md | S49 | App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx | ⚠️ STALE — S53 tocó MusicLab.jsx.
| state-map.md | S49 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx | ⚠️ STALE — S50-S53 tocaron PlayerContext.jsx y MusicLab.jsx.
| technical-debt.md | S49 | cualquier refactor estructural | ✅ OK |

---

## IMPACTO DE STALENESS

Todos los docs de arquitectura necesitan reescritura completa tras S49.
No bloquean pliegos hasta que se toquen los archivos que describen.

---

## CUÁNDO ACTUALIZAR ESTE INDEX

Al cerrar un pliego: marcar stale cualquier doc cuyo campo stale_si_pliego_toca incluya
un archivo tocado por ese pliego. Actualizar la columna sincronizado_con cuando se resincronice el doc.
