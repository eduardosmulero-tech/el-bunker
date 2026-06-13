// ============================================================
//  EL BÚNKER — MusicLab.jsx
//  Orquestación principal del Music Lab.
//  Componentes extraídos a archivos propios (PLIEGO-035).
// ============================================================

import { useState, useEffect, useRef, useMemo } from "react";
import { PlaylistModal, PlaylistNameInput, PlaylistDetailModal } from "./PlaylistManager";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, stringToColor } from "../tokens";
import { usePlayer } from "../core/PlayerContext";

import { AudioVisualizer } from "./AudioVisualizer";
import { WinampPlayer } from "./WinampPlayer";
import { VibeTagBar, TrackCard, TrackCardGrid } from "./TrackCard";
import { AddTrackForm } from "./AddTrackForm";
import { TagManager } from "./TagManager";
import { DropsHistory } from "./DropsManager";

// ─── DESIGN TOKENS ───────────────────────────────────────────
const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const PURPLE_BG    = "rgba(191,0,255,0.04)";
const PURPLE_BORDER= "rgba(191,0,255,0.2)";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

// "all" es filtro de UI, nunca en DB (VB2)
// Tags se cargan exclusivamente desde D1 (db.music_lab.tags).
// Sin hardcodeos — el usuario los crea/modifica/elimina desde TagManager.
const ALL_TAG = { id: "all", label: "ALL", icon: "◈", color: "#ffffff" };

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

// ─── MUSIC LAB MAIN ──────────────────────────────────────────
export default function MusicLab({
  db = null,
  userId = null,
  jwtToken: _jwtToken = null,
  onAddTrack,
  onEditTrack,
  onDeleteTrack,
  onAddDrop,
  onMarkDropSeen,
  _onMasterVolumeChange,
  patchDb,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}) {
  const rawTracks = db?.music_lab?.tracks ?? DEMO_TRACKS;
  const EMPTY_ARR = useMemo(() => [], []);
  const rawDrops  = db?.music_lab?.drops  ?? EMPTY_ARR;
  const userDrops = useMemo(() =>
    userId ? rawDrops.filter((d) => d.to === userId || d.from === userId) : rawDrops,
    [userId, rawDrops]
  );
  // VIBE_TAGS dinámico desde DB — "all" se inyecta en runtime como filtro de UI (VB2)
  const VIBE_TAGS = [ALL_TAG, ...(db?.music_lab?.tags ?? [])];
  const getVibeConfig = (vibeId) => {
    if (!vibeId) return null;
    const found = VIBE_TAGS.find((v) => v.id === vibeId);
    // "all" es filtro de UI, no tag real — devolver null para que TrackCard use fallbacks
    if (found) return found.id === "all" ? null : found;
    // Tag huérfano (en tracks pero no en DB) → crear config sintético desde el ID
    // para que los tracks siempre tengan color, icono y label visibles
    const label = vibeId.replace(/_/g, " ").toUpperCase();
    return { id: vibeId, label, icon: "◎", color: stringToColor(vibeId) };
  };
  // resolveVibeConf — normaliza tag de DB al schema que WinampPlayer espera.
  // Tags de DB: {id, label, icon, color/seedColor} — sin palette.
  // WinampPlayer consume vibeConf.palette.accent → necesita al menos ese campo.
  // Si el tag ya tiene palette (canónico de tokens.js), lo pasa tal cual.
  const resolveVibeConf = (vibeId) => {
    if (!vibeId) return null;
    const raw = getVibeConfig(vibeId);
    if (!raw) return null;
    if (raw.palette?.accent) return raw;
    const accent = raw.color ?? raw.seedColor ?? "#bfff00";
    return { ...raw, palette: { accent } };
  };

  // ── Estado local (UI solamente) ───────────────────────────
  const [showAdd,           setShowAdd]            = useState(false);
  const [showDelete,        setShowDelete]         = useState(false);
  const [showEdit,          setShowEdit]           = useState(false);
  const [editingTrack,      setEditingTrack]       = useState(null);
  const [activeTab,         setActiveTab]          = useState("tracks");
  const [viewMode,          setViewMode]            = useState(() => {
    try { return localStorage.getItem(`bunker_viewmode_${db?.currentUser?.id ?? "default"}`) ?? "list"; }
    catch { return "list"; }
  });
  const cycleViewMode = () => {
    const next = viewMode === "list" ? "grid" : viewMode === "grid" ? "card" : "list";
    setViewMode(next);
    try { localStorage.setItem(`bunker_viewmode_${db?.currentUser?.id ?? "default"}`, next);    } catch { /* noop */ }
  };
  const VIEW_MODE_ICON = { list: "☰", grid: "⊞", card: "❒" };
  const dbPlaylists = db?.music_lab?.playlists ?? EMPTY_ARR;
  const [showPlaylistModal,  setShowPlaylistModal]  = useState(false);
  const [showPlaylistDetail, setShowPlaylistDetail] = useState(null); // playlist id
  const [pendingTrack,       setPendingTrack]       = useState(null);
  const [toast,             setToast]              = useState(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [visibleCount,       setVisibleCount]       = useState(50);
  const [showTagManager,     setShowTagManager]     = useState(false);

  // ── Estado de reproducción — viene de PlayerContext ───────
  const {
    activeTrack, setActiveTrack,
    localQueue, setLocalQueue, addToQueue, addNext, removeFromQueue, playTrack,
    autoPlaySignal, setAutoPlaySignal,
    syncStatus,
    _playbackContext, setPlaybackContext,
    playHistory,
    queueContextName, setQueueContextName,
    trackVibe, resolveVibeAccent,
  } = usePlayer();
  // accentColor — sigue el vibe activo. ACID si no hay track.
  const accentColor = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;

  // libraryFilter — estado local de UI (ADR-011). No afecta al reproductor.
  const [libraryFilter, setLibraryFilter] = useState("all");
  const [trackSearch,   setTrackSearch]   = useState("");
  const [showTrackSearch, setShowTrackSearch] = useState(false);
  const [listSearch,    setListSearch]    = useState("");
  const [showListSearch,  setShowListSearch]  = useState(false);
  const [queueSearch,     setQueueSearch]     = useState("");
  const [showQueueSearch, setShowQueueSearch] = useState(false);
  const [confirmClearQueue, setConfirmClearQueue] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVisibleCount(50); }, [libraryFilter]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVisibleCount(50); }, [trackSearch]);
  // ── Handlers Playlist ────────────────────────────────────
  const handleAddToPlaylist = (track) => { setPendingTrack(track); setShowPlaylistModal(true); };

  const handleEditPlaylist = (updatedPlaylists) => {
    patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, playlists: updatedPlaylists } })).catch(() => {});
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
    setToast("PLAYLIST ELIMINADA");
    setTimeout(() => setToast(null), 2500);
  };

  const API_BASE_ML = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

  // S76: Añadir track a playlist vía Worker API (D1) en lugar de Drive
  const handleSelectPlaylist = async (playlistId) => {
    if (!pendingTrack || !_jwtToken) return;
    try {
      const res = await fetch(`${API_BASE_ML}/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${_jwtToken}` },
        body: JSON.stringify({ track_id: pendingTrack.id }),
      });
      if (!res.ok) throw new Error(`addTrack: ${res.status}`);
      // Actualizar estado local inmediatamente
      patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          playlists: (prev.music_lab?.playlists ?? []).map((pl) =>
            pl.id === playlistId
              ? { ...pl, track_ids: [...(pl.track_ids ?? []), pendingTrack.id] }
              : pl
          ),
        },
      })).catch(() => {});
      setToast("AÑADIDO A PLAYLIST");
      setTimeout(() => setToast(null), 2500);
    } catch (err) { console.warn("[Búnker] addTrackToPlaylist (Worker):", err); }
    finally { setShowPlaylistModal(false); setPendingTrack(null); setShowCreatePlaylist(false); }
  };

  // S76: Crear playlist vía Worker API (D1) en lugar de Drive
  const handleCreatePlaylist = async (name) => {
    if (!name?.trim() || !userId || !_jwtToken) return;
    try {
      const res = await fetch(`${API_BASE_ML}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${_jwtToken}` },
        body: JSON.stringify({ name: name.trim(), created_by: userId }),
      });
      if (!res.ok) throw new Error(`createPlaylist: ${res.status}`);
      const newPl = await res.json();
      // Actualizar estado local inmediatamente (sin esperar refreshDb)
      patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          playlists: [...(prev.music_lab?.playlists ?? []), { ...newPl, track_ids: [] }],
        },
      })).catch(() => {});
      if (pendingTrack) {
        await fetch(`${API_BASE_ML}/api/playlists/${newPl.id}/tracks`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${_jwtToken}` },
          body: JSON.stringify({ track_id: pendingTrack.id }),
        });
        // Actualizar estado local: track añadido a la nueva playlist
        patchDb((prev) => ({
          ...prev,
          music_lab: {
            ...prev.music_lab,
            playlists: (prev.music_lab?.playlists ?? []).map((pl) =>
              pl.id === newPl.id ? { ...pl, track_ids: [...(pl.track_ids ?? []), pendingTrack.id] } : pl
            ),
          },
        })).catch(() => {});
      }
      setToast("PLAYLIST CREADA");
      setTimeout(() => setToast(null), 2500);
    } catch (err) { console.warn("[Búnker] createPlaylist (Worker):", err); }
    finally { setShowPlaylistModal(false); setPendingTrack(null); }
  };

  // ── Handlers Tracks ──────────────────────────────────────
  const filteredTracks = useMemo(() => rawTracks
    .filter((t) => libraryFilter === "all" || (t.tag ?? t.vibe) === libraryFilter)
    .filter((t) => {
      if (!trackSearch.trim()) return true;
      const q = trackSearch.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q);
    }), [rawTracks, libraryFilter, trackSearch]);

  const [listTagFilter, setListTagFilter] = useState("all");
  const filteredPlaylists = useMemo(() => dbPlaylists.filter((pl) => {
    if (listTagFilter !== "all") {
      const plTracks = (pl.track_ids ?? []).map((id) => rawTracks.find((t) => t.id === id)).filter(Boolean);
      if (!plTracks.some((t) => (t.tag ?? t.vibe) === listTagFilter)) return false;
    }
    if (!listSearch.trim()) return true;
    const q = listSearch.toLowerCase();
    return pl.name?.toLowerCase().includes(q);
  }), [dbPlaylists, listTagFilter, rawTracks, listSearch]);

  const [queueTagFilter, setQueueTagFilter] = useState("all");
  const filteredQueue = localQueue.filter((t) => {
    if (queueTagFilter !== "all" && (t.tag ?? t.vibe) !== queueTagFilter) return false;
    if (!queueSearch.trim()) return true;
    const q = queueSearch.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q);
  });

  const handleAddTrack = (trackData) => {
    onAddTrack?.(trackData);
    setShowAdd(false);
    setToast("TRACK AÑADIDO");
    setTimeout(() => setToast(null), 2500);
  };

  const handleEditTrack = (trackId) => {
    const track = rawTracks.find((t) => t.id === trackId);
    if (!track) return;
    setEditingTrack(track);
    setShowEdit(true);
    setShowDelete(false);
    setShowAdd(false);
  };

  const handleSaveEdit = (updatedData) => {
    onEditTrack?.({ ...editingTrack, ...updatedData });
    if (activeTrack?.id === editingTrack.id) setActiveTrack((t) => ({ ...t, ...updatedData }));
    setToast("TRACK ACTUALIZADO");
    setTimeout(() => setToast(null), 2500);
    setEditingTrack(null);
  };

  const handleDeleteTrack = (trackId) => {
    onDeleteTrack?.(trackId);
    if (activeTrack?.id === trackId) setActiveTrack(rawTracks.find((t) => t.id !== trackId) ?? null);
    setToast("TRACK ELIMINADO");
    setTimeout(() => setToast(null), 2500);
    setShowDelete(false);
  };

  // ── Handlers Cola ────────────────────────────────────────
  const handleAddNext = (track, force = false) => {
    if (!track) return;
    const result = addNext(track, force);
    if (result === "duplicate") {
      setToast({ msg: "YA EN COLA", action: () => handleAddNext(track, true), actionLabel: "AÑADIR IGUALMENTE" });
    } else {
      setToast({ msg: "REPRODUCIR A CONTINUACIÓN" });
    }
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToQueue = (track, force = false) => {
    if (!track) return;
    const result = addToQueue(track, force);
    if (result === "duplicate") {
      setToast({ msg: "YA EN COLA", action: () => handleAddToQueue(track, true), actionLabel: "AÑADIR IGUALMENTE" });
    } else {
      setToast({ msg: "AÑADIDO A COLA" });
    }
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
      return activeTrack ? [activeTrack, ...next] : next;
    });
  };

  // drag&drop playlists
  const dragPlIdx = useRef(null);
  const handlePlDragStart = (i) => { dragPlIdx.current = i; };
  const handlePlDragOver  = (e) => { e.preventDefault(); };
  const handlePlDrop      = async (i) => {
    if (dragPlIdx.current === null || dragPlIdx.current === i) return;
    const next = [...dbPlaylists];
    const [moved] = next.splice(dragPlIdx.current, 1);
    next.splice(i, 0, moved);
    dragPlIdx.current = null;
    patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, playlists: next } })).catch(() => {});
  };

  // renombrar playlist inline
  const [renamingPlId, setRenamingPlId] = useState(null);
  const [renameVal,    setRenameVal]    = useState("");
  const handleRenamePlaylist = async (plId) => {
    if (!renameVal.trim()) { setRenamingPlId(null); return; }
    const updated = dbPlaylists.map((pl) => pl.id === plId ? { ...pl, name: renameVal.trim() } : pl);
    setRenamingPlId(null);
    await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, playlists: updated } })).catch(() => {});
  };

  // confirmar eliminar playlist inline
  const [confirmDeletePlId, setConfirmDeletePlId] = useState(null);

  const handleQueueAdvance = (track) => {
    playTrack(track);
  };

  // ── Handlers Drops ───────────────────────────────────────
  const handleDropSend = (dropData) => {
    const RECIPIENTS = ["edu", "david"];
    const toUserId = RECIPIENTS.find(r => r !== userId) || RECIPIENTS[0];
    const newDrop  = { ...dropData, id: uuid(), from: userId, to: toUserId, seen: false, created_at: new Date().toISOString() };
    onAddDrop?.(newDrop);
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.25 }}
            style={{ position: "fixed", bottom: 90, left: 16, right: 16,
              background: `${ACID}18`, border: `1px solid ${ACID}55`, color: ACID,
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.25em",
              padding: "8px 20px", borderRadius: 2, zIndex: 9999, textAlign: "center" }}>
            {typeof toast === "string" ? toast : toast?.msg}
            {toast?.action && (
              <button onClick={() => { toast.action(); setToast(null); }}
                style={{ marginLeft: 12, color: ACID, background: `${ACID}25`, border: `1px solid ${ACID}66`,
                  borderRadius: 2, fontSize: 10, padding: "2px 8px", cursor: "pointer", fontFamily: FONT_MONO, letterSpacing: "0.15em" }}>
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <PlaylistModal
            playlists={dbPlaylists}
            onSelectPlaylist={handleSelectPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            onClose={() => setShowPlaylistModal(false)}
          />
        )}
      </AnimatePresence>

      {/* TagManager — overlay global, accesible desde todos los tabs */}
      <AnimatePresence>
        {showTagManager && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9990,
              background: "rgba(0,0,0,0.85)", overflowY: "auto", padding: "58px 16px 100px" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowTagManager(false); }}
          >
            <div style={{ maxWidth: 448, margin: "0 auto" }}>
              <TagManager
                tags={db?.music_lab?.tags ?? []}
                tracks={rawTracks}
                onAdd={onAddTag}
                onUpdate={onUpdateTag}
                onDelete={onDeleteTag}
                onReorder={async (newTags) => {
                  await patchDb((prev) => ({
                    ...prev,
                    music_lab: { ...prev.music_lab, tags: newTags },
                  }));
                }}
                onFilterByTag={(tagId) => {
                  setLibraryFilter(tagId);
                  setShowTagManager(false);
                }}
              />
            </div>
          </motion.div>
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
            vibeConf={resolveVibeConf(activeTrack?.tag ?? activeTrack?.vibe)}
          />
        </motion.section>

        {/* ══ Tab Bar ══ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-0 rounded-sm overflow-hidden" style={{ border: `1px solid ${GLASS_BORDER}` }}>
          {[
            ...(localQueue.length > 0 ? [{ id: "queue",     label: `COLA [${localQueue.length}]`,   icon: "▶" }] : []),
            { id: "tracks",    label: "TRACKS",                        icon: "◎" },
            { id: "playlists", label: "LISTS",                         icon: "◈" },
            ...(userDrops.length > 0 ? [{ id: "drops",     label: `DROPS [${userDrops.length}]`, icon: "⚡" }] : []),
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const tabColor = tab.id === "drops" ? PURPLE : accentColor;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 text-xs tracking-[0.25em] uppercase font-bold transition-all"
                style={{ fontFamily: FONT_MONO,
                  color: isActive ? tabColor : `${accentColor}33`,
                  background: isActive ? `${tabColor}10` : "transparent",
                  borderBottom: isActive ? `2px solid ${tabColor}` : "2px solid transparent",
                  textShadow: isActive ? `0 0 8px ${tabColor}88` : "none" }}>
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
              <div className="flex flex-col gap-1 px-1">
                <VibeTagBar activeVibe={queueTagFilter} onVibeChange={setQueueTagFilter} VIBE_TAGS={VIBE_TAGS}
                  onOpenTagManager={() => setShowTagManager((p) => !p)} isTagManagerOpen={showTagManager} accentColor={accentColor} />
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: ACID }}>▶</span>
                    <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: ACID }}>COLA</span>
                    <span className="text-xs opacity-30 tabular-nums" style={{ color: ACID }}>
                      [{String(localQueue.length).padStart(2, "0")}]
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <motion.button whileTap={{ scale: 0.9 }} title="Buscar en cola"
                      onClick={() => { setShowQueueSearch((p) => !p); setQueueSearch(""); }}
                      className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: ACID, border: `1px solid ${showQueueSearch ? ACID + "66" : ACID + "33"}`, background: showQueueSearch ? `${ACID}15` : `${ACID}06` }}>
                      ⌕
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} title="Guardar cola como playlist"
                      onClick={() => {
                        const name = prompt("Nombre de la nueva playlist:");
                        if (!name?.trim()) return;
                        handleCreatePlaylist(name.trim());
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: ACID, border: `1px solid ${ACID}33`, background: `${ACID}06` }}>
                      ◈
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} title="Vaciar cola"
                      onClick={() => setConfirmClearQueue(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: "#ff4444", border: "1px solid #ff444433", background: "#ff444406" }}>
                      ✕
                    </motion.button>
                  </div>
                </div>
                {queueContextName && (
                  <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: ACID, fontFamily: FONT_MONO }}>
                    DESDE: {queueContextName}
                  </span>
                )}
                {confirmClearQueue && (
                  <div className="flex gap-2 mt-1">
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => { setLocalQueue([]); setQueueContextName(null); setConfirmClearQueue(false); }}
                      style={{ flex: 1, padding: "5px 0", background: "#ff444418", border: "1px solid #ff444455",
                        color: "#ff4444", fontSize: 10, letterSpacing: "0.2em", borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                      CONFIRMAR VACIAR
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmClearQueue(false)}
                      style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${ACID}22`,
                        color: `${ACID}55`, fontSize: 10, borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                      CANCELAR
                    </motion.button>
                  </div>
                )}
              </div>
              <AnimatePresence>
                {showQueueSearch && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <input
                      autoFocus
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      placeholder="BUSCAR EN COLA..."
                      style={{ width: "100%", background: `${ACID}06`, border: `1px solid ${ACID}33`, borderRadius: 2,
                        color: ACID, fontSize: 11, padding: "7px 12px", fontFamily: FONT_MONO,
                        letterSpacing: "0.15em", outline: "none", boxSizing: "border-box" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {playHistory.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: ACID }}>anterior</span>
                  <div className="flex flex-col gap-2" style={{ opacity: 0.35 }}>
                    {[...playHistory].reverse().map((track, i) => {
                      const hVibe = getVibeConfig(track.tag ?? track.vibe);
                      return (
                        <div key={`hist-${track.id}-${i}`} className="flex items-center gap-3 p-3 rounded-sm"
                          style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO }}>
                          <div className="w-8 h-8 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                            style={{ background: `${hVibe?.color ?? ACID}12`, border: `1px solid ${hVibe?.color ?? ACID}33` }}>
                            {track.thumbnail
                              ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                              : <span style={{ color: hVibe?.color ?? ACID, fontSize: 10 }}>◎</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: hVibe?.color ?? ACID }}>{track.title}</p>
                            <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>{track.artist}</p>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                            style={{ color: hVibe?.color ?? ACID, background: `${hVibe?.color ?? ACID}15`, border: `1px solid ${hVibe?.color ?? ACID}33` }}>
                            {hVibe?.icon}
                          </span>
                        </div>
                      );
                    })}
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
                        else setActiveTrack(rawTracks[0] ?? null);
                      }}
                      className="ml-3 flex-shrink-0 text-xs px-2 py-1 rounded-sm"
                      style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                      ✕
                    </motion.button>
                  </div>
                </div>
              )}
              {/* Q14: cola manual — tracks añadidos explícitamente por el usuario */}
              {filteredQueue.filter((t) => t.id !== activeTrack?.id && t._manual).length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-50 tracking-widest uppercase px-1" style={{ color: ACID }}>cola manual</span>
                  <div className="flex flex-col gap-2">
                    {filteredQueue.filter((t) => t.id !== activeTrack?.id && t._manual).map((track, i) => {
                      const qVibe = getVibeConfig(track.tag ?? track.vibe);
                      const trackColor = qVibe?.color ?? ACID;
                      const activePl = queueContextName
                        ? dbPlaylists.find((p) => p.name === queueContextName)
                        : null;
                      const queuePos = localQueue.filter((t) => t.id !== activeTrack?.id && t._manual).findIndex((t) => t.id === track.id);
                      return (
                        <div key={`queue-manual-${track.id}`}
                          draggable
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(i)}
                          className="flex items-center gap-3 p-3 rounded-sm"
                          style={{ background: GLASS_BG, border: `1px solid ${trackColor}33`, fontFamily: FONT_MONO, cursor: "grab" }}>
                          <span style={{ color: ACID, opacity: 0.3, fontSize: 12, flexShrink: 0 }}>⠿</span>
                          <div className="w-8 h-8 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                            style={{ background: `${trackColor}12`, border: `1px solid ${trackColor}33` }}>
                            {track.thumbnail
                              ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                              : <span style={{ color: trackColor, fontSize: 10 }}>⌕</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: trackColor }}>{track.title}</p>
                            <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>{track.artist}</p>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                            style={{ color: trackColor, background: `${trackColor}15`, border: `1px solid ${trackColor}33` }}>
                            {qVibe?.icon}
                          </span>
                          {activePl && (
                            <motion.button whileTap={{ scale: 0.9 }}
                              title={`Añadir a ${activePl.name} en esta posición`}
                              onClick={async () => {
                                const newIds = [...activePl.track_ids];
                                const activeIdxInPl = newIds.indexOf(activeTrack?.id);
                                const insertAt = activeIdxInPl >= 0 ? activeIdxInPl + 1 + queuePos : newIds.length;
                                newIds.splice(insertAt, 0, track.id);
                                const updated = dbPlaylists.map((p) => p.id === activePl.id ? { ...p, track_ids: newIds } : p);
                                await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, playlists: updated } })).catch(() => {});
                                setToast(`AÑADIDO A ${activePl.name.toUpperCase()}`);
                                setTimeout(() => setToast(null), 2500);
                              }}
                              className="flex-shrink-0 text-xs px-2 py-1 rounded-sm"
                              style={{ color: ACID, border: `1px solid ${ACID}44`, background: `${ACID}12` }}>
                              ◈
                            </motion.button>
                          )}
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRemoveFromQueue(track.id)}
                            className="ml-1 flex-shrink-0 text-xs px-2 py-1 rounded-sm"
                            style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                            ✕
                          </motion.button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Q14: cola de contexto — tracks cargados desde playlist */}
              {filteredQueue.filter((t) => t.id !== activeTrack?.id && !t._manual).length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-50 tracking-widest uppercase px-1" style={{ color: ACID }}>
                    {queueContextName ? `playlist · ${queueContextName}` : 'contexto'}
                  </span>
                  <div className="flex flex-col gap-2">
                    {filteredQueue.filter((t) => t.id !== activeTrack?.id && !t._manual).map((track, i) => {
                      const qVibe = getVibeConfig(track.tag ?? track.vibe);
                      return (
                        <div key={`queue-ctx-${track.id}`}
                          draggable
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(i)}
                          className="flex items-center gap-3 p-3 rounded-sm"
                          style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO, cursor: "grab" }}>
                          <span style={{ color: ACID, opacity: 0.3, fontSize: 12, flexShrink: 0 }}>⠿</span>
                          <div className="w-8 h-8 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                            style={{ background: `${ACID}12`, border: `1px solid ${ACID}33` }}>
                            {track.thumbnail
                              ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                              : <span style={{ color: ACID, fontSize: 10 }}>⌕</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: ACID }}>{track.title}</p>
                            <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>{track.artist}</p>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                            style={{ color: ACID, background: `${ACID}15`, border: `1px solid ${ACID}33` }}>
                            {qVibe?.icon}
                          </span>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRemoveFromQueue(track.id)}
                            className="ml-1 flex-shrink-0 text-xs px-2 py-1 rounded-sm"
                            style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                            ✕
                          </motion.button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TRACKS */}
          {activeTab === "tracks" && (
            <motion.div key="tracks" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="min-w-0">
                <VibeTagBar activeVibe={libraryFilter} onVibeChange={setLibraryFilter} VIBE_TAGS={VIBE_TAGS}
                  onOpenTagManager={() => setShowTagManager((p) => !p)} isTagManagerOpen={showTagManager} accentColor={accentColor} />
              </motion.div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: accentColor }}>◎</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: accentColor }}>TRACKS</span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: accentColor }}>
                    [{String(filteredTracks.length).padStart(2, "0")}]
                  </span>
                </div>
                <div className="flex gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} title={`Vista: ${viewMode}`}
                    onClick={cycleViewMode}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: accentColor, border: `1px solid ${accentColor}33`,
                      background: `${accentColor}06`, fontFamily: FONT_MONO }}>
                    {VIEW_MODE_ICON[viewMode]}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Buscar track"
                    onClick={() => { setShowTrackSearch((p) => !p); setTrackSearch(""); }}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: accentColor, border: `1px solid ${showTrackSearch ? accentColor + "66" : accentColor + "33"}`,
                      background: showTrackSearch ? `${accentColor}15` : `${accentColor}06` }}>
                    ⌕
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Añadir track"
                    onClick={() => { setShowAdd((p) => !p); setShowDelete(false); setShowEdit(false); setEditingTrack(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: accentColor, border: `1px solid ${showAdd ? accentColor + "66" : accentColor + "33"}`,
                      background: showAdd ? `${accentColor}15` : `${accentColor}06` }}>
                    {showAdd ? "✕" : "+"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Editar track"
                    onClick={() => { setShowEdit((p) => !p); setShowDelete(false); setShowAdd(false); setEditingTrack(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: accentColor, border: `1px solid ${showEdit ? accentColor + "66" : accentColor + "33"}`,
                      background: showEdit ? `${accentColor}15` : `${accentColor}06` }}>
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
                {showTrackSearch && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <input
                      autoFocus
                      value={trackSearch}
                      onChange={(e) => setTrackSearch(e.target.value)}
                      placeholder="BUSCAR TRACK..."
                      style={{ width: "100%", background: `${ACID}06`, border: `1px solid ${ACID}33`, borderRadius: 2,
                        color: ACID, fontSize: 11, padding: "7px 12px", fontFamily: FONT_MONO,
                        letterSpacing: "0.15em", outline: "none", boxSizing: "border-box" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showAdd && (
                  <AddTrackForm onAdd={handleAddTrack} onClose={() => setShowAdd(false)} VIBE_TAGS={VIBE_TAGS} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showEdit && !editingTrack && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col items-center justify-center gap-2 py-5 px-4 rounded-sm"
                    style={{
                      background: "rgba(191,0,255,0.08)",
                      border: `1px solid ${PURPLE}55`,
                      fontFamily: FONT_MONO,
                      textAlign: "center",
                      boxShadow: `0 0 24px rgba(191,0,255,0.10)`,
                    }}>
                    <p
                      className="text-sm tracking-[0.25em] uppercase font-bold"
                      style={{ color: PURPLE, textShadow: `0 0 14px ${PURPLE}` }}>
                      ✎ MODO EDICIÓN ACTIVO
                    </p>
                    <p
                      className="text-xs opacity-50 tracking-[0.15em] uppercase"
                      style={{ color: PURPLE }}>
                      Selecciona cualquier canción de la lista para editar sus metadatos
                    </p>
                  </motion.div>
                )}
                {showEdit && editingTrack && (
                  <AddTrackForm onAdd={handleSaveEdit}
                    onClose={() => { setEditingTrack(null); }}
                    initialData={editingTrack} VIBE_TAGS={VIBE_TAGS} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showDelete && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }} className="flex flex-col gap-2 p-3 rounded-sm"
                    style={{ background: "rgba(255,68,68,0.04)", border: "1px solid #ff444422", fontFamily: FONT_MONO }}>
                    <p className="text-xs tracking-[0.3em] uppercase font-bold mb-1" style={{ color: "#ff4444" }}>◈ ELIMINAR TRACK</p>
                    {rawTracks.length === 0 ? (
                      <p className="text-xs opacity-40" style={{ color: "#ff4444" }}>NO HAY TRACKS</p>
                    ) : (
                      rawTracks.map((track) => (
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
                  {!editingTrack && filteredTracks.length > 0 ? (
                    viewMode === "grid" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {filteredTracks.slice(0, visibleCount).map((track) => {
                          const vc = getVibeConfig(track.tag ?? track.vibe);
                          const vibeColor = vc?.color ?? "#555555";
                          const isActive = activeTrack?.id === track.id;
                          const ytId = track.url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
                          return (
                            <TrackCardGrid key={track.id} track={track} vc={vc} vibeColor={vibeColor}
                              isActive={isActive} ytId={ytId}
                              onClick={() => showEdit ? handleEditTrack(track.id) : playTrack(track)}
                              onAddToQueue={handleAddToQueue}
                              onAddNext={handleAddNext}
                              onAddToPlaylist={handleAddToPlaylist}
                            />
                          );
                        })}
                      </div>
                    ) : (
                    filteredTracks.slice(0, visibleCount).map((track) => (
                      <TrackCard key={track.id} track={track}
                        isActive={activeTrack?.id === track.id}
                        vibeConfig={getVibeConfig(track.tag ?? track.vibe)}
                        viewMode={viewMode}
                        onClick={() => { showEdit ? handleEditTrack(track.id) : playTrack(track); }}
                        onAddToQueue={handleAddToQueue}
                        onAddNext={handleAddNext}
                        onAddToPlaylist={handleAddToPlaylist}
                        onDrop={(t) => setActiveTrack(t)}
                      />
                    ))
                    )
                  ) : (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs opacity-20 tracking-widest text-center py-8 uppercase"
                      style={{ color: ACID }}>
                      — sin tracks para este vibe —
                    </motion.p>
                  )}
                </AnimatePresence>
                {!editingTrack && visibleCount < filteredTracks.length && (
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
              <VibeTagBar activeVibe={listTagFilter} onVibeChange={setListTagFilter} VIBE_TAGS={VIBE_TAGS}
                onOpenTagManager={() => setShowTagManager((p) => !p)} isTagManagerOpen={showTagManager} accentColor={accentColor} />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: ACID }}>◈</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: ACID }}>LISTS</span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: ACID }}>
                    [{String(filteredPlaylists.length).padStart(2, "0")}]
                  </span>
                </div>
                <div className="flex gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} title="Buscar lista"
                    onClick={() => { setShowListSearch((p) => !p); setListSearch(""); }}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: ACID, border: `1px solid ${showListSearch ? ACID + "66" : ACID + "33"}`,
                      background: showListSearch ? `${ACID}15` : `${ACID}06` }}>
                    ⌕
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Nueva playlist"
                    onClick={() => setShowCreatePlaylist((p) => !p)}
                    className="w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: ACID, border: `1px solid ${showCreatePlaylist ? ACID + "66" : ACID + "33"}`,
                      background: showCreatePlaylist ? `${ACID}15` : `${ACID}06` }}>
                    {showCreatePlaylist ? "✕" : "+"}
                  </motion.button>
                </div>
              </div>
              <AnimatePresence>
                {showListSearch && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <input
                      autoFocus
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="BUSCAR LISTA..."
                      style={{ width: "100%", background: `${ACID}06`, border: `1px solid ${ACID}33`, borderRadius: 2,
                        color: ACID, fontSize: 11, padding: "7px 12px", fontFamily: FONT_MONO,
                        letterSpacing: "0.15em", outline: "none", boxSizing: "border-box" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showCreatePlaylist && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{ background: "rgba(191,255,0,0.03)", border: `1px solid ${ACID}22`, borderRadius: 2 }}>
                    <PlaylistNameInput onConfirm={handleCreatePlaylist} />
                  </motion.div>
                )}
              </AnimatePresence>
              {filteredPlaylists.length === 0 ? (
                <p className="text-xs opacity-20 tracking-widest text-center py-8 uppercase"
                  style={{ color: ACID, fontFamily: FONT_MONO }}>
                  — sin playlists —
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredPlaylists.map((pl, i) => {
                    const plTracks = pl.track_ids.map((id) => rawTracks.find((t) => t.id === id)).filter(Boolean);
                    const isEmpty = plTracks.length === 0;
                    const plVibe = getVibeConfig(pl.tag ?? plTracks[0]?.tag ?? plTracks[0]?.vibe);
                    const totalSec = plTracks.reduce((acc, t) => acc + (t.duration ?? 0), 0);
                    const durStr = totalSec > 0 ? `${Math.floor(totalSec / 60)}m ${totalSec % 60}s` : null;
                    const isRenaming = renamingPlId === pl.id;
                    const isConfirmDel = confirmDeletePlId === pl.id;
                    return (
                      <div key={pl.id}
                        draggable
                        onDragStart={() => handlePlDragStart(i)}
                        onDragOver={handlePlDragOver}
                        onDrop={() => handlePlDrop(i)}
                        className="flex flex-col rounded-sm"
                        style={{ background: GLASS_BG, border: `1px solid ${isEmpty ? GLASS_BORDER : (plVibe?.color ?? ACID) + "33"}`, fontFamily: FONT_MONO, opacity: isEmpty ? 0.6 : 1, cursor: "grab" }}>
                        <div className="flex items-center gap-3 p-3"
                          onClick={() => !isRenaming && !isConfirmDel && setShowPlaylistDetail(pl.id)}
                          style={{ cursor: isRenaming || isConfirmDel ? "default" : "pointer" }}>
                          <span style={{ color: ACID, opacity: 0.3, fontSize: 12, flexShrink: 0 }}>⠿</span>
                          <div className="w-9 h-9 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                            style={{ background: `${plVibe?.color ?? ACID}12`, border: `1px solid ${plVibe?.color ?? ACID}33` }}>
                            {plTracks[0]?.thumbnail
                              ? <img src={plTracks[0].thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                              : <span style={{ color: plVibe?.color ?? ACID, fontSize: 12 }}>{isEmpty ? "◌" : "◈"}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isRenaming ? (
                              <input autoFocus value={renameVal}
                                onChange={(e) => setRenameVal(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleRenamePlaylist(pl.id); if (e.key === "Escape") setRenamingPlId(null); }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: "100%", background: "transparent", border: `1px solid ${ACID}44`, borderRadius: 2,
                                  color: ACID, fontSize: 11, padding: "2px 6px", fontFamily: FONT_MONO, outline: "none" }} />
                            ) : (
                              <span className="text-xs font-bold truncate block" style={{ color: plVibe?.color ?? ACID }}>{pl.name}</span>
                            )}
                            <span className="text-xs opacity-30 truncate block" style={{ color: ACID }}>
                              {pl.track_ids.length} tracks{durStr ? ` · ${durStr}` : ""}
                            </span>
                          </div>
                          {plVibe && !isRenaming && (
                            <span className="text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                              style={{ color: plVibe.color, background: `${plVibe.color}15`, border: `1px solid ${plVibe.color}33` }}>
                              {plVibe.icon}
                            </span>
                          )}
                          {isRenaming ? (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleRenamePlaylist(pl.id); }}
                              style={{ color: ACID, background: `${ACID}15`, border: `1px solid ${ACID}33`, borderRadius: 2, fontSize: 10, padding: "4px 8px", fontFamily: FONT_MONO, flexShrink: 0 }}>
                              OK
                            </motion.button>
                          ) : (
                            <>
                              {!isEmpty && (
                                <motion.button whileTap={{ scale: 0.88 }}
                                  onClick={(e) => { e.stopPropagation(); if (!plTracks.length) return; setPlaybackContext(plTracks, pl.name); setActiveTrack(plTracks[0]); setAutoPlaySignal((n) => n + 1); }}
                                  style={{ color: ACID, background: `${ACID}15`, border: `1px solid ${ACID}33`, borderRadius: 2, fontSize: 11, padding: "4px 8px", fontFamily: FONT_MONO, flexShrink: 0 }}>
                                  ▶
                                </motion.button>
                              )}
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); setRenamingPlId(pl.id); setRenameVal(pl.name); setConfirmDeletePlId(null); }}
                                style={{ color: ACID, background: `${ACID}0a`, border: `1px solid ${ACID}22`, borderRadius: 2, fontSize: 11, padding: "4px 8px", fontFamily: FONT_MONO, flexShrink: 0 }}>
                                ✎
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); setConfirmDeletePlId(pl.id); setRenamingPlId(null); }}
                                style={{ color: "#ff4444", background: "#ff444408", border: "1px solid #ff444422", borderRadius: 2, fontSize: 11, padding: "4px 8px", fontFamily: FONT_MONO, flexShrink: 0 }}>
                                ✕
                              </motion.button>
                            </>
                          )}
                        </div>
                        {isConfirmDel && (
                          <div className="flex gap-2 px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => { handleDeletePlaylist(pl.id); setConfirmDeletePlId(null); }}
                              style={{ flex: 1, padding: "5px 0", background: "#ff444418", border: "1px solid #ff444455",
                                color: "#ff4444", fontSize: 10, letterSpacing: "0.2em", borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                              CONFIRMAR BORRAR
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmDeletePlId(null)}
                              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${ACID}22`,
                                color: `${ACID}55`, fontSize: 10, borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
                              CANCELAR
                            </motion.button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    [{String(userDrops.length).padStart(2, "0")}]
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-sm text-xs leading-relaxed opacity-50"
                style={{ color: PURPLE, background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, fontFamily: FONT_MONO }}>
                Cuando lanzas un Drop, aparece como una alerta intrusiva la próxima vez que tu persona abra el Búnker. Selecciona un track y toca ⚡ LANZAR DROP.
              </div>
              <DropsHistory drops={userDrops} tracks={rawTracks} userId={userId}
                onPlay={(track) => playTrack(track)}
                onMarkSeen={(dropId) => {
                  onMarkDropSeen?.(dropId);
                }}
                onSaveDropSeen={(dropId) => {
                  onMarkDropSeen?.(dropId);
                }}
                onDeleteDrop={async (dropId) => {
                  await patchDb((prev) => ({
                    ...prev,
                    music_lab: {
                      ...prev.music_lab,
                      drops: (prev.music_lab?.drops ?? []).filter((d) => d.id !== dropId),
                    },
                  })).catch(() => {});
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>

        {/* PlaylistDetailModal */}
        <AnimatePresence>
          {showPlaylistDetail && (() => {
            const pl = dbPlaylists.find((p) => p.id === showPlaylistDetail);
            if (!pl) return null;
            return (
              <PlaylistDetailModal
                playlist={pl}
                tracks={rawTracks}
                userId={userId}
                VIBE_TAGS={VIBE_TAGS}
                onClose={() => setShowPlaylistDetail(null)}
                onPlay={(t) => { playTrack(t); setShowPlaylistDetail(null); }}
                onAddToQueue={addToQueue}
                onRemoveTrack={(plId, trackId) => {
                  const updated = dbPlaylists.map((p) =>
                    p.id === plId ? { ...p, track_ids: p.track_ids.filter((id) => id !== trackId) } : p
                  );
                  handleEditPlaylist(updated);
                }}
                onDeletePlaylist={(plId) => {
                  handleDeletePlaylist(plId);
                }}
                onReorderTracks={async (plId, newIds) => {
                  const updated = dbPlaylists.map((pl) =>
                    pl.id === plId ? { ...pl, track_ids: newIds } : pl
                  );
                  await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, playlists: updated } })).catch(() => {});
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
};