# ROADMAP — EL BÚNKER
> Última actualización: 16 Mayo 2026

---

## MAPA DE FEATURES — ESTADO REAL DEL CÓDIGO

### TAB 1 — VAULT
| Feature | Estado |
|---|---|
| Pantalla de boot con terminal animado | ✅ REAL |
| Login OAuth Google + popup | ✅ REAL |
| Whitelist por email (Admin/Edu/David) | ✅ REAL (hardcoded en GoogleDriveService.js) |
| Pantalla acceso denegado | ✅ REAL |
| Creación de DB en Drive (primera vez) | ✅ REAL |
| StatusBar: estado DB + reloj + punto auth | ✅ REAL |
| BottomNav con 4 tabs + animación | ✅ REAL |
| Adventure Counter (días desde fecha) | ✅ REAL (lee `adventures_start_date` de DB) |
| HeartbeatWidget (verde/rojo) | ✅ REAL (escribe en Drive c/20min) |
| Slider horizontal de Eras | ✅ REAL si hay eras en DB / DEMO si está vacía |
| Demo fallback "ORIGEN/TORMENTA/RENACIMIENTO" | ⚠️ DEMO PURO — no se guarda |
| Panel de detalle por Era (contadores) | ✅ REAL (filtra db.entries) |
| Botón "+ ERA" | ⚠️ SOLO LOG en consola — modal no existe |
| Cápsulas del Tiempo | ❌ DEMO PURO — hardcoded, no conectado a DB |

### TAB 2 — TIMELINE
| Feature | Estado |
|---|---|
| Contenido | ❌ PLACEHOLDER — solo texto "PRÓXIMAMENTE" animado, intencional |

### TAB 3 — MUSIC LAB
| Feature | Estado |
|---|---|
| Reproductor estilo Winamp | ✅ REAL (HTML5 audio) |
| Visualizador Web Audio API | ✅ REAL |
| Animación idle cuando no hay audio | ✅ REAL |
| Filtros por Vibe | ✅ REAL |
| Añadir track (título, artista, URL, nota, vibe) | ✅ REAL — persiste en Drive |
| The Drop — lanzar canción con mensaje | ✅ REAL — persiste en Drive |
| DropAlertModal — modal al entrar si hay drop no visto | ✅ REAL |
| **markDropSeen — marcar drop como visto** | ❌ BUG CRÍTICO — prop no cableada en App.jsx |
| Historial de Drops | ✅ REAL |

### TAB 4 — SMOKE SESSION
| Feature | Estado |
|---|---|
| Timer circular SVG con progreso | ✅ REAL |
| Presets + CUSTOM | ✅ REAL |
| Play / Pause / Reset | ✅ REAL |
| Fade-out automático últimos 2 min | ✅ REAL |
| Restaurar volumen al terminar | ✅ REAL |
| Interacción con MusicLab (masterVolume compartido) | ✅ REAL |

### SISTEMA DE BIBLIOTECAS
| Feature | Estado |
|---|---|
| Lógica at_risk / lost por fecha | ✅ REAL |
| markLibraryHeartbeat | ✅ REAL |
| refreshLibraryCapacity | ✅ REAL |
| librariesAtRisk / librariesNearFull en contexto | ✅ REAL |
| UI en la app que muestre estado de bibliotecas | ❌ NO EXISTE — lógica sin UI |

---

## BUGS CONFIRMADOS EN CÓDIGO

### BUG CRÍTICO — markDropSeen nunca se llama
**Dónde:** `App.jsx` líneas 161-184, `MusicLab.jsx` línea 1101
**Problema:** `onMarkDropSeen` no está pasado como prop a `<MusicLab>` en App.jsx.
**Síntoma:** El mismo Drop sale en modal cada vez que se abre la app.
**Fix (Pliego-001):**
```js
// En App.jsx, dentro del bloque donde se renderiza MusicLab, añadir:
onMarkDropSeen={async (dropId) => {
  await patchDb((prev) => ({
    ...prev,
    music_lab: {
      ...prev.music_lab,
      drops: (prev.music_lab?.drops ?? []).map((d) =>
        d.id === dropId ? { ...d, seen: true } : d
      ),
    },
  }));
}}
```

### BUG MENOR — HeartbeatWidget usa umbral 20 meses, CONFIG usa 18
**Dónde:** `Vault.jsx` (HeartbeatWidget) vs `GoogleDriveService.js` (LIBRARY_AT_RISK_MONTHS)
**Fix:** Extraer la constante al contexto o a un archivo de config compartido.

---

## FASE 0 — BLOQUEANTE (sin esto nada funciona para los 3 usuarios)

- [ ] F0.1 — Resolver bug login Admin (ver ERROR 4 en errores_conocidos.md)
- [ ] F0.2 — Verificar Google Cloud Console: 3 emails como usuarios de prueba, scopes correctos
- [ ] F0.3 — Login con Edu y David confirmado funcionando
- [ ] F0.4 — Ejecutar testing_checklist.md secciones 3 (Auth) y 6 (DB sync)

---

## FASE 1 — CORE (antes de instalar en móviles)

- [ ] F1.1 — Arreglar markDropSeen (PLIEGO-001, 10 líneas en App.jsx)
- [ ] F1.2 — Modal real de "Crear Era" (App.jsx > VaultPage > prop onAddEra)
- [ ] F1.3 — Verificar que Eras reales se muestran (no el demo)
- [ ] F1.4 — Testing checklist secciones 9 (MusicLab) y 10 (Smoke Session)
- [ ] F1.5 — Test DB compartida entre Edu y Admin (dos navegadores simultáneos)

---

## FASE 2 — DEPLOY Y PWA

- [ ] F2.1 — `npm run build` → deploy en Vercel → obtener URL HTTPS
- [ ] F2.2 — Añadir URL de producción a Google Cloud Console
- [ ] F2.3 — Verificar PWA en móvil (banner instalación, standalone, icono)
- [ ] F2.4 — Login en móvil con los 3 usuarios
- [ ] F2.5 — Testing completo en dispositivo real

---

## FASE 3 — FEATURES PENDIENTES (después del lanzamiento)

- [ ] F3.1 — Subida real de fotos a Drive (`uploadPhotoToDrive` en GoogleDriveService.js)
- [ ] F3.2 — Galería de fotos por Era
- [ ] F3.3 — Cápsulas del Tiempo reales (reemplazar demoTimeCapsules en Vault.jsx)
- [ ] F3.4 — UI de bibliotecas en la app
- [ ] F3.5 — Sincronizar umbral HeartbeatWidget (20→18 meses)
- [ ] F3.6 — Modal real de "Crear Era"

---

## FASE 4 — IDEAS PARA DESPUÉS DEL LANZAMIENTO
*(no tocar hasta que Fases 0-2 estén completas)*

- Timeline real (línea de tiempo visual de Eras)
- Sistema de PIN / contenido sensible (is_sensitive flag)
- Edición de Era existente
- Cover image real por Era
- Importador de YouTube con descarga real de audio
