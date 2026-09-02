# Verificación V-1 móvil + reproductor grande de MUSIC LAB — 02-sep-2026

**Ejecutada por:** Buffy (Codebuff/Freebuff) · **Método:** harness local con fixtures (sin red), Playwright/Edge headless, sin tocar producción.

---

## 1. Veredicto V-1: Vault móvil 390×844 — ✅ IDÉNTICO a master

Regla dura #1 del frente escritorio (HANDOFF_FLOTA_2026-08-14.md §3): *por debajo de 1280px no cambia un píxel*.

**Método:**

1. Worktree limpio de `master` (`git worktree add --detach ../el-bunker-master-v1 master`, con junction de `node_modules` al repo principal para no reinstalar).
2. Capturas headless 390×844 sobre fixtures locales idénticos en ambos árboles (`tools/audit-ui/capturar-v1-vault.mjs`, regenerable: `AUDIT_ROOT=<repo> AUDIT_OUT=<dir> node tools/audit-ui/capturar-v1-vault.mjs`).
3. Comparación pixel a pixel con decodificador PNG propio, sin dependencias nuevas (`tools/audit-ui/comparar-capturas.mjs`).

**Resultados:**

| Captura | Píxeles distintos | % |
|---|---|---|
| `vault_top` | 142 / 329.160 | 0,04 % |
| `vault_scroll650` | 1.112 / 329.160 | 0,34 % |

**Clave del veredicto:** capturar *el mismo working tree dos veces* produce las mismas diferencias (141 px arriba, 1.604 px abajo), concentradas en la esquina superior (reloj) y banda inferior (marquesina): **ruido temporal de captura, no cambios de UI**. Adicionalmente, la única modificación móvil detectada en el audit (EraCard `compact`, que encogía tarjetas de 280×200/220×160 a 220×120/200×96 por debajo de 1280px) fue revertida antes de esta verificación.

**Conclusión:** regla dura #1 respetada — Vault móvil es pixel-idéntico a master dentro del margen de ruido.

---

## 2. Reproductor grande de MUSIC LAB en navegador 1600×900 — ✅ TODO VERDE

App montada con fixtures, track reproduciéndose de verdad (tono de 60s servido con soporte Range 206), verificación DOM + interacción real (`tools/audit-ui/capturar-bigplayer-desktop.mjs`).

| Control | Estado |
|---|---|
| `NOW PLAYING` + estado `LIVE/PAUSED` | ✅ |
| Seek clicable (`role="slider"`, ARIA completo) | ✅ clic al centro → 30.99s de 60s (mitad exacta), sigue reproduciendo |
| Shuffle (`aria-pressed`) | ✅ |
| Repetición (`aria-label="Repetición: …"`) | ✅ |
| Volumen (input range, valor 80) | ✅ |
| Título | ✅ con `overflow-wrap: anywhere`, sin desbordes |
| Consola | ✅ 0 errores |
| `<audio>` | ✅ principal + preload (patrón P-M8 documentado); grep V-7: cero `new Audio(` fuera de PlayerContext |

### Hallazgo técnico del proceso (valioso para futuras auditorías)

El primer pase de seek "fallaba" (audio a ~0.8s en vez de ~30s). Diagnóstico instrumentando el `<audio>` (interceptación de asignaciones a `currentTime` + eventos `seeking/seeked` + lectura de `audio.seekable`):

- El handler calculaba **correctamente** (`v=30`).
- Pero `seekable = { inicio: 0, fin: 0 }`: el fixture WAV se servía **sin soporte de peticiones Range**, por lo que Chrome marcaba el medio como *no seekable* y descartaba el seek.
- Solución: el harness ahora emula R2 (respuesta `206 Partial Content` con `Content-Range` y `Accept-Ranges: bytes`). Con ello el seek pasó: `seekable = {0, 60}`.

**Implicación:** R2 en producción sirve rangos (206), así que en la app real el seek funciona. La limitación era del fixture, no del código. El harness queda mejorado para todas las pruebas futuras de seek/gapless.

---

## 3. Herencia del slider al dock móvil + verificación de teclado (ampliación 02-sep)

Como consecuencia de esta verificación, el slider del dock móvil (`WinampPlayer`) heredó el patrón ARIA del big player: `role="slider"` + `aria-valuemin/max/now` + `aria-valuetext` ("1:23 de 4:05") + teclado (←/→ ±5s, Home/End) con `stopPropagation` frente al doble-tap global ±10s (S78 UX1) y el atajo global ←/→ (skip, ADR-009). El slider del big player ganó el mismo teclado. El knob de progreso es visible también con foco de teclado (`group-focus-within`).

**Test unitario** (`src/musiclab/__tests__/WinampPlayerSeek.test.jsx` — 5/5): ARIA completo, ±5s, Home/End, clamp a [0, duración] y aislamiento del skip global. Lección de testing documentada: cada seek dispara `timeupdate` → re-render → **el nodo del slider se reemplaza**; el test debe re-consultar el nodo antes de cada `keyDown` (nunca reusar una referencia vieja, que queda *detached* y no alcanza al listener raíz de React).

**Teclado en navegador real** (1600×900, re-ejecución de `capturar-bigplayer-desktop.mjs` con foco en el slider):

| Tecla | currentTime | Resultado |
|---|---|---|
| base | 30.81s | — |
| → | 36.18s | ≈ +5s (+ deriva de reproducción) ✅ |
| ← | 31.44s | ≈ −5s (+ deriva) ✅ |
| Home | 0.41s | → 0 (+ deriva de 400ms) ✅ |

Consola: 0 errores.

## 4. Artefactos dejados en el repo

Todos regenerables; `tools/audit-ui/.gitignore` actualizado para no commitear la evidencia (`report/`, `.dist-*`):

- `tools/audit-ui/fixture-server.mjs` — módulo compartido: mapa de fixtures + audio R2 emulado (Range 206) + seed de sesión. Lo importan los cuatro scripts de captura.
- `tools/audit-ui/capturar-v1-vault.mjs` — capturas Vault móvil (working tree o `AUDIT_ROOT` externo).
- `tools/audit-ui/comparar-capturas.mjs` — diff pixel a pixel + mapa de diferencias en rojo (CLI).
- `tools/audit-ui/capturar-bigplayer-desktop.mjs` — verificación DOM + capturas + prueba de teclado del big player.
- `tools/audit-ui/capturar-movil-claude.mjs` — capturas móviles 390×844 de la auditoría externa (reproduce un track y recorre VAULT/MUSIC LAB/CAPSULES); refactorizado al módulo compartido, su audio ahora también es seekable (Range 206).
- `tools/audit-ui/probar-seek-bigplayer.mjs` — sonda de diagnóstico de seek (instrumenta el `<audio>`).
- `src/musiclab/__tests__/WinampPlayerSeek.test.jsx` — test unitario del slider ARIA del dock (5 tests). Norma de testing derivada en AGENTS.md (nodos reemplazados en re-render).

Worktree de master eliminado tras la verificación (`git worktree remove --force` + `prune`).
