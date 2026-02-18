"use client";

import { useState, useCallback } from "react";
import { Database } from "lucide-react";
import {
    AdvancedTimeRangeSelector,
    type TimeRangeValue,
} from "@/modules/dashboard/components/advanced-time-selector";
import { LokiQueryBar } from "../components/loki-query-bar";
import { LokiVolumeChart } from "../components/loki-volume-chart";
import { LokiOptionsBar, type LokiDisplayOptions } from "../components/loki-options-bar";
import { LokiLogTable } from "../components/loki-log-table";
import { generateMockLogs, generateMockVolumeData } from "../utils/mock-data";

const TIME_PICKER_TRANSLATIONS = {
  absoluteTitle: "Absolute Range",
  from: "From",
  to: "To",
  apply: "Apply",
  searchPlaceholder: "Search quick ranges...",
  customRange: "Custom Range",
  last5m: "Last 5 minutes",
  last15m: "Last 15 minutes",
  last30m: "Last 30 minutes",
  last1h: "Last 1 hour",
  last3h: "Last 3 hours",
  last6h: "Last 6 hours",
  last12h: "Last 12 hours",
  last24h: "Last 24 hours",
  last2d: "Last 2 days",
  last7d: "Last 7 days",
  last30d: "Last 30 days",
};

const DEFAULT_QUERY = `{namespace="pp-development", app="pp-api"}`;
const LINE_LIMIT = 1000;

const DEFAULT_OPTIONS: LokiDisplayOptions = {
  showTime: true,
  uniqueLabels: false,
  wrapLines: false,
  prettifyJson: false,
  deduplication: "none",
  sortOrder: "newest",
};

// Initial mock data
const INITIAL_LOGS = generateMockLogs(80);
const INITIAL_VOLUME = generateMockVolumeData(48);

export default function LokiView() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "1h",
    label: "Last 1 hour",
  });
  const [options, setOptions] = useState<LokiDisplayOptions>(DEFAULT_OPTIONS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [volumeData, setVolumeData] = useState(INITIAL_VOLUME);
  const [isLoading, setIsLoading] = useState(false);
  const [volumeCollapsed, setVolumeCollapsed] = useState(false);

  const handleRunQuery = useCallback(() => {
    if (!query.trim()) return;
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setLogs(generateMockLogs(80));
      setVolumeData(generateMockVolumeData(48));
      setIsLoading(false);
    }, 800);
  }, [query]);

  // Sort logs based on options
  const sortedLogs = [...logs].sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    return options.sortOrder === "newest" ? tb - ta : ta - tb;
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      {/* Top bar: title + time selector */}
      <div className="flex-none px-4 py-3 bg-slate-900/60 border-b border-slate-800 backdrop-blur-sm flex items-center gap-3">
        {/* Logo / Title */}
        <div className="flex items-center gap-2.5 pr-4 border-r border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[13px] font-bold text-white leading-none tracking-tight">
              Loki
            </h1>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Log Aggregation
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Time Range Selector */}
        <AdvancedTimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          disabled={isLoading}
          translations={TIME_PICKER_TRANSLATIONS}
        />
      </div>

      {/* Query Bar */}
      <LokiQueryBar
        query={query}
        onChange={setQuery}
        onSubmit={handleRunQuery}
        isLoading={isLoading}
      />

      {/* Volume Chart */}
      <LokiVolumeChart
        data={volumeData}
        isCollapsed={volumeCollapsed}
        onToggleCollapse={() => setVolumeCollapsed((v) => !v)}
      />

      {/* Options Bar */}
      <LokiOptionsBar
        options={options}
        onChange={setOptions}
        totalRows={sortedLogs.length}
        lineLimit={LINE_LIMIT}
        bytesProcessed="261 kB"
        coveragePercent="6.40%"
      />

      {/* Log Table */}
      <LokiLogTable
        logs={sortedLogs}
        isLoading={isLoading}
        options={options}
        totalRows={sortedLogs.length}
        lineLimit={LINE_LIMIT}
      />
    </div>
  );
}
