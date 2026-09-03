// ============================================================
//  EL BÚNKER — MusicLabBigPlayer.jsx
//  Now-playing deck de escritorio. Espeja el único audio del PlayerContext:
//  no crea <audio>, no crea un segundo motor y comparte las mismas acciones
//  que el dock móvil (transporte, drops, sesión, cola, volumen y EQ).
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "../core/PlayerContext";
import { AudioVisualizer } from "./AudioVisualizer";
import { DropComposeModal } from "./DropsManager";
import { DeckQueueHistory } from "./DeckQueueHistory";
import { EQ_FREQUENCIES } from "./eq";
import { Icon, UserGlyph } from "../core/ui";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const fmtTime = (seconds) => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "0:00";
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
};

const alpha = (color, suffix) => {
  if (!color) return "transparent";
  if (color.startsWith("hsl(")) {
    const opacity = Number.parseInt(suffix, 16) / 255;
    return color.replace(/^hsl\((.*)\)$/, `hsla($1, ${opacity})`);
  }
  if (color.startsWith("hsla(")) return color;
  return `${color}${suffix}`;
};

export function MusicLabBigPlayer({ accentColor = "#bfff00", vibeConf, onDropSend }) {
  const {
    activeTrack,
    isPlaying,
    audioRef,
    skip,
    setIsPlaying,
    setMasterVolume,
    masterVolume,
    isMuted,
    toggleMute,
    shuffle,
    setShuffle,
    loopMode,
    toggleLoopMode,
    eqGains,
    setEqGains,
    eqEnabled,
    toggleEq,
    sessionId,
    partnerListening,
    partnerName,
    joinPendingSession,
    leaveSession,
    peekNextTrack,
    localQueue,
    isTrackLiked,
    toggleTrackLike,
    userId,
  } = usePlayer();
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [showDrop, setShowDrop] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showVolumePreview, setShowVolumePreview] = useState(false);
  // Port fastpotify queue.rs/history.rs: cola + historial como panel de primera
  // clase junto al deck. null = cerrado; "queue" | "history" = panel abierto.
  const [sidePanel, setSidePanel] = useState(null);
  const [likeNotice, setLikeNotice] = useState(null);
  const visualizerRef = useRef(null);

  const vibeColor = vibeConf?.palette?.accent ?? vibeConf?.color ?? accentColor;
  const trackId = activeTrack?.id;

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return undefined;
    const sync = () => setTime({ current: audio.currentTime || 0, duration: audio.duration || 0 });
    sync();
    ["timeupdate", "loadedmetadata", "durationchange", "progress"].forEach((event) => audio.addEventListener(event, sync));
    return () => ["timeupdate", "loadedmetadata", "durationchange", "progress"].forEach((event) => audio.removeEventListener(event, sync));
  }, [audioRef, trackId]);

  // t_like-unificado: el estado real vive en PlayerContext — igual que el dock.
  const liked = isTrackLiked?.(trackId) ?? false;
  const toggle = useCallback(() => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying?.(false);
    } else {
      audio.play().then(() => setIsPlaying?.(true)).catch(() => {});
    }
  }, [audioRef, isPlaying, setIsPlaying]);

  const seekTo = useCallback((seconds) => {
    const audio = audioRef?.current;
    const duration = Number(audio?.duration || time.duration);
    if (!audio || !duration) return;
    // audioRef is the intentional escape hatch to the single native audio node.
    // eslint-disable-next-line react-hooks/immutability
    audio.currentTime = Math.min(duration, Math.max(0, Number(seconds) || 0));
  }, [audioRef, time.duration]);

  const seekFromPointer = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    seekTo(((event.clientX - rect.left) / rect.width) * time.duration);
  }, [seekTo, time.duration]);

  const onSeekKeyDown = (event) => {
    const current = audioRef?.current?.currentTime ?? time.current;
    const duration = audioRef?.current?.duration || time.duration;
    const amount = { ArrowLeft: -5, ArrowRight: 5 }[event.key];
    if (amount != null) {
      event.preventDefault();
      event.stopPropagation();
      seekTo(current + amount);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      seekTo(event.key === "Home" ? 0 : Math.max(0, duration - 0.5));
    }
  };

  // t_like-unificado: mismo toggleTrackLike del PlayerContext que el dock —
  // el corazón del deck y el del dock nunca pueden discrepar.
  const notifyLike = () => {
    const next = toggleTrackLike?.(trackId);
    setLikeNotice(next ? "AÑADIDO A FAVORITOS" : "QUITADO DE FAVORITOS");
    window.setTimeout(() => setLikeNotice(null), 1400);
  };

  const cover = activeTrack?.thumbnail || null;
  const progress = time.duration > 0 ? Math.min(100, Math.max(0, (time.current / time.duration) * 100)) : 0;
  const eqSummary = useMemo(() => {
    const active = eqGains?.filter((gain) => gain !== 0).length ?? 0;
    return active ? `${active} BANDAS ACTIVAS` : "FLAT";
  }, [eqGains]);

  if (!activeTrack) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        aria-label="Reproductor grande de MUSIC LAB"
        className="w-full min-w-0 rounded-sm"
        style={{ minHeight: 300, border: `1px solid ${alpha(accentColor, "22")}`, background: "rgba(5,5,5,0.72)", fontFamily: FONT_MONO }}
      >
        <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-3 text-center p-8">
          <div className="w-16 h-16 rounded-sm flex items-center justify-center" style={{ color: accentColor, border: `1px solid ${alpha(accentColor, "44")}`, background: alpha(accentColor, "0d"), boxShadow: `0 0 30px ${alpha(accentColor, "12")}` }}>
            <Icon name="music" size={28} decorative />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: accentColor }}>SELECT A TRACK</p>
          <p className="text-[10px] tracking-widest uppercase opacity-35" style={{ color: accentColor }}>Elige una canción para abrir el deck</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      aria-label="Reproductor grande de MUSIC LAB"
      className="relative w-full min-w-0 overflow-hidden rounded-sm"
      style={{
        fontFamily: FONT_MONO,
        color: accentColor,
        border: `1px solid ${alpha(vibeColor, "55")}`,
        background: `linear-gradient(135deg, ${alpha(vibeColor, "15")} 0%, rgba(7,7,7,0.98) 34%, rgba(12,5,16,0.98) 100%)`,
        boxShadow: `0 0 45px ${alpha(vibeColor, "12")}, inset 0 0 55px rgba(0,0,0,0.55)`,
      }}
    >
      {cover && <img src={cover} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 0.08, filter: "blur(22px) saturate(1.5)" }} />}
      <div className="relative z-10">
        <header className="flex items-center justify-between gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${alpha(vibeColor, "2e")}`, background: `linear-gradient(90deg, ${alpha(vibeColor, "16")}, transparent)` }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full flex-none" style={{ background: isPlaying ? vibeColor : alpha(vibeColor, "66"), boxShadow: isPlaying ? `0 0 12px ${vibeColor}` : "none" }} />
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold">NOW PLAYING</span>
            <span className="text-[9px] tracking-widest uppercase opacity-40">/ MUSIC LAB DECK</span>
          </div>
          <div className="flex items-center gap-2 flex-none">
            {partnerListening && (
              <button type="button" onClick={sessionId ? leaveSession : joinPendingSession} className="min-h-[36px] px-3 rounded-sm text-[9px] tracking-widest uppercase" aria-label={sessionId ? "Salir de sesión compartida" : `Unirse a ${partnerName || "la sesión"}`} style={{ color: sessionId ? "#ff2d55" : "#ffcc00", border: `1px solid ${sessionId ? "#ff2d5555" : "#ffcc0055"}`, background: sessionId ? "#ff2d5515" : "#ffcc0012" }}>
                <Icon name="heart" size={12} decorative /> {sessionId ? "LIVE TOGETHER" : `${partnerName || "PARTNER"} LIVE`}
              </button>
            )}
            <span className="text-[9px] tracking-widest uppercase opacity-50">{isPlaying ? "LIVE" : "PAUSED"}</span>
          </div>
        </header>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(190px,250px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="relative aspect-square w-full max-w-[250px] mx-auto overflow-hidden rounded-sm" style={{ border: `1px solid ${alpha(vibeColor, "66")}`, background: alpha(vibeColor, "12"), boxShadow: `0 0 35px ${alpha(vibeColor, "22")}` }}>
              {cover ? <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="music" size={56} decorative /></div>}
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(145deg, transparent 35%, ${alpha(vibeColor, "44")} 100%)` }} />
              <span className="absolute left-3 bottom-3 text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded-sm" style={{ color: vibeColor, background: "rgba(0,0,0,0.7)", border: `1px solid ${alpha(vibeColor, "55")}` }}>{vibeConf?.label || "MUSIC"}</span>
            </div>
            <div className="mt-3 h-16 rounded-sm overflow-hidden" style={{ border: `1px solid ${alpha(vibeColor, "2e")}`, background: "rgba(0,0,0,0.35)" }}>
              <AudioVisualizer ref={visualizerRef} audioRef={audioRef} isPlaying={isPlaying} accentColor={vibeColor} vibeId={activeTrack.tag ?? activeTrack.vibe ?? null} height={64} />
            </div>
          </div>

          <div className="min-w-0 flex flex-col justify-between gap-5">
            <div className="min-w-0">
              {vibeConf && <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-3 rounded-sm text-[9px] tracking-[0.2em] uppercase" style={{ color: vibeColor, border: `1px solid ${alpha(vibeColor, "44")}`, background: alpha(vibeColor, "12") }}><UserGlyph glyph={vibeConf.icon} size={11} label={vibeConf.label} /> {vibeConf.label}</div>}
              <h2 className="text-2xl font-bold leading-tight" title={activeTrack.title || "Sin título"} style={{ color: accentColor, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere", textShadow: `0 0 18px ${alpha(accentColor, "44")}` }}>{activeTrack.title || "Sin título"}</h2>
              <p className="mt-2 text-sm opacity-55" style={{ color: accentColor, overflowWrap: "anywhere" }}>{activeTrack.artist || "—"}</p>
              {activeTrack.album && <p className="mt-1 text-[10px] tracking-widest uppercase opacity-30" style={{ color: accentColor }}>{activeTrack.album}</p>}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 text-[10px] tabular-nums opacity-65 mb-1" style={{ color: accentColor }}><span>{fmtTime(time.current)}</span><span className="flex-1 h-px" style={{ background: alpha(vibeColor, "28") }} /><span>{fmtTime(time.duration)}</span></div>
              <div className="relative h-5 py-2 rounded-full cursor-pointer group" onClick={seekFromPointer} onKeyDown={onSeekKeyDown} role="slider" tabIndex={0} aria-label="Posición de reproducción" aria-valuemin={0} aria-valuemax={time.duration || 0} aria-valuenow={time.current} aria-valuetext={`${fmtTime(time.current)} de ${fmtTime(time.duration)}`}>
                <div className="absolute inset-x-0 top-2 h-1 rounded-full" style={{ background: alpha(vibeColor, "22") }} />
                <div className="absolute left-0 top-2 h-1 rounded-full" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${vibeColor}99, ${vibeColor})`, boxShadow: `0 0 10px ${alpha(vibeColor, "99")}` }} />
                <span className="absolute top-1 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" style={{ left: `calc(${progress}% - 6px)`, background: vibeColor, boxShadow: `0 0 12px ${vibeColor}` }} />
              </div>

              <div className="flex items-center justify-center gap-2 mt-3">
                <button type="button" onClick={() => skip(-1)} className="deck-control" aria-label="Anterior" title="Anterior" style={{ color: accentColor, borderColor: alpha(accentColor, "44"), background: alpha(accentColor, "0d") }}><Icon name="arrowLeft" size={18} label="Anterior" /></button>
                <button type="button" onClick={toggle} className="deck-control deck-control--primary" aria-label={isPlaying ? "Pausar" : "Reproducir"} style={{ color: vibeColor, borderColor: alpha(vibeColor, "99"), background: alpha(vibeColor, "22"), boxShadow: `0 0 22px ${alpha(vibeColor, "33")}` }}><Icon name={isPlaying ? "pause" : "play"} size={24} label={isPlaying ? "Pausar" : "Reproducir"} /></button>
                <button type="button" onClick={() => skip(1)} className="deck-control" aria-label="Siguiente" title="Siguiente" style={{ color: accentColor, borderColor: alpha(accentColor, "44"), background: alpha(accentColor, "0d") }}><Icon name="arrowRight" size={18} label="Siguiente" /></button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button type="button" onClick={() => setShuffle?.((value) => !value)} aria-pressed={shuffle} className="deck-chip" style={{ color: shuffle ? vibeColor : alpha(accentColor, "88"), borderColor: alpha(shuffle ? vibeColor : accentColor, "44"), background: shuffle ? alpha(vibeColor, "18") : alpha(accentColor, "06") }}><Icon name="shuffle" size={13} decorative /> SHUFFLE</button>
                <button type="button" onClick={toggleLoopMode} aria-label={`Repetición: ${loopMode}`} className="deck-chip" style={{ color: loopMode !== "off" ? vibeColor : alpha(accentColor, "88"), borderColor: alpha(loopMode !== "off" ? vibeColor : accentColor, "44"), background: loopMode !== "off" ? alpha(vibeColor, "18") : alpha(accentColor, "06") }}><Icon name="refresh" size={13} decorative /> {loopMode === "track" ? "LOOP 1" : "LOOP"}</button>
                <button type="button" onClick={notifyLike} aria-pressed={liked} className="deck-chip" style={{ color: liked ? "#ff2d55" : alpha(accentColor, "88"), borderColor: alpha(liked ? "#ff2d55" : accentColor, "44"), background: liked ? "#ff2d5518" : alpha(accentColor, "06") }}><Icon name="heart" size={13} fill={liked ? "currentColor" : "none"} decorative /> {liked ? "LIKED" : "LIKE"}</button>
                <button type="button" onClick={() => setShowDrop(true)} className="deck-chip" style={{ color: "#d966ff", borderColor: "#d966ff55", background: "#d966ff12" }}><Icon name="zap" size={13} decorative /> DROP</button>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 mt-4">
                <label className="relative flex items-center gap-2 min-w-0 px-3 py-2 rounded-sm" style={{ color: accentColor, border: `1px solid ${alpha(accentColor, "22")}`, background: alpha(accentColor, "06") }}>
                  <button type="button" onClick={toggleMute} aria-pressed={isMuted} aria-label={isMuted ? "Quitar silencio" : "Silenciar"} title="Silenciar (M)" className="flex-none"><Icon name={isMuted ? "volumeOff" : "volumeUp"} size={15} decorative /></button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume ?? 80}
                    onChange={(event) => setMasterVolume?.(Number(event.target.value))}
                    onPointerDown={() => setShowVolumePreview(true)}
                    onPointerUp={() => setShowVolumePreview(false)}
                    onBlur={() => setShowVolumePreview(false)}
                    aria-label="Volumen"
                    className="w-full"
                    style={{ accentColor: vibeColor }}
                  />
                  <span className="text-[9px] tabular-nums w-7 text-right opacity-55">{masterVolume ?? 80}</span>
                  {/* Port fastpotify VolumePreview: porcentaje flotante durante el drag */}
                  {showVolumePreview && (
                    <span
                      role="status"
                      aria-live="polite"
                      className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-[11px] tabular-nums rounded-sm pointer-events-none"
                      style={{ color: vibeColor, background: "rgba(0,0,0,0.92)", border: `1px solid ${alpha(vibeColor, "55")}`, boxShadow: `0 0 14px ${alpha(vibeColor, "22")}` }}
                    >
                      {masterVolume ?? 80}%
                    </span>
                  )}
                </label>
              <button type="button" onClick={() => visualizerRef.current?.requestFullscreen()} className="deck-chip" aria-label="Abrir visualizador a pantalla completa" title="Visualizador a pantalla completa" style={{ color: alpha(accentColor, "aa"), borderColor: alpha(accentColor, "44"), background: alpha(accentColor, "06") }}><Icon name="maximize" size={13} decorative /> VISUALIZER</button>
                <button type="button" onClick={() => setShowEq((open) => !open)} aria-expanded={showEq} className="deck-chip" style={{ color: eqEnabled ? vibeColor : alpha(accentColor, "66"), borderColor: alpha(eqEnabled ? vibeColor : accentColor, "55"), background: showEq ? alpha(vibeColor, "18") : alpha(accentColor, "06") }}><Icon name="settings" size={13} decorative /> EQ <span className="opacity-60">{eqSummary}</span></button>
              </div>

              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => setSidePanel(sidePanel === "queue" ? null : "queue")} aria-expanded={sidePanel === "queue"} className="deck-chip flex-1" style={{ color: sidePanel === "queue" ? vibeColor : alpha(accentColor, "88"), borderColor: alpha(sidePanel === "queue" ? vibeColor : accentColor, "44"), background: sidePanel === "queue" ? alpha(vibeColor, "18") : alpha(accentColor, "06") }}><Icon name="menu" size={13} decorative /> COLA{localQueue.length ? ` (${localQueue.length})` : ""}</button>
                <button type="button" onClick={() => setSidePanel(sidePanel === "history" ? null : "history")} aria-expanded={sidePanel === "history"} className="deck-chip flex-1" style={{ color: sidePanel === "history" ? vibeColor : alpha(accentColor, "88"), borderColor: alpha(sidePanel === "history" ? vibeColor : accentColor, "44"), background: sidePanel === "history" ? alpha(vibeColor, "18") : alpha(accentColor, "06") }}><Icon name="clock" size={13} decorative /> HISTORIAL</button>
              </div>

              {peekNextTrack && !sidePanel && <button type="button" onClick={() => setSidePanel("queue")} className="block w-full mt-3 text-left text-[10px] tracking-widest uppercase truncate opacity-55 hover:opacity-100" style={{ color: accentColor }}>A CONTINUACIÓN · {peekNextTrack.title} — {peekNextTrack.artist}</button>}
            </div>
          </div>
        </div>

        {/* Port fastpotify queue.rs/history.rs: panel lateral de cola e historial */}
        <div className="flex justify-end px-5 pb-5">
          <AnimatePresence>
            {sidePanel && (
              <DeckQueueHistory
                accentColor={accentColor}
                mode={sidePanel}
                onClose={() => setSidePanel(null)}
                onJump={() => setSidePanel(null)}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showEq && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mx-5 mb-5 p-4 rounded-sm" style={{ border: `1px solid ${alpha(vibeColor, "44")}`, background: "rgba(0,0,0,0.42)" }}>
            <div className="flex items-center justify-between gap-3 mb-3"><div><span className="text-[10px] tracking-[0.25em] uppercase font-bold">10-BAND EQUALIZER</span><span className="ml-2 text-[9px] opacity-45 uppercase">{eqEnabled ? "ON" : "BYPASS"}</span></div><div className="flex gap-2"><button type="button" onClick={toggleEq} className="deck-chip" style={{ color: eqEnabled ? vibeColor : alpha(accentColor, "66"), borderColor: alpha(vibeColor, "44") }}>{eqEnabled ? "BYPASS" : "ACTIVAR"}</button><button type="button" onClick={() => setEqGains?.(() => EQ_FREQUENCIES.map(() => 0))} className="deck-chip" style={{ color: alpha(accentColor, "88"), borderColor: alpha(accentColor, "33") }}>FLAT</button></div></div>
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-2 items-end">
              {EQ_FREQUENCIES.map((frequency, index) => <label key={frequency} className="flex flex-col items-center gap-1 text-[8px] uppercase opacity-75" style={{ color: vibeColor }}><input type="range" min="-12" max="12" step="1" value={eqGains?.[index] ?? 0} onChange={(event) => setEqGains?.((previous) => previous.map((gain, gainIndex) => gainIndex === index ? Number(event.target.value) : gain))} aria-label={`EQ ${frequency} Hz`} className="h-24" style={{ writingMode: "vertical-lr", direction: "rtl", accentColor: vibeColor }} /><span>{frequency >= 1000 ? `${frequency / 1000}k` : frequency}</span><output>{eqGains?.[index] ?? 0}</output></label>)}
            </div>
          </motion.div>}
        </AnimatePresence>

        {likeNotice && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 text-[10px] tracking-widest uppercase rounded-sm" style={{ color: "#ff2d55", background: "rgba(0,0,0,0.9)", border: "1px solid #ff2d5566" }}>{likeNotice}</div>}
      </div>
      {/* DropComposer del deck — recipientName en minúscula, paridad con el dock */}
      <AnimatePresence>{showDrop && <DropComposeModal track={activeTrack} onClose={() => setShowDrop(false)} currentMinute={time.current} trackDuration={time.duration} recipientName={userId === "edu" ? "david" : "edu"} onSend={(dropData) => { onDropSend?.(dropData); setShowDrop(false); }} />}</AnimatePresence>
    </motion.section>
  );
}

export default MusicLabBigPlayer;
