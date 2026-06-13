---
describe: App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx
sincronizado_con: S49 (Refundación del producto)
stale_si_pliego_toca: App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx
---

# Rendering Flow (post-S49)

## Jerarquía de componentes

```
App.jsx
├── VaultProvider (auth, db, boot)
│   └── PlayerProvider (player state, trackVibe)
│       └── Layout.jsx
│           ├── StatusBar (reloj, estado DB, salir)
│           ├── BottomNav (VAULT · MUSIC LAB · CAPSULES)
│           └── Page Content (AnimatePresence por tab)
│               ├── [vault]    → Vault.jsx
│               │   └── VaultGallery.jsx [futuro]
│               ├── [music]    → MusicLab.jsx
│               │   ├── WinampPlayer.jsx (único <audio>)
│               │   ├── TrackCard.jsx
│               │   ├── PlaylistManager.jsx
│               │   ├── TagManager.jsx
│               │   └── DropsManager.jsx
│               └── [capsules] → Capsules.jsx [futuro]
│                   ├── Timeline.jsx
│                   ├── SmokeSession.jsx
│                   ├── TimeCapsules.jsx
│                   └── Recaps.jsx
```

## Flujo de renderizado
1. App monta VaultProvider → autenticación → carga DB → hidratación.
2. PlayerProvider recibe `tracks[]` y `tags[]` desde VaultContext.
3. Layout consume `trackVibe` → propaga `--vibe-accent` en `:root`.
4. AnimatePresence envuelve cada tab para transiciones suaves.
5. WinampPlayer es persistente (no se desmonta al cambiar de tab) — solo se oculta/muestra.
6. Mini-player overlay visible en VAULT y CAPSULES cuando hay track activo.

## Optimizaciones
- Virtualización en galería WALL (cientos de fotos sin OOM).
- `mountedRef` en PlayerProvider para evitar Updates en componentes desmontados.
- Progreso de reproducción local en WinampPlayer (no en Context global).
- `loading="lazy"` y `decoding="async"` en imágenes.
