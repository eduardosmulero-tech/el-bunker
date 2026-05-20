import { useState } from "react";
import { motion } from "framer-motion";
import { ACID } from "./Layout";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

export const PlaylistNameInput = ({ onConfirm }) => {
  const [name, setName] = useState("");
  return (
    <div style={{ padding: "10px 16px", borderTop: `1px solid ${ACID}15`, display: "flex", gap: 8 }}>
      <input value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onConfirm(name); }}
        placeholder="Nueva playlist..."
        style={{ flex: 1, background: "transparent", border: `1px solid ${ACID}33`, borderRadius: 2,
          color: ACID, fontSize: 11, padding: "6px 10px", fontFamily: FONT_MONO,
          letterSpacing: "0.15em", outline: "none" }} />
      <button onClick={() => { if (name.trim()) onConfirm(name); }}
        style={{ background: `${ACID}15`, border: `1px solid ${ACID}44`, color: ACID, fontSize: 11,
          padding: "6px 10px", borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO, letterSpacing: "0.15em" }}>
        OK
      </button>
    </div>
  );
};

export const PlaylistModal = ({ playlists, onSelectPlaylist, onCreatePlaylist, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    onClick={onClose}>
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
      style={{ background: "#0a0a0a", border: `1px solid ${ACID}33`, borderRadius: 2,
        width: "100%", maxWidth: 340, fontFamily: FONT_MONO, overflow: "hidden" }}
      onClick={(e) => e.stopPropagation()}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${ACID}15`,
        color: ACID, fontSize: 11, letterSpacing: "0.25em" }}>
        AÑADIR A PLAYLIST
      </div>
      {playlists.map((pl) => (
        <button key={pl.id}
          style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left",
            color: ACID, fontSize: 11, letterSpacing: "0.2em", background: "transparent",
            border: "none", borderBottom: `1px solid ${ACID}10`, cursor: "pointer" }}
          onClick={() => onSelectPlaylist(pl.id)}>
          ◎ {pl.name}
          <span style={{ opacity: 0.3, marginLeft: 8 }}>[{pl.track_ids.length}]</span>
        </button>
      ))}
      <PlaylistNameInput onConfirm={onCreatePlaylist} />
    </motion.div>
  </motion.div>
);