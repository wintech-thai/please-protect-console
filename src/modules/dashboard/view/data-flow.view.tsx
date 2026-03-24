"use client";

import React, { useState, Suspense } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AlertTriangle, Loader2, Users, BarChart2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import {
  useNodes,
  useNodeRates,
  useNodeHistory,
  useKafkaTopicDetails,
  dataFlowKeys,
  useNetworkInterfaces,
} from "../hooks/use-data-flow";
import { useQueryClient } from "@tanstack/react-query";
import type {
  NodeData,
  NodeRates,
  HistoryPoint,
  KafkaGroupLagSummary,
  KafkaTopicStats,
} from "../types/data-flow.types";
import { useTimeRange } from "@/modules/dashboard/hooks/use-time-range";
import { OverviewHeader } from "@/modules/dashboard/components/overview-header";
import { AdvancedTimeRangeSelector } from "@/components/ui/advanced-time-selector";
import { LANPort } from "@/modules/dashboard/components/lan-port";

const CHART_COLORS = { input: "#34d399", output: "#60a5fa" } as const;
const CHART_AXIS_STYLE = {
  stroke: "#94a3b8",
  fontSize: 10,
  tick: { fontSize: 10 },
} as const;
const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    color: "#f8fafc",
    fontSize: "12px",
    padding: "8px",
  },
  itemStyle: { fontSize: "12px" },
} as const;

const NODE_ICON_STYLES: Record<
  string,
  { bg: string; text: string; selectedBg: string; selectedText: string }
> = {
  Interface: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    selectedBg: "bg-cyan-500",
    selectedText: "text-white",
  },
  Processor: {
    bg: "bg-violet-500/20",
    text: "text-violet-400",
    selectedBg: "bg-violet-500",
    selectedText: "text-white",
  },
  Topic: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    selectedBg: "bg-amber-500",
    selectedText: "text-white",
  },
  DataStore: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    selectedBg: "bg-emerald-500",
    selectedText: "text-white",
  },
};

const DiagramNode = ({
  node,
  isSelected,
  onClick,
}: {
  node: NodeData;
  isSelected: boolean;
  onClick: (node: NodeData) => void;
}) => (
  <div
    onClick={() => onClick(node)}
    className={`
      relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer
      transition-all duration-300 w-32 h-24 md:w-40 md:h-32 shrink-0
      ${
        isSelected
          ? "border-blue-500 bg-blue-50/10 shadow-lg shadow-blue-500/20 scale-105"
          : "border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800"
      }
    `}
  >
    {(() => {
      const style = NODE_ICON_STYLES[node.type] ?? NODE_ICON_STYLES.Processor;
      return (
        <div
          className={`p-2 md:p-3 rounded-full mb-1 md:mb-2 ${
            isSelected
              ? `${style.selectedBg} ${style.selectedText}`
              : `${style.bg} ${style.text}`
          }`}
        >
          <node.icon size={20} className="md:w-6 md:h-6" />
        </div>
      );
    })()}
    <div className="text-center w-full">
      <div className="text-[10px] md:text-xs font-bold text-slate-200 truncate w-full px-1">
        {node.name}
      </div>
      <div className="hidden md:block text-[10px] text-slate-400 truncate w-full px-1 mt-1">
        {node.description}
      </div>
    </div>

    {/* Desktop connector dots */}
    <div className="hidden md:block absolute -right-1.5 top-1/2 w-3 h-3 bg-slate-400 rounded-full -translate-y-1/2 border-2 border-slate-900" />
    <div className="hidden md:block absolute -left-1.5 top-1/2 w-3 h-3 bg-slate-400 rounded-full -translate-y-1/2 border-2 border-slate-900" />
    {/* Mobile connector dots */}
    <div className="md:hidden absolute left-1/2 -bottom-1.5 w-2 h-2 bg-slate-400 rounded-full -translate-x-1/2 border-2 border-slate-900" />
    <div className="md:hidden absolute left-1/2 -top-1.5 w-2 h-2 bg-slate-400 rounded-full -translate-x-1/2 border-2 border-slate-900" />
  </div>
);

const ConnectionLine = ({
  vertical = false,
  hasData = true,
}: {
  vertical?: boolean;
  hasData?: boolean;
}) => {
  const bgColor = hasData ? "bg-slate-700" : "bg-red-500/60";

  if (vertical) {
    return (
      <div
        className={`w-0.5 flex-1 relative my-1 overflow-hidden mx-auto min-h-5 ${bgColor}`}
      >
        {hasData && (
          <div className="absolute inset-x-0 bg-linear-to-b from-transparent via-blue-500 to-transparent w-full h-1/2 animate-flow-vertical" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex-1 h-0.5 relative mx-2 overflow-hidden ${bgColor}`}>
      {hasData && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500 to-transparent w-1/2 h-full animate-flow-horizontal" />
      )}
    </div>
  );
};

const RateCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="p-3 md:p-4 bg-slate-800 rounded-lg border border-slate-700">
    <div className="text-slate-400 text-[10px] md:text-xs uppercase font-bold mb-1">
      {label}
    </div>
    <div className={`text-lg md:text-2xl font-mono ${color}`}>
      {value.toFixed(2)}{" "}
      <span className="text-xs md:text-sm text-slate-500">evt/s</span>
    </div>
  </div>
);

const HistoryChart = ({
  data,
  title,
  showOutput,
}: {
  data: HistoryPoint[];
  title: string;
  showOutput: boolean;
}) => {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 min-h-45 bg-slate-800 rounded-lg border border-slate-700 p-2 md:p-4">
      <h4 className="text-xs md:text-sm text-slate-300 mb-2 md:mb-4 font-medium">
        {title}
      </h4>
      <div className="h-37.5 md:h-50 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" {...CHART_AXIS_STYLE} />
            <YAxis {...CHART_AXIS_STYLE} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(2) : value
              }
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", cursor: "pointer" }}
              onClick={(e) => e?.dataKey && toggleSeries(e.dataKey as string)}
              formatter={(value, entry) => {
                const hidden = hiddenSeries.has(entry.dataKey as string);
                return (
                  <span
                    style={{
                      color: hidden ? "#64748b" : entry.color,
                      textDecoration: hidden ? "line-through" : "none",
                    }}
                  >
                    {value}
                  </span>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="input"
              name="Input"
              stroke={CHART_COLORS.input}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              hide={hiddenSeries.has("input")}
            />
            {showOutput && (
              <Line
                type="monotone"
                dataKey="output"
                name="Output"
                stroke={CHART_COLORS.output}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                hide={hiddenSeries.has("output")}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Kafka Topic Details Panel ────────────────────────────────────────────────

type DetailTranslations = (typeof translations.dataFlow.EN)["details"];

const KafkaTopicPanel = ({
  node,
  t,
  refreshInterval,
}: {
  node: NodeData;
  t: DetailTranslations;
  refreshInterval: number;
}) => {
  const { data, isLoading, isError, refetch, isFetching } =
    useKafkaTopicDetails(node, {
      refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t.loading}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 text-sm p-4">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-red-400">{t.errorLoading}</span>
        <button
          onClick={() => refetch()}
          className="ml-auto flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const topicStats: KafkaTopicStats | null = data?.topicStats ?? null;
  const groupLagSummaries: KafkaGroupLagSummary[] = data?.groupLagSummaries ?? [];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Topic info stats row */}
      {topicStats && (
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 min-w-27.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              {t.partitions}
            </span>
            <span className="text-lg font-mono text-amber-400">
              {topicStats.partitionCount}
            </span>
          </div>
          <div className="flex flex-col bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 min-w-27.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              {t.replicationFactor}
            </span>
            <span className="text-lg font-mono text-amber-400">
              {topicStats.replicationFactor}
            </span>
          </div>
          <div className="flex flex-col bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 min-w-27.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              {t.totalMessages}
            </span>
            <span className="text-lg font-mono text-amber-400">
              {topicStats.totalMessages.toLocaleString()}
            </span>
          </div>
          {/* Partition health badge */}
          <div className="flex flex-col bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 min-w-27.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              {t.partitionHealth}
            </span>
            <span
              className={`text-sm font-semibold ${
                topicStats.hasPartitionError ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {topicStats.hasPartitionError ? t.partitionHealthError : t.partitionHealthOk}
            </span>
          </div>
          {isFetching && (
            <div className="flex items-center self-end pb-3 text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Consumer groups + lag */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            {t.consumerGroups}
            {groupLagSummaries.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                {groupLagSummaries.length}
              </span>
            )}
          </span>
        </div>

        {groupLagSummaries.length === 0 ? (
          <p className="text-slate-500 text-xs italic">{t.noConsumerGroups}</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {groupLagSummaries.map((summary) => (
              <div
                key={summary.group}
                className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              >
                {/* Group name */}
                <span className="font-mono text-xs text-slate-200 truncate flex-1 min-w-0">
                  {summary.group}
                </span>

                {/* Partition count */}
                <div className="shrink-0 flex items-center gap-1 text-slate-400 text-[10px]">
                  <span className="uppercase font-semibold text-slate-500">
                    {t.partitions}:
                  </span>
                  <span>{summary.partitions.length}</span>
                </div>

                {/* Total lag */}
                <div className="shrink-0 flex items-center gap-1 text-[10px]">
                  <BarChart2 className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400 uppercase font-semibold">
                    {t.totalLag}:
                  </span>
                  <span
                    className={
                      summary.totalLag > 0
                        ? "text-red-400 font-semibold"
                        : "text-emerald-400 font-semibold"
                    }
                  >
                    {summary.totalLag.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Details Panel ────────────────────────────────────────────────────────────

const DetailsPanel = ({
  node,
  nodeRates,
  timeRange,
  refreshInterval,
}: {
  node: NodeData | null;
  nodeRates: NodeRates;
  timeRange: import("@/components/ui/advanced-time-selector").TimeRangeValue;
  refreshInterval: number;
}) => {
  const { language } = useLanguage();
  const t =
    translations.dataFlow[language as keyof typeof translations.dataFlow] ||
    translations.dataFlow.EN;
  const { data: historyData = [] } = useNodeHistory(node, timeRange, {
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
  });

  if (!node) {
    return (
      <div className="min-h-55 md:min-h-75 flex items-center justify-center text-slate-500 border-t border-slate-700 bg-slate-900/50 text-sm">
        {t.details.selectNode}
      </div>
    );
  }

  const isTopic = node.type === "Topic";
  const isInterface = node.type === "Interface";
  const hasMetrics = ["Processor", "DataStore"].includes(node.type);
  const isInputOnly = node.type === "DataStore";
  const { inputRate = 0, outputRate = 0 } = nodeRates[node.id] ?? {};

  return (
    <div className="border-t border-slate-700 bg-slate-900/50 p-4 md:p-6 animate-in slide-in-from-bottom-10 max-h-[40vh] overflow-y-auto min-h-[40vh] md:min-h-80">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left — Info */}
        {!isInterface && (
          <div className={cn(
            "w-full md:w-64 space-y-3 md:space-y-4 shrink-0",
          )}>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-1">
                {node.name}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 truncate">
                {node.tag}
              </p>
            </div>

            {isTopic || isInterface ? null : !hasMetrics ? (
              <div className="p-4 bg-slate-800 rounded-lg text-slate-400 text-sm">
                {t.details.noMetrics}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                <RateCard
                  label={t.details.inputRate}
                  value={inputRate}
                  color="text-emerald-400"
                />
                {!isInputOnly && (
                  <RateCard
                    label={t.details.outputRate}
                    value={outputRate}
                    color="text-blue-400"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Right — Kafka panel OR throughput chart OR Network Interface */}
        <div className="flex-1 min-w-0">
          {isTopic ? (
            <KafkaTopicPanel
              node={node}
              t={t.details}
              refreshInterval={refreshInterval}
            />
          ) : node.type === "Interface" ? (
            <NetworkInterfaceSlots t={t as Omit<DataFlowTranslations, "timePicker">} />
          ) : hasMetrics ? (
            <HistoryChart
              data={historyData}
              title={t.details.history}
              showOutput={!isInputOnly}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Network Interface Slots ──────────────────────────────────────────────────

import type { DataFlowTranslations } from "../types/data-flow.types";
import { cn } from "@/lib/utils";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatNumber = (num: number) => {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

const NetworkInterfaceSlots = ({ t }: { t: Omit<DataFlowTranslations, "timePicker"> }) => {
  const { data: interfaces = [], isLoading } = useNetworkInterfaces();

  // Fix exactly 4 slots representing LAN 1 to LAN 4
  const slots = Array.from({ length: 4 }).map((_, idx) => interfaces[idx] || null);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-4 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        {t.loading}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Switch Panel Box */}
      <div className="bg-slate-800 rounded-lg p-4 border-b-4 border-r-4 border-slate-900 shadow-xl w-full flex-1">
        <div className="text-[10px] text-slate-400 font-mono tracking-widest mb-1 px-2">
          <span>NETWORK SWITCH 4-PORT GIGABIT</span>
        </div>

        <div className="flex flex-col md:flex-row overflow-scroll gap-2 justify-start items-stretch pb-2 custom-scrollbar">
          {slots.map((iface, idx) => {
            const isEmpty = !iface;
            const isEnabled = iface?.isEnabled ?? false;

            return (
              <div key={idx} className="flex flex-row items-center bg-slate-900/40 rounded-lg p-3 md:p-4 border border-slate-700/50 shrink-0 gap-4 min-w-75 md:min-w-85">
                {/* Left: Port */}
                <div className="shrink-0">
                  <LANPort
                    label={`LAN ${idx + 1}`}
                    state={isEmpty ? "empty" : isEnabled ? "connected_active" : "connected_idle"}
                  />
                </div>

                {/* Right: Info */}
                <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
                  {isEmpty ? (
                     <div className="h-full w-full text-center bg-slate-900/50 rounded p-2 text-slate-600 text-[10px] border border-dashed border-slate-700 font-mono flex items-center justify-center min-h-27.5">
                       {t.networkInterfaces?.noInterface ?? "NO INTERFACE"}
                     </div>
                  ) : (
                    <div className="flex flex-col bg-slate-900 rounded p-3 text-slate-300 w-full border border-slate-700 h-full min-h-27.5 justify-between shadow-md">
                      <div className="flex items-start justify-between mb-2 gap-1.5">
                        <div className="font-bold text-sm text-white truncate flex-1 min-w-0 leading-none pt-0.5">
                          {iface.name}
                        </div>
                        <span className={`shrink-0 whitespace-nowrap inline-block text-[10px] px-2 py-1 leading-none rounded-full font-bold tracking-wider uppercase ${iface.isEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                          {iface.isEnabled ? (t.networkInterfaces?.enabled ?? "Enabled") : (t.networkInterfaces?.disabled ?? "Disabled")}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 text-[9px] font-mono text-slate-400 mt-1 mb-2">
                        <div className="truncate text-slate-300">{iface.ipAddress !== "N/A" ? iface.ipAddress : "No IP"}</div>
                        <div className="truncate opacity-60 text-[8px] shrink-0">{iface.macAddress !== "N/A" ? iface.macAddress : ""}</div>
                      </div>

                      {iface.stats ? (
                        <div className="mt-auto pt-2 border-t border-slate-800 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] w-full">
                          <div className="flex flex-col">
                            <span className="text-slate-500 whitespace-nowrap">Rx Data</span>
                            <span className="text-emerald-400 font-mono">{formatBytes(iface.stats.rxBytes)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500 whitespace-nowrap">Tx Data</span>
                            <span className="text-blue-400 font-mono">{formatBytes(iface.stats.txBytes)}</span>
                          </div>
                          <div className="flex flex-col mt-1">
                            <span className="text-slate-500 whitespace-nowrap">Rx Pkts</span>
                            <span className="text-emerald-400/80 font-mono">{formatNumber(iface.stats.rxPackets)}</span>
                          </div>
                          <div className="flex flex-col mt-1">
                            <span className="text-slate-500 whitespace-nowrap">Tx Pkts</span>
                            <span className="text-blue-400/80 font-mono">{formatNumber(iface.stats.txPackets)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto pt-2 border-t border-slate-800 text-[9px] text-slate-500 italic text-center">
                          No traffic metrics
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
// ─── Page shell ───────────────────────────────────────────────────────────────


const DataFlowViewPage = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
        </div>
      }
    >
      <DataFlowContent />
    </Suspense>
  );
};

const DataFlowContent = () => {
  const { language } = useLanguage();
  const t =
    translations.dataFlow[language as keyof typeof translations.dataFlow] ||
    translations.dataFlow.EN;
  const tTimePicker = translations.timePicker[language as keyof typeof translations.timePicker ?? "EN"]

  const { timeRange, setTimeRange, isRelative } = useTimeRange();

  const [refreshInterval, setRefreshInterval] = useState(20_000);
  const activeRefetchInterval =
    isRelative && refreshInterval > 0 ? refreshInterval : (false as const);

  const queryClient = useQueryClient();
  const nodes = useNodes({
    ...t,
    timePicker: tTimePicker
  } as DataFlowTranslations);
  const [selectedNodeId, setSelectedNodeId] = useState("receiver1");
  const {
    nodeRates,
    getConnectionHasData,
    loading,
    isFetching,
    error,
    lastUpdated,
  } = useNodeRates(nodes, timeRange, {
    refetchInterval: activeRefetchInterval,
  });

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: dataFlowKeys.all });
  };

  if (error && Object.keys(nodeRates).length === 0) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <span className="text-sm font-medium">{t.error}</span>
          <button
            onClick={refetchAll}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors border border-slate-700"
          >
            {t.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full text-slate-200 overflow-hidden">
      {/* Header + Time Selector */}
      <div className="shrink-0 flex flex-col gap-4 pt-6 px-4 md:px-12 pb-10">
        <OverviewHeader
          title={t.title}
          subtitle={t.subtitle}
          lastUpdatedLabel={t.lastUpdated}
          lastUpdated={lastUpdated}
          loading={loading || isFetching}
          refreshInterval={refreshInterval}
          language={language}
          refreshLabel={t.refresh}
          refreshOff={t.refreshOff}
          onRefresh={refetchAll}
          onIntervalChange={setRefreshInterval}
        />
        <div className="flex justify-end">
          <AdvancedTimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            disabled={loading || isFetching}
          />
        </div>
      </div>

      {/* Diagram */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex bg-[url('/grid-pattern.svg')] bg-repeat opacity-90">
        <div className="m-auto flex flex-col md:flex-row items-center min-w-max gap-0 py-8 md:py-0">
          {nodes.map((node, i) => (
            <React.Fragment key={node.id}>
              <DiagramNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={(n) => setSelectedNodeId(n.id)}
              />
              {i < nodes.length - 1 && (
                <div className="h-8 w-px md:w-16 md:h-px">
                  <div className="hidden md:block w-full h-full">
                    <ConnectionLine hasData={getConnectionHasData(i)} />
                  </div>
                  <div className="md:hidden w-full h-full">
                    <ConnectionLine
                      vertical
                      hasData={getConnectionHasData(i)}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="shrink-0 z-10 bg-slate-950">
        <DetailsPanel
          node={selectedNode}
          nodeRates={nodeRates}
          timeRange={timeRange}
          refreshInterval={isRelative ? refreshInterval : 0}
        />
      </div>

      <style jsx global>{`
        @keyframes flow-horizontal {
          0% {
            left: -50%;
          }
          100% {
            left: 100%;
          }
        }
        @keyframes flow-vertical {
          0% {
            top: -50%;
          }
          100% {
            top: 100%;
          }
        }
        .animate-flow-horizontal {
          animation: flow-horizontal 2s linear infinite;
        }
        .animate-flow-vertical {
          animation: flow-vertical 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DataFlowViewPage;
