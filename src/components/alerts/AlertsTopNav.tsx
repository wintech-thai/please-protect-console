"use client";

import { PanelLeft, PanelLeftClose, RefreshCw, Activity } from "lucide-react";
import {
  AdvancedTimeRangeSelector,
  TimeRangeValue,
  TimePickerTranslations
} from "@/components/ui/advanced-time-selector";
import { cn } from "@/lib/utils";
import { KqlSearchInput } from "@/components/layer7/KqlSearchInput";

interface AlertsTopNavProps {
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
  luceneQuery: string;
  onQueryChange: (val: string) => void;
  onQuerySubmit: () => void;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (val: TimeRangeValue) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  fields?: any[];
  dict: any;
  timeDict: TimePickerTranslations;
}

export function AlertsTopNav({
  isSidebarOpen = true,
  toggleSidebar,
  luceneQuery,
  onQueryChange,
  onQuerySubmit,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLoading = false,
  fields = [],
  dict,
  timeDict,
}: AlertsTopNavProps) {

  if (!dict) return null;

  return (
    <div className="flex-none px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3 backdrop-blur-md z-30 relative">

      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all duration-200"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>
      )}

      <div className="flex items-center gap-3 px-3 border-r border-slate-800 mr-2 h-9 hidden lg:flex">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[13px] font-bold text-white leading-none tracking-tight">
            {dict?.title || "Event Alerts"}
          </h1>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            {dict?.subtitle || "SURICATA THREAT DETECTION"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-wrap sm:flex-nowrap items-stretch gap-2 w-full">

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] w-full sm:w-auto">
          <KqlSearchInput
            value={luceneQuery}
            onChange={onQueryChange}
            onSubmit={onQuerySubmit}
            fields={fields ? fields.map((f) => f.exp) : []}
            placeholder={dict?.searchPlaceholder || "Filter your data using KQL syntax"}
          />
        </div>

        {/* Time Selector */}
        <div className="flex-1 sm:flex-none min-w-[160px]">
          <AdvancedTimeRangeSelector
            value={timeRange}
            onChange={onTimeRangeChange}
            disabled={isLoading}
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={cn(
            "px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500/50",
            isLoading ? "opacity-80 cursor-not-allowed" : "active:scale-95 hover:shadow-blue-500/20"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">
            {isLoading ? (dict?.refreshing || "Refreshing...") : (dict?.refresh || "Refresh")}
          </span>
        </button>
      </div>

    </div>
  );
}
