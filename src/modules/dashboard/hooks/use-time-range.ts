"use client";

import { useCallback, useMemo } from "react";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import type { TimeRangeValue } from "@/modules/dashboard/components/advanced-time-selector";

// ─── nuqs-backed time range hook ─────────────────────────────────────
// Persists the selected time range in URL query params so it survives
// page refreshes. Returns the same shape as useState<TimeRangeValue>.

const timeRangeSearchParams = {
  trType: parseAsString.withDefault("relative"),
  trValue: parseAsString.withDefault("1h"),
  trStart: parseAsInteger,
  trEnd: parseAsInteger,
  trLabel: parseAsString,
};

export function useTimeRange() {
  const [params, setParams] = useQueryStates(timeRangeSearchParams, {
    history: "replace",
  });

  /** Derive a stable TimeRangeValue from URL params */
  const timeRange: TimeRangeValue = useMemo(
    () => ({
      type: (params.trType as TimeRangeValue["type"]) || "relative",
      value: params.trValue || "1h",
      start: params.trStart ?? undefined,
      end: params.trEnd ?? undefined,
      label: params.trLabel ?? undefined,
    }),
    [params.trType, params.trValue, params.trStart, params.trEnd, params.trLabel],
  );

  /** A primitive key that only changes when the range actually changes */
  const timeRangeKey = `${params.trType}_${params.trValue}_${params.trStart}_${params.trEnd}`;

  const setTimeRange = useCallback(
    (range: TimeRangeValue) => {
      setParams({
        trType: range.type,
        trValue: range.value,
        trStart: range.start ?? null,
        trEnd: range.end ?? null,
        trLabel: range.label ?? null,
      });
    },
    [setParams],
  );

  const isRelative = params.trType === "relative";

  return { timeRange, setTimeRange, timeRangeKey, isRelative } as const;
}
