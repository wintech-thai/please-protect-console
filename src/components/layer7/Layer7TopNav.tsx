"use client";

import { PanelLeft, PanelLeftClose, Search, Clock } from "lucide-react";
import { 
  AdvancedTimeRangeSelector, 
  TimeRangeValue, 
  TimePickerTranslations 
} from "@/modules/dashboard/components/advanced-time-selector";
import { cn } from "@/lib/utils";

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
}: TopNavProps) {
  return (
    <div className="flex-none px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-3 backdrop-blur-md">
      {/* Sidebar Toggle Button */}
      <button 
        onClick={toggleSidebar} 
        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all duration-200"
      >
        {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      </button>

      <div className="flex-1 flex items-stretch gap-2">
        {/* Search Input Wrapper */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-slate-200 placeholder:text-slate-600 transition-all shadow-inner"
            placeholder="Filter your data using KQL syntax"
            value={luceneQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onQuerySubmit()}
          />
        </div>

        {/* Time Selector */}
        <div className="flex-none">
          <AdvancedTimeRangeSelector 
            value={timeRange} 
            onChange={onTimeRangeChange} 
            translations={DEFAULT_TRANSLATIONS}
          />
        </div>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh} 
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95 border border-blue-500/50"
        >
          <Clock className="w-4 h-4" /> 
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
}