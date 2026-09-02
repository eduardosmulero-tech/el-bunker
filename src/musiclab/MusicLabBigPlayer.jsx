// ============================================================
//  EL BÚNKER — MusicLabBigPlayer.jsx
//  X-6 (aclaración a ADR-029, 28-ago-2026): el lienzo de MUSIC LAB
//  pinta el reproductor grande — portada grande, visualizador inline
//  del bloque de tres niveles (ADR-029 §6 P4 / ADR-032) y cola lateral.
//  Solo se monta en desktop (≥1280px); el dock permanente sigue siendo
//  el mando de las tres pestañas y no desaparece nunca.
//  🔒 ADR-018: no instancia <audio> — es mando y espejo del estado.
// ============================================================

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePlayer } from "../core/PlayerContext";
import { AudioVisualizer } from "./AudioVisualizer";
import { Icon, UserGlyph } from "../core/ui";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const fmtTime = (s) => {
  if (!s || Number.isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function MusicLabBigPlayer({ accentColor, vibeConf }) {
  const { activeTrack, isPlaying, audioRef, skip, setIsPlaying, setMasterVolume, masterVolume, shuffle, setShuffle, loopMode, toggleLoopMode } = usePlayer();
  const [time, setTime] = useState({ current: 0, duration: 0 });

  // Espejo del progreso: mismos eventos que el dock consume, sin estado propio del audio.
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return undefined;
    const onTime = () => setTime({ current: audio.currentTime || 0, duration: audio.duration || 0 });
    audio.addEventListener("timeupdate", onTime);
    return () => audio.removeEventListener("timeupdate", onTime);
  }, [audioRef, activeTrack?.id]);

  if (!activeTrack) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        aria-label="Reproductor grande de MUSIC LAB"
        className="w-full min-w-0 flex items-center justify-center rounded-sm"
        style={{
          minHeight: 220,
          background: "color-mix(in srgb, var(--vibe-accent, #bfff00) 3%, rgba(5,5,5,0.6))",
          border: `1px solid ${accentColor}22`,
          fontFamily: FONT_MONO,
        }}
      >
        <div className="flex flex-col items-center gap-2 py-10">
          <Icon name="music" size={22} decorative />
          <span className="text-xs tracking-[0.3em] uppercase opacity-50" style={{ color: accentColor }}>
            Sin track activo
          </span>
          <span className="text-[10px] tracking-widest uppercase opacity-30" style={{ color: accentColor }}>
            Elige uno en TRACKS y ocupará este lienzo
          </span>
        </div>
      </motion.section>
    );
  }

  const vibeColor = vibeConf?.palette?.accent ?? vibeConf?.color ?? accentColor;
  const progress = time.duration > 0 ? (time.current / time.duration) * 100 : 0;

  const toggle = () => {
    if (!audioRef?.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying?.(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying?.(true)).catch(() => {});
    }
  };

  const seek = (event) => {
    if (!audioRef?.current || !time.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((event.clientX - rect.left) / rect.width) * time.duration;
  };

  // S-bp-a11y: teclado del slider — ±5s con flechas, Home/End para extremos.
  // Mismo patrón que el slider del dock móvil (WinampPlayer), heredado del
  // audit fastpotify (borde de foco accesible + ARIA completo).
  const seekTeclado = (event) => {
    if (!audioRef?.current || !time.duration) return;
    const paso = { ArrowLeft: -5, ArrowRight: 5 }[event.key];
    if (paso != null) {
      event.preventDefault();
      audioRef.current.currentTime = Math.min(time.duration, Math.max(0, time.current + paso));
    } else if (event.key === "Home") {
      event.preventDefault();
      audioRef.current.currentTime = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      audioRef.current.currentTime = time.duration - 0.5;
    }
  };

  const changeVolume = (event) => {
    // Port fastpotify: la ganancia perceptual (curva + mute) la aplica el
    // efecto centralizado del PlayerContext; aquí solo estado.
    setMasterVolume?.(Number(event.target.value));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-label="Reproductor grande de MUSIC LAB"
      className="w-full min-w-0 grid items-stretch gap-8 rounded-sm"
      style={{
        /* X-6 enmendada: la cola vive en el dock (única); el lienzo es portada + info + mando. */
        gridTemplateColumns: "auto minmax(0, 1fr)",
        background: "color-mix(in srgb, var(--vibe-accent, #bfff00) 4%, rgba(5,5,5,0.6))",
        border: `1px solid ${accentColor}2e`,
        boxShadow: `0 0 32px ${accentColor}0f`,
        padding: 24,
        fontFamily: FONT_MONO,
      }}
    >
      {/* ── Portada grande + visualizador inline (nivel lienzo) ── */}
      <div className="flex flex-col gap-3 min-w-0 w-72">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]" style={{ color: vibeColor, opacity: 0.65 }}>
          <span>NOW PLAYING</span>
          <span>{isPlaying ? "LIVE" : "PAUSED"}</span>
        </div>
        <div
          className="w-72 h-72 rounded-sm overflow-hidden flex items-center justify-center flex-none"
          style={{
            background: `${vibeColor}12`,
            border: `1px solid ${vibeColor}44`,
            boxShadow: `0 0 24px ${vibeColor}22`,
          }}
        >
          {activeTrack.thumbnail
            ? <img src={activeTrack.thumbnail} alt="" className="w-full h-full object-cover" />
            : <Icon name="music" size={64} decorative />}
        </div>
        <div className="w-72 h-20 min-w-0">
          <AudioVisualizer
            audioRef={audioRef}
            isPlaying={isPlaying}
            accentColor={vibeColor}
            vibeId={activeTrack.tag ?? activeTrack.vibe ?? null}
          />
        </div>
      </div>

      {/* ── Info + controles prominentes ── */}
      <div className="flex flex-col justify-between gap-4 min-w-0 py-1">
        <div className="flex flex-col gap-2 min-w-0">
          {vibeConf && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase self-start px-2 py-1 rounded-sm"
              style={{ color: vibeColor, background: `${vibeColor}14`, border: `1px solid ${vibeColor}3d` }}
            >
              <UserGlyph glyph={vibeConf.icon} size={11} label={vibeConf.label} />
              {vibeConf.label}
            </span>
          )}
          <h2
            className="text-xl font-bold leading-tight"
            title={activeTrack.title || "Sin título"}
            style={{
              color: accentColor, overflowWrap: "anywhere", whiteSpace: "normal", textShadow: `0 0 18px ${accentColor}33`,
              // Port fastpotify: título largo se trunca a 2 líneas con ellipsis,
              // el título completo queda en el tooltip nativo
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}
          >
            {activeTrack.title || "Sin título"}
          </h2>
          <p className="text-sm opacity-50" style={{ color: accentColor, overflowWrap: "anywhere", whiteSpace: "normal" }}>
            {activeTrack.artist || "—"}
          </p>
        </div>

        <div className="flex flex-col gap-2 min-w-0">          <div
            className="h-4 rounded-full overflow-hidden cursor-pointer py-1"
            onClick={seek}
            onKeyDown={seekTeclado}
            role="slider"
            aria-label="Posición de reproducción"
            aria-valuemin={0}
            aria-valuemax={time.duration || 0}
            aria-valuenow={time.current}
            tabIndex={0} style={{ background: `${accentColor}14` }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor}cc 0%, ${accentColor} 100%)`, boxShadow: `0 0 8px ${accentColor}88` }}
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShuffle?.((value) => !value)}
              className="min-h-[44px] px-3 flex items-center justify-center rounded-sm text-[10px] uppercase tracking-widest"
              style={{ color: shuffle ? vibeColor : `${accentColor}88`, background: shuffle ? `${vibeColor}18` : `${accentColor}08`, border: `1px solid ${shuffle ? vibeColor : accentColor}30` }}
              aria-pressed={shuffle}
            >
              <Icon name="shuffle" size={15} label="Aleatorio" />
            </button>
            <button
              type="button"
              onClick={toggleLoopMode}
              className="min-h-[44px] px-3 flex items-center justify-center rounded-sm text-[10px] uppercase tracking-widest"
              style={{ color: loopMode !== "off" ? vibeColor : `${accentColor}88`, background: loopMode !== "off" ? `${vibeColor}18` : `${accentColor}08`, border: `1px solid ${loopMode !== "off" ? vibeColor : accentColor}30` }}
              aria-label={`Repetición: ${loopMode}`}
            >
              <Icon name="refresh" size={15} label="Repetir" /> {loopMode === "track" ? "1" : ""}
            </button>
            <div className="flex items-center gap-2 min-h-[44px] px-2 rounded-sm" style={{ border: `1px solid ${accentColor}20`, background: `${accentColor}06` }}>
              <Icon name="music" size={14} decorative />
              <input type="range" min="0" max="100" value={masterVolume ?? 80} onChange={changeVolume} aria-label="Volumen" className="w-20 accent-current" style={{ accentColor: vibeColor }} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => skip(-1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm"
              style={{ color: accentColor, background: `${accentColor}0d`, border: `1px solid ${accentColor}30` }}
              aria-label="Anterior"
            >
              <Icon name="arrowLeft" size={18} label="Anterior" />
            </button>
            <button
              type="button"
              onClick={toggle}
              className="min-h-[56px] min-w-[56px] flex items-center justify-center rounded-sm"
              style={{
                color: accentColor,
                background: `linear-gradient(135deg, ${vibeColor}26 0%, ${vibeColor}0d 100%)`,
                border: `1px solid ${vibeColor}59`,
                boxShadow: `0 0 18px ${vibeColor}2e`,
              }}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              <Icon name={isPlaying ? "pause" : "play"} size={22} label={isPlaying ? "Pausar" : "Reproducir"} />
            </button>
            <button
              type="button"
              onClick={() => skip(1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm"
              style={{ color: accentColor, background: `${accentColor}0d`, border: `1px solid ${accentColor}30` }}
              aria-label="Siguiente"
            >
              <Icon name="arrowRight" size={18} label="Siguiente" />
            </button>
            <span className="text-xs opacity-45 tabular-nums ml-1" style={{ color: accentColor }}>
              {fmtTime(time.current)} / {fmtTime(time.duration)}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default MusicLabBigPlayer;
