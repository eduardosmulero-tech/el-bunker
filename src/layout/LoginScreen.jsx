// ============================================================
//  EL BÚNKER — LoginScreen.jsx
//  Pantalla de Acceso · Cyber-Vandal Aesthetic
//  Stack: React + Framer Motion
//  Estética: Terminal abandonado / Graffiti digital / CRT
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID, PURPLE } from "../tokens";
import { Icon } from "../core/ui";

// ─── DESIGN TOKENS ───────────────────────────────────────────
const RED     = "#ff3b3b";
const BG      = "#050505";
const FONT    = "'JetBrains Mono', 'Courier New', monospace";

// ─── BOOT LOG LINES ──────────────────────────────────────────
const BOOT_LINES = [
  { text: "INITIALIZING SECURE CHANNEL...",     delay: 0,    color: ACID   },
  { text: "LOADING ENCRYPTION MODULE v4.2.1",   delay: 220,  color: ACID   },
  { text: "SCANNING MEMORY PARTITIONS...",       delay: 480,  color: ACID   },
  { text: "[!!] ANONYMOUS ACCESS DETECTED",      delay: 700,  color: RED    },
  { text: "DEPLOYING IDENTITY FIREWALL...",      delay: 900,  color: PURPLE },
  { text: "VAULT INTEGRITY: VERIFIED",             delay: 1150, color: ACID   },
  { text: "AWAITING BIOMETRIC CONFIRMATION...",  delay: 1400, color: ACID   },
];

// ─── GLITCH TEXT ─────────────────────────────────────────────
const GLITCH_CHARS = "!@#$%^&*+-=<>[]{}";

const useGlitch = (text, interval = 80, glitchDuration = 600) => {
  const [display, setDisplay] = useState(text);
  const timerRef = useRef(null);

  useEffect(() => {
    let elapsed = 0;
    const glitch = () => {
      if (elapsed >= glitchDuration) {
        setDisplay(text);
        return;
      }
      setDisplay(
        text
          .split("")
          .map((char, _i) =>
            char !== " " && Math.random() < 0.25
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : char
          )
          .join("")
      );
      elapsed += interval;
      timerRef.current = setTimeout(glitch, interval);
    };
    timerRef.current = setTimeout(glitch, 600);
    return () => clearTimeout(timerRef.current);
  }, [text, interval, glitchDuration]);

  return display;
};

// ─── SCANLINE OVERLAY ────────────────────────────────────────
const ScanlineOverlay = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-50"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 4px)",
      mixBlendMode: "overlay",
    }}
  />
);

// ─── FLICKER EFFECT ──────────────────────────────────────────
const CRTFlicker = () => (
  <motion.div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-40"
    style={{ background: `rgba(191,255,0,0.012)` }}
    animate={{ opacity: [0.8, 1, 0.85, 1, 0.9, 1] }}
    transition={{
      duration: 0.15,
      repeat: Infinity,
      repeatDelay: 0,
      ease: "steps(1)",
    }}
  />
);

// ─── GRID BACKGROUND ─────────────────────────────────────────
const GridBg = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 z-0"
    style={{
      background: BG,
      backgroundImage: `
        linear-gradient(rgba(191,255,0,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(191,255,0,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "32px 32px",
    }}
  />
);

// ─── AMBIENT GLOW ────────────────────────────────────────────
const AmbientGlow = () => (
  <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: "60vw",
        height: "60vw",
        background: `radial-gradient(circle, ${ACID}08 0%, transparent 70%)`,
        filter: "blur(40px)",
      }}
      animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
    <div
      className="absolute -bottom-32 -right-32 rounded-full"
      style={{
        width: 400,
        height: 400,
        background: `radial-gradient(circle, ${PURPLE}06 0%, transparent 70%)`,
        filter: "blur(60px)",
      }}
    />
  </div>
);

// ─── LOGO ASCII ART ──────────────────────────────────────────
const VaultLogo = () => {
  const lines = [
    "  ██████╗ ██╗   ██╗███╗   ██╗██╗  ██╗███████╗██████╗  ",
    "  ██╔══██╗██║   ██║████╗  ██║██║ ██╔╝██╔════╝██╔══██╗ ",
    "  ██████╔╝██║   ██║██╔██╗ ██║█████╔╝ █████╗  ██████╔╝ ",
    "  ██╔══██╗██║   ██║██║╚██╗██║██╔═██╗ ██╔══╝  ██╔══██╗ ",
    "  ██████╔╝╚██████╔╝██║ ╚████║██║  ██╗███████╗██║  ██║ ",
    "  ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ",
  ];

  return (
    <div className="overflow-hidden select-none" style={{ fontSize: "clamp(3px, 1.1vw, 7px)" }}>
      {lines.map((line, i) => (
        <motion.pre
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
          className="leading-tight"
          style={{
            color: ACID,
            textShadow: `0 0 8px ${ACID}66`,
            fontFamily: FONT,
          }}
        >
          {line}
        </motion.pre>
      ))}
    </div>
  );
};

// ─── BOOT TERMINAL ───────────────────────────────────────────
const BootTerminal = ({ onComplete }) => {
  const [visibleLines, setVisibleLines] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = [];
    BOOT_LINES.forEach(({ text, delay, color }, i) => {
      timers.push(setTimeout(() => {
        setVisibleLines((prev) => {
          if (prev.some((line) => line.id === i)) return prev;
          return [...prev, { text, color, id: i }];
        });
        if (i === BOOT_LINES.length - 1) {
          timers.push(setTimeout(() => {
            setDone(true);
            onComplete?.();
          }, 500));
        }
      }, delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="w-full max-w-md mx-auto px-4 py-3 rounded-sm"
      style={{
        background: "rgba(191,255,0,0.03)",
        border: `1px solid rgba(191,255,0,0.1)`,
        fontFamily: FONT,
        minHeight: 180,
      }}
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `1px solid rgba(191,255,0,0.08)` }}>
        <div className="w-2 h-2 rounded-full" style={{ background: RED,   boxShadow: `0 0 6px ${RED}`   }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#ffcc00", boxShadow: "0 0 6px #ffcc00" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: ACID,  boxShadow: `0 0 6px ${ACID}`  }} />
        <span className="text-xs ml-2 tracking-widest opacity-30 uppercase" style={{ color: ACID }}>
          bunker_boot.sh
        </span>
      </div>

      {/* Log lines */}
      <div className="flex flex-col gap-1">
        <AnimatePresence>
          {visibleLines.map(({ text, color, id }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs flex items-center gap-2"
              style={{ fontFamily: FONT }}
            >
              <span style={{ color: ACID, opacity: 0.3 }}>›</span>
              <span style={{ color, textShadow: color === RED ? `0 0 8px ${RED}` : `0 0 4px ${color}44` }}>
                {text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Blinking cursor */}
        {!done && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "steps(1)" }}
            className="text-xs mt-1"
            style={{ color: ACID, fontFamily: FONT }}
          >
            ▌
          </motion.span>
        )}
      </div>
    </div>
  );
};

// ─── ACCESS BUTTON ───────────────────────────────────────────
const AccessButton = ({ onClick, loading, disabled }) => {
  const glitchText = useGlitch("ACCEDER AL BÚNKER", 60, loading ? 9999 : 700);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full max-w-md mx-auto overflow-hidden rounded-sm select-none"
      style={{
        padding: "18px 24px",
        fontFamily: FONT,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {/* Button background */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: hovered && !disabled
            ? `linear-gradient(135deg, ${ACID}22 0%, ${ACID}12 100%)`
            : `linear-gradient(135deg, ${ACID}0a 0%, ${ACID}06 100%)`,
          border: `1px solid ${hovered && !disabled ? ACID + "88" : ACID + "33"}`,
          boxShadow: hovered && !disabled
            ? `0 0 30px ${ACID}22, inset 0 0 20px ${ACID}08`
            : `0 0 0px transparent`,
        }}
      />

      {/* Button content */}
      <div className="relative flex items-center justify-center gap-3">
        {loading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-lg"
              style={{ color: ACID }}
            >
              <Icon name="archive" size={18} decorative />
            </motion.span>
            <span
              className="text-sm tracking-[0.35em] uppercase font-bold"
              style={{ color: ACID, textShadow: `0 0 12px ${ACID}` }}
            >
              AUTENTICANDO...
            </span>
          </>
        ) : (
          <>
            <span
              className="text-sm tracking-[0.3em] uppercase font-bold"
              style={{
                color: disabled ? ACID + "44" : ACID,
                textShadow: hovered && !disabled ? `0 0 16px ${ACID}` : "none",
              }}
            >
              {glitchText}
            </span>
            <motion.span
                          animate={{ x: hovered ? 4 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ color: ACID, opacity: disabled ? 0.3 : 0.7, display: "inline-flex" }}
                        >
                          <Icon name="arrowRight" size={16} decorative />
                        </motion.span>
          </>
        )}
      </div>

      {/* Hover shimmer */}
      {hovered && !disabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            background: `linear-gradient(90deg, transparent, ${ACID}14, transparent)`,
            transform: "skewX(-20deg)",
          }}
        />
      )}
    </motion.button>
  );
};

// ─── ACCESS PANEL (ADR-028) ──────────────────────────────────
/**
 * Entrada alternativa sin Google: canjea una clave de acceso por un JWT.
 * Discreta a propósito — no es la puerta principal de la app.
 */
const AccessPanel = ({ onSubmit }) => {
  const [open, setOpen]         = useState(false);
  const [accessKey, setKey]     = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy]         = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !accessKey.trim()) return;
    setBusy(true);
    await onSubmit?.(accessKey.trim(), { remember });
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs tracking-[0.25em] uppercase opacity-30 hover:opacity-70 transition-opacity min-h-[44px] px-4"
        style={{ color: ACID, fontFamily: FONT }}
      >
        › ACCESO TEST / ADMIN
      </button>
    );
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto flex flex-col gap-3 px-4 py-4 rounded-sm"
      style={{
        background: "rgba(191,255,0,0.03)",
        border: `1px solid ${ACID}22`,
        fontFamily: FONT,
      }}
    >
      <label
        htmlFor="bunker-access-key"
        className="text-xs tracking-[0.3em] uppercase opacity-40"
        style={{ color: ACID }}
      >
        CLAVE DE ACCESO
      </label>

      <input
        id="bunker-access-key"
        type="password"
        autoComplete="off"
        spellCheck="false"
        value={accessKey}
        onChange={(e) => setKey(e.target.value)}
        disabled={busy}
        className="w-full px-3 py-3 text-sm rounded-sm outline-none"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${ACID}33`,
          color: ACID,
          fontFamily: FONT,
          letterSpacing: "0.15em",
        }}
      />

      <label className="flex items-center gap-2 text-xs opacity-40 cursor-pointer" style={{ color: ACID }}>
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          disabled={busy}
        />
        <span className="tracking-widest uppercase">RECORDAR EN ESTE DISPOSITIVO</span>
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !accessKey.trim()}
          className="flex-1 text-xs tracking-[0.3em] uppercase py-3 min-h-[44px] rounded-sm"
          style={{
            color: ACID,
            border: `1px solid ${ACID}${busy || !accessKey.trim() ? "22" : "66"}`,
            background: `${ACID}0a`,
            fontFamily: FONT,
            cursor: busy || !accessKey.trim() ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "VERIFICANDO..." : <>ENTRAR <Icon name="arrowRight" size={14} decorative /></>}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setKey(""); }}
          disabled={busy}
          className="text-xs tracking-[0.3em] uppercase py-3 px-4 min-h-[44px] opacity-40"
          style={{ color: ACID, fontFamily: FONT }}
        >
          <Icon name="close" size={14} decorative />
        </button>
      </div>
    </motion.form>
  );
};

// ─── ERROR BANNER ────────────────────────────────────────────
const ErrorBanner = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-md mx-auto px-4 py-3 rounded-sm text-xs tracking-widest uppercase"
    style={{
      background: "rgba(255,59,59,0.08)",
      border: `1px solid rgba(255,59,59,0.3)`,
      color: RED,
      fontFamily: FONT,
      textShadow: `0 0 8px ${RED}66`,
    }}
  >
    <div className="inline-flex items-center justify-center gap-2">
      <Icon name="alert" size={14} decorative />
      <span>{message}</span>
    </div>
  </motion.div>
);

// ─── MAIN LOGIN SCREEN ───────────────────────────────────────
/**
 * LoginScreen
 *
 * Props:
 *   onLogin           — () => Promise<void>  triggers Google OAuth2 flow
 *   onAccessKeyLogin  — (key, {remember}) => Promise<{ok, error}>  ADR-028 (opcional)
 *   isLoading         — boolean
 *   error             — string | null
 */
export default function LoginScreen({ onLogin, onAccessKeyLogin, isLoading = false, error = null }) {
  const [bootDone, setBootDone] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const handleBootComplete = useCallback(() => setBootDone(true), []);

  useEffect(() => {
    if (bootDone) {
      const t = setTimeout(() => setShowContent(true), 200);
      return () => clearTimeout(t);
    }
  }, [bootDone]);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: BG, fontFamily: FONT }}
    >
      {/* ── Atmosphere ── */}
      <GridBg />
      <AmbientGlow />
      <ScanlineOverlay />
      <CRTFlicker />

      {/* ── Main Container ── */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full px-6 max-w-lg">

        {/* ══ Logo Block ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full text-center"
        >
          <VaultLogo />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xs tracking-[0.5em] uppercase mt-3"
            style={{ color: ACID, opacity: 0.35 }}
          >
            SISTEMA DE MEMORIA ENCRIPTADA · v1.0
          </motion.p>
        </motion.div>

        {/* ══ Divider ══════════════════════════════════════════ */}
        <motion.div
          className="w-full flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${ACID}30)` }} />
          <Icon name="archive" size={14} decorative />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${ACID}30, transparent)` }} />
        </motion.div>

        {/* ══ Boot Terminal ══════════════════════════════════════ */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <BootTerminal onComplete={handleBootComplete} />
        </motion.div>

        {/* ══ CTA + Error ════════════════════════════════════════ */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="w-full flex flex-col gap-4 items-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Google Icon hint */}
              <p
                className="text-xs tracking-[0.3em] uppercase opacity-25 text-center"
                style={{ color: ACID }}
              >
                IDENTIFICACIÓN VÍA GOOGLE REQUERIDA
              </p>

              <AccessButton
                onClick={onLogin}
                loading={isLoading}
                disabled={false}
              />

              {onAccessKeyLogin && <AccessPanel onSubmit={onAccessKeyLogin} />}

              {error && <ErrorBanner message={error} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Footer Signature ═══════════════════════════════════ */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ opacity: 0.15, color: ACID }}>
            <span className="tracking-widest uppercase">ENCRYPTED</span>
            <span>·</span>
            <span className="tracking-widest uppercase">PRIVATE</span>
            <span>·</span>
            <span className="tracking-widest uppercase">YOURS ALONE</span>
          </div>

          {/* Heartbeat line */}
          <motion.div
            className="flex gap-0.5 mt-2"
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ background: ACID, height: [2,4,6,3,8,5,3,6,4,2,3,7,5,3,4,6,2,5,4,3][i] }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
