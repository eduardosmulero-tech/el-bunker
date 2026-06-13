import { useRef, useEffect, useCallback } from "react";
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

export const AudioVisualizer = ({ audioRef, isPlaying, accentColor = ACID }) => {
  const canvasRef    = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef  = useRef(null);
  const dataArrayRef = useRef(null);

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