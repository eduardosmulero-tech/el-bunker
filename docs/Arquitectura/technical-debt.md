---
describe: cualquier refactor estructural
sincronizado_con: S64 — VaultContext → Worker API (carga híbrida)
stale_si_pliego_toca: cualquier refactor estructural
---

# Technical Debt (post-S64)

## Deuda resuelta ✅

- ✅ YouTube Engine eliminado (S49). Motor exclusivo HTMLAudioElement + R2.
- ✅ D1 schema + Workers + Wrangler desplegados (S54).
- ✅ Worker API: 22 endpoints REST + JWT auth (S55-S63).
- ✅ Capsules conectadas a Worker API real (S58).
- ✅ StatsEngine wired: trackPlay/Pause/Skip, entryCreated, dropSent (S58-S59).
- ✅ FileUploadService con pre-signed URLs a R2 (S58).
- ✅ JWT frontend wiring: VaultContext obtiene y propaga JWT (S59, S61).
- ✅ Imports MusicLab corregidos Layout → tokens (S60).
- ✅ VaultContext carga híbrida Drive+Worker para entries/eras/tracks (S64).

## Deuda activa

### TD-1: Migración completa Drive JSON → D1 (ADR-024)
**Progreso:** 60%. Entries/eras/tracks ya cargan de Worker API. Libraries/playlists/drops/tags siguen en Drive.
**Impacto:** ALTO. Sin migración completa, coexisten dos fuentes de verdad.
**Riesgo:** Divergencia de datos si se escribe en Drive pero se lee de D1.
**Plan:** S65 (VAULT writes) + migrar playlists/drops/tags a Worker API.
**Estimación:** 3-4 sesiones restantes.

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

### TD-6: Virtualización pendiente en galería
**Impacto:** ALTO. Sin virtualización, OOM en Android con >100 fotos.
**Riesgo:** Crash de la PWA al cargar galerías grandes.
**Plan:** Virtualización en WALL mode (masonry). Lazy loading ya implementado.

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
