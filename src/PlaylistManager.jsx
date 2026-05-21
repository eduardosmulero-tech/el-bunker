import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID } from "./Layout";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";
const GLASS_BG  = "rgba(191,255,0,0.03)";

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

// ── PlaylistDetailModal ────────────────────────────────────────────────────────
export const PlaylistDetailModal = ({ playlist, tracks, userId, onClose, onPlay, onAddToQueue, onRemoveTrack, onDeletePlaylist }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!playlist) return null;

  const plTracks = (playlist.track_ids ?? [])
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean);

  const isCreator = playlist.created_by === userId;
  const canDelete = isCreator && plTracks.length === 0;

  const handlePlay = () => {
    if (!plTracks.length) return;
    onPlay(plTracks[0]);
    plTracks.slice(1).forEach((t) => onAddToQueue(t));
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        style={{ background: "#0a0a0a", border: `1px solid ${ACID}33`, borderRadius: 2,
          width: "100%", maxWidth: 360, fontFamily: FONT_MONO, overflow: "hidden", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${ACID}15`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: ACID, fontSize: 12, letterSpacing: "0.25em", fontWeight: "bold" }}>
              ◎ {playlist.name}
            </p>
            <p style={{ color: `${ACID}44`, fontSize: 10, letterSpacing: "0.15em" }}>
              {plTracks.length} track{plTracks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {plTracks.length > 0 && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={handlePlay}
                style={{ background: `${ACID}18`, border: `1px solid ${ACID}44`, color: ACID,
                  fontSize: 11, padding: "5px 12px", borderRadius: 2, cursor: "pointer",
                  fontFamily: FONT_MONO, letterSpacing: "0.2em" }}>
                ▶ PLAY
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              style={{ color: `${ACID}44`, fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>✕</motion.button>
          </div>
        </div>

        {/* Track list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {plTracks.length === 0 ? (
            <p style={{ color: `${ACID}30`, fontSize: 10, letterSpacing: "0.2em", textAlign: "center",
              padding: "24px 16px", textTransform: "uppercase" }}>— sin tracks —</p>
          ) : (
            plTracks.map((track) => (
              <div key={track.id}
                style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 16px", borderBottom: `1px solid ${ACID}08` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: ACID, fontSize: 11, letterSpacing: "0.1em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                  <p style={{ color: `${ACID}44`, fontSize: 10, letterSpacing: "0.1em" }}>{track.artist}</p>
                </div>
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => onRemoveTrack(playlist.id, track.id)}
                  style={{ color: `${ACID}55`, fontSize: 14, background: "none", border: "none",
                    cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>−</motion.button>
              </div>
            ))
          )}
        </div>

        {/* Footer — borrar playlist */}
        {isCreator && (
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${ACID}15` }}>
            {!canDelete ? (
              <p style={{ color: `${ACID}25`, fontSize: 10, letterSpacing: "0.15em", textAlign: "center" }}>
                Vacía la playlist para poder borrarla
              </p>
            ) : confirmDelete ? (
              <div style={{ display: "flex", gap: 8 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onDeletePlaylist(playlist.id); onClose(); }}
                  style={{ flex: 1, padding: "6px 0", background: "#ff444418", border: "1px solid #ff444455",
                    color: "#ff4444", fontSize: 10, letterSpacing: "0.2em", borderRadius: 2,
                    cursor: "pointer", fontFamily: FONT_MONO }}>
                  CONFIRMAR BORRAR
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDelete(false)}
                  style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${ACID}22`,
                    color: `${ACID}55`, fontSize: 10, borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                  CANCELAR
                </motion.button>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDelete(true)}
                style={{ width: "100%", padding: "6px 0", background: "transparent",
                  border: "1px solid #ff444422", color: "#ff444466", fontSize: 10,
                  letterSpacing: "0.2em", borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                BORRAR PLAYLIST
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};