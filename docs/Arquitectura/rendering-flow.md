---
describe: App.jsx, VaultContext.jsx, PlayerContext.jsx, main.jsx
sincronizado_con: PLIEGO-053
stale_si_pliego_toca: App.jsx, VaultContext.jsx, PlayerContext.jsx
stale: true — PLIEGO-061/065/066 modificaron PlayerContext.jsx sin actualizar este doc
---

# rendering-flow.md

# Rendering Flow

## Render raíz

1. `main.jsx` envuelve la app en `<VaultProvider>`.
2. `<VaultProvider>` evalúa el `bootPhase`. Muestra loading, auth errors o `<AppCore>`.
3. `<AppCore>` envuelve la UI autenticada en `<PlayerProvider>`.
4. `<AuthenticatedApp>` inyecta las modales globales y monta el enrutador animado con `<AnimatePresence>`.

---

# Árbol de render

## App
- Layout
  - DropAlertModal
  - AnimatePresence (Router virtual)
    - VaultPage / MusicPage / CapsulesPage / TimelinePage
      - MusicLab (si MusicPage)
        - WinampPlayer
        - DropsManager
        - PlaylistManager
        - TrackCard

---

# Componentes con demasiadas responsabilidades

| Componente | Problema | Prioridad |
|---|---|---|
| App.jsx | Define todos los callbacks de mutación de Drive del MusicLab | CRÍTICA |
| VaultContext | Maneja red, polling, estado UI, sesión OAuth y JSON | CRÍTICA |
| PlayerContext | Mezcla reproductor, red, colas, manipulación imperativa de DOM y WakeLock | ALTA |
| MusicLab | Orquestador gigante de todos los sub-módulos de música | MEDIA |

---

# Render loops sospechosos

- **Polling global de Drops (`setInterval` en `VaultContext`)**: Llama a `fetchData()` cada 30 segundos, inyectando un objeto fresco que hace que `db` cambie la referencia, re-renderizando toda la app periódicamente.
- **SetMasterVolume**: Un cambio en el deslizador de volumen desde `SmokeSession` viaja hasta la raíz en `VaultContext`, forzando un repintado de todos los componentes suscritos.
- **`patchDb` durante reproducción**: Cualquier mutación de la DB invocada desde `App.jsx` obliga a re-evaluar todo el contexto de Vault, pudiendo causar tirones de framerate si ocurre mientras se reproduce audio.

---

# Posibles optimizaciones

- Extraer `activeTab` y `masterVolume` fuera de `VaultContext` hacia un contexto de UI ligero.
- Memoizar (`React.memo`) componentes pesados como `AudioVisualizer` o listas de `TrackCard` para que no re-accionen a cambios no relacionados en el `VaultContext`.
- Mover las funciones de mutación de base de datos desde `App.jsx` directamente hacia el interior de `MusicLab.jsx`.