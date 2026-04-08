"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Activity,
  Filter,
  Loader2,
  RefreshCw,
  Sigma,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { esService, type EsResponse } from "@/lib/elasticsearch";
import { resolveTimeRange } from "@/utils/format-date";
import { useTimeRange } from "@/modules/dashboard/hooks/use-time-range";
import { AdvancedTimeRangeSelector } from "@/components/ui/advanced-time-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TermsBucket = {
  key: string;
  doc_count: number;
};

type HistogramBucket = {
  key: number;
  key_as_string: string;
  doc_count: number;
  by_dataset?: { buckets: TermsBucket[] };
  unique_source_ips?: { value: number };
  unique_destination_ips?: { value: number };
};

type DashboardAggs = {
  dataset_options?: { buckets: TermsBucket[] };
  datasets?: { buckets: TermsBucket[] };
  source_ips?: { buckets: TermsBucket[] };
  destination_ips?: { buckets: TermsBucket[] };
  eps_over_time?: { buckets: HistogramBucket[] };
  source_ips_over_time?: { buckets: HistogramBucket[] };
  destination_ips_over_time?: { buckets: HistogramBucket[] };
};

type DashboardResponse = EsResponse<unknown> & {
  aggregations?: DashboardAggs;
};

const CHART_COLORS = [
  "#22d3ee",
  "#34d399",
  "#60a5fa",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
  "#fb7185",
  "#2dd4bf",
];

const getOrgId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("orgId") || localStorage.getItem("currentOrgId") || null;
};

const getIntervalByRange = (durationSec: number) => {
  if (durationSec <= 3600) return { interval: "1m", stepSec: 60 };
  if (durationSec <= 6 * 3600) return { interval: "5m", stepSec: 300 };
  if (durationSec <= 24 * 3600) return { interval: "15m", stepSec: 900 };
  if (durationSec <= 7 * 24 * 3600) return { interval: "1h", stepSec: 3600 };
  return { interval: "3h", stepSec: 10800 };
};

const buildBaseMust = (fromDate: string, toDate: string) => [
  { range: { "@timestamp": { gte: fromDate, lte: toDate } } },
  { wildcard: { "event.dataset": "zeek.*" } },
];

const formatXAxis = (value: string, durationSec: number) => {
  if (durationSec <= 24 * 3600) return dayjs(value).format("HH:mm");
  return dayjs(value).format("MM-DD HH:mm");
};

const EventSummaryViewPage = () => {
  const { timeRange, setTimeRange } = useTimeRange();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [datasetOptions, setDatasetOptions] = useState<TermsBucket[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);

  const [totalEvents, setTotalEvents] = useState(0);
  const [currentEps, setCurrentEps] = useState(0);
  const [avgEps, setAvgEps] = useState(0);

  const [datasetBuckets, setDatasetBuckets] = useState<TermsBucket[]>([]);
  const [sourceBuckets, setSourceBuckets] = useState<TermsBucket[]>([]);
  const [destinationBuckets, setDestinationBuckets] = useState<TermsBucket[]>([]);

  const [epsSeries, setEpsSeries] = useState<Record<string, unknown>[]>([]);
  const [datasetSeries, setDatasetSeries] = useState<Record<string, unknown>[]>([]);
  const [sourceUniqueSeries, setSourceUniqueSeries] = useState<Record<string, unknown>[]>([]);
  const [destinationUniqueSeries, setDestinationUniqueSeries] = useState<Record<string, unknown>[]>([]);

  const [sourceIpAggField] = useState("source.ip.keyword");
  const [destinationIpAggField] = useState("destination.ip.keyword");

  const range = useMemo(() => resolveTimeRange(timeRange), [timeRange]);
  const durationSec = useMemo(() => {
    const from = dayjs(range.fromDate).unix();
    const to = dayjs(range.toDate).unix();
    return Math.max(to - from, 60);
  }, [range.fromDate, range.toDate]);

  const fetchDashboard = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) {
      setError("Organization not found");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { interval, stepSec } = getIntervalByRange(durationSec);
      const baseMust = buildBaseMust(range.fromDate, range.toDate);

      const sourceField = sourceIpAggField;
      const destinationField = destinationIpAggField;

      const selectedDatasetFilter = selectedDatasets.length
        ? [{ terms: { "event.dataset.keyword": selectedDatasets } }]
        : [];

      const optionsPromise = esService.search<unknown>(
        `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`,
        {
          size: 0,
          query: { bool: { must: baseMust } },
          aggs: {
            dataset_options: {
              terms: { field: "event.dataset.keyword", size: 100 },
            },
          },
        },
      ) as Promise<DashboardResponse>;

      const dashboardPromise = esService.search<unknown>(
        `/api/Proxy/org/${orgId}/action/ElasticSearch/censor-events-*/_search`,
        {
          size: 0,
          track_total_hits: true,
          query: {
            bool: {
              must: [...baseMust, ...selectedDatasetFilter],
            },
          },
          aggs: {
            datasets: { terms: { field: "event.dataset.keyword", size: 12 } },
            source_ips: { terms: { field: sourceField, size: 10 } },
            destination_ips: { terms: { field: destinationField, size: 10 } },
            eps_over_time: {
              date_histogram: {
                field: "@timestamp",
                fixed_interval: interval,
                min_doc_count: 0,
                extended_bounds: {
                  min: range.fromDate,
                  max: range.toDate,
                },
              },
              aggs: {
                by_dataset: { terms: { field: "event.dataset.keyword", size: 8 } },
              },
            },
            source_ips_over_time: {
              date_histogram: {
                field: "@timestamp",
                fixed_interval: interval,
                min_doc_count: 0,
                extended_bounds: {
                  min: range.fromDate,
                  max: range.toDate,
                },
              },
              aggs: {
                unique_source_ips: { cardinality: { field: sourceField } },
              },
            },
            destination_ips_over_time: {
              date_histogram: {
                field: "@timestamp",
                fixed_interval: interval,
                min_doc_count: 0,
                extended_bounds: {
                  min: range.fromDate,
                  max: range.toDate,
                },
              },
              aggs: {
                unique_destination_ips: { cardinality: { field: destinationField } },
              },
            },
          },
        },
      ) as Promise<DashboardResponse>;

      const [optionsRes, dashboardRes] = await Promise.all([optionsPromise, dashboardPromise]);

      const options: TermsBucket[] = optionsRes.aggregations?.dataset_options?.buckets ?? [];
      const aggs = dashboardRes.aggregations;
      const buckets: HistogramBucket[] = aggs?.eps_over_time?.buckets ?? [];

      setDatasetOptions(options);
      setDatasetBuckets(aggs?.datasets?.buckets ?? []);
      setSourceBuckets(aggs?.source_ips?.buckets ?? []);
      setDestinationBuckets(aggs?.destination_ips?.buckets ?? []);

      const lineKeys: string[] = (aggs?.datasets?.buckets ?? []).slice(0, 6).map((b: TermsBucket) => b.key);

      const nextEpsSeries = buckets.map((b: HistogramBucket) => {
        const byDataset = new Map((b.by_dataset?.buckets ?? []).map((i: TermsBucket) => [i.key, i.doc_count]));
        const row: Record<string, unknown> = {
          time: b.key_as_string,
          total: Number((b.doc_count / stepSec).toFixed(3)),
        };

        lineKeys.forEach((k: string) => {
          row[k] = Number((((byDataset.get(k) ?? 0) as number) / stepSec).toFixed(3));
        });

        return row;
      });

      const nextDatasetSeries = buckets.map((b: HistogramBucket) => {
        const byDataset = new Map((b.by_dataset?.buckets ?? []).map((i: TermsBucket) => [i.key, i.doc_count]));
        const row: Record<string, unknown> = { time: b.key_as_string };
        lineKeys.forEach((k: string) => {
          row[k] = byDataset.get(k) ?? 0;
        });
        return row;
      });

      const nextSourceUniqueSeries = (aggs?.source_ips_over_time?.buckets ?? []).map((b: HistogramBucket) => ({
        time: b.key_as_string,
        value: b.unique_source_ips?.value ?? 0,
      }));

      const nextDestinationUniqueSeries = (aggs?.destination_ips_over_time?.buckets ?? []).map((b: HistogramBucket) => ({
        time: b.key_as_string,
        value: b.unique_destination_ips?.value ?? 0,
      }));

      const hitsTotal = dashboardRes.hits?.total?.value ?? 0;
      const lastBucket = buckets[buckets.length - 1];
      const current = lastBucket ? lastBucket.doc_count / stepSec : 0;
      const average = hitsTotal / durationSec;

      setTotalEvents(hitsTotal);
      setCurrentEps(current);
      setAvgEps(average);
      setEpsSeries(nextEpsSeries);
      setDatasetSeries(nextDatasetSeries);
      setSourceUniqueSeries(nextSourceUniqueSeries);
      setDestinationUniqueSeries(nextDestinationUniqueSeries);
    } catch {
      setError("Failed to load Event Summary dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [destinationIpAggField, durationSec, range.fromDate, range.toDate, selectedDatasets, sourceIpAggField]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refreshKey]);

  const datasetLabel = useMemo(() => {
    if (selectedDatasets.length === 0) return "All event.dataset";
    if (selectedDatasets.length <= 2) return selectedDatasets.join(", ");
    return `${selectedDatasets.length} datasets selected`;
  }, [selectedDatasets]);

  const renderDatasetLines = (mode: "eps" | "count") => {
    return (datasetBuckets.slice(0, 6) || []).map((bucket, idx) => {
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      return mode === "eps" ? (
        <Line
          key={bucket.key}
          type="monotone"
          dataKey={bucket.key}
          name={bucket.key}
          stroke={color}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      ) : (
        <Area
          key={bucket.key}
          type="monotone"
          dataKey={bucket.key}
          name={bucket.key}
          stackId="dataset"
          stroke={color}
          fill={color}
          fillOpacity={0.22}
        />
      );
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-950 text-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-400 space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Event Summary</h1>
            <p className="text-sm text-slate-400">Elasticsearch analytics by event.dataset, source.ip, destination.ip</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <AdvancedTimeRangeSelector value={timeRange} onChange={setTimeRange} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-200 justify-start sm:min-w-62.5">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="truncate">{datasetLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#0B1120] border border-slate-700 text-slate-100">
                <DropdownMenuLabel>Filter event.dataset</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {datasetOptions.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-slate-500">No dataset found</div>
                )}
                {datasetOptions.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.key}
                    checked={selectedDatasets.includes(item.key)}
                    onCheckedChange={(checked) => {
                      setSelectedDatasets((prev) =>
                        checked ? [...prev, item.key] : prev.filter((v) => v !== item.key),
                      );
                    }}
                  >
                    {item.key}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-300 hover:text-white"
                  onClick={() => setSelectedDatasets([])}
                >
                  Clear dataset filter
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="bg-slate-900 border-slate-700 text-slate-200"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-400">Current Event Per Second</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-300">{currentEps.toFixed(2)}</div>
            <div className="text-xs text-slate-500">Based on latest interval</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-400">Average Event Per Second</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-300">{avgEps.toFixed(2)}</div>
            <div className="text-xs text-slate-500">Across selected time range</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-400">Total Events</div>
            <div className="mt-2 text-3xl font-semibold text-blue-300">{totalEvents.toLocaleString()}</div>
            <div className="text-xs text-slate-500">In current filter</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-200 font-medium">
              <Activity className="w-4 h-4 text-cyan-400" />
              Event Per Second Over Time
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={epsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                    labelFormatter={(v) => dayjs(v as string).format("YYYY-MM-DD HH:mm:ss")}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="total EPS" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                  {renderDatasetLines("eps")}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-200 font-medium">
              <Sigma className="w-4 h-4 text-fuchsia-400" />
              event.dataset Distribution
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datasetBuckets} dataKey="doc_count" nameKey="key" cx="50%" cy="50%" outerRadius={110} label>
                    {datasetBuckets.map((_, idx) => (
                      <Cell key={`dataset-pie-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                    formatter={(value) => Number(value).toLocaleString()}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 text-slate-200 font-medium">event.dataset Count Time Series</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datasetSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                  labelFormatter={(v) => dayjs(v as string).format("YYYY-MM-DD HH:mm:ss")}
                />
                <Legend />
                {renderDatasetLines("count")}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 text-slate-200 font-medium">Top source.ip (Selected Range)</div>
            <div className="mb-2 text-xs text-slate-500">Aggregation field: {sourceIpAggField}</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceBuckets} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="key" width={180} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                    formatter={(value) => Number(value).toLocaleString()}
                  />
                  <Bar dataKey="doc_count" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 text-slate-200 font-medium">Unique source.ip Over Time</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sourceUniqueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                    labelFormatter={(v) => dayjs(v as string).format("YYYY-MM-DD HH:mm:ss")}
                  />
                  <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 text-slate-200 font-medium">Top destination.ip (Selected Range)</div>
            <div className="mb-2 text-xs text-slate-500">Aggregation field: {destinationIpAggField}</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={destinationBuckets} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="key" width={180} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                    formatter={(value) => Number(value).toLocaleString()}
                  />
                  <Bar dataKey="doc_count" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 text-slate-200 font-medium">Unique destination.ip Over Time</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={destinationUniqueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                    labelFormatter={(v) => dayjs(v as string).format("YYYY-MM-DD HH:mm:ss")}
                  />
                  <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center text-slate-400 text-sm py-4 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading Event Summary...
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSummaryViewPage;
