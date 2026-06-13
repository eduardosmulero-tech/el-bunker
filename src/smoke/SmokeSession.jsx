// ============================================================
//  EL BÚNKER — SmokeSession.jsx
//  Componente Especial · Temporizador Circular Neón
//  Feature: Fade-Out de volumen automático en los últimos 2 min
//  Stack: React 18 + Framer Motion + SVG
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { usePlayer } from "../core/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── DESIGN TOKENS ───────────────────────────────────────────
const ACID    = "#bfff00";
const PURPLE  = "#bf00ff";
const RED     = "#ff3b3b";
const ORANGE  = "#ff6b35";
const BG      = "#050505";
const FONT    = "'JetBrains Mono', 'Courier New', monospace";

const GLASS_BG     = "rgba(191,255,0,0.03)";

// ─── TIMER PRESETS ───────────────────────────────────────────
const PRESETS = [
  { label: "15 MIN", seconds: 15 * 60, color: "#00ffcc" },
  { label: "30 MIN", seconds: 30 * 60, color: ACID      },
  { label: "45 MIN", seconds: 45 * 60, color: ORANGE    },
  { label: "1 HORA", seconds: 60 * 60, color: PURPLE    },
  { label: "90 MIN", seconds: 90 * 60, color: RED       },
];

// ─── HELPERS ─────────────────────────────────────────────────
const formatTime = (secs) => {
  const h   = Math.floor(secs / 3600);
  const m   = Math.floor((secs % 3600) / 60);
  const s   = secs % 60;
  if (h > 0) {
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
};

const FADE_START_SECS = 120; // 2 minutes — fade-out window

// ─── CIRCULAR PROGRESS RING ───────────────────────────────────
const CircularRing = ({ progress, color, radius = 90, stroke = 5, children }) => {
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference * (1 - Math.max(0, Math.min(1, progress)));
  const size          = (radius + stroke + 4) * 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${color}18`}
          strokeWidth={stroke}
        />

        {/* Glow ring (blurred copy) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke + 6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={0.12}
          style={{ filter: `blur(8px)` }}
        />

        {/* Active progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
          }}
        />

        {/* Dot at progress tip */}
        {progress > 0.01 && progress < 0.999 && (() => {
          const angle  = 2 * Math.PI * progress - Math.PI / 2;
          const cx     = size / 2 + radius * Math.cos(angle);
          const cy     = size / 2 + radius * Math.sin(angle);
          return (
            <motion.circle
              cx={cx}
              cy={cy}
              r={stroke + 1}
              fill={color}
              animate={{ opacity: [0.7, 1, 0.7], r: [stroke, stroke + 2, stroke] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
          );
        })()}
      </svg>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// ─── VOLUME FADE INDICATOR ────────────────────────────────────
const VolumeFadeBar = ({ volume, isFading }) => (
  <div
    className="relative w-full rounded-sm overflow-hidden"
    style={{
      height: 6,
      background: `${ACID}15`,
      border: `1px solid ${ACID}20`,
    }}
  >
    <motion.div
      className="absolute inset-y-0 left-0 rounded-sm"
      style={{
        width: `${volume}%`,
        background: isFading
          ? `linear-gradient(90deg, ${RED}, ${ORANGE})`
          : `linear-gradient(90deg, ${ACID}88, ${ACID})`,
        boxShadow: `0 0 8px ${isFading ? RED : ACID}`,
        transition: "width 0.5s ease, background 0.5s ease",
      }}
    />
    {isFading && (
      <motion.div
        className="absolute inset-0 rounded-sm"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        style={{ background: RED }}
      />
    )}
  </div>
);

// ─── SMOKE SESSION MAIN COMPONENT ────────────────────────────
/**
 * SmokeSession
 *
 * Props:
 *   masterVolume      — number (0-100) from VaultContext
 *   onVolumeChange    — (vol: number) => void
 */
export default function SmokeSession({ masterVolume: masterVolumeProp, onVolumeChange: onVolumeChangeProp }) {
  const { masterVolume: ctxVolume, setMasterVolume } = usePlayer();
  const masterVolume   = ctxVolume  ?? masterVolumeProp  ?? 80;
  const onVolumeChange = setMasterVolume ?? onVolumeChangeProp;
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[1]); // 30 min default
  const [customMinutes,  setCustomMinutes]  = useState(30);
  const [totalSeconds,   setTotalSeconds]   = useState(PRESETS[1].seconds);
  const [remaining,      setRemaining]      = useState(PRESETS[1].seconds);
  const [isRunning,      setIsRunning]      = useState(false);
  const [isDone,         setIsDone]         = useState(false);
  const [showCustom,     setShowCustom]     = useState(false);
  const [fadedVolume,    setFadedVolume]    = useState(masterVolume);
  const [originalVolume, setOriginalVolume] = useState(masterVolume);

  const intervalRef   = useRef(null);
  const fadeStartRef  = useRef(null);  // volume when fade begins
  const endTimeRef    = useRef(null);  // SH1: timestamp cuando termina la sesión (Date.now() + remaining*1000)

  // ── SH1: Restaurar estado del timer desde localStorage ───
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = localStorage.getItem("el_bunker_smoke");
      if (!saved) return;
      const { endTime, totalSecs, wasRunning } = JSON.parse(saved);
      if (wasRunning && typeof endTime === "number" && typeof totalSecs === "number") {
        const now = Date.now();
        const remainingSecs = Math.max(0, Math.round((endTime - now) / 1000));
        if (remainingSecs > 0) {
          setTotalSeconds(totalSecs);
          setRemaining(remainingSecs);
          setIsRunning(true);
          endTimeRef.current = endTime;
        } else {
          // Sesión ya terminó mientras la pestaña estaba cerrada
          setTotalSeconds(totalSecs);
          setRemaining(0);
          setIsDone(true);
        }
      }
    } catch { /* noop */ }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // ── SH1: Persistir estado del timer en localStorage ──────
  useEffect(() => {
    try {
      if (isRunning && endTimeRef.current) {
        localStorage.setItem("el_bunker_smoke", JSON.stringify({
          endTime: endTimeRef.current,
          totalSecs: totalSeconds,
          wasRunning: true,
        }));
      } else if (!isRunning) {
        localStorage.removeItem("el_bunker_smoke");
      }
    } catch { /* noop */ }
  }, [isRunning, totalSeconds, remaining]);

  // ── Color by remaining time ───────────────────────────────
  const isFading       = isRunning && remaining <= FADE_START_SECS && remaining > 0;
  const activeColor    = isDone
    ? PURPLE
    : isFading
    ? RED
    : selectedPreset?.color ?? ACID;

  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;

  // ── Timer tick ────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsDone(true);
          // Restore volume after session ends
          if (onVolumeChange) onVolumeChange(originalVolume);
          setFadedVolume(originalVolume);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // ── Fade-out logic ────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || remaining > FADE_START_SECS) return;

    // When we first enter the fade window, capture original volume
    if (fadeStartRef.current === null) {
      fadeStartRef.current = masterVolume;
      setOriginalVolume(masterVolume);
    }

    // Calculate fade: linear from originalVolume → 0 over FADE_START_SECS
    const fadeProgress = 1 - remaining / FADE_START_SECS; // 0 → 1
    const newVolume    = Math.max(0, Math.round(fadeStartRef.current * (1 - fadeProgress)));

    setFadedVolume(newVolume);
    if (onVolumeChange) onVolumeChange(newVolume);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, isRunning]);

  // ── Reset fade ref when session starts ────────────────────
  const startSession = useCallback(() => {
    fadeStartRef.current = null;
    setOriginalVolume(masterVolume);
    setFadedVolume(masterVolume);
    setIsDone(false);
    setIsRunning(true);
    endTimeRef.current = Date.now() + remaining * 1000;
  }, [masterVolume, remaining]);

  const pauseSession = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    clearInterval(intervalRef.current);
  }, []);

  const resetSession = useCallback(() => {
    setIsRunning(false);
    setIsDone(false);
    setRemaining(totalSeconds);
    clearInterval(intervalRef.current);
    fadeStartRef.current = null;
    endTimeRef.current = null;
    // Restore volume
    if (onVolumeChange) onVolumeChange(originalVolume);
    setFadedVolume(originalVolume);
  }, [totalSeconds, originalVolume, onVolumeChange]);

  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    setTotalSeconds(preset.seconds);
    setRemaining(preset.seconds);
    setIsRunning(false);
    setIsDone(false);
    fadeStartRef.current = null;
  };

  const applyCustom = () => {
    const secs = Math.max(1, Math.min(180, customMinutes)) * 60;
    setSelectedPreset({ label: `${customMinutes} MIN`, seconds: secs, color: ORANGE });
    setTotalSeconds(secs);
    setRemaining(secs);
    setIsRunning(false);
    setIsDone(false);
    setShowCustom(false);
    fadeStartRef.current = null;
  };

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div
      className="relative flex flex-col gap-5 p-5 rounded-sm overflow-hidden"
      style={{
        background: GLASS_BG,
        border: `1px solid ${activeColor}20`,
        fontFamily: FONT,
        boxShadow: isRunning ? `0 0 30px ${activeColor}0a` : "none",
        transition: "box-shadow 0.5s ease, border-color 0.5s ease",
      }}
    >
      {/* Corner brackets */}
      {[
        { top: 0, left: 0, borderTop: "solid", borderLeft: "solid" },
        { top: 0, right: 0, borderTop: "solid", borderRight: "solid" },
        { bottom: 0, left: 0, borderBottom: "solid", borderLeft: "solid" },
        { bottom: 0, right: 0, borderBottom: "solid", borderRight: "solid" },
      ].map((s, i) => (
        <span
          key={i}
          className="absolute w-4 h-4"
          style={{ ...s, borderColor: `${activeColor}60`, borderWidth: 1.5 }}
        />
      ))}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: isRunning ? [0.5, 1, 0.5] : 1 }}
            transition={{ duration: 1.4, repeat: isRunning ? Infinity : 0 }}
            style={{ color: activeColor, fontSize: 16 }}
          >
            ◉
          </motion.span>
          <span
            className="text-xs tracking-[0.35em] uppercase font-bold"
            style={{ color: activeColor, textShadow: isRunning ? `0 0 8px ${activeColor}` : "none" }}
          >
            SMOKE SESSION
          </span>
        </div>

        {isRunning && isFading && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.7, repeat: Infinity }}
            className="text-xs tracking-widest uppercase"
            style={{ color: RED, textShadow: `0 0 8px ${RED}` }}
          >
            ⚠ FADE OUT
          </motion.span>
        )}
      </div>

      {/* ── Circular Timer ──────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <CircularRing
          progress={progress}
          color={activeColor}
          radius={88}
          stroke={4}
        >
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.div
                key="done"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ fontSize: 32, color: PURPLE }}
                >
                  ◈
                </motion.span>
                <span
                  className="text-xs tracking-widest uppercase"
                  style={{ color: PURPLE, textShadow: `0 0 10px ${PURPLE}` }}
                >
                  FIN
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                {/* Main countdown */}
                <motion.span
                  className="font-bold tabular-nums leading-none text-center"
                  style={{
                    color: activeColor,
                    textShadow: isRunning ? `0 0 20px ${activeColor}` : "none",
                    fontSize: remaining >= 3600 ? 22 : 28,
                    fontFamily: FONT,
                    transition: "color 0.5s ease",
                    letterSpacing: "0.05em",
                  }}
                >
                  {formatTime(remaining)}
                </motion.span>

                {/* Status label */}
                <span
                  className="text-xs tracking-[0.3em] uppercase"
                  style={{ color: activeColor, opacity: 0.45 }}
                >
                  {isRunning
                    ? isFading
                      ? "FUNDIENDO..."
                      : "EN CURSO"
                    : isDone
                    ? "COMPLETADO"
                    : "EN PAUSA"}
                </span>

                {/* Fade-out warning */}
                {isFading && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="text-xs tracking-widest mt-1"
                    style={{ color: RED }}
                  >
                    VOL {fadedVolume}%
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CircularRing>
      </div>

      {/* ── Controls ────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3">
        {/* Reset */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={resetSession}
          disabled={!isRunning && remaining === totalSeconds && !isDone}
          className="text-xs tracking-widest uppercase px-3 py-2 rounded-sm"
          style={{
            color: ACID,
            border: `1px solid ${ACID}30`,
            background: `${ACID}06`,
            fontFamily: FONT,
            opacity: (!isRunning && remaining === totalSeconds && !isDone) ? 0.3 : 1,
          }}
        >
          ↺ RESET
        </motion.button>

        {/* Play / Pause */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isRunning ? pauseSession : startSession}
          className="relative px-6 py-2.5 rounded-sm text-sm tracking-[0.3em] uppercase font-bold overflow-hidden"
          style={{
            color: BG,
            background: isRunning
              ? `linear-gradient(135deg, ${ORANGE}, ${RED})`
              : `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
            fontFamily: FONT,
            boxShadow: `0 0 20px ${isRunning ? RED : activeColor}44`,
            transition: "background 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          {isRunning ? "⏸ PAUSAR" : isDone ? "◈ NUEVO" : "▶ ACTIVAR"}

          {/* Shimmer on active */}
          {isRunning && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                transform: "skewX(-20deg)",
              }}
            />
          )}
        </motion.button>
      </div>

      {/* ── Volume Fade Bar ─────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs" style={{ color: ACID, opacity: 0.4 }}>
          <span className="tracking-widest uppercase">VOLUMEN MASTER</span>
          <span className="tabular-nums font-bold" style={{ color: isFading ? RED : ACID, opacity: 1 }}>
            {Math.round(isFading ? fadedVolume : masterVolume)}%
          </span>
        </div>
        <VolumeFadeBar
          volume={isFading ? fadedVolume : masterVolume}
          isFading={isFading}
        />
        {isFading && (
          <p className="text-xs tracking-widest uppercase text-center opacity-50" style={{ color: RED }}>
            El volumen se fundirá a cero en {formatTime(remaining)}
          </p>
        )}
      </div>

      {/* ── Preset Selector ─────────────────────────────────── */}
      {!isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          {/* Divider */}
          <div
            className="h-px w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${ACID}20, transparent)` }}
          />

          <p className="text-xs tracking-[0.35em] uppercase opacity-30 text-center" style={{ color: ACID }}>
            DURACIÓN
          </p>

          {/* Preset pills */}
          <div className="flex gap-2 flex-wrap justify-center">
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset?.seconds === preset.seconds;
              return (
                <motion.button
                  key={preset.seconds}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => applyPreset(preset)}
                  className="text-xs tracking-widest uppercase px-3 py-1.5 rounded-sm transition-all"
                  style={{
                    fontFamily: FONT,
                    color: isSelected ? BG : preset.color,
                    background: isSelected ? preset.color : `${preset.color}12`,
                    border: `1px solid ${preset.color}${isSelected ? "ff" : "44"}`,
                    boxShadow: isSelected ? `0 0 12px ${preset.color}44` : "none",
                  }}
                >
                  {preset.label}
                </motion.button>
              );
            })}

            {/* Custom */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowCustom((p) => !p)}
              className="text-xs tracking-widest uppercase px-3 py-1.5 rounded-sm"
              style={{
                fontFamily: FONT,
                color: showCustom ? BG : PURPLE,
                background: showCustom ? PURPLE : `${PURPLE}10`,
                border: `1px solid ${PURPLE}${showCustom ? "ff" : "40"}`,
              }}
            >
              {showCustom ? "✕" : "CUSTOM"}
            </motion.button>
          </div>

          {/* Custom input */}
          <AnimatePresence>
            {showCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3"
              >
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-sm text-xs text-center tabular-nums"
                  style={{
                    background: `${PURPLE}08`,
                    border: `1px solid ${PURPLE}40`,
                    color: PURPLE,
                    fontFamily: FONT,
                    outline: "none",
                  }}
                />
                <span className="text-xs opacity-40" style={{ color: PURPLE }}>MIN</span>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={applyCustom}
                  className="px-4 py-2 text-xs tracking-widest uppercase rounded-sm"
                  style={{
                    color: BG,
                    background: PURPLE,
                    fontFamily: FONT,
                    boxShadow: `0 0 12px ${PURPLE}44`,
                  }}
                >
                  OK
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Fade-out legend ─────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs opacity-25" style={{ color: ACID }}>
        <span>◎</span>
        <span className="tracking-widest uppercase">
          Fade out automático en los últimos 2 min
        </span>
      </div>
    </div>
  );
}
