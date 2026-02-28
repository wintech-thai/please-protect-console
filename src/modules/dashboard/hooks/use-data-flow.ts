"use client";

import { useMemo, useCallback } from "react";
import { useQuery, keepPreviousData, type UseQueryOptions } from "@tanstack/react-query";
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

// ─── Query key factories ─────────────────────────────────────────────

export const dataFlowKeys = {
  all: ["dataFlow"] as const,
  rates: (timeRange: TimeRangeValue) =>
    timeRange.type === "absolute" && timeRange.start && timeRange.end
      ? ([...dataFlowKeys.all, "rates", "absolute", timeRange.start, timeRange.end] as const)
      : ([...dataFlowKeys.all, "rates", "relative", timeRange.value] as const),
  history: (nodeId: string | null, timeRange: TimeRangeValue) =>
    timeRange.type === "absolute" && timeRange.start && timeRange.end
      ? ([...dataFlowKeys.all, "history", nodeId, "absolute", timeRange.start, timeRange.end] as const)
      : ([...dataFlowKeys.all, "history", nodeId, "relative", timeRange.value] as const),
};

// ─── Fetch functions ─────────────────────────────────────────────────

/** Fetch rates for all metric nodes (Processor / Topic / DataStore) */
async function fetchNodeRates(
  nodes: NodeData[],
  timeRange: TimeRangeValue,
): Promise<NodeRates> {
  const prometheusNodes = nodes.filter(
    (n) => n.type === "Processor" || n.type === "Topic",
  );
  const esNodes = nodes.filter((n) => n.type === "DataStore");
  const isRelative = timeRange.type === "relative";
  const rates: NodeRates = {};

  // 1) Prometheus nodes — batch all queries via Promise.all
  type Q = { nodeId: string; field: "inputRate" | "outputRate"; query: string };
  const queries: Q[] = [];

  for (const node of prometheusNodes) {
    const pq = buildPrometheusQueries(node);
    if (!pq) continue;
    queries.push({ nodeId: node.id, field: "inputRate", query: pq.input });
    if (pq.input !== pq.output) {
      queries.push({ nodeId: node.id, field: "outputRate", query: pq.output });
    }
  }

  if (isRelative) {
    const results = await Promise.all(
      queries.map((q) => prometheusApi.getGenericRate(q.query)),
    );
    for (let i = 0; i < queries.length; i++) {
      const { nodeId, field } = queries[i];
      if (!rates[nodeId]) rates[nodeId] = { inputRate: 0, outputRate: 0 };
      rates[nodeId][field] = parseRate(results[i]);
    }
  } else {
    const { start, end, step } = getTimeParams(timeRange);
    const results = await Promise.all(
      queries.map((q) =>
        prometheusApi.getGenericHistory(q.query, start, end, step),
      ),
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
    if (rates[node.id]) rates[node.id].outputRate = rates[node.id].inputRate;
  }

  // 2) ES DataStore nodes
  const orgId = getOrgId();
  let esStart: number;
  let esEnd: number;

  if (isRelative) {
    esEnd = dayjs().unix();
    esStart = dayjs().subtract(1, "minute").unix();
  } else {
    const tp = getTimeParams(timeRange);
    esStart = tp.end - 60;
    esEnd = tp.end;
  }

  for (const node of esNodes) {
    try {
      const esRate = await esService.getCensorEventsRate(orgId, esStart, esEnd);
      rates[node.id] = { inputRate: esRate, outputRate: 0 };
    } catch {
      rates[node.id] = { inputRate: 0, outputRate: 0 };
    }
  }

  return rates;
}

/** Fetch history for a single node */
async function fetchNodeHistory(
  node: NodeData,
  timeRange: TimeRangeValue,
): Promise<HistoryPoint[]> {
  // Compute fresh timestamps on every call
  const { start, end, step } = getTimeParams(timeRange);

  // DataStore → ES date_histogram
  if (node.type === "DataStore") {
    const raw = await esService.getCensorEventsHistory(getOrgId(), start, end, step);
    const spanSeconds = end - start;
    const formatTime = createTimeFormatter(spanSeconds);
    return raw.map((d) => ({
      time: formatTime(d.ts),
      input: parseFloat(d.input.toFixed(2)),
    }));
  }

  // Processor / Topic → Prometheus range query
  const pq = buildPrometheusQueries(node);
  if (!pq) return [];

  const [inHist, outHist] = await Promise.all([
    prometheusApi.getGenericHistory(pq.input, start, end, step),
    prometheusApi.getGenericHistory(pq.output, start, end, step),
  ]);

  return mergeHistoryResults(inHist, outHist, end - start);
}

// ─── Hooks ───────────────────────────────────────────────────────────

type NodeRatesOptions = Omit<UseQueryOptions<NodeRates>, "queryKey" | "queryFn">;

/**
 * Polls current rates for ALL metric nodes (Processor / Topic / DataStore).
 *
 * For **relative** ranges the query key is stable (e.g. ["relative","1h"]),
 * and `getTimeParams()` is called inside queryFn so timestamps are always fresh.
 */
export function useNodeRates(
  nodes: NodeData[],
  timeRange: TimeRangeValue,
  options?: NodeRatesOptions,
) {
  const query = useQuery<NodeRates>({
    queryKey: dataFlowKeys.rates(timeRange),
    queryFn: () => fetchNodeRates(nodes, timeRange),
    placeholderData: keepPreviousData,
    ...options,
  });

  /** Check if the connection between nodes[index] → nodes[index+1] carries data */
  const getConnectionHasData = useCallback(
    (index: number): boolean => {
      const rates = query.data ?? {};
      const left = nodes[index];
      const right = nodes[index + 1];
      if (rates[left.id]) return rates[left.id].outputRate > 0;
      if (rates[right.id]) return rates[right.id].inputRate > 0;
      return true; // no metrics → assume flowing
    },
    [nodes, query.data],
  );

  return {
    nodeRates: query.data ?? {},
    getConnectionHasData,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? (query.error instanceof Error ? query.error.message : "Unknown error")
      : null,
    retry: query.refetch,
    lastUpdated: query.dataUpdatedAt > 0 ? new Date(query.dataUpdatedAt) : null,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

type NodeHistoryOptions = Omit<UseQueryOptions<HistoryPoint[]>, "queryKey" | "queryFn">;

/**
 * Fetches history for the currently selected node.
 *
 * For **relative** ranges, fresh start/end are computed inside queryFn
 * on every fetch so the timeline always reflects the current moment.
 */
export function useNodeHistory(
  node: NodeData | null,
  timeRange: TimeRangeValue,
  options?: NodeHistoryOptions,
) {
  return useQuery<HistoryPoint[]>({
    queryKey: dataFlowKeys.history(node?.id ?? null, timeRange),
    queryFn: () => fetchNodeHistory(node!, timeRange),
    enabled: !!node,
    placeholderData: keepPreviousData,
    ...options,
  });
}
