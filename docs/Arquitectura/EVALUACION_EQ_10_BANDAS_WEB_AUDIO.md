# Evaluación: EQ de 10 bandas con Web Audio — 02-sep-2026

**Solicitado por:** Edu tras el audit fastpotify (tiene EQ Winamp de 10 bandas + presets) · **Tipo:** evaluación técnica previa a SPEC (Promethe-os: IDEA → CONTRATO). No es implementación.

---

## 1. Hechos verificados en el código (no supuestos)

1. **Ya existe grafo Web Audio en el motor:** `src/musiclab/AudioGraph.js` crea y cachea por `WeakMap` el grafo del `<audio>` principal: `source (MediaElementSource) → analyser → destination`. El `AudioContextConstructor` es inyectable → **el EQ será testeable sin audio real** (mismo patrón que `AudioGraph.test.js`).
2. **`crossOrigin="anonymous"` ya activo para R2** (`PlayerContext.jsx:764, 1642`): los MP3 de R2 están **expuestos** al grafo. Sin CORS, `createMediaElementSource` da silencio — ya está resuelto de fábrica.
3. **CORS del Worker:** `workers/config.js` sirve `Access-Control-Allow-Origin: *` — compatible.
4. **ADR-018 / 🔒-3 (CONTRATO):** un solo `<audio>` en `PlayerProvider`. La regla prohíbe **más elementos de audio**, no procesar el existente: un EQ insertado en el grafo del mismo `<audio>` **no la toca** (el analizador ya lo demuestra).
5. **Aislamiento de elementos único:** el elemento se reemplaza al cambiar de track (lección del test WinampPlayerSeek, norma en AGENTS.md) → el EQ debe vivir **por elemento en el mismo WeakMap** del grafo, nunca como singleton global.
6. **Curva de volumen recién portada (`playerMath.gananciaVolumen`)**: aplica ganancia a `audio.volume`, que es **anterior** al grafo → convive sin conflicto (el preamp del EQ puede compensar la atenuación v² si se quiere).

## 2. Arquitectura propuesta

Dentro de `getAudioGraph`, extender la cadena una sola vez:

```
source → [BiquadFilter ×10 en cadena, de graves a agudos] → analyser → destination
```

- **10 `BiquadFilterNode` tipo "peaking"**, ganancias [−12, +12] dB, Q≈1.0, frecuencias estilo Winamp: 31, 62, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz.
- Conectados en serie; cada nodo con `gain.value = 0` por defecto → **EQ plano = bit a bit idéntico al audio actual** (feature apagada por defecto, cero riesgo sonoro).
- **Presets** (Flat, Rock, Pop, Jazz, Clásica, Dance, Bass Boost…) como arrays de 10 floats — datos, no lógica. Persistencia en `localStorage` por usuario (`el_bunker_eq_${userId}`), patrón igual que loop/shuffle (S85b).
- **UI**: panel en el big player (desktop ≥1280px) y hoja táctil desde el dock; sliders verticales con el acento del vibe; botón ON/OFF (`bypass` → restaurar todas las ganancias a 0, no desconectar nodos).
- **API**: `src/musiclab/eq.js` — `getEqBands(graph)`, `setBandGain(graph, index, db)`, `applyPreset(graph, gains)`, `resetEq(graph)`. Funciones puras sobre el grafo cacheado; el contexto de audio se comparte con el analyser (nunca crear un segundo `AudioContext` — Chrome limita ~6 por página).

## 3. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Latencia CPU en móvil antiguo con 10 biquads en serie | Los BiquadFilter son nodos baratos (Spotify Web usa más); medir con el harness en Playwright antes de activar en móvil |
| El grafo se crea lazy → si el usuario abre el EQ antes del primer play, nodos inexistentes | `getAudioGraph` ya es idempotente; la UI de EQ llama al getter y si no hay grafo muestra estado "se activará al reproducir" |
| Desync de ganancias si dos vistas (dock + big player) editan a la vez | Estado único en PlayerContext (`eqGains`, `eqEnabled`), vistas como espejos — mismo patrón que masterVolume |
| Un día alguien conecta el EQ fuera del WeakMap | Guard: `setBandGain` lanza si el grafo no viene de `getAudioGraph` |
| Tracks remotos del partner (escucha compartida) | El EQ es **local por diseño** (como el volumen); nada que sincronizar |

## 4. Plan por fases (para CONTRATO/SPEC)

1. **F1 — Motor**: extender `AudioGraph.js` con la cadena de 10 biquads + `eq.js` puro + tests con contexto inyectado (sin jsdom).
2. **F2 — Estado**: `eqGains/eqEnabled` en PlayerContext + persistencia localStorage.
3. **F3 — UI desktop**: panel en big player (donde ya vive el control de volumen portado).
4. **F4 — UI móvil**: hoja táctil desde el dock; verificar rendimiento con harness de auditoría.

F1+F2 son un contenedor lógico completo por sí mismas (motor + estado, sin UI) — cumplen la regla "cambios por contenedor lógico completo".

## 5. Dictamen

**VIABLE sin tocar ADR-018.** El diseño actual (grafo cacheado + crossOrigin resuelto + testabilidad inyectada) ya dejó las puertas abiertas: el EQ es una extensión natural del grafo existente, no un segundo motor. Coste estimado: F1+F2 ≈ medio día con batería de tests; F3+F4 ≈ otro medio. Recomendación: aprobar F1+F2 primero y validar rendimiento móvil antes de F4.
