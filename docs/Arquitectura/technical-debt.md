---
describe: cualquier refactor estructural
sincronizado_con: S153 — D1/R2 source of truth, Google OAuth only, reorder/audio-preload/VaultHelpers y responsive desktop actualizados
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

### TD-1: Frontera Drive → D1/R2 — ✅ cerrado en código; documentación histórica en actualización
**Resultado:** Entries, eras, tracks, playlists, drops, tags, queue, cápsulas, eventos y archivos usan Worker/D1/R2. `VaultContext` carga desde Worker y `patchDb` es local-only; no existe escritura de datos en Drive.
**Evidencia:** `GoogleAuthService` solo solicita `userinfo.email` y `userinfo.profile`; no contiene scopes ni APIs Drive. La única referencia conservada es un facade legacy que lanza errores explícitos para las antiguas operaciones de biblioteca.
**Riesgo residual:** El fallback `drive_file_id` se conserva como metadata histórica, pero la reproducción actual usa exclusivamente `r2_key`. Se mantiene el facade hasta retirar consumidores externos y cerrar la compatibilidad.
**Plan:** No añadir imports nuevos de `GoogleDriveService`; mantener la prueba de frontera y retirar el facade en un contenedor posterior solo cuando exista evidencia de cero consumidores fuera del repositorio.

### TD-2: GoogleDriveService.js como facade legacy — 🟡 transición controlada
**Impacto:** Bajo. Ya no mezcla auth ni realiza operaciones Drive; reexporta auth y expone errores explícitos para APIs retiradas.
**Riesgo:** Un consumidor futuro podría interpretar los exports históricos como capacidad activa.
**Plan:** Mantener el facade sin nuevos consumidores, documentar la retirada y eliminarlo únicamente tras una búsqueda de referencias externa/monorepo y aceptación de compatibilidad.

### TD-3: App.jsx como God Component
**Impacto:** BAJO. Lógica de mutaciones y routing mezclada.
**Progreso:** Parcial. jwtToken threading extraído (S61). Quedan callbacks de mutación.
**Plan:** Extraer mutaciones a custom hooks cuando se complete migración a Worker API.

### TD-4: VaultContext monolítico
**Impacto:** MEDIO. Asume sesión/auth, carga D1, estado UI y polling local.
**Estado G3:** ya no usa una DB híbrida ni carga Drive; `GoogleAuthService` está separado y `_buildDbFromWorker` carga D1/R2.
**Riesgo:** Re-renders en cascada y responsabilidades todavía agrupadas.
**Plan:** Separar progresivamente en capas AuthLayer, DBLayer y UILayer, manteniendo `useVault()` durante la transición.

### TD-5: Cobertura de integración/E2E incompleta
**Impacto:** MEDIO. Existe una suite automatizada de contrato y unidades, pero faltan recorridos E2E y pruebas runtime PWA/dispositivo.
**Estado 3-ago-2026:** **114/114 tests** verdes en 18 archivos; lint/build/sintaxis/diff-check verdes.
**Riesgo residual:** Regresiones de flujo completo (boot, UI autenticada, PWA instalada, offline/update) pueden escapar a la suite jsdom/node.
**Plan:** Añadir pruebas E2E y una matriz runtime Android/PWA cuando exista un artefacto de navegador reproducible; no confundir tests verdes con aceptación visual.

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
**Estado:** diferido; el reproductor ya limita reintentos y evita loops de skip, pero la galería aún no muestra un placeholder de archivo dañado con reintento visual.
**Impacto:** BAJO. Fallback estético Cyber-Vandal previsto en spec.
**Riesgo:** Experiencia rota si R2 falla para un archivo específico.
**Plan:** Glitch visual + reintento 3s + skip (mismo patrón que P2).

## Deuda diferida (Fase C)

- DRAG-GLOBAL-C: Unificar animaciones de drag & drop; el reorder de cola ya usa IDs estables y queda funcional, pero playlist/tags conservan patrones propios.
- Soporte HEIC/RAW en galería.
- FLAC + OPUS en reproductor.
- Escucha compartida: sincronización HTTP/long-polling activa; WebSocket nativo sigue diferido.
- Modo offline ampliado con Service Worker caching: actualmente existe shell/cache de assets y fallback; `/api/` no se cachea y no hay sincronización automática de cambios.

## Estado de higiene G0–G8 — 3 ago 2026

- G4 seguro: fronteras puras extraídas sin duplicar estado ni audio.
- G5: iconografía funcional canónica; aliases legacy preservan contenido persistido.
- G6: composición responsive desktop/móvil implementada en las tres tabs; la aceptación visual final y PWA instalada requieren artefacto reproducible.
- G7: SW contractualmente protegido; falta prueba runtime de instalación/offline/update en dispositivo real.
- TD-1/TD-2: Drive queda como facade/fallback histórico de transición; no retirarlo sin evidencia externa y decisión de compatibilidad.
