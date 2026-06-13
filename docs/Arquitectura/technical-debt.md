---
describe: cualquier refactor estructural
sincronizado_con: S49 (Refundación del producto)
stale_si_pliego_toca: cualquier refactor estructural
---

# Technical Debt (post-S49)

## Deuda resuelta ✅
- YouTube Engine eliminado (M1). Motor exclusivo HTMLAudioElement + R2.
- Schema v5.0.0 con tags en Drive JSON.

## Deuda activa

### TD-1: Migración Drive JSON → D1 + Workers + R2 (ADR-024)
**Impacto:** ALTO. Todo el sistema de persistencia cambia.
**Riesgo:** Pérdida de datos durante la migración, concurrencia en transición.
**Plan:** Workers API como thin REST layer. D1 schema normalizado. R2 para archivos.
**Estimación:** 5-8 sesiones.

### TD-2: GoogleDriveService.js como monolito
**Impacto:** MEDIO. Mezcla auth OAuth2, operaciones Drive, migraciones.
**Riesgo:** Acoplamiento. Difícil testear.
**Plan:** Extraer auth a `AuthService.js`. Drive ops a `DriveService.js` (deprecar progresivamente).

### TD-3: App.jsx como God Component
**Impacto:** BAJO. Lógica de `patchDb` y mutaciones mezclada con routing.
**Riesgo:** Re-renders innecesarios, difícil mantenimiento.
**Plan:** Extraer mutaciones a custom hooks. App.jsx solo routing.

### TD-4: VaultContext monolítico
**Impacto:** MEDIO. Asume auth + DB + UI state simultáneamente.
**Riesgo:** Re-renders en cascada (polling de drops cada 30s → toda la app).
**Plan:** Separar en capas: AuthLayer, DBLayer, UILayer (post-D1).

### TD-5: Sin tests
**Impacto:** ALTO a largo plazo. Solo testing manual en dispositivo.
**Riesgo:** Regresiones silenciosas.
**Plan:** Tests de integración para PlayerContext. Tests E2E con Cypress/Playwright (Fase B).

### TD-6: Virtualización pendiente en galería
**Impacto:** ALTO. Sin virtualización, OOM en Android con >100 fotos.
**Riesgo:** Crash de la PWA.
**Plan:** Implementar con la galería WALL (Fase 2).

### TD-7: Sin manejo de archivos corruptos en R2
**Impacto:** BAJO. Fallback estético Cyber-Vandal previsto.
**Riesgo:** Experiencia rota si R2 falla.
**Plan:** Glitch visual + reintento 3s + skip (mismo patrón que P2).

## Deuda diferida (Fase C)
- DRAG-GLOBAL-C: Unificar animaciones de drag & drop.
- Soporte HEIC/RAW en galería.
- FLAC + OPUS en reproductor.
