# Dictamen audit fastpotify vs MusicLab — 02-sep-2026

**Auditado por:** Buffy (Codebuff/Freebuff) · **Repo:** `github.com/crmne/fastpotify` (MIT, clon en `tmp/fastpotify-audit/`) · **Método:** lectura exhaustiva de `player.rs`, `history.rs`, `ui/keys.rs`, `Cargo.toml`, `README.md`; contraste con `PlayerContext.jsx`, `MusicLab.jsx`, `WinampPlayer.jsx`, `StatsEngine.js`.

---

## 1. Anatomía del repo externo

71 archivos Rust / 44.504 líneas. Rust + egui (UI nativa, sin motor de navegador) + librespot (protocolo Spotify). Capas: `player.rs` (motor + Spotify Connect) · `api/` (Web API, PKCE, rate-limit) · `backend.rs` (runtime tokio + canales) · `app.rs`/`model.rs` (estado/navegación) · `ui/` (15 vistas) · extras: EQ 10 bandas, lyrics, skins Winamp `.wsz`, MilkDrop (proceso aparte), mDNS, bandeja del sistema, MPRIS.

## 2. Dictamen por aspecto

| Aspecto | fastpotify | Búnker | Ganador |
|---|---|---|---|
| Motor de reproducción | snapshot `LocalState` + interpolación de posición por timestamp, `seek_sequence`, resume de sesión interrumpida | `PlayerContext` (1.801 líneas): precarga 2 fases (P-M8), transforms de cola, escucha compartida, Chromecast, MediaSession | Empate (su interpolación es más limpia; nuestras features sociales no existen allí) |
| Conteo de plays | cuenta tras 30s o mitad del track (los skips no ensucian) | contaba en CADA `onPlay` (cada resume registraba) | **Ellos → portado** |
| Volumen | curva perceptual (su análisis: lineal desperdicia la mitad baja del slider) | lineal `v/100`, sin mute | **Ellos → portado** |
| Atajos de teclado | 25+ con cheat-sheet (`?`) | space, ←/→ skip, L, Q, F, 1/2/3 | **Ellos → portados los 2 aplicables** |
| Historial | dedup ventana 60s, tope 500, merge local+remoto | historial de sesión en localStorage | Ellos (concepto portado) |
| Testabilidad | funciones puras + render headless de cada página | 483 tests, más cobertura global | Nosotros |
| Front | egui immediate-mode, 100–250 MB RAM | React+Vite+Tailwind, sistema de vibes, PWA | Mundos distintos; identidad visual intocable |
| Backend | Spotify Web API + PKCE | Workers + D1 (17 tablas) + R2 | Problemas incomparables; el nuestro encaja con el producto |

## 3. Ports implementados (esta sesión, verificados)

1. **`src/core/playerMath.js`** — puro, 0 DOM: `gananciaVolumen` (curva v²: 50% slider → −12 dB en vez de −6), `sliderDesdeGanancia` (inversa, alimenta BUG-22), `umbralEscucha` (30s/mitad, mín 1s).
2. **Historial honesto** (`PlayerContext`): `trackPlay` ya no dispara en `onPlay`; la escucha se registra al cruzar el umbral (`timeupdate` + red de seguridad en pausa, guard `playRegistradoRef`).
3. **Ganancia perceptual centralizada + mute real**: curva+mute en UN efecto del PlayerContext; dock/escritorio/botones físicos coherentes (el dock lee con la inversa). Mute persistente (`el_bunker_muted`), tecla `M` + botón `aria-pressed` junto al volumen. Iconos `volumeUp`/`volumeOff` en el sistema.
4. **Atajos**: `Shift+←/→` seek ±10s (flechas solas siguen haciendo skip — ADR-009 intacto), `M` mute.
5. **Big player**: título clamp 2 líneas + tooltip nativo. **`:focus-visible`** global con `var(--vibe-accent)` (index.css).

**Puertos descartados (justificados):** EQ (ver doc aparte `EVALUACION_EQ_10_BANDAS_WEB_AUDIO.md`), lyrics, MilkDrop, tray/instancia única, volume drag-preview (HTML audio no tiene softvol), interpolación de posición (el espejo `timeupdate` es suficiente en Web y 4 tests lo fijan).

## 4. Verificación

eslint limpio · build ✅ · **vitest 483/483** (antes 473; +10 por playerMath). Bugs vivos cazados durante el port: TDZ (efecto referenciaba `audioRef` antes de declararse) y dirección errónea en el primer borrador de la curva (la cúbica de fastpotify atenúa MÁS en el centro del slider; documentado y corregido a v²).

## 5. Nota de licencia

MIT: conceptos y comportamiento reutilizados; **cero código fuente copiado** (Rust vs JS, además incompatible). Nos queda pendiente el gesto pull-to-refresh en CAPSULES (sin equivalente directo en fastpotify; venía del audit original del repo).
