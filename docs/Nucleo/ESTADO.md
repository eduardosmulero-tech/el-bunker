# ESTADO.md — el_bunker
> Fuente de verdad de sesión. MAX 60 líneas. UN bug activo.
> Actualizar antes de cerrar sesión. Bugs en espera → BACKLOG.md.

**Próximo pliego:** S66 — Bug W3: sincronizar tags MusicLab con D1
**Última sesión:** S65a — 5 bugs corregidos (Q2/Q3/Q10/SH1/L1)
**Rama activa:** `master`

---

## Bugs activos

### P1 — ninguno activo

### P2/resto
- **W3:** Tags de MusicLab solo se guardan en Drive JSON, no sincronizan con D1
- **G1:** Botones de densidad (compact/normal/expanded) en VaultGallery no cambian el layout — placeholder visual, reaccionan al click pero sin efecto
- **G2:** Botón "+ ERA" no abre formulario de creación de era — placeholder sin acción real
- **G3:** VAULT no sigue el color del resto de la app (trackVibe / --vibe-accent). Siempre usa ACID fijo (#bfff00)
- **G4:** CAPSULES tampoco sigue el color de la app. Timeline, Smoke, Capsules y RECAP usan colores fijos sin reaccionar al track activo
- **G5:** Timeline carga listas planas enormes (tracks enteros) sin paginación ni modos de vista alternativos (timeline/grid/compact)
- **G6:** Barra de volumen en SmokeSession es solo display — no permite modificar el volumen master. Debería ser un slider interactivo
- **G7:** El reproductor (WinampPlayer) se queda anclado en MusicLab. No hay mini-player persistente que acompañe al usuario al navegar a VAULT o CAPSULES

---

## ESLint
✅ 0 errores, 0 warnings en src/ (S65)

---

## Docs stale
Ninguno — actualizados en S65.

---

## Pliegos sin confirmar
ninguno

---

## Changelog usuario
→ docs/Nucleo/CHANGELOG.md
