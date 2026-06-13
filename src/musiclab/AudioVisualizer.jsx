import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACID } from "../tokens";

function withAlpha(color, alpha) {
  const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
  if (color.startsWith("hsl(")) {
    const inner = color.slice(4, -1);
    return `hsla(${inner}, ${alpha})`;
  }
  if (color.startsWith("hsla(")) return color;
  return color + hex;
}

export const AudioVisualizer = ({ audioRef, isPlaying, accentColor = ACID, onRequestFullscreen }) => {
  const canvasRef    = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef  = useRef(null);
  const dataArrayRef = useRef(null);
  // Fase 4.7 — VIZ1: Fullscreen expandido
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pre-generar partículas estables (evita Math.random en render)
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 10 + (i * 37 + 13) % 80,
      y: 10 + (i * 53 + 7) % 80,
      size: 0.5 + (i % 3) * 0.3,
      driftY: -30 - (i * 17) % 50,
      duration: 1.5 + (i * 0.7) % 2,
      delay: (i * 0.7) % 3,
    })), []
  );

  const handleTap = () => {
    if (onRequestFullscreen) {
      onRequestFullscreen();
    } else {
      setIsFullscreen((p) => !p);
    }
  };

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
    } catch { /* noop */ }
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fix 1 — sin loop idle: canvas estático cuando no hay reproducción
    if (!isPlaying) {
      cancelAnimationFrame(animFrameRef.current);
      const ctx = canvas.getContext("2d");
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w && h) {
        canvas.width  = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx    = canvas.getContext("2d");
    const BAR_COUNT = 32;

    // Fix 2 — flag cancelled: evita doble loop en React 18 / skips rápidos
    let cancelled = false;

    const draw = () => {
      if (cancelled) return;
      animFrameRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      const bufferLen = analyserRef.current?.frequencyBinCount ?? 0;
      if (bufferLen && !dataArrayRef.current) dataArrayRef.current = new Uint8Array(bufferLen);
      const dataArray = dataArrayRef.current;
      if (dataArray && analyserRef.current) analyserRef.current.getByteFrequencyData(dataArray);

      const barW = (W / BAR_COUNT) - 1.5;

      for (let i = 0; i < BAR_COUNT; i++) {
        const idx  = dataArray ? Math.floor((i / BAR_COUNT) * dataArray.length) : -1;
        const barH = dataArray ? (dataArray[idx] / 255) * H * 0.9 : H * 0.05;

        const x    = i * (barW + 1.5);
        const y    = H - barH;
        const grad = ctx.createLinearGradient(x, y, x, H);
        grad.addColorStop(0,   withAlpha(accentColor, 1));
        grad.addColorStop(0.5, withAlpha(accentColor, 0.67));
        grad.addColorStop(1,   withAlpha(accentColor, 0.13));

        ctx.fillStyle   = grad;
        ctx.shadowBlur  = barH > H * 0.5 ? 18 : 6;
        ctx.shadowColor = withAlpha(accentColor, 0.53);

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

        if (barH > H * 0.3) {
          ctx.fillStyle   = "#ffffff88";
          ctx.shadowBlur  = 12;
          ctx.shadowColor = accentColor;
          ctx.fillRect(x, y - 3, barW, 2);
        }
        ctx.shadowBlur = 0;
      }
    };

    let drawStarted = false;
    const tryStart = () => {
      if (cancelled) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) {
        requestAnimationFrame(tryStart);
        return;
      }
      canvas.width  = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      if (!drawStarted) { drawStarted = true; draw(); }
    };
    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width  = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    // Fix 3 — visibilitychange: parar rAF cuando la app va a background
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animFrameRef.current);
      } else if (!cancelled) {
        draw();
      }
    };

    tryStart();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isPlaying, accentColor]);

  // Resize canvas when entering fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const raf = requestAnimationFrame(() => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w && h) {
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [isFullscreen]);

  useEffect(() => {
    if (isPlaying) {
      setupAudio();
      audioCtxRef.current?.resume();
    }
  }, [isPlaying, setupAudio]);

  const fullscreenCanvasHeight = isFullscreen ? "70vh" : 72;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`w-full cursor-pointer ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
        style={{
          height: fullscreenCanvasHeight,
          display: "block",
          background: isFullscreen ? "rgba(0,0,0,0.95)" : "transparent",
        }}
        onClick={handleTap}
        title={isFullscreen ? "Tap para cerrar visualizador" : "Tap para visualizador a pantalla completa"}
      />

      {/* Fase 4.7 — VIZ1-VIZ5: Fullscreen inmersivo (overlay sobre el canvas expandido) */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none"
          >
            {/* VIZ5: Fondo plasma/humo */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                background: `radial-gradient(ellipse at center, ${accentColor}44 0%, transparent 70%)`,
              }}
            />

            {/* VIZ3: Partículas reactivas (estables, pre-generadas) */}
            {isPlaying && particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  background: accentColor,
                  width: `${p.size * 4}px`,
                  height: `${p.size * 4}px`,
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  boxShadow: `0 0 6px ${accentColor}`,
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                  y: [0, p.driftY],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* VIZ4: VU Meters laterales */}
            <div className="absolute left-4 top-[15%] bottom-[15%] w-1 rounded-full overflow-hidden"
              style={{ background: `${accentColor}22` }}>
              <motion.div
                className="w-full rounded-full"
                style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
                animate={{ height: isPlaying ? ["10%", "70%", "30%", "80%", "10%"] : "10%" }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="absolute right-4 top-[15%] bottom-[15%] w-1 rounded-full overflow-hidden"
              style={{ background: `${accentColor}22` }}>
              <motion.div
                className="w-full rounded-full"
                style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
                animate={{ height: isPlaying ? ["20%", "90%", "40%", "85%", "20%"] : "20%" }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cerrar fullscreen */}
      <AnimatePresence>
        {isFullscreen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(false)}
              className="fixed top-6 right-6 z-[60] w-10 h-10 flex items-center justify-center rounded-sm text-sm"
              style={{
                color: accentColor,
                border: `1px solid ${accentColor}44`,
                background: `${accentColor}0d`,
              }}
            >
              ✕
            </motion.button>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-8 left-0 right-0 text-center text-xs tracking-[0.3em] uppercase z-[60]"
              style={{ color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}
            >
              VISUALIZADOR
            </motion.p>
          </>
        )}
      </AnimatePresence>
    </>
  );
};