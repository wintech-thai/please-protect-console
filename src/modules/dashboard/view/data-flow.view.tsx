"use client";

import React, { useState, useMemo } from "react";
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
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { useNodes, useNodeRates, useNodeHistory } from "../hooks/use-data-flow";
import type {
  NodeData,
  NodeRates,
  HistoryPoint,
} from "../types/data-flow.types";

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
      {value.toFixed(1)}{" "}
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
            <Tooltip {...TOOLTIP_STYLE} />
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

const DetailsPanel = ({
  node,
  nodeRates,
}: {
  node: NodeData | null;
  nodeRates: NodeRates;
}) => {
  const { language } = useLanguage();
  const t =
    translations.dataFlow[language as keyof typeof translations.dataFlow] ||
    translations.dataFlow.EN;
  const historyData = useNodeHistory(node);

  if (!node) {
    return (
      <div className="min-h-55 md:min-h-75 flex items-center justify-center text-slate-500 border-t border-slate-700 bg-slate-900/50 text-sm">
        {t.details.selectNode}
      </div>
    );
  }

  const hasMetrics = ["Processor", "Topic", "DataStore"].includes(node.type);
  const isInputOnly = node.type === "DataStore";
  const { inputRate = 0, outputRate = 0 } = nodeRates[node.id] ?? {};

  return (
    <div className="border-t border-slate-700 bg-slate-900/50 p-4 md:p-6 animate-in slide-in-from-bottom-10 max-h-[40vh] md:max-h-none overflow-y-auto min-h-[40vh] md:min-h-80">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left — Info & Rates */}
        <div className="w-full md:w-64 space-y-3 md:space-y-4 shrink-0">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-1">
              {node.name}
            </h3>
            <p className="text-xs md:text-sm text-slate-400 truncate">
              {node.tag}
            </p>
          </div>

          {!hasMetrics ? (
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

        {/* Right — Chart */}
        {hasMetrics && (
          <HistoryChart
            data={historyData}
            title={t.details.history}
            showOutput={!isInputOnly}
          />
        )}
      </div>
    </div>
  );
};

const DataFlowViewPage = () => {
  const { language } = useLanguage();
  const t =
    translations.dataFlow[language as keyof typeof translations.dataFlow] ||
    translations.dataFlow.EN;

  const nodes = useNodes(t);
  const [selectedNodeId, setSelectedNodeId] = useState("receiver1");
  const { nodeRates, getConnectionHasData, error, retry } = useNodeRates(nodes);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [selectedNodeId, nodes]
  );

  if (error && Object.keys(nodeRates).length === 0) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <span className="text-sm font-medium">{t.error}</span>
          <button
            onClick={retry}
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
      {/* Header */}
      <div className="p-4 md:p-6 shrink-0">
        <h1 className="text-3xl font-bold text-slate-100 tracking-wide drop-shadow-md">
          {t.title}
        </h1>
        <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
      </div>

      {/* Diagram */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex md:items-center justify-center bg-[url('/grid-pattern.svg')] bg-repeat opacity-90">
        <div className="flex flex-col md:flex-row items-center min-w-max gap-0 py-8 md:py-0">
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
        <DetailsPanel node={selectedNode} nodeRates={nodeRates} />
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
