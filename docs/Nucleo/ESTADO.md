# ESTADO.md — el_bunker
> Bugs activos + próximo pliego. Límite: 100 líneas.
> Actualizar al cerrar cada sesión. Historial completo en docs/legacy/SESIONES.md.

---

## PRÓXIMA SESIÓN 31
**Próximo pliego:** PLIEGO-080

SEARCH/REPLACE 2 — sin probar

---

## BUGS ACTIVOS

### P1 — Bloqueantes
| ID | Descripción | Pliego |
|---|---|---|
| BUG-NUEVO-07 | Token 403 para David: pantalla de error sin salida. Reautenticación automática en `_refreshToken`. | PLIEGO-068 — Aplicado · Sin confirmar con David |

### P2 — Reproductor
*(vacío — bugs 12 y 13 resueltos en PLIEGO-071, sin testear en producción)*

### P3 — UX / MusicLab
*(vacío — bugs 14, 15, 18, 22, 23 resueltos en PLIEGO-072/073, sin testear en producción)*

### P4 — Feature Gaps
| ID | Descripción |
|---|---|
| FEAT-GAP-01 | Lockscreen skip pendiente implementación en M4. |
| BUG-NUEVO-20 | Feature "Añadir siguiente" en cola no existe. |
| BUG-NUEVO-21 | Cola no permite duplicados de la misma canción. |

### Sin probar
- Volumen SmokeSession sincronizado con PlayerContext.
- Notificación con sonido breve no interrumpe reproducción.
- PLIEGO-071 — aplicado S27, sin confirmar en producción.
- PLIEGO-072 — aplicado S29, sin confirmar en producción.
- PLIEGO-073 — aplicado S29, sin confirmar en producción.
- PLIEGO-074 — schema v4.0.0 GoogleDriveService.js — aplicado S30, sin confirmar.
- PLIEGO-075 — extirpación YT + trackVibe PlayerContext — aplicado S30, sin confirmar.
- PLIEGO-076 — extirpación YT + trackVibe WinampPlayer — aplicado S30, sin confirmar.
- PLIEGO-077 — extirpación YT + libraryFilter local MusicLab — aplicado S30, sin confirmar.
- PLIEGO-078 — AddTrackForm modo mantenimiento — aplicado S30, sin confirmar.
- PLIEGO-079 — bypass YT eliminado sw.js — aplicado S30, sin confirmar.

---

## REGLAS CRÍTICAS

1. Progreso es UI local. `currentTime`, `duration`, `progress` → NUNCA en Context.
2. `useEffect` con `[audioRef.current]` es inerte. Suscribirse con dep `[]` en mount.
3. Diagnóstico completo antes del primer Pliego en bugs de reproductor.
4. Loop triestado. Nunca boolean. `loopModeRef` para callbacks de audio nativo — evita stale closure en event listeners de HTMLAudioElement.
5. `mountedRef` guard en efecto `track?.id`.
6. `currentTRef` para callbacks con stale closure en MediaSession.
7. Bug = síntoma + causa. No numerar síntomas del mismo problema como bugs distintos.

---

## DEUDA TÉCNICA ACTIVA

| Item | Acción |
|---|---|
| ADR-008 pendiente corrección | Refactorización PlayerContext: playbackContext + contextPointer + manualQueue (M3) |
| `ACID` y `PURPLE` en Vault.jsx | Migrar a tokens.js cuando se toque el archivo |
| Ctrl+A+pegar → verificar línea 1 = `import React` | Bug recurrente desde S19 |
| BUG-NUEVO-07 sin test real con David | Confirmar fix PLIEGO-068 |
| AudioVisualizer: ciclo predeterminadas→negro | Pendiente solución estable |
| Playlist: añadir tracks en bloque, tags, indicador activa | Post-estabilización |