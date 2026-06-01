import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE } from "../layout/Layout";

const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

const extractYouTubeId = (url) => {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export const VibeTagBar = ({ activeVibe, onVibeChange, VIBE_TAGS, onOpenTagManager, isTagManagerOpen, accentColor = ACID }) => (
  <div style={{ position: "relative", width: "100%", minWidth: 0, paddingBottom: 8 }}>
    <div style={{
      display: "flex", gap: 8,
      overflowX: "auto", paddingBottom: 6, paddingTop: 4,
      scrollbarWidth: "none", touchAction: "pan-x",
      paddingRight: onOpenTagManager ? 44 : 0,
      paddingLeft: 4,
    }}>
      {VIBE_TAGS.map((vibe) => {
        const isActive = activeVibe === vibe.id;
        return (
          <button key={vibe.id} onClick={() => onVibeChange(vibe.id)}
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
              padding: "4px 12px", fontSize: 11, letterSpacing: "0.1em",
              textTransform: "uppercase", borderRadius: 2, transition: "all 0.15s",
              fontFamily: FONT_MONO, cursor: "pointer", border: "none",
              color: isActive ? vibe.color : `${vibe.color}55`,
              background: isActive ? `${vibe.color}18` : "transparent",
              outline: `1px solid ${isActive ? vibe.color + "55" : vibe.color + "18"}`,
              boxShadow: isActive ? `0 0 10px ${vibe.color}33` : "none",
              textShadow: isActive ? `0 0 6px ${vibe.color}88` : "none",
              animation: isActive ? "vibe-pulse 2s ease-in-out infinite" : "none",
            }}
          >
            <span>{vibe.icon}</span>
            <span>{vibe.label}</span>
          </button>
        );
      })}
    </div>
    {onOpenTagManager && (
      <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenTagManager}
        style={{
          position: "absolute", right: 0, top: 4,
          width: 32, padding: "4px 0",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 2, fontFamily: FONT_MONO, fontSize: 11,
          color: isTagManagerOpen ? accentColor : `${accentColor}99`,
          background: isTagManagerOpen ? `${accentColor}20` : "#0a0a0a",
          border: `1px solid ${isTagManagerOpen ? accentColor + "66" : accentColor + "33"}`,
          boxShadow: isTagManagerOpen ? `0 0 10px ${accentColor}44` : `0 0 4px ${accentColor}22`,
        }}>
        ⚙
      </motion.button>
    )}
  </div>
);

export const TrackCardGrid = ({ track, vc, vibeColor, isActive, ytId, onClick, onAddToQueue, onAddNext, onAddToPlaylist }) => {
  const [showCtx, setShowCtx] = useState(false);
  const vibe = vc ?? null;
  const FONT_MONO_LOCAL = "'JetBrains Mono', 'Courier New', monospace";
  return (
    <>
      <AnimatePresence>
        {showCtx && createPortal(
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowCtx(false)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }}
              exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                background: "#0f0f0f", borderTop: `1px solid ${vibeColor}33`,
                borderRadius: "6px 6px 0 0", paddingBottom: "env(safe-area-inset-bottom, 16px)",
                fontFamily: FONT_MONO_LOCAL }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "14px 20px 10px", borderBottom: `1px solid ${vibeColor}15`,
                display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: vibeColor, fontSize: 13 }}>{vibe?.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: vibeColor, fontSize: 11, letterSpacing: "0.2em",
                    fontWeight: "bold", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {track.title}
                  </p>
                  <p style={{ color: `${vibeColor}66`, fontSize: 10, letterSpacing: "0.15em",
                    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {track.artist}
                  </p>
                </div>
              </div>
              {[
                { icon: "▷", label: "REPRODUCIR A CONTINUACIÓN", action: () => { onAddNext?.(track); setShowCtx(false); } },
                { icon: "◈", label: "AÑADIR A COLA",             action: () => { onAddToQueue?.(track); setShowCtx(false); } },
                { icon: "◎", label: "AÑADIR A PLAYLIST",         action: () => { onAddToPlaylist?.(track); setShowCtx(false); } },
              ].map(({ icon, label, action }) => (
                <button key={label}
                  style={{ display: "flex", alignItems: "center", gap: 14, width: "100%",
                    padding: "14px 20px", textAlign: "left", color: vibeColor, fontSize: 12,
                    letterSpacing: "0.2em", background: "transparent", border: "none",
                    cursor: "pointer", fontFamily: FONT_MONO_LOCAL, borderBottom: `1px solid ${vibeColor}10` }}
                  onClick={action}>
                  <span style={{ opacity: 0.6, fontSize: 14, width: 18, textAlign: "center" }}>{icon}</span>
                  {label}
                </button>
              ))}
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
      <div style={{ position: "relative" }}>
        <motion.div whileTap={{ scale: 0.97 }} onClick={onClick}
          style={{
            position: "relative", aspectRatio: "1", borderRadius: 4,
            overflow: "hidden", cursor: "pointer",
            border: `1px solid ${isActive ? vibeColor + "88" : vibeColor + "44"}`,
            boxShadow: isActive ? `0 0 14px ${vibeColor}44` : "none",
            background: ytId ? "transparent" : `${vibeColor}18`,
            fontFamily: FONT_MONO_LOCAL,
          }}>
          {ytId ? (
            <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 28, color: `${vibeColor}44`, fontFamily: FONT_MONO_LOCAL }}>
              {(track.artist ?? "?").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.1) 100%)" }} />
          <span style={{ position: "absolute", top: 6, left: 7,
            fontSize: 14, color: `${vibeColor}ee`,
            textShadow: `0 0 10px ${vibeColor}cc`, lineHeight: 1 }}>
            {vibe?.icon}
          </span>
          {isActive && (
            <motion.div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: vibeColor, boxShadow: `0 0 8px ${vibeColor}` }}
              animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }} />
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 8px" }}>
            <p style={{ color: "#fff", fontSize: 10, fontWeight: "bold",
              letterSpacing: "0.08em", margin: 0, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              {track.title}
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9,
              letterSpacing: "0.06em", margin: 0, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {track.artist}
            </p>
          </div>
        </motion.div>
        <motion.button whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); setShowCtx(true); }}
          style={{ position: "absolute", top: 4, right: 4,
            color: `${vibeColor}cc`, background: "rgba(0,0,0,0.55)",
            border: `1px solid ${vibeColor}55`, cursor: "pointer", fontSize: 18,
            lineHeight: 1, padding: "6px 8px", borderRadius: 2,
            fontFamily: FONT_MONO_LOCAL, minWidth: 32, minHeight: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2 }}>
          ⋮
        </motion.button>
      </div>
    </>
  );
};

export const TrackCard = ({ track, isActive, onClick, onDrop, onAddToPlaylist, onAddToQueue, onAddNext, vibeConfig, viewMode = "list" }) => {
  // Si no hay vibeConfig (tag legacy o desconocido), usar neutro gris — nunca ACID
  const vibe = vibeConfig ?? null;
  const vibeColor = vibe?.color ?? "#555555";
  const ytId = extractYouTubeId(track.url ?? "");
  const [showCtx, setShowCtx] = useState(false);

  return (
    <>
      {showCtx && createPortal(
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCtx(false)}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#0f0f0f", borderTop: `1px solid ${vibeColor}33`,
              borderRadius: "6px 6px 0 0", paddingBottom: "env(safe-area-inset-bottom, 16px)",
              fontFamily: FONT_MONO }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "14px 20px 10px", borderBottom: `1px solid ${vibeColor}15`,
              display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: vibeColor, fontSize: 13 }}>{vibe?.icon}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: vibeColor, fontSize: 11, letterSpacing: "0.2em",
                  fontWeight: "bold", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.title}
                </p>
                <p style={{ color: `${vibeColor}66`, fontSize: 10, letterSpacing: "0.15em",
                  margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.artist}
                </p>
              </div>
            </div>
            {[
              { icon: "▷", label: "REPRODUCIR A CONTINUACIÓN", action: () => { onAddNext?.(track); setShowCtx(false); } },
              { icon: "◈", label: "AÑADIR A COLA",             action: () => { onAddToQueue?.(track); setShowCtx(false); } },
              { icon: "◎", label: "AÑADIR A PLAYLIST",         action: () => { onAddToPlaylist?.(track); setShowCtx(false); } },
            ].map(({ icon, label, action }) => (
              <button key={label}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%",
                  padding: "14px 20px", textAlign: "left", color: vibeColor, fontSize: 12,
                  letterSpacing: "0.2em", background: "transparent", border: "none",
                  cursor: "pointer", fontFamily: FONT_MONO, borderBottom: `1px solid ${vibeColor}10` }}
                onClick={action}>
                <span style={{ opacity: 0.6, fontSize: 14, width: 18, textAlign: "center" }}>{icon}</span>
                {label}
              </button>
            ))}
          </motion.div>
        </motion.div>,
        document.body
      )}
      {viewMode === "card" ? (
        <motion.div layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }} whileTap={{ scale: 0.98 }} onClick={onClick}
          style={{
            position: "relative", display: "flex", alignItems: "stretch", gap: 12,
            padding: 10, borderRadius: 4, cursor: "pointer",
            background: isActive ? `${vibeColor}18` : `${vibeColor}0e`,
            border: `1px solid ${isActive ? vibeColor + "66" : vibeColor + "33"}`,
            boxShadow: isActive ? `0 0 18px ${vibeColor}33` : "none",
            fontFamily: FONT_MONO,
          }}
        >
          {isActive && (
            <motion.div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
              background: vibeColor, boxShadow: `0 0 8px ${vibeColor}`, borderRadius: "4px 0 0 4px" }}
              animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }} />
          )}
          <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 3, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isActive ? `${vibeColor}18` : `${vibeColor}08`,
            border: `1px solid ${isActive ? vibeColor + "44" : vibeColor + "22"}` }}>
            {ytId ? (
              <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
            ) : (
              <span style={{ color: isActive ? vibeColor : `${vibeColor}44`, fontSize: 20 }}>
                {isActive ? "◉" : "◎"}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
            <p style={{ color: vibeColor, fontSize: 12, fontWeight: "bold", margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              opacity: isActive ? 1 : 0.85,
              textShadow: isActive ? `0 0 8px ${vibeColor}88` : "none" }}>
              {track.title}
            </p>
            <p style={{ color: vibeColor, fontSize: 10, opacity: 0.45, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {track.artist}
            </p>
            {track.note && (
              <p style={{ color: vibeColor, fontSize: 10, opacity: 0.3, margin: 0,
                fontStyle: "italic", whiteSpace: "normal", lineHeight: 1.4 }}>
                {track.note}
              </p>
            )}
            {track.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                {track.tags.map((t) => (
                  <span key={t} style={{ fontSize: 9, letterSpacing: "0.08em", padding: "1px 6px",
                    borderRadius: 2, color: `${vibeColor}88`,
                    border: `1px solid ${vibeColor}22`, background: `${vibeColor}08` }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ color: `${vibeColor}ee`, fontSize: 28,
              textShadow: `0 0 16px ${vibeColor}dd`, lineHeight: 1 }}>
              {vibe?.icon}
            </span>
            <motion.button whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); setShowCtx(true); }}
              style={{ color: `${vibeColor}cc`, background: "transparent", border: "none",
                cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 2px",
                fontFamily: FONT_MONO }}
              title="Más opciones">
              ⋮
            </motion.button>
          </div>
        </motion.div>
      ) : (
      <motion.div layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }} whileTap={{ scale: 0.98 }} onClick={onClick}
        className="relative flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all"
        style={{
          background: isActive ? `${vibeColor}18` : `${vibeColor}0e`,
          border: `1px solid ${isActive ? vibeColor + "66" : vibeColor + "33"}`,
          boxShadow: isActive ? `0 0 16px ${vibeColor}33` : "none",
          fontFamily: FONT_MONO,
        }}
      >
        {isActive && (
          <motion.div className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{ background: vibeColor, boxShadow: `0 0 8px ${vibeColor}` }}
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }} />
        )}
        <div className="w-10 h-10 flex-shrink-0 rounded-sm flex items-center justify-center text-base overflow-hidden"
          style={{ background: isActive ? `${vibeColor}18` : `${vibeColor}08`,
            border: `1px solid ${isActive ? vibeColor + "44" : vibeColor + "22"}` }}>
          {ytId ? (
            <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} alt=""
              className="w-full h-full object-cover opacity-70" />
          ) : (
            <span style={{ color: isActive ? vibeColor : `${vibeColor}55` }}>
              {isActive ? "◉" : "◎"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate"
            style={{ color: vibeColor,
              opacity: isActive ? 1 : 0.75,
              textShadow: isActive ? `0 0 8px ${vibeColor}88` : "none" }}>
            {track.title}
          </p>
          <p className="text-xs opacity-40 truncate" style={{ color: vibeColor }}>{track.artist}</p>
          {track.note && (
            <p className="text-xs opacity-25 truncate mt-0.5 italic" style={{ color: vibeColor }}>{track.note}</p>
          )}
        </div>
        <div className="flex flex-row items-center gap-2 flex-shrink-0">
          <span style={{
            color: `${vibeColor}ee`, fontSize: 24,
            textShadow: `0 0 14px ${vibeColor}cc`,
            lineHeight: "normal",
          }}>
            {vibe?.icon}
          </span>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); setShowCtx(true); }}
            style={{ color: `${vibeColor}cc`, background: "transparent", border: "none",
              cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 2px",
              fontFamily: FONT_MONO }}
            title="Más opciones">
            ⋮
          </motion.button>
        </div>
      </motion.div>
      )}
    </>
  );
};