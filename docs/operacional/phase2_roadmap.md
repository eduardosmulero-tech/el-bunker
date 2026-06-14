# Phase 2 — Visuales P1 · Roadmap
> Fecha: 2026-06-14 · Sesión: S86 (planning) · Próximo bloque: **PLIEGO-230**

## Issues P1 (post-S85d)

| # | Issue | Componente | Estado diagnóstico |
|---|-------|-----------|--------------------|
| 1 | **MINI-PLAYER** opaco, botonera consolidada | `WinampPlayer.jsx` | Visualizer `rgba(0,0,0,0.4)`, track info `rgba(0,0,0,0.3)` → semi-transparentes. Volumen slider `w-12 h-1` muy pequeño. ⚡ DROP separado de botonera. |
| 2 | **ERA-COLOR** selector | `Vault.jsx` + `ColorPicker.jsx` | **Ya resuelto (S85).** Línea 765-766 de Vault.jsx usa el mismo `<ColorPicker>` que TagManager (línea 141). Marcar stale en ESTADO. |
| 3 | **PLAYLISTS-TAB** visual fixes | `MusicLab.jsx` LISTS | Drag handle `⠿` op 0.3 (invisible). Empty border usa `GLASS_BORDER` en vez de accent dashed. Falta hover state. Color de card usa `plVibe` en vez de `accentColor` (disonante con TRACKS). |

## Plan de pliegos

| # | Pliego | Alcance | Impacto | Est. líneas |
|---|--------|---------|---------|-------------|
| **230** | Mini player opaco + botonera | Visualizer + track info → `#0a0a0a`. Vol slider `w-16 h-1.5`. ⚡ integrado en botonera central. | Alto (visible siempre) | 4 bloques en 1 archivo |
| **231** | LISTS tab visual fixes | Drag handle op 0.3 → 0.6 + tooltip. Empty border dashed accent. Hover state. Color siempre `accentColor`. | Medio | 4-5 bloques en 1 archivo |
| **232** | Era color — cierre (doc-only) | ESTADO.md: marcar ERA-COLOR como resolved. PLIEGOS_HISTORIAL.md: documentar S85 unification. | Bajo (doc) | 2 archivos, cambios menores |

**Orden:** 230 → 231 → 232.

## PLIEGO-230 (siguiente bloque, listo en `tools/pliego_230.txt`)

**Cambios concretos en `WinampPlayer.jsx`:**

1. **Visualizer section** (línea ~280): `background: "rgba(0,0,0,0.4)"` → `background: "#0a0a0a"`.
2. **Track info section** (línea ~290): `background: "rgba(0,0,0,0.3)"` → `background: "#0a0a0a"`.
3. **Volume slider** (línea ~360): `w-12 h-1` → `w-16 h-1.5`.
4. **⚡ DROP botón** (línea ~370): mover al bloque central de la botonera, entre `▶▶` y `⊕`. Compacto.
5. Aria + title del nuevo botón ⚡ consistente con el resto.

**Criterio de éxito:** lint 0 errors, build clean, browser-use confirma opacidad 100% en visualizer+track info, ⚡ visible en botonera, vol slider más grande.

**Commit:** `PLIEGO-230: mini player opaco + botonera consolidada (Phase 2.1)`

## Verificación live (post-apply + S84 deploy)

1. browser-use contra prod post-deploy:
   - Screenshot mini player (debe ser 100% opaco)
   - Hover en LISTS card (debe tener feedback visual)
   - Drag handle visible (op 0.6+)

2. Tests funcionales:
   - ⚡ DROP desde la botonera abre `DropComposeModal`
   - Vol slider ajustándose cambia volumen del `<audio>`
   - Drag&drop de playlist card funciona (S84 fix preservado)

## Out of scope (logged)

- Volumen slider → modal expandido (nice-to-have, Phase 2.2+)
- Drag handle con icono más explícito (✥ o ⋮⋮) — si 230+231 no es suficiente
- Cards LISTS con animación `Reorder.Group` (requiere framer-motion upgrade)
- Recaps/Smoke toast infra audit (logged en S85d)
