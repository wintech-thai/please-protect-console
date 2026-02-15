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

const POLL_INTERVAL_MS = 20_000;
const HISTORY_MINUTES = 30;
const HISTORY_STEP_SEC = 60;

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
  outHist: { values: [number, string][] }[]
): HistoryPoint[] {
  const map = new Map<number, HistoryPoint>();

  for (const res of inHist) {
    for (const [ts, val] of res.values) {
      map.set(ts, {
        time: dayjs.unix(ts).format("HH:mm"),
        input: parseFloat(val),
        output: 0,
      });
    }
  }

  for (const res of outHist) {
    for (const [ts, val] of res.values) {
      const existing = map.get(ts);
      if (existing) {
        existing.output = parseFloat(val);
      } else {
        map.set(ts, {
          time: dayjs.unix(ts).format("HH:mm"),
          input: 0,
          output: parseFloat(val),
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
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
export function useNodeRates(nodes: NodeData[]) {
  const [nodeRates, setNodeRates] = useState<NodeRates>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const prometheusNodes = nodes.filter(
      (n) => n.type === "Processor" || n.type === "Topic"
    );
    const esNodes = nodes.filter((n) => n.type === "DataStore");

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

        const results = await Promise.all(
          queries.map((q) => prometheusApi.getGenericRate(q.query))
        );

        for (let i = 0; i < queries.length; i++) {
          const { nodeId, field } = queries[i];
          if (!rates[nodeId]) rates[nodeId] = { inputRate: 0, outputRate: 0 };
          rates[nodeId][field] = parseRate(results[i]);
        }

        // For Topic nodes (same query for in/out), copy input → output
        for (const node of prometheusNodes.filter((n) => n.type === "Topic")) {
          if (rates[node.id])
            rates[node.id].outputRate = rates[node.id].inputRate;
        }

        // 2) ES DataStore nodes
        const orgId = getOrgId();
        const now = dayjs().unix();
        const oneMinAgo = dayjs().subtract(1, "minute").unix();

        for (const node of esNodes) {
          try {
            const esRate = await esService.getCensorEventsRate(
              orgId,
              oneMinAgo,
              now
            );
            rates[node.id] = { inputRate: esRate, outputRate: 0 };
          } catch {
            rates[node.id] = { inputRate: 0, outputRate: 0 };
          }
        }

        setNodeRates(rates);
      } catch (e) {
        console.error("Failed to fetch node rates", e);
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [nodes, retryKey]);

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

  return { nodeRates, getConnectionHasData, loading, error, retry };
}

// Fetches 30-min history for the currently selected node.
export function useNodeHistory(node: NodeData | null) {
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    if (!node) return;

    const fetchHistory = async () => {
      const end = dayjs().unix();
      const start = dayjs().subtract(HISTORY_MINUTES, "minute").unix();

      try {
        // DataStore → ES date_histogram
        if (node.type === "DataStore") {
          const data = await esService.getCensorEventsHistory(
            getOrgId(),
            start,
            end,
            HISTORY_STEP_SEC
          );
          setHistoryData(data);
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
            HISTORY_STEP_SEC
          ),
          prometheusApi.getGenericHistory(
            pq.output,
            start,
            end,
            HISTORY_STEP_SEC
          ),
        ]);

        setHistoryData(mergeHistoryResults(inHist, outHist));
      } catch (e) {
        console.error("Failed to fetch history", e);
        setHistoryData([]);
      }
    };

    fetchHistory();
    const id = setInterval(fetchHistory, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [node]);

  return historyData;
}
