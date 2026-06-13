// ============================================================
//  EL BÚNKER — PlayerContext.jsx
//  Global Audio State Provider (ADR-004)
//  Centraliza: activeTrack, isPlaying, queue, autoPlaySignal,
//              audioRef, skip/loop/shuffle, trackVibe (ADR-011)
//  Q14: cola unificada — cada item lleva _manual: boolean
//       _manual:true  → añadido por el usuario explícitamente
//       _manual:false → cargado desde contexto de playlist
// ============================================================

/* eslint-disable react-hooks/refs, react-hooks/immutability */
// ^ Los refs se acceden/modifican intencionalmente para evitar
//   stale closures en callbacks de audio nativo (skip, loopMode,
//   shuffle). Son patrones establecidos y funcionales del motor
//   de reproducción. No refactorizar sin tests.

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { getStreamUrl } from "./GoogleDriveService";
import { getVibeAccent as getVibeAccentCanonical, VIBE_TAGS as CANONICAL_VIBE_TAGS } from "../tokens";
import { trackPlay, trackPause, trackSkip } from "./StatsEngine";
const PlayerContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};

// S77: Queue constants
const MAX_QUEUE_SIZE = 75;

// S78: localStorage keys
const SESSION_KEY = (uid) => `el_bunker_session_${uid}`;

const API_BASE = import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev";

export function PlayerProvider({ children, userId, tracks = [], tags = [], jwtToken = null }) {
  // Resolver acento desde tags de DB primero, fallback a canonicos de tokens.js
  const resolveVibeAccent = useCallback((tagId) => {
    if (!tagId) return null;
    const allTags = tags.length > 0 ? tags : CANONICAL_VIBE_TAGS;
    const found = allTags.find((t) => t.id === tagId);
    if (found) {
      // Tags de DB pueden tener: palette.accent (canónico), seedColor, o color directo
      return found.palette?.accent ?? found.seedColor ?? found.color ?? getVibeAccentCanonical(tagId);
    }
    return getVibeAccentCanonical(tagId);
  }, [tags]);
  const [activeTrack,      setActiveTrack]      = useState(tracks[0] ?? null);
  const [isPlaying,        setIsPlaying]        = useState(false);
  // Q14: cola unificada. Cada item: { ...track, _manual: boolean }
  // _manual:true  → "Añadir a cola" / "Reproducir a continuación" (C4-A, C4-B)
  // _manual:false → tracks cargados desde contexto de playlist (C2/C4)
  const [localQueue,       setLocalQueue]       = useState([]);
  const [loopMode,         setLoopMode]         = useState("off");
  const [shuffle,          setShuffle]          = useState(false);
  // SH1: orden aleatorio de tracks restantes. Se regenera al activar shuffle o al agotarse.
  const shuffledListRef  = useRef([]);
  const shuffleIndexRef  = useRef(0);

  // Resetear estado de shuffle al desactivarlo
  useEffect(() => {
    if (!shuffle) {
      shuffledListRef.current = [];
      shuffleIndexRef.current = 0;
    }
  }, [shuffle]);
  const [autoPlaySignal,   setAutoPlaySignal]   = useState(0);
  const [syncStatus,       setSyncStatus]       = useState("idle");
  const [masterVolume,     setMasterVolume]     = useState(80);
  // playHistory — historial de sesión (Q2/Q3/Q15). Persiste en localStorage por usuario.
  // Se restaura al recargar. Se limpia al vaciar la cola o navegar todo el historial hacia atrás.
  const loadHistory = () => {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(`el_bunker_history_${userId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Solo filtrar tracks inexistentes si la biblioteca ya está cargada
      if (tracks.length > 0) return parsed.filter((h) => tracks.some((t) => t.id === h.id));
      return parsed;
    } catch { return []; }
  };
  const [playHistory,      setPlayHistory]      = useState(loadHistory);

  // S78: Restore play position for tracks >25min from localStorage
  const trackPositionRef = useRef({});
  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(SESSION_KEY(userId));
      if (saved) trackPositionRef.current = JSON.parse(saved);
    } catch { /* noop */ }
  }, [userId]);

  // S78: Save position periodically for tracks >25min
  useEffect(() => {
    if (!userId || !activeTrack?.id || !audioRef.current) return;
    const DURATION_THRESHOLD = 25 * 60;
    const interval = setInterval(() => {
      const dur = audioRef.current?.duration;
      const pos = audioRef.current?.currentTime;
      if (dur && dur > DURATION_THRESHOLD && pos != null) {
        trackPositionRef.current = { ...trackPositionRef.current, [activeTrack.id]: pos };
        try { localStorage.setItem(SESSION_KEY(userId), JSON.stringify(trackPositionRef.current)); }
        catch { /* noop */ }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, activeTrack?.id]);

  // S78: Restore position when loading a track that was saved
  const restorePosition = useCallback((track) => {
    if (!track?.id) return;
    const savedPos = trackPositionRef.current[track.id];
    if (savedPos && savedPos > 5 && audioRef.current) {
      audioRef.current.currentTime = savedPos;
    }
  }, []);

  // Persistir/limpiar historial en localStorage cuando cambia
  useEffect(() => {
    if (!userId) return;
    try {
      if (playHistory.length === 0) {
        localStorage.removeItem(`el_bunker_history_${userId}`);
      } else {
        localStorage.setItem(`el_bunker_history_${userId}`, JSON.stringify(playHistory));
      }
    } catch { /* localStorage lleno o no disponible */ }
  }, [playHistory, userId]);

  // Limpiar historial cuando se vacía la cola (acción explícita del usuario)
  const prevQueueLen = useRef(localQueue.length);
  useEffect(() => {
    const wasPopulated = prevQueueLen.current > 0;
    prevQueueLen.current = localQueue.length;
    // Solo limpiar si la cola pasa de tener tracks a estar vacía (no en mount inicial)
    if (wasPopulated && localQueue.length === 0 && userId) {
      setPlayHistory([]);
    }
  }, [localQueue.length, userId]);
  // queueContextName — nombre de la playlist activa en cola (C2). null si cola manual o vacía.
  const [queueContextName, setQueueContextName] = useState(null);

  // trackVibe — derivado de activeTrack?.tag, nunca state (ADR-011)
  const trackVibe = activeTrack?.tag ?? null;

  const audioRef        = useRef(null);
  const preloadAudioRef = useRef(null);  // Fase 1.1 — P-M8: segundo <audio> para precarga silenciosa
  const wakeLockRef     = useRef(null);

  // ── Persistencia cola en Drive ────────────────────────────
  // S76: Fetch queue from Worker API (D1) instead of Drive
  useEffect(() => {
    if (!userId || !jwtToken) return;
    fetch(`${API_BASE}/api/queue/${userId}`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((items) => {
        if (!Array.isArray(items) || !items.length) return;
        const qt = items
          .map((item) => {
            const t = tracks.find((tr) => tr.id === item.track_id);
            return t ? { ...t, _manual: !!item._manual } : null;
          })
          .filter(Boolean);
        if (!qt.length) return;
        setLocalQueue(qt);
        setActiveTrack(qt[0]);
      })
      .catch((err) => console.warn("[Búnker] fetchQueue (Worker):", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, jwtToken]);

  // S76: Save queue to Worker API (D1) instead of Drive
  useEffect(() => {
    if (!userId || !jwtToken) return;
    const items = localQueue.map((t, i) => ({
      track_id: t.id,
      is_manual: t._manual ? 1 : 0,
      context_name: queueContextName || null,
    }));
    if (!items.length && !activeTrack) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSyncStatus("syncing");
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/queue/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ items }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`queue save: ${res.status}`);
          setSyncStatus("idle");
        })
        .catch(() => { setSyncStatus("error"); setTimeout(() => setSyncStatus("idle"), 4000); });
    }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id, localQueue, userId, jwtToken]);

  // ── Skip ─────────────────────────────────────────────────
  // Q14: cola unificada — skip avanza en localQueue en orden.
  // No hay bifurcación queue/context. Shuffle aleatoriza solo
  // cuando la cola está vacía — nunca reordena posiciones existentes (Q1/Q8/Q9).
  const skip = useCallback((dir, filteredTracks) => {
    // L1: loop track absoluto — siguiente/anterior → seek inicio del track actual.
    // La única salida es reproducir otra canción explícitamente.
    if (loopModeRef.current === "track" && activeTrack && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    // skip(-1) — navega por historial (Q2)
    if (dir === -1) {
      if (activeTrack?.id) trackSkip(activeTrack.id, "history");
      setPlayHistory((h) => {
        if (h.length === 0) return h;
        const prev = h[h.length - 1];
        setActiveTrack(prev);
        setAutoPlaySignal((n) => n + 1);
        return h.slice(0, -1);
      });
      return;
    }

    // Cola unificada: si hay tracks en cola, avanzar en orden (Q1 — prioridad absoluta)
    // Q2: iterar hasta encontrar un track distinto del activo (evita loop en duplicados)
    if (dir === 1 && localQueue.length > 0) {
      let skipCount = 0;
      let next = localQueue[skipCount];
      while (next && next.id === activeTrack?.id && skipCount < localQueue.length - 1) {
        skipCount++;
        next = localQueue[skipCount];
      }
      if (activeTrack) {
        trackSkip(activeTrack.id, "queue_advance");
        setPlayHistory((h) => [...h, activeTrack]);
      }
      setLocalQueue((q) => q.slice(skipCount + 1));
      setActiveTrack(next);
      setAutoPlaySignal((n) => n + 1);
      return;
    }

    // Cola vacía: shuffle aleatoriza sobre filteredTracks o tracks globales
    const list = filteredTracks ?? tracks;
    if (!list.length) return;
    const idx  = list.findIndex((t) => t.id === activeTrack?.id);
    const base = idx < 0 ? 0 : idx;

    // loopMode "off" → parar al llegar al último track (BUG-09)
    if (dir === 1 && loopModeRef.current === "off" && !shuffle && base >= list.length - 1) {
      setIsPlaying(false);
      return;
    }

    if (activeTrack) {
      trackSkip(activeTrack.id, shuffle ? "shuffle" : "next");
      setPlayHistory((h) => [...h, activeTrack]);
    }
    // SH1: shuffle usa orden pre-generado, no random cada vez
    if (shuffle) {
      // Regenerar orden aleatorio si está vacío
      if (shuffledListRefStable.current.length === 0) {
        // Q3: shuffle solo tracks no escuchados (excluir playHistory)
        const historyIds = new Set(playHistory.map((t) => t.id));
        let remaining = list.filter((t) => t.id !== activeTrack?.id && !historyIds.has(t.id));
        // Si todos ya fueron escuchados, reiniciar incluyendo todos
        if (remaining.length === 0) {
          remaining = list.filter((t) => t.id !== activeTrack?.id);
          if (remaining.length === 0) remaining = [...list];
        }
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        shuffledListRefStable.current = remaining;
        shuffleIndexRefStable.current = 0;
      }
      const nextTrack = shuffledListRefStable.current[shuffleIndexRefStable.current];
      shuffleIndexRefStable.current++;
      if (shuffleIndexRefStable.current >= shuffledListRefStable.current.length) {
        shuffledListRefStable.current = [];
        shuffleIndexRefStable.current = 0;
      }
      setActiveTrack(nextTrack);
      setAutoPlaySignal((n) => n + 1);
      return;
    }
    const nextIdx = (base + dir + list.length) % list.length;
    setActiveTrack(list[nextIdx]);
    setAutoPlaySignal((n) => n + 1);
  }, [tracks, localQueue, activeTrack, shuffle, playHistory]);

  // refs para evitar stale closures en callbacks de audio nativo
  const skipRef     = useRef(null);
  const loopModeRef = useRef("off");
  useEffect(() => { skipRef.current     = skip;     }, [skip]);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  // SH1: mantener refs de shuffle sincronizados con closures del skip
  const shuffledListRefStable = useRef(shuffledListRef.current);
  const shuffleIndexRefStable = useRef(shuffleIndexRef.current);
  useEffect(() => { shuffledListRefStable.current = shuffledListRef.current; }, [shuffle]);
  useEffect(() => { shuffleIndexRefStable.current = shuffleIndexRef.current; }, [shuffle]);

  // ── Handlers cola ─────────────────────────────────────────

  // S77 Q6: enforce MAX_QUEUE_SIZE in queue operations
  const enforceQueueLimit = useCallback((q) => {
    if (q.length <= MAX_QUEUE_SIZE) return q;
    // Keep manual tracks, trim oldest non-active context tracks
    const manual = q.filter(t => t._manual);
    const context = q.filter(t => !t._manual);
    if (manual.length > MAX_QUEUE_SIZE) return manual.slice(-MAX_QUEUE_SIZE);
    const contextBudget = MAX_QUEUE_SIZE - manual.length;
    return [...context.slice(0, contextBudget), ...manual];
  }, []);

  // addToQueue — C4-B: añade al final, _manual:true
  const addToQueue = useCallback((track, force = false) => {
    if (!track) return "added";
    const isDup = localQueue.some((t) => t.id === track.id);
    if (isDup && !force) return "duplicate";
    setLocalQueue((q) => enforceQueueLimit([...q, { ...track, _manual: true }]));
    return "added";
  }, [localQueue, enforceQueueLimit]);

  // S77 Q12: add entire playlist to queue
  const addPlaylistToQueue = useCallback((playlistTracks, clearFirst = false) => {
    if (!Array.isArray(playlistTracks) || !playlistTracks.length) return "empty";
    setLocalQueue((q) => {
      const base = clearFirst ? [] : q;
      const newTracks = playlistTracks.map(t => ({ ...t, _manual: true }));
      return enforceQueueLimit([...base, ...newTracks]);
    });
    return "added";
  }, [enforceQueueLimit]);

  // addNext — C4-A: inserta tras el track activo, _manual:true
  const addNext = useCallback((track, force = false) => {
    if (!track) return "added";
    const isDup = localQueue.some((t) => t.id === track.id);
    if (isDup && !force) return "duplicate";
    setLocalQueue((q) => {
      const base = force ? q.filter((t) => t.id !== track.id) : q;
      const idx = base.findIndex((t) => t.id === activeTrack?.id);
      const insertAt = idx >= 0 ? idx + 1 : 0;
      return enforceQueueLimit([...base.slice(0, insertAt), { ...track, _manual: true }, ...base.slice(insertAt)]);
    });
    return "added";
  }, [localQueue, activeTrack?.id, enforceQueueLimit]);

  // setPlaybackContext — C2/C4: carga playlist como contexto, _manual:false
  // Q10: preserva tracks manuales (_manual:true) al cambiar de playlist.
  // Manual primero (prioridad Q1), luego el contexto nuevo.
  // contextName opcional: nombre de la playlist para mostrar en cabecera de COLA.
  const setPlaybackContext = useCallback((contextTracks, contextName = null) => {
    if (!Array.isArray(contextTracks)) return;
    const manualTracks = localQueue.filter((t) => t._manual);
    setLocalQueue([...manualTracks, ...contextTracks.map((t) => ({ ...t, _manual: false }))]);
    setQueueContextName(contextName ?? null);
  }, [localQueue]);

  // playbackContext — computed desde localQueue para compatibilidad con consumidores externos
  const playbackContext = localQueue.filter((t) => !t._manual);

  // S77 Q16/Q17: soft delete from queue (mark _deleted)
  const [softDeletedIds, setSoftDeletedIds] = useState(() => new Set());

  const removeFromQueue = useCallback((trackId, softDelete = true) => {
    setLocalQueue((q) => {
      if (softDelete) {
        setSoftDeletedIds(prev => new Set([...prev, trackId]));
        // Don't skip if active — just mark for UI dimming
        return q;
      }
      const isActive = activeTrack?.id === trackId;
      const filtered = q.filter((t) => t.id !== trackId);
      if (isActive) {
        const next = filtered[0] ?? null;
        if (next) { setActiveTrack(next); setAutoPlaySignal((n) => n + 1); }
        else setActiveTrack(tracks[0] ?? null);
      }
      return filtered;
    });
    // Auto-clear soft delete after 3s
    setTimeout(() => setSoftDeletedIds(prev => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    }), 3000);
  }, [activeTrack?.id, tracks]);

  // S77 Q17: undo soft delete
  const undoRemoveFromQueue = useCallback((trackId) => {
    setSoftDeletedIds(prev => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

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
    // Q10: añadir track actual al historial antes de cambiar de track
    if (activeTrack) {
      setPlayHistory((h) => [...h, activeTrack]);
    }
    setActiveTrack(track);
    setAutoPlaySignal((n) => n + 1);
  }, [activeTrack, isPlaying]);

  const toggleLoopMode = useCallback(() => {
    setLoopMode((m) => m === "off" ? "list" : m === "list" ? "track" : "off");
  }, []);

  // ── WakeLock ──────────────────────────────────────────────
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    const req = async () => {
      try { wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch { /* noop */ }
    };
    const rel = async () => {
      if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
    };
    const onVis = () => { if (document.visibilityState === "visible" && isPlaying) req(); };
    isPlaying ? req() : rel();
    document.addEventListener("visibilitychange", onVis);
    return () => { rel(); document.removeEventListener("visibilitychange", onVis); };
  }, [isPlaying]);

  // ── MediaSession API (S80-S81, Android M1-M12) ────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!activeTrack) { navigator.mediaSession.metadata = null; return; }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTrack.title || "Sin título",
      artist: activeTrack.artist || "El Búnker",
      album: activeTrack.era_id ? `Era ${activeTrack.era_id}` : "Music Lab",
      artwork: activeTrack.thumbnail ? [{ src: activeTrack.thumbnail, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => { audioRef.current?.play(); setIsPlaying(true); });
    navigator.mediaSession.setActionHandler("pause", () => { audioRef.current?.pause(); setIsPlaying(false); });
    navigator.mediaSession.setActionHandler("previoustrack", () => skip(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => skip(1));
    navigator.mediaSession.setActionHandler("seekto", (d) => { if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack]);

  // ── trackVibe → CSS custom property en body (ADR-011) ─────
  useEffect(() => {
    if (trackVibe) {
      const accent = resolveVibeAccent(trackVibe);
      if (accent) document.body.style.setProperty("--vibe-accent", accent);
    } else {
      document.body.style.removeProperty("--vibe-accent");
    }
  }, [trackVibe, resolveVibeAccent]);

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
  // P2.7: crossOrigin solo para R2 (workers.dev). Drive no devuelve CORS → crash.
  const audioCrossOrigin = audioSrc?.includes("workers.dev") ? "anonymous" : undefined;

  // ── Fase 1.1 — P-M8: Precarga del siguiente track al 80% ──────
  // Resuelve la URL del siguiente track sin efectos secundarios.
  // No muta estado — es una proyección pura del estado actual.
  const _resolveNextTrackUrl = useCallback(() => {
    // Loop track → mismo track se repite, no tiene sentido preload
    if (loopMode === "track") return null;

    // Cola activa → el siguiente es el primer track distinto del activo
    if (localQueue.length > 0) {
      let next = localQueue[0];
      if (next.id === activeTrack?.id && localQueue.length > 1) next = localQueue[1];
      else if (next.id === activeTrack?.id) return null;
      return getStreamUrl(next);
    }

    // Sin cola: buscar en la lista global (tracks)
    const list = tracks;
    if (!list.length || !activeTrack) return null;

    const idx = list.findIndex((t) => t.id === activeTrack.id);
    if (idx < 0) return null;

    // Shuffle activo → orden impredecible, no preload
    if (shuffle) return null;

    // Loop off y estamos en el último track → no hay siguiente
    if (loopMode === "off" && idx >= list.length - 1) return null;

    const nextIdx = (idx + 1) % list.length;
    return getStreamUrl(list[nextIdx]);
  }, [activeTrack, localQueue, loopMode, shuffle, tracks]);

  // Activar precarga cuando el track actual supera el 80% de duración.
  // El segundo <audio> carga la URL en cache del navegador. Silencioso.
  // Al saltar al siguiente track, el browser ya tiene el archivo → carga instantánea.
  useEffect(() => {
    const audio = audioRef.current;
    const preload = preloadAudioRef.current;
    if (!audio || !preload || !isPlaying) return;

    let triggered = false;
    const THRESHOLD = 0.8;

    const onTimeUpdate = () => {
      if (triggered) return;
      const dur = audio.duration;
      const ct  = audio.currentTime;
      if (!dur || !ct || dur <= 0) return;

      if (ct / dur >= THRESHOLD) {
        triggered = true;
        audio.removeEventListener("timeupdate", onTimeUpdate); // cleanup inmediato tras disparar
        const nextUrl = _resolveNextTrackUrl();
        if (nextUrl && preload.src !== nextUrl) {
          // crossOrigin debe coincidir con el audio principal
          const isR2 = nextUrl.includes("workers.dev");
          if (isR2) preload.crossOrigin = "anonymous";
          else preload.removeAttribute("crossOrigin");
          preload.src = nextUrl;
          preload.load();
          console.info("[Búnker] Precarga activada al 80%:", nextUrl.slice(-40));
        }
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [isPlaying, _resolveNextTrackUrl]);

  // Limpiar precarga cuando cambia el track activo
  useEffect(() => {
    const preload = preloadAudioRef.current;
    if (preload && preload.src) {
      preload.removeAttribute("src");
      preload.load();
    }
  }, [activeTrack?.id]);

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
      resolveVibeAccent,
      masterVolume, setMasterVolume,
      audioRef,
      skip, addToQueue, addNext, removeFromQueue, playTrack,
      playbackContext, setPlaybackContext,
      // S77: Cola features
      addPlaylistToQueue,
      softDeletedIds,
      undoRemoveFromQueue,
      MAX_QUEUE_SIZE,
      playHistory,
      queueContextName, setQueueContextName,
      // S78: Position restore
      restorePosition,
      vibrate: useCallback((pattern) => { try { navigator.vibrate?.(pattern); } catch { /* noop */ } }, []),
      // Shared listening (S82)
      sharedListening: false, setSharedListening: () => {},
    }}>
      {/* <audio> persistente — nunca se desmonta al cambiar de pestaña (ADR-004) */}
      <audio
        ref={audioRef}
        crossOrigin={audioCrossOrigin}
        src={audioSrc ?? undefined}
        loop={false}
        style={{ display: "none" }}
        onEnded={handleAudioEnded}
        onPause={() => {
          setIsPlaying(false);
          if (activeTrack) trackPause(activeTrack.id, audioRef.current?.currentTime ?? 0);
        }}
        onPlay={() => {
          setIsPlaying(true);
          if (activeTrack) trackPlay(activeTrack.id, activeTrack.title);
        }}
        onTimeUpdate={() => {
          // WinampPlayer se suscribe a audioRef.current directamente para progreso visual
        }}
        onLoadedMetadata={() => {
          // S78: Restore saved position for long tracks
          if (activeTrack) restorePosition(activeTrack);
        }}
      />
      {/* Fase 1.1 — P-M8: Precarga silenciosa del siguiente track.
          Sin volumen, sin controles. Solo para cache del navegador.
          El src se asigna programáticamente al alcanzar 80% de duración. */}
      <audio
        ref={preloadAudioRef}
        preload="none"
        style={{ display: "none" }}
      />
      {children}
    </PlayerContext.Provider>
  );
}