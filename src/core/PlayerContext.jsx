// ============================================================
//  EL BÚNKER — PlayerContext.jsx
//  Global Audio State Provider (ADR-004)
//  Centraliza: activeTrack, isPlaying, queue, autoPlaySignal,
//              refs YT/Audio, skip/loop/shuffle
// ============================================================

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { fetchQueue, saveQueue } from "./GoogleDriveService";

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
  const [loop,           setLoop]           = useState(false);
  const [shuffle,        setShuffle]        = useState(false);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);
  const [syncStatus,     setSyncStatus]     = useState("idle");
  const [activeVibe,     setActiveVibe]     = useState("all");
  const [masterVolume,   setMasterVolume]   = useState(80);

  const [ytReady, setYtReady] = useState(false);

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
    // Cola es fuente de verdad única para dir=1
    if (dir === 1 && localQueue.length > 0) {
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
    const nextIdx = shuffle
      ? Math.floor(Math.random() * list.length)
      : (base + dir + list.length) % list.length;
    setActiveTrack(list[nextIdx]);
    setAutoPlaySignal((n) => n + 1);
  }, [tracks, localQueue, activeTrack?.id, shuffle]);

  // ref para que onStateChange de YT no tenga stale closure sobre skip
  const skipRef = useRef(null);
  useEffect(() => { skipRef.current = skip; }, [skip]);

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
        setYtReady(false);
        ytPlayerRef.current.loadVideoById(videoId);
        return;
      }
      setYtReady(false);
      ytPlayerRef.current = new window.YT.Player("yt-player-div", {
        videoId,
        playerVars: { autoplay: 0, controls: 0, rel: 0 },
        events: {
          onReady: (e) => {
            e.target.setVolume(80);
            setYtReady(true);
          },
          onStateChange: (e) => {
            const s = e.data;
            if (s === window.YT.PlayerState.PLAYING)      { setIsPlaying(true); }
            else if (s === window.YT.PlayerState.PAUSED)  { setIsPlaying(false); stopPolling(); }
            else if (s === window.YT.PlayerState.ENDED)   {
              setIsPlaying(false); stopPolling();
              skipRef.current?.(1);
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
    if (loop && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      skip(1);
    }
  }, [loop, skip]);

  // ── src del audio: reactivo al track activo ───────────────────
  const audioSrc = (!activeTrack || activeTrack.type === "youtube")
    ? null
    : activeTrack.drive_file_id
      ? `https://www.googleapis.com/drive/v3/files/${activeTrack.drive_file_id}?alt=media`
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
      loop,        setLoop,
      shuffle,     setShuffle,
      autoPlaySignal, setAutoPlaySignal,
      syncStatus,
      activeVibe,   setActiveVibe,
      masterVolume, setMasterVolume,
      audioRef, ytPlayerRef, pollingRef,
      isYouTube, ytReady,
      skip, addToQueue, removeFromQueue, playTrack,
      startPolling, stopPolling,
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