import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, BG, getVibeConfig } from "../tokens";
import { AudioVisualizer } from "./AudioVisualizer";
import { DropComposeModal } from "./DropsManager";
import { usePlayer } from "../core/PlayerContext";

// ─── DESIGN TOKENS (local) ───────────────────────────────────
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

function withAlpha(color, alpha) {
  const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
  if (color.startsWith("hsl(")) {
    const inner = color.slice(4, -1);
    return `hsla(${inner}, ${alpha})`;
  }
  if (color.startsWith("hsla(")) return color;
  return color + hex;
}



// ─── WINAMP BUTTON ───────────────────────────────────────────
const WinampBtn = ({ label, onClick, active = false, color = ACID, title, size = "md", "aria-label": ariaLabel }) => (
  <motion.button
    whileTap={{ scale: 0.85 }}
    onClick={onClick}
    title={title}
    aria-label={ariaLabel ?? title}
    className={`rounded-sm flex items-center justify-center text-xs font-bold transition-all ${
      size === "sm" ? "w-7 h-7" : "w-10 h-10"
    }`}
    style={{
      background: active ? withAlpha(color, 0.2) : "transparent",
      border: `1px solid ${active ? withAlpha(color, 0.65) : withAlpha(color, 0.18)}`,
      color: active ? color : withAlpha(color, 0.5),
      boxShadow: active ? `0 0 10px ${withAlpha(color, 0.4)}` : "none",
    }}

  >
    {label}
  </motion.button>
);

// ─── WINAMP PLAYER ───────────────────────────────────────────
export const WinampPlayer = ({ tracks = [], onDropSend, VIBE_TAGS: _VIBE_TAGS, vibeConf: vibeConfProp }) => {
  const {
    activeTrack: track,
    isPlaying: playing, setIsPlaying: setPlaying,
    localQueue: _queue, addToQueue,
    loopMode, toggleLoopMode, shuffle, setShuffle,
    autoPlaySignal, syncStatus,
    audioRef,
    skip,
    masterVolume, setMasterVolume,
    trackVibe,
    vibrate, softDeletedIds, undoRemoveFromQueue,
    castState, startCasting, stopCasting, isCasting, castDeviceName,
    // Fase C — Escucha Compartida (S123)
    sessionId, isHost, partnerListening, partnerTrack, partnerName, partnerTrackVibe, userId,
    createSession, leaveSession,
  } = usePlayer();
  // Phase 2.1: estado local de "like" (sin backend todavía — feedback visual).
  // Se resetea al cambiar de track para que el corazón no quede "pegado".
  const [liked, setLiked] = useState(false);
  const [likeToast, setLikeToast] = useState(null);
  // Phase 2.1: lifecycle del toast — useEffect evita race condition entre
  // clicks rápidos (cada uno disparaba un setTimeout independiente).
  useEffect(() => {
    if (!likeToast) return;
    const t = setTimeout(() => setLikeToast(null), 1500);
    return () => clearTimeout(t);
  }, [likeToast]);

  // S78 UX5: Swipe gesture state
  const swipeStartRef = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // S78 UX1: Double-tap detection
  const lastTapRef = useRef(0);
  const DOUBLE_TAP_MS = 300;

  const mountedRef   = useRef(false);
  const currentTRef  = useRef(0);
  // ADR-Refs: refs NO se leen durante el render. Valores inicializados a 0;
  // el useEffect de abajo sincroniza desde el ref vía evento 'timeupdate' en mount.
  const [progress, setProgress] = useState(0);
  const [volume,   setVolume]   = useState(masterVolume ?? 80);
  const [duration, setDuration] = useState(0);
  const [currentT, setCurrentT] = useState(0);
  const [showDrop,     setShowDrop]     = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const titleRef = useRef(null);

  // trackVibe → acento visual del reproductor (ADR-011)
  // vibeConfProp viene de MusicLab (resuelto desde DB, incluye tags custom)
  // fallback a getVibeConfig canónico solo si no se pasa prop
  const vibeConf = vibeConfProp ?? getVibeConfig(trackVibe ?? "gaming");
  // Partner vibe color — para corazón y badge cuando partner escucha
  const partnerColor = partnerTrackVibe ? getVibeConfig(partnerTrackVibe).palette.accent : "#ffcc00";

  // Funciones de control — declaradas ANTES de los useEffects que las consumen
  // para mantener el orden topológico de refs en deps (no-use-before-define).
  const skipDir = useCallback((dir) => {
    if (dir === -1) {
      if (currentTRef.current < 3) {
        // < 3s: ir al track anterior (ADR-009)
        skip(dir, tracks);
      } else {
        // >= 3s: reiniciar track actual (ADR-009)
        if (audioRef.current) { audioRef.current.currentTime = 0; }
        currentTRef.current = 0;
        setCurrentT(0);
        setProgress(0);
      }
      return;
    }
    skip(dir, tracks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, tracks]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play().catch(() => {}); setPlaying(true); }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- audioRef es estable (ref), setPlaying es estable (useState setter)
  }, [playing]);

  useEffect(() => {
    // BUG-10: no resetear isPlaying en montaje inicial (desync al volver de pestaña)
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setPlaying(false);
    setProgress(0);
    setCurrentT(0);
    setDuration(0);
    // Phase 2.1: resetear "like" al cambiar de track (no persistido aún)
    setLiked(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  useEffect(() => {
    if (!autoPlaySignal || !track) return;
    const timer = setTimeout(() => {
      if (audioRef.current) audioRef.current.volume = masterVolume / 100;
      audioRef.current?.play().catch(() => {});
      setPlaying(true);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlaySignal]);

  // Phase 2.1.a11y: keyboard shortcuts — space=play, ←/→=prev/next, l=like, q=add to queue.
  // Agrupado con el resto de useEffects (skipDir/togglePlay ya declaradas arriba).
  // Ignora cuando el foco está en un input/textarea/contenteditable, o si hay
  // modificadores (cmd/ctrl/alt) para no interceptar atajos del navegador.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipDir(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipDir(-1);
          break;
        case "l":
        case "L": {
          e.preventDefault();
          const next = !liked;
          setLiked(next);
          setLikeToast(next ? "AÑADIDO A FAVORITOS" : "QUITADO DE FAVORITOS");
          break;
        }
        case "q":
        case "Q":
          if (track) {
            e.preventDefault();
            addToQueue?.(track);
          }
          break;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `liked` incluido para que la closure tenga el valor actual al evaluar `!liked`
  }, [track, togglePlay, skipDir, addToQueue, liked]);


  // S78 UX1: Double-tap seek (±10s)
  const handleDoubleTapSeek = useCallback((e) => {
    if (!audioRef.current) return;
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < DOUBLE_TAP_MS;
    lastTapRef.current = now;
    if (!isDoubleTap) return;
    vibrate?.([10]); // haptic only on actual double-tap

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX || e.clientX;
    if (!x) return;
    const isRight = x - rect.left > rect.width / 2;
    const seekAmount = isRight ? 10 : -10;
    const newTime = Math.max(0, Math.min(duration || 0, (currentTRef.current || 0) + seekAmount));
    audioRef.current.currentTime = newTime;
    currentTRef.current = newTime;
    setCurrentT(newTime);
    if (duration) setProgress((newTime / duration) * 100);
  }, [duration, vibrate, audioRef]);

  // S78 UX5: Swipe handlers
  const onSwipeMove = useCallback((e) => {
    const startX = swipeStartRef.current;
    if (startX == null) return;
    setSwipeOffset((e.touches?.[0]?.clientX || e.clientX) - startX);
  }, []);

  // Fase 3.5 UX5: Swipe vertical para abrir la cola
  const swipeStartYRef = useRef(null);
  const onSwipeStartFull = useCallback((e) => {
    swipeStartRef.current = e.touches?.[0]?.clientX || e.clientX;
    swipeStartYRef.current = e.touches?.[0]?.clientY || e.clientY;
  }, []);
  const onSwipeEndFull = useCallback((e) => {
    const startX = swipeStartRef.current;
    const startY = swipeStartYRef.current;
    if (startX == null || startY == null) return;
    const endX = e.changedTouches?.[0]?.clientX || e.clientX;
    const endY = e.changedTouches?.[0]?.clientY || e.clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;
    // Priorizar vertical si es más pronunciado que horizontal
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
      if (diffY < 0) {
        // Swipe hacia arriba → abrir cola
        vibrate?.([15]);
        window.dispatchEvent(new CustomEvent("bunker_swipe_up_queue"));
      }
    } else if (Math.abs(diffX) > 60) {
      vibrate?.([15]);
      if (diffX > 0) skipDir(-1);
      else skipDir(1);
    }
    swipeStartRef.current = null;
    swipeStartYRef.current = null;
    setSwipeOffset(0);
  }, [skipDir, vibrate]);

  const seekTo = (pct) => {
    if (!audioRef.current || !duration) return;
    const targetTime = (pct / 100) * duration;
    audioRef.current.currentTime = targetTime;
    currentTRef.current = targetTime;
    setCurrentT(targetTime);
    setProgress(pct);
  };


  const changeVolume = (v) => {
    setVolume(v);
    setMasterVolume?.(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  };

  // ── Suscripción a eventos del <audio> centralizado ───────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      currentTRef.current = audio.currentTime;
      setCurrentT(audio.currentTime);
      setDuration(audio.duration || 0);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoaded = () => setDuration(audio.duration || 0);
    // BUG-22: botones físicos Android → volumechange en el <audio>
    const onVolumeChange = () => {
      const newVol = Math.round(audio.volume * 100);
      setVolume(newVol);
      setMasterVolume?.(newVol);
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("volumechange", onVolumeChange);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("volumechange", onVolumeChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (masterVolume == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolume(masterVolume);
    if (audioRef.current) {
      const target = masterVolume / 100;
      // guarda: evitar re-set cuando el cambio viene de onVolumeChange (feedback loop)
      if (Math.abs(audioRef.current.volume - target) > 0.001) audioRef.current.volume = target;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterVolume]);
// BUG-29: scroll de título solo si el texto desborda el contenedor
useLayoutEffect(() => {
if (!titleRef.current) return;
const raf = requestAnimationFrame(() => {
if (!titleRef.current) return;
setShouldScroll(titleRef.current.scrollWidth > (titleRef.current.parentElement?.offsetWidth ?? titleRef.current.offsetWidth));
});
return () => cancelAnimationFrame(raf);
}, [track?.id, track?.title]);

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const accentColor = vibeConf?.palette?.accent ?? ACID;

  // S79: Enhanced MediaSession — era-aware metadata
  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    const eraTag = track.era_name || track.era_id || "";
    // S85: artwork usa exclusivamente track.thumbnail. El extractor de YouTube
    // se eliminó (código muerto desde la migración a R2 — track.url ya no es
    // una URL de YouTube, siempre es un blob/object R2). Ver docs/legacy/SESIONES.md
    // (S85) para la limpieza.
    const artwork = track.thumbnail
      ? [{ src: track.thumbnail, sizes: "512x512", type: "image/jpeg" }]
      : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title ?? "Sin título",
      artist: track.artist ?? "El Búnker",
      album: eraTag ? `ERA: ${eraTag}` : "Music Lab",
      artwork,
    });
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    // MediaSession action handlers (in addition to PlayerContext's handlers)
    navigator.mediaSession.setActionHandler("play", () => { audioRef.current?.play(); setPlaying(true); });
    navigator.mediaSession.setActionHandler("pause", () => { audioRef.current?.pause(); setPlaying(false); });
    navigator.mediaSession.setActionHandler("previoustrack", () => skipDir(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => skipDir(1));
    navigator.mediaSession.setActionHandler("seekto", (d) => { if (audioRef.current && d.seekTime != null) { audioRef.current.currentTime = d.seekTime; currentTRef.current = d.seekTime; setCurrentT(d.seekTime); } });
    // S79: Set position state for lock screen progress bar
    if ("setPositionState" in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration || 0,
          playbackRate: playing ? 1 : 0,
          position: currentT || 0,
        });
      } catch { /* noop */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- audioRef es estable (ref); setPlaying/skipDir son estables (useState/useCallback wrapper) y solo se invocan en handlers de mediaSession; track se desglosa en track?.id/era_id/etc. en deps
  }, [track?.id, track?.era_name, track?.era_id, track?.thumbnail, playing, duration, currentT]);

  return (
    <motion.div
      className="relative rounded-sm overflow-hidden"
      style={{
        background: `linear-gradient(145deg, #0a0a0a 0%, #141414 100%)`,
        border: `1px solid ${withAlpha(accentColor, 0.2)}`,
        boxShadow: `0 0 30px ${withAlpha(accentColor, 0.07)}, inset 0 0 40px rgba(0,0,0,0.6)`,
        fontFamily: FONT_MONO,
        touchAction: "none",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, x: swipeOffset * 0.3 }}
      transition={{ duration: 0.45 }}
      onTouchStart={onSwipeStartFull}
      onTouchMove={onSwipeMove}
      onTouchEnd={onSwipeEndFull}
      onClick={handleDoubleTapSeek}
    >
      {/* <audio> vive en PlayerProvider (ADR-004 Enmienda S21) */}

      {/* Title Bar */}
      <div
        className="flex items-center px-3 py-2"
        style={{
          background: `linear-gradient(90deg, ${withAlpha(accentColor, 0.09)} 0%, transparent 100%)`,
          borderBottom: `1px solid ${withAlpha(accentColor, 0.13)}`,
        }}
      >
        <div className="flex items-center gap-2 flex-none">
          <motion.div
            animate={playing ? { opacity: [1, 0.3, 1] } : { opacity: 0.4 }}
            transition={{ duration: 0.8, repeat: playing ? Infinity : 0 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
          />
          <span className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: accentColor }}>
            MUSIC LAB
          </span>
          {syncStatus === "syncing" && (
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity }}
              className="text-xs" style={{ color: "#ffcc00", marginLeft: 2 }} title="Sincronizando cola...">◌</motion.span>
          )}
          {syncStatus === "error" && (
            <span className="text-xs" style={{ color: "#ff4444" }} title="Error guardando cola">✕</span>
          )}
        </div>

        {/* S132: Heart centrado en header — 3 estados: idle ♡ / partner ♥!bocadillo / sesión ♥ HOST/LINK */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1">
          <motion.button
            layout
            whileTap={{ scale: 0.85 }}
            onClick={async () => {
              if (sessionId) {
                await leaveSession();
              } else if (partnerListening) {
                await createSession();
              } else {
                setLikeToast("NADIE ESTÁ ESCUCHANDO");
              }
            }}
            title={sessionId
              ? `Sesión compartida activa · tocar para salir`
              : partnerListening
                ? `${partnerName} está escuchando — tocar para unirte`
                : "Nadie escuchando"}
            aria-label={sessionId ? "Salir de sesión compartida" : "Iniciar escucha compartida"}
            className="relative flex items-center justify-center gap-1 text-xs font-bold h-6"
            style={{
              minWidth: sessionId ? 52 : 48,
              paddingLeft: sessionId ? 8 : 6,
              paddingRight: sessionId ? 8 : 6,
              borderRadius: 2,
              background: sessionId
                ? withAlpha("#ff2d55", 0.18)
                : partnerListening
                  ? withAlpha(partnerColor, 0.15)
                  : "transparent",
              border: `1px solid ${sessionId ? withAlpha("#ff2d55", 0.5) : partnerListening ? withAlpha(partnerColor, 0.5) : withAlpha(accentColor, 0.15)}`,
              boxShadow: sessionId ? `0 0 12px ${withAlpha("#ff2d55", 0.4)}` : partnerListening ? `0 0 8px ${withAlpha(partnerColor, 0.3)}` : "none",
            }}
          >
            {/* Ripple ring — only active session */}
            {sessionId && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-sm pointer-events-none"
                style={{ border: `1px solid ${withAlpha("#ff2d55", 0.3)}` }}
              />
            )}

            {/* Heart — stable element (no key remount) */}
            <motion.span
              className="inline-block"
              animate={
                sessionId
                  ? { scale: [1, 1.25, 1] }
                  : partnerListening
                    ? { y: [0, -3, 0] }
                    : {}
              }
              transition={{
                duration: sessionId ? 1.2 : 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                fontSize: 15,
                lineHeight: 1,
                color: sessionId ? "#ff2d55" : partnerListening ? partnerColor : withAlpha(accentColor, 0.35),
              }}
            >
              {sessionId || partnerListening ? "♥" : "♡"}
            </motion.span>

            {/* Bocadillo Pokémon "!" con boquilla — solo partner escuchando */}
            {partnerListening && !sessionId && (
              <motion.span
                className="relative inline-flex items-center"
                initial={{ scale: 2.5, opacity: 0 }}
                animate={{ scale: [2.5, 1, 1.3, 0.9, 1.1, 1], opacity: [1, 1, 0.8, 1, 0.9, 1] }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <span
                  className="font-bold leading-none relative"
                  style={{
                    fontSize: 9,
                    color: "#fff",
                    background: "#ff2d55",
                    borderRadius: 2,
                    padding: "1px 4px 1px 4px",
                    textShadow: "none",
                  }}
                >
                  !
                  {/* Boquilla (triángulo) */}
                  <span
                    className="absolute"
                    style={{
                      left: "50%",
                      bottom: -3,
                      marginLeft: -2,
                      width: 0,
                      height: 0,
                      borderLeft: "3px solid transparent",
                      borderRight: "3px solid transparent",
                      borderTop: "3px solid #ff2d55",
                    }}
                  />
                </span>
              </motion.span>
            )}

            {/* Nombres de ambos en sesión activa */}
            {sessionId && (
              <span className="text-[9px] uppercase tracking-wider leading-none" style={{ color: withAlpha("#ff2d55", 0.7) }}>
                {userId === "edu" ? "Edu" : "David"} + {partnerName}
              </span>
            )}
          </motion.button>

          {/* Badge partner track — mini badge flotante (solo partner, sin sesión) */}
          {partnerListening && !sessionId && partnerTrack?.title && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-1.5 text-[8px] truncate max-w-[60px] leading-none"
              style={{
                color: withAlpha(partnerColor, 0.6),
                fontFamily: FONT_MONO,
              }}
            >
              {partnerTrack.title.slice(0, 12)}
            </motion.span>
          )}
        </div>

        <div className="flex gap-2 flex-none">
          {/* S109 — Chromecast button */}
          {castState !== "unavailable" && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={isCasting ? stopCasting : startCasting}
              disabled={castState === "connecting"}
              title={isCasting ? `Cast: ${castDeviceName || "conectado"} — tocar para desconectar` : "Conectar a Chromecast"}
              aria-label={isCasting ? "Desconectar Chromecast" : "Conectar a Chromecast"}
              className="text-xs tracking-widest uppercase px-2 py-0.5 rounded-sm flex items-center gap-1.5"
              style={{
                color: isCasting ? "#fff" : accentColor,
                background: isCasting ? "#4285f4" : withAlpha(accentColor, 0.08),
                border: `1px solid ${isCasting ? "#4285f4" : withAlpha(accentColor, 0.2)}`,
                fontFamily: FONT_MONO,
              }}
            >
              {castState === "connecting" ? (
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>◌</motion.span>
              ) : (
                <span>{isCasting ? "◼" : "◉"}</span>
              )}
              <span>{isCasting ? (castDeviceName ?? "CAST") : "CAST"}</span>
            </motion.button>
          )}
          <span className="text-xs tracking-widest uppercase px-2 py-0.5 rounded-sm"
            style={{ color: accentColor, background: withAlpha(accentColor, 0.08), border: `1px solid ${withAlpha(accentColor, 0.2)}` }}>
            {vibeConf?.icon} {vibeConf?.label}
          </span>
        </div>
      </div>

      {/* S77 Q16: Soft-delete undo bar */}
      {track && softDeletedIds?.has(track.id) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-3 py-1.5 text-xs text-center"
          style={{ background: `${accentColor}15`, borderBottom: `1px solid ${accentColor}22`, fontFamily: FONT_MONO }}
        >
          <button onClick={() => undoRemoveFromQueue?.(track.id)}
            className="underline" style={{ color: accentColor }}>
            Deshacer
          </button>
          <span className="opacity-40 ml-2" style={{ color: accentColor }}>eliminado de la cola</span>
        </motion.div>
      )}

      {/* PLIEGO-230: Visualizer opaco — antes rgba(0,0,0,0.4) dejaba ver contenido de abajo */}
      <div className="px-3 pt-3 pb-1" style={{ background: "#0a0a0a" }}>
        <AudioVisualizer audioRef={audioRef} isPlaying={playing} accentColor={accentColor} vibeId={track?.tag ?? track?.vibe ?? null} />
      </div>

      {/* PLIEGO-230: Track info opaco — antes rgba(0,0,0,0.3) colapsaba el texto sobre el fondo */}
      <div className="px-3 py-2 overflow-hidden" style={{ background: "#0a0a0a" }}>
        <div className="overflow-hidden whitespace-nowrap" style={{ width: "100%" }}>
          <motion.p
            ref={titleRef}
            animate={shouldScroll ? { x: ["0%", "-40%", "0%"] } : { x: 0 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="text-sm font-bold inline-block"
            style={{ color: accentColor, textShadow: `0 0 10px ${withAlpha(accentColor, 0.4)}` }}
          >
            {track ? `${track.title} — ${track.artist}` : "◈ SELECT A TRACK ◈"}
          </motion.p>
        </div>
        {track?.note && (
          <p className="text-xs mt-0.5 opacity-40 truncate" style={{ color: accentColor }}>↳ {track.note}</p>
        )}
      </div>

      {/* Seek Bar */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums opacity-50" style={{ color: accentColor }}>{fmtTime(currentT)}</span>
          <div className="relative flex-1 h-2 group cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - rect.left) / rect.width) * 100);
          }}>
            <div className="absolute inset-0 rounded-full" style={{ background: withAlpha(accentColor, 0.13) }} />
            <motion.div className="absolute top-0 left-0 h-full rounded-full"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor} 0%, ${withAlpha(accentColor, 0.67)} 100%)`, boxShadow: `0 0 8px ${withAlpha(accentColor, 0.4)}` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)`, borderColor: accentColor, background: BG, boxShadow: `0 0 8px ${withAlpha(accentColor, 0.8)}` }} />
          </div>
          <span className="text-xs tabular-nums opacity-50" style={{ color: accentColor }}>{fmtTime(duration)}</span>
        </div>  
      </div>

      {/* Controls — bg opaco, botones más grandes, ⊕ (add to queue) */}
      {/* S125: restructurado a 3 clusters con flex-1 en el central — el play queda realmente centrado */}
      <div className="flex items-center gap-2 px-3 pb-3"
        style={{ background: "#0a0a0a", borderTop: `1px solid ${withAlpha(accentColor, 0.13)}` }}>
        {/* Cluster izquierdo: loop + shuffle + ♡ like */}
        <div className="flex gap-2 flex-none">
          <WinampBtn
            label={loopMode === "track" ? "⟳¹" : "⟳"}
            active={loopMode !== "off"}
            color={accentColor}
            onClick={toggleLoopMode}
            title={loopMode === "off" ? "Loop: off" : loopMode === "list" ? "Loop: lista" : "Loop: track"}
            aria-label={loopMode === "off" ? "Loop: off" : loopMode === "list" ? "Loop: lista" : "Loop: track"}
          />
          <WinampBtn label="⇄" active={shuffle} color={accentColor} onClick={() => setShuffle((p) => !p)} title="Shuffle" aria-label="Shuffle" />
          <WinampBtn
            label={liked ? "♥" : "♡"}
            active={liked}
            color={"#ff2d55"}
            onClick={() => { const next = !liked; setLiked(next); setLikeToast(next ? "AÑADIDO A FAVORITOS" : "QUITADO DE FAVORITOS"); }}
            title={liked ? "Quitar de favoritos" : "Añadir a favoritos"}
            aria-label={liked ? "Quitar de favoritos" : "Añadir a favoritos"}
          />
        </div>

        {/* Cluster central: prev + play + next + ⚡ + ⊕ (flex-1 ocupa el espacio, justify-center centra el play) */}
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <WinampBtn label="◀◀" color={accentColor} onClick={() => skipDir(-1)} title="Prev" aria-label="Anterior" size="sm" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
            className="w-11 h-11 rounded-sm flex items-center justify-center text-lg font-bold transition-all"
            style={{ background: withAlpha(accentColor, 0.13), border: `2px solid ${withAlpha(accentColor, 0.4)}`, color: accentColor,
              boxShadow: playing ? `0 0 16px ${withAlpha(accentColor, 0.33)}` : "none", textShadow: `0 0 8px ${withAlpha(accentColor, 0.8)}` }}
            aria-label={playing ? "Pausar" : "Reproducir"}>
            {playing ? <Pause size={18} color={accentColor} strokeWidth={2.5} /> : <Play size={18} color={accentColor} strokeWidth={2.5} fill={accentColor} />}
          </motion.button>
          <WinampBtn label="▶▶" color={accentColor} onClick={() => skipDir(1)} title="Next" aria-label="Siguiente" size="sm" />
          {/* PLIEGO-230: ⚡ DROP consolidado en la botonera central — antes estaba separado al final */}
          {track && (
            <WinampBtn
              label="⚡"
              color={accentColor}
              onClick={() => setShowDrop(true)}
              title="Lanzar drop"
              aria-label="Lanzar drop"
              size="sm"
            />
          )}
          {track && (
            <WinampBtn
              label="⊕"
              color={accentColor}
              onClick={() => addToQueue?.(track)}
              title="Añadir a cola"
              aria-label="Añadir a cola"
              size="sm"
            />
          )}
        </div>

        {/* Cluster derecho: 🔊 + slider */}
        <div className="flex items-center gap-1.5 flex-none">
          <span className="text-xs opacity-40" style={{ color: accentColor }}>🔊</span>
          {/* S125: vol slider más grande (w-20 h-1.5) + alpha un-filled 22→10 (~6%, más limpio) */}
          <input type="range" min={0} max={100} value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-20 h-1.5 appearance-none cursor-pointer rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentColor} ${volume}%, ${accentColor}10 ${volume}%)`, accentColor }} />
        </div>
      </div>

      {/* PLIEGO-230: ⚡ LANZAR DROP movido a la botonera central (entre ▶▶ y ⊕).
          El botón full-width separado se eliminó para consolidar la UX. */}

      {/* Phase 2.1: Toast efímero al tocar ♡/♥ — confirma que el tap registró */}
      <AnimatePresence>
        {likeToast && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-bold"
            style={{
              background: "rgba(0,0,0,0.92)", border: `1px solid #ff2d5588`,
              color: "#ff2d55", fontFamily: FONT_MONO, borderRadius: 2,
              boxShadow: "0 0 12px rgba(255,45,85,0.3)", zIndex: 10,
              pointerEvents: "none", whiteSpace: "nowrap",
            }}>
            {likeToast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDrop && (
          <DropComposeModal track={track} onClose={() => setShowDrop(false)}
            currentMinute={currentT} trackDuration={duration}
            onSend={(dropData) => { onDropSend?.(dropData); setShowDrop(false); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};