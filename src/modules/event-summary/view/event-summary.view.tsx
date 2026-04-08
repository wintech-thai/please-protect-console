"use client";

import { useMemo, useState } from "react";
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
import { useEventSummaryDashboard } from "@/modules/event-summary/hooks/use-event-summary";
import type { TermsBucket } from "@/modules/event-summary/api/event-summary.api";

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

const PIE_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#84cc16",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#eab308",
  "#10b981",
  "#6366f1",
];

const CHART_RESIZE_DEBOUNCE = 250;

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  color: "#e2e8f0",
};

const TOOLTIP_ITEM_STYLE = {
  color: "#e2e8f0",
};

const TOOLTIP_LABEL_STYLE = {
  color: "#cbd5e1",
};

const formatXAxis = (value: string, durationSec: number) => {
  if (durationSec <= 24 * 3600) return dayjs(value).format("HH:mm");
  return dayjs(value).format("MM-DD HH:mm");
};

const EventSummaryViewPage = () => {
  const { timeRange, setTimeRange } = useTimeRange();

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [draftSelectedDatasets, setDraftSelectedDatasets] = useState<string[]>([]);
  const [isDatasetFilterOpen, setIsDatasetFilterOpen] = useState(false);

  const range = useMemo(() => resolveTimeRange(timeRange), [timeRange]);
  const durationSec = useMemo(() => {
    const from = dayjs(range.fromDate).unix();
    const to = dayjs(range.toDate).unix();
    return Math.max(to - from, 60);
  }, [range.fromDate, range.toDate]);

  const {
    isLoading,
    isError,
    isFetching,
    datasetOptions,
    datasetBuckets,
    sourceBuckets,
    destinationBuckets,
    epsSeries,
    datasetSeries,
    sourceUniqueSeries,
    destinationUniqueSeries,
    totalEvents,
    currentEps,
    avgEps,
    sourceField,
    destinationField,
  } = useEventSummaryDashboard(
    {
      fromDate: range.fromDate,
      toDate: range.toDate,
      durationSec,
      selectedDatasets,
    },
    refreshKey,
  );

  const error = isError ? "Failed to load Event Summary dashboard" : null;

  const datasetLabel = useMemo(() => {
    if (selectedDatasets.length === 0) return "All event.dataset";
    if (selectedDatasets.length <= 2) return selectedDatasets.join(", ");
    return `${selectedDatasets.length} datasets selected`;
  }, [selectedDatasets]);

  const renderDatasetLines = (mode: "eps" | "count") => {
    return (datasetBuckets.slice(0, 6) || []).map((bucket: TermsBucket, idx: number) => {
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

            <DropdownMenu
              open={isDatasetFilterOpen}
              onOpenChange={(open) => {
                if (open) {
                  setDraftSelectedDatasets(selectedDatasets);
                  setIsDatasetFilterOpen(true);
                  return;
                }

                setSelectedDatasets(draftSelectedDatasets);
                setIsDatasetFilterOpen(false);
              }}
            >
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
                {datasetOptions.map((item: TermsBucket) => (
                  <DropdownMenuCheckboxItem
                    key={item.key}
                    checked={draftSelectedDatasets.includes(item.key)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => {
                      setDraftSelectedDatasets((prev) =>
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
                  onClick={() => setDraftSelectedDatasets([])}
                >
                  Clear dataset filter
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              className="bg-slate-900 border-slate-700 text-slate-200"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={isLoading || isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isFetching ? "animate-spin" : ""}`} />
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
              <ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_DEBOUNCE}>
                <LineChart data={epsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    labelFormatter={(v) => dayjs(v as string).format("YYYY-MM-DD HH:mm:ss")}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="total EPS" stroke="#22d3ee" strokeWidth={2.5} dot={false} isAnimationActive={false} />
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
              <ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_DEBOUNCE}>
                <PieChart>
                  <Pie
                    data={datasetBuckets}
                    dataKey="doc_count"
                    nameKey="key"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    paddingAngle={2}
                    stroke="#0b1120"
                    strokeWidth={2}
                    label
                  >
                    {datasetBuckets.map((_: TermsBucket, idx: number) => (
                      <Cell key={`dataset-pie-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
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
            <ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_DEBOUNCE}>
              <AreaChart data={datasetSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
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
            <div className="mb-2 text-xs text-slate-500">Aggregation field: {sourceField}</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_DEBOUNCE}>
                <BarChart data={sourceBuckets} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="key" width={180} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    formatter={(value) => Number(value).toLocaleString()}
                  />
                  <Bar dataKey="doc_count" fill="#34d399" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 text-slate-200 font-medium">Unique source.ip Over Time</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_DEBOUNCE}>
                <LineChart data={sourceUniqueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    labelFormatter={(v) => dayjs(v as string).format("YYYY-MM-DD HH:mm:ss")}
                  />
                  <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 text-slate-200 font-medium">Top destination.ip (Selected Range)</div>
            <div className="mb-2 text-xs text-slate-500">Aggregation field: {destinationField}</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_DEBOUNCE}>
                <BarChart data={destinationBuckets} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="key" width={180} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    formatter={(value) => Number(value).toLocaleString()}
                  />
                  <Bar dataKey="doc_count" fill="#60a5fa" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 text-slate-200 font-medium">Unique destination.ip Over Time</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" debounce={CHART_RESIZE_DEBOUNCE}>
                <LineChart data={destinationUniqueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tickFormatter={(v) => formatXAxis(String(v), durationSec)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={TOOLTIP_CONTENT_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    labelFormatter={(v) => dayjs(v as string).format("YYYY-MM-DD HH:mm:ss")}
                  />
                  <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2.5} dot={false} isAnimationActive={false} />
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
