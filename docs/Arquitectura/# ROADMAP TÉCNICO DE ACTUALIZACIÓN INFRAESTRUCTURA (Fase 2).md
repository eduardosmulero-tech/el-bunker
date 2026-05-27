# 🗺️ ROADMAP TÉCNICO DE ACTUALIZACIÓN INFRAESTRUCTURA (Fase 2)

## M1 — PURGA Y LIMPIEZA RADICAL (Pliego-074)
- **Extirpación de YouTube:** Eliminar referencias, iframes y loops condicionales en `PlayerContext.jsx` y `WinampPlayer.jsx` (Aplicando ADR-003 y ADR-010).
- **Borrón y Cuenta Nueva (Schema v4.0.0):** Reseteo a vacío `[]` de los arrays `tracks` y `drops` en el JSON de Drive, manteniendo exclusivamente los contadores globales (Aplicando ADR-005).
- **Desacople de Estados:** Separar `activeVibe` en `libraryFilter` (UI) y `trackVibe` (Control de reproducción) (Aplicando ADR-011).

## M2 — INGESTA AUTOMÁTICA Y NUEVO MOTOR
- **Serverless Link:** Endpoint en Vercel para generación de Pre-signed URLs hacia Cloudflare R2 (Aplicando ADR-014).
- **Sincronizador Batch Técnico:** Proceso en background (sin HUD/UI) para mapear el bucket mediante `ListObjectsV2` e inyectar lotes de metadatos limpios en el JSON.
- **Motor Nativ0:** Implementación definitiva de `<audio>` con soporte nativo de Byte-Range requests (206) sobre Cloudflare R2 y gapless playback.

## M3 — CONTEXTO Y COLA
- Despliegue de `playbackContext`, `contextPointer` y `manualQueue`.

## M4 — ANDROID & UX PREMIUM
- Audio Focus nativo Android y MediaSession avanzado.