# EL BÚNKER — Explicación completa de la app

> Documento de contexto para auditoría externa por capturas. Está pensado para
> **Claude (versión web gratuita, sin acceso a los archivos del proyecto)**: con
> este documento + las capturas que mande Edu, Claude debe poder auditar la
> interfaz como si conociera la app.
>
> Última actualización: 29-ago-2026.

---

## 1. QUÉ ES EL BÚNKER

**El Búnker es una app privada, tipo bóveda de memoria y reproductor musical, para
una pareja: Edu y David.** Es su "hogar digital": el lugar donde conservan,
organizan, encuentran y vuelven a vivir lo que comparten — fotos y vídeos, cartas
y notas, lugares, recetas y listas, música, cápsulas y rituales.

No es una galería con texto añadido ni un reproductor con fotos: **es un archivo
vivo de pareja**, donde cada objeto está conectado con lugar, fecha, música,
persona y ritual.

- **Producción (frontend):** https://el-bunker-beige.vercel.app
- **API (backend):** Cloudflare Workers — https://el-bunker-api.thebunker-admin.workers.dev
- **PWA instalada** en los Android de Edu y David (exclusivamente Android en móvil).
- **Privado de verdad:** solo 3 cuentas autorizadas (Edu, David y admin). Sin
  registro público, sin redes sociales, sin anuncios.

### Los usuarios

| Cuenta | Quién | Rol |
|---|---|---|
| thebunker.admin@gmail.com | Admin | Dueño OAuth, acceso al panel de administración |
| bansovi.py@gmail.com | Edu | Usuario |
| dcgdozt@gmail.com | David | Usuario (no técnico, usa la app solo desde su móvil) |

### La estética: Cyber-Vandal / Winamp

La identidad visual es deliberada y es un activo que se preserva:

- **Terminal abandonado / graffiti digital / CRT.** Fondos casi negros (#050505),
  tipografía **JetBrains Mono**, texto en mayúsculas con tracking amplio.
- **Color ácido (lima) como base** (`#bfff00`, token `ACID`) + **púrpura**
  (token `PURPLE`) + **rojo** (`#ff3b3b`, solo para errores/destructivo).
- **Scanlines CRT** (líneas de barrido, overlay con `mixBlendMode: overlay`, muy
  baja opacidad ~0.10-0.12) y **textura de ruido** (noise, opacidad ~0.03) sobre
  toda la pantalla. Da la textura de pantalla vieja.
- **Glows ambientales** reactivos al "vibe" (lo que suena): halos que cambian de
  color siguiendo el acento del tag/track activo.
- **Corner brackets** (esquinas tipo "terminal seguro"), líneas finas de 1px
  encendidas sobre negro. *La profundidad viene de líneas finas, no de
  degradados grandes.*
- **Atmósfera, no rejilla:** el fondo es halo superior que sigue al vibe, viñeta,
  glows, ruido y scanlines. **No hay cuadrícula de fondo** (se retiró en
  agosto-2026; cualquier captura que muestre una rejilla de fondo es un fallo).

### Stack técnico (resumen)

- **Frontend:** React 18 + Vite + Tailwind CSS 3.4.19 (prohibido actualizar a v4)
  + Framer Motion. PWA con Service Worker.
- **Backend:** Cloudflare Workers (API REST ~22 endpoints) + **D1** (base de datos
  SQL/SQLite, 17 tablas) + **R2** (almacenamiento de archivos: MP3, fotos, vídeos,
  docs, audio). Sin servidores propios.
- **Auth:** Google OAuth2 (solo autenticación, whitelist de 3 usuarios) o **clave
  de acceso** (para test/admin). Sesiones JWT de 24h.
- **Reproductor:** HTMLAudioElement nativo con byte-range sobre R2 (más un
  `<audio>` silencioso de precarga gapless). Web Audio API para el visualizador.
- **Navegadores target:** Chrome Android 90+ (principal), Samsung Internet 14+,
  Edge Android 90+, Chrome desktop (solo dev). **iOS Safari fuera de target**
  (decisión de producto).

---

## 2. LA ARQUITECTURA DE PANTALLA (CRÍTICO PARA AUDITAR)

La app tiene **dos arquitecturas de pantalla, no una escala**. El corte está en
**1280px de ancho**.

### 2.1 Móvil (< 1280px) — "el cromo flota"

El cromo flota sobre el contenido:

- **Status bar superior fija:** marca "EL BÚNKER" + reloj/fecha en tiempo real,
  estado de la bóveda (heartbeat: punto verde latiendo = seguro, rojo = riesgo),
  presencia de la pareja (qué escucha el otro), botón de salir. Respeta
  `safe-area-inset` (notch).
- **Bottom nav fija** con los 3 tabs: **VAULT · MUSIC LAB · CAPSULES** (más
  atajos de teclado 1/2/3 en desktop).
- **Mini-reproductor flotante** sobre el contenido.
- El contenido pasa por debajo del cromo.

### 2.2 Escritorio (≥ 1280px) — "el cromo es un marco" (ADR-029)

A partir de 1280px el cromo deja de flotar y se convierte en **marco de
instrumento**. La geometría es exacta y **no se toca ni un pixel**:

```
+------------------------------------------------------------------+
| BARRA SUPERIOR (44px)  EL BÚNKER / TAB · presencia · reloj/acciones |
+--------+-------------------------------------------------+--------+
|        |                                                 |        |
| RAÍL   |                LIENZO                           |  DOCK  |
| 208px  |   (única zona con scroll de la app)             | 336px  |
|        |                                                 |        |
|        |                                                 |        |
+--------+-------------------------------------------------+--------+
| LÍNEA DE ESTADO (28px)                                             |
+------------------------------------------------------------------+
```

- **Barra superior (44px):** marca + tab activo, presencia de la pareja centrada,
  acciones (reloj, salir, etc.).
- **Raíl de navegación (208px), a la izquierda:** las 3 pestañas + su *segundo
  nivel* (ver abajo) + entrada ADMIN (solo para el usuario admin) + "Modo Visita".
- **Dock de reproductor (336px), a la derecha:** el mando de reproducción
  **permanente, visible en las tres pestañas y en /admin**. Nunca aparece ni
  desaparece (así el lienzo no cambia de ancho bajo el cursor). En MUSIC LAB el
  dock **oculta su reproductor** (para no duplicar el reproductor grande del
  lienzo) pero **conserva siempre COLA/HISTORIAL**.
- **Línea de estado (28px), abajo.**
- **Lienzo:** única zona con scroll. Nada tapa nada.
- El marco es **cristal ahumado, no pared**: raíl y dock dejan intuir los glows
  detrás (opacidad baja, `color-mix` sobre el acento del vibe). El ruido y las
  scanlines cubren también el cromo, no solo el lienzo. El acento reacciona donde
  importa: filetes, fondo del destino activo del raíl, borde del dock. **El
  brillo se gana en el borde, nunca en la superficie.**
- El **dock NO debe quedar oculto, ni el raíl, ni la topbar** en capturas de
  escritorio. Si algo tapa algo, es un fallo.

### 2.3 El raíl y el segundo nivel

Cada pestaña tiene un segundo nivel de navegación en el raíl (estado real, con el
activo resaltado):

| Tab | Segundo nivel en el raíl |
|---|---|
| **VAULT** | MEMORIA · PALABRAS · LUGARES · LISTAS (y más abajo, separada por filete, CAJA FUERTE — pendiente de construir, hoy NO se pinta) |
| **MUSIC LAB** | COLA · TRACKS · LISTS · DROPS |
| **CAPSULES** | TIMELINE · SMOKE · TIME CAPSULES · RECAP |

Regla: **navegar es cambiar de sitio; filtrar es cambiar lo que se ve sin
moverse.** El segundo nivel es navegación y vive en el raíl. Los filtros
(vibe, módulo, usuario, tipo, era) son filtros y viven en el lienzo. El lienzo
**no repite** la navegación del raíl.

---

## 3. LAS 3 PESTAÑAS (ADR-017) — definitivas, no se añaden más

### 3.1 VAULT — Motor de contenido (memoria de la pareja)

Guarda **eras** (períodos que engloban todo, p. ej. "2021 - EL PRIMER AÑO",
"2022") y, dentro de cada era, **entradas** organizadas en **4 secciones**
(ADR-033). Hoy en producción hay **525 entradas, todas de tipo foto** (2 eras).

**Las 4 secciones de VAULT:**

| Sección | Qué guarda | Cómo se mira |
|---|---|---|
| **MEMORIA** | Fotos, vídeos, audio, capturas | **Galería**, con los 6 modos |
| **PALABRAS** | Cartas, notas, diario, "abrir cuando…", bromas privadas, apodos | Lectura, ancho de ~76ch |
| **LUGARES** | Mapa emocional, viajes, sitios por visitar, check-ins | Mapa |
| **LISTAS** | Películas, libros, recetas, bucket list, ideas de regalo | Tabla |
| **CAJA FUERTE** *(aparte)* | Documentos personales, médicos, legales, recuperación | Tras clave. **No construida todavía → no se pinta** |

- Las eras siguen englobando todo; las secciones parten el contenido *dentro* de
  la era.
- Las secciones **vacías son un estado válido y deseado** (se muestran vacías
  pero usables, con estado vacío que invita a escribir la primera entrada). No es
  un fallo que PALABRAS/LUGARES/LISTAS estén a cero hoy.
- **Los 6 modos de galería (ADR-021)** se muestran **solo dentro de MEMORIA**, en
  la cabecera del lienzo (barra horizontal):
  1. **WALL** — masonry grid (muro tipo museo, agrupado por eras) con zoom de densidad.
  2. **CINEMA** — full-bleed con música ambiente de la Era (Ken Burns, subtítulos emocionales, crossfade).
  3. **MAP** — fotos pineadas en un mapa (Leaflet + CartoDB Dark) con líneas de viaje y clustering.
  4. **DIALOGUE** — perspectiva dual Edu-David: intercala las fotos de los dos como una conversación visual; fotos con <5 min de diferencia se emparejan con conector visual; la asimetría se maneja con eco visual poético, nunca con vacío ni culpa. *(Killer feature.)*
  5. **REEL** — secuencias auto-generadas con narrativa.
  6. **EXHIBITION** — agrupación por vibes/tags, no cronológica.
- Capa ambiental reactiva por Era + reactividad acústica con el reproductor.
- Los vídeos del VAULT se muestran **silenciados** (ADR-018: el audio solo lo
  posee MusicLab).
- Widgets históricos: contador de aventura (días desde la fecha de inicio, con
  animación de dígitos), heartbeat del vault, tarjetas de estado.

### 3.2 MUSIC LAB — Motor de audio

El **único** módulo que posee reproducción (regla inamovible 🔒-3: un solo
`<audio>` principal + un `<audio>` silencioso de precarga gapless, ambos dentro
de `PlayerProvider`). Nunca se instancia audio fuera de aquí.

**Contenido:**

- **Tracks:** biblioteca de música (hoy ~529 tracks activos). Cada track tiene
  título, artista, nota, **tag/vibe** (obligatorio), duración, thumbnail (o
  iniciales del artista como fallback). Vistas lista / grid / tarjeta (preferencia
  persistente por usuario). Búsqueda por texto (AND sobre el filtro de tag),
  carga progresiva ("CARGAR MÁS").
- **Cola:** cola manual vs cola de contexto (playlist/tag), "reproducir a
  continuación" vs "añadir a cola", drag & drop para reordenar (por IDs estables),
  historial visible atenuado (los 5 últimos), persistencia por usuario, guardar
  cola como playlist, vaciar cola con confirmación, track activo destacado. En
  escritorio la cola vive en el **dock**; **la cola se ve siempre, también vacía**
  (estado "COLA VACÍA" honesto).
- **Playlists:** crear/renombrar/eliminar, reordenar, reproducir entera, añadir
  tracks desde el menú contextual, indicador de total y duración.
- **Drops:** mensajes musicales con timestamp sobre un track, modal intrusivo
  púrpura con animación, historial (pendientes/guardados), polling, alerta al
  abrir la app.
- **Tags/Vibes:** gestor de tags personalizables (nombre, color con paleta de 12
  colores + hex, icono), 4 tags de sistema (gaming, 420_chill, dnb, romantiqueo),
  reordenables, indicador de tracks por tag, protección contra borrar un tag en
  uso, filtro rápido. **La ley del vibe: la interfaz sigue a lo que suena.** El
  tag del track activo define `--vibe-accent` (color del acento en toda la app).
  **Qué vibes existen, su nombre, color e icono son del usuario (dato), no del
  código.**
- **Reproductor (Winamp-style):** play/pause, anterior/siguiente, seek bar
  táctil, **loop triestado** (off → lista → track, nunca booleano), shuffle,
  volumen bidireccional (slider + botones físicos Android), skip atrás <3s →
  anterior / ≥3s → reiniciar, WakeLock, MediaSession (metadatos, controles
  lockscreen, auriculares), "A CONTINUACIÓN" bajo la seek bar, carátula como capa
  base con el **visualizador encima**.
- **Visualizador (Web Audio API, AnalyserNode):** 9 modos (UX6 completo desde
  agosto-2026): **barras de espectro, osciloscopio (CRT), onda, radial, vinilo
  (disco giratorio con aguja), túnel, VU meters, plasma/humo, partículas
  reactivas**. El usuario puede cambiar de modo cuando quiera y su elección manda
  mientras dure la sesión (los presets por vibe son solo punto de partida). En
  pantalla completa el visualizador manda ("no artwork"). El color sale del vibe
  activo, siempre; sin track, color base oscuro.
- **Tres niveles del visualizador (escritorio):** inline (en el dock), lienzo
  (ocupa el lienzo entero manteniendo el marco, tecla `V`), pantalla completa
  (tecla `F`; `Escape` baja un nivel). En móvil, tap sobre el reproductor.
- **Escucha compartida:** sesiones entre Edu y David — sincronización de posición
  (drift correction >2s), presencia mutua siempre visible, cola compartida
  bidireccional con atribución (badges "Edu"/"David"), corazón en el header del
  reproductor (♡ idle / ♥! partner / ♥ HOST), auto-join por `pending_session_id`,
  toast de reconexión.
- **Reproductor grande en MUSIC LAB (escritorio):** el lienzo de MUSIC LAB ES el
  reproductor grande — portada grande, visualizador, mando prominente — y el dock
  oculta su reproductor en esa pestaña (decisión X-6). En VAULT y CAPSULES el
  mando es el del dock. *No debe verse un reproductor duplicado en MUSIC LAB.*

### 3.3 CAPSULES — Capa de experiencias temporales

4 sub-tabs (ADR-020). Ninguna es dueña del dato: son clientes de VAULT y MusicLab.

1. **TIMELINE** — Feed cronológico unificado (pasado): eventos de todo lo que
   pasa en la app (track play, entradas creadas, drops, sesiones de smoke, …),
   filtros por módulo/usuario/tipo/era, vista "Un día como hoy", modo
   compacto/denso. En escritorio: **una sola barra de filtros de una fila** (los
   grupos colapsan a desplegables cuando no caben), filas en columnas fijas
   (hora · tipo · quién · qué, hora alineada con `tabular-nums`).
2. **SMOKE SESSION** — Temporizador (presente): presets 15/30/45/60/90 min +
   custom, anillo visual que se consume, **auto-fade del volumen en los últimos 2
   minutos hasta 0**, restauración al terminar, pausa/reset/reactivar, nombrar
   sesiones, historial (50), rachas, notificaciones, vibe-aware.
3. **TIME CAPSULES** — Contenido bloqueado por fecha (futuro): content picker de
   entries + playlists, snapshot, countdown, animación 3D de apertura,
   desbloqueo por fecha.
4. **RECAP** — Resúmenes semanales/mensuales/anuales (reflexión): "wrapped" con
   secciones narrativas; el RECAP anual es guardable como entrada del VAULT.

### 3.4 Panel de administración — ruta `/admin` (ADR-030)

Dentro de la misma app, fuera de las 3 pestañas (no es un cuarto tab, no aparece
en la navegación de móvil ni en los atajos 1/2/3). Acceso autorizado solo para el
usuario admin (el Worker lo comprueba; ocultar la entrada en la UI es higiene
visual, no defensa). En escritorio se pinta **dentro del marco** (raíl con la
entrada ADMIN y sus consolas, dock de reproductor, línea de estado); por debajo
de 1280 usa su propio shell con mini-player. Consolas/recursos por descriptor
declarativo (admin-core reutilizable). El tema usa custom properties `--admin-*`
y en el-bunker el acento se ata al vibe. Toda mutación administrativa emite un
evento `admin_*`.

---

## 4. AUTENTICACIÓN Y SEGURIDAD

- **Login 1 (principal):** Google OAuth2 (Google Identity Services), whitelist de
  3 cuentas. Pantalla de login Cyber-Vandal con boot log animado, logo ASCII y
  botón "ACCEDER AL BÚNKER".
- **Login 2 (test/admin):** panel discreto "ACCESO TEST / ADMIN" que canjea una
  **clave de acceso** de alta entropía por el mismo JWT (`POST /api/auth/token`).
  Claves atadas a usuario: `ADMIN_ACCESS_KEY` → admin, `EDU_ACCESS_KEY` → edu.
  No hay clave para David (su flujo es Google).
- **JWT** autofirmado HMAC-SHA256, 24h de expiración, header
  `Authorization: Bearer <token>`. Dos emisores del mismo JWT (google /
  access_key), nunca dos formas de entrar a la API.
- **Revocación de sesiones (ADR-031):** cada usuario lleva un contador
  `token_epoch` en D1; el JWT lleva el claim `epoch` y se rechaza si no coincide.
  Revocar = incrementar el contador. Vale para sesiones Google y de clave.
  Toda emisión/revocación escribe `auth_login` / `auth_revoked` en `events`.
- **Modo Visita:** censura controlada de la cuenta (incrementa el epoch y firma
  el token de visita con el valor nuevo).
- **R2 auth gate:** los prefijos sensibles (`vault/docs/`, `vault/audio/`)
  exigen token HMAC firmado server-side.
- **Datos:** el dato del usuario es intocable — la app **nunca reescribe**
  títulos, nombres ni etiquetas del usuario para que parezcan más limpios.

---

## 5. REGLAS INAMOVIBLES (para que la auditoría no las contradiga)

1. **Loop triestado:** `off | list | track`. Nunca booleano.
2. **Sin backend externo:** todo persiste en Cloudflare D1 (SQL) y R2 (archivos).
3. **Motor de audio único:** solo MusicLab/PlayerProvider posee playback (un
   `<audio>` principal + uno silencioso de precarga gapless). VAULT/CAPSULES no
   reproducen audio (los vídeos del vault van silenciados).
4. **3 tabs definitivos:** VAULT · MUSIC LAB · CAPSULES. Nada más (admin aparte).
5. **Stats engine único:** todos los eventos van a la tabla `events` de D1
   (append-only, inmutable).
6. **Drive nunca como persistencia.** Google Drive deprecado como BD. El login
   puede ser Google o clave; lo inamovible es que Drive no almacena nada.
7. **Cambios por contenedor lógico completo**, nunca micro-edición.

Otras reglas de casa relevantes para auditar:

- **Nada inventado en pantalla:** si el dato no está, se muestra **estado
  vacío**. Prohibidos los valores por defecto fabricados para que un widget
  tenga algo que enseñar.
- **Cero emoji y cero caracteres unicode como iconografía.** Todo icono sale de
  un registro propio (Icon.jsx). Cualquier emoji visible en la UI es un fallo.
- **Ninguna animación nueva en bucle infinito** que no comunique un estado.
- **Contraste:** color base fijo en reposo (nunca el color del vibe para texto
  base), contraste algorítmico, texto legible. La línea de estado va en color
  base fijo, nunca en color de vibe.
- **Sin scroll horizontal** en ninguna pestaña (móvil ni escritorio).
- **Textos largos, CJK, RTL, emoji ZWJ y nombres sin espacios** deben envolverse
  (`overflow-wrap: anywhere`) en tarjetas, playlists, cola, dock y superficies de
  detalle. Nunca desbordan ni rompen el layout.
- **Títulos escritos por el usuario se muestran tal cual** (con sus adornos
  raros incluidos).

---

## 6. FEATURES IMPLEMENTADAS (inventario operativo)

> Referencia para que Claude sepa qué debería existir en pantalla. Si una captura
> no lo muestra, puede ser que esté en otra vista o que sea un fallo — Claude
> debe preguntar antes de asumir.

**Core / infraestructura:**
- Auth OAuth2 con whitelist + acceso por clave (ADR-028), boot con pantalla de
  carga y errores, Service Worker PWA (sin Push/Sync; `/api/` nunca cacheada),
  schema versionado, heartbeat, pantalla de acceso no autorizado.
- Worker API (22 endpoints): health, auth, tracks, playlists, tags, drops,
  entries, eras, files, queue, events, time_capsules, upload (pre-signed R2),
  config, sync (escucha compartida), stats.
- D1: 17 tablas (users, app_config, eras, entries, tags, entry_tags, tracks,
  track_tags, files, playlists, playlist_tracks, drops, queue_items, events,
  time_capsules, capsule_items, shared_sessions).
- R2: /music/ (MP3), /vault/photos/, /vault/videos/, /vault/docs/, /vault/audio/.

**Shell visual (Cyber-Vandal):**
- Scanlines CRT + noise overlays, glows ambientales reactivos al vibe, status bar
  superior (reloj, estado DB, presencia), bottom nav 3 tabs (móvil) / marco
  completo (escritorio), transiciones animadas entre páginas, toasts con
  vibración háptica, `--vibe-accent` propagado como color de acento global,
  JetBrains Mono.

**VAULT:** eras (carrusel en móvil / fila wrap en escritorio), contador de
aventura, heartbeat widget, 4 secciones (MEMORIA con los 6 modos, PALABRAS
lectura 76ch, LUGARES mapa, LISTAS tabla), formulario de entrada polimórfico por
sección (en MEMORIA: foto/vídeo/audio/captura; en PALABRAS: carta/nota/diario/
"abrir cuando…"; en LUGARES: sitio/viaje; en LISTAS: películas/libros/recetas/
bucket list/ideas de regalo), subida de archivos, búsqueda por texto, lightbox
unificado (portal, full-bleed, swipe + pinch, adoptado por los 6 modos),
virtualización (lazy-mount con IntersectionObserver + agrupación por eras),
badges de sección legibles.

**MUSIC LAB:** reproductor Winamp con todo lo de la sección 3.2 (loop triestado,
shuffle, cola con drag&drop, historial, playlists, drops, tags/vibes, MediaSession,
WakeLock, volumen físico Android bidireccional, "A CONTINUACIÓN", carátula +
visualizador, 9 modos de visualizador, escucha compartida SC1-SC14 con cola
compartida y presencia, reproductor grande en lienzo en escritorio).

**CAPSULES:** Timeline con filtros y "Un día como hoy", Smoke Session completo,
Time Capsules con picker, RECAP (wrapped semanal/mensual/anual).

**Extras de robustez ya hechos:**
- `track_updated` silenciado (el PATCH de tracks ya no inunda el feed).
- Cero DEMO fallbacks en producción (estado vacío honesto).
- Upload endurecido: límites, reservas y cobertura de tests.
- Responsive: móvil intacto por debajo de 1280; escritorio con marco desde 1280.
- Auditoría reproducible con harness (`tools/audit-ui/`): 0 overflow, 0 clipping,
  0 errores de consola en la línea base (52 capturas a 390x844 y 1440x900).

---

## 7. FEATURES QUE DEBERÍA TENER / PENDIENTES (para que la auditoría los
   distinga de bugs)

**En diseño/construcción (estado real a 29-ago-2026):**

- **CAJA FUERTE real** (ADR-033): requiere decisión de "tras clave" (passphrase,
  cifrado en cliente, recuperación). **Hoy NO se pinta** — si aparece una entrada
  de CAJA FUERTE en el raíl que lleva a un cajón vacío, es un fallo de
  implementación (no debería existir).
- **Fase 10 — Playback Premium** (parcial): motor dual local/R2 con fallback,
  gapless por defecto (precarga al 80%), edge cases de red/archivos corruptos/
  token expirado, Chromecast SDK completo (hoy hay integración básica),
  visualizador presets por vibe como dato (VIZ-M13, placeholder abierto).
- **Crossfade configurable 0-8s**, selección múltiple de tracks, live wallpaper
  lockscreen, timeout salvapantallas, vibe fusionado playlist+track, DLNA/cast
  universal, FLAC + OPUS, fusión de playlists.
- **Escucha compartida:** crédito compartido de stats (SC12: >50% escuchado),
  WebSocket nativo (hoy sincronización por polling/long-polling).
- **Búsqueda unificada** sobre todo el hogar (hoy hay búsquedas por sección),
  enlaces cruzados (promoción Drop → VAULT).
- **Offline ampliado:** hoy hay shell/cache de assets y fallback; falta
  sincronización automática de cambios.
- **HEIC/RAW** al subir, placeholder de archivo corrupto en galería (glitch +
  reintento 3s + skip).
- **Importación masiva de recuerdos** con staging y dedupe.
- **Mapa/EXHIBITION/REEL/CINEMA** a nivel premium completo (los 6 modos existen,
  pero no todos con el pulido final).
- **Aceptaciones pendientes:** prueba real de PWA instalada/offline/update en
  dispositivo físico, revisión de modales y controles táctiles en móvil real
  (390x844), confirmar EntryLightbox en móvil.

**Específico del escritorio (marco y lienzo):**

- El formulario de "crear" debe ocupar el lienzo completo a 76ch (régimen de
  lectura), con el marco intacto; crear y editar usan el mismo camino/ancho. Si
  el formulario aparece en una columna estrecha de 320px al lado de la galería,
  es el defecto que se está corrigiendo.
- La barra de filtros de CAPSULES en escritorio es **una fila** (nunca una pila
  de filas de chips).
- El lienzo no repite el segundo nivel del raíl (si se ven "TIMELINE / SMOKE /
  TIME CAPSULES / RECAP" dentro del lienzo Y en el raíl a la vez en escritorio,
  es un fallo conocido en corrección).
- Los 6 modos de galería solo aparecen dentro de MEMORIA, en la cabecera del
  lienzo (escritorio y móvil).

---

## 8. A DÓNDE QUEREMOS LLEGAR (la visión)

**Norte de producto (23-ago-2026):** El Búnker debe ser el lugar privado donde
Edu y David conservan, organizan, encuentran y vuelven a vivir lo que comparten.
**No es una galería con texto añadido ni un reproductor con fotos: es un hogar
digital de pareja.**

La vara no es "tener más funciones que nadie", es: **para cada dominio, igualar
la mejor capacidad práctica de la referencia premium y añadir una ventaja propia
de pareja, sin aumentar la fricción.** La regla de salida es dura: si una promesa
no supera la barra, se implementa hasta superarla o se retira explícitamente con
decisión de Edu. Ocultarla bajo un porcentaje o una etiqueta de fase no es
cerrar.

**Barra de mercado (referencia por dominio):**

| Dominio | Referencia | Ventaja exigida a El Búnker |
|---|---|---|
| Memoria visual | Google/Apple Photos | museo emocional con 6 lecturas, contexto de pareja, eras, diálogo, narrativa |
| Diario y palabras | Day One | cartas, diario dual, "abrir cuando", respuestas, lectura cuidada |
| Recetas y listas | Paprika | receta con historia y versiones, plan/compra colaborativos, listas de vida |
| Música | Spotify/Apple Music | biblioteca propia, contexto emocional por vibe/era, drops, crédito de quién añadió, cápsulas, visualizador propio |
| Pareja | Between/Paired | un único archivo vivo conectando cada objeto con lugar, fecha, música, persona y ritual |
| Búsqueda | Google Photos/Notion | búsqueda unificada sobre todo el hogar, resultados explicables |
| Seguridad | Day One E2E | threat model explícito, mínimo privilegio, revocación, modo visita real, exportación probada |
| Continuidad | Spotify/Photos | Android primero, escritorio de primera clase, offline honesto, resume tras kill/red |

**Capacidades en orden de cierre (12 frentes):**
1. Seguridad y confianza (threat model, recuperación).
2. Hogar compartido y modelo de relación (identidad, ownership).
3. Memoria visual premium (seis modos completos).
4. PALABRAS: diario dual, cartas, lectura íntima.
5. LUGARES, LISTAS y RECETAS.
6. MUSIC LAB superior y escucha de pareja.
7. CAPSULES y rituales de pareja.
8. Búsqueda unificada y enlaces cruzados.
9. Sync, offline y continuidad (Android real).
10. Sistema visual, accesibilidad y rendimiento.
11. Beta real de Edu y David + comparativa competitiva.
12. Release y prueba de durabilidad.

**Definition of Done de cada capacidad:** contrato de UX y datos, implementación,
tests, captura móvil y desktop, estados vacíos/error/offline, revisión
independiente, commit integrado en master, auditoría post-merge y aceptación del
flujo por Edu y David. No se aceptan: contadores hardcodeados, fixtures como
sustituto de datos reales, placeholders con apariencia de producto, datos
reescritos para verse limpios, seguridad declarada sin prueba, ni features que
rompan las reglas inamovibles.

**El destino final, en una frase:** que Edu y David abandonen para siempre sus
galerías y reproductores de terceros y usen SOLO esta app para su vida
compartida, sintiéndola premium y nunca "rota".

---

## 9. GLOSARIO DE TÉRMINOS DE PANTALLA (para reconocer en capturas)

| Término en pantalla | Qué es |
|---|---|
| EL BÚNKER | Marca (topbar móvil/escritorio) |
| VAULT / MUSIC LAB / CAPSULES | Las 3 pestañas |
| MEMORIA / PALABRAS / LUGARES / LISTAS | Secciones de VAULT (segundo nivel del raíl) |
| CAJA FUERTE | 5ª entrada de VAULT (no construida, no se pinta) |
| COLA / TRACKS / LISTS / DROPS | Segundo nivel de MUSIC LAB |
| TIMELINE / SMOKE / TIME CAPSULES / RECAP | Sub-tabs de CAPSULES (segundo nivel del raíl) |
| COLA [n] / HISTORIAL [5] | Zonas del dock (escritorio) |
| COLA VACÍA | Estado honesto de cola sin tracks |
| WALL · CINEMA · MAP · DIALOGUE · EXHIBITION · REEL | Los 6 modos de galería (solo MEMORIA) |
| ACCESO TEST / ADMIN | Entrada alternativa de login por clave (ADR-028) |
| ADMIN | Panel de administración (ruta /admin, solo admin) |
| MODO VISITA | Censura de cuenta (incrementa epoch) |
| A CONTINUACIÓN | Línea bajo la seek bar con el siguiente track |
| LANZAR DROP | Enviar un drop sobre el track actual |
| vibe / tag | Etiqueta con color/icono que define el acento (--vibe-accent) |
| AUTENTICANDO... / VERIFICANDO... | Estados de carga de login |
| INITIALIZING SECURE CHANNEL... | Boot log de la pantalla de login |

---

## 10. QUÉ SE CONSIDERA "BIEN" EN UNA CAPTURA (barra de calidad)

1. **Nada roto de entrada:** sin solapes de texto, sin contenido cortado bajo
   barras fijas, sin UUIDs mostrados como metadato, sin filas duplicadas.
2. **El cromo en su sitio:** en escritorio se ven las 4 zonas del marco con su
   geometría (44/208/336/28); nada tapa nada; el dock no desaparece ni cambia el
   ancho del lienzo; no hay scroll horizontal.
3. **El acento reacciona:** los filetes, el destino activo del raíl, el borde del
   dock y los glows siguen el color del vibe (lo que suena). En reposo, el color
   base está en los textos; el acento no se usa para texto base.
4. **Estado vacío honesto:** lo que no tiene datos se ve vacío e invita a crear,
   nunca con datos fabricados ni placeholders con apariencia de producto.
5. **Contraste y legibilidad:** texto legible sobre negro, jerarquía clara,
   etiquetas en mayúsculas con tracking, sin emoji.
6. **Consistencia de la gramática:** una sola frontera de disposición (1280),
   navegación solo en el raíl, filtros en una fila, densidad con columnas.
7. **La estética viva:** scanlines y ruido sobre toda la pantalla (incluido el
   cromo), atmósfera (glows) visible a través del cristal ahumado del marco, sin
   rejilla de fondo.
