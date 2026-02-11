"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  ChartPoint,
} from "@/modules/dashboard/components/overview-types";
import {
  formatBytes,
  formatBytesPerSec,
  firstVal,
} from "@/modules/dashboard/components/overview-types";
import { OverviewHeader } from "@/modules/dashboard/components/overview-header";
import {
  StatCard,
  type StatCardData,
} from "@/modules/dashboard/components/stat-card";
import { CpuLoadChart } from "@/modules/dashboard/components/cpu-load-chart";
import { SystemInfoPanel } from "@/modules/dashboard/components/system-info-panel";

export default function OverviewView() {
  const { language } = useLanguage();
  const t =
    translations.overview[language as keyof typeof translations.overview] ||
    translations.overview.EN;

  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30_000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);

      const [
        cpuRes,
        coresRes,
        load1Res,
        load5Res,
        load15Res,
        memTotalRes,
        memAvailRes,
        netRxRes,
        netTxRes,
        diskSizeRes,
        diskAvailRes,
        loadHistory,
      ] = await Promise.all([
        prometheusApi.getCpuUsage(),
        prometheusApi.getCpuCores(),
        prometheusApi.getLoad1(),
        prometheusApi.getLoad5(),
        prometheusApi.getLoad15(),
        prometheusApi.getMemTotal(),
        prometheusApi.getMemAvailable(),
        prometheusApi.getNetworkRx(),
        prometheusApi.getNetworkTx(),
        prometheusApi.getDiskSize(),
        prometheusApi.getDiskAvail(),
        prometheusApi.getLoadHistory(),
      ]);

      // Parse disk info
      const diskSizeMap = new Map<
        string,
        { total: number; device: string; mountpoint: string }
      >();
      diskSizeRes.forEach((r) => {
        const mp = r.metric.mountpoint || "/";
        diskSizeMap.set(mp, {
          total: parseFloat(r.value[1]) || 0,
          device: r.metric.device || "",
          mountpoint: mp,
        });
      });

      const disks: Metrics["disks"] = [];
      diskAvailRes.forEach((r) => {
        const mp = r.metric.mountpoint || "/";
        const sizeInfo = diskSizeMap.get(mp);
        if (sizeInfo) {
          const avail = parseFloat(r.value[1]) || 0;
          disks.push({
            mountpoint: mp,
            device: sizeInfo.device,
            total: sizeInfo.total,
            avail,
            used: sizeInfo.total - avail,
          });
        }
      });

      const diskTotalAll = disks.reduce((s, d) => s + d.total, 0);
      const diskUsedAll = disks.reduce((s, d) => s + d.used, 0);
      const memTotal = firstVal(memTotalRes);
      const memAvail = firstVal(memAvailRes);

      setMetrics({
        cpuUsage: firstVal(cpuRes),
        cpuCores: firstVal(coresRes),
        load1: firstVal(load1Res),
        load5: firstVal(load5Res),
        load15: firstVal(load15Res),
        memTotal,
        memUsed: memTotal - memAvail,
        networkRx: firstVal(netRxRes),
        networkTx: firstVal(netTxRes),
        disks,
        diskTotalAll,
        diskUsedAll,
      });

      // Build chart data from range queries
      const [load1Range, load5Range, load15Range] = loadHistory;
      const points: ChartPoint[] = [];
      const series = load1Range[0]?.values ?? [];
      series.forEach(([ts], i) => {
        const date = new Date(ts * 1000);
        points.push({
          time: `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`,
          ts,
          load1: parseFloat(load1Range[0]?.values[i]?.[1] ?? "0"),
          load5: parseFloat(load5Range[0]?.values[i]?.[1] ?? "0"),
          load15: parseFloat(load15Range[0]?.values[i]?.[1] ?? "0"),
        });
      });
      setChartData(points);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to fetch Prometheus metrics:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchMetrics, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchMetrics]);

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

  // ─── Derived values ────────────────────────────────────────────

  const m = metrics!;
  const memPercent = m.memTotal > 0 ? (m.memUsed / m.memTotal) * 100 : 0;
  const diskPercent =
    m.diskTotalAll > 0 ? (m.diskUsedAll / m.diskTotalAll) * 100 : 0;

  const STAT_CARDS: StatCardData[] = [
    {
      label: t.stats.cpu.label,
      sub: t.stats.cpu.sub,
      value: `${m.cpuUsage.toFixed(1)}%`,
      gauge: m.cpuUsage,
      gaugeColor:
        m.cpuUsage > 80 ? "#ef4444" : m.cpuUsage > 50 ? "#f59e0b" : "#22d3ee",
      icon: <Cpu className="w-5 h-5" />,
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
    },
    {
      label: t.stats.memory.label,
      sub: `${formatBytes(m.memUsed)} / ${formatBytes(m.memTotal)}`,
      value: `${memPercent.toFixed(1)}%`,
      gauge: memPercent,
      gaugeColor:
        memPercent > 85 ? "#ef4444" : memPercent > 60 ? "#f59e0b" : "#a78bfa",
      icon: <MemoryStick className="w-5 h-5" />,
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/20",
    },
    {
      label: t.stats.network.label,
      sub: `↓ ${formatBytesPerSec(m.networkRx)}  ↑ ${formatBytesPerSec(
        m.networkTx
      )}`,
      value: formatBytesPerSec(m.networkRx + m.networkTx),
      icon: <Network className="w-5 h-5" />,
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: t.stats.disk.label,
      sub: `${formatBytes(m.diskUsedAll)} / ${formatBytes(m.diskTotalAll)}`,
      value: `${diskPercent.toFixed(1)}%`,
      gauge: diskPercent,
      gaugeColor:
        diskPercent > 90 ? "#ef4444" : diskPercent > 70 ? "#f59e0b" : "#fb923c",
      icon: <HardDrive className="w-5 h-5" />,
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
    },
  ];

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

      <OverviewHeader
        title={t.title}
        subtitle={t.subtitle}
        lastUpdatedLabel={t.lastUpdated}
        lastUpdated={lastUpdated}
        loading={loading}
        refreshInterval={refreshInterval}
        language={language}
        mounted={mounted}
        onRefresh={fetchMetrics}
        onIntervalChange={setRefreshInterval}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {STAT_CARDS.map((stat, i) => (
          <StatCard key={i} stat={stat} index={i} mounted={mounted} />
        ))}
      </div>

      {/* Bottom Grid: Chart + System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        <CpuLoadChart
          data={chartData}
          chartTitle={t.chartTitle}
          loadingLabel={t.loading}
          load1Label={t.load1}
          load5Label={t.load5}
          load15Label={t.load15}
          mounted={mounted}
        />
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
