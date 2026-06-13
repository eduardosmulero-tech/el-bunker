# AUDITORÍA DE CALIDAD — el_bunker
## P0–P3 · Junio 2026

**Alcance:** 27 ADRs + 8 docs de arquitectura + 22 archivos de código fuente  
**Estándar:** App premium (no proyecto TFG)

---

## 🚨 P0 — CRÍTICOS (rompen funcionalidad)

### 1. Espiral de peticiones a Drive + estado roto en MusicLab
- **Archivo:** `src/musiclab/MusicLab.jsx` ~L148
- **Problema:** `useEffect(() => { fetchPlaylists()... }, [db])` — cada vez que `db` cambia (cada heartbeat, cada `patchDb`), descarga la BD entera de Google Drive. Revienta la cuota API en minutos.
- **Agravante:** `localTracks`, `localDrops`, `localPlaylists` usan `useState(initialValue)` sin `useEffect` de sincronización. Si la BD se refresca desde Worker API, MusicLab nunca ve los nuevos datos.
- **Fix:** Eliminar estados locales. Derivar directo de props: `db.music_lab.tracks`. Eliminar el `useEffect` que llama a Drive.

### 2. Reproductor muestra 0:00 al cambiar de tab
- **Archivos:** `src/musiclab/WinampPlayer.jsx` ~L85, `src/layout/Layout.jsx` MiniPlayer ~L210
- **Problema:** Ambos inicializan `currentT = useState(0)`. Al remontar con audio pausado, `timeupdate` no dispara → muestra "0:00 / 0:00" hasta que el usuario pulse play.
- **Fix:** `useState(audioRef.current?.currentTime || 0)`.

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
- **Archivo:** `src/core/VaultContext.jsx` ~L514
- **Problema:** Cada `patchDb` escribe TODO el objeto `db` (incluyendo entries/eras/tracks ya migrados a D1) de vuelta a Drive JSON. Violación de ADR-024.
- **Fix:** `updateData` debe excluir las ramas ya migradas a Worker API.

### 6. Filtro "Un día como hoy" ignora selección del usuario
- **Archivo:** `src/capsules/Timeline.jsx` ~L48
- **Problema:** `todayEvents` usa `events` raw, no `filteredEvents`. Si filtras por "VAULT", igual ves drops musicales de hace años.
- **Fix:** Cambiar a `filteredEvents`.

### 7. `crossOrigin="anonymous"` rompe fallback de Drive
- **Archivo:** `src/core/PlayerContext.jsx`
- **Problema:** `<audio crossOrigin="anonymous">` + `getStreamUrl` con fallback a Drive. Google Drive no devuelve CORS → crash de audio.
- **Fix:** CrossOrigin solo para dominios `.workers.dev`.

---

## 🎨 P3 — MENORES (polish)

### 8. Exhibition mode muestra Eras vacías
- **Archivo:** `src/vault/VaultGallery.jsx`
- **Problema:** Eras sin fotos renderizan tarjeta con "0".
- **Fix:** Filtrar `eras.filter(e => photoEntries.some(...))`.

### 9. Hardcoding de destinatario en Drops
- **Archivo:** `src/musiclab/MusicLab.jsx` ~L288
- **Problema:** `userId === "edu" ? "david" : "edu"`. Admin rompe la lógica.
- **Fix:** Selector dinámico de destinatario.

### 10. `DEFAULT_VIBE_TAGS` divergen de tags reales en D1
- **Archivo:** `src/musiclab/MusicLab.jsx` L28-34
- **Problema:** gaming, 420_chill, dnb, romantiqueo hardcodeados. Los tags reales de los usuarios (rapidin, steven, etc.) no están.
- **Estado:** Mitigado con `stringToColor` + synthetic tags en `getVibeConfig`. Pendiente: migrar tags reales a D1 y eliminar `DEFAULT_VIBE_TAGS`.

---

## 📊 RESUMEN

| Prioridad | Cantidad | Corregidos | Pendientes |
|-----------|----------|------------|------------|
| P0 — Crítico | 2 | 0 | 2 |
| P1 — Grave | 2 | 2 | 0 |
| P2 — Importante | 3 | 0 | 3 |
| P3 — Menor | 3 | 0 | 3 |
| **Total** | **10** | **2** | **8** |

---

## 🔒 REGLAS INAMOVIBLES VERIFICADAS

| ADR | Regla | Estado |
|-----|-------|--------|
| ADR-011 | Motor de audio único: solo MusicLab instancia `<audio>` | ✅ Cumple |
| ADR-014 | 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES | ✅ Cumple |
| ADR-018 | Stats engine único: tabla events en D1, append-only | ✅ Cumple |
| ADR-020 | Google OAuth2 solo para auth. No Drive para DB | ⚠️ Drive aún se usa como fallback |
| ADR-024 | Worker API como fuente primaria. Drive JSON solo legado | ❌ `patchDb` sigue escribiendo a Drive |
