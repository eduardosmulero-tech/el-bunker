---
describe: App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx, Layout.jsx, ToastContext.jsx, src/core/ui/*
sincronizado_con: S153 — drag de cola por IDs + audio/preload + responsive desktop + VaultHelpers (EntryLightbox unificado, WALL museo por eras, DEMO purge, R2 HMAC gate, track_updated silenciado)
stale_si_pliego_toca: App.jsx, VaultContext.jsx, PlayerContext.jsx, MusicLab.jsx, Vault.jsx, Capsules.jsx, Layout.jsx, ToastContext.jsx, src/core/QueueTransforms.js, src/vault/VaultHelpers.js
---

# Rendering Flow (post-S64)

> Estado vigente S153: las tres superficies mantienen una sola columna en móvil y usan composición responsive en desktop; el player sigue siendo el único propietario de `<audio>`. `src/vault/VaultHelpers.js` centraliza fechas, clasificación y resolución de media para Vault/Gallery/Lightbox.
>
> Composición desktop: Vault separa detalle de era y galería; Music Lab fija el player en una columna lateral y deja tabs/contenido en la principal; Capsules separa subnavegación y contenido. Los formularios y overlays conservan sus límites propios.

## Jerarquía de componentes

```
App.jsx
├── GlobalErrorBoundary (Class Component, catches all unhandled errors)
├── VaultProvider (auth, db D1, boot, jwtToken)
│   └── PlayerProvider (player state, trackVibe, queue, sessionId, partnerListening)
│       └── ToastProvider (NEW S132 — renderiza toasts unificados)
│           └── AuthenticatedApp (TabShell con Portal para modals)
│               └── Layout.jsx
│                   ├── ScanlineOverlay / NoiseOverlay / GridBackground / AmbientGlows (atmosphere)
│                   ├── StatusBar (reloj + PresenceIndicator + ↺/EXIT ≥44px)
│                   ├── Toast layer (unified, top:88px, z-40 + max 3 toasts)
│                   ├── AnimatePresence: SessionToast (heart sync break)
│                   ├── AnimatePresence: NetworkStatusToast (offline indicator)
│                   ├── Main content (z-20, pt-10 pb-20)
│                   │   ├── [vault]   → VaultPage
│                   │   │   └── Vault.jsx (useVault() propietario, sin DEMO_ERAS desde S148)
│                   │   │       ├── AddEntryForm.jsx (FileUploadService + Worker API, prefiere img.url firmada)
│                   │   │       └── VaultGallery.jsx (lazy, jwt implied, sin DEMO_ENTRIES_GEO desde S148)
│                   │   │           ├── WallView.jsx (S148: museo por eras — EraSectionHeader + lazy-mount per-item via IntersectionObserver)
│                   │   │           ├── MapView (react-leaflet + cluster, S131 Sub-fase 4)
│                   │   │           ├── CinemaView / DialogueView / ExhibitionView / ReelView
│                   │   │           └── EntryLightbox.jsx (S148: lightbox unificado — portal + swipe + pinch, abierto por los 6 modos vía onOpenLightbox)
│                   │   ├── [music]   → MusicPage
│                   │   │   └── MusicLab.jsx (useVault() + usePlayer())
│                   │   │       ├── WinampPlayer.jsx (controles del único motor de playback; corazón header S132)
│                   │   │       ├── TrackCard.jsx
│                   │   │       ├── PlaylistManager.jsx (modals)
│                   │   │       ├── TagManager.jsx (Design System Button)
│                   │   │       ├── DropsManager.jsx (DropAlertModal intrusivo)
│                   │   │       ├── AddTrackForm.jsx
│                   │   │       └── AudioVisualizer.jsx (Web Audio)
│                   │   └── [capsules] → CapsulesPage
│                   │       └── Capsules.jsx (ToastContext useToast())
│                   │           ├── Timeline.jsx (filtros Era/module/tipo, viewMode toggle; S148: whitelist VISIBLE_TRACK_EVENTS filtra track_updated histórico)
│                   │           ├── SmokeSession.jsx (timer + fade, emits events)
│                   │           ├── TimeCapsules.jsx (S74 opening animation)
│                   │           └── Recaps.jsx
│                   ├── MiniPlayer (overlay cuando activeTab !== "music", G7)
│                   ├── BottomNav (VAULT · MUSIC LAB · CAPSULES, ≥44px, safe-area bottom)
│                   └── PortraitLockOverlay (UX3.7, landscape orientation guard)
```

### Providers anidados (orden S132)

1. **`GlobalErrorBoundary`** (Class) — captura cualquier throw no manejado. Renderiza pantalla de reinicio.
2. **`VaultProvider`** — init Google, boot phase, db state, jwt, libraries, mutations.
3. **`PlayerProvider`** — único motor de playback: un `<audio>` principal y un `<audio>` silencioso de precarga gapless, ambos encapsulados en PlayerProvider; trackVibe, queue, sesión compartida, masterVolume y presence detection.
4. **`ToastProvider`** (NEW S132) — global toast state + `useToast()` hook. Wrapper de `AuthenticatedApp` (no de PlayerProvider — los toasts son UI shell).
5. **`AuthenticatedApp` / `UnauthorizedScreen`** (TabShell) — selecciona qué renderizar.

### Shadow drivers (Context compartidos)

- `useVault()` — auth, db, mutations, jwtToken. Consumido por: App.jsx, VaultPage, MusicPage, Capsules, useMusicActions, VaultGallery.
- `usePlayer()` — audio, queue, trackVibe, sessionId, partnerListening, partnerTrackVibe. Consumido por: MusicLab, WinampPlayer, TrackCard, Layout (MiniPlayer, StatusBar, ToastSessionToast), Capsules (acento vibe-aware), Timeline (acento).
- `useToast()` (NEW S132) — wrapper alrededor de single global ToastContext. Consumido por: Layout (renderea), Vault, MusicLab, TagManager, Capsules, Timeline, TimeCapsules, SmokeSession.

### Design System (`src/core/ui/*`)

- **Button** — `variant: primary | secondary | ghost` × `size: sm | md | lg` (sm/md = 44px, lg = 52px). Framer Motion. Consumido por: Vault (`+ ERA`), form submit en TagManager, etc.
- **Card** — `padding: sm | md | lg` + `hoverable` + `onClick`. Glassmorphism. Wrappers reusables para sections.
- **Input** — `label`, `error`, `accentColor`, `icon`. **Aún NO migrado**: `AddEntryForm.jsx` y `AddTrackForm.jsx` siguen con inputs inline. Migración pendiente en próximo pliego de forms.
- **Skeleton** — loaders para loading states (Block genérico, MusicLab, Capsules, VaultGallery). Reemplaza "CARGANDO..." textual de BootScreen.

## Flujo de renderizado

1. **Boot**: App monta VaultProvider → Google OAuth2 → perfil → whitelist → JWT → Worker API (D1/R2) → `EMPTY_DB()` seguro si falla la API; no se consulta Drive para persistencia.
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
| VaultGallery.jsx | entries, eras, galleryMode, jwtToken, onOpenLightbox | Vault.jsx props |
| WallView.jsx | entries, eras, density, setDensity, filterCategory, accentColor, onOpenLightbox | VaultGallery.jsx (S148: museo por eras, lazy-mount per-item) |
| EntryLightbox.jsx | entries, startIndex, onClose, eras, accentColor | VaultGallery (portal global, S146/S148) |
| MusicLab.jsx | db, user, jwtToken, masterVolume | useVault() |
| Capsules.jsx | jwtToken, masterVolume, activeTrack | App.jsx props |
| AddEntryForm.jsx | eras, tags, onCreated | Vault.jsx props |
| WinampPlayer.jsx | (usa PlayerContext directo) | PlayerContext |

## Optimizaciones

- `mountedRef` en PlayerProvider para evitar updates en componentes desmontados.
- Precarga gapless encapsulada en PlayerProvider; solo el audio principal emite playback/stats y el audio de precarga permanece silencioso.
- Aceptación runtime pendiente: instalación PWA, offline/update y consola en viewport 390/1024/1440 requieren navegador/dispositivo reproducible.
- Progreso de reproducción local en WinampPlayer (no en Context global).
- `loading="lazy"` y `decoding="async"` en imágenes de galería.
- `_jwtToken` naming en componentes forward-compat para evitar lint warnings.
- Carga progresiva: UI renderiza con Drive data → se enriquece con Worker data sin bloquear.

## Render loops controlados

- **Presence polling (S132, 5s)**: `PlayerContext.checkPresence()` → `GET /api/sync?action=presence` → actualiza `partnerListening/partnerTrack/partnerTrackVibe` solo si hay cambio (filtro de edad >5min server-side).
- **Presence broadcast (S132, 30s)**: `PlayerContext.broadcastPresence()` mientras `isPlaying` → `POST /api/sync action=heartbeat` → guarda JSON en `app_config` (`presence_{userId}`).
- **Session long-poll (S132, 20s)**: `PlayerContext` mantiene `GET /api/sync?session_id=X&since=TS` que bloquea server-side. Solo se desactiva cuando no hay sessionId.
- **masterVolume**: solo re-renderiza componentes suscritos (WinampPlayer, SmokeSession).
