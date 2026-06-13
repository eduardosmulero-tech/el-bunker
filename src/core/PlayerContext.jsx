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
  // Fase 1.4 — P2: estado de reintentos por error de red
  const _retryRef = useRef({ trackId: null, attempt: 0, timer: null });
  // Fase 1.5 — EC-P2: detección de desconexión de red
  const [networkStatus, setNetworkStatus] = useState(() => navigator.onLine ? "online" : "offline");
  const _wasPlayingBeforeOffline = useRef(false);
  // Fase 1.7 — EC-P5: clave de archivo del track anterior para detectar duplicados
  const _prevFileKeyRef = useRef(null);

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
    const items = localQueue.map((t) => ({
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
      // Fase 1.2 — P3: Gapless. Si el preload ya tiene el siguiente track cargado,
      // inyectar su src en el audio principal antes de actualizar estado.
      if (next && preloadAudioRef.current && audioRef.current) {
        const nextUrl = getStreamUrl(next);
        if (preloadAudioRef.current.src === nextUrl) {
          const isR2 = nextUrl.includes("workers.dev");
          if (isR2) audioRef.current.crossOrigin = "anonymous";
          else audioRef.current.removeAttribute("crossOrigin");
          audioRef.current.src = nextUrl;
          audioRef.current.play().catch(() => {});
        }
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

    // Fase 5.5 — EC-C4: Loop de lista → volver al track 1 al agotar el contexto
    if (dir === 1 && loopModeRef.current === "list" && !shuffle && base >= list.length - 1) {
      if (activeTrack) {
        trackSkip(activeTrack.id, "loop_restart");
        setPlayHistory((h) => [...h, activeTrack]);
      }
      setActiveTrack(list[0]);
      setAutoPlaySignal((n) => n + 1);
      return;
    }

    // loopMode "off" → parar al llegar al último track (BUG-09)
    // Fase 5.4 — C5: Fin de cola → parada consciente con fade del vibe
    if (dir === 1 && loopModeRef.current === "off" && !shuffle && base >= list.length - 1) {
      setIsPlaying(false);
      document.body.style.removeProperty("--vibe-accent");
      setActiveVibe(null);
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
    setLocalQueue((q) => {
      const next = enforceQueueLimit([...q, { ...track, _manual: true }]);
      // Fase 3.1 — Q6: Aviso al alcanzar el límite de cola
      if (next.length >= MAX_QUEUE_SIZE && q.length < MAX_QUEUE_SIZE) {
        console.warn("[Búnker] ⚠ Cola llena (75 tracks). Considera guardar como playlist.");
      }
      return next;
    });
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

  // ── Fase 4.5 — VB19: Restaurar vibe al volver de background ──
  const _activeVibeRef = useRef(activeVibe);
  useEffect(() => { _activeVibeRef.current = activeVibe; }, [activeVibe]);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && _activeVibeRef.current) {
        const accent = resolveVibeAccent(_activeVibeRef.current);
        if (accent) document.body.style.setProperty("--vibe-accent", accent);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [resolveVibeAccent]);

  // ── MediaSession API (S80-S81, Android M1-M12) ────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!activeTrack) { navigator.mediaSession.metadata = null; return; }
    // Fase 2.1 — M2, M6, M7, M9: Artwork + color de vibe en notificación lockscreen
    const vibeAccent = resolveVibeAccent(activeTrack.tag);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTrack.title || "Sin título",
      artist: activeTrack.artist || "El Búnker",
      album: activeTrack.era_id ? `Era ${activeTrack.era_id}` : "Music Lab",
      artwork: activeTrack.thumbnail
        ? [{ src: activeTrack.thumbnail, sizes: "512x512", type: "image/jpeg" }]
        : vibeAccent
          ? [{ src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="${vibeAccent}"/></svg>`)}`, sizes: "512x512", type: "image/svg+xml" }]
          : [],
    });
    navigator.mediaSession.setActionHandler("play", () => { audioRef.current?.play(); setIsPlaying(true); });
    navigator.mediaSession.setActionHandler("pause", () => { audioRef.current?.pause(); setIsPlaying(false); });
    navigator.mediaSession.setActionHandler("previoustrack", () => skip(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => skip(1));
    navigator.mediaSession.setActionHandler("seekto", (d) => { if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id]);

  // ── Fase 4.1 — VB5: Vibe se activa a los 2s de reproducción ─────
  // Mantener el vibe anterior durante 2s tras cambio de track, luego transicionar.
  const [activeVibe, setActiveVibe] = useState(null);  // vibe visible en UI
  const _vibeTimerRef = useRef(null);
  // Fase 4.6 T8: pulso sutil cuando el mismo tag suena otra vez
  const [vibePulse, setVibePulse] = useState(0);

  useEffect(() => {
    if (_vibeTimerRef.current) {
      clearTimeout(_vibeTimerRef.current);
      _vibeTimerRef.current = null;
    }
    if (trackVibe) {
      // Fase 4.6 T8: Mismo tag → pulso sutil de intensidad (sin transición de 2s)
      if (trackVibe === activeVibe) {
        setVibePulse((n) => n + 1);
        return;
      }
      // Fase 4.6 T5: Transición interrumpida — cancelar timer anterior y arrancar
      // nuevo desde el estado actual (activeVibe se mantiene durante la transición)
      _vibeTimerRef.current = setTimeout(() => {
        setActiveVibe(trackVibe);
        _vibeTimerRef.current = null;
      }, 2000);
    } else {
      // Fase 4.6 T9: Track sin tag → fade 1s a color base oscuro (VB8)
      _vibeTimerRef.current = setTimeout(() => {
        setActiveVibe(null);
        _vibeTimerRef.current = null;
      }, 1000);
    }
    return () => {
      if (_vibeTimerRef.current) {
        clearTimeout(_vibeTimerRef.current);
        _vibeTimerRef.current = null;
      }
    };
  }, [trackVibe]);

  // Fase 4.6 T8: Aplicar pulso CSS al body durante 600ms
  useEffect(() => {
    if (vibePulse === 0) return;
    document.body.classList.add("vibe-pulse");
    const timer = setTimeout(() => document.body.classList.remove("vibe-pulse"), 600);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove("vibe-pulse");
    };
  }, [vibePulse]);

  // ── trackVibe → CSS custom property en body (ADR-011) ─────
  // Fase 4.6 T9: Transición CSS de 1s al cambiar de vibe (track sin tag → base oscuro)
  useEffect(() => {
    if (activeVibe) {
      const accent = resolveVibeAccent(activeVibe);
      if (accent) {
        document.body.style.transition = "--vibe-accent 1s ease";
        document.body.style.setProperty("--vibe-accent", accent);
      }
    } else {
      document.body.style.transition = "--vibe-accent 1s ease";
      document.body.style.removeProperty("--vibe-accent");
    }
  }, [activeVibe, resolveVibeAccent]);

  // ── onEnded centralizado ──────────────────────────────────────────────
  const handleAudioEnded = useCallback(() => {
    if (loopMode === "track" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      // Fase 1.2 — P3: Gapless. Si el preload ya tiene el siguiente track cargado,
      // inyectar su src en el audio principal antes de skip().
      // El navegador ya tiene el recurso en cache → arranque near-zero gap.
      const preload = preloadAudioRef.current;
      const nextUrl = _resolveNextTrackUrl();
      if (preload && nextUrl && preload.src === nextUrl && audioRef.current) {
        const isR2 = nextUrl.includes("workers.dev");
        if (isR2) audioRef.current.crossOrigin = "anonymous";
        else audioRef.current.removeAttribute("crossOrigin");
        audioRef.current.src = nextUrl;
        audioRef.current.play().catch(() => {});
      }
      skip(1);
    }
  }, [loopMode, skip, _resolveNextTrackUrl]);

  // ── Fase 1.4 — P2: Reintento con backoff exponencial ante errores de red ──
  // 3 reintentos: inmediato, 1s, 2s. Tras agotarlos → skip(1) automático.
  // No reintenta errores de formato (MEDIA_ERR_SRC_NOT_SUPPORTED).
  const handleAudioError = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    // Inicializar o detectar cambio de track (primera ejecución o skip durante retry)
    if (_retryRef.current.trackId !== activeTrack.id) {
      _retryRef.current.trackId = activeTrack.id;
      _retryRef.current.attempt = 0;
    }

    const error = audio.error;
    const MAX_RETRIES = 3;

    // MEDIA_ERR_SRC_NOT_SUPPORTED (código 4) → formato no soportado, no reintentar
    if (error?.code === 4) {
      console.warn("[Búnker] Formato no soportado — saltando:", activeTrack.title);
      _retryRef.current.attempt = 0;
      skipRef.current?.(1);
      return;
    }

    _retryRef.current.attempt++;

    if (_retryRef.current.attempt > MAX_RETRIES) {
      console.warn(`[Búnker] ❌ Fallo de red tras ${MAX_RETRIES} reintentos — saltando:`, activeTrack.title);
      _retryRef.current.attempt = 0;
      skipRef.current?.(1);
      return;
    }

    // Backoff: intento 1 → inmediato, intento 2 → 1s, intento 3 → 2s
    const delay = _retryRef.current.attempt === 1 ? 0 : _retryRef.current.attempt === 2 ? 1000 : 2000;
    const trackTitle = activeTrack.title;

    console.info(`[Búnker] 🔄 Reintento ${_retryRef.current.attempt}/${MAX_RETRIES} en ${delay}ms:`, trackTitle);

    _retryRef.current.timer = setTimeout(() => {
      if (!audioRef.current || _retryRef.current.trackId !== activeTrack?.id) return;
      audioRef.current.load();
    }, delay);
  }, [activeTrack?.id]);

  // Resetear contador de reintentos cuando el audio carga exitosamente
  const handleAudioCanPlay = useCallback(() => {
    if (_retryRef.current.timer) {
      clearTimeout(_retryRef.current.timer);
      _retryRef.current.timer = null;
    }
    _retryRef.current.attempt = 0;
    _retryRef.current.trackId = activeTrack?.id ?? null;
  }, [activeTrack?.id]);

  // Cancelar reintentos pendientes al cambiar de track
  useEffect(() => {
    if (_retryRef.current.timer) {
      clearTimeout(_retryRef.current.timer);
      _retryRef.current.timer = null;
    }
    _retryRef.current.attempt = 0;
    _retryRef.current.trackId = activeTrack?.id ?? null;
  }, [activeTrack?.id]);

  // Mantener ref de isPlaying para el handler de offline (evita stale closure)
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ── Fase 1.5 — EC-P2: Detección de desconexión de red ─────
  // Pausa automática al perder conexión. Reanuda al recuperar.
  useEffect(() => {
    const handleOffline = () => {
      console.info("[Búnker] 📡 Sin conexión");
      setNetworkStatus("offline");
      if (isPlayingRef.current && audioRef.current) {
        _wasPlayingBeforeOffline.current = true;
        audioRef.current.pause();
      }
    };

    const handleOnline = () => {
      console.info("[Búnker] 📡 Conexión recuperada");
      setNetworkStatus("online");
      if (_wasPlayingBeforeOffline.current && audioRef.current) {
        _wasPlayingBeforeOffline.current = false;
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
  // Antes de hacer stream desde R2, verifica si el track ya está en Cache API.
  // Si existe en caché → blob URL (reproducción instantánea, sin red).
  // Si no existe → URL de red (el SW lo cacheará para la siguiente vez).
  const [resolvedAudioSrc, setResolvedAudioSrc] = useState(null);
  const _blobUrlRef = useRef(null);  // para cleanup de blob URLs

  useEffect(() => {
    if (!activeTrack) {
      setResolvedAudioSrc(null);
      if (_blobUrlRef.current) {
        URL.revokeObjectURL(_blobUrlRef.current);
        _blobUrlRef.current = null;
      }
      return;
    }

    const url = getStreamUrl(activeTrack);
    if (!url) {
      // Fase 1.6 — EC-P4: Track sin archivo (sin r2_key ni drive_file_id)
      console.warn("[Búnker] ⚠ Track sin archivo — saltando:", activeTrack.title);
      setResolvedAudioSrc(null);
      // setTimeout evita encadenamiento rápido si varios tracks seguidos no tienen archivo
      setTimeout(() => skipRef.current?.(1), 50);
      return;
    }

    // Fase 1.7 — EC-P5: Si es el mismo archivo que el track anterior, hacer seek a 0
    // en lugar de recargar. Compara r2_key o drive_file_id.
    const fileKey = activeTrack.r2_key || activeTrack.drive_file_id || null;
    if (fileKey && fileKey === _prevFileKeyRef.current && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      _prevFileKeyRef.current = fileKey;
      console.info("[Búnker] ⏮ Mismo archivo — seek a 0:", activeTrack.title);
      return;
    }
    _prevFileKeyRef.current = fileKey;

    // Set network URL immediately as baseline — el audio arranca sin delay.
    // Si el track ya está en caché, se actualiza a blob URL tras la verificación async.
    setResolvedAudioSrc(url);

    // Si Cache API no está disponible (non-secure context), no hay nada más que hacer.
    if (typeof caches === "undefined") return;

    let cancelled = false;

    (async () => {
      try {
        const cached = await caches.match(url);
        if (!cancelled && cached && cached.ok) {
          const blob = await cached.blob();
          if (!cancelled && blob.size > 0) {
            const blobUrl = URL.createObjectURL(blob);
            if (_blobUrlRef.current) URL.revokeObjectURL(_blobUrlRef.current);
            _blobUrlRef.current = blobUrl;
            setResolvedAudioSrc(blobUrl);
            console.info("[Búnker] ♻ Audio desde caché local:", url.slice(-40));
            return;
          }
        }
      } catch {
        // Cache API falló — el audio ya está cargando desde la URL de red (baseline).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTrack?.id]);

  // Cleanup blob URLs al desmontar el provider
  useEffect(() => {
    return () => {
      if (_blobUrlRef.current) {
        URL.revokeObjectURL(_blobUrlRef.current);
      }
    };
  }, []);

  // P2.7: crossOrigin solo para R2 (workers.dev). Blob URLs son same-origin → no necesitan CORS.
  const audioCrossOrigin = resolvedAudioSrc
    ? (resolvedAudioSrc.startsWith("blob:") ? undefined : resolvedAudioSrc.includes("workers.dev") ? "anonymous" : undefined)
    : undefined;

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

  // ── Fase 2.8 — A1: Persistir estado para OOM kill recovery ──
  // Guarda activeTrack, localQueue, currentTime en localStorage cada 5s.
  // Al restaurar, reconstruye estado. Reproducción pausada.
  const _recoveryRef = useRef(false);
  useEffect(() => {
    if (!userId || !activeTrack) return;
    const SAVE_KEY = `el_bunker_recovery_${userId}`;
    const interval = setInterval(() => {
      try {
        const state = {
          activeTrackId: activeTrack?.id ?? null,
          queueIds: localQueue.map((t) => t.id),
          position: audioRef.current?.currentTime ?? 0,
          loopMode,
          shuffle,
          savedAt: Date.now(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch { /* noop */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, activeTrack?.id, localQueue, loopMode, shuffle]);

  // Restaurar estado tras OOM kill (solo en mount)
  useEffect(() => {
    if (!userId || !tracks.length || _recoveryRef.current) return;
    _recoveryRef.current = true;
    const SAVE_KEY = `el_bunker_recovery_${userId}`;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      // Solo restaurar si se guardó en los últimos 30 min (sesión reciente)
      if (Date.now() - state.savedAt > 30 * 60 * 1000) return;
      if (state.activeTrackId) {
        const restoredTrack = tracks.find((t) => t.id === state.activeTrackId);
        if (restoredTrack) {
          setActiveTrack(restoredTrack);
          const restoredQueue = state.queueIds
            .map((id) => tracks.find((t) => t.id === id))
            .filter(Boolean)
            .map((t) => ({ ...t, _manual: true }));
          if (restoredQueue.length) setLocalQueue(restoredQueue);
          setLoopMode(state.loopMode ?? "off");
          setShuffle(state.shuffle ?? false);
          // Restaurar posición tras breve delay (esperar a que audioRef esté listo)
          setTimeout(() => {
            if (audioRef.current && state.position > 0) {
              audioRef.current.currentTime = state.position;
            }
          }, 300);
          console.info("[Búnker] ♻ Sesión restaurada tras OOM kill");
        }
      }
    } catch { /* noop */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tracks.length]);

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
      // Fase 3.6 — UX2: Feedback háptico en acciones táctiles
      vibrate: useCallback((pattern) => { try { navigator.vibrate?.(pattern || [10]); } catch { /* noop */ } }, []),
      // Fase 4.1 — VB5: vibe con delay de 2s (activo en UI)
      activeVibe,
      // Fase 1.5 — EC-P2: estado de red
      networkStatus,
      // Fase 4.1 — VB5/4.6-T8: pulso sutil cuando mismo tag suena otra vez
      vibePulse,
      // Shared listening (S82)
      sharedListening: false, setSharedListening: () => {},
    }}>
      {/* <audio> persistente — nunca se desmonta al cambiar de pestaña (ADR-004) */}
      <audio
        ref={audioRef}
        crossOrigin={audioCrossOrigin}
        src={resolvedAudioSrc ?? undefined}
        loop={false}
        style={{ display: "none" }}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        onCanPlay={handleAudioCanPlay}
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