"use client";

import { RefreshCw } from "lucide-react";
import { REFRESH_OPTIONS } from "./overview-types";

// ─── Overview Header ─────────────────────────────────────────────────

interface OverviewHeaderProps {
  title: string;
  subtitle: string;
  lastUpdatedLabel: string;
  lastUpdated: Date | null;
  loading: boolean;
  refreshInterval: number;
  language: string;
  mounted: boolean;
  refreshLabel?: string;
  refreshOff?: string;
  onRefresh: () => void;
  onIntervalChange: (ms: number) => void;
}

export function OverviewHeader({
  title,
  subtitle,
  lastUpdatedLabel,
  lastUpdated,
  loading,
  refreshInterval,
  language,
  mounted,
  refreshLabel,
  refreshOff,
  onRefresh,
  onIntervalChange,
}: OverviewHeaderProps) {
  return (
    <div
      className={`flex flex-col md:flex-row items-center justify-between transition-all duration-700 transform ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-wide drop-shadow-md">
          {title}
        </h1>
        <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 mt-2">
        {lastUpdated && (
          <span className="text-xs md:text-base text-slate-500">
            {lastUpdatedLabel}: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-cyan-400 transition-all border border-slate-700/50 disabled:opacity-40"
          title={refreshLabel || "Refresh"}
        >
          <RefreshCw
            className={`shrink-0 size-4 ${loading ? "animate-spin" : ""}`}
          />
        </button>
        <select
          value={refreshInterval}
          onChange={(e) => onIntervalChange(Number(e.target.value))}
          className="text-sm bg-slate-800 text-slate-400 pl-2 pr-6 py-1.5 rounded-lg border border-slate-700/50 hover:border-slate-600 focus:border-cyan-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 6px center",
          }}
        >
          {REFRESH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-lg">
              {opt.value === 0
                ? refreshOff || (language === "TH" ? "ปิด" : "Off")
                : `${opt.label}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
