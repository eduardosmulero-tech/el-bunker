# task_deepseek.md — encargo activo (turno: deepseek)

## RONDA 6 — menú de sort se abre pero queda flotando, no sigue el scroll

**RONDA 5 (instrumentación + intento onTap/touchAction) — resultado confirmado por Edu:**
Toast disparado: `SORT pos:151,457 vw:392x811 ref:OK`. El menú **ya se abre** (esto resuelve el bug
original de las rondas 1-5: el tap no abría el menú). Progreso real, no descartar el cambio
`onClick`→`onTap` + `touchAction: manipulation` de `MusicLab.jsx` — quedó commiteado en `1a6f2b1`.

**Bug nuevo, reportado por Edu tal cual, en el móvil real:**
> "El menú desplegable aparece debajo del botón. Ahora, si desplazo hacia abajo o arriba, el menú
> se queda flotando estático en el mismo sitio mientras el resto de la app se desplaza."

Es decir: el menú abre en la posición correcta la primera vez, pero al hacer scroll del contenido
no se mueve con él — se queda "pegado" en coordenadas de viewport fijas mientras todo lo demás
(incluido presumiblemente el propio botón) se desplaza por debajo.

## Contexto ya conocido (no releer todo, ya verificado en rondas previas)
- El menú se renderiza vía `createPortal(document.body)` con `position: fixed`, en
  `MusicLab.jsx` (zona del botón de sort, ~línea 1117-1195).
- `top`/`left` se calculan una sola vez en el momento del click a partir de
  `sortMenuRef.current.getBoundingClientRect()` + clamps de boundary.
- El toast ya deja el valor real confirmado: `pos:151,457` con viewport `392x811`.
- `AnimatePresence` fue quitado en la ronda 5 (ya no envuelve el dropdown).

## Tarea
Investiga por qué el menú no seguiría el scroll de la app y corrígelo, de forma que el
desplegable permanezca anclado visualmente al botón de sort mientras el usuario hace scroll
(igual que se espera de cualquier dropdown "anclado"), o se cierre automáticamente al hacer
scroll si esa es la solución más simple y coherente con el resto de la UI — decide tú cuál encaja
mejor, investigando primero cómo se comporta el resto de menús/dropdowns de la app (si los hay)
antes de inventar un patrón nuevo.

## Restricciones
- Un bug = una causa: no toques la lógica de apertura/cierre (`onTap`, `touchAction`) que ya
  quedó arreglada en la ronda 5, solo el problema de posición-en-scroll.
- Cambio por contenedor lógico completo (ADR-015), no micro-edición.
- Quita el toast de diagnóstico (`showToast` con `pos:...`) de la ronda 5 una vez confirmes que
  el fix de scroll funciona — ya cumplió su propósito.

## Entregable
- `npm run build` limpio.
- Explicar en el reporte qué causaba el desanclaje (causa raíz, no parche).

## Qué hace Edu después (no es parte de tu tarea)
Edu prueba en el móvil real tras el commit/push: abre el menú, hace scroll, confirma si el menú
ahora sigue al botón (o se cierra correctamente) y reporta.
