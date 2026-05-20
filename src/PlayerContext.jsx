// ============================================================
//  EL BÚNKER — PlayerContext.jsx
//  Global Audio State Provider (ADR-004)
//  Centraliza: activeTrack, isPlaying, queue, autoPlaySignal,
//              refs YT/Audio, skip/loop/shuffle
// ============================================================

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { ACID } from "./Layout";
import { fetchQueue, saveQueue } from "./GoogleDriveService";
import { AudioVisualizer } from "./AudioVisualizer";

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};

const extractYouTubeId = (url) => {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export function PlayerProvider({ children, userId, tracks = [] }) {
  const [activeTrack,    setActiveTrack]    = useState(tracks[0] ?? null);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [localQueue,     setLocalQueue]     = useState([]);
  const [loop,           setLoop]           = useState(false);
  const [shuffle,        setShuffle]        = useState(false);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);
  const [syncStatus,     setSyncStatus]     = useState("idle");

  const audioRef    = useRef(null);
  const ytPlayerRef = useRef(null);
  const pollingRef  = useRef(null);
  const wakeLockRef = useRef(null);

  const isYouTube = activeTrack?.type === "youtube" || (!activeTrack?.type && activeTrack?.url);

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

  // ── Polling YT ────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  const startPolling = useCallback((onTick) => {
    stopPolling();
    pollingRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      onTick(p.getCurrentTime() || 0, p.getDuration() || 0);
    }, 500);
  }, [stopPolling]);

  // ── Skip ─────────────────────────────────────────────────
  const skip = useCallback((dir, filteredTracks) => {
    const list = filteredTracks ?? tracks;
    if (dir === 1 && localQueue.length > 0) {
      const next = localQueue.find((t) => t.id !== activeTrack?.id);
      if (next) {
        setLocalQueue((q) => q.filter((t) => t.id !== next.id));
        setActiveTrack(next);
        setAutoPlaySignal((n) => n + 1);
        return;
      }
    }
    const idx = list.findIndex((t) => t.id === activeTrack?.id);
    if (idx < 0) return;
    const nextIdx = shuffle
      ? Math.floor(Math.random() * list.length)
      : (idx + dir + list.length) % list.length;
    setActiveTrack(list[nextIdx]);
    setAutoPlaySignal((n) => n + 1);
  }, [tracks, localQueue, activeTrack?.id, shuffle]);

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
    setActiveTrack(track);
    setAutoPlaySignal((n) => n + 1);
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

  return (
    <PlayerContext.Provider value={{
      activeTrack, setActiveTrack,
      isPlaying,   setIsPlaying,
      localQueue,  setLocalQueue,
      loop,        setLoop,
      shuffle,     setShuffle,
      autoPlaySignal, setAutoPlaySignal,
      syncStatus,
      audioRef, ytPlayerRef, pollingRef,
      isYouTube,
      skip, addToQueue, removeFromQueue, playTrack,
      startPolling, stopPolling,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}