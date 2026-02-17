"use client";

import { PanelLeft, PanelLeftClose, RefreshCw } from "lucide-react";
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue, 
  TimePickerTranslations 
} from "@/modules/dashboard/components/advanced-time-selector";
import { cn } from "@/lib/utils";
import { KqlSearchInput } from "./KqlSearchInput"; 

const DEFAULT_TRANSLATIONS: TimePickerTranslations = {
  absoluteTitle: "Absolute Range",
  from: "From",
  to: "To",
  apply: "Apply Range",
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

interface TopNavProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  luceneQuery: string;
  onQueryChange: (val: string) => void;
  onQuerySubmit: () => void;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (val: TimeRangeValue) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  availableFields?: string[]; 
}

export function Layer7TopNav({
  isSidebarOpen,
  toggleSidebar,
  luceneQuery,
  onQueryChange,
  onQuerySubmit,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLoading = false,
  availableFields = [], 
}: TopNavProps) {
  return (
    <div className="flex-none px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3 backdrop-blur-md z-30 relative">
      {/* Sidebar Toggle Button */}
      <button 
        onClick={toggleSidebar} 
        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all duration-200"
      >
        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </button>

      <div className="flex-1 flex items-stretch gap-2">
        <div className="flex-1">
          <KqlSearchInput 
            value={luceneQuery}
            onChange={onQueryChange}
            onSubmit={onQuerySubmit}
            fields={availableFields}
            placeholder="Filter your data using KQL syntax"
          />
        </div>

        {/* Time Selector */}
        <div className="flex-none hidden sm:block">
          <AdvancedTimeRangeSelector 
            value={timeRange} 
            onChange={onTimeRangeChange} 
            translations={DEFAULT_TRANSLATIONS}
            disabled={isLoading}
          />
        </div>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh} 
          disabled={isLoading}
          className={cn(
            "px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500/50",
            isLoading ? "opacity-80 cursor-not-allowed" : "active:scale-95 hover:shadow-blue-500/20"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /> 
          <span className="hidden sm:inline">{isLoading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
}