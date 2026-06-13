# INDEX.md — arquitectura el_bunker
> Fuente primaria de staleness. Leer en cada arranque.
> Actualizar al cerrar cada pliego que toque archivos listados en stale_si_pliego_toca.
> Última actualización: S64 — VaultContext → Worker API (reescritura completa de los 7 docs).

---

## TABLA DE STALENESS

| Doc | sincronizado_con | stale_si_pliego_toca | Estado |
|---|---|---|---|
| architecture.md | S64 | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx | ✅ OK |
| data-flow.md | S64 | PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx, workers/worker.js | ✅ OK |
| event-lifecycle.md | S64 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx | ✅ OK |
| ownership-map.md | S64 | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx | ✅ OK |
| rendering-flow.md | S64 | App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx, Vault.jsx | ✅ OK |
| state-map.md | S64 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx, Vault.jsx | ✅ OK |
| technical-debt.md | S64 | cualquier refactor estructural | ✅ OK |

---

## IMPACTO DE STALENESS

Ninguno — todos los docs resincronizados en S64 tras reescritura completa.
Cubren el estado real del sistema: persistencia híbrida Drive+Worker, 22 endpoints, StatsEngine wired, CAPSULES con datos reales.

---

## CUÁNDO ACTUALIZAR ESTE INDEX

Al cerrar un pliego: marcar stale cualquier doc cuyo campo stale_si_pliego_toca incluya
un archivo tocado por ese pliego. Actualizar la columna sincronizado_con cuando se resincronice el doc.
