# INDEX.md — specs funcionales de el-bunker

> **Esto NO es documentación histórica.** Las specs de esta carpeta definen el comportamiento
> vigente del producto y tienen requisitos numerados que se citan en diseños, ADRs y tarjetas.
> Creado el 7-ago-2026 por decisión de Edu, tras comprobarse que `docs/spec/` no estaba en el
> `CANON.manifest` y que la auditoría que se declaró "al 100% del canon" clasificó la carpeta
> entera como *"documentación histórica fuera del alcance funcional"* y solo la muestreó
> (`docs/operacional/auditoria_total_2026-08-02_REPETIDA_9_HERMES.md:185-192`, regla
> `U3_PATH_DOCS`).

## Cómo se usa este índice

**Este fichero es el único de `docs/spec/` que exige el `CANON.manifest`.** Se lee entero —son dos
páginas— y desde aquí se abre **solo la spec que toque** lo que vayas a hacer. No hay que leerse
las cuatro para cambiar un botón, pero tampoco vale diseñar sin abrir la que corresponde.

**Regla:** si vas a escribir un diseño, un plan o un ADR que toque alguna de las áreas de la tabla,
**abres esa spec antes**. Si no la abres, lo que escribas contradirá requisitos vigentes sin
saberlo. Ya ha pasado: `docs/disenos/DISENO_HUD_DESKTOP_2026-08-07.md` se escribió sin ellas y al
cruzarlo aparecieron 3 contradicciones, 10 correcciones y 11 huecos.

## Tabla de enrutado

| Si vas a tocar… | Abre | Prefijos de requisito |
|---|---|---|
| Reproductor, cola, historial, aleatorio, bucle, playback, vibe, tags de música, transiciones de color, visualizador, MediaSession, Cast, atajos y gestos del reproductor | `el_bunker_reproductor_spec_v2.md` | `S` sesión · `Q` cola · `VB` vibe y tags · `C`/`EC-C` contexto · `P`/`EC-P` playback · `SH` aleatorio · `L` bucle · `A` Android · `M` MediaSession · `CAST` · `UX`/`UX-G` · `VIZ` visualizador · `T` transiciones |
| Galería del VAULT: los 6 modos, capa ambiental por Era, panel de detalle de una foto, virtualización, edge cases de fotos | `galeria_vault_spec.md` | Sin numerar. Secciones por modo: WALL, CINEMA, MAP, DIALOGUE, REEL, EXHIBITION. Fases A/B/C al final |
| CAPSULES: las 4 sub-tabs (Timeline, Smoke, Time Capsules, RECAP) | `capsulas_spec.md` | `SS` smoke · `TC` cápsulas del tiempo |
| Tipos de entrada del VAULT, categorías de contenido | ⛔ **`taxonomia_vault.md` ya NO es el catálogo vigente** — lo sustituye **ADR-033** (14-ago-2026): cuatro secciones MEMORIA / PALABRAS / LUGARES / LISTAS + CAJA FUERTE aparte. La spec pasa a histórico y se consulta solo por trazabilidad | Numeración `1.1`-`14.4` (histórica) |
| Tracks, playlists, escucha compartida, drops, estadísticas, y el reparto Fase A/B/C del proyecto | `el_bunker_specs_externas_y_fases.md` | `TR` tracks · `LI` playlists · `SC` escucha compartida · `D` drops · `STAT` |
| Contraste entre lo especificado de VAULT y de MusicLab | `auditoria_cruzada_vault_musiclab.md` | — |
| Acceso por clave para test y admin | `SPEC_ACCESO_TEST_ADMIN_2026-08-02.md` | Implementado y cerrado (ADR-028). Consulta, no diseño |
| Inventario de features existentes | `inventario_completo_features.txt` | Referencia, no normativo |

## Precedencia, que hace falta decirla

1. **`docs/Nucleo/CONTRATO.md` manda sobre las specs.** Los ADRs son posteriores a varias de ellas.
   En concreto, la spec del reproductor es de la época de Google Drive y en algunas líneas lo dice
   (`S6` guarda la cola en `queue_[userId].json` en Drive; la tabla de contexto dice "Storage BD:
   Drive"). **Ahí gana el CONTRATO**: ADR-002 y ADR-024 pusieron la cola en D1 y deprecaron Drive.
2. **Lo funcional y de comportamiento de las specs sigue vigente entero** y no se enmienda de
   palabra: se enmienda con un ADR que lo diga con nombre y apellidos.
3. **Las enmiendas vivas están en ADR-029** (7-ago-2026): "Android-only" pasa a "Android primero,
   escritorio como segundo cliente de primera clase"; `UX8` (forzar portrait) queda limitada al
   móvil; el selector de 6 modos de galería sigue horizontal en móvil y pasa al raíl en escritorio;
   y la regla de cero emoji prevalece sobre la iconografía de caracteres dibujada en las specs.
4. **Enmiendas de ADR-032 y ADR-033** (14-ago-2026):
   - `VIZ2` deja de decir *"no configurable manualmente por el usuario"*: el preset por vibe es
     punto de partida y la elección del usuario manda mientras dure la sesión (ADR-032, decisión
     X-1 de Edu). El placeholder `VIZ-M13` sigue abierto y ahora es consecuencia directa de esto.
   - `UX6` se completa con los tres modos que faltaban: VU meters, fondo plasma/humo y partículas
     reactivas (ADR-032).
   - **`taxonomia_vault.md` deja de ser spec viva** y la sustituye ADR-033.
   - `galeria_vault_spec.md:46` (*"barra horizontal en cabecera"*) **vuelve a estar vigente también
     en escritorio**, dentro de la sección MEMORIA: la enmienda X-5 de ADR-033 deshace en ese punto
     lo que ADR-029 había mandado al raíl, porque el raíl pasa a alojar las cuatro secciones.

## Placeholders abiertos

El registro de decisiones pendientes vive al final de `el_bunker_reproductor_spec_v2.md`. Los que
siguen abiertos y afectan a diseño: `VB10-M3` (contraste, decisión tras test en dispositivo),
`VB20-M4` (vibe fusionado playlist+canción, Fase B, bloqueado por `Q14`), `TR1-M6` (duración de la
transición de vibe, provisional), `VIZ-M13` (presets del visualizador por vibe), `VIZ-M15`
(animación de entrada), `TRACKS-M23` (qué acciones de track son frecuentes), `UI-M25` (iconografía
del toggle de modos de vista — **se propone cerrarlo** en el §2.2 R-10 del diseño de la HUD, con
`menu`/`grid`/`archive` del registro de `Icon.jsx`).

## Quién cita estas specs hoy

- `docs/disenos/DISENO_HUD_DESKTOP_2026-08-07.md` — §2 reconcilia el diseño de escritorio con
  ellas; §15 es un anexo de cobertura con los 118 requisitos del reproductor, uno a uno.
- `docs/Nucleo/CONTRATO.md` — ADR-029.
