import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE } from "./Layout";

const PURPLE_BG     = "rgba(191,0,255,0.04)";
const PURPLE_BORDER = "rgba(191,0,255,0.2)";
const FONT_MONO     = "'JetBrains Mono', 'Courier New', monospace";

export const DropComposeModal = ({ track, onClose, onSend }) => {
  const [message, setMessage] = useState("");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(5,5,5,0.92)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative w-full max-w-xs p-5 rounded-sm"
        style={{ background: `linear-gradient(145deg, #0e0e0e 0%, #130013 100%)`,
          border: `1px solid ${PURPLE}55`, boxShadow: `0 0 40px ${PURPLE}44, inset 0 0 20px ${PURPLE}08`,
          fontFamily: FONT_MONO }}
        onClick={(e) => e.stopPropagation()}>
        <p className="text-xs tracking-[0.35em] uppercase font-bold mb-1"
          style={{ color: PURPLE, textShadow: `0 0 12px ${PURPLE}` }}>⚡ THE DROP</p>
        <p className="text-xs opacity-50 mb-4" style={{ color: PURPLE }}>Lanza esta canción a tu persona</p>
        <div className="flex items-center gap-3 p-3 mb-4 rounded-sm"
          style={{ background: `${PURPLE}10`, border: `1px solid ${PURPLE}22` }}>
          <span style={{ color: PURPLE, fontSize: 20 }}>◉</span>
          <div>
            <p className="text-xs font-bold" style={{ color: PURPLE }}>{track?.title}</p>
            <p className="text-xs opacity-50" style={{ color: PURPLE }}>{track?.artist}</p>
          </div>
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe algo... ¿por qué le mandas esta canción?"
          rows={3} className="w-full p-3 text-xs rounded-sm resize-none"
          style={{ background: "rgba(191,0,255,0.06)", border: `1px solid ${PURPLE}33`,
            color: PURPLE, fontFamily: FONT_MONO, outline: "none", caretColor: PURPLE }} />
        <div className="flex gap-2 mt-3">
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => onSend({ track_id: track?.id, memory: message, mood: track?.vibe ?? "all", date: new Date().toISOString() })}
            className="flex-1 py-2.5 text-xs tracking-widest uppercase font-bold rounded-sm"
            style={{ background: `${PURPLE}22`, border: `1px solid ${PURPLE}66`, color: PURPLE,
              textShadow: `0 0 10px ${PURPLE}`, boxShadow: `0 0 20px ${PURPLE}33` }}>
            ⚡ DROP IT
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
            className="px-4 py-2.5 text-xs rounded-sm opacity-40 hover:opacity-70"
            style={{ color: PURPLE, border: `1px solid ${PURPLE}22` }}>✕</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const DropAlertModal = ({ drop, tracks, onPlay, onDismiss }) => {
  const track = tracks.find((t) => t.id === drop?.track_id);
  return (
    <AnimatePresence>
      {drop && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}>
          <motion.div className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0, 0.25, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ background: `radial-gradient(ellipse at 50% 50%, ${PURPLE}55 0%, transparent 70%)` }} />
          <motion.div initial={{ scale: 0.7, rotate: -3, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.7, rotate: 3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-full max-w-sm rounded-sm overflow-hidden"
            style={{ background: `linear-gradient(145deg, #0a000f 0%, #180020 50%, #0a000f 100%)`,
              border: `2px solid ${PURPLE}`,
              boxShadow: `0 0 60px ${PURPLE}66, 0 0 120px ${PURPLE}33, inset 0 0 40px ${PURPLE}11`,
              fontFamily: FONT_MONO }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }} />
            <motion.div className="px-5 py-3 flex items-center justify-between"
              style={{ background: `linear-gradient(90deg, ${PURPLE}30 0%, ${PURPLE}10 100%)`,
                borderBottom: `1px solid ${PURPLE}44` }}>
              <div className="flex items-center gap-2">
                <motion.span animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ color: PURPLE, fontSize: 18 }}>⚡</motion.span>
                <span className="text-sm tracking-[0.3em] uppercase font-bold"
                  style={{ color: PURPLE, textShadow: `0 0 16px ${PURPLE}` }}>INCOMING DROP</span>
              </div>
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="text-xs tracking-widest uppercase" style={{ color: PURPLE }}>
                {drop.from ?? "DROP"}
              </motion.span>
            </motion.div>
            {track && (
              <div className="mx-5 mt-5 p-4 rounded-sm flex items-center gap-4"
                style={{ background: `${PURPLE}14`, border: `1px solid ${PURPLE}33`, boxShadow: `0 0 20px ${PURPLE}22` }}>
                <motion.div animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="text-2xl">💿</motion.div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate"
                    style={{ color: PURPLE, textShadow: `0 0 8px ${PURPLE}` }}>{track.title}</p>
                  <p className="text-xs opacity-60 truncate" style={{ color: PURPLE }}>{track.artist}</p>
                </div>
              </div>
            )}
            {drop.memory && (
              <div className="px-5 pt-4">
                <p className="text-xs leading-relaxed"
                  style={{ color: `${PURPLE}cc`, textShadow: `0 0 6px ${PURPLE}55`,
                    borderLeft: `2px solid ${PURPLE}44`, paddingLeft: 12, fontStyle: "italic" }}>
                  "{drop.memory}"
                </p>
              </div>
            )}
            <div className="px-5 pt-2 pb-1">
              <p className="text-xs opacity-25 tracking-widest" style={{ color: PURPLE }}>
                {new Date(drop.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="flex gap-3 p-5 pt-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onPlay(track)}
                className="flex-1 py-3 text-xs tracking-[0.25em] uppercase font-bold rounded-sm"
                style={{ background: `linear-gradient(90deg, ${PURPLE}33 0%, ${PURPLE}22 100%)`,
                  border: `2px solid ${PURPLE}`, color: PURPLE,
                  textShadow: `0 0 12px ${PURPLE}`, boxShadow: `0 0 20px ${PURPLE}44` }}
                animate={{ boxShadow: [`0 0 20px ${PURPLE}44`, `0 0 40px ${PURPLE}66`, `0 0 20px ${PURPLE}44`] }}
                transition={{ duration: 2, repeat: Infinity }}>
                ▶ PLAY NOW
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={onDismiss}
                className="px-5 py-3 text-xs tracking-widest uppercase rounded-sm"
                style={{ color: `${PURPLE}66`, border: `1px solid ${PURPLE}22` }}>
                LATER
              </motion.button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DropCard = ({ drop, track, onPlay, onMarkSeen, onSave, onDelete, isSaved }) => (
  <motion.div key={drop.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
    className="flex items-start gap-3 p-3 rounded-sm"
    style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, fontFamily: FONT_MONO }}>
    <span style={{ color: PURPLE, fontSize: 16 }}>⚡</span>
    <div className="flex-1 min-w-0">
      {track && (
        <p className="text-xs font-bold truncate cursor-pointer" style={{ color: PURPLE }}
          onClick={() => { if (!track) return; onMarkSeen?.(drop.id); onPlay(track); }}>
          {track.title} — {track.artist}
        </p>
      )}
      {drop.memory && (
        <p className="text-xs mt-0.5 opacity-60 italic leading-relaxed" style={{ color: PURPLE }}>
          "{drop.memory}"
        </p>
      )}
      <p className="text-xs mt-1 opacity-25 tracking-wider" style={{ color: PURPLE }}>
        {new Date(drop.created_at).toLocaleDateString("es", { day: "2-digit", month: "short" })}
        {" · "}{drop.from ?? "DROP"}
      </p>
    </div>
    <div className="flex flex-col gap-1 flex-shrink-0">
      {onSave && !isSaved && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSave(drop.id)} title="Guardar drop"
          className="w-6 h-6 flex items-center justify-center rounded-sm text-xs"
          style={{ color: PURPLE, border: `1px solid ${PURPLE}44`, background: `${PURPLE}08` }}>★</motion.button>
      )}
      {isSaved && (
        <span className="w-6 h-6 flex items-center justify-center text-xs" style={{ color: PURPLE }}>★</span>
      )}
      {onDelete && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(drop.id)} title="Eliminar drop"
          className="w-6 h-6 flex items-center justify-center rounded-sm text-xs"
          style={{ color: "#ff444488", border: "1px solid #ff444422", background: "#ff444406" }}>✕</motion.button>
      )}
    </div>
  </motion.div>
);

export const DropsHistory = ({ drops, tracks, userId, onPlay, onMarkSeen, onSaveDropSeen, onDeleteDrop }) => {
  // BUG-054: filtrar drops enviados por el propio usuario (solo ver los recibidos)
  const received = drops.filter((d) => d.from !== userId);
  const pending  = received.filter((d) => !d.seen && !d.favorited);
  const saved    = received.filter((d) => d.favorited);

  if (!received.length) return (
    <p className="text-xs opacity-20 tracking-widest text-center py-6 uppercase"
      style={{ color: ACID, fontFamily: FONT_MONO }}>— sin drops recibidos —</p>
  );

  return (
    <div className="flex flex-col gap-4">
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: PURPLE }}>pendientes</span>
          {[...pending].reverse().map((drop) => (
            <DropCard key={drop.id} drop={drop} track={tracks.find((t) => t.id === drop.track_id)}
              onPlay={onPlay} onMarkSeen={onMarkSeen}
              onSave={onSaveDropSeen} onDelete={onDeleteDrop} isSaved={false} />
          ))}
        </div>
      )}
      {saved.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: PURPLE }}>guardados</span>
          {[...saved].reverse().map((drop) => (
            <DropCard key={drop.id} drop={drop} track={tracks.find((t) => t.id === drop.track_id)}
              onPlay={onPlay} onMarkSeen={onMarkSeen}
              onDelete={onDeleteDrop} isSaved={true} />
          ))}
        </div>
      )}
    </div>
  );
};