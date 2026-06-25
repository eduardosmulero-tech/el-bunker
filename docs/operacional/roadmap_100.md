# EL BÚNKER — ROADMAP AL 100%
> Generado: S135 — Auditoría completa post-Gemini (Junio 2026)
> Score actual: ~42% (~135/450 features implementadas)
> Fuentes: CONTRATO.md (27 ADRs) + specs + inventario_features.txt + auditoría Gemini

---

## DIAGNÓSTICO ACTUAL

| Módulo | Score | Features pendientes clave |
|--------|-------|--------------------------|
| Audio Engine | 70% | Gapless/crossfade (P3) |
| Escucha Compartida | 85% | SC6/SC12 stats (STAT-M9) |
| VAULT Data Model | 80% | UI de creación/edición básica |
| WALL | 35% | Virtualización, zoom densidad, badges |
| CINEMA | 18% | Música ambiente, Ken Burns, transiciones |
| MAP | 30% | Carrusel pins, distancias, capas |
| DIALOGUE | 60% | Live Sync |
| EXHIBITION | 6% | Canvas 2D completo |
| REEL | 11% | Banda sonora, generación automática |
| CAPSULES | 8% | Timeline funcional, TimeCapsules CRUD, RECAPs |
| Infraestructura | 30% | Offline completo, paginación API |
| Estética/UX | 65% | Safe-areas ✅, touch targets ✅, glows ✅, forms ✅, tipografía ✅, scanlines ✅ |

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

### FASE 1: VAULT GALLERY — WALL (→ ~48%)

| # | Tarea | Archivos nuevos |
|---|-------|-----------------|
| 1.1 | Virtualización masonry con IntersectionObserver | src/vault/WallView.jsx |
| 1.2 | Thumbnails desde R2 con loading=lazy + decoding=async | VaultGallery.jsx |
| 1.3 | Zoom de densidad por pinch (3 niveles) | WallView.jsx |
| 1.4 | Badges de contexto: quién, Era, música | WallView.jsx |
| 1.5 | Long-press preview + ribbon de contexto | WallView.jsx |
| 1.6 | Panel de detalle con metadatos emocionales | VaultGallery.jsx |

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

- STAT-M9: bloquea SC6, SC12, RECAPs, ordenación plays
- Virtualización WALL: sin ella OOM con >50 fotos
- VB9: vibe solo afecta reproductor, no toda la UI
- DROP-M20: drops abren en navegador nativo

---
> No hacer push — Edu hace commit manualmente.
