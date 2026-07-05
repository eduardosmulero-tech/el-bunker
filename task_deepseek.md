# 🟡 S145 — FASE B: reproductor premium (carátula base + CRT global + cola peek)

> **Nota de proceso (desde esta ronda):** el archivado de tu propio resultado en
> `docs/sesiones/S145_tareas_cerradas.md` y la limpieza de este archivo corren por tu cuenta, al
> CIERRE de tu turno (después de que Sonnet apruebe) — no de Sonnet. Cuando termines la tarea de
> abajo y Sonnet confirme en el chat que quedó bien, tu siguiente acción antes de la próxima tarea
> es: mover tu bloque "✅ RESULTADO DEEPSEEK" de este archivo a `docs/sesiones/S145_tareas_cerradas.md`
> (mismo formato que las entradas ya existentes ahí) y dejar `task_deepseek.md` MAGRO (solo la
> tarea vigente). Esto le ahorra tokens a Sonnet — es trabajo mecánico de texto, no de revisión.
>
> **Estado:** 🟡 Abierta 2026-07-05. Ronda anterior (R4, commit `898b9f9`) cerrada y pusheada.
> Esta es la siguiente pieza del plan vigente `docs/operacional/auditoria_fable_1.0.md` — FASE B,
> "un pliego": las 3 decisiones de diseño que Fable resolvió en
> `docs/operacional/cola_decisiones_fable.md` (sección "✅ RESOLUCIÓN FABLE", decisiones 1, 2-global
> y 3). Léela completa antes de tocar código — tiene las notas de implementación vinculantes.
> **Contrato:** editar código directamente como agente. Nunca pliego. No tocar ADRs.
> **Verificación:** Sonnet revisa con grep puntual + build + lectura de diff real.

## Contexto

Tres piezas independientes pero relacionadas, todas dentro del reproductor (MusicLab/Winamp).
Cada una tiene su decisión ya resuelta — no hay ambigüedad de producto, solo implementación.

## 1. Carátula como capa base del visualizador (decisión 1, OPCIÓN B)

**Dónde:** `src/musiclab/WinampPlayer.jsx:607-610` (wrapper de `AudioVisualizer`, hoy
`background: "#0a0a0a"` opaco), `src/musiclab/AudioVisualizer.jsx` (canvas — ya transparente:
`ctx.clearRect` en el loop de `draw`, sin fillRect opaco excepto trail sutil en wave/radial a
0.15 alpha — **no toques ese archivo salvo que lo necesites**, ya deja pasar un fondo detrás).

**Fix:**
- Convierte el wrapper de `WinampPlayer.jsx:607-610` en un contenedor `relative` con la carátula
  (`track.thumbnail`) como capa de fondo `absolute inset-0 object-cover`, y el `<AudioVisualizer>`
  encima (ya es transparente, no hace falta z-index especial si el orden en el DOM es correcto).
- Resuelve la URL del thumbnail con el mismo patrón que `PlayerContext.jsx:1121` (R2 key → URL
  absoluta): `track.thumbnail.startsWith("http") ? track.thumbnail : \`${import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev"}/${track.thumbnail}\``.
- Scrim oscuro inferior para legibilidad (gradiente `linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%)` o similar, ajusta a tu criterio visual).
- **Sin `track.thumbnail`:** fallback al color de vibe + icono (`accentColor` y `vibeConf?.icon`,
  ya calculados en el componente, líneas 341 y 586) en vez de negro vacío.
- El contenedor `#0a0a0a` sigue siendo el fondo de respaldo (no lo quites — evita el bug de
  transparencia de PLIEGO-230).
- Ajuste fino de opacidad de la carátula mientras suena (para que las barras se lean) queda a tu
  criterio visual — repórtalo si lo aplicas.

## 2. CRT global reducido (decisión 2, pieza "global" únicamente)

**Dónde:** `src/layout/Layout.jsx:22` (`ScanlineOverlay`, hoy
`rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px`).

**Fix:** baja la opacidad de las scanlines de 0.25 a **0.10–0.12**. Solo ese valor — no toques
`NoiseOverlay` (línea 29-38, ya está a 0.03, se queda igual). No es necesario hacer nada con
z-index ni excluir zonas — la decisión de Fable fue bajar el global, no seccionar por zona (la
pieza de "arte grande libre de CRT" es de FASE C, no de esta ronda).

## 3. Cola peek — línea "A CONTINUACIÓN" (decisión 3, OPCIÓN A + swipe-up existente)

**Dónde:** `src/musiclab/WinampPlayer.jsx:630-646` (Seek Bar, justo antes de la fila de
transporte que empieza en la línea 648), `src/core/PlayerContext.jsx` (necesita nueva pieza
`peekNextTrack`, expuesta en el value del Provider ~línea 1624-1650).

**Fix — PlayerContext.jsx primero:**
Añade un valor `peekNextTrack` (NO una función que mute estado — debe ser de solo lectura, sin
efectos secundarios, sin consumir la cola ni avanzar el índice de shuffle) que replique
exactamente la lógica de `skip(1)` (líneas 622-762) para decidir "cuál sería el siguiente":

- Si `loopModeRef.current === "track"` → peek = `activeTrack` (se repite a sí mismo).
- Si `localQueue.length > 0` → mismo algoritmo que líneas 652-658: primer item de `localQueue`
  que no sea igual a `activeTrack.id` (salta duplicados). Si todos son duplicados → `null`.
- Si `localQueue` vacía → `list = contextTracksRef.current ?? tracks`, `idx = list.findIndex(t => t.id === activeTrack?.id)`, `base = idx < 0 ? 0 : idx`:
  - Si `shuffle` → lee (sin avanzar) `shuffledListRefStable.current[shuffleIndexRefStable.current]`. Si el array está vacío/agotado (shuffle aún no generó orden) → `null`. **No generes un nuevo orden shuffle solo para el peek** — eso es un efecto secundario, evítalo. Limitación conocida y aceptable: el peek no se ve hasta que shuffle haya avanzado una vez.
  - Si `loopMode === "list"` y `base >= list.length - 1` → peek = `list[0]`.
  - Si `loopMode === "off"` y `base >= list.length - 1` → peek = `null` (fin de cola).
  - Si no → peek = `list[(base + 1) % list.length]`.

Impleméntalo como valor derivado (`useMemo` con las dependencias correctas, mismo patrón que
`playbackContext` en la línea 888) — no como estado propio ni ref. Expórtalo junto al resto en el
`Provider value={{...}}`.

**Fix — WinampPlayer.jsx:**
- Destructura `peekNextTrack` de `usePlayer()` (línea 47-64).
- Debajo del bloque Seek Bar (después de la línea 646, antes de la línea 648), añade una línea
  `text-xs opacity-50 truncate` con formato `A CONTINUACIÓN: {título} — {artista}` cuando
  `peekNextTrack` no es `null`. Si es `null`, no renderices nada (sin espacio vacío).
- Tappable: `onClick` dispara `window.dispatchEvent(new CustomEvent("bunker_swipe_up_queue"))` —
  el mismo evento que ya abre la cola completa vía swipe-up (línea 257). No dupliques lógica de
  apertura de cola, reusa el evento.
- Altura objetivo ~20px, no debe empujar significativamente el layout del player (ya creció con
  PLIEGO-237).

## Restricciones

- No cambies lógica de reproducción/skip real — `peekNextTrack` es puramente de lectura, un
  espejo de `skip(1)`, nunca debe mutar `localQueue`, `shuffledListRefStable` ni
  `shuffleIndexRefStable`.
- No toques `AudioVisualizer.jsx` a menos que compruebes que hace falta (ya es transparente).
- No toques `NoiseOverlay` en `Layout.jsx`, solo `ScanlineOverlay`.
- FASE C (lightbox unificado, WALL museo, DEMO cleanup) no es esta ronda — no la adelantes.
- `npm run build` debe pasar antes de reportar hecho.
- Verifica en el navegador si es posible (o al menos revisa visualmente la lógica) que el peek no
  aparece cuando no hay siguiente track (fin de cola sin loop).

## Hand-off a Sonnet

Reporta archivo:línea de los 3 cambios (carátula base, CRT global, peek). Indica explícitamente
qué decidiste para el ajuste fino de opacidad de carátula (punto 1) y confirma que
`peekNextTrack` no muta ningún ref/estado de cola. Sonnet verifica con grep puntual + build +
lectura del diff real.
