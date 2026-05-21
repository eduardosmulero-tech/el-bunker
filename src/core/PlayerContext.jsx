// ============================================================
//  EL BÚNKER — PlayerContext.jsx
//  Global Audio State Provider (ADR-004)
//  Centraliza: activeTrack, isPlaying, queue, autoPlaySignal,
//              refs YT/Audio, skip/loop/shuffle
// ============================================================

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { fetchQueue, saveQueue, getStreamUrl } from "./GoogleDriveService";

// ─── VIBE COLOR MAP ───────────────────────────────────────────
// null = neutro (sin acento activo)
const VIBE_COLORS = {
  all:         null,
  gaming:      "#00ffcc",
  "420_chill": "#aaff44",
  dnb:         "#ff6b35",
  romantiqueo: "#bf00ff",
};
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

const loadYTApi = (onReady) => {
  if (window.YT && window.YT.Player) { onReady(); return; }
  if (!document.getElementById("yt-api-script")) {
    const tag = document.createElement("script");
    tag.id  = "yt-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prev?.(); onReady(); };
};

export function PlayerProvider({ children, userId, tracks = [] }) {
  const [activeTrack,    setActiveTrack]    = useState(tracks[0] ?? null);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [localQueue,     setLocalQueue]     = useState([]);
  const [loopMode,       setLoopMode]       = useState("off");
  const [shuffle,        setShuffle]        = useState(false);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);
  const [syncStatus,     setSyncStatus]     = useState("idle");
  const [activeVibe,     setActiveVibe]     = useState("all");
  const [masterVolume,   setMasterVolume]   = useState(80);

  const audioRef    = useRef(null);
  const ytPlayerRef = useRef(null);
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

  // refs para que callbacks de YT no tengan stale closures
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
        if (isYouTube) { ytPlayerRef.current?.pauseVideo?.(); }
        else           { audioRef.current?.pause(); }
        setIsPlaying(false);
      } else {
        if (isYouTube) { ytPlayerRef.current?.playVideo?.(); }
        else           { audioRef.current?.play().catch(() => {}); }
        setIsPlaying(true);
      }
      return;
    }
    setActiveTrack(track);
    setAutoPlaySignal((n) => n + 1);
  }, [activeTrack?.id, isPlaying, isYouTube]);

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

  // ── Vibe accent — CSS variable global ─────────────────────
  useEffect(() => {
    const color = VIBE_COLORS[activeVibe] ?? null;
    if (color) {
      document.documentElement.style.setProperty("--vibe-accent", color);
    } else {
      document.documentElement.style.removeProperty("--vibe-accent");
    }
  }, [activeVibe]);

   // ── Inicialización YT.Player persistente ─────────────────────────────
  useEffect(() => {
    if (!activeTrack) return;
    const isYT = activeTrack.type === "youtube" || (!activeTrack.type && activeTrack.url);
    if (!isYT) return;

    const initPlayer = () => {
      const videoId = extractYouTubeId(activeTrack.youtube_url ?? activeTrack.url ?? "");
      // Si el player ya existe, solo cambiar video — nunca destroy() sobre div controlado por React
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        ytPlayerRef.current.loadVideoById(videoId);
        return;
      }
      ytPlayerRef.current = new window.YT.Player("yt-player-div", {
        videoId,
        playerVars: { autoplay: 0, controls: 0, rel: 0 },
        events: {
          onReady: (e) => {
            e.target.setVolume(masterVolume ?? 80);
          },
          onStateChange: (e) => {
            const s = e.data;
            if (s === window.YT.PlayerState.PLAYING)     { setIsPlaying(true); }
            else if (s === window.YT.PlayerState.PAUSED) { setIsPlaying(false); }
            else if (s === window.YT.PlayerState.ENDED)  {
              if (loopModeRef.current === "track") {
                e.target.seekTo(0); e.target.playVideo();
              } else {
                setIsPlaying(false); skipRef.current?.(1);
              }
            }
          },
        },
      });
    };

    loadYTApi(initPlayer);
    // NO cleanup destroy aquí — el player debe sobrevivir cambios de pestaña
  }, [activeTrack?.id]);

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
  const audioSrc = (!activeTrack || activeTrack.type === "youtube")
    ? null
    : activeTrack.drive_file_id
      ? getStreamUrl(activeTrack.drive_file_id)
      : null;
  // ── div YT fuera del árbol React — imperativo, nunca en JSX ──────────
  useEffect(() => {
    if (document.getElementById("yt-player-div")) return;
    const div = document.createElement("div");
    div.id = "yt-player-div";
    div.style.display = "none";
    document.body.appendChild(div);
  }, []);

  return (
    <PlayerContext.Provider value={{
      activeTrack, setActiveTrack,
      isPlaying,   setIsPlaying,
      localQueue,  setLocalQueue,
      loopMode,    setLoopMode,    toggleLoopMode,
      shuffle,     setShuffle,
      autoPlaySignal, setAutoPlaySignal,
      syncStatus,
      activeVibe,   setActiveVibe,
      masterVolume, setMasterVolume,
      audioRef, ytPlayerRef,
      isYouTube,
      skip, addToQueue, removeFromQueue, playTrack,
    }}>
      {/* <audio> persistente — nunca se desmonta al cambiar de pestaña (ADR-004) */}
      <audio
        ref={audioRef}
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