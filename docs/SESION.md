# SESION.md — el_bunker
> Dispatcher único. Leer PRIMERO en cada arranque de sesión.
> Actualizar al CERRAR cada sesión antes de cualquier otra cosa.

---

## ESTADO DE SESIÓN

sesion_numero: 28
fecha_ultima_actualizacion: 2026-05-22
pliego_siguiente: PLIEGO-072
pendiente_de_cierre_anterior: false

---

## CONTEXTO PARA ESTA SESIÓN

**Trabajo pendiente confirmado:**
- PLIEGO-072 — MusicLab.jsx + AddTrackForm.jsx + PlaylistManager.jsx (BUG-14, 15, 23)
- PLIEGO-073 — WinampPlayer.jsx + PlayerContext.jsx (BUG-18, 19, 22)

**Sin confirmar en producción (no son bugs nuevos, solo falta test):**
- PLIEGO-071 — skip anterior + scroll título (aplicado S27, sin confirmar)
- PLIEGO-068 — reauth automática David (aplicado S25, sin confirmar con David)

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
- *(ninguno adicional para sesión 28)*

---

## ARCHIVOS DE REFERENCIA RÁPIDA

| Doc | Ubicación | Cuándo leer |
|---|---|---|
| PLIEGOS.md | raíz | Al generar o revisar un pliego |
| CUENTAS.md | raíz | Problemas de auth o añadir biblioteca |
| arquitectura/* | docs/arquitectura/ | Al tocar archivos que esos docs describen |
| spec/reproductor.md | docs/spec/ (si existe) | Al tocar PlayerContext o WinampPlayer |

---

## NOTAS DE SESIÓN ANTERIOR (S27)

- PLIEGO-071 aplicado: fix skip anterior invertido (currentTRef) + scroll título condicional (requestAnimationFrame)
- Sistema documental: DOC-1 iniciado en esta sesión (S28)
- Próxima sesión tras DOC-1: retomar PLIEGO-072 (bugs MusicLab/Playlists)