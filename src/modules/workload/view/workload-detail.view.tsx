"use client";

import { useState, useMemo } from "react";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { keepPreviousData } from "@tanstack/react-query";
import {
  type MetricPoint,
  type ResourceLimits,
} from "../api/workload-detail.api";
import type { WorkloadStatus, WorkloadType } from "../api/workloads.api";
import {
  useWorkloadInfo,
  useWorkloadPods,
  useWorkloadRevisions,
  useResourceLimits,
  useWorkloadMetrics,
} from "../hooks/use-workload-detail";
import { REFRESH_OPTIONS } from "@/modules/dashboard/components/overview-types";
import {
  AdvancedTimeRangeSelector,
  type TimeRangeValue,
} from "@/components/ui/advanced-time-selector";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { translations } from "@/locales/dict";
import { useLanguage } from "@/context/LanguageContext";
import {
  relativeAge,
  formatCpu,
  formatBytes,
  formatTimeLabel,
  TYPE_COLORS,
  STATUS_CFG,
  PHASE_CFG,
  getTimeParams,
} from "../utils/workload-helpers";

// ──────────────────────────────────────────────
// Reference line type
// ──────────────────────────────────────────────

export interface RefLine {
  value: number;
  label: string;
  color: string;
}

// ──────────────────────────────────────────────
// Metric chart card
// ──────────────────────────────────────────────

function MetricCard({
  title, icon, data, format, color, durationSeconds, refLines,
}: {
  title: string;
  icon: React.ReactNode;
  data: MetricPoint[];
  format: (v: number) => string;
  color: string;
  durationSeconds: number;
  refLines?: RefLine[];
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

  // Compute Y-axis domain so reference lines are always visible
  const dataMax = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;
  const refMax = (refLines ?? []).reduce((m, r) => Math.max(m, r.value), 0);
  const yMax = Math.max(dataMax, refMax) * 1.1 || undefined; // 10% padding above highest line

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {latest !== null ? (
          <span className="text-2xl font-mono font-bold text-slate-100">{format(latest)}</span>
        ) : (
          <span className="text-sm text-slate-600">—</span>
        )}
      </div>

      {/* Chart */}
      <div className="h-44">
        {data.length < 2 ? (
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
                domain={[0, yMax ?? "auto"]}
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
              {(refLines ?? []).map((rl) => (
                <ReferenceLine
                  key={rl.label}
                  y={rl.value}
                  stroke={rl.color}
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                  label={{
                    value: `${rl.label}: ${format(rl.value)}`,
                    position: "insideTopRight",
                    fill: rl.color,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer stats */}
      {(max !== null || avg !== null) && (
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
// Badges (using shared configs)
// ──────────────────────────────────────────────

const PHASE_ICONS: Record<string, React.ReactNode> = {
  Running:   <CheckCircle2 className="w-3.5 h-3.5" />,
  Succeeded: <CheckCircle2 className="w-3.5 h-3.5" />,
  Completed: <CheckCircle2 className="w-3.5 h-3.5" />,
  Pending:   <AlertTriangle className="w-3.5 h-3.5" />,
  Failed:    <XCircle className="w-3.5 h-3.5" />,
  Unknown:   <HelpCircle className="w-3.5 h-3.5" />,
};

const STATUS_ICONS: Record<WorkloadStatus, React.ReactNode> = {
  OK:      <CheckCircle2 className="w-4 h-4" />,
  Warning: <AlertTriangle className="w-4 h-4" />,
  Error:   <XCircle className="w-4 h-4" />,
  Unknown: <HelpCircle className="w-4 h-4" />,
};

function PhaseBadge({ phase }: { phase: string }) {
  const cfg = PHASE_CFG[phase] ?? PHASE_CFG.Unknown;
  const icon = PHASE_ICONS[phase] ?? PHASE_ICONS.Unknown;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.cls)}>
      {icon}{phase}
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

const EMPTY_LIMITS: ResourceLimits = {};

// ──────────────────────────────────────────────
// Main page view
// ──────────────────────────────────────────────

export default function WorkloadDetailView({ namespace, type, name }: WorkloadDetailViewProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const t =
    translations.workloads[language as keyof typeof translations.workloads] ||
    translations.workloads.EN;
  const timePicker =
    translations.timePicker[language as keyof typeof translations.timePicker] ||
    translations.timePicker.EN;

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "1h",
    label: "Last 1 hour",
  });

  // ── Derive time params (memoised to stabilise query keys) ──
  const timeParams = useMemo(() => getTimeParams(timeRange), [timeRange]);

  // ── Auto-refresh interval ──
  const [refreshInterval, setRefreshInterval] = useState(30_000);
  const activeRefetchInterval = refreshInterval > 0 ? refreshInterval : false as const;

  // ── TanStack Query hooks ──
  const keepPrev = { placeholderData: keepPreviousData };

  const {
    data: info = { labels: {}, createdAt: "", containers: [] },
    isLoading: infoLoading,
    refetch: refetchInfo,
    dataUpdatedAt: infoUpdatedAt,
  } = useWorkloadInfo(namespace, name, type, { refetchInterval: activeRefetchInterval, ...keepPrev });

  const {
    data: pods = [],
    isLoading: podsLoading,
    refetch: refetchPods,
    dataUpdatedAt: podsUpdatedAt,
  } = useWorkloadPods(namespace, name, type, { refetchInterval: activeRefetchInterval, ...keepPrev });

  const {
    data: revisions = [],
    isLoading: revisionsLoading,
    refetch: refetchRevisions,
    dataUpdatedAt: revisionsUpdatedAt,
  } = useWorkloadRevisions(namespace, name, type, { refetchInterval: activeRefetchInterval, ...keepPrev });

  const {
    data: resourceLimits = EMPTY_LIMITS,
  } = useResourceLimits(namespace, name, type, { refetchInterval: activeRefetchInterval, ...keepPrev });

  const {
    data: metrics = { cpu: [], memory: [], disk: [] },
    isLoading: metricsLoading,
    isFetching: metricsFetching,
    refetch: refetchMetrics,
    dataUpdatedAt: metricsUpdatedAt,
  } = useWorkloadMetrics(
    namespace,
    name,
    timeParams.durationSeconds,
    timeParams.step,
    timeParams.start,
    timeParams.end,
    { refetchInterval: activeRefetchInterval, ...keepPrev },
  );

  // Last updated = most recent dataUpdatedAt across all queries
  const latestUpdatedAt = Math.max(infoUpdatedAt, podsUpdatedAt, revisionsUpdatedAt, metricsUpdatedAt);
  const lastUpdated = latestUpdatedAt > 0 ? new Date(latestUpdatedAt) : null;

  const isAnyLoading = podsLoading || metricsLoading || infoLoading || revisionsLoading;
  const isInitialLoad = podsLoading && infoLoading && revisionsLoading && metricsLoading;

  const refetchAll = () => {
    refetchInfo();
    refetchPods();
    refetchRevisions();
    refetchMetrics();
  };

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
  const statusIcon = STATUS_ICONS[derivedStatus];

  // Build reference lines from resource limits
  const cpuRefLines: RefLine[] = [];
  if (resourceLimits.cpuLimit != null) cpuRefLines.push({ value: resourceLimits.cpuLimit, label: "Limit", color: "#ef4444" });
  if (resourceLimits.cpuRequest != null) cpuRefLines.push({ value: resourceLimits.cpuRequest, label: "Request", color: "#eab308" });

  const memoryRefLines: RefLine[] = [];
  if (resourceLimits.memoryLimit != null) memoryRefLines.push({ value: resourceLimits.memoryLimit, label: "Limit", color: "#ef4444" });
  if (resourceLimits.memoryRequest != null) memoryRefLines.push({ value: resourceLimits.memoryRequest, label: "Request", color: "#eab308" });

  if (isInitialLoad) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <span className="text-sm font-medium">{t.detail.loading}</span>
        </div>
      </div>
    );
  }

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
                  {statusIcon}
                  {statusDisplay.label}
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {t.detail.breadcrumb} / 
                <span className="text-slate-300">{namespace}</span>
                 / 
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", TYPE_COLORS[type])}>{type}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastUpdated && (
              <span className="text-xs text-slate-500 hidden md:inline">
                {t.lastUpdated}: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refetchAll}
              disabled={isAnyLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isAnyLoading && "animate-spin")} />
              <span className="hidden sm:inline">{t.refresh}</span>
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-xs bg-slate-800 text-slate-400 pl-2 pr-6 py-1.5 rounded-md border border-slate-700 hover:border-slate-600 focus:border-orange-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 6px center",
              }}
            >
              {REFRESH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === 0 ? (t.refreshOff ?? "Off") : opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">

           {/* ── Metrics ── */}
          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                {t.detail.sections.metrics}
              </h3>
              <div className="w-full sm:w-auto">
                <AdvancedTimeRangeSelector
                  value={timeRange}
                  onChange={setTimeRange}
                  disabled={metricsFetching}
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
                durationSeconds={timeParams.durationSeconds}
                refLines={cpuRefLines.length > 0 ? cpuRefLines : undefined}
              />
              <MetricCard
                title="Memory"
                icon={<MemoryStick className="w-4 h-4" />}
                data={metrics.memory}
                format={formatBytes}
                color="#3b82f6"
                durationSeconds={timeParams.durationSeconds}
                refLines={memoryRefLines.length > 0 ? memoryRefLines : undefined}
              />
              <MetricCard
                title="Disk"
                icon={<HardDrive className="w-4 h-4" />}
                data={metrics.disk}
                format={formatBytes}
                color="#8b5cf6"
                durationSeconds={timeParams.durationSeconds}
              />
            </div>
          </section>

          {/* ── Details ── */}
          <Section title={t.detail.sections.details}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
              <Row label={t.detail.details.namespace}>{namespace}</Row>
              <Row label={t.detail.details.created}>
                {info.createdAt ? new Date(info.createdAt).toLocaleString() : "—"}
              </Row>

              {info.replicas && (
                <Row label={t.detail.details.replicas}>
                  {info.replicas ? (
                    <span>
                      <span className="text-slate-200">{info.replicas.desired} {t.detail.replicas.desired}</span>
                      <span className="text-slate-600 mx-2">·</span>
                      <span className="text-emerald-400">{info.replicas.ready} {t.detail.replicas.ready}</span>
                      <span className="text-slate-600 mx-2">·</span>
                      <span className={info.replicas.unavailable > 0 ? "text-red-400" : "text-slate-500"}>
                        {info.replicas.unavailable} {t.detail.replicas.unavailable}
                      </span>
                    </span>
                  ) : null}
                </Row>
              )}

              <Row label={t.detail.details.containers}>
                {info.containers.length === 0 ? "—" : (
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

              <Row label={t.detail.details.labels}>
                {Object.keys(info.labels).length === 0 ? "—" : (
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
          {revisions.length > 0 && (
            <Section title={t.detail.sections.revisions}>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-120">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900">
                        <Th>{t.detail.revisionColumns.revision}</Th>
                        <Th>{t.detail.revisionColumns.name}</Th>
                        <Th>{t.detail.revisionColumns.pods}</Th>
                        <Th>{t.detail.revisionColumns.images}</Th>
                        <Th>{t.detail.revisionColumns.created}</Th>
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
              </div>
            </Section>
          )}

          {/* ── Pods ── */}
          <Section title={`${t.detail.sections.pods} (${pods.length})`}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {pods.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-600 text-sm">{t.detail.noPodsFound}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-120">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900">
                      <Th>{t.detail.podColumns.name}</Th>
                      <Th>{t.detail.podColumns.status}</Th>
                      <Th>{t.detail.podColumns.ready}</Th>
                      <Th>{t.detail.podColumns.restarts}</Th>
                      <Th>{t.detail.podColumns.node}</Th>
                      <Th>{t.detail.podColumns.age}</Th>
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


