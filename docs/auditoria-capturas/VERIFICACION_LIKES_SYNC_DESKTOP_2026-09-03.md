# Verificación del sync de likes en escritorio (t_like-sync) — 03-sep-2026

**Ejecutada por:** Buffy (Codebuff/Freebuff) · **Método:** harness local con fixtures (sin red, sin producción), Playwright/Edge headless 1600×900, instrumentación de red de `/api/likes` con "servidor" en memoria.

---

## 1. Qué se verifica

El sync de likes de tracks (`t_like-sync`): estado unificado dock/deck en `PlayerContext`, pull-union al arrancar con JWT, push debounced 2s tras cada toggle, y el guard **pull-antes-que-push** (regresión del bug push-on-mount que sobreescribía D1 con el set rancio de localStorage).

**Escenario del harness** (`tools/audit-ui/auditar-likes-sync.mjs`, regenerable: `AUDIT_PORT=4323 node tools/audit-ui/auditar-likes-sync.mjs`):

- Auth sembrada (`seedAutenticacion`, usuario `edu`, JWT de fixture).
- "Servidor" de likes en memoria con un like **remoto** preexistente (`trk-002`) — simula un like hecho desde otro dispositivo.
- Track activo del deck: `trk-001` (primer track del fixture). El toggle local cae sobre él; el like remoto, sobre `trk-002` — así el pull y el push son observables por separado.

---

## 2. Veredicto — ✅ TODO VERDE (`exito: true`)

| Criterio | Resultado |
|---|---|
| **R1 — push-on-mount imposible** | ✅ Exactamente **1 GET y 0 PUT** tras boot + play, aunque el pull cambie `likedTrackIds` (contra el código pre-fix este test FALLA: el mount agendaba un PUT que pisaba D1) |
| **R1b — pull aplicado** | ✅ La unión persistida en localStorage incluye el like remoto `trk-002` |
| **R2 — merge honesto + debounce** | ✅ Tras toggle: **0 PUT antes del debounce**, **exactamente 1 PUT** a los ~2s con la unión `["trk-002","trk-001"]`; chip del deck → `LIKED` (`aria-pressed=true`) |
| **R3 — persistencia multi-dispositivo** | ✅ Tras reload: chip `LIKED` sin tocar nada; segundo GET de pull registrado |
| **Contrato — motor único** | ✅ `unSoloAudio: 1` |
| **Consola** | ✅ 0 errores |

Evidencia cruda (git-ignored, regenerable): `tools/audit-ui/report/likes-sync/likes-sync-verificacion.json` + capturas `likes_tras_toggle.png` / `likes_tras_reload.png`.

Red registrada por la instrumentación (3 llamadas en toda la sesión): `GET → PUT(union) → GET` — ninguna más.

---

## 3. Hallazgos técnicos del proceso (valiosos para futuras auditorías)

1. **Las rutas de Playwright se resuelven en LIFO.** Registrando el interceptor `/api/likes` ANTES de `instalarRutas`, el catch-all `**/*` del fixture lo pisaba: la app funcionaba (las llamadas las respondía el handler por defecto) pero la instrumentación veía **cero llamadas** (`likesCalls: []`). Primera corrida devolvió `r1_ok:false` con la app sana — diagnóstico por la lista vacía, no por un fallo real. Regla: **registrar las rutas específicas DESPUÉS del enrutado base**. Documentada como norma de testing en AGENTS.md.
2. **El chip LIKE refleja el track ACTIVO.** Un like remoto sobre otro track no puede observarse en el chip — la observación honesta del pull es el estado persistido (localStorage) tras el merge. La primera versión del veredicto miraba el chip y marcó `r1_pullVisible:false` falsamente.
3. **Orden de array no estable:** el cuerpo del PUT sale de iterar un `Set` — la comparación del veredicto debe ser orden-insensible (sort antes de comparar).
4. **Bug de segundo orden cazado por los tests unitarios** (`src/core/__tests__/playerLikesSync.test.jsx`, 5 tests): si el usuario togea MIENTRAS el pull está en vuelo, el pull no hace merge (dirty) y el estado no cambia → el efecto de push no se re-ejecuta → ese primer like jamás se pusheaba. Fix: `likesPushTick` re-arma el push cuando el pull aterriza sobre estado dirty.

---

## 4. Regresión de control: reproductor grande — ✅ SIN CAMBIOS

`tools/audit-ui/capturar-bigplayer-desktop.mjs` tras los cambios del sync: deck montado, seek clicable → 30.79s (mitad de 60s), teclado ←/→ ±5s y Home→0.40s, `unSoloAudio: 1`, **0 errores de consola**. El sync de likes no perturbó nada del deck.

---

## 5. Cobertura unitaria relacionada

- `src/core/__tests__/playerLikesSync.test.jsx` (5 tests): guard pull-antes-que-push, toggle-antes-del-pull (sin merge + PUT con la verdad local), toggle-después-del-pull (PUT con la unión), pull fallido también arma el guard, gate de `jwtToken`.
- `src/core/__tests__/playerLike.test.jsx` (8 tests): lógica pura del like (playerLike.js).
- `workers/__tests__/likes.test.js` (8 tests): ruta `GET/PUT /api/likes` (401/403/400/405, round-trip, dedup).
- Suite completa en el momento de la verificación: **71 archivos / 524 tests** en verde.
