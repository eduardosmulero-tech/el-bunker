// CHECKLIST DATA — el_búnker exhaustive testing checklist
const C=`### 🔐 AUTENTICACIÓN
- [ ] Login thebunker.admin@gmail.com → entra
- [ ] Login bansovi.py@gmail.com → entra
- [ ] Login dcgdozt@gmail.com → entra
- [ ] Login cuenta no autorizada → pantalla Acceso no autorizado
- [ ] Cerrar sesion boton EXIT en StatusBar → pantalla login
- [ ] Refrescar pagina logueado → sigue logueado (OAuth2 persistencia)
- [ ] Token expirado → refresh automatico sin pantalla blanca
- [ ] Boot sequence: pantalla carga con terminal se muestra
- [ ] Boton REINTENTAR en pantalla error funciona
- [ ] Boton ACCEDER AL VAULT tras boot → popup Google

### 📲 PWA
- [ ] Instalar como PWA Android (menu ⋮ → Install app / banner)
- [ ] Abrir sin conexion → carga desde SW cache
- [ ] YouTube NO interceptado por SW (bypasa youtube.com/ytimg.com/googlevideo.com)
- [ ] Hard refresh Ctrl+Shift+R no rompe estado
- [ ] manifest.json servido (iconos 192+512, theme-color #050505)
- [ ] Registro SW sin error en consola

### 🎨 LAYOUT / SHELL
- [ ] StatusBar: reloj tiempo real visible
- [ ] StatusBar: estado DB (◈ SYNCING durante escritura)
- [ ] StatusBar: boton EXIT visible y funcional
- [ ] BottomNav: 3 tabs presentes (VAULT · MUSIC LAB · CAPSULES)
- [ ] BottomNav: tab activo iluminado, otros atenuados
- [ ] Navegar VAULT↔MUSIC LAB↔CAPSULES: audio no se corta
- [ ] Volver a MusicLab desde otro tab: UI muestra track correcto y progreso
- [ ] Scanlines overlay visible (efecto CRT)
- [ ] Grid background visible
- [ ] Glow ambiental cambia con vibe activo
- [ ] activeVibe cambia --vibe-accent en :root
- [ ] Skeleton loading states al cargar (no pantalla blanca)
- [ ] Toast feedback aparece y desaparece solo
- [ ] user-select: none — no seleccion texto accidental
- [ ] overscroll-behavior: none — no pull-to-refresh
- [ ] Safe areas respetadas en notch Android

### 🏛️ VAULT — VISTA PRINCIPAL
- [ ] Carrusel Eras horizontal drag-to-scroll
- [ ] EraCard: cover image visible si existe
- [ ] EraCard: color accent, nombre, descripcion
- [ ] EraCard → tap abre EraDetailPanel
- [ ] EraDetailPanel: stats (entradas, fotos, notas, hitos)
- [ ] EraDetailPanel: preview entradas
- [ ] Contador aventura: dias desde fecha inicio visible y animado
- [ ] Heartbeat: corazon verde latiendo si vault seguro
- [ ] Heartbeat: corazon rojo si vault en riesgo (>18m sin heartbeat)
- [ ] HeartbeatWidget: boton heartbeat manual (admin)
- [ ] Capsulas tiempo: bloqueadas con ⧖ y countdown
- [ ] Capsulas tiempo: desbloqueadas con ◈, contenido visible
- [ ] Bibliotecas: lista con estados (ACTIVE / AT RISK / LOST)
- [ ] Bibliotecas: indicador capacidad usado
- [ ] Filtro por usuario (myEntries / myMessages)
- [ ] Boton exportar backup JSON solo admin
- [ ] Demo data cuando no hay DB real

### 🏛️ VAULT — GALERIA WALL
- [ ] Modo WALL: masonry grid entries con imagenes/media
- [ ] WALL: density toggle (normal / compact)
- [ ] WALL: long-press entry → preview
- [ ] WALL: preview se cierra al soltar
- [ ] WALL: tap entry → zoom/full view
- [ ] WALL: zoom se cierra tap fuera
- [ ] WALL: categorias visibles y filtrables
- [ ] WALL: entries sin imagen no rompen layout
- [ ] WALL: scroll sin lag

### 🏛️ VAULT — GALERIA CINEMA
- [ ] Modo CINEMA: full-bleed image
- [ ] CINEMA: swipe left → siguiente entry
- [ ] CINEMA: swipe right → anterior entry
- [ ] CINEMA: Ken Burns effect (zoom lento en pausa)
- [ ] CINEMA: era overlay nombre+fecha
- [ ] CINEMA: auto-pausa 3s inactividad
- [ ] CINEMA: cambiar entry resetea pausa
- [ ] CINEMA: entries sin imagen → texto legible

### 🏛️ VAULT — GALERIA MAP
- [ ] Modo MAP: entries geocodificadas como marcadores
- [ ] MAP: marcadores con color de era
- [ ] MAP: pan+zoom gestos tactiles
- [ ] MAP: date range slider filtra entries
- [ ] MAP: slider dual min/max funcional
- [ ] MAP: era breakdown visible
- [ ] MAP: entries sin coordenadas → no aparecen (no error)

### 🏛️ VAULT — EXHIBITION / REEL / DIALOGUE
- [ ] EXHIBITION: entries curadas en grid visual
- [ ] REEL: feed vertical swipe
- [ ] REEL: swipe down→siguiente, up→anterior
- [ ] DIALOGUE: entries en chat burbujas alternas
- [ ] DIALOGUE: burbujas own/partner diferenciadas
- [ ] DIALOGUE: auto-scroll al ultimo mensaje

### 🏛️ VAULT — ENTRIES CRUD
- [ ] Boton crear entry (+)
- [ ] Formulario crear: titulo, contenido, tipo
- [ ] Formulario: selector tipo (nota, foto, carta, hito...)
- [ ] Formulario: campo ubicacion (LocationSearch)
- [ ] LocationSearch: >=2 chars → resultados
- [ ] LocationSearch: seleccionar → coordenadas guardadas
- [ ] LocationSearch: boton limpiar
- [ ] LocationSearch: manual lat/lng opcional
- [ ] Formulario: selector de era
- [ ] Editar entry → formulario precargado
- [ ] Eliminar entry → confirmacion

### 🎵 MUSIC LAB — LISTA TRACKS
- [ ] Lista tracks carga correctamente
- [ ] 3 modos vista: lista / grid / tarjeta
- [ ] Modo vista persiste en localStorage
- [ ] TrackCard: thumbnail o iniciales artista fallback
- [ ] TrackCardGrid: thumbnail YouTube
- [ ] Vibe filter tags: pastillas scrollables
- [ ] ALL muestra todos
- [ ] Seleccionar tag filtra lista
- [ ] Busqueda texto AND sobre tag activo
- [ ] Carga progresiva: boton CARGAR MAS tras 50
- [ ] Menu contextual ⋮: Play Next
- [ ] Menu ⋮: Anadir a cola
- [ ] Menu ⋮: Anadir a playlist
- [ ] Tap track → reproduce inmediato
- [ ] Tap track activo → toggle play/pause
- [ ] Track activo marcado (borde pulsante)
- [ ] Cambiar filtro con track activo → sigue sonando

### 🎵 MUSIC LAB — AÑADIR/EDITAR TRACK
- [ ] Formulario: titulo, artista, nota, vibe tag
- [ ] Campo URL YouTube valida
- [ ] Campo URL Google Drive MP3
- [ ] Validacion URL YouTube invalida → no crashea
- [ ] Validacion URL YouTube playlist → no crashea
- [ ] Vibe tag obligatorio en formulario
- [ ] Editar: formulario precargado, uuid preservado
- [ ] Banner purpura MODO EDICION ACTIVO visible
- [ ] Modo edicion persiste al guardar (solo sale con ✎)
- [ ] Eliminar track → modal confirmacion destructiva

### ▶ REPRODUCTOR — CONTROLES BASICOS
- [ ] Play/Pause responde <300ms
- [ ] Skip siguiente → track arranca solo (sin 2º tap)
- [ ] Skip anterior: <3s reinicia, >=3s track anterior
- [ ] Seek: arrastrar → soltar → reproduce desde punto exacto
- [ ] Seek YouTube reposiciona iframe
- [ ] Seek Drive reposiciona audio
- [ ] Barra progreso actualiza en tiempo real (cada 1s)
- [ ] Tiempo y duracion visibles y correctos
- [ ] Titulo marquee si overflow
- [ ] Indicador sync status (cola guardandose)

### ▶ REPRODUCTOR — LOOP
- [ ] OFF: termina lista → para
- [ ] Loop lista (🔁): termina → vuelve al primero
- [ ] Loop track (🔂): termina → mismo track se repite
- [ ] Ciclo OFF→lista→track→OFF
- [ ] Boton loop cambia visual por estado
- [ ] Loop lista con 1 track = loop track

### ▶ REPRODUCTOR — SHUFFLE
- [ ] ON → skip a track aleatorio
- [ ] ON no repite hasta pasar todos
- [ ] OFF → orden original
- [ ] Shuffle + cola → respeta cola primero
- [ ] Activar shuffle con track sonando → no interrumpe
- [ ] Boton shuffle cambia visual ON/OFF
- [ ] State persiste en localStorage

### ▶ REPRODUCTOR — VOLUMEN
- [ ] Slider mueve audio Drive (<audio>)
- [ ] Slider afecta iframe YouTube (postMessage)
- [ ] Volumen Smoke sincronizado con PlayerContext
- [ ] Volumen 0 → silencio, no pausa
- [ ] Botones fisicos Android afectan stream
- [ ] Slider touch target >=44px

### ▶ REPRODUCTOR — FIN DE TRACK
- [ ] YouTube termina → siguiente auto
- [ ] Drive termina → siguiente auto
- [ ] Ultimo + loop OFF → para, barra a 0
- [ ] Ultimo + loop lista → primero arranca solo
- [ ] Cola+lista vacias → para sin crashear
- [ ] Track <5s → autoplay funciona

### ▶ REPRODUCTOR — EDGE CASES
- [ ] Track URL rota → error, salta al siguiente
- [ ] Track Drive fileId invalido → idem
- [ ] Play durante buffering → indicador carga
- [ ] Tap rapido varios tracks → ultimo gana
- [ ] Sin conexion + track cacheado → reproduce
- [ ] Sin conexion + YouTube → error claro
- [ ] Track sin archivo → estado neutral
- [ ] Sin red → estado neutral sin pantalla blanca

### ▶ REPRODUCTOR — PERSISTENCIA
- [ ] Cerrar y reabrir → track recuperado (o cola)
- [ ] Refrescar PWA con track sonando → ok
- [ ] Posicion seek NO se recupera (anotar si si)
- [ ] Shuffle/loop en localStorage por usuario

### ▶ REPRODUCTOR — RENDIMIENTO
- [ ] 30 min Drive continuo sin cortes ni leaks
- [ ] 30 min YouTube continuo sin cortes
- [ ] 50+ tracks → scroll fluido
- [ ] Canvas visualizador no se queda negro
- [ ] Visualizador activo no degrada audio

### ▶ REPRODUCTOR — INTERRUPCIONES
- [ ] Llamada entrante → pausa
- [ ] Llamada termina → no auto-reanuda (o no crashea)
- [ ] Otra app audio focus → pausa
- [ ] Auriculares desconectados → pausa
- [ ] Auriculares reconectados → no reanuda solo
- [ ] Notificacion breve → no interrumpe
- [ ] Modo No Molestar → sin efecto

### ▶ REPRODUCTOR — LOCKSCREEN / 2º PLANO
- [ ] Pantalla bloqueada → controles visibles (MediaSession)
- [ ] Lockscreen Play/Pause funciona
- [ ] Lockscreen Skip funciona
- [ ] Lockscreen titulo+artista visibles
- [ ] 2º plano → musica sigue
- [ ] 2º plano → WakeLock evita que SO mate audio
- [ ] Volver de 2º plano → UI sincronizada
- [ ] Notificacion reproduccion barra Android

### 🎵 AUDIO VISUALIZER
- [ ] Modo BARS: barras verticales reactivas
- [ ] Modo WAVE: forma de onda animada
- [ ] Modo OSCILLOSCOPE: traza vectorial
- [ ] Modo RADIAL: circulo concentrico
- [ ] Modo VINYL: disco giratorio + beat light
- [ ] Modo TUNNEL: tunel 3D perspectiva
- [ ] Fullscreen: tap visualizador → pantalla completa
- [ ] Fullscreen: auto-hide controles 3s
- [ ] Fullscreen: tap revive controles
- [ ] Cycle mode: tap cambia modos
- [ ] Preset por vibe (cada vibe tiene modo default)
- [ ] Canvas redimensiona al rotar

### 📋 MUSIC LAB — COLA (QUEUE)
- [ ] Anadir a cola → final, no interrumpe
- [ ] Reproducir a continuacion → tras track activo
- [ ] Tab COLA visible solo con tracks
- [ ] Tab COLA oculta si vacia
- [ ] Skip consume cola FIFO
- [ ] Cola + loop OFF → para al acabar
- [ ] Cola + loop ON → vuelve al primero
- [ ] Eliminar track de cola → no crashea
- [ ] Eliminar track sonando → salta al siguiente
- [ ] Drag & drop reordenar cola
- [ ] Historial reproduccion visible (atenuado)
- [ ] Track activo destacado (brillo+borde)
- [ ] Boton vaciar cola con confirmacion
- [ ] Boton guardar cola como playlist
- [ ] Busqueda+filtro tag en cola
- [ ] Cola manual sobrevive cambio contexto
- [ ] Limite 75 tracks + sugerencia guardar

### 💌 MUSIC LAB — DROPS
- [ ] Componer: boton LANZAR DROP en reproductor
- [ ] DropComposeModal: mensaje + timestamp
- [ ] Drop recibido → DropAlertModal intrusivo (purpura)
- [ ] DropAlert: play inline sin navegar
- [ ] DropsHistory: pendientes / guardados
- [ ] DropsHistory: separacion visual
- [ ] Marcar visto → desaparece de pendientes
- [ ] Guardar en favoritos
- [ ] Eliminar de historial
- [ ] Polling nuevos drops cada 30s
- [ ] Alerta al abrir app si hay pendientes
- [ ] Tab DROPS oculto si vacio

### 📑 MUSIC LAB — PLAYLISTS
- [ ] Crear playlist (nombre, vibe opcional)
- [ ] Eliminar playlist con confirmacion
- [ ] Renombrar playlist inline
- [ ] Modal detalle con lista tracks
- [ ] Anadir track desde menu ⋮
- [ ] Reproducir playlist completa ▶ PLAY
- [ ] Drag & drop reordenar playlists
- [ ] Drag & drop reordenar tracks en playlist
- [ ] Filtro tag en playlists
- [ ] Busqueda en playlists
- [ ] Eliminar track individual de playlist
- [ ] Indicador tracks totales + duracion
- [ ] Tab LISTS oculto si no hay
- [ ] Playlist vacia → estado visual diferenciado

### 🏷️ MUSIC LAB — TAG MANAGER
- [ ] Abrir TagManager
- [ ] Crear tag: nombre + color
- [ ] ColorPicker: 12 colores predefinidos
- [ ] ColorPicker: input hex personalizado
- [ ] Editar tag (nombre, color)
- [ ] Eliminar tag protegido si tracks lo usan
- [ ] Eliminar tag sin tracks → ok
- [ ] Drag & drop reordenar tags
- [ ] Indicador cuantos tracks usan cada tag
- [ ] Filtro rapido desde TagManager
- [ ] 4 tags sistema: gaming, 420_chill, dnb, romantiqueo

### ⧖ CAPSULES — TIMELINE
- [ ] Tab CAPSULES carga sin pantalla blanca
- [ ] Timeline: eventos cronologicos visibles
- [ ] Timeline: filtro por modulo (vault/music/smoke/system)
- [ ] Timeline: filtro por era
- [ ] Timeline: filtro por tipo de evento
- [ ] Timeline: load more paginacion (>50)
- [ ] Timeline: banner Un dia como hoy
- [ ] Timeline: iconos por tipo de evento
- [ ] Timeline: shared session events visibles
- [ ] RECAP tab: stats de sesion/resumen

### ⧖ CAPSULES — TIME CAPSULES
- [ ] Tab CAPSULAS: lista de capsulas
- [ ] Crear capsula: titulo, descripcion, unlock date
- [ ] Selector entries para snapshot
- [ ] Selector playlists
- [ ] Boton sellar capsula
- [ ] Capsula bloqueada: countdown visible
- [ ] Capsula desbloqueada: contenido accesible
- [ ] Opening animation (3D flip)
- [ ] Preview contenido (entries+playlists incluidas)
- [ ] Eliminar capsula con confirmacion
- [ ] Tab oculto si no hay capsulas

### ⧖ CAPSULES — SMOKE SESSION
- [ ] SmokeSession carga sin pantalla blanca
- [ ] Timer presets: 15/30/45/60/90 min
- [ ] CUSTOM: input duracion personalizada
- [ ] ACTIVAR inicia temporizador
- [ ] Anillo circular consume con tiempo
- [ ] Color cambia segun preset
- [ ] Ultimos 2min: anillo rojo, volumen fade gradual a 0
- [ ] Texto centro: volumen restante durante fade
- [ ] Termina: marca COMPLETADO en purpura
- [ ] Volumen restaura al nivel original al terminar
- [ ] PAUSAR: timer pausa
- [ ] RESET: timer reinicia
- [ ] Volumen Smoke sincronizado con PlayerContext

### ♥ ESCUCHA COMPARTIDA
- [ ] Boton ♡ corazon visible en header reproductor
- [ ] Tap ♡ → crear sesion compartida
- [ ] ♡ cambia a ♥ cuando partner conecta
- [ ] Auto-join desde pending_session_id
- [ ] Corazon muestra HOST/LINK segun rol
- [ ] Animacion bounce cuando partner conecta
- [ ] Posicion sincronizada <1s
- [ ] Drift correction >2s
- [ ] Queue compartida: add/remove bidireccional
- [ ] Queue: badges atribucion EDU/DAVID
- [ ] Heartbeat presencia cada 30s
- [ ] Partner track visible en UI
- [ ] Partner vibe color sync
- [ ] Reconnect toast on disconnect (RESINCRONIZAR/MANTENER)
- [ ] Leave session: boton salir
- [ ] Session toast feedback

### 🎵 MUSICLAB — CHROMECAST
- [ ] Boton Chromecast visible si hay dispositivo
- [ ] Conectar a dispositivo
- [ ] Track se reproduce en dispositivo
- [ ] Desconectar Chromecast → vuelve a local

### ☁ DRIVE / DATOS
- [ ] DB (the_vault_database.json) se crea si no existe
- [ ] Migracion automatica desde schema <v3.4.0
- [ ] Upload MP3 a Drive funciona
- [ ] Stream MP3 desde Drive funciona
- [ ] Heartbeat Drive cada 20 min (automatico)
- [ ] Sync status ◈ SYNCING visible durante escritura
- [ ] Demo data funciona sin DB real
- [ ] Token refresh sin pantalla blanca`;
