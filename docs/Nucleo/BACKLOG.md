# BACKLOG.md — el_bunker
> Bugs en espera ordenados por prioridad.
> Un bug activo a la vez — ver docs/Nucleo/ESTADO.md.
> Límite: 60 líneas. Si crece más, revisar si hay bugs que ya no aplican.

---

## PRIORIDAD ALTA — desbloquean features

### Q12 — Añadir playlist entera a cola
**Archivo:** `src/musiclab/MusicLab.jsx`
**Causa raíz:** Botón en playlist detail no implementado. Bloqueada por arquitectura de Q14 (ya resuelta).

---

## PRIORIDAD BAJA — features Fase A no urgentes

### Q12 — Añadir playlist entera a cola
**Bloqueada por:** Q14 (separación visual cola manual/contexto)

### S1/S2 — Persistencia posición tracks >25min
**Depende de:** stats engine / D1

---

## RESUELTOS

| ID | Fix | Archivo | Fecha |
|----|-----|---------|-------|
| CTX-1 | AnimatePresence anidado en TrackCard — menú ⋮ no abría en tracks nuevos | TrackCard.jsx | 2026-06-01 |
| PLIEGO-224 | Unificar Modo Edición | MusicLab.jsx | 2026-06-04 |
| Q2 | skip(1) cola manual itera saltando duplicados activeTrack | PlayerContext.jsx | 2026-06-13 |
| Q3 | shuffle filtra playHistory al regenerar orden | PlayerContext.jsx | 2026-06-13 |
| Q10 | playTrack añade al historial al cambiar de track | PlayerContext.jsx | 2026-06-13 |
| SH1 | SmokeSession persiste endTime en localStorage | SmokeSession.jsx | 2026-06-13 |
| L1 | addLibrary refresca libraryCapacity automáticamente | VaultContext.jsx | 2026-06-13 |
| PLIEGO-227 | Modo Edición persistente | MusicLab.jsx | 2026-06-04 |
| G3 | VAULT vibe-aware — S85c ya añadió usePlayer() + trackVibe accent dinámico | Vault.jsx | 2026-06-14 |
| G4 | CAPSULES vibe-aware — S85c ya añadió usePlayer() + trackVibe accent dinámico | Capsules.jsx | 2026-06-14 |
| G1 | Densidad VaultGallery — buildMasonryColumns JS cambia columnas reales (no CSS columns) | VaultGallery.jsx | 2026-06-14 |
| G2 | Botón "+ ERA" — S89 fix: onAddEra ahora refresca eras desde Worker API | App.jsx, Vault.jsx | 2026-06-14 |
| W3 | Tags MusicLab → D1 — S85c añadió sync con Worker API /api/tags | App.jsx | 2026-06-14 |
| G5 | Timeline modos + paginación — S85c añadió viewMode (timeline/compact) + PAGE_SIZE + "CARGAR MÁS" | Timeline.jsx | 2026-06-14 |
| G6 | Volumen SmokeSession — S85c añadió `<input type="range">` funcional | SmokeSession.jsx | 2026-06-14 |
| G7 | Mini-player entre pestañas — Layout.jsx ya renderiza `<MiniPlayer>` en `activeTab !== "music"` | Layout.jsx | 2026-06-14 |
| ALERT-1/2 | alert() → toast vibe-aware en Vault.jsx (addEra + updateEntry) | Vault.jsx | 2026-06-14 |
| S126-A | VolumeFadeBar componente eliminado (S126 — doble barra decorativa duplicaba input range) | SmokeSession.jsx | 2026-06-17 |
| S126-B | Botón ▶ ACTIVAR outlined cuando !running (jerarquía secundaria sin perder hitbox) | SmokeSession.jsx | 2026-06-17 |
| S126-C | S97 inline category badge removido en EraDetailPanel row (filtro global arriba ya indica categoría) | Vault.jsx | 2026-06-17 |
| S126-D | S98 badges slice(0,2) + +N indicator con title discoverability | Vault.jsx | 2026-06-17 |
| S126-E | edit/delete buttons mobile-friendly con sm:group-hover dual-class | Vault.jsx | 2026-06-17 |
| S126-F | _CAT_LOOKUP dead code eliminado (era helper sin uso tras quitar S97) | Vault.jsx | 2026-06-17 |
