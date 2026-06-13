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
const WinampBtn = ({ label, onClick, active = false, color = ACID, title, size = "md" }) => (
  <motion.button
    whileTap={{ scale: 0.85 }}
    onClick={onClick}
    title={title}
    className={`rounded-sm flex items-center justify-center text-xs font-bold transition-all ${
      size === "sm" ? "w-7 h-7" : "w-8 h-8"
    }`}
    style={{
      background: active ? withAlpha(color, 0.13) : "transparent",
      border: `1px solid ${active ? withAlpha(color, 0.4) : withAlpha(color, 0.13)}`,
      color: active ? color : withAlpha(color, 0.4),
      boxShadow: active ? `0 0 8px ${withAlpha(color, 0.27)}` : "none",
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
    localQueue: _queue,
    loopMode, toggleLoopMode, shuffle, setShuffle,
    autoPlaySignal, syncStatus,
    audioRef,
    skip,
    masterVolume, setMasterVolume,
    trackVibe,
    vibrate, softDeletedIds, undoRemoveFromQueue,
  } = usePlayer();

  // S78 UX5: Swipe gesture state
  const swipeStartRef = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // S78 UX1: Double-tap detection
  const lastTapRef = useRef(0);
  const DOUBLE_TAP_MS = 300;

  const mountedRef   = useRef(false);
  const currentTRef  = useRef(0);
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

  useEffect(() => {
    // BUG-10: no resetear isPlaying en montaje inicial (desync al volver de pestaña)
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setPlaying(false);
    setProgress(0);
    setCurrentT(0);
    setDuration(0);
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

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };


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
  }, [duration, vibrate]);

  // S78 UX5: Swipe handlers
  const onSwipeStart = useCallback((e) => {
    swipeStartRef.current = e.touches?.[0]?.clientX || e.clientX;
  }, []);
  const onSwipeEnd = useCallback((e) => {
    const startX = swipeStartRef.current;
    if (startX == null) return;
    const endX = e.changedTouches?.[0]?.clientX || e.clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 60) {
      vibrate?.([15]);
      if (diff > 0) skipDir(-1);
      else skipDir(1);
    }
    swipeStartRef.current = null;
    setSwipeOffset(0);
  }, [skipDir, vibrate]);
  const onSwipeMove = useCallback((e) => {
    const startX = swipeStartRef.current;
    if (startX == null) return;
    setSwipeOffset((e.touches?.[0]?.clientX || e.clientX) - startX);
  }, []);

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
  }, [track?.id, track?.era_name, track?.era_id, track?.thumbnail, playing, duration, currentT]);

  return (
    <motion.div
      className="relative rounded-sm overflow-hidden"
      style={{
        background: `linear-gradient(145deg, rgba(10,10,10,0.98) 0%, rgba(20,20,20,0.98) 100%)`,
        border: `1px solid ${withAlpha(accentColor, 0.2)}`,
        boxShadow: `0 0 30px ${withAlpha(accentColor, 0.07)}, inset 0 0 40px rgba(0,0,0,0.6)`,
        fontFamily: FONT_MONO,
        touchAction: "none",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, x: swipeOffset * 0.3 }}
      transition={{ duration: 0.45 }}
      onTouchStart={onSwipeStart}
      onTouchMove={onSwipeMove}
      onTouchEnd={onSwipeEnd}
      onClick={handleDoubleTapSeek}
    >
      {/* <audio> vive en PlayerProvider (ADR-004 Enmienda S21) */}

      {/* Title Bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
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
              className="text-xs" style={{ color: "#ffcc00", marginLeft: 2 }} title="Sincronizando cola...">◌</motion.span>
          )}
          {syncStatus === "error" && (
            <span className="text-xs" style={{ color: "#ff4444" }} title="Error guardando cola">✕</span>
          )}
        </div>
        <div className="flex gap-2">
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

      {/* Visualizer */}
      <div className="px-3 pt-3 pb-1" style={{ background: "rgba(0,0,0,0.4)" }}>
        <AudioVisualizer audioRef={audioRef} isPlaying={playing} accentColor={accentColor} />
      </div>

      {/* Track Info */}
      <div className="px-3 py-2 overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
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

      {/* Controls */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex gap-2">
          <WinampBtn
            label={loopMode === "track" ? "⟳¹" : "⟳"}
            active={loopMode !== "off"}
            color={accentColor}
            onClick={toggleLoopMode}
            title={loopMode === "off" ? "Loop: off" : loopMode === "list" ? "Loop: lista" : "Loop: track"}
          />
          <WinampBtn label="⇄" active={shuffle} color={accentColor} onClick={() => setShuffle((p) => !p)} title="Shuffle" />
        </div>
        <div className="flex items-center gap-3">
          <WinampBtn label="◀◀" color={accentColor} onClick={() => skipDir(-1)} title="Prev" size="sm" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
            className="w-11 h-11 rounded-sm flex items-center justify-center text-lg font-bold transition-all"
            style={{ background: withAlpha(accentColor, 0.13), border: `2px solid ${withAlpha(accentColor, 0.4)}`, color: accentColor,
              boxShadow: playing ? `0 0 16px ${withAlpha(accentColor, 0.33)}` : "none", textShadow: `0 0 8px ${withAlpha(accentColor, 0.8)}` }}>
            {playing ? <Pause size={18} color={accentColor} strokeWidth={2.5} /> : <Play size={18} color={accentColor} strokeWidth={2.5} fill={accentColor} />}
          </motion.button>
          <WinampBtn label="▶▶" color={accentColor} onClick={() => skipDir(1)} title="Next" size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-40" style={{ color: accentColor }}>🔊</span>
          <input type="range" min={0} max={100} value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-14 h-1 appearance-none cursor-pointer rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentColor} ${volume}%, ${accentColor}22 ${volume}%)`, accentColor }} />
        </div>
      </div>

      {/* Drop Button */}
      {track && (
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowDrop(true)}
          className="w-full py-2 text-xs tracking-[0.25em] uppercase font-bold transition-all"
          style={{ background: `linear-gradient(90deg, ${withAlpha(accentColor, 0.13)} 0%, ${withAlpha(accentColor, 0.07)} 100%)`,
            borderTop: `1px solid ${withAlpha(accentColor, 0.2)}`, color: accentColor, textShadow: `0 0 8px ${withAlpha(accentColor, 0.53)}` }}>
          ⚡ LANZAR DROP
        </motion.button>
      )}

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