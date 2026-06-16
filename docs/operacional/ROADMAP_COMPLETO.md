# 🗺️ ROADMAP COMPLETO — El Búnker
> **Auditoría REAL post-S123**: 17 Junio 2026 — Auditor externo vs código real.
> **Porcentaje real del proyecto**: ~68% (no 92%).
> **Total restante estimado**: ~52h en 4 fases.
> **Objetivo**: Entregar a Edu y David un producto profesional, con personalidad y acabados premium.

---

## ⚠️ REGLAS INAMOVIBLES

1. **CONTRATO.md es ley** — 27 ADRs, 7 inamovibles.
2. **Motor audio único**: solo MusicLab instancia `<audio>` (ADR-018).
3. **3 tabs definitivos**: VAULT · MUSIC LAB · CAPSULES (ADR-017).
4. **Stats engine único**: tabla `events` en D1, append-only (ADR-019).
5. **Google OAuth2 solo auth**: Drive deprecado como BD (ADR-025).
6. **D1 es source of truth** para TODA persistencia.
7. **WorkerClient singleton** para todas las llamadas API.
8. **SEARCH/REPLACE contenedor lógico completo** (ADR-015).
9. **Un placeholder NO es una feature.** Texto hardcodeado = 0%.

---

## 1. ESTADO REAL (Auditoría externa 17 Junio 2026)

### 📊 Porcentaje global honesto: ~68%

| Área | % Real | Veredicto |
|---|---|---|
| **Infraestructura** (D1+R2+Worker+CI/CD) | 95% | ✅ Sólida |
| **Cápsulas** (Timeline+Smoke+TimeCapsules+RECAP) | 95% | ✅ La parte más completa |
| **MusicLab** (cola+contexto+posición+ID3) | 90% | ✅ Base técnica sólida |
| **Reproductor visual** (6 modos canvas + fullscreen) | 85% | 🟡 Sin auto-activación salvapantallas |
| **Escucha Compartida** (SC1-SC14) | 80% | 🟡 SC2 atribución = 0% |
| **DROPS** (M20/M21) | 40% | 🔴 M20 no implementado, M21 delegado |
| **Galería VAULT** (6 modos) | 35% | 🔴 **LA MAYOR INFLACIÓN DEL PROYECTO** |
| **VIZ/Otros** (lockscreen, animaciones) | 33% | 🔴 0% implementado |

---

### ✅ LO QUE SÍ FUNCIONA (production-ready)

| Feature | % | Detalle |
|---|---|---|
| **Infraestructura D1+R2+Worker** | 95% | 15 rutas, worker.js 81 líneas, D1 16 tablas |
| **WorkerClient singleton** | 100% | get/post/patch/put/del, 42+ fetch calls |
| **Auth JWT** | 100% | HMAC-SHA256, sessionStorage, whitelist 3 users |
| **PlayerContext core** | 95% | Play/pause/skip/loop/shuffle/gapless/MediaSession |
| **S1/S2/S4 posición + offline** | 100% | restorePosition 300s + OOM recovery + toast sin red |
| **Cola Q6/Q12/Q15** | 95% | Límite 75 + playlist→cola + historial scroll |
| **Contexto EC-C2/EC-C3** | 100% | Inyección dinámica + bottom sheet |
| **VAULT CRUD + search + WALL** | 95% | Entries + Eras + masonry 3 densidades + zoom modal |
| **VAULT DIALOGUE** | 90% | Emparejamiento <5min + chat layout + hilos + asimetría |
| **CAPSULES 4 sub-tabs** | 95% | Timeline + Smoke + TimeCapsules + RECAP |
| **Smoke Session** | 100% | Presets + fade-out + nombre + historial + rachas + notificaciones |
| **Time Capsules** | 90% | CRUD D1 + sellar + unlock animation + selector contenido |
| **RECAP** | 95% | Semanal/mensual/anual + botón GUARDAR COMO ENTRADA |
| **Escucha compartida base** | 80% | Worker /api/sync + long-polling + corazón ♡/♥!/♥ + sync posición |
| **Visualizador audio** | 85% | 6 modos canvas (barras, osciloscopio, vinilo, túnel...) + Fullscreen API |
| **ErrorBoundary + CSP + CI/CD** | 100% | Global + ChunkErrorBoundary + meta tag + GitHub Actions |

---

### 🔴 LO QUE ESTÁ ROTO O ES PLACEHOLDER

#### Galería VAULT — 35% (4 de 6 modos rotos o falsos)

| Modo | % Real | Qué tiene realmente | Qué pedía la spec |
|---|---|---|---|
| **WALL** | 95% ✅ | Masonry JS 3 densidades + long-press + zoom modal | Masonry grid infinito con virtualización. Bien. |
| **DIALOGUE** | 90% ✅ | Emparejamiento <5min + chat layout + hilos + asimetría | Dos columnas alternadas estilo chat. Casi completo. |
| **CINEMA** | 40% 🟡 | Swipe + Ken Burns + overlay emocional | **Falta**: audioguías reales, crossfade entre Eras, música ambiente de Era, pausa contemplativa |
| **REEL** | 15% 🔴 | Lista flex que agrupa entradas por fecha | **Falta**: auto-generación de secuencias narrativas, botón 📌 Pin, banda sonora, animación de escenas |
| **EXHIBITION** | 5% 🔴 | Lista flex `<div className="flex flex-col gap-5">` con cards | **Falta TODO**: canvas 2D espacial con zoom/pan estilo Miro/Figma, órbitas de fotos, clusters circulares |
| **MAP** | 0% 🔴 | **Placeholder hardcodeado**: `<p>Las entradas necesitan coordenadas...</p>` con emojis 🌍📍〰⧖ | **Falta TODO**: Leaflet con pines, líneas de viaje curvas animadas, slider temporal, clusters con narrativa, capas toggle |

#### Otras features rotas

| Feature | % | Realidad |
|---|---|---|
| **DROPS M20** (fix browser) | 0% 🔴 | No hay interceptor de intents. Los drops abren en navegador nativo. |
| **DROPS M21** (snapshot) | 20% 🔴 | Comentario `// Fase 7.7 DROP-M21` delegando al backend. Sin confirmar. |
| **SC2** (atribución cola) | 0% 🔴 | Nadie muestra avatar/nombre de quién añadió cada track. |
| **VIZ lockscreen** | 0% 🔴 | Sin live wallpaper API para Android lockscreen. |
| **VIZ animación entrada** | 10% 🔴 | CSS transition simple, no emerge glorioso desde negro. |
| **VIZ auto-activación** | 0% 🔴 | Sin trigger por inactividad táctil (salvapantallas). |
| **CINEMA audioguías** | 0% 🔴 | Sin sistema de curator notes/audioguías. |
| **REEL banda sonora** | 0% 🔴 | Sin música en secuencias. |
| **Q15 historial UX** | 70% 🟡 | Botón estático "VER TODO" en lugar de pull-to-reveal. |

---

## 2. NUEVO PLAN — 4 FASES PARA EL 100% PROFESIONAL

---

### 🏛️ FASE 1: «LA GALERÍA QUE PROMETIMOS» (~22h)
> **Prioridad**: La capa visual es lo más roto. Edu y David ven placeholders.
> **Objetivo**: 6 modos de galería 100% funcionales. MAP deja de ser un emoji.

| Sesión | Qué | Horas | Archivos |
|---|---|---|---|
| **S130-A** | **MAP premium**: Leaflet.js con pines por coordenadas, líneas de viaje curvas animadas entre ubicaciones cronológicas, slider temporal que filtra fotos por rango de fechas, clusters expandibles ("Barcelona: 12 fotos, 3 días"), tap en pin → carrusel de fotos, toggle de capas (Todos/Era/Año). Requiere: instalar `leaflet` + `react-leaflet`, worker endpoint `GET /api/entries?has_location=true`. Schema: entries necesitan `latitude`, `longitude`, `location_name`. | 6h | VaultGallery.jsx (nuevo MapView), package.json, workers/routes/entries.js |
| **S130-B** | **EXHIBITION canvas 2D**: Instalar `react-zoom-pan-pinch`. Canvas 2D desplazable con clusters circulares por vibe/Era. Cada sala: foto central + fotos orbitando + líneas curvas conectando tags compartidos. Zoom in/out con pinch. Tap en foto → preview. Las salas se reorganizan al añadir fotos. | 5h | VaultGallery.jsx (reescribir ExhibitionView), package.json |
| **S130-C** | **REEL narrativo**: Auto-generación de secuencias con escenas (foto portada 3s Ken Burns → mapa animado → fotos → cartas overlay → drop overlay → mapa cierre). Controles ▶ ⏸ ⏩. Banda sonora: track más escuchado del período. Botón 📌 Pin → guardar como entrada tipo `reel` en D1. Botón 🔄 Regenerar. | 5h | VaultGallery.jsx (reescribir ReelView), workers/routes/entries.js |
| **S130-D** | **CINEMA premium**: Audioguías (si entry tiene `audioguide_url` → reproduce voz). Crossfade entre Eras: wipe de color al cambiar de Era. Música ambiente de Era: auto-playlist de tracks más escuchados en esa Era, volumen 20-30%, toggle ON/OFF. Pausa contemplativa: 3s quieto → Ken Burns lento, al soltar continúa swipe. | 6h | VaultGallery.jsx (reescribir CinemaView), PlayerContext.jsx |

**Criterio de aceptación Fase 1**: Edu abre la galería. Ve MAP con pines reales de sus viajes, líneas curvas conectando Barcelona→Madrid→Playa. Cambia a EXHIBITION y navega un canvas 2D con zoom. Abre REEL y ve una secuencia narrativa con música. Entra en CINEMA, escucha la audioguía de Edu en la foto de la playa, y siente la música de la Era de fondo.

---

### 💞 FASE 2: «LO QUE NOS CONECTA» (~12h)
> **Prioridad**: Features que conectan a Edu y David entre sí.
> **Objetivo**: Drops funcionales, cola compartida con atribución, VIZ lockscreen.

| Sesión | Qué | Horas | Archivos |
|---|---|---|---|
| **S131-A** | **DROPS M20 + M21**: M20 — Interceptar intents en PWA para que drops no abran navegador nativo. Usar `start_url` con `?drop=ID` y `beforeinstallprompt`. M21 — Snapshot inmutable de metadatos al marcar favorito: guardar `{ track_id, title, artist, favorited_at }` en `drops.metadata`. Worker PATCH `/api/drops/:id` con campo `metadata_snapshot`. | 4h | DropsManager.jsx, workers/routes/drops.js, manifest.json |
| **S131-B** | **SC2 atribución cola**: Mostrar avatar/nombre de quién añadió cada track en la cola compartida. En `addToQueue`, incluir `added_by` y `added_by_name`. Worker GET `/api/sync?action=queue` devuelve cola con `added_by`. Renderizar en MusicLab.jsx: badge sutil con iniciales/color en cada track de la cola (Edu = verde, David = púrpura). | 3h | PlayerContext.jsx, MusicLab.jsx, workers/routes/sync.js |
| **S131-C** | **VIZ premium**: Auto-activación salvapantallas (VIZ3): inactividad táctil 30s → abre fullscreen automáticamente. Configurable por usuario (30s/1min/2min/Nunca). Animación entrada primer vibe (VIZ6/VIZ-M15): emerge desde negro con partículas + glow del color del vibe. | 5h | AudioVisualizer.jsx, PlayerContext.jsx, Layout.jsx |

**Criterio de aceptación Fase 2**: David lanza un drop desde el reproductor. El drop aparece in-app (no en browser). Edu ve quién añadió cada canción en la cola compartida. Tras 30s sin tocar la pantalla, el visualizador se activa solo como salvapantallas.

---

### ✨ FASE 3: «BRILLO PREMIUM» (~10h)
> **Prioridad**: Lo que separa "funcional" de "emocionante".
> **Objetivo**: Micro-interacciones, transiciones, pulido visual global.

| Sesión | Qué | Horas | Archivos |
|---|---|---|---|
| **S132-A** | **Pulido visual global**: Transiciones suaves entre tabs (slide direccional ya existe, verificar). Micro-interacciones en botones (hover estados, ripple al tap). Consistencia de espaciado y tipografía entre VAULT/MusicLab/CAPSULES. Animación `layoutId` entre modos de galería. Fix dead code: eliminar estado `liked`/`likeToast` no usado en WinampPlayer (reemplazado por corazón compartido). Fix Q15: pull-to-reveal real en historial (no botón estático). | 4h | Layout.jsx, TabShell.jsx, WinampPlayer.jsx, MusicLab.jsx, VaultGallery.jsx |
| **S132-B** | **Capa ambiental galería**: Reactividad acústica en WALL/EXHIBITION (glows laten al BPM vía AnalyserNode). Música ambiente de Era en CINEMA (auto-playlist de tracks más escuchados, volumen bajo, toggle ON/OFF). | 3h | VaultGallery.jsx, PlayerContext.jsx |
| **S132-C** | **Time Capsules polish**: Snapshot de playlist al sellar (congelar `track_ids` actuales). Si playlist cambia después, la cápsula mantiene su snapshot. Validación: no se puede sellar sin contenido. | 3h | TimeCapsules.jsx, workers/routes/capsules.js |

**Criterio de aceptación Fase 3**: La app se siente pulida. Las transiciones son fluidas. Los glows de la galería laten con la música. Las cápsulas del tiempo congelan playlists correctamente.

---

### 🚀 FASE 4: «ENTREGA» (~8h)
> **Prioridad**: Cierre profesional. Listo para uso diario.
> **Objetivo**: 0 bugs P0/P1, smoke test 2 dispositivos, documentación final.

| Sesión | Qué | Horas | Archivos |
|---|---|---|---|
| **S133-A** | **Smoke test E2E**: 2 dispositivos Android (Edu + David). Probar: login Google → VAULT crear entrada con foto → subir MP3 a MusicLab → crear playlist → escucha compartida (sync posición) → lanzar drop → abrir cápsula → ver RECAP. Documentar bugs encontrados. | 4h | — (testing manual) |
| **S133-B** | **Fixes del smoke test**: Corregir bugs encontrados en S133-A. Prioridad: bugs que impidan flujos completos. | 2h | Según bugs |
| **S133-C** | **Documentación + deploy final**: Actualizar CHANGELOG con versión final. Actualizar ESTADO.md a 100%. Deploy producción. Verificar PWA instalable. Verificar offline cache. Commit final con tag `v3.0.0`. | 2h | CHANGELOG.md, ESTADO.md, docs/ |

**Criterio de aceptación Fase 4**: Edu y David usan la app 1 semana sin encontrar bugs. La app sobrevive a OOM kills, cambios de red, y uso intensivo. PWA instalable en ambos dispositivos.

---

## 3. DEPENDENCIAS

```
FASE 1 (Galería) ──────────── independiente, empieza ya
FASE 2 (Conexión) ─────────── independiente de Fase 1
FASE 3 (Brillo) ───────────── requiere Fase 1 completada (pule lo construido)
FASE 4 (Entrega) ──────────── requiere Fases 1+2+3 completadas
```

---

## 4. MÉTRICAS

| Métrica | Inicio (auditoría real) | Objetivo post-Fase 4 |
|---|---|---|
| Features completas (spec) | **~68%** | **~97%** |
| Gallery modes premium | **1.5/6** (WALL+DIALOGUE) | **6/6** |
| Bugs P0 | 0 | 0 |
| Bugs P1 | 0 | 0 |
| Placeholders en UI | **4** (MAP+EXHIBITION+REEL+DROPS) | **0** |
| Escucha compartida | 80% (SC1-SC14, falta SC2) | 100% |
| Tiempo restante | **~52h** | 0h |

---

## 5. LO QUE NO SE INCLUYE (decisión consciente)

| Feature | Razón |
|---|---|
| **60+ tipos taxonomía VAULT** | Implementar cuando haya contenido real |
| **FLAC / OPUS** | MP3 cubre 100% del uso actual |
| **DLNA / Cast universal** | Chromecast básico ya funciona |
| **Fusión de playlists** | Baja prioridad |
| **Live wallpaper lockscreen avanzado** | Depende de APIs Android no estables |
| **Crossfade configurable** | Gapless ya implementado |
| **HEIC/RAW** | JPEG/PNG/WebP cubren el uso actual |

---

**Conclusión**: El proyecto está al ~68% real. El 92% anterior inflaba placeholders como features. Las 4 fases nuevas (~52h) atacan primero lo más visible (Galería), luego lo que conecta a los usuarios (Drops+Compartida), luego el brillo premium, y finalmente la entrega profesional. Al final de la Fase 4, Edu y David tendrán un producto del que sentirse orgullosos.
