# EL BÚNKER — Roadmap de Desarrollo v5
> **Generado:** S66 — Junio 2026 · Post-auditoría completa (specs ↔ código ↔ D1)
> **Actualizado:** S89 — Auditoría BACKLOG. 9 bugs cerrados (6 stale + 3 reales). Plan Fase 7-11.
> **Formato:** Sesiones Codebuff de ~45-60 min cada una

---

## 📋 Estado del Proyecto

| Métrica | Valor |
|---|---|
| **Total features implementadas** | ~155 (de ~180 especificadas) |
| **Sesiones completadas** | S50-S89 (40 sesiones) |
| **Sesiones pendientes (Fase 7-11)** | ~27 (S90-S116) |
| **Progreso contra specs** | `████████████████████░░░░░` ~70% |
| **Rama activa** | `master` (desplegada en Vercel) |
| **Hito actual** | ✅ Fase 0-6 completas · 🟡 Fase 7 iniciada (BACKLOG cerrado) |
| **Próxima sesión** | **S90** — Q12 (playlist entera a cola) + S3 (soft delete tracks) + EC-TR6 (ID3) |

---

## 🧭 Mapa de Fases

```
✅ COMPLETADO            🟡 EN PROGRESO           🔴 PENDIENTE
Fase 0: S50-S53         Fase 7: S89-S92         Fase 9: S101-S105
Fase 1: S54-S59                                 Fase 10: S106-S110
Fase 2: S60-S71                                 Fase 11: S111-S115
Fase 3: S72-S75
Fase 4: S76
Fase 5: S77-S79
Fase 6: S84-S88
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

## ✅ FASE 2 — VAULT NÚCLEO [COMPLETADO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| S60 | Fix imports — MusicLab→tokens | 8 archivos MusicLab | — | ✅ |
| S61 | Wiring JWT frontend | `App.jsx`, `VaultContext.jsx` | ADR-024 | ✅ |
| S62 | Worker: CRUD entries (5 endpoints) | `workers/worker.js` | ADR-019 | ✅ |
| S63 | Worker: CRUD eras (5 endpoints) | `workers/worker.js` | ADR-019 | ✅ |
| S64 | VaultContext→Worker API | `VaultContext.jsx` | ADR-024 | ✅ |
| S65 | VAULT edit/delete entries | `VaultContext.jsx`, `Vault.jsx`, `AddEntryForm.jsx` | Taxonomía | ✅ |
| S65a | 5 bugs: Q2/Q3/Q10/SH1/L1 | `PlayerContext.jsx`, `SmokeSession.jsx` | — | ✅ |
| S65b | 7 bugs G: colores/paginación/miniplayer | 6 archivos | G1-G7 | ✅ |
| S66 | WALL gallery (masonry + densidades + zoom) | `VaultGallery.jsx` | ADR-021 WALL | ✅ |
| S66 | W3: tags MusicLab sincronizan D1 | `App.jsx`, `worker.js` | ADR-016 | ✅ |
| **S67** | **Galería CINEMA** — full-bleed swipe, Ken Burns, subtítulos emocionales, crossfade | `VaultGallery.jsx` | ADR-021 CINEMA | ✅ |
| **S68** | **Galería DIALOGUE** — emparejamiento temporal <5min, hilo conector, asimetría poética | `VaultGallery.jsx` | ADR-021 DIALOGUE, ADR-027 | ✅ |
| **S69** | **Galería MAP** — Leaflet pines, líneas de viaje, clusters, timeline slider | `VaultGallery.jsx` | ADR-021 MAP | ✅ |
| **S70** | **Capa ambiental** — paleta reactiva Era + AnalyserNode pulso acústico | `VaultGallery.jsx` | ADR-021 ambiental | ✅ |
| **S71** | **Galería EXHIBITION + REEL** — salas por Era, REELs auto-generados por día | `VaultGallery.jsx` | ADR-021 EXHIBITION, REEL | ✅ |

---

## ✅ FASE 3 — CAPSULES PREMIUM [COMPLETADO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| **S72** | **Timeline** — filtros Era/módulo/tipo, banner "Un día como hoy", 12+ iconos | `Timeline.jsx` | ADR-020 | ✅ |
| **S73** | **SmokeSession** — nombrar sesiones, historial (50), rachas, notificaciones, vibe-aware | `SmokeSession.jsx` | SS-1,4,7,8 | ✅ |
| **S74** | **Time Capsules** — content picker entries+playlists, snapshot, animación 3D apertura | `TimeCapsules.jsx` | TC-1 a TC-9 | ✅ |
| **S75** | **RECAP Wrapped** — 6 secciones narrativas con navegación | `Recaps.jsx` | ADR-026 | ✅ |

---

## ✅ FASE 4 — MIGRACIÓN DRIVE→D1 [COMPLETADO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| **S76** | **Verificar playlists/drops/tags en Worker API** — VaultContext→Worker, Capsules threada datos | `VaultContext.jsx`, `Capsules.jsx` | ADR-024 | ✅ |

---

## ✅ FASE 5 — MUSIC LAB REMANENTE [COMPLETADO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| **S77** | **Cola** — Q6 límite 75, Q12 playlist entera, Q16/17 soft delete + undo | `PlayerContext.jsx` | Q6, Q12, Q16, Q17 | ✅ |
| **S78** | **Sesión + UX** — S1/S2 posición >25min, S8 localStorage, UX1 double-tap, UX2 háptico, UX5 swipe | `PlayerContext.jsx`, `WinampPlayer.jsx` | S1,S2,S8,UX1,UX2,UX5 | ✅ |
| **S79** | **MediaSession** — M1-M12 metadata Era, setPositionState lockscreen, action handlers | `PlayerContext.jsx`, `WinampPlayer.jsx` | M1-M12 | ✅ |

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

## 🟡 FASE 7 — CIERRE DE BACKLOG [EN PROGRESO]

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| **S89** | Auditoría BACKLOG + Fix G2 + Eliminar alert() | `Vault.jsx`, `App.jsx`, `BACKLOG.md` | G1-G7, W3 | ✅ |
| **S90** | Q12 (playlist entera a cola) + S3 (soft delete) + EC-TR6 (ID3) | `MusicLab.jsx`, `Worker`, `AddTrackForm.jsx` | Q12, S3, EC-TR6 | 🔴 |
| **S91** | S4 (sin red → neutral) + A1-A6 verificar | `PlayerContext.jsx` | S4, A1-A6 | 🔴 |
| **S92** | Verificación final Fase 7: build + lint + smoke test | — | — | 🔴 |

**Hito Fase 7:** 0 bugs P1. BACKLOG vacío (solo features nuevas).

---

## 🔴 FASE 8 — VAULT PROFUNDO

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| S93 | Taxonomía: Escritura Íntima + Docs Personales (cats 2-3) | `AddEntryForm.jsx`, `Worker`, schema | Taxonomía 2-3 | 🔴 |
| S94 | Taxonomía: Geografía + Línea Temporal (cats 4-5) | `AddEntryForm.jsx` | Taxonomía 4-5 | 🔴 |
| S95 | Taxonomía: Listas + Comunicación (cats 6-7) | `AddEntryForm.jsx` | Taxonomía 6-7 | 🔴 |
| S96 | Galería avanzada: WALL virtualización + long press ribbon + badges | `VaultGallery.jsx` | Galería WALL | 🔴 |
| S97 | Galería avanzada: CINEMA audioguías + Ken Burns + pausa contemplativa | `VaultGallery.jsx` | Galería CINEMA | 🔴 |
| S98 | Galería avanzada: DIALOGUE emparejamiento + MAP clusters | `VaultGallery.jsx` | Galería DIALOGUE, MAP | 🔴 |
| S99 | Galería avanzada: EXHIBITION salas semánticas + REEL premium | `VaultGallery.jsx` | Galería EXHIBITION, REEL | 🔴 |
| S100 | Panel detalle completo + música ambiente de Era | `VaultGallery.jsx` | Galería spec | 🔴 |

**Hito Fase 8:** Taxonomía 7/14 categorías. Galería 6 modos al ~95% spec.

---

## 🔴 FASE 9 — ESCUCHA COMPARTIDA

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| S101 | SC1-SC4: Botón corazón + iniciar sesión compartida | `WinampPlayer.jsx`, `PlayerContext.jsx` | SC | 🔴 |
| S102 | SC5-SC10: Emitir/recibir eventos sync + posición | `StatsEngine.js`, `Worker` | SC | 🔴 |
| S103 | SC11-SC14: UI presencia mutua + cola compartida + desconexión | `MusicLab.jsx`, `Layout.jsx` | SC | 🔴 |
| S104 | Edge cases: reconexión, merge, track diferente | `PlayerContext.jsx` | SC | 🔴 |
| S105 | Testing real con ambos usuarios (Edu + David) | — | SC | 🔴 |

**Hito Fase 9:** Escucha compartida 100% funcional. SC1-SC14 completo.

---

## 🔴 FASE 10 — PLAYBACK PREMIUM

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| S106 | P1-P3: Motor dual local/R2 + fallback red + gapless | `PlayerContext.jsx`, `sw.js` | P1-P3 | 🔴 |
| S107 | A1-A6: Android audio focus + OOM recovery validado | `PlayerContext.jsx` | A | 🔴 |
| S108 | VIZ1-6: Visualizador avanzado (presets por vibe, BPM, lockscreen) | `AudioVisualizer.jsx` | VIZ | 🔴 |
| S109 | CAST1-6: Chromecast SDK + receiver app | `PlayerContext.jsx`, `cast-receiver/` | CAST | 🔴 |
| S110 | EC-TR6 (ID3) + EC-P1-P5 (edge cases playback) | `AddTrackForm.jsx`, `PlayerContext.jsx` | EC-TR6, EC-P | 🔴 |

**Hito Fase 10:** Playback premium 100%. Android validado. Cast funcional.

---

## 🔴 FASE 11 — PULIDO FINAL

| # | Objetivo | Archivos | Specs | Estado |
|---|---|---|---|---|
| S111 | Taxonomía cats 8-10: Conocimiento + Identidad + Finanzas | `AddEntryForm.jsx` | Taxonomía 8-10 | 🔴 |
| S112 | Taxonomía cats 11-14: Rituales + Seguridad + Stats + Integraciones | `AddEntryForm.jsx` | Taxonomía 11-14 | 🔴 |
| S113 | Edge cases: sin conexión, archivos corruptos, R2 quotas | Varios | S4, EC-P | 🔴 |
| S114 | Animaciones: transición tabs, rendimiento Android antiguo | `Layout.jsx`, `App.jsx` | — | 🔴 |
| S115 | Testing final + WCAG + ESLint 0 warnings + CHANGELOG v3.0 | — | — | 🔴 |

**Hito Fase 11:** App al ~98% specs. Taxonomía 14/14. 0 bugs.

---

## 📊 Resumen de Esfuerzo

| Fase | Nombre | Sesiones | Estado |
|---|---|---|---|
| 0 | Estabilización | S50-S53 (4) | ✅ Completo |
| 1 | Infraestructura | S54-S59 (6) | ✅ Completo |
| 2 | VAULT núcleo | S60-S71 (12) | ✅ Completo |
| 3 | CAPSULES premium | S72-S75 (4) | ✅ Completo |
| 4 | Migración Drive→D1 | S76 (1) | ✅ Completo |
| 5 | MusicLab remanente | S77-S79 (3) | ✅ Completo |
| 6 | Pulido | S84-S88 (5) | ✅ Completo |
| 7 | Cierre BACKLOG | S89-S92 (4) | 🟡 En progreso |
| 8 | VAULT Profundo | S93-S100 (8) | 🔴 Pendiente |
| 9 | Escucha Compartida | S101-S105 (5) | 🔴 Pendiente |
| 10 | Playback Premium | S106-S110 (5) | 🔴 Pendiente |
| 11 | Pulido Final | S111-S115 (5) | 🔴 Pendiente |

| **Completado** | **S50-S89** | **40 sesiones** | **~52h** |
| **Pendiente** | **S90-S115** | **26 sesiones** | **~35h** |
| **Total proyecto** | **S50-S115** | **66 sesiones** | **~87h** |

---

## 🎯 Hitos del Proyecto

| Hito | Sesiones | Estado |
|---|---|---|
| ✅ **MVP funcional** | S50-S59 | D1+Workers operativos, VAULT con formulario real, CAPSULES con 4 sub-tabs |
| ✅ **VAULT CRUD** | S60-S66 | Entradas/eras en D1, WALL gallery, editar/eliminar, tags sincronizados |
| ✅ **VAULT premium** | S67-S71 | CINEMA full-bleed+Ken Burns, DIALOGUE emparejamiento, MAP Leaflet, capa ambiental |
| ✅ **CAPSULES premium** | S72-S75 | Timeline filtros, Smoke historial/rachas, TimeCapsules content picker, RECAP Wrapped |
| ✅ **Sin Drive JSON** | S76 | Playlists/drops/tags→Worker API; Drive solo libraries/heartbeat pendiente |
| ✅ **Reproductor v2 spec** | S77-S79 | Cola Q6/Q12/Q16/Q17, posición S1/S2, UX táctil, MediaSession M1-M12 |
| ✨ **Premium completo** | S80-S87 | 6 modos galería, escucha compartida, offline, integraciones |

---

## 📊 Estado por Módulo (post-S79)

| Módulo | Submódulo | % Completo | Estado |
|---|---|---|---|
| **Core/Infra** | Worker 22 endpoints, D1 16 tablas, JWT, FileUpload, StatsEngine, AnalyserNode | 92% | ✅ |
| **VAULT** | CRUD entradas/eras, AddEntryForm, foto upload | 95% | ✅ |
| **VAULT Galería** | WALL+CINEMA+DIALOGUE+MAP+EXHIBITION+REEL completos | 90% | ✅ |
| **VAULT Taxonomía** | 4 tipos implementados de ~70 (note/photo/milestone/letter) | 6% | 🟡 |
| **CAPSULES** | 4 sub-tabs premium: Timeline filtros, Smoke historial/rachas, TC content picker, RECAP Wrapped | 90% | ✅ |
| **MUSIC LAB** | Reproductor, cola Q6/Q12/Q16/Q17, posición S1/S2, UX táctil, MediaSession M1-M12 | 92% | ✅ |
| **Capa Visual** | Cyber-vandal, scanlines, trackVibe→accent, Framer Motion, Ken Burns, AnalyserNode | 93% | ✅ |
| **Persistencia** | Entries/eras/tracks/playlists/drops/tags→Worker API; Drive solo libraries/heartbeat | 80% | 🟡 |

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
