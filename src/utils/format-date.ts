import { TimeRangeValue } from "@/components/ui/advanced-time-selector";
import dayjs from "dayjs";

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

export function resolveTimeRange(range: TimeRangeValue): {
  fromDate: string;
  toDate: string;
} {
  const now = dayjs();
  if (range.type === "absolute" && range.start && range.end) {
    return {
      fromDate: dayjs(range.start * 1000).toISOString(),
      toDate: dayjs(range.end * 1000).toISOString(),
    };
  }
  // relative
  const val = range.value;
  const num = parseInt(val.replace(/\D/g, ""));
  const unit = val.replace(/\d/g, "");
  let start = now;
  if (unit === "m") start = now.subtract(num, "minute");
  if (unit === "h") start = now.subtract(num, "hour");
  if (unit === "d") start = now.subtract(num, "day");
  return { fromDate: start.toISOString(), toDate: now.toISOString() };
}
