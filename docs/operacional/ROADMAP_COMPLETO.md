# 🗺️ ROADMAP COMPLETO — El Búnker (AUDITADO 16 Junio 2026 — Post-S123)

> **Propósito**: Auditoría cruzada specs/ADRs vs código real post-Fases A+B+C.
> **Total restante estimado**: ~19h concentrado (3 fases).
> **Última actualización**: 16 Junio 2026 — Post-S123: Fases A+B+C completadas.

---

## ⚠️ REGLAS INAMOVIBLES

1. **CONTRATO.md es ley** — 27 ADRs, 7 inamovibles.
2. **Motor audio único**: solo MusicLab instancia `<audio>` (ADR-018).
3. **3 tabs definitivos**: VAULT · MUSIC LAB · CAPSULES (ADR-017).
4. **Stats engine único**: tabla `events` en D1, append-only (ADR-019).
5. **Google OAuth2 solo auth**: Drive deprecado como BD (ADR-025).
6. **D1 es source of truth** para TODA persistencia.
7. **WorkerClient singleton** para todas las llamadas API.
8. **SEARCH/REPLACE contenedor lógico completo** (ADR-015).

---

## 1. ESTADO REAL (post-auditoría S123)

### ✅ COMPLETADO — Production-ready (~92%)

| Feature | Estado | Detalle |
|---|---|---|
| **Infraestructura D1+R2+Worker** | ✅ | 15 rutas, worker.js 81 líneas, D1 17 tablas |
| **WorkerClient singleton** | ✅ | get/post/patch/put/del, 42+ fetch calls migradas |
| **Drive purge** | ✅ | 27 funciones eliminadas, solo OAuth2 |
| **Auth JWT** | ✅ | HMAC-SHA256, sessionStorage, whitelist 3 users |
| **Build/lint/tests** | ✅ | 0 errores lint, 12/12 tests, CI pipeline |
| **PlayerContext core** | ✅ | Play/pause/skip/loop/shuffle/gapless/MediaSession |
| **S1/S2/S4 posición + offline** | ✅ | restorePosition 300s + OOM recovery + toast sin red |
| **Cola Q6/Q12/Q15** | ✅ | Límite 75 + playlist→cola + historial scroll |
| **Contexto EC-C2/EC-C3** | ✅ | Inyección dinámica + bottom sheet |
| **Chromecast** | ✅ | Sender básico con botón CAST |
| **Soft delete tracks** | ✅ | is_deleted, deleted_at, deleted_by en D1 |
| **VAULT CRUD + search** | ✅ | Entries + Eras + file upload a R2 + búsqueda texto |
| **VAULT Gallery WALL** | ✅ | Masonry 3 densidades + long-press + zoom modal |
| **VAULT Gallery DIALOGUE** | ✅ | Emparejamiento <5min + chat layout + hilos + asimetría |
| **CAPSULES 4 sub-tabs** | ✅ | Timeline, Smoke, TimeCapsules, RECAP |
| **Smoke Session** | ✅ | Presets + fade-out + nombre + vibe-aware + eventos Timeline |
| **Time Capsules** | ✅ | CRUD D1 + sellar + unlock animation |
| **RECAP** | ✅ | Semanal/mensual/anual + botón GUARDAR COMO ENTRADA |
| **MusicLab tracks/playlists/drops** | ✅ | CRUD completo con D1 |
| **ID3 metadata** | ✅ | Extracción al subir MP3 |
| **Escucha compartida SC1-SC14** | ✅ | Worker /api/sync + long-polling + corazón ♡/♥!/♥ + sync posición |
| **ErrorBoundary** | ✅ | Global + ChunkErrorBoundary |
| **CSP + CI/CD** | ✅ | Meta tag + GitHub Actions |

### 🟡 PARCIAL — Base implementada, falta polish (~5%)

| Feature | Qué tiene | Qué falta (spec) |
|---|---|---|
| **Gallery CINEMA** | Swipe + Ken Burns + overlay emocional | Audioguía real (voz), crossfade entre Eras, música de Era de fondo |
| **Gallery EXHIBITION** | Grid agrupado por Era | Canvas 2D espacial con zoom/pan estilo Miro/Figma |
| **Gallery REEL** | Auto-generación secuencias por día | Botón 📌 Pin para guardar como entrada tipo `reel` en D1 |
| **Time Capsules** | CRUD + sellado + countdown | Selector de contenido (entries/playlists), snapshot de playlist al sellar |
| **SC2 cola compartida** | Sync de cola entre dispositivos | Avatar/nombre de quién añadió cada track en la cola |

### 🔴 PENDIENTE (~3% = ~19h)

| Feature | Spec | Dependencia |
|---|---|---|
| **Gallery MAP** | Leaflet pines + líneas de viaje + slider temporal | Leaflet.js, coordenadas en entries |
| **CINEMA audio-guía** | Reproducir nota de voz si entry tiene `has_audioguide` | PlayerContext |
| **REEL pinning** | Guardar secuencia como entrada `reel` en D1 | Worker POST /api/entries |
| **EXHIBITION canvas 2D** | Zoom/pan espacial con react-zoom-pan-pinch | npm package |
| **Drops M20** | Fix visualización in-app vs browser nativo | PWA routing |
| **Drops M21** | Snapshot metadatos al guardar en favoritos | Schema drops + Worker PATCH |
| **VIZ lockscreen** | Live wallpaper API para Android lockscreen | MediaSession + PWA API |
| **VIZ entrada primer vibe** | Animación emerge desde negro | PlayerContext + framer-motion |

### ⚪ DIFERIDO (decisión consciente)

| Feature | Razón |
|---|---|
| **60+ tipos taxonomía VAULT** | Implementar cuando haya contenido real que lo demande |
| **FLAC / OPUS (AUDIO-M22)** | MP3 cubre 100% del uso actual |
| **DLNA / Cast universal** | Chromecast básico ya funciona |
| **Fusión de playlists (EC-LI4)** | Baja prioridad |
| **Live wallpaper lockscreen avanzado** | Depende de VIZ avanzado, Fase 3 |
| **Crossfade configurable** | Gapless ya implementado |

---

## 2. PLAN REALISTA PARA EL 100% (3 fases, ~19h)

### FASE 1 — Mapas y Cierre de Galería (~8h) 🔴
> Impacto alto en UX. MAP es el único modo en placeholder puro.

| Sesión | Qué | Horas |
|---|---|---|
| **S126-A** | MAP: Leaflet pines + líneas de viaje + slider temporal | 4h |
| **S126-B** | CINEMA audio-guía + REEL pinning (guardar como entrada D1) | 2.5h |
| **S126-C** | EXHIBITION canvas 2D: react-zoom-pan-pinch | 1.5h |

### FASE 2 — Cápsulas y Drops (~6h) 🔴
> Impacto emocional. Cierra los flancos de interacción entre usuarios.

| Sesión | Qué | Horas |
|---|---|---|
| **S127-A** | Time Capsules: selector de contenido + snapshot playlist | 3h |
| **S127-B** | Drops: fix M20 (in-app vs browser) + snapshots M21 | 3h |

### FASE 3 — Brillo Final (~5h) 🔴
> Pulido visual y atribución. Lo que separa "funcional" de "premium".

| Sesión | Qué | Horas |
|---|---|---|
| **S128-A** | VIZ: lockscreen wallpaper + animación entrada primer vibe | 3.5h |
| **S128-B** | SC2 atribución cola + smoke test E2E 2 dispositivos | 1.5h |

---

## 3. DEPENDENCIAS

```
FASE 1 (Mapas + Galería) ──── independiente
FASE 2 (Cápsulas + Drops) ──── independiente
FASE 3 (Brillo final) ──────── requiere Fases 1+2 completadas
```

---

## 4. CRITERIOS DE ACEPTACIÓN

| Fase | Criterio "done" |
|---|---|
| **1** | MAP con pines en Leaflet + slider temporal. CINEMA con audio-guía. REEL pineable. EXHIBITION con canvas 2D. |
| **2** | Time Capsules con selector de contenido. Drops sin abrir browser nativo + snapshots en favoritos. |
| **3** | Lockscreen wallpaper funcional. Animación entrada primer vibe. Cola muestra avatar de quién añadió. Smoke test 2 dispositivos OK. |

---

## 5. MÉTRICAS FINALES (post-S123)

| Métrica | Inicio (3 auditorías) | Post-S123 | Objetivo |
|---|---|---|---|
| Features completas | ~65% | **~92%** | ~95% |
| Bugs P0 | 8 | **0** | 0 |
| Bugs P1 | 13 | **0** | 0 |
| Gallery modes | 0/6 premium | **5/6** (MAP placeholder) | 6/6 |
| Escucha compartida | 0% | **100%** | 100% |
| Worker líneas | 600 | **81** | — |
| App.jsx líneas | 480 | **119** | — |

---

**Conclusión**: El proyecto está al ~92% de las specs completas. Fases A (MusicLab), B (Gallery premium), C (Escucha Compartida), y D (Capsules/Smoke) COMPLETADAS. Quedan ~19h en 3 fases para llegar al ~97-100%.

---

## 1. ESTADO REAL (post-auditoría)

### ✅ COMPLETADO — Production-ready

| Feature | Estado | Detalle |
|---|---|---|
| **Infraestructura D1+R2+Worker** | ✅ | 16 tablas, 14 route files, worker.js 81 líneas |
| **WorkerClient singleton** | ✅ | get/post/patch/put/del, 42 fetch calls migradas |
| **Drive purge** | ✅ | 27 funciones eliminadas, solo OAuth2 |
| **Auth JWT** | ✅ | HMAC-SHA256, sessionStorage, whitelist 3 users |
| **Build/lint/tests** | ✅ | 0 errores lint, 12/12 tests, CI pipeline |
| **PlayerContext core** | ✅ | Play/pause/skip/loop/shuffle/gapless/MediaSession |
| **Chromecast** | ✅ | Sender básico con botón CAST |
| **Soft delete tracks** | ✅ | is_deleted, deleted_at, deleted_by en D1 |
| **VAULT CRUD** | ✅ | Entries + Eras + file upload a R2 |
| **VAULT search** | ✅ | Búsqueda texto + filtros categoría + count badges |
| **VAULT Gallery WALL** | ✅ | Masonry 3 densidades + long-press + zoom modal |
| **CAPSULES shell** | ✅ | 4 sub-tabs: Timeline, Smoke, TimeCapsules, RECAP |
| **Smoke Session** | ✅ | Presets 15/30/45/60/90min + custom + fade-out + nombre + vibe-aware + Timeline events |
| **Time Capsules** | ✅ | CRUD con D1 + sellar + unlock animation |
| **RECAP** | ✅ | Semanal/mensual/anual + botón GUARDAR COMO ENTRADA |
| **MusicLab tracks/playlists/drops** | ✅ | CRUD completo con D1 + bottom sheet contexto + inyección dinámica |
| **MusicLab polish (spec v2)** | ✅ | S1/S2/S4/Q6/Q12/Q15/EC-C2/EC-C3/ID3 — 9/9 features |
| **ErrorBoundary** | ✅ | Global + ChunkErrorBoundary |
| **CSP** | ✅ | Meta tag en index.html |
| **CI/CD** | ✅ | GitHub Actions: build + lint + test + smoke |

### ⚠️ PARCIAL — UI existe pero no cumple la spec

| Feature | Qué tiene | Qué falta (spec) |
|---|---|---|
| **Gallery CINEMA** | Visor simple con prev/next | Full-bleed swipe, música ambiente de Era, Ken Burns, audioguías |
| **Gallery DIALOGUE** | Conteo EDU/DAVID + 3 miniaturas cada uno | Emparejamiento temporal (<5min), hilo conector, asimetría poética |
| **Gallery EXHIBITION** | Cards agrupadas por Era | Canvas 2D, agrupación por vibe/tag, layout orgánico |
| **Gallery REEL** | Scroll horizontal de 8 thumbnails | Auto-generación narrativa, secuencias, pinning manual |
| **Gallery MAP** | ❌ Placeholder: "Próximamente" | ❌ 0% implementado — requiere coordenadas en entries |

### 🔴 AUSENTE — 0% implementado

| Feature | Spec | ADR |
|---|---|---|
| **Escucha compartida** | SC1-SC14 completos | No tiene ADR propio |
| **S1/S2 posición tracks** | Guardar/restaurar posición en localStorage | Spec v2 |
| **Q6 límite 75 cola** | Sugerir guardar como playlist | Spec v2 |
| **Q12 añadir playlist entera** | Aviso si >75 tracks | Spec v2 |
| **Q15 scroll infinito historial** | 5 atenuados + revelar más | Spec v2 |
| **EC-C2 inyección dinámica** | Tracks nuevos en playlist activa | Spec v2 |
| **EC-C3 bottom sheet** | Reemplazar contexto o añadir | Spec v2 |
| **SS-1 nombrar sesiones** | Título para Smoke Session | capsulas_spec |
| **SS-4 vibe-aware ring** | Color del anillo = trackVibe | capsulas_spec |
| **SS-7/SS-8 notificaciones** | Push + evento Timeline | capsulas_spec |
| **Smoke rachas** | "10 sesiones esta semana" | capsulas_spec |
| **VAULT 14 categorías** | ~70 tipos (docs, finanzas, geografía...) | taxonomia_vault |
| **ID3 metadata** | Extraer al subir MP3 | spec v2 EC-TR6 |

---

## 2. PLAN REALISTA (lo que falta — 5 fases)

### FASE A — MUSICLAB POLISH (~8h) ✅ COMPLETADA S125
> Todas las features de la spec v2 del reproductor ahora implementadas.

| Sesión | Qué | Estado |
|---|---|---|
| **S121-A** | S1/S2 posición tracks + S4 sin red → neutral | ✅ Ya implementado (S78, S91) |
| **S121-B** | Q6 (75 limit) + Q12 (playlist→cola) + Q15 (historial scroll) | ✅ Ya implementado (S85c, S85d) |
| **S121-C** | EC-C2 (inyección dinámica) + EC-C3 (bottom sheet contexto) | ✅ Implementado S125 |
| **S121-D** | ID3 metadata extraction al subir MP3 (EC-TR6) | ✅ Ya implementado (S90) |

### FASE B — GALLERY PREMIUM (~16h)
> Llevar los 5 modos parciales + 1 placeholder al nivel de la spec.

| Sesión | Qué | Horas |
|---|---|---|
| **S122-A** | CINEMA premium: full-bleed swipe + música Era + Ken Burns | 4h |
| **S122-B** | DIALOGUE premium: emparejamiento temporal + hilos conectores + asimetría | 4h |
| **S122-C** | EXHIBITION canvas 2D: agrupación por vibe + layout orgánico | 3h |
| **S122-D** | REEL auto-generación: secuencias narrativas + pinning | 3h |
| **S122-E** | MAP: Leaflet con pines + líneas de viaje + slider temporal | 2h |

### FASE C — ESCUCHA COMPARTIDA (~12h)
> Feature más grande pendiente. SC1-SC14.

| Sesión | Qué | Horas |
|---|---|---|
| **S123-A** | Arquitectura: long-polling `/api/sync/state` + presencia mutua | 4h |
| **S123-B** | Botón corazón + animación + join session | 3h |
| **S123-C** | Sincronización posición + cola compartida + edge cases | 3h |
| **S123-D** | Tests + smoke test con 2 dispositivos | 2h |

### FASE D — CAPSULES + SMOKE (~6h) ✅ COMPLETADA S125
> Todas las features pendientes de la spec de CAPSULES ahora implementadas.

| Sesión | Qué | Estado |
|---|---|---|
| **S124-A** | SS-1 (nombrar sesiones) + SS-4 (anillo vibe-aware) | ✅ Ya implementado (S73) |
| **S124-B** | SS-7 (notificación pre-fadeout) + SS-8 (evento Timeline) | ✅ Implementado S125 |
| **S124-C** | Rachas Smoke + historial sesiones | ✅ Ya implementado (S73) |

### FASE E — CIERRE (~4h)
> Pulido final + smoke test completo.

| Sesión | Qué | Horas |
|---|---|---|
| **S125-A** | Smoke test E2E completo con JWT real (12 endpoints) | 1h |
| **S125-B** | Fixes de edge cases encontrados en smoke test | 2h |
| **S125-C** | Actualizar docs + CHANGELOG final | 1h |

---

## 3. DEPENDENCIAS

```
FASE A (MusicLab polish) ──── independiente, puede empezar ya
FASE B (Gallery premium) ──── independiente de A y C
FASE C (Escucha compartida) ─ requiere decisión: ¿long-polling o Durable Objects?
FASE D (Capsules/Smoke) ───── independiente
FASE E (Cierre) ───────────── requiere A+B+C+D completadas
```

---

## 4. LO QUE NO SE INCLUYE (decisión consciente)

| Feature | Razón |
|---|---|
| **14 categorías VAULT** (~70 tipos) | Árbol de features enorme. Implementar cuando haya contenido real que lo demande. |
| **DLNA / Cast universal** | Fase C original. Chromecast básico ya funciona. |
| **FLAC / OPUS** | Fase C original. MP3 cubre el 100% del uso actual. |
| **Crossfade configurable** | Gapless ya implementado. Crossfade es nice-to-have. |
| **Live wallpaper lockscreen** | Fase B original. Depende de visualizador avanzado. |
| **Fusión de playlists** | Fase C original. Baja prioridad. |

---

## 5. CRITERIOS DE ACEPTACIÓN

| Fase | Criterio "done" |
|---|---|
| **A** | S1/S2/S4 funcionales. Q6/Q12/Q15 en cola. ID3 al subir MP3. |
| **B** | 6 modos de galería funcionales. MAP con pines reales. |
| **C** | 2 dispositivos sincronizados: mismo track, misma posición. Botón corazón funcional. |
| **D** | Smoke sessions nombrables + anillo vibe-aware + notificaciones. |
| **E** | Smoke test 12/12 endpoints con JWT real. 0 bugs P0/P1. |

---

## 6. MÉTRICAS FINALES (post-auditoría)

| Métrica | Inicio (3 auditorías) | Actual | Objetivo |
|---|---|---|---|
| Features completas | ~65% | **~88%** | ~95% |
| Bugs P0 | 8 | **0** | 0 |
| Bugs P1 | 13 | **0** | 0 |
| Gallery modes | 0/6 premium | **1/6 premium** (WALL) | 6/6 |
| Escucha compartida | 0% | **0%** | 100% |
| Worker líneas | 600 | **81** | — |
| App.jsx líneas | 480 | **119** | — |

---

**Conclusión**: El proyecto está al ~88% de las specs. Fase A (MusicLab polish) y Fase D (Capsules/Smoke) COMPLETADAS. Quedan: gallery premium 6 modos (~16h), escucha compartida (~12h), y cierre (~4h). ~32h restantes para 100%.
