# SESION.md — el_bunker
> Dispatcher único. Leer PRIMERO en cada arranque de sesión.
> Actualizar al CERRAR cada sesión antes de cualquier otra cosa.

---

## ESTADO DE SESIÓN

sesion_numero: 34
fecha_ultima_actualizacion: 2026-05-28
pliego_siguiente: PLIEGO-088
pendiente_de_cierre_anterior: false

---

## CONTEXTO PARA ESTA SESIÓN

**Pendiente testear en producción:**
- PLIEGO-086 — REGLAS.md prohibir cabeceras entre bloques — aplicado S33 ⏳
- PLIEGO-085 — pliego_apply.py build check + fix terminador — aplicado S33 ⏳
- PLIEGO-084 — WinampPlayer.jsx skipDir + BUG-NUEVO-22 + scroll reset — aplicado S33 ⏳
- PLIEGO-083 — MusicLab.jsx paginación TrackCard (Parcial) — aplicado S32 ⏳
- PLIEGO-082 — WinampPlayer.jsx fix skipDir y scroll título — aplicado S32 ⏳ (causa raíz resuelta en 084)
- PLIEGO-081 — WinampPlayer.jsx lógica invertida — aplicado S32 ⏳ (causa raíz resuelta en 084)
- PLIEGO-080 — MusicLab.jsx import patchDb→updateData (BUG build) — aplicado S31 ⏳
- PLIEGO-079 — sw.js bypass YT — aplicado S30 ⏳
- PLIEGO-078 — AddTrackForm.jsx modo mantenimiento — aplicado S30 ⏳
- PLIEGO-077 — MusicLab.jsx extirpación YT + libraryFilter local — aplicado S30 ⏳
- PLIEGO-076 — WinampPlayer.jsx extirpación YT + trackVibe — aplicado S30 ⏳
- PLIEGO-075 — PlayerContext.jsx extirpación YT + trackVibe — aplicado S30 ⏳
- PLIEGO-074 — GoogleDriveService.js schema v4.0.0 — aplicado S30 ⏳
- PLIEGO-073 — WinampPlayer.jsx (BUG-18, 22) — aplicado S29 ⏳
- PLIEGO-072 — MusicLab.jsx + PlaylistManager.jsx (BUG-14, 15, 23) — aplicado S29 ⏳
- PLIEGO-071 — skip anterior + scroll título — aplicado S27 ⏳ (causa raíz resuelta en 084)
- PLIEGO-068 — reauth automática David — aplicado S25 ⏳ pendiente test real David

**Bloqueos activos:** ninguno

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
- *(ninguno adicional para sesión 33)*

---

## ARCHIVOS DE REFERENCIA RÁPIDA

| Doc | Ubicación | Cuándo leer |
|---|---|---|
| PLIEGOS.md | raíz | Al generar o revisar un pliego |
| CUENTAS.md | raíz | Problemas de auth o añadir biblioteca |
| arquitectura/* | docs/arquitectura/ | Al tocar archivos que esos docs describen |
| spec/reproductor.md | docs/spec/ (si existe) | Al tocar PlayerContext o WinampPlayer |

---

## NOTAS DE SESIÓN ANTERIOR (S33)

- Causa raíz de skipDir identificada y corregida en PLIEGO-084: condición >= 3s estaba invertida. Explica fallos de PLIEGO-071, 081, 082.
- BUG-NUEVO-22 diagnosticado y corregido: ⏸▶ Unicode renderizados como emoji de sistema en Android. Fix: selector de variación \uFE0E.
- pliego_apply.py mejorado (PLIEGO-085): build check automático + rollback si falla + fix parser para cabeceras ──.
- REGLAS.md actualizado (PLIEGO-086): prohibición explícita de texto entre bloques REPLACE/SEARCH. Causa raíz de 3 sesiones con cabeceras inyectadas.
- Próxima sesión: PLIEGO-083-fix para BUG-LAG04 (paginación MusicLab, bloque 2 fallido).