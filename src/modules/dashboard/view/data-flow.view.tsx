"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Activity, Server, Database, Cpu, Router } from "lucide-react";
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
import { prometheusApi } from "../api/prometheus.api";
import dayjs from "dayjs";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

type NodeType = "Interface" | "Processor" | "Topic" | "DataStore";

interface NodeData {
  id: string;
  name: string;
  description: string;
  type: NodeType;
  tag?: string;
  icon: React.ElementType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useNodes = (t: any) => useMemo<NodeData[]>(() => [
  {
    id: "interface1",
    name: t.nodes.interface,
    description: t.nodes.interfaceDesc.replace("{tag}", "enp2s0"),
    type: "Interface",
    tag: "enp2s0",
    icon: Router,
  },
  {
    id: "receiver1",
    name: t.nodes.receiver,
    description: t.nodes.receiverDesc,
    type: "Processor",
    tag: "logstash-beat-receiver",
    icon: Server,
  },
  {
    id: "topic1",
    name: t.nodes.topicRaw,
    description: t.nodes.topicRawDesc.replace("{tag}", "received-topic-beat"),
    type: "Topic",
    tag: "received-topic-beat",
    icon: Activity,
  },
  {
    id: "transformer1",
    name: t.nodes.transformer,
    description: t.nodes.transformerDesc,
    type: "Processor",
    tag: "logstash-transformer",
    icon: Cpu,
  },
  {
    id: "topic2",
    name: t.nodes.topicTransformed,
    description: t.nodes.topicTransformedDesc.replace("{tag}", "transformed-topic-beat"),
    type: "Topic",
    tag: "transformed-topic-beat",
    icon: Activity,
  },
  {
    id: "dispatcher1",
    name: t.nodes.dispatcher,
    description: t.nodes.dispatcherDesc,
    type: "Processor",
    tag: "logstash-dispatcher-es",
    icon: Server,
  },
  {
    id: "datastore1",
    name: t.nodes.storage,
    description: t.nodes.storageDesc,
    type: "DataStore",
    tag: "elasticsearch",
    icon: Database,
  },
], [t]);

const DiagramNode = ({
  node,
  isSelected,
  onClick,
}: {
  node: NodeData;
  isSelected?: boolean;
  onClick: (node: NodeData) => void;
}) => {
  return (
    <div
      onClick={() => onClick(node)}
      className={`
        relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 w-32 h-24 md:w-40 md:h-32 shrink-0
        ${
          isSelected
            ? "border-blue-500 bg-blue-50/10 shadow-lg shadow-blue-500/20 scale-105"
            : "border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800"
        }
      `}
    >
      <div
        className={`p-2 md:p-3 rounded-full mb-1 md:mb-2 ${isSelected ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"}`}
      >
        <node.icon size={20} className="md:w-6 md:h-6" />
      </div>
      <div className="text-center w-full">
        <div className="text-[10px] md:text-xs font-bold text-slate-200 truncate w-full px-1">
          {node.name}
        </div>
        <div className="hidden md:block text-[10px] text-slate-400 truncate w-full px-1 mt-1">
          {node.description}
        </div>
      </div>

      {/* Connector dots - Horizontal (Desktop) */}
      <div className="hidden md:block absolute -right-1.5 top-1/2 w-3 h-3 bg-slate-400 rounded-full transform -translate-y-1/2 border-2 border-slate-900" />
      <div className="hidden md:block absolute -left-1.5 top-1/2 w-3 h-3 bg-slate-400 rounded-full transform -translate-y-1/2 border-2 border-slate-900" />

      {/* Connector dots - Vertical (Mobile) */}
      <div className="md:hidden absolute left-1/2 -bottom-1.5 w-2 h-2 bg-slate-400 rounded-full transform -translate-x-1/2 border-2 border-slate-900" />
      <div className="md:hidden absolute left-1/2 -top-1.5 w-2 h-2 bg-slate-400 rounded-full transform -translate-x-1/2 border-2 border-slate-900" />
    </div>
  );
};

const ConnectionLine = ({ vertical = false }: { vertical?: boolean }) => {
  if (vertical) {
    return (
      <div className="w-0.5 flex-1 bg-slate-700 relative my-1 overflow-hidden mx-auto min-h-5">
        <div className="absolute inset-x-0 bg-linear-to-b from-transparent via-blue-500 to-transparent w-full h-1/2 animate-flow-vertical" />
      </div>
    );
  }
  return (
    <div className="flex-1 h-0.5 bg-slate-700 relative mx-2 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500 to-transparent w-1/2 h-full animate-flow-horizontal" />
    </div>
  );
};

const DetailsPanel = ({ node }: { node: NodeData | null }) => {
  const { language } = useLanguage();
  const t = translations.dataFlow[language as keyof typeof translations.dataFlow] || translations.dataFlow.EN;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [currentInputRate, setCurrentInputRate] = useState<number>(0);
  const [currentOutputRate, setCurrentOutputRate] = useState<number>(0);

  useEffect(() => {
    if (!node) return;

    const fetchData = async () => {
      const end = dayjs().unix();
      const start = dayjs().subtract(30, "minute").unix();
      const step = 60; // 1 point per minute

      try {
        let inputQuery = "";
        let outputQuery = "";

        if (node.type === "Processor") {
          // Logstash
          inputQuery = `sum(rate(logstash_node_pipeline_events_in_total{job="${node.tag}"}[1m]))`;
          outputQuery = `sum(rate(logstash_node_pipeline_events_out_total{job="${node.tag}"}[1m]))`;
        } else if (node.type === "Topic") {
          // Kafka
          inputQuery = `sum(rate(kafka_server_brokertopicmetrics_messagesinpersec_count{topic="${node.tag}"}[1m]))`;
          outputQuery = `sum(rate(kafka_server_brokertopicmetrics_messagesinpersec_count{topic="${node.tag}"}[1m]))`; // Approximation
        }

        if (inputQuery && outputQuery) {
          // Fetch History
          const [inHist, outHist] = await Promise.all([
            prometheusApi.getGenericHistory(inputQuery, start, end, step),
            prometheusApi.getGenericHistory(outputQuery, start, end, step),
          ]);

          // Fetch Current
          const [inCurr, outCurr] = await Promise.all([
            prometheusApi.getGenericRate(inputQuery),
            prometheusApi.getGenericRate(outputQuery),
          ]);

          // await prometheusApi.getGenericRate(
          //   "count by (pipeline) (logstash_node_pipeline_events_in_total)",
          // );
          // await prometheusApi.getGenericRate(
          //   "count by (pipeline,plugin_name,plugin_id,plugin_type,id,name) (logstash_node_plugin_events_in_total)",
          // );

          // await prometheusApi.getGenericRate(
          //   'count by (__name__) ({__name__=~"kafka_.*"})',
          // );
          // await prometheusApi.getGenericRate(
          //   "kafka_server_brokertopicmetrics_messagesinpersec_count",
          // );

          // await prometheusApi.getGenericRate(
          //   "logstash_node_plugin_events_in_total",
          // );

          // Process Data
          // Align timestamps
          const dataMap = new Map<
            number,
            { time: string; input: number; output: number }
          >();

          inHist.forEach((res) => {
            res.values.forEach(([ts, val]) => {
              const timeStr = dayjs.unix(ts).format("HH:mm");
              dataMap.set(ts, {
                time: timeStr,
                input: parseFloat(val),
                output: 0,
              });
            });
          });

          outHist.forEach((res) => {
            res.values.forEach(([ts, val]) => {
              if (dataMap.has(ts)) {
                const existing = dataMap.get(ts)!;
                existing.output = parseFloat(val);
              } else {
                const timeStr = dayjs.unix(ts).format("HH:mm");
                dataMap.set(ts, {
                  time: timeStr,
                  input: 0,
                  output: parseFloat(val),
                });
              }
            });
          });

          setHistoryData(
            Array.from(dataMap.values()).sort((a, b) =>
              a.time.localeCompare(b.time),
            ),
          );

          if (inCurr.length > 0)
            setCurrentInputRate(parseFloat(inCurr[0].value[1]));
          if (outCurr.length > 0)
            setCurrentOutputRate(parseFloat(outCurr[0].value[1]));
        } else {
          setHistoryData([]);
          setCurrentInputRate(0);
          setCurrentOutputRate(0);
        }
      } catch (e) {
        console.error("Failed to fetch metrics", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [node]);

  if (!node) {
    return (
      <div className="h-24 md:h-48 flex items-center justify-center text-slate-500 border-t border-slate-700 bg-slate-900/50 text-sm">
        {t.details.selectNode}
      </div>
    );
  }

  const isMetricNode = ["Processor", "Topic"].includes(node.type);

  return (
    <div className="border-t border-slate-700 bg-slate-900/50 p-4 md:p-6 animate-in slide-in-from-bottom-10 max-h-[40vh] md:max-h-none overflow-y-auto">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Stats */}
        <div className="w-full md:w-64 space-y-3 md:space-y-4 shrink-0">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-1">
              {node.name}
            </h3>
            <p className="text-xs md:text-sm text-slate-400 truncate">
              {node.tag}
            </p>
          </div>

          {!isMetricNode ? (
            <div className="p-4 bg-slate-800 rounded-lg text-slate-400 text-sm">
              {t.details.noMetrics}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-[10px] md:text-xs uppercase font-bold mb-1">
                  {t.details.inputRate}
                </div>
                <div className="text-lg md:text-2xl font-mono text-emerald-400">
                  {currentInputRate.toFixed(1)}{" "}
                  <span className="text-xs md:text-sm text-slate-500">
                    evt/s
                  </span>
                </div>
              </div>

              <div className="p-3 md:p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-slate-400 text-[10px] md:text-xs uppercase font-bold">
                    {t.details.outputRate}
                  </div>
                </div>
                <div className="text-lg md:text-2xl font-mono text-blue-400">
                  {currentOutputRate.toFixed(1)}{" "}
                  <span className="text-xs md:text-sm text-slate-500">
                    evt/s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Chart */}
        {isMetricNode && (
          <div className="flex-1 min-h-45 bg-slate-800 rounded-lg border border-slate-700 p-2 md:p-4">
            <h4 className="text-xs md:text-sm text-slate-300 mb-2 md:mb-4 font-medium">
              {t.details.history}
            </h4>
            <div className="h-37.5 md:h-50 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    stroke="#94a3b8"
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f8fafc",
                      fontSize: "12px",
                      padding: "8px",
                    }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="input"
                    name="Input"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="output"
                    name="Output"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DataFlowViewPage = () => {
  const { language } = useLanguage();
  const t = translations.dataFlow[language as keyof typeof translations.dataFlow] || translations.dataFlow.EN;

  const NODES = useNodes(t);

  const [selectedNodeId, setSelectedNodeId] = useState<string>("receiver1");

  const selectedNode = useMemo(
    () => NODES.find((n) => n.id === selectedNodeId) || null,
    [selectedNodeId, NODES],
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-800 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Diagram Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex md:items-center justify-center bg-[url('/grid-pattern.svg')] bg-repeat opacity-90">
        <div className="flex flex-col md:flex-row items-center min-w-max gap-0 py-8 md:py-0">
          {NODES.map((node, index) => (
            <React.Fragment key={node.id}>
              {/* Node */}
              <DiagramNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={(n) => setSelectedNodeId(n.id)}
              />

              {/* Connection (if not last node) */}
              {index < NODES.length - 1 && (
                <div className="h-8 w-px md:w-16 md:h-px">
                  <div className="hidden md:block w-full h-full">
                    <ConnectionLine vertical={false} />
                  </div>
                  <div className="md:hidden w-full h-full">
                    <ConnectionLine vertical={true} />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Details Panel */}
      <div className="shrink-0 z-10 bg-slate-950">
        <DetailsPanel node={selectedNode} />
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
