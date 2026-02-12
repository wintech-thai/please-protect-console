import type { PrometheusResult, PrometheusRangeResult } from "@/modules/dashboard/api/prometheus.api";
import type { Metrics } from "@/modules/dashboard/components/overview-types";
import { firstVal } from "@/modules/dashboard/components/overview-types";
import { prometheusApi } from "@/modules/dashboard/api/prometheus.api";

// ─── Empty metrics (used when no data is available) ──────────────────

export const EMPTY_METRICS: Metrics = {
  cpuUsage: 0,
  cpuCores: 0,
  load1: 0,
  load5: 0,
  load15: 0,
  memTotal: 0,
  memUsed: 0,
  networkRx: 0,
  networkTx: 0,
  disks: [],
  diskTotalAll: 0,
  diskUsedAll: 0,
};

// ─── Build metrics from instant (current) queries ────────────────────

function parseDiskInfo(
  diskSizeRes: PrometheusResult[],
  diskAvailRes: PrometheusResult[],
): { disks: Metrics["disks"]; diskTotalAll: number; diskUsedAll: number } {
  const sizeMap = new Map<string, { total: number; device: string; mountpoint: string }>();

  diskSizeRes.forEach((r) => {
    const mp = r.metric.mountpoint || "/";
    sizeMap.set(mp, {
      total: parseFloat(r.value[1]) || 0,
      device: r.metric.device || "",
      mountpoint: mp,
    });
  });

  const disks: Metrics["disks"] = [];
  diskAvailRes.forEach((r) => {
    const mp = r.metric.mountpoint || "/";
    const info = sizeMap.get(mp);
    if (info) {
      const avail = parseFloat(r.value[1]) || 0;
      disks.push({ mountpoint: mp, device: info.device, total: info.total, avail, used: info.total - avail });
    }
  });

  return {
    disks,
    diskTotalAll: disks.reduce((s, d) => s + d.total, 0),
    diskUsedAll: disks.reduce((s, d) => s + d.used, 0),
  };
}

export async function fetchCurrentMetrics(): Promise<Metrics> {
  const [
    cpuRes, coresRes,
    load1Res, load5Res, load15Res,
    memTotalRes, memAvailRes,
    netRxRes, netTxRes,
    diskSizeRes, diskAvailRes,
  ] = await Promise.all([
    prometheusApi.getCpuUsage(),
    prometheusApi.getCpuCores(),
    prometheusApi.getLoad1(),
    prometheusApi.getLoad5(),
    prometheusApi.getLoad15(),
    prometheusApi.getMemTotal(),
    prometheusApi.getMemAvailable(),
    prometheusApi.getNetworkRx(),
    prometheusApi.getNetworkTx(),
    prometheusApi.getDiskSize(),
    prometheusApi.getDiskAvail(),
  ]);

  const { disks, diskTotalAll, diskUsedAll } = parseDiskInfo(diskSizeRes, diskAvailRes);
  const memTotal = firstVal(memTotalRes);
  const memAvail = firstVal(memAvailRes);

  return {
    cpuUsage: firstVal(cpuRes),
    cpuCores: firstVal(coresRes),
    load1: firstVal(load1Res),
    load5: firstVal(load5Res),
    load15: firstVal(load15Res),
    memTotal,
    memUsed: memTotal - memAvail,
    networkRx: firstVal(netRxRes),
    networkTx: firstVal(netTxRes),
    disks,
    diskTotalAll,
    diskUsedAll,
  };
}

// ─── Build metrics from the last history data point (absolute range) ─

function lastValue(series: PrometheusRangeResult[] | undefined): number {
  const last = series?.[0]?.values?.slice(-1)?.[0];
  return last ? parseFloat(last[1]) : 0;
}

export function metricsFromHistory(
  cpuHist: PrometheusRangeResult[],
  memHist: PrometheusRangeResult[][],
  netHist: PrometheusRangeResult[][],
): Metrics {
  const [memTotArr, memAvailArr] = memHist;
  const [rxArr, txArr] = netHist;

  const memTotal = lastValue(memTotArr);
  const memAvail = lastValue(memAvailArr);

  return {
    ...EMPTY_METRICS,
    cpuUsage: lastValue(cpuHist),
    memTotal,
    memUsed: memTotal - memAvail,
    networkRx: lastValue(rxArr),
    networkTx: lastValue(txArr),
  };
}
