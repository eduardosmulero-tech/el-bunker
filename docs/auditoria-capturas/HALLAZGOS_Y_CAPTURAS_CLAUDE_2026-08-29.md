# HALLAZGOS Y CAPTURAS — Sesión de auditoría de El Búnker (29-ago-2026)

> Documento único de entrega para la auditoría externa de Claude por capturas.
> Léelo junto con `EXPLICACION_APP_EL_BUNKER.md` (fuente de verdad del producto)
> y `CLAUDE_SESION_AUDITORIA_CAPTURAS.md` (protocolo de la sesión).
>
> **Metodología de este documento:** todo hallazgo de código está verificado
> contra el árbol actual (archivo:línea). Lo que es **hecho verificado** vs
> **hipótesis** está marcado explícitamente. Las capturas se tomaron con el
> harness oficial de auditoría del proyecto (`tools/audit-ui/`): build real de la
> app, sesión sembrada, datos de fixture y vista móvil 390x844 (Chrome Edge
> headless). **No se tocó producción ni se modificó ningún código de la app.**
>
> Nota de contexto: las capturas usan **datos de fixture**, no los datos reales
> de D1 (527 fotos / 529 tracks). Los números de pantalla (entradas, tracks,
> duraciones) son los de los fixtures. Lo que se audita es **estructura,
> comportamiento y estados**, que son idénticos a producción.

---

## 0. RESUMEN EJECUTIVO

De los 8 puntos de investigación, **2 son fallos reales de UI** (iconos
descentrados de forma sistemática; cola sin sección "próximos" ni aviso de
vacío), **3 son falsos positivos con explicación verificada** (el "· OFFLINE ·"
no es conectividad sino presencia de la pareja; el "0:00/0:00" depende del
`<audio>` y no cae al dato de duración de D1; el icono "?" de SHARED SESSION es
un fallback legítimo por falta de mapeo), **2 son comportamientos correctos que
parecen sospechosos** (el icono del filtro de era es decorativo y no borra nada;
el color de "45 MIN" es naranja #ff6b35, no el rojo destructivo), y **1 es un
gap de diseño** (la tarjeta PORTADA de RECAP es texto puro, nunca tuvo asset).

**Dato duro que apuntala el punto 1:** con la app cargada al 100% (0 errores de
consola, 0 peticiones fallidas, datos renderizados), el texto `· offline ·`
aparece en la barra superior de **todas** las pantallas — igual que en las 9
capturas de Edu. No es un fallo de red: es el indicador de presencia.

---

## 1. HALLAZGOS DE CÓDIGO (archivo:línea + veredicto)

### 1.1 "· OFFLINE ·" persistente → ❌ FALSO POSITIVO: es la presencia de la pareja

**Hecho verificado.** El texto `· offline ·` de la barra superior móvil está en
`src/layout/Layout.jsx:163`, dentro de la **StatusBar**, en la fila de *presencia*:

```jsx
{partnerListening ? (… "EDU · track" …) : (
  <span …>· offline ·</span>   // Layout.jsx:163
)}
```

`partnerListening` es "¿el otro está escuchando?" (`src/core/PlayerContext.jsx:234`,
SC5 de la escucha compartida). En escritorio el mismo dato se pinta como
`OFFLINE` con icono `offline` en la topbar (`Layout.jsx:578`). **No hay ninguna
lectura de `navigator.onLine` ni de endpoints en ese texto.**

La conectividad real de la app vive en otro sitio, separado:
- `networkStatus` (navigator.onLine + listeners `window offline/online`,
  `src/core/PlayerContext.jsx:609` y `1423-1457`), que solo se pinta como un
  toast rojo "Sin conexión" (`Layout.jsx:723`).
- `dbStatus` (estado de la carga de datos, `src/core/VaultContext.jsx:141` →
  "ONLINE" en `:370/:665/:682`), que solo se muestra en el footer de escritorio
  (`Layout.jsx:850`, `STATUS · ONLINE`).

**Conclusión:** en las 9 capturas, David simplemente no estaba escuchando música.
No había ningún endpoint fallando. **Hipótesis de UX:** el texto parece un estado
de la app; conviene distinguir "pareja sin actividad" de "sin conexión" (p. ej.
"· sin actividad ·" o mostrar la conectividad real en móvil, que hoy no se
muestra en ninguna parte).

### 1.2 Duración 0:00/0:00 → ❌ PARCIAL: no hay fallback al dato de duración de D1

**Hecho verificado.** La duración mostrada sale **exclusivamente** del elemento
`<audio>`:
- `WinampPlayer`: `setDuration(audio.duration || 0)` en `timeupdate` y
  `loadedmetadata` (`src/musiclab/WinampPlayer.jsx:306-309`); `fmtTime(s)`
  devuelve `"0:00"` cuando `!s || isNaN(s)` (`:330-336`).
- `MiniPlayer`: misma lectura de `audio.duration` (`src/layout/Layout.jsx:261-270`
  y `fmtTime` en `:318`).
- **La tabla `tracks` de D1 tiene una columna `duration`** (`workers/schema.sql:84`),
  y los tracks la traen (fixtures: `"duration": 210`), **pero ningún componente
  la usa como fallback** (verificado: ni WinampPlayer, ni MiniPlayer, ni
  TrackCard leen `track.duration`).

**Por qué se ve 0:00/0:00:** hasta que el `<audio>` carga metadatos del stream
de R2 (byte-range), `audio.duration` es 0/NaN → `fmtTime` → "0:00". Eso ocurre:
(a) mientras el track está cargado pero **en pausa** (no ha empezado el stream) y
(b) si el stream tarda o falla. **Evidencia capturada:** en la app con fixtures,
el player muestra el track activo con `0:00 | 0:00` antes de pulsar play, y
`0:01 | 0:20` en cuanto suena (metadatos cargados).

**Hipótesis de fix (no aplicado):** usar `track.duration` como fallback cuando
`audio.duration` no esté disponible. El stream en sí funciona (ver §3, audio
reproducido con metadatos reales en el harness).

### 1.3 Iconos descentrados → ✅ FALLO REAL, sistemático

**Hecho verificado.** `src/core/ui/Icon.jsx` envuelve **lucide-react** sin ningún
tratamiento de alineación: renderiza el `<Component>` SVG directamente
(`Icon.jsx:176-183`). Dos causas sistemáticas:
1. **Sin centrado óptico por glifo.** Los iconos de lucide viven en un viewBox
   24×24 y los glifos asimétricos (play ▶, chevrons, flechas ←→, close ✕, send)
   tienen su masa desplazada del centro geométrico; al renderizarse tal cual en
   chips/filas `flex items-center`, se ven corridos respecto a los simétricos
   (círculo, estrella, corazón). No existe ningún mapa de offset por icono.
2. **SVG inline con alineación de baseline.** El componente no fuerza
   `display:block` ni `vertical-align:middle` en el SVG; fuera de un contenedor
   flex, el icono se asienta sobre la línea base del texto y queda descentrado
   verticalmente.

**Conclusión:** el problema afecta a "todos" porque es del registro, no del uso.
**Hipótesis de fix (no aplicado):** renderizar el SVG con `display:block` +
`vertical-align:middle` por defecto y añadir un mapa de compensación óptica
(`translate` por glifo) para los asimétricos, manteniendo el registro `ICONS`.

### 1.4 Icono papelera/caja en el filtro de era del TIMELINE → ✅ DECORATIVO, no borra nada

**Hecho verificado.** Las chips de era del filtro son
(`src/capsules/Timeline.jsx:254-270`):

```jsx
<Icon name="archive" size={13} label="Era" /> {era.name}   // :266
```

El icono es **`archive` (una caja)** y es puramente **decorativo**. El `onClick`
de la chip solo hace `setFilterEra(...)` (seleccionar/deseleccionar el filtro,
`:262-263`). **No hay ninguna acción de borrado, archivado ni mutación** en el
TIMELINE: no llama a `/api/eras`, no borra entradas ni eras. El icono "TODAS" no
lleva icono. No es una papelera y no es crítico: es un filtro.

### 1.5 Color del preset "45 MIN" de SMOKE SESSION → ❌ FALSO POSITIVO: es naranja, no rojo

**Hecho verificado.** `src/smoke/SmokeSession.jsx:29`:

```js
{ label: "45 MIN", seconds: 45 * 60, color: ORANGE }
```

donde `ORANGE = "#ff6b35"` (`:19`). El rojo destructivo `#ff3b3b` (`RED`, `:18`)
se usa para el preset **"90 MIN"** (`:31`) y para el botón de reset (`:486`). La
paleta de presets: 15→#00ffcc, 30→ACID #bfff00, **45→#ff6b35 (naranja)**,
1 HORA→PURPLE, 90→#ff3b3b (rojo). **No coincide con #ff3b3b.**

### 1.6 Icono "?" en SHARED SESSION STARTED → ✅ FALLO REAL (fallback genérico)

**Hecho verificado.** El mapa de iconos de eventos en el TIMELINE
(`src/capsules/Timeline.jsx:13-24`) **no incluye ninguna clave
`shared_session_*`** (ni `auth_login`, `auth_revoked`, `capsule_created`,
`capsule_unlocked`, `drop_deleted`, `era_deleted/updated`, `playlist_deleted`,
`tag_created/deleted`, `track_created/deleted`, `item_classified`, etc.). El
render cae en `EVENT_ICONS[e.event_type] || "help"` (`:123`, `:241`, `:298`,
`:329`) → **icono `help` (CircleHelp, el "?")**. Los eventos
`shared_session_started/joined/left` **sí se emiten** (verificado en
`workers/routes/sync.js` y la whitelist de `workers/utils/validation.js`), así
que cualquier sesión compartida que ocurra aparecerá en el feed con el "?".

**Conclusión:** falta mapear los tipos de evento que se emiten al registro de
iconos. La captura §3.8 muestra la fila "SHARED SESSION STARTED" con el "?".

### 1.7 Cola sin sección "próximos" → ✅ FALLO REAL (no existe ni aviso de vacío)

**Hecho verificado.** La vista COLA en móvil (`src/musiclab/MusicLab.jsx:837-1100`)
renderiza, por orden: **ANTERIOR** (historial, solo si hay), **AHORA** (track
activo, solo si hay), **COLA MANUAL** (solo si hay manuales) y **CONTEXTO**
(solo si hay de contexto). **No existe ninguna sección "PRÓXIMOS" ni ningún
aviso de cola vacía** (grep: cero apariciones de "PRÓXIMOS"/"No hay" en el
componente). Con `COLA [0]` y sin track activo, el área de la lista queda
**vacía sin explicación**. El dock de escritorio sí tiene el estado honesto
"COLA VACÍA" (`Layout.jsx:709`), pero el móvil no.

**Hipótesis de fix (no aplicado):** añadir una sección "PRÓXIMOS" y, cuando la
cola esté vacía, un aviso discreto tipo "No hay próximas canciones — añade
tracks a la cola" en vez de un bloque grande de estado vacío. La captura §3.5
muestra el estado actual.

### 1.8 Tarjeta "PORTADA" de RECAP → ✅ GAP DE DISEÑO: es texto puro, nunca tuvo asset

**Hecho verificado.** La sección PORTADA es una entrada más del array de
secciones (`src/capsules/Recaps.jsx:89-92`):

```js
{ icon: "book", label: "PORTADA",
  content: `Tu ${label} en El Búnker`,
  detail: `${stats.total} eventos · ${stats.uniqueDays} días activos` }
```

Y el render de todas las secciones es idéntico: **icono 32px + etiqueta +
contenido + detalle** (`Recaps.jsx:160-200`), en una card de vidrio de minHeight
180px. **No hay ningún campo de imagen/portada** en la sección ni en el contrato
de `/api/stats/recap` (que devuelve solo conteos y top X). **No es que falle un
asset: no hay asset definido.** Si la visión espera una portada real (foto de
era, gradiente, arte), es una decisión de diseño pendiente, no un bug de carga.

---

## 2. HALLAZGOS ADICIONALES (no pedidos, encontrados en el camino)

| # | Hallazgo | Evidencia | Severidad |
|---|---|---|---|
| A1 | En el feed del TIMELINE, un evento `track_play` muestra **"edu trk-003"** (el ID) cuando el payload no trae `track_title` — el sujeto de la fila es `detail.title \|\| detail.track_id \|\| detail.era_name \|\| ""` (`Timeline.jsx:335`) | Dump del TIMELINE | P3 (parecido al UUID-como-metadato que ya se corrigió en el mini-player) |
| A2 | El **preload gapless** del siguiente track se dispara y puede abortarse al navegar (`GET /music/trk-002.mp3 ERR_ABORTED`) | `console-issues.json` | P3 (benigno: el navegador cancela el preload; no afecta a la reproducción) |
| A3 | El **mini-player móvil solo existe si hay track activo** (`if (!activeTrack) return null`, `Layout.jsx:310`) — cuando no suena nada, no hay barra inferior de reproducción, solo la bottom nav | Código + capturas | P3 (informativo) |

---

## 3. CAPTURAS (móvil 390x844, datos de fixture, sesión "Edu")

Ruta: `tools/audit-ui/report/claude-audit/` (regenerable con
`node tools/audit-ui/capturar-movil-claude.mjs`).

| Archivo | Qué muestra | Para qué sirve |
|---|---|---|
| `1_vault_memoria_top_miniplayer.png` | VAULT → MEMORIA, scroll 0, **con un track sonando**: topbar con `· OFFLINE ·`, era "2021 — EL PRIMER AÑO", secciones, 6 modos, mini-player flotando (y=672-764) | Confirma §1.1 (el `· offline ·` con la app funcionando al 100%) y §3 pregunta 3 (scroll 0) |
| `2_vault_memoria_scroll650.png` | VAULT → MEMORIA, scroll 650: cabecera de sala WALL "2021…" bajo la topbar; el mini-player flota sobre las tiles de galería | Pregunta 3: **el mini-player NO tapa la cabecera de era** en este punto (medido: cabecera en y=10-97, mini en 672-764; barrido de scrolls 700-1025 → **ninguna cabecera quedó bajo el mini-player**) |
| `3_musiclab_track_reproduciendo.png` | MUSIC LAB con track **reproduciéndose de verdad**: duración `0:01/0:20` (no 0:00), visualizador (canvas 332×72) sobre la carátula, "A CONTINUACIÓN" con el siguiente track | Confirma §1.2 (la duración sí carga al reproducir) y que el visualizador se anima |
| `4_musiclab_lists_sinscroll.png` | MUSIC LAB → LISTS **justo al entrar, sin scroll**: el reproductor grande arriba (título bajo la topbar, sin solape) + lista de playlists ("LISTS [03]"), track sigue sonando (0:07/0:20) | Pregunta 1: **no hay solape del título con la barra superior al entrar** |
| `5_musiclab_cola_vacia.png` | MUSIC LAB → COLA con **cola vacía (COLA [00])** y track activo: se ven "ANTERIOR→(vacío)… AHORA" y **nada más — sin sección PRÓXIMOS ni aviso de vacío** | Confirma §1.7 |
| `6_capsules_timeline_filtro_eras.png` | CAPSULES → TIMELINE (top): chips TODAS / 2021 / 2022 (**con icono de caja decorativo**), barra de filtros de una fila, fila "SHARED SESSION STARTED" arriba | Confirma §1.4 y §1.6 (contexto del feed) |
| `7_capsules_timeline_final.png` | TIMELINE con scroll al final del feed | Pregunta 4: la última fila NO queda tapada por la bottom nav (medido: última fila bottom=200px vs nav top=775px; el `<main>` tiene padding-bottom de 80px) |
| `8_capsules_timeline_shared_session.png` | Fila "SHARED SESSION STARTED" con el **icono "?" (CircleHelp)** | Confirma §1.6 (fallback por falta de mapeo) |
| `9_capsules_smoke_presets.png` | SMOKE SESSION con los presets: 15 / 30 / **45 MIN (naranja)** / 1 HORA / 90 MIN (rojo) / CUSTOM | Confirma §1.5 (el 45 MIN es #ff6b35, no #ff3b3b) |
| `10_capsules_recap_portada.png` | RECAP → SEMANAL, tarjeta PORTADA: icono de libro + "Tu SEMANAL en El Búnker" + "128 eventos · 5 días activos" — **texto puro, sin imagen** | Confirma §1.8 |

**Datos de apoyo** (todos en el dump del harness):
- Audio: `paused:false · duration:20 · currentTime:1.39 · readyState:4 · error:null`.
- Consola: **0 errores**, 0 pageerrors; única petición fallida: preload `trk-002.mp3`
  abortada (benigna, A2).
- El track siguió sonando al navegar por LISTS (0:07), COLA (0:08), SMOKE (0:13)
  y RECAP (0:15) — el motor persiste entre pestañas, como debe.

---

## 4. LO QUE QUEDA SIN VERIFICAR / PREGUNTAS ABIERTAS PARA CLAUDE

1. **Iconos descentrados:** el código explica el patrón (glifos asimétricos sin
   compensación + SVG inline), pero la confirmación visual fina (cuáles y cuánto)
   se la dan las capturas a Claude.
2. **Título del reproductor vs barra superior:** en LISTS no hay solape al
   entrar; si Edu lo vio en otra pantalla o tras scroll, hace falta esa captura
   concreta (el reproductor no es sticky en móvil, así que solo el frame inicial
   es comparable).
3. **Recap PORTADA:** confirmar con Edu si la expectativa es una portada visual
   (decisión de producto) o si el texto actual es aceptable.
4. **"· OFFLINE ·"**: decidir si se renombra (p. ej. "sin actividad") o se añade
   un indicador de conectividad real en móvil (hoy no existe).
5. Las capturas usan fixtures; las **9 capturas originales de Edu** (datos reales)
   siguen siendo la referencia para contrastar densidades y volúmenes reales.

---

## 5. ANEXO TÉCNICO — cómo se generaron las capturas

- **Método:** el harness oficial del proyecto (`tools/audit-ui/run.mjs` y sondas):
  `vite build` con `VITE_API_URL=http://localhost:4326` → `vite preview` →
  Playwright (Edge headless) con **interceptación de todos los `/api/*`** con
  fixtures y **sesión sembrada** en sessionStorage (`bunker_jwt`, `bunker_user`
  = edu). Misma técnica usada para la aceptación visual de ADR-029/032/033/034.
- **Ajustes de esta sesión:** `/api/queue` → `[]` (cola vacía); `/api/events` →
  +2 eventos de hoy (incluido `shared_session_started`); `/api/stats/recap` →
  con datos; los MP3 de R2 (`/music/*`) → **WAV de 20 s generado** (sine 220 Hz)
  con CORS para que el `<audio>` cargue metadatos y el visualizador se anime.
- **Script reproducible:** `tools/audit-ui/capturar-movil-claude.mjs`
  (diagnóstico; no toca código de la app).
- **Limitación honesta:** no es la app contra producción real (requeriría
  credenciales OAuth); es el build real de la app con datos de prueba, que es el
  estándar de evidencia del propio proyecto para problemas estructurales/visuales.
