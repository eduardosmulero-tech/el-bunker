# HALLAZGOS DESKTOP Y VALIDACIÓN FUNCIONAL — EL BÚNKER

**Fecha:** 29-ago-2026  
**Propósito:** entrega para Claude, que audita mediante capturas.  
**Fase:** diagnóstico; no se aplicaron arreglos a la app.

> Complementa `EXPLICACION_APP_EL_BUNKER.md`, `CLAUDE_SESION_AUDITORIA_CAPTURAS.md` y `HALLAZGOS_Y_CAPTURAS_CLAUDE_2026-08-29.md`.

## 1. Alcance y límites de la evidencia

La verificación se hizo sobre el **build real del repositorio**, con el harness `tools/audit-ui/`, fixtures locales, sesión admin sembrada y Playwright/Edge headless. No se autenticó contra producción ni se usó una cuenta real de Edu/David; por tanto, las cifras y contenido son de fixture. La geometría, los componentes y las rutas ejercitadas sí pertenecen al código actual.

La matriz reproducible generó **52 capturas**: 26 estados (login, superficies de VAULT/MUSIC LAB/CAPSULES y ADMIN) × 2 viewports (`390x844` y `1440x900`). La captura desktop solicitada de cada estado está en:

`tools/audit-ui/report/full-audit/screenshots/`

El informe crudo está en `tools/audit-ui/report/full-audit/audit.json`.

## 2. Resultado ejecutivo

- **Cromo desktop @1440x900:** geometría exacta verificada: topbar 44 px, raíl 208 px, dock 336 px, footer/status 28 px. El lienzo mide 896 px de ancho y no hay overflow horizontal.
- **Cobertura de superficies:** VAULT (modos y alta), MUSIC LAB (TRACKS, COLA, LISTS, DROPS), CAPSULES (TIMELINE, SMOKE, TIME CAPSULES, RECAP) y ADMIN (recursos, SALUD, AUDITORÍA, ACCESOS) se montaron y capturaron en desktop sin errores de consola ni respuestas HTTP fallidas del harness.
- **Overflow:** 0 de 52 estados tuvieron overflow horizontal de documento.
- **Errores:** 0 errores de consola y 0 respuestas HTTP >=400 en la matriz.
- **Advertencia de entorno:** el build emite avisos de Vite sobre `fs`/`buffer` externalizados por `jsmediatags`; no son errores runtime del estado auditado.
- **Fullscreen:** el código actual usa la Fullscreen API sobre `document.documentElement` cuando no recibe `onRequestFullscreen`; el canvas también se marca `fixed inset-0 z-50` y existe una capa inmersiva con partículas, barras laterales y ciclo de modos. En desktop automatizado no se puede atribuir un veredicto visual final fiable porque la API nativa no se puede completar de forma equivalente en headless; queda como prueba manual obligatoria.

## 3. Capturas desktop disponibles

Todas las siguientes son `1440x900`, salvo indicación contraria. El sufijo `-desktop.png` identifica la captura del estado de la matriz.

### VAULT

| Archivo | Estado |
|---|---|
| `vault-wall-desktop.png` | VAULT / MEMORIA / WALL |
| `vault-add-entry-desktop.png` | formulario `+ ENTRADA` |
| `vault-cinema-desktop.png` | modo CINEMA |
| `vault-map-desktop.png` | modo MAP |
| `vault-dialogue-desktop.png` | modo DIALOGUE |
| `vault-reel-desktop.png` | modo REEL |
| `vault-exhibition-desktop.png` | modo EXHIBITION |

### MUSIC LAB

| Archivo | Estado |
|---|---|
| `music-tracks-desktop.png` | TRACKS |
| `music-add-track-desktop.png` | alta de track |
| `music-queue-desktop.png` | COLA |
| `music-lists-desktop.png` | LISTS |
| `music-drops-desktop.png` | DROPS |

### CAPSULES

| Archivo | Estado |
|---|---|
| `capsules-timeline-desktop.png` | TIMELINE |
| `capsules-smoke-desktop.png` | SMOKE |
| `capsules-timecapsules-desktop.png` | TIME CAPSULES |
| `capsules-recap-desktop.png` | RECAP |

### ADMIN

| Archivo | Estado |
|---|---|
| `admin-contenido-entradas-desktop.png` | ADMIN / CONTENIDO / ENTRADAS |
| `admin-contenido-archivos-desktop.png` | ADMIN / CONTENIDO / ARCHIVOS |
| `admin-contenido-tracks-desktop.png` | ADMIN / CONTENIDO / TRACKS |
| `admin-contenido-playlists-desktop.png` | ADMIN / CONTENIDO / PLAYLISTS |
| `admin-contenido-capsulas-desktop.png` | ADMIN / CONTENIDO / CÁPSULAS |
| `admin-contenido-drops-desktop.png` | ADMIN / CONTENIDO / DROPS |
| `admin-salud-desktop.png` | ADMIN / SALUD |
| `admin-auditoria-desktop.png` | ADMIN / AUDITORÍA |
| `admin-accesos-desktop.png` | ADMIN / ACCESOS |

También existe `login-desktop.png` para el estado de login.

## 4. Geometría desktop del marco

Medición DOM generada por `tools/audit-ui/medir-marco.mjs`, en `1440x900`:

| Zona | VAULT | MUSIC LAB | CAPSULES | Esperado ADR-029 |
|---|---:|---:|---:|---:|
| Topbar | 44 | 44 | 44 | 44 |
| Raíl | 208 ancho / 828 alto | 208 / 828 | 208 / 828 | 208 ancho |
| Dock | 336 ancho / 828 alto | 336 / 828 | 336 / 828 | 336 ancho |
| Footer/status | 28 | 28 | 28 | 28 |
| Lienzo | 896 ancho / 900 alto | 896 / 900 | 896 / 900 | restante |
| Scroll interno | 1826 | 2011 | 2716 | permitido vertical |

La topbar ocupa `y=0..44`, las columnas `y=44..872` y el footer `y=872..900`. Esto confirma que el dock no cambia de ancho entre tabs y que las cuatro zonas no se desplazan entre sí. El reporte de estados marca `overflowX: false` en los 52 casos.

## 5. Funciones y comportamiento — esperado / observado / veredicto

Los veredictos se refieren al código y a las pruebas automatizadas disponibles. Cuando no se pudo interactuar con una cuenta real o con una API real, se marca explícitamente como pendiente, no como aprobado.

### 5.1 Fullscreen del visualizador

**Esperado (spec §3.2):** el visualizador debe tomar el control completo: sin artwork, con efectos tipo salvapantallas retro; Escape debe bajar un nivel.

**Observado en código:** `AudioVisualizer.jsx:117-127` llama a `onRequestFullscreen` si existe; si no, activa estado propio y solicita fullscreen sobre `document.documentElement`. El canvas recibe `fixed inset-0 z-50`, altura `100vh`, fondo negro (`:605-617`). La capa inmersiva incluye partículas y VU laterales (`:623-665`), y hay controles para salir/ciclar modos (`:670-716`). El artwork se renderiza en `WinampPlayer.jsx` como capa anterior al visualizador, pero en el modo fullscreen el canvas y la capa inmersiva cubren el viewport.

**Veredicto:** ⚠️ **coincide a medias / requiere prueba manual.** La intención visual está implementada en el estado React, pero la entrada sin callback delega además en el fullscreen del `document.documentElement`; no hay evidencia desktop real de que Escape “baje un nivel” en vez de salir completamente. En móvil ya existía evidencia previa de que el comportamiento percibido era fullscreen de viewport. No declarar cerrado hasta probar F → V/inline → Escape con una ventana real.

### 5.2 Loop triestado

**Esperado:** ciclo real `off → lista → track → off`.

**Observado:** `PlayerContext.jsx` define `toggleLoopMode` con exactamente ese ciclo. El botón de `WinampPlayer.jsx:751-755` usa el estado actual en `aria-label` (`Loop: off`, `Loop: lista`, `Loop: track`). `handleAudioEnded` repite el track en `track`, y `skip` implementa el reinicio de lista en `list`.

**Veredicto:** ✅ **coincide en implementación.** La matriz visual no sustituye tres clics manuales, pero el estado y las transiciones requeridas están presentes y además se persisten en localStorage.

### 5.3 Skip atrás

**Esperado:** `<3s` va al track anterior; `≥3s` reinicia el track actual.

**Observado:** `WinampPlayer.jsx:94-111` implementa `skipDir(-1)`: consulta `currentTRef.current`, llama a `skip(-1, tracks)` si es menor que 3 y, en caso contrario, pone `audio.currentTime=0`, limpia progreso y contador. `PlayerContext.skip` navega por `playHistory`.

**Veredicto:** ✅ **coincide en implementación.** La condición es explícita y separada; queda recomendable confirmar con dos reproducciones reales porque la rama `<3s` depende de que el historial tenga una pista anterior.

### 5.4 Drag & drop en cola y persistencia

**Esperado:** reordenar realmente y conservar el nuevo orden al recargar o volver.

**Observado:** `MusicLab.jsx:543-569` registra origen/destino, reordena `localQueue` y emite `bunker_cola_reordered`. `PlayerContext.jsx` guarda la cola mediante `PUT /api/queue/:userId` con debounce de 2 s (`:650-676`) y la hidrata con `GET` (`:615-646`). El código marca el drag como “provisional — pendiente revisión sesión diseño”.

**Veredicto:** ⚠️ **coincide a medias.** La reordenación local y la ruta de persistencia existen, pero el harness de fixtures no implementa el `PUT` persistente ni se hizo una recarga contra D1 real. La persistencia de backend necesita prueba con cuenta real; no debe inferirse solo de la captura.

### 5.5 Shuffle

**Esperado:** al activarlo cambia de verdad el orden de reproducción, no solo el icono.

**Observado:** el efecto de `shuffle` baraja los tracks de contexto en `PlayerContext.jsx:96-119`; `skip` usa una lista aleatoria estable y excluye historial cuando procede. `MusicLab` muestra el estado de la cola resultante.

**Veredicto:** ✅ **coincide en implementación; interacción real pendiente.** Hay lógica de reproducción, no solo presentación. Confirmar con una cola de al menos tres tracks y dos avances.

### 5.6 Buscador de tracks + tag

**Esperado:** el texto y el tag se combinan con AND.

**Observado:** `MusicLab.jsx:417-428` aplica primero `libraryFilter` y después filtra por texto dentro del mismo pipeline; el texto busca título o artista. Ninguna condición reabre tracks excluidos por tag.

**Veredicto:** ✅ **coincide en implementación.** Es un AND real: `tag match` y `(title match OR artist match)`.

### 5.7 CARGAR MÁS

**Esperado:** traer tracks nuevos, no repetir los cargados.

**Observado:** `MusicLab.jsx:1343-1399` muestra `filteredTracks.slice(0, visibleCount)` y al pulsar aumenta `visibleCount` en 50. No solicita más datos al servidor ni deduplica una página remota.

**Veredicto:** ⚠️ **la letra coincide, el espíritu depende del alcance.** Con una biblioteca ya cargada, revela tracks nuevos del array sin repetir. Si la spec exige paginación o traer tracks nuevos de D1, esta implementación no “carga” nuevos datos: solo hace visible el resto local. Hallazgo para confirmar contra la intención de producto.

### 5.8 Time Capsule

**Esperado:** crear una cápsula y, al desbloquearse, mostrar la animación 3D real de apertura, no solo el formulario.

**Observado:** `TimeCapsules.jsx:104-126` envía `POST /api/time_capsules`; separa `locked` y `unlocked` por fecha/flag (`:90-91`). Una cápsula desbloqueada abre `CapsuleReveal` al hacer clic (`:229-247`). El harness contiene cápsulas bloqueadas y desbloqueadas, por lo que la ruta visual está cubierta; no se adelantó una cápsula real contra D1 para esperar el cambio de fecha.

**Veredicto:** ⚠️ **coincide a medias.** La animación de reveal sí está conectada a una cápsula desbloqueada; la transición temporal “crear → esperar → desbloquear automáticamente” no fue demostrada y depende del backend/refresh.

### 5.9 Atajos de teclado

**Esperado:** `1/2/3` tabs; `V` visualizador; `F` fullscreen; `Escape` baja un nivel.

**Observado:** `Layout.jsx:649-657` implementa `1/2/3`; `WinampPlayer.jsx:174-219` implementa `F`; `AudioVisualizer` gestiona fullscreenchange y controles. No aparece en el código leído un handler propio de `V` ni una máquina explícita de niveles `inline → lienzo → fullscreen`; `V` no está cubierto por el handler de `WinampPlayer`.

**Veredicto:** ❌ **no coincide completamente.** `1/2/3` y `F` sí están implementados. `V` no está implementado en el handler visible, y Escape está delegado al navegador/fullscreenchange, sin demostrar el descenso de nivel requerido. La letra de “fullscreen” existe, pero el espíritu de “tres niveles controlables” no queda cerrado.

### 5.10 Breakpoint 1280 px

**Esperado:** cruzar 1280 varias veces sin duplicación, parpadeo persistente ni estado intermedio.

**Observado:** `Layout.jsx:635-643` usa `matchMedia("(min-width: 1280px)")` con listener `change`; el layout desktop depende de `desktopViewport`. La matriz cubre móvil 390 y desktop 1440, y los 52 estados no tienen overflow.

**Veredicto:** ⚠️ **estructura correcta, cruce interactivo no demostrado.** Hay una única frontera declarada y cleanup del listener. Falta una prueba Playwright que redimensione repetidamente 1279↔1280↔1281 en la misma página y capture estados intermedios.

### 5.11 Iconos clicables y semántica

**Esperado:** cada icono debe hacer lo que su forma sugiere; los ambiguos no deben ejecutar acciones destructivas inesperadas.

**Observado:** los controles principales tienen `title`/`aria-label`; el icono archive del filtro de era es decorativo y la chip solo cambia `filterEra` (ver documento anterior §1.4). El registro central de iconos no añade compensación óptica y ya se documentó el problema sistemático de centrado.

**Veredicto:** ⚠️ **parcial.** La acción del filtro es segura y los controles principales están etiquetados, pero no se pudo hacer clic de forma exhaustiva sobre cada icono de todas las 52 capturas. El centrado óptico sigue siendo un hallazgo visual real.

### 5.12 Escucha compartida

**Esperado:** sincronización de posición, presencia mutua y estados del corazón `♡ idle / ♥! partner / ♥ HOST` al entrar/salir.

**Observado:** `PlayerContext.jsx` implementa `presence`, heartbeat cada 30 s, creación/unión de sesión, long-polling, sync de play/pause/skip/seek y limpieza de leave. `WinampPlayer.jsx` muestra estados según `partnerListening` y `sessionId`. La matriz usa `/api/sync` fixture con `{active:false}` y no dispone de dos sesiones reales simultáneas.

**Veredicto:** ⚠️ **implementación amplia, prueba real pendiente.** No se puede certificar sincronización entre Edu y David con una sola sesión sembrada ni con el fixture inactivo. Requiere dos navegadores/cuentas y Network observable.

## 6. Estados transversales

- **Login:** capturado en `login-desktop.png` y `login-mobile.png`; la matriz fuerza una pantalla de acceso simulando el proveedor Google, no una autenticación real.
- **Boot/carga:** no se conserva como captura separada; el harness espera el estado estable para evitar confundir boot con pantalla final. Queda pendiente si Claude necesita auditar la transición.
- **Error intencional de red:** no se realizó un corte de red durante esta ronda; por tanto no se presenta una captura como evidencia de error. El código sí tiene toast de `networkStatus === "offline"` en `Layout.jsx:723`.
- **No autorizado:** no se realizó una simulación separada; ADMIN fue probado con sesión admin sembrada. La guardia y las pruebas unitarias de `AdminGuard` están cubiertas por Vitest, pero no sustituyen la captura del rechazo visual.

## 7. Captura de 1280/1920 y comparación de anchos

La matriz completa histórica usa 1440 desktop. Se añadió y ejecutó una matriz específica en **1280x900 y 1920x900**, con las superficies principales y ADMIN: **18 capturas en total** (9 estados × 2 anchos). El informe crudo es `tools/audit-ui/report/desktop-1280-1920/desktop-1280-1920.json` y las imágenes están en `tools/audit-ui/report/desktop-1280-1920/screenshots/`. Resultado: **18/18 sin fallos**, 0 overflow horizontal, 0 errores de consola y 0 respuestas HTTP >=400.

Estados cubiertos por ancho: `vault-wall`, `music-tracks`, `music-lists`, `music-drops`, `capsules-timeline`, `capsules-smoke`, `capsules-timecapsules`, `capsules-recap` y `admin`. En 1280 el cromo desktop está presente y conserva el marco; en 1920 también. El script reproducible es `node tools/audit-ui/capturar-matriz-desktop-1280-1920.mjs`. Las mediciones anteriores a 1440 siguen siendo la referencia numérica detallada del marco; esta matriz adicional confirma estabilidad de la disposición en ambos extremos solicitados.

## 8. Hallazgos para Claude

1. **P0/P1 funcional:** fullscreen debe probarse con una ventana real y Escape; el código mezcla fullscreen del documento con fullscreen lógico del visualizador.
2. **P1:** el atajo `V` y el descenso multinivel con Escape no aparecen implementados de forma explícita en el código revisado.
3. **P2:** drag & drop tiene persistencia preparada, pero falta confirmación contra D1 real.
4. **P2:** `CARGAR MÁS` incrementa una ventana local; no es paginación remota.
5. **P2:** Time Capsule conecta reveal para desbloqueadas, pero la transición temporal completa no fue observada.
6. **P2:** escucha compartida necesita dos cuentas reales para validar sincronización y corazón.
7. **P3:** boot, corte intencional de red y acceso no autorizado no tienen captura dedicada en esta ronda.
8. El diagnóstico previo de `OFFLINE`, duración, iconos, filtro de era, preset 45 MIN, fallback de eventos, cola y RECAP sigue vigente en el documento anterior.

## 9. Reproducción

```bash
# Matriz completa: genera build, preview temporal, 52 capturas e informe
node tools/audit-ui/auditoria-completa.mjs

# Geometría exacta del marco desktop @1440x900
node tools/audit-ui/medir-marco.mjs

# Matriz desktop específica a 1280 y 1920 (18 capturas + JSON)
node tools/audit-ui/capturar-matriz-desktop-1280-1920.mjs

# Captura puntual: requiere un preview local activo en localhost:4317
node tools/audit-ui/playwright/capturar-tab.js VAULT 1280 900 vault-1280
```

No se modificaron archivos de `src/` durante la auditoría. Los artefactos de evidencia y documentos quedan separados de la implementación.
