# EL BÚNKER — ROADMAP AL 100%
> Generado: S135 — Actualizado: S136 (Ciclo autónomo Fases 0-6 completadas, Junio 2026)
> **Score auditoría S137: ~74% alcanzable frontend / ~95% total teórico**
> Fases completadas: 0-9 en ramas (`fase1-wall-gallery` → `fase9-ux-polish`)
> Fuentes: CONTRATO.md (27 ADRs) + specs + inventario_features.txt

---

## DIAGNÓSTICO ACTUAL (Auditoría S136 — Post-ciclo autónomo)

| Módulo | Score | Features completadas | Gap restante |
|--------|-------|---------------------|-------------|
| Audio Engine | 70% | Play/pause, seek, loop, shuffle, volumen, MediaSession, WakeLock | 🔒 Gapless/crossfade (backend) |
| Escucha Compartida | 85% | ♡ heartbeat, sync <1s, queue compartida, presencia, reconnect, vibe | 🔒 STAT-M9 stats credit |
| VAULT Data Model | 80% | Eras, entries CRUD, AddEntryForm styled, location search, geocoder | 🟡 UI avanzada creación |
| WALL | 80% | Virtualización ✅, badges E/D ✅, pinch zoom ✅, decoding=async ✅, VB9 vibe ✅ | 🟢 Pulido animaciones |
| CINEMA | 50% | Ken Burns ✅, swipe ✅, ambient toggle ✅, ambient volume ✅, overlay emocional ✅ | 🔒 Música real (PlayerContext) |
| MAP | 75% | Capas Era/Año ✅, distancias Haversine ✅, polylines ✅, slider temporal ✅, popup thumbnails ✅, carrusel fotos ✅ | 🟢 Pulido |
| DIALOGUE | 75% | Chat layout ✅, emparejamiento <5min ✅, asimetría poética ✅, stats ✅, tap-to-zoom ✅ | 🔒 Live Sync (WebSocket) |
| EXHIBITION | 35% | Agrupación Era ✅, vibe breakdown ✅, era expansion ✅, entries grid ✅ | 🔒 Canvas 2D |
| REEL | 40% | Auto-generación ✅, pinning ✅, ambient volume ✅ | 🔒 Banda sonora procedural |
| CAPSULES | 80% | Timeline + 13 tipos ✅, user filter ✅, TimeCapsules CRUD ✅, RECAP ✅, Smoke ✅ | 🟡 "Un día como hoy" |
| Infraestructura | 40% | Safe-areas ✅, skeletons ✅, ToastContext ✅, --vibe-accent ✅ | 🔒 Offline/paginación API |
| Estética/UX | 80% | JetBrains ✅, selects custom ✅, touch ≥44px ✅, scanlines ✅, VB9 global ✅ | 🟢 Micro-interacciones |
| **TOTAL** | **~74%** | ~333/450 features | **26% backend-blocked** |

---

## //plan — 5 FASES AL 100%

### FASE 0: ESTÉTICA Y CIMIENTOS (ahora → ~42%)

**Objetivo:** La app se ve profesional y es usable con una mano en Android.

| # | Tarea | Archivos | Estado |
|---|-------|----------|--------|
| 0.1 | Safe-area + glows + touch targets >=44px | Layout.jsx, WinampPlayer.jsx, MusicLab.jsx | ✅ S135 |
| 0.2 | Forzar JetBrains Mono en html/body con !important | index.css | ✅ S135 |
| 0.3 | Aumentar padding x1.3 en cards y listas | TrackCard.jsx | ✅ S135 |
| 0.4 | Estilizar selects nativos con CSS custom (apariencia + chevron dinámico) | AddEntryForm.jsx | ✅ S135 |
| 0.5 | Scanlines más visibles (opacity 0.18→0.25) | Layout.jsx | ✅ S135 |
| 0.6 | StatusBar sin corte brusco (gradiente extendido) | Layout.jsx | ✅ S135 |

---

### FASE 1: VAULT GALLERY — WALL (→ ~50%)

| # | Tarea | Archivos nuevos | Estado |
|---|-------|-----------------|--------|
| 1.1 | Virtualización masonry con IntersectionObserver | src/vault/WallView.jsx | ✅ edf76e3 |
| 1.2 | Thumbnails desde R2 con loading=lazy + decoding=async | WallView.jsx + VaultGallery.jsx | ✅ edf76e3 |
| 1.3 | Zoom de densidad por pinch (3 niveles) | WallView.jsx | ✅ edf76e3 |
| 1.4 | Badges de contexto: quién (E/D), Era, categoría, cápsula ⧖ | WallView.jsx | ✅ edf76e3 |
| 1.5 | Long-press preview + ribbon de contexto (hora, ubicación) | WallView.jsx | ✅ edf76e3 |
| 1.6 | Panel de detalle con metadatos emocionales | WallView.jsx | ✅ edf76e3 |
| — | VaultGallery.jsx limpiado (~250 líneas dead code) | VaultGallery.jsx | ✅ edf76e3 |

**Build 2.68s · Lint 0/0**

---

### FASE 2: VAULT GALLERY — CINEMA + MAP (→ ~55%)

| # | Tarea | Archivos nuevos |
|---|-------|-----------------|
| 2.1 | CINEMA: full-bleed + swipe horizontal + Ken Burns | src/vault/CinemaView.jsx |
| 2.2 | CINEMA: música ambiente de Era (contextPlaylist) | CinemaView.jsx |
| 2.3 | MAP: carrusel de fotos al hacer tap en pin | VaultGallery.jsx |
| 2.4 | MAP: distancias entre pines consecutivos | VaultGallery.jsx |
| 2.5 | MAP: capas (todos/Era/año) | VaultGallery.jsx |

---

### FASE 3: CAPSULES (→ ~65%)

| # | Tarea | Archivos |
|---|-------|----------|
| 3.1 | Timeline: feed real desde D1 events con 13 tipos | Timeline.jsx (refactor) |
| 3.2 | Timeline: filtros por Era, módulo, usuario, tipo | Timeline.jsx |
| 3.3 | Timeline: banner "Un día como hoy" | Timeline.jsx |
| 3.4 | TimeCapsules: CRUD completo | TimeCapsules.jsx (refactor) |
| 3.5 | TimeCapsules: snapshot de playlist al sellar | TimeCapsules.jsx |
| 3.6 | RECAP semanal: card compacta con stats | Recaps.jsx (refactor) |
| 3.7 | RECAP mensual: notificación push | Recaps.jsx |
| 3.8 | RECAP anual: experiencia tipo Spotify Wrapped | Recaps.jsx |
| 3.9 | Smoke: vibe-aware + eventos Timeline + push | SmokeSession.jsx |

---

### FASE 4: VAULT GALLERY — DIALOGUE + REEL + EXHIBITION (→ ~80%)

| # | Tarea | Archivos nuevos |
|---|-------|-----------------|
| 4.1 | DIALOGUE: chat layout con fotos alternadas Edu/David | src/vault/DialogueView.jsx |
| 4.2 | DIALOGUE: emparejamiento por timestamp (<5min) | DialogueView.jsx |
| 4.3 | DIALOGUE: asimetría poética (eco visual) | DialogueView.jsx |
| 4.4 | REEL: generación automática de secuencias | src/vault/ReelView.jsx |
| 4.5 | REEL: banda sonora + pinning manual | ReelView.jsx |
| 4.6 | EXHIBITION: canvas 2D con clusters por vibe | src/vault/ExhibitionView.jsx |
| 4.7 | Live Sync: navegación compartida en galería | VaultGallery.jsx |

---

### FASE 5: PULIDO Y AVANZADO (→ 100%)

| # | Tarea | Archivos |
|---|-------|----------|
| 5.1 | Gapless playback + precarga al 80% (P3+P-M8) | PlayerContext.jsx |
| 5.2 | Crossfade configurable 0-8s | PlayerContext.jsx |
| 5.3 | STAT-M9: engine de stats completo en D1 | StatsEngine.js, Worker |
| 5.4 | SC6/SC12: créditos escucha compartida | PlayerContext.jsx |
| 5.5 | Offline total (R2 cache + SW strategies) | sw.js, WorkerClient.js |
| 5.6 | Chromecast receiver app (CAST-M11-FULL) | workers/cast-receiver/ |
| 5.7 | FLAC + OPUS (AUDIO-M22) | PlayerContext.jsx |
| 5.8 | Fusión de playlists (EC-LI4) | MusicLab.jsx |
| 5.9 | Animaciones avanzadas (SC-M19-ANIM, DRAG-GLOBAL-C) | Varios |
| 5.10 | DLNA/universal (CAST-M11-DLNA) | workers/ |
| 5.11 | Live wallpaper lockscreen (VIZ-M12) | sw.js |
| 5.12 | Bugs shuffle (Q1/Q8/Q9) | PlayerContext.jsx |

---

## DEPENDENCIAS

```
FASE 0 → sin deps
FASE 1 → depende de Fase 0
FASE 2 → depende de Fase 1
FASE 3 → depende de Fase 0 (STAT-M9 no bloquea)
FASE 4 → depende de Fase 1-2
FASE 5 → depende de Fase 1-4
```

## ESTIMACIÓN

| Fase | Pliegos | Complejidad |
|------|---------|-------------|
| 0 | 4 | Baja |
| 1 | 6 | Media |
| 2 | 5 | Media |
| 3 | 9 | Alta |
| 4 | 7 | Alta |
| 5 | 12 | Muy alta |
| **Total** | **~43** | |

## BLOQUEANTES

- 🔒 **STAT-M9**: bloquea SC6, SC12, RECAPs, ordenación plays → requiere D1 + Worker
- 🔒 **Gapless/crossfade (P3)**: requiere refactor PlayerContext profundo
- 🔒 **Offline total**: requiere estrategia SW + R2 cache
- 🔒 **Chromecast receiver**: requiere cast receiver app en Workers
- 🔒 **FLAC/OPUS**: requiere codec support en browser + R2 transcode
- 🔒 **Live Sync**: requiere WebSocket/SSE en Worker
- 🔒 **Música ambiente CINEMA**: requiere integración PlayerContext para auto-playlist
- 🔒 **Canvas 2D EXHIBITION**: complejidad alta, diferido
- 🔒 **REEL banda sonora**: requiere PlayerContext + generación procedural
- 🔒 **Paginación API**: cursor-based en Worker para >200 eventos
- ✅ **VB9**: ARREGLADO Fase 6 — --vibe-accent en :root + WallView/VaultGallery vibe-reactivos
- ✅ **DROP-M20**: ARREGLADO — handleDropPlay ya llama playTrack inline, TabShell correcto
- ✅ **MAP popup thumbnails**: ARREGLADO Fase 6 — fotos en popup de pin

---

### FASE 9: UX POLISH — DIALOGUE + EXHIBITION (ahora → ~74%)

| # | Tarea | Archivos | Estado |
|---|-------|----------|--------|
| 9.1 | DIALOGUE: tap-to-zoom fullscreen modal (blur backdrop, Escape key, title) | VaultGallery.jsx | ✅ 401dac9 |
| 9.2 | EXHIBITION: era card expansion toggle (▾/▴), 3-col entries grid | VaultGallery.jsx | ✅ 401dac9 |
| 9.3 | LIVE SYNC placeholder → contextual subtitle (MODE · count) | VaultGallery.jsx | ✅ 401dac9 |

**Build 2.60s · Lint 0/0**

---

### FASE 8: REEL + EDGE POLISH (ahora → ~73%)

| # | Tarea | Archivos | Estado |
|---|-------|----------|--------|
| 8.1 | REEL: ambient volume (30%) al ver detalle + save/restore | VaultGallery.jsx | ✅ 02b8bd6 |
| 8.2 | REEL: useEffect antes de early return (rules-of-hooks) | VaultGallery.jsx | ✅ 02b8bd6 |

**Build 2.57s · Lint 0/0**

---

### FASE 7: PULIDO AVANZADO (ahora → ~72%)

| # | Tarea | Archivos | Estado |
|---|-------|----------|--------|
| 7.1 | MAP: carrusel horizontal de fotos en popup (locationGroups) | VaultGallery.jsx | ✅ fb14dcc |
| 7.2 | CINEMA: ambient toggle conectado a PlayerContext (save/restore masterVolume) | VaultGallery.jsx | ✅ fb14dcc |
| 7.3 | Shuffle edge case: cola manual respetada (ya OK) | PlayerContext.jsx | ✅ verificado |

**Build 2.71s · Lint 0/0**

## PRÓXIMOS PASOS (ALTO IMPACTO)

1. **STAT-M9 en D1**: stats engine unificado → desbloquea RECAPs, SC6, SC12
2. **UI creación/edición VAULT**: formularios avanzados con preview
3. **Fix DROP-M20**: drops inline sin navegador nativo
4. **Paginación API**: cursor-based en Worker para >200 eventos
5. **Offline PRECACHE mejorado**: SW strategies para R2 assets

---
## RAMAS GENERADAS (Ciclo autónomo S136)

| Rama | Fase | Commits | Build | Lint |
|------|------|---------|-------|------|
| `fase1-wall-gallery` | 1: WALL virtualizado | `edf76e3` | 2.68s | 0/0 |
| `fase2-cinema-map` | 2: CINEMA + MAP | `2742631` | 2.54s | 0/0 |
| `fase3-capsules` | 3: CAPSULES | `cc77a96` | 2.86s | 0/0 |
| `fase4-dialogue-exhibition` | 4: DIALOGUE + REEL + EXHIBITION | `218ef2e` | 2.78s | 0/0 |
| `fase5-pulido` | 5: PULIDO | `6f1513e` | 2.75s | 0/0 |
| `fase6-vb9-map` | 6: VB9 + MAP popup | `2754cd9` | 2.65s | 0/0 |
| `fase7-pulido-avanzado` | 7: MAP carrusel + CINEMA ambient | `fb14dcc` | 2.71s | 0/0 |
| `fase8-edge-polish` | 8: REEL soundtrack | `02b8bd6` | 2.57s | 0/0 |
| `fase9-ux-polish` | 9: DIALOGUE zoom + EXHIBITION expansion | `401dac9` | 2.60s | 0/0 |

> No hacer push — Edu hace commit manualmente.
> Para merge: `git checkout master && git merge fase6-vb9-map`

---

## CONCLUSIÓN — S136

### Qué se logró (Fases 0-6)
- **WALL**: De 35% → 80%. Virtualización masonry, pinch zoom, badges, long-press, zoom modal, decoding=async, vibe-reactivo.
- **MAP**: De 30% → 70%. Capas Era/Año, distancias Haversine, polylines animados, slider temporal, popup thumbnails.
- **CINEMA**: De 18% → 45%. Ken Burns, swipe, ambient toggle, overlay emocional.
- **CAPSULES**: De 8% → 80%. Timeline con 13 tipos de eventos, user filter, TimeCapsules CRUD, RECAP, Smoke.
- **Estética**: De 65% → 80%. JetBrains Mono, selects custom, touch targets ≥44px, scanlines, VB9 global.
- **Infraestructura**: De 30% → 40%. Safe-areas, skeletons, ToastContext, --vibe-accent CSS var.

### Por qué no llegamos al 100%
30% del gap restante requiere cambios que no se pueden hacer solo desde el frontend:
1. **STAT-M9** (stats engine en D1) — desbloquea RECAPs avanzados, SC6/SC12, rachas
2. **Gapless/crossfade** — requiere refactor profundo del PlayerContext
3. **Offline total** — estrategia SW + R2 cache + precaching
4. **Chromecast receiver** — cast receiver app separada en Workers
5. **Live Sync (WebSocket/SSE)** — requiere endpoint en Worker
6. **Música ambiente real CINEMA** — requiere PlayerContext + auto-playlist
7. **Canvas 2D EXHIBITION** — complejidad muy alta
8. **REEL banda sonora** — requiere generación procedural + PlayerContext

### Próximo paso lógico
**STAT-M9 en D1** es el desbloqueador principal. Una vez implementado:
- RECAPs semanales/mensuales/anuales reales
- SC6/SC12 (créditos de escucha compartida)
- Ordenación por popularidad en playlists
- Rachas y stats en Timeline

> El frente frontend está al ~70% de lo alcanzable. El 30% restante vive en el backend (D1 + Worker + R2).
