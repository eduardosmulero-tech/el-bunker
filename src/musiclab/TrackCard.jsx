import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE } from "../layout/Layout";

const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

const extractYouTubeId = (url) => {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export const VibeTagBar = ({ activeVibe, onVibeChange, VIBE_TAGS, onOpenTagManager, isTagManagerOpen }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
    <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", touchAction: "pan-x", width: 0 }}>
      {VIBE_TAGS.map((vibe) => {
        const isActive = activeVibe === vibe.id;
        return (
          <motion.button key={vibe.id} whileTap={{ scale: 0.9 }} onClick={() => onVibeChange(vibe.id)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1 text-xs tracking-widest uppercase rounded-sm transition-all"
            style={{
              fontFamily: FONT_MONO,
              color: isActive ? vibe.color : `${vibe.color}55`,
              background: isActive ? `${vibe.color}18` : "transparent",
              border: `1px solid ${isActive ? vibe.color + "55" : vibe.color + "18"}`,
              boxShadow: isActive ? `0 0 10px ${vibe.color}33` : "none",
              textShadow: isActive ? `0 0 6px ${vibe.color}88` : "none",
            }}
            animate={isActive ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          >
            <span>{vibe.icon}</span>
            <span>{vibe.label}</span>
          </motion.button>
        );
      })}
    </div>
    {onOpenTagManager && (
      <>
        <div style={{ width: 1, alignSelf: "stretch", background: `${ACID}18`, flexShrink: 0 }} />
        <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenTagManager}
          className="flex-shrink-0 flex items-center justify-center w-8 h-7 rounded-sm transition-all"
          style={{
            fontFamily: FONT_MONO, fontSize: 13,
            color: isTagManagerOpen ? ACID : `${ACID}44`,
            background: isTagManagerOpen ? `${ACID}15` : "transparent",
            border: `1px solid ${isTagManagerOpen ? ACID + "55" : ACID + "18"}`,
            boxShadow: isTagManagerOpen ? `0 0 8px ${ACID}33` : "none",
          }}>
          ⚙
        </motion.button>
      </>
    )}
  </div>
);

export const TrackCard = ({ track, isActive, onClick, onDrop, onAddToPlaylist, onAddToQueue, onAddNext, vibeConfig }) => {
  const vibe = vibeConfig;
  const ytId = extractYouTubeId(track.url ?? "");
  const pressTimer = useRef(null);
  const [showCtx, setShowCtx] = useState(false);

  const handleTouchStart = () => { pressTimer.current = setTimeout(() => setShowCtx(true), 500); };
  const handleTouchEnd   = () => { clearTimeout(pressTimer.current); };

  return (
    <>
      <AnimatePresence>
        {showCtx && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowCtx(false)}
          >
            <motion.div
              style={{ background: "#0a0a0a", border: `1px solid ${ACID}33`, borderRadius: 2,
                padding: "8px 0", minWidth: 220, fontFamily: FONT_MONO }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "8px 16px 12px", borderBottom: `1px solid ${ACID}15`,
                color: ACID, fontSize: 11, letterSpacing: "0.2em", opacity: 0.6 }}>
                {track.title}
              </div>
              <button style={{ display: "block", width: "100%", padding: "10px 16px",
                textAlign: "left", color: ACID, fontSize: 11, letterSpacing: "0.2em",
                background: "transparent", border: "none", cursor: "pointer" }}
                onClick={() => { onAddToQueue?.(track); setShowCtx(false); }}>
                ◈ AÑADIR A COLA
              </button>
              <button style={{ display: "block", width: "100%", padding: "10px 16px",
                textAlign: "left", color: ACID, fontSize: 11, letterSpacing: "0.2em",
                background: "transparent", border: "none", cursor: "pointer" }}
                onClick={() => { onAddNext?.(track); setShowCtx(false); }}>
                ▷ REPRODUCIR A CONTINUACIÓN
              </button>
              <button style={{ display: "block", width: "100%", padding: "10px 16px",
                textAlign: "left", color: ACID, fontSize: 11, letterSpacing: "0.2em",
                background: "transparent", border: "none", cursor: "pointer" }}
                onClick={() => { onAddToPlaylist?.(track); setShowCtx(false); }}>
                ◎ AÑADIR A PLAYLIST
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }} whileTap={{ scale: 0.98 }} onClick={onClick}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); setShowCtx(true); }}
        className="relative flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all"
        style={{
          background: isActive ? `${vibe?.color ?? ACID}10` : `${vibe?.color ?? ACID}06`,
          border: `1px solid ${isActive ? (vibe?.color ?? ACID) + "44" : (vibe?.color ?? ACID) + "18"}`,
          boxShadow: isActive ? `0 0 16px ${vibe?.color ?? ACID}22` : "none",
          fontFamily: FONT_MONO,
        }}
      >
        {isActive && (
          <motion.div className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: vibe?.color ?? ACID, boxShadow: `0 0 8px ${vibe?.color ?? ACID}` }}
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }} />
        )}
        <div className="w-10 h-10 flex-shrink-0 rounded-sm flex items-center justify-center text-base overflow-hidden"
          style={{ background: isActive ? `${vibe?.color ?? ACID}18` : `${ACID}08`,
            border: `1px solid ${isActive ? (vibe?.color ?? ACID) + "44" : GLASS_BORDER}` }}>
          {ytId ? (
            <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt=""
              className="w-full h-full object-cover opacity-70" />
          ) : (
            <span style={{ color: isActive ? vibe?.color ?? ACID : `${ACID}44` }}>
              {isActive ? "◉" : "◎"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate"
            style={{ color: isActive ? vibe?.color ?? ACID : vibe?.color ?? ACID,
              opacity: isActive ? 1 : 0.55,
              textShadow: isActive ? `0 0 8px ${vibe?.color ?? ACID}88` : "none" }}>
            {track.title}
          </p>
          <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>{track.artist}</p>
          {track.note && (
            <p className="text-xs opacity-25 truncate mt-0.5 italic" style={{ color: ACID }}>{track.note}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs px-1.5 py-0.5 rounded-sm"
            style={{ color: vibe?.color ?? ACID, background: `${vibe?.color ?? ACID}15`,
              border: `1px solid ${vibe?.color ?? ACID}33` }}>
            {vibe?.icon}
          </span>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); onDrop?.(track); }}
            className="text-xs px-1.5 py-0.5 rounded-sm opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: PURPLE, background: `${PURPLE}11`, border: `1px solid ${PURPLE}22` }}
            title="Lanzar Drop">
            ⚡
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};