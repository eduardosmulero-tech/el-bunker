# Ledger de integración de tarjetas `done`

> Fecha: 24-ago-2026. Base verificada: `master`/`origin/master` en `cccf9ab`. Este ledger no sustituye Kanban: deja evidencia de la reconciliación y señala la inconsistencia detectada en el listado histórico.

## Veredicto ejecutivo

No se debe fusionar en bloque ninguna tarjeta `done`. La mayoría son revisiones, duplicados, decisiones históricas o entregas cuyos worktrees ya no existen. Los commits que corresponden a las entregas principales ya son ancestros de `master` y no deben volver a fusionarse.

## Entregas principales ya integradas

| Tarjeta | Entrega | Evidencia |
|---|---|---|
| `t_0ea27342` | VAULT en cuatro secciones | `a432654` es ancestro de `master` |
| `t_2854c51b` | VU, plasma y partículas | `a1bb71e` es ancestro de `master` |
| `t_8ab9c42e` | Corte único a 1280 | `a1bb71e` es ancestro de `master` |
| `t_305dbb3c` | CAPSULES desktop | `a1bb71e` es ancestro de `master` |
| `t_f1fd90c0` | Saneamiento server-side de Modo Visita | `3d62e24` es ancestro de `master` |
| `t_faf42ad6` | Consola SALUD | `b99b745` es ancestro de `master` |
| `t_215feb90` | Consola AUDITORÍA | `2815867` es ancestro de `master` |
| `t_20a3e4cf` | Línea base de clipping | `9d724bc` es ancestro de `master` |
| `t_29116394` | Preparación de backfill blurhash | `739e547` es ancestro de `master` |
| `t_ed564218` | Filtrado del feed en Modo Visita | `d533753` es ancestro de `master` |
| `t_fc51cdc9` | UI de Modo Visita | `d3fa96b` es ancestro de `master` |
| `t_9a43b8c1` | Iconografía/microcopy HUD | `633b7a1` es ancestro de `master` |
| `t_0a98721c` | Corrección de fecha falsa | `90b9575` es ancestro de `master` |
| `t_f79cfdf7` | Corrección de fecha iteración 2 | `e09e942` es ancestro de `master` |
| `t_31cceef2` | Revocación epoch | `bd822a8` es ancestro de `master` |
| `t_bf7a8882` | Tabla A ADR-029 | `35fe441` es ancestro de `master` |
| `t_420b2f04` | Harness audit-ui inicial | `3775675` es ancestro de `master` |
| `t_e19b5128` | Exclusión de worktrees en Vitest | `6f3d55c` es ancestro de `master` |

## Clasificación de ramas históricas

Las ramas basadas en `b96ba31`, `b3611db` o árboles anteriores a los merges de ADR-029/032/033 no se fusionan directamente. Incluyen revisiones y entregas ya absorbidas, o pueden reintroducir disposiciones obsoletas. Si una tarjeta contiene una mejora todavía necesaria, se crea una nueva tarjeta sobre `master` actual y se extrae solo el cambio lógico.

Ejemplos de revisión histórica no fusionable directamente: `t_22e3e727`, `t_52bf8ba0`, `t_52e7e1b8`, `t_5ba123fa`, `t_658f4c2e`, `t_99fe07af`, `t_a7d1f4aa`, `t_da3f56c5`, `t_f7b6d823`, `t_fc85b520` y sus tarjetas REV asociadas.

## Anomalía del board

El 24-ago `hermes kanban list --status done --json` devolvió 138 tarjetas, pero `hermes kanban show` no encontró varios IDs devueltos y muchas rutas `workspace_path` no existen. El primer script de reconciliación que intentó hacer `git -C workspace` produjo falsos negativos por esa razón. Por tanto:

- Ausencia de worktree no equivale a obsolescencia.
- El SHA visible en refs/log es la evidencia primaria cuando existe.
- Una tarjeta sin SHA, worktree ni comentario verificable queda `NO VERIFICABLE`, no integrada.
- No se borran worktrees ni se archivan tarjetas históricas hasta resolver la inconsistencia del board.

## Estado de esta integración

`master` y `origin/master` están sincronizados en `cccf9ab`. La entrega de esta sesión ya fue integrada y auditada. Quedan fuera del commit los archivos no relacionados `docs/planes/HANDOFF_FLOTA_2026-08-14.md` y `geometria-marco-padre.json.bak`.

El siguiente trabajo seguro es una tarjeta nueva sobre `master` actual para cada capacidad aún necesaria, no un merge de ramas antiguas: reproductor/HUD desktop, seguridad real, API admin completa, Android/PWA, offline/sync, búsqueda, recetas/listas, diario dual y aceptación Edu/David.
