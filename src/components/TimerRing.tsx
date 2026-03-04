"use client";

interface TimerRingProps {
  elapsed: number;
  isRunning: boolean;
  color: string;
}

export default function TimerRing({ elapsed, isRunning, color }: TimerRingProps) {
  const maxSec = 3600;
  const progress = Math.min(elapsed / maxSec, 1);
  const r = 88;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      style={{
        filter: isRunning ? `drop-shadow(0 0 20px ${color}33)` : "none",
        transition: "filter 0.5s",
      }}
    >
      <circle
        cx="100" cy="100" r={r}
        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6"
      />
      <circle
        cx="100" cy="100" r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.5s" }}
      />
      {isRunning && (
        <circle
          cx="100" cy="100" r={r}
          fill="none" stroke={color} strokeWidth="6" opacity="0.2"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 100 100)"
          style={{ filter: "blur(8px)" }}
        />
      )}
    </svg>
  );
}
