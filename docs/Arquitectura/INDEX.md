# INDEX.md — arquitectura el_bunker
> Fuente primaria de staleness. Leer en cada arranque.
> Actualizar al cerrar cada pliego que toque archivos listados en stale_si_pliego_toca.
> Última actualización: S63 — Worker 22 endpoints (entries, eras, files CRUD).

---

## TABLA DE STALENESS

| Doc | sincronizado_con | stale_si_pliego_toca | Estado |
|---|---|---|---|
| architecture.md | S49 | PlayerContext.jsx, VaultContext.jsx, App.jsx | ⚠️ STALE — S50-S63: PlayerContext, MusicLab, Workers 22 endpoints. |
| data-flow.md | S49 | PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx | ⚠️ STALE — Workers API activa (22 endpoints), Drive→D1 migración parcial. |
| event-lifecycle.md | S49 | PlayerContext.jsx, WinampPlayer.jsx | ⚠️ STALE — S50-S63: StatsEngine wired, eventos emitidos desde PlayerContext/Vault/MusicLab. |
| ownership-map.md | S49 | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx | ⚠️ STALE — S60-S61: MusicLab imports→tokens, jwtToken threading. |
| rendering-flow.md | S49 | App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx | ⚠️ STALE — S61: jwtToken threading en VaultPage/MusicPage. |
| state-map.md | S49 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx | ⚠️ STALE — S59-S61: JWT wiring en VaultContext, Capsules fetch real. |
| technical-debt.md | S49 | cualquier refactor estructural | ✅ OK |

---

## IMPACTO DE STALENESS

Todos los docs de arquitectura necesitan reescritura completa tras S49.
No bloquean pliegos hasta que se toquen los archivos que describen.

---

## CUÁNDO ACTUALIZAR ESTE INDEX

Al cerrar un pliego: marcar stale cualquier doc cuyo campo stale_si_pliego_toca incluya
un archivo tocado por ese pliego. Actualizar la columna sincronizado_con cuando se resincronice el doc.
