# 🔴 S145 — Round 4: usar createPortal (patrón ya existente en el código) para dropdown y modal

> **Estado:** 🔴 Reabierta 2026-07-05. Edu reporta: el botón de ordenar tracks se ve desigual, y
> tanto su desplegable como el modal de "eliminar track" (el que se acaba de convertir a modal en
> la ronda anterior) se salen de pantalla. Sonnet investigó y encontró que el codebase YA tiene el
> patrón correcto para esto — `createPortal(..., document.body)`, usado en
> `src/musiclab/TrackCard.jsx:68-115` y `:190-237` para menús contextuales — pero ni el dropdown de
> orden ni el modal de borrar lo usan. Ambos usan `position: absolute`/`fixed` anidados dentro del
> árbol normal de componentes, lo cual puede quedar recortado o mal posicionado si algún ancestro
> con animación de framer-motion tiene un `transform` activo (afecta el contexto de posicionamiento
> de cualquier `fixed`/`absolute` descendiente — gotcha conocido de CSS).
> **Contrato:** editar código directamente como agente. Nunca pliego.
> **Verificación:** Sonnet revisa con grep puntual + build.

## 1. Dropdown de orden de tracks — convertir a createPortal + posición calculada

**Dónde:** `src/musiclab/MusicLab.jsx:1110-1158` (`sortMenuRef`, botón `onClick={() =>
setShowSortMenu(...)}`, dropdown `AnimatePresence`/`motion.div` con `className="absolute top-full
mt-1 right-0 z-50..."`).

**Problema:** `position: absolute` relativo a `sortMenuRef` (un div normal, no portal) — si el
botón está cerca del borde derecho/inferior del viewport, el desplegable puede desbordar fuera de
pantalla (no hay boundary detection). Además puede sufrir el mismo problema de `transform` de
ancestro framer-motion que el modal de abajo.

**Fix:** sigue el patrón de `TrackCard.jsx` — usa `createPortal(..., document.body)` con
`position: fixed`, calculando la posición desde `sortMenuRef.current.getBoundingClientRect()`
cuando se abre (guarda `top`/`right` o `left` en un state y úsalo en el style del portal). Así
queda siempre visible sin depender del árbol de componentes ni de dónde esté el scroll.

**Sobre "el botón se ve desigual":** compáralo visualmente con el resto de botones del toolbar
(los que ya tienen hitbox 44px / caja visible ~28px de la ronda anterior). Si el botón de orden
usa un padding/altura distinto (`px-2 py-2.5`, ancho automático por icono+flecha) que no encaja
con el resto de la fila "TRACKS [count] · botón orden", ajusta su altura/alineación vertical para
que quede consistente con sus vecinos en esa misma fila. Usa tu criterio visual, no hay una única
respuesta correcta aquí — repórtalo si lo cambias.

## 2. Modal de "eliminar track" — convertir a createPortal (ronda anterior no lo usó)

**Dónde:** `src/musiclab/MusicLab.jsx`, el bloque `{showDelete && (...)}` que se convirtió a modal
`fixed inset-0 z-[999]` en la ronda anterior (commit `6adbdf2`).

**Fix:** envuelve ese modal completo en `createPortal(..., document.body)`, exactamente como
`TrackCard.jsx:68-115`. Mantén el mismo contenido/estructura (backdrop + panel centrado +
max-h-[60vh] overflow-y-auto + botones ✕ con hitbox/visual separados) — solo cambia el mecanismo
de renderizado para que escape del árbol de componentes.

## Restricciones

- Sigue el patrón exacto de `TrackCard.jsx` (mismo import `createPortal` de `react-dom`, mismo
  target `document.body`).
- No cambies la lógica de ordenación ni de borrado, solo el mecanismo de posicionamiento/render.
- `npm run build` debe pasar antes de reportar hecho.
- Si tras investigar encuentras que la causa NO es el problema de `transform`/ancestro que
  planteo, dilo explícitamente con evidencia — no fuerces el portal si no hace falta, pero el
  patrón ya establecido en el código (`TrackCard.jsx`) es la referencia a seguir por consistencia
  aunque la causa exacta sea otra.

## Hand-off a Sonnet

Reporta archivo:línea de los 2 cambios (dropdown + modal) y qué hiciste con el botón "desigual".
Sonnet verifica con grep puntual + build.
