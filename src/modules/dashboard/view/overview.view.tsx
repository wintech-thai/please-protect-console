"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import {
  Cpu,
  MemoryStick,
  Network,
  HardDrive,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { prometheusApi } from "@/modules/dashboard/api/prometheus.api";

import type {
  Metrics,
  CpuChartData,
  MemoryChartData,
  NetworkChartData,
  DiskIoChartData,
} from "@/modules/dashboard/components/overview-types";
import { formatBytes, formatBytesPerSec } from "@/modules/dashboard/components/overview-types";
import { OverviewHeader } from "@/modules/dashboard/components/overview-header";
import { StatCard, type StatCardData } from "@/modules/dashboard/components/stat-card";
import { SystemInfoPanel } from "@/modules/dashboard/components/system-info-panel";
import { AdvancedTimeRangeSelector } from "@/modules/dashboard/components/advanced-time-selector";
import {
  CpuUsageChart,
  MemoryUsageChart,
  NetworkChart,
  DiskIoChart,
} from "@/modules/dashboard/components/dashboard-charts";

import { useTimeRange } from "@/modules/dashboard/hooks/use-time-range";
import { getTimeParams } from "@/modules/dashboard/utils/time-params";
import { processAllCharts } from "@/modules/dashboard/utils/chart-processors";
import {
  EMPTY_METRICS,
  fetchCurrentMetrics,
  metricsFromHistory,
} from "@/modules/dashboard/utils/metrics-helpers";

export default function OverviewView() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}

interface ChartsState {
  cpu: { chartData: CpuChartData[]; sparkData: { value: number }[] };
  memory: { chartData: MemoryChartData[]; sparkData: { value: number }[] };
  network: { chartData: NetworkChartData[]; sparkData: { value: number }[] };
  diskIo: { chartData: DiskIoChartData[]; sparkData: { value: number }[] };
}

const EMPTY_CHARTS: ChartsState = {
  cpu: { chartData: [], sparkData: [] },
  memory: { chartData: [], sparkData: [] },
  network: { chartData: [], sparkData: [] },
  diskIo: { chartData: [], sparkData: [] },
};


function OverviewContent() {
  const { language } = useLanguage();
  const t =
    translations.overview[language as keyof typeof translations.overview] ||
    translations.overview.EN;

  // Time range (persisted in URL via nuqs)
  const { timeRange, setTimeRange, timeRangeKey, isRelative } = useTimeRange();

  // Data state
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [charts, setCharts] = useState<ChartsState>(EMPTY_CHARTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30_000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const { start, end, step } = getTimeParams(timeRange);

      // 1. History data (for charts)
      const [cpuHist, memHist, netHist, diskIoHist] = await Promise.all([
        prometheusApi.getCpuHistory(start, end, step),
        prometheusApi.getMemoryHistory(start, end, step),
        prometheusApi.getNetworkHistory(start, end, step),
        prometheusApi.getDiskIoHistory(start, end, step),
      ]);

      const hasData = (cpuHist?.[0]?.values?.length ?? 0) > 0;

      // 2. Stat-card metrics
      if (isRelative) {
        setMetrics(await fetchCurrentMetrics());
      } else {
        setMetrics(
          hasData
            ? metricsFromHistory(cpuHist, memHist, netHist)
            : EMPTY_METRICS,
        );
      }

      // 3. Chart data
      setCharts(
        hasData
          ? processAllCharts(cpuHist, memHist, netHist, diskIoHist)
          : EMPTY_CHARTS,
      );

      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error("Failed to fetch Prometheus metrics:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRangeKey]);

  useEffect(() => {
    setMounted(true);
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (refreshInterval > 0 && isRelative) {
      intervalRef.current = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchMetrics, isRelative]);

  if (loading && !metrics) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
          <span className="text-sm font-medium">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <span className="text-sm font-medium">{t.error}</span>
          <button
            onClick={() => {
              setLoading(true);
              fetchMetrics();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors border border-slate-700"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  }

  const m = metrics!;
  const hasData =
    charts.cpu.chartData.length > 0 || charts.memory.chartData.length > 0;
  const memPercent = m.memTotal > 0 ? (m.memUsed / m.memTotal) * 100 : 0;
  const diskPercent =
    m.diskTotalAll > 0 ? (m.diskUsedAll / m.diskTotalAll) * 100 : 0;

  return (
    <div className="w-full h-full flex flex-col gap-6 pt-6 px-4 md:px-12 pb-10 overflow-y-auto overflow-x-hidden custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
          border: 2px solid #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>

      {/* Header + Time Selector */}
      <div className="flex flex-col gap-4">
        <OverviewHeader
          title={t.title}
          subtitle={t.subtitle}
          lastUpdatedLabel={t.lastUpdated}
          lastUpdated={lastUpdated}
          loading={loading}
          refreshInterval={refreshInterval}
          language={language}
          mounted={mounted}
          refreshLabel={t.refresh}
          refreshOff={t.refreshOff}
          onRefresh={fetchMetrics}
          onIntervalChange={setRefreshInterval}
        />
        <div className="flex justify-end">
          <AdvancedTimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            disabled={loading}
            translations={t.timePicker}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {buildStatCards(m, hasData, memPercent, diskPercent, charts, t).map(
          (stat, i) => (
            <StatCard key={i} stat={stat} index={i} mounted={mounted} />
          ),
        )}
      </div>

      {/* Charts */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50">
        {!hasData && <NoDataOverlay message={t.noData} />}

        <CpuUsageChart
          data={charts.cpu.chartData}
          title={t.charts?.cpu || "CPU Usage"}
          tooltipLabel={t.tooltipCpuUsage}
        />
        <MemoryUsageChart
          data={charts.memory.chartData}
          title={t.charts?.memory || "Memory Usage"}
          tooltipLabel={t.tooltipMemUsed}
        />
        <NetworkChart
          data={charts.network.chartData}
          title={t.charts?.network || "Network Traffic"}
          rxLabel={t.rxRate || "RX"}
          txLabel={t.txRate || "TX"}
        />
        <DiskIoChart
          data={charts.diskIo.chartData}
          title={t.charts?.disk || "Disk I/O"}
          readLabel={t.charts?.read || "Read"}
          writeLabel={t.charts?.write || "Write"}
        />
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 gap-6 shrink-0">
        <SystemInfoPanel
          metrics={m}
          memPercent={memPercent}
          t={{
            systemInfo: t.systemInfo,
            cpuCores: t.cpuCores,
            loadAvg: t.loadAvg,
            memBreakdown: t.memBreakdown,
            diskBreakdown: t.diskBreakdown,
            used: t.used,
            total: t.total,
          }}
          mounted={mounted}
        />
      </div>
    </div>
  );
}

function NoDataOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 rounded-2xl backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <AlertTriangle className="w-8 h-8 text-slate-500" />
        <p className="text-sm font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}

function buildStatCards(
  m: Metrics,
  hasData: boolean,
  memPercent: number,
  diskPercent: number,
  charts: ChartsState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any,
): StatCardData[] {
  const na = { value: "N/A", sub: t.noDataSub || "No data in selected range" };

  return [
    {
      label: t.stats.cpu.label,
      sub: hasData ? t.stats.cpu.sub : na.sub,
      value: hasData ? `${m.cpuUsage.toFixed(1)}%` : na.value,
      gauge: hasData ? m.cpuUsage : undefined,
      gaugeColor:
        m.cpuUsage > 80 ? "#ef4444" : m.cpuUsage > 50 ? "#f59e0b" : "#22d3ee",
      icon: <Cpu className="w-5 h-5" />,
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      chartData: hasData ? charts.cpu.sparkData : [],
    },
    {
      label: t.stats.memory.label,
      sub: hasData
        ? `${formatBytes(m.memUsed)} / ${formatBytes(m.memTotal)}`
        : na.sub,
      value: hasData ? `${memPercent.toFixed(1)}%` : na.value,
      gauge: hasData ? memPercent : undefined,
      gaugeColor:
        memPercent > 85 ? "#ef4444" : memPercent > 60 ? "#f59e0b" : "#a78bfa",
      icon: <MemoryStick className="w-5 h-5" />,
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
      chartData: hasData ? charts.memory.sparkData : [],
    },
    {
      label: t.stats.network.label,
      sub: hasData
        ? `↓ ${formatBytesPerSec(m.networkRx)}  ↑ ${formatBytesPerSec(m.networkTx)}`
        : na.sub,
      value: hasData
        ? formatBytesPerSec(m.networkRx + m.networkTx)
        : na.value,
      icon: <Network className="w-5 h-5" />,
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      chartData: hasData ? charts.network.sparkData : [],
    },
    {
      label: t.stats.disk.label,
      sub: hasData
        ? `${formatBytes(m.diskUsedAll)} / ${formatBytes(m.diskTotalAll)}`
        : na.sub,
      value: hasData ? `${diskPercent.toFixed(1)}%` : na.value,
      gauge: hasData ? diskPercent : undefined,
      gaugeColor:
        diskPercent > 90
          ? "#ef4444"
          : diskPercent > 70
            ? "#f59e0b"
            : "#fb923c",
      icon: <HardDrive className="w-5 h-5" />,
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
      chartData: hasData ? charts.diskIo.sparkData : [],
    },
  ];
}
