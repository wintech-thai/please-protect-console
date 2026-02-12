import { client } from "@/lib/axios";

const getOrgId = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("orgId") || "temp"
    : "temp";

export interface PrometheusResult {
  metric: Record<string, string>;
  value: [number, string]; // [timestamp, value]
}

export interface PrometheusRangeResult {
  metric: Record<string, string>;
  values: [number, string][]; // [[timestamp, value], ...]
}

interface PrometheusResponse<T> {
  status: string;
  data: {
    resultType: string;
    result: T[];
  };
}

/**
 * Instant query — returns the current value for a given PromQL expression.
 */
export async function queryPrometheus(
  promql: string
): Promise<PrometheusResult[]> {
  const params = new URLSearchParams({ query: promql });
  const orgId = getOrgId();
  const url = `/api/Proxy/org/${orgId}/action/Prometheus/api/v1/query?${params}`;
  const res = await client.get<PrometheusResponse<PrometheusResult>>(url);
  return res.data?.data?.result ?? [];
}

/**
 * Range query — returns a series of values over a time range.
 */
export async function queryRangePrometheus(
  promql: string,
  start: number,
  end: number,
  step: number
): Promise<PrometheusRangeResult[]> {
  const params = new URLSearchParams({
    query: promql,
    start: start.toString(),
    end: end.toString(),
    step: step.toString(),
  });
  const orgId = getOrgId();
  const url = `/api/Proxy/org/${orgId}/action/Prometheus/api/v1/query_range?${params}`;
  const res = await client.get<PrometheusResponse<PrometheusRangeResult>>(url);
  return res.data?.data?.result ?? [];
}

export const prometheusApi = {
  /** CPU usage percentage (avg across all cores) */
  getCpuUsage: () =>
    queryPrometheus(
      '100 - (avg(rate(node_cpu_seconds_total{job="node-exporter",mode="idle"}[5m])) * 100)'
    ),

  /** Number of CPU cores */
  getCpuCores: () =>
    queryPrometheus(
      'count(node_cpu_seconds_total{job="node-exporter",mode="idle"})'
    ),

  /** Load averages */
  getLoad1: () => queryPrometheus('node_load1{job="node-exporter"}'),
  getLoad5: () => queryPrometheus('node_load5{job="node-exporter"}'),
  getLoad15: () => queryPrometheus('node_load15{job="node-exporter"}'),

  /** Memory */
  getMemTotal: () =>
    queryPrometheus('node_memory_MemTotal_bytes{job="node-exporter"}'),
  getMemAvailable: () =>
    queryPrometheus('node_memory_MemAvailable_bytes{job="node-exporter"}'),

  /** Network rates (bytes/sec) */
  getNetworkRx: () =>
    queryPrometheus(
      'sum(rate(node_network_receive_bytes_total{job="node-exporter",device!="lo"}[5m]))'
    ),
  getNetworkTx: () =>
    queryPrometheus(
      'sum(rate(node_network_transmit_bytes_total{job="node-exporter",device!="lo"}[5m]))'
    ),

  /** Disk */
  getDiskSize: () =>
    queryPrometheus(
      'node_filesystem_size_bytes{job="node-exporter",fstype!~"tmpfs|overlay"}'
    ),
  getDiskAvail: () =>
    queryPrometheus(
      'node_filesystem_avail_bytes{job="node-exporter",fstype!~"tmpfs|overlay"}'
    ),

  /** CPU Load history (range) — last 1 hour, 30s step */
  getLoadHistory: () => {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 3600;
    const step = 30;
    return Promise.all([
      queryRangePrometheus('node_load1{job="node-exporter"}', start, end, step),
      queryRangePrometheus('node_load5{job="node-exporter"}', start, end, step),
      queryRangePrometheus(
        'node_load15{job="node-exporter"}',
        start,
        end,
        step
      ),
    ]);
  },
};
