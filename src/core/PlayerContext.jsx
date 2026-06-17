// ============================================================
//  EL BÚNKER — PlayerContext.jsx
//  Global Audio State Provider (ADR-004)
//  Centraliza: activeTrack, isPlaying, queue, autoPlaySignal,
//              audioRef, skip/loop/shuffle, trackVibe (ADR-011)
//  Q14: cola unificada — cada item lleva _manual: boolean
//       _manual:true  → añadido por el usuario explícitamente
//       _manual:false → cargado desde contexto de playlist
// ============================================================

 
// ^ Los refs se acceden/modifican intencionalmente para evitar
//   stale closures en callbacks de audio nativo (skip, loopMode,
//   shuffle). Son patrones establecidos y funcionales del motor
//   de reproducción. No refactorizar sin tests.

/* global cast, chrome */
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect */
// Las 3 reglas arriba son del react-hooks plugin v6+. En PlayerContext tenemos
// patrones intencionales y bien documentados que las disparan:
//   - immutability: refs como skipRef/loopModeRef/_activeVibeRef se sincronizan
//     en useEffect (`ref.current = state`) para evitar stale closures en
//     callbacks de audio nativo. Patrón documentado en el comentario de arriba.
//   - set-state-in-effect: el motor de audio necesita disparar transiciones
//     (vibe 2s, queue sync, OOM recovery) dentro de effects — no se puede
//     mover a event handlers sin romper la sincronización audio↔UI.
//   - refs: useRef(x.current) inicializa refs con valores de otros refs para
//     mantener la estabilidad de closures. Patrón del SH1 (shuffle estable).
// Refactorizar requiere dividir PlayerContext en sub-componentes — tarea de
// Fase 9+, fuera del scope del fix TDZ.

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { getStreamUrl } from "./GoogleDriveService";
import { getVibeAccent as getVibeAccentCanonical, VIBE_TAGS as CANONICAL_VIBE_TAGS } from "../tokens";
import { trackPlay, trackPause, trackSkip } from "./StatsEngine";
import { workerClient } from "./WorkerClient";
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
  const [loopMode,         setLoopMode]         = useState(() => {
    try { return localStorage.getItem("el_bunker_loop_mode") ?? "off"; } catch { return "off"; }
  });
  const [shuffle,          setShuffle]          = useState(() => {
    try { return localStorage.getItem("el_bunker_shuffle") === "1"; } catch { return false; }
  });
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

  // S8: persistir loopMode en localStorage (S85b)
  useEffect(() => {
    try { localStorage.setItem("el_bunker_loop_mode", loopMode); } catch { /* noop */ }
  }, [loopMode]);
  // S8: persistir shuffle en localStorage (S85b)
  useEffect(() => {
    try { localStorage.setItem("el_bunker_shuffle", shuffle ? "1" : "0"); } catch { /* noop */ }
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
        catch { console.debug("[Búnker] ⚠ localStorage position save failed (quota?)"); }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, activeTrack?.id]);

  // S78: Restore position when loading a track that was saved
  const restorePosition = useCallback((track) => {
    if (!track?.id) return;
    const savedPos = trackPositionRef.current[track.id];
    // S121-A: spec dice >5min (300s), no >5s
    if (savedPos && savedPos >= 300 && audioRef.current) {
      if (savedPos < (audioRef.current.duration || Infinity)) {
        audioRef.current.currentTime = savedPos;
      }
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

  // ═══════════════════════════════════════════════════════════
  //  Fase C — Escucha Compartida SC1-SC14 (S123)
  // ═══════════════════════════════════════════════════════════
  const [sessionId,        setSessionId]        = useState(null);
  const [isHost,           setIsHost]           = useState(false);
  const [partnerId,        setPartnerId]        = useState(null);
  const [partnerTrack,     setPartnerTrack]     = useState(null);  // SC14: track activo del otro
  const [partnerListening, setPartnerListening] = useState(false);  // SC5: ¿el otro está escuchando?
  const [sessionToast,     setSessionToast]     = useState(null);  // toast para eventos de sesión
  const _sessionPollRef         = useRef(null);       // AbortController para long-polling
  const _lastSyncTsRef          = useRef(0);          // Último timestamp recibido del server
  const _isRemoteActionRef      = useRef(false);       // Previene bucles: ignora cambios locales durante sync remoto
  const _wasDisconnectedRef     = useRef(false);       // SC8: se perdió conexión durante sesión
  const _pendingSessionIdRef    = useRef(null);       // Último pending_session_id detectado

  const partnerName = partnerId === "edu" ? "Edu" : partnerId === "david" ? "David" : partnerId || null;

  // Partner vibe: del server (presence track_vibe) o lookup local
  const partnerTrackVibe = partnerTrack?.vibe || partnerTrack?.tag ||
    (partnerTrack?.id ? tracks.find(t => t.id === partnerTrack.id)?.vibe || tracks.find(t => t.id === partnerTrack.id)?.tag : null) || null;

  // Crear sesión (host)
  const createSession = useCallback(async () => {
    if (!workerClient.hasToken()) return;
    try {
      const data = await workerClient.post("/api/sync", { action: "create" });
      setSessionId(data.session_id);
      setIsHost(true);
      setPartnerId(null);
      setPartnerListening(false);
      console.info("[Búnker] 🔗 Sesión compartida creada:", data.session_id);
    } catch (e) { console.warn("[Búnker] createSession error:", e); }
  }, []);

  // Unirse a sesión (guest)
  const joinSession = useCallback(async (sid) => {
    if (!workerClient.hasToken()) return;
    try {
      const data = await workerClient.post("/api/sync", { action: "join", session_id: sid });
      if (!data.active) return;
      setSessionId(sid);
      setIsHost(false);
      setPartnerId(data.host_id);
      // SC7: sincronizar al estado actual (track + posición)
      if (data.active_track_id) {
        const track = tracks.find(t => t.id === data.active_track_id);
        if (track) {
          _isRemoteActionRef.current = true;
          setActiveTrack(track);
          setAutoPlaySignal(n => n + 1);
          if (data.position > 0) {
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.currentTime = data.position;
              }
              _isRemoteActionRef.current = false;
            }, 600);
          } else {
            // SC7: Sin posición guardada → timeout de seguridad amplio (300ms)
            setTimeout(() => { _isRemoteActionRef.current = false; }, 300);
          }
        }
      }
      setSessionToast(`${data.host_id === "edu" ? "Edu" : "David"} está escuchando contigo`);
      console.info("[Búnker] 🔗 Unido a sesión:", sid);
    } catch (e) { console.warn("[Búnker] joinSession error:", e); }
  }, [tracks]);

  // Abandonar sesión (SC10, SC13)
  const leaveSession = useCallback(async () => {
    if (!sessionId) return;
    setSessionToast("Has abandonado la sesión compartida");
    try {
      await workerClient.del(`/api/sync?session_id=${sessionId}`);
    } catch { /* noop */ }
    setSessionId(null);
    setIsHost(false);
    setPartnerId(null);
    setPartnerTrack(null);
    _lastSyncTsRef.current = 0;
    console.info("[Búnker] 🔗 Sesión finalizada");
  }, [sessionId]);

  // SC5: Chequear presencia del partner + guardar pending_session_id
  const checkPresence = useCallback(async () => {
    if (!workerClient.hasToken() || !userId) return;
    try {
      const res = await workerClient.get(`/api/sync?action=presence&user_id=${userId}`);
      if (res?.active) {
        setPartnerListening(true);
        setPartnerTrack(res.active_track || null);
        const otherUserId = userId === "edu" ? "david" : "edu";
        setPartnerId(otherUserId);
        _pendingSessionIdRef.current = res.pending_session_id || null;
        // Auto-join: si el otro ya creó sesión, unirse automáticamente
        if (res.pending_session_id && !sessionId) {
          console.info("[Búnker] 🔗 Auto-join a sesión de", otherUserId);
          await joinSession(res.pending_session_id);
        }
      } else {
        setPartnerListening(false);
        setPartnerTrack(null);
        setPartnerId(null);
        _pendingSessionIdRef.current = null;
      }
    } catch { /* noop */ }
  }, [userId, sessionId, joinSession]);

  // Unirse a la sesión pendiente del partner (1 click desde el corazón)
  const joinPendingSession = useCallback(async () => {
    const sid = _pendingSessionIdRef.current;
    if (!sid) return;
    await joinSession(sid);
  }, [joinSession]);

  // Auto-crear sesión propia al empezar a reproducir o al recuperarse de leave
  useEffect(() => {
    if (!userId || !isPlaying || sessionId || !activeTrack) return;
    console.info("[Búnker] 🔗 Auto-create sesión propia al reproducir");
    createSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, userId, sessionId]);

  // Poll loop: chequear presencia cada 15s (SC5)
  useEffect(() => {
    if (!userId || sessionId) return;
    checkPresence();
    const interval = setInterval(checkPresence, 15000);
    return () => clearInterval(interval);
  }, [userId, sessionId, checkPresence]);

  // Sync: enviar acción local al partner (SC1, SC4)
  const syncAction = useCallback((action, opts = {}) => {
    if (!sessionId || _isRemoteActionRef.current) return;
    const body = {
      session_id: sessionId,
      action,
      track_id: action === "sync" ? null : (opts.trackId || activeTrack?.id || null),
      position: opts.position ?? (audioRef.current?.currentTime ?? null),
      is_playing: opts.isPlaying ?? isPlaying,
      queue: opts.queue || null,
    };
    if (opts.trackData) body.track_data = opts.trackData;
    if (activeTrack?.vibe || activeTrack?.tag) body.vibe = activeTrack.vibe || activeTrack.tag;
    workerClient.post("/api/sync", body).catch(() => {});
  }, [sessionId, activeTrack, isPlaying]);

  // Long-polling: recibir cambios del partner (SC4)
  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    const poll = async () => {
      let data;
      while (active) {
        try {
          const since = _lastSyncTsRef.current;
          const url = `/api/sync?session_id=${sessionId}&since=${since}`;
          const res = await workerClient.fetch(url);
          if (!active) break;
          data = await res.json();

          // SC8: reset disconnect flag on any successful response
          if (_wasDisconnectedRef.current) {
            _wasDisconnectedRef.current = false;
            setSessionToast({
              msg: "Conexión recuperada",
              action: () => {
                const latestPos = audioRef.current?.currentTime ?? 0;
                setSessionToast(`Sincronizado en ${Math.floor(latestPos / 60)}:${String(Math.floor(latestPos % 60)).padStart(2, "0")}`);
              },
              actionLabel: "RESINCRONIZAR",
              secondaryLabel: "MANTENER",
            });
          }

          if (data.ended) {
            // SC10: partner terminó la sesión — preserve partner's queue tracks (SC13)
            if (Array.isArray(data.queue_json) && data.queue_json.length > 0) {
              setLocalQueue((q) => {
                const existingIds = new Set(q.map(t => t.id));
                const partnerTracks = data.queue_json.filter(t => !existingIds.has(t.id));
                return partnerTracks.length ? [...q, ...partnerTracks] : q;
              });
            }
            setSessionId(null);
            setIsHost(false);
            setPartnerId(null);
            setPartnerTrack(null);
            setSessionToast("La sesión compartida ha terminado");
            break;
          }

          if (data.action === "joined" && isHost && data.guest_id) {
            // SC5: partner joined the session — show toast on host side
            setPartnerId(data.guest_id);
            setSessionToast(`${data.guest_id === "edu" ? "Edu" : "David"} se ha unido a la sesión`);
            continue;
          }

          if (!data.unchanged && data.session_id && data.action && data.action !== "created" && data.action !== "joined") {
            _lastSyncTsRef.current = new Date(data.updated_at).getTime();
            _isRemoteActionRef.current = true;

            // SC4: aplicar acción remota
            if (data.action === "play") {
              if (data.is_playing && audioRef.current) {
                audioRef.current.play().catch(() => {});
                setIsPlaying(true);
              }
              if (data.position != null && audioRef.current) {
                audioRef.current.currentTime = data.position;
              }
            } else if (data.action === "pause") {
              audioRef.current?.pause();
              setIsPlaying(false);
              if (data.position != null && audioRef.current) {
                audioRef.current.currentTime = data.position;
              }
            } else if (data.action === "skip" && data.active_track_id) {
              const track = tracks.find(t => t.id === data.active_track_id);
              if (track) {
                console.info("[Búnker] 🔄 Remote skip from", data.action_by, "→", track.id, track.title);
                setActiveTrack(track);
                setAutoPlaySignal(n => n + 1);
                if (data.position > 0) {
                  setTimeout(() => {
                    if (audioRef.current) audioRef.current.currentTime = data.position;
                  }, 300);
                }
              }
            } else if (data.action === "seek" && data.position != null) {
              if (audioRef.current) audioRef.current.currentTime = data.position;
            } else if (data.action === "sync" && data.position != null) {
              // SC4 premium: position drift correction (>1s gap)
              if (audioRef.current && Math.abs(audioRef.current.currentTime - data.position) > 1) {
                audioRef.current.currentTime = data.position;
              }
            } else if (data.action === "queue_remove" && data.active_track_id) {
              // SC2: remote queue remove
              setLocalQueue((q) => q.filter(t => t.id !== data.active_track_id));
            } else if (data.action === "queue_add" && Array.isArray(data.queue_json)) {
              // SC2: remote queue add — merge into local queue
              setLocalQueue((q) => {
                const existingIds = new Set(q.map(t => t.id));
                const newFromSession = data.queue_json.filter(t => t._added_by !== userId && !existingIds.has(t.id));
                if (!newFromSession.length) return q;
                const merged = [...q, ...newFromSession];
                return merged.length > MAX_QUEUE_SIZE ? merged.slice(-MAX_QUEUE_SIZE) : merged;
              });
            }

            // Actualizar presencia
            if (data.active_track_id) {
              const pt = tracks.find(t => t.id === data.active_track_id);
              setPartnerTrack(pt || null);
            }

            setTimeout(() => { _isRemoteActionRef.current = false; }, 150);
          }
        } catch {
          // SC8: mark disconnected, retry in 3s
          _wasDisconnectedRef.current = true;
          await new Promise(r => setTimeout(r, 3000));
        }

        if (!data?.unchanged) await new Promise(r => setTimeout(r, 1000));
      }
    };

    poll();
    return () => { active = false; };
  }, [sessionId, tracks]);

  // SC4: Sincronizar play/pause locales al partner
  const isPlayingRefShared = useRef(isPlaying);
  useEffect(() => { isPlayingRefShared.current = isPlaying; }, [isPlaying]);
  useEffect(() => {
    if (!sessionId || _isRemoteActionRef.current) return;
    const action = isPlaying ? "play" : "pause";
    syncAction(action, {
      position: audioRef.current?.currentTime ?? null,
      isPlaying,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, sessionId]);

  // SC4: Sincronizar skip al partner
  useEffect(() => {
    if (!sessionId || _isRemoteActionRef.current || !activeTrack) return;
    console.info("[Búnker] 🔄 Sync skip →", activeTrack.id, activeTrack.title);
    syncAction("skip", {
      trackId: activeTrack.id,
      position: 0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id, sessionId]);

  // SC5: Heartbeat de presencia mientras se está reproduciendo
  useEffect(() => {
    if (!userId || !workerClient.hasToken() || !activeTrack || !isPlaying) return;
    const sendHeartbeat = () => {
      const t = activeTrackRef.current;
      workerClient.post("/api/sync", {
        action: "heartbeat",
        track_id: t?.id || null,
        track_title: t?.title || null,
        track_vibe: t?.vibe || t?.tag || null,
      }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [userId, activeTrack?.id, isPlaying]);

  // Auto-clear session toast after 3s (only plain strings, not action toasts)
  useEffect(() => {
    if (!sessionToast) return;
    if (typeof sessionToast === "object" && sessionToast.action) return;
    const t = setTimeout(() => setSessionToast(null), 3000);
    return () => clearTimeout(t);
  }, [sessionToast]);

  const audioRef        = useRef(null);
  const preloadAudioRef = useRef(null);  // Fase 1.1 — P-M8: segundo <audio> para precarga silenciosa
  const wakeLockRef     = useRef(null);
  // Fase 1.4 — P2: estado de reintentos por error de red
  const _retryRef = useRef({ trackId: null, attempt: 0, timer: null });
  const _consecutiveSkipRef = useRef(0);  // S110: stop infinite skip loop on corrupt libraries
  // Fase 1.5 — EC-P2: detección de desconexión de red
  const [networkStatus, setNetworkStatus] = useState(() => navigator.onLine ? "online" : "offline");
  const _wasPlayingBeforeOffline = useRef(false);
  // Fase 1.7 — EC-P5: clave de archivo del track anterior para detectar duplicados
  const _prevFileKeyRef = useRef(null);
  // S106 — Gapless: trackea la URL del siguiente track ya precargado para evitar refetch
  const _nextTrackUrlRef = useRef(null);

  // ── Persistencia cola en D1 ───────────────────────────────
  // S115-D3: migrado a WorkerClient
  useEffect(() => {
    if (!userId || !workerClient.hasToken()) return;
    workerClient.get(`/api/queue/${userId}`)
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

  // S76: Save queue to Worker API (D1)
  // S115-D3: migrado a WorkerClient
  useEffect(() => {
    if (!userId || !workerClient.hasToken()) return;
    const items = localQueue.map((t) => ({
      track_id: t.id,
      is_manual: t._manual ? 1 : 0,
      context_name: queueContextName || null,
    }));
    if (!items.length && !activeTrack) return;
     
    setSyncStatus("syncing");
    const timer = setTimeout(() => {
      workerClient.fetch(`/api/queue/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
    // B1 fix (S112-A): loop track + skip(-1) respeta ADR-009 (3s rule).
    // Si currentTime >= 3s → seek a 0 (reiniciar track).
    // Si currentTime < 3s → ir al track anterior vía playHistory.
    if (loopModeRef.current === "track" && activeTrack && audioRef.current) {
      if (dir === 1 || audioRef.current.currentTime >= 3) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { setIsPlaying(false); });
        setIsPlaying(true);
        return;
      }
      // dir === -1 && currentTime < 3: fall through to playHistory navigation below
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

    // loopMode "off" → parar al llegar al último track (BUG-09)      // Fase 5.4 — C5: Fin de cola → parada consciente con fade del vibe
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
      // B6 fix (S112-B): validar índice antes de acceder.
      // Si el índice ya sobrepasó la longitud, regenerar orden primero.
      if (shuffledListRefStable.current.length === 0 || shuffleIndexRefStable.current >= shuffledListRefStable.current.length) {
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

  // ══ Refs para evitar stale closures en callbacks de audio nativo ══
  // activeTrackRef: usado por Chromecast + removeFromQueue (B3 fix S112-A)
  const activeTrackRef = useRef(activeTrack);
  useEffect(() => { activeTrackRef.current = activeTrack; }, [activeTrack]);

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

  // B3 fix (S112-A): ref para posponer cambio de activeTrack
  // tras la mutación de cola (setLocalQueue).
  const _pendingTrackChangeRef = useRef(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- patrón post-commit intencional: corre en cada render, solo actúa si el ref tiene valor
  useEffect(() => {
    const next = _pendingTrackChangeRef.current;
    if (!next) return;
    _pendingTrackChangeRef.current = null;
    setActiveTrack(next.track);
    if (next.autoPlay) setAutoPlaySignal((n) => n + 1);
  });

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
  // Returns: "added" | "duplicate" | "limit_reached" (S85c Q6: para toast con sugerencia)
  // B4 fix (S112-B): force=true con duplicado → eliminar existente antes de añadir
  const addToQueue = useCallback((track, force = false) => {
    if (!track) return "added";
    const isDup = localQueue.some((t) => t.id === track.id);
    if (isDup && !force) return "duplicate";
    // S85c Q6: detectar límite ANTES de añadir (no después) para que el handler
    // pueda mostrar toast con sugerencia de guardar como playlist
    if (localQueue.length >= MAX_QUEUE_SIZE && !force) return "limit_reached";
    setLocalQueue((q) => {
      const base = force ? q.filter((t) => t.id !== track.id) : q;
      const next = enforceQueueLimit([...base, { ...track, _manual: true }]);
      if (next.length >= MAX_QUEUE_SIZE && q.length < MAX_QUEUE_SIZE) {
        console.warn("[Búnker] ⚠ Cola llena (75 tracks). Considera guardar como playlist.");
      }
      return next;
    });
    // B5 follow-up (S112-B): limpiar softDeletedIds al re-añadir con force
    if (force) {
      setSoftDeletedIds(prev => { const n = new Set(prev); n.delete(track.id); return n; });
    }
    // SC2: sync queue add to shared session
    if (sessionId && !_isRemoteActionRef.current) {
      syncAction("queue_add", {
        trackData: { id: track.id, title: track.title, artist: track.artist, tag: track.tag },
      });
    }
    return "added";
  }, [localQueue, enforceQueueLimit, sessionId, syncAction]);

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
    // B3 fix (S112-A): usar activeTrackRef para evitar stale closure.
    // setActiveTrack ya no se llama dentro del updater de setLocalQueue —
    // se pospone vía _pendingTrackChangeRef + useEffect post-commit.
    setLocalQueue((q) => {
      if (softDelete) {
        setSoftDeletedIds(prev => new Set([...prev, trackId]));
        try {
          window.dispatchEvent(new CustomEvent("bunker_track_removed_from_queue", {
            detail: { trackId }
          }));
        } catch { /* SSR / no window */ }
        return q;
      }
      const isActive = activeTrackRef.current?.id === trackId;
      const filtered = q.filter((t) => t.id !== trackId);
      if (isActive) {
        const next = filtered[0] ?? null;
        _pendingTrackChangeRef.current = { track: next ?? tracks[0] ?? null, autoPlay: !!next };
      }
      return filtered;
    });
    // B5 fix (S112-B): no auto-limpiar softDeletedIds tras 3s.
    // La eliminación soft es permanente hasta que el usuario haga UNDO explícito.
    // SC2: sync actual removal (not soft delete) to shared session
    if (!softDelete && sessionId && !_isRemoteActionRef.current) {
      syncAction("queue_remove", { trackId });
    }
  }, [tracks, sessionId, syncAction]);

  // S77 Q17: undo soft delete
  const undoRemoveFromQueue = useCallback((trackId) => {
    setSoftDeletedIds(prev => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

  // S85d Q17: undo cola reorder (cola drag&drop). El snapshot se captura
  // antes del reorder; al pulsar DESHACER, restauramos la cola a su estado
  // previo. Para reorders de playlist (más complejo, requiere llamada PUT
  // con el orden original) — ver docs/legacy/PLIEGOS_HISTORIAL.md S85d.
  const undoColaReorder = useCallback((snapshot) => {
    if (!Array.isArray(snapshot)) return;
    setLocalQueue(snapshot);
  }, []);

  // S85d Q17-playlist: undo reorder de tracks dentro de una playlist
  // (PlaylistDetailModal). A diferencia de cola (local state), el reorder
  // de playlist es server-side: undo = PUT con el orden original. La
  // restauración del estado local la hace el handler del toast en MusicLab
  // (que tiene acceso a patchDb). Retorna Promise<boolean> para que el
  // toast pueda mostrar confirmación "ORDEN RESTAURADO" tras éxito.
  const undoPlaylistTracksReorder = useCallback(async (plId, originalTrackIds) => {
    if (!plId || !Array.isArray(originalTrackIds) || !workerClient.hasToken()) return false;
    try {
      const res = await workerClient.fetch(`/api/playlists/${plId}/tracks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: originalTrackIds }),
      });
      if (!res.ok) throw new Error(`undoPlaylistReorder: ${res.status}`);
      return true;
    } catch (err) {
      console.warn("[Búnker] undoPlaylistReorder falló:", err);
      return false;
    }
  }, []);

  const playTrack = useCallback((track) => {
    if (!track) return;
    if (activeTrack?.id === track.id) {
      // BUG-11: tap en track activo → toggle play/pause
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(() => { setIsPlaying(false); });
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

  // ── Fase 4.1 — VB5: Vibe se activa a los 2s de reproducción ─────
  // ADR-TDZ: Declarado ANTES de _activeVibeRef y useEffect que lo referencian.
  // Si se declara después, `useRef(activeVibe)` y el deps array `[activeVibe]`
  // lanzan ReferenceError: Cannot access 'activeVibe' before initialization.
  // Mantener el vibe anterior durante 2s tras cambio de track, luego transicionar.
  const [activeVibe, setActiveVibe] = useState(null);  // vibe visible en UI
  const _vibeTimerRef = useRef(null);
  // Fase 4.6 T8: pulso sutil cuando el mismo tag suena otra vez
  const [vibePulse, setVibePulse] = useState(0);

  // S109 — Chromecast sender
  const [castState, setCastState] = useState("unavailable"); // unavailable→available→connecting→connected
  const [castDeviceName, setCastDeviceName] = useState(null);
  const castSessionRef = useRef(null);

  // S109 — Init Chromecast SDK (se dispara cuando el SDK llama a __onGCastApiAvailable)
  useEffect(() => {
    window.__onGCastApiAvailable = (isAvailable) => {
      if (!isAvailable) return;
      try {
        const ctx = cast.framework.CastContext.getInstance();
        ctx.setOptions({
          receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        setCastState("available");
        console.info("[Búnker] ▶ Chromecast disponible");

        // Listener de cambios de sesión
        ctx.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (e) => {
          switch (e.sessionState) {
            case cast.framework.SessionState.SESSION_STARTED:
            case cast.framework.SessionState.SESSION_RESUMED:
              castSessionRef.current = ctx.getCurrentSession();
              setCastState("connected");
              setCastDeviceName(castSessionRef.current?.getCastDevice()?.friendlyName ?? null);
              // Pausar audio local al conectar
              audioRef.current?.pause();
              setIsPlaying(false);
              // Castear el track activo si hay
              if (activeTrackRef?.current) castTrackToDevice(activeTrackRef.current);
              console.info("[Búnker] ▶ Cast conectado:", castSessionRef.current?.getCastDevice()?.friendlyName);
              break;
            case cast.framework.SessionState.SESSION_ENDED:
              castSessionRef.current = null;
              setCastState("available");
              setCastDeviceName(null);
              console.info("[Búnker] ◼ Cast desconectado");
              break;
          }
        });
      } catch (e) {
        console.warn("[Búnker] Chromecast init error:", e);
      }
    };
    return () => { delete window.__onGCastApiAvailable; };
  }, []);

  // S109 — Castear un track al dispositivo conectado
  const castTrackToDevice = useCallback((track) => {
    const session = castSessionRef.current;
    if (!session || !track) return;
    const url = getStreamUrl(track);
    if (!url) return;
    const mediaInfo = new chrome.cast.media.MediaInfo(url, "audio/mpeg");
    if (track.title) {
      mediaInfo.metadata = new chrome.cast.media.MusicTrackMediaMetadata();
      mediaInfo.metadata.title = track.title;
    }
    if (track.artist && mediaInfo.metadata) mediaInfo.metadata.artist = track.artist;
    if (track.thumbnail && mediaInfo.metadata) mediaInfo.metadata.images = [{ url: track.thumbnail }];
    session.loadMedia(new chrome.cast.media.LoadRequest(mediaInfo)).catch((e) =>
      console.warn("[Búnker] Cast loadMedia error:", e)
    );
  }, []);

  // S109 — Iniciar sesión Cast (abre el picker de dispositivos)
  const startCasting = useCallback(() => {
    if (castState !== "available") return;
    setCastState("connecting");
    cast.framework.CastContext.getInstance()
      .requestSession()
      .catch(() => {
        setCastState("available"); // usuario canceló o error
      });
  }, [castState]);

  // S109 — Finalizar sesión Cast
  const stopCasting = useCallback(() => {
    castSessionRef.current?.endSession(true);
    castSessionRef.current = null;
    setCastState("available");
    setCastDeviceName(null);
  }, []);

  const isCasting = castState === "connected";

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
    // S110: Defender MediaSession contra R2 keys sin resolver (thumbnail → URL absoluta)
    const _msThumb = activeTrack.thumbnail
      ? (activeTrack.thumbnail.startsWith("http") ? activeTrack.thumbnail : `${import.meta.env.VITE_API_URL || "https://el-bunker-api.thebunker-admin.workers.dev"}/${activeTrack.thumbnail}`)
      : null;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTrack.title || "Sin título",
      artist: activeTrack.artist || "El Búnker",
      album: activeTrack.era_id ? `Era ${activeTrack.era_id}` : "Music Lab",
      artwork: _msThumb
        ? [{ src: _msThumb, sizes: "512x512", type: "image/jpeg" }]
        : vibeAccent
          ? [{ src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="${vibeAccent}"/></svg>`)}`, sizes: "512x512", type: "image/svg+xml" }]
          : [],
    });
    navigator.mediaSession.setActionHandler("play", () => { audioRef.current?.play()?.catch(() => {}); setIsPlaying(true); });
    navigator.mediaSession.setActionHandler("pause", () => { audioRef.current?.pause(); setIsPlaying(false); });
    navigator.mediaSession.setActionHandler("previoustrack", () => skip(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => skip(1));
    navigator.mediaSession.setActionHandler("seekto", (d) => { if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime; });
    // S91 A2/A3/A5: stop action handler para audio focus release (llamadas,
    // auriculares desconectados, otra app de audio). El sistema pausa
    // automáticamente; este handler limpia el estado interno.
    navigator.mediaSession.setActionHandler("stop", () => {
      // S91 A2/A3: audio focus release — pausar y actualizar estado.
      // Se dispara en llamadas entrantes, desconexión de auriculares,
      // o cuando otra app de audio toma el foco. El navegador ya pausó
      // el audio nativamente; este handler limpia el estado React.
      audioRef.current?.pause();
      setIsPlaying(false);
    });
    // S91 A2/A3 adicional: el evento 'pause' del elemento <audio> cubre
    // escenarios donde MediaSession 'stop' no se dispara (e.g. desconexión
    // Bluetooth en algunos dispositivos). El onPause del JSX ya maneja esto.
    // A5 (no ducking): requiere navigator.audioSession.type = 'playback'
    // (Chromium-only, no estándar) — diferido hasta que haya soporte cross-browser.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id]);

  // ── Fase 4.1 — VB5: Vibe se activa a los 2s de reproducción ─────
  // (declaración movida más arriba — ver bloque ADR-TDZ antes de _activeVibeRef)

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
        _vibeTimerRef.current = null;
      }, 1000);
    }
    return () => {
      if (_vibeTimerRef.current) {
        clearTimeout(_vibeTimerRef.current);
        _vibeTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- activeVibe se lee (comparación ===) pero el efecto se re-dispara solo en trackVibe
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
      // B2 fix (S112-A): no llamar setActiveVibe(null) aquí — ya es null.
      // Llamarlo re-dispara el efecto (deps incluyen activeVibe).
      // La limpieza del vibe en body la maneja el else sin tocar estado.
      document.body.style.transition = "--vibe-accent 1s ease";
      document.body.style.removeProperty("--vibe-accent");
    }
  }, [activeVibe, resolveVibeAccent]);

  // ── S106 — Precarga del siguiente track ──────
  // Resuelve la URL del siguiente track sin efectos secundarios.
  // No muta estado — es una proyección pura del estado actual.
  // Usada por los dos useEffect de precarga (inmediata + 50% threshold).
  // ADR-TDZ: declarado ANTES de handleAudioEnded para evitar ReferenceError
  // al evaluar el dependency array del useCallback.
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

  // ── onEnded centralizado ──────────────────────────────────────────────
  // S106 — Gapless: skip(1) ya maneja la inyección gapless del src
  // (via preloadAudioRef en la rama de cola unificada).
  const handleAudioEnded = useCallback(() => {
    if (loopMode === "track" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      skip(1);
    }
  }, [loopMode, skip]);

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
      _consecutiveSkipRef.current++;
      if (_consecutiveSkipRef.current > 5) {
        console.error("[Búnker] ⛔ Demasiados errores consecutivos — pausando reproducción");
        setIsPlaying(false);
        _consecutiveSkipRef.current = 0;
        return;
      }
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
  }, [activeTrack]);

  // Resetear contador de reintentos cuando el audio carga exitosamente
  const handleAudioCanPlay = useCallback(() => {
    if (_retryRef.current.timer) {
      clearTimeout(_retryRef.current.timer);
      _retryRef.current.timer = null;
    }
    _retryRef.current.attempt = 0;
    _retryRef.current.trackId = activeTrack?.id ?? null;
    _consecutiveSkipRef.current = 0;  // S110: resetear contador de skips consecutivos
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
      // S91 S4: no auto-reanudar — el usuario decide. Mostrar toast para que
      // la UI (Layout/MusicLab) ofrezca reanudar explícitamente.
      if (_wasPlayingBeforeOffline.current) {
        _wasPlayingBeforeOffline.current = false;
        try {
          window.dispatchEvent(new CustomEvent("bunker_network_restored"));
        } catch { /* SSR */ }
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
      // S91 S4: Track sin archivo → estado neutral consciente. Sin auto-skip.
      // Mostrar el track en pausa con toast informativo. El usuario decide
      // si saltar manualmente. La UI de Layout/MusicLab muestra el toast.
      console.warn("[Búnker] ⚠ Track sin archivo — estado neutral:", activeTrack.title);
      setResolvedAudioSrc(null);
      setIsPlaying(false);
      try {
        window.dispatchEvent(new CustomEvent("bunker_track_error", {
          detail: { type: "no_file", track: { id: activeTrack.id, title: activeTrack.title } }
        }));
      } catch { /* SSR / no window */ }
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
  }, [activeTrack]);

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

  // S106 — Gapless: Precarga del siguiente track.
  // Dos fases: (1) inmediata al arrancar el track actual (1s delay),
  // (2) threshold al 50% como safety net por si la cola cambió.
  // El segundo <audio> carga la URL en cache del navegador. Silencioso.
  // Al saltar al siguiente track, el browser ya tiene el archivo → carga instantánea.

  // ── S106 Fase 1: Precarga inmediata al arrancar un track nuevo ──
  useEffect(() => {
    if (!isPlaying || !activeTrack) return;
    // Esperar 1s para que el track actual tenga tiempo de buffer inicial
    const timer = setTimeout(() => {
      const nextUrl = _resolveNextTrackUrl();
      const preload = preloadAudioRef.current;
      if (!nextUrl || !preload) return;
      // Evitar refetch si ya tenemos el mismo URL precargado
      if (_nextTrackUrlRef.current === nextUrl && preload.src) {
        console.info("[Búnker] ⏭ Precarga inmediata (ya cached):", nextUrl.slice(-40));
        return;
      }
      _nextTrackUrlRef.current = nextUrl;
      const isR2 = nextUrl.includes("workers.dev");
      if (isR2) preload.crossOrigin = "anonymous";
      else preload.removeAttribute("crossOrigin");
      preload.src = nextUrl;
      preload.load();
      console.info("[Búnker] ⏭ Precarga inmediata (1s):", nextUrl.slice(-40));
    }, 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, activeTrack?.id, _resolveNextTrackUrl]);

  // ── S106 Fase 2: Safety net al 50% (bajado de 80%) ──
  useEffect(() => {
    const audio = audioRef.current;
    const preload = preloadAudioRef.current;
    if (!audio || !preload || !isPlaying) return;

    let triggered = false;
    const THRESHOLD = 0.5;

    const onTimeUpdate = () => {
      if (triggered) return;
      const dur = audio.duration;
      const ct  = audio.currentTime;
      if (!dur || !ct || dur <= 0) return;

      if (ct / dur >= THRESHOLD) {
        triggered = true;
        audio.removeEventListener("timeupdate", onTimeUpdate);
        const nextUrl = _resolveNextTrackUrl();
        if (nextUrl && _nextTrackUrlRef.current !== nextUrl) {
          _nextTrackUrlRef.current = nextUrl;
          const isR2 = nextUrl.includes("workers.dev");
          if (isR2) preload.crossOrigin = "anonymous";
          else preload.removeAttribute("crossOrigin");
          preload.src = nextUrl;
          preload.load();
          console.info("[Búnker] ⏭ Precarga 50% (cola cambió):", nextUrl.slice(-40));
        }
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, _resolveNextTrackUrl]);

  // S106 — Limpiar precarga cuando cambia el track activo.
  // Si el src del preloader es el siguiente track, NO limpiar — ya está listo.
  useEffect(() => {
    const preload = preloadAudioRef.current;
    if (!preload) return;
    const nextUrl = _resolveNextTrackUrl();
    // Si el preloader ya tiene el siguiente track, preservarlo para gapless
    if (nextUrl && preload.src === nextUrl) return;
    if (preload.src) {
      _nextTrackUrlRef.current = null;
      preload.removeAttribute("src");
      preload.load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id]);

  // ── Fase 2.8 — A1: Persistir estado para OOM kill recovery ──
  // Guarda activeTrack, localQueue, currentTime en localStorage cada 5s.
  // Al restaurar, reconstruye estado. Reproducción pausada.
  // S121-A: Solo guarda posición para tracks >25min con >5min escuchados (S2).
  // Tracks ≤25min siempre empiezan desde 0 (S1).
  const _recoveryRef = useRef(false);
  useEffect(() => {
    if (!userId || !activeTrack) return;
    const SAVE_KEY = `el_bunker_recovery_${userId}`;
    const DURATION_THRESHOLD = 25 * 60; // 25min
    const POSITION_THRESHOLD = 5 * 60;  // 5min
    const interval = setInterval(() => {
      try {
        const dur = audioRef.current?.duration;
        const pos = audioRef.current?.currentTime;
        // S121-A: solo guardar posición si track >25min Y posición >5min (S2)
        const shouldSavePos = dur && dur > DURATION_THRESHOLD && pos != null && pos >= POSITION_THRESHOLD;
        const state = {
          activeTrackId: activeTrack?.id ?? null,
          queueIds: localQueue.map((t) => t.id),
          position: shouldSavePos ? pos : 0,
          loopMode,
          shuffle,
          savedAt: Date.now(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch { console.debug("[Búnker] ⚠ localStorage OOM recovery save failed (quota?)"); }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, activeTrack, localQueue, loopMode, shuffle]);

  // Restaurar estado tras OOM kill (solo en mount)
  useEffect(() => {
    if (!userId || !tracks.length || _recoveryRef.current) return;
    _recoveryRef.current = true;
    const SAVE_KEY = `el_bunker_recovery_${userId}`;
    const POSITION_THRESHOLD = 5 * 60;
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
          // S121-A: Solo restaurar posición si >5min guardados (S2).
          // Si position < 300s → era track ≤25min o posición <5min → empezar desde 0 (S1).
          if (state.position >= POSITION_THRESHOLD) {
            setTimeout(() => {
              if (audioRef.current && state.position > 0) {
                audioRef.current.currentTime = state.position;
              }
            }, 300);
          }
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
      // S85d Q17: undo reorder de cola (snapshot-based)
      undoColaReorder,
      // S85d Q17-playlist: undo reorder de tracks dentro de una playlist
      // (server-side PUT con orden original)
      undoPlaylistTracksReorder,
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
      // S109 — Chromecast
      castState, startCasting, stopCasting, isCasting, castDeviceName,
      // Fase C — Escucha Compartida (S123)
      userId, sessionId, isHost, partnerId, partnerTrack, partnerListening, partnerName, partnerTrackVibe,
      createSession, joinSession, joinPendingSession, leaveSession, syncAction, checkPresence,
      sessionToast, setSessionToast,
      sharedListening: !!sessionId, setSharedListening: () => {},
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
      {/* S106 — Precarga silenciosa del siguiente track (gapless).
          Sin volumen, sin controles. Solo para cache del navegador.
          El src se asigna en 2 fases: inmediata (1s tras arrancar track) y safety net al 50%. */}
      <audio
        ref={preloadAudioRef}
        preload="none"
        style={{ display: "none" }}
      />
      {children}
    </PlayerContext.Provider>
  );
}