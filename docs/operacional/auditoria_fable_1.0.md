# AUDITORÍA TOTAL 1.0 — EL BÚNKER

> **Procedencia:** iniciada con modelo Fable, completada con **Opus 4.8** (cambio de modelo a mitad de sesión).
> **Estado:** ✅ REVISADO POR FABLE (2026-07-02). Veredicto: informe VÁLIDO — todos los P1/P2/P3 reverificados contra código real + producción en vivo. 2 errores factuales menores corregidos (ver sección "REVISIÓN FABLE" al final). PLIEGO-235 aprobado como primer pliego.
> Auditor externo, una pasada. No se confía en los docs — todo verificado contra código real + **producción en vivo** + **9 capturas reales del móvil** (22-Jun-2026, `docs/sesiones/`).
> Fecha: 2026-07-02.

---

## Contexto y foco (reencuadre de Edu)
Lo que importa de verdad son **VAULT (galería)** y **MUSIC LAB (reproductor)**. El resto (Capsules, Timeline, Smoke, Recap, escucha compartida) son adornos. **Objetivo real: que Edu y David abandonen para siempre sus galerías y reproductores de terceros y usen SOLO esta app.** Eso exige: (1) cero fallos que hagan sentir la app "rota", (2) paridad con la convención de la industria, (3) superar plataformas premium en las dos superficies core. El feedback humano real es la vara de medir.

---

## 1. RESUMEN EJECUTIVO
La arquitectura está **mejor de lo que los docs admiten** (D1 es fuente única real, WorkerClient singleton, rutas separadas, JWT con re-auth silencioso). El problema NO es arquitectónico: es (a) un puñado de bugs que rompen producción o filtran datos, (b) falta de pulido y paridad premium en reproductor y galería, (c) deriva documental. El score declarado ~74% cuenta "features que existen"; medido como "¿reemplaza a Spotify/Google Photos y se siente premium?", la realidad es **~50-55%**. Delta honesto: **-20 pts**. Dos hallazgos son de producción viva: RECAP está **roto (404)** y `/api/config` **filtra la presencia de ambos usuarios sin auth**. Y hay un bug estético que aparece en TODAS las capturas: el header "EL BÚNKER" se **solapa** con otro texto, haciendo que cada pantalla se vea defectuosa de entrada.

## 2. SCORE REAL POR MÓDULO (recalculado, ponderado por prioridad de Edu)

| Módulo | Declarado | REAL | Evidencia |
|--------|-----------|------|-----------|
| **MUSIC LAB / Reproductor** (PRIORIDAD) | 70% | **~55%** | Motor funcional fuerte (loop tri-estado, shuffle Q8/Q9, gapless, MediaSession, cola, cast, retry). Pero sin carátula grande, visualizador = vacío negro ~250px en pausa, controles apretados, slider volumen recortado, **muestra UUID como metadato** ("pezzet · 9f2e1c72…"), thumbnails ensuciados por scanlines. Función alta, sensación premium baja. |
| **VAULT / Galería** (PRIORIDAD) | 80% | **~45%** | WALL virtualizado OK; 5 modos restantes finos; **filtro de categoría DUPLICADO** (Vault.jsx + VaultGallery.jsx); nunca full-bleed (encajada en `max-w-md` 448px); MAP cae en `DEMO_ENTRIES_GEO`; sin lightbox real forward. |
| Escucha compartida | 85% | **~65%** | Wired y ambiciosa, pero presence leak (ver seguridad) y complejidad alta para 2 usuarios. |
| CAPSULES / RECAP | 80% | **~45%** | **RECAP roto en prod (404)**; Timeline ahogado por `track_updated`; Smoke sí está bien. |
| Backend D1/R2/Worker | ✅ desplegado | **~70%** | Sólido, pero stats.js no desplegado, config leak, R2 sin auth para docs sensibles. |
| Estética / UX global | 80% | **~50%** | Header solapado en todas las pantallas, contraste dim-amarillo/negro bajo (WCAG), contenido recortado bajo StatusBar. |
| **TOTAL honesto (paridad premium)** | ~74% | **~52%** | |

## 3. CUMPLIMIENTO NORMATIVO (ADRs) — solo lo relevante
- **🔒-3 Motor de audio único (ADR-018):** ✅ para `<audio>` (VaultGallery ya no instancia audio, S138 lo cambió a texto). ⚠️ PARCIAL: `CinemaView` usa `<video src controls>` (`VaultGallery.jsx:149`) que reproduce su propia pista de audio — zona gris del ADR.
- **🔒-6 Google OAuth solo auth (ADR-025):** ✅ COMPLIANT hoy. `_buildDbFromWorker` (`VaultContext.jsx:291`) trae entries/eras/tracks/tags/playlists/drops/files TODO de D1; `patchDb` es local-only. **El doc `technical-debt.md` TD-1 ("playlists/drops/tags siguen en Drive") está STALE** — ya migraron. Drive solo se usa para `listLibraryContents` (capacidad de bibliotecas), no persistencia.
- **🔒-5 Stats engine único (ADR-019):** ✅ estructural. Pero problema de diseño: `track_updated` (cada PATCH `workers/routes/tracks.js:96`) inunda `events` → Timeline y RECAP quedan dominados por ruido (200 eventos "TRACK UPDATED david" en capturas).
- **Conteo de endpoints:** CLAUDE.md dice "11", PROYECTO.md dice "22". Real: 17 prefijos en `ROUTES` (`worker.js:31`), ~40 métodos. Ambos docs imprecisos; PROYECTO más cerca. **Tablas:** CLAUDE.md dice "16", `schema.sql` tiene 13 (incl. `shared_sessions`).

## 4. HALLAZGOS P1/P2/P3 (archivo:línea, escenario concreto)

### P1 — rompen producción / filtran datos / se ven en cada pantalla
1. **RECAP roto en producción.** `src/capsules/Recaps.jsx:60` llama `GET /api/stats/recap`; probado en vivo → **HTTP 404** (`workers/routes/stats.js` commiteado pero NO desplegado). Resultado: RECAP muestra ceros + pill roja "⚠ Worker GET /api/stats/recap: 404". Regresión introducida en S139 (antes calculaba client-side y funcionaba, como en la captura del 22-Jun). Fix: `wrangler deploy` **o** fallback client-side si 404.
2. **Fuga de privacidad: `/api/config` público.** `workers/worker.js:47` marca `/api/config` como `false` (sin auth). `handleConfig` (`workers/routes/config.js:11`) devuelve TODO `app_config`, incluyendo `presence_edu`/`presence_david` con `track_title` + `updated_at`. Probado: `curl` anónimo devuelve qué escucha cada uno y cuándo. En una "bóveda privada" es P1. Fix: whitelistear keys (`schema_version`, `adventures_start_date`) o exigir auth.
3. **Header "EL BÚNKER" solapado** en las 9 capturas ("E LJUB ÚNLK E R 26"). `src/layout/Layout.jsx:85-124` StatusBar: brand + presence/otro texto colisionan. Es lo primero que ve el usuario en cada pantalla → sensación de app rota.
4. **UUID mostrado como metadato.** `src/layout/Layout.jsx:282` MiniPlayer `tagLabel = tag_label ?? tag ?? tag_id`; los tracks de D1 traen `tag` = UUID de tag custom → muestra "9f2e1c72-4669…" donde debería ir el label. Visible en mini-player de todas las capturas. Fix: resolver `tag_id`→label vía `db.music_lab.tags`.
5. **Contenido recortado bajo el StatusBar fijo.** `Layout.jsx:577` `<main class="pt-10">` (40px) vs StatusBar `min-height: calc(36px + env(safe-area-inset-top))` (~80px con notch). AdventureCounter aparece cortado arriba (captura VAULT). Fix: `pt` = altura real del header + safe-area.

### P2 — degradan la experiencia core
6. **Filtro de categoría duplicado en VAULT.** `Vault.jsx:901` renderiza `CATEGORY_FILTERS` y `VaultGallery.jsx:1223` lo renderiza otra vez → dos filas de emojis idénticas apiladas (captura VAULT). Confuso y feo. Fix: una sola fuente.
7. **Reproductor sin carátula / vacío negro.** `WinampPlayer.jsx` — `AudioVisualizer` solo pinta barras al reproducir; en pausa/idle deja ~250px negros. Premium (Spotify/YTM) es carátula-first. Gap #1 de paridad.
8. **Thumbnails ensuciados por CRT.** `Layout.jsx` `ScanlineOverlay` (mixBlendMode overlay, z-50) + `NoiseOverlay` (z-40) sobre la galería y las carátulas → arte muddy (capturas MUSIC LAB grid). El efecto que debería dar "premium" degrada justo lo que vende la app.
9. **Timeline ruidoso y de bajo contraste.** `track_updated` domina; en modo COMPACT (`Timeline.jsx`) no hay icono por tipo visible; dim-amarillo sobre negro casi ilegible.

### P3
10. `_resolveNextTrackUrl` (`PlayerContext.jsx:1228`) usa `tracks` global, no `contextTracksRef` → precarga gapless puede apuntar fuera del tag activo (follow-up S141 conocido).
11. `DEMO_TRACKS`/`DEMO_ERAS`/`DEMO_ENTRIES_GEO` siguen como fallbacks embebidos → placeholders en producción si falla la carga.
12. R2 (`workers/routes/r2.js`) sirve cualquier `r2_key` sin auth. Keys son UUID (difícil de adivinar) pero docs cat.3/12 (legal/médico/2FA) prometidos "cifrados" están en claro y son fetchables por URL — contradice la promesa de "caja fuerte digital".

## 5. CONTRADICCIONES código ↔ specs ↔ docs (stale)
- `technical-debt.md` TD-1: dice Drive persiste playlists/drops/tags → **falso hoy**, están en D1.
- `Arquitectura/INDEX.md`: sincronizado a S132; S140-S142 tocaron PlayerContext/WinampPlayer/VaultContext → architecture/data-flow/event-lifecycle/ownership-map/state-map **stale de facto**.
- `ESTADO.md`: "STAT-M9 slice 1 listo, pendiente deploy" → correcto, pero no advierte que **el cliente ya consume el endpoint** → prod roto mientras no se despliegue.
- CLAUDE.md "11 endpoints" y "16 tablas" vs realidad (17 prefijos, 13 tablas). Números desalineados.
- Galería spec promete detalle full-bleed, lightbox, live-sync, audioguías → mayormente no implementado; WALL es lo único maduro.

## 6. DEFINICIÓN DE "v1.0 / 100%" (checklist CERRADA, negociable)
v1.0 = "Edu y David usan SOLO esta app para música y fotos, sin volver a terceros." Criterios de salida:
- [ ] Ninguna pantalla se ve rota de entrada (header, clipping, UUIDs, duplicados resueltos).
- [ ] RECAP no da error en prod (deploy stats o fallback).
- [ ] `/api/config` no filtra presencia.
- [ ] **Reproductor premium:** carátula grande "now playing", controles limpios ≥44px sin recorte, cola/"a continuación" visible, contraste legible, artwork nítido (CRT no encima del arte).
- [ ] **Galería premium:** detalle de foto full-bleed con swipe + pinch-zoom, WALL como museo (no file browser), un solo filtro, badges de contexto legibles, cero DEMO en prod.
- [ ] Los 2 usuarios confirman por feedback que dejaron Spotify/Google Photos.

## 7. PLAN DE FASES HACIA v1.0 (foco: reproductor + galería)

**FASE A — "Deja de verse rota" (P1, frontend + 1 deploy). Esf: S.**
Header StatusBar sin solape · `pt` de main correcto · resolver tag_id→label en MiniPlayer/WinampPlayer · quitar filtro duplicado en VAULT · `wrangler deploy` (o fallback RECAP) · cerrar leak `/api/config`. Requiere paso manual: `wrangler deploy` + fix worker (backend). Clasificación: mixto.

**FASE B — Reproductor premium (frontend). Esf: M.**
Now-playing carátula-first (arte grande cuando no está el visualizador; visualizador a fullscreen por tap, ya existe UX6) · controles rebalanceados sin recorte de volumen · "a continuación"/cola peek · seek con thumb táctil ≥44px · sacar scanline/noise de encima del arte (bajar z o excluir la zona de carátula). Solo frontend. Decisión de producto de Edu: ¿cuánto CRT sobre el arte?

**FASE C — Galería premium (frontend). Esf: M-L.**
Detalle de foto full-bleed (swipe horizontal + pinch-zoom + metadata emocional) rompiendo el `max-w-md` · WALL como museo (densidad, badges legibles, stagger) · un solo filtro de categoría · quitar DEMO_ENTRIES_GEO cuando no hay datos reales · lightbox unificado. Solo frontend.

**FASE D — Endurecimiento (backend). Esf: S-M.**
R2 con auth/token para prefijos sensibles (vault/docs) · reducir ruido de `track_updated` en Timeline/RECAP (no emitir en cada micro-edición, o filtrar en la query) · resync docs de arquitectura (INDEX + technical-debt). Backend-blocked / requiere deploy.

## 8. PRIMER PLIEGO RECOMENDADO (hoy)
**PLIEGO-235 — FASE A.1: "Cero pantallas rotas"** sobre `src/layout/Layout.jsx` (contenedor lógico completo `StatusBar` + `MiniPlayer` + `<main>`):
1. Reescribir `StatusBar` para que brand y presencia no colisionen (truncado + gap real, presencia con `min-w-0` y el brand `flex-none` en línea propia).
2. `<main>` con `paddingTop` = altura real del header (usar la misma expresión `calc(...safe-area-inset-top)` que StatusBar) para no recortar AdventureCounter.
3. `MiniPlayer` resuelve `tag_id`→label desde `db.music_lab.tags` (no mostrar UUID).
Paralelo backend (1 edición): `workers/routes/config.js` → devolver solo `schema_version` + `adventures_start_date` (no presence). Luego `wrangler deploy`.

Criterio de éxito: en las 3 pantallas (VAULT, MUSIC LAB, CAPSULES) el header se lee "EL BÚNKER" limpio, el contenido no queda bajo la barra, el mini-player muestra el nombre del tag y `/api/config` anónimo no devuelve presencia.

---

## NOTA PARA FABLE (revisor)
Audita este informe con la REGLA DE ORO de la auditoría: no confíes en estos hallazgos por estar escritos — reverifica cada uno leyendo el código real y probando producción. Puntos donde conviene ser especialmente crítico con el trabajo de Opus:
- ¿El header solapado (P1.3) es realmente colisión de dos elementos en `StatusBar`, o un artefacto de la foto (scanline/mixBlendMode)? Confirmar en dispositivo o leyendo el JSX exacto.
- ¿`/api/stats/recap` sigue dando 404 hoy? (`curl` con y sin JWT). Si Edu ya hizo `wrangler deploy`, este P1 caduca.
- ¿El leak de `/api/config` sigue vivo? Reproducir el `curl` anónimo.
- Score real: recalcula el tuyo, módulo por módulo. Opus ponderó fuerte "sensación premium" — decide si esa vara es la correcta para v1.0.

---

## ✅ REVISIÓN FABLE (2026-07-02) — auditoría de la auditoría

Metodología: cada hallazgo reverificado leyendo el código real en master + probando producción en vivo
(`curl` anónimo) + inspección de captura real del móvil. NO se confió en el texto del informe.

### Hallazgos CONFIRMADOS (evidencia propia, no heredada)
| # | Hallazgo | Verificación Fable |
|---|----------|--------------------|
| P1.1 | RECAP 404 | ✅ `curl` en vivo 2026-07-02 → **HTTP 404**. `worker.js:43` registra `/api/stats` en el repo pero el Worker desplegado es anterior. Sigue vigente. |
| P1.2 | `/api/config` leak | ✅ `curl` anónimo → 200 con `presence_edu`/`presence_david` (título de track + timestamp). Reproducido hoy. `worker.js:47` = `false`, `config.js:10` hace `SELECT * de app_config`. |
| P1.3 | Header solapado | ✅ Confirmado en captura: texto intercalado real ("E LJU B ÚN LK E R…"), NO artefacto de scanlines. Matiz: lo que colisiona con el brand es la **fecha** (cluster derecho), no la presencia como sugería Opus. El fix del pliego (reestructurar StatusBar) cubre ambos casos. |
| P1.4 | UUID como tag | ✅ `Layout.jsx:282` fallback `tag ?? tag_id`; `tag_label` NO se setea en ningún punto del codebase (grep global: única aparición es ese fallback). Visible en captura. |
| P1.5 | Clipping bajo StatusBar | ✅ `Layout.jsx:577` `pt-10` (40px) vs header `minHeight calc(36px + safe-area) + paddingTop env() + 12px` → ~70-90px con notch. |
| P2.6 | Filtro duplicado | ✅ `Vault.jsx:902` + `VaultGallery.jsx:1224`, montados a la vez (`VaultGallery` en `Vault.jsx:978`) y con **estados `filterCategory` independientes** — peor de lo descrito: no solo se ve doble, pueden divergir. |
| P2.7 | Visualizador vacío en pausa | ✅ `AudioVisualizer.jsx:157-158` — canvas estático si `!isPlaying` (decisión "Fix 1 sin loop idle"). |
| P2.8 | Scanlines sobre arte | ✅ `Layout.jsx:15-25` ScanlineOverlay `fixed inset-0 z-50 mixBlendMode:overlay` + NoiseOverlay z-40, sobre `<main>` z-20. Cubre todo, carátulas incluidas. |
| P3.10 | Preload gapless fuera de filtro | ✅ `PlayerContext.jsx:1241` usa `tracks` global, sin fallback a `contextTracksRef`. |
| P3.11 | DEMO fallbacks | ✅ `MusicLab.jsx:60` (`?? DEMO_TRACKS`) y `VaultGallery.jsx:868` (default param `DEMO_ENTRIES_GEO`). |
| P3.12 | R2 sin auth | ✅ `r2.js` sirve cualquier `r2_key` por GET sin token. |
| ADR-025 | Compliant / TD-1 stale | ✅ `_buildDbFromWorker` (VaultContext.jsx:291) trae los 7 recursos de D1; Drive solo `listLibraryContents`. |
| ADR-018 | Zona gris `<video>` | ✅ `VaultGallery.jsx:149` `<video src controls>` en CinemaView. |
| Stats | `track_updated` inunda events | ✅ `tracks.js:97` (Opus citó :96 — trivial). |

### Errores factuales del informe de Opus (corregidos)
1. **Conteo de tablas: Opus dice "schema.sql tiene 13" → FALSO. Son 17 `CREATE TABLE`** (users, app_config,
   eras, entries, tags, entry_tags, tracks, track_tags, files, playlists, playlist_tracks, drops,
   queue_items, events, time_capsules, capsule_items, shared_sessions). CLAUDE.md dice 16 — también mal.
2. **"17 prefijos en `ROUTES`" → son 16**; el handler R2 va fuera del array (dispatch por `!path.startsWith("/api/")`).

### Verificación adicional que Opus no hizo (crítica para el pliego)
- ¿Whitelistear `/api/config` rompe algo? **NO.** `presence_*` solo se lee/escribe vía `/api/sync`
  (auth=true, `sync.js:25,110`). El frontend solo consume `adventures_start_date` de `/api/config`
  (`VaultContext.jsx:312-313`). El fix propuesto es seguro.

### Matices al score
- Las 9 capturas son del **22-Jun** (build pre-S136-S142); pero `Layout.jsx` en master conserva el mismo
  StatusBar/`pt-10`/MiniPlayer, así que los P1 visuales siguen vigentes hoy.
- El score ~52% es subjetivo pero defendible con la vara elegida ("¿reemplaza a Spotify/Google Photos?"),
  que es exactamente el reencuadre que pidió Edu. Se acepta.

### Veredicto
**Informe VÁLIDO. Plan de fases A-D aprobado. PLIEGO-235 aprobado como primer pliego** — sus 4 puntos
atacan hallazgos confirmados y el cambio backend es seguro (verificado que nada consume presence vía config).
Recordatorio: la parte backend requiere `wrangler deploy` manual de Edu, que además revive `/api/stats/recap`
(mata P1.1 y P1.2 en un solo deploy).

---

## ADDENDUM S145 (2026-07-04) — Decisión Fable: layout de controles WinampPlayer (FASE B)

FASE B (§7) decía "controles rebalanceados sin recorte de volumen" sin bajar a nivel de layout. Al empezar
la implementación se detectó (verificado en `src/musiclab/WinampPlayer.jsx:650-716`) que la fila única de
controles (3 clusters: loop/shuffle/like · prev/play/next/⚡/⊕ · 🔊+slider) no cabe en ~375px de ancho —
el cluster central necesita ≥144px pero solo dispone de ~85px, forzando `overflow-x-auto` real sobre
prev/play/next. Causa raíz del reporte de Edu: "los botones dificultan mucho el uso".

**Decisión Fable:** 2 filas. Fila 1 (primaria, sin scroll): ♡ · ◀◀ · ⏯(52px) · ▶▶ · ⊕ — controles de
transporte + like, siempre visibles. Fila 2 (secundaria): ⟳ · ⇄ · ⚡ · 🔊(popover con el slider, ya no
fijo en la fila — el volumen físico de Android ya está wireado vía `volumechange`). Hitbox de todos los
botones se mantiene en 44px mínimo siempre; el prop `size` de `WinampBtn` (roto — ambas ramas idénticas)
pasa a diferenciar solo peso visual (texto/alpha), nunca el hitbox.

Caveats abiertos: verificar en pantalla corta (~640px alto) que el player no empuje contenido fuera de
viewport tras crecer ~48px; y verificar en dispositivo real si `volumechange` dispara con los botones
físicos de Chrome Android — si no dispara, el popover pasa de "nice" a "necesario".

Ejecutado como **PLIEGO-237** sobre `WinampPlayer.jsx` (ver `tools/PLIEGO-237.txt`).

---

## ADDENDUM S145-b (2026-07-05) — Decisiones Fable: las 6 ambigüedades de FASE B/C resueltas

Deepseek identificó 6 frases del plan §7 que eran decisiones de producto sin resolver, no tareas.
Fable las resolvió todas (evidencia reverificada contra código real antes de decidir). Verdictos:

1. **Carátula-first = B**: carátula capa base permanente, visualizador encima; en pausa queda la carátula limpia. Fallback vibe-gradient si no hay thumbnail.
2. **CRT sobre arte = B**: scanlines globales 0.25 → ~0.10-0.12; arte grande (lightbox/modals) vía `createPortal` queda libre de CRT. (Ojo: `<main>` es stacking context `z-20` — subir z-index dentro NO escapa de los overlays; portal es la única vía.)
3. **Cola peek = A**: línea "A CONTINUACIÓN: …" bajo la seek bar, tappable → gesto swipe-up existente. El next debe salir de un `peekNextTrack` en PlayerContext (misma lógica que `skipDir`).
4. **WALL museo = B**: salas curatoriales por era (headers con nombre/fechas/color), masonry intacto dentro. Sin romper virtualización.
5. **DEMO en prod = A**: cero. Aplica también a DEMO_TRACKS y DEMO_ERAS (cierra P3.11 entero).
6. **Lightbox = B acotada**: un `EntryLightbox` (portal, full-bleed, swipe+pinch, metadata) adoptado por WALL/DIALOGUE/EXHIBITION/REEL; CINEMA lo abre vía su `onZoom` pero no cambia por dentro. Es a la vez el "detalle full-bleed" de FASE C.

Detalle completo con notas de implementación vinculantes: `docs/operacional/cola_decisiones_fable.md`
(sección "RESOLUCIÓN FABLE"). FASE B y FASE C quedan desbloqueadas.

---

## ADDENDUM CIERRE v1.0 (2026-07-08) — Decisión de Edu: cerrar el Búnker

Decidido por Edu (conversación 08-jul con Opus). **Este addendum MANDA sobre cualquier
"próximo paso" anterior.** El plan A-D no cambia de fondo; se ACOTA para cerrarse y no ampliarse.

### Decisiones marco (no re-litigar sin dato nuevo)
1. **el-bunker se queda en Cloudflare a propósito.** Es la ÚNICA pieza NO-local del ecosistema
   Promethe-os. Razón: sirve a David (no técnico) que necesita acceso always-on desde su móvil,
   independiente de que el PC de Edu esté encendido o en qué SO esté arrancado. Hosting gestionado
   = fiabilidad para el usuario que no puede depurar nada. NO se migra a self-hosted. Reconcilia
   con `promethe-os-base/NORTE.md` §5-F5: el-bunker NO se fusiona como servicio local — se
   documenta como la excepción hosted del ecosistema.
2. **Reproductor + estética: CONGELADOS.** FASE B cerró el reproductor a nivel premium y Edu quiere
   conservarlo TAL CUAL. Ningún pliego de cierre toca `src/musiclab/WinampPlayer.jsx`,
   `AudioVisualizer.jsx`, el motor de `PlayerContext.jsx`, `tokens.js` ni el look Cyber-Vandal,
   salvo bug que rompa producción. La estética es un activo a preservar, no a rediseñar.
3. **v1.0 = FASE C + FASE D. Y se acabó.** Nada de nice-to-haves nuevos. Cerrar, no ampliar.

### Estado real verificado (08-jul, contra código, no docs)
- **FASE A ✅** (S144, PLIEGO-235/236): 6 P1 cerrados (header, clipping, UUID tag, filtro
  duplicado, RECAP 404 desplegado, leak `/api/config`).
- **FASE B ✅** (S145, reverificado en código 08-jul): `peekNextTrack` (`PlayerContext.jsx:891`),
  "A CONTINUACIÓN" (`WinampPlayer.jsx:670`), CRT global 0.12 (`Layout.jsx:22` = decisión 2B),
  carátula base. `ESTADO.md` estaba STALE diciendo "próximo FASE B" — corregido este 08-jul.
- **FASE C ❌ pendiente. FASE D ❌ pendiente.**

### FASE C — Galería premium (frontend; decisiones YA resueltas en `cola_decisiones_fable.md`). Esf: M-L.
- **`EntryLightbox`** (decisión 6-B acotada): portal, full-bleed, swipe+pinch, metadata emocional.
  Adoptado por WALL/DIALOGUE/EXHIBITION/REEL; CINEMA lo abre vía su `onZoom` sin cambiar por dentro.
  **NO existe hoy** (grep 08-jul: cero). Es el "detalle full-bleed" y el mayor salto premium que queda.
- **WALL museo** (decisión 4-B): salas curatoriales por era (headers nombre/fechas/color), masonry
  intacto dentro, sin romper virtualización.
- **Cero DEMO en prod** (decisión 5A): eliminar fallbacks `DEMO_TRACKS` (`MusicLab.jsx:61`),
  `DEMO_ERAS` (`Vault.jsx:744`), `DEMO_ENTRIES_GEO` (`VaultGallery.jsx:867`) → estado vacío honesto.
- **Verificar** que el filtro de categoría duplicado (P2.6) quedó realmente cerrado en PLIEGO-236
  antes de darlo por bueno (REGLA DE ORO — `ESTADO` lo da por hecho, hay que comprobarlo).

### FASE D — Cierre y endurecimiento (backend + housekeeping). Esf: S-M.
- **Privacidad mínima para merecer "caja fuerte" (cierra P3.12):** `workers/routes/r2.js` exige
  token/JWT para prefijos sensibles (`/vault/docs/`, `/vault/photos/`, `/vault/videos/`). Hoy sirve
  cualquier `r2_key` por GET sin auth. **Es el único hueco de privacidad que bloquea v1.0.**
- **Bajar ruido `track_updated`:** no emitir evento en cada micro-PATCH (`workers/routes/tracks.js:97`)
  o filtrarlo en la query de Timeline/RECAP.
- **Housekeeping:** borrar los `.bak` de `src/` (MusicLab, WinampPlayer, Vault, SmokeSession);
  resync `Arquitectura/INDEX.md` + `technical-debt.md` (TD-1 stale); corregir conteos en
  CLAUDE.md/PROYECTO.md (17 tablas, 16 prefijos ROUTES).

### PARKING — POST-v1.0, OPCIONAL, NO bloquea cierre
- Cifrado en cliente del vault (defensa en profundidad más allá del R2 auth).
- Sustituir Google OAuth por auth propio (passkey/magic-link).
- Consolidar Vercel → Cloudflare Pages.
Con R2 con auth, la caja fuerte ya está cerrada para el caso real (2 usuarios). Reabrir esto es
decisión futura de Edu, no parte del cierre.

### Criterio de cierre v1.0 (binario, verificable)
- [ ] `EntryLightbox` vivo y adoptado por los 4 modos; foto full-bleed con swipe+pinch en móvil.
- [ ] WALL se ve como museo por eras, no file browser.
- [ ] Cero DEMO en prod (grep sin fallbacks activos).
- [ ] R2 no sirve prefijos sensibles sin auth (`curl` anónimo → 401/403).
- [ ] Timeline/RECAP sin inundación de "TRACK UPDATED".
- [ ] `.bak` fuera, docs de arquitectura sin stale, build+lint verdes.
- [ ] Reproductor y estética intactos (el diff del cierre NO toca los archivos congelados).

### Primer pliego del cierre
**FASE C.1 — `EntryLightbox`** (componente nuevo + adopción en WallView/DIALOGUE/EXHIBITION/REEL).
Es el mayor salto de "sensación premium" que queda y no depende de backend.
