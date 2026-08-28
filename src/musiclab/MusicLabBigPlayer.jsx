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
  const { activeTrack, isPlaying, audioRef, skip } = usePlayer();
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
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => { /* reproducción fallida: el dock manda el estado */ });
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
            style={{ color: accentColor, overflowWrap: "anywhere", whiteSpace: "normal", textShadow: `0 0 18px ${accentColor}33` }}
          >
            {activeTrack.title || "Sin título"}
          </h2>
          <p className="text-sm opacity-50" style={{ color: accentColor, overflowWrap: "anywhere", whiteSpace: "normal" }}>
            {activeTrack.artist || "—"}
          </p>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: `${accentColor}14` }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor}cc 0%, ${accentColor} 100%)`, boxShadow: `0 0 8px ${accentColor}88` }}
            />
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
