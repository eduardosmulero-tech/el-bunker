# ████████████████████████████████████████████████████████████
#  EL BÚNKER — PLANTILLA DE TESTING v2.0
#  Basada en el código real del proyecto (todos los archivos)
#  Fase de lanzamiento · Dispositivos reales
#
#  Instrucciones:
#    [x] = PASA       [!] = FALLA (añade nota)       [ ] = PENDIENTE
#
#  Dispositivo 1: _______________  OS: ___________  Navegador: ___________
#  Dispositivo 2: _______________  OS: ___________  Navegador: ___________
# ████████████████████████████████████████████████████████████


══════════════════════════════════════════════════════════════
  1. PWA — INSTALACIÓN Y SERVICE WORKER
══════════════════════════════════════════════════════════════

[ ] 1.1  En móvil aparece el banner "Añadir a pantalla de inicio"
[ ] 1.2  La app se instala correctamente como PWA (standalone, sin barra de navegador)
[ ] 1.3  El icono aparece en la pantalla de inicio con fondo #050505 y theme verde ácido
[ ] 1.4  El Service Worker se registra sin errores (ver consola: "[Búnker] SW registered")
[ ] 1.5  Con conexión cortada, la shell de la app carga desde caché (pantalla de login visible offline)
[ ] 1.6  Las llamadas a googleapis.com se pasan siempre por red, nunca desde caché
[ ] 1.7  Los shortcuts del manifest funcionan: tocar el icono con menú largo muestra
         "VAULT" y "MUSIC LAB" como accesos directos


══════════════════════════════════════════════════════════════
  2. LOGIN SCREEN — ESTÉTICA Y FLUJO
══════════════════════════════════════════════════════════════

[ ] 2.1  El ASCII art de "BUNKER" se renderiza completo y se ve nítido
[ ] 2.2  Las líneas del BootTerminal aparecen en secuencia con sus delays correctos:
         - INITIALIZING... (0ms)  → verde ácido
         - [!!] ANONYMOUS ACCESS DETECTED (700ms) → rojo
         - DEPLOYING IDENTITY FIREWALL... (900ms) → púrpura
[ ] 2.3  El cursor parpadeante ( ▌ ) aparece mientras el terminal sigue ejecutándose
[ ] 2.4  Tras terminar el terminal, el botón "ACCEDER AL BÚNKER" aparece con animación
[ ] 2.5  El texto del botón tiene efecto glitch al cargar (letras aleatorias → texto correcto)
[ ] 2.6  Al pasar el dedo/ratón por el botón: brillo, shimmer y flecha se animan
[ ] 2.7  Al pulsar el botón se muestra "AUTENTICANDO..." con el spinner ◈ girando
[ ] 2.8  El scanline CRT y el flicker se ven correctamente encima de todo
[ ] 2.9  La firma inferior ("ENCRYPTED · PRIVATE · YOURS ALONE") aparece con delay largo


══════════════════════════════════════════════════════════════
  3. AUTENTICACIÓN Y CONTROL DE ACCESO
══════════════════════════════════════════════════════════════

[ ] 3.1  Login con Edu (bansovi.py@gmail.com) → entra correctamente, nombre "Edu" en UI
[ ] 3.2  Login con David (dcgdozt@gmail.com) → entra correctamente, nombre "David" en UI
[ ] 3.3  Login con Admin (thebunker.admin@gmail.com) → entra correctamente, rol "admin"
[ ] 3.4  Login con cuenta NO autorizada → se muestra pantalla de error / acceso denegado,
         la sesión se cierra automáticamente (no queda token activo)
[ ] 3.5  Tras login denegado, pulsar "REINTENTAR" vuelve al estado de login limpio
[ ] 3.6  Logout → estado OFFLINE, pantalla de login, sin datos residuales visibles
[ ] 3.7  Logout + login con otra cuenta → se carga el estado correcto sin mezclas


══════════════════════════════════════════════════════════════
  4. BOOT — FASES Y PANTALLAS DE CARGA
══════════════════════════════════════════════════════════════

[ ] 4.1  Durante "init_services" el heartbeat pulsa lento (1.8s) en verde ácido
[ ] 4.2  Durante "init_db" el heartbeat pulsa rápido e irregular (0.6s) indicando sync
[ ] 4.3  El texto alterna entre "CARGANDO SERVICIOS..." y "SINCRONIZANDO VAULT..."
[ ] 4.4  La barra de progreso animada (shimmer horizontal) se ve sin parpadeos
[ ] 4.5  Si el boot falla, aparece la pantalla de ERROR con el mensaje concreto
[ ] 4.6  El botón "REINTENTAR →" de la pantalla de error hace window.location.reload()


══════════════════════════════════════════════════════════════
  5. LAYOUT — SHELL, STATUSBAR Y NAVEGACIÓN
══════════════════════════════════════════════════════════════

[ ] 5.1  La StatusBar superior muestra: punto parpadeante verde (autenticado) / rojo (no auth)
[ ] 5.2  "EL BÚNKER" con brillo verde ácido aparece a la izquierda
[ ] 5.3  El estado de la DB (◈ ONLINE / SYNCING / OFFLINE / ERROR) se ve en el centro
[ ] 5.4  El reloj en tiempo real (HH:MM:SS) se actualiza cada segundo a la derecha
[ ] 5.5  La rejilla de fondo (40×40px) y los glows ambientales (esquina superior izquierda
         verde ácido, esquina inferior derecha púrpura) se ven sin afectar la legibilidad
[ ] 5.6  El overlay de noise (#050505 + 3% opacidad) y scanlines CRT están activos
[ ] 5.7  BottomNav: 4 tabs (VAULT ◈ / TIMELINE ◎ / MUSIC LAB ◉ / CAPSULES ⧖)
[ ] 5.8  El indicador de tab activo (línea inferior animada con layoutId) se mueve suavemente
[ ] 5.9  Cambiar de tab produce animación fade + slide (y:10 → y:0 / y:0 → y:-10)
[ ] 5.10 El contenido no queda tapado por el StatusBar (padding-top: 40px) ni el BottomNav (pb: 80px)
[ ] 5.11 TIMELINE muestra "PRÓXIMAMENTE" con el símbolo ◎ parpadeando (es placeholder intencional)


══════════════════════════════════════════════════════════════
  6. BASE DE DATOS — SINCRONIZACIÓN Y MIGRACIÓN
══════════════════════════════════════════════════════════════

[ ] 6.1  Primera sesión (DB vacía): se crea the_vault_database.json en appDataFolder de Drive
[ ] 6.2  Segunda sesión: la DB existente carga con sus datos intactos
[ ] 6.3  Migración v1.0.0 → v3.0.0: entradas antiguas reciben from:"admin" y to:"both"
[ ] 6.4  Migración v2.0.0 → v3.0.0: campo libraries se mantiene intacto
[ ] 6.5  patchDb: un cambio hecho por Edu aparece en David tras refreshDb
[ ] 6.6  Patrón read-modify-write: si Drive tiene datos más nuevos, se preservan (no race condition)
[ ] 6.7  Al actualizar, updated_at se escribe siempre a nivel de DB


══════════════════════════════════════════════════════════════
  7. HEARTBEAT — CUENTA PRINCIPAL
══════════════════════════════════════════════════════════════

[ ] 7.1  Al iniciar sesión se actualiza el campo heartbeat en Drive
[ ] 7.2  Al volver de background (visibilitychange) se dispara heartbeat si BOOT.READY
[ ] 7.3  El heartbeat no se repite más de 1 vez cada 15 min (throttle: HEARTBEAT_THROTTLE_MS)
[ ] 7.4  El intervalo de 20 min en sesión activa actualiza lastHeartbeat en el contexto
[ ] 7.5  HeartbeatWidget en VAULT: pulso lento verde (< 20 meses), rápido rojo (≥ 20 meses)
[ ] 7.6  HeartbeatWidget muestra "⚠ EN RIESGO" y "Xm sin actividad" cuando atRisk es true


══════════════════════════════════════════════════════════════
  8. VAULT — SECCIÓN PRINCIPAL
══════════════════════════════════════════════════════════════

  ── 8a. Adventure Counter ──────────────────────────────────
[ ] 8.1  El contador muestra los días desde adventures_start_date en formato XXXX
[ ] 8.2  El desglose Y/M/D es correcto y consistente con el contador de días totales
[ ] 8.3  Los dígitos aparecen con animación escalonada (delay × índice)

  ── 8b. Slider de Eras ─────────────────────────────────────
[ ] 8.4  Las Eras reales de la DB se muestran (no los datos demo si hay DB)
[ ] 8.5  La Era activa tiene tamaño 280×200, las inactivas 220×160
[ ] 8.6  El scroll horizontal funciona en móvil (swipe) y en escritorio (drag-to-scroll)
[ ] 8.7  El borde y esquinas de cada EraCard usan el color personalizado de la Era
[ ] 8.8  La Era activa muestra "◈ ACTIVA" parpadeando y la línea inferior animada
[ ] 8.9  Si la Era tiene cover_image, se muestra al 20% de opacidad como fondo
[ ] 8.10 Pulsar "+ ERA" llama a onAddEra (log en consola por ahora — es placeholder)
[ ] 8.11 La primera Era se selecciona automáticamente al cargar

  ── 8c. Era Detail Panel ───────────────────────────────────
[ ] 8.12 El panel de detalle muestra: nº de ENTRADAS, FOTOS, NOTAS, HITOS de esa Era
[ ] 8.13 Se listan hasta 3 entradas recientes con icono por tipo (◎ foto / ◈ hito / ◉ nota)
[ ] 8.14 Al seleccionar otra Era el panel cambia con animación fade (AnimatePresence)

  ── 8d. Cápsulas del Tiempo ────────────────────────────────
[ ] 8.15 Cápsula bloqueada (fecha futura): muestra countdown D/H/M y símbolo ⌁ pulsando
[ ] 8.16 Cápsula desbloqueada (fecha pasada): muestra el contenido con blur → clear reveal
[ ] 8.17 Las esquinas de la cápsula bloqueada son púrpura; las desbloqueadas, verde ácido


══════════════════════════════════════════════════════════════
  9. MUSIC LAB
══════════════════════════════════════════════════════════════

  ── 9a. Reproductor Winamp ─────────────────────────────────
[ ] 9.1  El reproductor muestra título, artista y vibe tag del track activo
[ ] 9.2  Play/Pause funciona si el track tiene URL real (audio HTML5)
[ ] 9.3  Prev (◀◀) y Next (▶▶) cambian el track correctamente
[ ] 9.4  Loop (↺) y Shuffle (⇄) se activan/desactivan con feedback visual
[ ] 9.5  La barra de progreso (seek) permite arrastrar para cambiar posición
[ ] 9.6  El control de volumen interno del player funciona (0-100)
[ ] 9.7  Si el track tiene URL de YouTube (youtu.be / v=), se extrae el ID correctamente
         (no hay reproductor YT embebido, pero el ID se parsea sin errores)
[ ] 9.8  El botón "⚡ LANZAR DROP" abre el modal de composición de Drop

  ── 9b. Visualizador Web Audio API ─────────────────────────
[ ] 9.9  Con audio en reproducción, el visualizador muestra barras reactivas al sonido
[ ] 9.10 Sin audio (pausa / sin URL), el visualizador muestra animación idle orgánica
         (senos compuestos, no barras estáticas)
[ ] 9.11 El color de las barras coincide con el accent color del vibe del track
[ ] 9.12 Las barras tienen gradiente y peak dot (punto blanco en la cima)
[ ] 9.13 El canvas hace resize correcto con devicePixelRatio (sin blur en pantallas 2x)

  ── 9c. Filtros de Vibe ────────────────────────────────────
[ ] 9.14 Los 5 vibes se muestran: ALL / GAMING / 420 CHILL / DnB / ROMANTIQUEO
[ ] 9.15 Filtrar por vibe muestra solo los tracks de ese vibe (o todos con "ALL")
[ ] 9.16 El color del vibe activo coincide con su paleta definida
[ ] 9.17 Si no hay tracks para ese vibe se muestra "— no tracks for this vibe —"

  ── 9d. Añadir Track ───────────────────────────────────────
[ ] 9.18 El botón "+ ADD" muestra/oculta el formulario con AnimatePresence
[ ] 9.19 El formulario tiene campos: título, artista, URL, nota, vibe selector
[ ] 9.20 Guardar sin título no añade el track (validación mínima activa)
[ ] 9.21 Track añadido aparece en la lista y se persiste en Drive vía onAddTrack
[ ] 9.22 El botón cambia a "✕ CANCEL" al abrir el formulario

  ── 9e. Drops (mensajes musicales) ─────────────────────────
[ ] 9.23 El tab "DROPS [N]" muestra el contador correcto de drops
[ ] 9.24 El texto explicativo describe correctamente qué es un Drop
[ ] 9.25 El modal "⚡ THE DROP" se abre al pulsar "LANZAR DROP" en el player
[ ] 9.26 El modal de Drop permite escribir un mensaje (memory)
[ ] 9.27 Al enviar un Drop, aparece en el historial de DROPS con fecha y "from"
[ ] 9.28 Un Drop no visto (seen: false) abre el DropAlertModal al entrar a la app
[ ] 9.29 El DropAlertModal muestra: track asociado, mensaje, hora y quién lo envió
[ ] 9.30 Pulsando "ESCUCHAR" en el modal, cambia al tab de tracks y selecciona el track
[ ] 9.31 El Drop se puede descartar (dismiss) sin reproducirlo

  ── 9f. Tab DROPS — Historial ──────────────────────────────
[ ] 9.32 El historial muestra drops en orden inverso (más reciente primero)
[ ] 9.33 Cada drop del historial tiene: mensaje, fecha, remitente, y botón de reproducción
[ ] 9.34 Si no hay drops, se muestra "— sin drops aún —"


══════════════════════════════════════════════════════════════
  10. SMOKE SESSION (tab CAPSULES)
══════════════════════════════════════════════════════════════

[ ] 10.1  El anillo circular SVG muestra progreso del timer de forma fluida (transición 1s linear)
[ ] 10.2  El punto luminoso en la punta del progreso (dot) se anima mientras el timer corre
[ ] 10.3  Presets disponibles: 15 MIN / 30 MIN / 45 MIN / 1 HORA / 90 MIN
[ ] 10.4  Cada preset tiene su color propio (cyan / ácido / naranja / púrpura / rojo)
[ ] 10.5  El botón CUSTOM abre el input numérico (1-180 min); "OK" aplica el tiempo
[ ] 10.6  Botón "▶ ACTIVAR" inicia el timer; cambia a "⏸ PAUSAR" mientras corre
[ ] 10.7  Botón "↺ RESET" restaura el timer al tiempo seleccionado (deshabilitado si no hay progreso)
[ ] 10.8  Al terminar el timer, muestra ◈ en púrpura y el botón cambia a "◈ NUEVO"
[ ] 10.9  Fade-out automático: en los últimos 2 min el volumen baja linealmente a 0
[ ] 10.10 Durante el fade, la barra de volumen cambia a gradiente rojo-naranja y pulsa
[ ] 10.11 La etiqueta "⚠ FADE OUT" aparece parpadeando en rojo durante el fade
[ ] 10.12 El color del anillo cambia: verde (normal) → rojo (fade) → púrpura (done)
[ ] 10.13 Al terminar la sesión, el volumen se restaura al valor original (antes del fade)
[ ] 10.14 Pausar durante el fade congela el volumen en el valor actual (no lo restaura)
[ ] 10.15 El footer muestra "Fade out automático en los últimos 2 min" en todo momento


══════════════════════════════════════════════════════════════
  11. MENSAJES CON DESTINATARIO (from / to)
══════════════════════════════════════════════════════════════

[ ] 11.1  addEntry con to:"edu" → solo aparece en myEntries de Edu, no de David
[ ] 11.2  addEntry con to:"david" → solo aparece en myEntries de David, no de Edu
[ ] 11.3  addEntry con to:"both" → aparece en myEntries de Edu y de David
[ ] 11.4  myMessages solo contiene entradas de type:"letter"
[ ] 11.5  El campo "from" se guarda correctamente en la entrada persistida en Drive
[ ] 11.6  Entradas migradas desde v2 (sin from/to) tienen from:"admin" y to:"both" por defecto


══════════════════════════════════════════════════════════════
  12. BIBLIOTECAS (solo cuenta Admin)
══════════════════════════════════════════════════════════════

  ── 12a. Gestión básica ────────────────────────────────────
[ ] 12.1  Añadir biblioteca con email + shared_folder_id → aparece en la lista inmediatamente
[ ] 12.2  Biblioteca recién añadida tiene status "at_risk" (sin heartbeat previo)
[ ] 12.3  Editar label / capacity_gb → cambio persiste en Drive
[ ] 12.4  Eliminar biblioteca → desaparece de la lista y del cache de capacidad
[ ] 12.5  La lista de bibliotecas persiste al cerrar y reabrir la app

  ── 12b. Heartbeat manual ──────────────────────────────────
[ ] 12.6  Pulsar "Acabo de entrar" → last_heartbeat_check = ahora, status = "active"
[ ] 12.7  El cambio se persiste en Drive y se refleja en la UI sin recargar
[ ] 12.8  Una biblioteca con last_heartbeat_check > 18 meses → status "at_risk"
[ ] 12.9  Una biblioteca con last_heartbeat_check > 23 meses → status "lost"
[ ] 12.10 librariesAtRisk y librariesLost solo contienen las correctas

  ── 12c. Capacidad ─────────────────────────────────────────
[ ] 12.11 refreshLibraryCapacity devuelve used_gb, used_pct y file_count correctos
[ ] 12.12 Biblioteca al 85%+ → near_full = true, aparece en librariesNearFull
[ ] 12.13 Biblioteca al 100%+ → status se actualiza a "full" en la DB automáticamente
[ ] 12.14 La alerta de capacidad es visible en la UI sin necesidad de buscarlo
[ ] 12.15 Biblioteca por debajo del 85% → no genera alerta


══════════════════════════════════════════════════════════════
  13. RENDIMIENTO Y CASOS LÍMITE
══════════════════════════════════════════════════════════════

[ ] 13.1  Sin conexión → la app no se cuelga; el estado de DB muestra "OFFLINE"
[ ] 13.2  Token expirado durante sesión → la app pide renovación sin crash visible
[ ] 13.3  Dos pestañas abiertas simultáneamente → el último en escribir gana (last-write-wins);
          no hay corrupción del JSON
[ ] 13.4  refreshDb tras cambio externo en Drive → la UI refleja los datos nuevos
[ ] 13.5  La animación de cambio de tab no deja elementos fantasma en el DOM
[ ] 13.6  El AudioContext del visualizador no lanza errores al crear más de una instancia
          (MediaElementSource solo puede crearse una vez por elemento audio)
[ ] 13.7  El canvas del visualizador mantiene nitidez en pantallas Retina / OLED
[ ] 13.8  El timer de SmokeSession no deriva en sesiones largas (1h+ sin pausa)


══════════════════════════════════════════════════════════════
  14. ESTÉTICA CYBER-VANDAL — COMPROBACIÓN GLOBAL
══════════════════════════════════════════════════════════════

[ ] 14.1  Fondo #050505 en todas las pantallas
[ ] 14.2  Verde ácido #bfff00 como color primario de texto e iconos
[ ] 14.3  Púrpura neón #bf00ff para elementos secundarios (drops, cápsulas, PURPLE)
[ ] 14.4  La fuente JetBrains Mono (o Courier New como fallback) está activa en toda la app
[ ] 14.5  Los CornerBrackets (L esquinas) están presentes en todos los widgets de Vault
[ ] 14.6  El efecto glow (text-shadow y drop-shadow) está activo en los textos principales
[ ] 14.7  El tracking de texto (letter-spacing widest / 0.35em / 0.5em) se aplica uniformemente
[ ] 14.8  Las animaciones de Framer Motion no causan layout shifts en móvil


# ████████████████████████████████████████████████████████████
#  RESUMEN DE RESULTADOS
# ████████████████████████████████████████████████████████████
#
#  Total checks: 116
#
#  Dispositivo 1 (______________):
#    Pasados: __/116   Fallidos: __/116   Pendientes: __/116
#
#  Dispositivo 2 (______________):
#    Pasados: __/116   Fallidos: __/116   Pendientes: __/116
#
# ─────────────────────────────────────────────────────────────
#  BUGS ENCONTRADOS
# ─────────────────────────────────────────────────────────────
#
#  Bug 1: [sección] ____________________________________________
#  Bug 2: [sección] ____________________________________________
#  Bug 3: [sección] ____________________________________________
#  Bug 4: [sección] ____________________________________________
#  Bug 5: [sección] ____________________________________________
#
# ─────────────────────────────────────────────────────────────
#  NOTAS ADICIONALES
# ─────────────────────────────────────────────────────────────
#
#
