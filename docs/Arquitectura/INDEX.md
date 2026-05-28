# INDEX.md — arquitectura el_bunker
> Fuente primaria de staleness. Leer en cada arranque (paso 6).
> Actualizar al cerrar cada pliego que toque archivos listados en stale_si_pliego_toca.

---

## TABLA DE STALENESS

| Doc | sincronizado_con | stale_si_pliego_toca | Estado |
|---|---|---|---|
| architecture.md | PLIEGO-065e | PlayerContext.jsx, VaultContext.jsx, App.jsx | ✅ OK |
| data-flow.md | PLIEGO-067 | PlayerContext.jsx, GoogleDriveService.js, VaultContext.jsx | ✅ OK |
| event-lifecycle.md | PLIEGO-069 | PlayerContext.jsx, WinampPlayer.jsx | ⚠️ STALE — PLIEGO-070 al 076, 081/082 y 084 tocaron WinampPlayer.jsx |
| ownership-map.md | PLIEGO-055 | PlayerContext.jsx, VaultContext.jsx, App.jsx | ⚠️ STALE — PLIEGO-066/069/070/075 tocaron PlayerContext.jsx |
| rendering-flow.md | PLIEGO-053 | App.jsx, VaultContext.jsx, PlayerContext.jsx | ⚠️ STALE — PLIEGO-061/065/066/075 tocaron PlayerContext.jsx |
| state-map.md | PLIEGO-071 | PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx | ⚠️ STALE — PLIEGO-073 al 076, 081/082 y 084 tocaron PlayerContext.jsx y WinampPlayer.jsx |
| technical-debt.md | PLIEGO-053 | cualquier refactor estructural | ✅ OK (deuda documentada, no activa) |

---

## IMPACTO DE STALENESS

Los docs marcados ⚠️ STALE describen flujos o responsabilidades que pueden haber cambiado.
**Bloqueo selectivo:** el staleness solo bloquea pliegos que tocan los archivos que esos docs describen.

Para pliegos que SÍ tocan esos archivos: actualizar el doc correspondiente en el mismo cierre de sesión.
---

## CUÁNDO ACTUALIZAR ESTE INDEX

Al cerrar un pliego: marcar stale cualquier doc cuyo campo stale_si_pliego_toca incluya
un archivo tocado por ese pliego. Actualizar la columna sincronizado_con cuando se resincronice el doc.