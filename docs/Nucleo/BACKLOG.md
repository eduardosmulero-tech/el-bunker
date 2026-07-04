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
| S130-A3 | CSP actualizado: +1 `*.basemaps.cartocdn.com` +1 `*.openstreetmap.org` en img-src + 3 `<link>` vendor CSS | index.html | 2026-06-17 |
| S130-A4 | MapView real: MapContainer + TileLayer CartoDB Dark + MarkerClusterGroup chunkedLoading + divIcon Era glow + Popups | VaultGallery.jsx | 2026-06-17 |
| S130-A5 | DEMO_ENTRIES_GEO: 9 entries hardcoded (Madrid×2 + BCN/GR/SV/VLC/LIS/PAR/ROM) con coords reales para validar clustering | VaultGallery.jsx | 2026-06-17 |
| S130-A6 | FitBoundsToMarkers helper (auto-fit bounds + maxZoom 6 + padding 40px) + L.Icon.Default fix + fallback elegante preservado | VaultGallery.jsx | 2026-06-17 |
| PLIEGO-237 | FASE B — controles del reproductor en 2 filas (tra… | WinampPlayer.jsx | 2026-07-04 |
