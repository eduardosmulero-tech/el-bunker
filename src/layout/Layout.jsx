// ============================================================
//  EL BÚNKER — Layout.jsx
//  Shell Principal · Cyber-Vandal Aesthetic
//  Stack: React + Tailwind CSS + Framer Motion
// ============================================================

import { useState, useEffect, useMemo, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../core/ToastContext";
import { usePlayer } from "../core/PlayerContext";
import { useVault } from "../core/VaultContext";
import { useMusicActions } from "../musiclab/useMusicActions";
import { WinampPlayer } from "../musiclab/WinampPlayer";
import VisitModeControl from "../vault/VisitModeControl";
import { ACID, PURPLE, BG, getVibeConfig } from "../tokens";
import { Icon } from "../core/ui";

// ─── SEGUNDO NIVEL (ADR-029 §6 P2) ───────────────────────────
// Estado real del segundo nivel elevado desde las páginas al shell:
// Capsules (subTab), MusicLab (vista activa) y Vault (sección activa,
// ADR-033). El DesktopRail lo lee para pintar el activo y lo escribe al pulsar.
const DEFAULT_SECOND_LEVEL = { vault: "memoria", music: "tracks", capsules: "timeline" };
const SecondLevelNavContext = createContext({
  secondLevel: DEFAULT_SECOND_LEVEL,
  setSecondLevel: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useSecondLevelNav() {
  return useContext(SecondLevelNavContext);
}

// ─── SCANLINE OVERLAY ────────────────────────────────────────
// CRT scanline effect via repeating linear gradient
const ScanlineOverlay = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-50"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)",
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
  const { partnerListening, partnerTrack, partnerName, partnerTrackVibe, sessionId } = usePlayer();

  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = tick.toLocaleTimeString("es-ES", {
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const dateStr = tick.toLocaleDateString("es-ES", {
    year: "numeric", month: "short", day: "2-digit",
  }).toUpperCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mobile-status-bar fixed top-0 left-0 right-0 z-30 flex flex-col px-6"
      style={{
        paddingTop: "env(safe-area-inset-top, 12px)",
        paddingBottom: "12px",
        /* 80px contenido (20+4+44+12) + safe-area (misma formula que paddingTop del StatusBar) */
        minHeight: "calc(80px + env(safe-area-inset-top, 12px))",
        background: `linear-gradient(180deg, rgba(5,5,5,0.995) 0%, rgba(5,5,5,0.95) 60%, rgba(5,5,5,0.0) 100%)`,
      }}
    >
      {/* ROW 1: Brand (línea propia) + Clock compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full flex-none"
            style={{ background: isAuthenticated ? accentColor : "#ff3b3b", boxShadow: `0 0 8px ${isAuthenticated ? accentColor : "#ff3b3b"}` }}
          />
          <span
            className="text-xs tracking-[0.3em] uppercase font-bold flex-none"
            style={{ color: accentColor, textShadow: `0 0 12px ${accentColor}44` }}
          >
            EL BÚNKER
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs whitespace-nowrap flex-none" style={{ color: accentColor, opacity: 0.75 }}>
          <span className="tracking-wider text-[11px]">{dateStr}</span>
          <span
            className="font-bold tracking-widest tabular-nums text-[11px]"
            style={{ color: accentColor, textShadow: `0 0 8px ${accentColor}66` }}
          >
            {timeStr}
          </span>
        </div>
      </div>

      {/* ROW 2: Presence indicator + action buttons */}
      <div className="flex items-center justify-between mt-1">
        {/* SC14: Presence indicator — sigue el vibe del partner */}
        <div className="min-w-0 flex-1">
          {partnerListening ? (() => {
            const partnerVibeColor = partnerTrackVibe ? getVibeConfig(partnerTrackVibe).palette.accent : "#ffcc00";
            return (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[9px] tracking-wider uppercase truncate"
                style={{ color: sessionId ? "#ff2d55" : partnerVibeColor, opacity: 0.8 }}
              >
                <motion.span
                  animate={sessionId
                    ? { scale: [1, 1.3, 1] }
                    : { opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="flex-none"
                >
                  <Icon name={sessionId ? "heart" : "music"} size={12} label={sessionId ? "Sesión compartida" : "Reproduciendo"} />
                </motion.span>
                <span className="truncate">
                  {partnerName}{partnerTrack?.title ? ` · ${partnerTrack.title}` : ""}
                </span>
              </motion.div>
            );
          })() : (
            <span className="text-[9px] opacity-20 tracking-wider uppercase" style={{ color: accentColor }}>
              · offline ·
            </span>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-none ml-2">
          <VisitModeControl accentColor={accentColor} />
          <button
            onClick={() => window.location.reload()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="text-[10px] tracking-widest uppercase px-2 py-1.5 rounded-sm transition-all"
              style={{ border: `1px solid ${accentColor}22`, opacity: 0.45, color: accentColor }}>
              <Icon name="refresh" size={14} label="Recargar" />
            </span>
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <span className="text-[10px] tracking-widest uppercase px-2 py-1.5 rounded-sm transition-all"
                style={{ border: "1px solid #ff3b3b22", color: "#ff3b3b", opacity: 0.45 }}>
                <Icon name="unlock" size={14} label="Cerrar sesión" />
              </span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

// ─── BOTTOM NAV ──────────────────────────────────────────────
const BottomNav = ({ activeTab, onTabChange, accentColor = ACID }) => {
  const tabs = [
    { id: "vault",     label: "VAULT",    icon: "archive" },
    { id: "music",     label: "MUSIC LAB",icon: "music" },
    { id: "capsules",  label: "CAPSULES", icon: "lock" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2"
      style={{
        paddingTop: "10px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom, 8px))",
        minHeight: "calc(52px + env(safe-area-inset-bottom, 8px))",
        background: `linear-gradient(0deg, rgba(5,5,5,0.99) 0%, rgba(5,5,5,0.85) 60%, rgba(5,5,5,0.0) 100%)`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.9 }}
            className="relative flex flex-col items-center gap-1 px-2 py-2 text-xs tracking-widest uppercase transition-all min-h-[44px] flex-1 min-w-0"
            style={{
              color: isActive ? accentColor : `${accentColor}88`,
              textShadow: isActive ? `0 0 12px ${accentColor}` : "none",
            }}
          >
            <Icon name={tab.icon} size={16} label={tab.label} />
            <span style={{ fontSize: 11, lineHeight: 1.2 }} className="truncate max-w-full">{tab.label}</span>
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
    {/* Top-left vibe glow — más definido (S135: blur 80→48, opacity .06→.08) */}
    <div
      className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-[0.08]"
      style={{ background: accentColor, filter: "blur(48px)" }}
    />
    {/* Bottom-right purple glow — más definido */}
    <div
      className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-[0.08]"
      style={{ background: PURPLE, filter: "blur(48px)" }}
    />
  </div>
);

// ─── MINI PLAYER (G7: persistente entre pestañas) ───────────
const MiniPlayer = ({ accentColor = ACID, bottomNavHeight = 80 }) => {
  const { activeTrack, isPlaying, audioRef, skip } = usePlayer();
  // ADR-Refs: refs NO se leen durante el render. Valores inicializados a 0;
  // el useEffect de abajo sincroniza desde el ref vía evento 'timeupdate' en mount.
  const [progress, setProgress] = useState(0);
  const [currentT, setCurrentT] = useState(0);
  const [duration, setDuration] = useState(0);

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

  // Tag pill from track's primary tag — resolve tag_id → label from db.music_lab.tags
  const { db } = useVault();
  const resolvedTagLabel = useMemo(() => {
    if (!activeTrack?.tag_id) return null;
    const tags = db?.music_lab?.tags;
    if (!tags?.length) return null;
    const tag = tags.find(t => t.id === activeTrack.tag_id);
    return tag?.label ?? null;
  }, [activeTrack, db?.music_lab?.tags]);
  const tagLabel = activeTrack?.tag_label ?? resolvedTagLabel ?? activeTrack?.tag ?? activeTrack?.tag_id ?? null;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mobile-mini-player fixed left-0 right-0 z-[25] mx-2"
      style={{ bottom: `calc(${bottomNavHeight}px + env(safe-area-inset-bottom, 4px))` }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-sm cursor-pointer select-none"
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
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-sm"
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
            <Icon name={isPlaying ? "pause" : "play"} size={16} label={isPlaying ? "Pausar" : "Reproducir"} />
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

        {/* S125: time visible en mobile (antes hidden sm:block) */}
        <span className="text-[9px] opacity-35 tabular-nums flex-shrink-0" style={{ color: accentColor }}>
          {fmtTime(currentT)}/{fmtTime(duration)}
        </span>

        {/* S125: cluster prev/skip agrupado (gap-1) en lugar de separados */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Prev */}
          <motion.div
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); skip(-1); }}
            className="w-11 h-11 flex items-center justify-center rounded-sm min-w-[44px] min-h-[44px]"
            style={{ background: `${accentColor}0e`, border: `1px solid ${accentColor}33` }}
            title="Anterior"
          >
            <Icon name="arrowLeft" size={14} label="Anterior" />
          </motion.div>

          {/* Skip */}
          <motion.div
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); skip(1); }}
            className="w-11 h-11 flex items-center justify-center rounded-sm min-w-[44px] min-h-[44px]"
            style={{ background: `${accentColor}0e`, border: `1px solid ${accentColor}33` }}
            title="Siguiente"
          >
            <Icon name="arrowRight" size={14} label="Siguiente" />
          </motion.div>
        </div>
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
const DesktopRail = ({ activeTab, onTabChange, accentColor, isAdmin }) => {
  const { secondLevel, setSecondLevel } = useSecondLevelNav();
  // ADR-029 §6 P2: el raíl es dueño del segundo nivel. Los hijos son botones
  // reales con onClick; el activo sale del estado real elevado, nunca de un índice.
  const destinations = [
    // ADR-033: VAULT se parte en 4 secciones (MEMORIA, PALABRAS, LUGARES,
    // LISTAS) que son el segundo nivel del raíl. CAJA FUERTE no se pinta:
    // diseñada pero no construida (§4.3).
    {
      id: "vault", label: "VAULT", icon: "archive",
      children: [
        { id: "memoria", label: "MEMORIA" },
        { id: "palabras", label: "PALABRAS" },
        { id: "lugares", label: "LUGARES" },
        { id: "listas", label: "LISTAS" },
      ],
    },
    {
      id: "music", label: "MUSIC LAB", icon: "music",
      children: [
        { id: "queue", label: "COLA" },
        { id: "tracks", label: "TRACKS" },
        { id: "playlists", label: "LISTS" },
        { id: "drops", label: "DROPS" },
      ],
    },
    {
      id: "capsules", label: "CAPSULES", icon: "lock",
      children: [
        { id: "timeline", label: "TIMELINE" },
        { id: "smoke", label: "SMOKE" },
        { id: "timecapsules", label: "TIME CAPSULES" },
        { id: "recap", label: "RECAP" },
      ],
    },
  ];
  return (
    <aside className="desktop-only desktop-rail" aria-label="Navegación de escritorio">
      <div className="desktop-rail__destinations">
        {destinations.map((destination) => {
          const active = activeTab === destination.id;
          const currentSecondLevel = secondLevel[destination.id];
          return (
            <div key={destination.id}>
              <button type="button" onClick={() => onTabChange(destination.id)}
                className="desktop-rail__destination" aria-current={active ? "page" : undefined}
                style={{ color: active ? accentColor : `${accentColor}66`, borderLeftColor: active ? accentColor : "transparent", background: active ? "color-mix(in srgb, var(--vibe-accent, #bfff00) 12%, transparent)" : "transparent" }}>
                <Icon name={destination.icon} size={16} decorative />
                <span>{destination.label}</span>
              </button>
              {active && (destination.children?.length ?? 0) > 0 && <div className="desktop-rail__children">
                {destination.children.map((child) => {
                  const childActive = currentSecondLevel === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      disabled={child.disabled}
                      onClick={child.disabled ? undefined : () => setSecondLevel(destination.id, child.id)}
                      aria-current={childActive ? "true" : undefined}
                      className={`desktop-rail__child${childActive ? " desktop-rail__child--active" : ""}`}
                      style={{
                        color: childActive ? accentColor : child.disabled ? `${accentColor}38` : `${accentColor}66`,
                        border: "0",
                        background: "transparent",
                        padding: "0",
                        textAlign: "left",
                        width: "100%",
                        cursor: child.disabled ? "default" : "pointer",
                        opacity: child.disabled ? 0.55 : 1,
                      }}
                    >
                      {child.label}
                    </button>
                  );
                })}
              </div>}
            </div>
          );
        })}
        {isAdmin && (
          <div className="desktop-rail__admin">
            <div className="desktop-rail__divider" aria-hidden="true" />
            <button
              type="button"
              onClick={() => { window.location.assign("/admin"); }}
              className="desktop-rail__destination"
              style={{ color: `${accentColor}88` }}
            >
              <Icon name="shield" size={16} decorative />
              <span>ADMIN</span>
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        className="desktop-rail__hint desktop-rail__hint--actionable"
        style={{ color: `${accentColor}88` }}
        onClick={() => {
          const ZONAS = ["vault", "music", "capsules"];
          const idx = ZONAS.indexOf(activeTab);
          onTabChange(ZONAS[(idx + 1) % ZONAS.length]);
        }}
        aria-label="Cambiar de zona (1/2/3)"
        title="Teclas 1 / 2 / 3 · clic para cambiar de zona"
      >
        1 / 2 / 3 · CAMBIAR ZONA
      </button>
    </aside>
  );
};

const DesktopTopbar = ({ isAuthenticated, onSignOut, activeTab, accentColor, partnerListening, partnerName, partnerTrack, tick }) => (
  <header className="desktop-only desktop-topbar" style={{ color: accentColor }}>
    <div className="desktop-topbar__brand"><span className="desktop-topbar__pulse" style={{ background: isAuthenticated ? accentColor : "#ff3b3b" }} /> EL BÚNKER <span className="desktop-topbar__separator">/</span> {activeTab.toUpperCase()}</div>
    <div className="desktop-topbar__presence" style={{ color: partnerListening ? accentColor : `${accentColor}66` }}>
      <Icon name={partnerListening ? "music" : "offline"} size={14} decorative />
      {partnerListening ? `${partnerName || "PARTNER"}${partnerTrack?.title ? ` · ${partnerTrack.title}` : ""}` : "OFFLINE"}
    </div>
    <div className="desktop-topbar__actions">
      <VisitModeControl accentColor={accentColor} />
      <span>{tick.toLocaleDateString("es-ES", { month: "short", day: "2-digit" }).toUpperCase()} · {tick.toLocaleTimeString("es-ES", { hour12: false, hour: "2-digit", minute: "2-digit" })}</span>
      <button type="button" onClick={() => window.location.reload()} aria-label="Recargar"><Icon name="refresh" size={14} decorative /></button>
      {onSignOut && <button type="button" onClick={onSignOut} aria-label="Cerrar sesión"><Icon name="unlock" size={14} decorative /></button>}
    </div>
  </header>
);

export default function Layout({
  children,
  isAuthenticated = false,
  dbStatus: _dbStatus = "OFFLINE",
  lastHeartbeat: _lastHeartbeat = null,
  activeTab = "vault",
  onTabChange = () => {},
  onSignOut,
}) {
  const { toasts, muteToast } = useToast();
  const { db, user } = useVault();
  const { onAddDrop } = useMusicActions();
  const { trackVibe, resolveVibeAccent, networkStatus, sessionToast, setSessionToast, partnerListening, partnerName, partnerTrack, localQueue, playHistory } = usePlayer();
  const [desktopViewport, setDesktopViewport] = useState(false);
  const [tick, setTick] = useState(new Date());
  // ADR-029 §6 P2: segundo nivel elevado — el raíl lo lee y lo escribe.
  const [secondLevel, setSecondLevel] = useState(DEFAULT_SECOND_LEVEL);
  const setSecondLevelSafe = useCallback((tab, value) => {
    setSecondLevel((prev) => (prev[tab] === value ? prev : { ...prev, [tab]: value }));
  }, []);
  const secondLevelNav = useMemo(() => ({ secondLevel, setSecondLevel: setSecondLevelSafe }), [secondLevel, setSecondLevelSafe]);
  const accentColor = trackVibe ? (resolveVibeAccent(trackVibe) ?? ACID) : ACID;
  const desktopTracks = useMemo(() => (db?.music_lab?.tracks ?? []).filter((track) => !track.is_deleted), [db?.music_lab?.tracks]);
  // t_8fbbbac3: el chip de tag/vibe del dock desktop necesita label+icon, no solo accent.
  // Mismo patron que MusicLab.resolveVibeConf: tag de DB primero, fallback canónico,
  // y tag huerfano (en tracks pero no en DB) con config sintetica.
  const desktopVibeConf = useMemo(() => {
    if (!trackVibe) return undefined;
    const dbTags = db?.music_lab?.tags ?? [];
    const found = dbTags.find((t) => t.id === trackVibe);
    if (found && found.id !== "all") {
      const accent = found.palette?.accent ?? found.seedColor ?? found.color ?? resolveVibeAccent(trackVibe) ?? ACID;
      return { ...found, palette: { accent } };
    }
    const canon = getVibeConfig(trackVibe);
    if (canon && canon.id === trackVibe) return canon;
    // Tag huerfano: config sintetica para que el chip siempre tenga label/icon/color
    const label = trackVibe.replace(/_/g, " ").toUpperCase();
    const accent = resolveVibeAccent(trackVibe) ?? ACID;
    return { id: trackVibe, label, icon: "circle", color: accent, palette: { accent } };
  }, [trackVibe, db?.music_lab?.tags, resolveVibeAccent]);
  const handleDesktopDrop = (dropData) => {
    const to = user?.id === "edu" ? "david" : "edu";
    return onAddDrop?.({ ...dropData, id: crypto.randomUUID(), from: user?.id, to, created_at: new Date().toISOString() });
  };

  useEffect(() => {
    const media = window.matchMedia?.("(min-width: 1280px)");
    const update = () => setDesktopViewport(Boolean(media?.matches));
    update();
    media?.addEventListener?.("change", update);
    return () => media?.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;
      if (event.key === "1") onTabChange("vault");
      if (event.key === "2") onTabChange("music");
      if (event.key === "3") onTabChange("capsules");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onTabChange]);

  // VB9: propagate vibe accent as CSS variable on :root so all components can react
  useEffect(() => {
    document.documentElement.style.setProperty("--vibe-accent", accentColor);
    return () => { document.documentElement.style.removeProperty("--vibe-accent"); };
  }, [accentColor]);

  return (
    <SecondLevelNavContext.Provider value={secondLevelNav}>
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: BG, color: accentColor }}
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
      <DesktopTopbar
        isAuthenticated={isAuthenticated}
        onSignOut={onSignOut}
        activeTab={activeTab}
        accentColor={accentColor}
        partnerListening={partnerListening}
        partnerName={partnerName}
        partnerTrack={partnerTrack}
        tick={tick}
      />
      <DesktopRail activeTab={activeTab} onTabChange={onTabChange} accentColor={accentColor} isAdmin={user?.id === "admin"} />
      <aside className="desktop-only desktop-dock" aria-label="Reproductor permanente">
        {desktopViewport && <>
          {/* X-6 enmendada por feedback de Edu (28-ago): en MUSIC LAB el lienzo ES el
              reproductor grande — el dock oculta su reproductor ahí para no duplicarlo
              y conserva COLA/HISTORIAL. Ancho del dock constante: el lienzo no se mueve. */}
          {activeTab !== "music" && <WinampPlayer tracks={desktopTracks} vibeConf={desktopVibeConf} onDropSend={handleDesktopDrop} />}
          <section className="desktop-dock__queue" aria-label="Cola e historial">
            <div className="desktop-dock__section-title" style={{ color: accentColor }}>COLA [{localQueue?.length ?? 0}]</div>
            {(localQueue ?? []).slice(0, 5).map((track, index) => (
              <div key={`${track.id}-${index}`} className="desktop-dock__queue-row" style={{ color: track.color || `${accentColor}aa` }}>
                <span>{String(index + 1).padStart(2, "0")}</span><span style={{ minWidth: 0, overflowWrap: "anywhere", whiteSpace: "normal" }}>{track.title || "SIN TÍTULO"}</span>
              </div>
            ))}
            {(localQueue ?? []).length === 0 && <div className="desktop-dock__empty" style={{ color: `${accentColor}55` }}>COLA VACÍA</div>}
            <div className="desktop-dock__section-title desktop-dock__section-title--history" style={{ color: `${accentColor}88` }}>HISTORIAL [5]</div>
            {(playHistory ?? []).slice(-5).reverse().map((track, index) => (
              <div key={`${track.id || track.title}-${index}`} className="desktop-dock__queue-row desktop-dock__queue-row--history" style={{ color: `${accentColor}55` }}>
                <span>−</span><span style={{ minWidth: 0, overflowWrap: "anywhere", whiteSpace: "normal" }}>{track.title || "SIN TÍTULO"}</span>
              </div>
            ))}
          </section>
        </>}
      </aside>

      {/* ── Fase 1.5 — EC-P2: Toast de desconexión de red ── */}
      <AnimatePresence>
        {networkStatus === "offline" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-sm"
            style={{
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: "rgba(255,59,59,0.12)",
              border: "1px solid rgba(255,59,59,0.3)",
              color: "#ff3b3b",
              textShadow: "0 0 8px rgba(255,59,59,0.4)",
            }}
          >
            <Icon name="offline" size={14} label="Sin conexión" /> Sin conexión
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fase C — Toast de sesión compartida ── */}
      <AnimatePresence>
        {sessionToast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-sm flex items-center gap-2"
            style={{
              fontSize: "9px",
              letterSpacing: "0.15em",
              background: "rgba(255,45,85,0.10)",
              border: "1px solid rgba(255,45,85,0.35)",
              color: "#ff2d55",
              textShadow: "0 0 8px rgba(255,45,85,0.3)",
            }}
          >
            <Icon name="heart" size={14} label="Sesión compartida" />
            <span>{typeof sessionToast === "string" ? sessionToast : sessionToast.msg}</span>
            {typeof sessionToast === "object" && (
              <div className="flex items-center gap-1 ml-1">
                {sessionToast.action && (
                  <button onClick={(e) => { e.stopPropagation(); sessionToast.action(); }}
                    className="px-3 py-2.5 rounded-sm text-[10px] tracking-wider uppercase font-bold"
                    style={{ background: "rgba(255,45,85,0.2)", border: "1px solid rgba(255,45,85,0.5)" }}>
                    {sessionToast.actionLabel || "OK"}
                  </button>
                )}
                {sessionToast.secondaryLabel && (
                  <button onClick={(e) => { e.stopPropagation(); setSessionToast(null); }}
                    className="px-3 py-2.5 rounded-sm text-[10px] tracking-wider uppercase"
                    style={{ border: "1px solid rgba(255,45,85,0.25)", opacity: 0.6 }}>
                    {sessionToast.secondaryLabel}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fase 1 — Toast unificado ── */}
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.2 }}
            className="fixed z-40 flex items-center gap-2 px-3 py-2.5 rounded-sm pointer-events-auto"
            style={{
              top: 88,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "10px",
              letterSpacing: "0.15em",
              background: t.type === "error" ? "rgba(255,59,59,0.12)" : `${accentColor}0d`,
              border: `1px solid ${t.type === "error" ? "rgba(255,59,59,0.35)" : `${accentColor}33`}`,
              color: t.type === "error" ? "#ff3b3b" : accentColor,
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: t.type === "error" ? "0 0 8px rgba(255,59,59,0.3)" : "none",
              maxWidth: "85vw",
            }}
          >
            <span>{t.msg}</span>
            {t.sub && <span className="opacity-50 text-[9px] ml-1">{t.sub}</span>}
            {t.action && (
              <button onClick={() => { t.action(); muteToast(t.id); }}
                className="px-3 py-2 rounded-sm text-[10px] tracking-wider uppercase font-bold ml-1 whitespace-nowrap"
                style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}44` }}>
                {t.actionLabel || "OK"}
              </button>
            )}
            {t.secondaryLabel && (
              <button onClick={() => muteToast(t.id)}
                className="px-3 py-2 rounded-sm text-[10px] tracking-wider uppercase ml-1 whitespace-nowrap"
                style={{ border: `1px solid ${accentColor}22`, opacity: 0.5 }}>
                {t.secondaryLabel}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Layer 3: Page Content ── */}
      {/* NOTA: Las transiciones de página las maneja App.jsx (AuthenticatedApp).
           No duplicar AnimatePresence aquí — causa doble animación y flicker. */}
      <main
        className="relative z-20 min-h-screen desktop-canvas"
        /* 80px contenido (20+4+44+12) + safe-area (misma formula que StatusBar) */
        style={{
          paddingTop: "calc(80px + env(safe-area-inset-top, 12px))",
          paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </main>

      {/* ── Layer 3.5: Mini Player (G7) ── */}
      {!desktopViewport && activeTab !== "music" && <MiniPlayer accentColor={accentColor} bottomNavHeight={80} />}

      {/* ── Layer 4: Bottom Nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} accentColor={accentColor} />
      <footer className="desktop-only desktop-footer" style={{ color: `${accentColor}88` }}>
        <span>STATUS · {_dbStatus}</span><span>{db?.music_lab?.tracks?.filter((track) => !track.is_deleted).length ?? 0} TRACKS · {db?.entries?.length ?? 0} ENTRIES</span><span>SPACE PLAY/PAUSE · ? ATAJOS</span>
      </footer>

      {/* Landscape is supported; no global orientation lock. */}
    </div>
    </SecondLevelNavContext.Provider>
  );
}

// ─── NAMED EXPORTS (reusable primitives) ─────────────────────
export { CornerBrackets, ACID, PURPLE, BG };
