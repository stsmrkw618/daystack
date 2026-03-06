"use client";

import { useEffect, useRef } from "react";

interface TimerRingProps {
  elapsed: number;
  isRunning: boolean;
  color: string;
  size?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export default function TimerRing({ elapsed, isRunning, color, size: sizeProp = 200 }: TimerRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const spinStartRef = useRef<number>(0);

  // Record when spinning starts so particle begins at 12 o'clock
  useEffect(() => {
    if (isRunning) {
      spinStartRef.current = performance.now();
    }
  }, [isRunning]);

  const maxSec = 3600;
  const size = sizeProp;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;
  const lineW = Math.max(3, size * 0.03);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const [cr, cg, cb] = hexToRgb(color);
    const startAngle = -Math.PI / 2;

    let prevTime = performance.now();

    const draw = (now: number) => {
      const dt = now - prevTime;
      prevTime = now;
      void dt;

      ctx.clearRect(0, 0, size, size);

      // Background track
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = lineW;
      ctx.stroke();

      const progress = Math.min(elapsed / maxSec, 1);
      const progressAngle = startAngle + progress * Math.PI * 2;

      if (elapsed > 0) {
        // Accumulated glow (outer blur)
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, progressAngle);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.15)`;
        ctx.lineWidth = size * 0.09;
        ctx.lineCap = "round";
        ctx.filter = `blur(${Math.round(size * 0.04)}px)`;
        ctx.stroke();
        ctx.filter = "none";

        // Accumulated ring (solid)
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, progressAngle);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.5)`;
        ctx.lineWidth = lineW;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      if (isRunning) {
        // Spinning particle — 1 revolution per second, starts at 12 o'clock
        const spinAngle = startAngle + (((now - spinStartRef.current) / 1000) % 1) * Math.PI * 2;

        // Comet tail (gradient arc trailing the particle)
        const tailLength = Math.PI * 0.6;
        const tailStart = spinAngle - tailLength;
        const segments = 30;
        for (let i = 0; i < segments; i++) {
          const t = i / segments;
          const a0 = tailStart + (tailLength * i) / segments;
          const a1 = tailStart + (tailLength * (i + 1)) / segments;
          const alpha = t * t * 0.6; // quadratic fade-in
          ctx.beginPath();
          ctx.arc(cx, cy, r, a0, a1);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.lineWidth = lineW * (0.5 + t * 0.5);
          ctx.lineCap = "butt";
          ctx.stroke();
        }

        // Bright particle head
        const px = cx + r * Math.cos(spinAngle);
        const py = cy + r * Math.sin(spinAngle);

        // Outer glow
        const glowR = size * 0.08;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.6)`);
        grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.15)`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        const coreR = size * 0.025;
        const coreGrad = ctx.createRadialGradient(px, py, 0, px, py, coreR);
        coreGrad.addColorStop(0, "#fff");
        coreGrad.addColorStop(0.4, `rgba(${cr},${cg},${cb},0.9)`);
        coreGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath();
        ctx.arc(px, py, coreR, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [elapsed, isRunning, color, maxSec, r, cx, cy, lineW, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  );
}
