# ESTADO.md — el_bunker
> Bugs activos + próximo pliego. Límite: 100 líneas.
> Actualizar al cerrar cada sesión. Historial completo en docs/legacy/SESIONES.md.

---

## PRÓXIMA SESIÓN 28
**Próximo pliego:** PLIEGO-072

---

## BUGS ACTIVOS

### P1 — Bloqueantes
| ID | Descripción | Pliego |
|---|---|---|
| BUG-NUEVO-07 | Token 403 para David: pantalla de error sin salida. Reautenticación automática en `_refreshToken`. | PLIEGO-068 — Aplicado · Sin confirmar con David |

### P2 — Reproductor
*(vacío — bugs 12 y 13 resueltos en PLIEGO-071, sin testear en producción)*

### P3 — UX / MusicLab
| ID | Descripción | Pliego |
|---|---|---|
| BUG-NUEVO-14 | Editar track muestra lista edición + lista tracks simultáneamente. | PLIEGO-072 |
| BUG-NUEVO-15 | Crear playlist con Enter sin botón visible — UX confusa, crea duplicados. | PLIEGO-072 |
| BUG-NUEVO-23 | Eliminar playlist no persiste en DB. Restricción owner innecesaria. | PLIEGO-072 |
| BUG-NUEVO-18 | Slider volumen master no afecta `audioRef.current.volume` para tracks Drive. | PLIEGO-073 |
| BUG-NUEVO-19 | `activeVibe` cambia acento de color solo en reproductor, no en toda la app. | PLIEGO-073 |
| BUG-NUEVO-22 | Botones físicos de volumen Android no sincronizan. Investigar API antes de pliego. | PLIEGO-073 |

### P4 — Feature Gaps
| ID | Descripción |
|---|---|
| FEAT-GAP-01 | Lockscreen skip no implementado. Confirmar si limitación del SO. |
| BUG-NUEVO-20 | Feature "Añadir siguiente" en cola no existe. |
| BUG-NUEVO-21 | Cola no permite duplicados de la misma canción. |

### Sin probar
- Upload MP3 a Drive — feature no implementada.
- Stream MP3 desde Drive — bloqueado por Upload.
- 30 min reproducción continua Drive — bloqueado por Stream.
- Volumen SmokeSession sincronizado con PlayerContext.
- Notificación con sonido breve no interrumpe reproducción.
- PLIEGO-071 — aplicado S27, sin confirmar en producción.

---

## REGLAS CRÍTICAS

1. Progreso es UI local. `currentTime`, `duration`, `progress` → NUNCA en Context.
2. `useEffect` con `[audioRef.current]` es inerte. Suscribirse con dep `[]` en mount.
3. Polling YT en WinampPlayer, no en Context.
4. Div target de YT.Player NUNCA en JSX. Imperativo en body.
5. Diagnóstico completo antes del primer Pliego en bugs de reproductor.
6. `onReady` de YT.Player recibe evento — el player es `e.target`, no `e`.
7. Loop triestado. Nunca boolean. `loopModeRef` para callbacks YT.
8. `mountedRef` guard en efecto `track?.id`.
9. `currentTRef` para callbacks con stale closure en MediaSession.
10. Bug = síntoma + causa. No numerar síntomas del mismo problema como bugs distintos.

---

## DEUDA TÉCNICA ACTIVA

| Item | Acción |
|---|---|
| ADR-008 pendiente corrección | Refactorización PlayerContext: playbackContext + contextPointer + manualQueue |
| `ACID` y `PURPLE` en Vault.jsx | Migrar a tokens.js cuando se toque el archivo |
| Ctrl+A+pegar → verificar línea 1 = `import React` | Bug recurrente desde S19 |
| BUG-NUEVO-07 sin test real con David | Confirmar fix PLIEGO-068 |
| MediaSession no funciona en Android PWA con YouTube | Investigar limitación SO |
| AudioVisualizer: ciclo predeterminadas→negro | Pendiente solución estable |
| Playlist: añadir tracks en bloque, tags, indicador activa | Post-estabilización |