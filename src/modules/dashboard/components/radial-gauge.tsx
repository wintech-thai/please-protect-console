"use client";

// ─── Radial Gauge — SVG circular progress indicator ──────────────────

interface RadialGaugeProps {
  /** Percentage value (0–100) */
  value: number;
  /** Stroke colour */
  color: string;
  /** Diameter in px (default 72) */
  size?: number;
}

export function RadialGauge({ value, color, size = 72 }: RadialGaugeProps) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(value, 100) / 100);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        className="text-slate-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}
