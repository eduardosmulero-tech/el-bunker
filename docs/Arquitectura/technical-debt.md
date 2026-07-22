---
describe: cualquier refactor estructural
sincronizado_con: S148 — FASE C.2+D cierre v1.0 (DEMO purge, R2 gate, track_updated silenciado, TD-6 actualizado)
stale_si_pliego_toca: cualquier refactor estructural
---

# Technical Debt (post-S64)

## Deuda resuelta ✅

- ✅ YouTube Engine eliminado (S49). Motor exclusivo HTMLAudioElement + R2.
- ✅ D1 schema + Workers + Wrangler desplegados (S54: 16 tablas base; S132: +1 `shared_sessions`).
- ✅ Worker API: 16 endpoints REST + JWT auth + módulo `routes/` separado (S55-S63, S114-W refactor).
- ✅ Capsules conectadas a Worker API real (S58).
- ✅ StatsEngine wired: trackPlay/Pause/Skip, entryCreated, dropSent, smoke_session_* (S58-S59, S73).
- ✅ FileUploadService con pre-signed URLs a R2 (S58).
- ✅ JWT frontend wiring: VaultContext obtiene y propaga JWT (S59, S61, S116 → sessionStorage).
- ✅ Imports MusicLab corregidos Layout → tokens (S60).
- ✅ VaultContext D1-only: carga única de Worker API (S64, S115-D5 eliminó Drive fallback).
- ✅ PRECACHE + safe areas + design system (S131 Fase 0 cimientos).
- ✅ MapView real con react-leaflet + cluster (S131 Sub-fase 4).
- ✅ ToastProvider unificado — eliminadas 7 implementaciones dispersas (S132 Fase 1).
- ✅ Escucha Compartida SC1-SC14 wired + long-polling sync + queue bidireccional + auto-join (S132 Fase C).
- ✅ DEMO purge: `DEMO_TRACKS`/`DEMO_ERAS`/`DEMO_ENTRIES_GEO` eliminados → estado vacío honesto (S148 FASE C.2).
- ✅ R2 auth gate: prefijos sensibles `vault/docs/`+`vault/audio/` exigen token HMAC (`workers/utils/r2-sign.js`+`workers/routes/r2.js`, S148 FASE D).
- ✅ `track_updated` silenciado: PATCH mudo + Timeline whitelist filtra el histórico sin borrar D1 (S148 FASE D, 🔒-3 intacto).
- ✅ `.bak` eliminados de `src/` (S148 housekeeping).

## Deuda activa

### TD-1: Migración completa Drive JSON → D1 (ADR-024) — 🅿️ PARKING post-v1.0
**Progreso:** 60%. Entries/eras/tracks ya cargan de Worker API. Libraries/playlists/drops/tags siguen en Drive JSON.
**Impacto:** MEDIO (rebajado tras cierre v1.0). Coexisten dos fuentes de verdad, pero el caso real (2 usuarios) funciona.
**Riesgo:** Divergencia de datos si se escribe en Drive pero se lee de D1.
**Plan:** **PARKING** — el cierre v1.0 (decisión Edu 08-jul, ADDENDUM) deja la migración completa y la soberanía profunda (cifrado cliente / quitar Google) fuera del alcance de v1.0. Reabrir es decisión futura de Edu, no bloquea el cierre. Con el R2 HMAC gate (S148 FASE D), la caja fuerte ya está cerrada para el caso real.

### TD-2: GoogleDriveService.js como monolito
**Impacto:** MEDIO. Mezcla auth OAuth2, operaciones Drive, migraciones.
**Riesgo:** Acoplamiento. Difícil testear. Se deprecará al completar TD-1.
**Plan:** Eliminar progresivamente. Auth quedará en Google OAuth2 (ADR-025).

### TD-3: App.jsx como God Component
**Impacto:** BAJO. Lógica de mutaciones y routing mezclada.
**Progreso:** Parcial. jwtToken threading extraído (S61). Quedan callbacks de mutación.
**Plan:** Extraer mutaciones a custom hooks cuando se complete migración a Worker API.

### TD-4: VaultContext monolítico
**Impacto:** MEDIO. Asume auth + DB híbrida + UI state + polling.
**Riesgo:** Re-renders en cascada (polling de drops cada 30s → toda la app).
**Plan:** Separar en capas: AuthLayer, DBLayer, UILayer (post-migración D1).

### TD-5: Sin tests
**Impacto:** ALTO a largo plazo. Solo testing manual en dispositivo Android.
**Riesgo:** Regresiones silenciosas en flujos complejos (boot híbrido, Worker fallback).
**Plan:** Tests de integración para PlayerContext + VaultContext boot. Tests E2E con Cypress/Playwright.

### TD-6: Virtualización de galería
**Impacto:** MEDIO (rebajado S148).
**Progreso (S148):** MapView virtualiza via `MarkerClusterGroup` chunkedLoading. WALL usa lazy-mount per-item (`IntersectionObserver` con `OBSERVER_MARGIN=400px`) + agrupación por eras (`groupEntriesByEra` antes de la ventana de render, S148 FASE C.2). No es windowing puro (`react-window`) pero es adequate para el dataset real (pareja, <1k fotos). `DEMO_ENTRIES_GEO` eliminado (S148).
**Plan:** Re-evaluar `react-window` solo si el dataset crece >2k entries. Por ahora el lazy-mount + `loading="lazy"` basta.

### TD-8: Escucha Compartida stats y consolidación de eventos (NEW S132)
**Impacto:** MEDIO. SC6/SC12 (stats credit compartido) requiere emisión de eventos por sesiones.
**Estado (2026-06-17):** Eventos `shared_session_started` / `shared_session_joined` / `shared_session_left` emitidos server-side desde `workers/routes/sync.js` via helper `workers/utils/events.js` (TD-8 events layer RESUELTO). Pendiente: STAT-M9 — capa de cómputo que agregue estos eventos con `track_play` para calcular crédito compartido (>50% escuchado = SC12).
**Riesgo:** Sin capa de cómputo, los eventos quedan como datos crudos en D1 pero ninguna vista los lee.
**Plan (resto STAT-M9):** Cliente emite `track_play` con `payload.session_id` y `payload.credit_to` cuando track termina en sesión compartida. Endpoint `/api/stats/shared` agrega play counts por usuarios con crédito. UI: badge "compartido" en tracks escuchados en sesión (MusicLab + Recap).

### TD-7: Sin manejo de archivos corruptos en R2
**Impacto:** BAJO. Fallback estético Cyber-Vandal previsto en spec.
**Riesgo:** Experiencia rota si R2 falla para un archivo específico.
**Plan:** Glitch visual + reintento 3s + skip (mismo patrón que P2).

## Deuda diferida (Fase C)

- DRAG-GLOBAL-C: Unificar animaciones de drag & drop.
- Soporte HEIC/RAW en galería.
- FLAC + OPUS en reproductor.
- Escucha compartida (sharedListening stub exists).
- Modo offline con Service Worker caching.
