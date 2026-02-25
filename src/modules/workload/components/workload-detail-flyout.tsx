"use client";

import { useEffect, useState, useCallback } from "react";
import {
    X,
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
import type { Workload, WorkloadStatus, WorkloadType } from "../api/workloads.api";

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

// ──────────────────────────────────────────────
// Sparkline SVG
// ──────────────────────────────────────────────

interface SparklineProps {
  data: MetricPoint[];
  color?: string;
  height?: number;
}

function Sparkline({ data, color = "#f97316", height = 48 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-600"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const W = 300;
  const H = height;
  const PAD = 4;
  const minV = Math.min(...data.map((d) => d.value));
  const maxV = Math.max(...data.map((d) => d.value));
  const rangeV = maxV - minV || 1;
  const minT = data[0].time;
  const maxT = data[data.length - 1].time;
  const rangeT = maxT - minT || 1;

  const toX = (t: number) => PAD + ((t - minT) / rangeT) * (W - PAD * 2);
  const toY = (v: number) => H - PAD - ((v - minV) / rangeV) * (H - PAD * 2);

  const points = data.map((d) => `${toX(d.time)},${toY(d.value)}`).join(" ");

  // fill area under curve
  const fillPts = [
    `${toX(data[0].time)},${H - PAD}`,
    ...data.map((d) => `${toX(d.time)},${toY(d.value)}`),
    `${toX(data[data.length - 1].time)},${H - PAD}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPts}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Metric Card
// ──────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  data: MetricPoint[];
  format: (v: number) => string;
  color: string;
  loading: boolean;
}

function MetricCard({ title, icon, data, format, color, loading }: MetricCardProps) {
  const latest = data.length > 0 ? data[data.length - 1].value : null;
  const max = data.length > 0 ? Math.max(...data.map((d) => d.value)) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {icon}
          <span>{title}</span>
        </div>
        {loading ? (
          <div className="w-3 h-3 border border-slate-600 border-t-orange-500 rounded-full animate-spin" />
        ) : latest !== null ? (
          <span className="text-sm font-mono font-medium text-slate-100">
            {format(latest)}
          </span>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </div>

      <div className="relative">
        {loading ? (
          <div className="h-12 flex items-center justify-center">
            <span className="text-xs text-slate-600">Loading…</span>
          </div>
        ) : (
          <Sparkline data={data} color={color} height={48} />
        )}
      </div>

      {!loading && max !== null && (
        <div className="text-xs text-slate-600">
          Max: <span className="text-slate-500">{format(max)}</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Status helpers
// ──────────────────────────────────────────────

const PHASE_CONFIG: Record<string, { icon: React.ReactNode; className: string }> = {
  Running: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "text-emerald-400" },
  Succeeded: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "text-emerald-400" },
  Pending: { icon: <AlertTriangle className="w-3.5 h-3.5" />, className: "text-amber-400" },
  Failed: { icon: <XCircle className="w-3.5 h-3.5" />, className: "text-red-400" },
  Unknown: { icon: <HelpCircle className="w-3.5 h-3.5" />, className: "text-slate-400" },
};

const STATUS_CONFIG: Record<WorkloadStatus, { icon: React.ReactNode; className: string; label: string }> = {
  OK: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "text-emerald-400", label: "OK" },
  Warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, className: "text-amber-400", label: "Warning" },
  Error: { icon: <XCircle className="w-3.5 h-3.5" />, className: "text-red-400", label: "Error" },
  Unknown: { icon: <HelpCircle className="w-3.5 h-3.5" />, className: "text-slate-400", label: "Unknown" },
};

const TYPE_COLORS: Record<WorkloadType, string> = {
  Deployment: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  StatefulSet: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  DaemonSet: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  Pod: "text-orange-300 bg-orange-500/10 border-orange-500/20",
};

function PhaseBadge({ phase }: { phase: string }) {
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.Unknown;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.className)}>
      {cfg.icon}
      {phase}
    </span>
  );
}

// ──────────────────────────────────────────────
// Pods table
// ──────────────────────────────────────────────

function PodsTable({ pods, loading }: { pods: PodDetail[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-500 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-slate-600 border-t-orange-500 rounded-full animate-spin" />
          Loading pods…
        </div>
      </div>
    );
  }

  if (pods.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-600 text-xs">
        No pods found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Pod Name</th>
            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Status</th>
            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Ready</th>
            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Restarts</th>
            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Node</th>
            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Age</th>
          </tr>
        </thead>
        <tbody>
          {pods.map((pod, i) => (
            <tr
              key={pod.name}
              className={cn(
                "border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors",
                i % 2 === 1 && "bg-slate-900/20"
              )}
            >
              <td className="px-3 py-2 font-mono text-slate-200 max-w-55 truncate">
                {pod.name}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <PhaseBadge phase={pod.phase} />
              </td>
              <td className="px-3 py-2 text-slate-300 font-mono whitespace-nowrap">
                {pod.ready}/{pod.total}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={cn("font-mono", pod.restarts > 0 ? "text-amber-400" : "text-slate-400")}>
                  {pod.restarts}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-400 max-w-35 truncate">{pod.nodeName}</td>
              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{relativeAge(pod.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Flyout
// ──────────────────────────────────────────────

interface WorkloadDetailFlyoutProps {
  workload: Workload | null;
  onClose: () => void;
}

const EMPTY_METRICS: WorkloadMetrics = { cpu: [], memory: [], disk: [] };
const EMPTY_INFO: WorkloadInfo = { labels: {}, createdAt: "", containers: [] };

export function WorkloadDetailFlyout({ workload, onClose }: WorkloadDetailFlyoutProps) {
  const [pods, setPods] = useState<PodDetail[]>([]);
  const [metrics, setMetrics] = useState<WorkloadMetrics>(EMPTY_METRICS);
  const [info, setInfo] = useState<WorkloadInfo>(EMPTY_INFO);
  const [revisions, setRevisions] = useState<RevisionInfo[]>([]);
  const [podsLoading, setPodsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  const fetchAll = useCallback(async (w: Workload) => {
    setPods([]);
    setMetrics(EMPTY_METRICS);
    setInfo(EMPTY_INFO);
    setRevisions([]);
    setPodsLoading(true);
    setMetricsLoading(true);
    setInfoLoading(true);
    setRevisionsLoading(true);

    workloadDetailApi
      .getWorkloadInfo(w.namespace, w.name, w.type)
      .then(setInfo)
      .catch(() => setInfo(EMPTY_INFO))
      .finally(() => setInfoLoading(false));

    workloadDetailApi
      .getRevisions(w.namespace, w.name, w.type)
      .then(setRevisions)
      .catch(() => setRevisions([]))
      .finally(() => setRevisionsLoading(false));

    workloadDetailApi
      .getPods(w.namespace, w.name, w.type)
      .then(setPods)
      .catch(() => setPods([]))
      .finally(() => setPodsLoading(false));

    workloadDetailApi
      .getMetrics(w.namespace, w.name)
      .then(setMetrics)
      .catch(() => setMetrics(EMPTY_METRICS))
      .finally(() => setMetricsLoading(false));
  }, []);

  useEffect(() => {
    if (!workload) return;
    const id = setTimeout(() => fetchAll(workload), 0);
    return () => clearTimeout(id);
  }, [workload, fetchAll]);

  // Trap Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isOpen = !!workload;
  const statusCfg = workload ? STATUS_CONFIG[workload.status] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full z-40 w-160 max-w-full bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {workload && (
          <>
            {/* ── Header ── */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border shrink-0",
                      TYPE_COLORS[workload.type]
                    )}
                  >
                    {workload.type}
                  </span>
                  {statusCfg && (
                    <span className={cn("flex items-center gap-1 text-xs font-medium shrink-0", statusCfg.className)}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold text-slate-100 font-mono truncate">
                  {workload.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Namespace: <span className="text-slate-400">{workload.namespace}</span>
                  <span className="mx-2 text-slate-700">·</span>
                  Pods:{" "}
                  <span className="text-slate-400">
                    {workload.podsReady}/{workload.podsDesired}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fetchAll(workload)}
                  disabled={podsLoading || metricsLoading || infoLoading || revisionsLoading}
                  title="Refresh"
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw
                    className={cn(
                      "w-4 h-4",
                      (podsLoading || metricsLoading || infoLoading || revisionsLoading) && "animate-spin"
                    )}
                  />
                </button>
                <button
                  onClick={onClose}
                  title="Close"
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">

              {/* ── Details ── */}
              <section>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Details</h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800">
                  {/* Namespace */}
                  <div className="px-4 py-2.5 flex gap-4 text-xs">
                    <span className="w-32 shrink-0 text-slate-500">Namespace</span>
                    <span className="text-slate-200">{workload.namespace}</span>
                  </div>

                  {/* Created */}
                  <div className="px-4 py-2.5 flex gap-4 text-xs">
                    <span className="w-32 shrink-0 text-slate-500">Created</span>
                    <span className="text-slate-200">
                      {infoLoading
                        ? "—"
                        : info.createdAt
                        ? new Date(info.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  {/* Replicas */}
                  {(infoLoading || info.replicas) && (
                    <div className="px-4 py-2.5 flex gap-4 text-xs">
                      <span className="w-32 shrink-0 text-slate-500">Replicas</span>
                      {infoLoading ? (
                        <span className="text-slate-600">Loading…</span>
                      ) : info.replicas ? (
                        <span className="text-slate-200">
                          {info.replicas.desired} desired
                          {" · "}
                          <span className="text-emerald-400">{info.replicas.ready} ready</span>
                          {" · "}
                          <span className={info.replicas.unavailable > 0 ? "text-red-400" : "text-slate-400"}>
                            {info.replicas.unavailable} unavailable
                          </span>
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Containers */}
                  <div className="px-4 py-2.5 flex gap-4 text-xs">
                    <span className="w-32 shrink-0 text-slate-500">Containers</span>
                    {infoLoading ? (
                      <span className="text-slate-600">Loading…</span>
                    ) : (
                      <div className="flex flex-col gap-1.5 min-w-0">
                        {info.containers.length === 0 ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          info.containers.map((c) => (
                            <div key={c.name} className="flex flex-col gap-0.5">
                              <span className="text-slate-200 font-medium">{c.name}</span>
                              <span className="text-slate-500 font-mono text-[10px] break-all">{c.image}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Labels */}
                  <div className="px-4 py-2.5 flex gap-4 text-xs">
                    <span className="w-32 shrink-0 text-slate-500">Labels</span>
                    {infoLoading ? (
                      <span className="text-slate-600">Loading…</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(info.labels).length === 0 ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          Object.entries(info.labels).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-[10px] text-slate-300 font-mono"
                            >
                              <span className="text-slate-500">{k}:</span>
                              <span>{v}</span>
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Revisions ── */}
              {(revisionsLoading || revisions.length > 0) && (
                <section>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Active Revisions
                  </h3>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    {revisionsLoading ? (
                      <div className="flex items-center justify-center py-6 text-slate-500 text-xs gap-2">
                        <div className="w-4 h-4 border border-slate-600 border-t-orange-500 rounded-full animate-spin" />
                        Loading revisions…
                      </div>
                    ) : (
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Revision</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Name</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Pods</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Images</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-400 whitespace-nowrap">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revisions.map((rev, i) => (
                            <tr
                              key={rev.name}
                              className={cn(
                                "border-b border-slate-800/60 transition-colors",
                                i % 2 === 1 && "bg-slate-900/20"
                              )}
                            >
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={cn(
                                  "font-mono font-semibold",
                                  rev.isActive ? "text-orange-400" : "text-slate-500"
                                )}>
                                  #{rev.revision}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-300 max-w-40 truncate">
                                {rev.name}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-300 whitespace-nowrap">
                                {rev.podsTotal > 0 ? `${rev.podsRunning}/${rev.podsTotal}` : "—"}
                              </td>
                              <td className="px-3 py-2 text-slate-400">
                                {rev.images.length === 0 ? (
                                  <span className="text-slate-600">—</span>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    {rev.images.map((img, idx) => (
                                      <span key={idx} className="font-mono text-[10px] text-slate-400 break-all">
                                        {img}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                                {relativeAge(rev.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              )}

              {/* ── Metrics ── */}
              <section>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Metrics — last 1 hour
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    title="CPU"
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    data={metrics.cpu}
                    format={formatCpu}
                    color="#f97316"
                    loading={metricsLoading}
                  />
                  <MetricCard
                    title="Memory"
                    icon={<MemoryStick className="w-3.5 h-3.5" />}
                    data={metrics.memory}
                    format={formatBytes}
                    color="#3b82f6"
                    loading={metricsLoading}
                  />
                  <MetricCard
                    title="Disk"
                    icon={<HardDrive className="w-3.5 h-3.5" />}
                    data={metrics.disk}
                    format={formatBytes}
                    color="#8b5cf6"
                    loading={metricsLoading}
                  />
                </div>
              </section>

              {/* ── Pods ── */}
              <section>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Managed Pods{" "}
                  {!podsLoading && (
                    <span className="normal-case font-normal text-slate-600">
                      ({pods.length})
                    </span>
                  )}
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                  <PodsTable pods={pods} loading={podsLoading} />
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
