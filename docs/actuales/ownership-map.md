# ownership-map.md

# Ownership Map

| Estado | Owner | Quién puede leer | Quién puede modificar |
|---|---|---|---|
| `db` (Base de datos JSON) | VaultContext | Toda la aplicación | VaultContext (via `patchDb`) |
| `activeTab` | VaultContext | Router (`App.jsx`), Layout | Router (`App.jsx`), Layout |
| Reproductor Nativo (Refs) | PlayerContext | PlayerContext, WinampPlayer | PlayerContext, WinampPlayer |
| Progreso Audio (UI) | WinampPlayer | WinampPlayer, AudioVisualizer | WinampPlayer |
| `masterVolume` | PlayerContext | PlayerContext, WinampPlayer, SmokeSession | PlayerContext (slider) |
| Track mutations (onAdd, etc.) | Router (App.jsx)* | MusicLab | MusicLab |---

# Reglas de ownership

## Playback
- El `<audio>` físico y el Iframe de YouTube pertenecen al nodo raíz del reproductor, nunca se desmontan.
- El progreso temporal pertenece al estado local del componente visual, nunca al estado global.

## Queue
- `PlayerContext` es dueño de la verdad lógica. Se sincroniza hacia Google Drive, pero Drive no inyecta cambios a la cola de forma bidireccional en tiempo real.

## Persistence
- `GoogleDriveService.js` posee los métodos de red. `VaultContext` posee la posesión y ciclo de vida de los datos locales en React.

## UI
- `App.jsx` debe decidir *qué* se ve. `tokens.js` decide *cómo* se ve (variables CSS).

---

# Violaciones actuales detectadas

- **App.jsx**: Posee y expone lógica de negocio profunda de la base de datos (`onAddTrack`, `onDeleteTrack`) hacia `MusicLab`. Debería solo renderizar `<MusicPage />`.
- **VaultContext**: Posee variables de estado visual puro de UI (`activeTab`, `masterVolume`) mezcladas con la base de datos central.
- **PlayerContext**: Posee llamadas asíncronas directas de red (`fetchQueue`, `saveQueue`), violando la separación de la capa de Persistencia.