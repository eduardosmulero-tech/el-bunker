// ============================================================
//  EL BÚNKER — PlayerContext.jsx
//  Global Audio State Provider (ADR-004)
//  Centraliza: activeTrack, isPlaying, queue, autoPlaySignal,
//              audioRef, skip/loop/shuffle, trackVibe (ADR-011)
// ============================================================

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { fetchQueue, saveQueue, getStreamUrl } from "./GoogleDriveService";
import { getVibeAccent } from "../tokens";
const PlayerContext = createContext(null);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};

export function PlayerProvider({ children, userId, tracks = [] }) {
  const [activeTrack,    setActiveTrack]    = useState(tracks[0] ?? null);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [localQueue,     setLocalQueue]     = useState([]);
  const [loopMode,       setLoopMode]       = useState("off");
  const [shuffle,        setShuffle]        = useState(false);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);
  const [syncStatus,     setSyncStatus]     = useState("idle");
  const [masterVolume,   setMasterVolume]   = useState(80);

  // trackVibe — derivado de activeTrack?.tag, nunca state (ADR-011)
  const trackVibe = activeTrack?.tag ?? null;

  const audioRef    = useRef(null);
  const wakeLockRef = useRef(null);


  // ── Persistencia cola en Drive ────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetchQueue(userId)
      .then((trackIds) => {
        if (!trackIds.length) return;
        const qt = trackIds.map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
        if (!qt.length) return;
        setLocalQueue(qt);
        setActiveTrack(qt[0]);
      })
      .catch((err) => console.warn("[Búnker] fetchQueue:", err));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const ids = activeTrack
      ? [activeTrack.id, ...localQueue.filter((t) => t.id !== activeTrack.id).map((t) => t.id)]
      : localQueue.map((t) => t.id);
    if (!ids.length) return;
    setSyncStatus("syncing");
    saveQueue(userId, ids)
      .then(() => setSyncStatus("idle"))
      .catch(() => { setSyncStatus("error"); setTimeout(() => setSyncStatus("idle"), 4000); });
  }, [activeTrack?.id, localQueue, userId]);

  // ── Skip ─────────────────────────────────────────────────
  const skip = useCallback((dir, filteredTracks) => {
    // Cola tiene prioridad solo si shuffle está desactivado (BUG-16)
    if (dir === 1 && localQueue.length > 0 && !shuffle) {
      const next = localQueue[0];
      setLocalQueue((q) => q.slice(1));
      setActiveTrack(next);
      setAutoPlaySignal((n) => n + 1);
      return;
    }
    const list = filteredTracks ?? tracks;
    if (!list.length) return;
    const idx = list.findIndex((t) => t.id === activeTrack?.id);
    const base = idx < 0 ? 0 : idx;
    // BUG-09: loopMode "off" → parar al llegar al último track
    if (dir === 1 && loopModeRef.current === "off" && !shuffle && base >= list.length - 1) {
      setIsPlaying(false);
      return;
    }
    const nextIdx = shuffle
      ? Math.floor(Math.random() * list.length)
      : (base + dir + list.length) % list.length;
    setActiveTrack(list[nextIdx]);
    setAutoPlaySignal((n) => n + 1);
  }, [tracks, localQueue, activeTrack?.id, shuffle]);

  // refs para evitar stale closures en callbacks de audio nativo
  const skipRef     = useRef(null);
  const loopModeRef = useRef("off");
  useEffect(() => { skipRef.current     = skip;     }, [skip]);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);

  // ── Handlers cola ─────────────────────────────────────────
  const addToQueue = useCallback((track) => {
    if (!track) return;
    setLocalQueue((q) => q.find((t) => t.id === track.id) ? q : [...q, track]);
  }, []);

  const removeFromQueue = useCallback((trackId) => {
    setLocalQueue((q) => {
      const isActive = activeTrack?.id === trackId;
      const filtered = q.filter((t) => t.id !== trackId);
      if (isActive) {
        const next = filtered.find((t) => t.id !== trackId);
        if (next) { setActiveTrack(next); setAutoPlaySignal((n) => n + 1); }
        else setActiveTrack(tracks[0] ?? null);
      }
      return filtered;
    });
  }, [activeTrack?.id, tracks]);

  const playTrack = useCallback((track) => {
    if (activeTrack?.id === track.id) {
      // BUG-11: tap en track activo → toggle play/pause
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    setActiveTrack(track);
    setAutoPlaySignal((n) => n + 1);
  }, [activeTrack?.id, isPlaying]);

  const toggleLoopMode = useCallback(() => {
    setLoopMode((m) => m === "off" ? "list" : m === "list" ? "track" : "off");
  }, []);

  // ── WakeLock ──────────────────────────────────────────────
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    const req = async () => {
      try { wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch (_) {}
    };
    const rel = async () => {
      if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
    };
    const onVis = () => { if (document.visibilityState === "visible" && isPlaying) req(); };
    isPlaying ? req() : rel();
    document.addEventListener("visibilitychange", onVis);
    return () => { rel(); document.removeEventListener("visibilitychange", onVis); };
  }, [isPlaying]);

  // ── trackVibe → CSS custom property en body (ADR-011) ─────
  useEffect(() => {
    if (trackVibe) {
      document.body.style.setProperty("--vibe-accent", getVibeAccent(trackVibe));
    } else {
      document.body.style.removeProperty("--vibe-accent");
    }
  }, [trackVibe]);

  // ── onEnded centralizado ──────────────────────────────────────────────
  const handleAudioEnded = useCallback(() => {
    if (loopMode === "track" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      skip(1);
    }
  }, [loopMode, skip]);

  // ── src del audio: reactivo al track activo ───────────────────
  const audioSrc = activeTrack
    ? getStreamUrl(activeTrack)
    : null;

  return (
    <PlayerContext.Provider value={{
      activeTrack, setActiveTrack,
      isPlaying,   setIsPlaying,
      localQueue,  setLocalQueue,
      loopMode,    setLoopMode,    toggleLoopMode,
      shuffle,     setShuffle,
      autoPlaySignal, setAutoPlaySignal,
      syncStatus,
      trackVibe,
      masterVolume, setMasterVolume,
      audioRef,
      skip, addToQueue, removeFromQueue, playTrack,
    }}>
      {/* <audio> persistente — nunca se desmonta al cambiar de pestaña (ADR-004) */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        src={audioSrc ?? undefined}
        loop={false}
        style={{ display: "none" }}
        onEnded={handleAudioEnded}
        onTimeUpdate={(e) => {
          // WinampPlayer se suscribe a audioRef directamente para el progreso visual
        }}
      />
      {children}
    </PlayerContext.Provider>
  );
}