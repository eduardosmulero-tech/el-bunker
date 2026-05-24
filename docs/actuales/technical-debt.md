# technical-debt.md

# Technical Debt

## Deuda crítica

| Problema | Impacto | Prioridad | Solución propuesta |
|---|---|---|---|
| **VaultContext Monolítico** | Re-renders masivos al mezclar UI, red y DB | CRÍTICA | Extraer UI (activeTab/volume) a UIContext, separar DB Auth de consumo de módulos. |
| **Lógica de mutación en App.jsx** | Rompe encapsulación. Router conoce esquema interno de DB | ALTA | Mover los `patchDb` de `onAddTrack`, etc., dentro de `MusicPage`/`MusicLab`. |

---

# Deuda React

- **PlayerContext Side-Effects:** Mezcla estado de React, mutaciones de red asíncronas y APIs del navegador (WakeLock). 
- **Fuga del Entry Point:** `App.jsx` existe en `src/layout/` en lugar de la raíz, dividiendo la inicialización lógica respecto a `main.jsx`.
- **Stale Closures potenciales:** El uso dependiente de referencias como `currentTRef` y `loopModeRef` denota una lucha manual contra el modelo de render de React (necesario por interactuar con motores nativos, pero peligroso de extender).

---

# Deuda arquitectura

- **Polling global ineficiente:** El intervalo de 30s en `VaultContext` buscando drops inyecta nuevas copias del objeto JSON, impactando la memoria a largo plazo.
- **Ausencia de Boundaries:** Si la sincronización de Google Drive falla silenciosamente, no hay fallbacks robustos de red, dependiendo exclusivamente de timeouts implícitos de la API Fetch.

---

# Deuda IA workflow

- **Documentación operativa mezclada:** `MANUAL_USUARIO_EL_BUNKER.md` reside en `src/`, ensuciando el AST y el listado de directorios fuente de la lógica real.
- **Gestión de secretos rudimentaria:** `tokens.js` en la raíz de `src/` (si contuviera lógicas de proxy o claves quemadas).

---

# Hacks temporales existentes

| Hack | Motivo | Riesgo | Debe eliminarse |
|---|---|---|---|
| Div YT imperativo | Evitar que React destruya el iframe al re-renderizar | Bajo. Es una solución elegante y documentada. | NO (ADR-004) |
| loopModeRef | El callback de onStateChange perdía estado en stale closures | Bajo, pero verboso de mantener. | NO, necesario |
| currentTRef | El callback skipDir de MediaSession leía currentTime obsoleto del closure | Bajo, mismo patrón que loopModeRef. | NO, necesario |

---

# Refactors pendientes

- Limpiar `App.jsx` de mutaciones de base de datos.
- Extraer `activeTab` y `masterVolume` a un `UIProvider`.
- Extraer lógica WakeLock a hook nativo `useWakeLock(isPlaying)`.
- Extraer polling de drops global a su propio worker o servicio inyectado.