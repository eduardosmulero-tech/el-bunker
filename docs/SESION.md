# SESION.md — el_bunker
> Dispatcher único. Leer PRIMERO en cada arranque de sesión.
> Actualizar al CERRAR cada sesión antes de cualquier otra cosa.

---

## ESTADO DE SESIÓN

sesion_numero: 31
fecha_ultima_actualizacion: 2026-05-28
pliego_siguiente: PLIEGO-081

SEARCH/REPLACE 2 — contexto: añadir PLIEGO-080
pendiente_de_cierre_anterior: false

SEARCH/REPLACE 2 — contexto para esta sesión

---

## CONTEXTO PARA ESTA SESIÓN

**Sin confirmar en producción (no son bugs nuevos, solo falta test):**
- PLIEGO-080 — MusicLab.jsx import patchDb→updateData (BUG build) — aplicado S31, sin confirmar
- PLIEGO-079 — sw.js bypass YT — aplicado S30, sin confirmar

SEARCH/REPLACE 3 — notas de sesión anterior
- PLIEGO-078 — AddTrackForm.jsx modo mantenimiento — aplicado S30, sin confirmar
- PLIEGO-077 — MusicLab.jsx extirpación YT + libraryFilter local — aplicado S30, sin confirmar
- PLIEGO-076 — WinampPlayer.jsx extirpación YT + trackVibe — aplicado S30, sin confirmar
- PLIEGO-075 — PlayerContext.jsx extirpación YT + trackVibe — aplicado S30, sin confirmar
- PLIEGO-074 — GoogleDriveService.js schema v4.0.0 — aplicado S30, sin confirmar
- PLIEGO-073 — WinampPlayer.jsx (BUG-18, 22) — aplicado S29, sin confirmar
- PLIEGO-072 — MusicLab.jsx + PlaylistManager.jsx (BUG-14, 15, 23) — aplicado S29, sin confirmar
- PLIEGO-071 — skip anterior + scroll título — aplicado S27, sin confirmar
- PLIEGO-068 — reauth automática David — aplicado S25, sin confirmar con David

**Bloqueos activos:** ninguno

SEARCH/REPLACE 3 — notas de sesión anterior

---

## SECUENCIA DE ARRANQUE OBLIGATORIA

Leer en este orden exacto. No generar ningún pliego hasta completar los 6 pasos.

1. `docs/SESION.md`                  ← este archivo
2. `docs/nucleo/CONTRATO.md`         ← ADRs vigentes + reglas inamovibles
3. `docs/nucleo/PROYECTO.md`         ← stack, usuarios, configuración
4. `docs/nucleo/REGLAS.md`           ← workflow + conducta Claude
5. `ESTADO.md`                       ← bugs activos + features (ubicación actual, raíz)
6. `docs/arquitectura/INDEX.md`      ← qué docs de arquitectura están stale

Docs adicionales solo si el trabajo de sesión los requiere (declarar aquí):
- *(ninguno adicional para sesión 30)*

---

## ARCHIVOS DE REFERENCIA RÁPIDA

| Doc | Ubicación | Cuándo leer |
|---|---|---|
| PLIEGOS.md | raíz | Al generar o revisar un pliego |
| CUENTAS.md | raíz | Problemas de auth o añadir biblioteca |
| arquitectura/* | docs/arquitectura/ | Al tocar archivos que esos docs describen |
| spec/reproductor.md | docs/spec/ (si existe) | Al tocar PlayerContext o WinampPlayer |

---

## NOTAS DE SESIÓN ANTERIOR (S31)

- Build roto heredado de S30: import patchDb inexistente en MusicLab.jsx — resuelto con PLIEGO-080
- Causa raíz: PLIEGO-077 introdujo import con nombre incorrecto (patchDb vs updateData)
- Build limpio al cierre: 430 modules, 0 errores
- Nota deuda técnica: GoogleDriveService.js candidato a refactorización (archivo muy grande)
- Próxima sesión: confirmar M1 en producción antes de abrir M2