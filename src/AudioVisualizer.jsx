import { useRef, useEffect, useCallback } from "react";
import { ACID } from "./Layout";

export const AudioVisualizer = ({ audioRef, isPlaying, accentColor = ACID }) => {
  const canvasRef    = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef  = useRef(null);

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
    } catch (e) {}
  }, [audioRef]);

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

      const barW = (W / BAR_COUNT) - 1.5;
      const now  = performance.now() / 1000;

      for (let i = 0; i < BAR_COUNT; i++) {
        let barH;
        if (dataArray && isPlaying) {
          const idx = Math.floor((i / BAR_COUNT) * dataArray.length);
          barH = (dataArray[idx] / 255) * H * 0.9;
        } else {
          const base   = Math.sin(now * 1.2 + i * 0.35) * 0.35 + 0.38;
          const ripple = Math.sin(now * 3.1 + i * 0.7)  * 0.08;
          barH = (base + ripple) * H * 0.35;
        }

        const x    = i * (barW + 1.5);
        const y    = H - barH;
        const grad = ctx.createLinearGradient(x, y, x, H);
        const hex  = accentColor;
        grad.addColorStop(0,   hex + "ff");
        grad.addColorStop(0.5, hex + "aa");
        grad.addColorStop(1,   hex + "22");

        ctx.fillStyle   = grad;
        ctx.shadowBlur  = barH > H * 0.5 ? 18 : 6;
        ctx.shadowColor = hex + "88";

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

        if (isPlaying && barH > H * 0.3) {
          ctx.fillStyle   = "#ffffff88";
          ctx.shadowBlur  = 12;
          ctx.shadowColor = hex;
          ctx.fillRect(x, y - 3, barW, 2);
        }
        ctx.shadowBlur = 0;
      }
    };

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
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