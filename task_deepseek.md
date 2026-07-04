# 🔴 S145 — Round 3: la causa real es que el hitbox 44px ES el box visible (no solo el texto)

> **Estado:** 🔴 Reabierta 2026-07-05. Edu sigue viendo los botones grandes pese al fix anterior
> (que solo redujo texto/opacidad/padding). Sonnet investigó más a fondo y encontró la causa real:
> el fix anterior nunca separó "tamaño del hitbox" de "tamaño de la caja visible" — son la misma
> caja, con borde y fondo visibles a 44x44px completos. Reducir el texto de dentro no encoge la
> caja. Esta vez el fix es estructural, no cosmético.
> **Contrato:** editar código directamente como agente. Nunca pliego.
> **Verificación:** Sonnet revisa con grep puntual + build.

## Causa real confirmada (no re-investigar, ya está verificado leyendo el código)

Todos estos botones tienen su PROPIA caja (`className` con `w-11 h-11` o `min-w/min-h-[44px]`)
con `border` y `background` visibles aplicados directamente a esa caja de 44x44px. El fix anterior
(S145 round 2) solo cambió el texto/icono de dentro (tamaño, opacidad) — pero el borde y el fondo
siguen trazando un cuadrado de 44x44px completo, así que visualmente se sigue viendo "grande"
sin importar cuán pequeño sea el texto interior. Para que un botón se vea genuinely más pequeño
manteniendo el hitbox táctil de 44px (obligatorio, no tocar), hace falta separar:
- **Hitbox** (área clicable, 44x44px, invisible — sin borde ni fondo propios).
- **Caja visible** (más pequeña, p.ej. 28-32px, con el borde/fondo/icono dentro, centrada dentro
  del hitbox).

## Tarea — aplicar el patrón hitbox/visual a estos botones

1. **`src/layout/Layout.jsx:148-165`** — botones ↺ (reload) y ⎋ (exit) del header. Ya tienen
   `min-h-[44px] min-w-[44px]` con `border`/`background` en la misma caja — sepáralos: hitbox
   `min-h-[44px] min-w-[44px] flex items-center justify-center` sin borde propio, con un `<span>`
   o div interior de ~28px con el borde/color/icono actual.

2. **`src/musiclab/MusicLab.jsx:1161-1195`** — 5 botones del toolbar de tracks: vista (`cycleViewMode`),
   buscar (⌕), añadir (+), editar (✎), eliminar-toggle (−). Todos `w-11 h-11` con borde/fondo en
   la misma caja de 44px. Mismo patrón: hitbox 44px transparente + caja visible interior ~28-32px
   con el estilo actual (border/background/color condicionales según estado activo — no cambies
   esa lógica, solo la estructura de la caja).

3. **`src/musiclab/MusicLab.jsx:1268-1272`** — botón ✕ de borrar cada track dentro del panel de
   confirmación. Mismo patrón hitbox/visual.

## Tarea — el panel "ELIMINAR TRACK" debe ser un modal fijo, no un panel inline

**Dónde:** `src/musiclab/MusicLab.jsx:1253-1275` aprox (`{showDelete && (...)}`). Hoy es un
`<motion.div>` que se expande INLINE en el flujo normal de la página (con `max-h-[40vh]
overflow-y-auto` ya añadido en la ronda anterior). El problema persiste porque el panel puede
abrirse muy abajo en la página (tras el reproductor de 2 filas + toolbar + búsqueda), y aunque su
contenido interno scrollee, el panel entero puede quedar fuera del área visible sin que el usuario
sepa que tiene que hacer scroll de página para encontrarlo — percibido como "se sale de pantalla".

**Fix:** conviértelo en un modal fijo centrado en viewport, igual patrón que
`DropComposeModal` en `src/musiclab/DropsManager.jsx:74` (`className="fixed inset-0 z-[999] flex
items-center justify-center p-6"` + backdrop). Así el panel de borrar siempre aparece centrado y
visible sin depender de dónde esté el scroll de la página, y su lista interna de tracks mantiene
el `max-h` + `overflow-y-auto` ya existente pero ahora dentro de un contenedor de modal con ancho
acotado (similar a como ya hace `DropComposeModal`).

## Restricciones

- No cambies la lógica de qué track se borra ni las confirmaciones existentes — solo estructura
  visual (hitbox/caja) y el contenedor (inline → modal).
- No bajes ningún hitbox de 44px.
- `npm run build` debe pasar antes de reportar hecho.
- Verifica visualmente (o razona explícitamente) que cada caja visible ahora es más pequeña que
  el hitbox que la contiene — esa es la prueba de que el fix funcionó esta vez.

## Hand-off a Sonnet

Reporta archivo:línea de cada uno de los 4 cambios (3 hitbox/visual + 1 modal). Sonnet verifica
con grep puntual + build, no relee los archivos completos.
