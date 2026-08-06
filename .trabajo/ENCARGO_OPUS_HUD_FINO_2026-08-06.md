# ENCARGO OPUS — Diseño fino de la HUD desktop (t_504a2707)

> Fecha: 6-ago-2026 · Remitente: Edu (vía Hermes coordinador) · Rol esperado: SOLO diseño y
> arquitectura. NO ejecución, NO tocar código de la app.

## 1. Veredicto de Edu sobre la propuesta actual (t_504a2707, Luna)

La propuesta conceptual `docs/disenos/PROPUESTA_HUD_DESKTOP_2026-08-05.html` (rama
`el-bunker/t_504a2707-hud-desktop-rediseno`) está **RECHAZADA**. Cita literal de Edu:

> "La propuesta tiene 0 personalidad comparado a como se ve en android la app. Se nota muchisimo
> la ia. No me gusta."

Además Edu añade: **"la app en android ya huele a ia, también requiere revision"** — la app viva
también arrastra rastro de IA que hay que inventariar y corregir. El diseño fino de la HUD es tu
trabajo (Opus); después se iterará con Luna hasta sacarlo.

## 2. Qué se te pide

**Diseño fino de la HUD desktop** que parta de la IDENTIDAD REAL de la app (lo que se ve en
Android/desktop hoy), no de un concepto genérico. El punto de partida obligatorio es el material
real de la app viva (ver §3). La propuesta rechazada sirve como CONTRAEJEMPLO: look genérico de
"terminal acid" sin herencia de la identidad actual.

Junto con el diseño, **inventario de rastro de IA en la UI actual** (lo que "huele a IA" en la
app viva): iconografía con caracteres unicode (♥ ⚙ ▾ ⋮ ↕ ↓), microcopy crudo, typos (p. ej.
"NIGTHCORE" en el filtro de MusicLab), y cualquier elemento que delate generación. Ese inventario
es el pliego para la revisión posterior de la app.

## 3. Material de partida (verificado por comando, capturas reales del 6-ago)

Carpeta `docs/operacional/hud-material-2026-08-06/` (repo el-bunker, ya en disco):

- `movil-1-vault-eras.png` — vault, vista ERAS, móvil 390x844
- `movil-2-wall.png` — vault, WALL (galería), móvil
- `movil-3-lightbox.png` — entrada abierta, móvil
- `movil-4-musiclab.png` — reproductor, móvil
- `movil-5-capsules.png` — cápsulas (TIMELINE), móvil
- `desktop-1-vault-eras.png` / `desktop-2-wall.png` / `desktop-3-musiclab.png` — mismos estados a 1500x950
- `dump-*.json` — volcados DOM por pantalla (textos de botones, símbolos unicode, nº de iconos SVG)

Identidad real a preservar (canon): 3 tabs definitivos (VAULT · MUSIC LAB · CAPSULES), motor de
audio único (MusicLab), estética cyber-vandal del reproductor (WinampPlayer), vault como museo
con 527 piezas en 2 eras (2021: 185, 2022: 342), galería en 6 modos, cápsulas con 4 sub-tabs.

## 4. Restricciones

- SOLO diseño: documento/artefacto de diseño, sin tocar código de la app.
- **CERO emojis y cero símbolos unicode como iconografía** (regla dura de Edu: iconografía emoji
  o de caracteres = rastro de IA; iconos SVG propios o nada).
- No inventar datos: las cifras reales son 1.117 tracks y 527 entradas; lo que no exista se
  marca como FUTURE, nunca como dato real.
- La propuesta rechazada no se cita como base; solo como contraejemplo.
- Respuesta en formato ejecutable: (a) texto literal a canonizar, (b) ediciones antes/después por
  fichero si aplica, (c) greps de verificación del cierre.
- Español, prosa plana, sin emojis.

## 5. Contexto del proyecto

el-bunker: bóveda de memoria + reproductor musical para Edu y David. React 19 + Vite + Tailwind
en Vercel; API Cloudflare Worker + D1 + R2. Privada, sin IA en repos públicos. La HUD desktop
(t_504a2707) es prioridad: aprovechar el escritorio (móvil compacta y visible, desktop con
capacidades propias). Docs canónicos: `docs/Nucleo/CONTRATO.md` (28 ADRs vigentes, enmienda
ADR-018/ADR-025) y `AGENTS.md`.
