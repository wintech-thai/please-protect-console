"use client";

import { Clock } from "lucide-react";

export type TimeRange = "5m" | "1h" | "6h" | "24h" | "7d";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  disabled?: boolean;
}

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "5m", label: "Last 5 minutes" },
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
];

export function TimeRangeSelector({
  value,
  onChange,
  disabled,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/50">
      <div className="px-2 text-slate-400">
        <Clock className="w-4 h-4" />
      </div>
      <div className="flex bg-slate-900 rounded-md overflow-hidden">
        {RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range.value)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              value === range.value
                ? "bg-cyan-500/10 text-cyan-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
