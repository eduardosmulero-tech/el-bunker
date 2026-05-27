# SESIONES.md — el_bunker
> Append-only. Claude nunca lee este archivo en arranque.
> Al cerrar sesión: añadir entrada aquí con pliegos aplicados y commits.

---

## SESIÓN 27 — 22 Mayo 2026
**Pliegos:** 071
**Commits:**
- `[HASH]` PLIEGO-071: fix skip anterior invertido (currentTRef) + scroll título condicional (requestAnimationFrame + width:100%)

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