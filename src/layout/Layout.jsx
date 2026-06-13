// ============================================================
//  EL BÚNKER — Layout.jsx
//  Shell Principal · Cyber-Vandal Aesthetic
//  Stack: React + Tailwind CSS + Framer Motion
// ============================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePlayer } from "../core/PlayerContext";
import { ACID } from "../tokens";

// ─── CONSTANTS ───────────────────────────────────────────────
const PURPLE = "#bf00ff";
const BG     = "#050505";

// ─── SCANLINE OVERLAY ────────────────────────────────────────
// CRT scanline effect via repeating linear gradient
const ScanlineOverlay = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-50"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
      mixBlendMode: "overlay",
    }}
  />
);

// ─── NOISE TEXTURE ───────────────────────────────────────────
const NoiseOverlay = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-40 opacity-[0.03]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundSize: "128px 128px",
    }}
  />
);

// ─── CORNER BRACKETS ─────────────────────────────────────────
// Decorative L-shaped corners — signals "secure terminal"
const CornerBrackets = ({ color = ACID, thickness = 2 }) => {
  const style = { borderColor: color, borderWidth: thickness };
  const cls   = "absolute w-5 h-5 opacity-60";
  return (
    <>
      <span className={`${cls} top-0 left-0`}   style={{ ...style, borderTopStyle: "solid", borderLeftStyle: "solid" }} />
      <span className={`${cls} top-0 right-0`}  style={{ ...style, borderTopStyle: "solid", borderRightStyle: "solid" }} />
      <span className={`${cls} bottom-0 left-0`}  style={{ ...style, borderBottomStyle: "solid", borderLeftStyle: "solid" }} />
      <span className={`${cls} bottom-0 right-0`} style={{ ...style, borderBottomStyle: "solid", borderRightStyle: "solid" }} />
    </>
  );
};

// ─── TOP STATUS BAR ──────────────────────────────────────────
const StatusBar = ({ isAuthenticated, onSignOut, accentColor = ACID }) => {
  const [tick, setTick] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = tick.toLocaleTimeString("en-US", {
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const dateStr = tick.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "2-digit",
  }).toUpperCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-2"
      style={{
        background: `linear-gradient(180deg, rgba(5,5,5,0.98) 0%, rgba(5,5,5,0.0) 100%)`,
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }}
    >
      {/* LEFT: Brand */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full"
          style={{ background: isAuthenticated ? accentColor : "#ff3b3b", boxShadow: `0 0 8px ${isAuthenticated ? accentColor : "#ff3b3b"}` }}
        />
        <span
          className="text-xs tracking-[0.3em] uppercase font-bold"
          style={{ color: accentColor, textShadow: `0 0 12px ${accentColor}44` }}
        >
          EL BÚNKER
        </span>
      </div>

      {/* RIGHT: Clock */}
      <div className="flex items-center gap-4 text-xs whitespace-nowrap" style={{ color: accentColor, opacity: 0.75 }}>
        <span className="tracking-wider">{dateStr}</span>
        <span
          className="font-bold tracking-widest tabular-nums"
          style={{ color: accentColor, textShadow: `0 0 8px ${accentColor}66` }}
        >
          {timeStr}
        </span>
        <button
          onClick={() => window.location.reload()}
          className="text-xs tracking-widest uppercase px-2 py-1 rounded-sm transition-all"
          style={{ border: `1px solid ${accentColor}33`, opacity: 1 }}
        >
          ↺
        </button>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="text-xs tracking-widest uppercase px-2 py-1 rounded-sm transition-all"
            style={{ border: `1px solid #ff3b3b44`, color: "#ff3b3b", opacity: 0.7 }}
          >
            EXIT
          </button>
        )}
      </div>
    </motion.header>
  );
};

// ─── BOTTOM NAV ──────────────────────────────────────────────
const BottomNav = ({ activeTab, onTabChange, accentColor = ACID }) => {
  const tabs = [
    { id: "vault",     label: "VAULT",    icon: "◈" },
    { id: "music",     label: "MUSIC LAB",icon: "◉" },
    { id: "capsules",  label: "CAPSULES", icon: "⧖" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-4 py-3"
      style={{
        background: `linear-gradient(0deg, rgba(5,5,5,0.98) 0%, rgba(5,5,5,0.0) 100%)`,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.9 }}
            className="relative flex flex-col items-center gap-1 px-3 py-1 text-xs tracking-widest uppercase transition-all"
            style={{
              color: isActive ? accentColor : `${accentColor}88`,
              textShadow: isActive ? `0 0 12px ${accentColor}` : "none",
            }}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-1 left-0 right-0 h-px"
                style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
};

// ─── GRID BACKGROUND ─────────────────────────────────────────
const GridBackground = ({ accentColor = ACID }) => {
  const hex = accentColor.startsWith("#") ? accentColor : ACID;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(${hex}99 1px, transparent 1px),
          linear-gradient(90deg, ${hex}99 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  );
};

// ─── AMBIENT GLOWS ───────────────────────────────────────────
const AmbientGlows = ({ accentColor = ACID }) => (
  <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    {/* Top-left vibe glow */}
    <div
      className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-[0.06]"
      style={{ background: accentColor, filter: "blur(80px)" }}
    />
    {/* Bottom-right purple glow */}
    <div
      className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-[0.06]"
      style={{ background: PURPLE, filter: "blur(80px)" }}
    />
    {/* Center pulse */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-[0.02]"
      style={{ background: accentColor, filter: "blur(60px)" }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.02, 0.04, 0.02] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// ─── MINI PLAYER (G7: persistente entre pestañas) ───────────
const MiniPlayer = ({ accentColor = ACID }) => {
  const { activeTrack, isPlaying, audioRef, skip } = usePlayer();
  const [progress, setProgress] = useState(() => {
    const a = audioRef.current;
    if (a?.duration && a?.currentTime != null) return (a.currentTime / a.duration) * 100;
    return 0;
  });
  const [currentT, setCurrentT] = useState(() => audioRef.current?.currentTime || 0);
  const [duration, setDuration] = useState(() => audioRef.current?.duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentT(audio.currentTime || 0);
      setDuration(audio.duration || 0);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    audio.addEventListener("timeupdate", onTime);
    return () => audio.removeEventListener("timeupdate", onTime);
  }, [audioRef]);

  if (!activeTrack) return null;

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); }
    else { audioRef.current.play().catch(() => {}); }
  };

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  // Tag pill from track's primary tag
  const tagLabel = activeTrack?.tag_label ?? activeTrack?.tag ?? activeTrack?.tag_id ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-16 left-0 right-0 z-25 mx-2"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm cursor-pointer select-none"
        style={{
          background: `linear-gradient(135deg, rgba(5,5,5,0.97) 0%, rgba(12,12,12,0.97) 100%)`,
          border: `1px solid ${accentColor}44`,
          boxShadow: `0 0 20px ${accentColor}15, 0 2px 8px rgba(0,0,0,0.5)`,
        }}
        onClick={toggle}
      >
        {/* Play/Pause */}
        <motion.div
          whileTap={{ scale: 0.88 }}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}08 100%)`,
            border: `1px solid ${accentColor}55`,
            boxShadow: `0 0 12px ${accentColor}22`,
          }}
        >
          <motion.span
            key={isPlaying ? "pause" : "play"}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-base"
            style={{ color: accentColor, textShadow: `0 0 8px ${accentColor}88` }}
          >
            {isPlaying ? "⏸" : "▶"}
          </motion.span>
        </motion.div>

        {/* Track info */}
        <div className="flex-1 min-w-0" onClick={toggle}>
          <p className="text-[11px] font-bold truncate leading-tight"
            style={{ color: accentColor, textShadow: `0 0 6px ${accentColor}44` }}>
            {activeTrack.title || "Sin título"}
          </p>
          <p className="text-[10px] opacity-45 truncate leading-tight" style={{ color: accentColor }}>
            {activeTrack.artist || "—"}
            {tagLabel && <span className="ml-2 opacity-50">· {tagLabel}</span>}
          </p>
        </div>

        {/* Time */}
        <span className="text-[9px] opacity-35 tabular-nums flex-shrink-0 hidden sm:block" style={{ color: accentColor }}>
          {fmtTime(currentT)} / {fmtTime(duration)}
        </span>

        {/* Skip */}
        <motion.div
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); skip(1); }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-sm"
          style={{ background: `${accentColor}0e`, border: `1px solid ${accentColor}33` }}
          title="Siguiente"
        >
          <span className="text-xs opacity-60" style={{ color: accentColor }}>▶▶</span>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] rounded-full overflow-hidden" style={{ background: `${accentColor}15` }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
          style={{ background: `linear-gradient(90deg, ${accentColor}cc 0%, ${accentColor} 100%)`, boxShadow: `0 0 6px ${accentColor}88` }}
        />
      </div>
    </motion.div>
  );
};

// ─── MAIN LAYOUT ─────────────────────────────────────────────
/**
 * Layout
 *
 * Props:
 *   children          — page content
 *   isAuthenticated   — boolean from VaultContext
 *   dbStatus          — "ONLINE" | "SYNCING" | "OFFLINE"
 *   lastHeartbeat     — ISO string
 *   activeTab         — string
 *   onTabChange       — (tabId: string) => void
 */
export default function Layout({
  children,
  isAuthenticated = false,
  dbStatus: _dbStatus = "OFFLINE",
  lastHeartbeat: _lastHeartbeat = null,
  activeTab = "vault",
  onTabChange = () => {},
  onSignOut,
}) {
  const { trackVibe, resolveVibeAccent } = usePlayer();
  const accentColor = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: BG, color: accentColor, fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}
    >
      {/* ── Layer 0: Atmosphere ── */}
      <GridBackground accentColor={accentColor} />
      <AmbientGlows accentColor={accentColor} />

      {/* ── Layer 1: CRT + Noise effects ── */}
      <NoiseOverlay />
      <ScanlineOverlay />

      {/* ── Layer 2: Chrome ── */}
      <StatusBar
        isAuthenticated={isAuthenticated}
        onSignOut={onSignOut}
        accentColor={accentColor}
      />

      {/* ── Layer 3: Page Content ── */}
      {/* NOTA: Las transiciones de página las maneja App.jsx (AuthenticatedApp).
           No duplicar AnimatePresence aquí — causa doble animación y flicker. */}
      <main
        className="relative z-20 pt-10 pb-20 min-h-screen"
        style={{ scrollbarColor: `${ACID}44 transparent` }}
      >
        {children}
      </main>

      {/* ── Layer 3.5: Mini Player (G7) ── */}
      {activeTab !== "music" && <MiniPlayer accentColor={accentColor} />}

      {/* ── Layer 4: Bottom Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} accentColor={accentColor} />
    </div>
  );
}

// ─── NAMED EXPORTS (reusable primitives) ─────────────────────
export { CornerBrackets, ACID, PURPLE, BG };
