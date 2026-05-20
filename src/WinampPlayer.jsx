import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE, BG } from "./Layout";
import { getStreamUrl } from "./GoogleDriveService";
import { AudioVisualizer } from "./AudioVisualizer";
import { DropComposeModal } from "./DropsManager";

// ─── DESIGN TOKENS (local) ───────────────────────────────────
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

const extractYouTubeId = (url) => {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getVibeConfig = (vibeId, VIBE_TAGS) =>
  VIBE_TAGS.find((v) => v.id === vibeId) ?? VIBE_TAGS[0];

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

// ─── WINAMP PLAYER ───────────────────────────────────────────
export const WinampPlayer = ({ track, tracks = [], onTrackChange, onDropSend, syncStatus = "idle", VIBE_TAGS }) => {
  const audioRef    = useRef(null);
  const iframeRef   = useRef(null);
  const wakeLockRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const pollingRef  = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume,   setVolume]   = useState(80);
  const [duration, setDuration] = useState(0);
  const [currentT, setCurrentT] = useState(0);
  const [loop,     setLoop]     = useState(false);
  const [shuffle,  setShuffle]  = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [ytReady,  setYtReady]  = useState(false);

  const vibeConf  = getVibeConfig(track?.vibe, VIBE_TAGS);
  const isYouTube = track?.type === "youtube" || (!track?.type && track?.url);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentT(0);
    setDuration(0);
    setYtReady(false);
  }, [track?.id]);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const ct  = p.getCurrentTime() || 0;
      const dur = p.getDuration()    || 0;
      setCurrentT(ct);
      setDuration(dur);
      setProgress(dur > 0 ? (ct / dur) * 100 : 0);
    }, 500);
  };

  const skip = useCallback((dir) => {
    const idx = tracks.findIndex((t) => t.id === track?.id);
    if (idx < 0) return;
    let nextIdx;
    if (shuffle) nextIdx = Math.floor(Math.random() * tracks.length);
    else         nextIdx = (idx + dir + tracks.length) % tracks.length;
    onTrackChange?.(tracks[nextIdx]);
  }, [tracks, track?.id, loop, shuffle, onTrackChange]);

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
          if (s === window.YT.PlayerState.PLAYING) { setPlaying(true);  startPolling(); }
          else if (s === window.YT.PlayerState.PAUSED)  { setPlaying(false); stopPolling(); }
          else if (s === window.YT.PlayerState.ENDED)   {
            setPlaying(false); stopPolling();
            if (loop) { ytPlayerRef.current.seekTo(0, true); ytPlayerRef.current.playVideo(); }
            else { skip(1); }
          }
        },
      },
    });
  }, [loop, skip, volume]);

  useEffect(() => {
    if (!isYouTube) return;
    const setup = () => initYTPlayer();
    if (window.YT && window.YT.Player) { setup(); }
    else {
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id  = "yt-api-script";
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
    else           { if (audioRef.current)    audioRef.current.volume = v / 100; }
  };

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const accentColor = vibeConf?.color ?? ACID;

  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    const ytId = extractYouTubeId(track.url ?? "");
    const artwork = ytId
      ? [{ src: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" }]
      : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title ?? "Sin título", artist: track.artist ?? "", album: "el búnker", artwork,
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

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => console.info("[Búnker] WakeLock liberado"));
      } catch (err) { console.warn("[Búnker] WakeLock no disponible:", err); }
    };
    const releaseWakeLock = async () => {
      if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && playing) requestWakeLock();
    };
    if (playing) { requestWakeLock(); } else { releaseWakeLock(); }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => { releaseWakeLock(); document.removeEventListener("visibilitychange", handleVisibilityChange); };
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
      {isYouTube && (
        <div
          id="yt-player-div"
          style={{ display: "none" }}
          data-videoid={extractYouTubeId(track?.youtube_url ?? track?.url ?? "")}
        />
      )}

      {/* Title Bar */}
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
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity }}
              className="text-xs" style={{ color: "#ffcc00", marginLeft: 2 }} title="Sincronizando cola...">◌</motion.span>
          )}
          {syncStatus === "error" && (
            <span className="text-xs" style={{ color: "#ff4444" }} title="Error guardando cola">✕</span>
          )}
        </div>
        <div className="flex gap-2">
          <span className="text-xs tracking-widest uppercase px-2 py-0.5 rounded-sm"
            style={{ color: accentColor, background: `${accentColor}15`, border: `1px solid ${accentColor}33` }}>
            {vibeConf?.icon} {vibeConf?.label}
          </span>
        </div>
      </div>

      {/* Visualizer */}
      <div className="px-3 pt-3 pb-1" style={{ background: "rgba(0,0,0,0.4)" }}>
        <AudioVisualizer audioRef={audioRef} isPlaying={playing} accentColor={accentColor} />
      </div>

      {/* Track Info */}
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
          <p className="text-xs mt-0.5 opacity-40 truncate" style={{ color: accentColor }}>↳ {track.note}</p>
        )}
      </div>

      {/* Seek Bar */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums opacity-50" style={{ color: accentColor }}>{fmtTime(currentT)}</span>
          <div className="relative flex-1 h-2 group cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - rect.left) / rect.width) * 100);
          }}>
            <div className="absolute inset-0 rounded-full" style={{ background: `${accentColor}22` }} />
            <motion.div className="absolute top-0 left-0 h-full rounded-full"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}aa 100%)`, boxShadow: `0 0 8px ${accentColor}66` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)`, borderColor: accentColor, background: BG, boxShadow: `0 0 8px ${accentColor}` }} />
          </div>
          <span className="text-xs tabular-nums opacity-50" style={{ color: accentColor }}>{fmtTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex gap-2">
          <WinampBtn label="⟳" active={loop}    color={accentColor} onClick={() => setLoop((p) => !p)}    title="Loop" />
          <WinampBtn label="⇄" active={shuffle} color={accentColor} onClick={() => setShuffle((p) => !p)} title="Shuffle" />
        </div>
        <div className="flex items-center gap-3">
          <WinampBtn label="◀◀" color={accentColor} onClick={() => skip(-1)} title="Prev" size="sm" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
            className="w-11 h-11 rounded-sm flex items-center justify-center text-lg font-bold transition-all"
            style={{ background: `${accentColor}22`, border: `2px solid ${accentColor}66`, color: accentColor,
              boxShadow: playing ? `0 0 16px ${accentColor}55` : "none", textShadow: `0 0 8px ${accentColor}` }}>
            {playing ? "⏸" : "▶"}
          </motion.button>
          <WinampBtn label="▶▶" color={accentColor} onClick={() => skip(1)} title="Next" size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-40" style={{ color: accentColor }}>🔊</span>
          <input type="range" min={0} max={100} value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-14 h-1 appearance-none cursor-pointer rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentColor} ${volume}%, ${accentColor}22 ${volume}%)`, accentColor }} />
        </div>
      </div>

      {/* Drop Button */}
      {track && (
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowDrop(true)}
          className="w-full py-2 text-xs tracking-[0.25em] uppercase font-bold transition-all"
          style={{ background: `linear-gradient(90deg, ${PURPLE}22 0%, ${PURPLE}11 100%)`,
            borderTop: `1px solid ${PURPLE}33`, color: PURPLE, textShadow: `0 0 8px ${PURPLE}88` }}>
          ⚡ LANZAR DROP
        </motion.button>
      )}

      <AnimatePresence>
        {showDrop && (
          <DropComposeModal track={track} onClose={() => setShowDrop(false)}
            onSend={(dropData) => { onDropSend?.(dropData); setShowDrop(false); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};