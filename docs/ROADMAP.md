# EL BÚNKER — Roadmap de Desarrollo v4
> **Generado:** S66 — Junio 2026 · Post-auditoría completa (specs ↔ código ↔ D1)
> **Actualizado:** S66 — WALL gallery completado. Drive JSON parcialmente migrado.
> **Formato:** Sesiones Codebuff de ~45-60 min cada una

---

## 📋 Estado del Proyecto

| Métrica | Valor |
|---|---|
| **Total features implementadas** | ~110 (de ~180 especificadas) |
| **Sesiones completadas** | S50-S66 (17 sesiones) |
| **Sesiones pendientes priorizadas** | 13 (S67-S79) |
| **Sesiones diferidas (Fase C)** | 8 (S80-S87) |
| **Progreso general** | `████████████░░░░░░░░░░░` ~61% |
| **Rama activa** | `master` (desplegada en Vercel) |
| **Hito actual** | Fase 2 — VAULT núcleo (80% completo) |
| **Próxima sesión** | **S67** — Galería CINEMA full-bleed swipe + Ken Burns |

---

## 🧭 Mapa de Fases

```
✅ COMPLETADO            🟡 EN PROGRESO           🔴 PENDIENTE              ⚪ DIFERIDO (Fase C)
Fase 0: S50-S53         Fase 2: S60-S66          Fase 2: S67-S71          Fase 6: S80-S87
Fase 1: S54-S59                                  Fase 3: S72-S75
Auditoría D1                                   Fase 4: S76
                                                 Fase 5: S77-S79
```

---

## ✅ FASE 0 — ESTABILIZACIÓN [COMPLETADO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| S50 | Fix historial — localStorage Q2/Q3 | `PlayerContext.jsx` | Q2, Q3, Q15 | ✅ |
| S51 | Fix shuffle — solo restantes SH1 | `PlayerContext.jsx` | SH1, SH2, SH3 | ✅ |
| S52 | Fix loop — seek inicio L1 | `PlayerContext.jsx` | L1, L2, L3, L4 | ✅ |
| S53 | Cola manual Q14 + sobrevive Q10 | `PlayerContext.jsx` | Q14, Q10, Q4 | ✅ |

---

## ✅ FASE 1 — INFRAESTRUCTURA [COMPLETADO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| S54 | D1 schema + Workers init + health | `workers/`, `schema.sql` | ADR-024, ADR-019 | ✅ |
| S55 | Workers: tracks + playlists CRUD | `workers/` | ADR-024 | ✅ |
| S56 | Workers: entries + tags + JWT | `workers/` | ADR-024 | ✅ |
| S57 | FileUploadService + StatsEngine | `src/core/` | ADR-022, ADR-014 | ✅ |
| S58 | Auditoría 12 bugs + fix imports | 12 archivos | — | ✅ |
| S59 | AddEntryForm + VaultGallery + Capsules | `src/vault/`, `src/capsules/` | Taxonomía, ADR-021 | ✅ |

---

## ✅ FASE 2 — VAULT NÚCLEO [80% COMPLETADO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| **S60** | **Fix imports** — MusicLab→tokens | 8 archivos MusicLab | — | ✅ |
| **S61** | **Wiring JWT frontend** | `App.jsx`, `VaultContext.jsx` | ADR-024 | ✅ |
| **S62** | **Worker: CRUD entries** (5 endpoints) | `workers/worker.js` | ADR-019 | ✅ |
| **S63** | **Worker: CRUD eras** (5 endpoints) | `workers/worker.js` | ADR-019 | ✅ |
| **S64** | **VaultContext→Worker API** | `VaultContext.jsx` | ADR-024 | ✅ |
| **S65** | **VAULT edit/delete entries** | `VaultContext.jsx`, `Vault.jsx`, `AddEntryForm.jsx` | Taxonomía | ✅ |
| S65a | 5 bugs: Q2/Q3/Q10/SH1/L1 | `PlayerContext.jsx`, `SmokeSession.jsx` | Q2, Q3, Q10, SH1, L1 | ✅ |
| S65b | 7 bugs G: colores/paginación/miniplayer | 6 archivos | G1-G7 | ✅ |
| **S66** | **WALL gallery** (masonry + densidades + zoom) | `VaultGallery.jsx` | ADR-021 WALL | ✅ |
| S66 | W3: tags MusicLab sincronizan D1 | `App.jsx`, `worker.js` | ADR-016 | ✅ |

### 🔴 PENDIENTE (Fase 2)

| # | Objetivo | Archivos | Specs | ⏱ Est. |
|---|---|---|---|---|
| **S67** | **Galería CINEMA** — full-bleed swipe, Ken Burns, subtítulos emocionales, crossfade entre fotos | `VaultGallery.jsx` | ADR-021 CINEMA | ~1.5h |
| **S68** | **Galería DIALOGUE** — emparejamiento temporal <5min, hilo conector visual, asimetría poética | `VaultGallery.jsx` | ADR-021 DIALOGUE, ADR-027 | ~1.5h |
| **S69** | **Galería MAP** — pines en mapa (Leaflet/static), líneas de viaje, clusters | `VaultGallery.jsx` | ADR-021 MAP | ~1.5h |
| **S70** | **Capa ambiental** — paleta reactiva por Era + AnalyserNode pulso acústico + música ambiente Era en CINEMA | `VaultGallery.jsx`, tokens | ADR-021 ambiental | ~1h |
| **S71** | **Galería EXHIBITION + REEL** — canvas 2D salas por vibe, secuencias auto-generadas (diferible) | `VaultGallery.jsx` | ADR-021 EXHIBITION, REEL | ~2h |

---

## 🔴 FASE 3 — CAPSULES PREMIUM

| # | Objetivo | Archivos | Specs | ⏱ Est. |
|---|---|---|---|---|
| **S72** | **Timeline** — filtros Era/módulo/tipo/usuario, banner "Un día como hoy", más tipos de eventos | `Timeline.jsx`, `worker.js` | ADR-020 Timeline | ~1h |
| **S73** | **SmokeSession** — nombrar sesiones, historial, rachas, push notification, vibe-aware color | `SmokeSession.jsx`, `Capsules.jsx` | SS-1, SS-4, SS-7, SS-8 | ~1.5h |
| **S74** | **Time Capsules** — selector contenido entries+playlists, snapshot playlist al sellar, animación apertura | `TimeCapsules.jsx`, `worker.js` | TC-1 a TC-9 | ~1.5h |
| **S75** | **RECAP Wrapped** — 6 secciones narrativas: portada, música, memoria, conexión, hitos, cierre | `Recaps.jsx` | ADR-026 | ~1.5h |

---

## 🔴 FASE 4 — MIGRACIÓN DRIVE→D1 (COMPLETAR)

| # | Objetivo | Archivos | Specs | ⏱ Est. |
|---|---|---|---|---|
| **S76** | **Migrar playlists/drops/tags a D1** — eliminar dependencia Drive JSON, VaultContext 100% Worker | `VaultContext.jsx`, `App.jsx`, `worker.js` | ADR-024, TD-1 | ~1.5h |

---

## 🔴 FASE 5 — MUSIC LAB REMANENTE

| # | Objetivo | Archivos | Specs | ⏱ Est. |
|---|---|---|---|---|
| **S77** | **Cola** — Q6 límite 75, Q12 añadir playlist entera, Q15 historial scroll, Q16/17 soft delete | `PlayerContext.jsx`, `MusicLab.jsx` | Q6, Q12, Q15, Q16, Q17 | ~1.5h |
| **S78** | **Sesión + UX** — S1/S2 posición guardada, S8 persistencia localStorage, UX1 doble tap seek, UX2 háptico, UX5 swipe | `PlayerContext.jsx`, `WinampPlayer.jsx` | S1, S2, S8, UX1, UX2, UX5 | ~1.5h |
| **S79** | **MediaSession completo** — M1-M12 lockscreen metadata Era, Cast básico, volumen físico sync | `PlayerContext.jsx`, `WinampPlayer.jsx` | M1-M12, CAST1-6 | ~1.5h |

---

## ⚪ FASE 6 — DIFERIDO (Fase C)

| # | Objetivo | Bloqueante |
|---|---|---|
| S80 | Escucha Compartida SC1-SC14 (WebSocket) | ❌ Servidor WS real |
| S81 | Galería EXHIBITION canvas 2D (Figma/Miro-like) | Diseño layout |
| S82 | Galería REEL auto-generados + pinning | — |
| S83 | Integraciones: Drop→Entrada, entrada→track, Era playlist | Decisión UX |
| S84 | Cápsulas colaborativas — snapshot playlist, ambos editan | — |
| S85 | Modo offline — Service Worker cache-first | — |
| S86 | Soporte HEIC/RAW — conversión al subir | — |
| S87 | Pulido general — edge cases, rendimiento, transiciones | — |

---

## 📊 Resumen de Esfuerzo

| Fase | Nombre | Sesiones | Estado |
|---|---|---|---|
| 0 | Estabilización | S50-S53 (4) | ✅ Completo |
| 1 | Infraestructura | S54-S59 (6) | ✅ Completo |
| 2 | VAULT núcleo | S60-S71 (12) | 🟡 80% (faltan S67-S71) |
| 3 | CAPSULES premium | S72-S75 (4) | 🔴 Pendiente |
| 4 | Migración Drive→D1 | S76 (1) | 🔴 Pendiente |
| 5 | MusicLab remanente | S77-S79 (3) | 🔴 Pendiente |
| 6 | Diferido (Fase C) | S80-S87 (8) | ⚪ No priorizado |

| **Pendiente priorizado** | **S67-S79** | **13 sesiones** | **~18h** |
| **Total proyecto** | **S50-S87** | **38 sesiones** | **~47h** |

---

## 🎯 Hitos del Proyecto

| Hito | Sesiones | Estado |
|---|---|---|
| ✅ **MVP funcional** | S50-S59 | D1+Workers operativos, VAULT con formulario real, CAPSULES con 4 sub-tabs |
| ✅ **VAULT CRUD** | S60-S66 | Entradas/eras en D1, WALL gallery, editar/eliminar, tags sincronizados, fotos a R2 |
| 🎯 **VAULT premium** | S67-S71 | Galería CINEMA/DIALOGUE/MAP, capa ambiental, capa acústica |
| 🎯 **CAPSULES premium** | S72-S75 | Timeline con filtros, Smoke completa, Time Capsules contenido real, RECAP Wrapped |
| 🎯 **Sin Drive JSON** | S76 | D1 fuente única de verdad, eliminación GoogleDriveService |
| 🎯 **Reproductor v2 spec** | S77-S79 | Cola completa, sesión/posición, UX táctil, MediaSession M1-M12 |
| ✨ **Premium completo** | S80-S87 | 6 modos galería, escucha compartida, offline, integraciones |

---

## 🔗 Dependencias

```
S67 (CINEMA) ──> S70 (capa ambiental)
S68 (DIALOGUE) ──> S70 (capa ambiental)
S69 (MAP) ── independiente ──
S70 (Ambiental) ── independiente ──
S71 (EXHIBITION+REEL) ──> S81+S82 (diferido)

S72 (Timeline filters) ── independiente ──
S73 (SmokeSession) ── independiente ──
S74 (TimeCapsules content) ── necesita entries+playlists en D1 (ya están) ──
S75 (RECAP Wrapped) ── necesita events en D1 (ya están) ──

S76 (Migración Drive→D1) ── BLOQUEADO POR: S72-S75 (tocarán código de persistencia) ──

S77 (Cola) ── independiente ──
S78 (Sesión+UX) ── independiente ──
S79 (MediaSession) ── independiente ──
```

---

## 📊 Estado por Módulo (post-S66)

| Módulo | Submódulo | % Completo | Estado |
|---|---|---|---|
| **Core/Infra** | Worker API (22 endpoints), D1 (16 tablas), JWT, FileUpload, StatsEngine | 90% | ✅ |
| **VAULT** | CRUD entradas/eras, AddEntryForm, foto upload | 95% | ✅ |
| **VAULT Galería** | WALL (completo), CINEMA/DIALOGUE/MAP/EXHIBITION/REEL (básico) | 45% | 🟡 |
| **VAULT Taxonomía** | 4 tipos implementados de ~70 (note/photo/milestone/letter) | 6% | 🟡 |
| **CAPSULES** | 4 sub-tabs con datos Worker real, Timeline paginado | 65% | 🟡 |
| **MUSIC LAB** | Reproductor, cola, playlists, drops, tags, filtros, 3 vistas | 85% | ✅ |
| **Capa Visual** | Cyber-vandal, scanlines, trackVibe→accent, Framer Motion | 90% | ✅ |
| **Persistencia** | Híbrido Drive+D1 (entries/eras/tracks→D1, resto→Drive) | 65% | 🟡 |

---

## 📐 Convenciones

| Símbolo | Significado |
|---|---|
| ✅ | Completado y verificado en código |
| 🟡 | En progreso / parcialmente implementado |
| 🔴 | No iniciado |
| ⚪ | Diferido (Fase C) |
| P0 | Bloquea funcionalidad o causa pérdida de datos |
| P1 | Visible para el usuario, impacta experiencia core |
| P2 | Mejora — no bloquea funcionalidad |
