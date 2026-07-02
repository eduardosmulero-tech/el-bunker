# TASK.md — Correcciones post-revisión PLIEGO-235 (para DeepSeek)

> ## RONDA 2 (revisión de PLIEGO-236)
> De las 5 tareas de la ronda 1, 3 quedaron correctas (2, 4, 5) y 2 necesitan otra pasada:
> ver **TAREA 1-BIS** y **TAREA 3-BIS** más abajo. El resto de este documento (tareas
> originales 1-5) queda como referencia de lo ya pedido — no repetir el trabajo ya hecho,
> solo aplicar las correcciones de las dos bis.

## TAREA 1-BIS — Orden cronológico en `docs/legacy/SESIONES.md`

**Problema:** Se archivaron S132→S144, pero en orden **descendente** (S144, S143, S142... S132)
justo después de la entrada S131 (que sí estaba en orden ascendente). El archivo debe leerse
cronológicamente de principio a fin.

**Qué hacer:** En `docs/legacy/SESIONES.md`, tomar el bloque que va desde `## S144` hasta el
final del archivo (`## S132 ...`) e invertir el orden de las entradas para que quede
`S131, S132, S133, ..., S143, S144`. No cambiar el contenido de cada entrada, solo el orden.

## TAREA 3-BIS — `wrangler d1 execute` sigue sin confirmar en `SESION.md`

**Problema:** La tarea 3 original no se aplicó. `docs/Nucleo/SESION.md` línea 7 sigue
diciendo textualmente:
`Edu: `npx wrangler d1 execute --remote` + `npx wrangler deploy`.`
Ese `wrangler d1 execute --remote` no está confirmado por Edu — solo confirmó el `deploy`.

**Qué hacer:** Reescribir esa línea en `docs/Nucleo/SESION.md` a:
`Edu: npx wrangler deploy (confirmado). RECAP responde 401 (antes 404), config sin leak.`
Quitar la mención a `wrangler d1 execute --remote` por completo salvo que Edu confirme
explícitamente que lo ejecutó (no asumir).

---


> Generado por Claude (Sonnet 5) tras auditar el trabajo de DeepSeek sobre PLIEGO-235 (FASE A.1).
> Rol: Claude coordina y revisa, DeepSeek ejecuta. Este documento es el encargo — no lo resuelvas
> tú, Claude; que lo aplique DeepSeek siguiendo `docs/Nucleo/REGLAS.md` (pliegos SEARCH/REPLACE
> vía `tools/pliego_apply.py`, salvo que la tarea sea puramente documental).
> Numeración: **PLIEGO-236** — correcciones antes de arrancar FASE B.

---

## Contexto (no repetir investigación, ya está hecha)

PLIEGO-235 (StatusBar sin solape, `pt` de main, `tag_id`→label en MiniPlayer, filtro duplicado
VAULT, whitelist `/api/config`) está **verificado correcto**: build 2.31s limpio, lint 0/0, y
producción en vivo confirma `/api/config` sin leak y `/api/stats/recap` ya no da 404 (da 401 sin
JWT, correcto). Nada de esa parte se toca.

El problema es lo que se hizo **fuera del alcance del pliego** al tocar `docs/Nucleo/SESION.md` y
`docs/Nucleo/ESTADO.md`. Corregir eso es el contenido de este task.md.

---

## TAREA 1 — Archivar S132–S143 en `docs/legacy/SESIONES.md` (prioridad alta)

**Problema:** El commit de PLIEGO-235 borró ~560 líneas de `docs/Nucleo/SESION.md` (sesiones S131
a S143 completas) y las reemplazó por un resumen de 5 líneas de S144. Eso por sí solo es correcto
—`SESION.md` es un dispatcher, no un archivo histórico— **pero el paso obligatorio de
`REGLAS.md` § CHECKLIST CIERRE DE SESIÓN ("Escribir entrada en docs/legacy/SESIONES.md") nunca se
ejecutó para S132–S143**. Resultado: ese historial no existe en ningún doc del repo, solo en
`git show HEAD:docs/Nucleo/SESION.md` (o commits anteriores). Si no se archiva, se pierde como
fuente legible la próxima vez que alguien pode `git log`.

**Qué hacer:**
1. Ejecutar `git show 8fe3c95:docs/Nucleo/SESION.md` (contenido pre-PLIEGO-235, con S131–S143
   completas) — o usa el HEAD actual antes de este commit, es el mismo contenido.
2. Por cada sesión S132 a S143 (12 entradas), condensar a una entrada corta en
   `docs/legacy/SESIONES.md`, siguiendo el mismo formato/nivel de detalle que ya usa la entrada
   `## S131 — 2026-06-17` que está al final de ese archivo (fecha, pliegos/commits, archivos
   tocados, hitos en bullets). No copiar el detalle extenso tal cual (tablas de bugs línea por
   línea, diffs narrados) — es un archivo de resumen, no un espejo.
3. Añadir las 12 entradas en orden cronológico, a continuación de la entrada S131 ya existente.
4. No tocar el `SESION.md` actual (S144) — ya quedó correcto tras PLIEGO-235, solo falta el
   archivado retroactivo.

**Criterio de éxito:** `docs/legacy/SESIONES.md` tiene entradas S131→S144 sin huecos. Cualquiera
puede reconstruir qué pasó en S132–S143 sin tocar git log.

---

## TAREA 2 — Corregir el score inflado en `docs/Nucleo/ESTADO.md` (prioridad alta)

**Problema:** `ESTADO.md` (post-PLIEGO-235) muestra `## Score (~78%)`, subiendo desde el ~52%
real que fijó la auditoría de Fable (`docs/operacional/auditoria_fable_1.0.md` §2). Ese ~52% se
calculó con la vara "¿reemplaza a Spotify/Google Photos, se siente premium?" — y PLIEGO-235 solo
cerró 6 hallazgos P1 de higiene/seguridad (header, clipping, UUID en tag, filtro duplicado, RECAP
404, leak de config). **Ninguno de los gaps de "sensación premium" que hundían el score se tocó**:
sigue sin carátula grande en el reproductor, sigue el CRT (scanlines/noise) encima del arte, sigue
sin full-bleed en la galería, sigue habiendo fallbacks DEMO. Subir 26 puntos por 6 fixes
cosméticos/seguridad es exactamente el sesgo de autoevaluación que la propia auditoría señaló como
problema del proyecto (`auditoria_fable_1.0.md`, sección "REGLA DE ORO... sesgo de
auto-evaluación esperable") — no lo repitamos.

**Qué hacer:**
1. En `docs/Nucleo/ESTADO.md`, sustituir la tabla `## Score (~78%)` actual por una que:
   - Mantenga el baseline real de la auditoría (~52%) como referencia explícita.
   - Anote que 6 P1 (higiene/seguridad) se cerraron en S144, pero que el score de "sensación
     premium" de MUSIC LAB y VAULT (los módulos prioritarios) **no se mueve** hasta FASE B/C.
   - No inventar un número nuevo sin evidencia. Si quieres dar una cifra, justifícala módulo por
     módulo como hizo el informe original (`auditoria_fable_1.0.md` §2), no una tabla plana.
2. Alternativa más simple y más segura: quitar la tabla de score de `ESTADO.md` y dejar solo una
   línea: `Score real: ~52% (auditoria_fable_1.0.md §2) — sin recalcular hasta cerrar FASE B/C.`
   Preferible si no hay tiempo para justificar cada módulo.

**Criterio de éxito:** `ESTADO.md` no afirma una mejora de score que no está respaldada por
trabajo hecho en las áreas que definían el gap.

---

## TAREA 3 — No afirmar el `wrangler d1 execute` sin confirmación (prioridad media)

**Problema:** `docs/Nucleo/SESION.md` S144 dice: *"Edu: `npx wrangler d1 execute --remote` +
`npx wrangler deploy`."* Edu solo confirmó el `wrangler deploy`. Afirmar un paso de migración de
schema que no está confirmado deja un dato falso en el registro de sesión.

**Qué hacer:**
1. Si Edu confirma que sí ejecutó `wrangler d1 execute --remote`, dejar la línea como está.
2. Si no lo confirma (o no se sabe), reescribir esa línea de `SESION.md` para reflejar solo lo
   verificado: `Edu: npx wrangler deploy (confirmado). RECAP responde 401 (antes 404), config sin
   leak.` — sin mencionar `d1 execute` salvo confirmación explícita.

**Criterio de éxito:** Ningún paso manual de Edu se documenta como hecho sin que él lo haya
confirmado.

---

## TAREA 4 — Limpieza menor en `src/layout/Layout.jsx` (prioridad baja)

Tres detalles menores detectados en la revisión de código, ninguno bloqueante, pero conviene
cerrarlos antes de que se acumulen como deuda:

### 4a. `paddingTop` de `<main>` no replica la fórmula real del header
El pliego pedía "usar la misma expresión `calc(...)` que StatusBar" para el `paddingTop` de
`<main>` (línea ~600). Lo aplicado usa una constante fija `calc(80px + env(safe-area-inset-top))`,
que no coincide exactamente con la altura real del `StatusBar` (dos filas + padding, ahora que la
fila 2 tiene botones `min-h-[44px]`). El margen de error es pequeño (~12px) y el degradado de
fondo del header ahí es casi transparente, así que probablemente no se ve, pero no es la solución
robusta que pedía el pliego.

**Fix recomendado:** medir la altura real del `StatusBar` con un `ref` + `ResizeObserver` (o
`getBoundingClientRect()` en un efecto) en `Layout.jsx`, y usar ese valor medido como
`paddingTop` de `<main>`, en vez de una constante adivinada. Si se prefiere no añadir esa
complejidad, como mínimo recalcular la constante con la suma real de: `paddingTop` del header
(`env(safe-area-inset-top, 12px)`) + fila 1 (~20px) + `mt-1` (4px) + fila 2 (44px, fijado por los
botones) + `paddingBottom` (12px) ≈ 92px, y documentar el cálculo en un comentario corto junto a
la constante.

### 4b. `minHeight` del `StatusBar` (línea 82) quedó desactualizado
`minHeight: "calc(36px + env(safe-area-inset-top, 8px))"` es el valor de antes de que el header
pasara a 2 filas. Es inofensivo (el contenido real ya lo supera, `flex-col` no lo recorta), pero
es un valor muerto/engañoso si alguien lo lee para entender la altura real. Actualizarlo para
reflejar la altura real de las 2 filas (ver cálculo de 4a) o eliminarlo si ya no aporta nada.

### 4c. Fallback `tag?.name` en `MiniPlayer` es código muerto
`Layout.jsx` (bloque `resolvedTagLabel`, cerca de la línea 285): `return tag?.name ?? tag?.label ??
null;`. El schema de `tags` (`workers/schema.sql:58`) solo tiene columna `label`, nunca `name`.
`tag?.name` nunca será verdad — quitar esa rama y dejar directamente `return tag?.label ?? null;`.

**Criterio de éxito:** build y lint siguen en 0 tras los tres cambios; sin regresión visual (el
pliego no cambia comportamiento, solo precisión del código).

---

## TAREA 5 — `WallView` pierde el mensaje de "sin entradas en [categoría]" (prioridad baja)

**Problema:** `VaultGallery.jsx` ahora pasa `filterCategory="all"` fijo a `WallView` (antes tenía
su propio estado). `WallView.jsx:506` usa esa prop solo para el texto del estado vacío ("Sin
entradas en [categoría]"). Como ahora siempre es `"all"`, ese mensaje nunca se personaliza aunque
el filtro real (en `Vault.jsx:591`) esté activo y devuelva 0 resultados — el usuario ve "Sin
entradas" a secas sin saber que es por el filtro.

**Fix:** en `Vault.jsx`, pasar el `filterCategory` real como prop de solo-lectura a
`VaultGallery` (línea ~978, junto a `entries` y `eras`), y que `VaultGallery` la reenvíe a
`WallView` en vez de hardcodear `"all"`. **No reintroducir el estado ni el filtrado duplicado en
VaultGallery** — solo pasar el valor para mostrar el mensaje correcto; el filtrado sigue
ocurriendo únicamente en `Vault.jsx`.

**Criterio de éxito:** si el filtro maestro en VAULT está en una categoría sin resultados, WALL
muestra "Sin entradas en [esa categoría]", no un genérico vacío.

---

## Orden sugerido de ejecución

1. Tarea 1 (archivo histórico) y Tarea 2 (score) — documentales, sin riesgo de romper build.
2. Tarea 3 — depende de confirmación de Edu; si no confirma, aplicar el fallback seguro.
3. Tareas 4 y 5 — código, generar como pliego SEARCH/REPLACE normal, verificar build+lint antes
   de entregar.

Al cerrar, seguir el checklist de `REGLAS.md` § CHECKLIST CIERRE DE PLIEGO: actualizar
`ESTADO.md` (sin volver a inflar el score) y registrar en `docs/legacy/PLIEGOS_HISTORIAL.md`.
