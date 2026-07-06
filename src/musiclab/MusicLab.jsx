// ============================================================
//  EL BÚNKER — MusicLab.jsx
//  Orquestación principal del Music Lab.
//  Componentes extraídos a archivos propios (PLIEGO-035).
// ============================================================

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { PlaylistModal, PlaylistNameInput, PlaylistDetailModal } from "./PlaylistManager";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, GLASS_BG, GLASS_BORDER, PURPLE_BG, PURPLE_BORDER, stringToColor } from "../tokens";
import { usePlayer } from "../core/PlayerContext";
import { workerClient } from "../core/WorkerClient";

import { AudioVisualizer } from "./AudioVisualizer";
import { WinampPlayer } from "./WinampPlayer";
import { VibeTagBar, TrackCard, TrackCardGrid } from "./TrackCard";
import { AddTrackForm } from "./AddTrackForm";
import { TagManager } from "./TagManager";
import { DropsHistory } from "./DropsManager";

// ─── DESIGN TOKENS ───────────────────────────────────────────
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
  onAddTrack,
  onEditTrack,
  _onDeleteTrack,
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
  // Fase 3.5 UX5: Escuchar swipe up del reproductor para abrir cola
  useEffect(() => {
    const handleSwipeUp = () => setActiveTab("queue");
    window.addEventListener("bunker_swipe_up_queue", handleSwipeUp);
    return () => window.removeEventListener("bunker_swipe_up_queue", handleSwipeUp);
  }, []);

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
    // S91: audioRef para acceder al elemento <audio> desde handlers (network restore)
    audioRef,
    // S85d: para los toasts Q16/Q17 (DESHACER en remove de cola + undo reorder)
    undoRemoveFromQueue, undoColaReorder, undoPlaylistTracksReorder,
  } = usePlayer();
  // accentColor — sigue el vibe activo. ACID si no hay track.
  const accentColor = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;

  // S85d Q16 + EC-P4: Escuchar eventos emitidos por PlayerContext y mostrar
  // toasts persistentes con acción UNDO (Q16) o mensaje informativo (EC-P4).
  // Estos eventos complementan (no reemplazan) el inline undo bar del
  // WinampPlayer — el toast es discoverable desde cualquier tab.
  // toastTimeoutRef: cancela timeouts anteriores para evitar que un toast
  // antiguo (5s) borre prematuramente un toast nuevo (2.5s) — race condition
  // típica cuando el usuario hace varias acciones rápidas.
  const toastTimeoutRef = useRef(null);
  // S88: debounce para drags concurrentes — previene que múltiples
  // reorders disparen API calls en paralelo y generen race conditions
  const reorderingRef = useRef(false);
  // S85d: useCallback con [] para memoizar la función (estable a través de renders).
  // Sin esto, `react-hooks/refs` v6 flaggea showToast como "ref accedida durante render"
  // porque la función lee toastTimeoutRef.current. Con useCallback la referencia es
  // estable → la regla considera que la función no se recrea y por tanto el acceso al
  // ref ocurre solo en event handlers. showToast solo usa setToast (estable) y
  // toastTimeoutRef (ref) — sin otras dependencias, [] es seguro.
  const showToast = useCallback((toastData, duration = 2500) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(toastData);
    toastTimeoutRef.current = setTimeout(() => setToast(null), duration);
  }, []);
  useEffect(() => {
    const onTrackError = (e) => {
      const { type, track } = e.detail || {};
      if (type === "no_file") {
        const title = track?.title?.slice(0, 28) ?? "track";
        // S91 S4: track sin archivo → estado neutral. Toast con acción SALTAR
        // en lugar de auto-skip. El usuario decide manualmente.
        const validTracks = rawTracks.filter(t => !t.is_deleted);
        const hasOtherTrack = validTracks.length > 1 && validTracks.some(t => t.id !== activeTrack?.id);
        showToast({
          msg: `SIN ARCHIVO: ${title}`,
          action: hasOtherTrack ? () => {
            const currentIdx = validTracks.findIndex(t => t.id === activeTrack?.id);
            const next = validTracks[(currentIdx + 1) % validTracks.length];
            if (next && next.id !== activeTrack?.id) playTrack(next);
          } : null,
          actionLabel: hasOtherTrack ? "SALTAR" : null,
        }, 5000);
      }
    };
    const onTrackRemoved = (e) => {
      const { trackId } = e.detail || {};
      if (!trackId) return;
      showToast({
        msg: "ELIMINADO DE COLA",
        action: () => {
          undoRemoveFromQueue?.(trackId);
          showToast({ msg: "TRACK RESTAURADO" }, 1500);
        },
        actionLabel: "DESHACER",
      }, 5000);
    };
    const onColaReordered = (e) => {
      const { snapshot } = e.detail || {};
      if (!Array.isArray(snapshot)) return;
      showToast({
        msg: "COLA REORDENADA",
        action: () => {
          undoColaReorder?.(snapshot);
          showToast({ msg: "ORDEN RESTAURADO" }, 1500);
        },
        actionLabel: "DESHACER",
      }, 5000);
    };
    // S91 S4: toast de reconexión de red — el usuario decide si reanudar
    const onNetworkRestored = () => {
      showToast({
        msg: "CONEXIÓN RECUPERADA",
        actionLabel: "REANUDAR",
        action: () => {
          if (audioRef?.current) {
            audioRef.current.play().catch(() => {});
          }
        },
      }, 6000);
    };
    // S85d Q17-playlist: UNDO de reorder de tracks dentro de una playlist.
    // A diferencia de cola (snapshot local), el reorder de playlist es
    // server-side: undo = undoPlaylistTracksReorder (PUT) + patchDb
    // (local). El snapshot lo captura onReorderTracks antes del PUT.
    const onPlaylistTracksReordered = (e) => {
      const { plId, previousIds } = e.detail || {};
      if (!plId || !Array.isArray(previousIds)) return;
      showToast({
        msg: "PLAYLIST REORDENADA",
        action: async () => {
          const ok = await undoPlaylistTracksReorder?.(plId, previousIds);
          if (ok) {
            await patchDb((prev) => ({
              ...prev,
              music_lab: {
                ...prev.music_lab,
                playlists: (prev.music_lab?.playlists ?? []).map((p) =>
                  p.id === plId ? { ...p, track_ids: previousIds } : p
                ),
              },
            })).catch(() => {});
            showToast({ msg: "ORDEN RESTAURADO" }, 1500);
          } else {
            showToast({ msg: "NO SE PUDO RESTAURAR" }, 2500);
          }
        },
        actionLabel: "DESHACER",
      }, 5000);
    };
    window.addEventListener("bunker_track_error", onTrackError);
    window.addEventListener("bunker_track_removed_from_queue", onTrackRemoved);
    window.addEventListener("bunker_cola_reordered", onColaReordered);
    window.addEventListener("bunker_playlist_tracks_reordered", onPlaylistTracksReordered);
    window.addEventListener("bunker_network_restored", onNetworkRestored);
    return () => {
      window.removeEventListener("bunker_track_error", onTrackError);
      window.removeEventListener("bunker_track_removed_from_queue", onTrackRemoved);
      window.removeEventListener("bunker_cola_reordered", onColaReordered);
      window.removeEventListener("bunker_playlist_tracks_reordered", onPlaylistTracksReordered);
      window.removeEventListener("bunker_network_restored", onNetworkRestored);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [undoRemoveFromQueue, undoColaReorder, undoPlaylistTracksReorder, patchDb, showToast, rawTracks, activeTrack?.id, audioRef, playTrack]);

  // libraryFilter — estado local de UI (ADR-011). No afecta al reproductor.
  const [libraryFilter, setLibraryFilter] = useState("all");
  const [trackSearch,   setTrackSearch]   = useState("");
  // Fase 6.4 EC-TR7: Ordenación configurable — persiste en localStorage
  const [trackSort, setTrackSort] = useState(() => {
    try { return localStorage.getItem(`bunker_tracksort_${db?.currentUser?.id ?? "default"}`) ?? "alpha"; }
    catch { return "alpha"; }
  });
  const SORT_OPTIONS = [
    { id: "alpha", label: "A-Z", icon: "⇅" },
    { id: "artist", label: "ARTISTA", icon: "◎" },
    { id: "vibe", label: "VIBE", icon: "◉" },
    { id: "plays", label: "PLAYS", icon: "▶" },
    { id: "recent", label: "RECIENTE", icon: "⧖" },
  ];
  const handleSortChange = (sortId) => {
    setTrackSort(sortId);
    try { localStorage.setItem(`bunker_tracksort_${db?.currentUser?.id ?? "default"}`, sortId); } catch { /* noop */ }
  };
  const [showTrackSearch, setShowTrackSearch] = useState(false);
  const [listSearch,    setListSearch]    = useState("");
  const [showListSearch,  setShowListSearch]  = useState(false);
  const [queueSearch,     setQueueSearch]     = useState("");
  const [showQueueSearch, setShowQueueSearch] = useState(false);
  const [confirmClearQueue, setConfirmClearQueue] = useState(false);
  // EC-C3: Bottom sheet para reemplazar vs añadir contexto cuando hay cola manual activa
  const [contextSheet, setContextSheet] = useState(null); // { plTracks, plName } | null
  // PLIEGO-237: dropdown de sort (antes era un row de 5 botones inline)
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const dropdownRef = useRef(null);
  const [sortDropdownPos, setSortDropdownPos] = useState(null);
  // Code-reviewer fix: outside-click + Escape + scroll cierran el popover
  useEffect(() => {
    if (!showSortMenu) return;
    const onClick = (e) => {
      if (sortMenuRef.current?.contains(e.target)) return;
      if (dropdownRef.current?.contains(e.target)) return;
      setShowSortMenu(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setShowSortMenu(false); };
    // R6: cerrar dropdown al hacer scroll. El portal con position:fixed usa
    // coordenadas calculadas una sola vez al abrir; al hacer scroll, el boton
    // se mueve pero el menu queda congelado. Solucion: cerrar al hacer scroll.
    const onScroll = () => { setShowSortMenu(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [showSortMenu]);
  // S85d Q15: pull-to-reveal extended history — mostrar últimos 3 por defecto,
  // expande con toggle si playHistory.length > 3
  const [showFullHistory, setShowFullHistory] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVisibleCount(50); }, [libraryFilter]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVisibleCount(50); }, [trackSearch]);
  // ── Handlers Playlist ────────────────────────────────────
  const handleAddToPlaylist = (track) => { setPendingTrack(track); setShowPlaylistModal(true); };

  const handleDeletePlaylist = async (playlistId) => {
    if (!playlistId) return;
    try {
      await workerClient.del(`/api/playlists/${playlistId}`);
      // Sincronizar estado local para que coincida con D1.
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          playlists: (prev.music_lab?.playlists ?? []).filter((pl) => pl.id !== playlistId),
        },
      }));
    } catch (err) {
      console.warn("[Búnker] deletePlaylist falló:", err);
      showToast({ msg: "NO SE PUDO ELIMINAR" }, 2500);
      return; // el estado local queda intacto si D1 rechaza
    }
    showToast({ msg: "PLAYLIST ELIMINADA" }, 2500);
  };

  // S115-D3: WorkerClient maneja auth — sin API_BASE_ML ni _jwtToken
  const handleSelectPlaylist = async (playlistId) => {
    if (!pendingTrack || !workerClient.hasToken()) return;
    try {
      await workerClient.post(`/api/playlists/${playlistId}/tracks`, { track_id: pendingTrack.id });
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
      showToast({ msg: "AÑADIDO A PLAYLIST" }, 2500);
    } catch (err) { console.warn("[Búnker] addTrackToPlaylist (Worker):", err); }
    finally { setShowPlaylistModal(false); setPendingTrack(null); setShowCreatePlaylist(false); }
  };

  // S76: Crear playlist vía WorkerClient (D1)
  const handleCreatePlaylist = async (name) => {
    if (!name?.trim() || !userId || !workerClient.hasToken()) return;
    try {
      const newPl = await workerClient.post('/api/playlists', { name: name.trim(), created_by: userId });
      // Actualizar estado local inmediatamente (sin esperar refreshDb)
      patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          playlists: [...(prev.music_lab?.playlists ?? []), { ...newPl, track_ids: [] }],
        },
      })).catch(() => {});
      if (pendingTrack) {
        await workerClient.post(`/api/playlists/${newPl.id}/tracks`, { track_id: pendingTrack.id });
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
      showToast({ msg: "PLAYLIST CREADA" }, 2500);
    } catch (err) { console.warn("[Búnker] createPlaylist (Worker):", err); }
    finally { setShowPlaylistModal(false); setPendingTrack(null); }
  };

  // ── Handlers Tracks ──────────────────────────────────────
  const filteredTracks = useMemo(() => {
    let result = rawTracks
      .filter((t) => !t.is_deleted)
      .filter((t) => libraryFilter === "all" || (t.tag ?? t.vibe) === libraryFilter)
      .filter((t) => {
        if (!trackSearch.trim()) return true;
        const q = trackSearch.toLowerCase();
        return t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q);
      });
    // Fase 6.4 EC-TR7: Ordenación configurable
    switch (trackSort) {
      case "alpha":
        result = [...result].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
        break;
      case "artist":
        result = [...result].sort((a, b) => (a.artist ?? "").localeCompare(b.artist ?? ""));
        break;
      case "vibe":
        result = [...result].sort((a, b) => {
          const va = a.tag ?? a.vibe ?? "";
          const vb = b.tag ?? b.vibe ?? "";
          return va.localeCompare(vb) || (a.title ?? "").localeCompare(b.title ?? "");
        });
        break;
      case "plays":
        result = [...result].sort((a, b) => (b.play_count ?? 0) - (a.play_count ?? 0));
        break;
      case "recent":
        result = [...result].sort((a, b) => {
          const da = new Date(a.last_played ?? a.added_at ?? 0).getTime();
          const db = new Date(b.last_played ?? b.added_at ?? 0).getTime();
          return db - da;
        });
        break;
    }
    return result;
  }, [rawTracks, libraryFilter, trackSearch, trackSort]);

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

  const handleAddTrack = async (trackData) => {
    try {
      await onAddTrack?.(trackData);
      showToast({ msg: "TRACK AÑADIDO" }, 2500);
    } catch (err) {
      console.warn("[Búnker] handleAddTrack error:", err);
      showToast({ msg: "NO SE PUDO AÑADIR" }, 2500);
    } finally {
      setShowAdd(false);
    }
  };

  const handleEditTrack = (trackId) => {
    const track = rawTracks.find((t) => t.id === trackId);
    if (!track) return;
    setEditingTrack(track);
    setShowEdit(true);
    setShowDelete(false);
    setShowAdd(false);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await onEditTrack?.({ ...editingTrack, ...updatedData });
      if (activeTrack?.id === editingTrack.id) {
        setActiveTrack((t) => ({ ...t, ...updatedData }));
      }
      showToast({ msg: "TRACK ACTUALIZADO" }, 2500);
    } catch (err) {
      console.warn("[Búnker] handleSaveEdit error:", err);
      showToast({ msg: "NO SE PUDO GUARDAR" }, 2500);
    } finally {
      setEditingTrack(null);
    }
  };

  // S90: soft delete via WorkerClient
  const handleDeleteTrack = async (trackId) => {
    if (workerClient.hasToken()) {
      try {
        await workerClient.del(`/api/tracks/${trackId}`);
      } catch (e) {
        console.warn("[Búnker] soft-delete track falló:", e);
        showToast({ msg: "NO SE PUDO ELIMINAR" }, 2500);
        return;
      }
    }
    // Sync estado local: marcar como deleted en vez de remover
    await patchDb((prev) => ({
      ...prev,
      music_lab: {
        ...prev.music_lab,
        tracks: (prev.music_lab?.tracks ?? []).map((t) =>
          t.id === trackId ? { ...t, is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId } : t
        ),
      },
    })).catch(() => {});
    if (activeTrack?.id === trackId) setActiveTrack(rawTracks.find((t) => t.id !== trackId && !t.is_deleted) ?? null);
    showToast({ msg: "TRACK ELIMINADO" }, 2500);
    setShowDelete(false);
  };

  // ── Handlers Cola ────────────────────────────────────────
  const handleAddNext = (track, force = false) => {
    if (!track) return;
    const result = addNext(track, force);
    if (result === "duplicate") {
      showToast({ msg: "YA EN COLA", action: () => handleAddNext(track, true), actionLabel: "AÑADIR IGUALMENTE" }, 2500);
    } else {
      showToast({ msg: "REPRODUCIR A CONTINUACIÓN" }, 2500);
    }
  };

  const handleAddToQueue = (track, force = false) => {
    if (!track) return;
    const result = addToQueue(track, force);
    if (result === "duplicate") {
      showToast({ msg: "YA EN COLA", action: () => handleAddToQueue(track, true), actionLabel: "AÑADIR IGUALMENTE" }, 4000);
    } else if (result === "limit_reached") {
      // S85c Q6: sugerencia de guardar como playlist al alcanzar 75 tracks
      showToast({
        msg: "COLA LLENA (75)",
        action: () => {
          const name = prompt("Nombre para la playlist con la cola actual:");
          if (name?.trim()) handleCreatePlaylist(name.trim());
        },
        actionLabel: "GUARDAR COMO PLAYLIST",
      }, 4000);
    } else {
      showToast({ msg: "AÑADIDO A COLA" }, 4000);
    }
  };

  const handleRemoveFromQueue = (trackId) => {
    removeFromQueue(trackId);
  };

  // drag&drop cola (provisional — pendiente revisión sesión diseño)
  const dragIdx = useRef(null);
  // S85d: debounce/queue ref — previene reordenamientos concurrentes durante
  // operaciones in-flight. Si el usuario arrastra y suelta varias veces
  // rápido, solo procesamos el primer drop. El resto se ignora.
  const dragInFlight = useRef(false);
  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragOver  = (e) => { e.preventDefault(); };
  const handleDrop      = (i) => {
    if (dragInFlight.current) return;
    if (dragIdx.current === null || dragIdx.current === i) return;
    dragInFlight.current = true;
    // S85d Q17: capturar snapshot ANTES del reorder para que el UNDO del
    // toast pueda restaurar la cola a su estado previo. Se dispatcha el
    // evento `bunker_cola_reordered` con la snapshot y MusicLab muestra
    // toast con acción DESHACER (5s).
    const previousQueue = localQueue;
    setLocalQueue((q) => {
      const next = q.filter((t) => t.id !== activeTrack?.id);
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(i, 0, moved);
      dragIdx.current = null;
      return activeTrack ? [activeTrack, ...next] : next;
    });
    try {
      window.dispatchEvent(new CustomEvent("bunker_cola_reordered", {
        detail: { snapshot: previousQueue }
      }));
    } catch { /* SSR / no window */ }
    setTimeout(() => { dragInFlight.current = false; }, 400);
  };

  // drag&drop playlists
  const dragPlIdx = useRef(null);
  const handlePlDragStart = (i) => { dragPlIdx.current = i; };
  const handlePlDragOver  = (e) => { e.preventDefault(); };
  // S84: handlePlDrop reordena cards en LISTS tab. Sister-bug fix del patrón
  // DEL-PLAYLIST (S82): antes solo patchDb (Drive) — D1 mantenía el orden
  // viejo, el próximo refreshDb restauraba el orden antiguo. Ahora el Worker
  // es source of truth y el cliente se sincroniza vía patchDb en success.
  // Patrón consistente con handleDeletePlaylist/Drop/Rename: Worker primero,
  // patchDb solo en success. Sin optimistic UI (la latencia del Worker es
  // baja y evita la complejidad de revertir en el catch).
  const handlePlDrop      = async (i) => {
    const from = dragPlIdx.current;
    if (dragInFlight.current) return;
    if (from === null || from === i) return;
    if (!workerClient.hasToken()) return;
    // B7 fix (S112-B): validar bounds para evitar insertar undefined
    if (from < 0 || from >= dbPlaylists.length || i < 0 || i >= dbPlaylists.length) return;
    dragInFlight.current = true;
    dragPlIdx.current = null;
    const next = [...dbPlaylists];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    try {
      await workerClient.post('/api/playlists/reorder', { playlist_ids: next.map((pl) => pl.id) });
      await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, playlists: next } })).catch(() => {});
    } catch (err) {
      console.warn("[Búnker] reorderPlaylists falló:", err);
      showToast({ msg: "NO SE PUDO REORDENAR" }, 2500);
      return; // sin patchDb si D1 rechaza — estado local intacto
    } finally {
      setTimeout(() => { dragInFlight.current = false; }, 400);
    }
  };

  // renombrar playlist inline
  const [renamingPlId, setRenamingPlId] = useState(null);
  const [renameVal,    setRenameVal]    = useState("");
  const handleRenamePlaylist = async (plId) => {
    if (!plId || !workerClient.hasToken()) return;
    const newName = renameVal.trim();
    if (!newName) { setRenamingPlId(null); return; }
    setRenamingPlId(null);
    try {
      await workerClient.patch(`/api/playlists/${plId}`, { name: newName });
      // Sincronizar estado local para que coincida con D1.
      await patchDb((prev) => ({
        ...prev,
        music_lab: {
          ...prev.music_lab,
          playlists: (prev.music_lab?.playlists ?? []).map((pl) => pl.id === plId ? { ...pl, name: newName } : pl),
        },
      }));
    } catch (err) {
      console.warn("[Búnker] renamePlaylist falló:", err);
      showToast({ msg: "NO SE PUDO RENOMBRAR" }, 2500);
      return; // sin patchDb si D1 rechaza — nombre local preservado para retry
    }
    showToast({ msg: "PLAYLIST RENOMBRADA" }, 2500);
  };

  // confirmar eliminar playlist inline
  const [confirmDeletePlId, setConfirmDeletePlId] = useState(null);

  const handleQueueAdvance = (track) => {
    playTrack(track);
  };

  // EC-C3: Mostrar bottom sheet si hay cola manual activa al pulsar play en playlist.
  // Si no hay tracks manuales, reemplaza el contexto directamente.
  const handlePlayPlaylistContext = (plTracks, plName) => {
    if (!plTracks?.length) return;
    const hasManual = localQueue.some((t) => t._manual && t.id !== activeTrack?.id);
    if (hasManual) {
      setContextSheet({ plTracks, plName });
    } else {
      setPlaybackContext(plTracks, plName);
      setActiveTrack(plTracks[0]);
      setAutoPlaySignal((n) => n + 1);
    }
  };

  // EC-C2: Inyección dinámica — detecta cambios en la playlist activa y añade tracks nuevos.
  // Corre solo cuando dbPlaylists cambia y hay un queueContextName activo.
  useEffect(() => {
    if (!queueContextName) return;
    const matchingPl = dbPlaylists.find((p) => p.name === queueContextName);
    if (!matchingPl?.track_ids?.length) return;
    const currentContextIds = new Set(
      localQueue.filter((t) => !t._manual).map((t) => t.id)
    );
    const newTrackIds = matchingPl.track_ids.filter((id) => !currentContextIds.has(id));
    if (!newTrackIds.length) return;
    const newTracks = newTrackIds
      .map((id) => rawTracks.find((t) => t.id === id))
      .filter(Boolean);
    if (!newTracks.length) return;
    // Inyectar tracks nuevos al final del contexto, después de los existentes
    setLocalQueue((q) => {
      const manual = q.filter((t) => t._manual);
      const context = q.filter((t) => !t._manual);
      const injected = [...context, ...newTracks.map((t) => ({ ...t, _manual: false }))];
      return [...manual, ...injected];
    });
    console.info(
      `[Búnker] EC-C2: Inyectados ${newTracks.length} tracks nuevos de "${queueContextName}"`
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbPlaylists, queueContextName]);

  // ── Handlers Drops ───────────────────────────────────────
  const handleDropSend = async (dropData) => {
    const RECIPIENTS = ["edu", "david"];
    const toUserId = RECIPIENTS.find(r => r !== userId) || RECIPIENTS[0];
    const newDrop  = { ...dropData, id: uuid(), from: userId, to: toUserId, seen: false, created_at: new Date().toISOString() };
    try {
      await onAddDrop?.(newDrop);
      showToast({ msg: "DROP LANZADO" }, 2500);
    } catch (err) {
      console.warn("[Búnker] handleDropSend error:", err);
      showToast({ msg: "NO SE PUDO ENVIAR DROP" }, 2500);
    }
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
                  borderRadius: 2, fontSize: 10, padding: "8px 12px", cursor: "pointer", fontFamily: FONT_MONO, letterSpacing: "0.15em", minHeight: 44 }}>
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
      if (reorderingRef.current) return;
      reorderingRef.current = true;
      try {
        await patchDb((prev) => ({
          ...prev,
          music_lab: { ...prev.music_lab, tags: newTags },
        }));
      } finally {
        reorderingRef.current = false;
      }
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
                className="flex-1 py-2.5 min-h-[44px] text-xs tracking-[0.25em] uppercase font-bold transition-all"
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
                    <span style={{ color: accentColor }}>▶</span>
                    <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: accentColor }}>COLA</span>
                    <span className="text-xs opacity-30 tabular-nums" style={{ color: accentColor }}>
                      [{String(localQueue.length).padStart(2, "0")}]
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <motion.button whileTap={{ scale: 0.9 }} title="Buscar en cola"
                      onClick={() => { setShowQueueSearch((p) => !p); setQueueSearch(""); }}
                      className="w-11 h-11 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: accentColor, border: `1px solid ${showQueueSearch ? accentColor + "66" : accentColor + "33"}`, background: showQueueSearch ? `${accentColor}15` : `${accentColor}06` }}>
                      ⌕
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} title="Guardar cola como playlist"
                      onClick={() => {
                        const name = prompt("Nombre de la nueva playlist:");
                        if (!name?.trim()) return;
                        handleCreatePlaylist(name.trim());
                      }}
                      className="w-11 h-11 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: accentColor, border: `1px solid ${accentColor}33`, background: `${accentColor}06` }}>
                      ◈
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} title="Vaciar cola"
                      onClick={() => setConfirmClearQueue(true)}
                      className="w-11 h-11 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: "#ff4444", border: "1px solid #ff444433", background: "#ff444406" }}>
                      ✕
                    </motion.button>
                  </div>
                </div>
                {queueContextName && (
                  <span className="text-xs opacity-40 tracking-widest uppercase" style={{ color: accentColor, fontFamily: FONT_MONO }}>
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
                      style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${accentColor}22`,
                        color: `${accentColor}55`, fontSize: 10, borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
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
                      style={{ width: "100%", background: `${accentColor}06`, border: `1px solid ${accentColor}33`, borderRadius: 2,
                        color: accentColor, fontSize: 11, padding: "7px 12px", fontFamily: FONT_MONO,
                        letterSpacing: "0.15em", outline: "none", boxSizing: "border-box" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {playHistory.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: accentColor }}>anterior</span>
                  <div className="flex flex-col gap-2" style={{ opacity: 0.35 }}>
                    {(() => {
                      const reversed = [...playHistory].reverse();
                      const visible = showFullHistory ? reversed : reversed.slice(0, 3);
                      return visible.map((track, idx) => {
                        const hVibe = getVibeConfig(track.tag ?? track.vibe);
                        const histKey = `hist-${track.id}-${idx}`;
                        return (
                          <div key={histKey} className="flex items-center gap-3 p-3 rounded-sm"
                            style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO }}>
                            <div className="w-8 h-8 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                              style={{ background: `${hVibe?.color ?? accentColor}12`, border: `1px solid ${hVibe?.color ?? accentColor}33` }}>
                              {track.thumbnail
                                ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                                : <span style={{ color: hVibe?.color ?? accentColor, fontSize: 10 }}>◎</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: hVibe?.color ?? accentColor }}>{track.title}</p>
                              <p className="text-xs opacity-40 truncate" style={{ color: accentColor }}>{track.artist}</p>
                            </div>
                            <span className="text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                              style={{ color: hVibe?.color ?? accentColor, background: `${hVibe?.color ?? accentColor}15`, border: `1px solid ${hVibe?.color ?? accentColor}33` }}>
                              {hVibe?.icon}
                            </span>
                          </div>
                        );
                      });
                    })()}
                    {playHistory.length > 3 && (
                      <button onClick={() => setShowFullHistory(p => !p)}
                        className="text-xs tracking-widest uppercase py-1 opacity-50 hover:opacity-100 transition-opacity text-center"
                        style={{ color: accentColor, fontFamily: FONT_MONO }}>
                        {showFullHistory ? "▴ OCULTAR" : `▾ VER TODO (+${playHistory.length - 3})`}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {activeTrack && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-30 tracking-widest uppercase px-1" style={{ color: accentColor }}>ahora</span>
                  <div className="flex items-center gap-3 p-3 rounded-sm"
                    style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}44`, fontFamily: FONT_MONO }}>
                    <span style={{ color: accentColor, fontSize: 14 }}>◉</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: accentColor }}>{activeTrack.title}</p>
                      <p className="text-xs opacity-40 truncate" style={{ color: accentColor }}>{activeTrack.artist}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const next = localQueue.find((t) => t.id !== activeTrack.id);
                        handleRemoveFromQueue(activeTrack.id);
                        if (next) { setActiveTrack(next); setAutoPlaySignal((n) => n + 1); }
                        else setActiveTrack(rawTracks[0] ?? null);
                      }}
                      className="ml-3 flex-shrink-0 text-xs px-3 py-3 rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                      style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                      ✕
                    </motion.button>
                  </div>
                </div>
              )}
              {/* Q14: cola manual — tracks añadidos explícitamente por el usuario */}
              {filteredQueue.filter((t) => t.id !== activeTrack?.id && t._manual).length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs opacity-50 tracking-widest uppercase px-1" style={{ color: accentColor }}>cola manual</span>
                  <div className="flex flex-col gap-2">
                    {filteredQueue.filter((t) => t.id !== activeTrack?.id && t._manual).map((track, i) => {
                      const qVibe = getVibeConfig(track.tag ?? track.vibe);
                      const trackColor = qVibe?.color ?? accentColor;
                      const activePl = queueContextName
                        ? dbPlaylists.find((p) => p.name === queueContextName)
                        : null;
                      const queuePos = localQueue.filter((t) => t.id !== activeTrack?.id && t._manual).findIndex((t) => t.id === track.id);
                      const manualKey = `queue-manual-${track.id}-${i}`;
                      return (
                        <div key={manualKey}
                          draggable
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(i)}
                          className="flex items-center gap-3 p-3 rounded-sm"
                          style={{ background: GLASS_BG, border: `1px solid ${trackColor}33`, fontFamily: FONT_MONO, cursor: "grab" }}>
                          <span title="Arrastrar para reordenar" aria-label="Arrastrar para reordenar" style={{ color: accentColor, opacity: 0.6, fontSize: 12, flexShrink: 0 }}>⠿</span>
                          <div className="w-8 h-8 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                            style={{ background: `${trackColor}12`, border: `1px solid ${trackColor}33` }}>
                            {track.thumbnail
                              ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                              : <span style={{ color: trackColor, fontSize: 10 }}>⌕</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate flex items-center gap-1" style={{ color: trackColor }}>
                              {track.title}
                              {track._added_by && (
                                <span className="text-[8px] px-1 py-0.5 rounded-sm uppercase tracking-wider font-bold flex-none"
                                  style={{
                                    background: track._added_by === "edu" ? "rgba(0,200,100,0.15)" : "rgba(150,100,255,0.15)",
                                    border: `1px solid ${track._added_by === "edu" ? "rgba(0,200,100,0.4)" : "rgba(150,100,255,0.4)"}`,
                                    color: track._added_by === "edu" ? "#00c864" : "#9664ff",
                                  }}>
                                  {track._added_by === "edu" ? "EDU" : "DAV"}
                                </span>
                              )}
                            </p>
                            <p className="text-xs opacity-40 truncate" style={{ color: accentColor }}>{track.artist}</p>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                            style={{ color: trackColor, background: `${trackColor}15`, border: `1px solid ${trackColor}33` }}>
                            {qVibe?.icon}
                          </span>
                          {activePl && (
                            <motion.button whileTap={{ scale: 0.9 }}
                              title={`Añadir a ${activePl.name} en esta posición`}
                              // S111: route via PUT /api/playlists/:id/tracks (atomic replace)
                              // para que refreshDb no restaure el orden viejo de D1.
                              onClick={async () => {
                                const newIds = [...activePl.track_ids];
                                const activeIdxInPl = newIds.indexOf(activeTrack?.id);
                                const insertAt = activeIdxInPl >= 0 ? activeIdxInPl + 1 + queuePos : newIds.length;
                                newIds.splice(insertAt, 0, track.id);
                                try {
                                  if (workerClient.hasToken()) {
                                    await workerClient.put(`/api/playlists/${activePl.id}/tracks`, { track_ids: newIds });
                                  }
                                  const updated = dbPlaylists.map((p) => p.id === activePl.id ? { ...p, track_ids: newIds } : p);
                                  await patchDb((prev) => ({ ...prev, music_lab: { ...prev.music_lab, playlists: updated } })).catch(() => {});
                                  showToast({ msg: `AÑADIDO A ${activePl.name.toUpperCase()}` }, 2500);
                                } catch (err) {
                                  console.warn("[Búnker] insertTrackAt playlist falló:", err);
                                  showToast({ msg: "NO SE PUDO AÑADIR" }, 2500);
                                }
                              }}
                              className="flex-shrink-0 text-xs px-2 py-1 rounded-sm"
                              style={{ color: accentColor, border: `1px solid ${accentColor}44`, background: `${accentColor}12` }}>
                              ◈
                            </motion.button>
                          )}
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRemoveFromQueue(track.id)}
                            className="ml-1 flex-shrink-0 text-xs px-3 py-3 rounded-sm min-h-[44px] min-w-[44px]"
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
                  <span className="text-xs opacity-50 tracking-widest uppercase px-1" style={{ color: accentColor }}>
                    {queueContextName ? `playlist · ${queueContextName}` : 'contexto'}
                  </span>
                  <div className="flex flex-col gap-2">
                    {filteredQueue.filter((t) => t.id !== activeTrack?.id && !t._manual).map((track, i) => {
                      const qVibe = getVibeConfig(track.tag ?? track.vibe);
                      const ctxKey = `queue-ctx-${track.id}-${i}`;
                      return (
                        <div key={ctxKey}
                          draggable
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(i)}
                          className="flex items-center gap-3 p-3 rounded-sm"
                          style={{ background: GLASS_BG, border: `1px solid ${GLASS_BORDER}`, fontFamily: FONT_MONO, cursor: "grab" }}>
                          <span title="Arrastrar para reordenar" aria-label="Arrastrar para reordenar" style={{ color: accentColor, opacity: 0.6, fontSize: 12, flexShrink: 0 }}>⠿</span>
                          <div className="w-8 h-8 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}33` }}>
                            {track.thumbnail
                              ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                              : <span style={{ color: accentColor, fontSize: 10 }}>⌕</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: accentColor }}>{track.title}</p>
                            <p className="text-xs opacity-40 truncate" style={{ color: accentColor }}>{track.artist}</p>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded-sm flex-shrink-0"
                            style={{ color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}33` }}>
                            {qVibe?.icon}
                          </span>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRemoveFromQueue(track.id)}
                            className="ml-1 flex-shrink-0 text-xs px-3 py-3 rounded-sm min-h-[44px] min-w-[44px]"
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
                <div className="flex overflow-x-auto">
                  {/* S145-R4: dropdown via createPortal con posición calculada desde el trigger */}
                  <motion.button
                    ref={sortMenuRef}
                    whileTap={{ scale: 0.9 }}
                    style={{ touchAction: "manipulation" }}
                    onTap={() => {
                      if (showSortMenu) { setShowSortMenu(false); return; }
                      if (sortMenuRef.current) {
                        const rect = sortMenuRef.current.getBoundingClientRect();
                        const MENU_W = 140;
                        const MENU_H = 160;
                        let top = rect.bottom + 4;
                        let left = rect.left;
                        if (left + MENU_W > window.innerWidth - 8) left = rect.right - MENU_W;
                        if (top + MENU_H > window.innerHeight - 8) top = rect.top - MENU_H - 4;
                        left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
                        top = Math.max(8, Math.min(top, window.innerHeight - MENU_H - 8));
                        setSortDropdownPos({ top, left });
                        setShowSortMenu(true);
                      }
                    }}
                    title={`Ordenar: ${SORT_OPTIONS.find((o) => o.id === trackSort)?.label ?? "?"}`}
                    aria-label="Cambiar ordenación"
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center"
                  >
                    <span className="text-[10px] px-2 py-1.5 rounded-sm transition-all flex items-center gap-1"
                      style={{
                        color: accentColor,
                        border: `1px solid ${accentColor}33`,
                        background: `${accentColor}08`,
                        fontFamily: FONT_MONO,
                      }}
                    >
                      {SORT_OPTIONS.find((o) => o.id === trackSort)?.icon ?? "⇅"}
                      <span style={{ fontSize: 8, opacity: 0.6 }}>▾</span>
                    </span>
                  </motion.button>
                  {showSortMenu && sortDropdownPos && createPortal(
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                        style={{
                          position: "fixed",
                          top: sortDropdownPos.top,
                          left: sortDropdownPos.left,
                          zIndex: 9999,
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          padding: 4,
                          borderRadius: 2,
                          background: "#0a0a0a",
                          border: `1px solid ${accentColor}44`,
                          fontFamily: FONT_MONO,
                          minWidth: 100,
                        }}
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => { handleSortChange(opt.id); setShowSortMenu(false); }}
                            className="text-[10px] px-2 py-1 rounded-sm text-left flex items-center gap-2 transition-colors"
                            style={{
                              color: trackSort === opt.id ? accentColor : `${accentColor}66`,
                              background: trackSort === opt.id ? `${accentColor}15` : "transparent",
                            }}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </motion.div>,
                      document.body
                  )}
                  <span style={{ width: 1, background: `${accentColor}15`, margin: "2px 2px" }} />
                  <motion.button whileTap={{ scale: 0.9 }} title={`Vista: ${viewMode}`}
                    onClick={cycleViewMode}
                    className="w-11 h-11 flex items-center justify-center">
                    <span className="w-7 h-7 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: accentColor, border: `1px solid ${accentColor}33`,
                        background: `${accentColor}06`, fontFamily: FONT_MONO }}>
                      {VIEW_MODE_ICON[viewMode]}
                    </span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Buscar track"
                    onClick={() => { setShowTrackSearch((p) => !p); setTrackSearch(""); }}
                    className="w-11 h-11 flex items-center justify-center">
                    <span className="w-7 h-7 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: accentColor, border: `1px solid ${showTrackSearch ? accentColor + "66" : accentColor + "33"}`,
                        background: showTrackSearch ? `${accentColor}15` : `${accentColor}06` }}>
                      ⌕
                    </span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Añadir track"
                    onClick={() => { setShowAdd((p) => !p); setShowDelete(false); setShowEdit(false); setEditingTrack(null); }}
                    className="w-11 h-11 flex items-center justify-center">
                    <span className="w-7 h-7 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: accentColor, border: `1px solid ${showAdd ? accentColor + "66" : accentColor + "33"}`,
                        background: showAdd ? `${accentColor}15` : `${accentColor}06` }}>
                      {showAdd ? "✕" : "+"}
                    </span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Editar track"
                    onClick={() => { setShowEdit((p) => !p); setShowDelete(false); setShowAdd(false); setEditingTrack(null); }}
                    className="w-11 h-11 flex items-center justify-center">
                    <span className="w-7 h-7 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: accentColor, border: `1px solid ${showEdit ? accentColor + "66" : accentColor + "33"}`,
                        background: showEdit ? `${accentColor}15` : `${accentColor}06` }}>
                      {showEdit ? "✕" : "✎"}
                    </span>
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Eliminar track"
                    onClick={() => { setShowDelete((p) => !p); setShowAdd(false); setShowEdit(false); setEditingTrack(null); }}
                    className="w-11 h-11 flex items-center justify-center">
                    <span className="w-7 h-7 flex items-center justify-center rounded-sm text-sm transition-all"
                      style={{ color: "#ff4444", border: `1px solid ${showDelete ? "#ff444466" : "#ff444433"}`,
                        background: showDelete ? "#ff444415" : "#ff444406" }}>
                      {showDelete ? "✕" : "−"}
                    </span>
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
                {showDelete && createPortal(
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center p-6"
                    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowDelete(false)}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      className="relative w-full max-w-xs flex flex-col gap-2 p-4 rounded-sm max-h-[60vh] overflow-y-auto"
                      style={{ background: "#0e0e0e", border: "1px solid #ff444433", fontFamily: FONT_MONO }}
                      onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs tracking-[0.3em] uppercase font-bold mb-1" style={{ color: "#ff4444" }}>◈ ELIMINAR TRACK</p>
                      {rawTracks.length === 0 ? (
                        <p className="text-xs opacity-40" style={{ color: "#ff4444" }}>NO HAY TRACKS</p>
                      ) : (
                        rawTracks.filter(t => !t.is_deleted).map((track) => (
                          <div key={track.id} className="flex items-center justify-between px-3 py-2 rounded-sm"
                            style={{ background: "rgba(255,68,68,0.03)", border: "1px solid #ff444418" }}>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-xs font-bold truncate" style={{ color: "#ff6666" }}>{track.title}</span>
                              <span className="text-xs opacity-40 truncate" style={{ color: "#ff4444" }}>{track.artist}</span>
                            </div>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteTrack(track.id)}
                              className="ml-3 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
                              <span className="w-7 h-7 flex items-center justify-center rounded-sm text-xs"
                                style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}>
                                ✕
                              </span>
                            </motion.button>
                          </div>
                        ))
                      )}
                    </motion.div>
                  </motion.div>,
                  document.body
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
                          return (
                            <TrackCardGrid key={track.id} track={track} vc={vc} vibeColor={vibeColor}
                              isActive={isActive}
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
                    className="w-full py-3 text-xs tracking-[0.25em] uppercase font-bold rounded-sm mt-1"
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
                  <span style={{ color: accentColor }}>◈</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: accentColor }}>LISTS</span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: accentColor }}>
                    [{String(filteredPlaylists.length).padStart(2, "0")}]
                  </span>
                </div>
                <div className="flex gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} title="Buscar lista"
                    onClick={() => { setShowListSearch((p) => !p); setListSearch(""); }}
                    className="w-11 h-11 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: accentColor, border: `1px solid ${showListSearch ? accentColor + "66" : accentColor + "33"}`,
                      background: showListSearch ? `${accentColor}15` : `${accentColor}06` }}>
                    ⌕
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} title="Nueva playlist"
                    onClick={() => setShowCreatePlaylist((p) => !p)}
                    className="w-11 h-11 flex items-center justify-center rounded-sm text-sm transition-all"
                    style={{ color: accentColor, border: `1px solid ${showCreatePlaylist ? accentColor + "66" : accentColor + "33"}`,
                      background: showCreatePlaylist ? `${accentColor}15` : `${accentColor}06` }}>
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
                      style={{ width: "100%", background: `${accentColor}06`, border: `1px solid ${accentColor}33`, borderRadius: 2,
                        color: accentColor, fontSize: 11, padding: "7px 12px", fontFamily: FONT_MONO,
                        letterSpacing: "0.15em", outline: "none", boxSizing: "border-box" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showCreatePlaylist && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{ background: "rgba(191,255,0,0.03)", border: `1px solid ${accentColor}22`, borderRadius: 2 }}>
                    <PlaylistNameInput onConfirm={handleCreatePlaylist} />
                  </motion.div>
                )}
              </AnimatePresence>
              {filteredPlaylists.length === 0 ? (
                /* Fase 7.1 EC-LI1: Estado visual para playlist vacía que invita a crear */
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center gap-4 py-10 px-4 rounded-sm"
                  style={{
                    border: `1px dashed ${accentColor}22`,
                    background: `${accentColor}03`,
                    fontFamily: FONT_MONO,
                  }}
                >
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="text-2xl"
                    style={{ color: `${accentColor}44` }}
                  >
                    ◈
                  </motion.div>
                  <p className="text-xs tracking-[0.25em] uppercase text-center" style={{ color: accentColor, opacity: 0.3 }}>
                    Sin playlists aún
                  </p>
                  <p className="text-xs opacity-15 text-center leading-relaxed" style={{ color: accentColor }}>
                    Crea tu primera playlist y añade canciones.<br />
                    Cada lista puede tener su propio vibe y orden.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreatePlaylist(true)}
                    className="text-xs tracking-[0.2em] uppercase px-4 py-3 rounded-sm"
                    style={{
                      color: accentColor,
                      border: `1px solid ${accentColor}44`,
                      background: `${accentColor}0d`,
                    }}
                  >
                    + Crear playlist
                  </motion.button>
                </motion.div>
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
                        className="flex flex-col rounded-sm transition-transform duration-150 hover:scale-[1.02]"
                        style={{ background: GLASS_BG,          border: `1px ${isEmpty ? "dashed" : "solid"} ${isEmpty ? accentColor + "55" : (plVibe?.color ?? accentColor) + "33"}`, fontFamily: FONT_MONO, opacity: isEmpty ? 0.6 : 1, cursor: "grab" }}>
                        <div className="flex items-center gap-3 p-3"
                          onClick={() => !isRenaming && !isConfirmDel && setShowPlaylistDetail(pl.id)}
                          style={{ cursor: isRenaming || isConfirmDel ? "default" : "pointer" }}>
                          <span title="Arrastrar para reordenar" aria-label="Arrastrar para reordenar" style={{ color: accentColor, opacity: 0.6, fontSize: 12, flexShrink: 0 }}>⠿</span>
                          <div className="w-9 h-9 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden"
                            style={{ background: `${plVibe?.color ?? accentColor}12`, border: `1px solid ${plVibe?.color ?? accentColor}33` }}>
                            {plTracks[0]?.thumbnail
                              ? <img src={plTracks[0].thumbnail} alt="" className="w-full h-full object-cover opacity-70" />
                              : <span style={{ color: plVibe?.color ?? accentColor, fontSize: 12 }}>{isEmpty ? "◌" : "◈"}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isRenaming ? (
                              <input autoFocus value={renameVal}
                                onChange={(e) => setRenameVal(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleRenamePlaylist(pl.id); if (e.key === "Escape") setRenamingPlId(null); }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: "100%", background: "transparent", border: `1px solid ${accentColor}44`, borderRadius: 2,
                                  color: accentColor, fontSize: 11, padding: "2px 6px", fontFamily: FONT_MONO, outline: "none" }} />
                            ) : (
                              <span className="text-xs font-bold truncate block" style={{ color: accentColor }}>{pl.name}</span>
                            )}
                            <span className="text-xs opacity-30 truncate block" style={{ color: accentColor }}>
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
                              style={{ color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}33`, borderRadius: 2, fontSize: 10, padding: "12px 16px", fontFamily: FONT_MONO, flexShrink: 0 }}>
                              OK
                            </motion.button>
                          ) : (
                            <>
                              {!isEmpty && (
                                <motion.button whileTap={{ scale: 0.88 }}
                                  onClick={(e) => { e.stopPropagation(); handlePlayPlaylistContext(plTracks, pl.name); }}
                                  className="flex-shrink-0 flex items-center justify-center rounded-sm min-h-[44px] min-w-[44px]"
                                  style={{ color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}33`, fontSize: 11, fontFamily: FONT_MONO }}>
                                  ▶
                                </motion.button>
                              )}
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); setRenamingPlId(pl.id); setRenameVal(pl.name); setConfirmDeletePlId(null); }}
                                className="flex-shrink-0 flex items-center justify-center rounded-sm min-h-[44px] min-w-[44px]"
                                style={{ color: accentColor, background: `${accentColor}0a`, border: `1px solid ${accentColor}22`, fontSize: 11, fontFamily: FONT_MONO }}>
                                ✎
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); setConfirmDeletePlId(pl.id); setRenamingPlId(null); }}
                                className="flex-shrink-0 flex items-center justify-center rounded-sm min-h-[44px] min-w-[44px]"
                                style={{ color: "#ff4444", background: "#ff444408", border: "1px solid #ff444422", fontSize: 11, fontFamily: FONT_MONO }}>
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
                              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${accentColor}22`,
                                color: `${accentColor}55`, fontSize: 10, borderRadius: 2, cursor: "pointer", fontFamily: FONT_MONO }}>
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
                }}                  onSaveDropSeen={(dropId, trackMeta) => {
                    // Fase 7.7 DROP-M21: Snapshot de metadatos al marcar favorito
                    onMarkDropSeen?.(dropId, trackMeta);
                  }}
                onDeleteDrop={async (dropId) => {
                  if (!dropId || !workerClient.hasToken()) return;
                  try {
                    await workerClient.del(`/api/drops/${dropId}`);
                    await patchDb((prev) => ({
                      ...prev,
                      music_lab: {
                        ...prev.music_lab,
                        drops: (prev.music_lab?.drops ?? []).filter((d) => d.id !== dropId),
                      },
                    }));                    } catch (err) {                    console.warn("[Búnker] deleteDrop falló:", err);
                    showToast({ msg: "NO SE PUDO ELIMINAR" }, 2500);
                    return; // sin patchDb si D1 rechaza — estado local intacto
                    }
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
                onPlayFromTrack={(t) => {
                  // Fase 5.2 C2/C3: Reproducción granular desde track específico
                  playTrack(t);
                  setShowPlaylistDetail(null);
                }}
                onAddToQueue={addToQueue}
                onAddAllToQueue={(plTracks) => {
                  // Q12: Añadir playlist entera a cola con aviso si supera 75
                  const currentCount = localQueue.filter(t => t.id !== activeTrack?.id).length;
                  const totalAfter = currentCount + plTracks.length;
                  if (totalAfter > 75) {
                    showToast({
                      msg: `LA COLA LLEGARÍA A ${totalAfter} (LÍMITE 75)`,
                      action: () => {
                        const toAdd = plTracks.slice(0, Math.max(0, 75 - currentCount));
                        toAdd.forEach(t => addToQueue(t));
                        showToast({ msg: `${toAdd.length} TRACKS AÑADIDOS A COLA` }, 2500);
                      },
                      actionLabel: "AÑADIR MÁXIMO (75)",
                    }, 4000);
                  } else {
                    plTracks.forEach(t => addToQueue(t));
                    showToast({ msg: `PLAYLIST AÑADIDA (${plTracks.length})` }, 2500);
                  }
                }}
                onRemoveTrack={async (plId, trackId) => {
                  if (!plId || !trackId || !workerClient.hasToken()) return;
                  try {
                    await workerClient.del(`/api/playlists/${plId}/tracks/${trackId}`);
                    await patchDb((prev) => ({
                      ...prev,
                      music_lab: {
                        ...prev.music_lab,
                        playlists: (prev.music_lab?.playlists ?? []).map((p) =>
                          p.id === plId ? { ...p, track_ids: (p.track_ids ?? []).filter((id) => id !== trackId) } : p
                        ),
                      },
                    }));                    } catch (err) {                    console.warn("[Búnker] removeTrackFromPlaylist falló:", err);
                    showToast({ msg: "NO SE PUDO ELIMINAR" }, 2500);
                    return; // sin patchDb si D1 rechaza — estado local intacto
                    }
                }}
                onDeletePlaylist={(plId) => {
                  handleDeletePlaylist(plId);
                }}
                onReorderTracks={async (plId, newIds) => {
                  if (reorderingRef.current) return;
                  reorderingRef.current = true;
                  try {
                  if (!plId || !workerClient.hasToken()) return;
                  // S85d Q17-playlist: capturar previousIds ANTES del PUT
                  // para que el UNDO del toast pueda restaurar el orden
                  // original en D1 (server) y local (patchDb).
                  const pl = dbPlaylists.find((p) => p.id === plId);
                  const previousIds = pl ? [...(pl.track_ids ?? [])] : null;
                  try {
                    // REORDER-TRACKS fix (S84): mismo patrón. Antes solo
                    // patchDb (Drive) — D1 mantenía el orden viejo. PUT
                    // reemplaza todas las posiciones atómicamente.
                    await workerClient.put(`/api/playlists/${plId}/tracks`, { track_ids: newIds });
                    await patchDb((prev) => ({
                      ...prev,
                      music_lab: {
                        ...prev.music_lab,
                        playlists: (prev.music_lab?.playlists ?? []).map((plItem) =>
                          plItem.id === plId ? { ...plItem, track_ids: newIds } : plItem
                        ),
                      },
                    }));
                    // S85d Q17-playlist: emitir evento para que MusicLab muestre
                    // toast persistente con acción DESHACER (5s). El listener
                    // onPlaylistTracksReordered llama undoPlaylistTracksReorder
                    // (server) + patchDb (local) para restaurar previousIds.
                    if (Array.isArray(previousIds)) {
                      try {
                        window.dispatchEvent(new CustomEvent("bunker_playlist_tracks_reordered", {
                          detail: { plId, previousIds }
                        }));
                      } catch { /* SSR / no window */ }
                    }
                  } catch (err) {
                    console.warn("[Búnker] reorderPlaylistTracks falló:", err);
                    showToast({ msg: "NO SE PUDO REORDENAR" }, 2500);
                    return; // sin patchDb si D1 rechaza — estado local intacto
                  }
                  } finally {
                    reorderingRef.current = false;
                  }
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

      {/* EC-C3: Bottom Sheet — Reemplazar vs Añadir contexto */}
      <AnimatePresence>
        {contextSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setContextSheet(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-lg pb-6"
              style={{
                background: "#0a0a0a",
                border: `1px solid ${accentColor}33`,
                borderBottom: "none",
                fontFamily: FONT_MONO,
              }}
            >
              {/* Swipe handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full" style={{ background: `${accentColor}33` }} />
              </div>

              <div className="flex flex-col gap-3 px-5 pt-3">
                <p className="text-xs tracking-[0.25em] uppercase text-center" style={{ color: accentColor, opacity: 0.5 }}>
                  {contextSheet.plName?.toUpperCase() || "PLAYLIST"}
                </p>
                <p className="text-[10px] tracking-widest text-center leading-relaxed" style={{ color: accentColor, opacity: 0.3 }}>
                  Tienes tracks manuales en la cola. ¿Qué quieres hacer?
                </p>

                {/* Replace context */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setPlaybackContext(contextSheet.plTracks, contextSheet.plName);
                    setActiveTrack(contextSheet.plTracks[0]);
                    setAutoPlaySignal((n) => n + 1);
                    setContextSheet(null);
                  }}
                  className="w-full py-3.5 text-xs tracking-[0.35em] uppercase font-bold rounded-sm"
                  style={{
                    color: "#0a0a0a",
                    background: accentColor,
                    fontFamily: FONT_MONO,
                    boxShadow: `0 0 16px ${accentColor}33`,
                  }}
                >
                  REEMPLAZAR CONTEXTO
                </motion.button>

                {/* Append to end */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    contextSheet.plTracks.forEach((t) => addToQueue(t));
                    showToast({ msg: `AÑADIDOS ${contextSheet.plTracks.length} TRACKS A COLA` }, 2500);
                    setContextSheet(null);
                  }}
                  className="w-full py-3.5 text-xs tracking-[0.35em] uppercase font-bold rounded-sm"
                  style={{
                    color: accentColor,
                    background: `${accentColor}0d`,
                    border: `1px solid ${accentColor}44`,
                    fontFamily: FONT_MONO,
                  }}
                >
                  AÑADIR AL FINAL DE LA COLA
                </motion.button>

                {/* Cancel */}
                <button
                  onClick={() => setContextSheet(null)}
                  className="w-full py-3 text-xs tracking-widest uppercase opacity-40 hover:opacity-70 transition-opacity"
                  style={{ color: accentColor, fontFamily: FONT_MONO }}
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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