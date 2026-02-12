// ─── Shared types & helpers for Overview dashboard ───────────────────

import type { PrometheusResult } from "@/modules/dashboard/api/prometheus.api";

// ─── Types ───────────────────────────────────────────────────────────

export interface DiskInfo {
  mountpoint: string;
  device: string;
  total: number;
  avail: number;
  used: number;
}

export interface Metrics {
  cpuUsage: number;
  cpuCores: number;
  load1: number;
  load5: number;
  load15: number;
  memTotal: number;
  memUsed: number;
  networkRx: number;
  networkTx: number;
  disks: DiskInfo[];
  diskTotalAll: number;
  diskUsedAll: number;
}

export interface ChartPoint {
  time: string;
  ts: number;
  [key: string]: number | string;
}

export interface CpuChartData extends ChartPoint {
  cpu: number;
}

export interface MemoryChartData extends ChartPoint {
  used: number;
  total: number;
}

export interface NetworkChartData extends ChartPoint {
  rx: number;
  tx: number;
}

export interface DiskIoChartData extends ChartPoint {
  read: number;
  write: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function formatBytesPerSec(bytes: number): string {
  return `${formatBytes(bytes)}/s`;
}

export function firstVal(results: PrometheusResult[]): number {
  if (!results.length) return 0;
  return parseFloat(results[0].value[1]) || 0;
}

// ─── Constants ───────────────────────────────────────────────────────

export const REFRESH_OPTIONS = [
  { label: "5s", value: 5_000 },
  { label: "10s", value: 10_000 },
  { label: "15s", value: 15_000 },
  { label: "20s", value: 20_000 },
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
  { label: "Off", value: 0 },
];
