"use client";

import { client } from "@/lib/axios";
import dayjs from "dayjs";

// --- Helpers ---

const getOrgId = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("orgId") || "temp"
    : "temp";

const LOKI_BASE = (orgId: string) =>
  `/api/Proxy/org/${orgId}/action/Loki/loki/api/v1`;

// --- Loki API Response Types ---

export interface LokiStream {
  stream: Record<string, string>;
  values: [string, string][]; // [nanosecond-timestamp, log-line]
}

interface LokiQueryRangeResponse {
  status: string;
  data: {
    resultType: "streams" | "matrix" | "vector";
    result: LokiStream[] | LokiMatrixResult[];
    stats?: Record<string, unknown>;
  };
}

/** Matrix result from metric queries like count_over_time */
interface LokiMatrixResult {
  metric: Record<string, string>;
  values: [number, string][]; // [unix-seconds, value-string]
}

interface LokiLabelsResponse {
  status: string;
  data: string[];
}

// --- Parsed types for UI ---

export interface LokiLogEntry {
  id: string;
  timestamp: string; // ISO string
  timestampNano: string; // original nanosecond ts
  timestampDisplay: string; // formatted for display
  level: "info" | "warn" | "error" | "debug" | "trace" | "critical" | "fatal" | "unknown";
  line: string;
  labels: Record<string, string>;
  detectedFields?: Record<string, string>;
}

export interface VolumeDataPoint {
  time: number; // ms timestamp
  stdout: number;
  stderr: number;
  [key: string]: number; // Allow any other stream names to be safe
}

// --- Parsers ---

function detectLogLevel(
  line: string,
  labels: Record<string, string>,
): LokiLogEntry["level"] {
  // Check labels first
  const labelLevel = (labels.level || labels.log_level || labels.severity || "").toLowerCase();
  if (labelLevel) {
    if (labelLevel.includes("err") || labelLevel === "error") return "error";
    if (labelLevel.includes("warn")) return "warn";
    if (labelLevel === "info") return "info";
    if (labelLevel === "debug") return "debug";
    if (labelLevel === "trace") return "trace";
    if (labelLevel.includes("crit") || labelLevel.includes("fatal")) return "critical";
  }

  // Check log line content
  const lower = line.toLowerCase();
  // Check for JSON level field
  const jsonLevelMatch = line.match(/"(?:level|severity|log_level)"\s*:\s*"([^"]+)"/i);
  if (jsonLevelMatch) {
    const lvl = jsonLevelMatch[1].toLowerCase();
    if (lvl.includes("err")) return "error";
    if (lvl.includes("warn")) return "warn";
    if (lvl === "info") return "info";
    if (lvl === "debug") return "debug";
    if (lvl === "trace") return "trace";
    if (lvl.includes("crit") || lvl.includes("fatal")) return "critical";
  }

  // Fallback: pattern match
  if (/\b(error|err|fatal|crit|panic)\b/i.test(lower)) return "error";
  if (/\b(warn|warning)\b/i.test(lower)) return "warn";
  if (/\b(debug|dbg)\b/i.test(lower)) return "debug";
  if (/\b(trace|trce)\b/i.test(lower)) return "trace";
  if (/\b(info|inf)\b/i.test(lower)) return "info";

  return "unknown";
}

function formatNanoTimestamp(nanoTs: string): { iso: string; display: string } {
  // Loki timestamps are in nanoseconds
  const ms = Math.floor(Number(BigInt(nanoTs) / BigInt(1_000_000)));
  const d = dayjs(ms);
  const iso = d.toISOString();
  const millis = String(ms % 1000).padStart(3, "0");
  const display = d.format("DD MMM HH:mm:ss") + "." + millis;
  return { iso, display };
}

function tryParseJsonFields(line: string): Record<string, string> | undefined {
  try {
    const parsed = JSON.parse(line);
    if (typeof parsed === "object" && parsed !== null) {
      const fields: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k === "level" || k === "severity" || k === "log_level") continue; // skip level fields
        fields[k] = typeof v === "string" ? v : JSON.stringify(v);
      }
      return Object.keys(fields).length > 0 ? fields : undefined;
    }
  } catch {
    // not JSON
  }
  return undefined;
}

/**
 * Parse Loki streams response into flat LokiLogEntry array
 */
export function parseLokiStreams(streams: LokiStream[]): LokiLogEntry[] {
  const entries: LokiLogEntry[] = [];

  for (const stream of streams) {
    const labels = stream.stream;
    for (const [nanoTs, line] of stream.values) {
      const { iso, display } = formatNanoTimestamp(nanoTs);
      entries.push({
        id: `${nanoTs}-${entries.length}`,
        timestamp: iso,
        timestampNano: nanoTs,
        timestampDisplay: display,
        level: detectLogLevel(line, labels),
        line,
        labels,
        detectedFields: tryParseJsonFields(line),
      });
    }
  }

  return entries;
}

/**
 * Aggregate log entries into volume chart data
 */
export function aggregateVolumeData(
  entries: LokiLogEntry[],
  bucketCount: number = 48,
): VolumeDataPoint[] {
  if (entries.length === 0) return [];

  const timestamps = entries.map((e) => new Date(e.timestamp).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const range = maxTs - minTs || 60_000; // fallback 1 min
  const bucketSize = range / bucketCount;

  const buckets: { ts: number; stdout: number; stderr: number }[] = [];
  for (let i = 0; i < bucketCount; i++) {
    buckets.push({ ts: minTs + i * bucketSize, stdout: 0, stderr: 0 });
  }

  for (const log of entries) {
    const ts = new Date(log.timestamp).getTime();
    const idx = Math.min(
      Math.floor((ts - minTs) / bucketSize),
      bucketCount - 1,
    );

    // Group by stream label if available
    const streamType = (log.labels.stream || "").toLowerCase();
    if (streamType === "stderr") {
      buckets[idx].stderr++;
    } else {
      buckets[idx].stdout++;
    }
  }

  return buckets.map((b) => ({
    time: b.ts,
    stdout: b.stdout,
    stderr: b.stderr,
  }));
}

/**
 * Compute step interval string for a given time range and desired bucket count.
 * Returns a Loki-compatible duration like "1m", "5m", "1h", etc.
 */
function computeStep(startSec: number, endSec: number, buckets: number = 48): string {
  const rangeSec = endSec - startSec;
  const stepSec = Math.max(1, Math.ceil(rangeSec / buckets));
  if (stepSec < 60) return `${stepSec}s`;
  if (stepSec < 3600) return `${Math.ceil(stepSec / 60)}m`;
  return `${Math.ceil(stepSec / 3600)}h`;
}

/** Parse step duration string to seconds */
function parseStep(step: string): number {
  const match = step.match(/^(\d+)(s|m|h)$/);
  if (!match) return 60;
  const n = parseInt(match[1]);
  switch (match[2]) {
    case "s": return n;
    case "m": return n * 60;
    case "h": return n * 3600;
    default: return 60;
  }
}

// --- Loki Service ---

export const lokiService = {
  /**
   * Query range — returns log streams for a LogQL expression over time.
   */
  queryRange: async (
    logql: string,
    start: number,
    end: number,
    limit: number = 1000,
  ): Promise<{ entries: LokiLogEntry[]; streams: LokiStream[] }> => {
    const orgId = getOrgId();
    const params = new URLSearchParams({
      query: logql,
      start: start.toString(),
      end: end.toString(),
      limit: limit.toString(),
    });
    const url = `${LOKI_BASE(orgId)}/query_range?${params}`;
    const res = await client.get<LokiQueryRangeResponse>(url);

    const streams = (res.data?.data?.result ?? []) as LokiStream[];
    const entries = parseLokiStreams(streams);
    return { entries, streams };
  },

  /**
   * Get all label names from Loki.
   */
  getLabels: async (start?: number, end?: number, queryContext?: string): Promise<string[]> => {
    const orgId = getOrgId();

    // If we have a context (e.g., {namespace="a", app="b"}), fetch series and extract keys
    if (queryContext) {
      const params = new URLSearchParams();
      params.append("match[]", queryContext);
      if (start) params.set("start", start.toString());
      if (end) params.set("end", end.toString());

      const url = `${LOKI_BASE(orgId)}/series?${params}`;
      try {
        const res = await client.get<{status: string; data: Record<string, string>[] | string[]}>(url);
        const seriesList = res.data?.data ?? [];
        const uniqueKeys = new Set<string>();

        for (const series of seriesList) {
          if (typeof series === "object" && series !== null && !Array.isArray(series)) {
            for (const key of Object.keys(series)) {
              if (key !== "__name__") { // __name__ is an internal label we don't usually need to autocomplete
                uniqueKeys.add(key);
              }
            }
          }
        }

        return Array.from(uniqueKeys).sort();
      } catch {
        // Fallback silently
      }
    }

    // Default fallback to all labels globally
    const params = new URLSearchParams();
    if (start) params.set("start", start.toString());
    if (end) params.set("end", end.toString());
    const url = `${LOKI_BASE(orgId)}/labels?${params}`;
    const res = await client.get<LokiLabelsResponse>(url);
    return res.data?.data ?? [];
  },

  /**
   * Get values for a specific label.
   */
  getLabelValues: async (
    labelName: string,
    start?: number,
    end?: number,
    queryContext?: string,
  ): Promise<string[]> => {
    const orgId = getOrgId();

    // Fallback: When a query context is specified (like {namespace="pp-devel"}), attempt
    // to use the /series endpoint which is fully context-aware and filters out values appropriately.
    if (queryContext) {
      const params = new URLSearchParams();
      params.append("match[]", queryContext);
      if (start) params.set("start", start.toString());
      if (end) params.set("end", end.toString());

      const url = `${LOKI_BASE(orgId)}/series?${params}`;
      try {
        const res = await client.get<{status: string; data: Record<string, string>[] | string[]}>(url);
        const seriesList = res.data?.data ?? [];
        const uniqueValues = new Set<string>();

        for (const series of seriesList) {
          if (typeof series === "object" && series !== null && !Array.isArray(series)) {
             if (series[labelName]) {
                uniqueValues.add(series[labelName]);
             }
          }
        }

        return Array.from(uniqueValues).sort();
      } catch {
        // Fallback silently if /series is not available
      }
    }

    // Default: use the standard /label/<name>/values endpoint
    const params = new URLSearchParams();
    if (start) params.set("start", start.toString());
    if (end) params.set("end", end.toString());
    if (queryContext) params.set("query", queryContext);
    const url = `${LOKI_BASE(orgId)}/label/${encodeURIComponent(labelName)}/values?${params}`;
    const res = await client.get<LokiLabelsResponse>(url);
    return res.data?.data ?? [];
  },

  /**
   * Query log volume using count_over_time metric query.
   * Returns VolumeDataPoint[] with consistent bucketed counts
   * across the entire time range (not limited by log entry count).
   */
  queryVolume: async (
    logql: string,
    start: number,
    end: number,
    bucketCount: number = 48,
  ): Promise<VolumeDataPoint[]> => {
    const orgId = getOrgId();
    const step = computeStep(start, end, bucketCount);
    const stepSec = parseStep(step);

    // Wrap the log selector in count_over_time with the step as the range
    // We group by stream so we get matrix results split by stream="stdout" / stream="stderr"
    const metricQuery = `sum by (stream) (count_over_time(${logql} [${step}]))`;
    const params = new URLSearchParams({
      query: metricQuery,
      start: start.toString(),
      end: end.toString(),
      step: stepSec.toString(),
    });
    const url = `${LOKI_BASE(orgId)}/query_range?${params}`;

    try {
      const res = await client.get<LokiQueryRangeResponse>(url);
      const results = (res.data?.data?.result ?? []) as LokiMatrixResult[];

      // Merge all matrix series into a single volume timeline grouped by time and stream
    const volumeMap = new Map<number, { stdout: number; stderr: number }>();

    for (const series of results) {
      const streamLabel = (series.metric.stream || "").toLowerCase();
      const isStderr = streamLabel === "stderr";

      for (const [ts, val] of series.values) {
        const msTs = ts * 1000;

        if (!volumeMap.has(msTs)) {
          volumeMap.set(msTs, { stdout: 0, stderr: 0 });
        }

        const current = volumeMap.get(msTs)!;
        const count = parseInt(val, 10);

        if (isStderr) {
          current.stderr += count;
        } else {
          current.stdout += count;
        }
      }
    }

    // Convert to sorted array
    return Array.from(volumeMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([time, counts]) => ({ time, stdout: counts.stdout, stderr: counts.stderr }));
    } catch {
      // Fallback: return empty if metric query not supported
      return [];
    }
  },
};
