# EL BÚNKER — ROADMAP DE IMPLEMENTACIÓN COMPLETA
## 15 Fases · 87 Subfases · Cobertura 100% Specs
> Generado: Junio 2026 · Post-Auditoría Fría (specs ↔ código)
> Estado actual: ~46% completitud real ponderada
> Objetivo: 100% de todos los specs en 15 fases secuenciales

---

## 📐 ESTRUCTURA
Cada fase: **Objetivo · Specs cubiertos · Subfases (5-8) · Criterio · Estimación (S/M/L/XL) · Dependencias**

---
## 📊 ESTADO ACTUAL (PRE-ROADMAP)
| Modulo | % Real | Features |
|---|---|---|
| Motor Audio/Cola | 76% | Precarga, gapless, fallback pendientes |
| Vibe/Tags | 65% | Contraste algoritmico, transiciones T1-T10 pendientes |
| MediaSession/Android | 54% | M3-M12 parciales, A1-A6 sin verificar |
| Gestion Tracks/Playlists/Drops | 16% | ID3, upload MP3, ordenacion, push notifications |
| VAULT Taxonomia | 6% | 4/70 tipos implementados |
| VAULT Galeria | 18% | 4/6 modos son placeholders |
| CAPSULES | 70% | Smoke naming, streaks, capsule snapshots OK |
| Escucha Compartida | 0% | Hardcodeado a false |
| Estadisticas | 30% | Motor emite, sin agregacion ni UI |


---

# FASE 1: FUNDAMENTOS DEL MOTOR DE AUDIO
**Objetivo:** Reproductor premium: gapless, precarga inteligente, tolerancia a fallos de red, deteccion de cache local.
**Specs:** P1, P2, P3/P-M8, EC-P1, EC-P2, EC-P3, EC-P4, EC-P5
**Dependencias:** Ninguna (fase fundacional) · **Estimacion:** L

### 1.1 — Precarga del siguiente track al 80% de duracion (P-M8)
Segundo elemento audio oculto para preload. Se activa cuando currentTime / duration >= 0.8. Carga src del siguiente track en cola (o shuffle). Silencioso — sin indicador visual salvo error. Track sin archivo -> skip precarga.
**Archivos:** PlayerContext.jsx, WinampPlayer.jsx
**Criterio:** Siguiente track arranca en <50ms (gapless percibido).

### 1.2 — Gapless por defecto (P3)
Crossfade de 0ms entre tracks consecutivos del mismo contexto. Sin gap audible. El segundo audio (1.1) hace la transicion.
**Archivos:** PlayerContext.jsx
**Criterio:** Reproducir 10 tracks seguidos de un album/playlist — sin silencios entre ellos.

### 1.3 — Motor automatico local + R2 (P1)
Al cargar un track, verificar si existe en cache local (Service Worker Cache API o IndexedDB). Si existe -> local. Si no -> R2 stream. Indicador visual pequeno (local/stream) en track activo. Archivo local corrupto -> EC-P2: toast + fallback R2 + campo local_cache_status.
**Archivos:** PlayerContext.jsx, GoogleDriveService.js
**Criterio:** Tracks previamente escuchados cargan desde local sin peticion de red.

### 1.4 — Fallback de red con reintento (P2, EC-P1)
Si audio emite error o stalled >3s: reintento silencioso unico (3s timeout) -> skip automatico con toast -> si no hay siguiente, estado neutral consciente. Red cae durante precarga -> indicador visual en track siguiente mientras falla + reintento 3s -> skip.
**Archivos:** PlayerContext.jsx
**Criterio:** Simular desconexion de red — el reproductor no se queda colgado.

### 1.5 — Token OAuth expira -> refresh silencioso (EC-P3)
Si una llamada a Drive API devuelve 401, usar initTokenClient con prompt: "" para refresh silencioso. Service Worker como red de seguridad.
**Archivos:** GoogleDriveService.js, VaultContext.jsx
**Criterio:** Sesion no se interrumpe aunque el token haya expirado hace horas.

### 1.6 — Track sin archivo: indicador + auto-skip (EC-P4)
Tracks sin r2_key ni drive_file_id -> mostrar en lista con indicador visual (icono warning, opacidad reducida). Si llega en reproduccion -> auto-skip con toast.
**Archivos:** PlayerContext.jsx, TrackCard.jsx
**Criterio:** Un track legacy sin archivo no bloquea la reproduccion.

### 1.7 — Duplicado mismo archivo -> seek (EC-P5)
Si el siguiente track tiene el mismo r2_key o drive_file_id que el actual, hacer seek a 0 en lugar de recargar el audio.
**Archivos:** PlayerContext.jsx
**Criterio:** Mismo track anadido 2 veces consecutivas -> sin doble carga de red.


---

# FASE 2: MEDIASESSION PREMIUM + ANDROID NATIVO
**Objetivo:** Experiencia Android nativa completa: lockscreen, notificaciones, controles fisicos, Cast basico.
**Specs:** M1-M12 completo, A1-A6, CAST1-CAST6
**Dependencias:** Fase 1 · **Estimacion:** M

### 2.1 — Notificacion lockscreen con artwork y color vibe (M2, M6, M7, M9)
MediaMetadata ya tiene artwork y metadatos. Anadir color de fondo de notificacion derivado del trackVibe. Notificacion persistente y no descartable durante reproduccion. Track sin artwork -> color solido del vibe como fallback (M6).
**Archivos:** WinampPlayer.jsx
**Criterio:** Bloquear pantalla durante reproduccion -> notificacion muestra caratula, titulo, artista y color del vibe.

### 2.2 — Barra de progreso interactiva en notificacion (M4)
navigator.mediaSession.setPositionState() ya esta implementado. Verificar que seekto action handler funcione en Android real. Anadir playbackRate correcto.
**Archivos:** WinampPlayer.jsx
**Criterio:** Seek desde lockscreen funciona — arrastrar barra de progreso cambia posicion.

### 2.3 — Botones de notificacion siempre visibles (M3)
Asegurar que previoustrack, play, pause, nexttrack action handlers esten siempre registrados. Deshabilitados en gris cuando no aplican (ej: no hay track anterior en shuffle con historial vacio).
**Archivos:** WinampPlayer.jsx
**Criterio:** Botones visibles aunque no haya track siguiente/anterior.

### 2.4 — Tap en notificacion -> abre app en reproductor (M8)
En el Service Worker, interceptar notificationclick y navegar a la app con parametro ?tab=music. En la app, detectar el parametro y cambiar a tab MUSIC LAB.
**Archivos:** sw.js, main.jsx
**Criterio:** Tap en notificacion -> app se abre directamente en el reproductor.

### 2.5 — Google Assistant: comandos de voz (M11)
MediaSession action handlers ya cubren play, pause, next, previous. Verificar que Google Assistant los reconoce.
**Archivos:** WinampPlayer.jsx
**Criterio:** "Hey Google, next song" funciona durante reproduccion.

### 2.6 — Volumen fisico bidireccional (M10)
Ya implementado via volumechange event en audio. Verificar sincronizacion en Android real.
**Archivos:** WinampPlayer.jsx
**Criterio:** Bajar volumen con botones fisicos -> slider en app se actualiza. Subir slider en app -> volumen fisico cambia.

### 2.7 — Cast basico (CAST1-CAST6)
Boton Cast en reproductor. Usar Cast SDK. El audio viaja de R2 al TV directamente. El movil actua como mando. Vectorial en TV (SVG/Canvas). Red cae durante Cast -> app detecta, pausa, reintenta (P2), reanuda el Cast al recuperar red.
**Archivos:** PlayerContext.jsx (nuevo hook useCast), WinampPlayer.jsx
**Criterio:** Transmitir audio a Chromecast. Movil controla play/pause/skip.

### 2.8 — Android edge cases (A1-A6)
A1 (OOM kill): Persistir activeTrack, localQueue, currentTime en localStorage cada 5s. Al restaurar, reconstruir estado. Reproduccion pausada. A2 (Llamada): audio interruption event -> pausa. No reanudar. A3 (Auriculares): desconexion -> pausa inmediata. A4 (Lockscreen): WakeLock + MediaSession -> reproduccion continua. A5 (Otra app audio): pausa, no auto-reanudar. A6 (No molestar): sin efecto.
**Archivos:** PlayerContext.jsx, VaultContext.jsx
**Criterio:** Simular cada escenario en dispositivo Android real.


---

# FASE 4: SISTEMA DE VIBE COMPLETO
**Objetivo:** Vibe premium: activacion a los 2s, contraste algoritmico, transiciones completas, UI completa.
**Specs:** VB5, VB9, VB10, VB12, VB18, VB19, T1-T10, VIZ1-VIZ5
**Dependencias:** Fase 1 · **Estimacion:** M

### 4.1 — Vibe se activa a los 2s de reproduccion (VB5)
Actualmente el vibe se aplica inmediatamente al cambiar trackVibe. Anadir timer de 2s: al cambiar de track, mantener el vibe anterior durante 2s, luego aplicar el nuevo. Universal y estricto — cualquier cambio de track.
**Archivos:** PlayerContext.jsx, WinampPlayer.jsx
**Criterio:** Cambiar de track -> UI mantiene color anterior 2s -> transiciona al nuevo.

### 4.2 — Vibe afecta toda la UI via :root (VB9)
Ya se aplica --vibe-accent en document.body.style. Verificar que TODOS los componentes usen var(--vibe-accent) o props reactivas. Excepciones: botones destructivos, estados de error, indicadores de sistema.
**Archivos:** PlayerContext.jsx
**Criterio:** Cambiar de track con distinto tag -> toda la UI (fondo, bordes, textos, glows) cambia.

### 4.3 — Contraste algoritmico texto/iconos (VB10)
Funcion ensureContrast(hexColor, bgHex) que calcula ratio WCAG y ajusta luminosidad si <4.5:1. Aplicar a texto e iconos sobre fondos de vibe.
**Archivos:** tokens.js (nueva funcion), TrackCard.jsx, WinampPlayer.jsx
**Criterio:** Tag con color muy claro (ej: #ffff00) -> texto automaticamente oscurece para legibilidad.

### 4.4 — Cambio de tag mientras suena -> no actualizar (VB12)
Ya implementado — trackVibe se deriva de activeTrack?.tag. Editar tag del track activo -> no cambia vibe hasta que se recargue el track.
**Archivos:** MusicLab.jsx
**Criterio:** Editar tag del track que esta sonando -> UI no cambia. Skip -> siguiente track con nuevo tag -> UI cambia.

### 4.5 — Restauracion de vibe al volver de background (VB19)
Al volver de background (visibilitychange), el vibe se restaura sin transicion (sin animacion de 1s). Aplicar inmediatamente.
**Archivos:** PlayerContext.jsx, WinampPlayer.jsx
**Criterio:** Abrir app desde background -> color del vibe ya esta aplicado, sin fade.

### 4.6 — Transiciones de vibe completas (T1-T10)
T1: Cambio de track -> unico disparador (ya OK). T2/T3: Navegacion entre paginas -> reproduccion continua, mini-player persiste (ya en Layout.jsx). T4: Timing 2s (cubierto por 4.1). T5: Transicion interrumpida -> cancelar, arrancar nueva desde estado actual. T6: Estado neutral (sin track) -> fade 1s a color base (ya OK). T7: Primer track de sesion -> animacion elaborada (Fase 15). T8: Mismo tag -> pulso sutil de intensidad. T9: Track sin tag -> color base oscuro (VB8). T10: Vibe durante carga -> mantener vibe del track anterior.
**Archivos:** WinampPlayer.jsx, Layout.jsx
**Criterio:** Cada transicion T1-T10 se comporta segun spec.

### 4.7 — Visualizador a pantalla completa (UX6, VIZ1-VIZ5)
Tap en el reproductor -> expandir visualizador a fullscreen. Barras de espectro (ya implementado), anadir: disco giratorio, osciloscopio, particulas reactivas, VU meters, fondo plasma/humo. Color del vibe activo.
**Archivos:** AudioVisualizer.jsx, WinampPlayer.jsx
**Criterio:** Tap en reproductor -> visualizador fullscreen inmersivo.


---

# FASE 3: COLA DEFINITIVA + UX TACTIL
**Objetivo:** Completar el 24% restante de specs de cola + experiencia tactil premium.
**Specs:** Q6, Q10, Q15, Q16/Q17, UX1, UX2, UX5, UX8, UX9, UX10, UX11
**Dependencias:** Fase 1 · **Estimacion:** M

### 3.1 — Limite 75 tracks con sugerencia (Q6)
MAX_QUEUE_SIZE = 75 ya existe en PlayerContext.jsx. Anadir toast al alcanzar limite: "Cola llena (75 tracks). Guardar como playlist?" con boton de accion.
**Archivos:** PlayerContext.jsx, MusicLab.jsx
**Criterio:** Anadir track 76 -> toast con sugerencia de guardar como playlist.

### 3.2 — Historial scroll arriba mejorado (Q15)
Ya muestra playHistory con opacidad 0.35. Mejorar: mostrar ultimos 5 tracks atenuados con posibilidad de revelar mas arrastrando hacia abajo (pull-to-reveal). Historial sin limite en localStorage (ya implementado).
**Archivos:** MusicLab.jsx
**Criterio:** Scroll arriba en cola -> 5 tracks atenuados visibles. Arrastrar hacia abajo -> mas tracks.

### 3.3 — Soft delete mejorado (Q16/Q17)
Ya existe softDeletedIds y undoRemoveFromQueue en PlayerContext. Mejorar: Track activo eliminado -> se deja terminar, al saltar aplica soft delete + toast con boton deshacer. Track en espera -> desaparece inmediatamente con animacion + toast.
**Archivos:** PlayerContext.jsx, MusicLab.jsx
**Criterio:** Eliminar track activo -> no se interrumpe reproduccion. Eliminar track en espera -> desaparece.

### 3.4 — Double-tap +-10s seek (UX1)
Ya existe handleDoubleTapSeek en WinampPlayer. Verificar que funcione en dispositivo real con eventos touch.
**Archivos:** WinampPlayer.jsx
**Criterio:** Double-tap en mitad derecha del reproductor -> +10s. Mitad izquierda -> -10s.

### 3.5 — Swipe horizontal/vertical (UX5)
Swipe horizontal para cambiar track -> ya existe en WinampPlayer (onSwipeStart/Move/End). Swipe vertical para abrir cola -> implementar: swipe up en reproductor -> scroll a tab COLA.
**Archivos:** WinampPlayer.jsx, MusicLab.jsx
**Criterio:** Swipe izquierda -> track anterior. Swipe derecha -> siguiente. Swipe arriba -> abre cola.

### 3.6 — Feedback haptico (UX2)
Anadir vibrate([10]) en play/pause, skip, anadir a cola. Ya parcialmente implementado en PlayerContext.
**Archivos:** PlayerContext.jsx, WinampPlayer.jsx
**Criterio:** Cada accion tactil produce vibracion sutil.

### 3.7 — Portrait lock forzado (UX8)
manifest.json -> "orientation": "portrait". CSS: @media (orientation: landscape) overlay que pide girar el dispositivo.
**Archivos:** manifest.json, index.html, index.css
**Criterio:** Girar dispositivo a landscape -> overlay que pide volver a portrait.

### 3.8 — Buscador en cabecera de cada lista (UX9)
Ya existe busqueda en tracks, playlists, cola. Verificar que el boton de busqueda este en todas las listas.
**Archivos:** MusicLab.jsx
**Criterio:** Cada tab de MusicLab tiene boton de busqueda funcional.


---

# FASE 6: GESTION DE TRACKS FULL
**Objetivo:** Upload MP3 a R2, metadatos ID3, thumbnails automaticos, ordenacion configurable, soft delete multi-usuario.
**Specs:** EC-TR1, EC-TR2, EC-TR4, EC-TR5, EC-TR6, EC-TR7
**Dependencias:** Fase 1 · **Estimacion:** L

### 6.1 — Upload MP3 directo a R2
Input type="file" accept="audio/*" en formulario de anadir track. Subir a R2 via FileUploadService.uploadFile(file, "music"). Al completar, guardar r2_key en el track. Archivo >100MB -> warning. Duplicado -> EC-TR4 (toast + confirmacion).
**Archivos:** AddTrackForm.jsx, FileUploadService.js
**Criterio:** Seleccionar MP3 -> se sube a R2 -> aparece en biblioteca con r2_key.

### 6.2 — Extraccion de metadatos ID3 (EC-TR6)
Al seleccionar archivo MP3, parsear tags ID3 (titulo, artista, album, ano, artwork) con music-metadata o jsmediatags. Pre-rellenar formulario. El usuario puede editar manualmente. MP3 sin tags -> campos vacios, sin error.
**Archivos:** AddTrackForm.jsx
**Criterio:** Seleccionar MP3 con metadatos -> titulo y artista se rellenan solos.

### 6.3 — Thumbnail automatico (EC-TR5)
Track sin thumbnail -> generar thumbnail con iniciales del artista sobre color solido del vibe. Si hay artwork en ID3, usarlo.
**Archivos:** TrackCard.jsx, AddTrackForm.jsx
**Criterio:** Track sin imagen -> card muestra iniciales sobre fondo de color.

### 6.4 — Ordenacion configurable (EC-TR7)
Selector de orden en cabecera de tracks: alfabetico, artista, vibe, mas reproducido, mas reciente. Preferencia persistente en localStorage. "Mas reproducido" y "mas reciente" requieren STAT-M9 (Fase 14).
**Archivos:** MusicLab.jsx
**Criterio:** Cambiar orden a "mas reproducido" -> tracks se reordenan por play_count.

### 6.5 — Soft delete multi-usuario (EC-TR1, EC-TR2)
EC-TR1: Al eliminar track, verificar si el otro usuario lo esta reproduciendo (polling o WebSocket). Si si -> aviso: "Este track esta siendo reproducido tambien por [usuario]. Eliminar igualmente?" EC-TR2: Al eliminar track, informar en cuantas playlists existe. Las playlists afectadas lo gestionan via EC-LI3.
**Archivos:** MusicLab.jsx, workers/worker.js
**Criterio:** Eliminar track que esta en 3 playlists -> confirmacion muestra "Este track esta en 3 playlists".

### 6.6 — Subida duplicada -> confirmacion (EC-TR4)
Al subir archivo, verificar si ya existe en R2 (mismo hash/nombre) -> toast "Este archivo ya existe. Subir igualmente?" con confirmacion antes de ejecutar.
**Archivos:** AddTrackForm.jsx, FileUploadService.js
**Criterio:** Subir mismo MP3 2 veces -> toast pide confirmacion.


---

# FASE 5: CONTEXTO DE REPRODUCCION INTELIGENTE
**Objetivo:** Bottom sheet, inyeccion dinamica, reproduccion granular, fin de cola consciente.
**Specs:** C2, C3, C5, EC-C2, EC-C3, EC-C4
**Dependencias:** Fase 1, Fase 3 · **Estimacion:** M

### 5.1 — Bottom sheet reemplazar/anadir contexto (EC-C3)
Cuando cola manual activa + usuario pulsa play en playlist -> Bottom Sheet con 2 opciones: "Reemplazar contexto" o "Anadir al final". Swipe down o tap en fondo para cerrar. Animacion spring desde abajo.
**Archivos:** MusicLab.jsx (nuevo componente ContextSheet.jsx)
**Criterio:** Anadir tracks manuales -> pulsar play en playlist -> bottom sheet aparece.

### 5.2 — Reproduccion granular desde cancion especifica (C2/C3)
Tap en track dentro de playlist -> iniciar reproduccion desde ese track, no desde el principio. El contexto se reordena para empezar desde el track seleccionado.
**Archivos:** MusicLab.jsx, PlaylistManager.jsx
**Criterio:** Abrir playlist de 20 tracks -> tap en track 7 -> play empieza desde track 7.

### 5.3 — Inyeccion dinamica de tracks (EC-C2)
Si la playlist origen sufre modificaciones mientras suena (otro usuario anade tracks), se inyectan en tiempo real en la cola activa, respetando orden original y conviviendo con modificaciones manuales. Requiere polling o WebSocket al Worker API.
**Archivos:** PlayerContext.jsx
**Criterio:** Dos dispositivos: uno anade track a playlist -> aparece en cola del otro en <5s.

### 5.4 — Fin de cola -> parada consciente (C5)
Ultimo track termina -> reproduccion para, barra al 100%, track en pantalla en pausa, fade 1s hacia UI base (apaga vibe). Ya parcialmente implementado en onEnded y skip(1).
**Archivos:** PlayerContext.jsx
**Criterio:** Cola de 3 tracks -> tras el tercero, reproductor se detiene con fade.

### 5.5 — Contexto agotado + loop -> vuelta al track 1 (EC-C4)
Loop de lista activo -> al terminar el ultimo track del contexto, volver al track 1 de la playlist. Ya parcialmente implementado.
**Archivos:** PlayerContext.jsx
**Criterio:** Playlist de 5 tracks con loop -> track 5 termina -> track 1 comienza.


---

# FASE 7: PLAYLISTS + DROPS PREMIUM
**Objetivo:** Gestion de playlists completa + sistema de drops con notificaciones push.
**Specs:** EC-LI1, EC-LI2, EC-LI3, EC-LI5, EC-LI6, D1-D6, EC-D1-EC-D7, DROP-M20, DROP-M21
**Dependencias:** Fase 6 · **Estimacion:** L

### 7.1 — Playlist vacia: estado visual (EC-LI1)
Playlist sin tracks -> estado visual diferenciado que invita a anadir. Al intentar reproducir: toast "Esta playlist esta vacia."
**Archivos:** PlaylistManager.jsx, MusicLab.jsx
**Criterio:** Crear playlist sin tracks -> card muestra "Sin tracks · Anade canciones".

### 7.2 — Anadir track a playlist con "Crear nueva" inline (EC-LI2)
Ya existe via menu de tres puntos -> Anadir a playlist -> selector de playlists. Anadir opcion "Crear nueva playlist" sin salir del flujo.
**Archivos:** MusicLab.jsx, PlaylistManager.jsx
**Criterio:** Menu en track -> Anadir a playlist -> selector muestra playlists existentes + "Nueva playlist".

### 7.3 — Tracks eliminados -> aviso en playlist (EC-LI3)
Al abrir playlist, verificar que todos los track_ids existen en rawTracks. Si no -> toast "X tracks no estan disponibles" con opcion de limpiar la playlist.
**Archivos:** PlaylistManager.jsx
**Criterio:** Eliminar un track de la biblioteca -> abrir playlist que lo contiene -> toast.

### 7.4 — Reordenar con shuffle activo (EC-LI6)
Si shuffle esta activo y el usuario reordena tracks de la playlist, registrar la posicion actual del shuffle para no repetir ese orden en el siguiente shuffle. Sin toast.
**Archivos:** PlaylistManager.jsx, PlayerContext.jsx
**Criterio:** Shuffle activo -> reordenar playlist -> desactivar y reactivar shuffle -> orden diferente.

### 7.5 — Sistema de Drops completo (D1-D6, EC-D1-EC-D7)
D1: Limite 200 chars en mensaje. D2: Mensaje opcional — drop solo con track+segundo. D3: Multiples drops al mismo track+segundo permitidos. D4: Solo entre usuarios distintos (ya implementado). D5: Autor puede editar/eliminar drop pending con indicador "editado". D6: Notificacion push al recibir drop (sin preview del mensaje). EC-D1: Segundo supera duracion -> drop marcado invalido. EC-D2: Track eliminado -> drop persiste, accion "ir al reproductor" deshabilitada. EC-D3: Multiples drops pendientes -> resumen al abrir app. EC-D6: Drop en segundo 0 permitido. EC-D7: Favorito -> snapshot de metadatos.
**Archivos:** DropsManager.jsx
**Criterio:** Enviar drop desde dispositivo A -> dispositivo B recibe push notification.

### 7.6 — Fix bug Drops en navegador nativo (DROP-M20)
Drops debe abrirse dentro de la PWA, no en navegador nativo. Verificar scope en manifest y links internos.
**Archivos:** DropsManager.jsx, manifest.json
**Criterio:** Notificacion de drop -> tap -> abre en la PWA instalada.

### 7.7 — Snapshot de metadatos en favoritos (DROP-M21)
Al marcar drop como favorito, persistir titulo, artista y segundo como campos propios del drop. Si el track se elimina despues, el drop conserva los metadatos.
**Archivos:** DropsManager.jsx
**Criterio:** Marcar drop favorito -> eliminar track original -> drop sigue mostrando titulo y artista.


---

# FASE 9: VAULT TAXONOMIA — PARTE 2
**Objetivo:** Implementar los 35 tipos restantes (categorias 8-14). Integraciones futuras.
**Specs:** Taxonomia VAULT — categorias 8 (Conocimiento), 9 (Identidad creativa), 10 (Finanzas), 11 (Rituales), 12 (Seguridad), 13 (Datos), 14 (Integraciones)
**Dependencias:** Fase 8 · **Estimacion:** XL

### 9.1 — Categoria 8: CONOCIMIENTO EXTERNO (5 tipos)
Tipos: Enlaces utiles (8.1), Articulos (8.2), Podcasts (8.3), Citas (8.4), Skills (8.5). Enlace -> URL + descripcion + tags. Cita -> texto + fuente + contexto.
**Criterio:** Guardar enlace -> card muestra favicon + preview.

### 9.2 — Categoria 9: IDENTIDAD CREATIVA (4 tipos)
Tipos: Moodboards (9.1), Paletas color (9.2), Playlists con historia (9.3), Albumes narrados (9.4). Moodboard -> upload multiple de imagenes. Playlist con historia -> referencia a playlist de MusicLab + narrativa.
**Criterio:** Crear moodboard -> subir 5 imagenes -> grid organizado.

### 9.3 — Categoria 10: FINANZAS DE PAREJA (4 tipos)
Tipos: Presupuesto (10.1), Metas ahorro (10.2), Suscripciones (10.3), Compras grandes (10.4). Presupuesto -> ingresos/gastos/categorias con grafico simple. Suscripciones -> nombre, coste, renovacion, responsable.
**Criterio:** Anadir suscripcion -> card muestra logo, coste y fecha de renovacion.

### 9.4 — Categoria 11: RITUALES Y TRADICIONES (4 tipos)
Tipos: Rituales nuestros (11.1), Tradiciones inventadas (11.2), Planes aniversario (11.3), Navidades/vacaciones (11.4). Aniversario -> ano + que hicimos + fotos + playlist vinculada.
**Criterio:** Registrar aniversario 2026 -> entrada vinculada a Era + playlist + fotos.

### 9.5 — Categoria 12: SEGURIDAD Y LEGADO (4 tipos)
Tipos: Contactos emergencia (12.1), Voluntades digitales (12.2), Caja fuerte (12.3), Llaves recuperacion (12.4). Caja fuerte -> sub-vault con contrasena extra. Cifrado client-side con Web Crypto API. Sin descifrado en servidor.
**Criterio:** Crear entrada en caja fuerte -> solo visible tras introducir contrasena.

### 9.6 — Categoria 13: DATOS Y ESTADISTICAS (4 tipos)
Tipos: Resumen anual (13.1), Rachas (13.2), Mapa calor emocional (13.3), Stats relacion (13.4). Widget en VAULT con graficos simples (barras, lineas).
**Archivos:** Vault.jsx (nuevo widget StatsWidget)
**Criterio:** Widget muestra "Dias juntos: 1,248 · Cartas: 47 · Fotos: 312".

### 9.7 — Categoria 14: INTEGRACIONES FUTURAS (4 tipos)
Tipos: Google Photos (14.1), Spotify (14.2), Calendarios (14.3), Email forward (14.4). Paneles de configuracion OAuth2. Google Photos -> scope adicional -> importar albumes.
**Archivos:** Vault.jsx (nuevo panel Integrations)
**Criterio:** Conectar Google Photos -> aparecen albumes para importar.


---

# FASE 8: VAULT TAXONOMIA — PARTE 1
**Objetivo:** Implementar los primeros 35 tipos de contenido del VAULT (categorias 1-7).
**Specs:** Taxonomia VAULT — categorias 1 (Multimedia), 2 (Escritura), 3 (Documentos), 4 (Geografia), 5 (Linea temporal), 6 (Listas), 7 (Comunicacion)
**Dependencias:** Ninguna · **Estimacion:** XL

### 8.1 — Categoria 1: MULTIMEDIA (5 tipos)
Tipos: Fotos (1.1), Videos (1.2), Audio (1.3), GIFs/Memes (1.4), Capturas de pantalla (1.5). Anadir al selector ENTRY_TYPES. Video: upload a R2 con previsualizacion. GIF: upload + preview animado. Captura: upload + OCR opcional.
**Archivos:** AddEntryForm.jsx
**Criterio:** Selector de tipo muestra 9+ opciones (4 existentes + 5 nuevas).

### 8.2 — Categoria 2: ESCRITURA INTIMA (8 tipos)
Tipos: Cartas (2.1), "Abrir cuando..." (2.2), Diario compartido (2.3), Diario individual (2.4), Gratitud diaria (2.5), Registro de suenos (2.6), Inside jokes (2.7), Glosario de apodos (2.8). Cada tipo con su propio icono, placeholder y campos especificos.
**Archivos:** AddEntryForm.jsx
**Criterio:** Crear entrada tipo "inside_joke" -> formulario muestra campos especificos.

### 8.3 — Categoria 3: DOCUMENTOS PERSONALES (7 tipos)
Tipos: Legales (3.1), Medicos (3.2), Financieros (3.3), Profesionales (3.4), Educacion (3.5), Backup 2FA (3.6), "Por si me pasa algo" (3.7). Upload de archivos PDF/DOCX/IMG a R2 con prefijo vault/docs. Campo de encriptacion opcional. Documentos sensibles marcados con candado.
**Archivos:** AddEntryForm.jsx
**Criterio:** Subir PDF de DNI -> se almacena en R2 con flag sensitive: true.

### 8.4 — Categoria 4: GEOGRAFIA DE LA RELACION (5 tipos)
Tipos: Lugares nuestros (4.1), Viajes (4.2), Sitios por visitar (4.3), Check-ins (4.4), Resenas de pareja (4.5). Campo de ubicacion con selector de mapa (Leaflet). Check-in -> ubicacion + foto + nota. Resena -> puntuacion (1-5) + texto + fotos.
**Archivos:** AddEntryForm.jsx
**Criterio:** Crear check-in -> formulario incluye mapa para seleccionar ubicacion.

### 8.5 — Categoria 5: LINEA TEMPORAL (6 tipos)
Tipos: Hitos (5.1), Hitos individuales (5.2), "Un dia como hoy" (5.3), Cuenta atras (5.4), Proyeccion futura (5.5), Linea emocional (5.6). Hito -> fecha exacta + icono + narrativa. Cuenta atras -> fecha futura + descripcion. Linea emocional -> mood tracker (emoji/color).
**Archivos:** AddEntryForm.jsx
**Criterio:** Crear hito "Primer beso" con fecha -> aparece en Timeline.

### 8.6 — Categoria 6: LISTAS Y COLECCIONES (8 tipos)
Tipos: Peliculas/series (6.1), Libros (6.2), Recetas (6.3), Bucket list (6.4), Ideas regalo (6.5), Gastos (6.6), Inventario casa (6.7), Plantas/mascotas (6.8). Cada tipo con plantilla de campos. Peliculas -> titulo, puntuacion de cada uno, fecha, notas.
**Archivos:** AddEntryForm.jsx
**Criterio:** Crear entrada tipo "movie" -> formulario tiene campos de puntuacion Edu y David.

### 8.7 — Categoria 7: COMUNICACION Y CRECIMIENTO (6 tipos)
Tipos: Decisiones (7.1), Resolucion conflictos (7.2), Notas terapia (7.3), Check-in relacion (7.4), Valores (7.5), Love languages (7.6). Check-in -> preguntas guiadas: "Como estamos?", "Que necesito?", "Que agradezco?".
**Archivos:** AddEntryForm.jsx
**Criterio:** Crear check-in de relacion -> formulario guiado con preguntas.


---

# FASE 10: VAULT GALERIA — MODOS INMERSIVOS
**Objetivo:** Implementar CINEMA y MAP completos segun spec. Capa ambiental.
**Specs:** CINEMA, MAP, Capa ambiental, Paleta reactiva por Era
**Dependencias:** Fase 8 · **Estimacion:** L

### 10.1 — CINEMA: Ken Burns + crossfade entre Eras
Animacion Ken Burns sutil (scale 1->1.05 + pan). Crossfade misma Era: suave. Distinta Era: wipe de color + transicion marcada. Pausa contemplativa 3s -> Ken Burns lento.
**Archivos:** VaultGallery.jsx
**Criterio:** Navegar CINEMA -> cada foto tiene movimiento. Cambio de Era -> wipe de color.

### 10.2 — CINEMA: Audioguias (Curator Notes)
Grabadora de voz inline (MediaRecorder). Audioguia anclada a una foto: se reproduce al llegar a esa foto en modo CINEMA. Indicador de audioguia: microfono + duracion.
**Archivos:** VaultGallery.jsx (nuevo AudioGuideRecorder)
**Criterio:** Grabar audioguia de 30s en una foto -> navegar a esa foto en CINEMA -> se reproduce.

### 10.3 — CINEMA: Musica ambiente de la Era
Playlist generada automaticamente con los tracks mas escuchados durante esa Era (consulta a D1). Volumen bajo (20-30%), opcional, desactivable. No interfiere con MusicLab si ya esta reproduciendo.
**Archivos:** VaultGallery.jsx
**Criterio:** Entrar a CINEMA de Era ORIGEN -> musica de fondo a volumen bajo.

### 10.4 — MAP: Pines reales con Leaflet
Leaflet ya instalado. Renderizar mapa con pines en ubicaciones de entries con coordenadas. Clusters para multiples fotos en misma ubicacion. Tap en pin -> carrusel horizontal de fotos. Capas: "Todos los viajes" / "Solo esta Era" / "Solo este ano".
**Archivos:** VaultGallery.jsx
**Criterio:** Abrir modo MAP -> mapa mundi con pines en ubicaciones reales.

### 10.5 — MAP: Lineas de viaje animadas
Conectar pines en orden cronologico con lineas curvas (Leaflet polyline o canvas overlay). Animacion de trazado. Gradiente de color segun la Era. Distancia entre pines consecutivos.
**Archivos:** VaultGallery.jsx
**Criterio:** Viaje con 3 ubicaciones -> linea curva animada conecta los 3 pines.

### 10.6 — MAP: Timeline slider en el mapa
Barra inferior con rango de fechas. Arrastrar slider -> fotos aparecen/desaparecen del mapa en tiempo real.
**Archivos:** VaultGallery.jsx
**Criterio:** Mover slider de enero a diciembre -> pines del verano aparecen, los de invierno desaparecen.

### 10.7 — Capa ambiental: paleta reactiva por Era
Extraer paleta dominante de las fotos de cada Era (color-thief o similar). Galeria se tine con la paleta. Si no hay fotos -> paleta por defecto de la Era (era.color).
**Archivos:** VaultGallery.jsx, Vault.jsx
**Criterio:** Cambiar de Era -> galeria cambia de paleta de colores.


---

# FASE 11: VAULT GALERIA — MODOS DIFERENCIALES
**Objetivo:** DIALOGUE (killer feature), EXHIBITION canvas 2D, REEL auto-generado.
**Specs:** DIALOGUE, EXHIBITION, REEL, Live Sync
**Dependencias:** Fase 10 · **Estimacion:** XL

### 11.1 — DIALOGUE: Layout de conversacion
Dos columnas alternadas estilo chat. Edu izquierda, David derecha. Timestamp, mini thumbnail, titulo. Animacion de entrada staggered.
**Archivos:** VaultGallery.jsx
**Criterio:** Modo DIALOGUE -> conversacion visual con burbujas alternadas.

### 11.2 — DIALOGUE: Emparejamiento temporal (<5min)
Detectar fotos tomadas con <5 minutos de diferencia por usuarios distintos. Emparejarlas visualmente con un conector: hilo de luz SVG entre ellas.
**Archivos:** VaultGallery.jsx
**Criterio:** Edu y David toman foto a las 14:30 y 14:32 -> en DIALOGUE aparecen emparejadas con hilo.

### 11.3 — DIALOGUE: Asimetria poetica
Si un usuario tiene 0 fotos en un periodo -> no mostrar muro vacio. Las fotos del otro ocupan el centro con eco sutil en el lado vacio. Mensaje estetico.
**Archivos:** VaultGallery.jsx
**Criterio:** Periodo donde solo Edu tiene fotos -> DIALOGUE muestra eco poetico, no columna vacia.

### 11.4 — EXHIBITION: Canvas 2D por vibes
Canvas 2D desplazable (tipo Figma/Miro). Salas circulares agrupadas por vibe. Foto representativa en el centro + fotos orbitando + lineas curvas. Pinch zoom in/out.
**Archivos:** VaultGallery.jsx (nuevo ExhibitionCanvas.jsx)
**Criterio:** Modo EXHIBITION -> canvas con salas tematicas. Zoom out -> vista general. Zoom in -> fotos individuales.

### 11.5 — EXHIBITION: Salas auto-organizadas
Las salas se reorganizan solas al anadir nuevas fotos. Nuevas salas emergen con animacion. Fotos huerfanas (sin tag/vibe) van a sala "Sin clasificar".
**Archivos:** ExhibitionCanvas.jsx
**Criterio:** Anadir foto con tag "dnb" -> aparece en sala DnB en <1s.

### 11.6 — REEL: Generacion automatica
Detectar grupos de 5+ fotos en misma ubicacion/dia -> generar REEL automatico. Secuencia: portada (Ken Burns) -> mapa animado -> fotos -> carta/drop overlay -> mapa cierre -> creditos. Banda sonora: track mas escuchado del periodo.
**Archivos:** VaultGallery.jsx (nuevo ReelGenerator.jsx)
**Criterio:** Viaje con 12 fotos -> REEL generado automaticamente con narrativa.

### 11.7 — REEL: Controles y pinning
Reproducir/Pausar/Saltar escena. Banda sonora conmutable. Pin: guardar REEL como entrada inmutable del VAULT. Regenerar: intentar otra combinacion.
**Archivos:** ReelGenerator.jsx
**Criterio:** Regenerar REEL -> diferente orden de escenas, mismo contenido.


---

# FASE 12: CAPSULES PREMIUM
**Objetivo:** Completar el 30% restante de CAPSULES. RECAP Wrapped con datos reales.
**Specs:** SS-1—SS-8, TC-1—TC-9, RECAP 6 secciones con datos reales
**Dependencias:** Fase 14 · **Estimacion:** M

### 12.1 — SmokeSession: Sonido ambiente (SS-6)
Biblioteca de sonidos: ruido blanco, lluvia, fuego, bosque, olas. Seleccionables en preset. Reproduccion en bucle via audio dedicado. Volumen independiente del master.
**Archivos:** SmokeSession.jsx
**Criterio:** Iniciar Smoke con sonido de lluvia -> audio de lluvia en bucle durante la sesion.

### 12.2 — SmokeSession: Presets personalizados guardables (SS-5)
El usuario guarda combinaciones de (duracion + nombre + sonido ambiente) como preset personalizado. Persistencia en localStorage.
**Archivos:** SmokeSession.jsx
**Criterio:** Guardar preset "Lectura 45min con lluvia" -> aparece en la lista de presets.

### 12.3 — TimeCapsules: Completar TC-1—TC-9
TC-1/TC-2: Selector contenido entries+playlists (ya implementado). TC-3: Snapshot de playlist al sellar (ya). TC-5: Sellar con confirmacion irreversible. TC-6: Push notification al desbloquear. TC-7: Evento Timeline. TC-8: Animacion de apertura mejorada (particulas + sonido). TC-9: Capsula colaborativa.
**Archivos:** TimeCapsules.jsx
**Criterio:** Crear capsula con 3 entradas + 1 playlist -> sellar -> esperar fecha -> desbloquear con animacion.

### 12.4 — TimeCapsules: Notificacion push al desbloquear (TC-6)
Service Worker verifica periodicamente capsulas vencidas. Push notification: "Tu capsula se ha abierto."
**Archivos:** TimeCapsules.jsx, sw.js
**Criterio:** Capsula con fecha de ayer -> abrir app -> notificacion de desbloqueo.

### 12.5 — RECAP Wrapped: Datos reales (S75)
6 secciones con datos del motor de estadisticas (Fase 14). Top tracks reales, fotos del periodo, drops intercambiados, hitos, rachas. Portada con foto mas gustada. Cierre con playlist auto-generada.
**Archivos:** Recaps.jsx
**Criterio:** RECAP semanal muestra top track real, fotos reales, drops reales.

### 12.6 — RECAP: Guardar como entrada del VAULT
Boton "Guardar como entrada del VAULT" al final del RECAP. Crea entrada tipo recap con snapshot del resumen.
**Archivos:** Recaps.jsx
**Criterio:** Ver RECAP anual -> boton guardar -> aparece en VAULT como entrada.


---

# FASE 13: ESCUCHA COMPARTIDA
**Objetivo:** Implementar SC1-SC14 completo. Sincronizacion de posicion, presencia, corazon.
**Specs:** SC1-SC14, SC-M17, SC-M18
**Dependencias:** Fase 1, Fase 2 · **Estimacion:** XL

### 13.1 — Arquitectura de sincronizacion (SC-M18)
WebSocket o Server-Sent Events via Worker para broadcast de eventos. Alternativa: polling cada 2s a endpoint /api/session/shared. Eventos: play, pause, skip, seek, track_change, queue_update, join, leave.
**Archivos:** workers/worker.js (nuevos endpoints), PlayerContext.jsx
**Criterio:** Dos dispositivos conectados -> accion en uno se refleja en el otro en <2s.

### 13.2 — Boton corazon en header del reproductor (SC5)
Boton centrado en header del reproductor. Animacion "!" de Pokemon cuando el otro usuario esta escuchando (sin sesion activa). Corazon late y brilla en sesion activa. Pulsar -> iniciar/abandonar escucha compartida.
**Archivos:** WinampPlayer.jsx
**Criterio:** David escucha musica -> Edu ve corazon con "!" -> pulsa -> sesion compartida inicia.

### 13.3 — Sincronizacion de posicion estricta (SC4, SC7)
Broadcast de currentTime cada 1s durante sesion compartida. El guest ajusta su posicion para sincronizarse (tolerancia 500ms). Unirse a mitad de track -> sync inmediato a posicion del host.
**Archivos:** PlayerContext.jsx
**Criterio:** Guest se une a track en segundo 45 -> salta a segundo 45.

### 13.4 — Cola compartida con atribucion (SC2, SC13)
Cada track en cola muestra quien lo anadio (avatar/iniciales + color). Tracks anadidos por usuario que abandona -> permanecen en cola del que continua.
**Archivos:** PlayerContext.jsx, MusicLab.jsx
**Criterio:** Edu anade track -> en cola de David aparece con badge "EDU".

### 13.5 — Control compartido (SC1, SC9, SC11)
Cualquiera puede pausar, saltar, anadir a cola. Ultima accion recibida gana (sin aviso). Host pausa -> guest pausa. Guest quiere continuar -> debe salir de la sesion.
**Archivos:** PlayerContext.jsx
**Criterio:** Edu pausa -> ambos dispositivos en pausa. David hace skip -> ambos cambian de track.

### 13.6 — Perdida de conexion y reconexion (SC8, SC10)
Perdida de conexion -> continuar localmente. Reconexion -> pregunta: "Resincronizar o mantener tu posicion?" Toast con botones. Usuario abandona -> el otro continua sin interrupcion + toast. El que sale hereda track actual.
**Archivos:** PlayerContext.jsx
**Criterio:** Desconectar WiFi 10s -> reconectar -> toast de reconexion.

### 13.7 — Presencia mutua siempre visible (SC5, SC14)
Indicador en status bar: "Edu esta escuchando: Bicep - Glue". Sin posicion exacta ni cola visible. Solo track activo del otro usuario.
**Archivos:** Layout.jsx (nuevo PresenceIndicator)
**Criterio:** Status bar muestra track activo del otro usuario en tiempo real.

### 13.8 — Estadisticas compartidas (SC6, SC12)
Ambos usuarios reciben credito de escucha en sesiones compartidas. Solo cuenta si el usuario escucho >50% del track. Eventos emitidos con flag shared: true.
**Archivos:** StatsEngine.js
**Criterio:** Sesion compartida de 10 tracks -> ambos usuarios suman plays en stats.


---

# FASE 14: ESTADISTICAS + MOTOR DE EVENTOS COMPLETO
**Objetivo:** STAT-M9 completo, agregaciones SQL, UI de estadisticas, RECAP automatizado.
**Specs:** STAT-M9, base para RECAP, datos para VAULT 13.x
**Dependencias:** Fase 1 · **Estimacion:** L

### 14.1 — Eventos completos desde todos los modulos
Asegurar que cada accion emite evento a D1 events: play, pause, skip, seek, drop_sent, drop_seen, drop_favorited, entry_created, entry_updated, entry_deleted, era_created, playlist_created, playlist_updated, smoke_session_started/completed/abandoned, capsule_sealed/opened, track_added/deleted.
**Archivos:** StatsEngine.js, workers/worker.js
**Criterio:** Cualquier accion en la app -> evento registrado en D1.

### 14.2 — Agregaciones SQL para estadisticas
Nuevo endpoint /api/stats que devuelve datos agregados: reproducciones por track/playlist/tag/vibe, drops enviados/recibidos/guardados, tracks mas dropeados, segundos mas dropeados, horas de escucha por dia/semana/mes, rachas, top usuarios.
**Archivos:** workers/worker.js (nuevo endpoint)
**Criterio:** GET /api/stats?period=weekly -> JSON con todas las metricas.

### 14.3 — UI de estadisticas en VAULT
Widget StatsDashboard en VAULT con: dias juntos, kilometros recorridos (suma de distancias en MAP), peliculas vistas, cartas escritas, tracks escuchados. Graficos simples con barras/lineas SVG. Rachas activas.
**Archivos:** Vault.jsx (nuevo StatsDashboard)
**Criterio:** VAULT muestra "1,248 dias juntos · 47 cartas · 312 fotos · 1,892 tracks".

### 14.4 — RECAP automatizado (semanal, mensual, anual)
Worker (Cron Trigger) genera RECAPs periodicamente y los almacena en tabla recaps. El frontend los consume. RECAP semanal -> automatico cada domingo. Mensual -> dia 1. Anual -> 31 diciembre.
**Archivos:** Recaps.jsx, workers/worker.js
**Criterio:** Lunes -> RECAP semanal disponible sin intervencion del usuario.

### 14.5 — Notificaciones push de RECAP
Service Worker recibe push cuando hay nuevo RECAP disponible. Notificacion: "Tu RECAP semanal esta listo."
**Archivos:** sw.js, workers/worker.js
**Criterio:** Worker genera RECAP -> push notification -> usuario abre RECAP.

### 14.6 — Mapa de calor emocional (13.3)
Visualizacion de mood tracking a lo largo del tiempo. Eje X: meses. Eje Y: intensidad emocional (desde entradas tipo mood/check-in). Color: verde (positivo) a rojo (negativo).
**Archivos:** Vault.jsx (nuevo EmotionalHeatmap)
**Criterio:** Anadir check-ins de relacion durante 6 meses -> heatmap muestra fluctuaciones.


---

# RESUMEN DEL ROADMAP

| Fase | Nombre | Esfuerzo | Deps | % Acum |
|---|---|---|---|---|
| 1 | Fundamentos del Motor de Audio | L | — | 52% |
| 2 | MediaSession Premium + Android | M | 1 | 58% |
| 3 | Cola Definitiva + UX Tactil | M | 1 | 64% |
| 4 | Sistema de Vibe Completo | M | 1 | 70% |
| 5 | Contexto de Reproduccion | M | 1, 3 | 74% |
| 6 | Gestion de Tracks Full | L | 1 | 80% |
| 7 | Playlists + Drops Premium | L | 6 | 85% |
| 8 | VAULT Taxonomia Parte 1 | XL | — | 88% |
| 9 | VAULT Taxonomia Parte 2 | XL | 8 | 91% |
| 10 | VAULT Galeria Modos Inmersivos | L | 8 | 94% |
| 11 | VAULT Galeria Modos Diferenciales | XL | 10 | 96% |
| 12 | CAPSULES Premium | M | 14 | 97% |
| 13 | Escucha Compartida | XL | 1, 2 | 98% |
| 14 | Estadisticas + Motor de Eventos | L | 1 | 99% |
| 15 | Polish, Cast, Offline, Estabilizacion | XL | Todas | 100% |

**Esfuerzo total estimado:** 8XL + 5L + 5M = ~18-24 semanas (equipo 1-2 personas)

---

## HITOS PRINCIPALES

| Hito | Tras Fase | Entregable |
|---|---|---|
| **Alpha** | 3 | Reproductor premium completo (cola, vibe, UX tactil, MediaSession) |
| **Beta 1** | 7 | MusicLab 100% completo (tracks, playlists, drops, contexto) |
| **Beta 2** | 11 | VAULT 100% completo (taxonomia + galeria 6 modos) |
| **RC** | 14 | CAPSULES + Estadisticas + Escucha Compartida |
| **v1.0** | 15 | Release completo: Cast, Offline, FLAC, Polish |

---

## PRINCIPIOS DE EJECUCION

1. **Una fase a la vez.** No empezar Fase N+1 hasta que Fase N pase todos los criterios de aceptacion.
2. **Test en dispositivo real.** Cada subfase se valida en Android (Edu o David). No simulado.
3. **No romper lo que funciona.** Cada fase incluye regresion manual de features ya implementadas.
4. **Commits atomicos por subfase.** Un commit = una subfase completada y verificada.
5. **Documentacion viva.** Actualizar ESTADO.md y CHANGELOG.md al cerrar cada fase.
6. **ADR para decisiones arquitectonicas.** Si una subfase requiere una decision no cubierta por specs, generar ADR en CONTRATO.md.

---

> **Documento generado:** Junio 2026 · Post-Auditoria Fria
> **Fuente de verdad:** 7 specs + 22 archivos fuente
> **Proximo paso:** Iniciar Fase 1.1 — Precarga del siguiente track al 80% de duracion

---

# FASE 15: POLISH, CAST SDK, OFFLINE Y ESTABILIZACION
**Objetivo:** Cast SDK completo, soporte offline, FLAC/OPUS, animaciones avanzadas, testing exhaustivo, rendimiento Android.
**Specs:** CAST-M11-FULL, CAST-M11-DLNA, VIZ-M12, VIZ-M14, VIZ-M15, VIZ-M16, AUDIO-M22, EC-LI4, DRAG-GLOBAL-C, SC-M19-ANIM, T7/VIZ6
**Dependencias:** Todas las fases anteriores · **Estimacion:** XL

### 15.1 — Cast SDK completo + receiver app (CAST-M11-FULL)
Cast SDK completo. Receiver app (HTML5) para Chromecast que muestra visualizador vectorial (SVG/Canvas). Audio viaja de R2 al TV directamente. Movil actua como mando. Control por voz via Google Assistant en TV.
**Archivos:** PlayerContext.jsx, nuevo cast-receiver/
**Criterio:** Transmitir a Chromecast -> TV muestra visualizador con color del vibe.

### 15.2 — Soporte offline completo
Service Worker cachea: HTML, CSS, JS (precache), thumbnails de tracks (runtime cache), ultimas 50 fotos de VAULT (runtime cache). Audio: descargar MP3 de R2 a Cache API bajo demanda. Modo offline: UI se adapta (indicador OFFLINE, funcionalidad reducida pero usable).
**Archivos:** sw.js, PlayerContext.jsx
**Criterio:** Activar modo avion -> app funciona con datos cacheados.

### 15.3 — Soporte FLAC + evaluacion OPUS (AUDIO-M22)
Aceptar archivos FLAC en upload. Servir desde R2 (soporte nativo en Android). Evaluar OPUS para futuro: mejor compresion que MP3, soporte nativo en Android 5+. Anadir format al schema de tracks.
**Archivos:** AddTrackForm.jsx, PlayerContext.jsx
**Criterio:** Subir archivo .flac -> se reproduce correctamente.

### 15.4 — Fusion de playlists (EC-LI4)
Seleccionar 2 playlists -> opcion "Fusionar". Crea nueva playlist sin destruir las originales, nombrable en el momento, opcion de eliminar duplicados.
**Archivos:** PlaylistManager.jsx
**Criterio:** Fusionar "DnB Classics" + "New DnB" -> nueva playlist "DnB Complete".

### 15.5 — Unificacion global de drag & drop (DRAG-GLOBAL-C)
Unificar animaciones de drag & drop en cola, playlists, tracks. Misma animacion fluida y visible. Feedback haptico al inicio del drag. Placeholder visual durante el arrastre.
**Archivos:** Todos los componentes con drag & drop
**Criterio:** Drag & drop en cola, playlists y tracks -> misma experiencia visual.

### 15.6 — Animaciones avanzadas
VIZ-M12: Live wallpaper lockscreen (frame estatico del visualizador con controles encima). VIZ-M14: Timeout salvapantallas configurable (visualizador se activa tras inactividad). VIZ-M15: Animacion entrada primer vibe de la sesion (emerge desde negro, T7/VIZ6). VIZ-M16: Screensaver idle TV con logo del Bunker. SC-M19-ANIM: Animaciones avanzadas del corazon en sesion activa.
**Archivos:** PlayerContext.jsx, WinampPlayer.jsx, Capsules.jsx
**Criterio:** Dejar app inactiva 30s -> visualizador se activa automaticamente.

### 15.7 — Testing exhaustivo + rendimiento Android
Tests unitarios para funciones criticas: skip(), addToQueue(), enforceQueueLimit(), buildMasonryColumns(). Tests de integracion: flujo completo de upload + reproduccion. Lighthouse audit: target >90 en Performance, PWA, Accessibility. Perfilado de memoria Android: prevenir OOM con virtualizacion agresiva. Pruebas en dispositivo real: Edu (Android), David (Android).
**Archivos:** vitest.config.js, tests unitarios, lighthouse
**Criterio:** 0 crashes en 1h de uso intensivo en Android.

