# ESTADO.md — el_bunker
> Bugs activos + próximo pliego. Límite: 100 líneas.
> Actualizar al cerrar cada sesión. Historial completo en docs/legacy/SESIONES.md.

---

## PRÓXIMA SESIÓN 33
**Próximo pliego:** PLIEGO-084

---

## BUGS ACTIVOS

### P1 — Bloqueantes
| ID | Descripción | Pliego |
|---|---|---|
| BUG-NUEVO-07 | Token 403 para David: pantalla de error sin salida. Reautenticación automática en `_refreshToken`. | PLIEGO-068 — Aplicado · Sin confirmar con David |

### P2 — Reproductor
| ID | Descripción | Pliego |
|---|---|---|
| BUG-NUEVO-22 | Iconos ⏸▶ renderizados como emoji de sistema en Android (Unicode sin selector variación). Fix aplicado, pendiente testear. | PLIEGO-084 ⏳ |
| BUG-skipDir | Lógica skipDir invertida — causa raíz de PLIEGO-071/081/082. Fix aplicado, pendiente testear. | PLIEGO-084 ⏳ |

### P3 — UX / MusicLab
| ID | Descripción | Pliego |
|---|---|---|
| BUG-LAG04 | MusicLab se congela al renderizar demasiados tracks. | PLIEGO-083 — (Parcial) Falta aplicar reset de filtro |

### P4 — Feature Gaps
| ID | Descripción |
|---|---|
| FEAT-GAP-01 | Lockscreen skip pendiente implementación en M4. |
| BUG-NUEVO-20 | Feature "Añadir siguiente" en cola no existe. |
| BUG-NUEVO-21 | Cola no permite duplicados de la misma canción. |

### Sin probar
- Volumen SmokeSession sincronizado con PlayerContext.
- Notificación con sonido breve no interrumpe reproducción.
- PLIEGO-086 — REGLAS.md cabeceras entre bloques — aplicado S33.
- PLIEGO-085 — pliego_apply.py build check — aplicado S33.
- PLIEGO-084 — WinampPlayer.jsx skipDir + emoji + scroll — aplicado S33.
- PLIEGO-083 — MusicLab.jsx paginación (Parcial) — aplicado S32.
- PLIEGO-082 — WinampPlayer.jsx scroll y skipDir — aplicado S32 (causa raíz en 084).
- PLIEGO-081 — WinampPlayer.jsx lógica — aplicado S32 (causa raíz en 084).
- PLIEGO-080 — MusicLab.jsx import patchDb→updateData — aplicado S31.
- PLIEGO-079 al 071 — (Ver historial SESION.md)

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
| Fragilidad en parser | Mitigado con ADR-015 (Directivas Anti-Fricción). |
| ADR-008 pendiente corrección | Refactorización PlayerContext (M3). |
| `ACID` y `PURPLE` en Vault.jsx | Migrar a tokens.js cuando se toque el archivo. |
| Ctrl+A+pegar → verificar línea 1 = `import React` | Bug recurrente desde S19. |
| AudioVisualizer: ciclo predeterminadas→negro | Pendiente solución estable. |
| GoogleDriveService.js refactorización | Archivo >600 líneas — candidato a split (M2/M3). |