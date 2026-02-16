import type { PrometheusRangeResult } from "@/modules/dashboard/api/prometheus.api";
import type {
  CpuChartData,
  MemoryChartData,
  NetworkChartData,
  DiskIoChartData,
} from "@/modules/dashboard/components/overview-types";

// ─── X-axis time formatter ───────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Creates a time formatter that automatically picks the right label granularity
 * based on the total span of the data.
 *  - ≤ 24 h  → "HH:mm"
 *  - > 24 h  → "Jan 1, HH:mm"
 *
 * Can also be called with an explicit `spanSeconds` number when the raw
 * Prometheus values array is not available.
 */
export function createTimeFormatter(
  valuesOrSpan?: [number, string][] | number,
) {
  let spanSeconds = 0;

  if (typeof valuesOrSpan === "number") {
    spanSeconds = valuesOrSpan;
  } else if (Array.isArray(valuesOrSpan) && valuesOrSpan.length >= 2) {
    spanSeconds = valuesOrSpan[valuesOrSpan.length - 1][0] - valuesOrSpan[0][0];
  }

  return (ts: number): string => {
    const date = new Date(ts * 1000);
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");

    if (spanSeconds > 24 * 3600) {
      return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${hh}:${mm}`;
    }
    return `${hh}:${mm}`;
  };
}

// ─── Individual chart processors ─────────────────────────────────────

export function processCpuChart(
  cpuHist: PrometheusRangeResult[],
  formatTime: (ts: number) => string,
): { chartData: CpuChartData[]; sparkData: { value: number }[] } {
  const series = cpuHist?.[0];
  if (!series?.values?.length) return { chartData: [], sparkData: [] };

  const chartData = series.values.map(([ts, val]) => ({
    time: formatTime(ts),
    ts,
    cpu: parseFloat(val),
  }));

  const sparkData = series.values.map(([, val]) => ({
    value: parseFloat(val),
  }));

  return { chartData, sparkData };
}

export function processMemoryChart(
  memHist: PrometheusRangeResult[][],
  formatTime: (ts: number) => string,
): { chartData: MemoryChartData[]; sparkData: { value: number }[] } {
  const [memTotHist, memAvailHist] = memHist;
  const totSeries = memTotHist?.[0];
  const availSeries = memAvailHist?.[0];

  if (!totSeries?.values?.length || !availSeries?.values?.length) {
    return { chartData: [], sparkData: [] };
  }

  const total = parseFloat(totSeries.values[0]?.[1] || "0");

  const chartData = availSeries.values.map(([ts, avail]) => {
    const used = total - parseFloat(avail);
    return { time: formatTime(ts), ts, used, total };
  });

  const sparkData = availSeries.values.map(([, avail]) => {
    const used = total - parseFloat(avail);
    return { value: total > 0 ? (used / total) * 100 : 0 };
  });

  return { chartData, sparkData };
}

export function processNetworkChart(
  netHist: PrometheusRangeResult[][],
  formatTime: (ts: number) => string,
): { chartData: NetworkChartData[]; sparkData: { value: number }[] } {
  const [rxHist, txHist] = netHist;
  const rxSeries = rxHist?.[0];
  const txSeries = txHist?.[0];

  if (!rxSeries?.values?.length || !txSeries?.values?.length) {
    return { chartData: [], sparkData: [] };
  }

  const chartData = rxSeries.values.map(([ts, rx], i) => ({
    time: formatTime(ts),
    ts,
    rx: parseFloat(rx),
    tx: parseFloat(txSeries.values[i]?.[1] || "0"),
  }));

  const sparkData = rxSeries.values.map(([, rx], i) => ({
    value: parseFloat(rx) + parseFloat(txSeries.values[i]?.[1] || "0"),
  }));

  return { chartData, sparkData };
}

export function processDiskIoChart(
  diskIoHist: PrometheusRangeResult[][],
  formatTime: (ts: number) => string,
): { chartData: DiskIoChartData[]; sparkData: { value: number }[] } {
  const [readHist, writeHist] = diskIoHist;
  const readSeries = readHist?.[0];
  const writeSeries = writeHist?.[0];

  if (!readSeries?.values?.length || !writeSeries?.values?.length) {
    return { chartData: [], sparkData: [] };
  }

  const chartData = readSeries.values.map(([ts, read], i) => ({
    time: formatTime(ts),
    ts,
    read: parseFloat(read),
    write: parseFloat(writeSeries.values[i]?.[1] || "0"),
  }));

  const sparkData = readSeries.values.map(([, read], i) => ({
    value: parseFloat(read) + parseFloat(writeSeries.values[i]?.[1] || "0"),
  }));

  return { chartData, sparkData };
}

// ─── Process all charts in one call ──────────────────────────────────

interface AllChartsResult {
  cpu:     { chartData: CpuChartData[];     sparkData: { value: number }[] };
  memory:  { chartData: MemoryChartData[];  sparkData: { value: number }[] };
  network: { chartData: NetworkChartData[]; sparkData: { value: number }[] };
  diskIo:  { chartData: DiskIoChartData[];  sparkData: { value: number }[] };
}

export function processAllCharts(
  cpuHist: PrometheusRangeResult[],
  memHist: PrometheusRangeResult[][],
  netHist: PrometheusRangeResult[][],
  diskIoHist: PrometheusRangeResult[][],
): AllChartsResult {
  const formatTime = createTimeFormatter(cpuHist?.[0]?.values);

  return {
    cpu:     processCpuChart(cpuHist, formatTime),
    memory:  processMemoryChart(memHist, formatTime),
    network: processNetworkChart(netHist, formatTime),
    diskIo:  processDiskIoChart(diskIoHist, formatTime),
  };
}
