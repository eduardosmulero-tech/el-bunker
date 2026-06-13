---
describe: App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx
sincronizado_con: S64 — VaultContext → Worker API (carga híbrida)
stale_si_pliego_toca: App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx, Vault.jsx
---

# Rendering Flow (post-S64)

## Jerarquía de componentes

```
App.jsx
├── VaultProvider (auth, db híbrido, boot, jwtToken)
│   └── PlayerProvider (player state, trackVibe, queue)
│       └── Layout.jsx
│           ├── StatusBar (reloj, estado DB, salir)
│           ├── BottomNav (VAULT · MUSIC LAB · CAPSULES)
│           └── Page Content (AnimatePresence por tab)
│               ├── [vault]    → VaultPage
│               │   └── Vault.jsx (jwtToken={jwtToken})
│               │       ├── AddEntryForm.jsx (FileUploadService)
│               │       └── VaultGallery.jsx (jwtToken={jwtToken})
│               ├── [music]    → MusicPage
│               │   └── MusicLab.jsx (jwtToken={jwtToken})
│               │       ├── WinampPlayer.jsx (único <audio>)
│               │       ├── TrackCard.jsx
│               │       ├── PlaylistManager.jsx
│               │       ├── TagManager.jsx
│               │       ├── DropsManager.jsx
│               │       └── AddTrackForm.jsx
│               └── [capsules] → CapsulesPage
│                   └── Capsules.jsx (jwtToken={jwtToken})
│                       ├── Timeline.jsx
│                       ├── SmokeSession.jsx
│                       ├── TimeCapsules.jsx
│                       └── Recaps.jsx
```

## Flujo de renderizado

1. **Boot**: App monta VaultProvider → Google OAuth2 → perfil → whitelist → JWT → Drive JSON → Worker API (progresivo).
2. **Hidratación**: PlayerProvider recibe `tracks[]` desde `db.music_lab.tracks` (Worker-enriched).
3. **Layout**: consume `trackVibe` de PlayerContext → propaga `--vibe-accent` en `:root`.
4. **AnimatePresence**: envuelve cada tab para transiciones suaves.
5. **WinampPlayer**: persistente (no se desmonta al cambiar de tab) — solo se oculta/muestra.
6. **Mini-player overlay**: visible en VAULT y CAPSULES cuando hay track activo.
7. **jwtToken threading** (S61): App → Vault → VaultGallery y App → MusicLab para futuras llamadas API directas.

## Props clave en la jerarquía

| Componente | Props recibidas | Origen |
|---|---|---|
| Vault.jsx | db, user, jwtToken, myEntries, myMessages | useVault() |
| VaultGallery.jsx | entries, eras, galleryMode, jwtToken | Vault.jsx props |
| MusicLab.jsx | db, user, jwtToken, masterVolume | useVault() |
| Capsules.jsx | jwtToken, masterVolume, activeTrack | App.jsx props |
| AddEntryForm.jsx | eras, tags, onCreated | Vault.jsx props |
| WinampPlayer.jsx | (usa PlayerContext directo) | PlayerContext |

## Optimizaciones

- `mountedRef` en PlayerProvider para evitar updates en componentes desmontados.
- Progreso de reproducción local en WinampPlayer (no en Context global).
- `loading="lazy"` y `decoding="async"` en imágenes de galería.
- `_jwtToken` naming en componentes forward-compat para evitar lint warnings.
- Carga progresiva: UI renderiza con Drive data → se enriquece con Worker data sin bloquear.

## Render loops controlados

- **Drop polling (30s)**: `fetchData()` en VaultContext → solo actualiza `db` si hay drops nuevos → no re-renderiza toda la app si no hay cambios.
- **Heartbeat (20min)**: `triggerHeartbeat()` → solo actualiza `lastHeartbeat` timestamp.
- **masterVolume**: solo re-renderiza componentes suscritos (WinampPlayer, SmokeSession).
