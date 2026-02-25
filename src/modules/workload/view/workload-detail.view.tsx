"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Cpu,
  MemoryStick,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  workloadDetailApi,
  type PodDetail,
  type MetricPoint,
  type WorkloadMetrics,
  type WorkloadInfo,
  type RevisionInfo,
} from "../api/workload-detail.api";
import type { WorkloadStatus, WorkloadType } from "../api/workloads.api";
import {
  AdvancedTimeRangeSelector,
  type TimeRangeValue,
} from "@/modules/dashboard/components/advanced-time-selector";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ──────────────────────────────────────────────
// Time range helpers
// ──────────────────────────────────────────────

const RELATIVE_SECONDS: Record<string, number> = {
  "5m": 300, "15m": 900, "30m": 1800,
  "1h": 3600, "3h": 10800, "6h": 21600,
  "12h": 43200, "24h": 86400, "2d": 172800,
  "7d": 604800, "30d": 2592000,
};

function stepForDuration(seconds: number): number {
  if (seconds <=    300) return 15;
  if (seconds <=   3600) return 60;
  if (seconds <=  21600) return 180;
  if (seconds <=  86400) return 600;
  return 1200;
}

function getTimeParams(range: TimeRangeValue): { durationSeconds: number; step: number; start?: number; end?: number } {
  if (range.type === "absolute" && range.start && range.end) {
    const duration = range.end - range.start;
    return { durationSeconds: duration, step: stepForDuration(duration), start: range.start, end: range.end };
  }
  const seconds = RELATIVE_SECONDS[range.value] ?? 3600;
  return { durationSeconds: seconds, step: stepForDuration(seconds) };
}

const WORKLOAD_TIME_TRANSLATIONS = {
  absoluteTitle: "Absolute range",
  from: "From",
  to: "To",
  apply: "Apply",
  searchPlaceholder: "Search ranges…",
  customRange: "Custom range",
  last5m: "Last 5 minutes",
  last15m: "Last 15 minutes",
  last30m: "Last 30 minutes",
  last1h: "Last 1 hour",
  last3h: "Last 3 hours",
  last6h: "Last 6 hours",
  last12h: "Last 12 hours",
  last24h: "Last 24 hours",
  last2d: "Last 2 days",
  last7d: "Last 7 days",
  last30d: "Last 30 days",
} as const;

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

function formatCpu(cores: number): string {
  if (cores < 1) return `${(cores * 1000).toFixed(0)}m`;
  return `${cores.toFixed(3)} cores`;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}

function relativeAge(isoString: string): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatTimeLabel(ms: number, durationSeconds: number): string {
  const d = new Date(ms);
  if (durationSeconds <= 3600) {
    // ≤ 1h → HH:mm:ss
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
  if (durationSeconds <= 86400) {
    // ≤ 24h → HH:mm
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  // > 24h → MMM d HH:mm
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ──────────────────────────────────────────────
// Metric chart card
// ──────────────────────────────────────────────

function MetricCard({
  title, icon, data, format, color, loading, durationSeconds,
}: {
  title: string;
  icon: React.ReactNode;
  data: MetricPoint[];
  format: (v: number) => string;
  color: string;
  loading: boolean;
  durationSeconds: number;
}) {
  const latest = data.length > 0 ? data[data.length - 1].value : null;
  const max = data.length > 0 ? Math.max(...data.map((d) => d.value)) : null;
  const avg = data.length > 0 ? data.reduce((s, d) => s + d.value, 0) / data.length : null;

  const chartData = data.map((d) => ({
    time: d.time,
    value: d.value,
    label: formatTimeLabel(d.time, durationSeconds),
  }));

  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {loading ? (
          <div className="w-4 h-4 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin" />
        ) : latest !== null ? (
          <span className="text-2xl font-mono font-bold text-slate-100">{format(latest)}</span>
        ) : (
          <span className="text-sm text-slate-600">—</span>
        )}
      </div>

      {/* Chart */}
      <div className="h-44">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-600">
            <div className="w-4 h-4 border-2 border-slate-700 border-t-orange-500/60 rounded-full animate-spin mr-2" />
            Loading…
          </div>
        ) : data.length < 2 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-600">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickFormatter={format}
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={56}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#e2e8f0",
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                formatter={(v: number | undefined) => [v != null ? format(v) : "—", title]}
              />
              <Area
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color}
                fill={`url(#${gradId})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer stats */}
      {!loading && (max !== null || avg !== null) && (
        <div className="flex items-center gap-5 text-xs text-slate-600 border-t border-slate-800 pt-2">
          {max !== null && (
            <span>Max: <span className="text-slate-400 font-mono">{format(max)}</span></span>
          )}
          {avg !== null && (
            <span>Avg: <span className="text-slate-400 font-mono">{format(avg)}</span></span>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Badges
// ──────────────────────────────────────────────

const PHASE_CFG: Record<string, { icon: React.ReactNode; cls: string }> = {
  Running:   { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "text-emerald-400" },
  Succeeded: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "text-emerald-400" },
  Pending:   { icon: <AlertTriangle className="w-3.5 h-3.5" />, cls: "text-amber-400" },
  Failed:    { icon: <XCircle className="w-3.5 h-3.5" />, cls: "text-red-400" },
  Unknown:   { icon: <HelpCircle className="w-3.5 h-3.5" />, cls: "text-slate-400" },
};

const STATUS_CFG: Record<WorkloadStatus, { icon: React.ReactNode; cls: string; label: string }> = {
  OK:      { icon: <CheckCircle2 className="w-4 h-4" />, cls: "text-emerald-400", label: "OK" },
  Warning: { icon: <AlertTriangle className="w-4 h-4" />, cls: "text-amber-400", label: "Warning" },
  Error:   { icon: <XCircle className="w-4 h-4" />, cls: "text-red-400", label: "Error" },
  Unknown: { icon: <HelpCircle className="w-4 h-4" />, cls: "text-slate-400", label: "Unknown" },
};

const TYPE_COLORS: Record<WorkloadType, string> = {
  Deployment:  "text-blue-300 bg-blue-500/10 border-blue-500/20",
  StatefulSet: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  DaemonSet:   "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  Pod:         "text-orange-300 bg-orange-500/10 border-orange-500/20",
};

function PhaseBadge({ phase }: { phase: string }) {
  const cfg = PHASE_CFG[phase] ?? PHASE_CFG.Unknown;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.cls)}>
      {cfg.icon}{phase}
    </span>
  );
}

// ──────────────────────────────────────────────
// Section wrapper
// ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </section>
  );
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

export interface WorkloadDetailViewProps {
  namespace: string;
  type: WorkloadType;
  name: string;
}

const EMPTY_METRICS: WorkloadMetrics = { cpu: [], memory: [], disk: [] };
const EMPTY_INFO: WorkloadInfo = { labels: {}, createdAt: "", containers: [] };

// ──────────────────────────────────────────────
// Main page view
// ──────────────────────────────────────────────

export default function WorkloadDetailView({ namespace, type, name }: WorkloadDetailViewProps) {
  const router = useRouter();

  const [pods, setPods] = useState<PodDetail[]>([]);
  const [metrics, setMetrics] = useState<WorkloadMetrics>(EMPTY_METRICS);
  const [info, setInfo] = useState<WorkloadInfo>(EMPTY_INFO);
  const [revisions, setRevisions] = useState<RevisionInfo[]>([]);

  const [podsLoading, setPodsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [infoLoading, setInfoLoading] = useState(true);
  const [revisionsLoading, setRevisionsLoading] = useState(true);

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "1h",
    label: "Last 1 hour",
  });

  // fetchKey triggers re-fetch of info/pods/revisions; also resets metrics
  const [fetchKey, setFetchKey] = useState(0);

  const isAnyLoading = podsLoading || metricsLoading || infoLoading || revisionsLoading;

  const fetchAll = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const reset = () => {
      setPods([]);
      setInfo(EMPTY_INFO);
      setRevisions([]);
      setPodsLoading(true);
      setInfoLoading(true);
      setRevisionsLoading(true);
    };
    if (fetchKey > 0) reset();

    workloadDetailApi.getWorkloadInfo(namespace, name, type)
      .then(setInfo).catch(() => setInfo(EMPTY_INFO)).finally(() => setInfoLoading(false));

    workloadDetailApi.getRevisions(namespace, name, type)
      .then(setRevisions).catch(() => setRevisions([])).finally(() => setRevisionsLoading(false));

    workloadDetailApi.getPods(namespace, name, type)
      .then(setPods).catch(() => setPods([])).finally(() => setPodsLoading(false));
  }, [namespace, name, type, fetchKey]);

  // Metrics re-fetched independently when timeRange or fetchKey changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMetrics(EMPTY_METRICS);
      setMetricsLoading(true);
      try {
        const { durationSeconds, step, start, end } = getTimeParams(timeRange);
        const m = await workloadDetailApi.getMetrics(namespace, name, durationSeconds, step, start, end);
        if (!cancelled) setMetrics(m);
      } catch {
        if (!cancelled) setMetrics(EMPTY_METRICS);
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(timeRange), fetchKey, namespace, name]);

  const derivedStatus: WorkloadStatus = (() => {
    if (podsLoading) return "Unknown";
    if (pods.length === 0) return "Unknown";
    const allOk = pods.every((p) => p.phase === "Running" || p.phase === "Succeeded");
    const anyFailed = pods.some((p) => p.phase === "Failed");
    if (allOk) return "OK";
    if (anyFailed) return "Error";
    return "Warning";
  })();
  const statusDisplay = STATUS_CFG[derivedStatus];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-none pt-6 px-4 md:px-8 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                <span className="truncate">{name}</span>
                <span className={cn("flex items-center gap-1 text-base font-medium shrink-0", statusDisplay.cls)}>
                  {statusDisplay.icon}
                  {statusDisplay.label}
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Workloads / 
                <span className="text-slate-300">{namespace}</span>
                 / 
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", TYPE_COLORS[type])}>{type}</span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={isAnyLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-50 transition-colors shrink-0"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isAnyLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">

           {/* ── Metrics ── */}
          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Metrics
              </h3>
              <div className="w-full sm:w-auto">
                <AdvancedTimeRangeSelector
                  value={timeRange}
                  onChange={setTimeRange}
                  disabled={metricsLoading}
                  translations={WORKLOAD_TIME_TRANSLATIONS}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="CPU"
                icon={<Cpu className="w-4 h-4" />}
                data={metrics.cpu}
                format={formatCpu}
                color="#f97316"
                loading={metricsLoading}
                durationSeconds={getTimeParams(timeRange).durationSeconds}
              />
              <MetricCard
                title="Memory"
                icon={<MemoryStick className="w-4 h-4" />}
                data={metrics.memory}
                format={formatBytes}
                color="#3b82f6"
                loading={metricsLoading}
                durationSeconds={getTimeParams(timeRange).durationSeconds}
              />
              <MetricCard
                title="Disk"
                icon={<HardDrive className="w-4 h-4" />}
                data={metrics.disk}
                format={formatBytes}
                color="#8b5cf6"
                loading={metricsLoading}
                durationSeconds={getTimeParams(timeRange).durationSeconds}
              />
            </div>
          </section>

          {/* ── Details ── */}
          <Section title="Details">
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
              <Row label="Namespace">{namespace}</Row>
              <Row label="Created">
                {infoLoading ? <Skeleton /> : info.createdAt ? new Date(info.createdAt).toLocaleString() : "—"}
              </Row>

              {(infoLoading || info.replicas) && (
                <Row label="Replicas">
                  {infoLoading ? <Skeleton /> : info.replicas ? (
                    <span>
                      <span className="text-slate-200">{info.replicas.desired} desired</span>
                      <span className="text-slate-600 mx-2">·</span>
                      <span className="text-emerald-400">{info.replicas.ready} ready</span>
                      <span className="text-slate-600 mx-2">·</span>
                      <span className={info.replicas.unavailable > 0 ? "text-red-400" : "text-slate-500"}>
                        {info.replicas.unavailable} unavailable
                      </span>
                    </span>
                  ) : null}
                </Row>
              )}

              <Row label="Containers">
                {infoLoading ? <Skeleton /> : info.containers.length === 0 ? "—" : (
                  <div className="flex flex-col gap-2">
                    {info.containers.map((c) => (
                      <div key={c.name} className="flex flex-col gap-0.5">
                        <span className="text-slate-200 font-medium text-xs">{c.name}</span>
                        <span className="text-slate-500 font-mono text-[11px] break-all">{c.image}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Row>

              <Row label="Labels">
                {infoLoading ? <Skeleton /> : Object.keys(info.labels).length === 0 ? "—" : (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(info.labels).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-[11px] text-slate-300 font-mono"
                      >
                        <span className="text-slate-500">{k}:</span>
                        <span>{v}</span>
                      </span>
                    ))}
                  </div>
                )}
              </Row>
            </div>
          </Section>

          {/* ── Revisions ── */}
          {(revisionsLoading || revisions.length > 0) && (
            <Section title="Active Revisions">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {revisionsLoading ? (
                  <LoadingRow text="Loading revisions…" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-120">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900">
                        <Th>Revision</Th>
                        <Th>Name</Th>
                        <Th>Pods</Th>
                        <Th>Images</Th>
                        <Th>Created</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {revisions.map((rev, i) => (
                        <tr
                          key={rev.name}
                          className={cn("border-b border-slate-800/60", i % 2 === 1 && "bg-slate-900/30")}
                        >
                          <td className="px-4 py-3">
                            <span className={cn("font-mono font-bold text-sm", rev.isActive ? "text-orange-400" : "text-slate-500")}>
                              #{rev.revision}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300 text-xs max-w-52 truncate">{rev.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-300 text-xs whitespace-nowrap">
                            {rev.podsTotal > 0 ? `${rev.podsRunning}/${rev.podsTotal}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {rev.images.length === 0 ? (
                              <span className="text-slate-600 text-xs">—</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {rev.images.map((img, idx) => (
                                  <span key={idx} className="font-mono text-[11px] text-slate-400 break-all">{img}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{relativeAge(rev.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── Pods ── */}
          <Section title={`Managed Pods${!podsLoading ? ` (${pods.length})` : ""}`}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {podsLoading ? (
                <LoadingRow text="Loading pods…" />
              ) : pods.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-600 text-sm">No pods found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-120">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900">
                      <Th>Pod Name</Th>
                      <Th>Status</Th>
                      <Th>Ready</Th>
                      <Th>Restarts</Th>
                      <Th>Node</Th>
                      <Th>Age</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pods.map((pod, i) => (
                      <tr
                        key={pod.name}
                        className={cn(
                          "border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors",
                          i % 2 === 1 && "bg-slate-900/30"
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-slate-200 text-xs max-w-72 truncate">{pod.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><PhaseBadge phase={pod.phase} /></td>
                        <td className="px-4 py-3 font-mono text-slate-300 text-xs whitespace-nowrap">{pod.ready}/{pod.total}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn("font-mono text-xs", pod.restarts > 0 ? "text-amber-400" : "text-slate-400")}>
                            {pod.restarts}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-36 truncate">{pod.nodeName}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{relativeAge(pod.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Small helpers
// ──────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:gap-6 gap-1 text-sm">
      <span className="sm:w-28 shrink-0 text-slate-500 text-xs sm:pt-0.5">{label}</span>
      <div className="text-slate-300 min-w-0 flex-1 wrap-break-word">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 whitespace-nowrap">{children}</th>
  );
}

function Skeleton() {
  return <span className="inline-block h-3 w-36 bg-slate-800 rounded animate-pulse" />;
}

function LoadingRow({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-500 text-sm gap-2">
      <div className="w-4 h-4 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin" />
      {text}
    </div>
  );
}
