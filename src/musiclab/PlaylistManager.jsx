import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID } from "../tokens";
import { VibeTagBar } from "./TrackCard";
import { Icon } from "../core/ui";

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";
export const PlaylistNameInput = ({ onConfirm }) => {
  const [name, setName] = useState("");
  return (
    <div style={{ padding: "10px 16px", borderTop: `1px solid ${ACID}15`, display: "flex", gap: 8 }}>
      <input value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        placeholder="Nueva playlist..."
        style={{ flex: 1, background: "transparent", border: `1px solid ${ACID}33`, borderRadius: 2,
          color: ACID, fontSize: 11, padding: "12px 12px", fontFamily: FONT_MONO,
          letterSpacing: "0.15em", outline: "none" }} />
      <button onClick={() => { if (name.trim()) onConfirm(name); }}
        style={{ background: `${ACID}15`, border: `1px solid ${ACID}44`, color: ACID, fontSize: 11,
          padding: "12px 16px", borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO, letterSpacing: "0.15em" }}>
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
          style={{ display: "block", width: "100%", padding: "14px 16px", textAlign: "left",
            color: ACID, fontSize: 11, letterSpacing: "0.2em", background: "transparent",
            border: "none", borderBottom: `1px solid ${ACID}10`, cursor: "pointer" }}
          onClick={() => onSelectPlaylist(pl.id)}>
          <Icon name="music" size={14} decorative /> {pl.name}
          <span style={{ opacity: 0.3, marginLeft: 8 }}>[{pl.track_ids.length}]</span>
        </button>
      ))}
      <PlaylistNameInput onConfirm={onCreatePlaylist} />
    </motion.div>
  </motion.div>
);

// ── PlaylistDetailModal ────────────────────────────────────────────────────────
export const PlaylistDetailModal = ({ playlist, tracks, userId: _userId, onClose, onPlay, onPlayFromTrack, onAddToQueue, onAddAllToQueue, onRemoveTrack, onDeletePlaylist, onReorderTracks, VIBE_TAGS = [] }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [orderedIds, setOrderedIds] = useState(playlist?.track_ids ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [vibeFilter, setVibeFilter] = useState("all");
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragTrackIdx = useRef(null);

  if (!playlist) return null;

  // Fase 7.3 EC-LI3: Detectar tracks eliminados de la biblioteca
  const missingIds = orderedIds.filter((id) => !tracks.some((t) => t.id === id));
  const plTracks = orderedIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean);

  const visibleTracks = plTracks
    .filter((t) => vibeFilter === "all" || (t.tag ?? t.vibe) === vibeFilter)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q);
    });

  const handlePlay = () => {
    if (!plTracks.length) return;
    onPlay(plTracks[0]);
    plTracks.slice(1).forEach((t) => onAddToQueue(t));
    onClose();
  };

  // Fase 5.2 C2/C3: Reproducción granular — fallback a onPlay si onPlayFromTrack no disponible
  const handlePlayFromTrack = (track, idx) => {
    if (!track) return;
    if (onPlayFromTrack) {
      onPlayFromTrack(track);
    } else {
      onPlay?.(track);
    }
    // Añadir los tracks restantes a la cola
    plTracks.slice(idx + 1).forEach((t) => onAddToQueue(t));
    onClose();
  };

  // Fase 7.3 EC-LI3: Limpiar tracks eliminados de la playlist
  const handleCleanMissing = () => {
    const cleanIds = orderedIds.filter((id) => tracks.some((t) => t.id === id));
    setOrderedIds(cleanIds);
    onReorderTracks?.(playlist.id, cleanIds);
  };

  const handleTrackDragStart = (i) => { dragTrackIdx.current = i; };
  const handleTrackDragOver  = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const handleTrackDragLeave  = () => { setDragOverIdx(null); };
  const handleTrackDrop      = (i) => {
    if (dragTrackIdx.current === null || dragTrackIdx.current === i) return;
    const from = dragTrackIdx.current;
    dragTrackIdx.current = null;
    setDragOverIdx(null);
    setOrderedIds((ids) => {
      const next = [...ids];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
    // P1.2 fix: side effect OUTSIDE React state updater (ADR-015 compliance).
    // onReorderTracks se llama después del setOrderedIds, no dentro del updater.
    setOrderedIds((ids) => {
      // Usar un microtask para asegurar que el estado ya se actualizó
      queueMicrotask(() => onReorderTracks?.(playlist.id, ids));
      return ids;
    });
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
              <Icon name="music" size={14} decorative /> {playlist.name}
            </p>
            <p style={{ color: `${ACID}44`, fontSize: 10, letterSpacing: "0.15em" }}>
              {searchQuery.trim() ? `${visibleTracks.length}/${plTracks.length}` : plTracks.length} track{plTracks.length !== 1 ? "s" : ""}
              {missingIds.length > 0 && (
                <span style={{ color: "#ff6b35", marginLeft: 6 }}>
                  · {missingIds.length} no disponible{missingIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { setShowSearch((p) => !p); setSearchQuery(""); }}
              style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 2, fontSize: 15, transition: "all 0.15s",
                color: ACID, border: `1px solid ${showSearch ? ACID + "66" : ACID + "33"}`,
                background: showSearch ? `${ACID}15` : `${ACID}06`, cursor: "pointer" }}>
              <Icon name="search" size={15} decorative />
            </motion.button>
            {plTracks.length > 0 && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={handlePlay}
                style={{ background: `${ACID}18`, border: `1px solid ${ACID}44`, color: ACID,
                  fontSize: 11, padding: "12px 16px", borderRadius: 2, cursor: "pointer",
                  fontFamily: FONT_MONO, letterSpacing: "0.2em" }}>
                <Icon name="play" size={14} decorative /> PLAY
              </motion.button>
            )}
            {plTracks.length > 0 && onAddAllToQueue && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => onAddAllToQueue(plTracks)}
                title="Añadir toda la playlist a la cola"
                style={{ background: `${ACID}0d`, border: `1px solid ${ACID}33`, color: ACID,
                  fontSize: 10, padding: "12px 14px", borderRadius: 2, cursor: "pointer",
                  fontFamily: FONT_MONO, letterSpacing: "0.15em" }}>
                <Icon name="arrowRight" size={14} decorative />
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              style={{ color: `${ACID}44`, fontSize: 14, padding: "12px 16px", background: "none", border: "none", cursor: "pointer" }}><Icon name="close" size={14} decorative /></motion.button>
          </div>
        </div>

        {/* Vibe filter */}
        {VIBE_TAGS.length > 0 && (
          <div style={{ padding: "8px 16px", borderBottom: `1px solid ${ACID}15` }}>
            <VibeTagBar activeVibe={vibeFilter} onVibeChange={setVibeFilter} VIBE_TAGS={VIBE_TAGS} />
          </div>
        )}

        {/* Search input */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ padding: "8px 16px", borderBottom: `1px solid ${ACID}15` }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BUSCAR EN PLAYLIST..."
                style={{ width: "100%", background: `${ACID}06`, border: `1px solid ${ACID}33`,
                  borderRadius: 2, color: ACID, fontSize: 11, padding: "7px 12px",
                  fontFamily: FONT_MONO, letterSpacing: "0.15em", outline: "none", boxSizing: "border-box" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Track list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {visibleTracks.length === 0 ? (
            <p style={{ color: `${ACID}30`, fontSize: 10, letterSpacing: "0.2em", textAlign: "center",
              padding: "24px 16px", textTransform: "uppercase" }}>
              {searchQuery.trim() ? "— sin resultados —" : "— sin tracks —"}
            </p>
          ) : (
            visibleTracks.map((track, i) => (
              <div key={track.id}
                draggable
                onDragStart={() => handleTrackDragStart(i)}
                onDragOver={(e) => handleTrackDragOver(e, i)}
                onDragLeave={handleTrackDragLeave}
                onDrop={() => handleTrackDrop(i)}
                style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 16px",
                  borderTop: `1px solid ${dragOverIdx === i ? ACID : "transparent"}`,
                  borderBottom: `1px solid ${dragOverIdx === i ? ACID : ACID + "08"}`,
                  borderStyle: dragOverIdx === i ? "dashed" : "solid",
                  cursor: "grab" }}>
                <Icon name="more" size={13} decorative />
                <div
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() => handlePlayFromTrack(track, plTracks.indexOf(track))}
                  title="Reproducir desde aquí"
                >
                  <p style={{ color: ACID, fontSize: 11, letterSpacing: "0.1em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</p>
                  <p style={{ color: `${ACID}44`, fontSize: 10, letterSpacing: "0.1em" }}>{track.artist}</p>
                </div>
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => onRemoveTrack(playlist.id, track.id)}
                  style={{ color: `${ACID}55`, fontSize: 14, padding: "10px 14px", background: "none", border: "none",
                    cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>−</motion.button>
              </div>
            ))
          )}
        </div>

        {/* Fase 7.3 EC-LI3: Banner de tracks no disponibles */}
        {missingIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "8px 16px", borderTop: `1px solid #ff6b3522`,
              background: "rgba(255,107,53,0.06)", display: "flex", alignItems: "center", gap: 8,
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.1em" }}
          >                <Icon name="alert" size={14} decorative />
            <span style={{ color: "#ff6b3588", flex: 1 }}>
              {missingIds.length} track{missingIds.length !== 1 ? "s" : ""} no disponible{missingIds.length !== 1 ? "s" : ""}
            </span>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleCleanMissing}
              style={{ color: "#ff6b35", background: "rgba(255,107,53,0.12)",
                border: "1px solid rgba(255,107,53,0.3)", borderRadius: 2,
                fontSize: 11, padding: "12px 14px", cursor: "pointer", fontFamily: FONT_MONO, letterSpacing: "0.15em" }}
            >
              LIMPIAR
            </motion.button>
          </motion.div>
        )}

        {/* Footer — borrar playlist */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${ACID}15` }}>
          {confirmDelete ? (
              <div style={{ display: "flex", gap: 8 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onDeletePlaylist(playlist.id); onClose(); }}
                  style={{ flex: 1, padding: "14px 0", background: "#ff444418", border: "1px solid #ff444455",
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
                style={{ width: "100%", padding: "14px 0", background: "transparent",
                  border: "1px solid #ff444422", color: "#ff444466", fontSize: 10,
                  letterSpacing: "0.2em", borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                BORRAR PLAYLIST
              </motion.button>
            )}
          </div>
      </motion.div>
    </motion.div>
  );
};