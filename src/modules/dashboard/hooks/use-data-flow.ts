"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Activity, Server, Database, Cpu, Router } from "lucide-react";
import { prometheusApi } from "../api/prometheus.api";
import { esService } from "@/lib/elasticsearch";
import dayjs from "dayjs";
import type {
  NodeData,
  NodeRates,
  HistoryPoint,
  DataFlowTranslations,
} from "../types/data-flow.types";
import type { TimeRangeValue } from "@/modules/dashboard/components/advanced-time-selector";
import { getTimeParams } from "@/modules/dashboard/utils/time-params";
import { createTimeFormatter } from "@/modules/dashboard/utils/chart-processors";

const DEFAULT_POLL_MS = 20_000;
const DEFAULT_STEP_SEC = 60;

const getOrgId = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("orgId") || "temp"
    : "temp";

const parseRate = (result: { value: [number, string] }[]): number =>
  result.length > 0 ? parseFloat(result[0].value[1]) : 0;

/** Build PromQL queries for a Processor or Topic node */
function buildPrometheusQueries(node: NodeData) {
  const tag = node.tag;
  if (node.type === "Processor") {
    return {
      input: `sum(rate(logstash_node_pipeline_events_in_total{job="${tag}"}[1m]))`,
      output: `sum(rate(logstash_node_pipeline_events_out_total{job="${tag}"}[1m]))`,
    };
  }
  if (node.type === "Topic") {
    const q = `sum(rate(kafka_server_brokertopicmetrics_messagesinpersec_count{topic="${tag}"}[1m]))`;
    return { input: q, output: q };
  }
  return null;
}

/** Merge input/output range-query results into a sorted timeline */
function mergeHistoryResults(
  inHist: { values: [number, string][] }[],
  outHist: { values: [number, string][] }[],
  spanSeconds: number,
): HistoryPoint[] {
  const formatTime = createTimeFormatter(spanSeconds);
  const map = new Map<number, HistoryPoint & { _ts: number }>();

  for (const res of inHist) {
    for (const [ts, val] of res.values) {
      map.set(ts, {
        time: formatTime(ts),
        input: parseFloat(parseFloat(val).toFixed(2)),
        output: 0,
        _ts: ts,
      });
    }
  }

  for (const res of outHist) {
    for (const [ts, val] of res.values) {
      const existing = map.get(ts);
      if (existing) {
        existing.output = parseFloat(parseFloat(val).toFixed(2));
      } else {
        map.set(ts, {
          time: formatTime(ts),
          input: 0,
          output: parseFloat(parseFloat(val).toFixed(2)),
          _ts: ts,
        });
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a._ts - b._ts)
    .map(({ time, input, output }) => ({ time, input, output }));
}

export const useNodes = (t: DataFlowTranslations) =>
  useMemo<NodeData[]>(
    () => [
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
        description: t.nodes.topicRawDesc.replace(
          "{tag}",
          "received-topic-beat"
        ),
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
        description: t.nodes.topicTransformedDesc.replace(
          "{tag}",
          "transformed-topic-beat"
        ),
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
    ],
    [t]
  );

// Polls current rates for ALL metric nodes (Processor/Topic/DataStore).
// Returns the rates map and a helper to check if a connection has data.
export function useNodeRates(
  nodes: NodeData[],
  options?: {
    timeRange?: TimeRangeValue;
    refreshInterval?: number;
    timeRangeKey?: string;
  }
) {
  const [nodeRates, setNodeRates] = useState<NodeRates>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollMs = options?.refreshInterval ?? DEFAULT_POLL_MS;
  const timeRangeKey = options?.timeRangeKey ?? "default";

  useEffect(() => {
    const prometheusNodes = nodes.filter(
      (n) => n.type === "Processor" || n.type === "Topic"
    );
    const esNodes = nodes.filter((n) => n.type === "DataStore");

    // Check if we're using the current time window (relative) or a custom range
    const isRelative = !options?.timeRange || options.timeRange.type === "relative";

    const fetchAll = async () => {
      try {
        setError(null);
        const rates: NodeRates = {};

        // 1) Prometheus nodes — batch all queries via Promise.all
        type Q = {
          nodeId: string;
          field: "inputRate" | "outputRate";
          query: string;
        };
        const queries: Q[] = [];

        for (const node of prometheusNodes) {
          const pq = buildPrometheusQueries(node);
          if (!pq) continue;
          queries.push({
            nodeId: node.id,
            field: "inputRate",
            query: pq.input,
          });
          if (pq.input !== pq.output) {
            queries.push({
              nodeId: node.id,
              field: "outputRate",
              query: pq.output,
            });
          }
        }

        if (isRelative) {
          // Use instant query for current/relative ranges
          const results = await Promise.all(
            queries.map((q) => prometheusApi.getGenericRate(q.query))
          );

          for (let i = 0; i < queries.length; i++) {
            const { nodeId, field } = queries[i];
            if (!rates[nodeId]) rates[nodeId] = { inputRate: 0, outputRate: 0 };
            rates[nodeId][field] = parseRate(results[i]);
          }
        } else {
          // Use range query and take the last (most recent) data point
          const { start, end, step } = getTimeParams(options!.timeRange!);
          const results = await Promise.all(
            queries.map((q) =>
              prometheusApi.getGenericHistory(q.query, start, end, step)
            )
          );

          for (let i = 0; i < queries.length; i++) {
            const { nodeId, field } = queries[i];
            if (!rates[nodeId]) rates[nodeId] = { inputRate: 0, outputRate: 0 };
            const series = results[i];
            if (series?.length > 0 && series[0].values?.length > 0) {
              const lastVal = series[0].values[series[0].values.length - 1];
              rates[nodeId][field] = parseFloat(lastVal[1]);
            } else {
              rates[nodeId][field] = 0;
            }
          }
        }

        // For Topic nodes (same query for in/out), copy input → output
        for (const node of prometheusNodes.filter((n) => n.type === "Topic")) {
          if (rates[node.id])
            rates[node.id].outputRate = rates[node.id].inputRate;
        }

        // 2) ES DataStore nodes
        const orgId = getOrgId();
        let esStart: number;
        let esEnd: number;

        if (isRelative) {
          esEnd = dayjs().unix();
          esStart = dayjs().subtract(1, "minute").unix();
        } else {
          const tp = getTimeParams(options!.timeRange!);
          esStart = tp.end - 60; // last minute of the selected range
          esEnd = tp.end;
        }

        for (const node of esNodes) {
          try {
            const esRate = await esService.getCensorEventsRate(
              orgId,
              esStart,
              esEnd
            );
            rates[node.id] = { inputRate: esRate, outputRate: 0 };
          } catch {
            rates[node.id] = { inputRate: 0, outputRate: 0 };
          }
        }

        setNodeRates(rates);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Failed to fetch node rates", e);
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const id = pollMs > 0 ? setInterval(fetchAll, pollMs) : null;
    return () => { if (id) clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, retryKey, pollMs, timeRangeKey]);

  /** Check if the connection between nodes[index] → nodes[index+1] carries data */
  const getConnectionHasData = useCallback(
    (index: number): boolean => {
      const left = nodes[index];
      const right = nodes[index + 1];
      if (nodeRates[left.id]) return nodeRates[left.id].outputRate > 0;
      if (nodeRates[right.id]) return nodeRates[right.id].inputRate > 0;
      return true; // no metrics → assume flowing
    },
    [nodes, nodeRates]
  );

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setNodeRates({});
    setRetryKey((k) => k + 1);
  }, []);

  return { nodeRates, getConnectionHasData, loading, error, retry, lastUpdated };
}

// Fetches history for the currently selected node using the time range.
export function useNodeHistory(
  node: NodeData | null,
  options?: {
    timeRange?: TimeRangeValue;
    refreshInterval?: number;
    timeRangeKey?: string;
  }
) {
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);

  const pollMs = options?.refreshInterval ?? DEFAULT_POLL_MS;
  const timeRangeKey = options?.timeRangeKey ?? "default";

  useEffect(() => {
    if (!node) return;

    const fetchHistory = async () => {
      // Determine start/end/step from time range or fall back to defaults
      let start: number;
      let end: number;
      let step: number;

      if (options?.timeRange) {
        const tp = getTimeParams(options.timeRange);
        start = tp.start;
        end = tp.end;
        step = tp.step;
      } else {
        end = dayjs().unix();
        start = dayjs().subtract(30, "minute").unix();
        step = DEFAULT_STEP_SEC;
      }

      try {
        // DataStore → ES date_histogram
        if (node.type === "DataStore") {
          const raw = await esService.getCensorEventsHistory(
            getOrgId(),
            start,
            end,
            step
          );
          // Re-format time labels dynamically based on span
          const spanSeconds = end - start;
          const formatTime = createTimeFormatter(spanSeconds);
          setHistoryData(
            raw.map((d) => ({
              time: formatTime(d.ts),
              input: parseFloat(d.input.toFixed(2)),
            }))
          );
          return;
        }

        // Processor / Topic → Prometheus range query
        const pq = buildPrometheusQueries(node);
        if (!pq) {
          setHistoryData([]);
          return;
        }

        const [inHist, outHist] = await Promise.all([
          prometheusApi.getGenericHistory(
            pq.input,
            start,
            end,
            step
          ),
          prometheusApi.getGenericHistory(
            pq.output,
            start,
            end,
            step
          ),
        ]);

        setHistoryData(mergeHistoryResults(inHist, outHist, end - start));
      } catch (e) {
        console.error("Failed to fetch history", e);
        setHistoryData([]);
      }
    };

    fetchHistory();
    const id = pollMs > 0 ? setInterval(fetchHistory, pollMs) : null;
    return () => { if (id) clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, pollMs, timeRangeKey]);

  return historyData;
}
