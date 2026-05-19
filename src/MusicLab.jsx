// ============================================================
//  EL BÚNKER — MusicLab.jsx
//  Music Lab & Visualizer · Parte 3
//  Stack: React + Framer Motion + Web Audio API
//  Estética: Winamp retro-future / Cyber-Vandal
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchQueue, saveQueue, fetchPlaylists, createPlaylist, addTrackToPlaylist, getStreamUrl } from "./GoogleDriveService";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ACID, PURPLE, BG } from "./Layout";

// ─── DESIGN TOKENS ───────────────────────────────────────────
const GLASS_BG     = "rgba(191,255,0,0.03)";
const GLASS_BORDER = "rgba(191,255,0,0.12)";
const PURPLE_BG    = "rgba(191,0,255,0.04)";
const PURPLE_BORDER= "rgba(191,0,255,0.2)";
const FONT_MONO    = "'JetBrains Mono', 'Courier New', monospace";

// ─── VIBE TAGS CONFIG ────────────────────────────────────────
const VIBE_TAGS = [
  { id: "all",         label: "ALL",        icon: "◈", color: ACID   },
  { id: "gaming",      label: "GAMING",     icon: "◉", color: "#00ffcc" },
  { id: "420_chill",   label: "420 CHILL",  icon: "◎", color: "#aaff44" },
  { id: "dnb",         label: "DnB",        icon: "⚡", color: "#ff6b35" },
  { id: "romantiqueo", label: "ROMANTIQUEO",icon: "♥", color: PURPLE  },
];

// ─── DEMO DATA ───────────────────────────────────────────────
const DEMO_TRACKS = [
  { id: "t1", title: "Knife Party – LRAD",        artist: "Knife Party",   url: "", vibe: "dnb",         note: "Para cuando llegamos a casa.", era_id: null, added_at: new Date().toISOString() },
  { id: "t2", title: "RL Grime – UCLA",            artist: "RL Grime",      url: "", vibe: "gaming",      note: "El himno de las noches largas.", era_id: null, added_at: new Date().toISOString() },
  { id: "t3", title: "Cigarettes After Sex – Crush",artist: "CAS",          url: "", vibe: "romantiqueo", note: "Te la dedico.", era_id: null, added_at: new Date().toISOString() },
  { id: "t4", title: "Tycho – Awake",              artist: "Tycho",         url: "", vibe: "420_chill",   note: "Flotando.", era_id: null, added_at: new Date().toISOString() },
  { id: "t5", title: "Chase & Status – Flashing Lights", artist: "Chase & Status", url: "", vibe: "dnb", note: "La que suena en el carro.", era_id: null, added_at: new Date().toISOString() },
];

const DEMO_DROP = {
  id: "drop-demo",
  from: "ELLA",
  track_id: "t3",
  memory: "Escúchala ahora mismo. Pensé en ti todo el día. 🖤",
  mood: "romantiqueo",
  date: new Date().toISOString(),
  created_at: new Date(Date.now() - 60000).toISOString(),
  seen: false,
};

// ─── HELPERS ─────────────────────────────────────────────────
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const extractYouTubeId = (url) => {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getVibeConfig = (vibeId) =>
  VIBE_TAGS.find((v) => v.id === vibeId) ?? VIBE_TAGS[0];

// ─── AUDIO VISUALIZER ────────────────────────────────────────
/**
 * AudioVisualizer
 * Web Audio API → FFT → Canvas bar visualizer con estética neón.
 * Si no hay audio real, genera una animación idle orgánica.
 */
const AudioVisualizer = ({ audioRef, isPlaying, accentColor = ACID }) => {
  const canvasRef    = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef  = useRef(null);
  const idlePhaseRef = useRef(0);

  // Setup Web Audio context + analyser node
  const setupAudio = useCallback(() => {
    if (!audioRef?.current || audioCtxRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx      = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;
      sourceRef.current    = source;
    } catch (e) {
      // MediaElementSource can only be created once; safe to ignore re-init
    }
  }, [audioRef]);

  // Main draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const BAR_COUNT = 32;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      let dataArray;
      if (analyserRef.current && isPlaying) {
        const bufferLen = analyserRef.current.frequencyBinCount;
        dataArray = new Uint8Array(bufferLen);
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      const barW   = (W / BAR_COUNT) - 1.5;
      const now    = performance.now() / 1000;

      for (let i = 0; i < BAR_COUNT; i++) {
        let barH;
        if (dataArray && isPlaying) {
          const idx  = Math.floor((i / BAR_COUNT) * dataArray.length);
          barH = (dataArray[idx] / 255) * H * 0.9;
        } else {
          // Organic idle animation — layered sines
          const base  = Math.sin(now * 1.2 + i * 0.35) * 0.35 + 0.38;
          const ripple= Math.sin(now * 3.1 + i * 0.7)  * 0.08;
          barH = (base + ripple) * H * 0.35;
        }

        const x = i * (barW + 1.5);
        const y = H - barH;

        // Gradient per bar
        const grad = ctx.createLinearGradient(x, y, x, H);
        const hex  = accentColor;
        grad.addColorStop(0,   hex + "ff");
        grad.addColorStop(0.5, hex + "aa");
        grad.addColorStop(1,   hex + "22");

        ctx.fillStyle = grad;
        ctx.shadowBlur  = barH > H * 0.5 ? 18 : 6;
        ctx.shadowColor = hex + "88";

        // Rounded top
        const radius = Math.min(3, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barW - radius, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
        ctx.lineTo(x + barW, H);
        ctx.lineTo(x, H);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();

        // Peak dot
        if (isPlaying && barH > H * 0.3) {
          ctx.fillStyle = "#ffffff88";
          ctx.shadowBlur = 12;
          ctx.shadowColor = hex;
          ctx.fillRect(x, y - 3, barW, 2);
        }
        ctx.shadowBlur = 0;
      }
    };

    // Resize canvas to container
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, accentColor]);

  // Resume AudioContext on play (browser policy)
  useEffect(() => {
    if (isPlaying) {
      setupAudio();
      audioCtxRef.current?.resume();
    }
  }, [isPlaying, setupAudio]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: 72, display: "block" }}
    />
  );
};

// ─── WINAMP PLAYER ───────────────────────────────────────────
/**
 * WinampPlayer
 * Custom audio player con estética Winamp retro-future.
 * Soporta: play/pause, prev/next, seek, volume, loop/shuffle.
 */
const WinampPlayer = ({ track, tracks = [], onTrackChange, onDropSend, syncStatus = "idle" }) => {
const audioRef    = useRef(null);
  const iframeRef   = useRef(null);
  const wakeLockRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const pollingRef  = useRef(null);
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);   // 0-100
  const [volume,    setVolume]    = useState(80);   // 0-100
  const [duration,  setDuration]  = useState(0);
  const [currentT,  setCurrentT]  = useState(0);
  const [loop,      setLoop]      = useState(false);
  const [shuffle,   setShuffle]   = useState(false);
  const [showDrop,  setShowDrop]  = useState(false);
  const [ytReady,   setYtReady]   = useState(false);

  const vibeConf = getVibeConfig(track?.vibe);
  const ytId     = extractYouTubeId(track?.url ?? "");

  // Reset on track change
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentT(0);
    setDuration(0);
    setYtReady(false);
  }, [track?.id]);

  const isYouTube = track?.type === "youtube" || (!track?.type && track?.url);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const ct = p.getCurrentTime() || 0;
      const dur = p.getDuration() || 0;
      setCurrentT(ct);
      setDuration(dur);
      setProgress(dur > 0 ? (ct / dur) * 100 : 0);
    }, 500);
  };

  const initYTPlayer = useCallback(() => {
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch(_) {} ytPlayerRef.current = null; }
    setYtReady(false);
    const divId = `yt-player-div`;
    ytPlayerRef.current = new window.YT.Player(divId, {
      videoId: extractYouTubeId(track?.youtube_url ?? track?.url ?? ""),
      playerVars: { autoplay: 0, controls: 0, rel: 0 },
      events: {
        onReady: (e) => {
          setDuration(e.target.getDuration() || 0);
          e.target.setVolume(volume);
          setYtReady(true);
        },
        onStateChange: (e) => {
          const s = e.data;
          if (s === window.YT.PlayerState.PLAYING) {
            setPlaying(true);
            startPolling();
          } else if (s === window.YT.PlayerState.PAUSED) {
            setPlaying(false);
            stopPolling();
          } else if (s === window.YT.PlayerState.ENDED) {
            setPlaying(false);
            stopPolling();
            if (loop) {
              ytPlayerRef.current.seekTo(0, true);
              ytPlayerRef.current.playVideo();
            } else {
              skip(1);
            }
          }
        },
      },
    });
  }, [loop, skip, volume]);

  useEffect(() => {
    if (!isYouTube) return;
    const setup = () => initYTPlayer();
    if (window.YT && window.YT.Player) {
      setup();
    } else {
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = setup;
    }
    return () => {
      stopPolling();
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch(_) {} ytPlayerRef.current = null; }
      setYtReady(false);
    };
  }, [track?.id, isYouTube]);

  const togglePlay = () => {
    if (isYouTube) {
      if (!ytPlayerRef.current) return;
      if (playing) { ytPlayerRef.current.pauseVideo(); }
      else         { ytPlayerRef.current.playVideo();  }
    } else {
      if (!audioRef.current) return;
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else         { audioRef.current.play().catch(() => {}); setPlaying(true); }
    }
  };

  const seekTo = (pct) => {
    if (isYouTube) {
      if (!ytPlayerRef.current || !duration) return;
      ytPlayerRef.current.seekTo((pct / 100) * duration, true);
    } else {
      if (!audioRef.current || !duration) return;
      audioRef.current.currentTime = (pct / 100) * duration;
    }
  };

  const changeVolume = (v) => {
    setVolume(v);
    if (isYouTube) { if (ytPlayerRef.current) ytPlayerRef.current.setVolume(v); }
    else           { if (audioRef.current) audioRef.current.volume = v / 100; }
  };

  const skip = useCallback((dir) => {
    const idx = tracks.findIndex((t) => t.id === track?.id);
    if (idx < 0) return;
    let nextIdx;
    if (shuffle) nextIdx = Math.floor(Math.random() * tracks.length);
    else         nextIdx = (idx + dir + tracks.length) % tracks.length;
    onTrackChange?.(tracks[nextIdx]);
  }, [tracks, track?.id, loop, shuffle, onTrackChange]);

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const accentColor = vibeConf?.color ?? ACID;

  // ── MediaSession API ─────────────────────────────────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!track) return;

    const ytId = extractYouTubeId(track.url ?? "");
    const artwork = ytId
      ? [{ src: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title:  track.title  ?? "Sin título",
      artist: track.artist ?? "",
      album:  "el búnker",
      artwork,
    });

    navigator.mediaSession.setActionHandler("play",          () => { audioRef.current?.play(); setPlaying(true);  });
    navigator.mediaSession.setActionHandler("pause",         () => { audioRef.current?.pause(); setPlaying(false); });
    navigator.mediaSession.setActionHandler("previoustrack", () => skip(-1));
    navigator.mediaSession.setActionHandler("nexttrack",     () => skip(1));

    return () => {
      ["play", "pause", "previoustrack", "nexttrack"].forEach((action) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch (_) {}
      });
    };
  }, [track?.id, playing, skip]);

  // ── WakeLock API ─────────────────────────────────────────────
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          console.info("[Búnker] WakeLock liberado");
        });
        console.info("[Búnker] WakeLock adquirido ✓");
      } catch (err) {
        console.warn("[Búnker] WakeLock no disponible:", err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    // Re-solicitar WakeLock cuando la página vuelve a primer plano
    // Android libera el WakeLock al apagar la pantalla
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && playing) {
        requestWakeLock();
      }
    };

    if (playing) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playing]);

  return (
    <motion.div
      className="relative rounded-sm overflow-hidden"
      style={{
        background: `linear-gradient(145deg, rgba(10,10,10,0.98) 0%, rgba(20,20,20,0.98) 100%)`,
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 0 30px ${accentColor}11, inset 0 0 40px rgba(0,0,0,0.6)`,
        fontFamily: FONT_MONO,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Audio element — solo para type drive */}
      {track?.type === "drive" && track?.drive_file_id && (
        <audio
          ref={audioRef}
          src={getStreamUrl(track.drive_file_id)}
          loop={loop}
          onTimeUpdate={(e) => {
            setCurrentT(e.target.currentTime);
            setProgress((e.target.currentTime / e.target.duration) * 100 || 0);
          }}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onEnded={() => { if (!loop) skip(1); }}
        />
      )}
      {/* YouTube div — YT.Player monta aquí */}
      {isYouTube && (
        <div
          id="yt-player-div"
          style={{ display: "none" }}
          data-videoid={extractYouTubeId(track?.youtube_url ?? track?.url ?? "")}
        />
      )}

      {/* ── Winamp Title Bar ── */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: `linear-gradient(90deg, ${accentColor}18 0%, transparent 100%)`,
          borderBottom: `1px solid ${accentColor}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={playing ? { opacity: [1, 0.3, 1] } : { opacity: 0.4 }}
            transition={{ duration: 0.8, repeat: playing ? Infinity : 0 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
          />
          <span className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: accentColor }}>
            MUSIC LAB
          </span>
          {syncStatus === "syncing" && (
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="text-xs"
              style={{ color: "#ffcc00", marginLeft: 2 }}
              title="Sincronizando cola..."
            >
              ◌
            </motion.span>
          )}
          {syncStatus === "error" && (
            <span
              className="text-xs"
              style={{ color: "#ff4444" }}
              title="Error guardando cola"
            >
              ✕
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {/* Vibe badge */}
          <span
            className="text-xs tracking-widest uppercase px-2 py-0.5 rounded-sm"
            style={{
              color: accentColor,
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}33`,
            }}
          >
            {vibeConf?.icon} {vibeConf?.label}
          </span>
        </div>
      </div>

      {/* ── Visualizer ── */}
      <div
        className="px-3 pt-3 pb-1"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        <AudioVisualizer audioRef={audioRef} isPlaying={playing} accentColor={accentColor} />
      </div>

      {/* ── Track Info (marquee) ── */}
      <div className="px-3 py-2 overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="overflow-hidden whitespace-nowrap" style={{ maxWidth: "100%" }}>
          <motion.p
            animate={track ? { x: ["0%", "-40%", "0%"] } : {}}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="text-sm font-bold inline-block"
            style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}66` }}
          >
            {track ? `${track.title} — ${track.artist}` : "◈ SELECT A TRACK ◈"}
          </motion.p>
        </div>
        {track?.note && (
          <p className="text-xs mt-0.5 opacity-40 truncate" style={{ color: accentColor }}>
            ↳ {track.note}
          </p>
        )}
      </div>

      {/* ── Seek Bar ── */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums opacity-50" style={{ color: accentColor }}>
            {fmtTime(currentT)}
          </span>
          <div className="relative flex-1 h-2 group cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - rect.left) / rect.width) * 100);
          }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `${accentColor}22` }}
            />
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}aa 100%)`,
                boxShadow: `0 0 8px ${accentColor}66`,
              }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left: `calc(${progress}% - 6px)`,
                borderColor: accentColor,
                background: BG,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
          </div>
          <span className="text-xs tabular-nums opacity-50" style={{ color: accentColor }}>
            {fmtTime(duration)}
          </span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-between px-3 pb-3">
        {/* Left: Loop + Shuffle */}
        <div className="flex gap-2">
          <WinampBtn
            label="⟳" active={loop} color={accentColor}
            onClick={() => setLoop((p) => !p)}
            title="Loop"
          />
          <WinampBtn
            label="⇄" active={shuffle} color={accentColor}
            onClick={() => setShuffle((p) => !p)}
            title="Shuffle"
          />
        </div>

        {/* Center: Prev / Play / Next */}
        <div className="flex items-center gap-3">
          <WinampBtn label="◀◀" color={accentColor} onClick={() => skip(-1)} title="Prev" size="sm" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-11 h-11 rounded-sm flex items-center justify-center text-lg font-bold transition-all"
            style={{
              background: `${accentColor}22`,
              border: `2px solid ${accentColor}66`,
              color: accentColor,
              boxShadow: playing ? `0 0 16px ${accentColor}55` : "none",
              textShadow: `0 0 8px ${accentColor}`,
            }}
          >
            {playing ? "⏸" : "▶"}
          </motion.button>
          <WinampBtn label="▶▶" color={accentColor} onClick={() => skip(1)} title="Next" size="sm" />
        </div>

        {/* Right: Volume */}
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-40" style={{ color: accentColor }}>🔊</span>
          <input
            type="range" min={0} max={100} value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-14 h-1 appearance-none cursor-pointer rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accentColor} ${volume}%, ${accentColor}22 ${volume}%)`,
              accentColor,
            }}
          />
        </div>
      </div>

      {/* ── Drop Button ── */}
      {track && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowDrop(true)}
          className="w-full py-2 text-xs tracking-[0.25em] uppercase font-bold transition-all"
          style={{
            background: `linear-gradient(90deg, ${PURPLE}22 0%, ${PURPLE}11 100%)`,
            borderTop: `1px solid ${PURPLE}33`,
            color: PURPLE,
            textShadow: `0 0 8px ${PURPLE}88`,
          }}
        >
          ⚡ LANZAR DROP
        </motion.button>
      )}

      {/* ── Drop Compose Modal ── */}
      <AnimatePresence>
        {showDrop && (
          <DropComposeModal
            track={track}
            onClose={() => setShowDrop(false)}
            onSend={(dropData) => {
              onDropSend?.(dropData);
              setShowDrop(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
// ─── WINAMP BUTTON ───────────────────────────────────────────
const WinampBtn = ({ label, onClick, active = false, color = ACID, title, size = "md" }) => (
  <motion.button
    whileTap={{ scale: 0.85 }}
    onClick={onClick}
    title={title}
    className={`rounded-sm flex items-center justify-center text-xs font-bold transition-all ${
      size === "sm" ? "w-7 h-7" : "w-8 h-8"
    }`}
    style={{
      background: active ? `${color}22` : "transparent",
      border: `1px solid ${active ? color + "66" : color + "22"}`,
      color: active ? color : color + "66",
      boxShadow: active ? `0 0 8px ${color}44` : "none",
    }}
  >
    {label}
  </motion.button>
);

// ─── VIBE TAG FILTER BAR ─────────────────────────────────────
const VibeTagBar = ({ activeVibe, onVibeChange }) => (
  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
    {VIBE_TAGS.map((vibe) => {
      const isActive = activeVibe === vibe.id;
      return (
        <motion.button
          key={vibe.id}
          whileTap={{ scale: 0.9 }}
          onClick={() => onVibeChange(vibe.id)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1 text-xs tracking-widest uppercase rounded-sm transition-all"
          style={{
            fontFamily: FONT_MONO,
            color: isActive ? vibe.color : `${vibe.color}55`,
            background: isActive ? `${vibe.color}18` : "transparent",
            border: `1px solid ${isActive ? vibe.color + "55" : vibe.color + "18"}`,
            boxShadow: isActive ? `0 0 10px ${vibe.color}33` : "none",
            textShadow: isActive ? `0 0 6px ${vibe.color}88` : "none",
          }}
          animate={isActive ? { opacity: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
        >
          <span>{vibe.icon}</span>
          <span>{vibe.label}</span>
        </motion.button>
      );
    })}
  </div>
);

// ─── TRACK CARD ──────────────────────────────────────────────
const TrackCard = ({ track, isActive, onClick, onDrop, onAddToPlaylist }) => {
  const vibe = getVibeConfig(track.vibe);
  const ytId = extractYouTubeId(track.url ?? "");
  const pressTimer  = useRef(null);
  const [showCtx, setShowCtx] = useState(false);

  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => setShowCtx(true), 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(pressTimer.current);
  };

  return (
    <>
    <AnimatePresence>
      {showCtx && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setShowCtx(false)}
        >
          <motion.div
            style={{
              background: "#0a0a0a",
              border: `1px solid ${ACID}33`,
              borderRadius: 2,
              padding: "8px 0",
              minWidth: 220,
              fontFamily: FONT_MONO,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: "8px 16px 12px",
              borderBottom: `1px solid ${ACID}15`,
              color: ACID, fontSize: 11,
              letterSpacing: "0.2em", opacity: 0.6,
            }}>
              {track.title}
            </div>
            <button
              style={{
                display: "block", width: "100%", padding: "10px 16px",
                textAlign: "left", color: ACID, fontSize: 11,
                letterSpacing: "0.2em", background: "transparent",
                border: "none", cursor: "pointer",
              }}
              onClick={() => { onAddToPlaylist?.(track); setShowCtx(false); }}
            >
              ◎ AÑADIR A PLAYLIST
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); setShowCtx(true); }}
      className="relative flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all"
      style={{
        background: isActive ? `${vibe?.color ?? ACID}10` : GLASS_BG,
        border: `1px solid ${isActive ? (vibe?.color ?? ACID) + "44" : GLASS_BORDER}`,
        boxShadow: isActive ? `0 0 16px ${vibe?.color ?? ACID}22` : "none",
        fontFamily: FONT_MONO,
      }}
    >

      {/* Active bar */}
      {isActive && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ background: vibe?.color ?? ACID, boxShadow: `0 0 8px ${vibe?.color ?? ACID}` }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Thumbnail / fallback */}
      <div
        className="w-10 h-10 flex-shrink-0 rounded-sm flex items-center justify-center text-base overflow-hidden"
        style={{
          background: isActive ? `${vibe?.color ?? ACID}18` : `${ACID}08`,
          border: `1px solid ${isActive ? (vibe?.color ?? ACID) + "44" : GLASS_BORDER}`,
        }}
      >
        {ytId ? (
          <img
            src={`https://img.youtube.com/vi/${ytId}/default.jpg`}
            alt=""
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <span style={{ color: isActive ? vibe?.color ?? ACID : `${ACID}44` }}>
            {isActive ? "◉" : "◎"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-bold truncate"
          style={{
            color: isActive ? vibe?.color ?? ACID : ACID,
            textShadow: isActive ? `0 0 8px ${vibe?.color ?? ACID}88` : "none",
          }}
        >
          {track.title}
        </p>
        <p className="text-xs opacity-40 truncate" style={{ color: ACID }}>
          {track.artist}
        </p>
        {track.note && (
          <p className="text-xs opacity-25 truncate mt-0.5 italic" style={{ color: ACID }}>
            {track.note}
          </p>
        )}
      </div>

      {/* Vibe pill */}
      <div className="flex flex-col items-end gap-1">
        <span
          className="text-xs px-1.5 py-0.5 rounded-sm"
          style={{
            color: vibe?.color ?? ACID,
            background: `${vibe?.color ?? ACID}15`,
            border: `1px solid ${vibe?.color ?? ACID}33`,
          }}
        >
          {vibe?.icon}
        </span>
        {/* Mini drop button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); onDrop?.(track); }}
          className="text-xs px-1.5 py-0.5 rounded-sm opacity-50 hover:opacity-100 transition-opacity"
          style={{
            color: PURPLE,
            background: `${PURPLE}11`,
            border: `1px solid ${PURPLE}22`,
          }}
          title="Lanzar Drop"
        >
          ⚡
        </motion.button>
      </div>
    </motion.div>
    </>
  );
};

// ─── ADD TRACK FORM ──────────────────────────────────────────
const AddTrackForm = ({ onAdd, onClose, initialData = null }) => {
  const [form, setForm] = useState(initialData
    ? { title: initialData.title ?? "", artist: initialData.artist ?? "", url: initialData.url ?? "", note: initialData.note ?? "", vibe: initialData.vibe ?? "gaming" }
    : { title: "", artist: "", url: "", note: "", vibe: "gaming" }
  );

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: uuid(), era_id: null, added_at: new Date().toISOString() });
  };

  const inputStyle = {
    background: GLASS_BG,
    border: `1px solid ${GLASS_BORDER}`,
    color: ACID,
    fontFamily: FONT_MONO,
    fontSize: 11,
    outline: "none",
    width: "100%",
    padding: "6px 10px",
    borderRadius: 2,
    caretColor: ACID,
  };

  const labelStyle = {
    color: `${ACID}55`,
    fontSize: 10,
    fontFamily: FONT_MONO,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 4,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="relative p-4 rounded-sm"
      style={{
        background: GLASS_BG,
        border: `1px solid ${ACID}22`,
        fontFamily: FONT_MONO,
      }}
    >

      <p className="text-xs tracking-[0.3em] uppercase font-bold mb-4" style={{ color: ACID }}>
        {initialData ? "✎ EDITAR TRACK" : "◈ AÑADIR TRACK"}
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} onChange={set("title")} placeholder="Track title..." />
        </div>
        <div>
          <label style={labelStyle}>Artist</label>
          <input style={inputStyle} value={form.artist} onChange={set("artist")} placeholder="Artist name..." />
        </div>
        <div>
          <label style={labelStyle}>URL (YouTube / Spotify)</label>
          <input style={inputStyle} value={form.url} onChange={set("url")} placeholder="https://..." />
        </div>
        <div>
          <label style={labelStyle}>Note</label>
          <input style={inputStyle} value={form.note} onChange={set("note")} placeholder="Why this track?" />
        </div>
        <div>
          <label style={labelStyle}>Vibe</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {VIBE_TAGS.filter((v) => v.id !== "all").map((vibe) => (
              <motion.button
                key={vibe.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setForm((p) => ({ ...p, vibe: vibe.id }))}
                className="text-xs px-2 py-1 rounded-sm tracking-wider uppercase"
                style={{
                  color: vibe.color,
                  background: form.vibe === vibe.id ? `${vibe.color}20` : "transparent",
                  border: `1px solid ${form.vibe === vibe.id ? vibe.color + "55" : vibe.color + "22"}`,
                }}
              >
                {vibe.icon} {vibe.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={submit}
          className="flex-1 py-2 text-xs tracking-widest uppercase font-bold rounded-sm"
          style={{
            background: `${ACID}18`,
            border: `1px solid ${ACID}44`,
            color: ACID,
            textShadow: `0 0 8px ${ACID}66`,
          }}
        >
          + ADD
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="px-4 py-2 text-xs tracking-widest uppercase rounded-sm opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: ACID, border: `1px solid ${ACID}22` }}
        >
          CANCEL
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── DROP COMPOSE MODAL ──────────────────────────────────────
const DropComposeModal = ({ track, onClose, onSend }) => {
  const [message, setMessage] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(5,5,5,0.92)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative w-full max-w-xs p-5 rounded-sm"
        style={{
          background: `linear-gradient(145deg, #0e0e0e 0%, #130013 100%)`,
          border: `1px solid ${PURPLE}55`,
          boxShadow: `0 0 40px ${PURPLE}44, inset 0 0 20px ${PURPLE}08`,
          fontFamily: FONT_MONO,
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <p
          className="text-xs tracking-[0.35em] uppercase font-bold mb-1"
          style={{ color: PURPLE, textShadow: `0 0 12px ${PURPLE}` }}
        >
          ⚡ THE DROP
        </p>
        <p className="text-xs opacity-50 mb-4" style={{ color: PURPLE }}>
          Lanza esta canción a tu persona
        </p>

        {/* Track preview */}
        <div
          className="flex items-center gap-3 p-3 mb-4 rounded-sm"
          style={{
            background: `${PURPLE}10`,
            border: `1px solid ${PURPLE}22`,
          }}
        >
          <span style={{ color: PURPLE, fontSize: 20 }}>◉</span>
          <div>
            <p className="text-xs font-bold" style={{ color: PURPLE }}>{track?.title}</p>
            <p className="text-xs opacity-50" style={{ color: PURPLE }}>{track?.artist}</p>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe algo... ¿por qué le mandas esta canción?"
          rows={3}
          className="w-full p-3 text-xs rounded-sm resize-none"
          style={{
            background: "rgba(191,0,255,0.06)",
            border: `1px solid ${PURPLE}33`,
            color: PURPLE,
            fontFamily: FONT_MONO,
            outline: "none",
            caretColor: PURPLE,
          }}
        />

        <div className="flex gap-2 mt-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onSend({ track_id: track?.id, memory: message, mood: track?.vibe ?? "all", date: new Date().toISOString() })}
            className="flex-1 py-2.5 text-xs tracking-widest uppercase font-bold rounded-sm"
            style={{
              background: `${PURPLE}22`,
              border: `1px solid ${PURPLE}66`,
              color: PURPLE,
              textShadow: `0 0 10px ${PURPLE}`,
              boxShadow: `0 0 20px ${PURPLE}33`,
            }}
          >
            ⚡ DROP IT
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2.5 text-xs rounded-sm opacity-40 hover:opacity-70"
            style={{ color: PURPLE, border: `1px solid ${PURPLE}22` }}
          >
            ✕
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── DROP ALERT MODAL ────────────────────────────────────────
/**
 * DropAlertModal
 * Modal intrusivo y brillante que aparece cuando hay un Drop nuevo.
 * Se activa al cargar el JSON si drop.seen === false.
 */
const DropAlertModal = ({ drop, tracks, onPlay, onDismiss }) => {
  const track     = tracks.find((t) => t.id === drop?.track_id);
  const vibeColor = PURPLE;

  return (
    <AnimatePresence>
      {drop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
        >
          {/* Ambient burst */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0, 0.25, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${PURPLE}55 0%, transparent 70%)`,
            }}
          />

          <motion.div
            initial={{ scale: 0.7, rotate: -3, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.7, rotate: 3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-full max-w-sm rounded-sm overflow-hidden"
            style={{
              background: `linear-gradient(145deg, #0a000f 0%, #180020 50%, #0a000f 100%)`,
              border: `2px solid ${PURPLE}`,
              boxShadow: `
                0 0 60px ${PURPLE}66,
                0 0 120px ${PURPLE}33,
                inset 0 0 40px ${PURPLE}11
              `,
              fontFamily: FONT_MONO,
            }}
          >

            {/* Scanline top */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }}
            />

            {/* Header bar */}
            <motion.div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                background: `linear-gradient(90deg, ${PURPLE}30 0%, ${PURPLE}10 100%)`,
                borderBottom: `1px solid ${PURPLE}44`,
              }}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ color: PURPLE, fontSize: 18 }}
                >
                  ⚡
                </motion.span>
                <span
                  className="text-sm tracking-[0.3em] uppercase font-bold"
                  style={{ color: PURPLE, textShadow: `0 0 16px ${PURPLE}` }}
                >
                  INCOMING DROP
                </span>
              </div>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-xs tracking-widest uppercase"
                style={{ color: PURPLE }}
              >
                {drop.from ?? "ELLOS"}
              </motion.span>
            </motion.div>

            {/* Track info */}
            {track && (
              <div
                className="mx-5 mt-5 p-4 rounded-sm flex items-center gap-4"
                style={{
                  background: `${PURPLE}14`,
                  border: `1px solid ${PURPLE}33`,
                  boxShadow: `0 0 20px ${PURPLE}22`,
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="text-2xl"
                >
                  💿
                </motion.div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: PURPLE, textShadow: `0 0 8px ${PURPLE}` }}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs opacity-60 truncate" style={{ color: PURPLE }}>
                    {track.artist}
                  </p>
                </div>
              </div>
            )}

            {/* Message */}
            {drop.memory && (
              <div className="px-5 pt-4">
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    color: `${PURPLE}cc`,
                    textShadow: `0 0 6px ${PURPLE}55`,
                    borderLeft: `2px solid ${PURPLE}44`,
                    paddingLeft: 12,
                    fontStyle: "italic",
                  }}
                >
                  "{drop.memory}"
                </p>
              </div>
            )}

            {/* Timestamp */}
            <div className="px-5 pt-2 pb-1">
              <p className="text-xs opacity-25 tracking-widest" style={{ color: PURPLE }}>
                {new Date(drop.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 p-5 pt-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onPlay(track)}
                className="flex-1 py-3 text-xs tracking-[0.25em] uppercase font-bold rounded-sm"
                style={{
                  background: `linear-gradient(90deg, ${PURPLE}33 0%, ${PURPLE}22 100%)`,
                  border: `2px solid ${PURPLE}`,
                  color: PURPLE,
                  textShadow: `0 0 12px ${PURPLE}`,
                  boxShadow: `0 0 20px ${PURPLE}44`,
                }}
                animate={{ boxShadow: [`0 0 20px ${PURPLE}44`, `0 0 40px ${PURPLE}66`, `0 0 20px ${PURPLE}44`] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ▶ PLAY NOW
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className="px-5 py-3 text-xs tracking-widest uppercase rounded-sm"
                style={{
                  color: `${PURPLE}66`,
                  border: `1px solid ${PURPLE}22`,
                }}
              >
                LATER
              </motion.button>
            </div>

            {/* Bottom scanline */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}, transparent)` }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── DROPS HISTORY ───────────────────────────────────────────
const DropsHistory = ({ drops, tracks, onPlay }) => {
  if (!drops.length) return (
    <p className="text-xs opacity-20 tracking-widest text-center py-6 uppercase" style={{ color: ACID, fontFamily: FONT_MONO }}>
      — sin drops aún —
    </p>
  );

  return (
    <div className="flex flex-col gap-2">
      {[...drops].reverse().map((drop) => {
        const track = tracks.find((t) => t.id === drop.track_id);
        return (
          <motion.div
            key={drop.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-3 rounded-sm cursor-pointer"
            style={{
              background: PURPLE_BG,
              border: `1px solid ${PURPLE_BORDER}`,
              fontFamily: FONT_MONO,
            }}
            onClick={() => track && onPlay(track)}
          >
            <span style={{ color: PURPLE, fontSize: 16 }}>⚡</span>
            <div className="flex-1 min-w-0">
              {track && (
                <p className="text-xs font-bold truncate" style={{ color: PURPLE }}>
                  {track.title} — {track.artist}
                </p>
              )}
              {drop.memory && (
                <p className="text-xs mt-0.5 opacity-60 italic leading-relaxed" style={{ color: PURPLE }}>
                  "{drop.memory}"
                </p>
              )}
              <p className="text-xs mt-1 opacity-25 tracking-wider" style={{ color: PURPLE }}>
                {new Date(drop.created_at).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                {" · "}
                {drop.from ?? "DROP"}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── MUSIC LAB MAIN ──────────────────────────────────────────
/**
 * MusicLab
 *
 * Props:
 *   db            — VaultDB object (from fetchData)
 *   onAddTrack    — (trackData) => void  (calls GoogleDriveService.addTrack)
 *   onAddDrop     — (dropData) => void   (calls GoogleDriveService.addDrop)
 *   onMarkDropSeen— (dropId) => void
 */
export default function MusicLab({
  db = null,
  userId = null,
  onAddTrack,
  onAddDrop,
  onMarkDropSeen,
}) {
  // ── Data ─────────────────────────────────────────────────
  const rawTracks = db?.music_lab?.tracks ?? DEMO_TRACKS;
  const rawDrops  = db?.music_lab?.drops  ?? [];

  // ── State ─────────────────────────────────────────────────
  const [activeVibe,   setActiveVibe]   = useState("all");
  const [activeTrack,  setActiveTrack]  = useState(rawTracks[0] ?? null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [activeTab,    setActiveTab]    = useState("tracks"); // "tracks" | "drops"
  const [pendingDrop,  setPendingDrop]  = useState(null);
  const [localTracks,  setLocalTracks]  = useState(rawTracks);
  const [localDrops,   setLocalDrops]   = useState(rawDrops);
  const [syncStatus,   setSyncStatus]   = useState("idle");
  const [localPlaylists,    setLocalPlaylists]    = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [pendingTrack,      setPendingTrack]      = useState(null);
  const [toast,             setToast]             = useState(null);

  // Check for unseen drops on mount (simulates JSON load check)
  useEffect(() => {
    // In demo mode, show a demo drop after 1.5s
    if (!db) {
      const timer = setTimeout(() => setPendingDrop(DEMO_DROP), 1500);
      return () => clearTimeout(timer);
    }
    // Real mode: find first unseen drop
    const unseen = rawDrops.find((d) => !d.seen && d.to === userId);
    if (unseen) setPendingDrop(unseen);
  }, []);

  // Cargar cola desde Drive al montar (solo si hay usuario real)
  useEffect(() => {
    if (!userId) return;
    fetchQueue(userId)
      .then((trackIds) => {
        if (trackIds.length === 0) return;
        const first = rawTracks.find((t) => t.id === trackIds[0]);
        if (first) setActiveTrack(first);
      })
      .catch((err) => {
        console.warn("[Búnker] fetchQueue falló silenciosamente:", err);
      });
  }, [userId]);

  // Guardar cola en Drive optimista al cambiar track activo
  useEffect(() => {
    if (!userId || !activeTrack) return;
    setSyncStatus("syncing");
    saveQueue(userId, [activeTrack.id])
      .then(() => setSyncStatus("idle"))
      .catch((err) => {
        console.warn("[Búnker] saveQueue falló:", err);
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 4000);
      });
  }, [activeTrack?.id, userId]);
  // Cargar playlists desde Drive al montar
  useEffect(() => {
    if (!db) return;
    fetchPlaylists()
      .then(setLocalPlaylists)
      .catch((err) => console.warn("[Búnker] fetchPlaylists falló:", err));
  }, [db]);

  const handleAddToPlaylist = (track) => {
    setPendingTrack(track);
    setShowPlaylistModal(true);
  };

  const handleSelectPlaylist = async (playlistId) => {
    if (!pendingTrack) return;
    try {
      const updated = await addTrackToPlaylist(playlistId, pendingTrack.id);
      setLocalPlaylists((p) => p.map((pl) => pl.id === playlistId ? updated : pl));
      setToast("AÑADIDO A PLAYLIST");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.warn("[Búnker] addTrackToPlaylist falló:", err);
    } finally {
      setShowPlaylistModal(false);
      setPendingTrack(null);
    }
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
    } catch (err) {
      console.warn("[Búnker] createPlaylist falló:", err);
    } finally {
      setShowPlaylistModal(false);
      setPendingTrack(null);
    }
  };

  // Filtered tracks by vibe
  const filteredTracks = activeVibe === "all"
    ? localTracks
    : localTracks.filter((t) => t.vibe === activeVibe);

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

  const handleDropSend = (dropData) => {
    const toUserId = userId === "edu" ? "david" : "edu";
    const newDrop = { ...dropData, id: uuid(), from: userId, to: toUserId, seen: false, created_at: new Date().toISOString() };
    setLocalDrops((p) => [...p, newDrop]);
    onAddDrop?.(newDrop);
  };

  const handleDropPlay = (track) => {
    if (track) setActiveTrack(track);
    setPendingDrop(null);
    onMarkDropSeen?.(pendingDrop?.id);
    setActiveTab("tracks");
  };

  const handleDropDismiss = () => {
    setPendingDrop(null);
    onMarkDropSeen?.(pendingDrop?.id);
  };

  return (
    <>
      {/* ── Toast feedback ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: `${ACID}18`,
              border: `1px solid ${ACID}55`,
              color: ACID,
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: "0.25em",
              padding: "8px 20px",
              borderRadius: 2,
              zIndex: 9999,
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Incoming Drop Modal ── */}
      <DropAlertModal
        drop={pendingDrop}
        tracks={localTracks}
        onPlay={handleDropPlay}
        onDismiss={handleDropDismiss}
      />

      <div
        className="flex flex-col gap-5 px-4 py-6 max-w-md mx-auto"
        style={{ fontFamily: FONT_MONO }}
      >

        {/* ══ SECTION 1: Player ══════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WinampPlayer
            track={activeTrack}
            tracks={filteredTracks}
            onTrackChange={setActiveTrack}
            onDropSend={handleDropSend}
            syncStatus={syncStatus}
          />
        </motion.section>

        {/* ══ SECTION 2: Tab Bar ═════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-0 rounded-sm overflow-hidden"
          style={{ border: `1px solid ${GLASS_BORDER}` }}
        >
          {[
            { id: "tracks", label: "TRACKS", icon: "◎" },
            { id: "drops",  label: `DROPS ${localDrops.length > 0 ? `[${localDrops.length}]` : ""}`, icon: "⚡" },
            { id: "playlists", label: "LISTS", icon: "◈" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 text-xs tracking-[0.25em] uppercase font-bold transition-all"
                style={{
                  fontFamily: FONT_MONO,
                  color: isActive ? (tab.id === "drops" ? PURPLE : ACID) : `${ACID}33`,
                  background: isActive
                    ? tab.id === "drops" ? `${PURPLE}15` : `${ACID}10`
                    : "transparent",
                  borderBottom: isActive
                    ? `2px solid ${tab.id === "drops" ? PURPLE : ACID}`
                    : "2px solid transparent",
                  textShadow: isActive ? `0 0 8px ${tab.id === "drops" ? PURPLE : ACID}88` : "none",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* ══ SECTION 3: Content ═════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "tracks" && (
            <motion.div
              key="tracks"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {/* Vibe Filter */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <VibeTagBar activeVibe={activeVibe} onVibeChange={setActiveVibe} />
              </motion.div>

              {/* Track List Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: ACID }}>◎</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: ACID }}>
                    TRACKS
                  </span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: ACID }}>
                    [{String(filteredTracks.length).padStart(2, "0")}]
                  </span>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowAdd((p) => !p); setShowDelete(false); setShowEdit(false); setEditingTrack(null); }}
                    className="text-xs tracking-widest uppercase px-3 py-1 rounded-sm transition-all"
                    style={{
                      color: ACID,
                      border: `1px solid ${showAdd ? ACID + "66" : ACID + "33"}`,
                      background: showAdd ? `${ACID}12` : `${ACID}06`,
                    }}
                  >
                    {showAdd ? "✕ CANCEL" : "+ AÑADIR"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowEdit((p) => !p); setShowDelete(false); setShowAdd(false); setEditingTrack(null); }}
                    className="text-xs tracking-widest uppercase px-3 py-1 rounded-sm transition-all"
                    style={{
                      color: PURPLE,
                      border: `1px solid ${showEdit ? PURPLE + "66" : PURPLE + "33"}`,
                      background: showEdit ? `${PURPLE}12` : `${PURPLE}06`,
                    }}
                  >
                    {showEdit ? "✕ CANCEL" : "✎ EDITAR"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowDelete((p) => !p); setShowAdd(false); setShowEdit(false); setEditingTrack(null); }}
                    className="text-xs tracking-widest uppercase px-3 py-1 rounded-sm transition-all"
                    style={{
                      color: "#ff4444",
                      border: `1px solid ${showDelete ? "#ff444466" : "#ff444433"}`,
                      background: showDelete ? "#ff444412" : "#ff444406",
                    }}
                  >
                    {showDelete ? "✕ CANCEL" : "− ELIMINAR"}
                  </motion.button>
                </div>
              </div>

              {/* Add Track Form */}
              <AnimatePresence>
                {showAdd && (
                  <AddTrackForm onAdd={handleAddTrack} onClose={() => setShowAdd(false)} />
                )}
              </AnimatePresence>
              {/* Edit Track Modal */}
              <AnimatePresence>
                {showEdit && !editingTrack && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col gap-2 p-3 rounded-sm"
                    style={{ background: "rgba(191,0,255,0.04)", border: `1px solid ${PURPLE}22`, fontFamily: FONT_MONO }}
                  >
                    <p className="text-xs tracking-[0.3em] uppercase font-bold mb-1" style={{ color: PURPLE }}>
                      ✎ EDITAR TRACK
                    </p>
                    {localTracks.length === 0 ? (
                      <p className="text-xs opacity-40" style={{ color: PURPLE }}>NO HAY TRACKS</p>
                    ) : (
                      localTracks.map((track) => (
                        <motion.div
                          key={track.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEditTrack(track.id)}
                          className="flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer"
                          style={{ background: "rgba(191,0,255,0.03)", border: `1px solid ${PURPLE}18` }}
                        >
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
                  <AddTrackForm
                    onAdd={handleSaveEdit}
                    onClose={() => { setShowEdit(false); setEditingTrack(null); }}
                    initialData={editingTrack}
                  />
                )}
              </AnimatePresence>
              {/* Delete Track Modal */}
              <AnimatePresence>
                {showDelete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col gap-2 p-3 rounded-sm"
                    style={{ background: "rgba(255,68,68,0.04)", border: "1px solid #ff444422", fontFamily: FONT_MONO }}
                  >
                    <p className="text-xs tracking-[0.3em] uppercase font-bold mb-1" style={{ color: "#ff4444" }}>
                      ◈ ELIMINAR TRACK
                    </p>
                    {localTracks.length === 0 ? (
                      <p className="text-xs opacity-40" style={{ color: "#ff4444" }}>NO HAY TRACKS</p>
                    ) : (
                      localTracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between px-3 py-2 rounded-sm"
                          style={{ background: "rgba(255,68,68,0.03)", border: "1px solid #ff444418" }}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-xs font-bold truncate" style={{ color: "#ff6666" }}>{track.title}</span>
                            <span className="text-xs opacity-40 truncate" style={{ color: "#ff4444" }}>{track.artist}</span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteTrack(track.id)}
                            className="ml-3 flex-shrink-0 text-xs tracking-widest uppercase px-2 py-1 rounded-sm"
                            style={{ color: "#ff4444", border: "1px solid #ff444444", background: "#ff444412" }}
                          >
                            ✕
                          </motion.button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Track Cards */}
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {filteredTracks.length > 0 ? (
                    filteredTracks.map((track) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        isActive={activeTrack?.id === track.id}
                        onClick={() => setActiveTrack(track)}
                        onAddToPlaylist={handleAddToPlaylist}
                        onDrop={(t) => {
                          setActiveTrack(t);
                          // Trigger drop compose via player
                        }}
                      />
                    ))
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs opacity-20 tracking-widest text-center py-8 uppercase"
                      style={{ color: ACID }}
                    >
                      — no tracks for this vibe —
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === "drops" && (
            <motion.div
              key="drops"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {/* Drops Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: PURPLE }}>⚡</span>
                  <span className="text-xs tracking-[0.35em] uppercase font-bold" style={{ color: PURPLE }}>
                    THE DROPS
                  </span>
                  <span className="text-xs opacity-30 tabular-nums" style={{ color: PURPLE }}>
                    [{String(localDrops.length).padStart(2, "0")}]
                  </span>
                </div>
              </div>

              {/* Drops explanation */}
              <div
                className="p-3 rounded-sm text-xs leading-relaxed opacity-50"
                style={{
                  color: PURPLE,
                  background: PURPLE_BG,
                  border: `1px solid ${PURPLE_BORDER}`,
                  fontFamily: FONT_MONO,
                }}
              >
                Cuando lanzas un Drop, aparece como una alerta intrusiva la próxima vez que tu persona abra el Búnker. Selecciona un track y toca ⚡ LANZAR DROP.
              </div>

              <DropsHistory
                drops={localDrops}
                tracks={localTracks}
                onPlay={(track) => {
                  setActiveTrack(track);
                  setActiveTab("tracks");
                }}
              />
            </motion.div>
          )}
          {/* ══ Modal Playlist ══ */}
        <AnimatePresence>
          {showPlaylistModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, zIndex: 9999,
                background: "rgba(0,0,0,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 24,
              }}
              onClick={() => setShowPlaylistModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                style={{
                  background: "#0a0a0a",
                  border: `1px solid ${ACID}33`,
                  borderRadius: 2,
                  width: "100%", maxWidth: 340,
                  fontFamily: FONT_MONO,
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${ACID}15`,
                  color: ACID, fontSize: 11,
                  letterSpacing: "0.25em",
                }}>
                  AÑADIR A PLAYLIST
                </div>
                {localPlaylists.map((pl) => (
                  <button
                    key={pl.id}
                    style={{
                      display: "block", width: "100%", padding: "10px 16px",
                      textAlign: "left", color: ACID, fontSize: 11,
                      letterSpacing: "0.2em", background: "transparent",
                      border: "none", borderBottom: `1px solid ${ACID}10`,
                      cursor: "pointer",
                    }}
                    onClick={() => handleSelectPlaylist(pl.id)}
                  >
                    ◎ {pl.name}
                    <span style={{ opacity: 0.3, marginLeft: 8 }}>
                      [{pl.track_ids.length}]
                    </span>
                  </button>
                ))}
                <PlaylistNameInput onConfirm={handleCreatePlaylist} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </AnimatePresence>

        {/* ══ Footer ══ */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between pt-2 pb-4 px-1"
        >
          <span className="text-xs opacity-15 tracking-widest uppercase" style={{ color: ACID }}>
            MUSIC LAB v1.0
          </span>
          <motion.span
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-xs tracking-widest uppercase"
            style={{ color: ACID }}
          >
            ◈ WEB AUDIO API
          </motion.span>
        </motion.footer>
      </div>
    </>
  );
}

// ─── PLAYLIST NAME INPUT ─────────────────────────────────────
const PlaylistNameInput = ({ onConfirm }) => {
  const [name, setName] = useState("");
  return (
    <div style={{
      padding: "10px 16px",
      borderTop: `1px solid ${ACID}15`,
      display: "flex", gap: 8,
    }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onConfirm(name); }}
        placeholder="Nueva playlist..."
        style={{
          flex: 1, background: "transparent",
          border: `1px solid ${ACID}33`, borderRadius: 2,
          color: ACID, fontSize: 11, padding: "6px 10px",
          fontFamily: FONT_MONO, letterSpacing: "0.15em",
          outline: "none",
        }}
      />
      <button
        onClick={() => { if (name.trim()) onConfirm(name); }}
        style={{
          background: `${ACID}15`, border: `1px solid ${ACID}44`,
          color: ACID, fontSize: 11, padding: "6px 10px",
          borderRadius: 2, cursor: "pointer",
          fontFamily: FONT_MONO, letterSpacing: "0.15em",
        }}
      >
        OK
      </button>
    </div>
  );
};

// ─── NAMED EXPORTS ───────────────────────────────────────────
export {
  AudioVisualizer,
  WinampPlayer,
  VibeTagBar,
  TrackCard,
  DropAlertModal,
  DropsHistory,
  VIBE_TAGS,
};
