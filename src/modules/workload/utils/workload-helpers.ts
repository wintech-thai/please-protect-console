import type { WorkloadStatus, WorkloadType } from "../api/workloads.api";

// ──────────────────────────────────────────────
// Relative age (kubectl-style)
// ──────────────────────────────────────────────

/**
 * Returns a human-readable relative age string like kubectl does.
 * e.g. "5s", "3m", "2h", "7d"
 */
export function relativeAge(isoString: string): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 0) return "0s";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}d`;
  return `${Math.floor(d / 365)}y`;
}

// ──────────────────────────────────────────────
// Formatting utilities
// ──────────────────────────────────────────────

export function formatCpu(cores: number): string {
  if (cores < 1) return `${(cores * 1000).toFixed(0)}m`;
  return `${cores.toFixed(3)} cores`;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}

export function formatTimeLabel(ms: number, durationSeconds: number): string {
  const d = new Date(ms);
  if (durationSeconds <= 3600) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
  if (durationSeconds <= 86400) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ──────────────────────────────────────────────
// Style configs
// ──────────────────────────────────────────────

export const TYPE_COLORS: Record<WorkloadType, string> = {
  Deployment:  "text-blue-300 bg-blue-500/10 border-blue-500/20",
  StatefulSet: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  DaemonSet:   "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  Pod:         "text-orange-300 bg-orange-500/10 border-orange-500/20",
};

export interface StatusCfg {
  cls: string;
  label: string;
}

export const STATUS_CFG: Record<WorkloadStatus, StatusCfg> = {
  OK:      { cls: "text-emerald-400", label: "OK" },
  Warning: { cls: "text-amber-400",   label: "Warning" },
  Error:   { cls: "text-red-400",     label: "Error" },
  Unknown: { cls: "text-slate-400",   label: "Unknown" },
};

export interface PhaseCfg {
  cls: string;
}

export const PHASE_CFG: Record<string, PhaseCfg> = {
  Running:   { cls: "text-emerald-400" },
  Succeeded: { cls: "text-emerald-400" },
  Completed: { cls: "text-emerald-400" },
  Pending:   { cls: "text-amber-400" },
  Failed:    { cls: "text-red-400" },
  Unknown:   { cls: "text-slate-400" },
};

// ──────────────────────────────────────────────
// Time range helpers
// ──────────────────────────────────────────────

export const RELATIVE_SECONDS: Record<string, number> = {
  "5m": 300, "15m": 900, "30m": 1800,
  "1h": 3600, "3h": 10800, "6h": 21600,
  "12h": 43200, "24h": 86400, "2d": 172800,
  "7d": 604800, "30d": 2592000,
};

export function stepForDuration(seconds: number): number {
  if (seconds <=    300) return 15;
  if (seconds <=   3600) return 60;
  if (seconds <=  21600) return 180;
  if (seconds <=  86400) return 600;
  return 1200;
}

export interface TimeRangeParams {
  durationSeconds: number;
  step: number;
  start?: number;
  end?: number;
}

export function getTimeParams(range: { type: string; value: string; start?: number; end?: number }): TimeRangeParams {
  if (range.type === "absolute" && range.start && range.end) {
    const duration = range.end - range.start;
    return { durationSeconds: duration, step: stepForDuration(duration), start: range.start, end: range.end };
  }
  const seconds = RELATIVE_SECONDS[range.value] ?? 3600;
  return { durationSeconds: seconds, step: stepForDuration(seconds) };
}
