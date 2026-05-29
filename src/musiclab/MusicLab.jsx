// ============================================================
//  EL BÚNKER — MusicLab.jsx
//  Orquestación principal del Music Lab.
//  Componentes extraídos a archivos propios (PLIEGO-035).
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { PlaylistModal, PlaylistNameInput, PlaylistDetailModal } from "./PlaylistManager";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE } from "../layout/Layout";
import { usePlayer } from "../core/PlayerContext";
import { fetchPlaylists, createPlaylist, addTrackToPlaylist, updateData } from "../core/GoogleDriveService";
import { AudioVisualizer } from "./AudioVisualizer";
import { WinampPlayer } from "./WinampPlayer";
import { VibeTagBar, TrackCard } from "./TrackCard";
import { AddTrackForm } from "./AddTrackForm";
import { DropsHistory } from "./DropsManager";

// ─── DESIGN TOKENS ───────────────────────────────────────────
const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const PURPLE_BG    = "rgba(191,0,255,0.04)";
const PURPLE_BORDER= "rgba(191,0,255,0.2)";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

// ─── VIBE TAGS CONFIG ────────────────────────────────────────
const VIBE_TAGS = [
  { id: "all",         label: "ALL",    icon: "◈", color: "#ffffff"  },
  { id: "gaming",      label: "GAMING", icon: "◉", color: "#00ffcc" },
  { id: "420_chill",   label: "420",    icon: "◎", color: "#aaff44" },
  { id: "dnb",         label: "DnB",    icon: "⚡", color: "#ff6b35" },
  { id: "romantiqueo", label: "♥",      icon: "♥", color: PURPLE    },
];

// ─── DEMO DATA ───────────────────────────────────────────────
const DEMO_TRACKS = [
  { id: "t1", title: "Knife Party – LRAD",         artist: "Knife Party",  url: "", tag: "dnb",         note: "Para cuando llegamos a casa.",    era_id: null, added_at: new Date().toISOString() },
  { id: "t2", title: "RL Grime – UCLA",             artist: "RL Grime",     url: "", tag: "gaming",      note: "El himno de las noches largas.", era_id: null, added_at: new Date().toISOString() },
  { id: "t3", title: "Cigarettes After Sex – Crush",artist: "CAS",          url: "", tag: "romantiqueo", note: "Te la dedico.",                  era_id: null, added_at: new Date().toISOString() },
  { id: "t4", title: "Tycho – Awake",               artist: "Tycho",        url: "", tag: "420_chill",   note: "Flotando.",                      era_id: null, added_at: new Date().toISOString() },
  { id: "t5", title: "Chase & Status – Flashing Lights", artist: "Chase & Status", url: "", tag: "dnb", note: "La que suena en el carro.",      era_id: null, added_at: new Date().toISOString() },
];

// ─── HELPERS ─────────────────────────────────────────────────
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const getVibeConfig = (vibeId) => VIBE_TAGS.find((v) => v.id === vibeId) ?? VIBE_TAGS[0];

// ─── MUSIC LAB MAIN ──────────────────────────────────────────
export default function MusicLab({
  db = null,
  userId = null,
  onAddTrack,
  onEditTrack,
  onDeleteTrack,
  onAddDrop,
  onMarkDropSeen,
  onMasterVolumeChange,
  patchDb,
}) {
  const rawTracks = db?.music_lab?.tracks ?? DEMO_TRACKS;
  const rawDrops  = db?.music_lab?.drops  ?? [];
  const userDrops = userId ? rawDrops.filter((d) => d.to === userId || d.from === userId) : rawDrops;

  // ── Estado local (UI solamente) ───────────────────────────
  const [showAdd,           setShowAdd]            = useState(false);
  const [showDelete,        setShowDelete]         = useState(false);
  const [showEdit,          setShowEdit]           = useState(false);
  const [editingTrack,      setEditingTrack]       = useState(null);
  const [activeTab,         setActiveTab]          = useState("tracks");
  const [localTracks,       setLocalTracks]        = useState(rawTracks);
  const [localDrops,        setLocalDrops]         = useState(userDrops);
  const [localPlaylists,    setLocalPlaylists]     = useState(db?.music_lab?.playlists ?? []);
  const [showPlaylistModal,  setShowPlaylistModal]  = useState(false);
  const [showPlaylistDetail, setShowPlaylistDetail] = useState(null); // playlist id
  const [pendingTrack,       setPendingTrack]       = useState(null);
  const [toast,             setToast]              = useState(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [visibleCount,       setVisibleCount]       = useState(50);

  // ── Estado de reproducción — viene de PlayerContext ───────
  const {
    activeTrack, setActiveTrack,
    localQueue, setLocalQueue, addToQueue, addNext, removeFromQueue, playTrack,
    autoPlaySignal, setAutoPlaySignal,
    syncStatus,
    playbackContext, setPlaybackContext,
    playHistory,
  } = usePlayer();

  // libraryFilter — estado local de UI (ADR-011). No afecta al reproductor.
  const [libraryFilter, setLibraryFilter] = useState("all");
  useEffect(() => { setVisibleCount(50); }, [libraryFilter]);
  useEffect(() => {
    if (!db) return;
    fetchPlaylists()
      .then(setLocalPlaylists)
      .catch((err) => console.warn("[Búnker] fetchPlaylists falló:", err));
  }, [db]);
  // ── Handlers Playlist ────────────────────────────────────
  const handleAddToPlaylist = (track) => { setPendingTrack(track); setShowPlaylistModal(true); };

  const handleEditPlaylist = (updatedPlaylists) => {
    setLocalPlaylists(updatedPlaylists);
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          playlists: (prev.music_lab?.playlists ?? []).filter((pl) => pl.id !== playlistId),
        },
      }));
    } catch (err) {
      console.warn("[Búnker] deletePlaylist falló:", err);
    }
    setLocalPlaylists((p) => p.filter((pl) => pl.id !== playlistId));
    setToast("PLAYLIST ELIMINADA");
    setTimeout(() => setToast(null), 2500);
  };

  const handleSelectPlaylist = async (playlistId) => {
    if (!pendingTrack) return;
    try {
      const updated = await addTrackToPlaylist(playlistId, pendingTrack.id);
      setLocalPlaylists((p) => p.map((pl) => pl.id === playlistId ? updated : pl));
      setToast("AÑADIDO A PLAYLIST");
      setTimeout(() => setToast(null), 2500);
    } catch (err) { console.warn("[Búnker] addTrackToPlaylist falló:", err); }
    finally { setShowPlaylistModal(false); setPendingTrack(null); setShowCreatePlaylist(false); }
  };

  const handleCreatePlaylist = async (name) => {
    if (!name?.trim() || !userId) return;
    try {
      const newPl = await createPlaylist(name, userId);
      setLocalPlaylists((p) => [...p, newPl]);
      if (pendingTrack) {
        const updated = await addTrackToPlaylist(newPl.id, pendingTrack.id);
        setLocalPlaylists((p) => p.map((pl) => pl.id === newPl.id ? updated : pl));
      }
      setToast("PLAYLIST CREADA");
      setTimeout(() => setToast(null), 2500);
    } catch (err) { console.warn("[Búnker] createPlaylist falló:", err); }
    finally { setShowPlaylistModal(false); setPendingTrack(null); }
  };

  // ── Handlers Tracks ──────────────────────────────────────
  const filteredTracks = libraryFilter === "all"
    ? localTracks
    : localTracks.filter((t) => (t.tag ?? t.vibe) === libraryFilter);

  const handleAddTrack = (trackData) => {
    setLocalTracks((p) => [...p, trackData]);
    onAddTrack?.(trackData);
    setShowAdd(false);
    setToast("TRACK AÑADIDO");
    setTimeout(() => setToast(null), 2500);
  };

  const handleEditTrack = (trackId) => {
    const track = localTracks.find((t) => t.id === trackId);
    if (!track) return;
    setEditingTrack(track);
    setShowEdit(true);
    setShowDelete(false);
    setShowAdd(false);
  };

  const handleSaveEdit = (updatedData) => {
    setLocalTracks((p) => p.map((t) => t.id === editingTrack.id ? { ...t, ...updatedData } : t));
    onEditTrack?.({ ...editingTrack, ...updatedData });
    if (activeTrack?.id === editingTrack.id) setActiveTrack((t) => ({ ...t, ...updatedData }));
    setToast("TRACK ACTUALIZADO");
    setTimeout(() => setToast(null), 2500);
    setShowEdit(false);
    setEditingTrack(null);
  };

  const handleDeleteTrack = (trackId) => {
    setLocalTracks((p) => p.filter((t) => t.id !== trackId));
    onDeleteTrack?.(trackId);
    if (activeTrack?.id === trackId) setActiveTrack(localTracks.find((t) => t.id !== trackId) ?? null);
    setToast("TRACK ELIMINADO");
    setTimeout(() => setToast(null), 2500);
    setShowDelete(false);
  };

  // ── Handlers Cola ────────────────────────────────────────
  const handleAddNext = (track) => {
    if (!track) return;
    addNext(track);
    setToast("REPRODUCIR A CONTINUACIÓN");
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToQueue = (track) => {
    if (!track) return;
    addToQueue(track);
    setToast("AÑADIDO A COLA");
    setTimeout(() => setToast(null), 2500);
  };

  const handleRemoveFromQueue = (trackId) => {
    removeFromQueue(trackId);
  };

  // drag&drop cola (provisional — pendiente revisión sesión diseño)
  const dragIdx = useRef(null);
  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver  = (e) => { e.preventDefault(); };
  const handleDrop      = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) return;
    setLocalQueue((q) => {
      const next = q.filter((t) => t.id !== activeTrack?.id);
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(i, 0, moved);
      dragIdx.current = null;
      // reinsertar activeTrack al principio si existe
      return activeTrack ? [activeTrack, ...next] : next;
    });
  };

  const handleQueueAdvance = (track) => {
    playTrack(track);
  };

  // ── Handlers Drops ───────────────────────────────────────
  const handleDropSend = (dropData) => {
    const toUserId = userId === "edu" ? "david" : "edu";
    const newDrop  = { ...dropData, id: uuid(), from: userId, to: toUserId, seen: false, created_at: new Date().toISOString() };
    setLocalDrops((p) => [...p, newDrop]);
    onAddDrop?.(newDrop);
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}
            style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
              background: `${ACID}18`, border: `1px solid ${ACID}55`, color: ACID,
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.25em",
              padding: "8px 20px", borderRadius: 2, zIndex: 9999 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <PlaylistModal
            playlists={localPlaylists}
            onSelectPlaylist={handleSelectPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            onClose={() => setShowPlaylistModal(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-5 px-4 py-6 max-w-md mx-auto" style={{ fontFamily: FONT_MONO }}>

        {/* ══ Player ══ */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <WinampPlayer
            track={activeTrack}
            tracks={filteredTracks}
            queue={localQueue.filter((t) => t.id !== activeTrack?.id)}
            onTrackChange={(t) => { setActiveTrack(t); setAutoPlaySignal((n) => n + 1); }}
            onQueueAdvance={handleQueueAdvance}
            onDropSend={handleDropSend}
            syncStatus={syncStatus}
            VIBE_TAGS={VIBE_TAGS}
            autoPlaySignal={autoPlaySignal}
          />
        </motion.section>

        {/* ══ Tab Bar ══ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-0 rounded-sm overflow-hidden" style={{ border: `1px solid ${GLASS_BORDER}` }}>
          {[
            ...(localQueue.length > 0 ? [{ id: "queue",     label: `COLA [${localQueue.length}]`,   icon: "▶" }] : []),
            { id: "tracks",    label: "TRACKS",                        icon: "◎" },
            { id: "playlists", label: "LISTS",                         icon: "◈" },
            ...(localDrops.length > 0 ? [{ id: "drops",     label: `DROPS [${localDrops.length}]`, icon: "⚡" }] : []),
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 text-xs tracking-[0.25em] uppercase font-bold transition-all"
                style={{ fontFamily: FONT_MONO,
                  color: isActive ? (tab.id === "drops" ? PURPLE : ACID) : `${ACID}33`,
                  background: isActive ? (tab.id === "drops" ? `${PURPLE}15` : `${ACID}10`) : "transparent",
                  borderBottom: isActive ? `2px solid ${tab.id === "drops" ? PURPLE : ACID}` : "2px solid transparent",
                  textShadow: isActive ? `0 0 8px ${tab.id === "drops" ? PURPLE : ACID}88` : "none" }}>
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* ══ Content ══ */}
        <AnimatePresence mode="wait">

          {/* COLA */}
          {activeTab === "queue" && (
            <motion.div key="queue" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: ACID }}>▶</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: ACID }}>COLA</span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: ACID }}>
                    [{String(localQueue.length).padStart(2, "0")}]
                  </span>
                </div>
              </div>
              {playHistory.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: ACID }}>anterior</span>
                  <div className="flex flex-col gap-2" style={{ opacity: 0.35 }}>
                    {[...playHistory].reverse().map((track, i) => (
                      <div key={`hist-${track.id}-${i}`} className="flex items-center gap-3 p-3 rounded-sm"
                        style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO }}>
                        <span style={{ color: ACID, fontSize: 12 }}>◎</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: ACID }}>{track.title}</p>
                          <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>{track.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTrack && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: ACID }}>ahora</span>
                  <div className="flex items-center gap-3 p-3 rounded-sm"
                    style={{ background: `${ACID}10`, border: `1px solid ${ACID}44`, fontFamily: FONT_MONO }}>
                    <span style={{ color: ACID, fontSize: 14 }}>◉</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: ACID }}>{activeTrack.title}</p>
                      <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>{activeTrack.artist}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const next = localQueue.find((t) => t.id !== activeTrack.id);
                        handleRemoveFromQueue(activeTrack.id);
                        if (next) { setActiveTrack(next); setAutoPlaySignal((n) => n + 1); }
                        else setActiveTrack(localTracks[0] ?? null);
                      }}
                      className="ml-3 flex-shrink-0 text-xs px-2 py-1 rounded-sm"
                      style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                      ✕
                    </motion.button>
                  </div>
                </div>
              )}
              {localQueue.filter((t) => t.id !== activeTrack?.id).length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: ACID }}>siguientes</span>
                  <div className="flex flex-col gap-2">
                    {localQueue.filter((t) => t.id !== activeTrack?.id).map((track, i) => (
                      <div key={`queue-next-${track.id}`}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(i)}
                        className="flex items-center gap-3 p-3 rounded-sm"
                        style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO, cursor: "grab" }}>
                        <span style={{ color: ACID, opacity: 0.3, fontSize: 12, flexShrink: 0 }}>⠿</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: ACID }}>{track.title}</p>
                          <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>{track.artist}</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRemoveFromQueue(track.id)}
                          className="ml-3 flex-shrink-0 text-xs px-2 py-1 rounded-sm"
                          style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                          ✕
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TRACKS */}
          {activeTab === "tracks" && (
            <motion.div key="tracks" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <VibeTagBar activeVibe={libraryFilter} onVibeChange={setLibraryFilter} VIBE_TAGS={VIBE_TAGS} />
              </motion.div>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: ACID }}>◎</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: ACID }}>TRACKS</span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: ACID }}>
                    [{String(filteredTracks.length).padStart(2, "0")}]
                  </span>
                </div>
                <div className="flex gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} title="Añadir track"
                    onClick={() => { setShowAdd((p) => !p); setShowDelete(false); setShowEdit(false); setEditingTrack(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: ACID, border: `1px solid ${showAdd ? ACID + "66" : ACID + "33"}`,
                      background: showAdd ? `${ACID}15` : `${ACID}06` }}>
                    {showAdd ? "✕" : "+"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Editar track"
                    onClick={() => { setShowEdit((p) => !p); setShowDelete(false); setShowAdd(false); setEditingTrack(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: PURPLE, border: `1px solid ${showEdit ? PURPLE + "66" : PURPLE + "33"}`,
                      background: showEdit ? `${PURPLE}15` : `${PURPLE}06` }}>
                    {showEdit ? "✕" : "✎"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Eliminar track"
                    onClick={() => { setShowDelete((p) => !p); setShowAdd(false); setShowEdit(false); setEditingTrack(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: "#ff4444", border: `1px solid ${showDelete ? "#ff444466" : "#ff444433"}`,
                      background: showDelete ? "#ff444415" : "#ff444406" }}>
                    {showDelete ? "✕" : "−"}
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {showAdd && (
                  <AddTrackForm onAdd={handleAddTrack} onClose={() => setShowAdd(false)} VIBE_TAGS={VIBE_TAGS} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showEdit && !editingTrack && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }} className="flex flex-col gap-2 p-3 rounded-sm"
                    style={{ background: "rgba(191,0,255,0.04)", border: `1px solid ${PURPLE}22`, fontFamily: FONT_MONO }}>
                    <p className="text-xs tracking-[0.3em] uppercase font-bold mb-1" style={{ color: PURPLE }}>✎ EDITAR TRACK</p>
                    {localTracks.length === 0 ? (
                      <p className="text-xs opacity-40" style={{ color: PURPLE }}>NO HAY TRACKS</p>
                    ) : (
                      localTracks.map((track) => (
                        <motion.div key={track.id} whileTap={{ scale: 0.98 }}
                          onClick={() => handleEditTrack(track.id)}
                          className="flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer"
                          style={{ background: "rgba(191,0,255,0.03)", border: `1px solid ${PURPLE}18` }}>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-bold truncate" style={{ color: PURPLE }}>{track.title}</span>
                            <span className="text-xs opacity-40 truncate" style={{ color: PURPLE }}>{track.artist}</span>
                          </div>
                          <span className="ml-3 flex-shrink-0 text-xs opacity-40" style={{ color: PURPLE }}>→</span>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
                {showEdit && editingTrack && (
                  <AddTrackForm onAdd={handleSaveEdit}
                    onClose={() => { setShowEdit(false); setEditingTrack(null); }}
                    initialData={editingTrack} VIBE_TAGS={VIBE_TAGS} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showDelete && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }} className="flex flex-col gap-2 p-3 rounded-sm"
                    style={{ background: "rgba(255,68,68,0.04)", border: "1px solid #ff444422", fontFamily: FONT_MONO }}>
                    <p className="text-xs tracking-[0.3em] uppercase font-bold mb-1" style={{ color: "#ff4444" }}>◈ ELIMINAR TRACK</p>
                    {localTracks.length === 0 ? (
                      <p className="text-xs opacity-40" style={{ color: "#ff4444" }}>NO HAY TRACKS</p>
                    ) : (
                      localTracks.map((track) => (
                        <div key={track.id} className="flex items-center justify-between px-3 py-2 rounded-sm"
                          style={{ background: "rgba(255,68,68,0.03)", border: "1px solid #ff444418" }}>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-bold truncate" style={{ color: "#ff6666" }}>{track.title}</span>
                            <span className="text-xs opacity-40 truncate" style={{ color: "#ff4444" }}>{track.artist}</span>
                          </div>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteTrack(track.id)}
                            className="ml-3 flex-shrink-0 text-xs tracking-widest uppercase px-2 py-1 rounded-sm"
                            style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                            ✕
                          </motion.button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {!editingTrack && !showEdit && filteredTracks.length > 0 ? (
                    filteredTracks.slice(0, visibleCount).map((track) => (
                      <TrackCard key={track.id} track={track}
                        isActive={activeTrack?.id === track.id}
                        vibeConfig={getVibeConfig(track.tag ?? track.vibe)}
                        onClick={() => { setPlaybackContext(filteredTracks); playTrack(track); }}
                        onAddToQueue={handleAddToQueue}
                        onAddNext={handleAddNext}
                        onAddToPlaylist={handleAddToPlaylist}
                        onDrop={(t) => setActiveTrack(t)}
                      />
                    ))
                  ) : (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs opacity-20 tracking-widest text-center py-8 uppercase"
                      style={{ color: ACID }}>
                      — sin tracks para este vibe —
                    </motion.p>
                  )}
                </AnimatePresence>
                {!editingTrack && !showEdit && visibleCount < filteredTracks.length && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setVisibleCount((c) => c + 50)}
                    className="w-full py-2.5 text-xs tracking-[0.25em] uppercase font-bold rounded-sm mt-1"
                    style={{
                      color: `${ACID}88`,
                      border: `1px solid ${ACID}22`,
                      background: `${ACID}06`,
                      fontFamily: FONT_MONO,
                    }}
                  >
                    + CARGAR MÁS — {filteredTracks.length - visibleCount} restantes
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* LISTS */}
          {activeTab === "playlists" && (
            <motion.div key="playlists" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: ACID }}>◈</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: ACID }}>LISTS</span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: ACID }}>
                    [{String(localPlaylists.length).padStart(2, "0")}]
                  </span>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} title="Nueva playlist"
                  onClick={() => setShowCreatePlaylist((p) => !p)}
                  className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                  style={{ color: ACID, border: `1px solid ${showCreatePlaylist ? ACID + "66" : ACID + "33"}`,
                    background: showCreatePlaylist ? `${ACID}15` : `${ACID}06` }}>
                  {showCreatePlaylist ? "✕" : "+"}
                </motion.button>
              </div>
              <AnimatePresence>
                {showCreatePlaylist && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{ background: "rgba(191,255,0,0.03)", border: `1px solid ${ACID}22`, borderRadius: 2 }}>
                    <PlaylistNameInput onConfirm={handleCreatePlaylist} />
                  </motion.div>
                )}
              </AnimatePresence>
              {localPlaylists.length === 0 ? (
                <p className="text-xs opacity-20 tracking-widest text-center py-8 uppercase"
                  style={{ color: ACID, fontFamily: FONT_MONO }}>
                  — sin playlists —
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {localPlaylists.map((pl) => (
                    <div key={pl.id} className="flex items-center justify-between p-3 rounded-sm"
                      style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO, cursor: "pointer" }}
                      onClick={() => setShowPlaylistDetail(pl.id)}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold" style={{ color: ACID }}>{pl.name}</span>
                        <span className="text-xs opacity-30" style={{ color: ACID }}>
                          {pl.track_ids.length} tracks
                        </span>
                      </div>
                      {pl.track_ids.length > 0 && (
                        <motion.button whileTap={{ scale: 0.88 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const plTracks = pl.track_ids.map((id) => localTracks.find((t) => t.id === id)).filter(Boolean);
                            if (!plTracks.length) return;
                            playTrack(plTracks[0]);
                            plTracks.slice(1).forEach((t) => addToQueue(t));
                          }}
                          style={{ color: ACID, background: `${ACID}15`, border: `1px solid ${ACID}33`,
                            borderRadius: 2, fontSize: 11, padding: "4px 10px", fontFamily: FONT_MONO }}>
                          ▶
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* DROPS */}
          {activeTab === "drops" && (
            <motion.div key="drops" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: PURPLE }}>⚡</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: PURPLE }}>THE DROPS</span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: PURPLE }}>
                    [{String(localDrops.length).padStart(2, "0")}]
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-sm text-xs leading-relaxed opacity-50"
                style={{ color: PURPLE, background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, fontFamily: FONT_MONO }}>
                Cuando lanzas un Drop, aparece como una alerta intrusiva la próxima vez que tu persona abra el Búnker. Selecciona un track y toca ⚡ LANZAR DROP.
              </div>
              <DropsHistory drops={localDrops} tracks={localTracks} userId={userId}
                onPlay={(track) => playTrack(track)}
                onMarkSeen={(dropId) => {
                  setLocalDrops((prev) => prev.map((d) => d.id === dropId ? { ...d, seen: true } : d));
                  onMarkDropSeen?.(dropId);
                }}
                onSaveDropSeen={(dropId) => {
                  setLocalDrops((prev) => prev.map((d) => d.id === dropId ? { ...d, favorited: true, seen: true } : d));
                  onMarkDropSeen?.(dropId);
                }}
                onDeleteDrop={(dropId) => {
                  setLocalDrops((prev) => prev.filter((d) => d.id !== dropId));
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>

        {/* PlaylistDetailModal */}
        <AnimatePresence>
          {showPlaylistDetail && (() => {
            const pl = localPlaylists.find((p) => p.id === showPlaylistDetail);
            if (!pl) return null;
            return (
              <PlaylistDetailModal
                playlist={pl}
                tracks={localTracks}
                userId={userId}
                onClose={() => setShowPlaylistDetail(null)}
                onPlay={(t) => { playTrack(t); setShowPlaylistDetail(null); }}
                onAddToQueue={addToQueue}
                onRemoveTrack={(plId, trackId) => {
                  const updated = localPlaylists.map((p) =>
                    p.id === plId ? { ...p, track_ids: p.track_ids.filter((id) => id !== trackId) } : p
                  );
                  handleEditPlaylist(updated);
                }}
                onDeletePlaylist={(plId) => {
                  handleDeletePlaylist(plId);
                }}
              />
            );
          })()}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex items-center justify-between pt-2 pb-4 px-1">
          <span className="text-xs opacity-15 tracking-widest uppercase" style={{ color: ACID }}>MUSIC LAB v1.0</span>
          <motion.span animate={{ opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 3, repeat: Infinity }}
            className="text-xs tracking-widest uppercase" style={{ color: ACID }}>
            ◈ WEB AUDIO API
          </motion.span>
        </motion.footer>
      </div>
    </>
  );
}

// ─── NAMED EXPORTS ───────────────────────────────────────────
export {
  AudioVisualizer,
  WinampPlayer,
  VibeTagBar,
  TrackCard,
  DropsHistory,
  VIBE_TAGS,
};