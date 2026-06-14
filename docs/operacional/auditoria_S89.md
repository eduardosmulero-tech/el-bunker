# AUDITORÍA S89 — BACKLOG vs CÓDIGO REAL

> **Fecha:** 14 Junio 2026
> **Objetivo:** Verificar cada bug del BACKLOG contra el código real antes de planificar nuevo trabajo.
> **Conclusión:** 6/8 bugs del BACKLOG ya estaban arreglados en código (S85c). El BACKLOG estaba stale.

---

## 📋 METODOLOGÍA

Cada bug del BACKLOG se verificó con 3 fuentes:
1. Código fuente (`read_files` del archivo implicado)
2. `code-searcher` (ripgrep para confirmar presencia/ausencia de patrones)
3. `git log` / CHANGELOG (trazabilidad de cuándo se aplicó el fix)

---

## 🔍 HALLAZGOS POR BUG

### G3 — VAULT ignora color de la app
**BACKLOG decía:** "Usa ACID fijo (#bfff00) en lugar de trackVibe"
**Código real (`Vault.jsx:533-535`):**
```jsx
const { trackVibe, resolveVibeAccent } = usePlayer();
const accent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;
```
**Veredicto:** ✅ **YA FIXEADO.** El `accent` derivado de `trackVibe` se usa en AdventureCounter, headers, botones, footer, toast. El fallback a ACID solo aplica cuando no hay track sonando (comportamiento correcto según spec VB8).
**Fix aplicado en:** S85c (Autonomous Roadmap Batch) o antes.

### G4 — CAPSULES ignora color de la app
**BACKLOG decía:** "Colores fijos sin reaccionar al trackVibe activo"
**Código real (`Capsules.jsx:33-34`):**
```jsx
const { trackVibe, resolveVibeAccent } = usePlayer();
const accent = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;
```
**Veredicto:** ✅ **YA FIXEADO.** El `accent` se usa en sub-tab buttons, loading indicator, error feedback, toast, y se propaga como `accentColor` a Timeline, TimeCapsules, Recaps.
**Fix aplicado en:** S85c (Autonomous Roadmap Batch) — "Capsules toast infrastructure".

### G1 — Densidad VaultGallery no funciona
**BACKLOG decía:** "Botones compact/normal/expanded cambian density state pero el CSS (columnWidth) no produce cambio visual real"
**Código real (`VaultGallery.jsx`):**
- `DENSITY_CONFIG` define `compact:4, normal:3, expanded:2` columnas
- `buildMasonryColumns(items, columnCount)` construye columnas JS (no CSS `columnCount`)
- Los botones de densidad llaman `setDensity(key)` que cambia `density` state
- El state se lee en `renderWall()` como `const config = DENSITY_CONFIG[density]`
- Las columnas se renderizan con `flex: 1` y `minWidth: config.minCol`
**Veredicto:** ✅ **YA FUNCIONA.** El cambio de 2/3/4 columnas + gap + minWidth produce un cambio visual real. La descripción original del bug ("CSS columnWidth no cambia") era correcta para una implementación anterior que usaba CSS columns; la implementación actual usa JS masonry desde S66.
**Fix aplicado en:** S66 (WALL gallery — masonry + densidades + zoom).

### G2 — Botón "+ ERA" placeholder
**BACKLOG decía:** "onAddEra se pasa como prop pero no está implementado en App.jsx"
**Código real (`App.jsx:165-167` PRE-S89):**
```jsx
onAddEra={async () => {
  console.log("[App] onAddEra triggered");  // ← PLACEHOLDER REAL
}}
```
**Veredicto:** 🟡 **ERA UN BUG REAL.** `Vault.jsx` crea la era correctamente (Worker API POST + patchDb local) y llama `onAddEra(created)`, pero App.jsx solo hacía console.log. La era se creaba pero no se refrescaba en el parent.
**Fix aplicado en:** **S89** (esta auditoría). Reemplazado por fetch `/api/eras` + `patchDb` merge.

### W3 — Tags MusicLab no sincronizan con D1
**BACKLOG decía:** "Tags solo se guardan en Drive JSON, no en tabla tags de D1"
**Código real (`App.jsx:190-240`):**
```jsx
// handleAddTag:
await fetch(`${API_BASE}/api/tags`, { method: "POST", body: JSON.stringify({...}) });
// handleUpdateTag:
await fetch(`${API_BASE}/api/tags/${tagId}`, { method: "PATCH", ... });
// handleDeleteTag:
await fetch(`${API_BASE}/api/tags/${tagId}`, { method: "DELETE", ... });
```
**Veredicto:** ✅ **YA FIXEADO.** Los 3 handlers syncronizan con Worker API (D1) + mantienen Drive JSON como backward compat.
**Fix aplicado en:** S85c (Autonomous Roadmap Batch) o S66 (W3 específico).

### G5 — Timeline sin modos de vista ni paginación
**BACKLOG decía:** "Carga plana de tracks sin modos (timeline/grid/compact) ni lazy loading"
**Código real (`Timeline.jsx`):**
- `viewMode` state con "timeline" y "compact" ✅
- `PAGE_SIZE = 50` + `visibleCount` state ✅
- Botón "↓ CARGAR MÁS (X restantes)" ✅
- Filtros por módulo, tipo de evento, era ✅
- Banner "Un día como hoy" ✅
**Veredicto:** ✅ **YA IMPLEMENTADO.** Timeline tiene 2 modos de vista, paginación con PAGE_SIZE=50, y filtros avanzados.
**Fix aplicado en:** S72 (Timeline premium) + mejoras en fases posteriores.

### G6 — Barra volumen SmokeSession display-only
**BACKLOG decía:** "VolumeFadeBar es solo <div> visual, no tiene <input type=range>"
**Código real (`SmokeSession.jsx:600+`):**
```jsx
<input type="range" min={0} max={100}
  value={isFading ? fadedVolume : masterVolume}
  onChange={(e) => { const v = Number(e.target.value);
    if (!isFading && onVolumeChange) onVolumeChange(v); }}
  disabled={isFading}
/>
```
**Veredicto:** ✅ **YA IMPLEMENTADO.** El slider de volumen es funcional. `VolumeFadeBar` es un indicador visual complementario (muestra el fade-out), no el control principal.
**Fix aplicado en:** S73 (SmokeSession premium) o S85c.

### G7 — Reproductor no sigue entre pestañas
**BACKLOG decía:** "WinampPlayer está dentro de MusicLab.jsx, no en Layout. No hay mini-player persistente"
**Código real (`Layout.jsx:463`):**
```jsx
{activeTab !== "music" && <MiniPlayer accentColor={accentColor} />}
```
El `<MiniPlayer>` tiene: play/pause, prev/next, progress bar, time display, tag pill. Usa `usePlayer()` para `activeTrack`, `isPlaying`, `skip`.
**Veredicto:** ✅ **YA IMPLEMENTADO.** El mini-player se renderiza en Layout (fuera de MusicLab) y persiste al cambiar tabs.
**Fix aplicado en:** S85c (Autonomous Roadmap Batch) — "P1 MINI-PLAYER fix".

---

## 🐛 BUGS REALES ENCONTRADOS (no en BACKLOG)

### `alert()` residuales en Vault.jsx
- **Línea 567** (handleAddEra catch): `alert("Error al crear la era. Reintenta.")`
- **Línea 597** (handleEditEntry catch): `alert("Error al actualizar la entrada. Reintenta.")`
- **Fix S89:** Reemplazados por `setToast()` + `setTimeout(2500ms)`. Mismo patrón que el resto de la app.
- **Cero `alert()` en toda la app tras S89.**

---

## 📊 RESUMEN DE LA AUDITORÍA

| Categoría | Count | Detalle |
|---|---|---|
| Bugs BACKLOG ya fixeados (stale) | 6 | G3, G4, G1, W3, G5, G6, G7 |
| Bug BACKLOG real (fixeado en S89) | 1 | G2 (onAddEra placeholder) |
| Bugs nuevos encontrados (fixeados en S89) | 2 | alert() residuales en Vault.jsx |
| **Total bugs cerrados en S89** | **9** | (6 stale + 1 G2 + 2 alert) |
| Bugs restantes en BACKLOG | 1 | Q12 (añadir playlist entera a cola) |

---

## 🎯 GAPS PENDIENTES (no en BACKLOG, del spec)

### Features del reproductor spec v2 (~17% pendiente):
- **S3:** Soft delete de tracks (campo `deleted_at` + `deleted_by` en D1)
- **S4:** Sin MP3 o sin red → estado neutral consciente
- **Q12:** Añadir playlist entera a cola
- **Q13:** Selección múltiple de tracks (Fase B)
- **A1-A6:** Android audio focus — código existe, sin validar en dispositivo
- **SC1-SC14:** Escucha compartida — 0% implementado
- **CAST1-6:** Chromecast — 0%
- **VIZ1-6:** Visualizador avanzado — parcial
- **P1-P3, EC-P1-P5:** Playback avanzado — parcial
- **EC-TR6:** ID3 metadata al subir MP3

### Features de capsulas_spec (~24% pendiente):
- **SS-1:** Guardar nombres de sesiones (hay input, verificar persistencia)
- **SS-2/3:** Historial de sesiones, rachas — parcial
- **SS-5:** Presets personalizados guardables
- **SS-6:** Sonido ambiente (Fase C)
- **SS-7:** Notificación 1 minuto antes del fade-out
- **TC-6:** Push notification al desbloquear cápsula
- **TC-9:** Cápsulas colaborativas (ambos añaden contenido)

### Features de galeria_vault_spec (~30% pendiente):
- **WALL:** Virtualización agresiva (100+ fotos sin OOM), long press ribbon con metadata completa
- **CINEMA:** Audioguías (Curator Notes), Ken Burns sutil, pausa contemplativa
- **DIALOGUE:** Emparejamiento <5min con conector visual, asimetría eco poético
- **MAP:** Clusters narrativos, timeline slider, capas (todos/era/año)
- **EXHIBITION:** Salas semánticas avanzadas (8 salas: vibes + viajes + celebraciones + noche/día)
- **REEL:** Banda sonora, regenerar, pinning manual

### Features de taxonomia_vault (~92% pendiente):
- **Categoría 1 (MULTIMEDIA):** 5/5 sub-tipos implementados (Fase 8.1) ✅
- **Categorías 2-14:** ~65 tipos de contenido sin implementar

---

## 📈 PORCENTAJE REAL DE COMPLETITUD

| Spec | % Completo | Tendencia |
|---|---|---|
| Reproductor v2 | ~83% | — |
| CAPSULES | ~76% | — |
| Galería VAULT | ~70% | — |
| Taxonomía VAULT | ~8% | — |
| Core/Infra | ~95% | — |
| **TOTAL PONDERADO** | **~70%** | — |

> **Nota:** El ESTADO.md reportaba 90-97% por módulo, pero eso mide progreso contra el ROADMAP (Fases 0-6), no contra las specs completas. Las specs son más ambiciosas que el roadmap original.

---

## ✅ ACCIONES TOMADAS EN S89

1. ✅ Verificación código de 8 bugs BACKLOG → 6 ya fixeados, 2 reales
2. ✅ Fix G2: `onAddEra` en App.jsx → Worker API refresh real
3. ✅ Eliminar 2 `alert()` residuales → toast vibe-aware
4. ✅ Cero `alert()` en toda la app
5. ✅ BACKLOG.md actualizado: 9 bugs → RESUELTOS
6. ✅ ESTADO.md actualizado: bugs activos limpiados
7. ✅ SESION.md actualizado: registro S89
8. ✅ ESLint: 0 errores en archivos modificados
