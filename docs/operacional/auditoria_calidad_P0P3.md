# AUDITORÍA DE CALIDAD — el_bunker
## P0–P3 · Junio 2026

**Alcance:** 27 ADRs + 8 docs de arquitectura + 22 archivos de código fuente  
**Estándar:** App premium (no proyecto TFG)

---

## 🚨 P0 — CRÍTICOS (rompen funcionalidad)

### 1. Espiral de peticiones a Drive + estado roto en MusicLab
- **Archivo:** `src/musiclab/MusicLab.jsx` ~L148 — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `fetchPlaylists` eliminado. `localTracks`/`localDrops`/`localPlaylists` eliminados — datos derivados directo de props (`rawTracks`, `userDrops`, `dbPlaylists`). Sin `useEffect` de Drive.

### 2. Reproductor muestra 0:00 al cambiar de tab
- **Archivos:** `src/musiclab/WinampPlayer.jsx`, `src/layout/Layout.jsx` — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `currentT`, `duration`, `progress` inicializados desde `audioRef.current`.

---

## ⚠️ P1 — GRAVES (calidad profesional inaceptable)

### 3. Masonry CSS destruye cronología en galería
- **Archivo:** `src/vault/VaultGallery.jsx` — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `buildMasonryColumns()` con `i % columnCount` respeta cronología left→right.

### 4. URLs de R2 inconsistentes — imágenes rotas
- **Archivos:** `src/vault/VaultGallery.jsx`, `src/core/GoogleDriveService.js` — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `R2_PUBLIC_BASE` centralizado en `src/tokens.js` (`el-bunker-r2-proxy`).

---

## 🔍 P2 — IMPORTANTES (mantenibilidad, arquitectura)

### 5. `patchDb` contamina Drive JSON con datos de D1
- **Archivo:** `src/core/VaultContext.jsx` — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `patchDb` ahora solo escribe campos Drive (libraries, heartbeat, adventures_start_date, schema_version) en `updateData`. Campos D1 (entries, eras, music_lab.*) excluidos.

### 6. Filtro "Un día como hoy" ignora selección del usuario
- **Archivo:** `src/capsules/Timeline.jsx` ~L48 — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `todayEvents` usa `filteredEvents` en vez de `events` raw — respeta filtros de módulo/tipo/era.

### 7. `crossOrigin="anonymous"` rompe fallback de Drive
- **Archivo:** `src/core/PlayerContext.jsx` — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `crossOrigin` condicional: `"anonymous"` solo para URLs `.workers.dev` (R2), `undefined` para Drive.

---

## 🎨 P3 — MENORES (polish)

### 8. Exhibition mode muestra Eras vacías
- **Archivo:** `src/vault/VaultGallery.jsx` — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. Exhibition filtra eras con `photoEntries.some(...)` — no muestra Eras sin fotos.

### 9. Hardcoding de destinatario en Drops
- **Archivo:** `src/musiclab/MusicLab.jsx` ~L288 — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `handleDropSend` usa `RECIPIENTS.find(r => r !== userId)` — maneja admin y cualquier user ID.

### 10. `DEFAULT_VIBE_TAGS` divergen de tags reales en D1
- **Archivo:** `src/musiclab/MusicLab.jsx` L28-34 — **CORREGIDO S66**
- **Estado:** ✅ Resuelto. `DEFAULT_VIBE_TAGS` eliminado. Tags se cargan exclusivamente desde D1. Sin hardcodeos. Tags huérfanos usan `stringToColor` como fallback sintético.

---

## 📊 RESUMEN

| Prioridad | Cantidad | Corregidos | Pendientes |
|-----------|----------|------------|------------|
| P0 — Crítico | 2 | 2 | 0 |
| P1 — Grave | 2 | 2 | 0 |
| P2 — Importante | 3 | 3 | 0 |
| P3 — Menor | 3 | 3 | 0 |
| **Total** | **10** | **10** | **0** |

---

## 🔒 REGLAS INAMOVIBLES VERIFICADAS

| ADR | Regla | Estado |
|-----|-------|--------|
| ADR-011 | Motor de audio único: solo MusicLab instancia `<audio>` | ✅ Cumple |
| ADR-014 | 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES | ✅ Cumple |
| ADR-018 | Stats engine único: tabla events en D1, append-only | ✅ Cumple |
| ADR-020 | Google OAuth2 solo para auth. No Drive para DB | ⚠️ Drive aún se usa como fallback |
| ADR-024 | Worker API como fuente primaria. Drive JSON solo legado | ✅ `patchDb` ya no escribe campos D1 a Drive |
