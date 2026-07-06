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

// ─── VISUALIZER MODES (cycle in fullscreen) ──────────────────
const ALL_MODES = ["bars", "oscilloscope", "wave", "radial", "vinyl", "tunnel"];

// S108 — Presets de visualizador por vibe (ampliado con modos 2000s)
const VIBE_PRESETS = {
  default:     { mode: "bars",         barCount: 32, fftSize: 128, smoothing: 0.82, particleCount: 20, speed: 1.0 },
  gaming:      { mode: "tunnel",       barCount: 48, fftSize: 256, smoothing: 0.70, particleCount: 35, speed: 1.4 },
  dnb:         { mode: "oscilloscope", barCount: 28, fftSize: 256, smoothing: 0.60, particleCount: 40, speed: 1.5 },
  romantiqueo: { mode: "vinyl",        barCount: 24, fftSize: 128, smoothing: 0.88, particleCount: 15, speed: 0.7 },
  "420_chill": { mode: "wave",         barCount: 20, fftSize: 128, smoothing: 0.90, particleCount: 12, speed: 0.6 },
};

const MODE_LABELS = {
  bars: "BARRAS", oscilloscope: "OSCILOSCOPIO", wave: "ONDA",
  radial: "RADIAL", vinyl: "VINILO", tunnel: "TUNEL",
};

function getPreset(vibeId) {
  return VIBE_PRESETS[vibeId] ?? VIBE_PRESETS.default;
}

function detectBeat(freqData, history, threshold) {
  if (!freqData?.length) return false;
  let sum = 0;
  for (let i = 0; i < freqData.length; i++) sum += freqData[i];
  const avg = sum / freqData.length;
  history.push(avg);
  if (history.length > 20) history.shift();
  if (history.length < 10) return false;
  const histAvg = history.reduce((a, b) => a + b, 0) / history.length;
  return histAvg > 0 && avg > histAvg * (threshold || 1.4);
}

export const AudioVisualizer = ({ audioRef, isPlaying, accentColor = ACID, vibeId = null, onRequestFullscreen: _onRequestFullscreen }) => {
  const ac = accentColor || ACID;
  const canvasRef    = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef  = useRef(null);
  const freqArrayRef = useRef(null);
  const timeArrayRef = useRef(null);
  const beatHistoryRef = useRef([]);
  const beatFlashRef  = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);
  const vinylStateRef = useRef({ angle: 0, speed: 0 });
  const tunnelTimeRef = useRef(0);

  const preset = useMemo(() => getPreset(vibeId), [vibeId]);
  const effectiveMode = isFullscreen && fullscreenMode ? fullscreenMode : preset.mode;

  const particles = useMemo(() =>
    Array.from({ length: preset.particleCount }, (_, i) => ({
      id: i, x: 10 + (i * 37 + 13) % 80, y: 10 + (i * 53 + 7) % 80,
      size: 0.5 + (i % 3) * 0.3, driftY: -30 - (i * 17) % 50,
      duration: (1.5 + (i * 0.7) % 2) / preset.speed,
      delay: (i * 0.7) % 3,
    })), [preset.particleCount, preset.speed]
  );

  // ── Auto-hide controls after 3s inactivity ────────────────
  const resetHideTimer = useCallback(() => {
    if (!isFullscreen) return;
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, [isFullscreen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isFullscreen) { resetHideTimer(); }
    else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setShowControls(true);
      setFullscreenMode(null);
    }
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isFullscreen, resetHideTimer]);

  // ── Cycle through visualizer modes ─────────────────────────
  const cycleMode = useCallback(() => {
    setFullscreenMode((prev) => {
      const current = prev || preset.mode;
      const idx = ALL_MODES.indexOf(current);
      return ALL_MODES[(idx + 1) % ALL_MODES.length];
    });
    resetHideTimer();
  }, [preset.mode, resetHideTimer]);

  // ── Tap: fullscreen API + mode cycling ────────────────────
  const handleTap = useCallback(() => {
    if (isFullscreen) {
      if (!showControls) resetHideTimer(); else cycleMode();
    } else {
      setIsFullscreen(true);
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } catch { /* noop */ }
    }
  }, [isFullscreen, showControls, resetHideTimer, cycleMode]);

  // Listen for browser fullscreen exit (back button, ESC)
  useEffect(() => {
    const onFSChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("webkitfullscreenchange", onFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("webkitfullscreenchange", onFSChange);
    };
  }, []);

  const setupAudio = useCallback(() => {
    if (!audioRef?.current || audioCtxRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx      = new AudioContext();
      const analyser = ctx.createAnalyser();
      // S108 — preset-aware fftSize y smoothing
      analyser.fftSize = preset.fftSize;
      analyser.smoothingTimeConstant = preset.smoothing;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;
      sourceRef.current    = source;
    } catch { /* noop */ }
  }, [audioRef, preset.fftSize, preset.smoothing]);

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
    const BAR_COUNT = preset.barCount;

    // Fix 2 — flag cancelled: evita doble loop en React 18 / skips rápidos
    let cancelled = false;

    const drawBars = (data, W, H) => {
      const barW = (W / BAR_COUNT) - 1.5, midH = H / 2;
      for (let i = 0; i < BAR_COUNT; i++) {
        const idx  = data ? Math.floor((i / BAR_COUNT) * data.length) : -1;
        const barH = data ? (data[idx] / 255) * H * 0.45 : H * 0.05;
        const x = i * (barW + 1.5);
        const grad = ctx.createLinearGradient(x, midH, x, midH - barH);
        grad.addColorStop(0,   withAlpha(ac, 0.1));
        grad.addColorStop(0.6, withAlpha(ac, 0.8));
        grad.addColorStop(1,   withAlpha(ac, 1));
        ctx.fillStyle = grad;
        ctx.shadowBlur = barH > H * 0.2 ? 14 : 4;
        ctx.shadowColor = withAlpha(ac, 0.6);
        const radius = Math.min(3, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, midH - barH);
        ctx.lineTo(x + barW - radius, midH - barH);
        ctx.quadraticCurveTo(x + barW, midH - barH, x + barW, midH - barH + radius);
        ctx.lineTo(x + barW, midH);
        ctx.lineTo(x, midH);
        ctx.lineTo(x, midH - barH + radius);
        ctx.quadraticCurveTo(x, midH - barH, x + radius, midH - barH);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(x + radius, midH + barH);
        ctx.lineTo(x + barW - radius, midH + barH);
        ctx.quadraticCurveTo(x + barW, midH + barH, x + barW, midH + barH - radius);
        ctx.lineTo(x + barW, midH);
        ctx.lineTo(x, midH);
        ctx.lineTo(x, midH + barH - radius);
        ctx.quadraticCurveTo(x, midH + barH, x + radius, midH + barH);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (barH > H * 0.15) {
          ctx.fillStyle = "#ffffff88";
          ctx.shadowBlur = 12;
          ctx.shadowColor = ac;
          ctx.fillRect(x, midH - barH - 2, barW, 2);
        }
        ctx.shadowBlur = 0;
      }
    };

    // ═══ OSCILOSCOPIO (CRT time-domain) ═════════════════════
    const drawOscilloscope = (timeData, W, H) => {
      if (!timeData?.length) return;
      const midY = H / 2;
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = `${ac}11`; ctx.lineWidth = 1; ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = ac; ctx.lineWidth = 2.5;
      ctx.shadowBlur = 14; ctx.shadowColor = ac;
      ctx.beginPath();
      const step = timeData.length / W;
      for (let x = 0; x < W; x++) {
        const val = timeData[Math.floor(x * step) % timeData.length] / 128 - 1;
        if (x === 0) ctx.moveTo(x, midY + val * H * 0.45);
        else ctx.lineTo(x, midY + val * H * 0.45);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.2; ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const val = timeData[Math.floor((x + 8) * step) % timeData.length] / 128 - 1;
        if (x === 0) ctx.moveTo(x, midY + val * H * 0.45);
        else ctx.lineTo(x, midY + val * H * 0.45);
      }
      ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(0, y, W, 1);
      }
    };

    const drawWave = (data, W, H) => {
      const step = data ? data.length / W : 0, midY = H / 2;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const val = data ? data[Math.floor(x * step) % data.length] / 255 : 0;
        if (x === 0) ctx.moveTo(x, midY + (val - 0.5) * H * 0.9);
        else ctx.lineTo(x, midY + (val - 0.5) * H * 0.9);
      }
      ctx.strokeStyle = ac; ctx.lineWidth = 2;
      ctx.shadowBlur = 12; ctx.shadowColor = ac; ctx.stroke();
      ctx.globalAlpha = 0.25; ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const val = data ? data[Math.floor(x * step) % data.length] / 255 : 0;
        if (x === 0) ctx.moveTo(x, midY + (val - 0.5) * H * 0.9 + 2);
        else ctx.lineTo(x, midY + (val - 0.5) * H * 0.9 + 2);
      }
      ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    };

    const drawRadial = (data, W, H) => {
      const cx = W / 2, cy = H / 2, maxR = Math.min(W, H) * 0.42;
      const step = (2 * Math.PI) / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const val = data ? data[Math.floor((i / BAR_COUNT) * data.length)] / 255 : 0;
        const angle = i * step - Math.PI / 2, r = maxR * val;
        const grad = ctx.createLinearGradient(
          cx + Math.cos(angle) * r * 0.3, cy + Math.sin(angle) * r * 0.3,
          cx + Math.cos(angle) * r, cy + Math.sin(angle) * r
        );
        grad.addColorStop(0, withAlpha(ac, 0.4)); grad.addColorStop(1, withAlpha(ac, 1));
        ctx.fillStyle = grad; ctx.shadowBlur = val > 0.5 ? 14 : 4; ctx.shadowColor = ac;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * r * 0.5, cy + Math.sin(angle) * r * 0.5, 3 + val * 4, 0, Math.PI * 2);
        ctx.fill(); ctx.shadowBlur = 0;
      }
    };

    const drawVinyl = (data, W, H) => {
      if (!data?.length) return;
      const cx = W / 2, cy = H / 2, radius = Math.min(W, H) * 0.35;
      let energy = 0;
      const ss = Math.floor(data.length / 8);
      for (let i = 0; i < 8; i++) energy += data[i * ss] / 255;
      energy /= 8;
      const vs = vinylStateRef.current;
      vs.speed += ((1.5 + energy * 4) - vs.speed) * 0.1;
      vs.angle += vs.speed * 0.02;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(vs.angle);
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2);
      const dg = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
      dg.addColorStop(0, "#111"); dg.addColorStop(0.7, "#0a0a0a"); dg.addColorStop(1, "#000");
      ctx.fillStyle = dg; ctx.fill();
      for (let r = radius * 0.15; r < radius * 0.95; r += radius * 0.04) {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.03 + energy * 0.04})`; ctx.lineWidth = 0.5; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2); ctx.fillStyle = ac; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, radius * 0.03, 0, Math.PI * 2); ctx.fillStyle = "#0a0a0a"; ctx.fill();
      ctx.beginPath(); ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.5, -Math.PI * 0.3, Math.PI * 0.1);
      ctx.strokeStyle = `rgba(255,255,255,${0.04 + energy * 0.03})`; ctx.lineWidth = radius * 0.15; ctx.stroke();
      ctx.restore();
      const aa = -Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(aa) * radius * 1.1, cy + Math.sin(aa) * radius * 1.1);
      ctx.lineTo(cx + Math.cos(aa) * radius * 0.75, cy + Math.sin(aa) * radius * 0.75);
      ctx.strokeStyle = "#444"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + Math.cos(aa) * radius * 0.75, cy + Math.sin(aa) * radius * 0.75, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#888"; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = `${ac}${Math.round(energy * 40).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 2; ctx.shadowBlur = 20; ctx.shadowColor = ac; ctx.stroke(); ctx.shadowBlur = 0;
    };

    // ═══ TUNNEL (hypnotic expanding rings) ═══════════════════
    const drawTunnel = (data, W, H) => {
      if (!data?.length) return;
      tunnelTimeRef.current += 0.03;
      const cx = W / 2, cy = H / 2, maxR = Math.min(W, H) * 0.7;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) {
        const t = (i / 12 + tunnelTimeRef.current * 0.3) % 1, baseR = t * maxR;
        const fi = Math.floor((i / 12) * (data.length / 3)), energy = data[fi] / 255;
        const r = baseR + energy * 15, alpha = 0.15 + energy * 0.3 * (1 - t);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(ac, alpha * 0.7); ctx.lineWidth = 1 + energy * 3;
        ctx.shadowBlur = energy * 12; ctx.shadowColor = ac; ctx.stroke(); ctx.shadowBlur = 0;
      }
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.1);
      cg.addColorStop(0, withAlpha(ac, 0.4)); cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, maxR * 0.1, 0, Math.PI * 2); ctx.fill();
    };

    const draw = () => {
      if (cancelled) return;
      animFrameRef.current = requestAnimationFrame(draw);
      const W = canvas.width / window.devicePixelRatio;
      const H = canvas.height / window.devicePixelRatio;
      if (!W || !H) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.clearRect(0, 0, W, H);

      const bufferLen = analyserRef.current?.frequencyBinCount ?? 0;
      if (bufferLen && !freqArrayRef.current) freqArrayRef.current = new Uint8Array(bufferLen);
      if (bufferLen && !timeArrayRef.current) timeArrayRef.current = new Uint8Array(bufferLen);
      const fArr = freqArrayRef.current, tArr = timeArrayRef.current;
      if (fArr && analyserRef.current) analyserRef.current.getByteFrequencyData(fArr);
      if (tArr && analyserRef.current) analyserRef.current.getByteTimeDomainData(tArr);

      const onBeat = fArr && detectBeat(fArr, beatHistoryRef.current);
      if (onBeat) beatFlashRef.current = performance.now();
      const beatGlow = onBeat || (performance.now() - beatFlashRef.current < 150);
      if (beatGlow) { ctx.shadowBlur = 30; ctx.shadowColor = ac; }

      // ── Background fill for wave/radial ─────────────────────
      if (effectiveMode === "wave" || effectiveMode === "radial") {
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(0, 0, W, H);
      }
      // ── Inline small canvas fallback: vinyl/tunnel → bars ─
      const isSmall = !isFullscreen && H < 100;
      const renderMode = (effectiveMode === "vinyl" || effectiveMode === "tunnel") && isSmall ? "bars" : effectiveMode;

      if (renderMode === "bars") drawBars(fArr, W, H);
      else if (renderMode === "oscilloscope") drawOscilloscope(tArr, W, H);
      else if (renderMode === "wave") drawWave(fArr, W, H);
      else if (renderMode === "radial") drawRadial(fArr, W, H);
      else if (renderMode === "vinyl") drawVinyl(fArr, W, H);
      else if (renderMode === "tunnel") drawTunnel(fArr, W, H);
      else drawBars(fArr, W, H);

      if (beatGlow && renderMode !== "vinyl" && renderMode !== "tunnel") {
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, Math.min(W, H) * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = `${ac}44`;
        ctx.lineWidth = 2;
        ctx.stroke();
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
      drawStarted = false;
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isPlaying, ac, effectiveMode, isFullscreen, preset]);

  useEffect(() => { beatHistoryRef.current = []; }, [vibeId]);

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
    if (isPlaying) { setupAudio(); audioCtxRef.current?.resume(); }
  }, [isPlaying, setupAudio]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`w-full cursor-pointer ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
        style={{
          height: isFullscreen ? "100vh" : 72,
          display: "block",
          background: isFullscreen ? "#000000" : "transparent",
          touchAction: "none",
        }}
        onClick={handleTap}
        title={isFullscreen ? "Tap: ver controles / ciclar modo · ESC para salir" : "Tap para visualizador a pantalla completa"}
      />

      {/* Fullscreen immersive overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[45] pointer-events-none"
          >
            <div className="absolute inset-0 opacity-[0.03]" style={{
              background: `radial-gradient(ellipse at center, ${ac}44 0%, transparent 70%)`
            }} />
            {isPlaying && particles.map((p) => (
              <motion.div key={p.id} className="absolute rounded-full"
                style={{
                  background: ac, width: `${p.size * 4}px`, height: `${p.size * 4}px`,
                  left: `${p.x}%`, top: `${p.y}%`, boxShadow: `0 0 6px ${ac}`,
                }}
                animate={{ opacity: [0, 0.8, 0], scale: [0, 1.5, 0], y: [0, p.driftY] }}
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
              />
            ))}
            <div className="absolute left-4 top-[15%] bottom-[15%] w-1 rounded-full overflow-hidden"
              style={{ background: `${ac}22` }}>
              <motion.div className="w-full rounded-full"
                style={{ background: ac, boxShadow: `0 0 8px ${ac}` }}
                animate={{ height: isPlaying ? ["10%","70%","30%","80%","10%"] : "10%" }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="absolute right-4 top-[15%] bottom-[15%] w-1 rounded-full overflow-hidden"
              style={{ background: `${ac}22` }}>
              <motion.div className="w-full rounded-full"
                style={{ background: ac, boxShadow: `0 0 8px ${ac}` }}
                animate={{ height: isPlaying ? ["20%","90%","40%","85%","20%"] : "20%" }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen controls + mode cycling */}
      <AnimatePresence>
        {isFullscreen && (
          <>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: showControls ? 1 : 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }} whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsFullscreen(false);
                try { document.exitFullscreen?.(); } catch { /* noop */ }
              }}
              className="fixed top-6 right-6 z-[60] w-11 h-11 flex items-center justify-center rounded-sm text-sm"
              style={{ color: ac, border: `1px solid ${ac}44`, background: `${ac}0d` }}
            >
              ✕
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: showControls ? 1 : 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-12 left-0 right-0 flex flex-col items-center gap-2 z-[60]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <p className="text-xs tracking-[0.3em] uppercase" style={{ color: ac, opacity: 0.5 }}>
                {MODE_LABELS[effectiveMode] || effectiveMode.toUpperCase()}
              </p>
              <div className="flex gap-2">
                {ALL_MODES.map((m) => (
                  <span key={m} className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{
                      background: m === effectiveMode ? ac : `${ac}33`,
                      boxShadow: m === effectiveMode ? `0 0 6px ${ac}` : "none",
                    }}
                  />
                ))}
              </div>
              <p className="text-[9px] tracking-[0.2em] uppercase opacity-25" style={{ color: ac }}>
                TAP PARA CAMBIAR MODO
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};