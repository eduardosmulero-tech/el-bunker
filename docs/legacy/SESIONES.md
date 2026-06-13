# SESIONES.md — el_bunker
> Append-only. Claude nunca lee este archivo en arranque.
> Al cerrar sesión: añadir entrada aquí con pliegos aplicados y commits.

---

## SESIÓN 38 — 2026-05-29
**Pliegos:** 101, 102, 103, 104b
**Commits:**
- `05b0d0a` PLIEGO-101: AudioVisualizer.jsx — helper withAlpha() para HSL. Fix canvas con accentColor HSL.
- `3c20cfe` PLIEGO-102: WinampPlayer.jsx — helper withAlpha() local. Migración completa estilos inline hex→HSL. Bordes, estados activos y badge tag restaurados.
- `[HASH]` PLIEGO-103: PlayerContext.jsx — añadir estado playbackContext y función persistente a Drive.
- `[HASH]` PLIEGO-104b: MusicLab.jsx — setPlaybackContext y addNext al reproducir desde listas.
**Bugs resueltos:** BUG-VISUALIZER-HSL, BUG-BUILD-097, BUG-NUEVO-20 (Add Next implementado).
**Eliminados:** BUG-COLOR-TAG (se resolverá con features de personalización de tags)
**Notas:** M3 (C1-C5) contexto de reproducción iniciado. M1 y M2 confirmados completos.

## SESIÓN 29 (continuación de historial)
**Pliegos:** 071
**Commits:**
- `[HASH]` PLIEGO-071: fix skip anterior invertido (currentTRef) + scroll título condicional (requestAnimationFrame + width:100%)
==============================================================

---

## SESIÓN 26 — 22 Mayo 2026
**Pliegos:** 069, 070
**Commits:**
- `[HASH]` PLIEGO-069/070: loop triestado + fixes reproductor BUG-09/10/11/12/13/16/17/19

---

## SESIÓN 25 — 22 Mayo 2026
**Pliegos:** 068
**Commits:**
- `[]` PLIEGO-068: fix reauth automatica en 403 para David

---

## SESIÓN 24 — 21 Mayo 2026
**Pliegos:** 066, 066b, 067
**Commits:**
- `[HASH]` PLIEGO-066: Eliminar polling/ytReady del PlayerContext — progreso es UI local
- `[HASH]` PLIEGO-066b: Fix setYtReady residual en onReady tras refactor
- `[HASH]` PLIEGO-067: Polling YT local reactivo a isPlaying + fix dep [] Drive

**Resultado:** Build limpio. Barra de progreso funcional en YouTube y Drive confirmada por Edu. Testing completo con checklist → bugs listados en ESTADO.md.

---

## SESIÓN 23 — 21 Mayo 2026
**Pliegos:** 065, 065b, 065c, 065d, 065e
**Commits:**
- `[HASH]` PLIEGO-065: Fix iframe YT persistente en PlayerProvider
- `[HASH]` PLIEGO-065b: Fix TDZ skipRef — mover declaración tras skip()
- `[HASH]` PLIEGO-065c: Fix YT.Player — loadVideoById en vez de destroy()
- `[HASH]` PLIEGO-065d: Fix setYtReady residual en WinampPlayer
- `[HASH]` PLIEGO-065e: Fix div YT imperativo fuera de React DOM

---

## SESIÓN 22 — 20 Mayo 2026
**Pliegos:** 053, 054, 018-STRINGS
**Commits:**
- `[HASH]` PLIEGO-053: Reorganización src/ en carpetas core/layout/vault/musiclab/smoke
- `[HASH]` PLIEGO-054: BUG-NUEVO-04 consumo masterVolume vía context en SmokeSession
- `[HASH]` PLIEGO-018-STRINGS: manifest.json encoding UTF-8 sin BOM

**Resultado:** Build limpio (vite build exitoso).

> ⚠️ Sesión 20 no documentada — posible salto en numeración o sesión de diagnóstico sin Pliegos aplicados.

---

## SESIÓN 21 — 21 Mayo 2026
**Pliegos:** 061, 062, 063, 064
**Commits:**
- `9df252f` PLIEGO-061/062/063/064: Trilogía del Reproductor + Grupo 2 UI

---

## SESIÓN 19 — 21 Mayo 2026
**Pliegos:** 051, 055, 056, 057, 058, 059, 060, 060b
**Commits:**
- `[HASH]` Bloque B completo + fix MusicLab import useState

---

## SESIÓN 18 — 20 Mayo 2026
**Pliegos:** 046, 047, 048, 049, 050
**Commits:**
- `[HASH]` PlayerContext + fixes UI. Build limpio. Push a master.

---

## SESIÓN DOC-1 — 26 Mayo 2026
**Tipo:** Documental — sin tocar código
**Acciones:**
- Creado `docs/SESION.md`
- Creado `docs/arquitectura/INDEX.md`
- Añadidos headers de staleness a los 7 docs de `docs/arquitectura/`
- Creada carpeta `docs/nucleo/`
- Creados `docs/nucleo/CONTRATO.md`, `docs/nucleo/PROYECTO.md`, `docs/nucleo/REGLAS.md`
**Commits:**
- `[HASH]` DOC-1: sistema documental nuevo en paralelo

## SESIÓN 28 / DOC-2 — 27 Mayo 2026
**Tipo:** Documental — sin tocar código, sin pliegos aplicados
**Acciones:**
- Decisiones arquitecturales M1-M4 cerradas y documentadas
- Criterio SemVer establecido: v4.0.0 (M1) · v4.1.0 (M2) · v4.2.0 (STAT-M9)
- ADR-010 al ADR-014 añadidos a CONTRATO.md
- ADR-003, 🔒-3, 🔒-4 marcados ⛔ SUPERSEDIDOS
- ESTADO.md limpiado: BUG-NUEVO-19 cerrado, 3 items "sin probar" eliminados, reglas YT-específicas eliminadas, renumeración de reglas críticas
- ERRORES_RESUELTOS.md: BUG-NUEVO-19 añadido
**Commits:**
- *(pendiente — commit documental al aplicar estos archivos)*

## S29 — 2026-05-27
Pliegos: PLIEGO-072a (MusicLab.jsx), PLIEGO-072b (PlaylistManager.jsx), PLIEGO-073 (WinampPlayer.jsx)
Bugs resueltos: BUG-14, BUG-15, BUG-23, BUG-18, BUG-22
Sin confirmar en producción: PLIEGO-068, 071, 072, 073
Decisiones arquitecturales: ninguna

## Sesión 32 (2026-05-28)
- **Pliegos procesados:** PLIEGO-081, PLIEGO-082 (Completos), PLIEGO-083 (Parcial).
- **Incidencias:** Agotamiento masivo de contexto debido a múltiples fallos de `pliego_apply.py` en la indentación de reemplazos pequeños.
- **Decisión Arquitectónica:** Aprobación del ADR-015 para mitigar la fragilidad del parser obligando a reemplazar bloques lógicos completos.
## S34 — 2026-05-28
Pliegos: PLIEGO-088, PLIEGO-089, PLIEGO-090, PLIEGO-091
Bugs resueltos: BUG-skipDir, BUG-deletePlaylist
Confirmados: 076, 078, 080, 073, 072, 084, 085, 086
Pendiente: BUG-SW-01, BUG-COLOR-TAG, PLIEGO-083
Decisiones arquitecturales: ninguna
- PLIEGO-083 aplicado manualmente. BUG-LAG04 cerrado.
### Sesión 36 (2026-05-28)
- **Pliegos aplicados:** PLIEGO-094, PLIEGO-095a, PLIEGO-095b, PLIEGO-095c, PLIEGO-096.
- **Cambios clave:** 
  - Refactorización de la infraestructura de Tags (Fase 1). 
  - Creación de fuente de verdad en `tokens.js` con derivación automática de paletas (HSL).
  - Migración de `PlayerContext` a la nueva estructura.
  - Corrección de `REGLAS.md` para clarificar sintaxis de pliegos multi-bloque.
  - *Nota:* Fallo en build al iniciar refactor de `MusicLab.jsx` (abortado, pendiente para S37).
  ## S39 — 2026-05-29
Pliegos: PLIEGO-105 a PLIEGO-122 (18 pliegos)
M3 cerrado completo: playbackContext, historial Q2/Q15, reproducir a continuación Q11, drag&drop cola Q5 y playlists, deuda visual COLA/LISTS, toast duplicados Q7.
Archivos tocados: TrackCard.jsx, PlayerContext.jsx, MusicLab.jsx, PlaylistManager.jsx

## S42 — 2026-05-31
Pliegos aplicados: P-139 a P-155 (con variantes). Sistema de tags Fase A iniciado.
Completado: schema 5.0.0, TagManager.jsx, VIBE_TAGS dinámico, tag obligatorio en AddTrackForm, handlers Drive, botón ⚙ VibeTagBar, filtros tag en LISTS/COLA/PlaylistDetailModal.
Bugs introducidos: SCROLL-01 (VibeTagBar no desplaza — causa raíz no localizada), TAG-01 (emptyForm ReferenceError en TagManager).
Bugs resueltos: Q1/Q8/Q9 (P-134 ya estaba aplicado), export VIBE_TAGS (P-142).
Archivos tocados: GoogleDriveService.js, MusicLab.jsx, TagManager.jsx, TrackCard.jsx, AddTrackForm.jsx, App.jsx, PlaylistManager.jsx.
Nota: demasiadas iteraciones en fix scroll — localizar causa raíz con DevTools en S43 antes de generar más pliegos.

### S43 — 2026-05-31
- **Pliegos:** P-156 a P-165
- **Archivos:** `TagManager.jsx`, `MusicLab.jsx`, `TrackCard.jsx`
- **Hitos:** - Resolución de crash crítico en `TagManager.jsx` (TAG-01).
  - Migración de `TagManager` a overlay global.
  - Resolución del secuestro táctil del scroll horizontal en Android causado por listeners `whileTap` de `framer-motion` (SCROLL-01).
  - Corrección de solapamiento del overlay con el header superior.