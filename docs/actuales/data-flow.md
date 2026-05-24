# data-flow.md

# Data Flow

## Flujo principal de reproducción

1. Usuario selecciona track (tap en UI) -> `playTrack(track)` en `PlayerContext`.
2. Contexto actualiza `activeTrack` y dispara `autoPlaySignal`.
3. Según el `type` ("youtube" o "drive"), se delega a `ytPlayerRef.current.loadVideoById` o se inyecta `getStreamUrl` al `audioRef.current.src`.

---

# Flujo Queue -> Playback

## Entrada
`addToQueue(track)` inyecta objeto en `localQueue` de `PlayerContext`. Un efecto secundario guarda asíncronamente en Drive.
## Transformación
Al terminar un track (`onEnded`), `skip(1)` calcula el próximo índice considerando `shuffle`, `loopMode` y existencia de `localQueue`.
## Salida
`setActiveTrack(next)` dispara un re-render del reproductor y cambia el source del audio activo.

---

# Flujo YouTube

## Inicialización
`PlayerProvider` detecta URL, inyecta tag `<script>` del API si no existe. El div contenedor se crea imperativamente en el `<body>` (fuera de React).
## Eventos
`onStateChange` nativo mapea a `setIsPlaying(true/false)` de React. `onReady` setea el volumen global.
## Sincronización
`WinampPlayer.jsx` ejecuta un `setInterval` local reactivo a `isPlaying` que hace polling a `ytPlayerRef.current.getCurrentTime()` para actualizar la UI sin re-renders globales.

---

# Flujo Persistencia

## Guardado
`patchDb(updater)` en `VaultContext` realiza una actualización optimista local -> llama a `updateData()` para mutar en Drive.
## Restauración
`initGoogleServices()` -> validación OAuth -> descarga JSON de la bóveda compartida.
## Hydration
Los datos JSON hidratan el `db` state de `VaultContext`, propagándose en cascada al `PlayerContext` y a la interfaz.

---

# Posibles cuellos de botella

- `patchDb` invocado en `App.jsx` obliga a re-evaluar todo el contexto de Vault, re-renderizando todas las vistas.
- Polling global de drops en `VaultContext` (cada 30s) inyecta un nuevo objeto `db`, disparando ciclos de render masivos.
- Mutaciones concurrentes en `patchDb` si dos usuarios guardan un cambio en el mismo lapso (sobreescritura).