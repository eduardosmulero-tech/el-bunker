import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Pause, Play, ListPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, BG, PURPLE, getVibeConfig } from "../tokens";
import { AudioVisualizer } from "./AudioVisualizer";
import { DropComposeModal } from "./DropsManager";
import { usePlayer } from "../core/PlayerContext";
import { Icon, UserGlyph } from "../core/ui";

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
const WinampBtn = ({ label, onClick, active = false, color = ACID, title, size = "md", fullColor = false, "aria-label": ariaLabel }) => (
  <motion.button
    whileTap={{ scale: 0.85 }}
    onClick={onClick}
    title={title}
    aria-label={ariaLabel ?? title}
    className={`rounded-sm flex items-center justify-center font-bold transition-all min-w-[44px] min-h-[44px] w-11 h-11 ${
      size === "sm" ? "text-[11px]" : "text-xs"
    }`}
    style={{
      background: active ? withAlpha(color, 0.2) : "transparent",
      border: `1px solid ${active ? withAlpha(color, 0.65) : withAlpha(color, (size === "sm" && !fullColor) ? 0.13 : 0.18)}`,
      color: active ? color : withAlpha(color, (size === "sm" && !fullColor) ? 0.35 : 0.5),
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
    localQueue: _queue,    addToQueue,
    loopMode, toggleLoopMode, shuffle, setShuffle,
    // S141: sincronizar lista filtrada por tag activo con PlayerContext
    setContextTracks,
    autoPlaySignal, syncStatus,
    audioRef,
    skip,
    masterVolume, setMasterVolume,
    trackVibe,
    vibrate, softDeletedIds, undoRemoveFromQueue,
    castState, startCasting, stopCasting, isCasting, castDeviceName,
    // Fase C — Escucha Compartida (S123)
    sessionId, partnerListening, partnerTrack, partnerName, partnerTrackVibe, userId,
    joinPendingSession, leaveSession,
    // FASE B: peek del siguiente track (decisión 3)
    peekNextTrack,
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
  const [showVolume,   setShowVolume]   = useState(false);
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

  // S141: sincronizar la lista actual de tracks (= `filteredTracks` desde MusicLab)
  // con PlayerContext. Cuando MusicLab cambia el tag filter, la referencia de `tracks`
  // cambia, setContextTracks invalida el pool de shuffle automáticamente y skip()
  // usa la nueva lista. Sin esto, skip+shuffle elegía tracks fuera del tag activo.
  useEffect(() => {
    setContextTracks?.(tracks);
  }, [tracks, setContextTracks]);

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
        className="grid items-center px-3 py-2"
        style={{
          gridTemplateColumns: "1fr auto 1fr",
          background: `linear-gradient(90deg, ${withAlpha(accentColor, 0.09)} 0%, transparent 100%)`,
          borderBottom: `1px solid ${withAlpha(accentColor, 0.13)}`,
        }}
      >
        <div className="flex items-center gap-2">
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
              className="text-xs" style={{ color: "#ffcc00", marginLeft: 2 }} title="Sincronizando cola..."><Icon name="circle" size={12} decorative /></motion.span>
          )}
          {syncStatus === "error" && (
            <span className="text-xs" style={{ color: "#ff4444" }} title="Error guardando cola"><Icon name="close" size={12} decorative /></span>
          )}
        </div>

        {/* S132: Heart centrado en header — 3 estados: idle ♡ / partner ♥!bocadillo / sesión ♥ Edu+David */}
        <div className="flex items-center justify-center min-w-0 px-1">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={async () => {
              if (sessionId) {
                await leaveSession();
              } else if (partnerListening) {
                await joinPendingSession();
              } else {
                setLikeToast("NADIE ESTÁ ESCUCHANDO");
              }
            }}
            title={sessionId
              ? `Sesión con ${partnerName} · tocar para salir`
              : partnerListening
                ? `${partnerName} está escuchando — tocar para unirte`
                : "Nadie escuchando"}
            aria-label={sessionId ? "Salir de sesión compartida" : "Iniciar escucha compartida"}
            className="relative flex items-center justify-center gap-1 text-xs font-bold h-11 overflow-visible"
            style={{
              minWidth: sessionId ? 56 : 48,
              paddingLeft: sessionId ? 8 : 6,
              paddingRight: sessionId ? 8 : 6,
              borderRadius: 2,
              background: sessionId
                ? withAlpha("#ff2d55", 0.18)
                : partnerListening
                  ? withAlpha(partnerColor, 0.15)
                  : "transparent",
              border: `1px solid ${sessionId ? withAlpha("#ff2d55", 0.5) : partnerListening ? withAlpha(partnerColor, 0.5) : withAlpha(accentColor, 0.15)}`,
              boxShadow: sessionId ? `0 0 16px ${withAlpha("#ff2d55", 0.5)}` : partnerListening ? `0 0 10px ${withAlpha(partnerColor, 0.35)}` : "none",
              transition: "min-width 0.2s, padding 0.2s",
            }}
          >
            {/* Ripple ring — sesión activa */}
            {sessionId && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-sm pointer-events-none"
                style={{ border: `1px solid ${withAlpha("#ff2d55", 0.35)}` }}
              />
            )}

            {/* Heart con animaciones visibles */}
            <motion.span
              className="inline-block"
              animate={
                sessionId
                  ? { scale: [1, 1.4, 1] }
                  : partnerListening
                    ? { y: [0, -5, 0] }
                    : {}
              }
              transition={{
                duration: sessionId ? 1 : 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                fontSize: 16,
                lineHeight: 1,
                color: sessionId ? "#ff2d55" : partnerListening ? partnerColor : withAlpha(accentColor, 0.35),
              }}
            >
              <Icon
                name="heart"
                size={16}
                strokeWidth={sessionId ? 2.5 : partnerListening ? 2 : 1.4}
                fill={sessionId || partnerListening ? "currentColor" : "none"}
                decorative
              />
            </motion.span>

            {/* Bocadillo Pokémon "!" con boquilla */}
            {partnerListening && !sessionId && (
              <motion.span
                className="relative inline-flex items-center"
                initial={{ scale: 2.5, opacity: 0 }}
                animate={{ scale: [2.5, 1, 1.4, 0.9, 1.1, 1], opacity: [1, 1, 0.8, 1, 0.9, 1] }}
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
                  }}
                >
                  !
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

            {/* Nombres en sesión activa */}
            {sessionId && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[9px] uppercase tracking-wider leading-none"
                style={{ color: withAlpha("#ff2d55", 0.7) }}
              >
                {userId === "edu" ? "Edu" : "David"}+{partnerName}
              </motion.span>
            )}
          </motion.button>

          {/* Badge partner track flotante */}
          {partnerListening && !sessionId && partnerTrack?.title && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-1.5 text-[8px] truncate max-w-[60px] leading-none"
              style={{ color: withAlpha(partnerColor, 0.6), fontFamily: FONT_MONO }}
            >
              {partnerTrack.title.slice(0, 12)}
            </motion.span>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          {castState !== "unavailable" && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={isCasting ? stopCasting : startCasting}
              disabled={castState === "connecting"}
              title={isCasting ? `Cast: ${castDeviceName || "conectado"} — tocar para desconectar` : "Conectar a Chromecast"}
              aria-label={isCasting ? "Desconectar Chromecast" : "Conectar a Chromecast"}
              className="text-xs tracking-widest uppercase px-3 py-2.5 rounded-sm flex items-center gap-1.5"
              style={{
                color: isCasting ? "#fff" : accentColor,
                background: isCasting ? "#4285f4" : withAlpha(accentColor, 0.08),
                border: `1px solid ${isCasting ? "#4285f4" : withAlpha(accentColor, 0.2)}`,
                fontFamily: FONT_MONO,
              }}
            >
              {castState === "connecting" ? (
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><Icon name="circle" size={12} decorative /></motion.span>
              ) : (
                <span><Icon name={isCasting ? "pause" : "target"} size={13} decorative /></span>
              )}
              <span>{isCasting ? (castDeviceName ?? "CAST") : "CAST"}</span>
            </motion.button>
          )}
          <span className="text-xs tracking-widest uppercase px-2 py-0.5 rounded-sm"
            style={{ color: accentColor, background: withAlpha(accentColor, 0.08), border: `1px solid ${withAlpha(accentColor, 0.2)}` }}>
            <UserGlyph glyph={vibeConf?.icon} size={13} label={vibeConf?.label} /> {vibeConf?.label}
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
            className="px-3 py-2.5 underline" style={{ color: accentColor }}>
            Deshacer
          </button>
          <span className="opacity-40 ml-2" style={{ color: accentColor }}>eliminado de la cola</span>
        </motion.div>
      )}
          {/* FASE B: Visualizer con carátula como capa base (decisión 1, OPCIÓN B) */}
          <div className="relative px-3 pt-3 pb-1" style={{ background: "#0a0a0a" }}>
            {/* Carátula de fondo o fallback vibe */}
            {(() => {
              const thumbUrl = track?.thumbnail
                ? (track.thumbnail.startsWith("http") ? track.thumbnail : `${import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev"}/${track.thumbnail}`)
                : null;
              if (thumbUrl) {
                return (
                  <>
                    <img src={thumbUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.55 }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.85) 25%, rgba(10,10,10,0.4) 60%, rgba(10,10,10,0.15) 100%)" }} />
                  </>
                );
              }
              return (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at center, ${accentColor}10, transparent 70%)` }}>
                  <span style={{ color: accentColor, opacity: 0.08, fontSize: 72, textShadow: `0 0 60px ${accentColor}22` }}>
                    <UserGlyph glyph={vibeConf?.icon} size={72} label={vibeConf?.label} />
                  </span>
                </div>
              );
            })()}
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
            {track ? `${track.title} — ${track.artist}` : "SELECT A TRACK"}
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
          <div className="relative flex-1 h-4 py-2 group cursor-pointer" onClick={(e) => {
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

          {/* FASE B: Cola peek — "A CONTINUACIÓN" (decisión 3, OPCIÓN A) */}
          {peekNextTrack && (
            <div
              className="px-3 pb-1 text-xs opacity-50 truncate cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: accentColor, fontSize: 10, letterSpacing: "0.12em" }}
              onClick={() => window.dispatchEvent(new CustomEvent("bunker_swipe_up_queue"))}
            >
              A CONTINUACIÓN: {peekNextTrack.title} — {peekNextTrack.artist}
            </div>
          )}

          {/* PLIEGO-237 FASE B — Fila 1: transporte primario + like, siempre visible, sin scroll (Fable S145) */}
      <div className="flex items-center justify-center gap-2.5 px-3 pt-3"
        style={{ background: "#0a0a0a", borderTop: `1px solid ${withAlpha(accentColor, 0.13)}` }}>
        <WinampBtn
          label={<Icon name="heart" size={16} decorative />}
          active={liked}
          color={"#ff2d55"}
          onClick={() => { const next = !liked; setLiked(next); setLikeToast(next ? "AÑADIDO A FAVORITOS" : "QUITADO DE FAVORITOS"); }}
          title={liked ? "Quitar de favoritos" : "Añadir a favoritos"}
          aria-label={liked ? "Quitar de favoritos" : "Añadir a favoritos"}
        />
        <WinampBtn label={<Icon name="arrowLeft" size={16} decorative />} color={accentColor} onClick={() => skipDir(-1)} title="Prev" aria-label="Anterior" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
          className="rounded-sm flex items-center justify-center text-lg font-bold transition-all"
          style={{ width: 52, height: 52, background: withAlpha(accentColor, 0.13), border: `2px solid ${withAlpha(accentColor, 0.4)}`, color: accentColor,
            boxShadow: playing ? `0 0 16px ${withAlpha(accentColor, 0.33)}` : "none", textShadow: `0 0 8px ${withAlpha(accentColor, 0.8)}` }}
          aria-label={playing ? "Pausar" : "Reproducir"}>
          {playing ? <Pause size={20} color={accentColor} strokeWidth={2.5} /> : <Play size={20} color={accentColor} strokeWidth={2.5} fill={accentColor} />}
        </motion.button>
        <WinampBtn label={<Icon name="arrowRight" size={16} decorative />} color={accentColor} onClick={() => skipDir(1)} title="Next" aria-label="Siguiente" />
        {track && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => addToQueue?.(track)}
            title="Añadir a cola"
            aria-label="Añadir a cola"
            className="rounded-sm flex items-center justify-center transition-all min-w-[44px] min-h-[44px] w-11 h-11"
            style={{
              background: "transparent",
              border: `1px solid ${withAlpha(accentColor, 0.18)}`,
              color: withAlpha(accentColor, 0.5),
            }}
          >
            <ListPlus size={17} color={accentColor} strokeWidth={2} />
          </motion.button>
        )}
      </div>

      {/* PLIEGO-237 FASE B — Fila 2: secundarios (loop/shuffle/drop) + volumen en popover (Fable S145).
          Volumen ya no ocupa un slider fijo en la fila: Android gobierna volumen por botones físicos
          (BUG-22, evento volumechange). El popover cubre el caso de que eso falle en algún dispositivo. */}
      <div className="relative flex items-center justify-center gap-2 px-3 pb-3 pt-2">
        <WinampBtn
          size="sm"
          label={<Icon name="refresh" size={14} decorative />}
          active={loopMode !== "off"}
          color={accentColor}
          onClick={toggleLoopMode}
          title={loopMode === "off" ? "Loop: off" : loopMode === "list" ? "Loop: lista" : "Loop: track"}
          aria-label={loopMode === "off" ? "Loop: off" : loopMode === "list" ? "Loop: lista" : "Loop: track"}
        />
        <WinampBtn size="sm" label={<Icon name="shuffle" size={14} decorative />} active={shuffle} color={accentColor} onClick={() => setShuffle((p) => !p)} title="Shuffle" aria-label="Shuffle" />
        {track && (
          <WinampBtn size="sm" label={<Icon name="zap" size={14} decorative />} color={PURPLE} fullColor onClick={() => setShowDrop(true)} title="Lanzar drop" aria-label="Lanzar drop" />
        )}
        <WinampBtn size="sm" label={<Icon name="music" size={14} decorative />} active={showVolume} color={accentColor} onClick={() => setShowVolume((p) => !p)} title="Volumen" aria-label="Volumen" />

        <AnimatePresence>
          {showVolume && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setShowVolume(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute bottom-full right-3 mb-2 px-3 py-2.5 rounded-sm flex items-center gap-2 z-20"
                style={{ background: "#0a0a0a", border: `1px solid ${withAlpha(accentColor, 0.3)}`, boxShadow: `0 0 16px ${withAlpha(accentColor, 0.2)}` }}
              >
                <Icon name="music" size={13} decorative />
                <input type="range" min={0} max={100} value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="w-24 h-1.5 appearance-none cursor-pointer rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accentColor} ${volume}%, ${accentColor}10 ${volume}%)`, accentColor }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* PLIEGO-230: LANZAR DROP movido a la botonera central (entre avance y añadir).
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