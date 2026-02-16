import type { TimeRangeValue } from "@/modules/dashboard/components/advanced-time-selector";

// ─── Prometheus query time parameters ────────────────────────────────
// Converts a TimeRangeValue into { start, end, step } (seconds)
// suitable for Prometheus range queries.

interface TimeParams {
  start: number;
  end: number;
  step: number;
}

const STEP_THRESHOLDS = [
  { maxSeconds: 3_600, step: 15 },        // ≤ 1h  → 15s
  { maxSeconds: 6 * 3_600, step: 180 },    // ≤ 6h  → 3m
  { maxSeconds: 24 * 3_600, step: 600 },   // ≤ 24h → 10m
  { maxSeconds: 7 * 86_400, step: 1200 },   // ≤ 7d  → 20m
  { maxSeconds: Infinity, step: 3_600 },   // > 7d  → 1h
] as const;

function stepForDuration(seconds: number): number {
  return STEP_THRESHOLDS.find((t) => seconds <= t.maxSeconds)!.step;
}

/** Convert a relative range string like "2d" to seconds. */
function parseRelativeValue(value: string): number {
  const num = parseInt(value.replace(/\D/g, ""), 10) || 0;
  const unit = value.replace(/\d/g, "");

  switch (unit) {
    case "m": return num * 60;
    case "h": return num * 3_600;
    case "d": return num * 86_400;
    default:  return 0;
  }
}

export function getTimeParams(range: TimeRangeValue): TimeParams {
  if (range.type === "absolute" && range.start && range.end) {
    const duration = range.end - range.start;
    return { start: range.start, end: range.end, step: stepForDuration(duration) };
  }

  const end = Math.floor(Date.now() / 1000);
  const seconds = parseRelativeValue(range.value);
  const start = end - seconds;

  return { start, end, step: stepForDuration(seconds) };
}
