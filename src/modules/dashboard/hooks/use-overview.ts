import { useQuery, keepPreviousData, type UseQueryOptions } from "@tanstack/react-query";
import { prometheusApi } from "@/modules/dashboard/api/prometheus.api";
import type { Metrics } from "@/modules/dashboard/components/overview-types";
import type { TimeRangeValue } from "@/modules/dashboard/components/advanced-time-selector";
import { getTimeParams } from "@/modules/dashboard/utils/time-params";
import { processAllCharts } from "@/modules/dashboard/utils/chart-processors";
import { fetchCurrentMetrics, metricsFromHistory, EMPTY_METRICS } from "@/modules/dashboard/utils/metrics-helpers";

// ─── Query key factories ─────────────────────────────────────────────

export const overviewKeys = {
  all: ["overview"] as const,
  history: (range: TimeRangeValue) =>
    range.type === "absolute" && range.start && range.end
      ? [...overviewKeys.all, "history", "absolute", range.start, range.end] as const
      : [...overviewKeys.all, "history", "relative", range.value] as const,
  currentMetrics: () => [...overviewKeys.all, "current"] as const,
};

// ─── Types ───────────────────────────────────────────────────────────

export interface OverviewHistoryData {
  charts: {
    cpu:     { chartData: import("@/modules/dashboard/components/overview-types").CpuChartData[];     sparkData: { value: number }[] };
    memory:  { chartData: import("@/modules/dashboard/components/overview-types").MemoryChartData[];  sparkData: { value: number }[] };
    network: { chartData: import("@/modules/dashboard/components/overview-types").NetworkChartData[]; sparkData: { value: number }[] };
    diskIo:  { chartData: import("@/modules/dashboard/components/overview-types").DiskIoChartData[];  sparkData: { value: number }[] };
  };
  /** Metrics derived from the last data point of each history series (for absolute ranges) */
  historyMetrics: Metrics;
  hasData: boolean;
}

// ─── Hooks ───────────────────────────────────────────────────────────

type HistoryOptions = Omit<UseQueryOptions<OverviewHistoryData>, "queryKey" | "queryFn">;

/**
 * Fetches all 4 Prometheus range queries (CPU, memory, network, disk I/O),
 * processes them into chart data, and derives stat-card metrics from the tail end.
 *
 * For **relative** ranges the query key is stable (e.g. ["relative","1h"]),
 * and fresh start/end are computed inside queryFn on every fetch so the
 * timeline always reflects the current moment.
 *
 * For **absolute** ranges the query key includes the exact start/end,
 * so data is cached correctly per window.
 */
export function useOverviewHistory(
  timeRange: TimeRangeValue,
  options?: HistoryOptions,
) {
  return useQuery<OverviewHistoryData>({
    queryKey: overviewKeys.history(timeRange),
    queryFn: async () => {
      // Compute fresh timestamps on every call
      const { start, end, step } = getTimeParams(timeRange);

      const [cpuHist, memHist, netHist, diskIoHist] = await Promise.all([
        prometheusApi.getCpuHistory(start, end, step),
        prometheusApi.getMemoryHistory(start, end, step),
        prometheusApi.getNetworkHistory(start, end, step),
        prometheusApi.getDiskIoHistory(start, end, step),
      ]);

      const hasData = (cpuHist?.[0]?.values?.length ?? 0) > 0;

      return {
        charts: hasData
          ? processAllCharts(cpuHist, memHist, netHist, diskIoHist)
          : {
              cpu:     { chartData: [], sparkData: [] },
              memory:  { chartData: [], sparkData: [] },
              network: { chartData: [], sparkData: [] },
              diskIo:  { chartData: [], sparkData: [] },
            },
        historyMetrics: hasData
          ? metricsFromHistory(cpuHist, memHist, netHist)
          : EMPTY_METRICS,
        hasData,
      };
    },
    placeholderData: keepPreviousData,
    ...options,
  });
}

type CurrentMetricsOptions = Omit<UseQueryOptions<Metrics>, "queryKey" | "queryFn">;

/**
 * Fetches current (instant) Prometheus metrics for stat cards.
 * Should only be enabled when the time range is "relative".
 */
export function useCurrentMetrics(options?: CurrentMetricsOptions) {
  return useQuery<Metrics>({
    queryKey: overviewKeys.currentMetrics(),
    queryFn: fetchCurrentMetrics,
    placeholderData: keepPreviousData,
    ...options,
  });
}
