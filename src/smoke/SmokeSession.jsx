// ============================================================
//  EL BÚNKER — SmokeSession.jsx
//  Componente Especial · Temporizador Circular Neón
//  S73 — Nombrado, historial, rachas, vibe-aware, notificaciones
//  Stack: React 18 + Framer Motion + SVG
// ============================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePlayer } from "../core/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE } from "../tokens";
import { workerClient } from "../core/WorkerClient";

const SMOKE_HISTORY_KEY = "el_bunker_smoke_history";

// ─── DESIGN TOKENS ───────────────────────────────────────────
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
  // S73 fix: single usePlayer() call
  const { masterVolume: ctxVolume, setMasterVolume, trackVibe, resolveVibeAccent } = usePlayer();
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

  // S73: Session name, history, streaks, vibe-aware
  const [sessionName, setSessionName] = useState("");
  const sessionNameRef = useRef(""); // S73 fix: avoid stale closure in timer callback
  const sessionIdRef = useRef(null);  // SS-8: correlate start + complete Timeline events
  const fadeoutNotifiedRef = useRef(false); // SS-7: prevent duplicate pre-fadeout notifications
  const presetLabelRef = useRef(selectedPreset?.label); // SS-8: capture preset at session start
  useEffect(() => { presetLabelRef.current = selectedPreset?.label; }, [selectedPreset]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SMOKE_HISTORY_KEY) || "[]"); }
    catch { return []; }
  });
  const vibeAccent = useMemo(() => {
    if (!trackVibe) return null;
    return resolveVibeAccent?.(trackVibe) || null;
  }, [trackVibe, resolveVibeAccent]);

  // S73: Streak — días consecutivos con sesiones completadas
  const streak = useMemo(() => {
    if (!history.length) return 0;
    const completedDates = [...new Set(
      history.filter(h => h.completed).map(h => h.date?.slice(0, 10))
    )].sort().reverse();
    if (!completedDates.length) return 0;
    let count = 1;
    const oneDay = 86400000;
    for (let i = 1; i < completedDates.length; i++) {
      const diff = new Date(completedDates[i - 1]).getTime() - new Date(completedDates[i]).getTime();
      if (Math.abs(diff - oneDay) < 3600000) count++;
      else break;
    }
    // Check if today is in the streak
    const today = new Date().toISOString().slice(0, 10);
    if (completedDates[0] !== today) return 0;
    return count;
  }, [history]);

  // S73: Save completed session to history
  const saveToHistory = useCallback((completed, durationSecs, name) => {
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      name: name || "Sin nombre",
      duration: durationSecs,
      completed,
    };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      try { localStorage.setItem(SMOKE_HISTORY_KEY, JSON.stringify(updated)); }
      catch { /* noop */ }
      return updated;
    });
  }, []);

  // SS-7: Pre-fadeout notification — 1 minuto antes de que termine el fade-out
  const notifyPreFadeout = useCallback((name) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification("Smoke Session · 1 minuto restante", {
      body: `${name || "Sesión sin nombre"} · El volumen empezará a fundirse`,
      icon: "/manifest-icon-192.png",
      tag: "smoke-prefade",
      vibrate: [200, 100, 200],
    });
  }, []);

  // S73: Notification when session completes
  const notifyComplete = useCallback((name, durationSecs) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("Smoke Session completada", {
        body: `${name || "Sesión sin nombre"} · ${formatTime(durationSecs)}`,
        icon: "/manifest-icon-192.png",
        tag: "smoke-complete",
      });
    } else if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // SS-8: Emit event to Timeline (D1 events table)
  const emitTimelineEvent = useCallback((eventType, name, durationSecs) => {
    if (!workerClient.hasToken() || !sessionIdRef.current) return;
    workerClient.post('/api/events', {
      event_type: eventType,
      entity_type: 'smoke_session',
      entity_id: sessionIdRef.current,
      payload: {
        name: name || "Sin nombre",
        duration_secs: durationSecs,
        preset_label: presetLabelRef.current || "custom",
      },
    }).catch((err) => console.debug("[Smoke] Timeline event falló:", err));
  }, []);

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

  // ADR-TDZ: effectiveActiveColor declarado DESPUÉS de activeColor para evitar
  // ReferenceError al evaluar el array de dependencias del useMemo.
  // Usa el accent del vibe activo (música sonando) como override cuando hay sesión corriendo.
  const effectiveActiveColor = useMemo(() => {
    if (vibeAccent && isRunning) return vibeAccent;
    return activeColor;
  }, [vibeAccent, isRunning, activeColor]);

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
          // S73: Save to history + notify (use ref for correct name at completion)
          saveToHistory(true, totalSeconds, sessionNameRef.current);
          notifyComplete(sessionNameRef.current, totalSeconds);
          // SS-8: Emit completed event to Timeline
          emitTimelineEvent('smoke_session_completed', sessionNameRef.current, totalSeconds);
          return 0;
        }
        // SS-7: Pre-fadeout notification at 60s remaining (1 minuto antes del fade-out)
        if (prev === 60 && !fadeoutNotifiedRef.current) {
          fadeoutNotifiedRef.current = true;
          notifyPreFadeout(sessionNameRef.current);
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
    fadeoutNotifiedRef.current = false; // SS-7: reset pre-fadeout notification guard
    setOriginalVolume(masterVolume);
    setFadedVolume(masterVolume);
    setIsDone(false);
    setIsRunning(true);
    sessionNameRef.current = sessionName; // S73: capture name at session start
    presetLabelRef.current = selectedPreset?.label; // SS-8: capture preset at session start
    endTimeRef.current = Date.now() + remaining * 1000;
    // SS-8: Generate session ID + emit started event to Timeline
    sessionIdRef.current = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    emitTimelineEvent('smoke_session_started', sessionName, totalSeconds);
  }, [masterVolume, remaining, sessionName, totalSeconds, selectedPreset, emitTimelineEvent]);

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: isRunning ? [0.5, 1, 0.5] : 1 }}
              transition={{ duration: 1.4, repeat: isRunning ? Infinity : 0 }}
              style={{ color: effectiveActiveColor, fontSize: 16 }}
            >
              ◉
            </motion.span>
            <span
              className="text-xs tracking-[0.35em] uppercase font-bold"
              style={{ color: effectiveActiveColor, textShadow: isRunning ? `0 0 8px ${effectiveActiveColor}` : "none" }}
            >
              SMOKE SESSION
            </span>
            {/* S73: Vibe indicator */}
            {vibeAccent && isRunning && (
              <span className="text-xs opacity-40" style={{ color: vibeAccent }}>
                ♫
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* S73: Streak counter */}
            {streak >= 2 && (
              <span className="text-xs px-1.5 py-0.5 rounded-sm" style={{ color: ORANGE, background: `${ORANGE}15`, fontFamily: FONT }}>
                🔥 {streak}
              </span>
            )}
            {/* S73: History button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowHistory(p => !p)}
              className="text-xs px-2 py-1 rounded-sm"
              style={{
                color: showHistory ? ACID : `${ACID}44`,
                border: `1px solid ${showHistory ? `${ACID}44` : `${ACID}18`}`,
                fontFamily: FONT,
              }}
            >
              {showHistory ? "✕" : `${history.length} 📋`}
            </motion.button>
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
        </div>

        {/* S73: Session name input */}
        {!isRunning && (
          <input
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder="Nombre de la sesión..."
            maxLength={40}
            className="w-full px-3 py-1.5 rounded-sm text-xs bg-transparent outline-none"
            style={{
              color: ACID,
              border: `1px solid ${ACID}18`,
              fontFamily: FONT,
              letterSpacing: "0.05em",
            }}
          />
        )}

        {/* S73: History panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 flex flex-col gap-1" style={{ maxHeight: 180, overflowY: "auto" }}>
                {history.length === 0 ? (
                  <p className="text-xs opacity-25 text-center py-2" style={{ color: ACID }}>Sin sesiones aún</p>
                ) : (
                  history.slice(0, 12).map((h, i) => (
                    <div key={h.id || `session-${i}`} className="flex items-center gap-2 text-xs py-1 px-2"
                      style={{ borderBottom: `1px solid ${ACID}0a`, fontFamily: FONT }}>
                      <span style={{ color: h.completed ? PURPLE : `${ACID}33` }}>
                        {h.completed ? "✓" : "⌁"}
                      </span>
                      <span className="truncate flex-1 opacity-50" style={{ color: ACID }}>
                        {h.name || "Sin nombre"}
                      </span>
                      <span className="opacity-25 flex-shrink-0" style={{ color: ACID }}>
                        {formatTime(h.duration)}
                      </span>
                      <span className="opacity-15 flex-shrink-0 text-xs" style={{ color: ACID }}>
                        {h.date?.slice(0, 10)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* ── Volume Fade Bar (G6: slider interactivo) ──────── */}
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
        {/* G6: Slider de volumen interactivo */}
        <input
          type="range"
          min={0}
          max={100}
          value={isFading ? fadedVolume : masterVolume}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isFading && onVolumeChange) onVolumeChange(v);
          }}
          className="w-full h-1.5 appearance-none cursor-pointer rounded-full"
          style={{
            background: `linear-gradient(90deg, ${isFading ? RED : ACID} ${isFading ? fadedVolume : masterVolume}%, ${ACID}15 ${isFading ? fadedVolume : masterVolume}%)`,
            accentColor: isFading ? RED : ACID,
            opacity: isFading ? 0.5 : 1,
          }}
          disabled={isFading}
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
