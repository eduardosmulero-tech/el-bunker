# INDEX.md — arquitectura el_bunker
> Fuente primaria de staleness. Leer en cada arranque.
> Actualizar al cerrar cada pliego que toque archivos listados en stale_si_pliego_toca.
> Última actualización: S66 — Auditoría completa + ROADMAP v4.

---

## TABLA DE STALENESS

| Doc | sincronizado_con | stale_si_pliego_toca | Estado |
|---|---|---|---|---|
| architecture.md | S64 | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx | ⚠️ STALE (S130-B toca VaultContext) |
| data-flow.md | S64 | PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx, workers/worker.js | ⚠️ STALE (S130-B toca VaultContext + worker.js) |
| event-lifecycle.md | S64 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx | ⚠️ STALE (S130-B toca VaultContext) |
| ownership-map.md | S64 | PlayerContext.jsx, VaultContext.jsx, App.jsx, MusicLab.jsx, Vault.jsx | ⚠️ STALE (S130-B toca VaultContext) |
| rendering-flow.md | S64 | App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx, Vault.jsx | ⚠️ STALE (S130-B toca VaultContext) |
| state-map.md | S64 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx, Vault.jsx | ⚠️ STALE (S130-B toca VaultContext) |
| technical-debt.md | S64 | cualquier refactor estructural | ✅ OK |

---

## IMPACTO DE STALENESS

⚠️ S130-B tocó VaultContext.jsx + worker.js + workers/routes/. Todos los docs de arquitectura marcados stale — pendientes de resincronización.
⚠️ S131 tocó Layout.jsx (safe-area), VaultGallery.jsx (MapView real), vite.config.js, public/sw.js. Sin efecto adicional sobre stale flags.

---

## CUÁNDO ACTUALIZAR ESTE INDEX

Al cerrar un pliego: marcar stale cualquier doc cuyo campo stale_si_pliego_toca incluya
un archivo tocado por ese pliego. Actualizar la columna sincronizado_con cuando se resincronice el doc.
